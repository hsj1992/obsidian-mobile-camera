import { App, Modal } from 'obsidian';

export class RenameModal extends Modal {
	private inputEl!: HTMLInputElement;
	private resolve: (value: string | null) => void;
	private resolved = false;

	constructor(app: App, private defaultName: string, resolve: (value: string | null) => void) {
		super(app);
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Rename photo' });
		this.inputEl = contentEl.createEl('input', { type: 'text', value: this.defaultName });
		this.inputEl.focus();

		const buttonBar = contentEl.createDiv({ cls: 'modal-button-container' });
		buttonBar.createEl('button', { text: 'Cancel' }).onclick = () => {
			this.resolved = true;
			this.resolve(null);
			this.close();
		};
		buttonBar.createEl('button', { text: 'Save' }).onclick = () => {
			this.resolved = true;
			this.resolve(this.inputEl.value);
			this.close();
		};
	}

	onClose() {
		if (!this.resolved) {
			this.resolve(null);
		}
		this.contentEl.empty();
	}
}
