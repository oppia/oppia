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

const voiceoverPlayPauseButton = '.e2e-test-play-voiceover-button';
const voiceoverPlayIcon = `${voiceoverPlayPauseButton} .e2e-test-play`;
const voiceoverPauseIcon = `${voiceoverPlayPauseButton} .e2e-test-pause`;
const voiceoverProgressBar = '.e2e-test-voiceover-progress-bar';
const deleteVoiceoverButton = '.e2e-test-delete-voiceover-button';
const audioPlayerButton = '.e2e-test-play-circle';
const audioNotAvailableIcon = '.audio-controls-audio-not-available';
const saveUploadedAudioButton = '.e2e-test-save-uploaded-audio-button';
const addManualVoiceoverButton = '.e2e-test-voiceover-upload-audio';
const audioStatusUpdateButton = '.e2e-test-audio-status-update-button';
const audioNeedsUpdateIcon = '.needs-update-button-icon';
const audioDoesNotNeedUpdateIcon = '.does-not-needs-update-button-icon';
const translationNumericalStatus = '.e2e-test-translation-numerical-status';
const contentVoiceoverText = '.e2e-test-content-text';
const interactionVoiceoverText = '.e2e-test-interaction-text';
const solutionVoiceoverText = '.e2e-test-solution-text';
const uploadVoiceoverFileInput = '.e2e-test-upload-audio-input';
const voiceoverLanguageAccentSelector =
  '.e2e-test-voiceover-language-accent-selector';
const modalTitle = '.e2e-test-modal-header';
const uploadErrorMessage = '.e2e-test-upload-error-message';
const nodeWarningSign = '.e2e-test-node-warning-sign';
const voiceoverLanguageSelect = '.e2e-test-audio-lang-select';

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
   * Checks if the voiceover is playable in the translation tab.
   */
  async expectVoiceoverIsPlayableInTranslationTab(): Promise<void> {
    const progressBar = this.page.locator(voiceoverProgressBar);
    await expect(progressBar).toBeVisible();
    const initialProgress = Number(
      await progressBar.getAttribute('aria-valuenow')
    );

    await expect(this.page.locator(voiceoverPlayIcon)).toBeVisible();
    await this.clickOnElementWithSelector(voiceoverPlayPauseButton);
    await this.page.waitForFunction(
      ({selector, initialValue}) => {
        const element = document.querySelector(selector);
        return Number(element?.getAttribute('aria-valuenow')) > initialValue;
      },
      {selector: voiceoverProgressBar, initialValue: initialProgress}
    );

    await expect(this.page.locator(voiceoverPauseIcon)).toBeVisible();
    await this.clickOnElementWithSelector(voiceoverPlayPauseButton);
    await expect(this.page.locator(voiceoverPlayIcon)).toBeVisible();
  }

  /**
   * Checks whether the voiceover play button is enabled or disabled.
   * @param status - The expected play button status.
   */
  async expectVoiceoverPlayButtonToBe(
    status: 'enabled' | 'disabled'
  ): Promise<void> {
    await expect(this.page.locator(audioPlayerButton)).toBeVisible();
    if (status === 'disabled') {
      await expect(this.page.locator(audioNotAvailableIcon)).toBeVisible();
    } else {
      await expect(this.page.locator(audioNotAvailableIcon)).toBeHidden();
    }
  }

  /**
   * Deletes the voiceover for the current card.
   */
  async deleteVoiceoverInCurrentCard(): Promise<void> {
    await this.clickOnElementWithSelector(deleteVoiceoverButton);
    const confirmModalText =
      'h3.e2e-test-modal-header:has-text("Are you sure you want to remove this voiceover?")';
    await expect(this.page.locator(confirmModalText)).toBeVisible();
    await this.clickOnElementWithSelector(
      'button.e2e-test-confirm-action-button'
    );
    await expect(this.page.locator(confirmModalText)).toBeHidden();
  }

  /**
   * Opens the modal for adding a manual voiceover.
   */
  async clickOnAddManualVoiceoverButton(): Promise<void> {
    await this.clickOnElementWithSelector(addManualVoiceoverButton);
    await this.expectTextContentToContain(modalTitle, 'Add Voiceover');
  }

  /**
   * Saves the uploaded voiceover.
   */
  async clickOnSaveUploadVoiceoverButton(): Promise<void> {
    await this.clickOnElementWithSelector(saveUploadedAudioButton);
    await this.expectElementToBeClickable(saveUploadedAudioButton, false);
  }

  /**
   * Toggles the audio status update button.
   */
  async toggleAudioNeedsUpdateButton(): Promise<void> {
    const needsUpdateIcon = this.page.locator(
      `${audioStatusUpdateButton}${audioNeedsUpdateIcon}`
    );
    const wasMarkedAsNeedingUpdate = await needsUpdateIcon.isVisible();
    await this.clickOnElementWithSelector(audioStatusUpdateButton);
    if (wasMarkedAsNeedingUpdate) {
      await expect(needsUpdateIcon).toBeHidden();
    } else {
      await expect(needsUpdateIcon).toBeVisible();
    }
  }

  /**
   * Checks whether the current voiceover is up to date or needs updating.
   * @param status - The expected voiceover status.
   */
  async expectCurrentVoiceStatusButtonToBe(
    status: 'upto date' | 'needs update'
  ): Promise<void> {
    const icon =
      status === 'upto date'
        ? audioDoesNotNeedUpdateIcon
        : audioNeedsUpdateIcon;
    await expect(
      this.page.locator(`${audioStatusUpdateButton}${icon}`)
    ).toBeVisible();
  }

  /**
   * Checks the translation's numerical status.
   * @param status - The expected status.
   */
  async expectTranslationNumericalStatusToBe(status: string): Promise<void> {
    await this.expectTextContentToBe(translationNumericalStatus, `(${status})`);
  }

  /**
   * Selects a translation content type.
   * @param type - The content type to select.
   */
  async selectVoiceoverContentType(
    type: 'Content' | 'Interaction' | 'Feedback' | 'Hints' | 'Solution'
  ): Promise<void> {
    const selector = TRANSLATION_TAB_SELECTORS[type];
    await this.clickOnElementWithSelector(selector);
    await expect
      .poll(() =>
        this.page
          .locator(selector)
          .evaluate(element =>
            element.parentElement?.classList.contains(
              'oppia-active-translation-tab'
            )
          )
      )
      .toBe(true);
  }

  /**
   * Checks that content voiceover text contains the expected text.
   * @param expectedText - The expected text.
   */
  async expectContentVoiceoverToContain(expectedText: string): Promise<void> {
    await this.expectTextContentToContain(contentVoiceoverText, expectedText);
  }

  /**
   * Checks that interaction voiceover text contains the expected text.
   * @param expectedText - The expected text.
   */
  async expectInteractionVoiceoverToContain(
    expectedText: string
  ): Promise<void> {
    await this.expectTextContentToContain(
      interactionVoiceoverText,
      expectedText
    );
  }

  /**
   * Checks that solution voiceover text contains the expected text.
   * @param expectedText - The expected text.
   */
  async expectSolutionVoiceoverToContain(expectedText: string): Promise<void> {
    await this.expectTextContentToContain(solutionVoiceoverText, expectedText);
  }

  /**
   * Checks that the visible feedbacks contain the expected text.
   * @param expectedTexts - The expected feedback texts.
   */
  async expectVisibleFeedbackTextsToContain(
    expectedTexts: string[]
  ): Promise<void> {
    for (let index = 0; index < expectedTexts.length; index++) {
      const cardSelector = `.e2e-test-feedback-${index}`;
      const textSelector = `.e2e-test-feedback-${index}-text`;
      await this.clickOnElementWithSelector(cardSelector);
      await this.expectTextContentToContain(textSelector, expectedTexts[index]);
    }
  }

  /**
   * Checks that the visible hints contain the expected text.
   * @param expectedTexts - The expected hint texts.
   */
  async expectVisibleHintTextsToContain(
    expectedTexts: string[]
  ): Promise<void> {
    for (let index = 0; index < expectedTexts.length; index++) {
      const hintSelector = `.e2e-test-hint-${index}`;
      const textSelector = `.e2e-test-hint-${index}-text`;
      await this.clickOnElementWithSelector(hintSelector);
      await this.expectTextContentToContain(textSelector, expectedTexts[index]);
    }
  }

  /**
   * Checks that the translation progress accessible name matches the text.
   * @param expectedText - The expected accessible name.
   */
  async expectTranslationProgressAriaLabelToMatch(
    expectedText: string
  ): Promise<void> {
    const progress = this.page.locator(translationNumericalStatus);
    await expect(progress).toHaveAttribute(
      'aria-label',
      new RegExp(expectedText)
    );
  }

  /**
   * Checks the accessible name of a translation sub-tab.
   * @param tabName - The translation tab.
   * @param expectedAriaLabel - The expected accessible name.
   */
  async expectTranslationSubTabAriaLabelToBe(
    tabName: 'Content' | 'Feedback' | 'Hints' | 'Solution',
    expectedAriaLabel: string
  ): Promise<void> {
    await expect(
      this.page.locator(ACCESSIBLE_TAB_SELECTORS[tabName])
    ).toHaveAttribute('aria-label', expectedAriaLabel);
  }

  /**
   * Selects a voiceover language accent.
   * @param accentDescription - The language and accent to select.
   */
  async selectVoiceoverLanguageAccent(
    accentDescription: string
  ): Promise<void> {
    await this.clickOnElementWithSelector(voiceoverLanguageAccentSelector);
    await this.selectMatOption(accentDescription);
    await this.expectTextContentToContain(
      voiceoverLanguageAccentSelector,
      accentDescription
    );
  }

  /**
   * Checks the upload voiceover input's accessible name.
   * @param expectedAccessibleName - The expected accessible name.
   */
  async expectUploadVoiceoverFileButtonAccessibleNameToBe(
    expectedAccessibleName: string
  ): Promise<void> {
    await expect(this.page.locator(uploadVoiceoverFileInput)).toHaveAttribute(
      'aria-label',
      expectedAccessibleName
    );
  }

  /**
   * Checks the play voiceover button's accessible name.
   * @param expectedAccessibleName - The expected accessible name.
   */
  async expectPlayVoiceoverButtonAccessibleNameToBe(
    expectedAccessibleName: string
  ): Promise<void> {
    await expect(this.page.locator(voiceoverPlayPauseButton)).toHaveAttribute(
      'aria-label',
      expectedAccessibleName
    );
  }

  /**
   * Checks that the upload error contains the expected message.
   * @param expectedErrorMessage - The expected error text.
   */
  async expectUploadErrorMessageToBe(
    expectedErrorMessage: string
  ): Promise<void> {
    await this.expectTextContentToContain(
      uploadErrorMessage,
      expectedErrorMessage
    );
  }

  /**
   * Checks whether the exploration graph warning sign is visible.
   * @param visible - Whether the warning sign should be visible.
   */
  async expectNodeWariningSignToBeVisible(
    visible: boolean = true
  ): Promise<void> {
    if ((this.page.viewportSize()?.width ?? 0) <= 768) {
      return;
    }
    if (visible) {
      await expect(this.page.locator(nodeWarningSign)).toBeVisible();
    } else {
      await expect(this.page.locator(nodeWarningSign)).toBeHidden();
    }
  }

  /**
   * Checks the currently selected voiceover language in the player.
   * @param language - The expected language.
   */
  async expectCurrentVoiceoverLanguageToBe(language: string): Promise<void> {
    await expect(this.page.locator(voiceoverLanguageSelect)).toHaveValue(
      language
    );
  }
}

export const VoiceoverSubmitterFactory = (page: Page): VoiceoverSubmitter =>
  new VoiceoverSubmitter(page);
