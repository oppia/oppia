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
 * @fileoverview Acceptance Test for checking if a user can edit avatar
 * and view created and edited lessons in the profile page.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const PROFILE_PICTURE = testConstants.data.profilePicture;

describe('Logged-in User', function () {
  let loggedInUser: LoggedInUser;
  const TEST_EXPLORATION = {
    title: 'Test Exploration',
    editedTitle: 'Edited Exploration',
    category: 'Algebra',
  };

  beforeAll(async function () {
    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );

    // Create and publish exploration.
    await loggedInUser.createAndPublishAMinimalExplorationWithTitle(
      TEST_EXPLORATION.title,
      TEST_EXPLORATION.category
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  // The logged-in user can edit their profile avatar via preferences.
  it(
    'should edit profile avatar via preferences',
    async function () {
      await loggedInUser.navigateToPreferencesPageUsingProfileDropdown();
      await loggedInUser.updateProfilePicture(PROFILE_PICTURE);
      await loggedInUser.saveChangesInPreferencesPage();
      await loggedInUser.navigateToProfilePageUsingProfileDropdown();
      await loggedInUser.verifyProfilePicUpdate();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  // The logged-in user can view created explorations in their profile page.
  it(
    'should display created explorations on profile page',
    async function () {
      await loggedInUser.navigateToProfilePageUsingProfileDropdown();
      await loggedInUser.expectExplorationToBePresentInProfilePageWithTitle(
        TEST_EXPLORATION.title
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  // The logged-in user can view edited explorations in their profile page.
  it(
    'should display edited explorations on profile page',
    async function () {
      await loggedInUser.navigateToCreatorDashboardPage();
      await loggedInUser.openExplorationInExplorationEditor(
        TEST_EXPLORATION.title
      );
      await loggedInUser.dismissWelcomeModal();
      await loggedInUser.navigateToSettingsTab();
      await loggedInUser.updateTitleTo(TEST_EXPLORATION.editedTitle);

      await loggedInUser.saveExplorationDraft();

      await loggedInUser.navigateToProfilePageUsingProfileDropdown();
      await loggedInUser.expectExplorationToBePresentInProfilePageWithTitle(
        TEST_EXPLORATION.editedTitle
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
