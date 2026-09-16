import { sanitizeFilename } from '../src/services/filename';

describe('Filename sanitization', () => {
	it.each([
		['会议照片', '会议照片'],
		['My Photo-123_test.jpg', 'My Photo-123_test.jpg'],
		['file/name\\photo:*?"<>|', 'filenamephoto'],
		['name[photo]#heading^block', 'namephotoheadingblock'],
		['file\u0000\u001f\u007fname', 'filename'],
		['  .photo.  ', 'photo'],
		['../../', ''],
		['///***', '']
	])('sanitizes %s using production code', (input, expected) => {
		expect(sanitizeFilename(input)).toBe(expected);
	});
});
