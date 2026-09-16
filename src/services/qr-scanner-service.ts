import { QrWorkerClient, WorkerUnavailableError } from './qr-worker-client';
import { createScanBitmap, throwIfAborted, waitForScan } from './scan-control';

interface BarcodeDetectorConstructor {
	new(options: { formats: string[] }): {
		detect(image: HTMLImageElement): Promise<Array<{ rawValue: string }>>;
	};
}

export class QrScannerService {
	async scan(file: File, signal?: AbortSignal): Promise<string | null> {
		throwIfAborted(signal);
		const image = await this.loadImageFromFile(file, signal);
		try {
			const native = await this.tryBarcodeDetector(image, signal);
			throwIfAborted(signal);
			return native || await this.decodeWithJsqr(image, signal);
		} finally {
			image.src = '';
		}
	}

	private async tryBarcodeDetector(image: HTMLImageElement, signal?: AbortSignal): Promise<string | null> {
		const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
		if (!Detector) return null;
		try {
			const detector = new Detector({ formats: ['qr_code'] });
			const result = await waitForScan(detector.detect(image), signal, 3000);
			return result?.[0]?.rawValue ?? null;
		} catch {
			throwIfAborted(signal);
			return null;
		}
	}

	private async decodeWithJsqr(image: HTMLImageElement, signal?: AbortSignal): Promise<string | null> {
		let worker = QrWorkerClient.create();
		try {
			if (worker && typeof createImageBitmap === 'function' && typeof OffscreenCanvas !== 'undefined') {
				let bitmap: ImageBitmap | undefined;
				try { bitmap = await createScanBitmap(image, signal); } catch { throwIfAborted(signal); }
				if (bitmap) {
					try { return await worker.decodeBitmap(bitmap, signal); } catch (error) {
						if (!(error instanceof WorkerUnavailableError)) throw error;
						worker.close(); worker = null;
					} finally { bitmap.close(); }
				}
			}
			return await this.decodeOnCanvas(image, worker, signal);
		} finally { worker?.close(); }
	}

	private async decodeOnCanvas(image: HTMLImageElement, worker: QrWorkerClient | null, signal?: AbortSignal): Promise<string | null> {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('No canvas context');
		try {
			for (const scale of [1, 0.75, 0.5]) {
				throwIfAborted(signal);
				const draw = (maxDimension: number) => {
					const fit = Math.min(1, maxDimension / Math.max(image.width, image.height));
					canvas.width = Math.max(1, Math.floor(image.width * fit * scale));
					canvas.height = Math.max(1, Math.floor(image.height * fit * scale));
					ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
				};
				if (worker) {
					draw(1000);
					try {
						const result = await worker.decode(ctx.getImageData(0, 0, canvas.width, canvas.height), signal);
						if (result) return result;
						continue;
					} catch (error) {
						if (!(error instanceof WorkerUnavailableError)) throw error;
						worker.close(); worker = null;
					}
				}
				// Blocking-worker WebViews retain a lower-resolution compatibility path.
				await waitForScan(new Promise<void>((resolve) => window.setTimeout(resolve, 0)), signal, 1000);
				const { default: jsQR } = await import('jsqr');
				throwIfAborted(signal);
				draw(600);
				// Re-read pixels: any buffer previously transferred to a worker is detached.
				const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const result = jsQR(pixels.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
				if (result?.data) return result.data;
			}
			return null;
		} finally {
			worker?.close();
			canvas.width = canvas.height = 0;
		}
	}

	private loadImageFromFile(file: File, signal?: AbortSignal): Promise<HTMLImageElement> {
		throwIfAborted(signal);
		return new Promise((resolve, reject) => {
			const url = URL.createObjectURL(file);
			const img = new Image();
			const cleanup = () => {
				window.clearTimeout(timer);
				signal?.removeEventListener('abort', abort);
				img.onload = img.onerror = null;
				URL.revokeObjectURL(url);
			};
			const abort = () => { cleanup(); img.src = ''; reject(new DOMException('QR scan cancelled', 'AbortError')); };
			const timer = window.setTimeout(() => { cleanup(); img.src = ''; reject(new Error('Image load timed out')); }, 15000);
			signal?.addEventListener('abort', abort, { once: true });
			img.onload = () => { cleanup(); resolve(img); };
			img.onerror = () => { cleanup(); reject(new Error('Image load error')); };
			img.src = url;
		});
	}
}
