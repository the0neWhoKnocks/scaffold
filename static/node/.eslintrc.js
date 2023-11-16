module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:svelte/recommended',
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: [],
  rules: {
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      exports: 'always-multiline',
      functions: 'only-multiline',
      imports: 'always-multiline',
      objects: 'always-multiline',
    }],
    'keyword-spacing': ['error', { after: true, before: true }],
    'no-process-exit': 'off',
    'no-unused-vars': ['error', { args: 'after-used' }],
    //TOKEN:^LINT__SVELTE
    'node/no-missing-import': ['error', {
      allowModules: [
        'svelte', // NOTE: There's a known issue where new modules with an `exports` section don't resolve in eslint: https://github.com/import-js/eslint-plugin-import/issues/1810
      ],
    }],
    'node/no-missing-require': ['error', {
      allowModules: [
        'svelte', // NOTE: There's a known issue where new modules with an `exports` section don't resolve in eslint: https://github.com/import-js/eslint-plugin-import/issues/1810
      ],
    }],
    //TOKEN:$LINT__SVELTE
    'node/no-unpublished-import': 'off',
    'node/no-unpublished-require': 'off',
    'node/no-unsupported-features/es-syntax': ['error', {
      version: '>=14.16.1',
      ignores: [
        'dynamicImport', // WP imports
        'modules', // allow for import/export statements
      ],
    }],
    'node/no-unsupported-features/node-builtins': ['error', {
      version: '>=14.16.1',
      ignores: ['inspector'],
    }],
    'node/shebang': 'off',
    'space-before-blocks': ['error', 'always'],
  },
};
