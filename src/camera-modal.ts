import { App, Modal, MarkdownView, Notice } from 'obsidian';
import { CameraPluginSettings } from './settings';
import { RenameModal } from './rename-modal';
import { FileService } from './services/file-service';
import { QrScannerService } from './services/qr-scanner-service';

export class CameraModal extends Modal {
	private settings: CameraPluginSettings;
	private fileInputCapture!: HTMLInputElement;
	private fileInputQr!: HTMLInputElement;
	private initialAction: 'photo' | 'qr' | null;
	private fileService: FileService;
	private qrService: QrScannerService;

	constructor(app: App, settings: CameraPluginSettings, initialAction: 'photo' | 'qr' | null = null) {
		super(app);
		this.settings = settings;
		this.initialAction = initialAction;
		this.fileService = new FileService(app, settings);
		this.qrService = new QrScannerService();
	}

	async onOpen() {
		if (!this.app.workspace.getActiveViewOfType(MarkdownView)) {
			new Notice('Open a note first');
			this.close();
			return;
		}

		const { contentEl } = this;
		contentEl.empty();

		if (this.initialAction) {
			this.createFileInputs(contentEl);
			const target = this.initialAction === 'photo' ? this.fileInputCapture : this.fileInputQr;
			setTimeout(() => target.click(), 0);
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
		this.fileInputCapture = container.createEl('input', { type: 'file' }) as HTMLInputElement;
		this.fileInputCapture.accept = 'image/*';
		this.fileInputCapture.capture = 'environment';
		this.fileInputCapture.multiple = false;
		this.fileInputCapture.style.display = 'none';
		this.fileInputCapture.addEventListener('change', (e) => this.handleFileSelected(e));
		this.fileInputCapture.addEventListener('cancel', () => {
			if (this.initialAction) this.close();
		});

		this.fileInputQr = container.createEl('input', { type: 'file' }) as HTMLInputElement;
		this.fileInputQr.accept = 'image/*';
		this.fileInputQr.capture = 'environment';
		this.fileInputQr.multiple = false;
		this.fileInputQr.style.display = 'none';
		this.fileInputQr.addEventListener('change', (e) => this.handleQrSelected(e));
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

	private insertText(text: string) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice('Open a note first');
			return;
		}
		view.editor.replaceSelection(text);
	}


	private async handleFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const buffer = await file.arrayBuffer();
			const ext = file.name.split('.').pop() || 'png';
			const folder = this.fileService.resolveSaveFolder();
			const defaultName = this.fileService.timestamp();
			let baseName = defaultName;

			if (!this.settings.directImport) {
				const renamed = await this.promptFilename(defaultName);
				if (renamed === null) {
					input.value = '';
					return;
				}
				const sanitized = renamed.trim().replace(/[^a-zA-Z0-9_\-. ]/g, '');
				baseName = sanitized || defaultName;
			}

			await this.fileService.ensureFolder(folder);
			const fileName = await this.fileService.getUniqueFileName(folder, baseName, ext);
			await this.app.vault.createBinary(fileName, buffer);
			this.insertText(`![[${fileName}]]\n`);
			new Notice('Photo saved');
			this.close();
		} catch (err) {
			console.error('obsidian-mobile-camera: Failed to save photo', err);
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			new Notice(`Failed to save photo: ${errorMsg}`);
		} finally {
			input.value = '';
		}
	}

	async onClose() {
		this.contentEl.empty();
	}


	private promptFilename(defaultName: string): Promise<string | null> {
		return new Promise((resolve) => {
			new RenameModal(this.app, defaultName, resolve).open();
		});
	}

	private async handleQrSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const decoded = await this.qrService.scan(file);

			if (decoded) {
				this.insertText(decoded + '\n');
				if (this.settings.copyQrToClipboard && navigator?.clipboard?.writeText) {
					try {
						await navigator.clipboard.writeText(decoded);
					} catch {
						// Clipboard access may be denied in some mobile WebViews
					}
				}
				new Notice('QR code recognized');
				this.close();
			} else {
				new Notice('No QR code found in photo. Please try again.');
				this.close();
			}
		} catch (err) {
			console.error('obsidian-mobile-camera: Failed to recognize QR code', err);
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			new Notice(`Failed to recognize QR code: ${errorMsg}`);
			this.close();
		} finally {
			input.value = '';
		}
	}


}
