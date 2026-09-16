export function throwIfAborted(signal?: AbortSignal) {
	if (signal?.aborted) throw new DOMException('QR scan cancelled', 'AbortError');
}

export async function createScanBitmap(image: HTMLImageElement, signal?: AbortSignal): Promise<ImageBitmap> {
	throwIfAborted(signal);
	let active = true;
	const pending = createImageBitmap(image).then((bitmap) => {
		if (!active) { bitmap.close(); throw new DOMException('QR scan cancelled', 'AbortError'); }
		return bitmap;
	});
	try {
		return await waitForScan(pending, signal, 3000);
	} finally {
		active = false;
	}
}

/** Native detection cannot be terminated, but its late results can be ignored. */
export function waitForScan<T>(promise: Promise<T>, signal: AbortSignal | undefined, timeout: number): Promise<T> {
	throwIfAborted(signal);
	return new Promise((resolve, reject) => {
		const cleanup = () => {
			window.clearTimeout(timer);
			signal?.removeEventListener('abort', abort);
		};
		const abort = () => { cleanup(); reject(new DOMException('QR scan cancelled', 'AbortError')); };
		const timer = window.setTimeout(() => { cleanup(); reject(new Error('QR detection timed out')); }, timeout);
		signal?.addEventListener('abort', abort, { once: true });
		promise.then((value) => { cleanup(); resolve(value); }, (error: unknown) => {
			cleanup();
			reject(error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'QR operation failed'));
		});
	});
}
