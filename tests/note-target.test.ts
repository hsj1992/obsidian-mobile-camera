import { App, MarkdownView } from 'obsidian';
import { NoteTarget } from '../src/services/note-target';
import { MockApp, MockMarkdownView } from './mocks/obsidian';

function setup() {
	const app = new MockApp(), view = new MockMarkdownView(); app.workspace.setActiveView(view);
	return { app, view, capture: () => new NoteTarget(app as unknown as App, view as unknown as MarkdownView) };
}

describe('Original note insertion target', () => {
	it('replaces the original selection even if the cursor subsequently moves', () => {
		const { view, capture } = setup(); view.editor.replaceSelection('First\nselected\nLast');
		view.editor.setSelection({ line: 1, ch: 0 }, { line: 1, ch: 8 });
		const target = capture(); view.editor.setSelection({ line: 2, ch: 4 });
		target.insert('![[photo.png]]');
		expect(view.editor.getContent()).toBe('First\n![[photo.png]]\nLast');
	});
	it('inserts at the captured cursor on a later line', () => {
		const { view, capture } = setup(); view.editor.replaceSelection('First\nLast');
		view.editor.setSelection({ line: 1, ch: 2 });
		const target = capture(); view.editor.setSelection({ line: 0, ch: 0 });
		target.insert('QR'); expect(view.editor.getContent()).toBe('First\nLaQRst');
	});
	it('rejects a different file opened in the original view', () => {
		const { view, capture } = setup(); const target = capture();
		view.file = { parent: { path: 'other' }, path: 'other/note.md' };
		expect(() => target.insert('QR')).toThrow('original note was closed');
		expect(view.editor.getContent()).toBe('');
	});
});
