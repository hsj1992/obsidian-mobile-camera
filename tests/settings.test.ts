import { DEFAULT_SETTINGS, CameraPluginSettings } from '../src/settings';

describe('Settings', () => {
	describe('DEFAULT_SETTINGS', () => {
		it('should have correct default values', () => {
			expect(DEFAULT_SETTINGS.saveFolderTemplate).toBe('{notepath}/image');
			expect(DEFAULT_SETTINGS.directImport).toBe(true);
		});

		it('should be immutable', () => {
			expect(() => {
				(DEFAULT_SETTINGS as any).directImport = false;
			}).toThrow();
			expect(DEFAULT_SETTINGS.directImport).toBe(true);
		});
	});

	describe('CameraPluginSettings interface', () => {
		it('should accept valid settings', () => {
			const settings: CameraPluginSettings = {
				saveFolderTemplate: 'custom/path',
				directImport: false
			};

			expect(settings.saveFolderTemplate).toBe('custom/path');
			expect(settings.directImport).toBe(false);
		});

		it('should work with default settings', () => {
			const settings: CameraPluginSettings = { ...DEFAULT_SETTINGS };
			expect(settings).toEqual(DEFAULT_SETTINGS);
		});
	});
});
