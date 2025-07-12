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
 * @fileoverview
 * Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * IO.PP. Partner submits a partnerships application.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';

describe('Interested Partner Organization', function () {
  let explorationEditor: ExplorationEditor;

  beforeAll(async function () {});

  it('should be able to use "continue button" interaction', async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();

    // Update the card content.
    await explorationEditor.updateCardContent('Click on the button.');
    await explorationEditor.expectCardContentToBe('Click on the button.');
    await explorationEditor.expectEditCardContentPencilButtonToBeVisible();

    // Add a new interaction.
    await explorationEditor.addInteraction('Continue Button');
    await explorationEditor.expectInteractionPreviewCardToBeVisible();
    await explorationEditor.expectRemoveInteractionButtonToBeVisible();

    // Update the default response feedback.
    await explorationEditor.updateDefaultResponseFeedbackInExplorationEditorPage(
      "Great! Now let's check other interactions"
    );
    // TODO: Response feedback is displayed in the box.
    // TODO: Pen icon for feedback is still visible.

    // Direct learners to new card.
    await explorationEditor.directLearnersToNewCard('Second Card');
    await explorationEditor.expectCurrentOutcomeDestinationToBe('Second Card');
    await explorationEditor.expectEditOutcomeDestPencilButtonToBeVisible();
    await explorationEditor.expectExplorationGraphToContainCard('Second Card');

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "multiple choice" interaction', async function () {
    await explorationEditor.navigateToCard('Second Card');

    // Add a multiple choice interaction.
    await explorationEditor.updateCardContent('This is a multiple choice.');
    await explorationEditor.addMultipleChoiceInteraction([
      'Option 1',
      'Option 2',
      'Correct Response',
      'Option 4',
    ]);
    await explorationEditor.expectAddResponseModalHeaderToBe('Add Response');

    // Add responses.
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.MULTIPLE_CHOICE,
      'Correct Response',
      'Great Job!',
      'Third Card',
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    await explorationEditor.addHintToState('Try Google Search.');
    await explorationEditor.expectHintsToConatin('Try Google Search.');

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "number input" interaction', async function () {
    await explorationEditor.navigateToCard('Third Card');

    // Add a number input interaction.
    await explorationEditor.updateCardContent('Enter number 100.');
    await explorationEditor.expectCardContentToBe('Enter number 100.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMBER_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMBER_INPUT,
      '100',
      'Perfect!',
      'Fourth Card',
      true
    );

    await explorationEditor.addSolutionToState(
      '100',
      'As said in the question itself.',
      true
    );
    await explorationEditor.expectSolutionsToContain(
      'One solution is "100". As said in the question itself..'
    );

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "text input" interaction', async function () {
    await explorationEditor.navigateToCard('Fourth Card');

    // Add a text input interaction.
    await explorationEditor.updateCardContent('Enter text "Hello, Oppia!".');
    await explorationEditor.expectCardContentToBe(
      'Enter text "Hello, Oppia!".'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.TEXT_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.TEXT_INPUT,
      'Hello',
      'Perfect!',
      'Fifth Card',
      true
    );
    await explorationEditor.customizeTextInputInteraction(
      'Hello, there!',
      '2',
      true
    );
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.TEXT_INPUT,
      'Hello, Oppia!',
      'Prefect',
      'Fifth Card',
      true
    );
    await explorationEditor.expectOutcomeFeedbackToBe('Perfect');

    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'No write "Hello, Oppia!"'
    );

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "Image Region" interaction', async function () {
    await explorationEditor.navigateToCard('Fifth Card');

    // Add a image region interaction.
    await explorationEditor.updateCardContent('Enter an image region.');
    await explorationEditor.addImageInteraction();
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong.'
    );
    await explorationEditor.directLearnersToNewCard('Sixth Card');
    await explorationEditor.saveExplorationDraft();

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "Item Selection" interaction', async function () {
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
      'contains atleast one of',
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

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "Drag and Drop Sort" interaction', async function () {
    await explorationEditor.navigateToCard('Seventh Card');

    // Add a drag and drop sort interaction.
    await explorationEditor.updateCardContent('Drag and Drop Sort');
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
      'is equal to ordering',
      [1, 3, 2]
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Great!',
      'Ninth Card',
      true,
      true
    );

    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Try Again!'
    );

    // TODO: Add solution.

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "Fraction Input" interaction', async function () {
    await explorationEditor.navigateToCard('Ninth Card');

    // Add a fraction input interaction.
    await explorationEditor.updateCardContent('Enter a fraction.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);
    await explorationEditor.updateCardContent('Enter a fraction: 1/2.');
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      '1/2',
      'Perfect!',
      'Tenth Card',
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    await explorationEditor.addSolutionToState(
      '1/2',
      'As given in the question.',
      true
    );

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "Graph Theory" interaction', async function () {
    // Navigate to the new card and update its content.
    await explorationEditor.navigateToCard('Tenth Card');

    // Add a graph theory interaction.
    // TODO: Complete it.
    await explorationEditor.updateCardContent('Graph Theory');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.CONTINUE_BUTTON,
      false
    );
    await explorationEditor.updateDefaultResponseFeedbackInExplorationEditorPage(
      "Great! Now let's check other interactions"
    );
    await explorationEditor.directLearnersToNewCard('Eleventh Card');

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "Set Input" interaction', async function () {
    await explorationEditor.navigateToCard('Eleventh Card');

    // Add a set input interaction.
    await explorationEditor.updateCardContent('Enter a set.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.SET_INPUT);
    await explorationEditor.updateSetInputLearnerAnswerInResponseModal(
      'is equal to',
      ['1', '2', '3']
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

    // TODO: Add solution.

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "Numeric Expression" interaction', async function () {
    await explorationEditor.navigateToCard('Twelfth Card');

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
      'Thirteenth Card',
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // TODO: Add solution.

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "Algebric Expression" intreaction', async function () {
    await explorationEditor.navigateToCard('Thirteenth Card');

    // Add a algebric expression interaction.
    await explorationEditor.updateCardContent('Enter a algebric expression.');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.ALGEBRIC_EXPRESSION
    );
    await explorationEditor.updateAlgebricExpressionLearnerAnswerInResponseModal(
      'matches exactly with',
      'a+b'
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

    // TODO: Add solution.
  });

  it('should be able to use "Math Equation" interaction', async function () {
    await explorationEditor.navigateToCard('Fourteenth Card');

    // Add a math equation interaction.
    await explorationEditor.updateCardContent('Enter a math equation.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.MATH_EQUATION);
    await explorationEditor.updateMathEquationLearnerAnswerInResponseModal(
      'matches exactly with',
      '5x=2+3'
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

    // TODO: Add solution.
  });

  it('should be able to use "Number With Units" interaction', async function () {
    await explorationEditor.navigateToCard('Fifteenth Card');

    // Add a number with units input interaction.
    await explorationEditor.updateCardContent('Enter a number with units.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMBER_WITH_UNITS);
    await explorationEditor.updateNumberWithUnitsLearnerAnswerInResponseModal(
      'has the same value and units as',
      '100km'
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

    // TODO: Add solution.

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "Ratio Expression Input" interaction', async function () {
    await explorationEditor.navigateToCard('Sixteenth Card');

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
      'Seventeenth Card',
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // TODO: Add solution.

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "Code Editor" interaction', async function () {
    await explorationEditor.navigateToCard('Seventeenth Card');

    // Add a code editor interaction.
    await explorationEditor.updateCardContent('Enter a code editor.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.CODE_EDITOR);
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

    // TODO: Add solution.

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "Pencil Code Editor" interaction', async function () {
    await explorationEditor.navigateToCard('Eighteenth Card');

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
      'Nineteenth Card',
      true,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // TODO: Add solution.

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "Music Notes Input" interaction', async function () {
    await explorationEditor.navigateToCard('Nineteenth Card');

    // Add a music notes input interaction.
    await explorationEditor.updateCardContent('Enter a music notes input.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.MUSIC_NOTES_INPUT);
    await explorationEditor.updateMusicNotesInputLearnerAnswerInResponseModal(
      'is equal to',
      ['C4', 'E4', 'G4']
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

    // TODO: Add solution.

    await explorationEditor.saveExplorationDraft();
  });

  it('should be able to use "World Map" interaction', async function () {
    await explorationEditor.navigateToCard('Twentieth Card');

    // Add a world map interaction.
    await explorationEditor.updateCardContent('Enter a world map.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.WORLD_MAP);
    await explorationEditor.updateWorldMapLearnerAnswerInResponseModal(
      'is equal to',
      ['1', '2', '3']
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

    // TODO: Add solution.

    await explorationEditor.saveExplorationDraft();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
