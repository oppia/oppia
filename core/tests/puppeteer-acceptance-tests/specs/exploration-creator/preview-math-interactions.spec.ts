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
 * EC.EE. Preview Math interactions.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const CARD_NAMES = {
  FIRST: 'Introduction',
  SECOND: '2nd Card',
  THIRD: '3rd Card',
  FOURTH: '4th Card',
  FIFTH: '5th Card',
  SIXTH: '6th Card',
  SEVENTH: '7th Card',
  EIGHTH: '8th Card',
  NINTH: '9th Card',
};

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor & LoggedInUser & LoggedOutUser;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();
  });

  it('should be able to preview "Fraction Input" interaction', async function () {
    // Add Fraction Input Interaction.
    await explorationEditor.updateCardContent('Enter a fraction: 1/2.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      '2',
      'Perfect!',
      CARD_NAMES.SECOND,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState('The hint is 1/2');
    await explorationEditor.addSolutionToState(
      '1/2',
      'As given in the question.',
      true
    );
    await explorationEditor.saveExplorationDraft();

    // Submit a wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitAnswerInInputField('1/3');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // Submit a blank answer.
    await explorationEditor.submitAnswerInInputField('');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Please enter a valid fraction (e.g., 5/3 or 1 2/3)'
    );
    // Submit answer with invalid characters.
    await explorationEditor.submitAnswerInInputField('1/2a');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Please only use numerical digits, spaces or forward slashes (/)'
    );
    // View Hint.
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain('The hint is 1/2');
      await explorationEditor.closeHintModal();
    }
    // Submit correct answer.
    await explorationEditor.submitAnswerInInputField('1/2');
    await explorationEditor.expectResponseFeedbackToBe('Perfect!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.SECOND);
  });

  it('should be able to preview "Graph Theory" interaction', async function () {
    // Add a graph theory interaction.
    await explorationEditor.updateCardContent('Create a star topology.');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.GRAPH_THEORY,
      false
    );
    await explorationEditor.customizeGraphTheoryInteraction();
    await explorationEditor.updateGraphTheoryLearnerAnswerInResponseModal();
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.THIRD,
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState(
      'Create a star topology using all 4 nodes.'
    );

    // Move node.
    // await explorationEditor.expectGraphNodeCanBeMoved();

    // Move node.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.expectGraphNodeCanBeMoved();
    // Remove and add node.
    await explorationEditor.expectGraphNodeCanBeRemoved();
    await explorationEditor.expectGraphNodeCanBeAdded();
    // Submit worng answer.
    await explorationEditor.submitGraphStarNetworkSolution(3);
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // View Hint.
    await explorationEditor.removeFeedbackResponseInPreviewTab();
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain(
        'Create a star topology using all 4 nodes.'
      );
      await explorationEditor.closeHintModal();
    }
    // Submit a correct answer.
    await explorationEditor.submitGraphStarNetworkSolution(4);
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.THIRD);
  });

  it('should be able to preview "Set Input" interaction', async function () {
    // Add Set Input Interaction.
    await explorationEditor.updateCardContent('Enter a set.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.SET_INPUT);
    await explorationEditor.updateSetInputLearnerAnswerInResponseModal(
      'is equal to',
      ['1', '2', '3']
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.FOURTH,
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState('The hint is [1, 2, 3]');
    await explorationEditor.addSetInputSolutionToState(
      ['1', '2', '3'],
      'as given in the question.'
    );

    // Preview tab.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.expectPreviewCardContentToBe(
      CARD_NAMES.THIRD,
      'Enter a set.'
    );
    // Submit wrong answer. Also, verifies clicking on "Add Item" adds new item.
    await explorationEditor.submitInputSetAnswer(['5', '6']);
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // View Hint.
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain(
        'The hint is [1, 2, 3]'
      );
      await explorationEditor.closeHintModal();
    }
    // Submit correct answer.
    await explorationEditor.submitInputSetAnswer(['1', '2', '3']);
    await explorationEditor.expectResponseFeedbackToBe('Great!');
    // Submit an answer with duplicate values.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitInputSetAnswer(['1', '1'], false);
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Oops, it looks like your answer has duplicates!'
    );

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.FOURTH);
  });

  it('should be able to preview "Numeric Expression" interaction', async function () {
    // Add a numeric expression interaction.
    await explorationEditor.updateCardContent('Enter a numeric expression.');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.NUMERIC_EXPRESSION
    );
    await explorationEditor.updateNumericExpressionLearnerAnswerInResponseModal(
      'matches exactly with',
      'sqrt2'
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.FIFTH,
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState('The hint is sqrt2');
    // Add solution.
    await explorationEditor.addNumbericInteractionSolutionToState(
      'sqrt2',
      'as given in the question.'
    );
    await explorationEditor.saveExplorationDraft();

    // Submit a wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitExpressionAnswer('sqrt3');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // View Hint.
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain(
        'The hint is sqrt2'
      );
      await explorationEditor.closeHintModal();
    }
    // Submit correct answer.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitExpressionAnswer('sqrt2');
    await explorationEditor.expectResponseFeedbackToBe('Great!');
    // Submit an answer with non-numeric value.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitExpressionAnswer('hello');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'It looks like you have entered some variables. Please enter numbers only.'
    );

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.FIFTH);
  });

  it('should be able to preview "Algebric Expression" intreaction', async function () {
    // Add a algebric expression interaction.
    await explorationEditor.updateCardContent('Enter a algebric expression.');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.ALGEBRAIC_EXPRESSION,
      false
    );
    await explorationEditor.customizeAlgebricExpressionInputInteraction(
      'ab',
      false
    );
    await explorationEditor.updateAlgebricExpressionLearnerAnswerInResponseModal(
      'matches exactly with',
      'a+b'
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.SIXTH,
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState('The hint is a+b');
    // Add solution.
    await explorationEditor.addAlgebricExpressionSolutionToState(
      'a+b',
      'as given in the question.'
    );
    await explorationEditor.saveExplorationDraft();

    // Submit a wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitExpressionAnswer('a-b');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // View Hint.
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain('The hint is a+b');
      await explorationEditor.closeHintModal();
    }
    // Submit a correct answer.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitExpressionAnswer('a+b');
    await explorationEditor.expectResponseFeedbackToBe('Great!');
    // Submit a blank answer.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitExpressionAnswer('');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Please enter an answer before submitting.'
    );
    // Submit an answer with invalid characters.
    await explorationEditor.submitExpressionAnswer('a+y');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'You have entered an invalid variable: y. Please use only the variables a,b in your answer.'
    );

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.SIXTH);
  });

  it('should be able to preview "Math Equation" interaction', async function () {
    // Add a math equation interaction.
    await explorationEditor.updateCardContent('Enter a math equation.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.MATH_EQUATION);
    await explorationEditor.updateMathEquationLearnerAnswerInResponseModal(
      'matches exactly with',
      '5x=2+3'
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.SEVENTH,
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState('The hint is 5x=2+3');
    // Add solution.
    await explorationEditor.addMathEquationSolutionToState(
      '5x=2+3',
      'as given in the question.'
    );
    await explorationEditor.saveExplorationDraft();

    // Submit wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitExpressionAnswer('5x=2+1');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // Submit a blank answer.
    await explorationEditor.submitExpressionAnswer('');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Please enter an answer before submitting.'
    );
    // View Hint.
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain(
        'The hint is 5x=2+3'
      );
      await explorationEditor.closeHintModal();
    }
    // Submit correct answer.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitExpressionAnswer('5x=2+3');
    await explorationEditor.expectResponseFeedbackToBe('Great!');
    // Submit an expression.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitExpressionAnswer('5x');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'It looks like you have entered an expression. Please enter an equation instead.'
    );

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.SEVENTH);
  });

  it('should be able to preview "Number With Units" interaction', async function () {
    // Add a number with units input interaction.
    await explorationEditor.updateCardContent('Enter a number with units.');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.NUMBER_WITH_UNITS,
      false
    );
    await explorationEditor.updateNumberWithUnitsLearnerAnswerInResponseModal(
      'has the same value and units as',
      '100km'
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.EIGHTH,
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState('The hint is 100');
    // Add solution.
    await explorationEditor.addSolutionToState(
      '100km',
      'As given in the question.',
      true
    );
    await explorationEditor.saveExplorationDraft();

    // Submit a wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitAnswerInInputField('200km');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // Submit a blank answer.
    await explorationEditor.submitAnswerInInputField('');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Enter an answer to continue'
    );
    // View Units Table.
    await explorationEditor.expectUnitsTableToShowProperly();
    // View Hint.
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain('The hint is 100');
      await explorationEditor.closeHintModal();
    }
    // Submit a correct answer.
    await explorationEditor.submitAnswerInInputField('0');
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.EIGHTH);
  });

  it('should be able to preview "Ratio Expression Input" interaction', async function () {
    // Add a ratio expression input interaction.
    await explorationEditor.updateCardContent('Enter a ratio expression.');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.RATIO_EXPRESSION_INPUT
    );
    await explorationEditor.updateRatioExpressionInputLearnerAnswerInResponseModal(
      'is equivalent to',
      ['1:2']
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.NINTH,
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState('The hint is 1:2');
    // Add solution.
    await explorationEditor.addSolutionToState(
      '1:2',
      'As given in the question.',
      true
    );
    await explorationEditor.saveExplorationDraft();

    // Submit wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitAnswerInInputField('5:6');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // Submit an answer not in ratio format.
    await explorationEditor.submitAnswerInInputField('1');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Please enter a valid ratio (e.g. 1:2 or 1:2:3).'
    );
    // View Hint.
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain('The hint is 1:2');
      await explorationEditor.closeHintModal();
    }
    // Submit correct answer.
    await explorationEditor.submitAnswerInInputField('1:2');
    await explorationEditor.expectResponseFeedbackToBe('Great!');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
