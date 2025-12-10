export interface CameraPluginSettings {
	saveFolderTemplate: string;
	directImport: boolean;
}

export const DEFAULT_SETTINGS: Readonly<CameraPluginSettings> = Object.freeze({
	saveFolderTemplate: '{notepath}/image',
	directImport: true
});
