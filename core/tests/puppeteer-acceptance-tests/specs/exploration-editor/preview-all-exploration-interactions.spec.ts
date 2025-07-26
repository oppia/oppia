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
  TENTH: '10th Card',
  ELEVENTH: '11th Card',
  TWELFTH: '12th Card',
  THIRTEENTH: '13th Card',
  FOURTEENTH: '14th Card',
  FIFTEENTH: '15th Card',
  SIXTEENTH: '16th Card',
  SEVENTEENTH: '17th Card',
  EIGHTEENTH: '18th Card',
  NINETEENTH: '19th Card',
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
      CARD_NAMES.FIRST,
      'Click on the button.'
    );
    // It should display the same card as next card isn't created.
    await explorationEditor.continueToNextCard(true);
    await explorationEditor.expectPreviewCardContentToBe(
      CARD_NAMES.FIRST,
      'Click on the button.'
    );

    await explorationEditor.navigateToEditorTab();
    await explorationEditor.directLearnersToNewCard(CARD_NAMES.SECOND);

    // It should change the card content when new card is created.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.continueToNextCard();
    await explorationEditor.expectPreviewCardContentToBe(
      CARD_NAMES.SECOND,
      'Click on the button.',
      false
    );

    // Restart from the beginning.
    await explorationEditor.restartPreview();
    await explorationEditor.expectPreviewCardContentToBe(
      CARD_NAMES.FIRST,
      'Click on the button.'
    );

    // Click on Lesson Info button.
    await explorationEditor.openLessonInfoModal();
    await explorationEditor.expectLessonInfoCardToContain(
      'This exploration is private.'
    );
    await explorationEditor.closeLessonInfoModal();
  });

  it('should be able to preview "Multiple Choice" interaction', async function () {
    // Add a multiple choice interaction.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.SECOND);
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
      CARD_NAMES.THIRD,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer.'
    );
    await explorationEditor.addHintToState('Try Google Search.');
    await explorationEditor.saveExplorationDraft();

    // Navigate to the preview tab.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.expectPreviewCardContentToBe(
      CARD_NAMES.SECOND,
      'This is a multiple choice.'
    );
    // Submit a wrong answer.
    await explorationEditor.selectMultipleChoiceOption('Option 1');
    await explorationEditor.expectResponseFeedbackToBe('Wrong Answer.');
    // View Hint.
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'Try Google Search.'
    );
    await explorationEditor.closeHintModal();
    // Submit a correct answer.
    await explorationEditor.selectMultipleChoiceOption('Correct Response');
    await explorationEditor.expectResponseFeedbackToBe('Great Job!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.THIRD);
  });

  it('should be able to preview "Number Input" interaction', async function () {
    // Add a number input interaction.
    await explorationEditor.updateCardContent('Enter number less than 0.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMBER_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMBER_INPUT,
      '0',
      'Perfect!',
      CARD_NAMES.FOURTH,
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
    await explorationEditor.saveExplorationDraft();

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
    // Submit a correct answer.
    await explorationEditor.submitAnswer('-10');
    await explorationEditor.expectResponseFeedbackToBe('Perfect!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.FOURTH);
  });

  it('should be able to preview "Text Input" interaction', async function () {
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
      CARD_NAMES.FIFTH,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'No write "Hello, Oppia!"'
    );
    await explorationEditor.saveExplorationDraft();

    // Navigate to the preview tab.
    await explorationEditor.navigateToPreviewTab();
    // Submit a incorrect answer.
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
    await explorationEditor.navigateToCard(CARD_NAMES.FIFTH);
  });

  it('should be able to preview "Image Region" interaction', async function () {
    // Add a image region interaction.
    await explorationEditor.updateCardContent('Enter an image region.');
    await explorationEditor.addImageInteraction('Perfect!', CARD_NAMES.SIXTH);
    // await explorationEditor.directLearnersToNewCard('Sixth Card');
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong.'
    );
    await explorationEditor.saveExplorationDraft();

    // Select a wrong point.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.selectImageAnswer(10, 10);
    await explorationEditor.removeFeedbackResponseInPreviewTab();
    // Select a correct point.
    await explorationEditor.selectImageAnswer(75, 75);
    await explorationEditor.expectResponseFeedbackToBe('Perfect!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.SIXTH);
  });

  it('should be able to preview "Item Selection" interaction', async function () {
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
      CARD_NAMES.SEVENTH,
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await explorationEditor.saveExplorationDraft();

    // Choose a wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.selectItemSelectionOptions([
      'Option 1',
      'Option 2',
    ]);
    await explorationEditor.clickOnSubmitAnswerButton();
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // Choose a correct answer.
    await explorationEditor.selectItemSelectionOptions([
      'Correct Option 1',
      'Correct Option 2',
    ]);
    await explorationEditor.clickOnSubmitAnswerButton();
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.SEVENTH);
  });

  it('should be able to preview "Drag and Drop Sort" interaction', async function () {
    // Add Drag and Drop Sort Interaction.
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
      CARD_NAMES.EIGHTH,
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
    await explorationEditor.saveExplorationDraft();

    // Sort items in wrong order.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.expectPreviewCardContentToBe(
      CARD_NAMES.EIGHTH,
      'Arrange in Ascending Order'
    );
    await explorationEditor.submitDragAndDropSortAnswer([
      'Second',
      'First',
      'Third',
    ]);
    await explorationEditor.expectResponseFeedbackToBe('Try Again!');
    // View Hint.
    await explorationEditor.removeFeedbackResponseInPreviewTab();
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'Arrange in Ascending Order'
    );
    await explorationEditor.closeHintModal();
    // Sort items in correct order.
    await explorationEditor.submitDragAndDropSortAnswer([
      'First',
      'Second',
      'Third',
    ]);
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.EIGHTH);
  });

  it('should be able to preview "Fraction Input" interaction', async function () {
    // Add Fraction Input Interaction.
    await explorationEditor.updateCardContent('Enter a fraction: 1/2.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      '2',
      'Perfect!',
      CARD_NAMES.NINTH,
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
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain('The hint is 1/2');
    await explorationEditor.closeHintModal();
    // Submit correct answer.
    await explorationEditor.submitAnswerInInputField('1/2');
    await explorationEditor.expectResponseFeedbackToBe('Perfect!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.NINTH);
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
      CARD_NAMES.TENTH,
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

    // Submit a wrong answer.
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
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'Create a star topology using all 4 nodes.'
    );
    await explorationEditor.closeHintModal();
    // Submit a correct answer.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitGraphStarNetworkSolution(4);
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.TENTH);
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
      CARD_NAMES.ELEVENTH,
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
      CARD_NAMES.TENTH,
      'Enter a set.'
    );
    // Submit wrong answer. Also, verifies clicking on "Add Item" adds new item.
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
    await explorationEditor.submitInputSetAnswer(['1', '1'], false);
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Oops, it looks like your answer has duplicates!'
    );

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.ELEVENTH);
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
      CARD_NAMES.TWELFTH,
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
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain('The hint is sqrt2');
    await explorationEditor.closeHintModal();
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
    await explorationEditor.navigateToCard(CARD_NAMES.TWELFTH);
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
      CARD_NAMES.THIRTEENTH,
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
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain('The hint is a+b');
    await explorationEditor.closeHintModal();
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
    await explorationEditor.navigateToCard(CARD_NAMES.THIRTEENTH);
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
      CARD_NAMES.FOURTEENTH,
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
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'The hint is 5x=2+3'
    );
    await explorationEditor.closeHintModal();
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
    await explorationEditor.navigateToCard(CARD_NAMES.FOURTEENTH);
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
      CARD_NAMES.FIFTEENTH,
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
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain('The hint is 100');
    await explorationEditor.closeHintModal();
    // Submit a correct answer.
    await explorationEditor.submitAnswerInInputField('0');
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.FIFTEENTH);
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
      CARD_NAMES.SIXTEENTH,
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
    await explorationEditor.submitAnswerInInputField('5:6');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // Submit an answer not in ratio format.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitAnswerInInputField('1');
    await explorationEditor.expectAnswerErrorMessageToBe(
      'Please enter a valid ratio (e.g. 1:2 or 1:2:3).'
    );
    // View Hint.
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain('The hint is 1:2');
    await explorationEditor.closeHintModal();
    // Submit correct answer.
    await explorationEditor.submitAnswerInInputField('1:2');
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.SIXTEENTH);
  });

  it('should be able to preview "Code Editor" interaction', async function () {
    // Add a code editor interaction.
    await explorationEditor.updateCardContent('Enter a code editor.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.CODE_EDITOR);
    await explorationEditor.updateCodeEditorLearnerAnswerInResponseModal(
      'has code that contains',
      'print("Hello, Oppia!")'
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.SEVENTEENTH,
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
    await explorationEditor.saveExplorationDraft();

    // Submit wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitCodeEditorAnswer('print("Hello!")');
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // Check code output.
    await explorationEditor.expectCodeOutputToBe('Hello!');
    // View Hint.
    await explorationEditor.removeFeedbackResponseInPreviewTab();
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain(
      'The hint is print("Hello, Oppia!")'
    );
    await explorationEditor.closeHintModal();
    // Submit correct answer.
    await explorationEditor.submitCodeEditorAnswer('print("Hello, Oppia!")');
    await explorationEditor.expectResponseFeedbackToBe('Great!');

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.SEVENTEENTH);
  });

  // it('should be able to preview "Pencil Code Editor" interaction', async function () {
  //   // TODO: REMOVE IT. IT USES THIRD-PARTY LIBRARY AND CAN BE REMOVED.
  //   // Add a pencil code editor interaction.
  //   await explorationEditor.updateCardContent('Enter a pencil code editor.');
  //   await explorationEditor.addInteraction(
  //     INTERACTION_TYPES.PENCIL_CODE_EDITOR
  //   );
  //   await explorationEditor.updateCodeEditorLearnerAnswerInResponseModal(
  //     'has code that contains',
  //     'print("Hello, Oppia!")'
  //   );
  //   await explorationEditor.addResponseDetailsInResponseModal(
  //     'Great!',
  //     CARD_NAMES.EIGHTEENTH,
  //     true,
  //     true
  //   );
  //   await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
  //     'Wrong Answer. Please try again'
  //   );
  //   await explorationEditor.addHintToState(
  //     'The hint is print("Hello, Oppia!")'
  //   );
  //   await explorationEditor.addPencilCodeEditorSolutionToState(
  //     'print("Hello, Oppia!")',
  //     'As given in the question.'
  //   );
  //   await explorationEditor.saveExplorationDraft();

  //   // Preview Tab.
  //   await explorationEditor.navigateToPreviewTab();
  //   await explorationEditor.submitPencilCodeEditorAnswer('print("Hello!")');
  //   await explorationEditor.expectResponseFeedbackToBe(
  //     'Wrong Answer. Please try again'
  //   );
  //   await explorationEditor.viewHint();
  //   await explorationEditor.expectHintInHintModalToContain(
  //     'The hint is print("Hello, Oppia!")'
  //   );
  //   await explorationEditor.closeHintModal();
  //   await explorationEditor.submitPencilCodeEditorAnswer(
  //     'print("Hello, Oppia!")'
  //   );
  //   await explorationEditor.expectResponseFeedbackToBe('Great!');

  //   // Navigate back to Editor Tab.
  //   await explorationEditor.navigateToEditorTab();
  //   await explorationEditor.navigateToCard(CARD_NAMES.EIGHTEENTH);
  // });

  it('should be able to preview "Music Notes Input" interaction', async function () {
    // Add a music notes input interaction.
    await explorationEditor.updateCardContent('Enter a music notes input.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.MUSIC_NOTES_INPUT);
    await explorationEditor.updateMusicNotesInputLearnerAnswerInResponseModal(
      'is equal to',
      ['C4', 'E4', 'G4']
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.NINETEENTH,
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
    await explorationEditor.saveExplorationDraft();

    // Submit wrong answer.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.submitMusicNotesInputAnswer(['C4', 'E4', 'G4']);
    await explorationEditor.expectResponseFeedbackToBe(
      'Wrong Answer. Please try again'
    );
    // View Hint.
    await explorationEditor.removeFeedbackResponseInPreviewTab();
    await explorationEditor.viewHint();
    await explorationEditor.expectHintInHintModalToContain('Only answer C4');
    await explorationEditor.closeHintModal();
    // TODO(#22998): The correct answer automatically changes to ['C4'].
    // And even using C4 as awswer throws wrong answer feedback.

    // Navigate to next card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.NINETEENTH);
  });

  // it('should be able to preview "World Map" interaction', async function () {
  //   // TODO: REMOVE IT. IT USES THIRD-PARTY LIBRARY AND CAN BE REMOVED.
  //   // Add a world map interaction.
  //   await explorationEditor.updateCardContent('Enter a world map.');
  //   await explorationEditor.addInteraction(INTERACTION_TYPES.WORLD_MAP, false);
  //   await explorationEditor.customizeWorldMapInteraction(0, 0, 0);
  //   await explorationEditor.updateWorldMapLearnerAnswerInResponseModal(
  //     'is within ... km of ...',
  //     100
  //   );
  //   await explorationEditor.addResponseDetailsInResponseModal(
  //     'Great!',
  //     'Twentieth Card',
  //     true,
  //     true
  //   );
  //   await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
  //     'Wrong Answer. Please try again'
  //   );
  //   await explorationEditor.addHintToState(
  //     'The hint is to zoom 13 times to get the answer'
  //   );
  //   await explorationEditor.saveExplorationDraft();

  //   await explorationEditor.navigateToPreviewTab();
  //   await explorationEditor.submitWorldMapAnswer(0);
  //   await explorationEditor.expectResponseFeedbackToBe(
  //     'Wrong Answer. Please try again'
  //   );
  //   // await explorationEditor.removeFeedbackResponseInPreviewTab();
  //   await explorationEditor.viewHint();
  //   await explorationEditor.expectHintInHintModalToContain(
  //     'The hint is to zoom 13 times to get the answer'
  //   );
  //   await explorationEditor.closeHintModal();
  //   await explorationEditor.submitWorldMapAnswer(13);
  //   await explorationEditor.expectResponseFeedbackToBe('Great!');
  // });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
