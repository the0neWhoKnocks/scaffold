import eslint from "@eslint/js";
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig } from 'eslint/config';
import nodePlugin from 'eslint-plugin-n';
//TOKEN:^LINT__SVELTE
import sveltePlugin from 'eslint-plugin-svelte';
//TOKEN:$LINT__SVELTE
import globals from 'globals';

export default defineConfig([
  {
    extends: [
      eslint.configs.recommended,
      nodePlugin.configs['flat/recommended-script'],
      stylistic.configs.recommended,
      //TOKEN:^LINT__SVELTE
      sveltePlugin.configs.recommended,
      //TOKEN:$LINT__SVELTE
    ],
    files: [
      '**/*.cjs',
      '**/*.js',
      '**/*.mjs',
      //TOKEN:^LINT__SVELTE
      '**/*.svelte',
      '**/*.svelte.js',
      //TOKEN:$LINT__SVELTE
    ],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    name: 'app-lint', // Used in error messages and config inspector to help identify which configuration object is being used.
    rules: {
      '@stylistic/comma-dangle': ['error', {
        arrays: 'always-multiline',
        exports: 'always-multiline',
        functions: 'only-multiline',
        imports: 'always-multiline',
        objects: 'always-multiline',
      }],
      '@stylistic/keyword-spacing': ['error', { after: true, before: true }],
      '@stylistic/space-before-blocks': ['error', 'always'],
      'n/hashbang': 'off',
      'n/no-extraneous-import': ['error', {
        allowModules: [
          '@eslint/js',
        ],
      }],
      //TOKEN:^LINT__SVELTE
      'n/no-missing-import': ['error', {
        allowModules: [
          'svelte', // NOTE: There's a known issue where new modules with an `exports` section don't resolve in eslint: https://github.com/import-js/eslint-plugin-import/issues/1810
          'svelte-portal',
        ],
      }],
      'n/no-missing-require': ['error', {
        allowModules: [
          'svelte', // NOTE: There's a known issue where new modules with an `exports` section don't resolve in eslint: https://github.com/import-js/eslint-plugin-import/issues/1810
        ],
      }],
      //TOKEN:$LINT__SVELTE
      'n/no-unpublished-import': 'off',
      'n/no-unpublished-require': 'off',
      'n/no-process-exit': 'off',
      'no-unused-vars': ['error', {
        args: 'after-used',
        argsIgnorePattern: "^_$",
      }],
    },
  },
]);
