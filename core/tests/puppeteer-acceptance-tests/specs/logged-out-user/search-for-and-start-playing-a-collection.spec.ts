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
 * @fileoverview Acceptance Test for checking if all buttons on the
 * "Donate" page can be clicked by logged-out users.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-out User', function () {
  let explorationEditor: ExplorationEditor;
  let loggedOutUser: LoggedOutUser;
  let loggedInUser: LoggedInUser;
  let explorationId1: string | null;
  let explorationId2: string | null;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();
    loggedInUser = await UserFactory.createNewUser(
      'testLearner',
      'test_user@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.createMinimalExploration(
      'Test Exploration 1',
      'End Exploration 1'
    );
    await explorationEditor.saveExplorationDraft();

    explorationId1 = await explorationEditor.publishExplorationWithMetadata(
      'Test Exploration Title 1',
      'Test Exploration Goal 1',
      'Algebra 1'
    );
    if (!explorationId1) {
      throw new Error('Error in publishing the first exploration');
    }

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.createMinimalExploration(
      'Test Exploration 2',
      'End Exploration 2'
    );
    await explorationEditor.saveExplorationDraft();

    explorationId2 = await explorationEditor.publishExplorationWithMetadata(
      'Test Exploration Title 2',
      'Test Exploration Goal 2',
      'Algebra 2'
    );
    if (!explorationId2) {
      throw new Error('Error in publishing the second exploration');
    }

    loggedOutUser.playExploration(explorationId1);
    loggedOutUser.rateExploration('4');

    loggedOutUser.playExploration(explorationId2);
    loggedOutUser.rateExploration('5');
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to navigate and interact with the community library',
    async function () {
      await loggedOutUser.navigateToCommunityLibraryPage();
      await loggedOutUser.searchForLessonInSearchBar('Algebra');
      await loggedOutUser.filterLessonsByCategories(['Algebra']);
      await loggedOutUser.filterLessonsByLanguage(['English']);
      await loggedOutUser.expectSearchResultsToBePresent('Algebra');

      // Access the top-rated page at /community-library/top-rated, which shows explorations with high ratings.
      await loggedOutUser.navigateToTopRatedPage();
      await loggedOutUser.expectTopRatedExplorationsToBePresent();

      // Visit the recently published explorations page at /community-library/recently-published.
      await loggedOutUser.navigateToRecentlyPublishedPage();
      await loggedOutUser.expectRecentlyPublishedExplorationsToBePresent();

      // View the ratings on an exploration once a minimum number of ratings have been submitted.
      await loggedOutUser.selectExplorationToView();
      await loggedOutUser.expectExplorationRatingsToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
