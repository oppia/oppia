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
 * @fileoverview Utility functions for voiceover admin page
 */

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const baseURL = testConstants.URLs.BaseURL;
const voiceoverAdminURL = testConstants.URLs.VoiceoverAdmin;

const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';

const editVoiceoverArtistButton = 'span.e2e-test-edit-voice-artist-roles';
const voiceArtistUsernameInputBox = 'input#newVoicAartistUsername';
const saveVoiceoverArtistEditButton =
  'button.e2e-test-add-voice-artist-role-button';

const errorToastMessage = 'div.e2e-test-toast-warning-message';
const closeToastMessageButton = 'button.e2e-test-close-toast-warning';

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
const enableAutogenerationConfirmationButtonSelector =
  '.e2e-test-autogeneration-confirmation';
const enableAutogenerationSelectorTemplate = (languageAccentCode: string) =>
  `.e2e-test-${languageAccentCode}-supports-autogeneration-select`;
const enableAutogenerationOptionSelector =
  '.e2e-test-autogeneration-option-selector';

const toastWarningContainer = '.e2e-test-toast-warning';
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
        await this.page.waitForSelector(mobileOptionsButtonSelector, {
          visible: true,
        });
        await this.clickOn(mobileOptionsButtonSelector);
      }
      await this.page.waitForSelector(mobileNavbarDropdown, {
        visible: true,
      });
      await this.clickOn(mobileNavbarDropdown);
      await this.clickOn(mobileSettingsBarSelector);

      // Close dropdown if it doesn't automatically close.
      const isVisible = await this.isElementVisible(
        navigationDropdownInMobileVisibleSelector
      );
      if (isVisible) {
        // We are using page.click as this button might be overlapped by the
        // dropdown. Thus, it will fail with onClick.
        this.page.click(mobileNavbarDropdown);
      }

      // Open all dropdowns because by default all dropdowns are closed in mobile view.
      await this.clickOn(basicSettingsDropdown);
      await this.clickOn(advanceSettingsDropdown);
      await this.clickOn(rolesSettingsDropdown);
      await this.clickOn(voiceArtistSettingsDropdown);
      await this.clickOn(permissionSettingsDropdown);
      await this.clickOn(feedbackSettingsDropdown);
    } else {
      await this.page.waitForSelector(settingsTabSelector, {
        visible: true,
      });
      await this.clickOn(settingsTabSelector);
    }

    await this.page.waitForSelector(settingsContainerSelector, {
      visible: true,
    });
    showMessage('Settings tab is opened successfully.');
  }

  /**
   * Navigate to the voiceover admin page.
   */
  async navigateToVoiceoverAdminPage(): Promise<void> {
    await this.goto(voiceoverAdminURL);
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

    showMessage('Tutorial pop-up is closed.');
  }

  /**
   * Function to navigate to exploration editor.
   * @param explorationUrl - url of the exploration.
   */
  async navigateToExplorationEditor(
    explorationId: string | null
  ): Promise<void> {
    if (!explorationId) {
      throw new Error('Cannot navigate to editor: explorationId is null');
    }
    const editorUrl = `${baseURL}/create/${explorationId}#/`;
    await this.goto(editorUrl);

    showMessage('Navigation to exploration editor is successful.');
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
      await this.clickOn(mobileVoiceoverArtistsHeader);
    }

    await this.page.waitForFunction(
      (selector: string, artistUsername: string) => {
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
      {},
      updatedVoiceoverArtist,
      artistUsername
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
      await this.clickOn(voiceArtistSectionHeaderSelector);
      await this.expectElementToBeVisible(voiceArtistSectionBodySelector);
    }
    for (let i = 0; i < voiceArtists.length; i++) {
      await this.expectElementToBeVisible(editVoiceoverArtistButton);
      await this.clickOn(editVoiceoverArtistButton);
      await this.clickOn(voiceArtistUsernameInputBox);
      await this.page.waitForSelector(voiceArtistUsernameInputBox, {
        visible: true,
      });
      await this.clearAllTextFrom(voiceArtistUsernameInputBox);
      await this.type(voiceArtistUsernameInputBox, voiceArtists[i]);
      await this.clickOn(saveVoiceoverArtistEditButton);
      // Adding try catch here to avoid unnecessary waiting for selector if
      // the added voice artist is not an user.
      if (verify) {
        try {
          await this.page.waitForSelector(
            `div.e2e-test-voice-artist-${voiceArtists[i]}`,
            {visible: true}
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
    await this.clickOn(editVoiceoverArtistButton);

    const selector = `div.e2e-test-voice-artist-${voiceArtistUsername}`;
    await this.expectElementToBeVisible(selector);

    const removeBtn = await this.page.waitForSelector(
      `${selector} ${removeVoiceoverArtistBtnSelector}`,
      {
        visible: true,
      }
    );
    if (!removeBtn) {
      throw new Error('Remove button not found.');
    }
    await removeBtn.click();
    await this.clickButtonInModal('Are you sure?', 'confirm');
  }

  /**
   * Function to add voiceover artist to an exploration.
   * @param explorationId - The exploration id.
   * @param voiceArtistUsername - The username of the voiceover artist to add.
   */
  async addVoiceoverArtistToExplorationWithID(
    explorationId: string,
    voiceArtistUsername: string
  ): Promise<void> {
    await this.navigateToExplorationEditor(explorationId);
    await this.dismissWelcomeModal();
    await this.navigateToExplorationSettingsTab();
    await this.addVoiceoverArtistsToExploration([voiceArtistUsername]);
  }

  /**
   * Function to expect to see error toast message
   * @param expectedErrorMessage - expected error message.
   */
  async expectToSeeErrorToastMessage(
    expectedErrorMessage: string
  ): Promise<void> {
    await this.page.waitForSelector(errorToastMessage);
    const errorMessage = await this.page.$eval(
      errorToastMessage,
      element => (element as HTMLElement).innerText
    );
    if (errorMessage !== expectedErrorMessage) {
      throw new Error(
        `Expected error message to be ${expectedErrorMessage} but got ${errorMessage}`
      );
    } else {
      showMessage(`Toast Error Message: ${errorMessage}`);
    }
  }

  /**
   * Function to close toast message.
   */
  async closeToastMessage(): Promise<void> {
    await this.expectElementToBeVisible(toastWarningContainer);
    await this.clickOn(closeToastMessageButton);

    await this.expectElementToBeVisible(toastWarningContainer, false);
  }

  /**
   * Function to expect voiceover artists list to contain.
   * @param artistUsername - artist username.
   */
  async expectVoiceoverArtistsListContains(
    artistUsername: string
  ): Promise<void> {
    await this.page.waitForSelector(updatedVoiceoverArtist);
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
    await this.page.waitForSelector(allVoiceoverArtistsList);
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
   * @param languageAccentDescription - The language-accent to add.
   */
  async addSupportedLanguageAccentPair(
    languageAccentDescription: string
  ): Promise<void> {
    await this.navigateToVoiceoverAdminPage();
    await this.waitForPageToFullyLoad();

    await this.page.waitForSelector(addNewLanguageAccentButtonSelector);
    await this.clickOn(addNewLanguageAccentButtonSelector);

    await this.page.waitForSelector(languageAccentDropdownSelector);
    await this.clickOn(languageAccentDropdownSelector);

    await this.page.waitForSelector(languageAccentOptionSelector);
    const languageOptions = await this.page.$$(languageAccentOptionSelector);

    for (const option of languageOptions) {
      const textContent = await option.evaluate(
        el => el.textContent?.trim() || ''
      );
      if (textContent === languageAccentDescription) {
        await option.click();

        await this.expectElementToBeVisible(addNewLanguageAccentButtonSelector);
        break;
      }
    }
  }

  /**
   * Function to register supported language and accent combinations for Oppia voiceovers.
   * @param languageAccentCode - The language-accent code to enable autogeneration for.
   */
  async enableAutogenerationForLanguageAccentPair(
    languageAccentCode: string
  ): Promise<void> {
    const enableAutogenerationSelector =
      enableAutogenerationSelectorTemplate(languageAccentCode);
    await this.page.waitForSelector(enableAutogenerationSelector);
    await this.clickOn(enableAutogenerationSelector);

    await this.page.waitForSelector(enableAutogenerationOptionSelector);
    const options = await this.page.$$(enableAutogenerationOptionSelector);
    for (const option of options) {
      const textContent = await option.evaluate(
        el => el.textContent?.trim() || ''
      );
      if (textContent === 'Yes') {
        await option.click();
        break;
      }
    }

    await this.page.waitForSelector(
      enableAutogenerationConfirmationButtonSelector,
      {
        visible: true,
        timeout: 5000,
      }
    );
    await this.clickOn(enableAutogenerationConfirmationButtonSelector);
    await this.page.waitForSelector(
      enableAutogenerationConfirmationButtonSelector,
      {
        hidden: true,
      }
    );

    showMessage(
      `Autogeneration enabled for language-accent pair: ${languageAccentCode}`
    );
  }
}

export let VoiceoverAdminFactory = (): VoiceoverAdmin => new VoiceoverAdmin();
