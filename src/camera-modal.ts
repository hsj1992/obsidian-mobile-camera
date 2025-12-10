import { App, Modal, MarkdownView, Notice, TFile, normalizePath } from 'obsidian';
import jsQR from 'jsqr';
import { CameraPluginSettings } from './settings';

export class CameraModal extends Modal {
	private settings: CameraPluginSettings;
	private fileInputCapture!: HTMLInputElement;
	private fileInputQr!: HTMLInputElement;
	private initialAction: 'photo' | 'qr' | null;

	constructor(app: App, settings: CameraPluginSettings, initialAction: 'photo' | 'qr' | null = null) {
		super(app);
		this.settings = settings;
		this.initialAction = initialAction;
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
			contentEl.style.display = 'none';
			this.createFileInputs(contentEl);
			const target = this.initialAction === 'photo' ? this.fileInputCapture : this.fileInputQr;
			target.click();

			// If click is blocked (e.g., gesture requirement), restore UI after a short delay
			setTimeout(() => {
				if (!this.fileInputCapture.value && !this.fileInputQr.value) {
					contentEl.style.display = '';
					contentEl.addClass('camera-modal-overlay');
					this.createActionButtons(contentEl);
				}
			}, 150);
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

		this.fileInputQr = container.createEl('input', { type: 'file' }) as HTMLInputElement;
		this.fileInputQr.accept = 'image/*';
		this.fileInputQr.capture = 'environment';
		this.fileInputQr.multiple = false;
		this.fileInputQr.style.display = 'none';
		this.fileInputQr.addEventListener('change', (e) => this.handleQrSelected(e));
	}

	private createActionButtons(container: HTMLElement) {
		const actionBar = container.createDiv({ cls: 'camera-action-bar' });

		this.createButton(actionBar, 'Take Photo', () => this.fileInputCapture.click(), true);
		this.createButton(actionBar, 'Scan QR Code', () => this.fileInputQr.click(), true);
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

	private timestamp(): string {
		const d = new Date();
		const timestamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}${String(d.getMilliseconds()).padStart(3, '0')}`;
		// Add random suffix to prevent collisions
		const random = Math.random().toString(36).substring(2, 6);
		return `${timestamp}-${random}`;
	}

	private async ensureFolder(path: string) {
		if (!path || path.trim() === '') {
			throw new Error('Invalid folder path');
		}

		const normalizedPath = normalizePath(path);
		if (!(await this.app.vault.adapter.exists(normalizedPath))) {
			await this.app.vault.createFolder(normalizedPath);
		}
	}

	private async handleFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const buffer = await file.arrayBuffer();
			const ext = file.name.split('.').pop() || 'png';
			const folder = this.resolveSaveFolder();
			const defaultName = this.timestamp();
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

			await this.ensureFolder(folder);
			const fileName = await this.getUniqueFileName(folder, baseName, ext);
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

	private resolveSaveFolder(): string {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const file = view?.file as TFile | undefined;
		const noteDir = file?.parent?.path ?? '';
		const folder = (this.settings.saveFolderTemplate || '{notepath}/image')
			.replace('{notepath}', noteDir);
		return normalizePath(folder) || 'Camera';
	}

	private async getUniqueFileName(folder: string, baseName: string, ext: string): Promise<string> {
		let fileName = `${folder}/${baseName}.${ext}`;
		let counter = 1;
		while (await this.app.vault.adapter.exists(fileName)) {
			fileName = `${folder}/${baseName}-${counter}.${ext}`;
			counter++;
		}
		return fileName;
	}

	private promptFilename(defaultName: string): Promise<string | null> {
		return new Promise((resolve) => {
			const modal = new class extends Modal {
				private inputEl!: HTMLInputElement;
				onOpen() {
					const { contentEl } = this;
					contentEl.createEl('h2', { text: 'Rename photo' });
					this.inputEl = contentEl.createEl('input', { type: 'text', value: defaultName });
					this.inputEl.focus();

					const buttonBar = contentEl.createDiv({ cls: 'modal-button-container' });
					buttonBar.createEl('button', { text: 'Cancel' }).onclick = () => { this.close(); resolve(null); };
					buttonBar.createEl('button', { text: 'Save' }).onclick = () => {
						const val = this.inputEl.value;
						this.close();
						resolve(val);
					};
				}
				onClose() {
					this.contentEl.empty();
				}
			}(this.app);
			modal.open();
		});
	}

	private async handleQrSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const image = await this.loadImageFromFile(file);
			const decoded = await this.tryBarcodeDetector(image) ?? await this.decodeWithJsqr(image);

			if (decoded) {
				this.insertText(decoded + '\n');
				new Notice('QR scanned');
				this.close();
			} else {
				new Notice('No QR code found. Please try again.');
				if (this.initialAction) {
					this.contentEl.style.display = '';
					this.contentEl.addClass('camera-modal-overlay');
					this.createActionButtons(this.contentEl);
				}
			}
		} catch (err) {
			console.error('obsidian-mobile-camera: Failed to scan QR code', err);
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			new Notice(`Failed to scan QR code: ${errorMsg}`);
			if (this.initialAction) {
				this.contentEl.style.display = '';
				this.contentEl.addClass('camera-modal-overlay');
				this.createActionButtons(this.contentEl);
			}
		} finally {
			input.value = '';
		}
	}

	private async tryBarcodeDetector(image: HTMLImageElement): Promise<string | null> {
		const Detector = (window as any).BarcodeDetector;
		if (!Detector) return null;
		try {
			const detector = new Detector({ formats: ['qr_code'] });
			const result = await detector.detect(image);
			return result?.[0]?.rawValue ?? null;
		} catch {
			return null;
		}
	}

	private async decodeWithJsqr(image: HTMLImageElement): Promise<string | null> {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('No canvas context');

		const maxDim = 1000;
		const scales = [1, 0.75, 0.5];

		for (const scale of scales) {
			const fit = Math.min(1, maxDim / Math.max(image.width, image.height));
			const s = scale * fit;
			const w = Math.max(1, Math.floor(image.width * s));
			const h = Math.max(1, Math.floor(image.height * s));
			canvas.width = w;
			canvas.height = h;
			ctx.drawImage(image, 0, 0, w, h);
			const imgData = ctx.getImageData(0, 0, w, h);

			const result = jsQR(imgData.data, imgData.width, imgData.height, {
				inversionAttempts: 'attemptBoth'
			});
			if (result?.data) return result.data;
		}
		return null;
	}

	private loadImageFromFile(file: File): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const url = URL.createObjectURL(file);
			const img = new Image();
			img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
			img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load error')); };
			img.src = url;
		});
	}
}
