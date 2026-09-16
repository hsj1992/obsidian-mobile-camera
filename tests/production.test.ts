import { CameraModal } from '../src/camera-modal';
import { FileService } from '../src/services/file-service';
import { sanitizeFilename } from '../src/services/filename';
import { NoteTarget } from '../src/services/note-target';
import { QrScannerService } from '../src/services/qr-scanner-service';
import { DEFAULT_SETTINGS, parseSettings } from '../src/settings';
import { MockApp, MockMarkdownView } from './mocks/obsidian';
import { App, MarkdownView, TFile } from 'obsidian';

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => { resolve = done; });
	return { promise, resolve };
}

function setup() {
	const app = new MockApp();
	const view = new MockMarkdownView();
	app.workspace.setActiveView(view);
	const modal = new CameraModal(app as unknown as App, { ...DEFAULT_SETTINGS });
	modal.open();
	const input = modal.contentEl.querySelector('input')!;
	return { app, view, modal, input };
}

function event(input: HTMLInputElement, read: () => Promise<ArrayBuffer>) {
	Object.defineProperty(input, 'files', { value: [{ name: 'photo.jpg', arrayBuffer: read }] });
	return { target: input } as unknown as Event;
}

// Access event handlers directly so each test can await the complete operation.
type Handlers = { handleFileSelected(event: Event): Promise<void>; handleQrSelected(event: Event): Promise<void> };

describe('Production camera flow', () => {
	afterEach(() => jest.restoreAllMocks());
	it('inserts QR text into the original note after switching notes', async () => {
		const { app, view, modal, input } = setup();
		const decode = deferred<string | null>();
		jest.spyOn(QrScannerService.prototype, 'scan').mockReturnValue(decode.promise);
		const operation = (modal as unknown as Handlers).handleQrSelected(event(input, async () => new ArrayBuffer(1)));
		const other = new MockMarkdownView();
		app.workspace.setActiveView(other);
		decode.resolve('QR result');
		await operation;
		expect(view.editor.getContent()).toBe('QR result\n');
		expect(other.editor.getContent()).toBe('');
	});
	it('does not insert QR text after closing the modal', async () => {
		const { view, modal, input } = setup();
		const decode = deferred<string | null>();
		jest.spyOn(QrScannerService.prototype, 'scan').mockReturnValue(decode.promise);
		const operation = (modal as unknown as Handlers).handleQrSelected(event(input, async () => new ArrayBuffer(1)));
		modal.close();
		decode.resolve('QR result');
		await operation;
		expect(view.editor.getContent()).toBe('');
	});
	it('does not insert a late result when closed during an in-flight vault write', async () => {
		const { app, view, modal, input } = setup();
		const write = deferred<{ path: string }>();
		const started = deferred<void>();
		jest.spyOn(app.vault, 'createBinary').mockImplementation(() => { started.resolve(); return write.promise; });
		const operation = (modal as unknown as Handlers).handleFileSelected(event(input, async () => new ArrayBuffer(1)));
		await started.promise;
		modal.close();
		write.resolve({ path: 'saved.jpg' });
		await operation;
		expect(view.editor.getContent()).toBe('');
	});
	it('saves and inserts into the original note after switching notes', async () => {
		const { app, view, modal, input } = setup();
		const read = deferred<ArrayBuffer>();
		const operation = (modal as unknown as Handlers).handleFileSelected(event(input, () => read.promise));
		const other = new MockMarkdownView();
		app.workspace.setActiveView(other);
		read.resolve(new ArrayBuffer(4));
		await operation;
		expect(app.vault.getFiles()[0].path).toMatch(/^test-folder\/image\/.+\.jpg$/);
		expect(view.editor.getContent()).toContain('![[test-folder/image/');
		expect(other.editor.getContent()).toBe('');
	});

	it('does not save after the modal is closed during file reading', async () => {
		const { app, view, modal, input } = setup();
		const read = deferred<ArrayBuffer>();
		const operation = (modal as unknown as Handlers).handleFileSelected(event(input, () => read.promise));
		modal.close();
		read.resolve(new ArrayBuffer(4));
		await operation;
		expect(app.vault.getFiles()).toHaveLength(0);
		expect(view.editor.getContent()).toBe('');
	});

	it('cancels immediately even when Obsidian delays onClose for its animation', async () => {
		const { app, view, modal, input } = setup();
		const read = deferred<ArrayBuffer>();
		const operation = (modal as unknown as Handlers).handleFileSelected(event(input, () => read.promise));
		jest.spyOn(modal, 'onClose').mockImplementation(() => {});
		modal.close();
		read.resolve(new ArrayBuffer(4));
		await operation;
		expect(app.vault.getFiles()).toHaveLength(0);
		expect(view.editor.getContent()).toBe('');
	});

	it('does not save when the original view has closed', async () => {
		const { app, modal, input } = setup();
		app.workspace.views.clear();
		const log = jest.spyOn(console, 'error').mockImplementation(() => {});
		await (modal as unknown as Handlers).handleFileSelected(event(input, async () => new ArrayBuffer(4)));
		expect(app.vault.getFiles()).toHaveLength(0);
		log.mockRestore();
	});

	it('does not insert a link when file saving fails', async () => {
		const { app, view, modal, input } = setup();
		jest.spyOn(app.vault, 'createBinary').mockRejectedValue(new Error('Storage full'));
		const log = jest.spyOn(console, 'error').mockImplementation(() => {});
		await (modal as unknown as Handlers).handleFileSelected(event(input, async () => new ArrayBuffer(4)));
		expect(view.editor.getContent()).toBe('');
		log.mockRestore();
	});
});

describe('Production helpers', () => {
	it('keeps Chinese names and strips unsafe link and filename characters', () => {
		expect(sanitizeFilename('  会议[照片]#1/\\:*?"<>|  ')).toBe('会议照片1');
		expect(sanitizeFilename('...')).toBe('');
	});
	it('validates settings loaded from disk', () => {
		expect(parseSettings({ saveFolderTemplate: 42, directImport: 'false', photoNameTemplate: null })).toEqual(DEFAULT_SETTINGS);
	});
	it('uses the supplied note rather than the active note for its folder', () => {
		const app = new MockApp();
		const service = new FileService(app as unknown as App, { ...DEFAULT_SETTINGS });
		expect(service.resolveSaveFolder({ parent: { path: 'original' } } as TFile)).toBe('original/image');
	});
	it('creates nested folders and resolves filename conflicts through the vault', async () => {
		const app = new MockApp();
		const service = new FileService(app as unknown as App, { ...DEFAULT_SETTINGS });
		await service.ensureFolder('a/b');
		expect(await app.vault.adapter.exists('a/b')).toBe(true);
		await app.vault.createBinary('a/b/photo.jpg', new ArrayBuffer(1));
		expect(await service.getUniqueFileName('a/b', 'photo', 'jpg')).toBe('a/b/photo-1.jpg');
		await expect(service.ensureFolder('../escape')).rejects.toThrow();
	});
	it('rejects insertion if the original content changed', () => {
		const app = new MockApp();
		const view = new MockMarkdownView();
		app.workspace.setActiveView(view);
		const target = new NoteTarget(app as unknown as App, view as unknown as MarkdownView);
		view.editor.replaceSelection('Edited');
		expect(() => target.insert('Photo')).toThrow('changed');
		expect(view.editor.getContent()).toBe('Edited');
	});
});
