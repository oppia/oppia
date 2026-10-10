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
 * @fileoverview Utility functions for voiceover submitter.
 */

import {expect, Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';

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
} as const;

const ACCESSIBLE_TAB_SELECTORS = {
  Content: '.e2e-test-accessibility-translation-content',
  Feedback: '.e2e-test-accessibility-translation-feedback',
  Hints: '.e2e-test-accessibility-translation-hint',
  Solution: '.e2e-test-accessibility-translation-solution',
} as const;

export class VoiceoverSubmitter extends BaseUser {
  /**
   * Checks if the voiceover is playable in the translation tab by playing and pausing it.
   */
  async expectVoiceoverIsPlayableInTranslationTab(): Promise<void> {
    await this.expectElementToBeVisible(voiceoverProgressBarSelector);
    const initialVoiceoverProgress = await this.page.$eval(
      voiceoverProgressBarSelector,
      element => parseInt(element.getAttribute('aria-valuenow') ?? '', 10)
    );

    await this.expectElementToBeVisible(voiceoverPlayIconSelector);
    await this.clickOnElementWithSelector(voiceoverPlayPauseBtnSelector);
    await this.page.waitForFunction(
      ({
        selector,
        initialProgress,
      }: {
        selector: string;
        initialProgress: number;
      }) => {
        const element = document.querySelector(selector);
        return (
          parseInt(element?.getAttribute('aria-valuenow') ?? '', 10) >
          initialProgress
        );
      },
      {
        selector: voiceoverProgressBarSelector,
        initialProgress: initialVoiceoverProgress,
      }
    );

    await this.expectElementToBeVisible(voiceoverPauseIconSelector);
    await this.clickOnElementWithSelector(voiceoverPlayPauseBtnSelector);
    await this.expectElementToBeVisible(voiceoverPlayIconSelector);
  }

  /**
   * Checks if the voiceover play button is enabled or disabled.
   * @param status - The expected status of the voiceover play button.
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
   * Deletes the current voiceover in the current card.
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
   * Checks the current voiceover status button.
   * @param status - The expected status of the current voiceover.
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
   * Checks the numerical translation status.
   * @param status - The expected status, such as "1/7".
   */
  async expectTranslationNumericalStatusToBe(status: string): Promise<void> {
    await this.expectTextContentToBe(
      translationNumericalStatusSelector,
      `(${status})`
    );
  }

  /**
   * Selects a voiceover content type in the translation tab.
   * @param type - The voiceover content type to select.
   */
  async selectVoiceoverContentType(
    type: keyof typeof TRANSLATION_TAB_SELECTORS
  ): Promise<void> {
    const selector = TRANSLATION_TAB_SELECTORS[type];
    await this.expectElementToBeVisible(selector);
    await this.clickOnElementWithSelector(selector);
    await this.page.waitForFunction(
      (tabSelector: string) =>
        document
          .querySelector(tabSelector)
          ?.parentElement?.classList.contains('oppia-active-translation-tab'),
      selector
    );
  }

  /**
   * Checks that the content voiceover contains the expected text.
   * @param expectedText - The expected text.
   */
  async expectContentVoiceoverToContain(expectedText: string): Promise<void> {
    await this.expectTextContentToContain(
      contentVoiceoverTextSelector,
      expectedText
    );
  }

  /**
   * Checks that the interaction voiceover contains the expected text.
   * @param expectedText - The expected text.
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
   * Checks that the solution voiceover contains the expected text.
   * @param expectedText - The expected text.
   */
  async expectSolutionVoiceoverToContain(expectedText: string): Promise<void> {
    await this.expectTextContentToContain(
      solutionVoiceoverTextSelector,
      expectedText
    );
  }

  /**
   * Checks the visible feedback texts.
   * @param expectedTexts - The expected feedback texts.
   */
  async expectVisibleFeedbackTextsToContain(
    expectedTexts: string[]
  ): Promise<void> {
    for (let i = 0; i < expectedTexts.length; i++) {
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
   * Checks the visible hint texts.
   * @param expectedTexts - The expected hint texts.
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
   * Checks the translation progress aria-label.
   * @param expectedText - The expected aria-label.
   */
  async expectTranslationProgressAriaLabelToMatch(
    expectedText: string
  ): Promise<void> {
    await this.expectElementToBeVisible(translationNumericalStatusSelector);
    await this.page.waitForFunction((selector: string) => {
      const element = document.querySelector(selector);
      const label = element?.getAttribute('aria-label') ?? '';
      return (
        label.includes('items translated') &&
        !label.includes('NaN') &&
        !label.includes('undefined')
      );
    }, translationNumericalStatusSelector);

    const ariaLabel = await this.page.$eval(
      translationNumericalStatusSelector,
      element => element.getAttribute('aria-label') ?? element.textContent ?? ''
    );
    expect(ariaLabel).toMatch(expectedText);
  }

  /**
   * Checks the aria-label of a translation sub-tab.
   * @param tabName - The translation sub-tab.
   * @param expectedAriaLabel - The expected aria-label.
   */
  async expectTranslationSubTabAriaLabelToBe(
    tabName: keyof typeof ACCESSIBLE_TAB_SELECTORS,
    expectedAriaLabel: string
  ): Promise<void> {
    const selector = ACCESSIBLE_TAB_SELECTORS[tabName];
    await this.expectElementToBeVisible(selector);
    await this.page.waitForFunction(
      (tabSelector: string) =>
        document.querySelector(tabSelector)?.getAttribute('aria-label'),
      selector
    );

    const ariaLabel = await this.page.$eval(selector, element =>
      element.getAttribute('aria-label')
    );
    expect(ariaLabel).toBe(expectedAriaLabel);
  }

  /**
   * Selects a voiceover language accent.
   * @param accentDescription - The language-accent description.
   */
  async selectVoiceoverLanguageAccent(
    accentDescription: string
  ): Promise<void> {
    await this.expectElementToBeVisible(voiceoverLanguageAccentSelector);
    await this.clickOnElementWithSelector(voiceoverLanguageAccentSelector);
    await this.selectMatOption(accentDescription);
    await this.expectTextContentToContain(
      voiceoverLanguageAccentSelector,
      accentDescription
    );
  }

  /**
   * Checks the accessible name of the voiceover upload input.
   * @param expectedAccessibleName - The expected accessible name.
   */
  async expectUploadVoiceoverFileButtonAccessibleNameToBe(
    expectedAccessibleName: string
  ): Promise<void> {
    await this.expectElementToBeVisible(uploadVoiceoverFileInputSelector);
    const accessibleName = await this.page.$eval(
      uploadVoiceoverFileInputSelector,
      element => element.getAttribute('aria-label') ?? ''
    );
    expect(accessibleName).toBe(expectedAccessibleName);
  }

  /**
   * Checks the accessible name of the play voiceover button.
   * @param expectedAccessibleName - The expected accessible name.
   */
  async expectPlayVoiceoverButtonAccessibleNameToBe(
    expectedAccessibleName: string
  ): Promise<void> {
    await this.expectElementToBeVisible(voiceoverPlayPauseBtnSelector);
    const accessibleName = await this.page.$eval(
      voiceoverPlayPauseBtnSelector,
      element => (element.getAttribute('aria-label') ?? '').trim()
    );
    expect(accessibleName).toBe(expectedAccessibleName);
  }
}

export let VoiceoverSubmitterFactory = (page: Page): VoiceoverSubmitter =>
  new VoiceoverSubmitter(page);
