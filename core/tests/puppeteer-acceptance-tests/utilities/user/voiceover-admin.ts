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

const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const dropdownToggleIcon = '.e2e-test-mobile-options-dropdown';

const explorationSettingsTab = '.e2e-test-settings-tab';
const editVoiceoverArtistButton = 'span.e2e-test-edit-voice-artist-roles';
const voiceArtistUsernameInputBox = 'input#newVoicAartistUsername';
const saveVoiceoverArtistEditButton =
  'button.e2e-test-add-voice-artist-role-button';

const errorToastMessage = 'div.e2e-test-toast-warning-message';
const closeToastMessageButton = 'button.e2e-test-close-toast-warning';

const updatedVoiceoverArtist = 'div.e2e-test-voiceArtist-role-names';
const allVoiceoverArtistsList = 'ul.e2e-test-voiceArtist-list';

const mobileNavToggelbutton = '.e2e-test-mobile-options';
const mobileOptionsDropdown = '.e2e-test-mobile-options-dropdown';
const mobileSettingsButton = 'li.e2e-test-mobile-settings-button';
const mobileVoiceoverArtistsHeader =
  '.e2e-test-voice-artist-collapsible-card-header';
const voiceArtistSettingsDropdown =
  'h3.e2e-test-voice-artists-settings-container';

export class VoiceoverAdmin extends BaseUser {
  /**
   * Function to navigate to exploration settings tab.
   */
  async navigateToExplorationSettingsTab(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavToggelbutton);
      await this.clickOn(mobileOptionsDropdown);
      await this.clickOn(mobileSettingsButton);
    } else {
      await this.clickOn(explorationSettingsTab);
    }

    showMessage('Navigation to settings tab is successful.');
  }

  /**
   * Function to open voice artist dropdown in mobile view.
   */
  async openvoiceArtistDropdown(): Promise<void> {
    await this.clickOn(voiceArtistSettingsDropdown);
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
    const editorUrl = `${baseURL}/create/${explorationId}`;
    await this.goto(editorUrl);

    showMessage('Navigation to exploration editor is successful.');
  }

  /**
   * Function to close editor navigation dropdown. Can be done by clicking
   * on the dropdown toggle.
   */
  async closeEditorNavigationDropdownOnMobile(): Promise<void> {
    try {
      await this.page.waitForSelector(dropdownToggleIcon, {
        visible: true,
      });
      await this.clickOn(dropdownToggleIcon);
      showMessage('Editor navigation closed successfully.');
    } catch (error) {
      showMessage(`Dropdown Toggle Icon not found: ${error.message}`);
    }
  }

  /**
   * Asserts that a voiceover artist does not exist in the list.
   * @param artistUsername - The username of the voiceover artist to check for.
   */
  async expectVoiceoverArtistsListDoesNotContain(
    artistUsername: string
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileVoiceoverArtistsHeader);
    }
    const allVoiceoverArtists = await this.getAllVoiceoverArtists();
    if (allVoiceoverArtists.includes(artistUsername)) {
      throw new Error(
        `Error: User '${artistUsername}' is already assigned as a voiceover artist for this exploration.`
      );
    } else {
      showMessage(
        `Voiceover artist '${artistUsername}' does not exist and can be added.`
      );
    }
  }

  /**
   * Add voiceover artists to an exploration.
   * @param voiceArtists - The username list of the voiceover artists to add.
   */
  async addVoiceoverArtistsToExploration(
    voiceArtists: string[]
  ): Promise<void> {
    for (let i = 0; i < voiceArtists.length; i++) {
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
      try {
        await this.page.waitForSelector(
          `div.e2e-test-voice-artist-${voiceArtists[i]}`,
          {visible: true}
        );
        showMessage(voiceArtists[i] + ' has been added as a voice artist.');
      } catch (error) {
        showMessage(voiceArtists[i] + ' is not added.');
      }
    }
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
    await this.clickOn(closeToastMessageButton);
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
}

export let VoiceoverAdminFactory = (): VoiceoverAdmin => new VoiceoverAdmin();
