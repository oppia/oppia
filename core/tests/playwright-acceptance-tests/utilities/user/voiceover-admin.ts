// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utility functions for voiceover admin page.
 */

import {Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';
import {ExplorationEditorModal} from '../common/exploration-editor';

const baseURL = testConstants.URLs.BaseURL;
const voiceoverAdminURL = testConstants.URLs.VoiceoverAdmin;

const languageAccentOptionSelector =
  '.e2e-test-language-accent-selector-option';
const addNewLanguageAccentButtonSelector =
  '.e2e-test-add-new-language-accent-button';
const languageAccentDropdownSelector =
  '.e2e-test-language-accent-dropdown-selector';

const settingsTabSelector = 'a.e2e-test-exploration-settings-tab';
const settingsContainerSelector =
  '.oppia-editor-card.oppia-settings-card-container';
const voiceArtistSectionHeaderSelector = '.e2e-test-voice-artists-header';
const voiceArtistSectionBodySelector = '.e2e-test-voice-artists-content';
const editVoiceoverArtistButton = 'span.e2e-test-edit-voice-artist-roles';
const voiceArtistUsernameInputBox = 'input#newVoicAartistUsername';
const saveVoiceoverArtistEditButton =
  'button.e2e-test-add-voice-artist-role-button';

const mobileNavbarDropdown = 'div.e2e-test-mobile-options-dropdown';
const mobileOptionsButtonSelector = 'i.e2e-test-mobile-options';
const mobileSettingsBarSelector = 'li.e2e-test-mobile-settings-button';
const mobileNavbarOptions = '.navbar-mobile-options';
const mobileNavbarPane = '.oppia-exploration-editor-tabs-dropdown';

export class VoiceoverAdmin extends BaseUser {
  /**
   * Function to register supported language and accent combinations for Oppia voiceovers.
   * @param {string} languageAccentDescription - The language-accent to add.
   */
  async addSupportedLanguageAccentPair(
    languageAccentDescription: string
  ): Promise<void> {
    await this.navigateToVoiceoverAdminPage();
    await this.waitForPageToFullyLoad();

    await this.expectElementToBeVisible(addNewLanguageAccentButtonSelector);
    await this.clickOnElementWithSelector(addNewLanguageAccentButtonSelector);

    await this.expectElementToBeVisible(languageAccentDropdownSelector);
    await this.clickOnElementWithSelector(languageAccentDropdownSelector);

    await this.clickOnElementWithSelectorAndText(
      languageAccentOptionSelector,
      languageAccentDescription
    );
    await this.expectElementToBeVisible(addNewLanguageAccentButtonSelector);
  }

  /**
   * Navigate to the voiceover admin page.
   */
  async navigateToVoiceoverAdminPage(): Promise<void> {
    await this.goto(voiceoverAdminURL);
  }

  /**
   * Function to navigate to exploration settings tab.
   */
  async navigateToExplorationSettingsTab(): Promise<void> {
    await this.waitForPageToFullyLoad();
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarOptions);
      if (!element) {
        await this.clickOnElementWithSelector(mobileOptionsButtonSelector);
      }
      await this.expectElementToBeVisible(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(mobileNavbarDropdown);
      await this.expectElementToBeVisible(mobileNavbarPane);
      await this.clickOnElementWithSelector(mobileSettingsBarSelector);
    } else {
      await this.expectElementToBeVisible(settingsTabSelector);
      await this.clickOnElementWithSelector(settingsTabSelector);
    }
    await this.expectElementToBeVisible(settingsContainerSelector);
  }

  /**
   * Function to dismiss exploration editor welcome modal.
   * @param {boolean} failIfMissing - Whether to fail if the welcome modal is not found.
   */
  async dismissWelcomeModal(failIfMissing: boolean = true): Promise<void> {
    const explorationEditor = new ExplorationEditorModal(this);
    await explorationEditor.dismissWelcomeModal(failIfMissing);
  }

  /**
   * Add voiceover artists to an exploration.
   * @param {string[]} voiceArtists - The username list of the voiceover artists to add.
   * @param {boolean} verify - Whether to verify artist presence after adding.
   */
  async addVoiceoverArtistsToExploration(
    voiceArtists: string[],
    verify: boolean = true
  ): Promise<void> {
    if (!(await this.isElementVisible(voiceArtistSectionBodySelector))) {
      await this.clickOnElementWithSelector(voiceArtistSectionHeaderSelector);
      await this.expectElementToBeVisible(voiceArtistSectionBodySelector);
    }
    for (let i = 0; i < voiceArtists.length; i++) {
      await this.expectElementToBeVisible(editVoiceoverArtistButton);
      await this.clickOnElementWithSelector(editVoiceoverArtistButton);
      await this.expectElementToBeVisible(voiceArtistUsernameInputBox);
      await this.clearAllTextFrom(voiceArtistUsernameInputBox);
      await this.typeInInputField(voiceArtistUsernameInputBox, voiceArtists[i]);
      await this.clickOnElementWithSelector(saveVoiceoverArtistEditButton);
      if (verify) {
        await this.expectElementToBeVisible(
          `div.e2e-test-voice-artist-${voiceArtists[i]}`
        );
        showMessage(voiceArtists[i] + ' has been added as a voice artist.');
      }
    }
  }

  /**
   * Function to add voiceover artist to an exploration.
   * @param {string} explorationId - The exploration id.
   * @param {string} voiceArtistUsername - The username of the voiceover artist to add.
   */
  async addVoiceoverArtistToExplorationWithID(
    explorationId: string,
    voiceArtistUsername: string
  ): Promise<void> {
    const editorUrl = `${baseURL}/create/${explorationId}`;
    await this.goto(editorUrl);
    await this.dismissWelcomeModal(false);
    await this.navigateToExplorationSettingsTab();
    await this.addVoiceoverArtistsToExploration([voiceArtistUsername]);
  }
}

export let VoiceoverAdminFactory = (page: Page): VoiceoverAdmin => {
  return new VoiceoverAdmin(page);
};
