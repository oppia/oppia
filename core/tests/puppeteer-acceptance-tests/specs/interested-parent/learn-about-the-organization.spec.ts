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
 * IP.PJ. Parent learns about the organization
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Interested Parent', function () {
  let parentUser: LoggedOutUser;

  beforeAll(async function () {
    parentUser = await UserFactory.createLoggedOutUser();
  });

  it('should be able to learn about the organization', async function () {
    // Visit splash page.
    await parentUser.navigateToSplashPage();
    await parentUser.expectScreenshotToMatch('homePage', __dirname);

    // Visit the About Page.
    await parentUser.navigateToAboutPage();
    await parentUser.expectAboutUsPageHeadingToBe(
      ' Empowering learners around the globe '
    );

    // Oppia Foundation and its products.
    await parentUser.expectSubheadingInAboutUsPageToContain(
      ' The Oppia Foundation and its products '
    );
    await parentUser.expectSectionGoalsInAboutPageToContain(' Mission ');
    await parentUser.expectSectionGoalsInAboutPageToContain(' Vision ');

    // More on the Oppia platform.
    await parentUser.expectSubheadingInAboutUsPageToContain(
      ' More on the Oppia platform '
    );
    await parentUser.expectExploreLessonsButtonInAboutPageToBePresent();
    await parentUser.expectAndroidAppButtonInAboutPageToBePresent();

    // Expand features.
    await parentUser.expectFeaturesAccordionToBeFunctionalInAboutPage();

    // Our partnerships.
    await parentUser.expectSubheadingInAboutUsPageToContain(
      ' Our partnerships and how we’re improving lives '
    );
    await parentUser.expectVolunteerCarouselToBeFunctionalInAboutPage();
    await parentUser.expectPartnershipStoryBoardsToBe(4);

    // The Oppia Impact.
    await parentUser.expectSubheadingInAboutUsPageToContain(
      ' The Oppia Impact '
    );
    await parentUser.expectImpactStatsTitlesToBe(4);
    await parentUser.expectImpactChartsToBe(2);

    // View Report Button should be visible.
    await parentUser.expectViewReportButtonInAboutPageToBeVisible();
  });

  it('should visit for parents / teachers page', async function () {
    await parentUser.clickTeachButtonInAboutMenuOnNavbar();
    await parentUser.expectScreenshotToMatch(
      'parentsOrTeachersPage',
      __dirname
    );

    await parentUser.subheadingInParentsAndTeachersPageToContain(
      ' Looking for tips on how to use Oppia lessons? '
    );

    await parentUser.verifyGuideButtonInTeachPage();
    await parentUser.clickAndVerifyBlogButtonInTeachPage();

    await parentUser.expectLessonCreatorsCarouselToBeFunctionalInTeachPage();
    await parentUser.clickLinkedInButtonInTeachPage();
    await parentUser.expectLessonCreationStepsAccordionToBeFunctionalInTeachPage();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
