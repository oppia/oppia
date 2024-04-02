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
 * @fileoverview Acceptance Test for checking if logged-in users
 * can open all the links on the "Privacy Policy" page.
 */

import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {LoggedInUser} from '../../user-utilities/logged-in-users-utils';
import testConstants from '../../puppeteer-testing-utilities/test-constants';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Logged-in Users', function () {
  let testUser: LoggedInUser;

  beforeAll(async function () {
    testUser = await UserFactory.createNewUser(
      'testuser',
      'testuser@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should be able to navigate to the Privacy Policy page using the footer',
    async function () {
      await testUser.navigateToAboutFoundationPage();
      await testUser.navigateToPrivacyPolicyPageViaFooter();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  describe('on the Privacy Policy page', function () {
    beforeEach(async function () {
      await testUser.navigateToPrivacyPolicyPage();
    }, DEFAULT_SPEC_TIMEOUT);

    it(
      'should be able to follow link to home page',
      async function () {
        await testUser.clickLinkToHomePageOnPrivacyPolicyPage();
      },
      DEFAULT_SPEC_TIMEOUT
    );

    it(
      'should be able to follow link to learn about cookies',
      async function () {
        await testUser.clickLinkAboutCookiesOnPrivacyPolicyPage();
      },
      DEFAULT_SPEC_TIMEOUT
    );

    it(
      'should be able to follow link to learn about Google Analytics',
      async function () {
        await testUser.clickLinkAboutGoogleAnalyticsOnPrivacyPolicyPage();
      },
      DEFAULT_SPEC_TIMEOUT
    );

    it(
      'should be able to follow link to learn how to opt out of Google Analytics',
      async function () {
        await testUser.clickLinkAboutGoogleAnalyticsOptOutOnPrivacyPolicyPage();
      },
      DEFAULT_SPEC_TIMEOUT
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
