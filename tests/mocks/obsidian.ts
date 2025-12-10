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
	contentEl: any;

	constructor(app: any) {
		this.app = app;
		this.contentEl = this.createMockElement();
	}

	private createMockElement() {
		const addMethods = (el: any) => {
			el.createEl = (tag: string, options?: any) => {
				const child = document.createElement(tag);
				if (options?.text) child.textContent = options.text;
				if (options?.cls) child.className = options.cls;
				if (options?.type) (child as any).type = options.type;
				if (options?.value) (child as any).value = options.value;
				addMethods(child);
				el.appendChild(child);
				return child;
			};
			el.createDiv = (options?: any) => {
				return el.createEl('div', options);
			};
			el.empty = () => {
				el.innerHTML = '';
			};
			return el;
		};
		return addMethods(document.createElement('div'));
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

// Export as obsidian module
export const App = MockApp;
export const Modal = MockModal;
export const MarkdownView = MockMarkdownView;
export const Notice = MockNotice;
export const Platform = MockPlatform;
export const Plugin = class MockPlugin {};
export const PluginSettingTab = class MockPluginSettingTab {};
export const Setting = class MockSetting {
	setName() { return this; }
	setDesc() { return this; }
	addText() { return this; }
	addToggle() { return this; }
};
export const TFile = class MockTFile {};
