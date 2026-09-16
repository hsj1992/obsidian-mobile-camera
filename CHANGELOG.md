# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Preserve the originating note and selection during photo capture and QR recognition.
- Stop pending UI actions after closing the camera modal or unloading the plugin.
- Build directly to `main.js` on all platforms, including watch mode on Windows.
- Preserve Chinese photo names and remove unsafe filename and link characters.
- Validate persisted settings and register mobile commands independently of mediaDevices.
- Report clipboard failures and saved photos that could not be inserted.

### Changed
- Add production-code regression tests and resolve source lint errors.

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
