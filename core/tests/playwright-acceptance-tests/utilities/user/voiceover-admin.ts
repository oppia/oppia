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
import testConstants from '../common/test-constants';
import {ExplorationEditorUtils} from '../common/exploration-editor-utils';

const voiceoverAdminURL = testConstants.URLs.VoiceoverAdmin;

const languageAccentOptionSelector =
  '.e2e-test-language-accent-selector-option';
const addNewLanguageAccentButtonSelector =
  '.e2e-test-add-new-language-accent-button';
const languageAccentDropdownSelector =
  '.e2e-test-language-accent-dropdown-selector';
const voiceArtistSectionHeaderSelector =
  '.e2e-test-voice-artists-settings-container';
const voiceArtistSectionBodySelector = '.e2e-test-voice-artists-content';
const editVoiceoverArtistButton = 'span.e2e-test-edit-voice-artist-roles';
const voiceArtistUsernameInput = 'input#newVoiceArtistUsername';
const saveVoiceoverArtistButton =
  'button.e2e-test-add-voice-artist-role-button';
const mobileOptionsButton = 'i.e2e-test-mobile-options';
const mobileNavbarDropdown = 'div.e2e-test-mobile-options-dropdown';
const mobileSettingsTab = 'li.e2e-test-mobile-settings-button';
const visibleMobileNavigationDropdown =
  '.oppia-exploration-editor-tabs-dropdown.show';
const settingsTab = 'a.e2e-test-exploration-settings-tab';
const settingsContainer = '.oppia-editor-card.oppia-settings-card-container';
const mobileVoiceArtistSettingsDropdown =
  'h3.e2e-test-voice-artists-settings-container';

export class VoiceoverAdmin extends BaseUser {
  /**
   * Adds a voiceover submitter to an exploration.
   * @param explorationId - The exploration ID.
   * @param voiceArtistUsername - The submitter's username.
   */
  async addVoiceoverArtistToExplorationWithID(
    explorationId: string,
    voiceArtistUsername: string
  ): Promise<void> {
    await this.goto(`${testConstants.URLs.BaseURL}/create/${explorationId}#/`);
    await new ExplorationEditorUtils(this).dismissWelcomeModal(false);
    await this.navigateToExplorationSettingsTab();
    if (!(await this.isElementVisible(voiceArtistSectionBodySelector))) {
      await this.clickOnElementWithSelector(voiceArtistSectionHeaderSelector);
      await this.expectElementToBeVisible(voiceArtistSectionBodySelector);
    }
    await this.clickOnElementWithSelector(editVoiceoverArtistButton);
    await this.clearAllTextFrom(voiceArtistUsernameInput);
    await this.typeInInputField(voiceArtistUsernameInput, voiceArtistUsername);
    await this.clickOnElementWithSelector(saveVoiceoverArtistButton);
    await this.expectElementToBeVisible(
      `.e2e-test-voice-artist-${voiceArtistUsername}`
    );
  }

  private async navigateToExplorationSettingsTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      if (!(await this.isElementVisible(mobileNavbarDropdown))) {
        await this.clickOnElementWithSelector(mobileOptionsButton);
      }
      await this.expectElementToBeVisible(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(mobileSettingsTab);
      if (await this.isElementVisible(visibleMobileNavigationDropdown)) {
        await this.page.locator(mobileNavbarDropdown).click({force: true});
        try {
          await this.page
            .locator(visibleMobileNavigationDropdown)
            .waitFor({state: 'hidden', timeout: 10000});
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes('Timeout')) {
            throw error;
          }
          await this.page.locator(mobileNavbarDropdown).click({force: true});
          await this.page
            .locator(visibleMobileNavigationDropdown)
            .waitFor({state: 'hidden'});
        }
      }
      await this.expectElementToBeVisible(mobileVoiceArtistSettingsDropdown);
      await this.clickOnElementWithSelector(mobileVoiceArtistSettingsDropdown);
    } else {
      await this.clickOnElementWithSelector(settingsTab);
    }
    await this.expectElementToBeVisible(settingsContainer);
  }

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
}

export let VoiceoverAdminFactory = (page: Page): VoiceoverAdmin => {
  return new VoiceoverAdmin(page);
};
