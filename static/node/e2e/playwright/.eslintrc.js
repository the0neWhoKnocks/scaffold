module.exports = {
  extends: [
    'plugin:playwright/recommended',
  ],
  overrides: [
    {
      files: 'tests/**',
    },
  ],
  rules: {
    'node/no-missing-import': ['error', {
      allowModules: [
        '@playwright/test', // NOTE: There's a known issue where new modules with an `exports` section don't resolve in eslint: https://github.com/import-js/eslint-plugin-import/issues/1810
        '@src/constants', // NOTE: mapped from `docker-compose` file
      ],
    }],
    'playwright/expect-expect': ['error', {
      assertFunctionNames: [
        'inputAdminConfig',
        'switchToPage',
        'verifyPageTitle',
        'verifyLogMsgs',
      ],
    }],
  },
};
