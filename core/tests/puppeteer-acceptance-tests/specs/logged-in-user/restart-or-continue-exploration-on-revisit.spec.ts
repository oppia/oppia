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
 * @fileoverview Acceptance test coverage for restarting or continuing a lesson from the most recently
 * visited checkpoint in an exploration, completing it, and starting it from the beginning upon revisiting.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

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
      'Algebra',
      'growth'
    );

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to restart or continue from the most recently visited checkpoint in an exploration, complete it, and expect it to start from the beginning upon revisiting.',
    async function () {
      // Navigate to the community library page and start an exploration.
      await loggedInUser.navigateToCommunityLibraryPage();
      await loggedInUser.searchForLessonInSearchBar('Positive Numbers');
      await loggedInUser.playLessonFromSearchResults('Positive Numbers');

      // Continue to the next card and submit an answer.
      await loggedInUser.continueToNextCard();
      await loggedInUser.submitAnswer('-25');
      await loggedInUser.continueToNextCard();

      // Verify that the checkpoint modal appears and reload the page.
      await loggedInUser.verifyCheckpointModalAppears();

      // Reloading from the current progress.
      await loggedInUser.reloadPage();

      await loggedInUser.expectProgressRemainder(true);
      // Continue the exploration from where they left off.
      await loggedInUser.chooseActionInProgressRemainder('Restart');

      await loggedInUser.continueToNextCard();
      await loggedInUser.submitAnswer('-99');
      await loggedInUser.continueToNextCard();

      // Again reload the page to check the 'Resume' exploration in the progress remainder as well.
      await loggedInUser.reloadPage();
      await loggedInUser.expectProgressRemainder(true);
      await loggedInUser.chooseActionInProgressRemainder('Resume');

      await loggedInUser.continueToNextCard();
      await loggedInUser.expectCardContentToMatch(
        'Lesson completed successfully. We have practiced negative numbers.'
      );

      // TODO(#20563): Uncomment the following lines when issue #20563 is resolved.
      // Issue #20563: When a user revisits an exploration after completing it,
      // the exploration should start from the beginning, not from the previous checkpoint.
      // see: https://github.com/oppia/oppia/issues/20563.

      // // Revisit the exploration and expect it to start from the beginning.
      // await loggedInUser.navigateToCommunityLibraryPage();
      // await loggedInUser.searchForLessonInSearchBar('Positive Numbers');
      // await loggedInUser.playLessonFromSearchResults('Positive Numbers');

      // // Expecting the card content to match the initial card content.
      // await loggedInUser.expectCardContentToMatch(
      //   'We will be learning positive numbers.'
      // );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
