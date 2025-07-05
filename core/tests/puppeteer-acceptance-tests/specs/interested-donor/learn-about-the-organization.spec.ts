// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * ID.DJ. Donor learns about the organization
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Interested Donor', function () {
  let interestedDonor: LoggedOutUser;

  beforeAll(async function () {
    interestedDonor = await UserFactory.createLoggedOutUser();
  });

  it('should be able to learn more about the organization', async function () {
    await interestedDonor.navigateToSplashPage();

    // Visit "About" page.
    await interestedDonor.clickAboutButtonInAboutMenuOnNavbar();
    await interestedDonor.expectScreenshotToMatch('aboutPage', __dirname);

    // Empowering Learners around the globe.
    await interestedDonor.expectAboutUsPageHeadingToBe(
      ' Empowering learners around the globe '
    );

    // Oppia Foundation and its products.
    await interestedDonor.expectSubheadingInAboutUsPageToContain(
      ' The Oppia Foundation and its products '
    );
    await interestedDonor.expectSectionGoalsInAboutPageToContain(' Mission ');
    await interestedDonor.expectSectionGoalsInAboutPageToContain(' Vision ');

    // More on the Oppia platform.
    await interestedDonor.expectSubheadingInAboutUsPageToContain(
      ' More on the Oppia platform '
    );
    await interestedDonor.expectExploreLessonsButtonInAboutPageToBePresent();
    await interestedDonor.expectAndroidAppButtonInAboutPageToBePresent();

    // Expand features.
    await interestedDonor.expectFeaturesAccordionToBeFunctionalInAboutPage();

    // Our partnerships.
    await interestedDonor.expectSubheadingInAboutUsPageToContain(
      ' Our partnerships and how we’re improving lives '
    );
    await interestedDonor.expectVolunteerCarouselToBeFunctionalInAboutPage();
    await interestedDonor.expectPartnershipStoryBoardsToBe(4);

    // The Oppia Impact.
    await interestedDonor.expectSubheadingInAboutUsPageToContain(
      ' The Oppia Impact '
    );
    await interestedDonor.expectImpactStatsTitlesToBe(4);
    await interestedDonor.expectImpactChartsToBe(2);

    // View Report Button should be visible.
    await interestedDonor.expectViewReportButtonInAboutPageToBeVisible();
  });

  it('should be able to view impact reports', async function () {
    await interestedDonor.verifyImpactReportButtonInAboutMenuOnNavbar();
  });

  it('should be able to read more what organization has done', async function () {
    await interestedDonor.clickAboutButtonInAboutMenuOnNavbar();
    await interestedDonor.clickOnBlogLinkInFooter();
    await interestedDonor.expectScreenshotToMatch('blogPage', __dirname);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
