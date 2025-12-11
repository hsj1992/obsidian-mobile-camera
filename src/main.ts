import { App, Notice, Platform, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { CameraModal } from './camera-modal';
import { CameraPluginSettings, DEFAULT_SETTINGS } from './settings';

export default class AndroidCameraPlugin extends Plugin {
	settings!: CameraPluginSettings;
	private startupNoticeTimeout?: number;

	async onload() {
		await this.loadSettings();

		// Always add settings tab for transparency
		this.addSettingTab(new CameraSettingTab(this.app, this));

		if (!this.isMobileWithCamera()) {
			console.log('obsidian-mobile-camera: Mobile platform with camera not detected, commands disabled');
			// Show a one-time notice to inform users
			this.startupNoticeTimeout = window.setTimeout(() => {
				new Notice('Mobile Camera plugin requires a mobile device with camera support', 5000);
			}, 2000);
			return;
		}

		this.addCommand({
			id: 'camera-main-menu',
			name: 'Camera: Main Menu',
			icon: 'camera',
			callback: () => new CameraModal(this.app, this.settings).open()
		});

		this.addCommand({
			id: 'camera-take-photo',
			name: 'Camera: Take Photo',
			icon: 'camera',
			callback: () => new CameraModal(this.app, this.settings, 'photo').open()
		});

		this.addCommand({
			id: 'camera-scan-qr',
			name: 'Camera: Capture QR Code',
			icon: 'scan',
			callback: () => new CameraModal(this.app, this.settings, 'qr').open()
		});
	}

	onunload() {
		if (this.startupNoticeTimeout !== undefined) {
			window.clearTimeout(this.startupNoticeTimeout);
		}
		console.log('obsidian-mobile-camera: Plugin unloaded');
	}

	private isMobileWithCamera(): boolean {
		if (typeof navigator === 'undefined') return false;
		const hasMediaDevices = 'mediaDevices' in navigator || 'getUserMedia' in navigator;
		return Platform.isMobile && hasMediaDevices;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class CameraSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: AndroidCameraPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Save folder')
			.setDesc('Use {notepath} for the current note directory (default: {notepath}/image)')
			.addText((text) => {
				text
					.setPlaceholder('{notepath}/image')
					.setValue(this.plugin.settings.saveFolderTemplate)
					.onChange(async (value) => {
						this.plugin.settings.saveFolderTemplate = value || DEFAULT_SETTINGS.saveFolderTemplate;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Auto-save photo')
			.setDesc('If off, you will be prompted to rename the photo before saving')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.directImport)
					.onChange(async (value) => {
						this.plugin.settings.directImport = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Copy QR result to clipboard')
			.setDesc('If on, recognized QR text is copied to the clipboard automatically')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.copyQrToClipboard)
					.onChange(async (value) => {
						this.plugin.settings.copyQrToClipboard = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
