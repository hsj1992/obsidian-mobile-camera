import jsQR from 'jsqr';

export interface QrPixelRequest {
	pixels: Uint8ClampedArray;
	width: number;
	height: number;
}

type QrRequest = QrPixelRequest | { bitmap: ImageBitmap };

function decodeBitmap(bitmap: ImageBitmap): string | null {
	const canvas = new OffscreenCanvas(1, 1);
	const context = canvas.getContext('2d');
	if (!context) throw new Error('No worker canvas context');
	try {
		const fit = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
		for (const scale of [1, 0.75, 0.5]) {
			canvas.width = Math.max(1, Math.floor(bitmap.width * fit * scale));
			canvas.height = Math.max(1, Math.floor(bitmap.height * fit * scale));
			context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
			const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
			const code = jsQR(pixels.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
			if (code?.data) return code.data;
		}
		return null;
	} finally {
		canvas.width = canvas.height = 0;
	}
}

const scope = globalThis as unknown as {
	onmessage: (event: MessageEvent<QrRequest>) => void;
	postMessage: (message: { result: string | null } | { error: string } | { unavailable: true }) => void;
};

scope.onmessage = ({ data }) => {
	try {
		if ('bitmap' in data) {
			if (typeof OffscreenCanvas === 'undefined') { scope.postMessage({ unavailable: true }); return; }
			scope.postMessage({ result: decodeBitmap(data.bitmap) });
		} else {
			const code = jsQR(data.pixels, data.width, data.height, { inversionAttempts: 'attemptBoth' });
	scope.postMessage({ result: code?.data || null });
		}
	} catch (error) {
		scope.postMessage({ error: error instanceof Error ? error.message : 'QR decoding failed' });
	} finally {
		if ('bitmap' in data) data.bitmap.close();
	}
};
