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
 * @fileoverview exploration management test file
 */

import {error} from 'console';
import {BaseUser} from '../puppeteer-testing-utilities/puppeteer-utils';
import {showMessage} from '../puppeteer-testing-utilities/show-message-utils';
import testConstants from '../puppeteer-testing-utilities/test-constants';

const baseURL = testConstants.URLs.BaseURL;
const creatorDashboardUrl = testConstants.URLs.CreatorDashboard;

const createNewExplorationButton = '.e2e-test-create-new-exploration-button';
const tutorialTakeMeToEditorButton = 'button.e2e-test-dismiss-welcome-modal';
const explorationIntroContentBoxPlaceholder = 'div.e2e-test-state-edit-content';
const editCardNameButton = '.e2e-test-state-name-text';
const editCardNameBox = '.e2e-test-state-name-input';
const explorationIntroBox = 'div.e2e-test-rte';
const submitIntroButton = 'button.e2e-test-state-name-submit';
const submitIntroTitleButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const endExplorationInteractionOption =
  '.e2e-test-interaction-tile-EndExploration';
const saveInteractionButton = 'button.e2e-test-save-interaction';
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
const desktopSaveDraftButton = 'button.e2e-test-save-changes';
const confirmSaveDraftButton = '.e2e-test-save-draft-button';
const desktopPublishButton = 'button.e2e-test-publish-exploration';
const discardDraftDropdown = 'button.e2e-test-save-discard-toggle';
const desktopDiscardDraftButton = 'a.e2e-test-discard-changes';
const confirmDiscardButton = 'button.e2e-test-confirm-discard-changes';
const confirmPublishButton = 'button.e2e-test-confirm-publish';
const commitMessage = 'textarea.e2e-test-commit-message-input';
const closePublishedPopUpButton = 'button.e2e-test-share-publish-close';

/**
 * For mobile.
 */
const navBarOpenerIcon = 'i.e2e-test-mobile-options';
const optionsDropdown = 'div.e2e-test-mobile-options-dropdown';
const mobileSettingsBar = 'li.e2e-test-mobile-settings-button';
const basicSettingsDropdown = 'h3.e2e-test-settings-container';
const feedbackSettingsDropdown = 'h3.e2e-test-feedback-settings-container';
const permissionSettingsDropdown = 'h3.e2e-test-permission-settings-container';
const voiceArtistSettingsDropdown =
  'h3.e2e-test-voice-artists-settings-container';
const rolesSettingsDropdown = 'h3.e2e-test-roles-settings-container';
const advanceSettingsDropdown = 'h3.e2e-test-advanced-settings-container';
const explorationControlsSettingsDropdown =
  'h3.e2e-test-controls-bar-settings-container';
const mobileSaveDraftButton = 'button.e2e-test-save-changes-for-small-screens';
const mobilePublishButton = 'button.e2e-test-mobile-publish-button';
const publishButtonDropdown = 'div.e2e-test-mobile-changes-dropdown';
const mobileDiscardButton = 'div.e2e-test-mobile-exploration-discard-tab';

let explorationUrlAfterPublished = '';

export class ExplorationCreator extends BaseUser {
  async navigateToCreatorDashboardPage(): Promise<void> {
    await this.goto(creatorDashboardUrl);
    showMessage('Creator dashboard page is opened successfully.');
  }

  /**
   * Clicks on new exploration button.
   */
  async createNewExploration(): Promise<void> {
    await this.clickOn(createNewExplorationButton);
  }

  /**
   * Closes the tutorial pop-up before a new exploration.
   */
  async dismissWelcomeModal(): Promise<void> {
    await this.clickOn(tutorialTakeMeToEditorButton);
    showMessage('Tutorial pop-up closed successfully.');
  }

  /**
   * Clears previous card name and adds a new card name.
   */
  async updateCardName(cardName: string): Promise<void> {
    await this.clickOn(editCardNameButton);
    await this.clearAllTextFrom(editCardNameBox);
    await this.type(editCardNameBox, cardName);
    await this.clickOn(submitIntroButton);
    showMessage('Card name updated successfully.');
  }

  /**
   * Clears previous intro text and adds a new intro text.
   */
  async updateExplorationIntroText(introText: string): Promise<void> {
    await this.clickOn(explorationIntroContentBoxPlaceholder);
    await this.clickOn(explorationIntroBox);
    await this.clearAllTextFrom(explorationIntroBox);
    await this.type(explorationIntroBox, introText);
    await this.clickOn(submitIntroTitleButton);
    showMessage('Intro text updated successfully.');
  }

  async addEndInteraction(): Promise<void> {
    await this.page.waitForNavigation({waitUntil: 'networkidle0'});
    await this.clickOn(addInteractionButton);
    await this.clickOn(endExplorationInteractionOption);
    await this.clickOn(saveInteractionButton);
    showMessage('End interaction has been added successfully.');
  }
  /**
   * Open settings tab.(Note->It also opens all the dropdowns present
   * in the setting tab for mobile view port.)
   */
  async navigateToSettingsTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(navBarOpenerIcon, {visible: true});
      await this.clickOn(navBarOpenerIcon);
      await this.clickOn(optionsDropdown);
      await this.clickOn(mobileSettingsBar);
      /**
       * Open all dropdowns because by default
       * all dropdowns are closed in mobile view.
       */
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
   * Deletes the previous written title and updates the new title.
   */
  async updateTitleTo(title: string): Promise<void> {
    await this.clearAllTextFrom(addTitleBar);
    await this.type(addTitleBar, title);
    await this.page.keyboard.press('Tab');
    showMessage(`Title has been updated to ${title}`);
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
    /**
     * The language dropdown was visible, but it was mostly hidden
     * towards the bottom of the screen. When we clicked on the dropdown,
     * the options did not fully appear, leading to incorrect selections.
     * To prevent this, we are now scrolling the page. We can use 300 - 500px
     * to move the language dropdown to the upper part of the page.
     */
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
    /**
     * When adding a tag in the exploration settings UI, it gets
     * auto-converted to lowercase by the input field.
     */
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
      await this.clickOn(publishButtonDropdown);
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
   * Save the changes of the exploration.
   */
  async saveDraftExploration(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileSaveDraftButton);
    } else {
      await this.clickOn(desktopSaveDraftButton);
    }

    await this.clickOn(commitMessage);
    await this.type(commitMessage, 'Testing Testing');
    await this.clickOn(confirmSaveDraftButton);
    await this.page.waitForFunction('document.readyState === "complete"');
    showMessage('Exploration is saved successfully.');
  }

  async publishExploration(): Promise<string | null> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector('.e2e-test-toast-message', {
        visible: true,
      });
      await this.page.waitForSelector('.e2e-test-toast-message', {
        hidden: true,
      });
      await this.clickOn(publishButtonDropdown);
      await this.clickOn(mobilePublishButton);
    } else {
      await this.clickOn(desktopPublishButton);
    }
    await this.clickOn(confirmPublishButton);
    await this.page.waitForSelector(closePublishedPopUpButton, {visible: true});

    explorationUrlAfterPublished = await this.page.url();
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
      await this.clickOn(publishButtonDropdown);
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
      await this.clickOn(navBarOpenerIcon);
      await this.clickOn(basicSettingsDropdown);
    }
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
}

export let ExplorationCreatorFactory = (): ExplorationCreator =>
  new ExplorationCreator();
