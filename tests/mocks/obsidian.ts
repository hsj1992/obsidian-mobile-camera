// Mock Obsidian API for testing

export class MockApp {
	workspace = new MockWorkspace();
	vault = new MockVault();
}

export class MockWorkspace {
	private activeView: any = null;

	getActiveViewOfType(type: any) {
		return this.activeView;
	}

	setActiveView(view: any) {
		this.activeView = view;
	}
}

export class MockVault {
	adapter = new MockAdapter();
	private files: Map<string, ArrayBuffer> = new Map();

	async createBinary(path: string, data: ArrayBuffer) {
		this.files.set(path, data);
		return { path };
	}

	async createFolder(path: string) {
		return { path };
	}

	getFiles() {
		return Array.from(this.files.keys()).map(path => ({ path }));
	}
}

export class MockAdapter {
	private folders: Set<string> = new Set();
	private files: Set<string> = new Set();

	async exists(path: string): Promise<boolean> {
		return this.folders.has(path) || this.files.has(path);
	}

	addFolder(path: string) {
		this.folders.add(path);
	}

	addFile(path: string) {
		this.files.add(path);
	}
}

export class MockModal {
	app: any;
	contentEl = document.createElement('div');

	constructor(app: any) {
		this.app = app;
	}

	open() {}
	close() {}
	onOpen() {}
	onClose() {}
}

export class MockMarkdownView {
	file = { parent: { path: 'test-folder' }, path: 'test-folder/test.md' };
	editor = new MockEditor();
}

export class MockEditor {
	private content = '';

	replaceSelection(text: string) {
		this.content += text;
	}

	getContent() {
		return this.content;
	}
}

export class MockNotice {
	message: string;
	duration: number;

	constructor(message: string, duration = 5000) {
		this.message = message;
		this.duration = duration;
	}
}

export const MockPlatform = {
	isMobile: true,
	isDesktop: false,
	isDesktopApp: false,
	isMobileApp: true
};

export function normalizePath(path: string): string {
	return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}
