import { App } from 'obsidian';
import { CameraModal } from '../src/camera-modal';
import { copyQrText } from '../src/services/clipboard-service';
import { QrScannerService } from '../src/services/qr-scanner-service';
import { DEFAULT_SETTINGS } from '../src/settings';
import { MockApp, MockMarkdownView, MockNotice } from './mocks/obsidian';

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
function clipboard(value: unknown) {
	Object.defineProperty(navigator, 'clipboard', { configurable: true, value });
}
function setup(enabled = true) {
	const app = new MockApp(), view = new MockMarkdownView();
	app.workspace.setActiveView(view);
	const modal = new CameraModal(app as unknown as App, { ...DEFAULT_SETTINGS, copyQrToClipboard: enabled });
	modal.open();
	const input = modal.contentEl.querySelectorAll('input')[1];
	Object.defineProperty(input, 'files', { value: [new File(['QR'], 'qr.png')] });
	jest.spyOn(QrScannerService.prototype, 'scan').mockResolvedValue('QR payload');
	const run = () => (modal as unknown as { handleQrSelected(event: Event): Promise<void> }).handleQrSelected({ target: input } as unknown as Event);
	return { modal, view, run };
}

describe('QR clipboard behavior', () => {
	beforeEach(() => { MockNotice.messages = []; });
	afterEach(() => {
		jest.restoreAllMocks(); jest.useRealTimers();
		if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
		else delete (navigator as unknown as { clipboard?: unknown }).clipboard;
	});
	it('keeps inserted text and shows one accurate notice when permission is denied', async () => {
		clipboard({ writeText: jest.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')) });
		const { view, run } = setup();
		await run();
		expect(view.editor.getContent()).toBe('QR payload\n');
		expect(MockNotice.messages).toEqual(['QR text inserted, but could not be copied to the clipboard']);
	});
	it('handles missing clipboard APIs without losing text', async () => {
		clipboard(undefined);
		const { view, run } = setup(); await run();
		expect(view.editor.getContent()).toBe('QR payload\n');
		expect(MockNotice.messages).toHaveLength(1);
		expect(MockNotice.messages[0]).toContain('could not be copied');
	});
	it('confirms a successful copy with one notice', async () => {
		const writeText = jest.fn().mockResolvedValue(undefined); clipboard({ writeText });
		const { run } = setup(); await run();
		expect(writeText).toHaveBeenCalledWith('QR payload');
		expect(MockNotice.messages).toEqual(['QR text inserted and copied to clipboard']);
	});
	it('does not access the clipboard when automatic copy is off', async () => {
		const writeText = jest.fn(); clipboard({ writeText });
		const { run } = setup(false); await run();
		expect(writeText).not.toHaveBeenCalled();
		expect(MockNotice.messages).toEqual(['QR code recognized']);
	});
	it('times out an unresponsive clipboard without leaving the modal stuck', async () => {
		jest.useFakeTimers(); clipboard({ writeText: jest.fn(() => new Promise(() => {})) });
		const { modal, view, run } = setup();
		const pending = run(); await Promise.resolve();
		await jest.advanceTimersByTimeAsync(2000); await pending;
		expect(view.editor.getContent()).toBe('QR payload\n');
		expect(MockNotice.messages).toHaveLength(1);
		expect(modal.contentEl.children).toHaveLength(0);
		expect(jest.getTimerCount()).toBe(0);
	});
	it('stops waiting and suppresses late notices when closed during copying', async () => {
		let finish!: () => void;
		clipboard({ writeText: jest.fn(() => new Promise<void>(resolve => finish = resolve)) });
		const { modal, view, run } = setup();
		const pending = run(); await Promise.resolve();
		modal.close(); await pending; finish(); await Promise.resolve();
		expect(view.editor.getContent()).toBe('QR payload\n');
		expect(MockNotice.messages).toEqual([]);
	});
	it('does not copy when the note cannot be updated', async () => {
		const writeText = jest.fn(); clipboard({ writeText });
		const { view, run } = setup(); view.editor.replaceSelection('Changed');
		jest.spyOn(console, 'error').mockImplementation(() => {});
		await run();
		expect(writeText).not.toHaveBeenCalled();
		expect(view.editor.getContent()).toBe('Changed');
	});
	it('does not start an already-cancelled clipboard operation', async () => {
		const writeText = jest.fn(); clipboard({ writeText });
		const controller = new AbortController(); controller.abort();
		await expect(copyQrText('QR payload', controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
		expect(writeText).not.toHaveBeenCalled();
	});
});
