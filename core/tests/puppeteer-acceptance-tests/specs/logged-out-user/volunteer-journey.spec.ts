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
 * @fileoverview Acceptance Tests for Logged-out User as a Volunteer
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
      await loggedOutUser.clickAboutFoundationButtonInAboutMenuOnNavbar();
      await loggedOutUser.navigateToHome();
      await loggedOutUser.navigateToAboutFoundationPageViaFooter();

      // Navigating to the Volunteer page by clicking on the "Become a Volunteer" button.
      await loggedOutUser.clickBecomeAVolunteerButtonInAboutFoundation();

      await loggedOutUser.navigateToAboutFoundationPage();
      // Navigating to the Volunteer page by clicking on the "Join our large volunteer community" link.
      await loggedOutUser.clickJoinOurLargeVolunteerCommunityLinkInAboutFoundation();

      // Opening the Volunteer form by clicking the "Apply to Volunteer" button at the top of the Volunteer page.
      await loggedOutUser.clickApplyToVolunteerAtTheTopOfVolunteerPage();

      // Going back to Volunteer page and opening the Volunteer form by clicking the "Apply to Volunteer" button at the bottom of the Volunteer page.
      await loggedOutUser.navigateToVolunteerPage();
      await loggedOutUser.clickApplyToVolunteerAtTheBottomOfVolunteerPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
