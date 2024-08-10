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
 * @fileoverview Acceptance Test for the user journey of account creation, profile preference editing, and account export.
 * The test includes:
 * - Navigation to preferences page, editing profile preferences,
 *   verifying changes on profile page, exporting account, and account deletion by a logged-out user.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const PROFILE_PICTURE = testConstants.data.profilePicture;
const EXPECTED_PROFILE_PIC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAAA8AXHiAAAAAXNSR0IArs4c6QAAHalJREFUeF7t3Qm8fls5B/An8xyllCtTkUhx5QqlaMJtoK4ppQGl0IBMuTfphjIkopR0MxaSyFyGChHK1M2UOcM1ZAyZPt9jrdN73vMOe1hr7f2+dz+fz/s5/3P+7957rbWf9Yy/51nXiPF0zYj4gIh4TES8f0S8dUS86fjbFr/DKyPidyLityPiVenufxgRfxMR/xsR/7nyxP+JiNf3GMEbR8SbpO+/WURcIyKuGxE3TR///y4R8X4R8b497tvqq6+LiH+JiD+LiGdFxLMj4k/HPNwCjKGbRMSdIuLjIuKDIuJtxtys0LX/FRF/lBjjDyLipen3f4iI/PnH9Kx/';

describe('Logged-in User', function () {
  let loggedInUser1: LoggedInUser & LoggedOutUser;

  beforeAll(async function () {
    loggedInUser1 = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to create an account, update profile preferences, view changes on profile page, export account, and delete account',
    async function () {
      await loggedInUser1.navigateToPreferencesPage();

      // Update profile preferences.
      await loggedInUser1.updateProfilePicture(PROFILE_PICTURE);
      await loggedInUser1.updateBio('This is my new bio.');
      await loggedInUser1.updatePreferredDashboard('Creator Dashboard');
      await loggedInUser1.updateSubjectInterests(['math', 'science']);
      await loggedInUser1.updatePreferredExplorationLanguage('Hinglish');
      await loggedInUser1.updatePreferredSiteLanguage('English');
      await loggedInUser1.updatePreferredAudioLanguage('English');
      await loggedInUser1.updateEmailPreferences([
        'Receive news and updates about the site',
      ]);

      await loggedInUser1.saveChanges();

      // Navigate to Profile page and verify changes.
      await loggedInUser1.navigateToProfilePageFromPreferencePage();
      await loggedInUser1.expectProfilePictureToBe(EXPECTED_PROFILE_PIC);
      await loggedInUser1.expectBioToBe('This is my new bio.');
      await loggedInUser1.expectSubjectInterestsToBe(['math', 'science']);

      // Export account from Preferences page.
      await loggedInUser1.navigateToPreferencesPage();
      await loggedInUser1.exportAccount();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
