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
 * EC.EE. Preview commonly used interactions.
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
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain(
        'Try Google Search.'
      );
      await explorationEditor.closeHintModal();
    }
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
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain(
        'All negative numbers are less than 0.'
      );
      await explorationEditor.closeHintModal();
    }
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
    // Add an image region interaction.
    await explorationEditor.updateCardContent('Enter an image region.');
    await explorationEditor.addImageInteraction('Perfect!', CARD_NAMES.SIXTH);
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
    // Add an item selection interaction.
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
    // TODO(#22766): Skip hint check for mobile, as hint button in mobile view gets
    // covered by navigation in mobile view.
    if (!explorationEditor.isViewportAtMobileWidth()) {
      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain(
        'Arrange in Ascending Order'
      );
      await explorationEditor.closeHintModal();
    }
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

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
