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
 * @fileoverview End-to-end tests for the learner's journey from the last state/card of an exploration.
 * The tests include:
 * - Setup: Creation of exploration, topic, subtopic, skill, story, and classroom by a curriculum admin.
 * - User Journey: Navigation to classroom, selection of topic, completion of exploration by a logged-out user.
 * - Loading the next chapter, loading the practice session page, and returning to the story from the last state of an exploration.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  NUMERIC_INPUT = 'Number Input',
  END_EXPLORATION = 'End Exploration',
}
enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  ALGEBRA_BASICS = 'Algebra Basics',
  FINAL_CARD = 'Final Card',
}

describe('Logged-out User', function () {
  let explorationEditor: ExplorationEditor;
  let loggedOutUser: LoggedOutUser;
  let explorationId: string | null;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent('Introduction to Algebra');
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with a question.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.ALGEBRA_BASICS);
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.ALGEBRA_BASICS);
    await explorationEditor.updateCardContent(
      'Enter a negative number greater than -100.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMERIC_INPUT,
      '-99',
      'Perfect!',
      CARD_NAME.FINAL_CARD,
      true
    );
    await explorationEditor.addOppiaResponsesForWrongAnswers(
      'Wrong, try again!'
    );

    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.updateCardContent(
      'We have practiced negative numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
    await explorationEditor.saveExplorationDraft();
    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'Algebra Basics',
      'Learn the basics of Algebra',
      'Algorithms'
    );

    if (!explorationId) {
      throw new Error('Error publishing exploration successfully.');
    }
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should simulate a learner journey where a user interacts with different interactions, views rich-text components, receives feedback, navigates through cards, uses concept cards and hints, views previous responses, and reaches a checkpoint',
    async function () {
      await loggedOutUser.visitCommunityLibrary();

      await loggedOutUser.searchForLesson('Algebra I');
      await loggedOutUser.selectLessonFromResults('Algebra I');

      await loggedOutUser.interactWithInteraction();
      await loggedOutUser.viewRichTextComponents();

      await loggedOutUser.submitAnswer('-40');
      await loggedOutUser.viewOppiaFeedback();

      await loggedOutUser.navigateBackToPreviousCard();
      await loggedOutUser.useHint();

      await loggedOutUser.viewPreviousResponses();
      await loggedOutUser.verifyCannotAnswerPreviouslyAnsweredQuestion();

      if (await loggedOutUser.isStuck()) {
        await loggedOutUser.navigateToHelpCard();
      }

      await loggedOutUser.continueToNextCard();

      await loggedOutUser.verifyCheckpointModalAppears();
      await loggedOutUser.verifyCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
