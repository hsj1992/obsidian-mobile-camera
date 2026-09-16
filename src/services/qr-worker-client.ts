import source from '../workers/qr-worker?worker';
import { throwIfAborted } from './scan-control';

export class WorkerUnavailableError extends Error {}

/** One worker per scan, reused for each scale and disposed in the scan's finally block. */
export class QrWorkerClient {
	private disposed = false;
	private constructor(private worker: Worker, private url: string) {}

	static create(): QrWorkerClient | null {
		if (typeof Worker === 'undefined') return null;
		let url: string | undefined;
		try {
			url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
			return new QrWorkerClient(new Worker(url), url);
		} catch {
			if (url) URL.revokeObjectURL(url);
			return null;
		}
	}

	decode(image: ImageData, signal?: AbortSignal): Promise<string | null> {
		return this.request({ pixels: image.data, width: image.width, height: image.height }, [image.data.buffer], signal);
	}

	decodeBitmap(bitmap: ImageBitmap, signal?: AbortSignal): Promise<string | null> {
		return this.request({ bitmap }, [bitmap], signal, 15000);
	}

	private request(message: unknown, transfer: Transferable[], signal?: AbortSignal, timeout = 5000): Promise<string | null> {
		throwIfAborted(signal);
		if (this.disposed) return Promise.reject(new WorkerUnavailableError('QR worker is closed'));
		return new Promise((resolve, reject) => {
			const cleanup = () => {
				window.clearTimeout(timer);
				signal?.removeEventListener('abort', abort);
				this.worker.onmessage = null;
				this.worker.onerror = null;
				this.worker.onmessageerror = null;
			};
			const fail = (error: Error) => { cleanup(); this.close(); reject(error); };
			const abort = () => fail(new DOMException('QR scan cancelled', 'AbortError'));
			const timer = window.setTimeout(() => fail(new Error('QR decoding timed out. Try a clearer photo.')), timeout);
			signal?.addEventListener('abort', abort, { once: true });
			this.worker.onmessage = ({ data }: MessageEvent<unknown>) => {
				if (!data || typeof data !== 'object') { fail(new WorkerUnavailableError('Invalid worker response')); return; }
				if ('result' in data && (data.result === null || typeof data.result === 'string')) {
					cleanup(); resolve(data.result);
				} else if ('error' in data && typeof data.error === 'string') {
					fail(new Error(data.error));
				} else {
					fail(new WorkerUnavailableError('Invalid worker response'));
				}
			};
			this.worker.onerror = (event) => {
				event.preventDefault();
				fail(new WorkerUnavailableError('Background QR decoding unavailable'));
			};
			this.worker.onmessageerror = () => fail(new WorkerUnavailableError('Cannot read worker response'));
			try {
				this.worker.postMessage(message, transfer);
			} catch {
				fail(new WorkerUnavailableError('Cannot send image to worker'));
			}
		});
	}

	close() {
		if (this.disposed) return;
		this.disposed = true;
		this.worker.terminate();
		URL.revokeObjectURL(this.url);
	}
}
