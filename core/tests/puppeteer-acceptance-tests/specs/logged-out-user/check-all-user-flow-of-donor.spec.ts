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
  1.Navigate to About page via footer or navbar from the home(splash) page
  2.View the Impact report on the About page.
  3.View the donorbox form by clicking on the "Donate" button  of "Donate" tab on the About page. (We won't test the third-party donor box.)
  4.Close the donorbox modal on the thanks-for-donating page.
  5.Navigate to the donate page from About Page by clicking on the "DONATE" button on navbar.
  6.View the donorbox form by clicking on the "Donate" button  of on the Donate page. (We won't test the third-party donor box.)
  7.Close the donorbox modal on the thanks-for-donating page.

  This is the page flow: home page --> About page --> Donate page.

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
    'should be able to navigate to donate page when started from home page ' +
      'and see the donorbox form in donate page.',
    async function () {
      // Navigating to About page via navbar from home page.
      await loggedOutUser.clickAboutButtonInAboutMenuOnNavbar();
      // Navigating back to home page for the next test.
      await loggedOutUser.navigateToHome();
      // Navigating to About page via footer from home page.
      await loggedOutUser.clickOnAboutLinkInFooter();

      // Opening the Impact report by clicking on the "View Impact Report" button on the About page.
      await loggedOutUser.clickViewReportButtonInAboutPage();

      await loggedOutUser.clickDonateButtonInAboutPage();
      // Here we assume that the user has successfully donated. Successful donation
      // redirects the user to the "Thanks for donating" page in the Oppia website.
      await loggedOutUser.navigateToDonationThanksModalOnAboutPage();
      // Dismissing the "Thanks for donating" page by clicking on the dismiss button.
      await loggedOutUser.dismissDonationThanksModalOnAboutPage();

      // Navigating to Donate page via navbar.
      await loggedOutUser.clickDonateButtonOnNavbar();
      // Checking if the donorbox form is visible on the donate page. Here we don't
      // test the functionality of the donor box, just its visibility.
      // because the donor box is an iframe and a third-party service.
      await loggedOutUser.isDonorBoxVisbleOnDonatePage();

      // Here we assume that the user has successfully donated. Successful donation
      // redirects the user to the "Thanks for donating" page in the Oppia website.
      await loggedOutUser.navigateToDonationThanksModalOnDonatePage();
      // Dismissing the "Thanks for donating" page by clicking on the dismiss button.
      await loggedOutUser.dismissDonationThanksModalOnDonatePage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
