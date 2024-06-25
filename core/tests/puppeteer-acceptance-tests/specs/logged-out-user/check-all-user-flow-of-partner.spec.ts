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

/*
  This is the user-journey of Partners:
  1.Go to About- Foundation page via footer or navbar from the home(splash) page
  2.Go to the partnerships page from About Foundation Page by clicking on the partnerships link.
  3.Fill the partnerships form via any one of the 2 buttons, in any language on partnerships page.
  This is the page flow : home page --> Foundation page --> partnerships - page
  Testing - Can partners successfully fill the partnerships form if they visit the website for the first time (typically lands on home page) ?
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
      // Navigating to about foundation page via footer from home page.
      await loggedOutUser.clickOnTheOppiaFoundationLinkInFooter();

      // Navigating to partnerships page by clicking on "Consider becoming a partner today" link on the about foundation page.
      await loggedOutUser.clickConsiderBecomingAPartnerTodayLinkInAboutFoundation();

      // Opening the partnerships form by clicking the "Partner with us" button at the top of the partnerships page.
      await loggedOutUser.clickPartnerWithUsButtonInPartnershipsPage();
      // Navigating back to partnerships page for the next test.
      await loggedOutUser.navigateToPartnershipsPage();
      // Opening the partnerships form by clicking the "Partner with us" button at the bottom
      // of the partnerships page after changing the language to Portuguese.
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
