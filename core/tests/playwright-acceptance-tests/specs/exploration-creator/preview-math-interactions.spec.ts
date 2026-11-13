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

import {expect, test} from '@playwright/test';

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
  FOURTH: '4th Card',
  FIFTH: '5th Card',
  SIXTH: '6th Card',
  SEVENTH: '7th Card',
  EIGHTH: '8th Card',
  NINTH: '9th Card',
};

test.describe.configure({mode: 'serial', timeout: 600000});

test.describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor & LoggedInUser & LoggedOutUser;

  test.beforeAll(async function ({
    browser,
    viewport,
    isMobile,
    hasTouch,
    userAgent,
  }) {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com',
      browser,
      [],
      undefined,
      {viewport, isMobile, hasTouch, userAgent}
    );

    // Verify the factory's context uses the project's responsive viewport.
    expect(viewport).not.toBeNull();
    if (!viewport) {
      throw new Error('The math preview suite requires a configured viewport.');
    }
    expect(explorationEditor.viewport).toEqual(viewport);
    expect(explorationEditor.isViewportAtMobileWidth()).toBe(
      process.env.MOBILE === 'true'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal(true);
  });

  // Math interactions require heavy MathJax rendering and take significantly
  // longer to load and evaluate in CI environments, requiring a 10-minute timeout.
  test('should be able to preview "Fraction Input" interaction', async function () {
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
    await explorationEditor.navigateToExplorationEditorPreviewTab();
    await explorationEditor.submitAnswer('1/3');
    await explorationEditor.expectOppiaFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // Submit a blank answer.
    await explorationEditor.submitAnswer('');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Please enter a valid fraction (e.g., 5/3 or 1 2/3)'
    );
    // Submit answer with invalid characters.
    await explorationEditor.submitAnswer('1/2a');
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
    await explorationEditor.submitAnswer('1/2');
    await explorationEditor.expectOppiaFeedbackToBe('Perfect!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.SECOND);
  });

  // Math interactions require heavy MathJax rendering and take significantly
  // longer to load and evaluate in CI environments, requiring a 10-minute timeout.
  test('should be able to preview "Set Input" interaction', async function () {
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
    await explorationEditor.navigateToExplorationEditorPreviewTab();
    await explorationEditor.expectPreviewCardContentToBe(
      CARD_NAMES.SECOND,
      'Enter a set.'
    );
    // Submit wrong answer. Also, verifies clicking on "Add Item" adds new item.
    await explorationEditor.submitInputSetAnswer(['5', '6']);
    await explorationEditor.expectOppiaFeedbackToBe(
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
    await explorationEditor.expectOppiaFeedbackToBe('Great!');
    // Submit an answer with duplicate values.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToExplorationEditorPreviewTab();
    await explorationEditor.submitInputSetAnswer(['1', '1'], false);
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Oops, it looks like your answer has duplicates!'
    );

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.FOURTH);
  });

  // Math interactions require heavy MathJax rendering and take significantly
  // longer to load and evaluate in CI environments, requiring a 10-minute timeout.
  test('should be able to preview "Numeric Expression" interaction', async function () {
    // Add a numeric expression interaction.
    await explorationEditor.updateCardContent('Enter a numeric expression.');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.NUMERIC_EXPRESSION
    );
    await explorationEditor.updateMathExpressionLearnerAnswerInResponseModal(
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
    await explorationEditor.addMathExpressionSolutionToState(
      'sqrt2',
      'as given in the question.'
    );
    await explorationEditor.saveExplorationDraft();

    // Submit a wrong answer.
    await explorationEditor.navigateToExplorationEditorPreviewTab();
    await explorationEditor.submitExpressionAnswer('sqrt3');
    await explorationEditor.expectOppiaFeedbackToBe(
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
    await explorationEditor.navigateToExplorationEditorPreviewTab();
    await explorationEditor.submitExpressionAnswer('sqrt2');
    await explorationEditor.expectOppiaFeedbackToBe('Great!');
    // Submit an answer with non-numeric value.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToExplorationEditorPreviewTab();
    await explorationEditor.submitExpressionAnswer('hello');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'It looks like you have entered some variables. Please enter numbers only.'
    );

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.FIFTH);
  });

  // Math interactions require heavy MathJax rendering and take significantly
  // longer to load and evaluate in CI environments, requiring a 10-minute timeout.
  test('should be able to preview "Algebraic Expression" interaction', async function () {
    // Add an algebraic expression interaction.
    await explorationEditor.updateCardContent('Enter an algebraic expression.');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.ALGEBRAIC_EXPRESSION,
      false
    );
    await explorationEditor.customizeAlgebraicExpressionInputInteraction(
      ['a', 'b'],
      false
    );
    await explorationEditor.updateMathExpressionLearnerAnswerInResponseModal(
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
    await explorationEditor.addMathExpressionSolutionToState(
      'a+b',
      'as given in the question.'
    );
    await explorationEditor.saveExplorationDraft();

    // Submit a wrong answer.
    await explorationEditor.navigateToExplorationEditorPreviewTab();
    await explorationEditor.submitExpressionAnswer('a-b');
    await explorationEditor.expectOppiaFeedbackToBe(
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
    await explorationEditor.navigateToExplorationEditorPreviewTab();
    await explorationEditor.submitExpressionAnswer('a+b');
    await explorationEditor.expectOppiaFeedbackToBe('Great!');
    // Submit a blank answer.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToExplorationEditorPreviewTab();
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

  // Math interactions require heavy MathJax rendering and take significantly
  // longer to load and evaluate in CI environments, requiring a 10-minute timeout.
  test('should be able to preview "Math Equation" interaction', async function () {
    // Add a math equation interaction.
    await explorationEditor.updateCardContent('Enter a math equation.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.MATH_EQUATION);
    await explorationEditor.updateMathExpressionLearnerAnswerInResponseModal(
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
    await explorationEditor.addMathExpressionSolutionToState(
      '5x=2+3',
      'as given in the question.'
    );
    await explorationEditor.saveExplorationDraft();

    // Submit wrong answer.
    await explorationEditor.navigateToExplorationEditorPreviewTab();
    await explorationEditor.submitExpressionAnswer('5x=2+1');
    await explorationEditor.expectOppiaFeedbackToBe(
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
    await explorationEditor.navigateToExplorationEditorPreviewTab();
    await explorationEditor.submitExpressionAnswer('5x=2+3');
    await explorationEditor.expectOppiaFeedbackToBe('Great!');
    // Submit an expression.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToExplorationEditorPreviewTab();
    await explorationEditor.submitExpressionAnswer('5x');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'It looks like you have entered an expression. Please enter an equation instead.'
    );

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.SEVENTH);
  });

  // Math interactions require heavy MathJax rendering and take significantly
  // longer to load and evaluate in CI environments, requiring a 10-minute timeout.
  test('should be able to preview "Number With Units" interaction', async function () {
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
    await explorationEditor.navigateToExplorationEditorPreviewTab();
    await explorationEditor.submitAnswer('200km');
    await explorationEditor.expectOppiaFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // Submit a blank answer.
    await explorationEditor.submitAnswer('');
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
    // The response rule and solution both specify 100km.
    await explorationEditor.submitAnswer('100km');
    await explorationEditor.expectOppiaFeedbackToBe('Great!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.EIGHTH);
  });

  // Math interactions require heavy MathJax rendering and take significantly
  // longer to load and evaluate in CI environments, requiring a 10-minute timeout.
  test('should be able to preview "Ratio Expression Input" interaction', async function () {
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
    await explorationEditor.navigateToExplorationEditorPreviewTab();
    await explorationEditor.submitAnswer('5:6');
    await explorationEditor.expectOppiaFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // Submit an answer not in ratio format.
    await explorationEditor.submitAnswer('1');
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
    await explorationEditor.submitAnswer('1:2');
    await explorationEditor.expectOppiaFeedbackToBe('Great!');
  });

  test('should render Arabic text as a continuous string', async function () {
    // Navigate to editor tab and update the current card's content
    // with a math formula containing Arabic text.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.addMathFormulaToCardContent('\\text{سم}', 'سم');
    await explorationEditor.saveExplorationDraft();
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
