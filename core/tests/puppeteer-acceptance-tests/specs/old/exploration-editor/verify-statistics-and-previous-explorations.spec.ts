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
 * @fileoverview Acceptance tests for viewing statistics and past explorations on the creator dashboard.
 * User Journey: Create explorations, have another user play and rate one, then verify stats as the creator.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;
  let loggedInUser: LoggedInUser & LoggedOutUser;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
      'Rational Numbers'
    );
    await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
      'Real Numbers',
      'Algebra',
      false
    );
    await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
      'Fractions',
      'Algebra',
      false
    );
    // These explorations are not published but are saved as drafts.
    await explorationEditor.createAndSaveAMinimalExploration();
    await explorationEditor.createAndSaveAMinimalExploration();

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should display created explorations and their statistics on the creator dashboard after creating, playing, and rating as a logged-in user',
    async function () {
      await loggedInUser.navigateToCommunityLibraryPage();
      await loggedInUser.searchForLessonInSearchBar('Rational Numbers');
      await loggedInUser.playLessonFromSearchResults('Rational Numbers');
      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );
      await loggedInUser.rateExploration(3, 'Nice!', false);

      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.expectAverageRatingAndUsersToBe(3, 1);
      await explorationEditor.expectTotalPlaysToBe(1);
      await explorationEditor.expectOpenFeedbacksToBe(1);
      await explorationEditor.expectNumberOfSubscribersToBe(0);
      await explorationEditor.expectNumberOfExplorationsToBe(5);
      await explorationEditor.expectExplorationNameToAppearNTimes(
        'Rational Numbers'
      );
      await explorationEditor.expectExplorationNameToAppearNTimes(
        'Real Numbers'
      );
      await explorationEditor.expectExplorationNameToAppearNTimes('Fractions');
      await explorationEditor.expectExplorationNameToAppearNTimes(
        'Untitled',
        2
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
