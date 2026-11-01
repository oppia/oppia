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
import {showMessage} from '../common/show-message';
import testConstants from '../common/test-constants';
import {ExplorationEditorUtils} from '../common/exploration-editor-utils';
import {NavigationUtils} from '../common/navigation-utils';

const baseURL = testConstants.URLs.BaseURL;
const voiceoverAdminURL = testConstants.URLs.VoiceoverAdmin;

const editVoiceoverArtistButton = 'span.e2e-test-edit-voice-artist-roles';
const voiceArtistUsernameInputBox = 'input#newVoiceArtistUsername';
const saveVoiceoverArtistEditButton =
  'button.e2e-test-add-voice-artist-role-button';

const updatedVoiceoverArtist = 'div.e2e-test-voiceArtist-role-names';
const allVoiceoverArtistsList = 'ul.e2e-test-voiceArtist-list';

const mobileVoiceoverArtistsHeader =
  '.e2e-test-voice-artist-collapsible-card-header';

const languageAccentOptionSelector =
  '.e2e-test-language-accent-selector-option';
const addNewLanguageAccentButtonSelector =
  '.e2e-test-add-new-language-accent-button';
const languageAccentDropdownSelector =
  '.e2e-test-language-accent-dropdown-selector';

const voiceArtistSectionHeaderSelector = '.e2e-test-voice-artists-header';
const voiceArtistSectionBodySelector = '.e2e-test-voice-artists-content';
const mobileNavbarDropdown = 'div.e2e-test-mobile-options-dropdown';
const mobileOptionsButtonSelector = 'i.e2e-test-mobile-options';
const mobileSettingsBarSelector = 'li.e2e-test-mobile-settings-button';
const basicSettingsDropdown = 'h3.e2e-test-settings-container';
const feedbackSettingsDropdown = 'h3.e2e-test-feedback-settings-container';
const permissionSettingsDropdown = 'h3.e2e-test-permission-settings-container';
const voiceArtistSettingsDropdown =
  'h3.e2e-test-voice-artists-settings-container';
const rolesSettingsDropdown = 'h3.e2e-test-roles-settings-container';
const advanceSettingsDropdown = 'h3.e2e-test-advanced-settings-container';
('h3.e2e-test-controls-bar-settings-container');
const settingsContainerSelector =
  '.oppia-editor-card.oppia-settings-card-container';
const settingsTabSelector = 'a.e2e-test-exploration-settings-tab';
const navigationDropdownInMobileVisibleSelector =
  '.oppia-exploration-editor-tabs-dropdown.show';

export class VoiceoverAdmin extends BaseUser {
  /**
   * Function to navigate to exploration settings tab.
   */
  async navigateToExplorationSettingsTab(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarDropdown);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to settings tab appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.expectElementToBeVisible(mobileOptionsButtonSelector, true);
        await this.clickOnElementWithSelector(mobileOptionsButtonSelector);
      }
      await this.expectElementToBeVisible(mobileNavbarDropdown, true);
      await this.clickOnElementWithSelector(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(mobileSettingsBarSelector);

      // Close dropdown if it doesn't automatically close.
      const isVisible = await this.isElementVisible(
        navigationDropdownInMobileVisibleSelector
      );
      if (isVisible) {
        // We are using page.click as this button might be overlapped by the
        // dropdown. Thus, it will fail with onClick.
        // TODO(#25021): Fix flaky mobile navbar dropdown closing in acceptance tests.
        await this.page.click(mobileNavbarDropdown);
        try {
          await this.expectElementToBeVisible(
            navigationDropdownInMobileVisibleSelector,
            false,
            this.page,
            10000
          );
        } catch (error) {
          await this.page.click(mobileNavbarDropdown);
          await this.expectElementToBeVisible(
            navigationDropdownInMobileVisibleSelector,
            false
          );
        }
        // Ensure layout fully stabilized.
        await this.waitForPageToFullyLoad();
      }

      // Open all available dropdowns because they are closed by default
      const dropdowns = [
        basicSettingsDropdown,
        advanceSettingsDropdown,
        rolesSettingsDropdown,
        voiceArtistSettingsDropdown,
        permissionSettingsDropdown,
        feedbackSettingsDropdown,
      ];

      for (const dropdown of dropdowns) {
        const element = this.page.locator(dropdown);
        // Some sections may not be available to certain roles.
        if (await element.isVisible().catch(() => false)) {
          await this.clickOnElementWithSelector(dropdown);
        }
      }
    } else {
      await this.expectElementToBeVisible(settingsTabSelector, true);
      await this.clickOnElementWithSelector(settingsTabSelector);
    }

    await this.expectElementToBeVisible(settingsContainerSelector, true);
    showMessage('Settings tab is opened successfully.');
  }

  /**
   * Navigate to the voiceover admin page.
   */
  async navigateToVoiceoverAdminPage(): Promise<void> {
    await this.goto(voiceoverAdminURL);
  }

  /**
   * Function to dismiss exploration editor welcome modal.
   * @param failIfMissing - Whether to fail if the welcome modal is not found.
   */
  async dismissWelcomeModal(failIfMissing: boolean = true): Promise<void> {
    const explorationEditor = new ExplorationEditorUtils(this);
    await explorationEditor.dismissWelcomeModal(failIfMissing);
  }

  /**
   * Function to navigate to exploration editor.
   * @param explorationUrl - url of the exploration.
   */
  async navigateToExplorationEditor(
    explorationId: string | null
  ): Promise<void> {
    const navigationUtils = new NavigationUtils(this);
    await navigationUtils.navigateToExplorationEditor(explorationId);
  }

  /**
   * Asserts that a voiceover artist does not exist in the list.
   * @param artistUsername - The username of the voiceover artist to check for.
   */
  async expectVoiceoverArtistsListDoesNotContain(
    artistUsername: string
  ): Promise<void> {
    // Expand the section if it is not expanded in mobile view.
    if (
      this.isViewportAtMobileWidth() &&
      (await this.isElementVisible(mobileVoiceoverArtistsHeader))
    ) {
      await this.clickOnElementWithSelector(mobileVoiceoverArtistsHeader);
    }

    await this.page.waitForFunction(
      ({
        selector,
        artistUsername,
      }: {
        selector: string;
        artistUsername: string;
      }) => {
        let elements = document.querySelectorAll(selector);
        if (!elements || elements.length === 0) {
          return true;
        }

        for (const element of Array.from(elements)) {
          const elementText = element.textContent?.trim();
          if (elementText === artistUsername) {
            return false;
          }
        }
        return true;
      },
      {selector: updatedVoiceoverArtist, artistUsername}
    );
  }

  /**
   * Add voiceover artists to an exploration.
   * @param voiceArtists - The username list of the voiceover artists to add.
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
      await this.clickOnElementWithSelector(voiceArtistUsernameInputBox);
      await this.expectElementToBeVisible(voiceArtistUsernameInputBox, true);
      await this.clearAllTextFrom(voiceArtistUsernameInputBox);
      await this.typeInInputField(voiceArtistUsernameInputBox, voiceArtists[i]);
      await this.clickOnElementWithSelector(saveVoiceoverArtistEditButton);
      // Adding try catch here to avoid unnecessary waiting for selector if
      // the added voice artist is not an user.
      if (verify) {
        try {
          await this.expectElementToBeVisible(
            `div.e2e-test-voice-artist-${voiceArtists[i]}`,
            true
          );
          showMessage(voiceArtists[i] + ' has been added as a voice artist.');
        } catch (error) {
          throw new Error(
            `${voiceArtists[i]} is not added.\n` +
              `Original Error: ${error.stack}`
          );
        }
      }
    }
  }

  /**
   * Function to remove voiceover artist from an exploration.
   * @param voiceArtistUsername - The username of the voiceover artist to remove.
   */
  async removeVoiceoverArtist(voiceArtistUsername: string): Promise<void> {
    const removeVoiceoverArtistBtnSelector =
      '.e2e-test-remove-voice-artist-button';
    await this.expectElementToBeVisible(editVoiceoverArtistButton);
    await this.clickOnElementWithSelector(editVoiceoverArtistButton);

    const selector = `div.e2e-test-voice-artist-${voiceArtistUsername}`;
    await this.expectElementToBeVisible(selector);

    const removeBtn = await this.expectElementToBeVisible(
      `${selector} ${removeVoiceoverArtistBtnSelector}`,
      true
    );
    if (!removeBtn) {
      throw new Error('Remove button not found.');
    }
    await removeBtn.click();
    await this.clickButtonInModal('Are you sure?', 'confirm');
  }

  /**
   * Function to expect voiceover artists list to contain.
   * @param artistUsername - artist username.
   */
  async expectVoiceoverArtistsListContains(
    artistUsername: string
  ): Promise<void> {
    await this.expectElementToBeVisible(updatedVoiceoverArtist);
    const allVoiceoverArtists = await this.getAllVoiceoverArtists();
    if (!allVoiceoverArtists.includes(artistUsername)) {
      throw new Error(
        `Expected ${artistUsername} to be a voiceover artist. Current voice artists for this exploration are: ${allVoiceoverArtists}`
      );
    }
    showMessage(
      `${artistUsername} added as voiceover artist! Current voice artists for this exploration are: ${allVoiceoverArtists}`
    );
  }

  /**
   * Checks if the voice artist list is empty.
   */
  async expectVoiceoverArtistsListToBeEmpty(): Promise<void> {
    await this.expectElementToBeVisible(updatedVoiceoverArtist, false);
    showMessage('No voiceover artists are added to the exploration!');
  }

  /**
   * Function to get all voiceover artists.
   * @returns {Promise<string[]>} - list of voiceover artists.
   */
  async getAllVoiceoverArtists(): Promise<string[]> {
    await this.expectElementToBeAttachedInDOM(allVoiceoverArtistsList);
    const voiceoverArtists = await this.page.$$eval(
      updatedVoiceoverArtist,
      (elements: Element[]) =>
        elements.map((el: Element) => (el as HTMLElement).innerText.trim())
    );
    return voiceoverArtists;
  }

  /**
   * Function to verify voiceover artist is still omitted.
   * @param artistUsername - artist username.
   */
  async verifyVoiceoverArtistStillOmitted(
    artistUsername: string
  ): Promise<void> {
    const allVoiceoverArtists = await this.getAllVoiceoverArtists();
    if (allVoiceoverArtists.includes(artistUsername)) {
      throw new Error(
        `Error: User '${artistUsername}' is unexpectedly listed as a voiceover artist for this exploration.`
      );
    } else {
      showMessage(
        `Confirmed: Voiceover artist '${artistUsername}' is still not listed.`
      );
    }
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
}

export let VoiceoverAdminFactory = (page: Page): VoiceoverAdmin => {
  return new VoiceoverAdmin(page);
};
