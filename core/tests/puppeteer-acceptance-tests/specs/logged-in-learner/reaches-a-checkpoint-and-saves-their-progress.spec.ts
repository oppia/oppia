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
 * LI. Learner reaches a checkpoint and saves their progress
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-in User', function () {
  let explorationEditor: ExplorationEditor;
  let loggedInUser: LoggedInUser & LoggedOutUser;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent(
      'We will be learning positive numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with a question.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard('Test Question');
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await explorationEditor.navigateToCard('Test Question');
    await explorationEditor.updateCardContent(
      'Enter a negative number greater than -100.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMERIC_INPUT,
      '-99',
      'Prefect!',
      'Study Guide',
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong, try again!'
    );
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and Study Guide content.
    await explorationEditor.navigateToCard('Study Guide');
    await explorationEditor.updateCardContent(
      'Positive numbers are greater than zero.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard('Final Card');
    await explorationEditor.setTheStateAsCheckpoint();
    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard('Final Card');
    await explorationEditor.updateCardContent(
      'Lesson completed successfully. We have practiced negative numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard('Introduction');
    await explorationEditor.saveExplorationDraft();

    await explorationEditor.publishExplorationWithMetadata(
      'Positive Numbers',
      'Learn positive numbers.',
      'Algebra',
      'growth'
    );

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it('should be able to track the checkpoint progress', async function () {
    await loggedInUser.navigateToCommunityLibraryPage();
    await loggedInUser.searchForLessonInSearchBar('Positive Numbers');
    await loggedInUser.playLessonFromSearchResults('Positive Numbers');

    // Continue to the next card and submit an answer.
    await loggedInUser.continueToNextCard();
    await loggedInUser.submitAnswer('-25');
    await loggedInUser.continueToNextCard();

    // Verify that the checkpoint modal appears and reload the page.
    await loggedInUser.verifyCheckpointModalAppears();
  });

  it('should be able to resume the lesson from the last progress saved', async function () {
    // Again reload the page to check the 'Resume' exploration in the progress remainder as well.
    await loggedInUser.reloadPage();
    await loggedInUser.expectProgressReminder(true);
    await loggedInUser.chooseActionInProgressRemainder('Resume');

    await loggedInUser.continueToNextCard();
    await loggedInUser.expectCardContentToMatch(
      'Lesson completed successfully. We have practiced negative numbers.'
    );
  });

  it('should be able to restart the lesson from the beginning', async function () {
    // Reloading from the current progress.
    await loggedInUser.reloadPage();

    await loggedInUser.expectProgressReminder(true);
    // Continue the exploration from where they left off.
    await loggedInUser.chooseActionInProgressRemainder('Restart');

    await loggedInUser.continueToNextCard();
    await loggedInUser.submitAnswer('-99');
    await loggedInUser.continueToNextCard();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);
});
