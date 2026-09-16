import jsQR from 'jsqr';
import { QrScannerService } from '../src/services/qr-scanner-service';
import { QrWorkerClient, WorkerUnavailableError } from '../src/services/qr-worker-client';
import { createScanBitmap } from '../src/services/scan-control';

jest.mock('jsqr', () => ({ __esModule: true, default: jest.fn(() => null) }));

const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
const originalDetector = window.BarcodeDetector;
const originalBitmap = globalThis.createImageBitmap;
const originalOffscreen = globalThis.OffscreenCanvas;
const scan = () => new QrScannerService().scan(new File(['image'], 'qr.png', { type: 'image/png' }));

describe('QR scanner production routing', () => {
	let image: HTMLImageElement;
	let reads: jest.Mock;
	beforeEach(() => {
		image = { width: 2000, height: 1000, onload: null, onerror: null } as unknown as HTMLImageElement;
		Object.defineProperty(image, 'src', { set(value) { if (value) queueMicrotask(() => image.onload?.(new Event('load'))); } });
		jest.spyOn(globalThis, 'Image').mockImplementation(() => image);
		URL.createObjectURL = jest.fn(() => 'blob:image'); URL.revokeObjectURL = jest.fn();
		window.BarcodeDetector = undefined;
		globalThis.createImageBitmap = undefined;
		globalThis.OffscreenCanvas = undefined;
		reads = jest.fn((_x, _y, width, height) => ({ data: new Uint8ClampedArray(width * height * 4), width, height }));
		jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({ drawImage: jest.fn(), getImageData: reads } as unknown as CanvasRenderingContext2D));
		jest.mocked(jsQR).mockClear();
	});
	afterEach(() => {
		jest.restoreAllMocks();
		URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke;
		window.BarcodeDetector = originalDetector;
		globalThis.createImageBitmap = originalBitmap;
		globalThis.OffscreenCanvas = originalOffscreen;
	});
	it('uses native detection without creating a worker when a QR is found', async () => {
		window.BarcodeDetector = class { detect = async () => [{ rawValue: 'native QR' }]; };
		const create = jest.spyOn(QrWorkerClient, 'create');
		await expect(scan()).resolves.toBe('native QR');
		expect(create).not.toHaveBeenCalled();
		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:image');
	});
	it('tries bounded pixel scales on a worker and disposes it', async () => {
		const decode = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce('worker QR');
		const close = jest.fn();
		jest.spyOn(QrWorkerClient, 'create').mockReturnValue({ decode, close } as unknown as QrWorkerClient);
		await expect(scan()).resolves.toBe('worker QR');
		expect(decode.mock.calls.map(([pixels]) => [pixels.width, pixels.height])).toEqual([[1000, 500], [750, 375]]);
		expect(jsQR).not.toHaveBeenCalled();
		expect(close).toHaveBeenCalled();
	});
	it('sends a bitmap without main-thread canvas reads on capable devices', async () => {
		const bitmap = { close: jest.fn() } as unknown as ImageBitmap;
		globalThis.createImageBitmap = jest.fn().mockResolvedValue(bitmap);
		globalThis.OffscreenCanvas = class {} as typeof OffscreenCanvas;
		const decodeBitmap = jest.fn().mockResolvedValue('bitmap QR');
		const close = jest.fn();
		jest.spyOn(QrWorkerClient, 'create').mockReturnValue({ decodeBitmap, close } as unknown as QrWorkerClient);
		await expect(scan()).resolves.toBe('bitmap QR');
		expect(decodeBitmap).toHaveBeenCalledWith(bitmap, undefined);
		expect(reads).not.toHaveBeenCalled();
		expect(bitmap.close).toHaveBeenCalled();
		expect(close).toHaveBeenCalled();
	});
	it('re-reads lower-resolution pixels when the worker cannot start', async () => {
		const decode = jest.fn().mockRejectedValue(new WorkerUnavailableError('Blocked'));
		jest.spyOn(QrWorkerClient, 'create').mockReturnValue({ decode, close: jest.fn() } as unknown as QrWorkerClient);
		await expect(scan()).resolves.toBeNull();
		expect(decode).toHaveBeenCalledTimes(1);
		expect(jest.mocked(jsQR).mock.calls.map(([, width, height]) => [width, height])).toEqual([[600, 300], [450, 225], [300, 150]]);
		expect(reads).toHaveBeenCalledTimes(4);
	});
	it('does not run blocking fallback after a worker timeout', async () => {
		jest.spyOn(QrWorkerClient, 'create').mockReturnValue({ decode: jest.fn().mockRejectedValue(new Error('timed out')), close: jest.fn() } as unknown as QrWorkerClient);
		await expect(scan()).rejects.toThrow('timed out');
		expect(jsQR).not.toHaveBeenCalled();
	});
	it('closes a bitmap that resolves after its scan was cancelled', async () => {
		let complete!: (bitmap: ImageBitmap) => void;
		globalThis.createImageBitmap = jest.fn(() => new Promise<ImageBitmap>(resolve => complete = resolve));
		const controller = new AbortController();
		const pending = createScanBitmap(image, controller.signal);
		controller.abort();
		await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
		const bitmap = { close: jest.fn() } as unknown as ImageBitmap;
		complete(bitmap);
		await Promise.resolve();
		expect(bitmap.close).toHaveBeenCalled();
	});
});
