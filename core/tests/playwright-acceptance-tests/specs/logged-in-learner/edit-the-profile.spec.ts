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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * PP. Learner edits the profile
 */

import {test} from '@playwright/test';
import {FILEPATHS} from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Logged-In Learner', function () {
  let loggedInLearner: LoggedInUser & LoggedOutUser;
  let explorationEditor: ExplorationEditor;

  test.beforeAll(async function ({browser}) {
    loggedInLearner = await UserFactory.createNewUser(
      'learner',
      'learner@example.com',
      browser
    );

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com',
      browser
    );

    await explorationEditor.createAndPublishExplorationWithCards(
      'Solving problems without calculator',
      'Algebra',
      2,
      true
    );
  });

  test('should be able to find the preferences page', async function () {
    await loggedInLearner.navigateToLoginPage();
    await loggedInLearner.expectToBeOnLearnerDashboard();

    await loggedInLearner.clickOnProfileDropdown();

    await loggedInLearner.expectProfileDropdownToContainElementWithContent(
      'learner'
    );
    await loggedInLearner.expectProfileDropdownToContainElementWithContent(
      'Learner Dashboard'
    );
    await loggedInLearner.expectProfileDropdownToContainElementWithContent(
      'Creator Dashboard'
    );
    await loggedInLearner.expectProfileDropdownToContainElementWithContent(
      'Contributor Dashboard'
    );
    await loggedInLearner.expectProfileDropdownToContainElementWithContent(
      'Preferences'
    );
    await loggedInLearner.expectProfileDropdownToContainElementWithContent(
      'Logout'
    );
    await loggedInLearner.expectProfileDropdownToContainElementWithContent(
      'Topics and Skills Dashboard',
      false
    );

    await loggedInLearner.clickOnProfileDropdown();
    await loggedInLearner.navigateToPreferencesPageUsingProfileDropdown();
  });

  test('should be able to change the profile photo', async function () {
    // Should be able to update profile photo with all supported formats.
    await loggedInLearner.updateProfilePicture(FILEPATHS.PROFILE_PHOTO_SVG);
    await loggedInLearner.updateProfilePicture(FILEPATHS.PROFILE_PHOTO_PNG);
    await loggedInLearner.updateProfilePicture(FILEPATHS.PROFILE_PHOTO_JPEG);
    await loggedInLearner.updateProfilePicture(FILEPATHS.PROFILE_PHOTO_JPG);
    await loggedInLearner.updateProfilePicture(FILEPATHS.PROFILE_PHOTO_GIF);

    // Should not be able to update profile photo with unsupported formats.
    await loggedInLearner.expectProfilePhotoDoNotUpdate(
      FILEPATHS.PROFILE_PHOTO_BMP
    );

    // Should not be able to update profile photo with large images.
    await loggedInLearner.expectProfilePhotoDoNotUpdate(
      FILEPATHS.PROFILE_PHOTO_HIRES
    );
  });

  test('should be able to edit bio', async function () {
    await loggedInLearner.updateBio('This is my new bio.');
  });

  test('should be able to change the preferred dashboard', async function () {
    await loggedInLearner.updatePreferredDashboard('Creator Dashboard');
  });

  test('should be able to edit subject interests', async function () {
    await loggedInLearner.updateSubjectInterestsWithEnterKey([
      'math',
      'science',
    ]);
    await loggedInLearner.updateSubjectInterestsWhenBlurringField([
      'art',
      'history',
    ]);
  });

  test('should be able to add preferred audio language', async function () {
    await loggedInLearner.updatePreferredAudioLanguage(
      'Bahasa Indonesia (Indonesian)'
    );
  });

  test('should be able to change preferred exploration language', async function () {
    await loggedInLearner.updatePreferredExplorationLanguage('Hinglish');
  });

  test('should be able to change email preferences', async function () {
    await loggedInLearner.updateEmailPreferences([
      'Receive news and updates about the site',
    ]);
  });

  test('should be able to save all the information edited', async function () {
    await loggedInLearner.saveChangesInPreferencesPage();

    await loggedInLearner.page.waitForLoadState('networkidle');
    await loggedInLearner.navigateToSplashPage(
      'http://localhost:8181/creator-dashboard'
    );
  });

  test('should be able to go to their profile by clicking on their username', async function () {
    await loggedInLearner.navigateToPreferencesPageUsingProfileDropdown();
    await loggedInLearner.navigateToProfilePageFromPreferencePage();
    await loggedInLearner.verifyProfilePicUpdate();
    await loggedInLearner.expectBioToBe('This is my new bio.');
    await loggedInLearner.expectSubjectInterestsToBe([
      'math',
      'science',
      'art',
      'history',
    ]);
  });

  test('should be able to subscribe creators', async function () {
    await loggedInLearner.navigateToCommunityLibraryPage();
    await loggedInLearner.searchForLessonInSearchBar(
      'Solving problems without calculator'
    );
    await loggedInLearner.playLessonFromSearchResults(
      'Solving problems without calculator'
    );
    await loggedInLearner.continueToNextCard();

    await loggedInLearner.openLessonInfoModal();
    await loggedInLearner.clickOnProfileIconInLessonInfoModel();
    await loggedInLearner.subscribeToCreator('explorationEditor');
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
