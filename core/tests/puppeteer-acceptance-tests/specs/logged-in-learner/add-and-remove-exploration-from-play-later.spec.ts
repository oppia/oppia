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
 * LI.PL. Learner selects an exploration to “play later” from the community library
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
      'Negative Numbers',
      'Algebra',
      false
    );
    await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
      'Whole Numbers',
      'Algebra',
      false
    );

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it('should be able to navigate to community library', async function () {
    await loggedInUser.navigateToCommunityLibraryOnNavbar();
  });

  it('should be able to save an exploration to play later', async function () {
    // Add a lesson to 'play later'.
    await loggedInUser.addLessonToPlayLater('Negative Numbers', true);
    await loggedInUser.expectToolTipMessage(
      "Successfully added to your 'Play Later' list."
    );

    // Add other lessons to 'play later'.
    await loggedInUser.addLessonToPlayLater('Positive Numbers');
    await loggedInUser.addLessonToPlayLater('Whole Numbers');
  });

  it('should be able to remove an exploration from play later in community library', async function () {
    await loggedInUser.expectPlayLaterIconToolTipToBe(
      'Whole Numbers',
      'Already added to playlist'
    );
    await loggedInUser.removeLessonFromPlayLaterInlibrary('Whole Numbers');

    await loggedInUser.expectPlayLaterIconToolTipToBe(
      'Whole Numbers',
      "Add to 'Play Later' list"
    );
  });

  it('should be able to check play later in learner dashboard', async function () {
    // Navigate to the learner dashboard and play the lesson.
    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToCommunityLessonsSection();
    await loggedInUser.verifyLessonPresenceInPlayLater(
      'Positive Numbers',
      true
    );
    await loggedInUser.verifyLessonPresenceInPlayLater(
      'Negative Numbers',
      true
    );

    // "Whole Numbers" exploration should not be present.
    await loggedInUser.verifyLessonPresenceInPlayLater('Whole Numbers', false);
  });

  it('should be able to remove exploration from play later in learner dashboard', async function () {
    // Removing a lesson from play later list.
    await loggedInUser.removeLessonFromPlayLater('Negative Numbers');
    await loggedInUser.verifyLessonPresenceInPlayLater(
      'Negative Numbers',
      false
    );
  });

  it('should be able to play exploration from play later', async function () {
    await loggedInUser.playLessonFromDashboard('Positive Numbers');

    // The exploration has a single state.
    await loggedInUser.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    // Navigate back to the learner dashboard and check lesson is removed from play later.
    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToCommunityLessonsSection();

    // Since the exploration played, it should have been automatically removed from the "play later" list.
    await loggedInUser.verifyLessonPresenceInPlayLater(
      'Positive Numbers',
      false
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
