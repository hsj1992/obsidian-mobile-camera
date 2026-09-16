import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function validateRelease({ manifest, packageJson, versions, tag }) {
	if (!versionPattern.test(manifest.version)) {
		throw new Error('manifest.version must use x.y.z without a v prefix');
	}
	if (!versionPattern.test(manifest.minAppVersion)) {
		throw new Error('manifest.minAppVersion must use x.y.z');
	}
	if (packageJson.version !== manifest.version) {
		throw new Error('package.json version does not match manifest.json');
	}
	if (versions[manifest.version] !== manifest.minAppVersion) {
		throw new Error('versions.json must map this version to manifest.minAppVersion');
	}
	if (tag !== undefined && tag !== manifest.version) {
		throw new Error(`Release tag ${tag} must exactly match ${manifest.version} (no v prefix)`);
	}
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
	try {
		const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
		const tag = process.argv[2] ?? (process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : undefined);
		if (process.env.GITHUB_REF_TYPE === 'tag' && !tag) throw new Error('Missing release tag');
		validateRelease({
			manifest: readJson('manifest.json'),
			packageJson: readJson('package.json'),
			versions: readJson('versions.json'),
			tag
		});
		console.log('Release versions validated' + (tag === undefined ? '' : ` for tag ${tag}`));
	} catch (error) {
		console.error(`Release validation failed: ${error.message}`);
		process.exitCode = 1;
	}
}
