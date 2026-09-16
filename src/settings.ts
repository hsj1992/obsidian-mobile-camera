export interface CameraPluginSettings {
	saveFolderTemplate: string;
	directImport: boolean;
	copyQrToClipboard: boolean;
	photoNameTemplate: string;
}

export const DEFAULT_SETTINGS: Readonly<CameraPluginSettings> = Object.freeze({
	saveFolderTemplate: '{notepath}/image',
	directImport: true,
	copyQrToClipboard: false,
	photoNameTemplate: '{YYYY}{MM}{DD}-{HH}{mm}{ss}{SSS}-{random}'
});

export function parseSettings(data: unknown): CameraPluginSettings {
	const values = data && typeof data === 'object' ? data as Record<string, unknown> : {};
	return {
		saveFolderTemplate: typeof values.saveFolderTemplate === 'string' && values.saveFolderTemplate.trim()
			? values.saveFolderTemplate : DEFAULT_SETTINGS.saveFolderTemplate,
		photoNameTemplate: typeof values.photoNameTemplate === 'string' && values.photoNameTemplate.trim()
			? values.photoNameTemplate : DEFAULT_SETTINGS.photoNameTemplate,
		directImport: typeof values.directImport === 'boolean' ? values.directImport : DEFAULT_SETTINGS.directImport,
		copyQrToClipboard: typeof values.copyQrToClipboard === 'boolean' ? values.copyQrToClipboard : DEFAULT_SETTINGS.copyQrToClipboard
	};
}
