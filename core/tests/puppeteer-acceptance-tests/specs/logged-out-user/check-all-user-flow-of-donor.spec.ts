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
 * @fileoverview Acceptance Test for checking the user flow of Donors
 */

/*
  This is the user journey of a donor:
  1. Navigate to the About Foundation page via the footer or navbar from the home (splash) page.
  2. Navigate to the donate page from the About Foundation Page by clicking on the donations link.
  3. View the donorbox form on the donate page and donate through it. (We won't test the third-party donor box.)
  4. Close the donorbox modal on the thanks-for-donating page.

  This is the page flow: home page --> Foundation page --> Donate page.

  Testing: Can donors successfully complete their donation process when they visit the website for the first time (typically landing on the home page)?
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Donor', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to navigate to donate page when started from home page' +
      'and see the donorbox form in donate page.',
    async function () {
      // Navigating to about foundation page via footer from home page.
      await loggedOutUser.clickOnTheOppiaFoundationLinkInFooter();

      // Navigating to donate page by clicking on the "donations" link on the about foundation page.
      await loggedOutUser.clickDonationsLinkInAboutFoundation();
      // Checking if the donorbox form is visible on the donate page. Here we don't
      // test the functionality of the donor box, just its visibility.
      // because the donor box is an iframe and a third-party service.
      await loggedOutUser.isDonorBoxVisbleOnDonatePage();

      // Here we assume that the user has successfully donated. Successful donation
      // redirects the user to the "Thanks for donating" page in the Oppia website.
      await loggedOutUser.navigateToThanksForDonatingPage();
      // Dismissing the "Thanks for donating" page by clicking on the dismiss button.
      await loggedOutUser.clickDismissButtonInThanksForDonatingPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
