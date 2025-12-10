// Test setup file
import '@testing-library/jest-dom';

// Mock Obsidian globals
global.Platform = {
	isMobile: true,
	isDesktop: false,
	isDesktopApp: false,
	isMobileApp: true
};

// Mock navigator
(global as any).navigator = {
	userAgent: 'Mozilla/5.0 (Android)',
	mediaDevices: {},
	getUserMedia: () => {}
};

// Mock window.BarcodeDetector
(global as any).BarcodeDetector = class MockBarcodeDetector {
	constructor() {}
	async detect() {
		return [];
	}
};
