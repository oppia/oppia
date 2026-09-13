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
 * @fileoverview Acceptance test for IP.1. Learn about the organization - interested-parent
 * https://docs.google.com/spreadsheets/d/1IrxN13IC5xwWdAFnGMu_4p3FU1ADL4QO-eLZIuTowIA/edit?gid=888982708#gid=888982708
 *
 * IP.1. Learn about the organization
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Interested Parent', function () {
  let parentUser: LoggedOutUser;

  beforeAll(async function () {
    parentUser = await UserFactory.createLoggedOutUser();
  });

  it('should learn about the organization', async function () {
    // Visit splash page.
    await parentUser.navigateToSplashPage();
    await parentUser.acceptCookieBannerIfPresent();
    await parentUser.waitForPageToFullyLoad();
    await parentUser.expectScreenshotToMatch('homePage', __dirname);

    // Visit the About Oppia page from navbar.
    await parentUser.clickAboutButtonInAboutMenuOnNavbar();
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

    // Verify footer version matches expected pattern.
    await parentUser.expectFooterVersionToMatchPattern(
      /Version: [^\s]* \(\w*\)/
    );

    // Visit the For Parents / Teachers page from navbar.
    await parentUser.clickTeachButtonInAboutMenuOnNavbar();
    await parentUser.acceptCookieBannerIfPresent();
    await parentUser.waitForPageToFullyLoad();
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
