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
 * EC. Previewing all interactions.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const CARDS = {
  FIRST_CARD: 'Introduction',
  SECOND_CARD: '2nd Card',
  THIRD_CARD: '3rd Card',
  FOURTH_CARD: '4th Card',
  FIFTH_CARD: '5th Card',
  SIXTH_CARD: '6th Card',
  SEVENTH_CARD: '7th Card',
  EIGHTH_CARD: '8th Card',
  NINTH_CARD: '9th Card',
  TENTH_CARD: '10th Card',
  ELEVENTH_CARD: '11th Card',
  TWELFTH_CARD: '12th Card',
  THIRTEENTH_CARD: '13th Card',
  FOURTEENTH_CARD: '14th Card',
  FIFTEENTH_CARD: '15th Card',
  SIXTEENTH_CARD: '16th Card',
  SEVENTEENTH_CARD: '17th Card',
  EIGHTEENTH_CARD: '18th Card',
  NINETEENTH_CARD: '19th Card',
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

  it('should be able to preview "Continue Button" interaction', async function () {
    await explorationEditor.updateCardContent('Click on the button.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
    await explorationEditor.saveExplorationDraft();

    // Navigate to the preview tab and check the content of the first card.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.expectPreviewCardContentToBe(
      CARDS.FIRST_CARD,
      'Click on the button.'
    );
    // It should display the same card as next card isn't created.
    await explorationEditor.continueToNextCard(true);
    await explorationEditor.expectPreviewCardContentToBe(
      CARDS.FIRST_CARD,
      'Click on the button.'
    );

    await explorationEditor.navigateToEditorTab();
    await explorationEditor.directLearnersToNewCard(CARDS.SECOND_CARD);

    // It should change the card content when new card is created.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.continueToNextCard();
    await explorationEditor.expectPreviewCardContentToBe(
      CARDS.SECOND_CARD,
      'Click on the button.',
      false
    );

    // Restart from the beginning.
    await explorationEditor.restartPreview();
    await explorationEditor.expectPreviewCardContentToBe(
      CARDS.FIRST_CARD,
      'Click on the button.'
    );

    // Click on Lesson Info button.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.expectLessonInfoCardToContain(
      'This exploration is private.'
    );
  });

  it('should be able to preview "Multiple Choice" interaction', async function () {
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARDS.SECOND_CARD);
    await explorationEditor.updateCardContent('This is a multiple choice.');
    await explorationEditor.addMultipleChoiceInteraction([
      'Option 1',
      'Option 2',
      'Correct Response',
      'Option 4',
    ]);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.MULTIPLE_CHOICE,
      'Correct Response',
      'Great Job!',
      CARDS.THIRD_CARD,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong.'
    );
    await explorationEditor.addHintToState('Try Google Search.');

    // Check if preview works as expected.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.expectPreviewCardContentToBe(
      CARDS.SECOND_CARD,
      'This is a multiple choice.'
    );
    await explorationEditor.selectMultipleChoiceOption('Option 1');
    await explorationEditor.expectResponseFeedbackToBe('Wrong.');
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'Try Google Search.'
    );
    await explorationEditor.closeHintModal();

    await explorationEditor.selectMultipleChoiceOption('Correct Response');
    await explorationEditor.expectResponseFeedbackToBe('Great Job!');

    // Navigate back to Editor tab.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Number Input" interaction', async function () {
    await explorationEditor.navigateToCard(CARDS.THIRD_CARD);

    // Add a number input interaction.
    await explorationEditor.updateCardContent('Enter number less than 0.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMBER_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMBER_INPUT,
      '0',
      'Perfect!',
      'Fourth Card',
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState(
      'All negative numbers are less than 0.'
    );
    await explorationEditor.addSolutionToState(
      '-10',
      'As said in the question itself.',
      true
    );

    // Navigate to the preview tab.
    await explorationEditor.navigateToPreviewTab();

    // Submit wrong answer.
    await explorationEditor.submitAnswer('10');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );

    // Submit a blank answer.
    await explorationEditor.submitAnswer('');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Enter a number to continue'
    );

    // Check for hint.
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'All negative numbers are less than 0.'
    );
    await explorationEditor.closeHintModal();

    await explorationEditor.submitAnswer('-10');
    await explorationEditor.expectResponseFeedbackToBe('Perfect!');

    // Navigate back to Editor tab.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Text Input" interaction', async function () {
    await explorationEditor.navigateToCard('Fourth Card');

    // Add a text input interaction.
    await explorationEditor.updateCardContent('Enter text "Hello, Oppia!".');
    await explorationEditor.addInteraction(INTERACTION_TYPES.TEXT_INPUT, false);
    await explorationEditor.customizeTextInputInteraction(
      'Hello, there!',
      '2',
      true
    );
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.TEXT_INPUT,
      'Hello, Oppia!',
      'Perfect!',
      'Fifth Card',
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'No write "Hello, Oppia!"'
    );

    // Check if the preview works as expected.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitTextInputAnsswer('Hello, there!');
    await explorationEditor.expectResponseFeedbackToBe(
      'No write "Hello, Oppia!"'
    );

    // Submit a blank answer.
    await explorationEditor.submitTextInputAnsswer('');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Enter an answer to continue'
    );

    // Submit correct answer.
    await explorationEditor.submitTextInputAnsswer('Hello, Oppia!');
    await explorationEditor.expectResponseFeedbackToBe('Perfect!');

    // Navigate back to Editor tab.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Image Region" interaction', async function () {
    await explorationEditor.navigateToCard('Fifth Card');

    // Add a image region interaction.
    await explorationEditor.updateCardContent('Enter an image region.');
    await explorationEditor.addImageInteraction();
    await explorationEditor.directLearnersToNewCard('Sixth Card');
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong.'
    );

    // Check if the image region is previewed properly.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.clickOnImageInInteractionPreviewCard();
    await explorationEditor.expectResponseFeedbackToBe('Wrong.');

    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Item Selection" interaction', async function () {
    await explorationEditor.navigateToCard('Sixth Card');

    // Add a item selection interaction.
    await explorationEditor.updateCardContent('Select correct item.');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.ITEM_SELECTION,
      false
    );
    await explorationEditor.customizeItemSelectionInteraction(
      ['Option 1', 'Option 2', 'Correct Option 1', 'Correct Option 2'],
      1,
      2
    );
    await explorationEditor.updateItemSelectionLearnersAnswerInResponseModal(
      'contains at least one of',
      ['Correct Option 1', 'Correct Option 2']
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      'Seventh Card',
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.selectItemSelectionOptions([
      'Option 1',
      'Option 2',
    ]);
    await explorationEditor.clickOnSubmitAnswerButton();
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.selectItemSelectionOptions([
      'Correct Option 1',
      'Correct Option 2',
    ]);
    await explorationEditor.clickOnSubmitAnswerButton();
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Drag and Drop Sort" interaction', async function () {
    await explorationEditor.navigateToCard('Seventh Card');
    await explorationEditor.updateCardContent('Arrange in Ascending Order');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.DRAG_AND_DROP_SORT,
      false
    );
    await explorationEditor.customizeDragAndDropSortInteraction([
      'First',
      'Third',
      'Second',
    ]);
    await explorationEditor.updateDragAndDropSortLearnersAnswerInResponseModal(
      'is equal to ordering ...',
      [1, 3, 2]
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      'Eighth Card',
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Try Again!'
    );
    await explorationEditor.addHintToState('Arrange in Ascending Order');
    await explorationEditor.addDragAndDropSortSolution(
      ['First', 'Second', 'Third'],
      'As given in the question.'
    );

    // Preview tab.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.expectPreviewCardContentToBe(
      CARDS.SEVENTH_CARD,
      'Arrange in Ascending Order'
    );
    await explorationEditor.submitDragAndDropSortAnswer([
      'Second',
      'First',
      'Third',
    ]);
    await explorationEditor.expectResponseFeedbackToBe('Try Again!');
    await explorationEditor.removeFeedbackResponseInPreviewTab();
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'Arrange in Ascending Order'
    );
    await explorationEditor.closeHintModal();
    await explorationEditor.submitDragAndDropSortAnswer([
      'First',
      'Second',
      'Third',
    ]);
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate to Editor tab.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Fraction Input" interaction', async function () {
    await explorationEditor.navigateToCard('Eighth Card');
    await explorationEditor.updateCardContent('Enter a fraction: 1/2.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      '2',
      'Perfect!',
      'Ninth Card',
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

    // Verify preview of interaction works as expected.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitAnswerInInputField('1/3');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // Submit answer with invalid characters.
    await explorationEditor.submitAnswerInInputField('1/2a');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Please only use numerical digits, spaces or forward slashes (/)'
    );
    // Submit a blank answer.
    await explorationEditor.submitAnswerInInputField('');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Please enter a valid fraction (e.g., 5/3 or 1 2/3)'
    );
    // View Hint.
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain('The hint is 1/2');
    await explorationEditor.closeHintModal();
    // Submit correct answer.
    await explorationEditor.submitAnswerInInputField('1/2');
    await explorationEditor.expectResponseFeedbackToBe('Perfect!');

    // Navigate to Editor tab.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Graph Theory" interaction', async function () {
    await explorationEditor.navigateToCard('Ninth Card');

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
      'Tenth Card',
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState(
      'Create a star topology using all 4 nodes.'
    );

    // Check if preview works as expected.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitGraphStarNetworkSolution(3);
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.removeFeedbackResponseInPreviewTab();
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'Create a star topology using all 4 nodes.'
    );
    await explorationEditor.closeHintModal();
    await explorationEditor.submitGraphStarNetworkSolution(4);
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate to Editor tab.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Set Input" interaction', async function () {
    // Pre-steps
    await explorationEditor.navigateToCard('Tenth Card');
    await explorationEditor.updateCardContent('Enter a set.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.SET_INPUT);
    await explorationEditor.updateSetInputLearnerAnswerInResponseModal(
      'is equal to',
      ['1', '2', '3']
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      'Eleventh Card',
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
      CARDS.TENTH_CARD,
      'Enter a set.'
    );
    // Submit wrong answer.
    await explorationEditor.submitInputSetAnswer(['5', '6']);
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // View Hint.
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'The hint is [1, 2, 3]'
    );
    await explorationEditor.closeHintModal();
    // Submit correct answer.
    await explorationEditor.submitInputSetAnswer(['1', '2', '3']);
    await explorationEditor.expectResponseFeedbackToBe('Great!');
    // Submit an answer with duplicate values.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitInputSetAnswer(['1', '1']);
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Oops, it looks like your answer has duplicates!'
    );

    // Navigate to Editor tab.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Numeric Expression" interaction', async function () {
    await explorationEditor.navigateToCard('Eleventh Card');

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
      'Twelfth Card',
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

    // Submit a wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitExpressionAnswer('sqrt3');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // View Hint.
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain('The hint is sqrt2');
    await explorationEditor.closeHintModal();
    // Submit correct answer.
    await explorationEditor.submitExpressionAnswer('sqrt2');
    await explorationEditor.expectResponseFeedbackToBe('Great!');
    // Submit an answer with non-numeric value.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitExpressionAnswer('hello');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'It looks like you have entered some variables. Please enter numbers only.'
    );

    // Navigate to Editor tab.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Algebric Expression" intreaction', async function () {
    await explorationEditor.navigateToCard('Twelfth Card');

    // Add a algebric expression interaction.
    await explorationEditor.updateCardContent('Enter a algebric expression.');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.ALGEBRAIC_EXPRESSION
    );
    await explorationEditor.updateAlgebricExpressionLearnerAnswerInResponseModal(
      'matches exactly with',
      'a+b'
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      'Thirteenth Card',
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

    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitExpressionAnswer('a-b');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain('The hint is a+b');
    await explorationEditor.closeHintModal();
    await explorationEditor.submitExpressionAnswer('a+b');
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate to Editor tab.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Math Equation" interaction', async function () {
    await explorationEditor.navigateToCard('Thirteenth Card');

    // Add a math equation interaction.
    await explorationEditor.updateCardContent('Enter a math equation.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.MATH_EQUATION);
    await explorationEditor.updateMathEquationLearnerAnswerInResponseModal(
      'matches exactly with',
      '5x=2+3'
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      'Fourteenth Card',
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
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'The hint is 5x=2+3'
    );
    await explorationEditor.closeHintModal();
    // Submit correct answer.
    await explorationEditor.submitExpressionAnswer('5x=2+3');
    await explorationEditor.expectResponseFeedbackToBe('Great!');
    // Submit an expression.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitExpressionAnswer('5x');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'It looks like you have entered an expression. Please enter an equation instead.'
    );

    // Navigate to Editor tab.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Number With Units" interaction', async function () {
    await explorationEditor.navigateToCard('Fourteenth Card');

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
      'Fifteenth Card',
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

    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitAnswerInInputField('200km');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain('The hint is 100');
    await explorationEditor.closeHintModal();
    await explorationEditor.submitAnswerInInputField('0');
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Ratio Expression Input" interaction', async function () {
    await explorationEditor.navigateToCard('Fifteenth Card');

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
      'Sixteenth Card',
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

    // Submit an answer not in ratio format.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitAnswerInInputField('1');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Please enter a valid ratio (e.g. 1:2 or 1:2:3).'
    );
    // Submit wrong answer.
    await explorationEditor.submitAnswerInInputField('5:6');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // View Hint.
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain('The hint is 1:2');
    await explorationEditor.closeHintModal();
    // Submit correct answer.
    await explorationEditor.submitAnswerInInputField('1:2');
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Code Editor" interaction', async function () {
    await explorationEditor.navigateToCard('Sixteenth Card');

    // Add a code editor interaction.
    await explorationEditor.updateCardContent('Enter a code editor.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.CODE_EDITOR);
    await explorationEditor.updateCodeEditorLearnerAnswerInResponseModal(
      'has code that contains',
      'print("Hello, Oppia!")'
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      'Seventeenth Card',
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState(
      'The hint is print("Hello, Oppia!")'
    );

    // Add solution.
    await explorationEditor.addCodeEditorSolutionToState(
      'print("Hello, Oppia!")',
      'As given in the question.'
    );

    // Preview Tab
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitCodeEditorAnswer('print("Hello!")');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.removeFeedbackResponseInPreviewTab();
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'The hint is print("Hello, Oppia!")'
    );
    await explorationEditor.closeHintModal();
    await explorationEditor.submitCodeEditorAnswer('print("Hello, Oppia!")');
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate back to Editor Tab.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Pencil Code Editor" interaction', async function () {
    await explorationEditor.navigateToCard('Seventeenth ...');

    // Add a pencil code editor interaction.
    await explorationEditor.updateCardContent('Enter a pencil code editor.');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.PENCIL_CODE_EDITOR
    );
    await explorationEditor.updateCodeEditorLearnerAnswerInResponseModal(
      'has code that contains',
      'print("Hello, Oppia!")'
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      'Eighteenth Card',
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState(
      'The hint is print("Hello, Oppia!")'
    );

    // Add solution.
    await explorationEditor.addPencilCodeEditorSolutionToState(
      'print("Hello, Oppia!")',
      'As given in the question.'
    );

    // Preview Tab.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitPencilCodeEditorAnswer('print("Hello!")');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'The hint is print("Hello, Oppia!")'
    );
    await explorationEditor.closeHintModal();
    await explorationEditor.submitPencilCodeEditorAnswer(
      'print("Hello, Oppia!")'
    );
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate back to Editor Tab.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "Music Notes Input" interaction', async function () {
    await explorationEditor.navigateToCard('Eighteenth Card');

    // Add a music notes input interaction.
    await explorationEditor.updateCardContent('Enter a music notes input.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.MUSIC_NOTES_INPUT);
    await explorationEditor.updateMusicNotesInputLearnerAnswerInResponseModal(
      'is equal to',
      ['C4', 'E4', 'G4']
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      'Nineteenth Card',
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Add solution.
    await explorationEditor.addHintToState('Only answer C4');
    await explorationEditor.addMusicNotesInputSolutionToState(
      ['C4', 'E4', 'G4'],
      'as given in the question.'
    );

    // Submit wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitMusicNotesInputAnswer(['C4', 'E4', 'G4']);
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.removeFeedbackResponseInPreviewTab();
    // View Hint.
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain('Only answer C4');
    await explorationEditor.closeHintModal();
    // TODO: File an issue that correct answer doesn't work.

    // Navigate to editor tab.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to preview "World Map" interaction', async function () {
    await explorationEditor.navigateToCard('Nineteenth Card');

    // Add a world map interaction.
    await explorationEditor.updateCardContent('Enter a world map.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.WORLD_MAP, false);
    await explorationEditor.customizeWorldMapInteraction(0, 0, 0);
    await explorationEditor.updateWorldMapLearnerAnswerInResponseModal(
      'is within ... km of ...',
      100
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      'Twentieth Card',
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.addHintToState(
      'The hint is to zoom 13 times to get the answer'
    );
    await explorationEditor.saveExplorationDraft();

    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitWorldMapAnswer(0);
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // await explorationEditor.removeFeedbackResponseInPreviewTab();
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'The hint is to zoom 13 times to get the answer'
    );
    await explorationEditor.closeHintModal();
    await explorationEditor.submitWorldMapAnswer(13);
    await explorationEditor.expectResponseFeedbackToBe('Great!');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
