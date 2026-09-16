// Mock Obsidian API for testing

export class MockApp {
	workspace = new MockWorkspace();
	vault = new MockVault();
	fileManager = { generateMarkdownLink: (file: { path: string }) => `[[${file.path}]]` };
}

export class MockWorkspace {
	private activeView: any = null;
	views = new Set<any>();
	iterateAllLeaves(callback: (leaf: any) => void) {
		for (const view of this.views) callback({ view });
	}

	getActiveViewOfType(type: any) {
		return this.activeView instanceof type ? this.activeView : null;
	}

	setActiveView(view: any) {
		this.activeView = view;
		if (view) this.views.add(view);
	}
}

export class MockVault {
	adapter = new MockAdapter();
	private files: Map<string, ArrayBuffer> = new Map();

	async createBinary(path: string, data: ArrayBuffer) {
		if (await this.adapter.exists(path)) throw new Error('File already exists');
		this.files.set(path, data);
		this.adapter.addFile(path);
		return { path };
	}

	async createFolder(path: string) {
		this.adapter.addFolder(path);
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
			el.addClass = (name: string) => el.classList.add(name);
			return el;
		};
		return addMethods(document.createElement('div'));
	}

	open() { this.onOpen(); }
	close() { this.onClose(); }
	onOpen() {}
	onClose() {}
}

export class MockMarkdownView {
	file = { parent: { path: 'test-folder' }, path: 'test-folder/test.md' };
	editor = new MockEditor();
}

export class MockEditor {
	private content = '';
	private from = { line: 0, ch: 0 };
	private to = { line: 0, ch: 0 };
	getValue() { return this.content; }
	getCursor(which: 'from' | 'to' = 'to') { return { ...this[which] }; }
	setSelection(from: { line: number; ch: number }, to = from) {
		this.from = { ...from }; this.to = { ...to };
	}
	private offset(position: { line: number; ch: number }) {
		return this.content.split('\n').slice(0, position.line).reduce((length, line) => length + line.length + 1, 0) + position.ch;
	}
	replaceRange(text: string, from: { line: number; ch: number }, to: { line: number; ch: number }) {
		const start = this.offset(from), end = this.offset(to);
		this.content = this.content.slice(0, start) + text + this.content.slice(end);
		const lines = this.content.slice(0, start + text.length).split('\n');
		this.setSelection({ line: lines.length - 1, ch: lines[lines.length - 1].length });
	}

	replaceSelection(text: string) {
		this.replaceRange(text, this.from, this.to);
	}

	getContent() {
		return this.content;
	}
}

export class MockNotice {
	static messages: string[] = [];
	message: string;
	duration: number;

	constructor(message: string, duration = 5000) {
		MockNotice.messages.push(message);
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
export class MockPlugin {
	commands: Array<{ id: string; callback: () => void }> = [];
	settingTabs: unknown[] = [];
	loadData = jest.fn().mockResolvedValue(null);
	saveData = jest.fn().mockResolvedValue(undefined);
	constructor(public app: MockApp) {}
	addCommand(command: { id: string; callback: () => void }) { this.commands.push(command); }
	addSettingTab(tab: unknown) { this.settingTabs.push(tab); }
}
export const Plugin = MockPlugin;
export const PluginSettingTab = class MockPluginSettingTab {
	constructor(public app: MockApp, public plugin: MockPlugin) {}
};
export const Setting = class MockSetting {
	setName() { return this; }
	setDesc() { return this; }
	addText() { return this; }
	addToggle() { return this; }
};
export const TFile = class MockTFile {};
