// Copyright 2023 The Oppia Authors. All Rights Reserved.
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

const baseUser = require(
  '../puppeteer-testing-utilities/puppeteer-utils.js');
const { showMessage } = require(
  '../puppeteer-testing-utilities/show-message-utils.js');

const creatorDashboardUrl = 'http://localhost:8181/creator-dashboard';
const createNewExplorationButton =
'.e2e-test-create-new-exploration-button';
const takeMeToEditorButton = '.e2e-test-dismiss-welcome-modal';
const addCardName = '.e2e-test-state-name-text';
const introSubmitButton = '.e2e-test-state-name-submit';
const forButtonToBeEnabled =
'.e2e-test-state-name-submit:not([disabled])';
const introTitleSubmitButton = '.e2e-test-save-state-content';
const interactionAddbutton = '.oppia-add-interaction-button';
const endExplorationTab =
'img[src="/extensions/interactions/EndExploration/static/EndExploration.png"]';
const saveInteractionButton = '.e2e-test-save-interaction';
const basicSettingsTab =
'.nav-link[aria-label="Exploration Setting Button"]';
const addTitleBar = '.e2e-test-exploration-title-input';
const addTitle = '.e2e-test-exploration-title-input';
const addGoalBar = '.e2e-test-exploration-objective-input';
const addGoal = '.e2e-test-exploration-objective-input';
const cateogryDropDawn = '.mat-select-arrow-wrapper';
const addCateogry = '#mat-option-69';
const languageUpdateBar = '#mat-select-value-9';
const addLanguage = '#mat-option-6';
const addTags = '#mat-chip-list-input-0';
const previewSummaryButton = '#clickToSeePreviewSummary';
const dismissPreviewButton = '.e2e-test-close-preview-summary-modal';
const textToSpeechToggle = 'label[for="text-speech-switch"]';
const feedbackToggle = 'label[for="feedback-switch"]';

const editbutton = '.oppia-edit-roles-btn';
const addUserName = '#newMemberUsername';
const addRoleBar = '#mat-select-value-11';
const collaboratorRoleOption = '#mat-option-62';
const playTesterRoleOption = '#mat-option-63';
const saveRole = '.e2e-test-save-role';
const deleteExplorationButton = '.oppia-delete-button';
const saveDraftButton = '.oppia-save-draft-button';
const publishButton = '.oppia-editor-publish-button';
const discardDraftButton = '#mat-menu-panel-0';
const deleteConfirmButton =
'.e2e-test-really-delete-exploration-button';
const voiceArtistEditButton = '.e2e-test-edit-voice-artist-roles';
const voiceArtistSaveButton =
'.e2e-test-add-voice-artist-role-button';
const publishConfirmButton = '.e2e-test-confirm-pre-publication';
const commitMessage = '.e2e-test-commit-message-input';
const closePublishedPopUp = '.e2e-test-share-publish-close';
const addVoiceArtistUserName = '#newVoicAartistUsername';

let titleBeforeChanges = '';

module.exports = class e2eExplorationCreator extends baseUser {
  /**
   * This function helps in making a new exploration.
   */
  async createExploration() {
    await this.goto(creatorDashboardUrl);
    await this.clickOn(createNewExplorationButton);
    await this.clickOn(takeMeToEditorButton);
    await this.clickOn(addCardName);
    await this.type('.e2e-test-state-name-input', 'Test question');
    await this.page.waitForSelector(forButtonToBeEnabled);
    await this.clickOn(introSubmitButton);
    await this.clickOn('.e2e-test-edit-content-pencil-button');
    await this.type('.e2e-test-rte', 'Exploration intro text');
    await this.clickOn(introTitleSubmitButton);
    await this.clickOn(interactionAddbutton);
    await this.clickOn(endExplorationTab);
    await this.clickOn(saveInteractionButton);

    showMessage('Successfully created a exploration!');
  }

  /**
   * This function helps in reaching setting tab successfully.
   */
  async goToBasicSettingsTab() {
    await this.clickOn(basicSettingsTab);
  }

  /**
   * This function helps in updating basic settings.
   */
  async updateBasicSettings() {
    await this.clickOn(addTitleBar);
    await this.type(addTitle, 'Your Title Here');
    await this.clickOn(addGoalBar);
    await this.type(addGoal, 'Your Goal Here Please');
    await this.clickOn(cateogryDropDawn);
    await this.clickOn(addCateogry);
    await this.clickOn(languageUpdateBar);
    await this.clickOn(addLanguage);
    await this.clickOn(addTags);
    await this.type(addTags, 'Your Tag Here');

    showMessage('Successfully updated basic settings!');
  }

  /**
   * This function checks length of title bar at basic settings tab
   * @param {Number} maxLength
   */
  async expectTitleToHaveMaxLength(maxLength) {
    const titleInput = await this.page.$(
      '.e2e-test-exploration-title-input');
    const title = await this.page.evaluate(
      input =>input.value, titleInput);
    const titleLength = title.length;

    if (titleLength <= maxLength) {
      showMessage(
        'Title length is within the' +
        ` allowed limit of ${maxLength} characters.`);
    } else {
      throw new Error(
        'Title length exceeds the allowed' +
        ` limit of ${maxLength} characters.`);
    }
  }

  /**
   * This function checks if the goal has been set in the exploration.
   */
  async expectGoalToBeSet() {
    const goalInput = await this.page.$(
      '.e2e-test-exploration-objective-input');
    const goal = await this.page.evaluate(
      input => input.value, goalInput);
    if (goal.trim().length > 0) {
      showMessage('The goal has been set for the exploration.');
    } else {
      throw new Error('The goal has not been set for the exploration.');
    }
  }

  /**
   * This function checks if a category has been selected for the exploration.
   */
  async expectCategoryToBeSelected() {
    const categoryDropdown = await this.page.$('.mat-select-arrow-wrapper');
    await categoryDropdown.click();

    const selectedCategory = await this.page.evaluate(() => {
      const selectedOption = document.querySelector(
        '.e2e-test-exploration-category-selector-choice[aria-selected="true"]');
      if (selectedOption) {
        return selectedOption.innerText.trim();
      } else {
        return null;
      }
    });

    if (selectedCategory !== null) {
      showMessage(
        `The category ${selectedCategory}` +
        ' has been selected for the exploration.');
    } else {
      throw new Error('No category has been selected for the exploration.');
    }
  }

  /**
   *  This function verifies that the selected language is displayed correctly.
   */
  async expectLanguageToBeSelected() {
    const languageDropdown = await this.page.$('#mat-select-value-9');
    const language = await this.page.evaluate(
      option => option.textContent, languageDropdown);
    if (language) {
      showMessage(`Language ${language} is selected.`);
    } else {
      throw new Error('Language is not selected.');
    }
  }

  /**
   * This function checks if tags are successfully added.
   */
  async expectTagsToBeAdded() {
    const tags = await this.page.$$('#mat-chip-list-input-0');
    if (tags.length > 0) {
      showMessage(`${tags.length} tag's added successfully.`);
    } else {
      throw new Error('Tags are not added.');
    }
  }

  /**
   * This function allows you to preview the exploration.
   */
  async previewSummary() {
    await this.page.waitForSelector(
      '#clickToSeePreviewSummary:not([disabled])');
    await this.clickOn(previewSummaryButton);
    await this.clickOn(previewSummaryButton);
    await this.clickOn(dismissPreviewButton);
  }

  /**
   * This function verifies that the preview summary is visible.
   */
  async expectPreviewSummaryToBeVisible() {
    const previewSummary = await this.page.$(
      '.e2e-test-open-preview-summary-modal');
    if (previewSummary) {
      showMessage('Preview summary is visible.');
    } else {
      throw new Error('Preview summary is not visible.');
    }
  }

  /**
   * This function helps in updating advanced settings
   */
  async updateAdvancedSettings() {
    await this.clickOn(textToSpeechToggle);

    showMessage('Successfully updated advanced settings!');
  }

  /**
   * This function checks whether the Automatic Text-to-Speech
   * setting is enabled or disabled.
   */
  async expectAutomaticTextToSpeechToBeEnabledOrDisabled() {
    const autoTTSwitch = await this.page.$('#text-speech-switch');
    const isAutoTTSwitchOn = await this.page.evaluate(
      switchElement => switchElement.checked, autoTTSwitch);
    if (isAutoTTSwitchOn) {
      showMessage('Automatic Text-to-Speech is enabled.');
    } else {
      showMessage('Automatic Text-to-Speech is disabled.');
    }
  }

  /**
   * This function helps in assigning role of collaborator to any guest user.
   */
  async assignUserToCollaboratorRole() {
    await this.clickOn(editbutton);
    await this.clickOn(addUserName);
    await this.type(addUserName, 'guestUsr1');
    await this.clickOn(addRoleBar);
    await this.clickOn(collaboratorRoleOption);
    await this.clickOn(saveRole);
  }

  /**
   * This function helps in assigning role of Playtester to guest user.
   */
  async assignUserToPlayTesterRole() {
    await this.clickOn(editbutton);
    await this.clickOn(addUserName);
    await this.type(addUserName, 'guestUsr2');
    await this.clickOn(addRoleBar);
    await this.clickOn(playTesterRoleOption);
    await this.clickOn(saveRole);
  }

  /**
   * This function helps in making exploration Public.
   */
  async makeExplorationPublic() {
    await this.publishExploration();
  }

  /**
   *Exception function to verify the setting
   *of the exploration to Public/Private
   */
  async expectExplorationAccessibility() {
    const publishButton = await this.page.$('.e2e-test-publish-exploration');
    if (publishButton) {
      showMessage(
        'Exploration is set to Private and is not' +
        ' accessible to Oppia users.');
    } else {
      showMessage(
        'Exploration is set to Public and is accessible to Oppia users.');
    }
  }

  /**
   * This function helps in adding voice artist.
   */
  async voiceArtistAdded() {
    await this.clickOn(voiceArtistEditButton);
    await this.clickOn(addVoiceArtistUserName);
    await this.type(addVoiceArtistUserName, 'guestUsr3');
    await this.clickOn(voiceArtistSaveButton);
  }

  /**
   * This function verifies the selection of a voice artist.
   * @param {string} expectedUsername The username of the expected voice artist.
   */
  async expectVoiceArtistToBeAdded() {
    const voiceArtistInput = await this.page.$(addVoiceArtistUserName);
    const voiceArtistUsername = await this.page.evaluate(
      input => input.value, voiceArtistInput);
    if (voiceArtistUsername === 'guestUsr3') {
      showMessage('Voice artist guestUsr3 has been successfully added.');
    } else {
      throw new Error('Voice artist guestUsr3  was not added.');
    }
  }

  /**
   * This function helps to choose notification type.
   */
  async chooseToRecieveNotification() {
    await this.clickOn(feedbackToggle);
  }

  /**
   * Exception function to verify the choice of receiving feedback
   * and suggestion notifications via email
   */
  async expectFeedbackNotificationChoice() {
    const isChecked = await this.page.$eval(
      'input[id="feedback-switch"]', input => input.checked);
    if (isChecked) {
      showMessage('suggestions notifications via email are enabled.');
    } else {
      showMessage('Feedback notifications via email are enabled.');
    }
  }

  /**
   * This funciton helps in deleting the exploration successfully.
   */
  async deleteExploration() {
    await this.clickOn(deleteExplorationButton);
    await this.clickOn(deleteConfirmButton);
  }

  /**
   * This function helps in verifying , if exploration is
   * deleted successfully?
   */
  async expectExplorationToBeDeleted() {
    const deleteButton = await this.page.$('.oppia-delete-button');
    if (!deleteButton) {
      showMessage('Exploration has been successfully deleted.');
    } else {
      throw new Error('Error: Exploration was not deleted.');
    }
  }

  /**
   * This function helps in drafting the exploration.
   */
  async saveDraftExploration() {
    await this.clickOn(saveDraftButton);
    await this.clickOn(commitMessage);
    await this.type(commitMessage, 'Testing Testing');
    await this.clickOn('.e2e-test-save-draft-button');
  }

  /**
   * This function checks whether changes has been drafted or not.
   */
  async exceptExplorationToBeDrafted() {
    const isDraftButtonDisabled = await this.page.$eval(
      '#tutorialSaveButton', button => button.disabled);
    if (isDraftButtonDisabled) {
      showMessage('Changes have been successfully drafted.');
    } else {
      throw new Error('Failed to draft changes.');
    }
  }

  /**
   * This function helps in publishing the exploration
   */
  async publishExploration() {
    await this.saveDraftExploration();
    await this.page.waitForSelector(publishButton);
    await this.clickOn(publishButton);
    await this.page.waitForSelector(publishConfirmButton);
    await this.clickOn(publishConfirmButton);
    await this.clickOn('.e2e-test-confirm-publish');
    await this.clickOn(closePublishedPopUp);
  }

  /**
   * This function helps in publishing changes.
   */
  async publishChanges() {
    await this.saveDraftExploration();
  }

  /**
  *This function checks whether the exploration
  *is published successfully or not.
  */
  async expectInteractionOnCreatorDashboard() {
    const currentUrl = await this.page.url();
    const explorationId = currentUrl.split('/create/')[1].split('#/')[0];
    await this.page.goto(creatorDashboardUrl);
    const isExplorationPresent = await page.evaluate((explorationId) => {
      const explorationContainer = document.querySelector(
        '.oppia-card-view-wrap');
      const explorationLinks = Array.from(
        explorationContainer.querySelectorAll('a[href]'));
      return explorationLinks.some(link => link.getAttribute(
        'href') === `/create/${explorationId}`);
    }, explorationId);
    if (isExplorationPresent) {
      showMessage(
        `Exploration with ID ${explorationId}` +
        ' is present on the creator dashboard.');
    } else {
      throw new Error(
        `Exploration with ID ${explorationId}` +
        ' is not present on the creator dashboard.');
    }
  }

  /**
   * This function helps in doing some changes in exploration.
   */
  async addSomeChanges() {
    await this.clickOn(basicSettingsTab);
    titleBeforeChanges = await this.page.$eval(
      '.e2e-test-exploration-title-input', title => title.value);
    await this.clickOn(addTitleBar);
    await this.type(addTitle, 'Your Title Here please');
  }

  async discardCurrentChanges() {
    await this.clickOn('.e2e-test-save-discard-toggle');
    await this.clickOn(discardDraftButton);
  }

  /**
  *This function checks whether changes has discarded successfully or not
  */
  async expectChangesToBeDiscarded() {
    const titleAfterChanges = await this.page.$eval(
      '.e2e-test-exploration-title-input', title => title.value);
    if (titleBeforeChanges === titleAfterChanges) {
      showMessage('Changes have been discarded successfully.');
    } else {
      throw new Error('Failed to discard changes.');
    }
  }
};
