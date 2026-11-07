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
 * @fileoverview Acceptance Test for checking if logged-out users
 * can open all the links on the "Privacy Policy" page.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Logged-out Users', function () {
  let loggedOutUser: LoggedOutUser;

  test.beforeAll(async function ({browser}) {
    loggedOutUser = await UserFactory.createLoggedOutUser(browser);
  });

  test.beforeEach(async function () {
    await loggedOutUser.navigateToPrivacyPolicyPage();
  });

  test('should be able to follow link to home page', async function () {
    await loggedOutUser.clickLinkToHomePageOnPrivacyPolicyPage();
  });

  test('should be able to follow link to learn about cookies', async function () {
    await loggedOutUser.clickLinkAboutCookiesOnPrivacyPolicyPage();
  });

  test('should be able to follow link to learn about Google Analytics', async function () {
    await loggedOutUser.clickLinkAboutGoogleAnalyticsOnPrivacyPolicyPage();
  });

  test('should be able to follow link to learn how to opt out of Google Analytics', async function () {
    await loggedOutUser.clickLinkAboutGoogleAnalyticsOptOutOnPrivacyPolicyPage();
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
