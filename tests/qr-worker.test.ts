import '../src/workers/qr-worker';

// A fixed, independently generated QR matrix encoding "worker-qr-test".
const grid = [
	'111111101100001111111', '100000101011101000001', '101110100010001011101',
	'101110101001101011101', '101110100111001011101', '100000100000001000001',
	'111111101010101111111', '000000001011000000000', '101101110101001001011',
	'111111001001000011001', '100100111010011100111', '100010010101100111001',
	'111110111100111011010', '000000001110101011010', '111111101101011010100',
	'100000101111100111101', '101110100010000001110', '101110101110101100110',
	'101110101011110001000', '100000100001011100001', '111111101001001110100'
];

function image(inverted = false) {
	const width = 232;
	const pixels = new Uint8ClampedArray(width * width * 4);
	for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
		const black = grid[Math.floor(y / 8) - 4]?.[Math.floor(x / 8) - 4] === '1';
		const color = black !== inverted ? 0 : 255;
		const offset = (y * width + x) * 4;
		pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = color;
		pixels[offset + 3] = 255;
	}
	return { pixels, width, height: width };
}

describe('Production worker decoder', () => {
	it('decodes and releases a transferred bitmap and offscreen canvas', () => {
		const original = globalThis.OffscreenCanvas;
		let canvas: { width: number; height: number };
		const fixture = image();
		globalThis.OffscreenCanvas = class {
			width = 1; height = 1;
			constructor() { canvas = this; }
			getContext() { return { drawImage() {}, getImageData: () => ({ data: fixture.pixels }) }; }
		} as unknown as typeof OffscreenCanvas;
		const bitmap = { width: 232, height: 232, close: jest.fn() };
		const send = jest.spyOn(globalThis, 'postMessage').mockImplementation(() => {});
		try {
			globalThis.onmessage!(new MessageEvent('message', { data: { bitmap } }));
			expect(send).toHaveBeenCalledWith({ result: 'worker-qr-test' });
			expect(bitmap.close).toHaveBeenCalledTimes(1);
			expect(canvas!.width).toBe(0);
			expect(canvas!.height).toBe(0);
		} finally { send.mockRestore(); globalThis.OffscreenCanvas = original; }
	});
	it.each([false, true])('decodes the reference QR image (inverted=%s)', (inverted) => {
		const send = jest.spyOn(globalThis, 'postMessage').mockImplementation(() => {});
		globalThis.onmessage!(new MessageEvent('message', { data: image(inverted) }));
		expect(send).toHaveBeenCalledWith({ result: 'worker-qr-test' });
		send.mockRestore();
	});
	it('returns null for a blank image', () => {
		const data = image(); data.pixels.fill(255);
		const send = jest.spyOn(globalThis, 'postMessage').mockImplementation(() => {});
		globalThis.onmessage!(new MessageEvent('message', { data }));
		expect(send).toHaveBeenCalledWith({ result: null });
		send.mockRestore();
	});
});
