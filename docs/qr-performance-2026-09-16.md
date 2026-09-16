# QR performance verification — 2026-09-16

Device: PJZ110 (`e7d8e5f4`), Android 16 / API 36, Obsidian 1.13.8.
The optimized production bundle was deployed to the same vault as the previous tests.

## Implementation

- Keep native BarcodeDetector as the first recognition path.
- Embed the locally bundled jsQR worker as a string in main.js, without additional
  release files or network access. Create a worker only when native recognition fails.
- Transfer an ImageBitmap on capable devices. The worker uses OffscreenCanvas for
  image scaling, pixel reads and all three decoding scales (maximum dimension 1000).
- Transfer pixel buffers when OffscreenCanvas is unavailable.
- When workers cannot run, use a 600-pixel main-thread compatibility path, yielding
  between scales. That path can still pause and may miss dense or small codes.
- Terminate and release worker resources on completion, failure, timeout or cancellation.
- Native detection timeout: 3 seconds; image loading: 15 seconds; bitmap creation:
  3 seconds; pixel decoding: 5 seconds per scale; bitmap decoding: 15 seconds total.

## Live-device comparison

The old scanner instance was retained in the same WebView before reloading the
optimized plugin. BarcodeDetector was temporarily disabled to exercise jsQR.
Inputs were generated 2400 × 1800 PNGs: a reference QR and seeded grayscale noise.
Inputs remained in memory; measurements did not edit notes.

A 16 ms interval measured the largest timer gap from image loading through scan
completion. This is a proxy for main-thread responsiveness, including loading and
startup costs, rather than a trace of decoder execution alone.

| Input | Old elapsed | New elapsed | Old maximum timer gap | New maximum timer gap | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Reference QR | 338 ms | 442 ms | 338 ms | 92 ms | Correct text in both paths |
| Grayscale noise | 10,900 ms | 9,561 ms | 10,865 ms | 282 ms | No QR in both paths |

These are individual fixture runs, not a statistical benchmark. The intended
improvement is responsiveness while decoding; worker startup can increase the
elapsed time for simple images.

Both optimized scans transferred bitmaps (no main-thread pixel requests), and both
created workers were terminated. The intermediate pixel-only prototype still had
a 200 ms timer gap on the reference QR, motivating offscreen preprocessing.

## Additional device checks

- Cancel after posting an actual noisy image: AbortError returned in 2 ms, with
  one created worker and one termination.
- Block worker construction: compatibility decoding still recognized the reference QR.
- Restore BarcodeDetector: native recognition still recognized the reference QR.
- Temporarily overridden APIs were restored after each test.

Automated tests cover transport, cancellation, timeouts, worker failure, bitmap
cleanup, actual jsQR decoding (normal and inverted images), routing and fallback.
Final local checks passed: 77 plugin tests, 6 release checks, source lint and
production build. A temporary emitted worker marker verified that modifying the
embedded worker source rebuilds main.js in watch mode; removing it rebuilt the
artifact again. The probe was removed before the final production build.
