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
 * PP. Learner edits the profile
 */

import {FILEPATHS} from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Logged-In Learner', function () {
  let loggedInLearner: LoggedInUser & LoggedOutUser;
  let explorationEditor: ExplorationEditor;

  beforeAll(async function () {
    loggedInLearner = await UserFactory.createNewUser(
      'learner8',
      'learner8@example.com'
    );

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.createAndPublishExplorationWithCards(
      'Solving problems without calculator',
      'Algebra'
    );
  });

  it('should be able to find the preferences page', async function () {
    await loggedInLearner.clickOnProfileDropdown();

    await loggedInLearner.expectProfileDropdownToContainElementWithContent(
      'learner8'
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

    await loggedInLearner.clickOnProfileDropdown();
    await loggedInLearner.navigateToPreferencesPageUsingProfileDropdown();
  });

  it('should be able to change the profile photo', async function () {
    await loggedInLearner.updateProfilePicture(FILEPATHS.PROFILE_PHOTO_SVG);
    await loggedInLearner.updateProfilePicture(FILEPATHS.PROFILE_PHOTO_PNG);
    await loggedInLearner.updateProfilePicture(FILEPATHS.PROFILE_PHOTO_JPEG);
    await loggedInLearner.updateProfilePicture(FILEPATHS.PROFILE_PHOTO_JPG);
    await loggedInLearner.updateProfilePicture(FILEPATHS.PROFILE_PHOTO_GIF);

    await loggedInLearner.expectProfilePhotoDoNotUpdate(
      FILEPATHS.PROFILE_PHOTO_BMP
    );
  });

  it('should be able to edit bio', async function () {
    await loggedInLearner.updateBio('This is my new bio.');
  });

  it('should be able to change the preferred dashboard', async function () {
    await loggedInLearner.updatePreferredDashboard('Creator Dashboard');
  });

  it('should be able to edit subject interests', async function () {
    await loggedInLearner.updateSubjectInterestsWithEnterKey([
      'math',
      'science',
    ]);
    await loggedInLearner.updateSubjectInterestsWhenBlurringField([
      'art',
      'history',
    ]);
  });

  it('should be able to add preferred audio language', async function () {
    await loggedInLearner.updatePreferredAudioLanguage(
      'Bahasa Indonesia (Indonesian)'
    );
  });

  it('should be able to change preferred exploration language', async function () {
    await loggedInLearner.updatePreferredExplorationLanguage('Hinglish');
  });

  it('should be able to change email preferences', async function () {
    await loggedInLearner.updateEmailPreferences([
      'Receive news and updates about the site',
    ]);
  });

  it('should be able to save all the information edited', async function () {
    await loggedInLearner.saveChangesInPreferencesPage();

    await loggedInLearner.waitForNetworkIdle();
    await loggedInLearner.navigateToSplashPage(
      'http://localhost:8181/creator-dashboard'
    );
  });

  it('should be able to go to their profile by clicking on their username', async function () {
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

  it('should be able to subscribe creators', async function () {
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

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
