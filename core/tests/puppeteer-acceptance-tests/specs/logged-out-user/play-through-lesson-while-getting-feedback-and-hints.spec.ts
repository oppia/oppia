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
  FRACTION_INPUT = 'Fraction Input',
  MULTIPLE_CHOICE = 'Multiple Choice',
  END_EXPLORATION = 'End Exploration',
}

enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  ALGEBRA_BASICS = 'Algebra Basics',
  FRACTION_CONVERSION = 'Fraction Conversion',
  MULTIPLE_CHOICE_QUESTION = 'Multiple Choice Question',
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

    // Add a new card with a basic algebra problem.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.ALGEBRA_BASICS);
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.ALGEBRA_BASICS);
    await explorationEditor.updateCardContent('Solve the equation 2x = 10.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMERIC_INPUT,
      '5',
      'Perfect!',
      CARD_NAME.FRACTION_CONVERSION,
      true
    );
    await explorationEditor.editDefaultResponseFeedback('Wrong, try again!');

    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and add a fraction conversion problem.
    await explorationEditor.navigateToCard(CARD_NAME.FRACTION_CONVERSION);
    await explorationEditor.updateCardContent('Express 50% as a fraction.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      '1/2',
      'Correct!',
      CARD_NAME.MULTIPLE_CHOICE_QUESTION,
      true
    );
    await explorationEditor.editDefaultResponseFeedback(
      'Incorrect, try again!',
      undefined,
      CARD_NAME.MULTIPLE_CHOICE_QUESTION
    );
    await explorationEditor.addHintToState(
      'Remember that 50% is the same as 1/2.'
    );
    await explorationEditor.addSolutionToState(
      '1/2',
      'The fraction 1/2 is equivalent to 50%.'
    );

    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and add a multiple choice question.
    await explorationEditor.navigateToCard(CARD_NAME.MULTIPLE_CHOICE_QUESTION);
    await explorationEditor.updateCardContent(
      'Which of the following is equivalent to 1/2?'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.MULTIPLE_CHOICE);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.MULTIPLE_CHOICE,
      '0.5',
      'Correct!',
      CARD_NAME.FINAL_CARD,
      true
    );
    await explorationEditor.editDefaultResponseFeedback(
      'Incorrect, try again!'
    );

    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.updateCardContent(
      'Congratulations! You have completed the exploration.'
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
      await loggedOutUser.navigateToCommunityLibraryPage();

      await loggedOutUser.searchForLessonInSearchBar('Algebra Basics');
      await loggedOutUser.selectLessonInSearchResults('Algebra Basics');

      await loggedOutUser.continueToNextCard();
      await loggedOutUser.verifyCheckpointModalAppears();
      await loggedOutUser.submitAnswer('5');
      await loggedOutUser.expectOppiaFeedbackToBe('Perfect!');

      await loggedOutUser.continueToNextCard();
      await loggedOutUser.navigateBackToPreviousCard();
      await loggedOutUser.verifyCannotAnswerPreviouslyAnsweredQuestion();
      await loggedOutUser.continueToNextCard();

      // Wrong answer is submitted to test the feedback response and get hint option.
      await loggedOutUser.submitAnswer('1/4');
      await loggedOutUser.useHint();
      await loggedOutUser.closeHintModal();

      // Again wrong answer is submitted number of times to to get stuck and navigate to help card.
      await loggedOutUser.submitAnswer('1/3');
      await loggedOutUser.submitAnswer('1/4');
      await loggedOutUser.submitAnswer('1/5');
      await loggedOutUser.submitAnswer('1/6');
      await loggedOutUser.viewPreviousResponses();
      await loggedOutUser.verifyNumberOfPreviousResponsesDisplayed(5);

      await loggedOutUser.continueToNextCard();
      await loggedOutUser.submitAnswer('0.5');
      await loggedOutUser.expectOppiaFeedbackToBe('Correct!');
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
