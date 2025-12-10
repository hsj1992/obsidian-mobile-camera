# Advanced Usage Guide

This guide covers advanced features and configuration options for the Mobile Camera & QR Scanner plugin.

## Table of Contents

- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)
- [Use Cases](#use-cases)
- [Tips and Tricks](#tips-and-tricks)

---

## Advanced Configuration

### Custom Save Path Templates

The `{notepath}` variable can be used to create dynamic save paths:

**Examples:**

```
{notepath}/image          # Default: saves in 'image' folder next to current note
{notepath}/attachments    # Saves in 'attachments' folder
Camera                    # Saves in 'Camera' folder at vault root
Daily/images              # Saves in 'Daily/images' at vault root
```

### File Naming Strategies

When "Direct import" is disabled, you can rename photos before saving:

- Use descriptive names for better organization
- Include dates or tags in filenames
- Keep names short for mobile typing

---

## Troubleshooting

### Camera Not Working

**Problem**: Camera doesn't open when clicking "Take Photo"

**Solutions**:
1. Check camera permissions in Android settings
2. Ensure you're using Obsidian mobile (not desktop)
3. Try restarting Obsidian
4. Check if other apps can access the camera

### QR Code Not Detected

**Problem**: QR code scanning fails or shows "No QR code found"

**Solutions**:
1. Ensure good lighting conditions
2. Hold the camera steady
3. Try different distances from the QR code
4. Make sure the QR code is not damaged or blurry
5. Try again - the modal stays open for retry

### Photos Not Saving

**Problem**: Photos are taken but not saved to vault

**Solutions**:
1. Check the save folder path in settings
2. Ensure the folder exists or can be created
3. Check vault permissions
4. Look for error messages in the console (Settings → Developer Tools)

### File Name Conflicts

The plugin automatically handles file name conflicts by adding numeric suffixes:
- `photo.jpg` → `photo-1.jpg` → `photo-2.jpg`

---

## Use Cases

### Daily Journal with Photos

**Scenario**: You want to quickly add photos to your daily notes

**Setup**:
1. Set save folder to: `{notepath}/images`
2. Enable "Direct import" for speed
3. Pin "Camera: Take Photo" command to mobile toolbar

**Workflow**:
1. Open today's daily note
2. Tap the camera icon in toolbar
3. Take photo
4. Photo is automatically inserted

### Project Documentation

**Scenario**: Document project progress with labeled photos

**Setup**:
1. Set save folder to: `Projects/images`
2. Disable "Direct import" to rename photos
3. Use descriptive names like "progress-2024-01-15"

### QR Code Collection

**Scenario**: Collect QR codes from events or products

**Setup**:
1. Pin "Camera: Scan QR Code" to toolbar
2. Create a note for QR code collection
3. Scan codes directly into the note

---

## Tips and Tricks

### Quick Access

Pin commands to the mobile toolbar for one-tap access:
1. Open command palette
2. Long-press on a command
3. Select "Pin to mobile toolbar"

### Batch Photo Taking

For multiple photos:
1. Use "Camera: Main Menu" command
2. Take photo → automatically returns to menu
3. Take another photo
4. Repeat as needed

### Organizing Photos

Create a consistent folder structure:
```
vault/
├── Daily/
│   └── images/
├── Projects/
│   └── images/
└── Reference/
    └── images/
```

Use `{notepath}/images` to automatically organize by context.

### QR Code Best Practices

- Ensure good lighting
- Hold camera steady
- Center the QR code in frame
- Try different distances if first attempt fails
- The modal stays open for retry on failure

---

## Platform-Specific Notes

### Android

- Uses native camera through file input
- Requires camera permission on first use
- Works with all Android versions supported by Obsidian

### iOS

iOS support is not yet implemented. The plugin will show a notice on iOS devices.

---

## Privacy and Security

- All photos are stored locally in your vault
- No data is sent to external servers
- No telemetry or tracking
- Camera access is only used when you trigger commands
- File names are sanitized to prevent path traversal

---

## Performance Tips

- Use "Direct import" for faster workflow
- Keep photo resolution reasonable (camera default is usually fine)
- Regularly organize photos into folders
- Consider using Obsidian's built-in file management for cleanup

---

## Need Help?

- Check the [main README](../README.md) for basic usage
- Report bugs on [GitHub Issues](https://github.com/YOUR_USERNAME/obsidian-mobile-camera/issues)
- Request features through [Feature Requests](https://github.com/YOUR_USERNAME/obsidian-mobile-camera/issues/new?template=feature_request.md)
