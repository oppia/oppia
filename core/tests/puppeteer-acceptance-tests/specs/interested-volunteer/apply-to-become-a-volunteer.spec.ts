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
 * IV.VP. Volunteer explores volunteer openings on the Oppia Idealist page
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Interested Volunteer', function () {
  let interestedVolunteer: LoggedOutUser;

  beforeAll(async function () {
    interestedVolunteer = await UserFactory.createLoggedOutUser();
  });

  it('should be able to explore volunteer openings on the Oppia Idealist page', async function () {
    await interestedVolunteer.navigateToSplashPage();

    // Navigate to Volunteer Page.
    await interestedVolunteer.clickVolunteerButtonInGetInvolvedMenuOnNavbar();
    await interestedVolunteer.expectScreenshotToMatch(
      'volunteerPage',
      __dirname
    );

    // Check for various headings and sections.
    await interestedVolunteer.expectVolunteerPageHeadingToContain(
      'Volunteer to make a difference'
    );

    // Explore volunteer openings at the top of the page.
    await interestedVolunteer.clickExploreVolunteerOpeningsButtonAtTheTopOfVolunteerPage();

    // "Why Volunteer with Us?" heading.
    await interestedVolunteer.navigateToVolunteerPage();
    await interestedVolunteer.expectVolunteerPageHeadingToContain(
      'Why volunteer with us?'
    );

    // Meet our volunteers.
    await interestedVolunteer.expectVolunteerPageHeadingToContain(
      'Meet our volunteers'
    );
    await interestedVolunteer.expectVolunteerExpectationsTabsToBeFunctionalInVolunteerPage();

    // Open Oppia Idealist page.
    await interestedVolunteer.clickExploreVolunteerOpeningsButtonAtTheBottomOfVolunteerPage();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
