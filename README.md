# Mobile Camera & QR Scanner Plugin for Obsidian

[中文文档](README_zh.md)

An Obsidian plugin designed for mobile devices, providing camera photo capture and QR code scanning functionality.

## Features

- 📷 **Take Photos**: Use the rear camera to take photos and insert them into notes
- 🔍 **Scan QR Codes**: Scan QR codes and insert the content into notes
- 📁 **Flexible Storage**: Support for custom save path templates
- ✏️ **File Naming**: Optional file rename prompt
- 📱 **Mobile Only**: Currently supports Android devices

## Screenshots

<!-- Add screenshots/GIFs/videos here to demonstrate the plugin in action -->

## Installation

### Method 1: Manual Installation

1. Download or clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. Copy `main.js` and `manifest.json` to your vault's `.obsidian/plugins/mobile-camera/` directory
5. Enable the plugin in Obsidian settings

### Method 2: Development Mode

1. Clone this repository to your vault's `.obsidian/plugins/` directory
2. Run `npm install`
3. Run `npm run dev` to start development mode (auto-watch for file changes)
4. Enable the plugin in Obsidian settings

## Usage

The plugin provides three commands:

1. **Camera: Main Menu** - Open the main menu to choose between taking a photo or scanning a QR code
2. **Camera: Take Photo** - Directly enter photo mode
3. **Camera: Scan QR Code** - Directly enter QR code scanning mode

### Steps to Use

1. Open a note
2. Search for the above commands in the command palette, or pin command shortcuts in the mobile toolbar for quick access
3. Choose to take a photo or scan a QR code
4. After taking a photo, the image will be automatically saved and inserted into the note
5. After successfully scanning a QR code, the content will be automatically inserted into the note

## Configuration Options

You can configure the following in the plugin settings:

- **Save folder**: Photo save path template
  - Default: `{notepath}/image`
  - `{notepath}` will be replaced with the current note's directory
  - Examples: `Camera` or `{notepath}/attachments`

- **Direct import**: Whether to import directly
  - Enabled: Photos are saved directly after capture, using a timestamp as the filename
  - Disabled: Prompt for a filename after taking a photo

## Privacy & Permissions

### Permissions

- **Camera Permission**: This plugin requires access to the device camera to take photos and scan QR codes
- When first used, Android will request camera permission; please allow it to use this plugin

### Privacy Policy

This plugin highly values your privacy:

- ✅ **Local Storage**: All photos and scan results are saved only in your local Obsidian vault
- ✅ **No Network Activity**: This plugin does not send data to any external servers
- ✅ **No Data Collection**: No usage data or analytics are collected
- ✅ **No Telemetry**: No tracking or statistics code is included
- ✅ **Open Source Transparency**: All code is publicly available for review

Your photos and data are completely under your control and never leave your device.

## Tech Stack

- TypeScript
- Obsidian API
- jsQR - QR code decoding library
- esbuild - Fast build tool
- Web APIs (File Input with camera capture)

## Development

```bash
# Install dependencies
npm install

# Development mode (auto-watch for file changes)
npm run dev

# Production build
npm run build
```

## Build Notes

This project uses esbuild as the build tool, which is faster and lighter than traditional Rollup or Webpack.

- Development mode generates code with sourcemaps for easier debugging
- Production mode performs code minification and tree-shaking optimization

## QR Code Scanning

The plugin uses a dual strategy for QR code scanning:

1. Prioritizes the native `BarcodeDetector` API (if the browser supports it)
2. Falls back to the jsQR library for multi-scale image processing

This ensures optimal compatibility and performance across different devices.

## License

MIT
