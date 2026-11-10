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
 * @fileoverview Acceptance tests for the user journey of signing in and saving exploration progress in
 * the middle of exploration.
 * User Journey: Starting an exploration without signing in, making progress,
 * signing up during the exploration, verifying that progress is saved, continuing
 * the exploration, and completing the exploration.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';

enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  TEST_QUESTION = 'Test Question',
  STUDY_GUIDE = 'Study Guide',
  FINAL_CARD = 'Final Card',
}

test.describe.configure({mode: 'serial'});

test.describe('Logged-out User', function () {
  let explorationEditor: ExplorationEditor;
  let loggedOutUser: LoggedOutUser;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(900000);

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com',
      browser
    );

    loggedOutUser = await UserFactory.createLoggedOutUser(browser);

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent(
      'We will be learning positive numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with a question.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.TEST_QUESTION);
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.TEST_QUESTION);
    await explorationEditor.updateCardContent('Enter a negative number.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMERIC_INPUT,
      '-1',
      'Prefect!',
      CARD_NAME.STUDY_GUIDE,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong, try again!'
    );
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and Study Guide content.
    await explorationEditor.navigateToCard(CARD_NAME.STUDY_GUIDE);
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
  });

  test('should be able to play the exploration without signing in, sign in at any point, save progress, and clear progress', async function () {
    test.setTimeout(900000);

    await loggedOutUser.navigateToCommunityLibraryPage();
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

    await loggedOutUser.expectProgressReminder(true);
    // Continue the exploration from where they left off.
    await loggedOutUser.chooseActionInProgressRemainder('Restart');

    await loggedOutUser.continueToNextCard();
    await loggedOutUser.submitAnswer('-99');
    await loggedOutUser.continueToNextCard();

    // Again reload the page to check the 'Resume' exploration in the progress remainder as well.
    await loggedOutUser.reloadPage();
    await loggedOutUser.expectProgressReminder(true);
    await loggedOutUser.chooseActionInProgressRemainder('Resume');

    await loggedOutUser.continueToNextCard();
    await loggedOutUser.expectCardContentToMatch(
      'Lesson completed successfully. We have practiced negative numbers.'
    );
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
