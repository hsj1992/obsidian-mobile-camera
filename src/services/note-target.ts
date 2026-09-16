import { App, EditorPosition, MarkdownView, TFile } from 'obsidian';

/** Preserve the originating note and selection across native camera dialogs. */
export class NoteTarget {
	private content: string;
	private from: EditorPosition;
	private to: EditorPosition;
	readonly file: TFile;

	constructor(private app: App, private view: MarkdownView) {
		if (!view.file) throw new Error('Open a note first');
		this.file = view.file;
		this.content = view.editor.getValue();
		this.from = view.editor.getCursor('from');
		this.to = view.editor.getCursor('to');
	}

	assertAvailable() {
		let attached = false;
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view === this.view) attached = true;
		});
		if (!attached || this.view.file !== this.file) {
			throw new Error('The original note was closed. Try again from the note.');
		}
		if (this.view.editor.getValue() !== this.content) {
			throw new Error('The original note changed. Try again to choose a new insertion position.');
		}
	}

	insert(text: string) {
		this.assertAvailable();
		this.view.editor.replaceRange(text, this.from, this.to);
	}
}
