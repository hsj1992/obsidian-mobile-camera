import { RenameModal } from '../src/rename-modal';
import { MockApp } from './mocks/obsidian';

describe('RenameModal', () => {
	let mockApp: MockApp;

	beforeEach(() => {
		mockApp = new MockApp();
	});

	it('should resolve with input value when Save is clicked', async () => {
		const defaultName = 'test-photo';
		const promise = new Promise<string | null>((resolve) => {
			const modal = new RenameModal(mockApp as any, defaultName, resolve);
			modal.onOpen();

			// Simulate user input
			const input = modal.contentEl.querySelector('input') as HTMLInputElement;
			input.value = 'new-name';

			// Simulate Save button click
			const saveButton = Array.from(modal.contentEl.querySelectorAll('button'))
				.find(btn => btn.textContent === 'Save') as HTMLButtonElement;
			saveButton.click();
		});

		const result = await promise;
		expect(result).toBe('new-name');
	});

	it('should resolve with null when Cancel is clicked', async () => {
		const defaultName = 'test-photo';
		const promise = new Promise<string | null>((resolve) => {
			const modal = new RenameModal(mockApp as any, defaultName, resolve);
			modal.onOpen();

			// Simulate Cancel button click
			const cancelButton = Array.from(modal.contentEl.querySelectorAll('button'))
				.find(btn => btn.textContent === 'Cancel') as HTMLButtonElement;
			cancelButton.click();
		});

		const result = await promise;
		expect(result).toBe(null);
	});

	it('should resolve with null when modal is closed without button click', async () => {
		const defaultName = 'test-photo';
		const promise = new Promise<string | null>((resolve) => {
			const modal = new RenameModal(mockApp as any, defaultName, resolve);
			modal.onOpen();

			// Simulate modal close (ESC key or backdrop click)
			modal.onClose();
		});

		const result = await promise;
		expect(result).toBe(null);
	});

	it('should initialize input with default name', () => {
		const defaultName = 'default-photo-name';
		let inputValue = '';

		new Promise<string | null>((resolve) => {
			const modal = new RenameModal(mockApp as any, defaultName, resolve);
			modal.onOpen();

			const input = modal.contentEl.querySelector('input') as HTMLInputElement;
			inputValue = input.value;

			modal.onClose();
			resolve(null);
		});

		expect(inputValue).toBe(defaultName);
	});

	it('should not resolve twice when Save is clicked then modal is closed', async () => {
		const defaultName = 'test-photo';
		let resolveCount = 0;

		const promise = new Promise<string | null>((resolve) => {
			const wrappedResolve = (value: string | null) => {
				resolveCount++;
				resolve(value);
			};

			const modal = new RenameModal(mockApp as any, defaultName, wrappedResolve);
			modal.onOpen();

			// Click Save
			const saveButton = Array.from(modal.contentEl.querySelectorAll('button'))
				.find(btn => btn.textContent === 'Save') as HTMLButtonElement;
			saveButton.click();

			// Then close modal
			modal.onClose();
		});

		await promise;
		expect(resolveCount).toBe(1);
	});
});
