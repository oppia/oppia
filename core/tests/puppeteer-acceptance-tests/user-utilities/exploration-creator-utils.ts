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
const takeMeToEditorButton = 'button.e2e-test-dismiss-welcome-modal';
const addCardName = '.e2e-test-state-name-text';
const explorationIntroBox = 'div.e2e-test-rte';
const introSubmitButton = 'button.e2e-test-state-name-submit';
const forButtonToBeEnabled =
  'button.e2e-test-state-name-submit:not([disabled])';
const introTitleSubmitButton = 'button.e2e-test-save-state-content';
const interactionAddbutton = 'button.e2e-test-open-add-interaction-modal';
const endInteractionTab = '.e2e-test-interaction-tile-EndExploration';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const settingsTab = '.nav-link[aria-label="Exploration Setting Button"]';
const addTitleBar = 'input#explorationTitle';
const addGoal = '.e2e-test-exploration-objective-input';
const categoryDropDown = 'mat-select.e2e-test-exploration-category-dropdown';
const languageUpdateBar = 'mat-select.e2e-test-exploration-language-select';
const addTags = 'input.e2e-test-chip-list-tags';
const previewSummaryButton = 'button.e2e-test-open-preview-summary-modal';
const dismissPreviewButton = 'button.e2e-test-close-preview-summary-modal';
const textToSpeechToggle = 'label[for="text-speech-switch"]';
const feedbackToggleOff = 'label[for="feedback-switch"]';

const editbutton = '.e2e-test-edit-roles';
const addUserName = '#newMemberUsername';
const addRoleBar = 'mat-select.e2e-test-role-select';
const collaborator = 'Collaborator (can make changes)';
const playtester = 'Playtester (can give feedback)';
const saveRole = 'button.e2e-test-save-role';
const deleteExplorationButton = 'button.e2e-test-delete-exploration-button';
const saveDraftButton = 'button.e2e-test-save-changes';
const publishButton = 'button.e2e-test-publish-exploration';
const discardDraftButton = 'a.e2e-test-discard-changes';
const discardConfirmButton = 'button.e2e-test-confirm-discard-changes';
const deleteConfirmButton = 'button.e2e-test-really-delete-exploration-button';
const voiceArtistEditButton = 'span.e2e-test-edit-voice-artist-roles';
const voiceArtistSaveButton = 'button.e2e-test-add-voice-artist-role-button';
const publishConfirmButton = 'button.e2e-test-confirm-publish';
const commitMessage = 'textarea.e2e-test-commit-message-input';
const closePublishedPopUp = 'button.e2e-test-share-publish-close';
const addVoiceArtistUserName = 'input#newVoicAartistUsername';

/**
 * For mobile.
 */
const navBarOpener = 'i.e2e-test-mobile-options';
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
  /**
   * This function helps in reaching dashboard Url.
   */
  async openCreatorDashboardPage(): Promise<void> {
    await this.goto(creatorDashboardUrl);
  }

  /**
   * This function helps in reaching editor section.
   */
  async switchToEditorTab(): Promise<void> {
    await this.clickOn(createNewExplorationButton);
    await this.clickOn(takeMeToEditorButton);
  }

  /**
   * This function helps in updating Card Name.
   */
  async updateCardName(cardName: string): Promise<void> {
    await this.clickOn(addCardName);
    await this.type('.e2e-test-state-name-input', cardName);
    await this.page.waitForSelector(forButtonToBeEnabled);
    await this.clickOn(introSubmitButton);
    showMessage('Card name updated successfully.');
  }

  /**
   * This function helps in updating exploration intro text.
   */
  async updateExplorationIntroText(Introtext: string): Promise<void> {
    await this.clickOn('div.e2e-test-state-edit-content');
    await this.clickOn(explorationIntroBox);
    await this.type(explorationIntroBox, Introtext);
    await this.clickOn(introTitleSubmitButton);
    showMessage('Intro text updated successfully.');
  }

  /**
   * This function helps in adding interaction.
   */
  async addEndInteraction(): Promise<void> {
    await this.page.waitForNavigation({waitUntil: 'networkidle0'});
    await this.clickOn(interactionAddbutton);
    await this.clickOn(endInteractionTab);
    await this.clickOn(saveInteractionButton);
    showMessage(
      'End Exploration has been added and' +
        'successfully created an exploration.'
    );
  }

  /**
   * This function helps in reaching setting tab successfully.
   */
  async goToSettingsTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(navBarOpener, {visible: true});
      await this.clickOn(navBarOpener);
      await this.clickOn(optionsDropDown);
      await this.clickOn(mobileSettingsBar);
      /**
       * Open all dropdowns.
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
  }

  /**
   * This function helps in updating Title.
   */
  async addTitle(Title: string): Promise<void> {
    await this.page.waitForSelector(`${addTitleBar}:not([disabled])`);
    await this.type(addTitleBar, Title);
    showMessage('Title has been updated to ' + Title);
  }

  /**
   * This function checks length of title bar at basic settings tab.
   */
  async expectTitleToHaveMaxLength(maxLength: number): Promise<void> {
    const titleInput = await this.page.$('.e2e-test-exploration-title-input');
    const title = await this.page.evaluate(input => input.value, titleInput);
    const titleLength = title.length;

    if (titleLength <= maxLength) {
      showMessage(
        'Title length is within the' +
          ` allowed limit of ${maxLength} characters.`
      );
    } else {
      throw new Error(
        'Title length exceeds the allowed' +
          ` limit of ${maxLength} characters.`
      );
    }
  }

  /**
   * This function helps in adding a goal.
   */
  async updateGoalTo(goal: string): Promise<void> {
    await this.clickOn(addGoal);
    await this.type(addGoal, goal);
  }

  /**
   * This function checks if the goal has been set in the exploration.
   */
  async expectGoalToEqual(expectedGoal: string): Promise<void> {
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
   * This function helps in selecting a category from dropdown.
   */
  async selectACategory(category: string): Promise<void> {
    await this.clickOn(categoryDropDown);
    await this.clickOn(category);
  }

  /**
   * This function checks if a category has been selected for the exploration.
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
        `The category ${selectedCategory}` + ' is same as expectedCategory.'
      );
    } else {
      throw new Error('Category is not correct.');
    }
  }

  /**
   * This function helps in selecting language from dropdown.
   */
  async selectALanguage(language: string): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, 350);
    });

    await this.clickOn(languageUpdateBar);
    await this.clickOn(language);
  }

  /**
   *  This function verifies that the selected language is displayed correctly.
   */
  async expectSelectedLanguageToBe(expectedLanguage: string): Promise<void> {
    await this.page.waitForSelector(languageUpdateBar);
    const languageDropdown = await this.page.$(languageUpdateBar);
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
      const selectedLanguageText = matOption.innerText.trim();

      /**
       * Extract words within parentheses using regex العربية (Arabic) -> Arabic
       */
      const matches = selectedLanguageText.match(/\(([^)]+)\)/);
      if (matches && matches.length >= 2) {
        return matches[1].trim();
      } else {
        // If no parentheses found, assume the whole text is the language.
        // For eg : English.
        return selectedLanguageText.trim();
      }
    });

    if (selectedLanguage === expectedLanguage) {
      showMessage(
        `The language ${selectedLanguage}` + ' is same as expectedLanguage.'
      );
    } else {
      throw new Error('Language is not correct.');
    }
    await this.page.keyboard.press('Enter');
  }

  /**
   * This function helps in adding tags.
   */
  async addTags(TagNames: string[]): Promise<void> {
    for (let i = 0; i < TagNames.length; i++) {
      await this.clickOn(addTags);
      await this.type(addTags, TagNames[i].toLowerCase());
      await this.page.keyboard.press('Tab');
    }
  }

  /**
   * This function checks if tags are successfully added.
   */
  async expectTagsToBeAdded(expectedTags: string[]): Promise<void> {
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
   * This function allows you to preview the exploration.
   */
  async previewSummary(): Promise<void> {
    await this.page.waitForSelector(
      '.e2e-test-open-preview-summary-modal:not([disabled])'
    );
    await this.clickOn(previewSummaryButton);
    await this.clickOn(dismissPreviewButton);
    await this.expectPreviewSummaryToBeVisible();
  }

  /**
   * This function verifies that the preview summary is visible.
   */
  async expectPreviewSummaryToBeVisible(): Promise<void> {
    await this.page.waitForSelector('.e2e-test-open-preview-summary-modal');
    const previewSummary = await this.page.$(
      '.e2e-test-open-preview-summary-modal'
    );

    if (previewSummary) {
      showMessage('Preview summary is visible.');
    } else {
      throw new Error('Preview summary is not visible.');
    }
  }

  /**
   * This function helps in updating advanced settings
   */
  async enableAutomaticTextToSpeech(): Promise<void> {
    await this.clickOn(textToSpeechToggle);
  }

  /**
   * This function checks whether the Automatic Text-to-Speech
   * setting is enabled or disabled.
   */
  async expectAutomaticTextToSpeechToBeEnabled(): Promise<void> {
    await this.page.waitForSelector('#text-speech-switch');
    const autoTTSwitch = await this.page.$('#text-speech-switch');
    const isAutoTTSwitchOn = await this.page.evaluate(
      switchElement => switchElement.checked,
      autoTTSwitch
    );
    if (isAutoTTSwitchOn) {
      showMessage('Automatic Text-to-Speech is enabled.');
    } else {
      throw error('Automatic Text-to-Speech is disabled.');
    }
  }

  /**
   * This function helps in assigning role of collaborator to any guest user.
   */
  async assignUserToCollaboratorRole(username: string): Promise<void> {
    await this.clickOn(editbutton);
    await this.clickOn(addUserName);
    await this.type(addUserName, username);
    await this.clickOn(addRoleBar);
    await this.clickOn(collaborator);
    await this.clickOn(saveRole);
    showMessage(`${username} has been added as collaborator.`);
  }

  /**
   * This function helps in assigning role of Playtester to guest user.
   */
  async assignUserToPlaytesterRole(username: string): Promise<void> {
    await this.clickOn(editbutton);
    await this.page.waitForSelector('.e2e-test-editor-role-names', {
      visible: true,
    });
    await this.clickOn(addUserName);
    await this.type(addUserName, username);
    await this.clickOn(addRoleBar);
    await this.clickOn(playtester);
    await this.clickOn(saveRole);
    showMessage(`${username} has been added as playtester.`);
  }

  /**
   *Exception function to verify the setting
   *of the exploration to Public/Private
   */
  async expectExplorationToBePublished(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(publishButtonDropDown);
      const publishButton = await this.page.$(mobilePublishButton);
      if (!publishButton) {
        showMessage(
          'Exploration is set to Public and is accessible to Oppia users.'
        );
      } else {
        throw new Error(
          'Exploration is set to Private and is not' +
            ' accessible to Oppia users.'
        );
      }
    } else {
      const publishButton = await this.page.$('.e2e-test-publish-exploration');
      if (!publishButton) {
        showMessage(
          'Exploration is set to Public and is accessible to Oppia users.'
        );
      } else {
        throw new Error(
          'Exploration is set to Private and is not' +
            ' accessible to Oppia users.'
        );
      }
    }
  }

  /**
   * This function helps in adding voice artist.
   */
  async addVoiceArtists(voiceArtists: string[]): Promise<void> {
    for (let i = 0; i < voiceArtists.length; i++) {
      await this.clickOn(voiceArtistEditButton);
      await this.clickOn(addVoiceArtistUserName);
      await this.page.waitForSelector(
        `${addVoiceArtistUserName}:not([disabled])`
      );
      await this.page.click(addVoiceArtistUserName, {clickCount: 3});
      await this.page.keyboard.press('Backspace');
      await this.type(addVoiceArtistUserName, voiceArtists[i]);
      await this.clickOn(voiceArtistSaveButton);

      showMessage(voiceArtists[i] + ' has been added successfully.');
    }
  }

  /**
   * This function helps to choose notification type.
   */
  async optInToEmailNotifications(): Promise<void> {
    await this.clickOn(feedbackToggleOff);
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
    const isChecked = await input.evaluate(
      input => (input as HTMLInputElement).checked
    );

    if (!isChecked) {
      showMessage('suggestions notifications via email are enabled.');
    } else {
      throw new Error('suggestions notifications via email are disabled.');
    }
  }

  /**
   * This funciton helps in deleting the exploration successfully.
   */
  async deleteExploration(): Promise<void> {
    await this.page.waitForSelector(
      `${deleteExplorationButton}:not([disabled]`
    );
    await this.clickOn(deleteExplorationButton);
    await this.clickOn(deleteConfirmButton);
  }

  /**
   * This function helps in verifying, if exploration is
   * deleted successfully or not.
   */
  async expectExplorationToBeDeletedSuccessfullyFromCreatorDashboard(): Promise<void> {
    try {
      await this.goto(explorationUrlAfterPublished);
      throw new Error('Exploration is not deleted successfully.');
    } catch (error) {
      showMessage('Exploration is successfully deleted.');
    }
  }

  /**
   * This function helps in drafting the exploration.
   */
  async saveDraftExploration(): Promise<void> {
    await this.page.keyboard.press('Tab');
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileSaveDraftButton);
    } else {
      await this.clickOn(saveDraftButton);
    }

    await this.clickOn(commitMessage);
    await this.type(commitMessage, 'Testing Testing');
    await this.clickOn('.e2e-test-save-draft-button');
  }

  /**
   * This function checks whether changes has been drafted or not.
   */
  async expectExplorationToBeDraftedSuccessfully(): Promise<void> {
    await this.page.waitForSelector('#tutorialSaveButton');
    const button = await this.page.$('#tutorialSaveButton');

    if (!button) {
      throw new Error('Save button not found.');
    }

    const isDraftButtonDisabled = await button.evaluate(
      button => (button as HTMLButtonElement).disabled
    );

    if (isDraftButtonDisabled) {
      showMessage('Changes have been successfully drafted.');
    } else {
      throw new Error('Failed to draft changes.');
    }
  }

  /**
   * This function helps in publishing the exploration
   */
  async publishExploration(): Promise<void> {
    await this.saveDraftExploration();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(publishButtonDropDown);
      await this.clickOn(mobilePublishButton);
    } else {
      await this.page.waitForSelector(`${publishButton}:not([disabled])`);
      await this.clickOn(publishButton);
    }
    await this.page.waitForSelector(`${publishConfirmButton}:not([disabled])`);
    await this.clickOn(publishConfirmButton);
    await this.page.waitForSelector(closePublishedPopUp, {visible: true});
    await this.clickOn(closePublishedPopUp);

    explorationUrlAfterPublished = await this.page.url();
  }

  /**
   * This function checks whether the exploration
   * is published successfully or not.
   */
  async expectInteractionOnCreatorDashboard(): Promise<void> {
    try {
      await this.page.goto(explorationUrlAfterPublished);
      showMessage('Exploration is available on creator dashboard.');
    } catch (error) {
      throw new Error('Failed to navigate to the exploration URL.');
    }
  }

  /**
   * This function is discarding the current changes.
   */
  async discardCurrentChanges(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(publishButtonDropDown);
      await this.clickOn(mobileDiscardButton);
    } else {
      await this.clickOn(basicSettingsDropDown);
      await this.clickOn('button.e2e-test-save-discard-toggle');
      await this.page.waitForSelector(discardDraftButton, {visible: true});
      await this.clickOn(discardDraftButton);
    }
    await this.page.waitForSelector('.e2e-test-confirm-discard-changes', {
      visible: true,
    });
    await Promise.all([
      this.clickOn(discardConfirmButton),
      this.page.waitForNavigation(),
    ]);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(navBarOpener);
      await this.clickOn(basicSettingsDropDown);
    }
  }

  /**
   *This function checks whether changes has discarded successfully or not.
   */
  async expectTitleToBe(expectedTitle: string): Promise<void> {
    await this.page.waitForSelector('.e2e-test-exploration-title-input');
    const titleInput = await this.page.$('.e2e-test-exploration-title-input');
    const titlePresent = await this.page.evaluate(
      input => input.value,
      titleInput
    );

    if (expectedTitle === titlePresent) {
      showMessage('Changes have been updated successfully.');
    } else {
      throw new Error('Failed to update changes.');
    }
  }
}

export let ExplorationCreatorFactory = (): ExplorationCreator =>
  new ExplorationCreator();
