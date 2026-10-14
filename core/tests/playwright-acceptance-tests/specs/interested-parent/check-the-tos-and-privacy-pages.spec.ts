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

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Interested Parent', function () {
  let interestedParent: LoggedOutUser;

  test.beforeAll(async function ({browser}) {
    interestedParent = await UserFactory.createLoggedOutUser(browser);
  });

  test('should be able to check the terms of service ', async function () {
    await interestedParent.navigateToSplashPageAsLoggedOutUser();
    await interestedParent.clickOnTermsOfServiceLinkFooter();
    await interestedParent.expectScreenshotToMatch('termsOfServicePage');
  });

  test('should be able to check the privacy policy', async function () {
    await interestedParent.navigateToSplashPageAsLoggedOutUser();
    await interestedParent.clickOnPrivacyPolicyLinkInFooter();
    await interestedParent.expectScreenshotToMatch('privacyPolicyPage');
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
