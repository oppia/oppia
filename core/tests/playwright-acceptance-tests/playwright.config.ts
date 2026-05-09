import {defineConfig, devices} from '@playwright/test';

const isMobile = process.env.MOBILE === 'true';
const isCI = process.env.PROD_ENV === 'true';

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
    },
    timeout: 10000,
  },
  testDir: './specs',
  timeout: 300000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8181',
    headless: process.env.HEADLESS !== 'false',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on',
  },
  snapshotPathTemplate:
    '{testDir}/{testFileDir}/{projectName}-screenshots/{arg}{ext}',
  projects: isMobile
    ? [
        {
          name: isCI ? 'prod-mobile' : 'dev-mobile',
          use: {...devices['Pixel 7'], video: 'on'},
        },
      ]
    : [
        {
          name: isCI ? 'prod-desktop' : 'dev-desktop',
          use: {...devices['Desktop Chrome'], video: 'on'},
        },
      ],
});
