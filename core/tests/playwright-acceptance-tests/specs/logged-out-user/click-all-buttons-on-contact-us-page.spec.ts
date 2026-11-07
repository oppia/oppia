// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance Test for checking if all buttons on the
 * "Contact Us" page can be clicked by logged-out users.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;

  test.beforeAll(async function ({browser}) {
    loggedOutUser = await UserFactory.createLoggedOutUser(browser);
  });

  test.beforeEach(async function () {
    await loggedOutUser.navigateToContactUsPage();
  });

  test('should be able to navigate to /donate page from the "DONATE TODAY" button.', async function () {
    await loggedOutUser.clickDonateTodayButtonInContactUsPage();
  });

  test('should be able to navigate to /partnerships page from the "BECOME A PARTNER" button.', async function () {
    await loggedOutUser.clickBecomeAPartnerButtonInContactUsPage();
  });

  test('should be able to navigate to /volunteer page from the "BECOME A VOLUNTEER" button.', async function () {
    await loggedOutUser.clickVolunteerButtonInContactUsPage();
  });

  test('should have a mailto link for "admin@oppia.org" in the other inquiries section.', async function () {
    await loggedOutUser.verifyAdminEmailLinkInContactUsPage();
  });

  test('should have a mailto link for "press@oppia.org" in the other inquiries section.', async function () {
    await loggedOutUser.verifyPressEmailLinkInContactUsPage();
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
