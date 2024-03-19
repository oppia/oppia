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
const closeShareModalButton = 'button.e2e-test-share-publish-close';

const explorationSettingsTab = 'a.e2e-test-settings-tab-icon';
const editVoiceoverArtistButton = 'span.e2e-test-edit-voice-artist-roles';
const voiceArtistEditSelector = 'input.e2e-test-new-voice-artist-username';
const saveVoiceoverArtistEditButton =
  'button.e2e-test-add-voice-artist-role-button';

const errorToastMessage = 'div.e2e-test-toast-warning-message';
const closeToastMessageButton = 'button.e2e-test-close-toast-warning';

const updatedVoiceoverArtist = 'div.e2e-test-voice-artist-voiceoverartist';
// const updatedVoiceoverArtist = 'div.e2e-test-voiceArtist-role-names';

export class VoiceoverAdmin extends BaseUser {
  /**
   * Function to navigate to creator dashboard page
   */
  async navigateToCreatorDashboardPage(): Promise<void> {
    await this.goto(creatorDashboardPage);
  }

  /**
   * Function to navigate to exploration settings tab
   */
  async navigateToExplorationSettingsTab(): Promise<void> {
    await this.page.waitForSelector(explorationSettingsTab);
    await this.clickOn(explorationSettingsTab);
  }

  /**
   * Function to create exploration with title
   * @param explorationTitle - title of the exploration
   */
  async createExplorationWithTitle(): Promise<void> {
    await this.clickOn(createExplorationButton);
    await this.page.waitForSelector(
      `${dismissWelcomeModalSelector}:not([disabled])`
    );
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForTimeout(500);
    await this.clickOn(textStateEditSelector);
    await this.page.waitForTimeout(500);
    await this.type(richTextAreaField, 'First Exploration');
    await this.clickOn(saveContentButton);

    await this.clickOn(addInteractionButton);
    await this.clickOn(interactionEndExplorationInputButton);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(`${saveChangesButton}:not([disabled])`);
    await this.clickOn(saveChangesButton);
    await this.clickOn(saveDraftButton);

    await this.page.waitForSelector(
      `${publishExplorationButton}:not([disabled])`
    );
    await this.clickOn(publishExplorationButton);
    await this.type(explorationTitleInput, 'First Exploration');
    await this.type(explorationGoalInput, 'First Exploration');
    await this.clickOn(explorationCategoryDropdown);
    await this.clickOn('Algebra');
    await this.clickOn(saveExplorationChangesButton);
    await this.page.waitForSelector(
      `${publishExplorationButton}:not([disabled])`
    );
    await this.clickOn(publishExplorationButton);
    await this.clickOn(explorationConfirmPublishButton);
    await this.page.waitForSelector(closeShareModalButton);
    await this.clickOn(closeShareModalButton);
  }

  /**
   * Function to edit voiceover artist
   */
  async editVoiceoverArtist(artistUsername: string): Promise<void> {
    await this.page.waitForSelector(editVoiceoverArtistButton);
    await this.clickOn(editVoiceoverArtistButton);
    await this.page.waitForSelector(voiceArtistEditSelector);
    await this.type(voiceArtistEditSelector, artistUsername);
    await this.clickOn(saveVoiceoverArtistEditButton);
  }

  /**
   * Function to expect to see error toast message
   */
  async expectToSeeErrorToastMessage(): Promise<void> {
    await this.page.waitForSelector(errorToastMessage);
  }

  /**
   * Function to close toast message
   */
  async closeToastMessage(): Promise<void> {
    await this.page.waitForSelector(errorToastMessage);
    await this.page.waitForTimeout(500);
    await this.clickOn(closeToastMessageButton);
  }

  /**
   * Function to expect to see updated voiceover artist
   */
  async expectToSeeUpdatedVoiceoverArtist(): Promise<void> {
    await this.page.waitForSelector(updatedVoiceoverArtist);
  }
}

export let VoiceoverAdminFactory = (): VoiceoverAdmin => new VoiceoverAdmin();
