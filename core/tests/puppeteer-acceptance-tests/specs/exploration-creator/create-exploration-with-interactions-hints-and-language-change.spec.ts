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
 * @fileoverview Acceptance test for LC.1: Create exploration - logged-in creator.
 *
 * Test LC.1 (Create exploration) — logged-in creator:
 * Creator Dashboard → Create Exploration
 * Rename card, add content, add interactions (Continue, Multiple Choice, Text Input, EndExploration)
 * Add hints & solutions
 * Preview at each stage
 * Final: change site language to Spanish → verify Numeric Input placeholder is "Ingresa un número"
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const CARD_NAMES = {
  FIRST: 'Introduction',
  SECOND: 'Multiple Choice Card',
  THIRD: 'Text Input Card',
  FOURTH: 'Number Input Card',
  FINAL: 'End',
};

describe('Exploration Creator', function () {
  let explorationEditor: ExplorationEditor & LoggedInUser;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationCreator',
      'exploration_creator@example.com'
    );
  });

  it('should navigate to creator dashboard and create an exploration', async function () {
    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();
  });

  it('should rename first card and add Continue Button interaction', async function () {
    // Rename first card to "Introduction".
    await explorationEditor.updateCardContent(
      'Welcome to this exploration! Click continue to proceed.'
    );
    await explorationEditor.expectCardContentToBe(
      'Welcome to this exploration! Click continue to proceed.'
    );

    // Add Continue Button interaction.
    await explorationEditor.addInteraction('Continue Button');
    await explorationEditor.expectInteractionPreviewCardToBeVisible();

    // Direct learners to new card.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAMES.SECOND);
    await explorationEditor.expectCurrentOutcomeDestinationToBe(
      CARD_NAMES.SECOND
    );
    await explorationEditor.expectExplorationGraphToContainCard(
      CARD_NAMES.SECOND
    );

    await explorationEditor.saveExplorationDraft();

    // Preview the first card.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.expectPreviewCardContentToBe(
      CARD_NAMES.FIRST,
      'Welcome to this exploration! Click continue to proceed.'
    );
    await explorationEditor.navigateToEditorTab();
  });

  it('should add Multiple Choice interaction with hints', async function () {
    await explorationEditor.navigateToCard(CARD_NAMES.SECOND);

    // Add content to second card.
    await explorationEditor.updateCardContent('What is the capital of France?');
    await explorationEditor.expectCardContentToBe(
      'What is the capital of France?'
    );

    // Add Multiple Choice interaction.
    await explorationEditor.addMultipleChoiceInteraction([
      'London',
      'Berlin',
      'Paris',
      'Madrid',
    ]);

    // Add correct response.
    await explorationEditor.updateMultipleChoiceLearnersAnswerInResponseModal(
      'is equal to',
      'Paris'
    );
    await explorationEditor.addResponseDetailsInResponseModal(
      'Correct! Paris is the capital of France.',
      CARD_NAMES.THIRD,
      true,
      true
    );
    await explorationEditor.expectExplorationGraphToContainCard(
      CARD_NAMES.THIRD
    );

    // Add default response.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Not quite! Try again.'
    );

    // Add hint.
    await explorationEditor.addHintToState(
      'Think about the city with the Eiffel Tower.'
    );
    await explorationEditor.expectHintsToConatin(
      'Think about the city with the Eiffel Tower.'
    );

    await explorationEditor.saveExplorationDraft();

    // Preview the second card.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.expectPreviewCardContentToBe(
      CARD_NAMES.SECOND,
      'What is the capital of France?'
    );
    await explorationEditor.navigateToEditorTab();
  });

  it('should add Text Input interaction with solution', async function () {
    await explorationEditor.navigateToCard(CARD_NAMES.THIRD);

    // Add content to third card.
    await explorationEditor.updateCardContent('Name a programming language.');
    await explorationEditor.expectCardContentToBe(
      'Name a programming language.'
    );

    // Add Text Input interaction.
    await explorationEditor.addInteraction(INTERACTION_TYPES.TEXT_INPUT, false);
    await explorationEditor.customizeTextInputInteraction(
      'Type your answer here',
      '1',
      true
    );

    // Add response.
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.TEXT_INPUT,
      'Python',
      'Great choice!',
      CARD_NAMES.FOURTH,
      true
    );
    await explorationEditor.expectExplorationGraphToContainCard(
      CARD_NAMES.FOURTH
    );

    // Add default response.
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'That works too!'
    );

    // Add solution.
    await explorationEditor.addSolutionToState(
      'Python',
      'Python is a popular programming language.',
      false
    );
    await explorationEditor.expectSolutionsToContain(
      'One solution is "Python". Python is a popular programming language..'
    );

    await explorationEditor.saveExplorationDraft();

    // Preview the third card.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.expectPreviewCardContentToBe(
      CARD_NAMES.THIRD,
      'Name a programming language.'
    );
    await explorationEditor.navigateToEditorTab();
  });

  it('should add Number Input interaction and verify placeholder', async function () {
    await explorationEditor.navigateToCard(CARD_NAMES.FOURTH);

    // Add content to fourth card.
    await explorationEditor.updateCardContent('Enter the number 42.');
    await explorationEditor.expectCardContentToBe('Enter the number 42.');

    // Add Number Input interaction.
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.NUMBER_INPUT,
      false
    );
    await explorationEditor.customizeNumberInputInteraction(true);

    // Add response.
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMBER_INPUT,
      '42',
      'Perfect! That is correct.',
      CARD_NAMES.FINAL,
      true
    );
    await explorationEditor.expectExplorationGraphToContainCard(
      CARD_NAMES.FINAL
    );

    // Add hint.
    await explorationEditor.addHintToState(
      'It is the answer to life, the universe, and everything!'
    );

    await explorationEditor.saveExplorationDraft();

    // Preview the fourth card.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.expectPreviewCardContentToBe(
      CARD_NAMES.FOURTH,
      'Enter the number 42.'
    );
    await explorationEditor.navigateToEditorTab();
  });

  it('should add End Exploration interaction', async function () {
    await explorationEditor.navigateToCard(CARD_NAMES.FINAL);

    // Add content to final card.
    await explorationEditor.updateCardContent(
      'Congratulations! You have completed this exploration.'
    );
    await explorationEditor.expectCardContentToBe(
      'Congratulations! You have completed this exploration.'
    );

    // Add End Exploration interaction.
    await explorationEditor.addInteraction('End Exploration');

    await explorationEditor.saveExplorationDraft();

    // Preview the final card.
    await explorationEditor.navigateToPreviewTab();
    await explorationEditor.expectPreviewCardContentToBe(
      CARD_NAMES.FINAL,
      'Congratulations! You have completed this exploration.'
    );
    await explorationEditor.navigateToEditorTab();
  });

  it('should change site language to Spanish and verify Number Input placeholder', async function () {
    const editorUrl = explorationEditor.page.url();

    // Change the site language to Spanish.
    await explorationEditor.navigateToPreferencesPage();
    await explorationEditor.updatePreferredSiteLanguage('Español');
    await explorationEditor.saveChangesInPreferencesPage();
    await explorationEditor.goto(editorUrl);

    // Navigate back to the Number Input card.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAMES.FOURTH);

    // Navigate to preview to check the placeholder.
    await explorationEditor.navigateToPreviewTab();

    // Verify the placeholder text in Spanish.
    await explorationEditor.page.waitForSelector('.e2e-test-float-form-input', {
      visible: true,
    });
    const placeholderText = await explorationEditor.page.$eval(
      '.e2e-test-float-form-input',
      el => (el as HTMLInputElement).placeholder
    );

    if (placeholderText !== 'Ingresa un número') {
      throw new Error(
        `Expected placeholder to be "Ingresa un número" but found "${placeholderText}"`
      );
    }
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
