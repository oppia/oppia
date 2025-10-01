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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * EC. Create an Exploration using all interactions.
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
  TWENTIETH: '20th Card',
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

  it('should be able to use "Continue Button" interaction', async function () {
    // Update the card content.
    await explorationEditor.updateCardContent('Click on the button.');
    await explorationEditor.expectCardContentToBe('Click on the button.');
    await explorationEditor.expectEditCardContentPencilButtonToBeVisible();

    // Add a new interaction.
    await explorationEditor.addInteraction('Continue Button');
    await explorationEditor.expectInteractionPreviewCardToBeVisible();
    await explorationEditor.expectRemoveInteractionButtonToBeVisible();

    // Direct learners to new card.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAMES.SECOND);
    await explorationEditor.expectCurrentOutcomeDestinationToBe(
      CARD_NAMES.SECOND
    );
    await explorationEditor.expectEditOutcomeDestPencilButtonToBeVisible();
    await explorationEditor.expectExplorationGraphToContainCard(
      CARD_NAMES.SECOND
    );

    // Open appropriate modal on re-clicking an interaction to customize it.
    await explorationEditor.clickOnTestExploration();
    await explorationEditor.expectModalTitleToBe(
      'Customize Interaction (Continue Button)'
    );
    await explorationEditor.clickOnElementWithText('Save Interaction');

    await explorationEditor.saveExplorationDraft();
    await explorationEditor.expectSelfLoopWarningToBeVisible(false);
  });

  it('should be able to use "Multiple Choice" interaction', async function () {
    await explorationEditor.navigateToCard(CARD_NAMES.SECOND);

    // Update the card content.
    await explorationEditor.updateCardContent('This is a multiple choice.');
    await explorationEditor.expectCardContentToBe('This is a multiple choice.');
    // Add a multiple choice interaction. Also, checks if modal title is correct.
    await explorationEditor.addMultipleChoiceInteraction([
      'Option 1',
      'Option 2',
      'Correct Response',
      'Option 4',
    ]);
    await explorationEditor.expectAddResponseModalHeaderToBe('Add Response');

    // Add responses and verify that correct response and rule is selected.
    await explorationEditor.updateMultipleChoiceLearnersAnswerInResponseModal(
      'is equal to',
      'Correct Response'
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.THIRD,
      true,
      true
    );

    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong.'
    );
    await explorationEditor.addHintToState('Try Google Search.');
    await explorationEditor.expectHintsToConatin('Try Google Search.');

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "Number Input" interaction', async function () {
    await explorationEditor.navigateToCard(CARD_NAMES.THIRD);

    // Update card content.
    await explorationEditor.updateCardContent('Enter number 100.');
    await explorationEditor.expectCardContentToBe('Enter number 100.');

    // Add a number input interaction. Also, checks if modal title is correct.
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.NUMBER_INPUT,
      false
    );
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Number Input)'
    );

    // Customize the number input interaction.
    await explorationEditor.customizeNumberInputInteraction(true);
    await explorationEditor.expectModalTitleToBe('Add Response');

    // Add responses to the number input interaction.
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMBER_INPUT,
      '100',
      'Perfect!',
      CARD_NAMES.FOURTH,
      true
    );

    // Add a solution to the state.
    await explorationEditor.addSolutionToState(
      '100',
      'As said in the question itself.',
      true
    );
    await explorationEditor.expectSolutionsToContain(
      'One solution is "100". As said in the question itself..'
    );

    // Save the exploration draft and navigate to the next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.FOURTH);
  });

  it('should be able to use "Text Input" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Enter text "Hello, Oppia!".');
    await explorationEditor.expectCardContentToBe(
      'Enter text "Hello, Oppia!".'
    );
    // Add a text input interaction.
    await explorationEditor.addInteraction(INTERACTION_TYPES.TEXT_INPUT, false);
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Text Input)'
    );
    // Customize the text input interaction.
    await explorationEditor.customizeTextInputInteraction(
      'Hello, there!',
      '2',
      true
    );
    await explorationEditor.expectModalTitleToBe('Add Response');

    // Add responses to the text input interaction.
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.TEXT_INPUT,
      'Hello',
      'Perfect!',
      CARD_NAMES.FIFTH,
      true
    );

    // Add default response feedback.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'No write "Hello, Oppia!"'
    );

    // Save the exploration draft and navigate to the next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.FIFTH);
  });

  it('should be able to use "Image Region" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Enter an image region.');
    // Add an image region interaction. Also, check for all modals -- Choose Interaction,
    // Customize Interaction (Image Region), and Add Response.
    await explorationEditor.addImageInteraction('Great!', CARD_NAMES.SIXTH);
    // Edit default response feedback.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong.'
    );
    // Save exploration draft and navigate to next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.SIXTH);
  });

  it('should be able to use "Item Selection" interaction', async function () {
    // Add a item selection interaction.
    await explorationEditor.updateCardContent('Select correct item.');
    // Add Item Selection interaction. Also, check for modal "Choose Interaction"
    // and "Customize Interaction (Item Selection)".
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.ITEM_SELECTION,
      false
    );
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Item Selection)'
    );
    // Customize Item Selection interaction.
    await explorationEditor.customizeItemSelectionInteraction(
      ['Option 1', 'Option 2', 'Correct Option 1', 'Correct Option 2'],
      1,
      2
    );
    await explorationEditor.updateItemSelectionLearnersAnswerInResponseModal(
      'contains at least one of',
      ['Correct Option 1', 'Correct Option 2']
    );
    await explorationEditor.expectModalTitleToBe('Add Response');
    // Add feedback for correct response.
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.SEVENTH,
      true,
      true
    );
    // Add default feedback for other responses.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Save exploration draft and navigate to next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.SEVENTH);
  });

  it('should be able to use "Drag and Drop Sort" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Arrange in Ascending Order');
    // Add Drag and Drop Sort interaction. Also, check for modals "Choose Interaction"
    // and "Customize Interaction (Drag and Drop Sort)".
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.DRAG_AND_DROP_SORT,
      false
    );
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Drag And Drop Sort)'
    );
    // Customize Drag and Drop Sort interaction.
    await explorationEditor.customizeDragAndDropSortInteraction([
      'First',
      'Third',
      'Second',
    ]);
    await explorationEditor.expectModalTitleToBe('Add Response');
    // Add feedback for correct response.
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

    // Add default feedback for other responses.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Try Again!'
    );

    // Add solution to the state.
    await explorationEditor.addDragAndDropSortSolution(
      ['First', 'Second', 'Third'],
      'As given in the question.'
    );

    // Navigate to next card.
    await explorationEditor.navigateToCard(CARD_NAMES.EIGHTH);
  });

  it('should be able to use "Fraction Input" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Enter a fraction: 1/2.');
    // Add Fraction Input interaction. Also, check for modal "Choose Interaction"
    // and "Customize Interaction (Fraction Input)".
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      false
    );
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Fraction Input)'
    );
    // Customize Fraction Input interaction.
    await explorationEditor.customizeFractionInputInteraction(
      false,
      false,
      false
    );
    await explorationEditor.expectModalTitleToBe('Add Response');
    // Add feedback for correct answer.
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      '1/2',
      'Perfect!',
      CARD_NAMES.NINTH,
      true
    );
    // Add default feedback for other responses.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Add Solution to the state.
    await explorationEditor.addSolutionToState(
      '1/2',
      'As given in the question.',
      true
    );

    // Save the exploration draft and navigate to next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.NINTH);
  });

  it('should be able to use "Graph Theory" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Create a star topology.');
    // Add Graph Interaction.
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.GRAPH_THEORY,
      false
    );
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Graph Theory)'
    );
    // Customize Graph Theory Interaction.
    await explorationEditor.customizeGraphTheoryInteraction();
    await explorationEditor.expectModalTitleToBe('Add Response');
    // Add feedback for correct answer.
    await explorationEditor.updateGraphTheoryLearnerAnswerInResponseModal();
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.TENTH,
      true,
      true
    );
    // Add default feedback for other responses.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Add solution.
    // TODO(#22978): While adding solution, the graph viz in the solution
    // modal is not visible.

    // Save the exploration draft and navigate to next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.TENTH);
  });

  it('should be able to use "Set Input" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Enter a set.');
    // Add Set Input Interaction.
    await explorationEditor.addInteraction(INTERACTION_TYPES.SET_INPUT, false);
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Set Input)'
    );
    // Customize Set Input Interaction.
    await explorationEditor.customizeSetInputInteraction('Add New Item');
    await explorationEditor.expectModalTitleToBe('Add Response');
    // Add feedback for correct answer.
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
    // Add default feedback for other answers.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Add solution.
    await explorationEditor.addSetInputSolutionToState(
      ['1', '2', '3'],
      'as given in the question.'
    );

    // Save exploration draft and navigate to next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.ELEVENTH);
  });

  it('should be able to use "Numeric Expression" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Enter a numeric expression.');
    // Add Numeric Expression interaction.
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.NUMERIC_EXPRESSION,
      false
    );
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Numeric Expression Input)'
    );
    // Customize Numeric Expression interaction.
    await explorationEditor.customizeNumericExpressionInputInteraction(
      'Write a Numeric Expression',
      false
    );
    await explorationEditor.expectModalTitleToBe('Add Response');
    // Add feedback for correct answer.
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
    // Add default feedback for other answers.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Add solution.
    await explorationEditor.addNumbericInteractionSolutionToState(
      'sqrt2',
      'as given in the question.'
    );

    // Save exploration draft and navigate to next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.TWELFTH);
  });

  it('should be able to use "Algebric Expression" intreaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Enter a algebric expression.');
    // Add Algebric Expression interaction.
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.ALGEBRAIC_EXPRESSION,
      false
    );
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Algebraic Expression Input)'
    );
    // Customize Algebric Expression interaction.
    await explorationEditor.customizeAlgebricExpressionInputInteraction(
      'ab',
      false
    );
    await explorationEditor.expectModalTitleToBe('Add Response');
    // Add feedback for correct answer.
    await explorationEditor.updateAlgebricExpressionLearnerAnswerInResponseModal(
      'matches exactly with',
      'a+b'
    );
    await explorationEditor.expectModalTitleToBe('Add Response');
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.THIRTEENTH,
      true,
      true
    );
    // Add default feedback for other answers.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Add solution.
    await explorationEditor.addAlgebricExpressionSolutionToState(
      'a+b',
      'as given in the question.'
    );

    // Save exploration draft and navigate to next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.THIRTEENTH);
  });

  it('should be able to use "Math Equation" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Enter a math equation.');
    // Add Math Equation interaction.
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.MATH_EQUATION,
      false
    );
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Math Equation Input)'
    );
    // Customize Math Equation interaction.
    await explorationEditor.customizeAlgebricExpressionInputInteraction(
      'xyz',
      false
    );
    // Add feedback for correct answer.
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

    // Add default response for other answers.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Add solution.
    await explorationEditor.addMathEquationSolutionToState(
      '5x=2+3',
      'as given in the question.'
    );

    // Save exploration draft and navigate to next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.FOURTEENTH);
  });

  it('should be able to use "Number With Units" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Enter a number with units.');
    // Add Number With Units interaction.
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.NUMBER_WITH_UNITS,
      false
    );
    await explorationEditor.expectModalTitleToBe('Add Response');
    // Add feedback for correct answer.
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
    // Add default response for other answers.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Add solution.
    await explorationEditor.addSolutionToState(
      '100km',
      'As given in the question.',
      true
    );

    // Save exploration draft and navigate to next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.FIFTEENTH);
  });

  it('should be able to use "Ratio Expression Input" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Enter a ratio expression.');
    // Add Ratio Expression Input interaction.
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.RATIO_EXPRESSION_INPUT
    );
    await explorationEditor.expectModalTitleToBe('Add Response');
    // Add feedback for corrent answer.
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
    // Add default feedback for other answers.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Add solution.
    await explorationEditor.addSolutionToState(
      '1:2',
      'As given in the question.',
      true
    );

    // Save Exploration draft and navigate to next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.SIXTEENTH);
  });

  it('should be able to use "Code Editor" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Enter a code editor.');
    // Add Code Editor interaction.
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.CODE_EDITOR,
      false
    );
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Code Editor)'
    );
    // Customize Code Editor interaction.
    await explorationEditor.customizeCodeEditorInteraction(
      '# print("Hello, Oppia!")'
    );
    await explorationEditor.expectModalTitleToBe('Add Response');
    // Add feedback for correct response.
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
    // Add default feedback for other responses.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Add solution.
    await explorationEditor.addCodeEditorSolutionToState(
      'print("Hello, Oppia!")',
      'As given in the question.'
    );

    // Save the exploration draft and navigate to the next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.SEVENTEENTH);
  });

  it('should be able to use "Pencil Code Editor" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Enter a pencil code editor.');
    // Add Pencil Code Editor interaction.
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.PENCIL_CODE_EDITOR,
      false
    );
    // Customize Pencil Code Editor interaction.
    await explorationEditor.customizeCodeEditorInteraction(
      '# print("Hello, Oppia!")'
    );
    await explorationEditor.expectModalTitleToBe('Add Response');
    // Add feedback for correct response.
    await explorationEditor.updateCodeEditorLearnerAnswerInResponseModal(
      'has code that contains',
      'print("Hello, Oppia!")'
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.EIGHTEENTH,
      true,
      true
    );
    // Add default feedback for other responses.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Add solution to the state.
    await explorationEditor.addPencilCodeEditorSolutionToState(
      'print("Hello, Oppia!")',
      'As given in the question.'
    );

    // Save Exploration draft and navigate to next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.EIGHTEENTH);
  });

  it('should be able to use "Music Notes Input" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Enter a music notes input.');
    // Add Music Notes Input interaction.
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.MUSIC_NOTES_INPUT,
      false
    );
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Music Notes Input)'
    );
    // Customize Music Notes Input interaction.
    await explorationEditor.customizeMusicNotesInteraction(
      ['C4', 'D4', 'E4'],
      ['F4', 'G4']
    );
    await explorationEditor.expectModalTitleToBe('Add Response');
    // Add feedback for correct response.
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
    // Add default feedback for other responses.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Add solution.
    await explorationEditor.addMusicNotesInputSolutionToState(
      // TODO(#22998): There is a bug that given any answer, the correct
      // answer changes to ['C4']. So, we are using ['C4'] as a solution even
      // though the correct answer is ['C4', 'E4', 'G4']. Once the bug is fixed,
      // uncomment the following line. And toast message check in next step should
      // be removed.
      // ['C4', 'E4', 'G4'],
      ['C4'],
      'as given in the question.'
    );
    await explorationEditor.expectToastMessage(
      'The current solution does not lead to another card.'
    );

    // Save the exploration draft and navigate to the next card.
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.navigateToCard(CARD_NAMES.NINETEENTH);
  });

  it('should be able to use "World Map" interaction', async function () {
    // Update card content.
    await explorationEditor.updateCardContent('Enter a world map.');
    // Add World Map interaction.
    await explorationEditor.addInteraction(INTERACTION_TYPES.WORLD_MAP, false);
    await explorationEditor.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (World Map)'
    );
    // Customize World Map interaction.
    await explorationEditor.customizeWorldMapInteraction(0, 0, 0);
    await explorationEditor.expectModalTitleToBe('Add Response');
    // Add feedback for correct response.
    await explorationEditor.updateWorldMapLearnerAnswerInResponseModal(
      'is within ... km of ...',
      100
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      CARD_NAMES.TWENTIETH,
      true,
      true
    );
    // Add default feedback for other responses.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Save the exploration draft.
    await explorationEditor.saveExplorationDraft();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
