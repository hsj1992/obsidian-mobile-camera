import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default defineConfig([
	{ ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'main.js', '**/*.map'] },
	{
		files: ['src/**/*.ts'],
		extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				project: './tsconfig.json',
				tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
			},
		},
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
			'@typescript-eslint/ban-ts-comment': 'off',
			'no-prototype-builtins': 'off',
			'@typescript-eslint/no-empty-function': 'off',
		},
	},
]);
