export function sanitizeFilename(name: string): string {
	return name.trim()
		.split('').filter((character) => character.charCodeAt(0) > 31 && character.charCodeAt(0) !== 127).join('')
		.replace(/[/\\:*?"<>|[\]#^]/g, '')
		.replace(/\.{2,}/g, '')
		.replace(/^[. ]+|[. ]+$/g, '');
}
