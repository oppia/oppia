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
 * @fileoverview Acceptance tests for the user journey of signing in and saving exploration progress in
 * the middle of exploration.
 * User Journey: Starting an exploration without signing in, making progress,
 * signing up during the exploration, verifying that progress is saved, continuing
 * the exploration, and completing the exploration.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  NUMERIC_INPUT = 'Number Input',
  END_EXPLORATION = 'End Exploration',
}
enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  TEST_QUESTION = 'Test Question',
  REVISION_CARD = 'Revision Card',
  FINAL_CARD = 'Final Card',
}

ConsoleReporter.setConsoleErrorsToIgnore([
  'Failed to load resource: net::ERR_NETWORK_CHANGED',
]);

describe('Logged-out User', function () {
  let explorationEditor: ExplorationEditor;
  let loggedOutUser: LoggedOutUser;

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
    await explorationEditor.navigateToCard(CARD_NAME.TEST_QUESTION);
    await explorationEditor.updateCardContent(
      'Enter a negative number greater than -100.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMERIC_INPUT,
      '-99',
      'Prefect!',
      CARD_NAME.REVISION_CARD,
      true
    );
    await explorationEditor.editDefaultResponseFeedback('Wrong, try again!');
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and Revision content.
    await explorationEditor.navigateToCard(CARD_NAME.REVISION_CARD);
    await explorationEditor.updateCardContent(
      'Positive numbers are greater than zero.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.setTheStateAsCheckpoint();
    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.updateCardContent(
      'Lesson completed successfully. We have practiced negative numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
    await explorationEditor.saveExplorationDraft();

    await explorationEditor.publishExplorationWithMetadata(
      'Positive Numbers',
      'Learn positive numbers.',
      'Algebra'
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to play the exploration without signing in, sign in at any point, save progress, and clear progress',
    async function () {
      await loggedOutUser.navigateToCommunityLibraryPage();
      await loggedOutUser.searchForLessonInSearchBar('Positive Numbers');
      await loggedOutUser.playLessonFromSearchResults('Positive Numbers');
      await loggedOutUser.continueToNextCard();

      // Make some progress in the exploration.
      await loggedOutUser.submitAnswer('-25');
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.verifyCheckpointModalAppears();

      // Choose to sign up at this point.
      await loggedOutUser.signUpFromTheLessonPlayer(
        'learner@example.com',
        'learner'
      );

      // Rest of the action is done being logged-in in the same window as the same logged-out user needs to login to check if the progress if moved to permanent mode.

      await loggedOutUser.continueToNextCard();
      await loggedOutUser.submitAnswer('-50');
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.verifyCheckpointModalAppears();

      // Reloading from the current progress.
      await loggedOutUser.reloadPage();

      await loggedOutUser.expectProgressRemainder(true);
      // Continue the exploration from where they left off.
      await loggedOutUser.chooseActionInProgressRemainder('Restart');

      await loggedOutUser.continueToNextCard();
      await loggedOutUser.submitAnswer('-99');
      await loggedOutUser.continueToNextCard();

      // Again reload the page to check the 'Resume' exploration in the progress remainder as well.
      await loggedOutUser.reloadPage();
      await loggedOutUser.expectProgressRemainder(true);
      await loggedOutUser.chooseActionInProgressRemainder('Resume');

      await loggedOutUser.continueToNextCard();
      await loggedOutUser.expectCardContentToMatch(
        'Lesson completed successfully. We have practiced negative numbers.'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
