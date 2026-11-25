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
 * @fileoverview Utility class for translation submitters.
 */

import {expect, Page} from '@playwright/test';
import {Contributor} from './contributor';

const opportunityTranslateButtonSelector =
  '.e2e-test-opportunity-list-item-button';
const translateTextModalHeaderContainerSelector =
  '.e2e-test-translate-text-header-container';
const textToTranslateContainerSelector = '.oppia-text-to-translate-container';
const skipTranslationButtonSelector = '.e2e-test-skip-translation-button';
const rteEditorBodySelector = '.e2e-test-rte';

export class TranslationSubmitter extends Contributor {
  /**
   * Opens the translation editor for the requested chapter and story.
   */
  async clickOnTranslateButtonInTranslateTextTab(
    chapterName: string,
    storyName: string
  ): Promise<void> {
    const opportunity = await this.findOpportunityItem(chapterName, storyName);
    if (!opportunity) {
      throw new Error(
        `Opportunity item for chapter ${chapterName} and story ${storyName} not found.`
      );
    }
    await opportunity.locator(opportunityTranslateButtonSelector).click();
    await expect(
      this.page.locator(translateTextModalHeaderContainerSelector)
    ).toBeVisible();
  }

  /**
   * Skips the current translation and loads the next one.
   */
  async clickOnSkipTranslationButton(): Promise<void> {
    const textToTranslate = this.page.locator(textToTranslateContainerSelector);
    const previousText = await textToTranslate.textContent();
    await this.page.locator(skipTranslationButtonSelector).click();
    await expect(textToTranslate).not.toHaveText(previousText || '');
  }

  /**
   * Types text into the rich-text editor.
   */
  async typeTextForRTE(text: string): Promise<void> {
    const editor = this.page.locator(rteEditorBodySelector);
    await expect(editor).toBeVisible();
    const previousText = await editor.textContent();
    if (
      !(await editor.evaluate(element =>
        element.classList.contains('cke_focus')
      ))
    ) {
      await editor.click();
    }
    await this.page.keyboard.type(`${text}\n`);
    await expect(editor).not.toHaveText(previousText || '');
  }
}

export const TranslationSubmitterFactory = (page: Page): TranslationSubmitter =>
  new TranslationSubmitter(page);
