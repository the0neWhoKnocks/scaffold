module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: 'eslint:recommended',
  overrides: [
    //{TOKEN:^LINT__SVELTE}
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
    }
    //{TOKEN:$LINT__SVELTE}
  ],
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  plugins: [
    //{TOKEN:^LINT__SVELTE}
    'svelte3',
    //{TOKEN:$LINT__SVELTE}
  ],
};
