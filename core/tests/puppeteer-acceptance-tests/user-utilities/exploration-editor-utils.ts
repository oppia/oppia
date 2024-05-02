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

import {BaseUser} from '../puppeteer-testing-utilities/puppeteer-utils';
import testConstants from '../puppeteer-testing-utilities/test-constants';
import {showMessage} from '../puppeteer-testing-utilities/show-message-utils';
import {error} from 'console';

const baseURL = testConstants.URLs.BaseURL;
const creatorDashboardPage = testConstants.URLs.CreatorDashboard;

const createExplorationButton = 'button.e2e-test-create-new-exploration-button';
const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const saveContentButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const saveChangesButton = 'button.e2e-test-save-changes';

// Settings Tab elements.
const settingsTab = 'a.e2e-test-exploration-settings-tab';
const addTitleBar = 'input#explorationTitle';
const addGoalInputBox = '.e2e-test-exploration-objective-input';
const categoryDropdown = 'mat-select.e2e-test-exploration-category-dropdown';
const languageUpdateDropdown =
  'mat-select.e2e-test-exploration-language-select';
const addTagsInputBox = 'input.e2e-test-chip-list-tags';
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

const saveDraftButton = 'button.e2e-test-save-draft-button';
const commitMessage = 'textarea.e2e-test-commit-message-input';
const publishExplorationButton = 'button.e2e-test-publish-exploration';
const explorationTitleInput = 'input.e2e-test-exploration-title-input-modal';
const explorationGoalInput = 'input.e2e-test-exploration-objective-input-modal';
const explorationCategoryDropdown =
  'mat-form-field.e2e-test-exploration-category-metadata-modal';
const saveExplorationChangesButton = 'button.e2e-test-confirm-pre-publication';
const explorationConfirmPublishButton = 'button.e2e-test-confirm-publish';
const explorationIdElement = 'span.oppia-unique-progress-id';
const closePublishedPopUpButton = 'button.e2e-test-share-publish-close';
const discardDraftDropdown = 'button.e2e-test-save-discard-toggle';
const desktopDiscardDraftButton = 'a.e2e-test-discard-changes';
const confirmDiscardButton = 'button.e2e-test-confirm-discard-changes';

const previewTabButton = '.e2e-test-preview-tab';
const mobilePreviewTabButton = '.e2e-test-mobile-preview-button';
const stateEditSelector = '.e2e-test-state-edit-content';
const stateContentInputField = 'div.e2e-test-rte';
const correctAnswerInTheGroupSelector = '.e2e-test-editor-correctness-toggle';
const addNewResponseButton = '.e2e-test-add-new-response';
const floatFormInput = '.e2e-test-float-form-input';

const stateNodeSelector = '.e2e-test-node-label';
const openOutcomeDestButton = '.e2e-test-open-outcome-dest-editor';
const destinationCardSelector = 'select.e2e-test-destination-selector-dropdown';
const addStateInput = '.e2e-test-add-state-input';
const saveOutcomeDestButton = '.e2e-test-save-outcome-dest';
const stateResponsesSelector = '.e2e-test-default-response-tab';
const feedbackEditorSelector = '.e2e-test-open-feedback-editor';
const responseModalHeaderSelector = '.e2e-test-add-response-modal-header';
const toastMessage = '.e2e-test-toast-message';

// For mobile.
const mobileSettingsBar = 'li.e2e-test-mobile-settings-button';
const mobileChangesDropdown = 'div.e2e-test-mobile-changes-dropdown';
const mobileSaveChangesButton =
  'button.e2e-test-save-changes-for-small-screens';
const mobilePublishButton = 'button.e2e-test-mobile-publish-button';
const mobileDiscardButton = 'div.e2e-test-mobile-exploration-discard-tab';
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

// Preview tab elements.
const nextCardButton = '.e2e-test-next-card-button';
const submitAnswerButton = '.e2e-test-submit-answer-button';
const previewRestartButton = '.e2e-test-preview-restart-button';
const stateConversationContent = '.e2e-test-conversation-content';
const explorationCompletionToastMessage = '.e2e-test-lesson-completion-message';

const subscriberCountLabel = '.e2e-test-oppia-total-subscribers';
const subscriberTabButton = '.e2e-test-subscription-tab';
const subscriberCard = '.e2e-test-subscription-card';

export class ExplorationEditor extends BaseUser {
  /**
   * Function to navigate to creator dashboard page.
   */
  async navigateToCreatorDashboardPage(): Promise<void> {
    await this.page.goto(creatorDashboardPage);
    showMessage('Creator dashboard page is opened successfully.');
  }

  /**
   * Function to navigate to exploration editor.
   */
  async navigateToExplorationEditorPage(): Promise<void> {
    await this.clickOn(createExplorationButton);
  }

  /**
   * Function to create an exploration with a content and interaction.
   * This is a composite function that can be used when a straightforward, simple exploration setup is required.
   *
   * @param content - content of the exploration
   * @param interaction - the interaction to be added to the exploration
   */
  async createExplorationWithMinimumContent(
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
      await this.page.waitForSelector(mobileOptionsButton, {visible: true});
      await this.clickOn(mobileOptionsButton);
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
   * @param {string} category - The category of the exploration.
   */
  async publishExplorationWithContent(
    title: string,
    goal: string,
    category: string
  ): Promise<string | null> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(toastMessage, {
        visible: true,
      });
      await this.page.waitForSelector(toastMessage, {
        hidden: true,
      });
      await this.clickOn(mobileChangesDropdown);
      await this.clickOn(mobilePublishButton);
    } else {
      await this.clickOn(publishExplorationButton);
    }
    await this.clickOn(explorationTitleInput);
    await this.type(explorationTitleInput, `${title}`);
    await this.clickOn(explorationGoalInput);
    await this.type(explorationGoalInput, `${goal}`);
    await this.clickOn(explorationCategoryDropdown);
    await this.clickOn(`${category}`);
    await this.clickOn(saveExplorationChangesButton);
    await this.clickOn(explorationConfirmPublishButton);
    await this.page.waitForSelector(explorationIdElement);
    const explorationIdUrl = await this.page.$eval(
      explorationIdElement,
      element => (element as HTMLElement).innerText
    );
    const explorationId = explorationIdUrl.replace(/^.*\/explore\//, '');

    await this.clickOn(closePublishedPopUpButton);
    return explorationId;
  }

  /**
   * Function to dismiss welcome modal.
   */
  async dismissWelcomeModal(): Promise<void> {
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      visible: true,
    });
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      hidden: true,
    });
    showMessage('Tutorial pop-up closed successfully.');
  }

  /**
   * Function to add content to a card.
   * @param {string} content - The content to be added to the card.
   */
  async updateCardContent(content: string): Promise<void> {
    await this.page.waitForFunction('document.readyState === "complete"');
    await this.page.waitForSelector(stateEditSelector, {
      visible: true,
    });
    await this.clickOn(stateEditSelector);
    await this.waitForElementToBeClickable(stateContentInputField);
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
    await this.page.waitForSelector('.customize-interaction-body-container', {
      hidden: true,
    });
    showMessage(`${interactionToAdd} interaction has been added successfully.`);
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
    await this.page.waitForSelector('.e2e-test-exploration-title-input');
    const titleInput = await this.page.$('.e2e-test-exploration-title-input');
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
    showMessage(`${username} has been added as collaboratorRoleOption.`);
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
    showMessage('Exploration is saved successfully.');
    await this.page.waitForNetworkIdle();
  }

  async publishExploration(): Promise<string | null> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector('.e2e-test-toast-message', {
        visible: true,
      });
      await this.page.waitForSelector('.e2e-test-toast-message', {
        hidden: true,
      });
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

  async expectExplorationToBeAccessibleByUrl(
    explorationId: string | null
  ): Promise<void> {
    if (!explorationId) {
      throw new Error('ExplorationId is null');
    }
    const explorationUrlAfterPublished = `${baseURL}/create/${explorationId}#/gui/Introduction`;
    try {
      await this.page.goto(explorationUrlAfterPublished);
      showMessage('Exploration is accessible with the URL, i.e. published.');
    } catch (error) {
      throw new Error('The exploration is not public.');
    }
  }

  async expectExplorationToBeNotAccessibleByUrl(
    explorationId: string | null
  ): Promise<void> {
    if (!explorationId) {
      throw new Error('ExplorationId is null');
    }
    const explorationUrlAfterPublished = `${baseURL}/create/${explorationId}#/gui/Introduction`;
    try {
      await this.page.goto(explorationUrlAfterPublished);
      throw new Error('The exploration is still public.');
    } catch (error) {
      showMessage('The exploration is not accessible with the URL.');
    }
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
      this.page.waitForNavigation(),
    ]);
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

  /**
   * Function to navigate to a specific card in the exploration.
   * @param {string} cardName - The name of the card to navigate to.
   */
  async navigateToCard(cardName: string): Promise<void> {
    let elements;
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileStateGraphResizeButton);
    }

    await this.page.waitForSelector(stateNodeSelector);
    elements = await this.page.$$(stateNodeSelector);

    const cardNames = await Promise.all(
      elements.map(element => element.$eval('tspan', node => node.textContent))
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

    await this.page.waitForNetworkIdle({idleTime: 700});
  }

  /**
   * Function to add responses to the interactions. Currently, it only handles 'Number Input' interaction type.
   * @param {string} interactionType - The type of the interaction.
   * @param {string} answer - The response to be added.
   * @param {string} feedback - The feedback for the response.
   * @param {string} destination - The destination state for the response.
   * @param {boolean} responseIsCorrect - Whether the response is marked as correct.
   */
  async addResponseToTheInteraction(
    interactionType: string,
    answer: string,
    feedback: string,
    destination: string,
    responseIsCorrect: boolean
  ): Promise<void> {
    switch (interactionType) {
      case 'Number Input':
        await this.type(floatFormInput, answer);
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
    await this.select(destinationCardSelector, '/');
    await this.type(addStateInput, destination);
    if (responseIsCorrect) {
      await this.clickOn(correctAnswerInTheGroupSelector);
    }
    await this.clickOn(addNewResponseButton);
    await this.page.waitForSelector(responseModalHeaderSelector, {
      hidden: true,
    });
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
    await this.clickOn(nextCardButton);
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
        await this.type(floatFormInput, answer);
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
    title: string
  ): Promise<string | null> {
    await this.navigateToCreatorDashboardPage();
    await this.navigateToExplorationEditorPage();
    await this.dismissWelcomeModal();
    await this.createExplorationWithMinimumContent(
      'Exploration intro text',
      'End Exploration'
    );
    await this.saveExplorationDraft();
    return await this.publishExplorationWithContent(
      title,
      'This is Goal here.',
      'Algebra'
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
}

export let ExplorationEditorFactory = (): ExplorationEditor =>
  new ExplorationEditor();
