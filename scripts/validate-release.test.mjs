import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { validateRelease } from './validate-release.mjs';

const release = () => ({
	manifest: { version: '1.2.3', minAppVersion: '0.15.0' },
	packageJson: { version: '1.2.3' },
	versions: { '1.2.3': '0.15.0' },
	tag: '1.2.3'
});

test('accepts aligned metadata and an exact release tag', () => {
	assert.doesNotThrow(() => validateRelease(release()));
});

test('blocks a tag for the wrong version or one with a v prefix', () => {
	for (const tag of ['1.2.4', 'v1.2.3', '']) {
		assert.throws(() => validateRelease({ ...release(), tag }), /Release tag/);
	}
});

test('blocks a package version that was bumped without its manifest', () => {
	assert.throws(() => validateRelease({ ...release(), packageJson: { version: '1.2.4' } }), /package.json/);
});

test('blocks missing or stale minimum app mappings', () => {
	for (const versions of [{}, { '1.2.3': '1.0.0' }]) {
		assert.throws(() => validateRelease({ ...release(), versions }), /versions.json/);
	}
});

test('blocks invalid manifest versions', () => {
	for (const version of ['v1.2.3', '01.2.3', '1.2', '1.2.3-beta.1']) {
		assert.throws(() => validateRelease({ ...release(), manifest: { ...release().manifest, version } }), /manifest.version/);
	}
});

test('CLI fails on mismatched GitHub tag but accepts branch checks', () => {
	const directory = mkdtempSync(join(tmpdir(), 'camera-release-'));
	try {
		const data = release();
		for (const [name, value] of [['manifest.json', data.manifest], ['package.json', data.packageJson], ['versions.json', data.versions]]) {
			writeFileSync(join(directory, name), JSON.stringify(value));
		}
		const script = fileURLToPath(new URL('./validate-release.mjs', import.meta.url));
		const run = (type, name) => spawnSync(process.execPath, [script], {
			cwd: directory, encoding: 'utf8', env: { ...process.env, GITHUB_REF_TYPE: type, GITHUB_REF_NAME: name }
		});
		assert.equal(run('tag', '1.2.3').status, 0);
		const rejected = run('tag', 'v1.2.3');
		assert.equal(rejected.status, 1);
		assert.match(rejected.stderr, /Release tag/);
		assert.equal(run('branch', 'master').status, 0);
		assert.equal(run('tag', '').status, 1);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
