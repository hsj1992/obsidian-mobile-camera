import jsQR from 'jsqr';

export class QrScannerService {
	async scan(file: File): Promise<string | null> {
		const image = await this.loadImageFromFile(file);
		return await this.tryBarcodeDetector(image) ?? await this.decodeWithJsqr(image);
	}

	private async tryBarcodeDetector(image: HTMLImageElement): Promise<string | null> {
		const Detector = (window as any).BarcodeDetector;
		if (!Detector) return null;
		try {
			const detector = new Detector({ formats: ['qr_code'] });
			const result = await detector.detect(image);
			return result?.[0]?.rawValue ?? null;
		} catch {
			return null;
		}
	}

	private async decodeWithJsqr(image: HTMLImageElement): Promise<string | null> {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('No canvas context');

		const maxDim = 1000;
		const scales = [1, 0.75, 0.5];

		for (const scale of scales) {
			const fit = Math.min(1, maxDim / Math.max(image.width, image.height));
			const s = scale * fit;
			const w = Math.max(1, Math.floor(image.width * s));
			const h = Math.max(1, Math.floor(image.height * s));
			canvas.width = w;
			canvas.height = h;
			ctx.drawImage(image, 0, 0, w, h);
			const imgData = ctx.getImageData(0, 0, w, h);

			const result = jsQR(imgData.data, imgData.width, imgData.height, {
				inversionAttempts: 'attemptBoth'
			});
			if (result?.data) return result.data;
		}
		return null;
	}

	private loadImageFromFile(file: File): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const url = URL.createObjectURL(file);
			const img = new Image();
			img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
			img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load error')); };
			img.src = url;
		});
	}
}
