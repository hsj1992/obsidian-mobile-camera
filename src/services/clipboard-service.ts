import { throwIfAborted, waitForScan } from './scan-control';

/** Copying is optional: failure must not undo the recognized note text. */
export async function copyQrText(text: string, signal?: AbortSignal): Promise<boolean> {
	throwIfAborted(signal);
	try {
		if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false;
		await waitForScan(navigator.clipboard.writeText(text), signal, 2000);
		throwIfAborted(signal);
		return true;
	} catch {
		throwIfAborted(signal);
		return false;
	}
}
