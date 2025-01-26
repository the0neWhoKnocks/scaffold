import { defineConfig, devices } from '@playwright/test';

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  expect: {
    // Maximum time expect() should wait for the condition to be met.
    timeout: 1000,
  },
  
  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,
  
  // Run all tests in parallel.
  fullyParallel: true,
  
  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: 'artifacts',
  
  // Configure projects for major browsers.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
  
  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'reports' }],
    ['list'],
  ],
  
  // Look for test files in the "tests" directory, relative to this configuration file.
  testDir: 'tests',
  // Glob patterns or regular expressions that match test files.
  testMatch: '*.test.js',
  
  // // If tests take longer that X seconds, it should fail.
  // timeout: 2000,
  
  use: {
    // For things like `click`
    actionTimeout: 2000,
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: process.env.BASE_URL,
    // bypass having to create certs just for the test container
    ignoreHTTPSErrors: true,
    // Collect trace when retrying the failed test.
    trace: 'on-first-retry',
  },
  
  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,
});
