import { App } from 'obsidian';
import { CameraModal } from '../src/camera-modal';
import { DEFAULT_SETTINGS } from '../src/settings';
import { MockApp, MockMarkdownView, MockNotice } from './mocks/obsidian';

describe('Camera modal UI', () => {
	let app: MockApp;
	beforeEach(() => { app = new MockApp(); MockNotice.messages = []; });
	afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });
	const modal = (action: 'photo' | 'qr' | null = null, dismiss = jest.fn()) => new CameraModal(app as unknown as App, { ...DEFAULT_SETTINGS }, action, dismiss);

	it('rejects opening without a Markdown note', () => {
		app.workspace.setActiveView({ file: { path: 'canvas.canvas' } });
		const dismiss = jest.fn(), camera = modal(null, dismiss); camera.open();
		expect(MockNotice.messages).toEqual(['Open a note first']);
		expect(camera.contentEl.children).toHaveLength(0);
		expect(dismiss).toHaveBeenCalledTimes(1);
	});
	it('shows the three actions and configures single-image rear-camera inputs', () => {
		app.workspace.setActiveView(new MockMarkdownView());
		const camera = modal(); camera.open();
		expect([...camera.contentEl.querySelectorAll('button')].map(button => button.textContent)).toEqual(['Take Photo', 'Capture QR Code', 'Cancel']);
		for (const input of camera.contentEl.querySelectorAll('input')) {
			expect(input.accept).toBe('image/*'); expect(input.capture).toBe('environment');
			expect(input.multiple).toBe(false);
		}
		camera.close();
	});
	it.each([[0, 0], [1, 1]])('action button %s launches its corresponding input', (button, input) => {
		app.workspace.setActiveView(new MockMarkdownView());
		const camera = modal(); camera.open();
		const click = jest.spyOn(camera.contentEl.querySelectorAll('input')[input], 'click').mockImplementation(() => {});
		camera.contentEl.querySelectorAll('button')[button].click();
		expect(click).toHaveBeenCalledTimes(1); camera.close();
	});
	it.each(['photo', 'qr'] as const)('launches direct %s capture and closes on native cancellation', action => {
		jest.useFakeTimers(); app.workspace.setActiveView(new MockMarkdownView());
		const dismiss = jest.fn(), camera = modal(action, dismiss); camera.open();
		const input = camera.contentEl.querySelectorAll('input')[action === 'photo' ? 0 : 1];
		const click = jest.spyOn(input, 'click').mockImplementation(() => {});
		jest.runOnlyPendingTimers(); expect(click).toHaveBeenCalledTimes(1);
		input.dispatchEvent(new Event('cancel'));
		expect(dismiss).toHaveBeenCalledTimes(1);
	});
	it('clears a pending launch when closed before the timer fires', () => {
		jest.useFakeTimers(); app.workspace.setActiveView(new MockMarkdownView());
		const camera = modal('photo'); camera.open();
		const click = jest.spyOn(camera.contentEl.querySelector('input')!, 'click').mockImplementation(() => {});
		camera.close(); jest.runOnlyPendingTimers();
		expect(click).not.toHaveBeenCalled();
	});
	it('keeps the menu available when native capture is cancelled', () => {
		app.workspace.setActiveView(new MockMarkdownView());
		const dismiss = jest.fn(), camera = modal(null, dismiss); camera.open();
		camera.contentEl.querySelector('input')!.dispatchEvent(new Event('cancel'));
		expect(dismiss).not.toHaveBeenCalled();
		camera.contentEl.querySelectorAll('button')[2].click();
		expect(dismiss).toHaveBeenCalledTimes(1);
	});
});
