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
 * @fileoverview Utility functions for the Exploration Editor page.
 */

import {Page, ElementHandle} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';
import {ExplorationEditorModal} from '../common/exploration-editor';
import * as fs from 'fs';
import * as path from 'path';
import {RTEEditor} from '../common/rte-editor';

const creatorDashboardPage = testConstants.URLs.CreatorDashboard;
const baseUrl = testConstants.URLs.BaseURL;

const createExplorationButtonSelector =
  'button.e2e-test-create-new-exploration-button';
const saveContentButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const customizeInteractionBodySelector = '.e2e-test-customize-interaction-body';
const mobileSettingsBarSelector = 'li.e2e-test-mobile-settings-button';
const basicSettingsDropdown = 'h3.e2e-test-settings-container';
const languageUpdateDropdown =
  'mat-select.e2e-test-exploration-language-select';
const languageDropdownValueSelector =
  'mat-select.e2e-test-exploration-language-select .mat-select-value';
const settingsTabSelector = 'a.e2e-test-exploration-settings-tab';
const settingsContainerSelector =
  '.oppia-editor-card.oppia-settings-card-container';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const saveChangesButton = 'button.e2e-test-save-changes';

const addInteractionModalSelector = 'customize-interaction-body-container';
const addHintButton = 'button.e2e-test-oppia-add-hint-button';
const saveHintButton = 'button.e2e-test-save-hint';
const solutionInputNumeric = 'oppia-add-or-update-solution-modal input';
const solutionInputTextArea =
  'oppia-add-or-update-solution-modal textarea.e2e-test-description-box';
const addSolutionButton = 'button.e2e-test-oppia-add-solution-button';
const submitAnswerButton = '.e2e-test-submit-answer-button';
const submitSolutionButton = 'button.e2e-test-submit-solution-button';
const textInputInteractionButton = 'div.e2e-test-interaction-tile-TextInput';

const saveDraftButton = 'button.e2e-test-save-draft-button';
const commitMessageSelector = 'textarea.e2e-test-commit-message-input';
const publishExplorationButtonSelector = 'button.e2e-test-publish-exploration';
const explorationTitleInput = 'input.e2e-test-exploration-title-input-modal';
const explorationGoalInput = 'input.e2e-test-exploration-objective-input-modal';
const explorationCategoryDropdown =
  'mat-form-field.e2e-test-exploration-category-metadata-modal';
const setAsCheckpointButton = '.e2e-test-checkpoint-selection-checkbox';

const saveExplorationChangesButton = 'button.e2e-test-confirm-pre-publication';
const explorationConfirmPublishButton = '.e2e-test-confirm-publish';
const explorationIdElement = 'span.oppia-unique-progress-id';
const closePublishedPopUpButton = 'button.e2e-test-share-publish-close';

const explorationStateGraphModalSelector =
  '.e2e-test-exploration-state-graph-modal';
const mobileStateGraphResizeButton = '.e2e-test-mobile-graph-resize-button';
const currentCardNameContainerSelector = '.e2e-test-state-name-container';

const stateEditSelector = '.e2e-test-state-edit-content';
const stateResponsesSelector = '.e2e-test-default-response-tab';
const oppiaFeebackEditorContainerSelector = '.e2e-test-response-body-default';

const openOutcomeDestButton = '.e2e-test-open-outcome-dest-editor';
const destinationCardSelector = 'select.e2e-test-destination-selector-dropdown';
const addStateInput = '.e2e-test-add-state-input';
const saveOutcomeDestButton = '.e2e-test-save-outcome-dest';
const stateContentSelector = '.e2e-test-actual-state-content';
const stateContentInputField = 'div.e2e-test-rte';

const toastMessage = '.e2e-test-toast-message';

const mobileChangesDropdownSelector = 'div.e2e-test-mobile-changes-dropdown';
const mobileSaveChangesButtonSelector =
  'button.e2e-test-save-changes-for-small-screens';
const mobilePublishButtonSelector = 'button.e2e-test-mobile-publish-button';
const mobileNavbarDropdown = 'div.e2e-test-mobile-options-dropdown';
const mobileNavbarOptions = '.navbar-mobile-options';
const mobileOptionsButtonSelector = 'i.e2e-test-mobile-options';

const tagsField = '.e2e-test-chip-list-tags';
const errorSavingExplorationModal = '.e2e-test-discard-lost-changes-button';

const multipleChoiceResponseDropdown =
  'mat-select.e2e-test-main-html-select-selector';
const multipleChoiceResponseOption = 'mat-option.e2e-test-html-select-selector';
const responseModalBodySelector = '.e2e-test-response-modal-body';
const floatFormInput = '.e2e-test-float-form-input';
const addResponseOptionButton = 'button.e2e-test-add-list-entry';
const textInputInteractionOption =
  'tr[id^="e2e-test-schema-based-list-editor-table-row"]';
const intEditorField = '.e2e-test-editor-int';

const feedbackEditorSelector = '.e2e-test-open-feedback-editor';
const correctAnswerInTheGroupSelector = '.e2e-test-editor-correctness-toggle';
const addNewResponseButton = 'button.e2e-test-add-new-response';
const responseModalHeaderSelector = '.e2e-test-add-response-modal-header';
const addAnotherResponseButton = 'button.e2e-test-add-another-response';

const defaultFeedbackTab = 'a.e2e-test-default-response-tab';
const openOutcomeFeedBackEditor = 'div.e2e-test-open-outcome-feedback-editor';
const saveOutcomeFeedbackButton = 'button.e2e-test-save-outcome-feedback';
const destinationSelectorDropdown = '.e2e-test-destination-selector-dropdown';
const destinationWhenStuckSelectorDropdown =
  '.e2e-test-destination-when-stuck-selector-dropdown';
const saveDestinationButtonSelector = '.e2e-test-save-outcome-dest';
const saveStuckDestinationButtonSelector = '.e2e-test-save-stuck-destination';
const addDestinationStateWhenStuckInput = '.protractor-test-add-state-input';
const outcomeDestWhenStuckSelector =
  '.protractor-test-open-outcome-dest-if-stuck-editor';

const mobileNavbarPane = '.oppia-exploration-editor-tabs-dropdown';
const mobileTranslationTabButton = '.e2e-test-mobile-translation-tab';
const mainTabButton = '.e2e-test-main-tab';
const mobileMainTabButton = '.e2e-test-mobile-main-tab';
const mainTabContainerSelector = '.e2e-test-exploration-main-tab';
const navigationDropdownInMobileVisibleSelector =
  '.oppia-exploration-editor-tabs-dropdown.show';
const dropdownToggleIcon = '.e2e-test-mobile-options-dropdown';
const editTranslationSelector = 'div.e2e-test-edit-translation';
const stateTranslationEditorSelector =
  'div.e2e-test-state-translation-editor schema-based-editor';
const saveTranslationButton = 'button.e2e-test-save-translation';
const activeTranslationTab = '.e2e-test-active-translation-tab';
const translationTabButton = '.e2e-test-translation-tab';
const translationTabContainer = '.e2e-test-translation-tab-container';
const translationModeButton = 'button.e2e-test-translation-mode';
const dismissTranslationWelcomeModalSelector =
  'button.e2e-test-translation-tab-dismiss-welcome-modal';

const addManualVoiceoverButton = '.e2e-test-voiceover-upload-audio';
const saveUploadedAudioButton = '.e2e-test-save-uploaded-audio-button';
const voiceoverLanguageSelector = '.e2e-test-voiceover-language-selector';
const voiceoverLanguageOptionSelector = '.e2e-test-language-selector-option';
const voiceoverLanguageAccentSelector =
  '.e2e-test-voiceover-language-accent-selector';
const voiceoverLanguageAccentOptionSelector =
  '.e2e-test-language-accent-selector-option';

const skillItemInRTESelector = '.e2e-test-rte-skill-selector-item';
const skillNameInput = '.e2e-test-skill-name-input';

const closeButtonForExtraModel = '.e2e-test-close-rich-text-component-editor';

const oppiaYouTubeVideoUrl = 'https://www.youtube.com/watch?v=0tRc75S9MFU';
const oppiaWebURL = 'https://www.oppia.org';

const customizeInteractionHeaderSelector =
  '.e2e-test-customize-interaction-header';
const loadingFullPageOverlaySelector = '.oppia-loading-full-page';

const historyTabButton = '.e2e-test-history-tab';
const mobileHistoryTabButton = '.e2e-test-mobile-history-button';
const historyTabContentContainerSelector = '.e2e-test-exploration-history-tab';
const historyListContent = '.e2e-test-history-list-item';
const historyTableIndex = '.e2e-test-history-table-index';
const historyListOptions = '.e2e-test-history-table-option';
const downloadExplorationButton =
  'a.dropdown-item.e2e-test-download-exploration';
const nextCardButton = '.e2e-test-next-card-button';
const nextCardArrowButton = '.e2e-test-next-button';
const previousCardButton = '.e2e-test-back-button';

// Common Selectors.
const commonModalTitleSelector = '.e2e-test-modal-header';

export enum INTERACTION_TYPES {
  ALGEBRAIC_EXPRESSION = 'Algebraic Expression Input',
  CODE_EDITOR = 'Code Editor',
  CONTINUE_BUTTON = 'Continue Button',
  DRAG_AND_DROP_SORT = 'Drag And Drop Sort',
  END_EXPLORATION = 'End Exploration',
  FRACTION_INPUT = 'Fraction Input',
  GRAPH_THEORY = 'Graph Theory',
  ITEM_SELECTION = 'Item Selection',
  MATH_EQUATION = 'Math Equation Input',
  MULTIPLE_CHOICE = 'Multiple Choice',
  MUSIC_NOTES_INPUT = 'Music Notes Input',
  NUMBER_INPUT = 'Number Input',
  NUMBER_WITH_UNITS = 'Number With Units',
  NUMERIC_EXPRESSION = 'Numeric Expression Input',
  PENCIL_CODE_EDITOR = 'Pencil Code Editor',
  RATIO_EXPRESSION_INPUT = 'Ratio Expression Input',
  SET_INPUT = 'Set Input',
  TEXT_INPUT = 'Text Input',
  WORLD_MAP = 'World Map',
  NUMERIC_INPUT = 'Number Input',
}

export const INTERACTION_TABS = {
  MATHS: 'Math',
  PROGRAMMING: 'Programming',
  GEOGRAPHY: 'Geography',
  MUSIC: 'Music',
};

export const INTERACTION_TABS_SELECTORS: Record<string, string> = {
  [INTERACTION_TABS.MATHS]: '.e2e-test-interaction-tab-math',
  [INTERACTION_TABS.PROGRAMMING]: '.e2e-test-interaction-tab-programming',
  [INTERACTION_TABS.GEOGRAPHY]: '.e2e-test-interaction-tab-geography',
  [INTERACTION_TABS.MUSIC]: '.e2e-test-interaction-tab-music',
};

export const INTERACTION_TABS_OF_INTERACTION_TYPE: Record<string, string> = {
  [INTERACTION_TYPES.CODE_EDITOR]: INTERACTION_TABS.PROGRAMMING,
  [INTERACTION_TYPES.FRACTION_INPUT]: INTERACTION_TABS.MATHS,
} as const;

export class ExplorationEditor extends BaseUser {
  /**
   * Navigate to creator dashboard page.
   */
  async navigateToCreatorDashboardPage(): Promise<void> {
    await this.goto(creatorDashboardPage);
    showMessage('Creator dashboard page is opened successfully.');
  }

  /**
   * Updates an exploration description containing all RTE elements.
   */
  async addExplorationDescriptionContainingAllRTEComponents(): Promise<void> {
    // Click on RTE.
    await this.expectElementToBeVisible(stateEditSelector);
    await this.clickOnElementWithSelector(stateEditSelector);

    const rteEditor = new RTEEditor(this);
    // Add Bold text.
    await rteEditor.clickOnRTEOptionWithTitle('Bold');
    await this.typeInInputField(stateContentInputField, 'Bold text');
    await this.page.keyboard.press('Enter');
    await rteEditor.clickOnRTEOptionWithTitle('Bold');

    // Add Italic text.
    await rteEditor.clickOnRTEOptionWithTitle('Italic');
    await this.typeInInputField(stateContentInputField, 'Italic text');
    await this.page.keyboard.press('Enter');
    await rteEditor.clickOnRTEOptionWithTitle('Italic');

    // Add Numbered List.
    await rteEditor.clickOnRTEOptionWithTitle('Numbered List');
    await this.typeInInputField(stateContentInputField, 'Numbered List Item 1');
    await this.page.keyboard.press('Enter');
    await this.typeInInputField(stateContentInputField, 'Numbered List Item 2');
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.press('Enter');

    // Add Bulleted List.
    await rteEditor.clickOnRTEOptionWithTitle('Bulleted List');
    await this.typeInInputField(stateContentInputField, 'Bulleted List Item 1');
    await this.page.keyboard.press('Enter');
    await this.typeInInputField(stateContentInputField, 'Bulleted List Item 2');
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.press('Enter');

    // Add Pre formatted Text.
    await rteEditor.clickOnRTEOptionWithTitle('Pre');
    await this.typeInInputField(stateContentInputField, 'Pre formatted text');
    await rteEditor.clickOnRTEOptionWithTitle('Pre');
    await this.page.keyboard.press('Enter');

    // Add Block Quote.
    await rteEditor.clickOnRTEOptionWithTitle('Block Quote');
    await this.typeInInputField(stateContentInputField, 'Block Quote text');
    await this.page.keyboard.press('Enter');
    await rteEditor.clickOnRTEOptionWithTitle('Block Quote');

    // Add Collapsible Block.
    await rteEditor.addCollapsibleBlockRTE();
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('ArrowRight');

    // Add Image.
    await rteEditor.addImageRTE(
      testConstants.data.profilePicture,
      'Test Image',
      'Test Image Caption'
    );
    await this.waitForNetworkIdle();

    await this.page.keyboard.press('ArrowRight');

    // Video.
    await rteEditor.addVideoRTE(oppiaYouTubeVideoUrl);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('ArrowRight');

    // Add Link.
    await rteEditor.addTextWithLinkRTE('Go to Oppia.org website', oppiaWebURL);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('Enter');

    // Math Formula.
    await rteEditor.clickOnRTEOptionWithTitle('Insert mathematical formula');
    await this.waitForNetworkIdle();
    const textareaElement = await this.page.$(
      'textarea[placeholder*="Enter a math expression using LaTeX"]'
    );
    if (textareaElement) {
      await this.typeInInputField(textareaElement, 'x^2 + y^2 = z^2');
    }
    await this.clickOnElementWithSelector(closeButtonForExtraModel);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('Enter');

    // Concept Card.
    await rteEditor.clickOnRTEOptionWithTitle('Insert Concept Card Link');
    await this.waitForNetworkIdle();
    const skillSearchElement = await this.page.$(skillNameInput);
    if (skillSearchElement) {
      await this.typeInInputField(skillSearchElement, 'Math');
    }
    await this.clickOnElementWithSelector(skillItemInRTESelector);
    await this.page.keyboard.press('Enter');
    await this.clickOnElementWithSelector(closeButtonForExtraModel);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('Enter');

    // Tab Contents.
    await rteEditor.addTabContentsRTE();
    await this.page.keyboard.press('ArrowRight');

    await this.clickOnElementWithSelector(saveContentButton);
    await this.expectElementToBeVisible(saveContentButton, false);
  }

  /**
   * Function to add a hint for a state card.
   * @param {string} hint - The hint to be added for the current card.
   */
  async addHintToState(hint: string): Promise<void> {
    await this.expectElementToBeVisible(addHintButton);
    await this.clickOnElementWithSelector(addHintButton);
    await this.typeInInputField(stateContentInputField, hint);
    await this.clickOnElementWithSelector(saveHintButton);
    await this.expectElementToBeVisible(saveHintButton, false);
  }

  /**
   * Function to add an interaction to the exploration.
   * @param {string} interactionToAdd - The interaction type to add to the Exploration.
   * @param {boolean} skipInteractionCustomization - Whether to skip interaction customization.
   */
  async addInteraction(
    interactionToAdd: string,
    skipInteractionCustomization: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(addInteractionButton);

    // Wait for any loading overlays to detach before clicking.
    await this.expectElementToBeVisible(loadingFullPageOverlaySelector, false);
    await this.clickOnElementWithSelector(addInteractionButton);

    // Check if modal title is correct.
    await this.expectModalTitleToBe('Choose Interaction');

    await this.changeTabInInteractionSelectionModal(
      interactionToAdd as INTERACTION_TYPES
    );

    // Use a higher timeout for math interactions as they are heavy to render.
    let tileText = interactionToAdd;
    // Wait for active tab panel fade transition to complete.
    await this.expectElementToBeVisible('css=.tab-pane.active.show');

    const interactionElement = await this.expectElementToBeVisible(
      `xpath=//*[contains(normalize-space(text()), "${tileText}")]`,
      true,
      this.page,
      90000
    );
    if (!interactionElement) {
      throw new Error(`Interaction "${interactionToAdd}" not found in modal.`);
    }
    await this.clickOnElement(interactionElement);
    if (skipInteractionCustomization) {
      await this.expectCustomizeInteractionTitleToBe(
        `Customize Interaction (${interactionToAdd})`
      );
      await this.expectElementToBeVisible(saveInteractionButton);
      await this.clickOnElementWithSelector(saveInteractionButton);
      await this.expectElementToBeVisible(addInteractionModalSelector, false);
    }
    showMessage(`${interactionToAdd} interaction has been added successfully.`);
  }

  /**
   * Adds the response details in the response modal.
   * @param {string} feedback The feedback to be added in the response modal.
   * @param {string} destination The destination to be added in the response modal.
   * @param {boolean} responseIsCorrect The response is correct or not.
   * @param {boolean} isLastResponse Whether the response is the last response or not.
   */
  async addResponseDetailsInResponseModal(
    feedback: string,
    destination?: string,
    responseIsCorrect?: boolean,
    isLastResponse: boolean = true
  ): Promise<void> {
    await this.clickOnElementWithSelector(feedbackEditorSelector);
    await this.typeInInputField(stateContentInputField, feedback);
    await this.expectTextContentToBe(stateContentInputField, feedback);
    // The '/' value is used to select the 'a new card called' option in the dropdown.
    if (destination) {
      await this.select(destinationCardSelector, '/');
      await this.typeInInputField(addStateInput, destination);
    }
    if (responseIsCorrect) {
      await this.clickOnElementWithSelector(correctAnswerInTheGroupSelector);
    }
    if (isLastResponse) {
      await this.expectElementToBeVisible(addNewResponseButton);
      await this.clickOnElementWithSelector(addNewResponseButton);
      await this.expectElementToBeVisible(
        responseModalHeaderSelector,
        false
      ).catch(async () => {
        await this.clickOnElementWithSelector(addNewResponseButton);
      });
    } else {
      // Capture BEFORE clicking — at this point exactly one modal exists.
      const staleModal = await this.page
        .locator('ngb-modal-window')
        .elementHandle()
        .catch(() => null);
      await this.clickOnElementWithSelector(addAnotherResponseButton);
      if (staleModal) {
        await this.page.waitForFunction(el => !el.isConnected, staleModal);
      }
    }
  }

  /**
   * Function to add responses to the interactions.
   * Currently, it only handles 'Number Input', 'Multiple Choice', 'Number Input', and 'Text Input' interaction types.
   * @param {string} interactionType - The type of the interaction.
   * @param {string} answer - The response to be added.
   * @param {string} feedback - The feedback for the response.
   * @param {string} destination - The destination state for the response.
   * @param {boolean} responseIsCorrect - Whether the response is marked as correct.
   * @param {boolean} isLastResponse - Whether the response is last and more aren't going to be added.
   */
  async addResponsesToTheInteraction(
    interactionType: string,
    answer: string,
    feedback: string,
    destination?: string,
    responseIsCorrect?: boolean,
    isLastResponse: boolean = true
  ): Promise<void> {
    await this.updateAnswersInResponseModal(
      interactionType as INTERACTION_TYPES,
      answer
    );

    await this.addResponseDetailsInResponseModal(
      feedback,
      destination,
      responseIsCorrect,
      isLastResponse
    );
  }

  /**
   * Function to add a solution for a state interaction.
   * @param {string} answer - The solution of the current state card.
   * @param {string} answerExplanation - The explanation for this state card's solution.
   * @param {boolean} isSolutionNumericInput - Whether the solution is for a numeric input interaction.
   */
  async addSolutionToState(
    answer: string,
    answerExplanation: string,
    isSolutionNumericInput: boolean
  ): Promise<void> {
    await this.expectElementToBeVisible(addSolutionButton);
    await this.clickOnElementWithSelector(addSolutionButton);

    const solutionSelector = isSolutionNumericInput
      ? solutionInputNumeric
      : solutionInputTextArea;
    await this.expectElementToBeVisible(solutionSelector);
    await this.typeInInputField(solutionSelector, answer);
    await this.expectElementToBeVisible(
      `${submitAnswerButton}:not([disabled])`
    );
    await this.clickOnElementWithSelector(submitAnswerButton);
    await this.typeInInputField(stateContentInputField, answerExplanation);
    await this.expectElementToBeVisible(
      `${submitSolutionButton}:not([disabled])`
    );
    await this.clickOnElementWithSelector(submitSolutionButton);

    await this.expectElementToBeVisible(submitSolutionButton, false);
  }

  /**
   * Adds a solution explanation to the current state card and saves it.
   * @param {string} explanation - The solution explanation to add to the state card.
   */
  async addSolutionExplanationAndSave(explanation: string): Promise<void> {
    await this.typeInInputField(stateContentInputField, explanation);
    await this.expectElementToBeVisible(
      `${submitSolutionButton}:not([disabled])`
    );
    await this.clickOnElementWithSelector(submitSolutionButton);
    await this.expectElementToBeVisible(submitSolutionButton, false);
  }

  /**
   * Add a text input interaction to the card.
   */
  async addTextInputInteraction(): Promise<void> {
    await this.clickOnElementWithSelector(addInteractionButton);
    await this.clickOnElementWithSelector(textInputInteractionButton);
    await this.clickOnElementWithSelector(saveInteractionButton);
    await this.expectElementToBeVisible(addInteractionModalSelector, false);
    showMessage('Text input interaction has been added successfully.');
  }

  /**
   * Function to add a voiceover for specific content of the current card.
   * @param {string} language - Language for which the voiceover has to be added.
   * @param {string} languageAccent - Language accent for which the voiceover has to be added.
   * @param {string} contentType - Type of the content such as "Interaction" or "Hint"
   * @param {string} voiceoverFilePath - The path of the voiceover file which will be added for the content.
   */
  async addVoiceoverToContent(
    language: string,
    languageAccent: string,
    contentType: string,
    voiceoverFilePath: string
  ): Promise<void> {
    await this.waitForPageToFullyLoad();

    const activeContentType = await this.page.$eval(activeTranslationTab, el =>
      el.textContent?.trim()
    );
    if (!activeContentType?.includes(contentType)) {
      showMessage(
        `Switching content type from ${activeContentType} to ${contentType}`
      );
      await this.clickOnElementWithText(contentType);
    }

    await this.clickOnElementWithSelector(voiceoverLanguageSelector);
    await this.clickOnElementWithSelectorAndText(
      voiceoverLanguageOptionSelector,
      language
    );

    await this.clickOnElementWithSelector(voiceoverLanguageAccentSelector);
    await this.clickOnElementWithSelectorAndText(
      voiceoverLanguageAccentOptionSelector,
      languageAccent
    );

    await this.clickOnElementWithSelector(addManualVoiceoverButton);
    await this.uploadFile(voiceoverFilePath);
    await this.waitForElementToStabilize(saveUploadedAudioButton);
    await this.clickOnElementWithSelector(saveUploadedAudioButton);
    await this.waitForNetworkIdle();

    await this.expectElementToBeVisible(saveUploadedAudioButton, false);
  }

  /**
   * Changes tab in interaction selection modal.
   * @param {INTERACTION_TYPES} interactionType - Interaction type to change tab.
   */
  async changeTabInInteractionSelectionModal(
    interactionType: INTERACTION_TYPES
  ): Promise<void> {
    const interactionTabs: Record<string, INTERACTION_TYPES[]> = {
      [INTERACTION_TABS.MATHS]: [
        INTERACTION_TYPES.FRACTION_INPUT,
        INTERACTION_TYPES.NUMBER_INPUT,
        INTERACTION_TYPES.SET_INPUT,
        INTERACTION_TYPES.NUMERIC_EXPRESSION,
        INTERACTION_TYPES.ALGEBRAIC_EXPRESSION,
        INTERACTION_TYPES.MATH_EQUATION,
        INTERACTION_TYPES.NUMBER_WITH_UNITS,
        INTERACTION_TYPES.RATIO_EXPRESSION_INPUT,
      ],
    };

    for (const interaction in interactionTabs) {
      if (interactionTabs[interaction].includes(interactionType)) {
        await this.waitForElementToStabilize(
          INTERACTION_TABS_SELECTORS[interaction]
        );
        await this.clickOnElementWithSelector(
          INTERACTION_TABS_SELECTORS[interaction]
        );
        showMessage(`Switched to ${interaction} tab.`);
        break;
      }
    }
  }

  /**
   * Function to navigate to the next card in the preview tab.
   * @param {boolean} skipVerification - Whether to skip verification of the card content.
   */
  async continueToNextCard(skipVerification: boolean = false): Promise<void> {
    try {
      await this.clickOnElementWithSelector(nextCardButton);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Timeout')) {
        await this.clickOnElementWithSelector(nextCardArrowButton);
      } else {
        throw error;
      }
    }

    if (skipVerification) {
      return;
    }
    await this.expectElementToBeVisible(previousCardButton);
  }

  /**
   * Function for creating an exploration with two cards.
   * @param {string} explorationTitle - The title of the exploration.
   * @param {string} category - The category of the exploration.,
   * @param {number} numberOfCards - The number of cards to create.
   * @param {boolean} expectedWelcomeModal - Whether to expect the welcome modal.
   */
  async createAndPublishExplorationWithCards(
    explorationTitle: string,
    category: string = 'Mathematics',
    numberOfCards: number = 2,
    expectedWelcomeModal: boolean = false
  ): Promise<string> {
    await this.navigateToCreatorDashboardPage();
    await this.navigateToExplorationEditorFromCreatorDashboard();
    await this.dismissWelcomeModal(expectedWelcomeModal);

    for (let i = 0; i < numberOfCards - 1; i++) {
      await this.updateCardContent(`Content ${i}`);
      await this.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await this.viewOppiaResponses();
      await this.directLearnersToNewCard(`Card ${i + 1}`);
      await this.saveExplorationDraft();
      await this.navigateToCard(`Card ${i + 1}`);
    }

    await this.updateCardContent(`Content ${numberOfCards - 1}`);
    await this.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await this.saveExplorationDraft();

    const explorationId = await this.publishExplorationWithMetadata(
      explorationTitle,
      `This is ${explorationTitle}\`s goals.`,
      category
    );

    if (explorationId) {
      showMessage('Exploration published successfully');
      return explorationId;
    } else {
      throw new Error('Exploration not published');
    }
  }

  /**
   * Function for creating an exploration with only EndExploration interaction with given title.
   * @param {string} title - The title of the exploration.
   * @param {string} category - The category of the exploration. Defaults to 'Algebra'.
   * @param {boolean} flag - Determines whether to dismiss the welcome modal.
   */
  async createAndPublishAMinimalExplorationWithTitle(
    title: string,
    category: string = 'Algebra',
    flag: boolean = false
  ): Promise<string> {
    await this.navigateToCreatorDashboardPage();
    await this.navigateToExplorationEditorFromCreatorDashboard();
    await this.dismissWelcomeModal(flag);
    await this.createMinimalExploration(
      'Exploration intro text',
      'End Exploration'
    );
    await this.saveExplorationDraft();
    return await this.publishExplorationWithMetadata(
      title,
      'This is Goal here.',
      category
    );
  }

  /**
   * Function to create an exploration with a content and interaction.
   * This is a composite function that can be used when a straightforward, simple exploration setup is required.
   *
   * @param {string} content - content of the exploration
   * @param {string} interaction - the interaction to be added to the exploration
   */
  async createMinimalExploration(
    content: string,
    interaction: string
  ): Promise<void> {
    await this.updateCardContent(content);
    await this.addInteraction(interaction);
    showMessage('A simple exploration is created.');
  }

  /**
   * Customizes the number input interaction.
   * @param {boolean} allowOnlyPositiveInputs Whether to allow only positive inputs.
   */
  async customizeNumberInputInteraction(
    allowOnlyPositiveInputs: boolean = false
  ): Promise<void> {
    await this.expectElementToBeVisible(customizeInteractionBodySelector);
    await this.expectElementToBeVisible(
      `${customizeInteractionBodySelector} input[type="checkbox"]`
    );

    const checked = await this.page.$eval(
      `${customizeInteractionBodySelector} input[type="checkbox"]`,
      el => (el as HTMLInputElement).checked
    );
    if (checked !== allowOnlyPositiveInputs) {
      await this.clickOnElementWithSelector(
        `${customizeInteractionBodySelector} input[type="checkbox"]`
      );
    }

    // Verify that the checkbox is (un)checked.
    await this.page.waitForFunction(
      ({selector, checked}: {selector: string; checked: boolean}) => {
        const element = document.querySelector(selector);
        return (element as HTMLInputElement)?.checked === checked;
      },
      {
        selector: `${customizeInteractionBodySelector} input[type="checkbox"]`,
        checked: allowOnlyPositiveInputs,
      },
      {timeout: 60000}
    );

    // Save the interaction.
    await this.clickOnElementWithSelector(saveInteractionButton);
    await this.expectElementToBeVisible(addInteractionModalSelector, false);
  }

  /**
   * Function to select the card that learners will be directed to from the current card.
   * @param {string} cardName - The name of the card to which learners will be directed.
   */
  async directLearnersToNewCard(cardName: string): Promise<void> {
    await this.expectElementToBeVisible(openOutcomeDestButton);
    await this.clickOnElementWithSelector(openOutcomeDestButton);
    await this.waitForElementToBeClickable(destinationCardSelector);
    // The '/' value is used to select the 'a new card called' option in the dropdown.
    await this.select(destinationCardSelector, '/');
    await this.typeInInputField(addStateInput, cardName);
    await this.clickOnElementWithSelector(saveOutcomeDestButton);
    await this.expectElementToBeVisible(saveOutcomeDestButton, false);
  }

  /**
   * Function to dismiss translation tab welcome modal.
   */
  async dismissTranslationTabWelcomeModal(): Promise<void> {
    await this.expectElementToBeVisible(dismissTranslationWelcomeModalSelector);
    await this.clickOnElementWithSelector(
      dismissTranslationWelcomeModalSelector
    );
    await this.expectElementToBeVisible(
      dismissTranslationWelcomeModalSelector,
      false
    );
    showMessage('Translation tutorial pop-up closed successfully.');
  }

  /**
   * Function to dismiss exploration editor welcome modal.
   * @param {boolean} failIfMissing - Whether to fail if the welcome modal is not found.
   */
  async dismissWelcomeModal(failIfMissing: boolean = true): Promise<void> {
    const explorationEditor = new ExplorationEditorModal(this);
    await explorationEditor.dismissWelcomeModal(failIfMissing);
  }

  // TODO(#22539): This function has a duplicate in exploration-editor.ts.
  // To avoid unexpected behavior, ensure that any modifications here are also
  // made in editDefaultResponseFeedbackInQuestionEditorPage() in question-submitter.ts.
  /**
   * Function to add feedback for default responses of a state interaction.
   * @param {string} defaultResponseFeedback - The feedback for the default responses.
   * @param {string} directToCard - The card to direct to (optional).
   * @param {string} directToCardWhenStuck - The card to direct to when the learner is stuck (optional).
   */
  async editDefaultResponseFeedbackInExplorationEditorPage(
    defaultResponseFeedback: string,
    directToCard?: string,
    directToCardWhenStuck?: string
  ): Promise<void> {
    await this.expectElementToBeVisible(defaultFeedbackTab);
    await this.clickOnElementWithSelector(defaultFeedbackTab);

    if (defaultResponseFeedback) {
      await this.updateDefaultResponseFeedbackInExplorationEditorPage(
        defaultResponseFeedback
      );
    }

    if (directToCard) {
      await this.clickOnElementWithSelector(openOutcomeDestButton);
      await this.select(destinationSelectorDropdown, directToCard);
      await this.clickOnElementWithSelector(saveDestinationButtonSelector);
      await this.expectElementToBeVisible(saveDestinationButtonSelector, false);
    }

    if (directToCardWhenStuck) {
      await this.clickOnElementWithSelector(outcomeDestWhenStuckSelector);
      // The '4: /' value is used to select the 'a new card called' option in the dropdown.
      await this.select(destinationWhenStuckSelectorDropdown, '4: /');
      await this.typeInInputField(
        addDestinationStateWhenStuckInput,
        directToCardWhenStuck
      );
      await this.clickOnElementWithSelector(saveStuckDestinationButtonSelector);
      await this.expectElementToBeVisible(
        saveStuckDestinationButtonSelector,
        false
      );
    }
  }

  /**
   * Function to edit a translation for specific content of the current card.
   * @param {string} language - Language for which the translation has to be added.
   * @param {string} contentType - Type of the content such as "Interaction" or "Hint"
   * @param {string} translation - The translation which will be added for the content.
   * @param {number} feedbackIndex - The index of the feedback to edit, since multiple feedback responses exist.
   */
  async editTranslationOfContent(
    language: string,
    contentType: string,
    translation: string,
    feedbackIndex?: number
  ): Promise<void> {
    await this.expectElementToBeVisible(voiceoverLanguageSelector);
    await this.clickOnElementWithSelector(voiceoverLanguageSelector);

    await this.expectElementToBeVisible(voiceoverLanguageOptionSelector);
    await this.clickOnElementWithSelectorAndText(
      voiceoverLanguageOptionSelector,
      language
    );

    await this.expectElementToBeVisible(translationModeButton);
    await this.clickOnElementWithSelector(translationModeButton);
    const activeContentType = await this.page.$eval(activeTranslationTab, el =>
      el.textContent?.trim()
    );
    if (!activeContentType?.includes(contentType)) {
      showMessage(
        `Switching content type from ${activeContentType} to ${contentType}`
      );
      await this.clickOnElementWithText(contentType);
    }
    await this.clickOnElementWithSelector(editTranslationSelector);
    switch (contentType) {
      case 'Content':
      case 'Hint':
      case 'Solution':
        await this.clickOnElementWithSelector(stateContentInputField);
        await this.typeInInputField(stateContentInputField, translation);
        break;
      case 'Interaction':
        await this.clickOnElementWithSelector(stateTranslationEditorSelector);
        await this.typeInInputField(
          stateTranslationEditorSelector,
          translation
        );
        break;
      case 'Feedback':
        await this.clickOnElementWithSelector(
          `.e2e-test-feedback-${feedbackIndex}`
        );
        await this.clickOnElementWithSelector(editTranslationSelector);
        await this.clickOnElementWithSelector(stateContentInputField);
        await this.typeInInputField(stateContentInputField, translation);
        break;
      default:
        throw new Error(`Invalid content type: ${contentType}`);
    }
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await this.clickOnElementWithSelector(saveTranslationButton, {force: true});

    await this.waitForNetworkIdle();
    await this.expectElementToBeVisible(saveTranslationButton, false);
  }

  /**
   * Expands the specified settings tab section.
   * Supports Basic Settings, Advanced Features, Roles, Voice Artists,
   * Permissions, Feedback, and Controls sections.
   * Note: Roles and Voice Artists sections are only available for exploration creators.
   * @param {string} section - The name of the section to expand.
   */
  async expandSettingsTabSection(
    section:
      | 'Basic Settings'
      | 'Advanced Features'
      | 'Roles'
      | 'Voice Artists'
      | 'Permissions'
      | 'Feedback'
      | 'Controls'
  ): Promise<void> {
    if (!this.isViewportAtMobileWidth()) {
      showMessage(
        `Skipped: Expanding ${section} section on desktop.\n` +
          'Reason: Sections are already expanded on desktop.'
      );
      return;
    }

    // Generate the selectors for the section header and content.
    const identifier = section.replace(' ', '-').toLowerCase();
    const sectionContentSelector = `.e2e-test-${identifier}-content`;
    const sectionHeaderSelector = `.e2e-test-${identifier}-header`;

    // Check if the section header exists (some sections like Roles and Voice Artists
    // are only available for exploration creators).
    const sectionHeaderExists = await this.page.$(sectionHeaderSelector);
    if (!sectionHeaderExists) {
      showMessage(
        `Skipped: Expanding ${section} section.\n` +
          'Reason: Section is not available (only available for exploration creators).'
      );
      return;
    }

    // Skip if the section is already expanded.
    if (await this.isElementVisible(sectionContentSelector)) {
      showMessage(
        `Skipped: Expanding ${section} section on desktop.\n` +
          'Reason: Section is already expanded on desktop.'
      );
      return;
    }

    // Expand the section.
    await this.expectElementToBeVisible(sectionHeaderSelector);
    await this.clickOnElementWithSelector(sectionHeaderSelector);
    await this.expectElementToBeVisible(sectionContentSelector);
  }

  /**
   * Verifies that the customize interaction header is visible and contains the expected title.
   * @param {string} title The expected title of the customize interaction header.
   */
  async expectCustomizeInteractionTitleToBe(title: string): Promise<void> {
    await this.expectElementToBeVisible(customizeInteractionHeaderSelector);

    await this.expectTextContentToBe(customizeInteractionHeaderSelector, title);
  }

  /**
   * Verifies that the modal title is as expected.
   * @param {string} expectedTitle - The expected title.
   */
  async expectModalTitleToBe(expectedTitle: string): Promise<void> {
    await this.expectElementToBeVisible(commonModalTitleSelector);
    await this.expectTextContentToContain(
      commonModalTitleSelector,
      expectedTitle
    );
  }

  /**
   * Verifies that the selected language matches the expected language.
   * @param {string} expectedLanguage - The expected language to verify against the selected language.
   */
  async expectSelectedLanguageToBe(expectedLanguage: string): Promise<void> {
    await this.expectElementToBeVisible(languageDropdownValueSelector);

    const selectedLanguage = await this.getTextContent(
      languageDropdownValueSelector
    );

    if (selectedLanguage.includes(expectedLanguage)) {
      showMessage(
        `The language ${selectedLanguage} contains the expected language.`
      );
    } else {
      throw new Error(
        `Expected language: ${expectedLanguage}, but found: "${selectedLanguage}".`
      );
    }
  }

  /**
   * Function to Get the type of an input field in the DOM.
   * @param {string} selector - The CSS selector for the input field.
   */
  async getInputType(selector: string): Promise<string> {
    const inputField = await this.expectElementToBeVisible(selector);
    if (!inputField) {
      throw new Error(`Input field not found for selector: ${selector}`);
    }
    const inputType = (await (
      await inputField.getProperty('type')
    ).jsonValue()) as string;
    return inputType;
  }

  /**
   * Function to navigate to a specific card in the exploration.
   * @param {string} cardName - The name of the card to navigate to.
   * @param {boolean} retry - Whether to retry navigation if it fails (default: true).
   */
  async navigateToCard(cardName: string, retry: boolean = true): Promise<void> {
    let elements;
    if (this.isViewportAtMobileWidth()) {
      // Check if the state graph modal is already open before clicking the
      // resize button.
      const stateGraphModalIsOpen = await this.page.$(
        explorationStateGraphModalSelector
      );
      if (!stateGraphModalIsOpen) {
        // Wait for any blocking modal to close first before clicking the
        // resize button.
        const blockingModal = await this.page.$('div.modal-content');
        if (blockingModal) {
          await this.expectElementToBeVisible('div.modal-content', false);
        }
        await this.expectElementToBeVisible(mobileStateGraphResizeButton);
        await this.clickOnElementWithSelector(mobileStateGraphResizeButton);
      }
    }

    // Get all state node groups (not just labels) since we need to click the
    // background rect which has the click handler.
    const stateNodeGroupSelector = '.e2e-test-node';
    const scopedStateNodeGroupSelector = this.isViewportAtMobileWidth()
      ? `${explorationStateGraphModalSelector} ${stateNodeGroupSelector}`
      : stateNodeGroupSelector;
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(explorationStateGraphModalSelector);
    }
    await this.expectElementToBeVisible(scopedStateNodeGroupSelector);
    elements = await this.page.$$(scopedStateNodeGroupSelector);

    const cardNames = await Promise.all(
      elements.map(element =>
        element.$eval(
          '.e2e-test-node-label',
          node => node.textContent?.trim() || ''
        )
      )
    );
    const cardIndex = cardNames.indexOf(cardName);

    if (cardIndex === -1) {
      throw new Error(`Card name ${cardName} not found in the graph.`);
    }

    const nodeGroup: ElementHandle<Element> | null = elements[cardIndex];
    if (!nodeGroup) {
      throw new Error(`Could not find card button for card: ${cardName}`);
    }

    // Click on the node background rect which has the click handler.
    const nodeBackground = await this.getElementInParent(
      '.e2e-test-node-background',
      nodeGroup
    );
    if (!nodeBackground) {
      throw new Error(
        `Could not find clickable background for card: ${cardName}`
      );
    }
    await nodeBackground.evaluate(el =>
      el.scrollIntoView({block: 'center', inline: 'center'})
    );
    await this.clickOnElement(nodeBackground);

    const headingName = !cardName.trimEnd().endsWith('...')
      ? cardName
      : cardName.trimEnd().slice(0, -3);
    try {
      await this.page.waitForFunction(
        ({selector, value}: {selector: string; value: string}) => {
          const element = document.querySelector(selector);
          return element?.textContent?.includes(value);
        },
        {selector: currentCardNameContainerSelector, value: headingName}
      );
    } catch (error) {
      if (retry) {
        showMessage(`Unable to navigate to the card ${cardName}. Retrying...`);
        await this.navigateToCard(cardName, false);
      } else {
        const err = error instanceof Error ? error : new Error(String(error));
        err.message =
          `Unable to navigate to the card ${cardName}.\n` + err.message;
        throw err;
      }
    }
  }

  /**
   * Function to navigate to the editor tab.
   */
  async navigateToEditorTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarOptions);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to save changes appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.clickOnElementWithSelector(mobileOptionsButtonSelector);
      }
      await this.expectElementToBeVisible(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(mobileNavbarDropdown, {
        force: true,
      });
      await this.expectElementToBeVisible(mobileNavbarPane);
      await this.page.locator(mobileMainTabButton).dispatchEvent('click');

      // Close dropdown if it doesn't automatically close.
      const isVisible = await this.isElementVisible(
        navigationDropdownInMobileVisibleSelector
      );
      if (isVisible) {
        // We are using page.click as this button might be overlapped by the
        // dropdown. Thus, it will fail with onClick.
        await this.page.click(dropdownToggleIcon, {force: true});
      }
    } else {
      await this.expectElementToBeVisible(mainTabButton);
      await this.clickOnElementWithSelector(mainTabButton);
    }

    await this.expectElementToBeVisible(mainTabContainerSelector);
    await this.waitForPageToFullyLoad();
  }

  /**
   * Function to navigate to exploration editor from Creator Dashboard.
   */
  async navigateToExplorationEditorFromCreatorDashboard(): Promise<void> {
    await this.expectElementToBeVisible(createExplorationButtonSelector);
    await this.clickOnElementWithSelector(createExplorationButtonSelector);
    await this.page.waitForURL(url => url.href.includes(`${baseUrl}/create/`), {
      timeout: 10000,
    });
  }

  /**
   * Function to navigate to exploration editor.
   */
  async navigateToExplorationEditorPage(): Promise<void> {
    await this.clickAndWaitForNavigation(createExplorationButtonSelector, true);
  }

  /**
   * Open settings tab.(Note->It also opens all the dropdowns present
   * in the setting tab for mobile view port.)
   */
  async navigateToSettingsTab(): Promise<void> {
    // Ensure the editor is fully loaded before attempting to navigate.
    await this.waitForPageToFullyLoad();

    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarDropdown);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to settings tab appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.clickOnElementWithSelector(mobileOptionsButtonSelector);
      }
      // Open the navbar dropdown, then navigate to Settings.
      await this.clickOnElementWithSelector(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(mobileSettingsBarSelector);

      // Open all dropdowns because by default all dropdowns are closed in mobile view.
      // Use expandSettingsTabSection which checks if already expanded.
      await this.expectElementToBeVisible(basicSettingsDropdown);
      await this.expandSettingsTabSection('Basic Settings');
      await this.expandSettingsTabSection('Advanced Features');
      await this.expandSettingsTabSection('Roles');
      await this.expandSettingsTabSection('Voice Artists');
      await this.expandSettingsTabSection('Permissions');
      await this.expandSettingsTabSection('Feedback');
    } else {
      await this.clickOnElementWithSelector(settingsTabSelector);
    }

    await this.expectElementToBeVisible(settingsContainerSelector);
    showMessage('Settings tab is opened successfully.');
  }

  /**
   * Function to navigate to the translations tab.
   */
  async navigateToTranslationsTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarOptions);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to save changes appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.clickOnElementWithSelector(mobileOptionsButtonSelector);
      }
      await this.expectElementToBeVisible(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(mobileNavbarDropdown);
      await this.expectElementToBeVisible(mobileNavbarPane);
      await this.clickAndWaitForNavigation(mobileTranslationTabButton, true);

      // Close dropdown if it doesn't automatically close.
      const isVisible = await this.isElementVisible(
        navigationDropdownInMobileVisibleSelector
      );
      if (isVisible) {
        // We are using page.click as this button might be overlapped by the
        // dropdown. Thus, it will fail with onClick.
        await this.clickOnElementWithSelector(dropdownToggleIcon);
      }
    } else {
      await this.expectElementToBeVisible(translationTabButton);
      await this.clickAndWaitForNavigation(translationTabButton, true);
    }

    await this.expectElementToBeVisible(translationTabContainer);
  }

  /**
   * Function to add content to a card.
   * @param {string} content - The content to be added to the card.
   */
  async updateCardContent(content: string): Promise<void> {
    await this.expectElementToBeVisible(stateEditSelector);
    await this.clickOnElementWithSelector(stateEditSelector);
    await this.clearAllTextFrom(stateContentInputField);
    await this.typeInInputField(stateContentInputField, `${content}`);
    await this.clickOnElementWithSelector(saveContentButton);
    await this.expectElementToBeVisible(stateContentInputField, false);
    await this.expectTextContentToContain(stateContentSelector, content);
    showMessage('Card content is updated successfully.');
  }

  /**
   * Function to save an exploration draft.
   * @param {string} commitMessage - The commit message text to be saved.
   */
  async saveExplorationDraft(
    commitMessage: string = 'Testing Testing'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarOptions);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to save changes appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.expectElementToBeVisible(mobileOptionsButtonSelector);
        await this.clickOnElementWithSelector(mobileOptionsButtonSelector);
      }

      await this.expectElementToBeVisible(
        `${mobileSaveChangesButtonSelector}:not([disabled])`
      );
      await this.clickOnElementWithSelector(mobileSaveChangesButtonSelector, {
        force: true,
      });
    } else {
      await this.expectElementToBeVisible(saveChangesButton);
      await this.clickOnElementWithSelector(saveChangesButton);
    }
    // We skip the commit message if it's an empty string.
    if (commitMessage) {
      await this.clickOnElementWithSelector(commitMessageSelector);
      await this.typeInInputField(commitMessageSelector, commitMessage);
    }
    await this.clickOnElementWithSelector(saveDraftButton);
    await this.expectElementToBeVisible(saveDraftButton, false);

    // Toast message confirms that the draft has been saved.
    await this.expectElementToBeVisible(toastMessage);
    await this.expectElementToBeVisible(toastMessage, false);
    showMessage('Exploration is saved successfully.');
    await this.waitForPageToFullyLoad();
  }

  /**
   * Select language in language selection dropdown.
   * @param {string} language - The language to select.
   */
  async selectLanguage(language: string): Promise<void> {
    await this.clickOnElementWithSelector(languageUpdateDropdown);
    await this.clickOnElementWithText(language);
    await this.waitForNetworkIdle();

    await this.expectSelectedLanguageToBe(language);
    showMessage(`Language has been set to ${language}.`);
  }

  /**
   * Sets a state as a checkpoint in the exploration.
   */
  async setTheStateAsCheckpoint(): Promise<void> {
    await this.expectElementToBeVisible(setAsCheckpointButton);

    let checkboxState = await this.page.$eval(
      `${setAsCheckpointButton} input.mat-checkbox-input`,
      el => (el as HTMLInputElement).checked
    );

    if (!checkboxState) {
      await this.clickOnElementWithSelector(setAsCheckpointButton);
    }

    // Check checkbox value again and throw error if it's still not checked.
    checkboxState = await this.page.$eval(
      `${setAsCheckpointButton} input.mat-checkbox-input`,
      el => (el as HTMLInputElement).checked
    );

    if (!checkboxState) {
      throw new Error('Failed to set the state as a checkpoint.');
    }
  }

  /**
   * Function to publish exploration.
   * This is a composite function that can be used when a straightforward, simple exploration published is required.
   * @param {string} title - The title of the exploration.
   * @param {string} goal - The goal of the exploration.
   * @param {string} category - The category of the exploration.,
   * @param {string} tags - The tags of the exploration.
   */
  async publishExplorationWithMetadata(
    title: string,
    goal: string,
    category: string,
    tags?: string
  ): Promise<string> {
    const publishExploration = async () => {
      if (this.isViewportAtMobileWidth()) {
        await this.waitForPageToFullyLoad();
        await this.expectElementToBeVisible(mobileNavbarDropdown);
        const element = await this.page.$(mobileNavbarOptions);
        // If the element is not present, it means the mobile navigation bar is not expanded.
        // The option to save changes appears only in the mobile view after clicking on the mobile options button,
        // which expands the mobile navigation bar.
        if (!element) {
          await this.clickOnElementWithSelector(mobileOptionsButtonSelector);
        }
        await this.clickOnElementWithSelector(mobileChangesDropdownSelector);
        await this.clickOnElementWithSelector(mobilePublishButtonSelector);
      } else {
        await this.expectElementToBeVisible(publishExplorationButtonSelector);
        await this.clickOnElementWithSelector(publishExplorationButtonSelector);
      }
    };

    const fillExplorationMetadataDetails = async () => {
      await this.clickOnElementWithSelector(explorationTitleInput);
      await this.typeInInputField(explorationTitleInput, title);
      await this.clickOnElementWithSelector(explorationGoalInput);
      await this.typeInInputField(explorationGoalInput, goal);
      await this.clickOnElementWithSelector(explorationCategoryDropdown);
      await this.clickOnElementWithText(category);
      if (tags) {
        await this.typeInInputField(tagsField, tags);
      }
    };

    const confirmPublish = async (): Promise<string> => {
      await this.clickOnElementWithSelector(saveExplorationChangesButton);
      await this.waitForPageToFullyLoad();
      await this.expectElementToBeVisible(explorationConfirmPublishButton);
      await this.clickOnElementWithSelector(explorationConfirmPublishButton);
      const success = await this.expectElementToBeVisible(explorationIdElement)
        .then(() => true)
        .catch(() => false);
      if (!success) {
        await this.reloadPage();
        await this.expectElementToBeVisible(explorationIdElement);
      }
      await this.expectElementToBeVisible(explorationIdElement);
      const explorationIdUrl = await this.page.$eval(
        explorationIdElement,
        element => (element as HTMLElement).innerText
      );
      const explorationId = explorationIdUrl.replace(/^.*\/explore\//, '');
      await this.waitForElementToStabilize(closePublishedPopUpButton);
      await this.clickOnElementWithSelector(closePublishedPopUpButton);
      await this.expectElementToBeVisible(closePublishedPopUpButton, false);

      if (!explorationId) {
        throw new Error('Failed to get exploration ID.');
      }
      return explorationId;
    };

    await publishExploration();
    await fillExplorationMetadataDetails();

    try {
      return await confirmPublish();
    } catch (error) {
      showMessage(
        'Failed to publish the exploration.\n' +
          (error instanceof Error ? error.stack : String(error))
      );

      const errorSavingExplorationElement = await this.page.$(
        errorSavingExplorationModal
      );
      if (errorSavingExplorationElement) {
        await this.clickOnElementWithSelector(errorSavingExplorationModal);
        await this.waitForNetworkIdle();
      }
      await publishExploration();
      return await confirmPublish();
    }
  }

  /**
   * This function updates the answers in the response modal.
   * @param {INTERACTION_TYPES} interactionType - The type of the interaction.
   * @param {string} answer - The answer to set in the response modal.
   */
  async updateAnswersInResponseModal(
    interactionType: INTERACTION_TYPES,
    answer: string
  ): Promise<void> {
    switch (interactionType) {
      case INTERACTION_TYPES.NUMBER_INPUT:
        await this.waitForElementToStabilize(
          `${responseModalBodySelector} ${floatFormInput}`
        );
        await this.typeInInputField(
          `${responseModalBodySelector} ${floatFormInput}`,
          answer
        );
        break;
      case INTERACTION_TYPES.MULTIPLE_CHOICE:
        await this.expectElementToBeVisible(multipleChoiceResponseDropdown);
        await this.clickOnElementWithSelector(multipleChoiceResponseDropdown);
        await this.clickOnElementWithSelectorAndText(
          multipleChoiceResponseOption,
          answer
        );
        break;
      case INTERACTION_TYPES.TEXT_INPUT:
        await this.expectElementToBeVisible(responseModalBodySelector);
        await this.clickOnElementWithSelector(addResponseOptionButton);
        await this.expectElementToBeVisible(textInputInteractionOption);
        await this.typeInInputField(textInputInteractionOption, answer);
        break;
      case INTERACTION_TYPES.FRACTION_INPUT:
        await this.expectElementToBeVisible(intEditorField);
        await this.clearAllTextFrom(intEditorField);
        await this.typeInInputField(intEditorField, answer);
        break;
      // Add cases for other interaction types here
      // case 'otherInteractionType':
      //   await this.type(otherFormInput, answer);
      //   break;
      default:
        throw new Error(`Unsupported interaction type: ${interactionType}`);
    }
  }

  /**
   * Function to update the default response feedback for a state interaction.
   * @param {string} defaultResponseFeedback - The feedback for the default responses.
   */
  async updateDefaultResponseFeedbackInExplorationEditorPage(
    defaultResponseFeedback: string
  ): Promise<void> {
    await this.expectElementToBeVisible(openOutcomeFeedBackEditor);
    await this.clickOnElementWithSelector(openOutcomeFeedBackEditor);
    await this.clickOnElementWithSelector(stateContentInputField);
    await this.typeInInputField(
      stateContentInputField,
      defaultResponseFeedback
    );
    await this.clickOnElementWithSelector(saveOutcomeFeedbackButton);

    await this.expectElementToBeVisible(saveOutcomeDestButton, false);
  }

  /**
   * Function to display the Oppia responses section.
   */
  async viewOppiaResponses(): Promise<void> {
    await this.expectElementToBeVisible(stateResponsesSelector);
    await this.clickOnElementWithSelector(stateResponsesSelector);
    await this.expectElementToBeVisible(oppiaFeebackEditorContainerSelector);
  }

  /**
   * Function to navigate to the history tab.
   */
  async navigateToHistoryTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(mobileNavbarDropdown);
      await this.expectElementToBeVisible(mobileHistoryTabButton);
      await this.clickOnElementWithSelector(mobileHistoryTabButton);
    } else {
      await this.clickOnElementWithSelector(historyTabButton);
    }
    await this.expectElementToBeVisible(historyTabContentContainerSelector);
  }

  /**
   * Function to download a specific version of an Exploration.
   * Uses Playwright's download event to reliably capture the file,
   * regardless of the download directory configuration.
   * @param {number} explorationVersion - The version of the exploration to download.
   * @param {boolean} isExplorationPublished - Whether the exploration is published.
   */
  async downloadExploration(
    explorationVersion: number,
    isExplorationPublished: boolean,
    explorationTitle?: string
  ): Promise<void> {
    await this.expectElementToBeVisible(historyListContent);
    const historyItems = await this.page.$$(historyListContent);

    for (const historyItem of historyItems) {
      const versionNumberElement = await this.getElementInParent(
        historyTableIndex,
        historyItem
      );
      const versionText = await this.getTextContent(versionNumberElement);
      if (parseInt(versionText ?? '', 10) !== explorationVersion) {
        continue;
      }

      const dropdownButton = await this.getElementInParent(
        historyListOptions,
        historyItem
      );
      await this.clickOnElement(dropdownButton);

      const downloadButton = await this.getElementInParent(
        downloadExplorationButton,
        historyItem
      );

      // Use Playwright's download event to reliably capture the file.
      const downloadPromise = this.page.waitForEvent('download');
      await this.clickOnElement(downloadButton);
      const download = await downloadPromise;

      const suggestedFilename = download.suggestedFilename();
      const expectedPrefix = isExplorationPublished
        ? `oppia-${explorationTitle?.replace(/\s+/g, '')}-v`
        : 'oppia-unpublished_exploration-v';
      if (!suggestedFilename.startsWith(expectedPrefix)) {
        throw new Error(
          `Expected filename to start with "${expectedPrefix}" ` +
            `but got "${suggestedFilename}".`
        );
      }
      const downloadDir = testConstants.TEST_DOWNLOAD_DIR;

      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, {recursive: true});
      }

      const savePath = path.join(downloadDir, suggestedFilename);
      await download.saveAs(savePath);

      // Close the dropdown to prevent it from blocking other elements.
      await this.page.keyboard.press('Escape');

      showMessage(`${suggestedFilename} file is successfully downloaded`);
      return;
    }

    throw new Error(`Version ${explorationVersion} not found in history list.`);
  }
}

export const ExplorationEditorFactory = (page: Page): ExplorationEditor => {
  return new ExplorationEditor(page);
};
