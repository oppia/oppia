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
 * @fileoverview Acceptance tests for the user journey below.
 * User Journey: Adding an exploration to 'play later' from the community library page,
 * playing the exploration from the learner dashboard, and then removing it from 'play later'.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-in User', function () {
  let explorationEditor: ExplorationEditor;
  let loggedInUser: LoggedInUser & LoggedOutUser;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
      'Positive Numbers'
    );
    await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
      'Negative Numbers'
    );

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to add an exploration to play later, play it from the learner dashboard, and then remove it.',
    async function () {
      await loggedInUser.navigateToCommunityLibraryPage();

      // Add a lesson to 'play later'.
      await loggedInUser.addLessonToPlayLater('Negative Numbers');
      await loggedInUser.expectToolTipMessage(
        "Successfully added to your 'Play Later' list."
      );

      // Add a lesson to 'play later'.
      await loggedInUser.addLessonToPlayLater('Positive Numbers');
      await loggedInUser.expectToolTipMessage(
        "Successfully added to your 'Play Later' list."
      );

      // Navigate to the learner dashboard and play the lesson.
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToCommunityLessonsSection();
      await loggedInUser.verifyLessonPresenceInPlayLater(
        'Positive Numbers',
        true
      );
      await loggedInUser.playLessonFromDashboard('Positive Numbers');

      // The exploration has a single state.
      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      // Navigate back to the learner dashboard and remove the lesson from play later.
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToCommunityLessonsSection();

      // Since the exploration played, it should have been automatically removed from the "play later" list.
      await loggedInUser.verifyLessonPresenceInPlayLater(
        'Positive Numbers',
        false
      );

      // Removing a lesson from play later list.
      await loggedInUser.removeLessonFromPlayLater('Negative Numbers');
      await loggedInUser.verifyLessonPresenceInPlayLater(
        'Positive Numbers',
        false
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
