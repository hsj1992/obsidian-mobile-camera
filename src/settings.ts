export interface CameraPluginSettings {
	saveFolderTemplate: string;
	directImport: boolean;
}

export const DEFAULT_SETTINGS: CameraPluginSettings = {
	saveFolderTemplate: '{notepath}/image',
	directImport: true
};
