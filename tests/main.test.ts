import { App } from 'obsidian';
import AndroidCameraPlugin from '../src/main';
import { CameraModal } from '../src/camera-modal';
import { DEFAULT_SETTINGS } from '../src/settings';
import { MockApp, MockMarkdownView, MockPlatform, MockPlugin } from './mocks/obsidian';

const manifest = { id: 'mobile-camera-qr-plugin', name: 'Camera', version: '1.0.0', minAppVersion: '0.15.0', description: 'Camera test', isDesktopOnly: false };
function setup() {
	const app = new MockApp(); app.workspace.setActiveView(new MockMarkdownView());
	const plugin = new AndroidCameraPlugin(app as unknown as App, manifest);
	const host = plugin as unknown as MockPlugin;
	return { app, plugin, host };
}

describe('Plugin lifecycle', () => {
	beforeEach(() => { MockPlatform.isMobile = true; });
	afterEach(() => { MockPlatform.isMobile = true; jest.restoreAllMocks(); jest.useRealTimers(); });
	it('registers stable commands on mobile without requiring mediaDevices', async () => {
		const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator')!;
		Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
		try {
			const { plugin, host } = setup(); await plugin.onload();
			expect(host.commands.map(command => command.id)).toEqual(['camera-main-menu', 'camera-take-photo', 'camera-scan-qr']);
			expect(host.settingTabs).toHaveLength(1);
			plugin.onunload();
		} finally {
			Object.defineProperty(globalThis, 'navigator', original);
		}
	});
	it.each([['camera-take-photo', 0], ['camera-scan-qr', 1]] as const)('command %s launches the correct capture input', async (id, index) => {
		jest.useFakeTimers();
		const { plugin, host } = setup(); await plugin.onload();
		const open = jest.spyOn(CameraModal.prototype, 'open');
		host.commands.find(command => command.id === id)!.callback();
		const inputs = open.mock.instances[0].contentEl.querySelectorAll('input');
		const clicks = [...inputs].map(input => jest.spyOn(input, 'click').mockImplementation(() => {}));
		jest.runOnlyPendingTimers();
		expect(clicks[index]).toHaveBeenCalledTimes(1);
		expect(clicks[1 - index]).not.toHaveBeenCalled();
		plugin.onunload();
	});
	it('keeps settings available on desktop while registering no camera commands', async () => {
		MockPlatform.isMobile = false;
		const { plugin, host } = setup(); await plugin.onload();
		expect(host.commands).toHaveLength(0); expect(host.settingTabs).toHaveLength(1);
	});
	it('validates loaded data and persists actual updated settings', async () => {
		const { plugin, host } = setup();
		host.loadData.mockResolvedValue({ directImport: false, saveFolderTemplate: 42 });
		await plugin.onload();
		expect(plugin.settings).toEqual({ ...DEFAULT_SETTINGS, directImport: false });
		plugin.settings.photoNameTemplate = '照片-{YYYY}'; await plugin.saveSettings();
		expect(host.saveData).toHaveBeenCalledWith(plugin.settings);
	});
	it('ignores duplicate opens and allows a new modal after closing', async () => {
		const { plugin, host } = setup(); await plugin.onload();
		const open = jest.spyOn(CameraModal.prototype, 'open');
		host.commands[0].callback(); host.commands[0].callback();
		expect(open).toHaveBeenCalledTimes(1);
		open.mock.instances[0].close(); host.commands[0].callback();
		expect(open).toHaveBeenCalledTimes(2); plugin.onunload();
	});
	it('closes open modals on unload and cancels pending direct launches', async () => {
		jest.useFakeTimers();
		const { plugin, host } = setup(); await plugin.onload();
		const click = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
		const close = jest.spyOn(CameraModal.prototype, 'close');
		host.commands[1].callback(); plugin.onunload(); jest.runOnlyPendingTimers();
		expect(close).toHaveBeenCalledTimes(1); expect(click).not.toHaveBeenCalled();
	});
});
