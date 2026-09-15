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

import {test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const PROFILE_PICTURE = testConstants.data.profilePicture;

test.describe.configure({mode: 'serial'});

test.describe('Logged-in User', function () {
  let loggedInUser: LoggedInUser & ExplorationEditor;
  const TEST_EXPLORATION = {
    title: 'Test Exploration',
    editedTitle: 'Edited Exploration',
    category: 'Algebra',
  };

  test.beforeAll(async function ({browser}) {
    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com',
      browser
    );

    // Create and publish exploration.
    await loggedInUser.createAndPublishAMinimalExplorationWithTitle(
      TEST_EXPLORATION.title,
      TEST_EXPLORATION.category
    );
  });

  // The logged-in user can edit their profile avatar via preferences.
  test('should edit profile avatar via preferences', async function () {
    await loggedInUser.navigateToPreferencesPageUsingProfileDropdown();
    await loggedInUser.updateProfilePicture(PROFILE_PICTURE);
    await loggedInUser.saveChangesInPreferencesPage();
    await loggedInUser.navigateToProfilePageUsingProfileDropdown();
    await loggedInUser.verifyProfilePicUpdate();
  });

  // The logged-in user can view created explorations in their profile page.
  test('should display created explorations on profile page', async function () {
    await loggedInUser.navigateToProfilePageUsingProfileDropdown();
    await loggedInUser.expectExplorationToBePresentInProfilePageWithTitle(
      TEST_EXPLORATION.title
    );
  });

  // The logged-in user can view edited explorations in their profile page.
  test('should display edited explorations on profile page', async function () {
    await loggedInUser.navigateToCreatorDashboardPage();
    await loggedInUser.openExplorationInExplorationEditor(
      TEST_EXPLORATION.title
    );
    await loggedInUser.navigateToSettingsTab();
    await loggedInUser.updateTitleTo(TEST_EXPLORATION.editedTitle);

    await loggedInUser.saveExplorationDraft();

    await loggedInUser.navigateToProfilePageUsingProfileDropdown();
    await loggedInUser.expectExplorationToBePresentInProfilePageWithTitle(
      TEST_EXPLORATION.editedTitle
    );
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
