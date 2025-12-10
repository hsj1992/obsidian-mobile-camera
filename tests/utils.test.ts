import { normalizePath } from './mocks/obsidian';

describe('Utility Functions', () => {
	describe('normalizePath', () => {
		it('should normalize Windows paths to Unix style', () => {
			expect(normalizePath('folder\\subfolder\\file.txt')).toBe('folder/subfolder/file.txt');
		});

		it('should handle mixed separators', () => {
			expect(normalizePath('folder/subfolder\\file.txt')).toBe('folder/subfolder/file.txt');
		});

		it('should remove duplicate slashes', () => {
			expect(normalizePath('folder//subfolder///file.txt')).toBe('folder/subfolder/file.txt');
		});

		it('should handle already normalized paths', () => {
			expect(normalizePath('folder/subfolder/file.txt')).toBe('folder/subfolder/file.txt');
		});

		it('should handle empty string', () => {
			expect(normalizePath('')).toBe('');
		});

		it('should handle root paths', () => {
			expect(normalizePath('/')).toBe('/');
			expect(normalizePath('\\')).toBe('/');
		});
	});

	describe('File name sanitization', () => {
		const sanitizeFilename = (name: string): string => {
			return name.trim().replace(/[^a-zA-Z0-9_\-. ]/g, '');
		};

		it('should remove path separators', () => {
			expect(sanitizeFilename('file/name')).toBe('filename');
			expect(sanitizeFilename('file\\name')).toBe('filename');
		});

		it('should remove special characters', () => {
			expect(sanitizeFilename('file:name')).toBe('filename');
			expect(sanitizeFilename('file*name')).toBe('filename');
			expect(sanitizeFilename('file?name')).toBe('filename');
		});

		it('should keep allowed characters', () => {
			expect(sanitizeFilename('file-name_123.txt')).toBe('file-name_123.txt');
			expect(sanitizeFilename('My File 2024')).toBe('My File 2024');
		});

		it('should trim whitespace', () => {
			expect(sanitizeFilename('  filename  ')).toBe('filename');
		});

		it('should handle empty result', () => {
			expect(sanitizeFilename('///')).toBe('');
			expect(sanitizeFilename('***')).toBe('');
		});
	});

	describe('Timestamp generation', () => {
		const generateTimestamp = (): string => {
			const d = new Date();
			const timestamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}${String(d.getMilliseconds()).padStart(3, '0')}`;
			const random = Math.random().toString(36).substring(2, 6);
			return `${timestamp}-${random}`;
		};

		it('should generate valid timestamp format', () => {
			const timestamp = generateTimestamp();
			// Format: YYYYMMDD-HHMMSSmmm-xxxx
			expect(timestamp).toMatch(/^\d{8}-\d{9}-[a-z0-9]{4}$/);
		});

		it('should generate unique timestamps', () => {
			const timestamps = new Set();
			for (let i = 0; i < 100; i++) {
				timestamps.add(generateTimestamp());
			}
			// Should have at least 90% unique (accounting for same millisecond)
			expect(timestamps.size).toBeGreaterThan(90);
		});
	});

	describe('Unique filename generation', () => {
		const getUniqueFileName = async (
			folder: string,
			baseName: string,
			ext: string,
			existingFiles: Set<string>
		): Promise<string> => {
			let fileName = `${folder}/${baseName}.${ext}`;
			let counter = 1;
			while (existingFiles.has(fileName)) {
				fileName = `${folder}/${baseName}-${counter}.${ext}`;
				counter++;
			}
			return fileName;
		};

		it('should return original name if no conflict', async () => {
			const existing = new Set<string>();
			const result = await getUniqueFileName('folder', 'photo', 'jpg', existing);
			expect(result).toBe('folder/photo.jpg');
		});

		it('should add suffix for conflicts', async () => {
			const existing = new Set(['folder/photo.jpg']);
			const result = await getUniqueFileName('folder', 'photo', 'jpg', existing);
			expect(result).toBe('folder/photo-1.jpg');
		});

		it('should increment suffix for multiple conflicts', async () => {
			const existing = new Set([
				'folder/photo.jpg',
				'folder/photo-1.jpg',
				'folder/photo-2.jpg'
			]);
			const result = await getUniqueFileName('folder', 'photo', 'jpg', existing);
			expect(result).toBe('folder/photo-3.jpg');
		});
	});
});
