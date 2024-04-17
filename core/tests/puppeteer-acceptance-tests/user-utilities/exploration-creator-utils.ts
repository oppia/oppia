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

const creatorDashboardUrl = testConstants.URLs.CreatorDashboard;

const createNewExplorationButton = '.e2e-test-create-new-exploration-button';
const tutorialTakeMeToEditorButton = 'button.e2e-test-dismiss-welcome-modal';
const explorationIntroBoxOpenerSection = 'div.e2e-test-state-edit-content';
const editCardNameButton = '.e2e-test-state-name-text';
const editCardNameBox = '.e2e-test-state-name-input';
const explorationIntroBox = 'div.e2e-test-rte';
const introSubmitButton = 'button.e2e-test-state-name-submit';
const introTitleSubmitButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const endExplorationInteractionOption =
  '.e2e-test-interaction-tile-EndExploration';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const settingsTab = 'a.e2e-test-exploration-settings-tab';
const addTitleBar = 'input#explorationTitle';
const addGoalButton = '.e2e-test-exploration-objective-input';
const categoryDropDown = 'mat-select.e2e-test-exploration-category-dropdown';
const languageUpdateDropDown =
  'mat-select.e2e-test-exploration-language-select';
const addTagsInputBox = 'input.e2e-test-chip-list-tags';
const previewSummaryButton = 'button.e2e-test-open-preview-summary-modal';
const dismissPreviewButton = 'button.e2e-test-close-preview-summary-modal';
const textToSpeechToggle = 'label.e2e-test-on-off-switch';
const feedbackToggle = 'label.e2e-test-enable-fallbacks';

const editRolebutton = '.e2e-test-edit-roles';
const addUserNameInputBox = '#newMemberUsername';
const addRoleDropDown = 'mat-select.e2e-test-role-select';
const collaboratorRoleOption = 'Collaborator (can make changes)';
const playtesterRoleOption = 'Playtester (can give feedback)';
const saveRoleButton = 'button.e2e-test-save-role';
const deleteExplorationButton = 'button.e2e-test-delete-exploration-button';
const desktopSaveDraftButton = 'button.e2e-test-save-changes';
const saveDraftConfirmButton = '.e2e-test-save-draft-button';
const desktopPublishButton = 'button.e2e-test-publish-exploration';
const discardDraftDropDown = 'button.e2e-test-save-discard-toggle';
const desktopDiscardDraftButton = 'a.e2e-test-discard-changes';
const discardConfirmButton = 'button.e2e-test-confirm-discard-changes';
const deleteConfirmButton = 'button.e2e-test-really-delete-exploration-button';
const voiceArtistEditButton = 'span.e2e-test-edit-voice-artist-roles';
const voiceArtistSaveButton = 'button.e2e-test-add-voice-artist-role-button';
const confirmPublishButton = 'button.e2e-test-confirm-publish';
const commitMessage = 'textarea.e2e-test-commit-message-input';
const closePublishedPopUpButton = 'button.e2e-test-share-publish-close';
const voiceArtistUserNameInputBox = 'input#newVoicAartistUsername';

/**
 * For mobile.
 */
const navBarOpenerIcon = 'i.e2e-test-mobile-options';
const optionsDropDown = 'div.e2e-test-mobile-options-dropdown';
const mobileSettingsBar = 'li.e2e-test-mobile-settings-button';
const basicSettingsDropDown = 'h3.e2e-test-settings-container';
const feedbackSettingsDropdown = 'h3.e2e-test-feedback-settings-container';
const permissionSettingsDropDown = 'h3.e2e-test-permission-settings-container';
const voiceArtistSettingsDropDown =
  'h3.e2e-test-voice-artists-settings-container';
const rolesSettingsDropDown = 'h3.e2e-test-roles-settings-container';
const advanceSettingsDropDown = 'h3.e2e-test-advanced-settings-container';
const explorationControlsSettingsDropDown =
  'h3.e2e-test-controls-bar-settings-container';
const mobileSaveDraftButton = 'button.e2e-test-save-changes-for-small-screens';
const mobilePublishButton = 'button.e2e-test-mobile-publish-button';
const publishButtonDropDown = 'div.e2e-test-mobile-changes-dropdown';
const mobileDiscardButton = 'div.e2e-test-mobile-exploration-discard-tab';

let explorationUrlAfterPublished = '';
export class ExplorationCreator extends BaseUser {
  async openCreatorDashboardPage(): Promise<void> {
    await this.goto(creatorDashboardUrl);
    showMessage('Creator dashboard page is opened successfully.');
  }

  /**
   * This function clicks on new exploration button.
   */
  async createNewExploration(): Promise<void> {
    await this.clickOn(createNewExplorationButton);
  }

  /**
   * This function closes the tutorial popup before a new exploration.
   */
  async switchToEditorTab(): Promise<void> {
    await this.clickOn(tutorialTakeMeToEditorButton);
    showMessage('Tutorial popup closed successfully.');
  }

  /**
   * This function clears previous card name and
   * add a new card name.
   */
  async updateCardName(cardName: string): Promise<void> {
    await this.clickOn(editCardNameButton);
    await this.waitForElementToBeClickable(editCardNameBox);
    await this.page.click(editCardNameBox, {clickCount: 3});
    await this.page.keyboard.press('Backspace');
    await this.type(editCardNameBox, cardName);
    await this.clickOn(introSubmitButton);
    showMessage('Card name updated successfully.');
  }

  /**
   * This function clears previous intro text and
   * add a new intro text.
   */
  async updateExplorationIntroText(introtext: string): Promise<void> {
    await this.clickOn(explorationIntroBoxOpenerSection);
    await this.clickOn(explorationIntroBox);
    await this.waitForElementToBeClickable(explorationIntroBox);
    await this.page.click(explorationIntroBox, {clickCount: 3});
    await this.page.keyboard.press('Backspace');
    await this.type(explorationIntroBox, introtext);
    await this.clickOn(introTitleSubmitButton);
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
   * This function open settings tab.
   * Note->It also opens all the dropdowns present
   * in the setting tab for mobile view port.
   */
  async goToSettingsTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(navBarOpenerIcon, {visible: true});
      await this.clickOn(navBarOpenerIcon);
      await this.clickOn(optionsDropDown);
      await this.clickOn(mobileSettingsBar);
      /**
       * Open all dropdowns because by default
       * all dropdowns are closed.
       */
      await this.clickOn(basicSettingsDropDown);
      await this.clickOn(advanceSettingsDropDown);
      await this.clickOn(rolesSettingsDropDown);
      await this.clickOn(voiceArtistSettingsDropDown);
      await this.clickOn(permissionSettingsDropDown);
      await this.clickOn(feedbackSettingsDropdown);
      await this.clickOn(explorationControlsSettingsDropDown);
    } else {
      await this.clickOn(settingsTab);
    }
    showMessage('Settings tab is opened successfully.');
  }

  /**
   * This function deletes the previous written
   * title and updates the new title.
   */
  async updateTitleTo(title: string): Promise<void> {
    await this.waitForElementToBeClickable(addTitleBar);
    await this.page.click(addTitleBar, {clickCount: 3});
    await this.page.keyboard.press('Backspace');
    await this.type(addTitleBar, title);
    await this.page.keyboard.press('Tab');
    showMessage(`Title has been updated to ${title}`);
  }

  /**
   * This function checks length of title bar at basic settings tab.
   */
  async expectTruncatedTitleWhenMaxLengthExceeded(
    maxLength: number
  ): Promise<void> {
    const titleInput = await this.page.$(addTitleBar);
    const title = await this.page.evaluate(input => input.value, titleInput);
    const titleLength = title.length;

    if (titleLength === maxLength) {
      showMessage(`Title is properly truncated to ${maxLength} characters.`);
    } else {
      throw new Error(`Title is not properly truncated.
          Expected length: ${maxLength}, Actual length: ${title.length}`);
    }
  }

  /**
   * This function clears previous goal and
   * adds a new goal in the exploration.
   */
  async updateGoalTo(goal: string): Promise<void> {
    await this.clickOn(addGoalButton);
    await this.waitForElementToBeClickable(addGoalButton);
    await this.page.click(addGoalButton, {clickCount: 3});
    await this.page.keyboard.press('Backspace');
    await this.type(addGoalButton, goal);
    await this.page.keyboard.press('Tab');
  }

  /**
   * This function matches the goal with expected goal.
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
   * This function selects a category from dropdown.
   * For Eg. Algebra, Biology, Chemistry etc.
   */
  async selectCategory(category: string): Promise<void> {
    await this.clickOn(categoryDropDown);
    await this.clickOn(category);
  }

  /**
   * The function is checking if the category
   * matches the expected category.
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
     * Language dropdown was visible, but when we click on that then options
     * appear at wrong place which requires to click more than one time also it
     * added some type of flake.So, to avoid that we are scrolling the page.
     * We can use 300 - 500px to move the language dropdown to the upper
     * part of the page.
     */
    await this.page.evaluate(() => {
      window.scrollTo(0, 350);
    });

    await this.clickOn(languageUpdateDropDown);
    await this.clickOn(language);
  }

  /**
   *  This function verifies that the selected language matches the
   *  expected language.
   */
  async expectSelectedLanguageToBe(expectedLanguage: string): Promise<void> {
    await this.page.waitForSelector(languageUpdateDropDown);
    const languageDropdown = await this.page.$(languageUpdateDropDown);
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
     * Converting tags to lowercase because while accessing added tags with
     * `document.querySelectorAll('mat-chip')` we get tags converted in lowercase.
     */
    const lowercaseExpectedTags = expectedTags.map(tag => tag.toLowerCase());
    await this.page.waitForSelector('mat-chip-list');
    const addedTags = await this.page.evaluate(() => {
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
      if (!addedTags.includes(expectedTag)) {
        throw new Error(`Tag "${expectedTag}" was not added.`);
      }
    }

    showMessage('All expected tags were added successfully.');
  }

  /**
   * This function allows you to preview the summary of exploration.
   */
  async previewSummary(): Promise<void> {
    await this.clickOn(previewSummaryButton);
    await this.expectPreviewSummaryToBeVisible();
    await this.clickOn(dismissPreviewButton);
  }

  /**
   * This function verifies that the preview summary is visible.
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
   * This function enables Automatic Text-to-Speech
   * switch present in settings tab.
   */
  async enableAutomaticTextToSpeech(): Promise<void> {
    await this.clickOn(textToSpeechToggle);
    await this.expectAutomaticTextToSpeechToBeEnable();
  }

  /**
   * This function checks whether the Automatic Text-to-Speech
   * setting is enabled or disabled.
   */
  async expectAutomaticTextToSpeechToBeEnable(): Promise<void> {
    await this.page.waitForSelector('#text-speech-switch');
    const autoTTSswitch = await this.page.$('#text-speech-switch');
    const isAutoTTSwitchOn = await this.page.evaluate(
      switchElement => switchElement.checked,
      autoTTSswitch
    );
    if (isAutoTTSwitchOn) {
      showMessage('Automatic Text-to-Speech is enabled.');
    } else {
      throw error('Automatic Text-to-Speech is disabled.');
    }
  }

  /**
   * This function assigns a role of collaborator to any guest user.
   */
  async assignUserToCollaboratorRole(username: string): Promise<void> {
    await this.clickOn(editRolebutton);
    await this.clickOn(addUserNameInputBox);
    await this.type(addUserNameInputBox, username);
    await this.clickOn(addRoleDropDown);
    await this.clickOn(collaboratorRoleOption);
    await this.clickOn(saveRoleButton);
    showMessage(`${username} has been added as collaboratorRoleOption.`);
  }

  /**
   * This function assigns a role of Playtester to any guest user.
   */
  async assignUserToPlaytesterRole(username: string): Promise<void> {
    await this.clickOn(editRolebutton);
    await this.page.waitForSelector('.e2e-test-editor-role-names', {
      visible: true,
    });
    await this.clickOn(addUserNameInputBox);
    await this.type(addUserNameInputBox, username);
    await this.clickOn(addRoleDropDown);
    await this.clickOn(playtesterRoleOption);
    await this.clickOn(saveRoleButton);
    showMessage(`${username} has been added as playtester.`);
  }

  /**
   * Exception function to verify the setting
   * of the exploration to Public/Private.
   */
  async expectExplorationToBePublish(): Promise<void> {
    let publishButtonSelector = '.e2e-test-publish-exploration';
    if (this.isViewportAtMobileWidth()) {
      publishButtonSelector = mobilePublishButton;
      await this.clickOn(publishButtonDropDown);
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
   * This function add voice artists in the exploration.
   */
  async addVoiceArtists(voiceArtists: string[]): Promise<void> {
    for (let i = 0; i < voiceArtists.length; i++) {
      await this.clickOn(voiceArtistEditButton);
      await this.clickOn(voiceArtistUserNameInputBox);
      await this.page.waitForSelector(voiceArtistUserNameInputBox, {
        visible: true,
      });
      await this.page.click(voiceArtistUserNameInputBox, {clickCount: 3});
      await this.page.keyboard.press('Backspace');
      await this.type(voiceArtistUserNameInputBox, voiceArtists[i]);
      await this.clickOn(voiceArtistSaveButton);
      await this.page.waitForSelector(
        `div.e2e-test-voice-artist-${voiceArtists[i]}`,
        {visible: true}
      );

      showMessage(voiceArtists[i] + ' has been added as a voice artist.');
    }
  }

  /**
   * This function helps to choose notification type by enabling/disabling
   * the feedback toggle.
   */
  async optInToEmailNotifications(): Promise<void> {
    await this.clickOn(feedbackToggle);
    await this.expectEmailNotificationsToBeActivated();
  }

  /**
   * Exception function to verify the choice of receiving feedback
   * and suggestion notifications via email
   */
  async expectEmailNotificationsToBeActivated(): Promise<void> {
    await this.page.waitForSelector('input[id="feedback-switch"]');
    const input = await this.page.$('input[id="feedback-switch"]');

    if (!input) {
      throw new Error('Feedback switch input element not found.');
    }
    const feedbackSwitchIsActive = await input.evaluate(
      input => (input as HTMLInputElement).checked
    );

    if (!feedbackSwitchIsActive) {
      showMessage('suggestion notifications via email are enabled.');
    } else {
      throw new Error('suggestion notifications via email are disabled.');
    }
  }

  /**
   * This function deletes the exploration permanently.
   * Note: This action requires Curriculum Admin role.
   */
  async deleteExploration(): Promise<void> {
    await this.clickOn(deleteExplorationButton);
    await this.clickOn(deleteConfirmButton);
  }

  /**
   * This function save the changes of the exploration.
   */
  async saveDraftExploration(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileSaveDraftButton);
    } else {
      await this.clickOn(desktopSaveDraftButton);
    }

    await this.clickOn(commitMessage);
    await this.type(commitMessage, 'Testing Testing');
    await this.clickOn(saveDraftConfirmButton);
    await this.page.waitForFunction('document.readyState === "complete"');
    showMessage('Exploration is saved successfully.');
  }

  async publishExploration(): Promise<string | null> {
    await this.saveDraftExploration();
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector('.e2e-test-toast-message', {
        visible: true,
      });
      await this.page.waitForSelector('.e2e-test-toast-message', {
        hidden: true,
      });
      await this.clickOn(publishButtonDropDown);
      await this.clickOn(mobilePublishButton);
    } else {
      await this.clickOn(desktopPublishButton);
    }
    await this.clickOn(confirmPublishButton);
    await this.page.waitForSelector(closePublishedPopUpButton, {visible: true});

    explorationUrlAfterPublished = await this.page.url();
    const explorationId = explorationUrlAfterPublished
      .replace(/^.*\/create\//, '')
      .replace(/#\/.*/, '');

    await this.clickOn(closePublishedPopUpButton);
    await this.expectExplorationToBePublish();

    return explorationId;
  }

  async expectExplorationToBeAccessibleWithTheUrl(
    expression: string
  ): Promise<void> {
    if (expression === 'Yes') {
      try {
        await this.page.goto(explorationUrlAfterPublished);
        showMessage('Exploration is accessible with the URL i.e Published');
      } catch (error) {
        throw new Error('The exploration is not public.');
      }
    } else {
      try {
        await this.page.goto(explorationUrlAfterPublished);
        throw new Error('The exploration is still public.');
      } catch (error) {
        showMessage(
          'The exploration is not accessible with the URL i.e Deleted'
        );
      }
    }
  }

  /**
   * This function discards the current changes.
   */
  async discardCurrentChanges(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(publishButtonDropDown);
      await this.clickOn(mobileDiscardButton);
    } else {
      await this.page.keyboard.press('Tab');
      await this.clickOn(discardDraftDropDown);
      await this.page.waitForSelector(desktopDiscardDraftButton, {
        visible: true,
      });
      await this.clickOn(desktopDiscardDraftButton);
    }
    await this.page.waitForSelector(discardConfirmButton, {
      visible: true,
    });
    await Promise.all([
      this.clickOn(discardConfirmButton),
      this.page.waitForNavigation(),
    ]);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(navBarOpenerIcon);
      await this.clickOn(basicSettingsDropDown);
    }
  }

  /**
   * This function matches the expected title with current title.
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
