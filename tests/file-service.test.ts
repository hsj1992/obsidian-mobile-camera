import { App, TFile } from 'obsidian';
import { FileService } from '../src/services/file-service';
import { DEFAULT_SETTINGS } from '../src/settings';
import { MockApp } from './mocks/obsidian';

describe('FileService', () => {
	let app: MockApp;
	beforeEach(() => { app = new MockApp(); });
	afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });
	const service = (template = DEFAULT_SETTINGS.saveFolderTemplate) => new FileService(app as unknown as App, { ...DEFAULT_SETTINGS, saveFolderTemplate: template });

	it.each([
		['{notepath}/image', 'daily/2024', 'daily/2024/image'],
		['{notepath}/image', '', 'Camera'],
		['Camera', 'daily', 'Camera'],
		['', 'daily', 'daily/image'],
		['{notepath}/attachments/images', 'projects/work', 'projects/work/attachments/images'],
		['../escape', 'daily', 'Camera'],
		['{notepath}/../../../escape', 'daily', 'Camera'],
		['/images', 'daily', 'images'],
		['{notepath}\\attachments//images', 'daily', 'daily/attachments/images']
	])('resolves template %s for directory %s', (template, directory, expected) => {
		expect(service(template).resolveSaveFolder({ parent: { path: directory } } as TFile)).toBe(expected);
	});

	it('creates nested folders and does not recreate them', async () => {
		const create = jest.spyOn(app.vault, 'createFolder');
		await service().ensureFolder('one/two/three');
		expect(create.mock.calls.map(([path]) => path)).toEqual(['one', 'one/two', 'one/two/three']);
		create.mockClear(); await service().ensureFolder('one/two/three');
		expect(create).not.toHaveBeenCalled();
	});
	it.each(['', '   ', '../escape', 'folder/../../../escape'])('rejects invalid folder %s before writing', async path => {
		const create = jest.spyOn(app.vault, 'createFolder');
		await expect(service().ensureFolder(path)).rejects.toThrow('Invalid folder path');
		expect(create).not.toHaveBeenCalled();
	});
	it('propagates folder creation errors', async () => {
		jest.spyOn(app.vault, 'createFolder').mockRejectedValue(new Error('Storage full'));
		await expect(service().ensureFolder('photos')).rejects.toThrow('Storage full');
	});
	it('normalizes separators in folder creation', async () => {
		const create = jest.spyOn(app.vault, 'createFolder');
		await service().ensureFolder('one\\two//three');
		expect(create.mock.calls.map(([path]) => path)).toEqual(['one', 'one/two', 'one/two/three']);
	});
	it('finds the first free filename among existing vault files', async () => {
		const files = service();
		expect(await files.getUniqueFileName('photos', '会议', 'png')).toBe('photos/会议.png');
		for (const path of ['photos/会议.png', 'photos/会议-1.png', 'photos/会议-2.png']) app.vault.adapter.addFile(path);
		expect(await files.getUniqueFileName('photos', '会议', 'png')).toBe('photos/会议-3.png');
	});
	it('propagates filename lookup failures', async () => {
		jest.spyOn(app.vault.adapter, 'exists').mockRejectedValue(new Error('Read failed'));
		await expect(service().getUniqueFileName('photos', 'photo', 'jpg')).rejects.toThrow('Read failed');
	});
	it('renders actual date tokens deterministically', () => {
		jest.useFakeTimers().setSystemTime(new Date(2026, 8, 16, 9, 8, 7, 6));
		jest.spyOn(Math, 'random').mockReturnValue(0.5);
		expect(service().timestamp()).toBe('20260916-090807006-i');
	});
	it('replaces repeated tokens and sanitizes the actual template', () => {
		jest.useFakeTimers().setSystemTime(new Date(2026, 8, 16));
		const files = new FileService(app as unknown as App, { ...DEFAULT_SETTINGS, photoNameTemplate: '会议/{YYYY}-{YYYY}[照片]#' });
		expect(files.timestamp()).toBe('会议2026-2026照片');
	});
	it('falls back when the template contains only unsafe characters', () => {
		jest.useFakeTimers().setSystemTime(new Date(2026, 8, 16));
		jest.spyOn(Math, 'random').mockReturnValue(0.5);
		const files = new FileService(app as unknown as App, { ...DEFAULT_SETTINGS, photoNameTemplate: '/:*?[]#...' });
		expect(files.timestamp()).toBe('20260916-i');
	});
});
