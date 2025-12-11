import { DEFAULT_SETTINGS, CameraPluginSettings } from '../src/settings';

describe('Settings', () => {
	describe('DEFAULT_SETTINGS', () => {
		it('should have correct default values', () => {
			expect(DEFAULT_SETTINGS.saveFolderTemplate).toBe('{notepath}/image');
			expect(DEFAULT_SETTINGS.directImport).toBe(true);
			expect(DEFAULT_SETTINGS.copyQrToClipboard).toBe(false);
			expect(DEFAULT_SETTINGS.photoNameTemplate).toBe('{YYYY}{MM}{DD}-{HH}{mm}{ss}{SSS}-{random}');
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
				directImport: false,
				copyQrToClipboard: true,
				photoNameTemplate: 'photo-{YYYY}{MM}{DD}'
			};

			expect(settings.saveFolderTemplate).toBe('custom/path');
			expect(settings.directImport).toBe(false);
			expect(settings.copyQrToClipboard).toBe(true);
			expect(settings.photoNameTemplate).toBe('photo-{YYYY}{MM}{DD}');
		});

		it('should work with default settings', () => {
			const settings: CameraPluginSettings = { ...DEFAULT_SETTINGS };
			expect(settings).toEqual(DEFAULT_SETTINGS);
		});
	});
});
