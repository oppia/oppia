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
 * @fileoverview Acceptance Tests for checking the user flow of Volunteers
 */

/*
  This is the user journey of a volunteer:

  1.Go to About page via footer or navbar from the home(splash) page
  2.View the Impact report on the About page.
  3.Fill the volunteer form by clicking on the "Volunteer with Oppia" button of Volunteer tab on the About page.
  4.Go to the volunteer page from About Page by clicking on the "Learn more" button of volunteer tab on the About page.
  5.Fill the volunteer form via any one of the 2 buttons on volunteer page.

  This is the page flow: home page --> About page --> volunteer page.
  Testing: Can volunteers successfully fill out the volunteer form if
  they visit the website for the first time (typically landing on the home page)?
 */
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Volunteer', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to navigate to volunteer page when started from the home page ' +
      'and open the volunteer form when the "Apply to Volunteer" button is clicked',
    async function () {
      // Navigating to About page via navbar from home page.
      await loggedOutUser.clickAboutButtonInAboutMenuOnNavbar();
      // Navigating back to home page for the next test.
      await loggedOutUser.navigateToHome();
      // Navigating to About page via footer from home page.
      await loggedOutUser.clickOnAboutLinkInFooter();

      // View Features on the About page.
      await loggedOutUser.expectFeaturesAccordionToBeFunctionalInAboutPage();
      // View Volunteer Carousel on the About page.
      await loggedOutUser.expectVolunteerCarouselToBeFunctionalInAboutPage();
      // Opening the Impact report by clicking on the "View Impact Report" button on the About page.
      await loggedOutUser.clickViewReportButtonInAboutPage();
      // Opening the Volunteer form by clicking on the "Volunteer with Oppia" button of Volunteer tab on the About page.
      await loggedOutUser.clickVolunteerWithOppiaButtonInAboutPage();
      // Navigating to the Volunteer page by clicking on the Learn More button of Volunteer tab.
      await loggedOutUser.clickVolunteerLearnMoreButtonInAboutPage();

      // View the Volunteer expectations on the volunteer page.
      await loggedOutUser.expectVolunteerExpectationsTabsToBeFunctionalInVolunteerPage();
      // Opening the Volunteer form by clicking the "Apply to Volunteer" button at the top of the Volunteer page.
      await loggedOutUser.clickApplyToVolunteerAtTheTopOfVolunteerPage();
      // Navigating back to Volunteer page for the next test.
      await loggedOutUser.navigateToVolunteerPage();
      // Opening the Volunteer form by clicking the "Apply to Volunteer" button at the bottom of the Volunteer page.
      await loggedOutUser.clickApplyToVolunteerAtTheBottomOfVolunteerPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
