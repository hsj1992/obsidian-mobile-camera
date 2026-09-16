import { QrWorkerClient, WorkerUnavailableError } from '../src/services/qr-worker-client';

class TestWorker {
	static instances: TestWorker[] = [];
	onmessage: ((event: MessageEvent) => void) | null = null;
	onerror: ((event: ErrorEvent) => void) | null = null;
	onmessageerror: (() => void) | null = null;
	postMessage = jest.fn();
	terminate = jest.fn();
	constructor() { TestWorker.instances.push(this); }
}

const originalWorker = globalThis.Worker;
const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
const pixels = () => ({ data: new Uint8ClampedArray(16), width: 2, height: 2 } as ImageData);

describe('QR worker transport', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		TestWorker.instances = [];
		globalThis.Worker = TestWorker as unknown as typeof Worker;
		URL.createObjectURL = jest.fn(() => 'blob:qr-worker');
		URL.revokeObjectURL = jest.fn();
	});
	afterEach(() => {
		globalThis.Worker = originalWorker;
		URL.createObjectURL = originalCreate;
		URL.revokeObjectURL = originalRevoke;
		jest.useRealTimers();
	});
	it('transfers the pixel buffer and reuses the worker across scales', async () => {
		const client = QrWorkerClient.create()!;
		const worker = TestWorker.instances[0];
		const image = pixels();
		const first = client.decode(image);
		expect(worker.postMessage).toHaveBeenCalledWith({ pixels: image.data, width: 2, height: 2 }, [image.data.buffer]);
		worker.onmessage!({ data: { result: null } } as MessageEvent);
		await expect(first).resolves.toBeNull();
		const second = client.decode(pixels());
		worker.onmessage!({ data: { result: 'QR text' } } as MessageEvent);
		await expect(second).resolves.toBe('QR text');
		expect(TestWorker.instances).toHaveLength(1);
		client.close(); client.close();
		expect(worker.terminate).toHaveBeenCalledTimes(1);
		expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
		expect(jest.getTimerCount()).toBe(0);
	});
	it('terminates immediately on cancellation and rejects without waiting for a reply', async () => {
		const client = QrWorkerClient.create()!;
		const controller = new AbortController();
		const pending = client.decode(pixels(), controller.signal);
		const rejection = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
		controller.abort();
		await rejection;
		expect(TestWorker.instances[0].terminate).toHaveBeenCalledTimes(1);
		expect(TestWorker.instances[0].onmessage).toBeNull();
		expect(jest.getTimerCount()).toBe(0);
	});
	it('transfers bitmap ownership for offscreen resizing and decoding', async () => {
		const client = QrWorkerClient.create()!;
		const bitmap = { width: 2400, height: 1800, close: jest.fn() } as unknown as ImageBitmap;
		const pending = client.decodeBitmap(bitmap);
		const worker = TestWorker.instances[0];
		expect(worker.postMessage).toHaveBeenCalledWith({ bitmap }, [bitmap]);
		worker.onmessage!({ data: { result: 'QR bitmap' } } as MessageEvent);
		await expect(pending).resolves.toBe('QR bitmap');
		client.close();
	});
	it('terminates a hung worker on timeout', async () => {
		const client = QrWorkerClient.create()!;
		const pending = client.decode(pixels());
		const rejection = expect(pending).rejects.toThrow('timed out');
		jest.advanceTimersByTime(5000);
		await rejection;
		expect(TestWorker.instances[0].terminate).toHaveBeenCalledTimes(1);
	});
	it('reports a worker startup failure so the scanner can fall back', async () => {
		const client = QrWorkerClient.create()!;
		const pending = client.decode(pixels());
		const rejection = expect(pending).rejects.toBeInstanceOf(WorkerUnavailableError);
		TestWorker.instances[0].onerror!(new ErrorEvent('error', { cancelable: true }));
		await rejection;
		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:qr-worker');
	});
	it('revokes its URL if the environment blocks worker construction', () => {
		globalThis.Worker = class { constructor() { throw new Error('Blocked'); } } as unknown as typeof Worker;
		expect(QrWorkerClient.create()).toBeNull();
		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:qr-worker');
	});
	it('does not post an already-cancelled request', () => {
		const client = QrWorkerClient.create()!;
		const controller = new AbortController(); controller.abort();
		expect(() => client.decode(pixels(), controller.signal)).toThrow('cancelled');
		expect(TestWorker.instances[0].postMessage).not.toHaveBeenCalled();
		client.close();
	});
});
