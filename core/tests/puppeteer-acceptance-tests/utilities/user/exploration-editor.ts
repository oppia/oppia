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

const creatorDashboardPage = testConstants.URLs.CreatorDashboard;
const baseUrl = testConstants.URLs.BaseURL;
const imageToUpload = testConstants.data.curriculumAdminThumbnailImage;

const createExplorationButton = 'button.e2e-test-create-new-exploration-button';
const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const dropdownToggleIcon = '.e2e-test-mobile-options-dropdown';
const saveContentButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const saveChangesButton = 'button.e2e-test-save-changes';
const mathInteractionsTab = '.e2e-test-interaction-tab-math';
const closeResponseModalButton = '.e2e-test-close-add-response-modal';

const settingsTab = 'a.e2e-test-exploration-settings-tab';
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
const publishExplorationButton = 'button.e2e-test-publish-exploration';
const explorationTitleInput = 'input.e2e-test-exploration-title-input-modal';
const explorationGoalInput = 'input.e2e-test-exploration-objective-input-modal';
const explorationCategoryDropdown =
  'mat-form-field.e2e-test-exploration-category-metadata-modal';
const saveExplorationChangesButton = 'button.e2e-test-confirm-pre-publication';
const explorationConfirmPublishButton = '.e2e-test-confirm-publish';
const explorationIdElement = 'span.oppia-unique-progress-id';
const closePublishedPopUpButton = 'button.e2e-test-share-publish-close';
const discardDraftDropdown = 'button.e2e-test-save-discard-toggle';
const desktopDiscardDraftButton = 'a.e2e-test-discard-changes';
const confirmDiscardButton = 'button.e2e-test-confirm-discard-changes';

const previewTabButton = '.e2e-test-preview-tab';
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

const dismissTranslationWelcomeModalSelector =
  'button.e2e-test-translation-tab-dismiss-welcome-modal';
const translationTabButton = '.e2e-test-translation-tab';
const mobileTranslationTabButton = '.e2e-test-mobile-translation-tab';
const translationLanguageSelector =
  'select.e2e-test-translation-language-selector';
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

const addSkillButton = '.e2e-test-add-skill-button';
const skillNameInput = '.e2e-test-skill-name-input';
const skillItem = '.e2e-test-skills-list-item';
const confirmSkillButton = '.e2e-test-confirm-skill-selection-button';
const deleteSkillButton = 'i.skill-delete-button';
const mobileToggleSkillCard = '.e2e-test-toggle-skill-card';

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

const mobileSettingsBar = 'li.e2e-test-mobile-settings-button';
const mobileChangesDropdown = 'div.e2e-test-mobile-changes-dropdown';
const mobileSaveChangesButton =
  'button.e2e-test-save-changes-for-small-screens';
const mobilePublishButton = 'button.e2e-test-mobile-publish-button';
const mobileDiscardButton = 'button.e2e-test-mobile-exploration-discard-tab';
const mobileStateGraphResizeButton = '.e2e-test-mobile-graph-resize-button';
const mobileNavbarDropdown = 'div.e2e-test-mobile-options-dropdown';
const mobileNavbarPane = '.oppia-exploration-editor-tabs-dropdown';
const mobileNavbarOptions = '.navbar-mobile-options';
const mobileOptionsButton = 'i.e2e-test-mobile-options';
const basicSettingsDropdown = 'h3.e2e-test-settings-container';
const feedbackSettingsDropdown = 'h3.e2e-test-feedback-settings-container';
const permissionSettingsDropdown = 'h3.e2e-test-permission-settings-container';
const voiceArtistSettingsDropdown =
  'h3.e2e-test-voice-artists-settings-container';
const rolesSettingsDropdown = 'h3.e2e-test-roles-settings-container';
const advanceSettingsDropdown = 'h3.e2e-test-advanced-settings-container';
const explorationControlsSettingsDropdown =
  'h3.e2e-test-controls-bar-settings-container';

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
const uploadAudioButton = '.e2e-test-accessibility-translation-upload-audio';
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

const LABEL_FOR_SAVE_DESTINATION_BUTTON = ' Save Destination ';
export class ExplorationEditor extends BaseUser {
  /**
   * Function to navigate to creator dashboard page.
   */
  async navigateToCreatorDashboardPage(): Promise<void> {
    await this.goto(creatorDashboardPage);
    showMessage('Creator dashboard page is opened successfully.');
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
        await this.page.waitForSelector(mobileOptionsButton, {visible: true});
        await this.clickOn(mobileOptionsButton);
      }
      await this.clickOn(mobileNavbarDropdown);
      await this.clickOn(mobileSettingsBar);

      // Open all dropdowns because by default all dropdowns are closed in mobile view.
      await this.clickOn(basicSettingsDropdown);
      await this.clickOn(advanceSettingsDropdown);
      await this.clickOn(rolesSettingsDropdown);
      await this.clickOn(voiceArtistSettingsDropdown);
      await this.clickOn(permissionSettingsDropdown);
      await this.clickOn(feedbackSettingsDropdown);
      await this.clickOn(explorationControlsSettingsDropdown);
    } else {
      await this.clickOn(settingsTab);
    }
    showMessage('Settings tab is opened successfully.');
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
  ): Promise<string | null> {
    const fillExplorationMetadataDetails = async () => {
      await this.clickOn(explorationTitleInput);
      await this.type(explorationTitleInput, `${title}`);
      await this.clickOn(explorationGoalInput);
      await this.type(explorationGoalInput, `${goal}`);
      await this.clickOn(explorationCategoryDropdown);
      await this.clickOn(`${category}`);
      if (tags) {
        await this.type(tagsField, tags);
      }
    };

    const publishExploration = async () => {
      if (this.isViewportAtMobileWidth()) {
        await this.waitForPageToFullyLoad();
        const element = await this.page.$(mobileNavbarOptions);
        // If the element is not present, it means the mobile navigation bar is not expanded.
        // The option to save changes appears only in the mobile view after clicking on the mobile options button,
        // which expands the mobile navigation bar.
        if (!element) {
          await this.clickOn(mobileOptionsButton);
        }
        await this.clickOn(mobileChangesDropdown);
        await this.clickOn(mobilePublishButton);
      } else {
        await this.clickOn(publishExplorationButton);
      }
    };

    const confirmPublish = async () => {
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
      await this.clickOn(closePublishedPopUpButton);
      return explorationId;
    };

    try {
      await publishExploration();
      await fillExplorationMetadataDetails();
      return await confirmPublish();
    } catch (error) {
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

  async navigateToFeedbackTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobileFeedbackTabButton);
    } else {
      await this.clickOn(feedBackButtonTab);
      await this.waitForNetworkIdle();
    }
  }

  /**
   * Fetches the exploration ID from the current URL of the exploration editor page.
   * The exploration ID is the string after '/create/' in the URL.
   */
  async getExplorationId(): Promise<string> {
    const url = await this.page.url();
    const match = url.match(/\/create\/(.*?)(\/|#)/);
    if (!match) {
      throw new Error(
        'Exploration ID not found in the URL' +
          'Ensure you are on the exploration editor page.'
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
      showMessage(`welcome modal not found: ${error.message}`);
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
      showMessage('Editor navigation closed successfully.');
    } catch (error) {
      showMessage(`Dropdown Toggle Icon not found: ${error.message}`);
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
    await this.waitForStaticAssetsToLoad();
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
    await this.clickOn(addInteractionButton);
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
    await this.clickOn(interactionDiv);
    await this.clickOn(textInputField);
    await this.type(textInputField, content);
    await this.clickOn(saveInteractionButton);
  }

  /**
   * Adds a math interaction to the current exploration.
   * @param {string} interactionToAdd - The interaction type to add to the exploration.
   */
  async addMathInteraction(interactionToAdd: string): Promise<void> {
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
  }

  /**
   * Adds an Image interaction to the current exploration.
   */
  async addImageInteraction(): Promise<void> {
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

    showMessage('Image interaction has been added successfully.');
  }

  /**
   * Deletes the previous written title and updates the new title.
   */
  async updateTitleTo(title: string): Promise<void> {
    await this.clearAllTextFrom(addTitleBar);
    await this.type(addTitleBar, title);
    await this.page.keyboard.press('Tab');

    showMessage(`Title has been updated to ${title}`);
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
    await this.clickOn(addGoalInputBox);
    await this.clearAllTextFrom(addGoalInputBox);
    await this.type(addGoalInputBox, goal);
    await this.page.keyboard.press('Tab');
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
    await this.clickOn(categoryDropdown);
    await this.clickOn(category);
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

  async selectLanguage(language: string): Promise<void> {
    // The language dropdown was visible, but it was mostly hidden towards the bottom
    // of the screen. When we clicked on the dropdown, the options did not fully appear,
    // leading to incorrect selections.To prevent this, we are now scrolling the page.
    // We can use 300 - 500px to move the language dropdown to the upper part of the page.
    await this.page.evaluate(() => {
      window.scrollTo(0, 350);
    });

    await this.clickOn(languageUpdateDropdown);
    await this.clickOn(language);
  }

  /**
   *  Verifies that the selected language matches the expected language.
   */
  async expectSelectedLanguageToBe(expectedLanguage: string): Promise<void> {
    await this.page.waitForSelector(languageUpdateDropdown);
    const languageDropdown = await this.page.$(languageUpdateDropdown);
    if (!languageDropdown) {
      throw new Error('Category dropdown not found.');
    }
    await languageDropdown.click();

    const selectedLanguage = await this.page.evaluate(() => {
      const matOption = document.querySelector(
        '.mat-option.mat-selected'
      ) as HTMLElement;
      if (!matOption) {
        throw new Error('Selected language option not found.');
      }
      return matOption.innerText.trim();
    });

    if (selectedLanguage.includes(expectedLanguage)) {
      showMessage(
        `The language ${selectedLanguage} contains the expected language.`
      );
    } else {
      throw new Error('Language is not correct.');
    }
    await this.page.keyboard.press('Enter');
  }

  async addTags(tagNames: string[]): Promise<void> {
    for (let i = 0; i < tagNames.length; i++) {
      await this.clickOn(addTagsInputBox);
      await this.type(addTagsInputBox, tagNames[i].toLowerCase());
      await this.page.keyboard.press('Tab');
    }
  }

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
    await this.clickOn(previewSummaryButton);
    await this.expectPreviewSummaryToBeVisible();
    await this.clickOn(dismissPreviewButton);
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
   * Assigns a role of collaborator to any guest user.
   */
  async assignUserToCollaboratorRole(username: string): Promise<void> {
    await this.clickOn(editRoleButton);
    await this.clickOn(addUsernameInputBox);
    await this.type(addUsernameInputBox, username);
    await this.clickOn(addRoleDropdown);
    await this.clickOn(collaboratorRoleOption);
    await this.clickOn(saveRoleButton);
    showMessage(`${username} has been added as collaboratorRole.`);
  }

  /**
   * Assigns a role of Playtester to any guest user.
   */
  async assignUserToPlaytesterRole(username: string): Promise<void> {
    await this.clickOn(editRoleButton);
    await this.page.waitForSelector('.e2e-test-editor-role-names', {
      visible: true,
    });
    await this.clickOn(addUsernameInputBox);
    await this.type(addUsernameInputBox, username);
    await this.clickOn(addRoleDropdown);
    await this.clickOn(playtesterRoleOption);
    await this.clickOn(saveRoleButton);
    showMessage(`${username} has been added as playtester.`);
  }

  /**
   * Verifies the presence of the publish button.
   */
  async expectExplorationToBePublished(): Promise<void> {
    let publishButtonSelector = '.e2e-test-publish-exploration';
    if (this.isViewportAtMobileWidth()) {
      publishButtonSelector = mobilePublishButton;
      await this.clickOn(mobileChangesDropdown);
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
        await this.clickOn(mobileOptionsButton);
      }
      await this.clickOn(mobileSaveChangesButton);
    } else {
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
    await this.waitForNetworkIdle();
  }

  async publishExploration(): Promise<string | null> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileChangesDropdown);
      await this.clickOn(mobilePublishButton);
    } else {
      await this.clickOn(publishExplorationButton);
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
      await this.clickOn(mobileChangesDropdown);
      await this.clickOn(mobileDiscardButton);
    } else {
      await this.clickOn(discardDraftDropdown);
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
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileOptionsButton);
      await this.clickOn(basicSettingsDropdown);
    }
  }

  /**
   * Function to display the Oppia responses section.
   */
  async viewOppiaResponses(): Promise<void> {
    await this.clickOn(stateResponsesSelector);
  }

  /**
   * Function to select the card that learners will be directed to from the current card.
   * @param {string} cardName - The name of the card to which learners will be directed.
   */
  async directLearnersToNewCard(cardName: string): Promise<void> {
    await this.clickOn(openOutcomeDestButton);
    await this.waitForElementToBeClickable(destinationCardSelector);
    // The '/' value is used to select the 'a new card called' option in the dropdown.
    await this.select(destinationCardSelector, '/');
    await this.type(addStateInput, cardName);
    await this.clickOn(saveOutcomeDestButton);
  }

  async directLearnersToAlreadyExistingCard(cardName: string): Promise<void> {
    await this.clickOn(openOutcomeDestButton);
    await this.waitForElementToBeClickable(destinationCardSelector);
    await this.select(destinationCardSelector, cardName);
    await this.clickOn(saveOutcomeDestButton);
  }

  /**
   * Function to navigate to a specific card in the exploration.
   * @param {string} cardName - The name of the card to navigate to.
   */
  async navigateToCard(cardName: string): Promise<void> {
    try {
      let elements;
      if (this.isViewportAtMobileWidth()) {
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
        await this.clickOn(addResponseOptionButton);
        await this.page.waitForSelector(textInputInteractionOption);
        await this.page.type(textInputInteractionOption, answer);
        break;
      case 'Fraction Input':
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
      // The waitForNetworkIdle method waits for the response
      // to the "Save Draft" request from change-list.service.ts
      // to get executed, the Add Response modal to fully appear
      // and all the fields in it to become clickable before
      // moving on to next steps.
      await this.waitForNetworkIdle();
    }
  }

  /**
   * Function to add feedback for default responses of a state interaction.
   * @param {string} defaultResponseFeedback - The feedback for the default responses.
   * @param {string} [directToCard] - The card to direct to (optional).
   * @param {string} [directToCardWhenStuck] - The card to direct to when the learner is stuck (optional).
   */
  async editDefaultResponseFeedback(
    defaultResponseFeedback: string,
    directToCard?: string,
    directToCardWhenStuck?: string
  ): Promise<void> {
    await this.clickOn(defaultFeedbackTab);

    if (defaultResponseFeedback) {
      await this.clickOn(openOutcomeFeedBackEditor);
      await this.clickOn(stateContentInputField);
      await this.type(stateContentInputField, `${defaultResponseFeedback}`);
      await this.clickOn(saveOutcomeFeedbackButton);
    }

    if (directToCard) {
      await this.clickOn(openOutcomeDestButton);
      await this.page.select(destinationSelectorDropdown, directToCard);
      await this.clickOn(LABEL_FOR_SAVE_DESTINATION_BUTTON);
    }

    if (directToCardWhenStuck) {
      await this.clickOn(outcomeDestWhenStuckSelector);
      // The '4: /' value is used to select the 'a new card called' option in the dropdown.
      await this.select(destinationWhenStuckSelectorDropdown, '4: /');
      await this.type(addDestinationStateWhenStuckInput, directToCardWhenStuck);
      await this.clickOn(LABEL_FOR_SAVE_DESTINATION_BUTTON);
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
    await this.clickOn(addSolutionButton);
    await this.page.waitForSelector(solutionSelector, {visible: true});
    await this.type(solutionSelector, answer);
    await this.page.waitForSelector(`${submitAnswerButton}:not([disabled])`);
    await this.clickOn(submitAnswerButton);
    await this.type(stateContentInputField, answerExplanation);
    await this.page.waitForSelector(`${submitSolutionButton}:not([disabled])`);
    await this.clickOn(submitSolutionButton);
  }

  /**
   * Update the solution explanation of the current state card.
   * @param explanation - Updated solution explanation for the state card.
   */
  async updateSolutionExplanation(explanation: string): Promise<void> {
    await this.clickOn(stateSolutionTab);
    await this.clickOn(editStateSolutionExplanationSelector);
    await this.type(stateContentInputField, explanation);
    await this.clickOn(saveSolutionEditButton);
  }

  /**
   * Sets a state as a checkpoint in the exploration.
   */
  async setTheStateAsCheckpoint(): Promise<void> {
    await this.clickOn(setAsCheckpointButton);
  }

  /**
   * Function to add a hint for a state card.
   * @param {string} hint - The hint to be added for the current card.
   */
  async addHintToState(hint: string): Promise<void> {
    await this.clickOn(addHintButton);
    await this.type(stateContentInputField, hint);
    await this.clickOn(saveHintButton);
  }

  /**
   * Function to edit a hint for a state card.
   * @param hint - The updated hint content for the current card.
   */
  async updateHint(hint: string): Promise<void> {
    await this.clickOn(stateHintTab);
    await this.clickOn(editStateHintSelector);
    await this.type(stateContentInputField, hint);
    await this.clickOn(saveHintEditButton);
  }

  /**
   * Adds a particular skill to the current state card.
   * @param skillName - Name of the skill to be linked to state.
   */
  async addSkillToState(skillName: string): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(addSkillButton);
      // If the skill menu was collapsed in mobile view.
      if (!element) {
        await this.clickOn(mobileToggleSkillCard);
      }
    }
    await this.clickOn(addSkillButton);
    await this.type(skillNameInput, skillName);
    await this.clickOn(skillItem);
    await this.clickOn(confirmSkillButton);
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
   * Removes the attached skill from the current state card.
   */
  async removeSkillFromState(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(addSkillButton);
      // If the skill menu was collapsed in mobile view.
      if (!element) {
        await this.clickOn(mobileToggleSkillCard);
      }
    }
    await this.clickOn(deleteSkillButton);
    await this.clickOn('Delete skill');
  }

  /**
   * Function to navigate to the preview tab.
   */
  async navigateToPreviewTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobilePreviewTabButton);
    } else {
      await this.clickOn(previewTabButton);
    }
    await this.page.waitForNavigation();
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
        await this.clickOn(mobileOptionsButton);
      }
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobileTranslationTabButton);
    } else {
      await this.clickOn(translationTabButton);
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
        await this.clickOn(mobileOptionsButton);
      }
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobileMainTabButton);
    } else {
      await this.clickOn(mainTabButton);
    }
    await this.waitForNetworkIdle();
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
        await this.clickOn(mobileOptionsButton);
      }
    }
    await this.clickOn(previewRestartButton);
  }

  /**
   * Function for creating an exploration with only EndExploration interaction with given title.
   */
  async createAndPublishAMinimalExplorationWithTitle(
    title: string,
    category: string = 'Algebra'
  ): Promise<string | null> {
    await this.navigateToCreatorDashboardPage();
    await this.navigateToExplorationEditorPage();
    await this.dismissWelcomeModal();
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
      this.page.goto(`${baseUrl}/explore/${explorationId}`),
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
   * @param {string} languageCode - Code of language for which the translation has to be added.
   * @param {string} contentType - Type of the content such as "Interaction" or "Hint"
   * @param {string} translation - The translation which will be added for the content.
   * @param {number} feedbackIndex - The index of the feedback to edit, since multiple feedback responses exist.
   */
  async editTranslationOfContent(
    languageCode: string,
    contentType: string,
    translation: string,
    feedbackIndex?: number
  ): Promise<void> {
    await this.select(translationLanguageSelector, languageCode);
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
   * @param {string} languageCode - Code of language for which the voiceover has to be added.
   * @param {string} contentType - Type of the content such as "Interaction" or "Hint"
   * @param {string} voiceoverFilePath - The path of the voiceover file which will be added for the content.
   * @param {number} feedbackIndex - The index of the feedback to edit, since multiple feedback responses exist.
   */
  async addVoiceoverToContent(
    languageCode: string,
    contentType: string,
    voiceoverFilePath: string
  ): Promise<void> {
    await this.select(translationLanguageSelector, languageCode);
    const activeContentType = await this.page.$eval(activeTranslationTab, el =>
      el.textContent?.trim()
    );
    if (!activeContentType?.includes(contentType)) {
      showMessage(
        `Switching content type from ${activeContentType} to ${contentType}`
      );
      await this.clickOn(contentType);
    }
    await this.clickOn(uploadAudioButton);
    await this.uploadFile(voiceoverFilePath);
    await this.clickOn(saveUploadedAudioButton);
    await this.waitForNetworkIdle();
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
    await this.type(responseTextareaSelector, reply);
    await this.clickOn(sendButtonSelector);
  }
}

export let ExplorationEditorFactory = (): ExplorationEditor =>
  new ExplorationEditor();
