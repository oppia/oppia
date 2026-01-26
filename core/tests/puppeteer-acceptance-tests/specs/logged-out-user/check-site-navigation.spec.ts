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

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Site Navigation', function () {
  let guestUser;

  beforeAll(async function () {
    guestUser = await UserFactory.createNewUser(
      'guestuser',
      'guest_user@example.com'
    );
    // Standard Oppia logout is sufficient for CI servers.
    await guestUser.logout();
  }, DEFAULT_SPEC_TIMEOUT);

  // SE.1 Crawl the main Oppia pages
  it(
    'should crawl the main Oppia pages successfully',
    async function () {
      const baseUrl = testConstants.URLs.BaseURL;

      const pagesToCrawl = [
        baseUrl,
        `${baseUrl}/about`,
        `${baseUrl}/get-started`,
        `${baseUrl}/donate`,
        `${baseUrl}/contact`,
        `${baseUrl}/thanks`,
        `${baseUrl}/privacy-policy`,
        `${baseUrl}/terms`,
      ];

      for (const pageUrl of pagesToCrawl) {
        // Optimization: Wait for DOM content only to speed up tests.
        await guestUser.page.goto(pageUrl, {waitUntil: 'domcontentloaded'});
        await guestUser.page.waitForSelector('body');
      }
    },
    DEFAULT_SPEC_TIMEOUT
  );

  // SE.2 Crawl the study guides
  it(
    'should crawl the study guides successfully',
    async function () {
      const baseUrl = testConstants.URLs.BaseURL;

      const studyGuides = [`${baseUrl}/android-study-guide`];

      for (const guideUrl of studyGuides) {
        await guestUser.page.goto(guideUrl, {waitUntil: 'domcontentloaded'});
        await guestUser.page.waitForSelector('body');
      }
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
