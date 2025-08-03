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
 * @fileoverview Utility functions for the Exploration Editor page.
 */

import puppeteer from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';
import {error} from 'console';
import fs from 'fs';
import path from 'path';

const creatorDashboardPage = testConstants.URLs.CreatorDashboard;
const baseUrl = testConstants.URLs.BaseURL;
const imageToUpload = testConstants.data.curriculumAdminThumbnailImage;

const createExplorationButton = 'button.e2e-test-create-new-exploration-button';

const createExplorationButtonSelector =
  'button.e2e-test-create-new-exploration-button';
const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const dropdownToggleIcon = '.e2e-test-mobile-options-dropdown';
const saveContentButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const saveChangesButton = 'button.e2e-test-save-changes';
const mathInteractionsTab = '.e2e-test-interaction-tab-math';
const closeResponseModalButton = '.e2e-test-close-add-response-modal';

const settingsTabSelector = 'a.e2e-test-exploration-settings-tab';
const addTitleBar = 'input#explorationTitle';
const explorationTitleSelector = '.e2e-test-exploration-title-input';
const addGoalInputBox = '.e2e-test-exploration-objective-input';
const categoryDropdown = 'mat-select.e2e-test-exploration-category-dropdown';
const languageUpdateDropdown =
  'mat-select.e2e-test-exploration-language-select';
const addTagsInputBox = 'input.e2e-test-chip-list-tags';
const autoSaveIndicator = 'span.e2e-test-autosave-indicator';
const previewSummaryButton = 'button.e2e-test-open-preview-summary-modal';
const dismissPreviewButton = 'button.e2e-test-close-preview-summary-modal';
const textToSpeechToggle = 'label.e2e-test-on-off-switch';
const feedbackToggle = 'label.e2e-test-enable-fallbacks';
const editRoleButton = '.e2e-test-edit-roles';
const addUsernameInputBox = '#newMemberUsername';
const addRoleDropdown = 'mat-select.e2e-test-role-select';
const collaboratorRoleOption = 'Collaborator (can make changes)';
const playtesterRoleOption = 'Playtester (can give feedback)';
const saveRoleButton = 'button.e2e-test-save-role';

const programmingInteractionsButtonSelector =
  '.e2e-test-interaction-tab-programming';

const interactionDiv = '.e2e-test-interaction';
const addInteractionModalSelector = 'customize-interaction-body-container';
const multipleChoiceInteractionButton =
  'div.e2e-test-interaction-tile-MultipleChoiceInput';
const addResponseOptionButton = 'button.e2e-test-add-list-entry';
const addAnotherResponseButton = 'button.e2e-test-add-another-response';
const multipleChoiceResponseDropdown =
  'mat-select.e2e-test-main-html-select-selector';
const multipleChoiceResponseOption = 'mat-option.e2e-test-html-select-selector';
const textInputInteractionButton = 'div.e2e-test-interaction-tile-TextInput';
const textInputInteractionOption =
  'tr#e2e-test-schema-based-list-editor-table-row';
const textInputField = '.e2e-test-text-input';

const saveDraftButton = 'button.e2e-test-save-draft-button';
const commitMessage = 'textarea.e2e-test-commit-message-input';
const publishExplorationButtonSelector = 'button.e2e-test-publish-exploration';
const explorationTitleInput = 'input.e2e-test-exploration-title-input-modal';
const explorationGoalInput = 'input.e2e-test-exploration-objective-input-modal';
const explorationCategoryDropdown =
  'mat-form-field.e2e-test-exploration-category-metadata-modal';
const saveExplorationChangesButton = 'button.e2e-test-confirm-pre-publication';
const explorationConfirmPublishButton = '.e2e-test-confirm-publish';
const explorationIdElement = 'span.oppia-unique-progress-id';
const closePublishedPopUpButton = 'button.e2e-test-share-publish-close';
const discardDraftDropdownSelector = 'button.e2e-test-save-discard-toggle';
const desktopDiscardDraftButton = 'a.e2e-test-discard-changes';
const confirmDiscardButton = 'button.e2e-test-confirm-discard-changes';
const currentCardNameSelector = 'strong.e2e-test-state-name-text';

const previewTabButton = '.e2e-test-preview-tab';
const previewTabContainer = '.e2e-test-preview-tab-container';
const mobilePreviewTabButton = '.e2e-test-mobile-preview-button';
const mainTabButton = '.e2e-test-main-tab';
const mobileMainTabButton = '.e2e-test-mobile-main-tab';
const stateEditSelector = '.e2e-test-state-edit-content';
const stateContentInputField = 'div.e2e-test-rte';
const uploadImageButton = '.e2e-test-upload-image';
const useTheUploadImageButton = '.e2e-test-use-image';
const imageRegionSelector = '.e2e-test-svg';
const correctAnswerInTheGroupSelector = '.e2e-test-editor-correctness-toggle';
const addNewResponseButton = 'button.e2e-test-add-new-response';
const floatFormInput = '.e2e-test-float-form-input';
const modifyExistingTranslationsButton = '.e2e-test-modify-translations-button';
const leaveTranslationsAsIsButton = '.e2e-test-leave-translations-as-is';
const activeTranslationTab = '.e2e-test-active-translation-tab';
const modifyTranslationModalSelector =
  '.e2e-test-modify-translations-modal-body';

const stateNodeSelector = '.e2e-test-node-label';
const openOutcomeDestButton = '.e2e-test-open-outcome-dest-editor';
const destinationCardSelector = 'select.e2e-test-destination-selector-dropdown';
const addStateInput = '.e2e-test-add-state-input';
const saveOutcomeDestButton = '.e2e-test-save-outcome-dest';
const stateResponsesSelector = '.e2e-test-default-response-tab';
const feedbackEditorSelector = '.e2e-test-open-feedback-editor';
const responseModalHeaderSelector = '.e2e-test-add-response-modal-header';
const toastMessage = '.e2e-test-toast-message';

const defaultFeedbackTab = 'a.e2e-test-default-response-tab';
const openOutcomeFeedBackEditor = 'div.e2e-test-open-outcome-feedback-editor';
const saveOutcomeFeedbackButton = 'button.e2e-test-save-outcome-feedback';
const addHintButton = 'button.e2e-test-oppia-add-hint-button';
const saveHintButton = 'button.e2e-test-save-hint';
const addSolutionButton = 'button.e2e-test-oppia-add-solution-button';
const solutionInputNumeric = 'oppia-add-or-update-solution-modal input';
const solutionInputTextArea =
  'oppia-add-or-update-solution-modal textarea.e2e-test-description-box';
const submitSolutionButton = 'button.e2e-test-submit-solution-button';
const oppiaFeebackEditorContainerSelector = '.e2e-test-response-body-default';

const dismissTranslationWelcomeModalSelector =
  'button.e2e-test-translation-tab-dismiss-welcome-modal';
const translationTabButton = '.e2e-test-translation-tab';
const mobileTranslationTabButton = '.e2e-test-mobile-translation-tab';

const voiceoverLanguageSelector = '.e2e-test-voiceover-language-selector';
const voiceoverLanguageOptionSelector = '.e2e-test-language-selector-option';
const voiceoverLanguageAccentSelector =
  '.e2e-test-voiceover-language-accent-selector';
const voiceoverLanguageAccentOptionSelector =
  '.e2e-test-language-accent-selector-option';

const translationModeButton = 'button.e2e-test-translation-mode';
const editTranslationSelector = 'div.e2e-test-edit-translation';
const stateTranslationEditorSelector =
  'div.e2e-test-state-translation-editor schema-based-editor';
const saveTranslationButton = 'button.e2e-test-save-translation';

const stateSolutionTab = '.e2e-test-oppia-solution-tab';
const editStateSolutionExplanationSelector =
  '.e2e-test-edit-solution-explanation';
const saveSolutionEditButton = 'button.e2e-test-save-solution-explanation-edit';

const stateHintTab = '.e2e-test-hint-tab';
const editStateHintSelector = '.e2e-test-open-hint-editor';
const saveHintEditButton = 'button.e2e-test-save-hint-edit';

const misconceptionDiv = '.misconception-list-item';
const misconceptionTitle = '.e2e-test-misconception-title';
const optionalMisconceptionDiv = '.optional-misconception-list-item';
const inapplicableMisconceptionDiv = '.optional-misconception-list-no-action';
const optionalMisconceptionOptionsButton =
  '.optional-misconception-options-button';
const misconceptionApplicableToggle =
  '.e2e-test-misconception-applicable-toggle';
const responseGroupDiv = '.e2e-test-response-tab';
const misconceptionEditorTab = '.e2e-test-open-misconception-editor';
const toggleResponseTab = '.e2e-test-response-tab-toggle';

const modalSaveButton = '.e2e-test-save-button';
const modifyTranslationsModalDoneButton =
  '.e2e-test-modify-translations-done-button';

const mobileSettingsBarSelector = 'li.e2e-test-mobile-settings-button';
const mobileChangesDropdownSelector = 'div.e2e-test-mobile-changes-dropdown';
const mobileSaveChangesButtonSelector =
  'button.e2e-test-save-changes-for-small-screens';
const mobilePublishButtonSelector = 'button.e2e-test-mobile-publish-button';
const mobileDiscardButtonSelector =
  'button.e2e-test-mobile-exploration-discard-tab';
const mobileStateGraphResizeButton = '.e2e-test-mobile-graph-resize-button';
const mobileNavbarDropdown = 'div.e2e-test-mobile-options-dropdown';
const mobileNavbarPane = '.oppia-exploration-editor-tabs-dropdown';
const mobileNavbarOptions = '.navbar-mobile-options';
const mobileOptionsButtonSelector = 'i.e2e-test-mobile-options';
const basicSettingsDropdown = 'h3.e2e-test-settings-container';
const feedbackSettingsDropdown = 'h3.e2e-test-feedback-settings-container';
const permissionSettingsDropdown = 'h3.e2e-test-permission-settings-container';
const voiceArtistSettingsDropdown =
  'h3.e2e-test-voice-artists-settings-container';
const rolesSettingsDropdown = 'h3.e2e-test-roles-settings-container';
const advanceSettingsDropdown = 'h3.e2e-test-advanced-settings-container';
const explorationControlsSettingsDropdown =
  'h3.e2e-test-controls-bar-settings-container';
const settingsContainerSelector =
  '.oppia-editor-card.oppia-settings-card-container';
const deleteButtonSelector = 'button.oppia-delete-button';

const nextCardButton = '.e2e-test-next-card-button';
const nextCardArrowButton = '.e2e-test-next-button';
const submitAnswerButton = '.e2e-test-submit-answer-button';
const previewRestartButton = '.e2e-test-preview-restart-button';
const stateConversationContent = '.e2e-test-conversation-content';
const explorationCompletionToastMessage = '.e2e-test-lesson-completion-message';

const subscriberCountLabel = '.e2e-test-oppia-total-subscribers';
const subscriberTabButton = '.e2e-test-subscription-tab';
const subscriberCard = '.e2e-test-subscription-card';
const feedbackPopupSelector = '.e2e-test-exploration-feedback-popup-link';
const feedbackTextarea = '.e2e-test-exploration-feedback-textarea';
const destinationSelectorDropdown = '.e2e-test-destination-selector-dropdown';
const destinationWhenStuckSelectorDropdown =
  '.e2e-test-destination-when-stuck-selector-dropdown';
const addDestinationStateWhenStuckInput = '.protractor-test-add-state-input';
const outcomeDestWhenStuckSelector =
  '.protractor-test-open-outcome-dest-if-stuck-editor';
const intEditorField = '.e2e-test-editor-int';
const setAsCheckpointButton = '.e2e-test-checkpoint-selection-checkbox';
const tagsField = '.e2e-test-chip-list-tags';
const saveUploadedAudioButton = '.e2e-test-save-uploaded-audio-button';
const feedBackButtonTab = '.e2e-test-feedback-tab';
const mobileFeedbackTabButton = '.e2e-test-mobile-feedback-button';
const explorationSummaryTileTitleSelector = '.e2e-test-exp-summary-tile-title';
const feedbackSubjectSelector = '.e2e-test-exploration-feedback-subject';
const feedbackSelector = '.e2e-test-exploration-feedback';
const stayAnonymousCheckbox = '.e2e-test-stay-anonymous-checkbox';
const responseTextareaSelector = '.e2e-test-feedback-response-textarea';
const sendButtonSelector = '.e2e-test-oppia-feedback-response-send-btn';
const errorSavingExplorationModal = '.e2e-test-discard-lost-changes-button';
const historyTabButton = '.e2e-test-history-tab';
const historyListContent = '.e2e-test-history-list-item';
const mobileHistoryTabButton = '.e2e-test-mobile-history-button';
const totalPlaysSelector = '.e2e-test-oppia-total-plays';
const numberOfOpenFeedbacksSelector = '.e2e-test-oppia-open-feedback';
const avarageRatingSelector = '.e2e-test-oppia-average-rating';
const usersCountInRatingSelector = '.e2e-test-oppia-total-users';
const explorationFeedbackCardActiveSelector =
  '.e2e-test-exploration-feedback-card-active';
const explorationFeedbackTabContentSelector =
  '.e2e-test-exploration-feedback-card';

const editRolesButtonSelector = '.oppia-edit-roles-btn-container';
const stateContentEditorSelector =
  '.e2e-test-edit-content.oppia-editable-section';
const tagFilterDropdownSelector = '.e2e-test-tag-filter-selection-dropdown';
const languageDropdownValueSelector =
  'mat-select.e2e-test-exploration-language-select .mat-select-value';

const mainTabContainerSelector = '.e2e-test-exploration-main-tab';
const historyTabContentContainerSelector = '.e2e-test-exploration-history-tab';
const historyTableIndex = '.history-table-index';
const historyListOptions = '.e2e-test-history-list-options';
const downloadExplorationButton =
  'a.dropdown-item.e2e-test-download-exploration';
const feedbackTabBackButtonSelector = '.e2e-test-oppia-feedback-back-button';
const feedbackStatusMenu = '.e2e-test-oppia-feedback-status-menu';
const feedbackTabRowSelector = '.e2e-test-oppia-feedback-tab-row';
const feedbackStatusSelector = '.e2e-test-exploration-feedback-status';

const downloadPath = testConstants.TEST_DOWNLOAD_DIR;
const addManualVoiceoverButton = '.e2e-test-voiceover-upload-audio';
const regenerateAutomaticVoiceoverButton = '.e2e-test-regenerate-voiceover';
const voiceoverConfirmationModalButton =
  '.e2e-test-voiceover-regeneration-confirm';

const saveDestinationButtonSelector = '.e2e-test-save-outcome-dest';
const saveStuckDestinationButtonSelector = '.e2e-test-save-stuck-destination';
const descriptionBoxSelector = 'textarea.e2e-test-description-box';
const textInputSelector = 'input.e2e-test-text-input';
const closeButtonForExtraModel = '.e2e-test-close-rich-text-component-editor';

const skillItemInRTESelector = '.e2e-test-rte-skill-selector-item';
const translationTabContainer = '.e2e-test-translation-tab-container';

const previousCardButton = '.e2e-test-back-button';
const openExplorationEditorNavigationMobile =
  '.oppia-exploration-editor-tabs-dropdown.show';
const skillNameInput = '.e2e-test-skill-name-input';

const openNavbarIconSelector = '.mobile-navbar-toggled';
const stateChangesDropdownSelector = '.e2e-test-state-changes-dropdown';
const mathInteractionButtonSelector = '.e2e-test-interaction-tab-math';

const oppiaYouTubeVideoUrl = 'https://www.youtube.com/watch?v=0tRc75S9MFU';
const oppiaWebURL = 'https://www.oppia.org';
const rteHelperModalSelector = 'oppia-rte-helper-modal';

export enum INTERACTION_TYPES {
  CODE_EDITOR = 'Code Editor',
  CONTINUE_BUTTON = 'Continue Button',
  END_EXPLORATION = 'End Exploration',
  NUMERIC_INPUT = 'Number Input',
  FRACTION_INPUT = 'Fraction Input',
}

enum INTERACTION_TABS {
  PROGRAMMING = 'PROGRAMMING',
  MATH = 'MATH',
}

export const INTERACTION_TABS_OF_INTERACTION_TYPE: Record<string, string> = {
  [INTERACTION_TYPES.CODE_EDITOR]: INTERACTION_TABS.PROGRAMMING,
  [INTERACTION_TYPES.FRACTION_INPUT]: INTERACTION_TABS.MATH,
};

interface TabContent {
  title: string;
  content: string;
}

const UNPUBLISHED_EXPLORATION_ZIP_FILE_PREFIX =
  'oppia-unpublished_exploration-v';
const PUBLISHED_EXPLORATION_ZIP_FILE_PREFIX =
  'oppia-Publishwithaninteraction-v';
export class ExplorationEditor extends BaseUser {
  /**
   * Function to navigate to creator dashboard page.
   */
  async navigateToCreatorDashboardPage(): Promise<void> {
    await this.goto(creatorDashboardPage);
    showMessage('Creator dashboard page is opened successfully.');
  }

  /**
   * Function to navigate to exploration editor from Creator Dashboard.
   */
  async navigateToExplorationEditorFromCreatorDashboard(): Promise<void> {
    await this.page.waitForSelector(createExplorationButtonSelector);
    await this.clickAndWaitForNavigation(createExplorationButtonSelector);

    expect(this.page.url()).toContain(`${baseUrl}/create/`);
  }

  /**
   * Function to navigate to exploration editor.
   */
  async navigateToExplorationEditorPage(): Promise<void> {
    await this.clickAndWaitForNavigation(createExplorationButton);
  }

  /**
   * Function to create an exploration with a content and interaction.
   * This is a composite function that can be used when a straightforward, simple exploration setup is required.
   *
   * @param content - content of the exploration
   * @param interaction - the interaction to be added to the exploration
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
   * Open settings tab.(Note->It also opens all the dropdowns present
   * in the setting tab for mobile view port.)
   */
  async navigateToSettingsTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarDropdown);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to settings tab appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.page.waitForSelector(mobileOptionsButtonSelector, {
          visible: true,
        });
        await this.clickOn(mobileOptionsButtonSelector);
      }
      await this.page.waitForSelector(mobileNavbarDropdown, {
        visible: true,
      });
      await this.clickOn(mobileNavbarDropdown);
      await this.clickOn(mobileSettingsBarSelector);

      // Open all dropdowns because by default all dropdowns are closed in mobile view.
      await this.clickOn(basicSettingsDropdown);
      await this.clickOn(advanceSettingsDropdown);
      await this.clickOn(rolesSettingsDropdown);
      await this.clickOn(voiceArtistSettingsDropdown);
      await this.clickOn(permissionSettingsDropdown);
      await this.clickOn(feedbackSettingsDropdown);
    } else {
      await this.page.waitForSelector(settingsTabSelector, {
        visible: true,
      });
      await this.clickOn(settingsTabSelector);
    }

    await this.page.waitForSelector(settingsContainerSelector, {
      visible: true,
    });
    showMessage('Settings tab is opened successfully.');
  }

  /**
   * Function to open control dropdown so that delete exploration button is visible
   * in mobile view.
   */
  async openExplorationControlDropdown(): Promise<void> {
    await this.page.waitForSelector(explorationControlsSettingsDropdown, {
      visible: true,
    });
    await this.clickOn(explorationControlsSettingsDropdown);

    await this.page.waitForSelector(deleteButtonSelector, {
      visible: true,
    });
  }

  /**
   * Opens the navigation in mobile viewport properly.
   * @param dropdown Dropdown to open. Currently, it only opens
   * the state changes dropdown, but can be extended to open navigation dropdown.
   */
  async openExplorationNavigationInMobile(
    dropdown: 'State Changes' | null
  ): Promise<void> {
    if (!this.isViewportAtMobileWidth()) {
      showMessage('Skipped: Open exploration navigation in mobile view');
    }

    // Open the navigation only if it is not open.
    if (!(await this.isElementVisible(openNavbarIconSelector))) {
      await this.clickOn(mobileOptionsButtonSelector);
      await this.expectElementToBeVisible(`${openNavbarIconSelector}`);
      showMessage('Opened Navigation Menu (mobile).');
    }

    // Open state changes dropdown only if required.
    if (
      dropdown === 'State Changes' &&
      !(await this.isElementVisible(`${stateChangesDropdownSelector}.show`))
    ) {
      await this.clickOn(mobileChangesDropdownSelector);
      await this.expectElementToBeVisible(
        `${stateChangesDropdownSelector}.show`
      );
      showMessage('State Changes Dropdown Opened (mobile).');
    }

    showMessage(`Opened Navigation Menu and ${dropdown} Dropdown.`);
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
        await this.page.waitForSelector(mobileNavbarDropdown, {
          visible: true,
        });
        const element = await this.page.$(mobileNavbarOptions);
        // If the element is not present, it means the mobile navigation bar is not expanded.
        // The option to save changes appears only in the mobile view after clicking on the mobile options button,
        // which expands the mobile navigation bar.
        if (!element) {
          await this.clickOn(mobileOptionsButtonSelector);
        }
        await this.clickOn(mobileChangesDropdownSelector);
        await this.clickOn(mobilePublishButtonSelector);
      } else {
        await this.page.waitForSelector(publishExplorationButtonSelector, {
          visible: true,
        });
        await this.clickOn(publishExplorationButtonSelector);
      }
    };

    const fillExplorationMetadataDetails = async () => {
      await this.clickOn(explorationTitleInput);
      await this.type(explorationTitleInput, title);
      await this.clickOn(explorationGoalInput);
      await this.type(explorationGoalInput, goal);
      await this.clickOn(explorationCategoryDropdown);
      await this.clickOn(category);
      if (tags) {
        await this.type(tagsField, tags);
      }
    };

    const confirmPublish = async (): Promise<string> => {
      await this.clickOn(saveExplorationChangesButton);
      await this.waitForPageToFullyLoad();
      await this.page.waitForSelector(explorationConfirmPublishButton, {
        visible: true,
      });
      await this.clickOn(explorationConfirmPublishButton);
      await this.page.waitForSelector(explorationIdElement);
      const explorationIdUrl = await this.page.$eval(
        explorationIdElement,
        element => (element as HTMLElement).innerText
      );
      const explorationId = explorationIdUrl.replace(/^.*\/explore\//, '');
      await this.waitForElementToStabilize(closePublishedPopUpButton);
      await this.clickOn(closePublishedPopUpButton);

      await this.expectElementToBeVisible(closePublishedPopUpButton, false);
      return explorationId;
    };

    await publishExploration();
    await fillExplorationMetadataDetails();

    try {
      return await confirmPublish();
    } catch (error) {
      showMessage('Failed to publish the exploration.\n' + error.stack);
      await this.waitForPageToFullyLoad();

      const errorSavingExplorationElement = await this.page.$(
        errorSavingExplorationModal
      );
      if (errorSavingExplorationElement) {
        await this.clickOn(errorSavingExplorationModal);
        await this.page.waitForNavigation({
          waitUntil: ['load', 'networkidle0'],
        });
      }
      await publishExploration();
      return await confirmPublish();
    }
  }

  /**
   * Navigate to feedback tab.
   */
  async navigateToFeedbackTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const mobileNavbarElement = await this.page.$(mobileNavbarOptions);
      if (!mobileNavbarElement) {
        await this.clickOn(mobileOptionsButtonSelector);
      }
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobileFeedbackTabButton);
    } else {
      await this.clickOn(feedBackButtonTab);
      await this.waitForNetworkIdle();
    }

    await this.page.waitForSelector(explorationFeedbackTabContentSelector, {
      visible: true,
    });
  }

  /**
   * Fetches the exploration ID from the current URL of the exploration editor page.
   * The exploration ID is the string after '/create/' in the URL.
   */
  async getExplorationId(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/\/create\/(.*?)(\/|#)/);
    if (!match) {
      throw new Error(
        'Exploration ID not found in the URL.' +
          `Ensure you are on the exploration editor page. Found URL: ${url}`
      );
    }
    return match[1];
  }

  /**
   * Function to dismiss exploration editor welcome modal.
   */
  async dismissWelcomeModal(): Promise<void> {
    try {
      await this.page.waitForSelector(dismissWelcomeModalSelector, {
        visible: true,
        timeout: 5000,
      });
      await this.clickOn(dismissWelcomeModalSelector);
      await this.page.waitForSelector(dismissWelcomeModalSelector, {
        hidden: true,
      });
      showMessage('Tutorial pop-up closed successfully.');
    } catch (error) {
      showMessage(`Welcome Modal not found, but test can be continued.
        Error: ${error.message}`);
    }
  }

  /**
   * Function to close editor navigation dropdown. Can be done by clicking
   * on the dropdown toggle.
   */
  async closeEditorNavigationDropdownOnMobile(): Promise<void> {
    try {
      await this.page.waitForSelector(dropdownToggleIcon, {
        visible: true,
        timeout: 5000,
      });
      await this.clickOn(dropdownToggleIcon);

      await this.expectElementToBeVisible(
        openExplorationEditorNavigationMobile,
        false
      );

      showMessage('Editor navigation closed successfully.');
    } catch (error) {
      throw new Error(`Dropdown Toggle Icon not found: ${error.message}`);
    }
  }

  /**
   * Function to dismiss translation tab welcome modal.
   */
  async dismissTranslationTabWelcomeModal(): Promise<void> {
    await this.page.waitForSelector(dismissTranslationWelcomeModalSelector, {
      visible: true,
    });
    await this.clickOn(dismissTranslationWelcomeModalSelector);
    await this.page.waitForSelector(dismissTranslationWelcomeModalSelector, {
      hidden: true,
    });
    showMessage('Translation tutorial pop-up closed successfully.');
  }

  /**
   * Function to add content to a card.
   * @param {string} content - The content to be added to the card.
   */
  async updateCardContent(content: string): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(stateEditSelector, {
      visible: true,
    });
    await this.clickOn(stateEditSelector);
    await this.type(stateContentInputField, `${content}`);
    await this.clickOn(saveContentButton);
    await this.page.waitForSelector(stateContentInputField, {hidden: true});
    showMessage('Card content is updated successfully.');
  }

  /**
   * Function to add an interaction to the exploration.
   * @param {string} interactionToAdd - The interaction type to add to the Exploration.
   * Note: A space is added before and after the interaction name to match the format in the UI.
   */
  async addInteraction(interactionToAdd: string): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(addInteractionButton, {
      visible: true,
    });

    await this.clickOn(addInteractionButton);

    // Change tab based on interaction.
    // Add more conditional tab changes here.
    if (
      INTERACTION_TABS_OF_INTERACTION_TYPE[interactionToAdd] === 'PROGRAMMING'
    ) {
      await this.clickOn(programmingInteractionsButtonSelector);
    } else if (
      INTERACTION_TABS_OF_INTERACTION_TYPE[interactionToAdd] === 'MATH'
    ) {
      await this.clickOn(mathInteractionButtonSelector);
    }
    await this.clickOn(` ${interactionToAdd} `);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage(`${interactionToAdd} interaction has been added successfully.`);
  }

  /**
   * Function to add a multiple choice interaction to the exploration.
   * Any number of options can be added to the multiple choice interaction
   * using the options array.
   * @param options - Array of multiple choice options.
   */
  async addMultipleChoiceInteraction(options: string[]): Promise<void> {
    await this.page.waitForSelector(addInteractionButton, {
      visible: true,
    });
    await this.clickOn(addInteractionButton);
    await this.page.waitForSelector(multipleChoiceInteractionButton, {
      visible: true,
    });
    await this.clickOn(multipleChoiceInteractionButton);

    for (let i = 0; i < options.length - 1; i++) {
      await this.page.waitForSelector(addResponseOptionButton, {visible: true});
      await this.clickOn(addResponseOptionButton);
    }

    const responseInputs = await this.page.$$(stateContentInputField);
    for (let i = 0; i < options.length; i++) {
      await responseInputs[i].type(`${options[i]}`);
    }

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage('Multiple Choice interaction has been added successfully.');
  }

  /**
   * Add a text input interaction to the card.
   */
  async addTextInputInteraction(): Promise<void> {
    await this.page.waitForSelector(addInteractionButton, {
      visible: true,
    });
    await this.clickOn(addInteractionButton);
    await this.page.waitForSelector(textInputInteractionButton, {
      visible: true,
    });
    await this.clickOn(textInputInteractionButton);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage('Text input interaction has been added successfully.');
  }

  /**
   * Update the optional text input interaction content.
   * @param content - The text input interaction content.
   */
  async updateTextInputInteraction(content: string): Promise<void> {
    await this.page.waitForSelector(interactionDiv, {
      visible: true,
    });
    await this.clickOn(interactionDiv);
    await this.clickOn(textInputField);
    await this.type(textInputField, content);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
  }

  /**
   * Adds a math interaction to the current exploration.
   * @param {string} interactionToAdd - The interaction type to add to the exploration.
   */
  async addMathInteraction(interactionToAdd: string): Promise<void> {
    await this.page.waitForSelector(addInteractionButton, {
      visible: true,
    });
    await this.clickOn(addInteractionButton);
    await this.clickOn(mathInteractionsTab);
    await this.clickOn(` ${interactionToAdd} `);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage(`${interactionToAdd} interaction has been added successfully.`);
  }

  /**
   * Function to close the interaction's response modal.
   */
  async closeInteractionResponseModal(): Promise<void> {
    await this.page.waitForSelector(closeResponseModalButton, {visible: true});
    await this.clickOn(closeResponseModalButton);
    await this.page.waitForSelector(closeResponseModalButton, {
      hidden: true,
    });
  }

  /**
   * Adds an Image interaction to the current exploration.
   */
  async addImageInteraction(): Promise<void> {
    await this.page.waitForSelector(addInteractionButton, {
      visible: true,
    });
    await this.clickOn(addInteractionButton);
    await this.clickOn('Image Region');
    await this.clickOn(uploadImageButton);
    await this.uploadFile(imageToUpload);
    await this.clickOn(useTheUploadImageButton);
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector('.btn-danger', {visible: true});

    // Select area of image by clicking and dragging.
    const imageElement = await this.page.$(imageRegionSelector);

    if (imageElement) {
      const box = await imageElement.boundingBox();

      if (box) {
        // Calculate the start and end coordinates for a selection area. The selection starts from a point located at 25% from the top-left corner (both horizontally and vertically) and extends to a point located at 75% from the top-left corner (both horizontally and vertically).This effectively selects the central 50% area of the element.
        const startX = box.x + box.width * 0.25;
        const startY = box.y + box.height * 0.25;
        const endX = box.x + box.width * 0.75;
        const endY = box.y + box.height * 0.75;

        // Click and drag to select an area.
        await this.page.mouse.move(startX, startY);
        await this.page.mouse.down();

        // Add steps for smooth dragging.
        await this.page.mouse.move(endX, endY, {steps: 10});

        await this.page.mouse.up();
      } else {
        console.error('Unable to get bounding box for image element.');
      }
    } else {
      console.error('Image element not found.');
    }

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });

    await this.waitForElementToBeClickable(destinationCardSelector);
    // The '/' value is used to select the 'a new card called' option
    // in the dropdown.
    await this.select(destinationCardSelector, '/');
    await this.type(addStateInput, 'Last Card');
    await this.clickOn(addNewResponseButton);
    await this.clickOn(correctAnswerInTheGroupSelector);

    await this.waitForElementToBeClickable(saveChangesButton);

    showMessage('Image interaction has been added successfully.');
  }

  /**
   * Deletes the previous written title and updates the new title.
   * @param {string} title - The new title to be added to the exploration.
   */
  async updateTitleTo(title: string): Promise<void> {
    await this.page.waitForSelector(addTitleBar, {
      visible: true,
    });
    await this.clearAllTextFrom(addTitleBar);
    await this.type(addTitleBar, title);
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

  /**
   * Matches the expected title with current title.
   */
  async expectTitleToBe(expectedTitle: string): Promise<void> {
    await this.page.waitForSelector(explorationTitleSelector);
    const titleInput = await this.page.$(explorationTitleSelector);
    const currentTitle = await this.page.evaluate(
      input => input.value,
      titleInput
    );

    if (expectedTitle === currentTitle) {
      showMessage('Title matches the expected title.');
    } else {
      throw new Error('Failed to update changes.');
    }
  }

  /**
   * This function Waits for the autosave indicator to appear and then disappear.
   */
  async waitForAutosaveIndicator(): Promise<void> {
    await this.page.waitForSelector(autoSaveIndicator, {
      visible: true,
    });
    await this.page.waitForSelector(autoSaveIndicator, {
      hidden: true,
    });
  }

  /**
   * Clears previous goal and adds a new goal in the exploration.
   */
  async updateGoalTo(goal: string): Promise<void> {
    await this.page.waitForSelector(addGoalInputBox, {
      visible: true,
    });
    await this.clickOn(addGoalInputBox);
    await this.clearAllTextFrom(addGoalInputBox);
    await this.type(addGoalInputBox, goal);
    await this.page.keyboard.press('Tab');

    const addGoalInput = await this.page.$(addGoalInputBox);
    const newGoal = await this.page.evaluate(
      input => input.value,
      addGoalInput
    );
    if (!newGoal || newGoal !== goal) {
      throw new Error(
        `Failed to update goal. Expected: ${goal}, but got: ${newGoal}`
      );
    }
    showMessage(`Goal has been updated to ${goal}`);
  }

  /**
   * Matches the goal with expected goal.
   */
  async expectGoalToBe(expectedGoal: string): Promise<void> {
    try {
      const goalInput = await this.page.$('#explorationObjective');
      if (!goalInput) {
        throw new Error('Goal input element not found.');
      }

      const goal = await this.page.evaluate(input => input.value, goalInput);

      if (goal === expectedGoal) {
        showMessage('The goal has been set for the exploration.');
      } else {
        throw new Error('The goal does not match the expected goal.');
      }
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  }

  /**
   * Selects a category from dropdown. For Eg. Algebra, Biology, Chemistry etc.
   */
  async selectCategory(category: string): Promise<void> {
    await this.page.waitForSelector(categoryDropdown, {
      visible: true,
    });
    await this.clickOn(categoryDropdown);
    await this.clickOn(category);
    await this.expectSelectedCategoryToBe(category);
  }

  /**
   * Checks if the category matches the expected category.
   */
  async expectSelectedCategoryToBe(expectedCategory: string): Promise<void> {
    await this.page.waitForSelector('.mat-select-value');
    const selectedCategory = await this.page.evaluate(() => {
      return (
        document.querySelector('.mat-select-value') as HTMLElement
      ).innerText.trim();
    });
    if (selectedCategory === expectedCategory) {
      showMessage(
        `The category ${selectedCategory} is same as expectedCategory.`
      );
    } else {
      throw new Error('Category is not correct.');
    }
  }

  /**
   * Select language in language selection dropdown.
   * @param language - The language to select.
   */
  async selectLanguage(language: string): Promise<void> {
    // The language dropdown was visible, but it was mostly hidden towards the bottom
    // of the screen. When we clicked on the dropdown, the options did not fully appear,
    // leading to incorrect selections.To prevent this, we are now scrolling the page.
    // We can use 300 - 500px to move the language dropdown to the upper part of the page.
    await this.page.evaluate(() => {
      window.scrollTo(0, 350);
    });

    await this.page.waitForSelector(languageUpdateDropdown, {
      visible: true,
    });
    await this.clickOn(languageUpdateDropdown);
    await this.clickOn(language);
    await this.page.waitForNetworkIdle();

    await this.expectSelectedLanguageToBe(language);
    showMessage(`Language has been set to ${language}.`);
  }

  /**
   *  Verifies that the selected language matches the expected language.
   */
  async expectSelectedLanguageToBe(expectedLanguage: string): Promise<void> {
    await this.page.waitForSelector(languageDropdownValueSelector, {
      visible: true,
    });

    const selectedLanguage = await this.page.evaluate(selector => {
      const element = document.querySelector(selector) as HTMLElement;
      return element?.innerText.trim() ?? '';
    }, languageDropdownValueSelector);

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
   * Adds tags.
   * @param tagNames - List of tags to add
   */
  async addTags(tagNames: string[]): Promise<void> {
    await this.page.waitForSelector(addTagsInputBox, {
      visible: true,
    });
    for (let i = 0; i < tagNames.length; i++) {
      await this.clickOn(addTagsInputBox);
      await this.type(addTagsInputBox, tagNames[i].toLowerCase());
      await this.page.keyboard.press('Tab');
    }

    await this.expectTagsToMatch(tagNames);
  }

  /**
   * Checks if the given tags exists in the tags list.
   * @param expectedTags - List of tags that should to visible.
   */
  async expectTagsToMatch(expectedTags: string[]): Promise<void> {
    // When adding a tag in the exploration settings UI, it gets auto-converted
    // to lowercase by the input field.
    const lowercaseExpectedTags = expectedTags.map(tag => tag.toLowerCase());
    await this.page.waitForSelector('mat-chip-list');
    const observedTags = await this.page.evaluate(() => {
      const tagElements = Array.from(document.querySelectorAll('mat-chip'));
      return tagElements
        .map(tag => {
          const textContent =
            tag.querySelector('.mat-chip-remove')?.previousSibling?.textContent;
          return textContent ? textContent.trim() : '';
        })
        .filter(Boolean);
    });

    for (const expectedTag of lowercaseExpectedTags) {
      if (!observedTags.includes(expectedTag)) {
        throw new Error(`Tag "${expectedTag}" was not added.`);
      }
    }

    showMessage('All expected tags were added successfully.');
  }

  /**
   * Allows you to preview the summary of exploration.
   */
  async previewSummary(): Promise<void> {
    await this.page.waitForSelector(previewSummaryButton, {
      visible: true,
    });
    await this.clickOn(previewSummaryButton);
    await this.expectPreviewSummaryToBeVisible();
    await this.clickOn(dismissPreviewButton);
    await this.page.waitForSelector(dismissPreviewButton, {
      hidden: true,
    });
  }

  /**
   * Verifies that the preview summary is visible.
   */
  async expectPreviewSummaryToBeVisible(): Promise<void> {
    await this.page.waitForSelector(dismissPreviewButton);
    const previewSummary = await this.page.$(dismissPreviewButton);

    if (previewSummary) {
      showMessage('Preview summary is visible.');
    } else {
      throw new Error('Preview summary is not visible.');
    }
  }

  /**
   * Enables Automatic Text-to-Speech switch present in settings tab.
   */
  async enableAutomaticTextToSpeech(): Promise<void> {
    await this.page.waitForSelector(textToSpeechToggle, {
      visible: true,
    });
    await this.clickOn(textToSpeechToggle);
    await this.expectAutomaticTextToSpeechToBeEnabled();
  }

  /**
   * Checks whether the Automatic Text-to-Speech setting is enabled or disabled.
   */
  async expectAutomaticTextToSpeechToBeEnabled(): Promise<void> {
    await this.page.waitForSelector('#text-speech-switch');
    const autoTtsSwitch = await this.page.$('#text-speech-switch');
    const autoTtsSwitchIsOn = await this.page.evaluate(
      switchElement => switchElement.checked,
      autoTtsSwitch
    );
    if (autoTtsSwitchIsOn) {
      showMessage('Automatic Text-to-Speech is enabled.');
    } else {
      throw error('Automatic Text-to-Speech is disabled.');
    }
  }

  /**
   * Assigns a role of manager to any guest user.
   */
  async assignUserToManagerRole(username: string): Promise<void> {
    await this.page.waitForSelector(editRolesButtonSelector, {
      visible: true,
    });
    await this.clickOn(editRoleButton);
    await this.clickOn(addUsernameInputBox);
    await this.type(addUsernameInputBox, username);
    await this.clickOn(addRoleDropdown);
    const [managerOption] = await this.page.$x(
      "//mat-option[contains(., 'Manager (can edit permissions)')]"
    );
    await managerOption.click();
    await this.page.waitForSelector(tagFilterDropdownSelector, {
      hidden: true,
    });
    await this.clickOn(saveRoleButton);
    await this.page.waitForSelector(saveRoleButton, {hidden: true});
    showMessage(`${username} has been added as manager role.`);
  }

  /**
   * Assigns a role of collaborator to any guest user.
   */
  async assignUserToCollaboratorRole(username: string): Promise<void> {
    await this.page.waitForSelector(editRolesButtonSelector, {
      visible: true,
    });
    await this.clickOn(editRoleButton);
    await this.clickOn(addUsernameInputBox);
    await this.type(addUsernameInputBox, username);
    await this.clickOn(addRoleDropdown);
    await this.clickOn(collaboratorRoleOption);
    await this.waitForElementToStabilize(saveRoleButton);
    await this.clickOn(saveRoleButton);
    await this.page.waitForSelector(saveRoleButton, {hidden: true});
    showMessage(`${username} has been added as collaboratorRole.`);
  }

  /**
   * Assigns a role of Playtester to any guest user.
   */
  async assignUserToPlaytesterRole(username: string): Promise<void> {
    await this.page.waitForSelector(editRolesButtonSelector, {
      visible: true,
    });
    await this.clickOn(editRoleButton);
    await this.page.waitForSelector('.e2e-test-editor-role-names', {
      visible: true,
    });
    await this.clickOn(addUsernameInputBox);
    await this.type(addUsernameInputBox, username);
    await this.clickOn(addRoleDropdown);
    await this.clickOn(playtesterRoleOption);
    await this.clickOn(saveRoleButton);
    await this.page.waitForSelector(saveRoleButton, {hidden: true});
    showMessage(`${username} has been added as playtester.`);
  }

  /**
   * Verifies the presence of the publish button.
   */
  async expectExplorationToBePublished(): Promise<void> {
    let publishButtonSelector = '.e2e-test-publish-exploration';
    if (this.isViewportAtMobileWidth()) {
      publishButtonSelector = mobilePublishButtonSelector;
      await this.clickOn(mobileChangesDropdownSelector);
    }
    const publishButton = await this.page.$(publishButtonSelector);
    if (!publishButton) {
      showMessage(
        'Exploration is set to Public and is accessible to Oppia users.'
      );
    } else {
      throw new Error(
        'Exploration is set to Private and is not accessible to Oppia users.'
      );
    }
  }

  /**
   * Choose notification type by enabling/disabling the feedback toggle.
   */
  async optInToEmailNotifications(): Promise<void> {
    await this.page.waitForSelector(feedbackToggle, {
      visible: true,
    });
    await this.clickOn(feedbackToggle);
    await this.expectEmailNotificationsToBeActivated();
  }

  /**
   * Verifies the choice of receiving feedback and suggestion notifications via email.
   */
  async expectEmailNotificationsToBeActivated(): Promise<void> {
    await this.page.waitForSelector('input[id="suggestion-switch"]');
    const input = await this.page.$('input[id="suggestion-switch"]');

    if (!input) {
      throw new Error('Suggestion switch input element not found.');
    }
    const suggestionSwitchIsActive = await input.evaluate(
      input => (input as HTMLInputElement).checked
    );

    if (suggestionSwitchIsActive) {
      showMessage('suggestion notifications via email are enabled.');
    } else {
      throw new Error('suggestion notifications via email are disabled.');
    }
  }

  /**
   * Function to save an exploration draft.
   */
  async saveExplorationDraft(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarOptions);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to save changes appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.page.waitForSelector(mobileOptionsButtonSelector, {
          visible: true,
        });
        await this.clickOn(mobileOptionsButtonSelector);
      }

      await this.page.waitForSelector(
        `${mobileSaveChangesButtonSelector}:not([disabled])`,
        {visible: true}
      );
      await this.clickOn(mobileSaveChangesButtonSelector);
    } else {
      await this.page.waitForSelector(saveChangesButton, {
        visible: true,
      });
      await this.clickOn(saveChangesButton);
    }
    await this.clickOn(commitMessage);
    await this.type(commitMessage, 'Testing Testing');
    await this.clickOn(saveDraftButton);
    await this.page.waitForSelector(saveDraftButton, {hidden: true});

    // Toast message confirms that the draft has been saved.
    await this.page.waitForSelector(toastMessage, {
      visible: true,
    });
    await this.page.waitForSelector(toastMessage, {
      hidden: true,
    });
    showMessage('Exploration is saved successfully.');
    await this.waitForPageToFullyLoad();
  }

  /**
   * Publishes an exploration.
   */
  async publishExploration(): Promise<string | null> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileChangesDropdownSelector, {
        visible: true,
      });
      await this.clickOn(mobileChangesDropdownSelector);
      await this.clickOn(mobilePublishButtonSelector);
    } else {
      await this.page.waitForSelector(publishExplorationButtonSelector, {
        visible: true,
      });
      await this.clickOn(publishExplorationButtonSelector);
    }
    await this.clickOn(explorationConfirmPublishButton);
    await this.page.waitForSelector(closePublishedPopUpButton, {visible: true});

    const explorationUrlAfterPublished = await this.page.url();
    let explorationId = explorationUrlAfterPublished
      .replace(/^.*\/create\//, '')
      .replace(/#\/.*/, '');

    await this.clickOn(closePublishedPopUpButton);
    await this.expectExplorationToBePublished();

    return explorationId;
  }

  /**
   * Discards the current changes.
   */
  async discardCurrentChanges(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileChangesDropdownSelector, {
        visible: true,
      });
      await this.clickOn(mobileChangesDropdownSelector);
      await this.clickOn(mobileDiscardButtonSelector);
    } else {
      await this.page.waitForSelector(discardDraftDropdownSelector, {
        visible: true,
      });
      await this.clickOn(discardDraftDropdownSelector);
      await this.page.waitForSelector(desktopDiscardDraftButton, {
        visible: true,
      });
      await this.clickOn(desktopDiscardDraftButton);
    }
    await this.page.waitForSelector(confirmDiscardButton, {
      visible: true,
    });
    await Promise.all([
      this.clickOn(confirmDiscardButton),
      this.page.waitForNavigation({waitUntil: 'networkidle0'}),
    ]);
    await this.waitForStaticAssetsToLoad();
    await this.expectElementToBeVisible(confirmDiscardButton, false);
  }

  /**
   * Function to display the Oppia responses section.
   */
  async viewOppiaResponses(): Promise<void> {
    await this.page.waitForSelector(stateResponsesSelector, {
      visible: true,
    });
    await this.clickOn(stateResponsesSelector);
    await this.page.waitForSelector(oppiaFeebackEditorContainerSelector, {
      visible: true,
    });
  }

  /**
   * Function to select the card that learners will be directed to from the current card.
   * @param {string} cardName - The name of the card to which learners will be directed.
   */
  async directLearnersToNewCard(cardName: string): Promise<void> {
    await this.page.waitForSelector(openOutcomeDestButton, {
      visible: true,
    });
    await this.clickOn(openOutcomeDestButton);
    await this.waitForElementToBeClickable(destinationCardSelector);
    // The '/' value is used to select the 'a new card called' option in the dropdown.
    await this.select(destinationCardSelector, '/');
    await this.type(addStateInput, cardName);
    await this.clickOn(saveOutcomeDestButton);
    await this.page.waitForSelector(saveOutcomeDestButton, {
      hidden: true,
    });
  }

  /**
   * Updates direct learners option when changing cards.
   * @param cardName - The ard name where learners should be directed.
   */
  async directLearnersToAlreadyExistingCard(cardName: string): Promise<void> {
    await this.page.waitForSelector(openOutcomeDestButton, {
      visible: true,
    });
    await this.clickOn(openOutcomeDestButton);
    await this.waitForElementToBeClickable(destinationCardSelector);
    await this.select(destinationCardSelector, cardName);
    await this.clickOn(saveOutcomeDestButton);
    await this.page.waitForSelector(saveOutcomeDestButton, {
      hidden: true,
    });
  }

  /**
   * Function to navigate to a specific card in the exploration.
   * @param {string} cardName - The name of the card to navigate to.
   */
  async navigateToCard(cardName: string): Promise<void> {
    try {
      let elements;
      if (this.isViewportAtMobileWidth()) {
        await this.page.waitForSelector(mobileStateGraphResizeButton, {
          visible: true,
        });
        await this.clickOn(mobileStateGraphResizeButton);
      }

      await this.page.waitForSelector(stateNodeSelector);
      elements = await this.page.$$(stateNodeSelector);

      const cardNames = await Promise.all(
        elements.map(element =>
          element.$eval('tspan', node => node.textContent)
        )
      );
      // The card name is suffixed with a space to match the format in the UI.
      const cardIndex = cardNames.indexOf(cardName + ' ');

      if (cardIndex === -1) {
        throw new Error(`Card name ${cardName} not found in the graph.`);
      }

      if (this.isViewportAtMobileWidth()) {
        await elements[cardIndex + elements.length / 2].click();
      } else {
        await elements[cardIndex].click();
      }

      await this.waitForNetworkIdle({idleTime: 700});

      const headingName = !cardName.trimEnd().endsWith('...')
        ? cardName
        : cardName.trimEnd().slice(0, -3);
      await this.expectTextContentToContain(
        currentCardNameSelector,
        headingName
      );
    } catch (error) {
      const newError = new Error(
        `Error navigating to card ${cardName}: ${error.message}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Function to add responses to the interactions. Currently, it only handles 'Number Input' interaction type.
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
    destination: string,
    responseIsCorrect: boolean,
    isLastResponse: boolean = true
  ): Promise<void> {
    switch (interactionType) {
      case 'Number Input':
        await this.page.waitForSelector(floatFormInput);
        await this.page.type(floatFormInput, answer);
        break;
      case 'Multiple Choice':
        await this.page.waitForSelector(multipleChoiceResponseDropdown, {
          visible: true,
        });
        await this.clickOn(multipleChoiceResponseDropdown);
        await this.page.waitForSelector(multipleChoiceResponseOption, {
          visible: true,
        });

        await this.page.evaluate(
          (answer, multipleChoiceResponseOption) => {
            const optionElements = Array.from(
              document.querySelectorAll(multipleChoiceResponseOption)
            );
            const element = optionElements.find(
              element => element.textContent?.trim() === answer
            ) as HTMLElement;
            if (element) {
              element.click();
            } else {
              throw new Error(`Cannot find "${answer}" in options.`);
            }
          },
          answer,
          multipleChoiceResponseOption
        );
        break;
      case 'Text Input':
        await this.page.waitForSelector(addResponseOptionButton, {
          visible: true,
        });
        await this.clickOn(addResponseOptionButton);
        await this.page.waitForSelector(textInputInteractionOption);
        await this.page.type(textInputInteractionOption, answer);
        break;
      case 'Fraction Input':
        await this.page.waitForSelector(intEditorField, {
          visible: true,
        });
        await this.clearAllTextFrom(intEditorField);
        await this.type(intEditorField, answer);
        break;
      // Add cases for other interaction types here
      // case 'otherInteractionType':
      //   await this.type(otherFormInput, answer);
      //   break;
      default:
        throw new Error(`Unsupported interaction type: ${interactionType}`);
    }
    await this.clickOn(feedbackEditorSelector);
    await this.type(stateContentInputField, feedback);
    // The '/' value is used to select the 'a new card called' option in the dropdown.
    if (destination) {
      await this.select(destinationCardSelector, '/');
      await this.type(addStateInput, destination);
    }
    if (responseIsCorrect) {
      await this.clickOn(correctAnswerInTheGroupSelector);
    }
    if (isLastResponse) {
      await this.page.waitForSelector(addNewResponseButton, {
        visible: true,
      });
      await this.clickOn(addNewResponseButton);
      await this.page
        .waitForSelector(responseModalHeaderSelector, {
          hidden: true,
        })
        .catch(async () => {
          await this.clickOn(addNewResponseButton);
        });
    } else {
      await this.clickOn(addAnotherResponseButton);
      await this.expectElementToBeClickable(addResponseOptionButton, false);
    }
  }

  // TODO(#22539): This function has a duplicate in exploration-editor.ts.
  // To avoid unexpected behavior, ensure that any modifications here are also
  // made in editDefaultResponseFeedbackInQuestionEditorPage() in question-submitter.ts.
  /**
   * Function to add feedback for default responses of a state interaction.
   * @param {string} defaultResponseFeedback - The feedback for the default responses.
   * @param {string} [directToCard] - The card to direct to (optional).
   * @param {string} [directToCardWhenStuck] - The card to direct to when the learner is stuck (optional).
   */
  async editDefaultResponseFeedbackInExplorationEditorPage(
    defaultResponseFeedback: string,
    directToCard?: string,
    directToCardWhenStuck?: string
  ): Promise<void> {
    await this.page.waitForSelector(defaultFeedbackTab, {
      visible: true,
    });
    await this.clickOn(defaultFeedbackTab);

    if (defaultResponseFeedback) {
      await this.clickOn(openOutcomeFeedBackEditor);
      await this.clickOn(stateContentInputField);
      await this.type(stateContentInputField, `${defaultResponseFeedback}`);
      await this.clickOn(saveOutcomeFeedbackButton);
      await this.expectElementToBeVisible(saveOutcomeFeedbackButton, false);
    }

    if (directToCard) {
      await this.clickOn(openOutcomeDestButton);
      await this.page.select(destinationSelectorDropdown, directToCard);
      await this.page.click(saveDestinationButtonSelector);
      await this.expectElementToBeVisible(saveDestinationButtonSelector, false);
    }

    if (directToCardWhenStuck) {
      await this.clickOn(outcomeDestWhenStuckSelector);
      // The '4: /' value is used to select the 'a new card called' option in the dropdown.
      await this.select(destinationWhenStuckSelectorDropdown, '4: /');
      await this.type(addDestinationStateWhenStuckInput, directToCardWhenStuck);
      await this.page.click(saveStuckDestinationButtonSelector);
      await this.expectElementToBeVisible(
        saveStuckDestinationButtonSelector,
        false
      );
    }
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
    const solutionSelector = isSolutionNumericInput
      ? solutionInputNumeric
      : solutionInputTextArea;
    await this.page.waitForSelector(stateSolutionTab, {visible: true});
    await this.clickOn(addSolutionButton);
    await this.page.waitForSelector(solutionSelector, {visible: true});
    await this.type(solutionSelector, answer);
    await this.page.waitForSelector(`${submitAnswerButton}:not([disabled])`);
    await this.clickOn(submitAnswerButton);
    await this.type(stateContentInputField, answerExplanation);
    await this.page.waitForSelector(`${submitSolutionButton}:not([disabled])`);
    await this.clickOn(submitSolutionButton);
    await this.page.waitForSelector(submitSolutionButton, {
      hidden: true,
    });
  }

  /**
   * Update the solution explanation of the current state card.
   * @param explanation - Updated solution explanation for the state card.
   */
  async updateSolutionExplanation(explanation: string): Promise<void> {
    await this.page.waitForSelector(stateSolutionTab, {visible: true});
    await this.clickOn(stateSolutionTab);
    await this.clickOn(editStateSolutionExplanationSelector);
    await this.type(stateContentInputField, explanation);
    await this.clickOn(saveSolutionEditButton);
    await this.page.waitForSelector(saveSolutionEditButton, {
      hidden: true,
    });
  }

  /**
   * Sets a state as a checkpoint in the exploration.
   */
  async setTheStateAsCheckpoint(): Promise<void> {
    await this.page.waitForSelector(setAsCheckpointButton, {
      visible: true,
    });

    let checkboxState = await this.page.$eval(
      `${setAsCheckpointButton} input.mat-checkbox-input`,
      el => (el as HTMLInputElement).checked
    );

    if (!checkboxState) {
      await this.clickOn(setAsCheckpointButton);
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
   * Function to add a hint for a state card.
   * @param {string} hint - The hint to be added for the current card.
   */
  async addHintToState(hint: string): Promise<void> {
    await this.page.waitForSelector(addHintButton, {
      visible: true,
    });
    await this.clickOn(addHintButton);
    await this.type(stateContentInputField, hint);
    await this.clickOn(saveHintButton);
    await this.page.waitForSelector(saveHintButton, {
      hidden: true,
    });
  }

  /**
   * Function to edit a hint for a state card.
   * @param hint - The updated hint content for the current card.
   */
  async updateHint(hint: string): Promise<void> {
    await this.page.waitForSelector(stateHintTab, {
      visible: true,
    });
    await this.clickOn(stateHintTab);
    await this.clickOn(editStateHintSelector);
    await this.type(stateContentInputField, hint);
    await this.clickOn(saveHintEditButton);
    await this.page.waitForSelector(saveHintEditButton, {
      hidden: true,
    });
  }

  /**
   * Tag an answer response group with a misconception for a state card.
   * @param responseIndex - The index of the response group to be tagged.
   * @param misconceptionName - The name of the misconception to tag response with.
   * @param isOptional - Whether the misconception is optional or compulsory.
   */
  async tagAnswerGroupWithMisconception(
    responseIndex: number,
    misconceptionName: string,
    isOptional: boolean
  ): Promise<void> {
    let expectedTitle = !isOptional
      ? misconceptionName
      : `(Optional) ${misconceptionName}`;
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(responseGroupDiv);
      // If the responses were collapsed in mobile view.
      if (!element) {
        await this.clickOn(toggleResponseTab);
      }
    }
    await this.page.waitForSelector(responseGroupDiv, {
      visible: true,
    });
    let responseTabs = await this.page.$$(responseGroupDiv);

    await responseTabs[responseIndex].click();
    await this.clickOn('Tag with misconception');

    await this.page.waitForSelector(misconceptionTitle, {
      timeout: 5000,
      visible: true,
    });
    const misconceptionTitles = await this.page.$$(misconceptionTitle);
    for (const misconceptionTitle of misconceptionTitles) {
      const title = await this.page.evaluate(
        el => el.textContent,
        misconceptionTitle
      );
      if (title.trim() === expectedTitle) {
        await misconceptionTitle.click();
      }
    }

    await this.clickOn('Done');
    await this.page.waitForSelector(leaveTranslationsAsIsButton, {
      visible: true,
    });
    await this.clickOn(leaveTranslationsAsIsButton);
    await this.page.waitForSelector(leaveTranslationsAsIsButton, {
      hidden: true,
    });
  }

  /**
   * Replace a misconception tagged to a response group with a new one.
   * @param responseIndex - The index of the response group to change.
   * @param misconceptionName - The name of the new misconception to be tagged.
   * @param isOptional - Whether the new misconception is optional or not.
   */
  async changeTaggedAnswerGroupMisconception(
    responseIndex: number,
    misconceptionName: string,
    isOptional: boolean
  ): Promise<void> {
    let expectedTitle = !isOptional
      ? misconceptionName
      : `(Optional) ${misconceptionName}`;
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(responseGroupDiv);
      // If the responses were collapsed in mobile view.
      if (!element) {
        await this.clickOn(toggleResponseTab);
      }
    }
    await this.page.waitForSelector(responseGroupDiv, {
      visible: true,
    });
    let responseTabs = await this.page.$$(responseGroupDiv);
    await responseTabs[responseIndex].click();
    await this.clickOn(misconceptionEditorTab);
    await this.page.waitForSelector(misconceptionTitle, {
      timeout: 5000,
      visible: true,
    });
    const misconceptionTitles = await this.page.$$(misconceptionTitle);
    for (const misconceptionTitle of misconceptionTitles) {
      const title = await this.page.evaluate(
        el => el.textContent,
        misconceptionTitle
      );
      if (title.trim() === expectedTitle) {
        await misconceptionTitle.click();
      }
    }
    await this.clickOn('Save Misconception');
    await this.page.waitForSelector(leaveTranslationsAsIsButton, {
      visible: true,
    });
    await this.clickOn(leaveTranslationsAsIsButton);
    await this.page.waitForSelector(leaveTranslationsAsIsButton, {
      hidden: true,
    });
  }

  /**
   * Verifies if a misconception is present on the page.
   * @param {string} misconceptionName - The name of the misconception to verify.
   * @param {boolean} isPresent - Whether the misconception is expected to be present.
   */
  async verifyMisconceptionPresentForState(
    misconceptionName: string,
    isPresent: boolean
  ): Promise<void> {
    try {
      if (this.isViewportAtMobileWidth()) {
        const element = await this.page.$(responseGroupDiv);
        // If the responses were collapsed in mobile view.
        if (!element) {
          await this.clickOn(toggleResponseTab);
        }
      }
      await this.page.waitForSelector(misconceptionDiv, {
        timeout: 5000,
        visible: true,
      });
      const misconceptions = await this.page.$$(misconceptionDiv);

      for (const misconception of misconceptions) {
        const title = await this.page.evaluate(
          el => el.textContent,
          misconception
        );
        if (title.trim() === misconceptionName) {
          if (!isPresent) {
            throw new Error(
              `The misconception ${misconceptionName} is present, should be absent.`
            );
          }
          return;
        }
      }

      if (isPresent) {
        throw new Error(
          `The misconception ${misconceptionName} is not present.`
        );
      }
    } catch (error) {
      if (isPresent) {
        throw new Error('No misconceptions found.');
      }
    }

    showMessage(
      `The misconception is ${isPresent ? '' : 'not'} present as expected.`
    );
  }

  /**
   * Toggles the applicability status of an optional misconception.
   * @param misconceptionName - The name of the misconception to be toggled.
   */
  async toggleMisconceptionApplicableStatus(
    misconceptionName: string
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(responseGroupDiv);
      // If the responses were collapsed in mobile view.
      if (!element) {
        await this.clickOn(toggleResponseTab);
      }
    }
    await this.page.waitForSelector(optionalMisconceptionDiv, {
      timeout: 5000,
      visible: true,
    });
    let misconceptions = await this.page.$$(optionalMisconceptionDiv);
    let misconceptionFound = false;
    for (const misconception of misconceptions) {
      const optionalMisconceptionName = await misconception.evaluate(el =>
        el.textContent?.trim()
      );
      if (optionalMisconceptionName?.startsWith(misconceptionName)) {
        const misconceptionOptions = await misconception.$(
          optionalMisconceptionOptionsButton
        );
        if (!misconceptionOptions) {
          throw new Error(
            `Options not found for misconception "${misconceptionName}"`
          );
        }
        await misconceptionOptions.click();
        await this.page.waitForSelector(misconceptionApplicableToggle, {
          visible: true,
        });
        await this.clickOn(misconceptionApplicableToggle);
        misconceptionFound = true;
        break;
      }
    }
    if (!misconceptionFound) {
      throw new Error(
        `Couldn't find misconception with name ${misconceptionName}.`
      );
    }
  }

  /**
   * Verifies whether a given optional misconception is applicable or not.
   * @param misconceptionName - The name of the misconception to be verified.
   * @param isApplicable - The expected applicability status of the misconception.
   */
  async verifyOptionalMisconceptionApplicableStatus(
    misconceptionName: string,
    isApplicable: boolean
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(responseGroupDiv);
      // If the responses were collapsed in mobile view.
      if (!element) {
        await this.clickOn(toggleResponseTab);
      }
    }
    if (!isApplicable) {
      await this.page.waitForSelector(inapplicableMisconceptionDiv);
    }

    const inapplicableMisconceptions = await this.page.$$(
      inapplicableMisconceptionDiv
    );

    for (const misconception of inapplicableMisconceptions) {
      const title = await this.page.evaluate(
        el => el.textContent.trim(),
        misconception
      );
      if (title === misconceptionName && !isApplicable) {
        return;
      } else if (title.startsWith(misconceptionName) && isApplicable) {
        // We use startsWith since misconception title divs can have an icon at
        // the end indicating that the misconception needs to be addressed.
        throw new Error(
          `The misconception ${misconceptionName} is expected to be applicable, found not applicable.`
        );
      }
    }

    showMessage(
      `The misconception is ${isApplicable ? '' : 'not'} applicable as expected.`
    );
  }

  /**
   * Function to navigate to the preview tab.
   */
  async navigateToPreviewTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileNavbarDropdown, {
        visible: true,
      });
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobilePreviewTabButton);
    } else {
      await this.page.waitForSelector(previewTabButton, {
        visible: true,
      });
      await this.clickOn(previewTabButton);
    }

    await this.expectElementToBeVisible(previewTabContainer);
  }

  /**
   * Function to navigate to the history tab.
   */
  async navigateToHistoryTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobileHistoryTabButton);
    } else {
      await this.clickOn(historyTabButton);
    }

    await this.expectElementToBeVisible(historyTabContentContainerSelector);
  }

  /**
   * Gets the list of existing files for the given version.
   * @param {number} version - The expected version number.
   * @param {boolean} isPublished - Whether the exploration is published.
   * @returns {string[]} - List of matching file names.
   */
  async getExistingVersionFiles(
    version: number,
    isPublished: boolean
  ): Promise<string[]> {
    const filePrefix = isPublished
      ? PUBLISHED_EXPLORATION_ZIP_FILE_PREFIX
      : UNPUBLISHED_EXPLORATION_ZIP_FILE_PREFIX;

    const files = fs.readdirSync(downloadPath);
    return files.filter(file =>
      file.match(new RegExp(`^${filePrefix}${version}( \\(\\d+\\))?\\.zip$`))
    );
  }

  /**
   * Generates the expected filename based on the existing count.
   * @param {number} version - The version number.
   * @param {boolean} isPublished - Whether the exploration is published.
   * @param {number} fileCount - The number of existing files.
   * @returns {string} - The expected filename.
   */
  getExpectedFileName(
    version: number,
    isPublished: boolean,
    fileCount: number
  ): string {
    const filePrefix = isPublished
      ? PUBLISHED_EXPLORATION_ZIP_FILE_PREFIX
      : UNPUBLISHED_EXPLORATION_ZIP_FILE_PREFIX;
    return fileCount === 0
      ? `${filePrefix}${version}.zip`
      : `${filePrefix}${version} (${fileCount}).zip`;
  }

  /**
   * Function to download a specific version of Exploration.
   * @param {number} explorationVersion - The version of the exploration to download.
   * @param {boolean} isExplorationPublished - Whether the Exploration is published.
   */
  async downloadExploration(
    explorationVersion: number,
    isExplorationPublished: boolean
  ): Promise<void> {
    await this.expectElementToBeVisible(historyListContent);
    const historyItems = await this.page.$$(historyListContent);
    for (const historyItem of historyItems) {
      const versionNumberElement = await historyItem.$(historyTableIndex);
      const versionText = await this.page.evaluate(
        element => element.textContent,
        versionNumberElement
      );

      // Check whether the current exploration version matches the given explorationVersion.
      if (parseInt(versionText, 10) === explorationVersion) {
        // Count existing files with same name before downloading.
        const existingFiles = await this.getExistingVersionFiles(
          explorationVersion,
          isExplorationPublished
        );
        const nextNumber = existingFiles.length;
        const expectedFileName = await this.getExpectedFileName(
          explorationVersion,
          isExplorationPublished,
          nextNumber
        );

        const dropdownButton = await historyItem.$(historyListOptions);
        await this.page.evaluate(el => el.click(), dropdownButton);
        await this.page.waitForTimeout(1000);
        const downloadButton = await historyItem.$(downloadExplorationButton);
        await this.page.evaluate(el => el.click(), downloadButton);
        await this.page.waitForTimeout(5000);
        const downloadedFile =
          await this.waitForExplorationDownload(expectedFileName);
        if (downloadedFile) {
          showMessage(`${downloadedFile} file is successfully downloaded`);
          return;
        } else {
          throw new Error(
            `Download failed for Exploration version: ${explorationVersion}`
          );
        }
      }
    }
  }

  /**
   * Waits for a downloaded file to appear and cleans up only the new one.
   * @param {string} expectedFileName - The expected file name.
   * @returns {Promise<string | null>} - The verified file name or null if not found.
   */
  async waitForExplorationDownload(
    expectedFileName: string
  ): Promise<string | null> {
    // Wait for network to be idle after triggering the download.
    await this.page.waitForNetworkIdle();
    const files = fs.readdirSync(downloadPath);
    const downloadedFile =
      files.find(file => file === expectedFileName) || null;
    if (
      downloadedFile &&
      fs.existsSync(path.join(downloadPath, downloadedFile))
    ) {
      fs.unlinkSync(path.join(downloadPath, downloadedFile));
    }
    return downloadedFile;
  }

  /**
   * Expands the specified settings tab section.
   * Currently it only expands Basic Settings, Advanced Features, Roles, and Voice Artists.
   * @param section - The name of the section to expand.
   */
  async expandSettingsTabSection(
    section: 'Basic Settings' | 'Advanced Features' | 'Roles' | 'Voice Artists'
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
    await this.page.click(sectionHeaderSelector);
    await this.expectElementToBeVisible(sectionContentSelector);
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
        await this.clickOn(mobileOptionsButtonSelector);
      }
      await this.page.waitForSelector(mobileNavbarDropdown, {
        visible: true,
      });
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickAndWaitForNavigation(mobileTranslationTabButton);
    } else {
      await this.page.waitForSelector(translationTabButton, {
        visible: true,
      });
      await this.clickAndWaitForNavigation(translationTabButton);
    }

    await this.expectElementToBeVisible(translationTabContainer);
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
        await this.clickOn(mobileOptionsButtonSelector);
      }
      await this.page.waitForSelector(mobileNavbarDropdown, {
        visible: true,
      });
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobileMainTabButton);
    } else {
      await this.page.waitForSelector(mainTabButton, {
        visible: true,
      });
      await this.clickOn(mainTabButton);
    }

    await this.expectElementToBeVisible(mainTabContainerSelector);
  }

  /**
   * Function to verify if the preview is on a particular card by checking the content of the card.
   * @param {string} cardName - The name of the card to check.
   * @param {string} expectedCardContent - The expected text content of the card.
   */
  async expectPreviewCardContentToBe(
    cardName: string,
    expectedCardContent: string
  ): Promise<void> {
    await this.page.waitForSelector(stateConversationContent, {
      visible: true,
    });
    const element = await this.page.$(stateConversationContent);
    const cardContent = await this.page.evaluate(
      element => element.textContent,
      element
    );
    if (cardContent !== expectedCardContent) {
      throw new Error(
        `Preview is not on the ${cardName} card or is not loading correctly.`
      );
    }
    showMessage(`Preview is on the ${cardName} card and is loading correctly.`);
  }

  /**
   * Function to navigate to the next card in the preview tab.
   */
  async continueToNextCard(): Promise<void> {
    try {
      await this.page.waitForSelector(nextCardButton, {timeout: 7000});
      await this.clickOn(nextCardButton);
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        await this.clickOn(nextCardArrowButton);
      } else {
        throw error;
      }
    }

    await this.page.waitForSelector(previousCardButton, {
      visible: true,
    });
  }

  /**
   * Function to submit an answer to a form input field.
   *
   * This function first determines the type of the input field in the DOM using the getInputType function.
   * Currently, it only supports 'text', 'number', and 'float' input types. If the input type is anything else, it throws an error.
   * @param {string} answer - The answer to submit.
   */
  async submitAnswer(answer: string): Promise<void> {
    await this.waitForElementToBeClickable(floatFormInput);
    const inputType = await this.getInputType(floatFormInput);

    switch (inputType) {
      case 'text':
      case 'number':
      case 'float':
        await this.page.waitForSelector(floatFormInput);
        await this.page.type(floatFormInput, answer);
        break;
      default:
        throw new Error(`Unsupported input type: ${inputType}`);
    }

    await this.clickOn(submitAnswerButton);
  }

  /**
   * Function to Get the type of an input field in the DOM.
   * @param {string} selector - The CSS selector for the input field.
   */
  async getInputType(selector: string): Promise<string> {
    const inputField = await this.page.$(selector);
    if (!inputField) {
      throw new Error(`Input field not found for selector: ${selector}`);
    }
    const inputType = (await (
      await inputField.getProperty('type')
    ).jsonValue()) as string;
    return inputType;
  }

  /**
   * Function to verify if the exploration is completed in the preview tab via checking the toast message.
   * @param {string} message - The expected toast message.
   */
  async expectPreviewCompletionToastMessage(message: string): Promise<void> {
    await this.page.waitForSelector(explorationCompletionToastMessage, {
      visible: true,
    });
    const element = await this.page.$(explorationCompletionToastMessage);
    const toastMessage = await this.page.evaluate(
      element => element.textContent,
      element
    );
    if (!toastMessage || !toastMessage.includes(message)) {
      throw new Error('Exploration did not complete successfully');
    }
    showMessage('Exploration has completed successfully');
    await this.page.waitForSelector(explorationCompletionToastMessage, {
      hidden: true,
    });
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
        await this.clickOn(mobileOptionsButtonSelector);
      }
    }
    await this.page.waitForSelector(previewRestartButton, {
      visible: true,
    });
    await this.clickOn(previewRestartButton);

    await this.waitForNetworkIdle();
    await this.page.waitForSelector(previousCardButton, {
      hidden: true,
    });
  }

  /**
   * Function for creating an exploration with only EndExploration interaction with given title.
   * @param {boolean} flag - Determines whether to dismiss the welcome modal.
   */
  async createAndPublishAMinimalExplorationWithTitle(
    title: string,
    category: string = 'Algebra',
    flag: boolean = true
  ): Promise<string> {
    await this.navigateToCreatorDashboardPage();
    await this.navigateToExplorationEditorFromCreatorDashboard();
    if (flag) {
      await this.dismissWelcomeModal();
    }
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
   * This function creates simple Programming Exploration.
   * Starts at new Exploration Editor Page.
   * Ends at same page, after adding programming interaction and saving the
   * draft.
   */
  async createSimpleProgrammingExploration(): Promise<string | null> {
    // Check if element to add interaction is visible (pre-check)
    await this.page.waitForSelector(stateEditSelector, {
      visible: true,
    });

    await this.createMinimalExploration(
      'This is a test Programming Exploration',
      INTERACTION_TYPES.CODE_EDITOR
    );

    const lastInteraction = 'Last Card';
    await this.waitForElementToBeClickable(destinationCardSelector);
    await this.select(destinationCardSelector, '/');
    await this.type(addStateInput, lastInteraction);
    await this.clickOn(addNewResponseButton);
    await this.clickOn(correctAnswerInTheGroupSelector);

    await this.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await this.navigateToCard(lastInteraction);
    await this.createMinimalExploration(
      'This is last card',
      INTERACTION_TYPES.END_EXPLORATION
    );

    await this.saveExplorationDraft();
    const explorationId = await this.publishExplorationWithMetadata(
      'Simple Code Editor',
      'This is goal here',
      'Algebra'
    );

    // Check if publish button is disabled (post-check)
    const publishButton = await this.page.$(saveChangesButton);
    const isDisabled = await this.page.evaluate(
      el => el.disabled,
      publishButton
    );

    if (isDisabled) {
      showMessage('Publish Button is disabled, as expected');
    } else {
      showMessage(
        'Publish Button is enabled and clickable, expected to be disabled'
      );
      throw new Error('Publish Button is enabled and clickable');
    }

    return explorationId;
  }

  /**
   * Function for creating an exploration with two cards.
   */
  async createAndPublishExplorationWithCards(
    explorationTitle: string,
    category: string = 'Mathematics'
  ): Promise<string> {
    await this.navigateToCreatorDashboardPage();
    await this.navigateToExplorationEditorFromCreatorDashboard();
    await this.dismissWelcomeModal();

    await this.updateCardContent('Content 0');
    await this.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
    await this.viewOppiaResponses();
    await this.directLearnersToNewCard('Card 1');
    await this.saveExplorationDraft();

    await this.navigateToCard('Card 1');
    await this.updateCardContent('Content 1');
    await this.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await this.navigateToCard('Introduction');
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
   * This function checks the number of subscribers in the Subscribers tab of the creator dashboard.
   */
  async expectNumberOfSubscribersToBe(subscriberCount: number): Promise<void> {
    await this.page.waitForSelector(subscriberCountLabel);
    const currentSubscriberCount = await this.page.$eval(
      subscriberCountLabel,
      element => element.textContent
    );

    if (
      currentSubscriberCount &&
      parseInt(currentSubscriberCount) === subscriberCount
    ) {
      showMessage(`Number of subscribers is equal to ${subscriberCount}.`);
    } else {
      throw new Error(
        `Number of subscribers is not equal to ${subscriberCount}.`
      );
    }
  }

  /**
   * Function for opening the subscribers tab.
   */
  async openSubscribersTab(): Promise<void> {
    if (this.page.url() !== creatorDashboardPage) {
      await this.navigateToCreatorDashboardPage();
    }

    await this.clickOn(subscriberTabButton);
    await this.page.waitForSelector('.e2e-test-subscription-card');
  }

  /**
   * This function checks whether given user is a subscriber or not.
   */
  async expectUserToBeASubscriber(username: string): Promise<void> {
    let truncatedUsername = username;
    if (username.length > 10) {
      const ellipsis = '...';
      truncatedUsername =
        username.substring(0, 10 - ellipsis.length) + ellipsis;
    }

    const subscribers = await this.page.$$(subscriberCard);

    if (subscribers.length === 0) {
      throw new Error(`User "${username}" is not subscribed.`);
    }

    const subscriberUsername = await subscribers[0].$eval(
      '.e2e-test-subscription-name',
      element => (element as HTMLElement).textContent?.trim()
    );

    if (truncatedUsername === subscriberUsername) {
      showMessage(`User ${username} is a subscriber.`);
    } else {
      throw new Error(`User ${username} is not a subscriber.`);
    }
  }

  /**
   * Navigates to the exploration page and starts playing the exploration.
   * @param {string} explorationId - The ID of the exploration to play.
   */
  async playExploration(explorationId: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({waitUntil: ['load', 'networkidle0']}),
      this.goto(`${baseUrl}/explore/${explorationId}`),
    ]);
  }

  /**
   * Gives feedback on the exploration.
   * @param {string} feedback - The feedback to give on the exploration.
   */
  async giveFeedback(feedback: string, stayAnonymous?: boolean): Promise<void> {
    // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
    // in mobile viewport which is required for testing the feedback messages tab),
    // remove this part of skipping this function for Mobile viewport and make it run in mobile viewport
    // as well. see: https://github.com/oppia/oppia/issues/19443.
    if (process.env.MOBILE === 'true') {
      return;
    }
    await this.page.waitForSelector('nav-options', {visible: true});
    await this.clickOn(feedbackPopupSelector);
    await this.page.waitForSelector(feedbackTextarea, {visible: true});
    await this.type(feedbackTextarea, feedback);

    // If stayAnonymous is true, clicking on the "stay anonymous" checkbox.
    if (stayAnonymous) {
      await this.clickOn(stayAnonymousCheckbox);
    }

    await this.clickOn('Submit');

    try {
      await this.page.waitForFunction(
        'document.querySelector(".oppia-feedback-popup-container") !== null',
        {timeout: 5000}
      );
      showMessage('Feedback submitted successfully');
    } catch (error) {
      throw new Error('Feedback was not successfully submitted');
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
    await this.clickOn(voiceoverLanguageSelector);

    await this.expectElementToBeVisible(voiceoverLanguageOptionSelector);
    const languageOptions = await this.page.$$(voiceoverLanguageOptionSelector);

    for (const option of languageOptions) {
      const textContent = await option.evaluate(
        el => el.textContent?.trim() || ''
      );
      if (textContent === language) {
        await option.click();
        break;
      }
    }

    await this.page.waitForSelector(translationModeButton);
    await this.clickOn(translationModeButton);
    const activeContentType = await this.page.$eval(activeTranslationTab, el =>
      el.textContent?.trim()
    );
    if (!activeContentType?.includes(contentType)) {
      showMessage(
        `Switching content type from ${activeContentType} to ${contentType}`
      );
      await this.clickOn(contentType);
    }
    await this.clickOn(editTranslationSelector);
    switch (contentType) {
      case 'Content':
      case 'Hint':
      case 'Solution':
        await this.clickOn(stateContentInputField);
        await this.type(stateContentInputField, translation);
        break;
      case 'Interaction':
        await this.clickOn(stateTranslationEditorSelector);
        await this.type(stateTranslationEditorSelector, translation);
        break;
      case 'Feedback':
        await this.clickOn(`.e2e-test-feedback-${feedbackIndex}`);
        await this.clickOn(editTranslationSelector);
        await this.clickOn(stateContentInputField);
        await this.type(stateContentInputField, translation);
        break;
      default:
        throw new Error(`Invalid content type: ${contentType}`);
    }
    await this.clickOn(saveTranslationButton);

    await this.waitForNetworkIdle();
    await this.expectElementToBeVisible(saveTranslationButton, false);
  }

  /**
   * Open the "modify existing translations" modal after editing a piece of content that has already been
   * translated, when presented with the choices of what shall be done with the translation.
   */
  async openModifyExistingTranslationsModal(): Promise<void> {
    await this.page.waitForSelector(modifyExistingTranslationsButton, {
      visible: true,
    });
    await this.clickOn(modifyExistingTranslationsButton);
    await this.waitForNetworkIdle();

    await this.page.waitForSelector(modifyTranslationModalSelector, {
      visible: true,
    });
  }

  /**
   * Verify if a particular translation exists in the translation modification modal after opening it.
   * @param languageCode - The language code of the translation to check.
   * @param expectedTranslation - The expected translation for the language to check.
   */
  async verifyTranslationInModifyTranslationsModal(
    languageCode: string,
    expectedTranslation: string
  ): Promise<void> {
    await this.page.waitForSelector(
      `div.e2e-test-translation-${languageCode}`,
      {visible: true}
    );

    const translationElementText = await this.page.evaluate(languageCode => {
      const element = document.querySelector(
        `div.e2e-test-translation-${languageCode}`
      );
      return element ? element.textContent : null;
    }, languageCode);

    if (translationElementText === expectedTranslation) {
      showMessage('The expected translation exists in the modal.');
    } else {
      throw new Error(
        `The expected translation does not exist in the modal. Found "${translationElementText}", expected "${expectedTranslation}"`
      );
    }
  }

  /**
   * Update a specific translation from the "modify translations" modal after it has opened.
   * @param languageCode - The language code for which the translation should be modified.
   * @param contentType - Type of the content such as "Interaction" or "Hint".
   * @param newTranslation - The new translation to be written for the content in given language.
   */
  async updateTranslationFromModal(
    languageCode: string,
    contentType: string,
    newTranslation: string
  ): Promise<void> {
    await this.clickOn(`.e2e-test-${languageCode}-translation-edit`);
    switch (contentType) {
      case 'Content':
      case 'Hint':
      case 'Solution':
      case 'Feedback':
        await this.clickOn(stateContentInputField);
        await this.page.evaluate(selector => {
          document.querySelector(selector).textContent = '';
        }, `${stateContentInputField} p`);
        await this.type(stateContentInputField, newTranslation);
        break;
      case 'Interaction':
        await this.clickOn(stateTranslationEditorSelector);
        await this.page.evaluate(selector => {
          document.querySelector(selector).value = '';
        }, `${textInputField}`);
        await this.type(stateTranslationEditorSelector, newTranslation);
        break;
      default:
        throw new Error(`Invalid content type: ${contentType}`);
    }

    await this.clickOn(modalSaveButton);
    await this.clickOn(modifyTranslationsModalDoneButton);

    await this.page.waitForSelector(modifyTranslationsModalDoneButton, {
      hidden: true,
    });
    showMessage('Successfully updated translation from modal.');
  }

  /**
   * Verify if a particular translation exists in the translations tab.
   * @param {string} expectedTranslation - The translation which should exist for the content.
   * @param {string} contentType - Type of the content such as "Interaction" or "Hint".
   * @param {number} feedbackIndex - The index of the feedback to edit, since multiple feedback responses exist.
   */
  async verifyTranslationInTranslationsTab(
    expectedTranslation: string,
    contentType: string,
    feedbackIndex?: number
  ): Promise<void> {
    let translation: string | null = '';
    await this.navigateToTranslationsTab();
    await this.clickOn(translationModeButton);

    const activeContentType = await this.page.$eval(activeTranslationTab, el =>
      el.textContent?.trim()
    );

    if (!activeContentType?.includes(contentType)) {
      showMessage(
        `Switching content type from ${activeContentType} to ${contentType}`
      );
      await this.clickOn(contentType);
    }

    await this.clickOn(editTranslationSelector);
    switch (contentType) {
      case 'Content':
      case 'Hint':
      case 'Solution':
        translation = await this.page.$eval(
          stateContentInputField,
          el => el.textContent
        );
        break;
      case 'Interaction':
        translation = await this.page.$eval(
          textInputField,
          el => (el as HTMLInputElement).value
        );
        break;
      case 'Feedback':
        await this.clickOn(`.e2e-test-feedback-${feedbackIndex}`);
        await this.clickOn(editTranslationSelector);
        translation = await this.page.$eval(
          stateContentInputField,
          el => el.textContent
        );
        break;
      default:
        throw new Error(`Invalid content type: ${contentType}`);
    }

    if (translation === expectedTranslation) {
      showMessage(
        'The newly updated translation exists in the translations tab.'
      );
    } else {
      throw new Error(
        `The expected translation does not exist in the translations tab. Found "${translation}", expected "${expectedTranslation}"`
      );
    }
  }

  /**
   * Function to add a voiceover for specific content of the current card.
   * @param {string} language - Language for which the voiceover has to be added.
   * @param {string} languageAccent - Language accent for which the voiceover has to be added.
   * @param {string} contentType - Type of the content such as "Interaction" or "Hint"
   * @param {string} voiceoverFilePath - The path of the voiceover file which will be added for the content.
   * @param {number} feedbackIndex - The index of the feedback to edit, since multiple feedback responses exist.
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
      await this.clickOn(contentType);
    }

    await this.clickOn(voiceoverLanguageSelector);
    await this.page.waitForSelector(voiceoverLanguageOptionSelector);
    const languageOptions = await this.page.$$(voiceoverLanguageOptionSelector);

    for (const option of languageOptions) {
      const textContent = await option.evaluate(
        el => el.textContent?.trim() || ''
      );
      if (textContent === language) {
        await option.click();
        break;
      }
    }

    await this.clickOn(voiceoverLanguageAccentSelector);
    await this.page.waitForSelector(voiceoverLanguageAccentOptionSelector);
    const languageAccentOptions = await this.page.$$(
      voiceoverLanguageAccentOptionSelector
    );

    for (const option of languageAccentOptions) {
      const textContent = await option.evaluate(
        el => el.textContent?.trim() || ''
      );
      if (textContent === languageAccent) {
        await option.click();
        break;
      }
    }

    await this.clickOn(addManualVoiceoverButton);
    await this.uploadFile(voiceoverFilePath);
    await this.clickOn(saveUploadedAudioButton);
    await this.waitForNetworkIdle();

    await this.page.waitForSelector(saveUploadedAudioButton, {
      hidden: true,
    });
  }

  /**
   * Function to add a voiceover for specific content of the current card.
   * @param {string} language - Language for which the voiceover has to be added.
   * @param {string} languageAccent - Language accent for which the voiceover has to be added.
   * @param {string} contentType - Type of the content such as "Interaction" or "Hint".
   */
  async regenerateVoiceoverForContent(
    language: string,
    languageAccent: string,
    contentType: string
  ): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(activeTranslationTab, {
      visible: true,
    });

    const activeContentType = await this.page.$eval(activeTranslationTab, el =>
      el.textContent?.trim()
    );
    if (!activeContentType?.includes(contentType)) {
      showMessage(
        `Switching content type from ${activeContentType} to ${contentType}`
      );
      await this.clickOn(contentType);
    }

    await this.clickOn(voiceoverLanguageSelector);
    await this.page.waitForSelector(voiceoverLanguageOptionSelector);
    const languageOptions = await this.page.$$(voiceoverLanguageOptionSelector);

    for (const option of languageOptions) {
      const textContent = await option.evaluate(
        el => el.textContent?.trim() || ''
      );
      if (textContent === language) {
        await option.click();
        break;
      }
    }

    await this.clickOn(voiceoverLanguageAccentSelector);
    await this.page.waitForSelector(voiceoverLanguageAccentOptionSelector);
    const languageAccentOptions = await this.page.$$(
      voiceoverLanguageAccentOptionSelector
    );

    for (const option of languageAccentOptions) {
      const textContent = await option.evaluate(
        el => el.textContent?.trim() || ''
      );
      if (textContent === languageAccent) {
        await option.click();
        break;
      }
    }

    await this.clickOn(regenerateAutomaticVoiceoverButton);

    await this.page.waitForSelector(voiceoverConfirmationModalButton, {
      visible: true,
      timeout: 5000,
    });

    await this.clickOn(voiceoverConfirmationModalButton);

    await this.page.waitForSelector(voiceoverConfirmationModalButton, {
      hidden: true,
    });

    showMessage('Voiceover has been successfully regenerated.');
    await this.waitForNetworkIdle();
  }

  /**
   * Function to create and save a new untitled exploration containing only the EndExploration interaction.
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
   * Function to verify the average rating and the number of users who submitted ratings.
   * @param {number} expectedRating - The expected average rating.
   * @param {number} expectedUsers - The expected count of users who submitted ratings.
   */
  async expectAverageRatingAndUsersToBe(
    expectedRating: number,
    expectedUsers: number
  ): Promise<void> {
    await this.page.waitForSelector(avarageRatingSelector, {
      visible: true,
    });
    const avarageRating = await this.page.$eval(
      avarageRatingSelector,
      element => parseFloat((element as HTMLElement).innerText.trim())
    );
    if (avarageRating !== expectedRating) {
      throw new Error(
        `Expected average rating to be ${expectedRating}, but found ${avarageRating}.`
      );
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
        `Expected ${expectedUsers} users to have submitted ratings, but found only ${totalUsers} instead.`
      );
    }
  }

  /**
   * Function to check the expected number of open feedback entries.
   * @param {number} number - The expected count of open feedback entries.
   */
  async expectOpenFeedbacksToBe(number: number): Promise<void> {
    await this.page.waitForSelector(numberOfOpenFeedbacksSelector, {
      visible: true,
    });
    const numberOfOpenFeedbacks = await this.page.$eval(
      numberOfOpenFeedbacksSelector,
      el => parseInt((el as HTMLElement).innerText.trim(), 10)
    );
    if (numberOfOpenFeedbacks !== number) {
      throw new Error(
        `Expected open feedback count to be ${number}, but found ${numberOfOpenFeedbacks}.`
      );
    }
  }

  /**
   * Function to check the expected total number of plays."
   * @param {number} number - The expected total play count.
   */
  async expectTotalPlaysToBe(number: number): Promise<void> {
    await this.page.waitForSelector(totalPlaysSelector, {
      visible: true,
    });
    const numberOfTotalPlays = await this.page.$eval(totalPlaysSelector, el =>
      parseInt((el as HTMLElement).innerText.trim(), 10)
    );
    if (numberOfTotalPlays !== number) {
      throw new Error(
        `Expected total plays count to be ${number}, but found ${numberOfTotalPlays}.`
      );
    }
  }

  /**
   * Function to check the expected total number of explorations.
   * @param {number} number - The expected count of total explorations.
   */
  async expectNumberOfExplorationsToBe(number: number): Promise<void> {
    await this.page.waitForSelector(explorationSummaryTileTitleSelector, {
      visible: true,
    });
    const titlesOnPage = await this.page.$$eval(
      explorationSummaryTileTitleSelector,
      elements => elements.map(el => el.textContent?.trim() || '')
    );
    const count = titlesOnPage.length;

    if (count !== number) {
      throw new Error(
        `Expected ${number} explorations, but found ${count} instead.`
      );
    }
  }

  /**
   * Function to check the presence and expected number of occurrences of an exploration.
   * @param {string} explorationName - The name of the exploration.
   * @param {number} numberOfOccurrence - The expected occurrence count of the exploration.
   */
  async expectExplorationNameToAppearNTimes(
    explorationName: string,
    numberOfOccurrence: number = 1
  ): Promise<void> {
    await this.page.waitForSelector(explorationSummaryTileTitleSelector, {
      visible: true,
    });

    // Extract all exploration titles.
    const titlesOnPage = await this.page.$$eval(
      explorationSummaryTileTitleSelector,
      elements => elements.map(el => el.textContent?.trim() || '')
    );

    // Count occurrences of the target exploration.
    const count = titlesOnPage.filter(
      title => title === explorationName
    ).length;

    if (numberOfOccurrence === 1 && count !== numberOfOccurrence) {
      throw new Error(`Exploration "${explorationName}" not found.`);
    } else if (count !== numberOfOccurrence) {
      throw new Error(
        `Exploration "${explorationName}" found ${count} times, but expected ${numberOfOccurrence} times.`
      );
    }
  }

  /**
   * Opens an exploration in the editor.
   * @param {string} explorationName - The name of the exploration.
   */
  async openExplorationInExplorationEditor(
    explorationName: string
  ): Promise<void> {
    await this.page.waitForSelector(explorationSummaryTileTitleSelector, {
      visible: true,
    });
    const title = await this.page.$eval(
      explorationSummaryTileTitleSelector,
      el => el.textContent?.trim()
    );

    if (title === explorationName) {
      const explorationTileElement = await this.page.$(
        explorationSummaryTileTitleSelector
      );
      await explorationTileElement?.click();
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
   * Checks the number of suggestions in the exploration editor.
   * @param {number} expectedNumber - The expected number of suggestions.
   */
  async expectNoOfSuggestionsToBe(expectedNumber: number): Promise<void> {
    await this.page.waitForSelector(feedbackSubjectSelector);
    const feedbackSubjects = await this.page.$$(feedbackSubjectSelector);

    if (feedbackSubjects.length === expectedNumber) {
      showMessage('Number of suggestions matches the expected number.');
    } else {
      throw new Error(
        `Number of suggestions does not match the expected number. Expected: ${expectedNumber}, Found: ${feedbackSubjects.length}`
      );
    }
  }

  /**
   * Views a feedback thread.
   * @param {number} expectedThread - The 1-indexed position of the expected thread.
   */
  async viewFeedbackThread(expectedThread: number): Promise<void> {
    // Reloading to make sure the feedback threads are updated.
    await this.reloadPage();
    await this.page.waitForSelector(feedbackSubjectSelector);
    const feedbackSubjects = await this.page.$$(feedbackSubjectSelector);

    if (expectedThread > 0 && expectedThread <= feedbackSubjects.length) {
      await feedbackSubjects[expectedThread - 1].click();

      await this.page.waitForSelector(explorationFeedbackCardActiveSelector, {
        visible: true,
      });
    } else {
      throw new Error(`Expected thread not found: ${expectedThread}`);
    }
  }

  /**
   * Checks if a suggestion is anonymous.
   * @param {string} suggestion - The expected suggestion.
   * @param {boolean} anonymouslySubmitted - Indicates whether the suggestion is expected to be anonymous.
   */
  async expectSuggestionToBeAnonymous(
    suggestion: string,
    anonymouslySubmitted: boolean
  ): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(feedbackSelector);
    const actualSuggestion = await this.page.$eval(feedbackSelector, el =>
      el.textContent?.trim()
    );

    if (actualSuggestion !== suggestion) {
      throw new Error(
        `Suggestion does not match the expected value. Expected: ${suggestion}, Found: ${actualSuggestion}`
      );
    }

    const isAnonymouslySubmitted = await this.isTextPresentOnPage(
      '(anonymously submitted)'
    );

    if (isAnonymouslySubmitted !== anonymouslySubmitted) {
      throw new Error(
        `Anonymity does not match the expected value. Expected: ${anonymouslySubmitted ? 'Anonymous' : 'Not anonymous'}, Found: ${isAnonymouslySubmitted ? 'Anonymous' : 'Not anonymous'}`
      );
    }
  }

  /**
   * Replies to a suggestion.
   * @param {string} reply - The reply to the suggestion.
   */
  async replyToSuggestion(reply: string): Promise<void> {
    await this.page.waitForSelector(responseTextareaSelector, {
      visible: true,
    });
    await this.type(responseTextareaSelector, reply);
    await this.clickOn(sendButtonSelector);

    // Check if button is disabled after clicking
    const isButtonDisabled = await this.page.evaluate(selector => {
      const button = document.querySelector(selector) as
        | HTMLButtonElement
        | undefined;
      return button?.disabled;
    }, sendButtonSelector);

    if (!isButtonDisabled) {
      throw new Error(
        'Feedback reply button is not disabled after sending a feedback reply.'
      );
    }
  }

  /**
   * Verifies that the Edit Roles button is hidden, indicating the user
   * doesn't have permission to modify user roles.
   * @returns A promise that resolves when the assertion completes.
   */
  async expectEditRolesButtonToBeHidden(): Promise<void> {
    const element = await this.page.$(editRolesButtonSelector);
    expect(element).toBe(null);
  }

  /**
   * Verifies that the state content editor is hidden, indicating the user
   * doesn't have permission to edit exploration content.
   * @returns A promise that resolves when the assertion completes.
   */
  async expectStateContentEditorToBeHidden(): Promise<void> {
    const element = await this.page.$(stateContentEditorSelector);
    expect(element).toBe(null);
  }

  /**
   * Navigates back to the feedback tab.
   */
  async goBackToTheFeedbackTab(): Promise<void> {
    await this.page.waitForSelector(feedbackTabBackButtonSelector, {
      visible: true,
    });
    await this.clickOn(feedbackTabBackButtonSelector);
    await this.page.waitForSelector(feedbackTabBackButtonSelector, {
      hidden: true,
    });
  }

  /**
   * Changes the status of the current feedback thread.
   * @param {string} statusValue - The new status value to set for the feedback.
   */
  async changeFeedbackStatus(statusValue: string): Promise<void> {
    await this.page.waitForSelector(responseTextareaSelector, {
      visible: true,
    });
    if (statusValue === 'ignored' || statusValue === 'not_actionable') {
      await this.type(responseTextareaSelector, statusValue);
    }
    await this.select(feedbackStatusMenu, statusValue);
    await this.clickOn(sendButtonSelector);

    await this.expectElementToBeClickable(sendButtonSelector, false);
  }

  /**
   * Checks if the current feedback status matches the expected value.
   * @param {string} statusValue - The expected status value of the feedback.
   */
  async expectFeedbackStatusToBe(statusValue: string): Promise<void> {
    const currentStatus = await this.page.$eval(
      feedbackStatusMenu,
      el => (el as HTMLSelectElement).value
    );
    if (currentStatus !== statusValue) {
      throw new Error(
        `Expected feedback status to be ${statusValue}, but found ${currentStatus}`
      );
    }
  }

  /**
   * Verifies that a feedback thread at the specified index has the expected status.
   * @param {number} threadIndex - The 1-indexed position of the feedback thread.
   * @param {string} expectedStatus - The status text expected for the feedback thread.
   */
  async expectFeedbackStatusInList(
    threadIndex: number,
    expectedStatus: string
  ): Promise<void> {
    await this.page.waitForSelector(feedbackTabRowSelector, {
      visible: true,
    });
    let feedbackStatuses = await this.page.$$(feedbackStatusSelector);
    const statusText = await this.page.evaluate(
      el => el.textContent?.trim(),
      feedbackStatuses[threadIndex - 1]
    );
    if (statusText !== expectedStatus) {
      throw new Error(
        `Expected feedback status for thread ${threadIndex} to be "${expectedStatus}", but found "${statusText}"`
      );
    }
  }

  /**
   * Creates a Tab Element In RTE.
   * @param tabContents - A list of tab contents to add.
   */
  async addTabContentsRTE(tabContents: TabContent[] = []): Promise<void> {
    await this.clickOnRTEOptionWithTitle('Insert tabs');

    await this.waitForNetworkIdle();
    const helperModel = await this.page.$(rteHelperModalSelector);

    const tabTitleInputElements = await helperModel?.$$(textInputSelector);
    const tabContentInputElements = await helperModel?.$$(
      stateContentInputField
    );

    showMessage(tabContentInputElements?.length + ' tab contents found.');
    showMessage(tabTitleInputElements?.length + ' tab titles found.');

    for (let i = 0; i < tabContents.length; i++) {
      if (i > 1) {
        await this.clickOn('.e2e-test-add-list-entry');
      }
      await this.clearAllTextFrom(
        `oppia-rte-helper-model input.e2e-test-text-input:nth-child(${i + 1})`
      );
      await this.clearAllTextFrom(
        `oppia-rte-helper-model ${stateContentInputField}:nth-child(${i + 1})`
      );
      await tabTitleInputElements?.[i]?.type(tabContents[i].title);
      await tabContentInputElements?.[i]?.type(tabContents[i].content);
    }
    await this.clickOn(closeButtonForExtraModel);
    await this.expectElementToBeVisible(closeButtonForExtraModel, false);
  }

  /**
   * Updates an exploration description containing all RTE elements.
   */
  async addExplorationDescriptionContainingAllRTEComponents(): Promise<void> {
    // Click on RTE.
    await this.page.waitForSelector(stateEditSelector, {visible: true});
    await this.clickOn(stateEditSelector);

    // Add Bold text.
    await this.clickOnRTEOptionWithTitle('Bold');
    await this.type(stateContentInputField, 'Bold text');
    await this.page.keyboard.press('Enter');
    await this.clickOnRTEOptionWithTitle('Bold');

    // Add Italic text.
    await this.clickOnRTEOptionWithTitle('Italic');
    await this.type(stateContentInputField, 'Italic text');
    await this.page.keyboard.press('Enter');
    await this.clickOnRTEOptionWithTitle('Italic');

    // Add Numbered List.
    await this.clickOnRTEOptionWithTitle('Numbered List');
    await this.type(stateContentInputField, 'Numbered List Item 1');
    await this.page.keyboard.press('Enter');
    await this.type(stateContentInputField, 'Numbered List Item 2');
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.press('Enter');

    // Add Bulleted List.
    await this.clickOnRTEOptionWithTitle('Bulleted List');
    await this.type(stateContentInputField, 'Bulleted List Item 1');
    await this.page.keyboard.press('Enter');
    await this.type(stateContentInputField, 'Bulleted List Item 2');
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.press('Enter');

    // Add Pre formatted Text.
    await this.clickOnRTEOptionWithTitle('Pre');
    await this.type(stateContentInputField, 'Pre formatted text');
    await this.clickOnRTEOptionWithTitle('Pre');
    await this.page.keyboard.press('Enter');

    // Add Block Quote.
    await this.clickOnRTEOptionWithTitle('Block Quote');
    await this.type(stateContentInputField, 'Block Quote text');
    await this.page.keyboard.press('Enter');
    await this.clickOnRTEOptionWithTitle('Block Quote');

    // Add Collapsible Block.
    await this.addCollapsibleBlockRTE();
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('ArrowRight');

    // Add Image.
    await this.addImageRTE(
      testConstants.data.profilePicture,
      'Test Image',
      'Test Image Caption'
    );
    await this.waitForNetworkIdle();

    await this.page.keyboard.press('ArrowRight');

    // Video.
    await this.addVideoRTE(oppiaYouTubeVideoUrl);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('ArrowRight');

    // Add LinkEnter.
    await this.addTextWithLinkRTE('Oppia', oppiaWebURL);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('Enter');

    // Math Formula.
    await this.clickOnRTEOptionWithTitle('Insert mathematical formula');
    await this.waitForNetworkIdle();
    const textareaElement = await this.page.$(
      'textarea[placeholder*="Enter a math expression using LaTeX"]'
    );
    await textareaElement?.type('x^2 + y^2 = z^2');
    await this.clickOn(closeButtonForExtraModel);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('Enter');

    // Concept Card.
    await this.clickOnRTEOptionWithTitle('Insert Concept Card Link');
    await this.waitForNetworkIdle();
    const skillSearchElement = await this.page.$(skillNameInput);
    await skillSearchElement?.type('Math');
    await this.clickOn(skillItemInRTESelector);
    await this.page.keyboard.press('Enter');
    await this.clickOn(closeButtonForExtraModel);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('Enter');

    // Tab Contents.
    await this.addTabContentsRTE();
    await this.page.keyboard.press('ArrowRight');

    await this.clickOn(saveContentButton);
    await this.expectElementToBeVisible(saveContentButton, false);
  }

  /**
   * Clicks on the RTE option with the given title.
   * @param title - The title of RTE option.
   */
  async clickOnRTEOptionWithTitle(title: string): Promise<void> {
    const optionSelector = `a.cke_button[title*="${title}"]`;
    await this.page.waitForSelector(optionSelector);
    const optionElement = await this.page.$(optionSelector);
    await optionElement?.click();
  }

  /**
   * Adds a default collapsible block RTE element.
   */
  async addCollapsibleBlockRTE(): Promise<void> {
    await this.clickOnRTEOptionWithTitle('collapsible block');
    await this.clickOn(closeButtonForExtraModel);
    await this.expectElementToBeVisible(closeButtonForExtraModel, false);
  }

  /**
   * Adds text with link in RTE editor.
   * @param text - The text that should be displayed
   * @param url - The URL to which the text should redirect to.
   */
  async addTextWithLinkRTE(text: string, url: string): Promise<void> {
    await this.clickOnRTEOptionWithTitle('Insert link');
    await this.waitForNetworkIdle();

    const helperModel = await this.page.$(rteHelperModalSelector);

    // Get Fields.
    const inputs = await helperModel?.$$(textInputSelector);
    const linkInput = inputs?.[0];
    const linkTextInput = inputs?.[1];

    if (linkInput && linkTextInput) {
      await linkInput.type(url);
      await linkTextInput.type(text);
    } else {
      throw new Error('Link input fields not found in the helper modal');
    }

    await this.clickOn(closeButtonForExtraModel);
    await this.expectElementToBeVisible(closeButtonForExtraModel, false);
  }

  /**
   * Adds an Image RTE element.
   * @param imageFilePath - Path of Image file to add.
   * @param imageDescription - Image Description to add.
   * @param imageCaption - Caption to add with image.
   */
  async addImageRTE(
    imageFilePath: string,
    imageDescription: string,
    imageCaption: string | null
  ): Promise<void> {
    await this.clickOnRTEOptionWithTitle('Insert image');

    await this.waitForNetworkIdle();
    const helperModel = await this.page.$(rteHelperModalSelector);

    // Get Fields.
    const imageDescriptionInput = await helperModel?.$(descriptionBoxSelector);
    const imageCaptionInput = await helperModel?.$(textInputSelector);

    if (imageDescriptionInput) {
      await imageDescriptionInput.type(imageDescription);
    } else {
      throw new Error('Image description input not found in the helper modal');
    }
    if (imageCaptionInput && imageCaption) {
      await imageCaptionInput.type(imageCaption);
    }

    await this.clickOn(uploadImageButton);
    await this.uploadFile(imageFilePath);
    await this.clickOn(useTheUploadImageButton);

    await this.clickOn(closeButtonForExtraModel);
    await this.expectElementToBeVisible(closeButtonForExtraModel, false);
  }

  /**
   * Adds Video RTE element.
   * @param videoUrl - Youtube Video URL
   */
  async addVideoRTE(videoUrl: string): Promise<void> {
    await this.clickOnRTEOptionWithTitle('Insert video');

    await this.expectElementToBeVisible(rteHelperModalSelector);
    const helperModel = await this.page.$(rteHelperModalSelector);

    // Get Fields.
    const videoUrlInput = await helperModel?.$(textInputField);

    if (videoUrlInput) {
      await videoUrlInput.type(videoUrl);
    } else {
      throw new Error('Video URL input not found in the helper modal');
    }

    await this.page.waitForSelector(closeButtonForExtraModel);
    await this.page.click(closeButtonForExtraModel);
    await this.page.waitForSelector(closeButtonForExtraModel, {
      hidden: true,
    });
  }
}

export let ExplorationEditorFactory = (): ExplorationEditor =>
  new ExplorationEditor();
