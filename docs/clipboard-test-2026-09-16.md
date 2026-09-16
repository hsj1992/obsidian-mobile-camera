# QR clipboard verification — 2026-09-16

Device: PJZ110 (`e7d8e5f4`), Android 16, Obsidian 1.13.8.
The updated production bundle was deployed and the plugin reloaded through CDP.
Tests used a new Clipboard note inside the existing isolated device-test folder.
Existing notes were not edited, and persisted plugin settings were preserved.

## Changes

- Keep successful QR insertion independent of optional copying.
- Report copying success or failure with exactly one notice.
- Stop waiting after two seconds, including when clipboard.writeText never settles.
- Closing the modal aborts the wait and suppresses late notices.

## Live-device results

| Scenario | Inserted text | Notice | Modal |
| --- | --- | --- | --- |
| Injected NotAllowedError | Preserved, inserted once | One copy-failure notice | Released |
| Clipboard API unavailable | Preserved, inserted once | One copy-failure notice | Released |
| Clipboard promise never settles | Preserved, inserted once | One copy-failure notice after timeout | Released |
| Real system clipboard write | Inserted once, clipboard contents matched the reference QR | One copy-success notice | Released |
| Close while waiting | Preserved | No late notice; wait stopped in 5 ms | Released |

The denied, missing and hanging cases used temporary API overrides in the actual
Obsidian WebView. The denial case returned the documented NotAllowedError; no Android
permission setting was revoked. Overrides and the original auto-copy setting were
restored after testing. The real-copy check used the unmodified system API.

Clipboard writes have no cancellation parameter. Aborting or timing out stops the
plugin's wait; it cannot undo an already-started OS write, which can complete later.

## Automated verification

Eight new tests cover denied access, missing API, successful copy, disabled copying,
timeout, closure during copying, failed note insertion and an already-aborted request.
All 85 plugin tests, 6 release checks, source lint and production build passed.

API reference: [Clipboard.writeText](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText).
