import playwright from 'eslint-plugin-playwright';

export default [{
  ...playwright.configs['flat/recommended'],
  files: ['tests/**'],
  rules: {
    'n/no-missing-import': ['error', {
      allowModules: [
        '@playwright/test', // NOTE: There's a known issue where new modules with an `exports` section don't resolve in eslint: https://github.com/import-js/eslint-plugin-import/issues/1810
      ],
    }],
    'n/no-unsupported-features/node-builtins': ['error', {
      'ignores': [
        'localStorage',
        'navigator',
        'sessionStorage',
      ],
    }],
    'playwright/expect-expect': ['error', {
      assertFunctionNames: [
        'inputAdminConfig',
        'switchToPage',
        'verifyLogMsgs',
      ],
    }],
    'playwright/no-conditional-expect': 'off',
    'playwright/no-conditional-in-test': 'off',
    'playwright/no-nested-step': 'off',
  },
}];
