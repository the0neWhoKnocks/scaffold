module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
  ],
  overrides: [
    //TOKEN:^LINT__SVELTE
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
    },
    //TOKEN:$LINT__SVELTE
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: [
    //TOKEN:^LINT__SVELTE
    'svelte3',
    //TOKEN:$LINT__SVELTE
  ],
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
    'node/no-unpublished-import': ['error', {
      //TOKEN:^LINT__SVELTE
      allowModules: ['svelte'],
      //TOKEN:$LINT__SVELTE
    }],
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
