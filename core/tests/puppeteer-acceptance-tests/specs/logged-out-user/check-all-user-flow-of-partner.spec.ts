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
 * @fileoverview Acceptance Test for checking the user flow of Partners
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Partner', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to navigate to partnerships page when started from home page ' +
      'and open the partnerships form in partnerships page.',
    async function () {
      await loggedOutUser.clickAboutFoundationButtonInAboutMenuOnNavbar();
      await loggedOutUser.navigateToHome();
      await loggedOutUser.navigateToAboutFoundationPageViaFooter();

      // Navigating to partnerships page by clicking on "Consider becoming a partner today" link.
      await loggedOutUser.clickConsiderBecomingAPartnerTodayLinkInAboutFoundation();

      // Opening the partnerships form by clicking the "Partner with us" button at the top of the partnerships page.
      await loggedOutUser.clickPartnerWithUsButtonInPartnershipsPage();
      await loggedOutUser.navigateToPartnershipsPage();
      await loggedOutUser.clickPartnerWithUsButtonInPartnershipsPageInGivenLanguage(
        'pt-br'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
