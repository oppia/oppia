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
 * IO.PP. Partner submits a partnerships application.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Interested Partner Organization', function () {
  let partnerOrganizationUser: LoggedOutUser;

  beforeAll(async function () {
    partnerOrganizationUser = await UserFactory.createLoggedOutUser();
  });

  it("should be able to learn about Oppia's partnership program", async function () {
    // Navigate to splash tab and veirfy it.
    await partnerOrganizationUser.navigateToSplashPage();
    await partnerOrganizationUser.expectScreenshotToMatch(
      'homePage',
      __dirname
    );

    // Go to partnerships page and verify required elements.
    await partnerOrganizationUser.clickPartnershipsButtonInGetInvolvedMenuOnNavbar();
    await partnerOrganizationUser.expectScreenshotToMatch(
      'partnershipsPage',
      __dirname
    );
    await partnerOrganizationUser.expectPartnershipHeadingToBe(
      'Partnerships with the Oppia Foundation'
    );
    await partnerOrganizationUser.expectPartnerWithUsButtonIsVisible();
    await partnerOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'Our partnership process'
    );
    await partnerOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'What is it like partnering with Oppia?'
    );
    await partnerOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'Our partners'
    );
    await partnerOrganizationUser.expectPartneringWithUsImageToBePresent();
    await partnerOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'Partner Stories'
    );
    await partnerOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'Learner Stories'
    );
    await partnerOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'Ready to join us?'
    );
    await partnerOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'Frequently asked questions'
    );

    // Download Brochure.
    await partnerOrganizationUser.verifyDownloadBrochureButtonInPartnershipsPage();

    // Special foundation video.
    await partnerOrganizationUser.expectYouTubeVideoInPartnershipWithVideoID(
      'mDfiDLn2Rko'
    );

    // Read More stories.
    await partnerOrganizationUser.navigateToPartnershipsPage();
    await partnerOrganizationUser.clickReadMoreStoriesButtonInPartnershipsPageAndVerifyNavigation();

    // Learner stories crousal.
    await partnerOrganizationUser.navigateToPartnershipsPage();
    await partnerOrganizationUser.verifyLearnerStoriesCarouselInPartnershipPageWorksProperly();
  });

  it('should be able to open partnership form', async function () {
    await partnerOrganizationUser.navigateToPartnershipsPage();
    await partnerOrganizationUser.clickPartnerWithUsButtonInPartnershipsPage();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
