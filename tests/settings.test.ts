import { DEFAULT_SETTINGS, parseSettings } from '../src/settings';

describe('Persisted settings validation', () => {
	it.each([null, undefined, 42, 'invalid', [], {}])('defaults malformed or missing data: %s', data => {
		expect(parseSettings(data)).toEqual(DEFAULT_SETTINGS);
	});
	it('keeps valid custom settings, including false toggles', () => {
		const custom = { saveFolderTemplate: '照片', directImport: false, copyQrToClipboard: true, photoNameTemplate: '照片-{YYYY}' };
		expect(parseSettings(custom)).toEqual(custom);
	});
	it('validates each field independently', () => {
		expect(parseSettings({ saveFolderTemplate: null, photoNameTemplate: ' ', directImport: 'false', copyQrToClipboard: true })).toEqual({ ...DEFAULT_SETTINGS, copyQrToClipboard: true });
	});
	it('fills new settings for older saved data', () => {
		expect(parseSettings({ saveFolderTemplate: 'Camera', directImport: false })).toEqual({ ...DEFAULT_SETTINGS, saveFolderTemplate: 'Camera', directImport: false });
	});
	it('returns a fresh object without mutating its source or defaults', () => {
		const source = Object.freeze({ directImport: false });
		const settings = parseSettings(source); settings.directImport = true;
		expect(source.directImport).toBe(false);
		expect(parseSettings(source).directImport).toBe(false);
		expect(Object.isFrozen(DEFAULT_SETTINGS)).toBe(true);
	});
});
