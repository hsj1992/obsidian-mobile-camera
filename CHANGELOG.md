# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Normalize non-Error browser promise rejections while preserving existing Error objects.
- Preserve the originating note and selection during photo capture and QR recognition.
- Stop pending UI actions after closing the camera modal or unloading the plugin.
- Build directly to `main.js` on all platforms, including watch mode on Windows.
- Preserve Chinese photo names and remove unsafe filename and link characters.
- Validate persisted settings and register mobile commands independently of mediaDevices.
- Report clipboard failures and saved photos that could not be inserted.
- Decode QR images in a cancellable local worker, with offscreen scaling on supported devices.
- Bound native detection, image loading and worker decoding with timeouts.
- Show a single accurate QR clipboard result and stop waiting after two seconds or modal closure.

### Changed
- Compose the browser test environment with Jest's official abstract environment and jsdom 29, removing whatwg-encoding.
- Migrate to ESLint 10 flat config and typescript-eslint 8 with typed source checks.
- Update Jest 30 and ts-jest patches, remove old rimraf/glob/inflight dependencies and require Node.js 24 for development.
- Replace legacy copied-logic tests with direct production service, modal, selection and lifecycle tests.
- Add production-code regression tests and resolve source lint errors.
- Check lint, tests, builds and version metadata in Windows/Linux CI and before releases.
- Require release tags to exactly match the manifest version and use locked dependency installs.
- Embed the QR worker in the existing main.js release artifact and retain a bounded compatibility fallback.

## [1.0.0] - 2025-12-10

### Added
- Initial release
- Take photos using mobile device camera
- Scan QR codes and insert content into notes
- Customizable save folder path with `{notepath}` template variable
- Optional file rename prompt before saving
- Dual QR code detection strategy (native BarcodeDetector API + jsQR fallback)
- Automatic file name conflict resolution with numeric suffixes
- Path traversal protection for user-provided filenames

### Features
- Three commands: Main Menu, Take Photo, Scan QR Code
- Full-screen camera modal interface
- Support for Android mobile devices
- Local-only processing (no network activity)
- Theme-aware UI using Obsidian CSS variables

### Security
- All photos and data stored locally in vault
- No telemetry or data collection
- Input sanitization to prevent path traversal attacks
