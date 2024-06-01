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
 * @fileoverview Acceptance Test for Partner
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Partner', function () {
  let testUser: LoggedOutUser;

  beforeAll(async function () {
    const now = new Date();
    const tempId =
      now.getHours().toString() +
      now.getMinutes().toString() +
      now.getSeconds().toString();
    testUser = await UserFactory.createNewUser(
      `partner${tempId}`,
      `partner${tempId}@example.com`
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to navigate to partnerships page when started from home page ' +
      'and open the partnerships form in partnerships page.',
    async function () {
      await testUser.clickAboutFoundationButtonInAboutMenuOnNavbar();
      // Navigating to a page which has a footer.
      await testUser.navigateToAboutPage();
      await testUser.navigateToAboutFoundationPageViaFooter();

      // Navigating to partnerships page by clicking on "Consider becoming a partner today" link.
      await testUser.clickConsiderBecomingAPartnerTodayLinkInAboutFoundation();

      // Opening the partnerships form by clicking the "Partner with us" button at the top of the partnerships page.
      await testUser.clickPartnerWithUsButtonInPartnershipsPage();
      await testUser.navigateToPartnershipsPage();
      await testUser.clickPartnerWithUsButtonInPartnershipsPageInGivenLanguage(
        'pt-br'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
