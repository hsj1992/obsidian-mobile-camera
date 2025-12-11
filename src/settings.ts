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
