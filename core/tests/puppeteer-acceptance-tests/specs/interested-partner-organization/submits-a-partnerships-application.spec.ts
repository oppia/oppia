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
  let partherOrganizationUser: LoggedOutUser;

  beforeAll(async function () {
    partherOrganizationUser = await UserFactory.createLoggedOutUser();
  });

  it("should be able to learn about Oppia's partnership program", async function () {
    // Navigate to splash tab and veirfy it.
    await partherOrganizationUser.navigateToSplashPage();
    await partherOrganizationUser.expectScreenshotToMatch(
      'homePage',
      __dirname
    );

    // Go to partnerships page and verify required elements.
    await partherOrganizationUser.navigateToPartnershipsPage();
    await partherOrganizationUser.expectScreenshotToMatch(
      'partnershipsPage',
      __dirname
    );
    await partherOrganizationUser.expectPartnershipHeadingToBe(
      'Partnerships with the Oppia Foundation'
    );
    await partherOrganizationUser.expectPartnerWithUsButtonIsVisible();
    await partherOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'Our partnership process'
    );
    await partherOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'What is it like partnering with Oppia?'
    );
    await partherOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'Our partners'
    );
    await partherOrganizationUser.expectPartneringWithUsImageToBePresent();
    await partherOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'Partner Stories'
    );
    await partherOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'Learner Stories'
    );
    await partherOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'Ready to join us?'
    );
    await partherOrganizationUser.expectSubheadingsInPartnershipPageToContain(
      'Frequently asked questions'
    );

    // Download Brochure
    await partherOrganizationUser.clickDownloadBrochureButtonInPartnershipsPage();

    // Special foundation video
    await partherOrganizationUser.expectYouTubeVideoInPartnershipPageToBePlayabe();

    // Read More stories
    await partherOrganizationUser.clickReadMoreStoriesButtonInPartnershipsPageAndVerifyNavigation();

    // Learner stories crousal
    await partherOrganizationUser.clickReadMoreStoriesButtonInPartnershipsPageAndVerifyNavigation();
  });

  it('should be able to open partnership form', async function () {
    await partherOrganizationUser.clickPartnerWithUsButtonInPartnershipsPage();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
