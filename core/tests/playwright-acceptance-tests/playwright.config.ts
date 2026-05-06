import {defineConfig, devices} from '@playwright/test';

const isMobile = process.env.MOBILE === 'true';

export default defineConfig({
  testDir: './specs',
  timeout: 120000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8181',
    headless: process.env.HEADLESS !== 'false',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on',
  },
  projects: isMobile
    ? [
        {
          name: 'mobile-chrome',
          use: {...devices['Pixel 7'], video: 'on'},
        },
      ]
    : [
        {
          name: 'chromium',
          use: {...devices['Desktop Chrome'], video: 'on'},
        },
      ],
});
