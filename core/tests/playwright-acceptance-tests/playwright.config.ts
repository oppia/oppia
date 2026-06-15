// Copyright 2024 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Playwright configuration for acceptance tests.
 */

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
    video: 'on-first-retry',
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
