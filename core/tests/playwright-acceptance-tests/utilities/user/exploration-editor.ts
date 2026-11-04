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

import {Page, ElementHandle, expect, errors} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';
import {ExplorationEditorUtils} from '../common/exploration-editor-utils';
import {RTEEditor} from '../common/rte-editor';
import * as fs from 'fs';
import * as path from 'path';
import {StateEditorUtils} from '../common/state-editor-utils';

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
const ruleEditorInResponseModalSeclector = 'oppia-rule-editor';
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

const mobileNavbarPane = '.oppia-exploration-editor-tabs-dropdown';
const mobileTranslationTabButton = '.e2e-test-mobile-translation-tab';
const mainTabButton = '.e2e-test-main-tab';
const mobileMainTabButton = '.e2e-test-mobile-main-tab';
const mainTabContainerSelector = '.e2e-test-exploration-main-tab';

const previewTabButton = '.e2e-test-preview-tab';
const mobilePreviewTabButton = '.e2e-test-mobile-preview-button';
const previewTabContainer = '.e2e-test-preview-tab-container';

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

const addSkillReviewComponentButton = '.cke_button__oppiaskillreview';

const skillReviewComponent = 'oppia-noninteractive-skillreview';
const skillReviewConceptCardLink = `${skillReviewComponent} .e2e-test-concept-card-link`;
const skillReviewComponentModal =
  'oppia-noninteractive-skillreview-concept-card-modal';

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

const totalPlaysCardSelector = '.total-plays';
const openFeedbackCardSelector = '.total-open-feedback';
const subscriberCountLabel = '.e2e-test-oppia-total-subscribers';
const explorationSummaryTileTitleSelector = '.e2e-test-exp-summary-tile-title';
const explorationDashboardCardSelector = '.e2e-test-exploration-dashboard-card';
const averageRatingsCardSelector = '.average-ratings';
const usersCountInRatingSelector = '.e2e-test-oppia-total-users';

// Common Selectors.
const commonModalTitleSelector = '.e2e-test-modal-header';

const saveRecommendationModalSelector = '.e2e-test-save-prompt-modal';
const saveRecommendationModalSaveButtonSelector =
  'button.e2e-test-recommendation-prompt-save-button';
const previewTabContainer = '.e2e-test-preview-tab-container';
const nextCardArrowButton = '.e2e-test-next-button';
const removeInteractionButttonSelector = '.e2e-test-delete-interaction';
const selfLoopWarningSelector = '.e2e-test-response-self-loop-warning';
const previewTabButton = '.e2e-test-preview-tab';
const nodeWarningSignSelector = '.e2e-test-node-warning-sign';
const stateNameInputSelector = '.e2e-test-state-name-input';
const creatorDashboardMenuLink = '.e2e-test-creator-dashboard-link';
const stateNameSubmitButtonSelector = 'button.e2e-test-state-name-submit';
const currentOutcomeDestinationSelector = '.e2e-test-current-outcome-dest';
const cardHeightLimitWarningSelector = '.e2e-test-card-height-limit-warning';
const outcomeFeedbackSelector = '.e2e-test-edit-outcome-feedback-button';
const textAreaInputSelector = 'textarea.e2e-test-description-box';
const selectedInteractionNameSelector = '.e2e-test-selected-interaction-name';
const stateConversationContent = '.e2e-test-conversation-content';
const interactionPreviewSelector = '.e2e-test-interaction';
const previewRestartButton = '.e2e-test-preview-restart-button';
const destinationSelectorDropdown = '.e2e-test-destination-selector-dropdown';
const commonModalBodySelector = '.e2e-test-modal-body';
const mobilePreviewTabButton = '.e2e-test-mobile-preview-button';
const goalWarningSelector = '.e2e-test-exploration-objective-warning';
const closeModalButtonSelector = '.e2e-test-modal-close-button';
const stateNodeSelector = '.e2e-test-node-label';
const stateNodeGroupSelector = '.e2e-test-node';
const contentBoxSelector =
  '.e2e-test-state-editor .e2e-test-state-content-display';
const profileDropdown = '.e2e-test-profile-dropdown';
const nextCardButtonSelector = '.e2e-test-next-card-button';
const multipleChoiceOptionSelector = '.e2e-test-multiple-choice-option';
const formErrorContainer = '.e2e-test-form-error-container';
const nextCardButton = '.e2e-test-next-card-button';
const previousCardButton = '.e2e-test-back-button';

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

const addTitleBar = 'input#explorationTitle';

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
      `xpath=//*[contains(@class, "modal-body")]//div[contains(@class, "oppia-interaction-tile-name") and normalize-space(text())="${tileText}"]`,
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
    if (destination) {
      // Check if the destination card already exists in the dropdown options.
      const hasExistingCard = await this.page.evaluate(
        ({selector, cardName}: {selector: string; cardName: string}) => {
          const selectElement = document.querySelector(
            selector
          ) as HTMLSelectElement | null;
          if (!selectElement) {
            return false;
          }
          return Array.from(selectElement.options).some(
            option => option.value === cardName
          );
        },
        {selector: destinationCardSelector, cardName: destination}
      );

      if (hasExistingCard) {
        await this.select(destinationCardSelector, destination);
      } else {
        // The '/' value is used to select the 'a new card called' option in the dropdown.
        await this.select(destinationCardSelector, '/');
        await this.typeInInputField(addStateInput, destination);
      }
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
  async continueToNextCardAsExplorationEditor(
    skipVerification: boolean = false
  ): Promise<void> {
    const explorationPlayerUtils = new ExplorationEditorUtils(this);
    await explorationPlayerUtils.continueToNextCard(skipVerification);
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
    const explorationEditor = new ExplorationEditorUtils(this);
    await explorationEditor.dismissWelcomeModal(failIfMissing);
  }

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
    const stateEditorUtils = new StateEditorUtils(this);
    await stateEditorUtils.editDefaultResponseFeedback(
      defaultResponseFeedback,
      directToCard,
      directToCardWhenStuck
    );
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
   * Opens the exploration state graph modal in mobile view.
   */
  async openExplorationStateGraphInMobileView(): Promise<void> {
    const stateGraphModalIsOpen = await this.page.$(
      explorationStateGraphModalSelector
    );
    if (!stateGraphModalIsOpen) {
      const blockingModal = await this.page.$('div.modal-content');
      if (blockingModal) {
        await this.expectElementToBeVisible('div.modal-content', false);
      }
      await this.expectElementToBeVisible(mobileStateGraphResizeButton);
      await this.clickOnElementWithSelector(mobileStateGraphResizeButton);
      await this.expectElementToBeVisible(explorationStateGraphModalSelector);
    }
  }

  /**
   * Function to navigate to a specific card in the exploration.
   * @param {string} cardName - The name of the card to navigate to.
   * @param {boolean} retry - Whether to retry navigation if it fails (default: true).
   */
  async navigateToCard(cardName: string, retry: boolean = true): Promise<void> {
    let elements;
    if (this.isViewportAtMobileWidth()) {
      await this.openExplorationStateGraphInMobileView();
    }

    // Get all state node groups (not just labels) since we need to click the
    // background rect which has the click handler.
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

    const truncatedCardName = this.truncateCardName(cardName);
    let cardIndex = cardNames.indexOf(cardName);

    if (cardIndex === -1) {
      cardIndex = cardNames.indexOf(truncatedCardName);
    }

    if (cardIndex === -1) {
      cardIndex = cardNames.findIndex(
        name =>
          name === cardName ||
          name === truncatedCardName ||
          name.startsWith(truncatedCardName.replace(/\.+$/, '')) ||
          cardName.startsWith(name.replace(/\.+$/, ''))
      );
    }

    if (cardIndex === -1) {
      if (retry) {
        showMessage(`Unable to find card ${cardName} in graph. Retrying...`);
        await this.page.waitForTimeout(1000);
        return await this.navigateToCard(cardName, false);
      }
      throw new Error(
        `Card name ${cardName} not found in the graph. Found cards: ${cardNames.join(', ')}`
      );
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

    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(explorationStateGraphModalSelector, {
        state: 'hidden',
      });
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
   * Function to navigate to the exploration preview tab.
   */
  async navigateToExplorationEditorPreviewTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(mobileNavbarDropdown);
      await this.expectElementToBeVisible(mobileNavbarPane);
      await this.clickOnElementWithSelector(mobilePreviewTabButton);
    } else {
      await this.expectElementToBeVisible(previewTabButton);
      await this.clickOnElementWithSelector(previewTabButton);
    }

    await this.expectElementToBeVisible(previewTabContainer);
  }

  /**
   * Function to open the skill review component.
   */
  async clickOnSkillReviewComponent(): Promise<void> {
    await this.clickOnElementWithSelector(skillReviewConceptCardLink);
    await this.expectElementToBeVisible(skillReviewComponentModal);
  }

  /**
   * Function to verify that the concept card with worked example is displayed.
   * @param {string} question - Expected worked example question.
   * @param {string} answer - Expected worked example answer.
   */
  async checkConceptCardWithWorkedExampleIsInserted(
    question: string,
    answer: string
  ): Promise<void> {
    await this.expectTextContentToContain('body', question);
    await this.expectTextContentToContain('body', answer);
  }

  /**
   * Function to navigate to exploration editor from Creator Dashboard.
   */
  async navigateToExplorationEditorFromCreatorDashboard(): Promise<void> {
    await this.expectElementToBeVisible(createExplorationButtonSelector);
    await this.clickOnElementWithSelector(createExplorationButtonSelector);
    await this.page.waitForURL(url => url.href.includes(`${baseUrl}/create/`), {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
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
    // TODO(#23019): Uncomment this line once the issue is resolved.
    // await this.expectTextContentToContain(stateContentSelector, content);
    showMessage('Card content is updated successfully.');
  }

  /**
   * Function to update a card with content and insert a concept card.
   * @param {string} content - The content to be added to the card.
   */
  async updateCardContentWithConceptCard(content: string): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.expectElementToBeVisible(stateEditSelector);
    await this.clickOnElementWithSelector(stateEditSelector);

    await this.typeInInputField(stateContentInputField, `${content}`);

    // Add the concept card.
    await this.clickOnElementWithSelector(addSkillReviewComponentButton);
    await this.clickOnElementWithSelector(skillItemInRTESelector);
    await this.clickOnElementWithSelector(closeButtonForExtraModel);

    await this.clickOnElementWithSelector(saveContentButton);
    await this.expectElementToBeVisible(stateContentInputField, false);

    showMessage('Card content is updated successfully with concept card.');
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

  /**
   * Function to create and save a new untitled exploration containing
   * only the EndExploration interaction.
   */
  async createAndSaveAMinimalExploration(): Promise<void> {
    await this.navigateToCreatorDashboardPage();
    await this.navigateToExplorationEditorFromCreatorDashboard();
    await this.createMinimalExploration(
      'Exploration intro text',
      'End Exploration'
    );
    await this.saveExplorationDraft();
  }

  /**
   * Function to check the expected total number of plays.
   * @param {number} number - The expected total play count.
   */
  async expectTotalPlaysToBe(number: number): Promise<void> {
    await this.expectElementToBeVisible(totalPlaysCardSelector);
    const totalPlaysElements = await this.page.$$(
      `${totalPlaysCardSelector} .stat-value-with-rating, ` +
        `${totalPlaysCardSelector} .stat-value-without-rating`
    );
    let numberOfTotalPlays = 0;
    for (const el of totalPlaysElements) {
      const rect = await el.boundingBox();
      if (!rect || rect.width === 0 || rect.height === 0) {
        continue;
      }
      const text = await el.evaluate(
        element => (element as HTMLElement).innerText.trim() || '0'
      );
      numberOfTotalPlays = parseInt(text, 10) || 0;
      break;
    }
    if (numberOfTotalPlays !== number) {
      throw new Error(
        `Expected total plays count to be ${number}, but found ${numberOfTotalPlays}.`
      );
    }
  }

  /**
   * Function to check the expected number of open feedback entries.
   * @param {number} number - The expected count of open feedback entries.
   */
  async expectOpenFeedbacksToBe(number: number): Promise<void> {
    await this.expectElementToBeVisible(openFeedbackCardSelector);
    const numberOfOpenFeedbacks = await this.page.$eval(
      openFeedbackCardSelector,
      card => {
        const statValue = Array.from(
          (card as HTMLElement).querySelectorAll(
            '.stat-value-with-rating, .stat-value-without-rating'
          )
        ).find(element => {
          const htmlElement = element as HTMLElement;
          const style = window.getComputedStyle(htmlElement);
          const rect = htmlElement.getBoundingClientRect();
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            rect.width > 0 &&
            rect.height > 0
          );
        }) as HTMLElement | undefined;
        return parseInt(statValue?.innerText.trim() || '0', 10);
      }
    );
    if (numberOfOpenFeedbacks !== number) {
      throw new Error(
        `Expected open feedback count to be ${number}, but found ${numberOfOpenFeedbacks}.`
      );
    }
  }

  /**
   * Function to check the number of subscribers in the creator dashboard.
   * @param {number} subscriberCount - The expected number of subscribers.
   */
  async expectNumberOfSubscribersToBe(subscriberCount: number): Promise<void> {
    await this.expectElementToBeVisible(subscriberCountLabel);
    const currentSubscriberCount = await this.page.$eval(
      subscriberCountLabel,
      element => element.textContent?.trim() || '0'
    );
    if (parseInt(currentSubscriberCount, 10) === subscriberCount) {
      showMessage(`Number of subscribers is equal to ${subscriberCount}.`);
    } else {
      throw new Error(
        `Expected ${subscriberCount} subscribers, but found ${currentSubscriberCount}.`
      );
    }
  }

  /**
   * Function to check the expected total number of explorations.
   * @param {number} number - The expected count of total explorations.
   */
  async expectNumberOfExplorationsToBe(number: number): Promise<void> {
    await this.expectElementToBeVisible(explorationSummaryTileTitleSelector);
    const titlesOnPage = await this.page.$$eval(
      explorationSummaryTileTitleSelector,
      elements => elements.map(el => el.textContent?.trim() || '')
    );
    if (titlesOnPage.length !== number) {
      throw new Error(
        `Expected ${number} explorations, but found ${titlesOnPage.length} instead.`
      );
    }
  }

  /**
   * Function to check the presence and expected number of occurrences
   * of an exploration.
   * @param {string} explorationName - The name of the exploration.
   * @param {number} numberOfOccurrence - The expected occurrence count.
   */
  async expectExplorationNameToAppearNTimes(
    explorationName: string,
    numberOfOccurrence: number = 1
  ): Promise<void> {
    await this.expectElementToBeVisible(explorationSummaryTileTitleSelector);
    const titlesOnPage = await this.page.$$eval(
      explorationSummaryTileTitleSelector,
      elements => elements.map(el => el.textContent?.trim() || '')
    );
    const count = titlesOnPage.filter(
      title => title === explorationName
    ).length;
    if (numberOfOccurrence === 1 && count !== numberOfOccurrence) {
      throw new Error(`Exploration "${explorationName}" not found.`);
    } else if (count !== numberOfOccurrence) {
      throw new Error(
        `Exploration "${explorationName}" found ${count} times, ` +
          `but expected ${numberOfOccurrence} times.`
      );
    }
  }

  /**
   * Function to verify the average rating and the number of users who
   * submitted ratings.
   * @param {number | string} expectedRating - The expected average rating.
   * @param {number} expectedUsers - The expected count of users who submitted
   *   ratings.
   */
  async expectAverageRatingAndUsersToBe(
    expectedRating: number | string,
    expectedUsers: number
  ): Promise<void> {
    await this.expectElementToBeVisible(averageRatingsCardSelector);
    const ratingElements = await this.page.$$(
      `${averageRatingsCardSelector} .stat-value-with-rating, ` +
        `${averageRatingsCardSelector} .stat-value-without-rating`
    );
    let ratingText = '';
    for (const element of ratingElements) {
      const rect = await element.boundingBox();
      if (!rect || rect.width === 0 || rect.height === 0) {
        continue;
      }
      ratingText = await element.evaluate(
        el => (el as HTMLElement).innerText.trim() || ''
      );
      break;
    }
    // Handle "N/A" case.
    if (expectedRating === 'N/A') {
      if (ratingText !== 'N/A') {
        throw new Error(
          `Expected average rating to be "N/A", but found "${ratingText}".`
        );
      }
    } else {
      const ratingValue = parseFloat(ratingText);
      if (ratingValue !== expectedRating) {
        throw new Error(
          `Expected average rating to be ${expectedRating}, ` +
            `but found ${ratingValue}.`
        );
      }
    }
    const totalUsersText = await this.page.$eval(
      usersCountInRatingSelector,
      el => (el as HTMLElement).innerText.trim() || ''
    );
    // Extract number from text (e.g., "by 3 users" → 3).
    const totalUsersMatch = totalUsersText.match(/\d+/);
    const totalUsers = totalUsersMatch ? parseInt(totalUsersMatch[0], 10) : 0;
    if (totalUsers !== expectedUsers) {
      throw new Error(
        `Expected ${expectedUsers} users to have submitted ratings, ` +
          `but found ${totalUsers} instead.`
      );
    }
  }

  /**
   * Function to verify if the preview is on a particular card by checking the content of the card.
   * @param {string} cardName - The name of the card to check.
   * @param {string} expectedCardContent - The expected text content of the card.
   */
  async expectPreviewCardContentToBe(
    cardName: string,
    expectedCardContent: string,
    matchCase: boolean = true
  ): Promise<void> {
    await this.page.waitForSelector(stateConversationContent, {
      state: 'visible',
    });
    try {
      await this.page.waitForFunction(
        ({
          selector,
          value,
          matchCase,
        }: {
          selector: string;
          value: string;
          matchCase: boolean;
        }) => {
          const el = document.querySelector(selector) as HTMLElement | null;
          if (!el) {
            return false;
          }
          const normalize = (s: string) => s.trim().replace(/\n+/g, '\n');
          return (normalize(el.innerText) === normalize(value)) === matchCase;
        },
        {
          selector: stateConversationContent,
          value: expectedCardContent,
          matchCase,
        }
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new Error(
        `Card content ${matchCase ? 'did not' : 'did'} match expected content.\n` +
          `Original Error: ${err.stack}`
      );
    }
  }

  /**
   * Function to navigate to the next card in the preview tab.
   * @param skipVerification - Whether to skip verification of the card content.
   */
  async continueToNextCard(skipVerification: boolean = false): Promise<void> {
    try {
      await this.page.waitForSelector(nextCardButton, {timeout: 7000});
      await this.clickOnElementWithSelector(nextCardButton);
    } catch (error) {
      if (error instanceof errors.TimeoutError) {
        await this.clickOnElementWithSelector(nextCardArrowButton);
      } else {
        throw error;
      }
    }
    if (skipVerification) {
      return;
    }
    await this.page.waitForSelector(previousCardButton, {
      state: 'visible',
    });
  }

  /**
   * Expects the "Customize Interaction" modal to have closed. Call this
   * after clicking "Save Interaction" to confirm the modal disappears.
   * Uses commonModalTitleSelector which is already defined in this file.
   */
  async expectCustomizeInteractionModalToBeClosed(): Promise<void> {
    await this.page.waitForSelector(commonModalTitleSelector, {
      state: 'hidden',
      timeout: 10000,
    });
  }

  /**
   * Navigates to creator dashboard using profile dropdown.
   */
  async navigateToCreatorDashboardUsingProfileDropdown(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.expectElementToBeVisible(profileDropdown);
    await this.clickOnElementWithSelector(profileDropdown);

    await this.expectElementToBeVisible(creatorDashboardMenuLink);
    await this.clickOnElementWithSelector(creatorDashboardMenuLink);
    await this.expectElementToBeVisible(
      '.e2e-test-creator-dashboard-container'
    );
  }

  /**
   * Function to restart the preview after it has been completed.
   */
  async restartPreview(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      // If the mobile navigation bar is expanded, it can overlap with the restart button,
      // making it unclickable. So, we check for its presence and collapse it.
      const element = await this.page.$(mobileNavbarOptions);
      if (element) {
        await this.clickOnElementWithSelector(mobileOptionsButtonSelector);
      }
    }
    await this.page.waitForSelector(previewRestartButton, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(previewRestartButton);

    await this.waitForNetworkIdle();
    await this.page.waitForSelector(previousCardButton, {
      state: 'hidden',
    });
  }

  /**
   * Checks if the interaction name is as expected.
   * @param name The name of the interaction.
   */
  async expectSelectedInteractionNameToBe(name: string): Promise<void> {
    await this.expectTextContentToBe(
      selectedInteractionNameSelector,
      `Interaction ( ${name} )`
    );
  }

  /**
   * Expects the interaction preview element to be absent from the DOM.
   * Use this immediately after removeInteraction() to confirm the preview
   * has been cleared.
   */
  async expectInteractionPreviewToBeAbsent(): Promise<void> {
    const preview = await this.page.$(interactionPreviewSelector);
    expect(preview).toBeNull();
  }

  private truncateCardName(cardName: string): string {
    const maxNodeLabelLength = 15;
    if (!cardName || cardName.length <= maxNodeLabelLength) {
      return cardName;
    }
    const suffix = '...';
    return cardName.substring(0, maxNodeLabelLength - suffix.length) + suffix;
  }

  /**
   * Verifies that the exploration graph contains the specified card.
   * @param {string} cardName - The name of the card to check.
   */
  async expectExplorationGraphToContainCard(cardName: string): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.openExplorationStateGraphInMobileView();
    }

    const scopedStateNodeGroupSelector = this.isViewportAtMobileWidth()
      ? `${explorationStateGraphModalSelector} ${stateNodeGroupSelector}`
      : stateNodeGroupSelector;
    await this.page.waitForSelector(scopedStateNodeGroupSelector);

    const truncatedCardName = this.truncateCardName(cardName);
    await this.page.waitForFunction(
      ({
        selector,
        fullName,
        truncatedName,
      }: {
        selector: string;
        fullName: string;
        truncatedName: string;
      }) => {
        const elements = document.querySelectorAll(selector);
        const cardValues = Array.from(elements).map(element =>
          element.textContent?.trim()
        );
        return (
          cardValues.includes(fullName) || cardValues.includes(truncatedName)
        );
      },
      {
        selector: stateNodeSelector,
        fullName: cardName,
        truncatedName: truncatedCardName,
      },
      {timeout: 60000}
    );

    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(closeModalButtonSelector);
      await this.expectElementToBeVisible(
        explorationStateGraphModalSelector,
        false
      );
    }
  }

  /**
   * Checks if the goal warning is visible.
   * @param {boolean} visible - Whether the goal warning should be visible or not.
   */
  async expectGoalWarningToBeVisible(visible: boolean = true): Promise<void> {
    await this.expectElementToBeVisible(goalWarningSelector, visible);
  }

  /**
   * Selects a multiple choice option.
   * @param {string} option - The option to select.
   */
  async selectMultipleChoiceOption(option: string): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(multipleChoiceOptionSelector);

    const options = await this.page.$$(multipleChoiceOptionSelector);
    let found = false;
    for (const optionElement of options) {
      const optionText = await optionElement.evaluate(el =>
        el.textContent?.trim()
      );
      if (optionText === option) {
        await optionElement.click();
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Option ${option} not found.`);
    }
    await this.waitForNetworkIdle();
    await this.clickOnElementWithSelector('.e2e-test-submit-answer-button');
  }

  /**
   * Verifies that the outcome feedback is visible.
   */
  async expectOutcomeFeedbackToBe(expectedFeedback: string): Promise<void> {
    await this.page.waitForSelector(outcomeFeedbackSelector, {
      state: 'visible',
    });
    const feedbackText = await this.page.$eval(
      outcomeFeedbackSelector,
      element => element.textContent?.trim() || ''
    );

    // Remove "Oppia tells the learner..." prefix.
    const feedbackTextWithoutPrefix = feedbackText
      .replace('Oppia tells the learner...', '')
      .trim();

    // Strip icon glyphs (for example material-icon private-use characters)
    // that can appear before feedback text in mobile layouts.
    const normalizedFeedbackText = feedbackTextWithoutPrefix
      .replace(/[\uE000-\uF8FF]/g, '')
      .trim();

    expect(normalizedFeedbackText).toBe(expectedFeedback);
  }

  /**
   * Asserts that the multiple-choice options rendered in the preview tab
   * match the expected set exactly (order-independent, ignoring empty strings).
   * Uses multipleChoiceOptionSelector which is already defined in this file.
   * @param {string[]} expectedOptions - The expected set of multiple-choice options.
   */
  async expectPreviewMultipleChoiceOptionsToEqual(
    expectedOptions: string[]
  ): Promise<void> {
    const choices = await this.page.$$eval(
      multipleChoiceOptionSelector,
      elements => elements.map(el => el.textContent?.trim() || '')
    );
    const nonEmptyChoices = choices.filter(choice => choice);
    expect(nonEmptyChoices.length).toBe(expectedOptions.length);
    expect(nonEmptyChoices).toEqual(expect.arrayContaining(expectedOptions));
  }

  /**
   * Expects the answer error message to be the expected error.
   * @param expectedError The expected error message.
   */
  async expectAnswerErrorMessageToBe(expectedError: string): Promise<void> {
    await this.expectTextContentToContain(formErrorContainer, expectedError);
  }

  /**
   * Function to customize the text input interaction.
   * @param placeHolderText - The placeholder text for the text input.
   * @param heightInRows - The height of the text input in rows.
   * @param catchMisspellings - Whether to catch misspellings.+
   */
  async customizeTextInputInteraction(
    placeHolderText?: string,
    heightInRows?: string,
    catchMisspellings?: boolean
  ): Promise<void> {
    await this.page.waitForSelector(customizeInteractionBodySelector);

    await this.page.waitForSelector(
      `${customizeInteractionBodySelector} input`
    );
    const inputElements = await this.page.$$(
      `${customizeInteractionBodySelector} input`
    );

    // Update placeholder text.
    if (placeHolderText) {
      await inputElements[0].click({clickCount: 3});
      await inputElements[0].type(placeHolderText);
      await this.expectElementValueToBe(inputElements[0], placeHolderText);
    }

    // Update height in rows.
    if (heightInRows) {
      await inputElements[1].click();
      await this.page.keyboard.press('Backspace');
      await inputElements[1].type(heightInRows);

      await this.expectElementValueToBe(inputElements[1], heightInRows);
    }

    // Update catch misspellings.
    if (catchMisspellings === true) {
      await inputElements[2].click();

      await this.page.waitForFunction(
        (ele: Element) => (ele as HTMLInputElement).checked,
        inputElements[2]
      );
    }

    // Save the interaction.
    await this.clickOnElementWithSelector(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      state: 'hidden',
    });
  }

  /**
   * Expects the save recommendation modal to be visible
   */
  async expectSaveRecommendationModalToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(saveRecommendationModalSelector, true);

    await this.expectModalTitleToBe('Save Changes');

    await this.expectTextContentToContain(
      '.e2e-test-modal-body',
      'It is recommended to save if the exploration has more than 50 changes.'
    );
  }

  /**
   * Function to add a multiple choice interaction to the exploration.
   * Any number of options can be added to the multiple choice interaction
   * using the options array.
   * @param options - Array of multiple choice options.
   */
  async addMultipleChoiceInteraction(options: string[]): Promise<void> {
    await this.page.waitForSelector(addInteractionButton, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(addInteractionButton);

    await this.expectModalTitleToBe('Choose Interaction');
    await this.page.waitForSelector(
      '.e2e-test-interaction-tile-MultipleChoiceInput',
      {
        state: 'visible',
      }
    );
    await this.clickOnElementWithSelector(
      '.e2e-test-interaction-tile-MultipleChoiceInput'
    );

    await this.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Multiple Choice)'
    );

    for (let i = 0; i < options.length - 1; i++) {
      await this.page.waitForSelector(addResponseOptionButton, {
        state: 'visible',
      });
      await this.clickOnElementWithSelector(addResponseOptionButton);
    }

    const responseInputs = await this.page.$$(stateContentInputField);
    for (let i = 0; i < options.length; i++) {
      await responseInputs[i].type(`${options[i]}`);
    }

    await this.clickOnElementWithSelector(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      state: 'hidden',
    });
    showMessage('Multiple Choice interaction has been added successfully.');
  }

  /**
   * Verifies that the card content is as expected.
   * @param {string} expectedCardContent - The expected card content.
   */
  async expectCardContentToBe(expectedCardContent: string): Promise<void> {
    await this.page.waitForSelector(contentBoxSelector, {
      state: 'visible',
    });

    const cardContent = await this.page.$eval(contentBoxSelector, el =>
      el.textContent?.trim()
    );

    expect(cardContent).toBe(expectedCardContent);
  }

  /**
   * Removes the current interaction.
   */
  async removeInteraction(): Promise<void> {
    // We need to wait for element to stabalize explicitly, as it gets detached
    // this is not handled by waitForElementToStabalize in clickOnElementWithSelector.
    await this.waitForElementToStabilize(removeInteractionButttonSelector);
    await this.clickOnElementWithSelector(removeInteractionButttonSelector);
    await this.clickOnElementWithSelector(
      '.e2e-test-confirm-delete-interaction'
    );
    await this.expectElementToBeVisible(
      '.e2e-test-confirm-delete-interaction',
      false
    );
  }

  /**
   * Opens the exploration editor for the exploration with the given name from the creator dashboard.
   * @param {string} explorationName - The name of the exploration.
   */
  async openExplorationInExplorationEditor(
    explorationName: string
  ): Promise<void> {
    await this.expectElementToBeVisible(explorationSummaryTileTitleSelector);
    const title = await this.getTextContent(
      explorationSummaryTileTitleSelector
    );

    if (title === explorationName) {
      await this.clickOnElementWithSelector(explorationDashboardCardSelector);
    } else {
      throw new Error(`Exploration not found: ${explorationName}`);
    }

    await this.waitForNetworkIdle();
    await this.waitForPageToFullyLoad();

    await this.expectElementToBeVisible(
      explorationSummaryTileTitleSelector,
      false
    );
  }

  /**
   * Expects the card height limit warning to be visible
   */
  async expectCardHeightLimitWarningToBeVisible(): Promise<void> {
    await this.expectTextContentToContain(
      cardHeightLimitWarningSelector,
      'This card is quite long'
    );
  }

  /**
   * Verifies that the interaction preview card is visible.
   */
  async expectInteractionPreviewCardToBeVisible(): Promise<void> {
    const visible = await this.isElementVisible(interactionPreviewSelector);

    expect(visible).toBe(true);
  }

  /**
   * Expects the state name to be a specific value
   * @param expectedStateName The expected state name
   */
  async expectStateNameToBe(expectedStateName: string): Promise<void> {
    await this.expectTextContentToContain(
      currentCardNameContainerSelector,
      expectedStateName
    );
  }

  /**
   * Updates the name of a state in the exploration editor
   * @param newStateName - The new name for the state
   */
  async updateStateName(newStateName: string): Promise<void> {
    await this.expectElementToBeVisible(currentCardNameContainerSelector, true);
    await this.clickOnElementWithSelector(currentCardNameContainerSelector);

    await this.page.evaluate(selector => {
      const input = document.querySelector(selector) as HTMLInputElement;
      if (input) {
        input.value = '';
        input.focus();
      }
    }, stateNameInputSelector);

    await this.page.keyboard.type(newStateName);
    await this.clickOnElementWithSelector(stateNameSubmitButtonSelector);
    await this.waitForPageToFullyLoad();
    await this.expectTextContentToContain(
      currentCardNameContainerSelector,
      newStateName
    );
  }

  /**
   * Waits for the solution modal body to be visible and asserts that it
   * contains every string in expectedTexts.
   * Uses commonModalBodySelector which is already defined in this file.
   * @param {string[]} expectedTexts - The strings expected to appear in the solution modal body.
   */
  async expectSolutionModalToContain(expectedTexts: string[]): Promise<void> {
    await this.page.waitForSelector('ngb-modal-window.modal.show .modal-body', {
      state: 'visible',
    });
    const modalText = await this.page.$eval(
      'ngb-modal-window.modal.show .modal-body',
      el => el.textContent || ''
    );
    for (const text of expectedTexts) {
      expect(modalText).toContain(text);
    }
  }

  async expectSaveDraftButtonToBeDisabled(
    disabled: boolean = true
  ): Promise<void> {
    const saveChangesButtonSelector = this.isViewportAtMobileWidth()
      ? mobileSaveChangesButtonSelector
      : saveChangesButton;
    await this.expectElementToBeVisible(saveChangesButtonSelector);

    await this.page.waitForFunction(
      ({selector, disabled}: {selector: string; disabled: boolean}) => {
        const element = document.querySelector(selector);
        return (element as HTMLButtonElement)?.disabled === disabled;
      },
      {selector: saveChangesButtonSelector, disabled}
    );
  }

  /**
   * Clicks on the save draft button in the save recommendation modal
   * * @param commitMessage - The commit message text to be saved.
   */
  async saveExplorationDraftFromSaveRecommendationModal(
    commitMessage: string = 'Testing Testing'
  ): Promise<void> {
    await this.expectSaveRecommendationModalToBeVisible();
    await this.clickOnElementWithSelector(
      saveRecommendationModalSaveButtonSelector
    );

    if (commitMessage) {
      await this.clickOnElementWithSelector(commitMessageSelector);
      await this.typeInInputField(commitMessageSelector, commitMessage);
    }

    await this.clickOnElementWithSelector(saveDraftButton);
    await this.expectElementToBeVisible(saveDraftButton, false);

    await this.expectElementToBeVisible(toastMessage, true);
    await this.expectElementToBeVisible(toastMessage, false);
    showMessage('Exploration is saved successfully.');
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(saveRecommendationModalSelector, false);
  }

  /**
   * Expects the node warning sign to be visible or not visible.
   * @param visible - Whether the node warning sign should be visible or not.
   */
  async expectNodeWariningSignToBeVisible(
    visible: boolean = true
  ): Promise<void> {
    // TODO(##23129): Remove this skip once the issue is fixed, and the nodes
    // are added to mobile viewport.
    if (this.isViewportAtMobileWidth()) {
      showMessage(
        'Skipping node warning sign check on mobile viewport,' +
          'as nodes are not visible on mobile viewport.'
      );
      return;
    }

    await this.expectElementToBeVisible(nodeWarningSignSelector, visible);
  }

  /**
   * Checks if the self loop warning is visible.
   * @param {boolean} visible - Whether the self loop warning should be visible or not.
   */
  async expectSelfLoopWarningToBeVisible(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(selfLoopWarningSelector, visible);
  }

  /**
   * Asserts that the preview is showing the end-exploration card:
   * no submit-answer button is present and the restart button is visible.
   */
  async expectEndExplorationPreviewToBeVisible(): Promise<void> {
    const submitButton = await this.page.$(submitAnswerButton);
    expect(submitButton).toBeNull();
    await this.page.waitForSelector(previewRestartButton, {
      state: 'visible',
    });
  }

  /**
   * Returns the rule editor modal element.
   */
  async getRuleEditorModal(): Promise<ElementHandle<Element>> {
    await this.page.waitForSelector(responseModalBodySelector, {
      state: 'visible',
    });

    const responseBox = await this.page.$(responseModalBodySelector);
    if (!responseBox) {
      throw new Error('Response modal not found');
    }

    const ruleEditor = await responseBox.$(ruleEditorInResponseModalSeclector);
    if (!ruleEditor) {
      throw new Error('Rule editor not found');
    }

    return ruleEditor;
  }

  /**
   * Updates the rule in the response modal.
   * @param {string} rule - The rule to select.
   */
  async updateRuleInResponseModalTo(rule: string): Promise<void> {
    await this.page.waitForSelector(responseModalBodySelector, {
      state: 'visible',
    });

    const responseBox = await this.page.$(responseModalBodySelector);
    if (!responseBox) {
      throw new Error('Response modal is not visible.');
    }

    const ruleSelector = await responseBox.$(
      'oppia-rule-type-selector mat-select'
    );
    if (!ruleSelector) {
      throw new Error('Rule type selector not found in response modal.');
    }

    const currentRuleText = (await ruleSelector.innerText()) || '';
    if (currentRuleText.includes(rule)) {
      return;
    }

    await ruleSelector.click();
    await this.page.waitForSelector('mat-option', {state: 'visible'});
    const ruleOptions = await this.page.$$('mat-option');
    for (const option of ruleOptions) {
      const text = (await option.textContent()) || '';
      if (text.includes(rule)) {
        await option.click();
        break;
      }
    }

    await this.page.waitForFunction(
      ({selector, ruleText}: {selector: string; ruleText: string}) => {
        const el = document.querySelector(selector);
        return el ? (el.textContent || '').includes(ruleText) : false;
      },
      {
        selector: `${responseModalBodySelector} oppia-rule-type-selector mat-select`,
        ruleText: rule,
      }
    );
  }

  /**
   * Updates the answer in the response modal for a multiple choice rule.
   * @param rule The rule to update.
   * @param answer The answer to update.
   */
  async updateMultipleChoiceLearnersAnswerInResponseModal(
    rule: 'is equal to',
    answer: string
  ): Promise<void> {
    await this.updateRuleInResponseModalTo(rule);

    const responseModal = await this.getRuleEditorModal();

    const multipleChoiceDropdown = await this.getElementInParent(
      multipleChoiceResponseDropdown,
      responseModal
    );

    await multipleChoiceDropdown.click();
    await this.selectMatOption(answer);

    // Check if the value has been updated.
    await this.expectTextContentToBe(multipleChoiceResponseDropdown, answer);
  }

  /**
   * Function to navigate to the preview tab.
   */
  async navigateToPreviewTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.waitForPageToFullyLoad();
      const element = await this.page.$(mobileNavbarOptions);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to save changes appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.page.waitForSelector(mobileOptionsButtonSelector, {
          state: 'visible',
        });
        await this.clickOnElementWithSelector(mobileOptionsButtonSelector);
      }

      // Check if dropdown is open or not, if open skip clicking on dropdown.
      const isDropdownOpen = await this.isElementVisible(
        `${mobileNavbarPane}.show`
      );

      // Open dropdown if not open.
      if (!isDropdownOpen) {
        await this.page.waitForSelector(mobileNavbarDropdown, {
          state: 'visible',
        });
        await this.clickOnElementWithSelector(mobileNavbarDropdown);
        await this.page.waitForTimeout(500);
      }

      // Click on the "Preview" button.
      await this.page.waitForSelector(`${mobileNavbarPane}.show`);
      await this.page.waitForTimeout(500);
      const previewButton = await this.page.waitForSelector(
        mobilePreviewTabButton
      );
      await previewButton?.click();
    } else {
      await this.page.waitForSelector(previewTabButton, {
        state: 'visible',
      });
      await this.clickOnElementWithSelector(previewTabButton);
    }

    await this.page.waitForFunction(() =>
      window.location.href.includes('#/preview/')
    );
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(previewTabContainer, {state: 'visible'});
  }

  /**
   * Verifies that the remove interaction button is visible.
   */
  async expectRemoveInteractionButtonToBeVisible(): Promise<void> {
    const visible = await this.isElementVisible(
      removeInteractionButttonSelector
    );

    expect(visible).toBe(true);
  }

  /**
   * Function to submit an text input answer.
   * @param {string} answer - The answer to submit.
   */
  async submitTextInputAnswer(answer: string): Promise<void> {
    await this.expectElementToBeVisible(textAreaInputSelector);

    await this.typeInInputField(textAreaInputSelector, answer);
    await this.expectElementValueToBe(textAreaInputSelector, answer);

    await this.clickOnElementWithSelector('.e2e-test-submit-answer-button');
  }

  /**
   * Verifies that the current outcome destination is as expected.
   * @param {string} expectedDestination - The expected destination.
   */
  async expectCurrentOutcomeDestinationToBe(
    expectedDestination: string
  ): Promise<void> {
    if (expectedDestination === '(try again)') {
      const isCurrentDestinationSummaryVisible = await this.isElementVisible(
        currentOutcomeDestinationSelector,
        true,
        3000
      );

      if (isCurrentDestinationSummaryVisible) {
        const currentDestination = await this.page.$eval(
          currentOutcomeDestinationSelector,
          el => el.textContent?.trim() || ''
        );
        expect(['(try again)', '']).toContain(currentDestination);
        return;
      }

      // Self-loop destinations sometimes render without current-outcome text.
      // In that case, verify by opening the destination editor and checking
      // that the selected destination is the current card.
      await this.clickOnElementWithSelector(openOutcomeDestButton);
      await this.page.waitForSelector(destinationSelectorDropdown, {
        state: 'visible',
      });

      try {
        const selectedDestinationText = await this.page.$eval(
          `${destinationSelectorDropdown} option:checked`,
          option => option.textContent?.trim() || ''
        );
        const currentCardName = await this.page.$eval(
          currentCardNameContainerSelector,
          el => (el.textContent || '').replace(/[\uE000-\uF8FF]/g, '').trim()
        );

        const normalizedDestination = selectedDestinationText.toLowerCase();
        const normalizedCurrentCardName = currentCardName.toLowerCase();
        const isSelfLoopDestination =
          normalizedDestination === '(try again)' ||
          normalizedDestination === '' ||
          normalizedDestination.includes(normalizedCurrentCardName);
        expect(isSelfLoopDestination).toBe(true);
      } finally {
        const cancelDestinationButton = await this.page.$(
          '.e2e-test-cancel-outcome-dest'
        );
        if (cancelDestinationButton) {
          await this.clickOnElementWithSelector(
            '.e2e-test-cancel-outcome-dest'
          );
        }
      }
      return;
    }

    await this.page.waitForSelector(currentOutcomeDestinationSelector, {
      state: 'visible',
    });
    const currentDestination = await this.page.$eval(
      currentOutcomeDestinationSelector,
      el => el.textContent?.trim() || ''
    );

    expect(currentDestination).toBe(expectedDestination);
  }

  /**
   * Verifies that the expected solution is in the current solutions.
   * @param {string} expectedSolution - The expected solution.
   */
  async expectSolutionsToContain(expectedSolution: string): Promise<void> {
    await this.page.waitForSelector(
      '.e2e-test-oppia-solution-tab .e2e-test-response-summary',
      {
        state: 'visible',
      }
    );

    const solutions = await this.page.$$eval(
      '.e2e-test-oppia-solution-tab .e2e-test-response-summary',
      elements => elements.map(el => el.textContent?.trim())
    );

    expect(solutions).toContain(expectedSolution);
  }

  /**
   * Clicks on interaction in exploration editor.
   */
  async clickOnTestExploration(): Promise<void> {
    await this.expectElementToBeVisible(interactionPreviewSelector);
    await this.clickOnElementWithSelector(interactionPreviewSelector);
    await this.page.waitForFunction(
      ({selector, h1, h2}: {selector: string; h1: string; h2: string}) => {
        const element = document.querySelector(selector);
        return (
          Boolean(element) &&
          (element?.textContent?.includes(h1) ||
            element?.textContent?.includes(h2))
        );
      },
      {
        selector: commonModalTitleSelector,
        h1: 'Customize Interaction',
        h2: 'Add Response',
      }
    );
  }

  /**
   * Expect to be in the creator dashboard page.
   */
  async expectToBeInCreatorDashboard(): Promise<void> {
    await this.page.waitForSelector('.e2e-test-creator-dashboard-container', {
      state: 'visible',
    });

    await this.isTextPresentOnPage('Creator Dashboard');
  }

  /**
   * Waits until the next-card button is visible in the preview tab.
   * Use this before asserting preview card content when the card has a
   * Continue Button interaction.
   */
  async expectNextCardButtonToBeVisible(): Promise<void> {
    await this.page.waitForSelector(nextCardButtonSelector, {state: 'visible'});
  }

  async expectHintsToContain(expectedHint: string): Promise<void> {
    const hintSelector =
      '.e2e-test-current-hint-box .e2e-test-response-summary';
    await this.page.waitForSelector(hintSelector, {state: 'visible'});
    const hints = await this.page.$$eval(hintSelector, elements =>
      elements.map(el => el.textContent?.trim())
    );
    expect(hints.some(h => h && h.includes(expectedHint))).toBe(true);
  }

  async expectElementPlaceholderToBe(
    selector: string,
    placeholder: string
  ): Promise<void> {
    await this.page.waitForSelector(selector, {state: 'visible'});
    const actualPlaceholder = await this.page.$eval(
      selector,
      el =>
        el.getAttribute('placeholder') ||
        el.getAttribute('aria-placeholder') ||
        (el as HTMLInputElement).placeholder ||
        ''
    );
    expect(actualPlaceholder.trim()).toBe(placeholder);
  }

  async expectHintInHintModalToContain(expectedHint: string): Promise<void> {
    await this.expectElementToBeVisible(commonModalTitleSelector);
    await this.expectTextContentToContain(
      commonModalBodySelector,
      expectedHint
    );
  }

  async waitForSolutionButtonToBeVisible(wrongAnswer: string): Promise<void> {
    const viewSolutionSelector = '.e2e-test-view-solution';
    const hintSelector = '.e2e-test-view-hint';
    const gotItButtonSelector = '.e2e-test-learner-got-it-button';

    for (let i = 0; i < 5; i++) {
      const isSolutionVisible = await this.page
        .locator(viewSolutionSelector)
        .isVisible();
      if (isSolutionVisible) {
        return;
      }

      await this.typeInInputField(
        'textarea.e2e-test-description-box',
        wrongAnswer
      );
      await this.clickOnElementWithSelector(
        '.e2e-test-submit-answer-button:not([disabled])'
      );
      await this.page.waitForTimeout(500);

      try {
        const isHintVisible = await this.page.locator(hintSelector).isVisible();
        if (isHintVisible) {
          await this.clickOnElementWithSelector(hintSelector);
          await this.page.waitForSelector(gotItButtonSelector, {
            state: 'visible',
          });
          await this.clickOnElementWithSelector(gotItButtonSelector);
          await this.page.waitForSelector(gotItButtonSelector, {
            state: 'hidden',
          });
        }
      } catch (e) {
        // Ignore if hint modal interactions fail.
      }
    }
    await this.page
      .locator(viewSolutionSelector)
      .waitFor({state: 'visible', timeout: 60000});
  }

  async navigateToPreferencesPage(): Promise<void> {
    await this.clickOnElementWithSelector('.e2e-test-profile-dropdown');
    await this.clickOnElementWithSelector('.e2e-test-preferences-link');
  }

  async updatePreferredSiteLanguage(language: string): Promise<void> {
    await this.clickOnElementWithSelector('.e2e-test-site-language-selector');
    await this.clickOnElementWithSelectorAndText('.mat-option', language);
  }

  async expectResponseFeedbackToBe(expectedFeedback: string): Promise<void> {
    await this.expectElementToBeVisible(
      '.e2e-test-conversation-feedback-latest'
    );
    const text = await this.page.$eval(
      '.e2e-test-conversation-feedback-latest',
      el => el.textContent || ''
    );
    if (!text.includes(expectedFeedback)) {
      throw new Error(`Expected feedback ${expectedFeedback} but got ${text}`);
    }
  }

  /**
   * Updates the exploration title in the settings tab.
   * @param {string} title - The new title of the exploration.
   */
  async updateTitleTo(title: string): Promise<void> {
    await this.expectElementToBeVisible(addTitleBar);
    await this.clearAllTextFrom(addTitleBar);
    await this.typeInInputField(addTitleBar, title);
    await this.page.keyboard.press('Tab');

    const newTitle = await this.page.$eval(addTitleBar, el =>
      (el as HTMLInputElement).value?.trim()
    );

    // Compare first 36 characters of title.
    if (newTitle !== title.slice(0, 36)) {
      throw new Error(
        `Failed to update title. Expected: ${title}, but got: ${newTitle}`
      );
    }

    showMessage(`Title has been updated to ${newTitle}`);
  }
}

export const ExplorationEditorFactory = (page: Page): ExplorationEditor => {
  return new ExplorationEditor(page);
};
