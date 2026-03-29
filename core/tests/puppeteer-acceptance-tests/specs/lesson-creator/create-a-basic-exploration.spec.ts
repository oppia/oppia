// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * LC.1. Create a basic exploration.
 */
import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const CARD_NAMES = {
  FIRST: '1 - Intro',
  SECOND: '2 - Multiple Choice',
  THIRD: 'Text Input - 3',
  FOURTH: 'End - 4',
};

const FIRST_CARD_QUESTION = 'What is the capital of France?';
const LONG_CONTENT = Array.from({length: 15}, (_, i) => `Line ${i + 1}`).join(
  '\n'
);

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
describe('Lesson Creator', function () {
  let explorationEditor: ExplorationEditor & LoggedInUser & LoggedOutUser;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'ExpEditor1',
      'expeditor1@example.com'
    );
  });

  it(
    'should create a new exploration',
    async function () {
      await explorationEditor.navigateToCreatorDashboardUsingProfileDropdown();
      await explorationEditor.expectToBeInCreatorDashboard();
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModal();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should create content for the first card',
    async function () {
      await explorationEditor.updateStateName(CARD_NAMES.FIRST);
      await explorationEditor.saveExplorationDraft('Renamed initial card');

      await explorationEditor.expectStateNameToBe(CARD_NAMES.FIRST);
      await explorationEditor.expectExplorationGraphToContainCard(
        CARD_NAMES.FIRST
      );

      await explorationEditor.updateCardContent(FIRST_CARD_QUESTION);
      await explorationEditor.expectCardContentToBe(FIRST_CARD_QUESTION);

      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.expectPreviewCardContentToBe(
        CARD_NAMES.FIRST,
        FIRST_CARD_QUESTION
      );

      await explorationEditor.navigateToEditorTab();
      await explorationEditor.expectCardContentToBe(FIRST_CARD_QUESTION);

      await explorationEditor.updateCardContent(LONG_CONTENT);

      await explorationEditor.expectCardHeightLimitWarningToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should add a Continue Button interaction',
    async function () {
      await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await explorationEditor.expectInteractionPreviewCardToBeVisible();
      await explorationEditor.expectRemoveInteractionButtonToBeVisible();

      await explorationEditor.removeInteraction();
      const interactionPreviewAfterRemoval = await explorationEditor.page.$(
        '.e2e-test-interaction-preview'
      );
      expect(interactionPreviewAfterRemoval).toBeNull();
      await explorationEditor.expectNodeWariningSignToBeVisible(true);

      await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await explorationEditor.expectSelectedInteractionNameToBe(
        INTERACTION_TYPES.CONTINUE_BUTTON
      );

      await explorationEditor.clickOnTestExploration();
      await explorationEditor.expectModalTitleToBe(
        'Customize Interaction (Continue Button)'
      );
      await explorationEditor.clickOnElementWithText('Save Interaction');
      await explorationEditor.expectSelectedInteractionNameToBe(
        INTERACTION_TYPES.CONTINUE_BUTTON
      );

      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.page.waitForSelector(
        '.e2e-test-next-card-button',
        {
          visible: true,
        }
      );
      const continueButtonText = await explorationEditor.page.$eval(
        '.e2e-test-next-card-button',
        el => el.textContent?.trim() || ''
      );
      expect(continueButtonText).toBe('Continue');
      await explorationEditor.expectPreviewCardContentToBe(
        CARD_NAMES.FIRST,
        LONG_CONTENT
      );

      await explorationEditor.navigateToEditorTab();
      await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
        'Response'
      );
      await explorationEditor.expectOutcomeFeedbackToBe('Response');

      await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
        'New Response'
      );
      await explorationEditor.expectOutcomeFeedbackToBe('New Response');

      await explorationEditor.viewOppiaResponses();
      await explorationEditor.directLearnersToNewCard(CARD_NAMES.SECOND);
      await explorationEditor.expectCurrentOutcomeDestinationToBe(
        CARD_NAMES.SECOND
      );
      await explorationEditor.expectExplorationGraphToContainCard(
        CARD_NAMES.SECOND
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should preview the lesson',
    async function () {
      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.page.waitForSelector(
        '.e2e-test-next-card-button',
        {
          visible: true,
        }
      );
      await explorationEditor.expectPreviewCardContentToBe(
        CARD_NAMES.FIRST,
        LONG_CONTENT
      );

      await explorationEditor.continueToNextCard();
      await explorationEditor.expectResponseFeedbackToBe('New Response');

      await explorationEditor.navigateToEditorTab();
      await explorationEditor.expectStateNameToBe(CARD_NAMES.SECOND);
      await explorationEditor.navigateToPreviewTab();

      await explorationEditor.openLessonInfoModal();
      await explorationEditor.expectLessonInfoTextToBe('Lesson Info');
      await explorationEditor.closeLessonInfoModal();

      await explorationEditor.restartPreview();
      await explorationEditor.expectPreviewCardContentToBe(
        CARD_NAMES.FIRST,
        LONG_CONTENT
      );

      await explorationEditor.navigateToEditorTab();
      await explorationEditor.expectStateNameToBe(CARD_NAMES.FIRST);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should add a multiple-choice interaction',
    async function () {
      await explorationEditor.navigateToCard(CARD_NAMES.SECOND);
      await explorationEditor.updateCardContent(
        'Which of these texts is bold?'
      );
      await explorationEditor.expectCardContentToBe(
        'Which of these texts is bold?'
      );

      await explorationEditor.addMultipleChoiceInteraction([
        'Italic text',
        'Bold text',
      ]);
      await explorationEditor.updateMultipleChoiceLearnersAnswerInResponseModal(
        'is equal to',
        'Bold text'
      );
      await explorationEditor.addResponseDetailsInResponseModal(
        'Correct!',
        CARD_NAMES.THIRD,
        true,
        true
      );
      await explorationEditor.expectExplorationGraphToContainCard(
        CARD_NAMES.THIRD
      );
      await explorationEditor.expectOutcomeFeedbackToBe('Correct!');
      await explorationEditor.expectCurrentOutcomeDestinationToBe(
        CARD_NAMES.THIRD
      );

      await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
        'Try again.',
        '(try again)'
      );
      await explorationEditor.expectCurrentOutcomeDestinationToBe(
        '(try again)'
      );

      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.expectPreviewCardContentToBe(
        CARD_NAMES.SECOND,
        'Which of these texts is bold?'
      );
      const previewChoices = await explorationEditor.page.$$eval(
        '.e2e-test-multiple-choice-option',
        elements => elements.map(el => el.textContent?.trim() || '')
      );
      expect(previewChoices).toEqual(['Italic text', 'Bold text']);

      await explorationEditor.selectMultipleChoiceOption('Italic text');
      await explorationEditor.expectResponseFeedbackToBe('Try again.');

      await explorationEditor.selectMultipleChoiceOption('Bold text');
      await explorationEditor.expectResponseFeedbackToBe('Correct!');
      await explorationEditor.continueToNextCard();

      await explorationEditor.navigateToEditorTab();
      await explorationEditor.expectStateNameToBe(CARD_NAMES.THIRD);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should add a Text Input interaction with hints and a solution',
    async function () {
      await explorationEditor.updateCardContent(
        'Explain why "Bold text" is the correct option.'
      );
      await explorationEditor.addInteraction(
        INTERACTION_TYPES.TEXT_INPUT,
        false
      );
      await explorationEditor.customizeTextInputInteraction(
        'Type an answer',
        '3',
        true
      );

      await explorationEditor.addResponsesToTheInteraction(
        INTERACTION_TYPES.TEXT_INPUT,
        'Bold text',
        'Correct!',
        CARD_NAMES.FOURTH,
        true
      );
      await explorationEditor.expectOutcomeFeedbackToBe('Correct!');
      await explorationEditor.expectCurrentOutcomeDestinationToBe(
        CARD_NAMES.FOURTH
      );

      await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
        'Try again.'
      );
      await explorationEditor.addHintToState(
        'Bold text means the text is heavier'
      );
      await explorationEditor.expectHintsToConatin(
        'Bold text means the text is heavier'
      );

      await explorationEditor.addSolutionToState(
        'Bold text',
        'Bold text means the text is heavier.',
        false
      );
      await explorationEditor.expectSolutionsToContain(
        'One solution is "Bold text". Bold text means the text is heavier..'
      );

      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.expectPreviewCardContentToBe(
        CARD_NAMES.THIRD,
        'Explain why "Bold text" is the correct option.'
      );
      const textInputPlaceholder = await explorationEditor.page.$eval(
        'textarea.e2e-test-description-box',
        el => (el as HTMLTextAreaElement).placeholder
      );
      expect(textInputPlaceholder).toBe('Type an answer');

      await explorationEditor.submitTextInputAnsswer('');
      await explorationEditor.expectAnswerErrorMessageToBe(
        'Enter an answer to continue'
      );

      await explorationEditor.submitTextInputAnsswer('Italic text');
      await explorationEditor.expectResponseFeedbackToBe('Try again.');

      await explorationEditor.viewHint();
      await explorationEditor.expectHintInHintModalToContain(
        'Bold text means the text is heavier'
      );
      await explorationEditor.closeHintModal();

      await explorationEditor.viewSolution();
      const solutionModalText = await explorationEditor.page.$eval(
        'oppia-add-or-update-solution-modal',
        el => el.textContent || ''
      );
      expect(solutionModalText).toContain('Bold text');
      expect(solutionModalText).toContain(
        'Bold text means the text is heavier.'
      );
      await explorationEditor.closeSolutionModal();

      await explorationEditor.submitTextInputAnsswer('Bold text');
      await explorationEditor.expectResponseFeedbackToBe('Correct!');
      await explorationEditor.continueToNextCard();

      await explorationEditor.navigateToEditorTab();
      await explorationEditor.expectStateNameToBe(CARD_NAMES.FOURTH);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should add an EndExploration interaction',
    async function () {
      await explorationEditor.navigateToCard(CARD_NAMES.FOURTH);
      await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
      await explorationEditor.expectInteractionPreviewCardToBeVisible();
      await explorationEditor.expectSelectedInteractionNameToBe(
        INTERACTION_TYPES.END_EXPLORATION
      );
      await explorationEditor.expectNodeWariningSignToBeVisible(false);
      await explorationEditor.expectSelfLoopWarningToBeVisible(false);
      await explorationEditor.expectGoalWarningToBeVisible(false);
      await explorationEditor.expectSaveDraftButtonToBeDisabled(false);

      await explorationEditor.navigateToPreviewTab();
      const submitButton = await explorationEditor.page.$(
        '.e2e-test-submit-answer-button'
      );
      expect(submitButton).toBeNull();
      await explorationEditor.page.waitForSelector(
        '.e2e-test-preview-restart-button',
        {
          visible: true,
        }
      );
      await explorationEditor.navigateToEditorTab();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show warning when there are 50 unsaved changes',
    async function () {
      await explorationEditor.saveExplorationDraft();

      for (let i = 1; i <= 50; i++) {
        await explorationEditor.updateCardContent(`Content ${i}`);
      }

      await explorationEditor.expectSaveRecommendationModalToBeVisible();
      await explorationEditor.saveExplorationDraftFromSaveRecommendationModal();
      await explorationEditor.expectSaveDraftButtonToBeDisabled(true);
    },
    50 * 60 * 1000 // Test takes longer that 35 minutes.
  );

  it(
    'should view exploration with global language as Spanish',
    async function () {
      await explorationEditor.navigateToPreferencesPage();
      await explorationEditor.updatePreferredSiteLanguage('Español');
      await explorationEditor.saveChangesInPreferencesPage();

      await explorationEditor.navigateToCreatorDashboardUsingProfileDropdown();
      await explorationEditor.expectToBeInCreatorDashboard();
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModal(false);

      await explorationEditor.addInteraction(INTERACTION_TYPES.NUMBER_INPUT);

      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.page.waitForSelector(
        '.e2e-test-float-form-input',
        {
          visible: true,
        }
      );

      const placeholderText = await explorationEditor.page.$eval(
        '.e2e-test-float-form-input',
        el => (el as HTMLInputElement).placeholder
      );
      expect(placeholderText).toBe('Ingresa un número');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
