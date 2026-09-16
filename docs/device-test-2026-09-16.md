# Android device verification — 2026-09-16

Device: PJZ110 (`e7d8e5f4`), Android 16 / API 36, Obsidian 1.13.8.
Vault: `Documents/Obsidian/Obsidian`.
Isolated test notes: `Mobile camera test 20260916-1720/A.md` and `B.md`.

The production bundle was deployed via ADB after backing up the installed plugin.
The original plugin settings were preserved. Verification used the device's live
Obsidian WebView via its local debugging connection. No existing note contents
were used for these tests.

## Passed

- New plugin loaded and all three stable command IDs registered.
- Camera menu opened, duplicate commands were ignored, and cancellation released modal tracking.
- A generated PNG passed through the real file-save handler, saved in A's image folder,
  and inserted into A even after switching to B. B remained unchanged.
- A generated QR image was decoded and inserted into A using the real QR handler.
- Disabling BarcodeDetector temporarily exercised successful jsQR fallback decoding.
- Closing during file reading prevented a new photo and note insertion.
- Closing immediately before a pending read resolved also prevented new writes.
- Disabling the plugin closed the modal and cleared tracking; enabling it again succeeded.
- Local checks: 60 tests passed, source lint passed, production build passed.
- User confirmed successful native photo capture and insertion, physical QR capture
  and recognition, and no reported permission or cancellation problems.

## Fix discovered on device

Obsidian delays `onClose` until its closing animation finishes. Cancellation is now
marked synchronously in `close`, preventing late results during that animation.
A regression test simulates delayed `onClose`, and the updated bundle was verified
again on the device.

## Clipboard follow-up

Real copying and failure handling have since been verified in the live device's
WebView. Denial was injected as NotAllowedError, without changing Android's actual
permission settings. See [clipboard verification](clipboard-test-2026-09-16.md).

The generated-file checks verify the real WebView and plugin processing paths;
native camera integration was additionally confirmed by the user's physical tests.
An already-started vault write cannot be cancelled; closing prevents subsequent
note insertion.
