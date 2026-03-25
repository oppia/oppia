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
 * EL.HC. Learner can use the feedback and help cards
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';

enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  SECOND_CARD = 'Second Card',
  FRACTION_CONVERSION = 'Fraction Conversion',
  STUDY_GUIDE = 'Study Guide',
  FINAL_CARD = 'Final Card',
}

describe('Logged-Out Learner', function () {
  let explorationEditor: ExplorationEditor;
  let loggedOutLearner: LoggedOutUser;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    loggedOutLearner = await UserFactory.createLoggedOutUser();

    await explorationEditor.navigateToCreatorDashboardPageInExplorationEditor();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModalInExplorationEditor();
    await explorationEditor.updateCardContentInExplorationEditor(
      'Welcome, to the Place Values Exploration.'
    );
    await explorationEditor.addInteractionInExplorationEditor(
      INTERACTION_TYPES.CONTINUE_BUTTON
    );

    // Add a new card with a basic algebra problem.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.SECOND_CARD);
    await explorationEditor.saveExplorationDraftInExplorationEditor();

    // Navigate to the new card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.SECOND_CARD);
    await explorationEditor.setTheStateAsCheckpoint();
    await explorationEditor.updateCardContentInExplorationEditor(
      'Give fraction with denominator 2.'
    );
    await explorationEditor.addInteractionInExplorationEditor(
      INTERACTION_TYPES.FRACTION_INPUT
    );

    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      '2',
      'Perfect!',
      CARD_NAME.FINAL_CARD,
      true,
      false
    );
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      '9',
      'Wrong!',
      CARD_NAME.INTRODUCTION,
      false,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong, try again!'
    );
    await explorationEditor.addHintToStateInExplorationEditor(
      'We can have any numerator.'
    );
    await explorationEditor.addHintToStateInExplorationEditor(
      'Numerator is the number on top.'
    );

    await explorationEditor.addSolutionToStateInExplorationEditor(
      '1/2',
      '1/2 here 1 is the numerator and 2 is the denominator.',
      true
    );
    await explorationEditor.saveExplorationDraftInExplorationEditor();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.updateCardContentInExplorationEditor(
      'Congratulations! You have completed the exploration.'
    );
    await explorationEditor.addInteractionInExplorationEditor(
      INTERACTION_TYPES.END_EXPLORATION
    );

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
    await explorationEditor.saveExplorationDraftInExplorationEditor();
    await explorationEditor.publishExplorationWithMetadataInExplorationEditor(
      'What are the Place Values?',
      'Learn basic Mathematics including Place Values',
      'Mathematics'
    );
  });

  it('should be able to see the first card', async function () {
    // Navigate to Lesson Player.
    await loggedOutLearner.navigateToCommunityLibraryPage();
    await loggedOutLearner.searchForLessonInSearchBar(
      'What are the Place Values?'
    );
    await loggedOutLearner.playLessonFromSearchResults(
      'What are the Place Values?'
    );
    await loggedOutLearner.expectCardContentToMatch(
      'Welcome, to the Place Values Exploration.'
    );
    await loggedOutLearner.expectContinueToNextCardButtonToBePresent();
  });

  it('should be able to check the concept card', async function () {
    // TODO(#22740): Concept card isn't working properly.
  });

  it('should be able to continue to next card', async function () {
    await loggedOutLearner.continueToNextCardInLoggedOutUser();
    await loggedOutLearner.expectCardContentToMatch(
      'Give fraction with denominator 2.'
    );
    await loggedOutLearner.expectGoBackToPreviousCardButton(true);
    await loggedOutLearner.expectContinueToNextCardButtonToBePresent(false);
    await loggedOutLearner.verifyCheckpointModalAppears();
    await loggedOutLearner.expectFractionInputToBeVisible();
    await loggedOutLearner.expectSubmitButtonToBe('Visible');
    await loggedOutLearner.expectScreenshotToMatch(
      'fractionInputInLessonPlayer',
      __dirname
    );
  });

  it('should be able to get feedback on the incorrect answer', async function () {
    await loggedOutLearner.submitAnswerInLoggedOutUser('1/4');
    await loggedOutLearner.expectOppiaFeedbackToBe('Wrong, try again!');
  });

  it('should be able to get a hint or solution when user gets stuck', async function () {
    await loggedOutLearner.submitAnswerInLoggedOutUser('ABC');
    await loggedOutLearner.expectErrorMessageForWrongInputToBe(
      'Please only use numerical digits, spaces or forward slashes (/)'
    );
    await loggedOutLearner.expectSubmitButtonToBe('Disabled');
    await loggedOutLearner.expectAnswerInputValueToBe('ABC');

    // View Hint for the first time.
    await loggedOutLearner.viewHint();
    await loggedOutLearner.closeHintModal();

    // View Hint for the second time.
    await loggedOutLearner.waitForHintModelsToBe(2);
    await loggedOutLearner.expectHintModelsToBe(2);
    await loggedOutLearner.viewHint();
    await loggedOutLearner.closeHintModal();

    // View Solution.
    await loggedOutLearner.submitAnswerInLoggedOutUser('1/3');
    await loggedOutLearner.submitAnswerInLoggedOutUser('2/3');
    await loggedOutLearner.viewSolution(180000);
    await loggedOutLearner.closeSolutionModal();
  });

  it('should be able to learn again on wrong answer', async function () {
    await loggedOutLearner.submitAnswerInLoggedOutUser('2/9');
    await loggedOutLearner.expectNextCardButtonTextToBe('LEARN AGAIN');
    await loggedOutLearner.continueToNextCardInLoggedOutUser();
    await loggedOutLearner.expectCardContentToMatch(
      'Welcome, to the Place Values Exploration.'
    );
    await loggedOutLearner.continueToNextCardInLoggedOutUser();
  });

  it('should be able to submit a correct answer and see the celebration pop-up', async function () {
    await loggedOutLearner.submitAnswerInLoggedOutUser('1/2');

    await loggedOutLearner.continueToNextCardInLoggedOutUser();
    await loggedOutLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
