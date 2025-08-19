// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility functions for voiceover submitter.
 */

import {BaseUser} from '../common/puppeteer-utils';

const voiceoverPlayPauseBtnSelector = '.e2e-test-play-voiceover-button';
const voiceoverPlayIconSelector = `${voiceoverPlayPauseBtnSelector} .e2e-test-play`;
const voiceoverPauseIconSelector = `${voiceoverPlayPauseBtnSelector} .e2e-test-pause`;
const voiceoverProgressBarSelector = '.e2e-test-voiceover-progress-bar';
const deleteVoiceoverBtnSelector = '.e2e-test-delete-voiceover-button';

const voiceoverPlayBtnInAudioBarSelector = '.e2e-test-play-circle';
const audioNotAvailableIconSelector = '.audio-controls-audio-not-available';
const saveUploadedAudioBtnSelector = '.e2e-test-save-uploaded-audio-button';

const addManualVoiceoverBtnSelector = '.e2e-test-voiceover-upload-audio';
const audioStatusUpdateBtnSelector = '.e2e-test-audio-status-update-button';
const audioNeedsUpdateIconSelector = '.needs-update-button-icon';
const audioDoesNotNeedUpdateIconSelector = '.does-not-needs-update-button-icon';
const translationNumericalStatusSelector =
  '.e2e-test-translation-numerical-status';

export class VoiceoverSubmitter extends BaseUser {
  /**
   * Checks if the voiceover is playable in the translation tab by playing and pausing it.
   */
  async expectVoiceoverIsPlayableInTranslationTab(): Promise<void> {
    // Get current voiceover progress.
    await this.expectElementToBeVisible(voiceoverProgressBarSelector);
    const initialVoiceoverProgress = parseInt(
      (await this.page.$eval(voiceoverProgressBarSelector, el =>
        el.getAttribute('aria-valuenow')
      )) ?? ''
    );

    // Play the voiceover.
    await this.expectElementToBeVisible(voiceoverPlayIconSelector);
    await this.clickOn(voiceoverPlayPauseBtnSelector);

    // Wait for the voiceover to finish playing.
    await this.page.waitForFunction(
      (selector: string, initialProgress: number) => {
        const element = document.querySelector(selector);
        return (
          parseInt(element?.getAttribute('aria-valuenow') ?? '') >
          initialProgress
        );
      },
      {},
      voiceoverProgressBarSelector,
      initialVoiceoverProgress
    );

    // Stop the voiceover.
    await this.expectElementToBeVisible(voiceoverPauseIconSelector);
    await this.clickOn(voiceoverPlayPauseBtnSelector);
    await this.expectElementToBeVisible(voiceoverPlayIconSelector);
  }

  /**
   * Checks if the voiceover play button is visible, enabled, or hidden.
   * @param status - The status of the voiceover play button.
   */
  async expectVoiceoverPlayButtonToBe(
    status: 'enabled' | 'disabled'
  ): Promise<void> {
    await this.expectElementToBeVisible(voiceoverPlayBtnInAudioBarSelector);
    await this.expectElementToBeVisible(
      audioNotAvailableIconSelector,
      status === 'disabled'
    );
  }

  /**
   * Deletes current voiceover in the current card.
   */
  async deleteVoiceoverInCurrentCard(): Promise<void> {
    await this.expectElementToBeVisible(deleteVoiceoverBtnSelector);
    await this.clickOn(deleteVoiceoverBtnSelector);
    await this.clickButtonInModal(
      'Are you sure you want to remove this voiceover?',
      'confirm'
    );
  }

  /**
   * Clicks on the add manual voiceover button.
   */
  async clickOnAddManualVoiceoverButton(): Promise<void> {
    await this.expectElementToBeVisible(addManualVoiceoverBtnSelector);
    await this.clickOn(addManualVoiceoverBtnSelector);
    await this.expectModalTitleToBe('Add Voiceover');
  }

  /**
   * Clicks on the save uploaded audio button.
   */
  async clickOnSaveUploadVoiceoverButton(): Promise<void> {
    await this.expectElementToBeVisible(saveUploadedAudioBtnSelector);
    await this.clickOn(saveUploadedAudioBtnSelector);
    await this.expectElementToBeClickable(saveUploadedAudioBtnSelector, false);
  }

  /**
   * Toggles the audio status update button.
   */
  async toggleAudioNeedsUpdateButton(): Promise<void> {
    await this.expectElementToBeVisible(audioStatusUpdateBtnSelector);
    const currentStatus = await this.isElementVisible(
      `${audioStatusUpdateBtnSelector}${audioNeedsUpdateIconSelector}`
    );

    await this.clickOn(audioStatusUpdateBtnSelector);

    await this.expectElementToBeVisible(
      `${audioStatusUpdateBtnSelector}${audioNeedsUpdateIconSelector}`,
      !currentStatus
    );
  }

  /**
   * Checks if the current voice status button is upto date or needs update.
   * @param status - The status of the current voice status button.
   */
  async expectCurrentVoiceStatusButtonToBe(
    status: 'upto date' | 'needs update'
  ): Promise<void> {
    const statusSelector =
      status === 'upto date'
        ? `${audioStatusUpdateBtnSelector}${audioDoesNotNeedUpdateIconSelector}`
        : `${audioStatusUpdateBtnSelector}${audioNeedsUpdateIconSelector}`;
    await this.expectElementToBeVisible(statusSelector);
  }

  /**
   * Checks if the translation numerical status is upto date or needs update.
   * @param status - The status of the translation numerical status.
   */
  async expectTranslationNumericalStatusToBe(status: string): Promise<void> {
    await this.expectTextContentToBe(
      translationNumericalStatusSelector,
      `(${status})`
    );
  }
}

export let VoiceoverSubmitterFactory = (): VoiceoverSubmitter =>
  new VoiceoverSubmitter();
