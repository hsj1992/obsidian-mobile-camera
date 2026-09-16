# Contributing to Mobile Camera & QR Scanner

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Development Setup

### Prerequisites
- Node.js 24 (the version used in CI)
- npm
- An Obsidian vault for testing

### Getting Started

1. Fork and clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/obsidian-mobile-camera.git
cd obsidian-mobile-camera
```

2. Install dependencies
```bash
npm ci
```

3. Build the plugin
```bash
npm run build
```

4. For development with auto-rebuild
```bash
npm run dev
```

### Testing

To test your changes:

Run `npm run check` to validate release metadata, lint the source, run both test
suites, and build the plugin. CI runs this command on Windows and Linux.

1. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's `.obsidian/plugins/mobile-camera-qr-plugin/` directory
2. Reload Obsidian
3. Enable the plugin in Settings → Community Plugins

For mobile testing, you'll need to test on an actual Android device with Obsidian mobile installed.

### Release checks

Keep the versions in `package.json` and `manifest.json` identical. Map that version
to `manifest.minAppVersion` in `versions.json`. Before creating a release tag, run
`npm run validate:release -- 1.0.0`, substituting the intended version.
The tag must exactly match the manifest version, without a leading `v`.
The release workflow runs the complete checks before publishing and fails if a
required asset is missing.

To verify the release workflow without publishing, run **Release Obsidian Plugin**
from GitHub Actions with the intended version. Manual runs validate the exact
version, run all checks and upload the three release artifacts. Only tag pushes
create a GitHub Release.

## Code Style

`npm run lint` uses `eslint.config.mjs` (ESLint flat config) and type-aware
typescript-eslint rules for `src/**/*.ts`. Generated bundles, coverage output and
dependencies are ignored. Use the project's installed tools rather than a global
ESLint installation. Node.js 24 is required for the development toolchain.

- Use TypeScript strict mode
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and concise

## Making Changes

### Before You Start

1. Check existing issues to avoid duplicate work
2. For major changes, open an issue first to discuss
3. Create a new branch for your feature/fix

### Commit Guidelines

- Write clear, descriptive commit messages
- Use present tense ("Add feature" not "Added feature")
- Reference issue numbers when applicable

### Pull Request Process

1. Update documentation if needed
2. Add your changes to CHANGELOG.md under "Unreleased"
3. Ensure all checks pass (`npm run check`)
4. Test on mobile if possible
5. Submit a pull request with a clear description

## Reporting Issues

When reporting bugs, please include:

- Obsidian version
- Plugin version
- Device and OS version (for mobile issues)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## Feature Requests

Feature requests are welcome! Please:

- Check if the feature already exists or is planned
- Describe the use case clearly
- Explain why it would benefit users

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on what's best for the community

## Questions?

Feel free to open an issue for questions or discussions.

Thank you for contributing! 🎉
