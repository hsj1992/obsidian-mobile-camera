# Mobile Camera & QR Scanner Plugin for Obsidian

[中文文档](README_zh.md)

An Obsidian plugin designed for mobile devices, providing camera photo capture and QR code recognition functionality.

## Features

- 📷 **Take Photos**: Use the rear camera to take photos and insert them into notes
- 🔍 **Capture QR Codes**: Take photos of QR codes and insert the recognized content into notes
- 📁 **Flexible Storage**: Support for custom save path templates
- ✏️ **File Naming**: Optional file rename prompt
- 📱 **Mobile Only**: Currently supports Android devices (iOS support is not yet implemented)

## Screenshots

<!-- Add screenshots/GIFs/videos here to demonstrate the plugin in action -->

## Installation

### Method 1: From Release (Recommended)

1. Go to the [Releases](https://github.com/hsj1992/obsidian-mobile-camera/releases) page
2. Download the latest release files (`main.js`, `manifest.json`, and `styles.css` if available)
3. Create a folder named `mobile-camera-qr-plugin` in your vault's `.obsidian/plugins/` directory
4. Copy the downloaded files into the `mobile-camera-qr-plugin` folder
5. Reload Obsidian and enable the plugin in Settings → Community plugins

### Method 2: Manual Build

1. Download or clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. Copy `main.js` and `manifest.json` to your vault's `.obsidian/plugins/mobile-camera-qr-plugin/` directory
5. Enable the plugin in Obsidian settings

### Method 3: Development Mode

1. Clone this repository to your vault's `.obsidian/plugins/` directory
2. Run `npm install`
3. Run `npm run dev` to start development mode (auto-watch for file changes)
4. Enable the plugin in Obsidian settings

## Usage

The plugin provides three commands:

1. **Camera: Main Menu** - Open the main menu to choose between taking a photo or capturing a QR code
2. **Camera: Take Photo** - Directly enter photo mode
3. **Camera: Capture QR Code** - Directly take a photo to recognize QR code

### Quick Start

1. Open a note
2. Search for the above commands in the command palette, or pin command shortcuts in the mobile toolbar for quick access
3. Choose to take a photo or capture a QR code
4. After taking a photo, the image will be automatically saved and inserted into the note
5. After capturing a QR code photo, the recognized content will be automatically inserted into the note

### Use Case Examples

#### 📝 Daily Journal with Photos

**Scenario**: Quickly add photos to your daily notes

1. Open today's daily note
2. Tap the camera command (pin it to toolbar for quick access)
3. Take a photo of your meal, workspace, or anything noteworthy
4. Photo is automatically inserted with `![[image.jpg]]` syntax

**Tip**: Enable "Direct import" in settings for fastest workflow

#### 📦 Product Documentation

**Scenario**: Document products with QR codes and photos

1. Create a note for the product
2. Use "Capture QR Code" to take a photo and recognize product information
3. Use "Take Photo" to capture product images
4. All content is automatically inserted into your note

**Tip**: Disable "Direct import" to rename photos with descriptive names

#### 🎫 Event Collection

**Scenario**: Collect QR codes from tickets, business cards, or posters

1. Create a collection note (e.g., "Conference 2024")
2. Use "Capture QR Code" command repeatedly
3. Each recognized QR code content is inserted as text
4. Add your own notes between captures

#### 📚 Research Notes

**Scenario**: Capture book pages, whiteboards, or documents

1. Open your research note
2. Use "Take Photo" to capture content
3. Photos are saved in `{notepath}/image` by default
4. Organize by customizing the save folder path

**Tip**: Use `{notepath}/attachments` to keep photos organized by note location

---

For more advanced usage, see the [Advanced Guide](docs/advanced.md).

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

- **Camera Permission**: This plugin requires access to the device camera to take photos and capture QR codes
- When first used, Android will request camera permission; please allow it to use this plugin

### Privacy Policy

This plugin highly values your privacy:

- ✅ **Local Storage**: All photos and recognized QR code content are saved only in your local Obsidian vault
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

## QR Code Recognition

The plugin uses a dual strategy for QR code recognition from photos:

1. Prioritizes the native `BarcodeDetector` API (if the browser supports it)
2. Falls back to the jsQR library for multi-scale image processing

This ensures optimal compatibility and performance across different devices.

## License

MIT
