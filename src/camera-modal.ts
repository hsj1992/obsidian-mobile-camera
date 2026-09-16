import { App, Modal, MarkdownView, Notice } from 'obsidian';
import { CameraPluginSettings } from './settings';
import { RenameModal } from './rename-modal';
import { FileService } from './services/file-service';
import { QrScannerService } from './services/qr-scanner-service';
import { NoteTarget } from './services/note-target';
import { sanitizeFilename } from './services/filename';

export class CameraModal extends Modal {
	private settings: CameraPluginSettings;
	private fileInputCapture!: HTMLInputElement;
	private fileInputQr!: HTMLInputElement;
	private initialAction: 'photo' | 'qr' | null;
	private fileService: FileService;
	private qrService: QrScannerService;
	private target!: NoteTarget;
	private closed = false;
	private busy = false;
	private launchTimer?: number;
	private renameModal?: RenameModal;

	constructor(app: App, settings: CameraPluginSettings, initialAction: 'photo' | 'qr' | null = null, private onDismiss?: () => void) {
		super(app);
		this.settings = settings;
		this.initialAction = initialAction;
		this.fileService = new FileService(app, settings);
		this.qrService = new QrScannerService();
	}

	onOpen() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view?.file) {
			new Notice('Open a note first');
			this.close();
			return;
		}
		this.target = new NoteTarget(this.app, view);

		const { contentEl } = this;
		contentEl.empty();

		if (this.initialAction) {
			this.createFileInputs(contentEl);
			const target = this.initialAction === 'photo' ? this.fileInputCapture : this.fileInputQr;
			this.launchTimer = window.setTimeout(() => { if (!this.closed) target.click(); }, 0);
			return;
		}

		contentEl.addClass('camera-modal-overlay');
		this.createFileInputs(contentEl);
		this.createActionButtons(contentEl);
	}

	private createButton(parent: HTMLElement, text: string, onClick: () => void, large = false): HTMLButtonElement {
		const btn = parent.createEl('button', {
			text,
			cls: large ? 'camera-btn mod-large' : 'camera-btn'
		});
		btn.addEventListener('click', onClick);
		return btn;
	}

	private createFileInputs(container: HTMLElement) {
		this.fileInputCapture = container.createEl('input', { type: 'file' });
		this.fileInputCapture.accept = 'image/*';
		this.fileInputCapture.capture = 'environment';
		this.fileInputCapture.multiple = false;
		this.fileInputCapture.style.display = 'none';
		this.fileInputCapture.addEventListener('change', (e) => { void this.handleFileSelected(e); });
		this.fileInputCapture.addEventListener('cancel', () => {
			if (this.initialAction) this.close();
		});

		this.fileInputQr = container.createEl('input', { type: 'file' });
		this.fileInputQr.accept = 'image/*';
		this.fileInputQr.capture = 'environment';
		this.fileInputQr.multiple = false;
		this.fileInputQr.style.display = 'none';
		this.fileInputQr.addEventListener('change', (e) => { void this.handleQrSelected(e); });
		this.fileInputQr.addEventListener('cancel', () => {
			if (this.initialAction) this.close();
		});
	}

	private createActionButtons(container: HTMLElement) {
		const actionBar = container.createDiv({ cls: 'camera-action-bar' });

		this.createButton(actionBar, 'Take Photo', () => this.fileInputCapture.click(), true);
		this.createButton(actionBar, 'Capture QR Code', () => this.fileInputQr.click(), true);
		this.createButton(actionBar, 'Cancel', () => this.close(), false);
	}

	private async handleFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || this.closed || this.busy) return;
		this.busy = true;

		try {
			const buffer = await file.arrayBuffer();
			if (this.closed) return;
			const ext = /^[a-z0-9]+$/i.test(file.name.split('.').pop() || '')
				? file.name.split('.').pop()! : 'png';
			const folder = this.fileService.resolveSaveFolder(this.target.file);
			const defaultName = this.fileService.timestamp();
			let baseName = defaultName;

			if (!this.settings.directImport) {
				const renamed = await this.promptFilename(defaultName);
				if (renamed === null) {
					input.value = '';
					if (this.initialAction) this.close();
					return;
				}
				const sanitized = sanitizeFilename(renamed);
				baseName = sanitized || defaultName;
			}

			if (this.closed) return;
			this.target.assertAvailable();
			await this.fileService.ensureFolder(folder);
			if (this.closed) return;
			const fileName = await this.fileService.getUniqueFileName(folder, baseName, ext);
			if (this.closed) return;
			this.target.assertAvailable();
			const saved = await this.app.vault.createBinary(fileName, buffer);
			if (this.closed) return;
			try {
				this.target.insert('!' + this.app.fileManager.generateMarkdownLink(saved, this.target.file.path) + '\n');
			} catch {
				new Notice(`Photo saved to ${fileName}, but could not be inserted into the original note`);
				this.close();
				return;
			}
			new Notice('Photo saved');
			this.close();
		} catch (err) {
			if (this.closed) return;
			console.error('obsidian-mobile-camera: Failed to save photo', err);
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			new Notice(`Failed to save photo: ${errorMsg}`);
		} finally {
			this.busy = false;
			input.value = '';
		}
	}

	close() {
		this.cancelPendingWork();
		super.close();
	}

	private cancelPendingWork() {
		if (this.closed) return;
		this.closed = true;
		window.clearTimeout(this.launchTimer);
		this.renameModal?.close();
	}

	onClose() {
		this.cancelPendingWork();
		this.contentEl.empty();
		this.onDismiss?.();
	}


	private promptFilename(defaultName: string): Promise<string | null> {
		return new Promise((resolve) => {
			this.renameModal = new RenameModal(this.app, defaultName, resolve);
			this.renameModal.open();
		});
	}

	private async handleQrSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || this.closed || this.busy) return;
		this.busy = true;

		try {
			const decoded = await this.qrService.scan(file);
			if (this.closed) return;

			if (decoded) {
				this.target.insert(decoded + '\n');
				if (this.settings.copyQrToClipboard) {
					try {
						if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
						await navigator.clipboard.writeText(decoded);
					} catch {
						if (!this.closed) new Notice('QR text inserted, but could not be copied to the clipboard');
					}
				}
				if (this.closed) return;
				new Notice('QR code recognized');
				this.close();
			} else {
				new Notice('No QR code found in photo. Please try again.');
				this.close();
			}
		} catch (err) {
			if (this.closed) return;
			console.error('obsidian-mobile-camera: Failed to recognize QR code', err);
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			new Notice(`Failed to recognize QR code: ${errorMsg}`);
			this.close();
		} finally {
			this.busy = false;
			input.value = '';
		}
	}


}
