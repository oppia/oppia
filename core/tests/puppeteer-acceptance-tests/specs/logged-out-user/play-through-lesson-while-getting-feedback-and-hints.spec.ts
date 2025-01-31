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
 * @fileoverview Acceptance tests for the learner's journey through an exploration.
 * The tests include:
 * - Setup: Creation of exploration by an exploration editor.
 * - User Journey: Navigation to the exploration, interaction with different types of questions, receiving feedback, using hints, viewing previous responses, and reaching a checkpoint by a logged-out user.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const REVISION_CARD_CONTENT =
  'Remember, a fraction represents a part of a whole. It consists of a numerator and a denominator.';

enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  NUMERIC_INPUT = 'Number Input',
  FRACTION_INPUT = 'Fraction Input',
  END_EXPLORATION = 'End Exploration',
}

enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  ALGEBRA_BASICS = 'Algebra Basics',
  FRACTION_CONVERSION = 'Fraction Conversion',
  REVISION_CARD = 'Revision Card',
  FINAL_CARD = 'Final Card',
}

ConsoleReporter.setConsoleErrorsToIgnore([
  /https:\/\/pencilcode\.net\/lib\/pencilcodeembed\.js Failed to load resource: net::ERR_CERT_.*/,
  /ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value: 'disabled: false'. Current value: 'disabled: true'./,
  /ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value: 'ng-untouched: true'. Current value: 'ng-untouched: false'./,
]);

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
    await explorationEditor.updateCardContent('Enter a negative number.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);

    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMERIC_INPUT,
      '-1',
      'Perfect!',
      CARD_NAME.FRACTION_CONVERSION,
      true
    );
    await explorationEditor.editDefaultResponseFeedback('Wrong, try again!');
    await explorationEditor.addHintToState(
      'Remember that negative numbers are less than 0.'
    );
    await explorationEditor.addSolutionToState(
      '-99',
      'The number -99 is a negative number.',
      true
    );
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and add a fraction conversion problem.
    await explorationEditor.navigateToCard('Fraction Con...');
    await explorationEditor.updateCardContent('Express 50% as a fraction.');
    await explorationEditor.addMathInteraction(
      INTERACTION_TYPES.FRACTION_INPUT
    );
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      '2',
      'Correct!',
      CARD_NAME.FINAL_CARD,
      true
    );

    await explorationEditor.editDefaultResponseFeedback(
      'Incorrect, try again!',
      undefined,
      CARD_NAME.REVISION_CARD
    );

    await explorationEditor.addHintToState(
      'Remember that 50% is the same as 1/2.'
    );
    await explorationEditor.setTheStateAsCheckpoint();
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and add revision content.
    await explorationEditor.navigateToCard(CARD_NAME.REVISION_CARD);
    await explorationEditor.updateCardContent(REVISION_CARD_CONTENT);
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToAlreadyExistingCard(
      CARD_NAME.FINAL_CARD
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
    'should be able to interact with different interactions,receive feedback, navigates through cards, uses hints, views previous responses, and reaches a checkpoint',
    async function () {
      await loggedOutUser.navigateToCommunityLibraryPage();
      await loggedOutUser.searchForLessonInSearchBar('Algebra Basics');
      await loggedOutUser.playLessonFromSearchResults('Algebra Basics');
      await loggedOutUser.continueToNextCard();

      // Wrong answer is submitted number of times to get to see hints.
      await loggedOutUser.submitAnswer('40');
      await loggedOutUser.expectOppiaFeedbackToBe('Wrong, try again!');
      await loggedOutUser.submitAnswer('5');
      await loggedOutUser.viewHint();
      await loggedOutUser.closeHintModal();

      // Again wrong answer is submitted number of times to get stuck and get to see the solution.
      await loggedOutUser.submitAnswer('69');
      await loggedOutUser.submitAnswer('39');
      await loggedOutUser.simulateDelayToAvoidFatigueDetection();
      await loggedOutUser.submitAnswer('59');
      await loggedOutUser.viewSolution();
      await loggedOutUser.closeSolutionModal();

      await loggedOutUser.submitAnswer('-39');
      await loggedOutUser.expectOppiaFeedbackToBe('Perfect!');
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.verifyCheckpointModalAppears();
      await loggedOutUser.goBackToPreviousCard();
      await loggedOutUser.verifyCannotAnswerPreviouslyAnsweredQuestion();
      await loggedOutUser.continueToNextCard();

      // Wrong answer is submitted to get to see hints.
      await loggedOutUser.submitAnswer('1/4');
      await loggedOutUser.submitAnswer('1/3');
      await loggedOutUser.viewHint();
      await loggedOutUser.closeHintModal();

      // Again wrong answer is submitted number of times to get stuck and navigate to Revision card.
      await loggedOutUser.submitAnswer('1/3');
      await loggedOutUser.submitAnswer('1/4');
      await loggedOutUser.simulateDelayToAvoidFatigueDetection();
      await loggedOutUser.submitAnswer('1/5');
      await loggedOutUser.viewPreviousResponses();
      await loggedOutUser.verifyNumberOfPreviousResponsesDisplayed(5);
      await loggedOutUser.continueToNextCard();

      // Verifying if navigated to the expected card after getting stuck.
      await loggedOutUser.expectCardContentToMatch(REVISION_CARD_CONTENT);
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
