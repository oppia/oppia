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
 * @fileoverview Utility functions for voiceover admin page.
 */

import {Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import {ExplorationEditorUtils} from '../common/exploration-editor-utils';
import testConstants from '../common/test-constants';

const voiceoverAdminURL = testConstants.URLs.VoiceoverAdmin;
const baseURL = testConstants.URLs.BaseURL;

const languageAccentOptionSelector =
  '.e2e-test-language-accent-selector-option';
const addNewLanguageAccentButtonSelector =
  '.e2e-test-add-new-language-accent-button';
const languageAccentDropdownSelector =
  '.e2e-test-language-accent-dropdown-selector';
const voiceArtistSectionHeaderSelector = '.e2e-test-voice-artists-header';
const voiceArtistSectionBodySelector = '.e2e-test-voice-artists-content';
const editVoiceoverArtistButton = 'span.e2e-test-edit-voice-artist-roles';
const voiceArtistUsernameInputBox = 'input#newVoicAartistUsername';
const saveVoiceoverArtistEditButton =
  'button.e2e-test-add-voice-artist-role-button';
const mobileNavbarDropdown = 'div.e2e-test-mobile-options-dropdown';
const mobileOptionsButtonSelector = 'i.e2e-test-mobile-options';
const mobileSettingsBarSelector = 'li.e2e-test-mobile-settings-button';
const mobileSettingsDropdownSelector =
  '.oppia-exploration-editor-tabs-dropdown.show';
const basicSettingsDropdown = 'h3.e2e-test-settings-container';
const rolesSettingsDropdown = 'h3.e2e-test-roles-settings-container';
const voiceArtistSettingsDropdown =
  'h3.e2e-test-voice-artists-settings-container';
const settingsTabSelector = 'a.e2e-test-exploration-settings-tab';
const settingsContainerSelector =
  '.oppia-editor-card.oppia-settings-card-container';

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
   * Navigate to the settings tab of an exploration editor.
   */
  async navigateToExplorationSettingsTab(): Promise<void> {
    await this.waitForStaticAssetsToLoad();

    if (this.isViewportAtMobileWidth()) {
      if (!(await this.isElementVisible(mobileNavbarDropdown))) {
        await this.clickOnElementWithSelector(mobileOptionsButtonSelector);
      }

      await this.expectElementToBeVisible(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(mobileSettingsBarSelector);

      if (await this.isElementVisible(mobileSettingsDropdownSelector)) {
        await this.clickOnElementWithSelector(mobileNavbarDropdown);
        await this.expectElementToBeVisible(
          mobileSettingsDropdownSelector,
          false
        );
      }

      // Wait for the settings view to finish rendering before opening its
      // mobile-only collapsible sections.
      await this.waitForPageToFullyLoad();

      await this.clickOnElementWithSelector(basicSettingsDropdown);
      await this.clickOnElementWithSelector(rolesSettingsDropdown);
      await this.clickOnElementWithSelector(voiceArtistSettingsDropdown);
    } else {
      await this.clickOnElementWithSelector(settingsTabSelector);
    }

    await this.expectElementToBeVisible(settingsContainerSelector);
  }

  /**
   * Navigate to an exploration editor by its ID.
   * @param explorationId - The exploration ID.
   */
  async navigateToExplorationEditorForVoiceoverAssignment(
    explorationId: string
  ): Promise<void> {
    await this.goto(`${baseURL}/create/${explorationId}#/`);
    const explorationEditor = new ExplorationEditorUtils(this);
    await explorationEditor.dismissWelcomeModal(false);
  }

  /**
   * Add voiceover submitters to an exploration.
   * @param voiceArtists - Usernames of the voiceover submitters to add.
   */
  async addVoiceoverArtistsToExploration(
    voiceArtists: string[]
  ): Promise<void> {
    if (!(await this.isElementVisible(voiceArtistSectionBodySelector))) {
      await this.clickOnElementWithSelector(voiceArtistSectionHeaderSelector);
      await this.expectElementToBeVisible(voiceArtistSectionBodySelector);
    }

    for (const voiceArtist of voiceArtists) {
      await this.expectElementToBeVisible(editVoiceoverArtistButton);
      await this.clickOnElementWithSelector(editVoiceoverArtistButton);
      await this.expectElementToBeVisible(voiceArtistUsernameInputBox);
      await this.clearAllTextFrom(voiceArtistUsernameInputBox);
      await this.typeInInputField(voiceArtistUsernameInputBox, voiceArtist);
      await this.clickOnElementWithSelector(saveVoiceoverArtistEditButton);
      await this.expectElementToBeVisible(
        `div.e2e-test-voice-artist-${voiceArtist}`
      );
    }
  }

  /**
   * Grant a user voiceover-submitter access to an exploration.
   * @param explorationId - The exploration ID.
   * @param voiceArtistUsername - The username to grant access to.
   */
  async addVoiceoverArtistToExplorationWithID(
    explorationId: string,
    voiceArtistUsername: string
  ): Promise<void> {
    await this.navigateToExplorationEditorForVoiceoverAssignment(explorationId);
    await this.navigateToExplorationSettingsTab();
    await this.addVoiceoverArtistsToExploration([voiceArtistUsername]);
  }
}

export let VoiceoverAdminFactory = (page: Page): VoiceoverAdmin => {
  return new VoiceoverAdmin(page);
};
