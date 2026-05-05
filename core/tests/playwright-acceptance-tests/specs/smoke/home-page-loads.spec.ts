// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/** @fileoverview Basic Playwright smoke test for Oppia home page. */

import {test, expect} from '@playwright/test';

test.describe('Home Page', () => {
  test('home page loads', async ({page}) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Oppia/);
  });

  test('navigate to about page', async ({page}) => {
    await page.goto('/');
    await page.getByRole('link', {name: 'About'}).click();
    await expect(page).toHaveURL(/about/);
  });
});
