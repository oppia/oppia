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

import {BaseUser} from '../puppeteer-testing-utilities/puppeteer-utils';
import testConstants from '../puppeteer-testing-utilities/test-constants';
import {showMessage} from '../puppeteer-testing-utilities/show-message-utils';

const creatorDashboardPage = testConstants.URLs.CreatorDashboard;

const createExplorationButton = 'button.e2e-test-create-new-exploration-button';
const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const textStateEditSelector = 'div.e2e-test-state-edit-content';
const richTextAreaField = 'div.e2e-test-rte';
const saveContentButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const interactionEndExplorationInputButton =
  'div.e2e-test-interaction-tile-EndExploration';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const saveChangesButton = 'button.e2e-test-save-changes';
const saveDraftButton = 'button.e2e-test-save-draft-button';

const publishExplorationButton = 'button.e2e-test-publish-exploration';
const explorationTitleInput = 'input.e2e-test-exploration-title-input-modal';
const explorationGoalInput = 'input.e2e-test-exploration-objective-input-modal';
const explorationCategoryDropdown =
  'mat-form-field.e2e-test-exploration-category-metadata-modal';
const saveExplorationChangesButton = 'button.e2e-test-confirm-pre-publication';
const explorationConfirmPublishButton = 'button.e2e-test-confirm-publish';
const explorationIdElement = 'span.oppia-unique-progress-id';
const closeShareModalButton = 'button.e2e-test-share-publish-close';

const explorationSettingsTab = '.e2e-test-settings-tab';
const editVoiceoverArtistButton = 'span.e2e-test-edit-voice-artist-roles';
const voiceArtistEditSelector = 'input.e2e-test-new-voice-artist-username';
const saveVoiceoverArtistEditButton =
  'button.e2e-test-add-voice-artist-role-button';

const errorToastMessage = 'div.e2e-test-toast-warning-message';
const closeToastMessageButton = 'button.e2e-test-close-toast-warning';

const updatedVoiceoverArtist = 'div.e2e-test-voiceArtist-role-names';
const allVoiceoverArtistsList = 'ul.e2e-test-voiceArtist-list';

export class VoiceoverAdmin extends BaseUser {
  /**
   * Function to navigate to creator dashboard page
   */
  async navigateToCreatorDashboardPage(): Promise<void> {
    await this.page.goto(creatorDashboardPage);
  }

  /**
   * Function to navigate to exploration settings tab
   */
  async navigateToExplorationSettingsTab(): Promise<void> {
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      visible: true,
    });
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      hidden: true,
    });
    await this.page.waitForFunction('document.readyState === "complete"');
    await this.clickOn(explorationSettingsTab);
  }

  /**
   * Function to create exploration with title
   * @param explorationTitle - title of the exploration
   */
  async createExplorationWithTitle(explorationTitle: string): Promise<void> {
    await this.clickOn(createExplorationButton);
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      visible: true,
    });
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      hidden: true,
    });
    await this.page.waitForFunction('document.readyState === "complete"');
    await this.page.waitForSelector(textStateEditSelector, {
      visible: true,
    });
    await this.clickOn(textStateEditSelector);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.type(richTextAreaField, `${explorationTitle}`);
    await this.clickOn(saveContentButton);

    await this.clickOn(addInteractionButton);
    await this.clickOn(interactionEndExplorationInputButton);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector('.customize-interaction-body-container', {
      hidden: true,
    });

    await this.page.waitForSelector(`${saveChangesButton}:not([disabled])`);
    await this.clickOn(saveChangesButton);
    await this.page.waitForFunction('document.readyState === "complete"');
    await this.page.waitForSelector(saveDraftButton, {visible: true});
    await this.clickOn(saveDraftButton);
    await this.page.waitForSelector(saveDraftButton, {hidden: true});
    await this.page.waitForFunction('document.readyState === "complete"');
  }

  /**
   * Function to publish exploration
   */
  async publishExplorationWithTitle(
    explorationTitle: string
  ): Promise<string | null> {
    await this.page.waitForSelector(
      `${publishExplorationButton}:not([disabled])`
    );
    await this.clickOn(publishExplorationButton);
    await this.type(explorationTitleInput, `${explorationTitle}`);
    await this.type(explorationGoalInput, `${explorationTitle}`);
    await this.clickOn(explorationCategoryDropdown);
    await this.clickOn('Algebra');
    await this.clickOn(saveExplorationChangesButton);
    await this.clickOn(explorationConfirmPublishButton);
    await this.page.waitForSelector(explorationIdElement);
    const explorationId = await this.page.$eval(
      explorationIdElement,
      element => (element as HTMLElement).innerText
    );
    await this.clickOn(closeShareModalButton);
    return explorationId;
  }

  /**
   * Function to navigate to exploration editor
   * @param explorationUrl - url of the exploration
   */
  async navigateToExplorationEditor(
    explorationUrl: string | null
  ): Promise<void> {
    if (!explorationUrl) {
      throw new Error('Cannot navigate to editor: explorationUrl is null');
    }

    const editorUrl = explorationUrl.replace('/explore/', '/create/');
    await this.page.goto(editorUrl);
  }

  /**
   * Asserts that a voiceover artist does not exist in the list.
   * @param artistUsername - The username of the voiceover artist to check for
   */
  async expectVoiceoverArtistNotExists(artistUsername: string): Promise<void> {
    const allVoiceoverArtists = await this.getAllVoiceoverArtists();
    if (allVoiceoverArtists.includes(artistUsername)) {
      throw new Error('Voiceover artist already exists in the list.');
    } else {
      showMessage(
        `Voiceover artist '${artistUsername}' does not exist and can be added.`
      );
    }
  }

  /**
   * Adds a voiceover artist to an exploration.
   * @param artistUsername - The username of the voiceover artist to add
   */
  async addVoiceoverArtistToExploration(artistUsername: string): Promise<void> {
    await this.clickOn(editVoiceoverArtistButton);
    await this.type(voiceArtistEditSelector, artistUsername);
    await this.clickOn(saveVoiceoverArtistEditButton);
  }

  /**
   * Function to expect to see error toast message
   * @param expectedErrorMessage - expected error message
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
      showMessage(`Error message is ${errorMessage}`);
    }
  }

  /**
   * Function to close toast message
   */
  async closeToastMessage(): Promise<void> {
    await this.clickOn(closeToastMessageButton);
  }

  /**
   * Function to expect voiceover artists list to contain
   * @param artistUsername - artist username
   */
  async expectVoiceoverArtistsListContains(
    artistUsername: string
  ): Promise<void> {
    await this.page.waitForSelector(updatedVoiceoverArtist);
    const allVoiceoverArtists = await this.getAllVoiceoverArtists();
    if (!allVoiceoverArtists.includes(artistUsername)) {
      throw new Error(
        `Expected all artists to contain ${artistUsername} but got ${allVoiceoverArtists}`
      );
    }
    showMessage(`All artists are ${allVoiceoverArtists}`);
  }

  /**
   * Function to get all voiceover artists
   * @returns {Promise<string[]>} - list of voiceover artists
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
}

export let VoiceoverAdminFactory = (): VoiceoverAdmin => new VoiceoverAdmin();
