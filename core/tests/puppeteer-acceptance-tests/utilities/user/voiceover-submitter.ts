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

const contentVoiceoverTextSelector = '.e2e-test-content-text';
const interactionVoiceoverTextSelector = '.e2e-test-interaction-text';
const solutionVoiceoverTextSelector = '.e2e-test-solution-text';
const uploadVoiceoverFileInputSelector = '.e2e-test-upload-audio-input';

const voiceoverLanguageAccentSelector =
  '.e2e-test-voiceover-language-accent-selector';

const TRANSLATION_TAB_SELECTORS = {
  Content: '.e2e-test-translation-content-tab',
  Interaction: '.e2e-test-translation-interaction-tab',
  Feedback: '.e2e-test-translation-feedback-tab',
  Hints: '.e2e-test-translation-hints-tab',
  Solution: '.e2e-test-translation-solution-tab',
};

const ACCESSIBLE_TAB_SELECTORS = {
  Content: '.e2e-test-accessibility-translation-content',
  Feedback: '.e2e-test-accessibility-translation-feedback',
  Hints: '.e2e-test-accessibility-translation-hint',
  Solution: '.e2e-test-accessibility-translation-solution',
};

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
    await this.clickOnElementWithSelector(voiceoverPlayPauseBtnSelector);

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
    await this.clickOnElementWithSelector(voiceoverPlayPauseBtnSelector);
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
    await this.clickOnElementWithSelector(deleteVoiceoverBtnSelector);
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
    await this.clickOnElementWithSelector(addManualVoiceoverBtnSelector);
    await this.expectModalTitleToBe('Add Voiceover');
  }

  /**
   * Clicks on the save uploaded audio button.
   */
  async clickOnSaveUploadVoiceoverButton(): Promise<void> {
    await this.expectElementToBeVisible(saveUploadedAudioBtnSelector);
    await this.clickOnElementWithSelector(saveUploadedAudioBtnSelector);
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

    await this.clickOnElementWithSelector(audioStatusUpdateBtnSelector);

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

  /**
   * Selects the specified voiceover content type tab in the translation tab.
   * @param type - The voiceover content type to select (e.g., "Content", "Interaction",
   * "Feedback", "Hints", or "Solution").
   */
  async selectVoiceoverContentType(
    type: 'Content' | 'Interaction' | 'Feedback' | 'Hints' | 'Solution'
  ): Promise<void> {
    const selector = TRANSLATION_TAB_SELECTORS[type];

    // Ensure the tab exists.
    await this.expectElementToBeVisible(selector);

    // Click the tab.
    await this.clickOnElementWithSelector(selector);

    // Wait until it becomes active.
    await this.page.waitForFunction(
      (sel: string) => {
        const el = document.querySelector(sel);
        return el?.parentElement?.classList.contains(
          'oppia-active-translation-tab'
        );
      },
      {},
      selector
    );
  }

  /**
   * Checks if the content voiceover text contains the specified expected text.
   * @param expectedText - The expected text to be present in the content voiceover.
   */
  async expectContentVoiceoverToContain(expectedText: string): Promise<void> {
    await this.expectTextContentToContain(
      contentVoiceoverTextSelector,
      expectedText
    );
  }

  /**
   * Checks if the interaction voiceover text contains the specified expected text.
   * @param expectedText - The expected text to be present in the interaction voiceover.
   */
  async expectInteractionVoiceoverToContain(
    expectedText: string
  ): Promise<void> {
    await this.expectTextContentToContain(
      interactionVoiceoverTextSelector,
      expectedText
    );
  }

  /**
   * Checks if the solution voiceover text contains the specified expected text.
   * @param expectedText - The expected text to be present in the solution voiceover.
   */
  async expectSolutionVoiceoverToContain(expectedText: string): Promise<void> {
    await this.expectTextContentToContain(
      solutionVoiceoverTextSelector,
      expectedText
    );
  }

  /**
   * Checks if the visible feedback texts contain the specified expected texts.
   * @param expectedTexts - The list of expected feedback texts to verify.
   */
  async expectVisibleFeedbackTextsToContain(
    expectedTexts: string[]
  ): Promise<void> {
    for (let i = 0; i < expectedTexts.length; i++) {
      // Click anywhere on the feedback card to expand it.
      const cardSelector = `.e2e-test-feedback-${i}`;
      const textSelector = `.e2e-test-feedback-${i}-text`;

      await this.expectElementToBeVisible(cardSelector);
      await this.waitForElementToStabilize(cardSelector);

      await this.clickOnElementWithSelector(cardSelector);

      await this.expectElementToBeVisible(textSelector);
      await this.expectTextContentToContain(textSelector, expectedTexts[i]);
    }
  }

  /**
   * Checks if the visible hint texts contain the specified expected texts.
   * @param expectedTexts - The list of expected hint texts to verify.
   */
  async expectVisibleHintTextsToContain(
    expectedTexts: string[]
  ): Promise<void> {
    for (let i = 0; i < expectedTexts.length; i++) {
      const hintSelector = `.e2e-test-hint-${i}`;
      const hintTextSelector = `.e2e-test-hint-${i}-text`;

      await this.expectElementToBeVisible(hintSelector);
      await this.waitForElementToStabilize(hintSelector);

      await this.clickOnElementWithSelector(hintSelector);

      await this.expectElementToBeVisible(hintTextSelector);
      await this.expectTextContentToContain(hintTextSelector, expectedTexts[i]);
    }
  }

  /**
   * Checks if the translation progress element has an aria-label matching the expected text.
   * @param expectedText - The expected aria-label text for the translation progress element.
   */
  async expectTranslationProgressAriaLabelToMatch(
    expectedText: string
  ): Promise<void> {
    await this.expectElementToBeVisible(translationNumericalStatusSelector);

    await this.page.waitForFunction(
      (selector: string) => {
        const el = document.querySelector(selector);
        const label = el?.getAttribute('aria-label') || '';

        return (
          label.includes('items translated') &&
          !label.includes('NaN') &&
          !label.includes('undefined')
        );
      },
      {},
      translationNumericalStatusSelector
    );

    const ariaLabel = await this.page.$eval(
      translationNumericalStatusSelector,
      el => el.getAttribute('aria-label') || el.textContent
    );

    expect(ariaLabel).toMatch(expectedText);
  }

  /**
   * Checks if the specified translation sub-tab has the expected aria-label.
   * @param tabName - The name of the translation sub-tab (e.g., "Content", "Feedback",
   * "Hints", or "Solution").
   * @param expectedAriaLabel - The expected aria-label value of the sub-tab.
   */
  async expectTranslationSubTabAriaLabelToBe(
    tabName: 'Content' | 'Feedback' | 'Hints' | 'Solution',
    expectedAriaLabel: string
  ): Promise<void> {
    const selector = ACCESSIBLE_TAB_SELECTORS[tabName];

    await this.expectElementToBeVisible(selector);

    await this.page.waitForFunction(
      (sel: string) => {
        const el = document.querySelector(sel);
        return el?.getAttribute('aria-label');
      },
      {},
      selector
    );

    const ariaLabel = await this.page.$eval(selector, el =>
      el.getAttribute('aria-label')
    );

    expect(ariaLabel).toBe(expectedAriaLabel);
  }

  /**
   * Selects the specified voiceover language accent from the language accent dropdown
   * in the translation tab.
   * @param accentDescription - The description of the language accent to select
   * (e.g., "English (India)").
   */
  async selectVoiceoverLanguageAccent(
    accentDescription: string
  ): Promise<void> {
    // Wait for accent selector to appear.
    await this.expectElementToBeVisible(voiceoverLanguageAccentSelector);

    // Open the accent dropdown.
    await this.clickOnElementWithSelector(voiceoverLanguageAccentSelector);

    // Select accent and wait for the options panel to close.
    await this.selectMatOption(accentDescription);
    await this.expectTextContentToContain(
      voiceoverLanguageAccentSelector,
      accentDescription
    );
  }

  /**
   * Checks if the upload voiceover file input has the expected accessible name.
   * @param expectedAccessibleName - The expected aria-label of the upload voiceover file input.
   */
  async expectUploadVoiceoverFileButtonAccessibleNameToBe(
    expectedAccessibleName: string
  ): Promise<void> {
    await this.expectElementToBeVisible(uploadVoiceoverFileInputSelector);

    const accessibleName = await this.page.$eval(
      uploadVoiceoverFileInputSelector,
      el => el.getAttribute('aria-label') || ''
    );

    expect(accessibleName).toBe(expectedAccessibleName);
  }

  /**
   * Checks if the play voiceover button has the expected accessible name.
   * @param expectedAccessibleName - The expected aria-label of the play voiceover button.
   */
  async expectPlayVoiceoverButtonAccessibleNameToBe(
    expectedAccessibleName: string
  ): Promise<void> {
    await this.expectElementToBeVisible(voiceoverPlayPauseBtnSelector);

    const accessibleName = await this.page.$eval(
      voiceoverPlayPauseBtnSelector,
      el => (el.getAttribute('aria-label') || '').trim()
    );

    expect(accessibleName).toBe(expectedAccessibleName);
  }
}

export let VoiceoverSubmitterFactory = (): VoiceoverSubmitter =>
  new VoiceoverSubmitter();
