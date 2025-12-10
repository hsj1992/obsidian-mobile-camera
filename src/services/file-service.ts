import { App, MarkdownView, TFile, normalizePath } from 'obsidian';
import { CameraPluginSettings } from '../settings';

export class FileService {
	constructor(private app: App, private settings: CameraPluginSettings) {}

	timestamp(): string {
		const d = new Date();
		const timestamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}${String(d.getMilliseconds()).padStart(3, '0')}`;
		const random = Math.random().toString(36).substring(2, 6);
		return `${timestamp}-${random}`;
	}

	async ensureFolder(path: string) {
		if (!path || path.trim() === '') {
			throw new Error('Invalid folder path');
		}

		const normalizedPath = normalizePath(path).replace(/^\/+/, '');
		if (normalizedPath.split('/').some((part) => part === '..')) {
			throw new Error('Invalid folder path');
		}
		const parts = normalizedPath.split('/').filter(Boolean);
		let current = '';
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			if (!(await this.app.vault.adapter.exists(current))) {
				await this.app.vault.createFolder(current);
			}
		}
	}

	resolveSaveFolder(): string {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const file = view?.file as TFile | undefined;
		const noteDir = file?.parent?.path ?? '';
		const folder = (this.settings.saveFolderTemplate || '{notepath}/image')
			.replace('{notepath}', noteDir);
		if (folder.startsWith('/') && !noteDir) {
			return 'Camera';
		}
		const normalized = normalizePath(folder).replace(/^\/+/, '');
		if (!normalized || normalized.split('/').some((part) => part === '..')) {
			return 'Camera';
		}
		return normalized;
	}

	async getUniqueFileName(folder: string, baseName: string, ext: string): Promise<string> {
		let fileName = `${folder}/${baseName}.${ext}`;
		let counter = 1;
		while (await this.app.vault.adapter.exists(fileName)) {
			fileName = `${folder}/${baseName}-${counter}.${ext}`;
			counter++;
		}
		return fileName;
	}
}
