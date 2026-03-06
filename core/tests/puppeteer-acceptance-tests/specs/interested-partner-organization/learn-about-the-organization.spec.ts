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
 * IP.1. Partner organization learns about the organization
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Interested Partner Organization', function () {
  let partnerUser: LoggedOutUser;

  beforeAll(async function () {
    partnerUser = await UserFactory.createLoggedOutUser();
  });

  it('should be able to learn about the organization', async function () {
    // Visit splash page and verify it loads.
    await partnerUser.navigateToSplashPage();
    await partnerUser.expectScreenshotToMatch('splashPage', __dirname);

    // Click About > About Oppia and verify all sections.
    await partnerUser.clickAboutButtonInAboutMenuOnNavbar();
    await partnerUser.expectAboutUsPageHeadingToBe(
      ' Empowering learners around the globe '
    );

    // Verify Oppia Foundation and its products section.
    await partnerUser.expectSubheadingInAboutUsPageToContain(
      ' The Oppia Foundation and its products '
    );

    // Verify Mission and Vision.
    await partnerUser.expectSectionGoalsInAboutPageToContain(' Mission ');
    await partnerUser.expectSectionGoalsInAboutPageToContain(' Vision ');

    // Verify More on the Oppia platform section with buttons.
    await partnerUser.expectSubheadingInAboutUsPageToContain(
      ' More on the Oppia platform '
    );
    await partnerUser.expectExploreLessonsButtonInAboutPageToBePresent();
    await partnerUser.expectAndroidAppButtonInAboutPageToBePresent();

    // Verify features accordion is functional.
    await partnerUser.expectFeaturesAccordionToBeFunctionalInAboutPage();

    // Verify partnerships and carousel.
    await partnerUser.expectSubheadingInAboutUsPageToContain(
      " Our partnerships and how we're improving lives "
    );
    await partnerUser.expectVolunteerCarouselToBeFunctionalInAboutPage();
    await partnerUser.expectPartnershipStoryBoardsToBe(4);

    // Verify The Oppia Impact section with impact stats.
    await partnerUser.expectSubheadingInAboutUsPageToContain(
      ' The Oppia Impact '
    );
    await partnerUser.expectImpactStatsTitlesToBe(4);
    await partnerUser.expectImpactChartsToBe(2);

    // Verify View Report Button.
    await partnerUser.expectViewReportButtonInAboutPageToBeVisible();

    // Verify version footer matches regex pattern.
    await partnerUser.expectFooterVersionToMatchPattern(
      /Version: [^\s]+ \(\w+\)/
    );
  });

  it('should be able to view For Parents/Teachers page', async function () {
    // Click About > For Parents/Teachers and verify content loads.
    await partnerUser.clickTeachButtonInAboutMenuOnNavbar();
    await partnerUser.expectScreenshotToMatch(
      'parentsOrTeachersPage',
      __dirname
    );

    // Verify content is present.
    await partnerUser.subheadingInParentsAndTeachersPageToContain(
      ' Looking for tips on how to use Oppia lessons? '
    );

    await partnerUser.verifyGuideButtonInTeachPage();
    await partnerUser.clickAndVerifyBlogButtonInTeachPage();

    await partnerUser.expectLessonCreatorsCarouselToBeFunctionalInTeachPage();
    await partnerUser.clickLinkedInButtonInTeachPage();
    await partnerUser.expectLessonCreationStepsAccordionToBeFunctionalInTeachPage();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
