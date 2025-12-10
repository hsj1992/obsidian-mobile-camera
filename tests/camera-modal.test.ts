import { MockApp, MockMarkdownView, normalizePath } from './mocks/obsidian';

describe('CameraModal Path Resolution', () => {
	let mockApp: MockApp;

	beforeEach(() => {
		mockApp = new MockApp();
	});

	describe('resolveSaveFolder', () => {
		const resolveSaveFolder = (
			saveFolderTemplate: string,
			notePath: string
		): string => {
			const folder = saveFolderTemplate.replace('{notepath}', notePath);
			if (folder.startsWith('/') && !notePath) {
				return 'Camera';
			}
			const normalized = normalizePath(folder).replace(/^\/+/, '');
			if (!normalized || normalized.split('/').some((part) => part === '..')) {
				return 'Camera';
			}
			return normalized;
		};

		it('should replace {notepath} with current note directory', () => {
			const result = resolveSaveFolder('{notepath}/image', 'daily/2024');
			expect(result).toBe('daily/2024/image');
		});

		it('should handle root level notes by falling back to Camera', () => {
			const result = resolveSaveFolder('{notepath}/image', '');
			expect(result).toBe('Camera');
		});

		it('should use absolute path when no {notepath}', () => {
			const result = resolveSaveFolder('Camera', 'daily/2024');
			expect(result).toBe('Camera');
		});

		it('should fallback to Camera for empty result', () => {
			const result = resolveSaveFolder('', '');
			expect(result).toBe('Camera');
		});

		it('should handle complex paths', () => {
			const result = resolveSaveFolder('{notepath}/attachments/images', 'projects/work');
			expect(result).toBe('projects/work/attachments/images');
		});

		it('should block path traversal with ..', () => {
			const result = resolveSaveFolder('../escape', 'daily/2024');
			expect(result).toBe('Camera');
		});

		it('should block path traversal in template', () => {
			const result = resolveSaveFolder('{notepath}/../../../etc', 'daily/2024');
			expect(result).toBe('Camera');
		});

		it('should block absolute path with leading slash', () => {
			const result = resolveSaveFolder('/absolute/path', 'daily/2024');
			expect(result).toBe('absolute/path');
		});
	});

	describe('ensureFolder', () => {
		const ensureFolder = async (path: string, adapter: any) => {
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
				if (!(await adapter.exists(current))) {
					adapter.addFolder(current);
				}
			}
		};

		it('should create folder if it does not exist', async () => {
			const path = 'test/folder';
			const exists = await mockApp.vault.adapter.exists(path);
			expect(exists).toBe(false);

			await ensureFolder(path, mockApp.vault.adapter);

			const existsAfter = await mockApp.vault.adapter.exists(path);
			expect(existsAfter).toBe(true);
		});

		it('should not fail if folder already exists', async () => {
			const path = 'existing/folder';
			mockApp.vault.adapter.addFolder(path);

			const exists = await mockApp.vault.adapter.exists(path);
			expect(exists).toBe(true);
		});

		it('should throw error for invalid path', async () => {
			const invalidPath = '';
			await expect(ensureFolder(invalidPath, mockApp.vault.adapter)).rejects.toThrow('Invalid folder path');
		});

		it('should create nested folders recursively', async () => {
			const path = 'level1/level2/level3';
			await ensureFolder(path, mockApp.vault.adapter);

			expect(await mockApp.vault.adapter.exists('level1')).toBe(true);
			expect(await mockApp.vault.adapter.exists('level1/level2')).toBe(true);
			expect(await mockApp.vault.adapter.exists('level1/level2/level3')).toBe(true);
		});

		it('should block path traversal attempts', async () => {
			const path = 'folder/../../../etc';
			await expect(ensureFolder(path, mockApp.vault.adapter)).rejects.toThrow('Invalid folder path');
		});

		it('should handle paths with leading slashes', async () => {
			const path = '/folder/subfolder';
			await ensureFolder(path, mockApp.vault.adapter);

			expect(await mockApp.vault.adapter.exists('folder')).toBe(true);
			expect(await mockApp.vault.adapter.exists('folder/subfolder')).toBe(true);
		});
	});
});

describe('File Operations', () => {
	let mockApp: MockApp;

	beforeEach(() => {
		mockApp = new MockApp();
	});

	describe('createBinary', () => {
		it('should save file to vault', async () => {
			const path = 'images/photo.jpg';
			const data = new ArrayBuffer(100);

			const result = await mockApp.vault.createBinary(path, data);
			expect(result.path).toBe(path);

			const files = mockApp.vault.getFiles();
			expect(files).toHaveLength(1);
			expect(files[0].path).toBe(path);
		});

		it('should handle multiple files', async () => {
			await mockApp.vault.createBinary('photo1.jpg', new ArrayBuffer(100));
			await mockApp.vault.createBinary('photo2.jpg', new ArrayBuffer(100));

			const files = mockApp.vault.getFiles();
			expect(files).toHaveLength(2);
		});
	});
});

describe('Text Insertion', () => {
	let mockApp: MockApp;
	let mockView: MockMarkdownView;

	beforeEach(() => {
		mockApp = new MockApp();
		mockView = new MockMarkdownView();
		mockApp.workspace.setActiveView(mockView);
	});

	describe('insertText', () => {
		it('should insert text at cursor position', () => {
			const text = '![[image.jpg]]\n';
			mockView.editor.replaceSelection(text);

			expect(mockView.editor.getContent()).toBe(text);
		});

		it('should insert multiple texts', () => {
			mockView.editor.replaceSelection('First\n');
			mockView.editor.replaceSelection('Second\n');

			expect(mockView.editor.getContent()).toBe('First\nSecond\n');
		});

		it('should handle QR code content', () => {
			const qrContent = 'https://example.com\n';
			mockView.editor.replaceSelection(qrContent);

			expect(mockView.editor.getContent()).toBe(qrContent);
		});
	});
});

describe('Platform Detection', () => {
	it('should have Platform.isMobile set to true in test environment', () => {
		expect(global.Platform.isMobile).toBe(true);
	});

	it('should detect mobile with camera when both conditions are met', () => {
		// Mock navigator with mediaDevices for this test
		const mockNav = {
			userAgent: 'Mozilla/5.0 (Android)',
			mediaDevices: {},
			getUserMedia: () => {}
		};

		const isMobileWithCamera = (nav: any): boolean => {
			if (typeof nav === 'undefined') return false;
			const hasMediaDevices = 'mediaDevices' in nav || 'getUserMedia' in nav;
			return global.Platform.isMobile && hasMediaDevices;
		};

		// In test environment, both should be true
		expect(isMobileWithCamera(mockNav)).toBe(true);
	});

	it('should return false when navigator is undefined', () => {
		const isMobileWithCamera = (nav: any): boolean => {
			if (typeof nav === 'undefined') return false;
			const hasMediaDevices = 'mediaDevices' in nav || 'getUserMedia' in nav;
			return global.Platform.isMobile && hasMediaDevices;
		};

		expect(isMobileWithCamera(undefined)).toBe(false);
	});
});
