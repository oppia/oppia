// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utility class for translation submitters.
 */

import {Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import {
  getTranslationOpportunityCard,
  opportunityTranslateButtonSelector,
} from './contributor';

const translateTextModalHeaderContainerSelector =
  '.e2e-test-translate-text-header-container';

const textToTranslateContainerSelector = '.oppia-text-to-translate-container';

const skipTranslationButtonSelector = '.e2e-test-skip-translation-button';

const rteEditorBodySelector = '.e2e-test-rte';

const translateButtonClickAttempts = 3;
const translateModalTimeoutMsecs = 10000;

export class TranslationSubmitter extends BaseUser {
  /**
   * Clicks the translate button for the specified chapter and story.
   *
   * The opportunity list can re-render after filtering, so the opportunity
   * and translate button are located again on each attempt.
   *
   * @param chapterName - The name of the chapter.
   * @param storyName - The name of the story.
   */
  async clickOnTranslateButtonInTranslateTextTab(
    chapterName: string,
    storyName: string
  ): Promise<void> {
    for (let attempt = 1; attempt <= translateButtonClickAttempts; attempt++) {
      const opportunityItem = await getTranslationOpportunityCard(
        this.page,
        chapterName,
        storyName
      );

      const translateButton = opportunityItem
        .locator(opportunityTranslateButtonSelector)
        .first();

      await translateButton.waitFor({state: 'visible'});
      await translateButton.scrollIntoViewIfNeeded();
      await translateButton.click();

      try {
        await this.page
          .locator(translateTextModalHeaderContainerSelector)
          .waitFor({
            state: 'visible',
            timeout: translateModalTimeoutMsecs,
          });

        return;
      } catch (error) {
        if (attempt === translateButtonClickAttempts) {
          throw error;
        }
      }
    }
  }

  /**
   * Skips the current translation and loads the next translation.
   */
  async clickOnSkipTranslationButton(): Promise<void> {
    const textToTranslate = this.page.locator(textToTranslateContainerSelector);

    await textToTranslate.waitFor({state: 'visible'});

    const previousContent = await textToTranslate.textContent();

    const skipButton = this.page.locator(skipTranslationButtonSelector);

    await skipButton.waitFor({state: 'visible'});
    await skipButton.click();

    await this.page.waitForFunction(
      ({selector, previous}: {selector: string; previous: string}) => {
        const element = document.querySelector(selector);

        return element?.textContent !== previous;
      },
      {
        selector: textToTranslateContainerSelector,
        previous: previousContent ?? '',
      }
    );
  }

  /**
   * Types the given text into the translation RTE.
   *
   * @param text - The text to type in the RTE.
   */
  async typeTextForRTE(text: string): Promise<void> {
    const rteEditor = this.page.locator(rteEditorBodySelector);

    await rteEditor.waitFor({state: 'visible'});

    if (
      !(await rteEditor.evaluate(element => element === document.activeElement))
    ) {
      await rteEditor.click();
    }

    await this.page.keyboard.type(`${text}\n`);

    await this.page.waitForFunction(
      ({selector, expectedText}: {selector: string; expectedText: string}) => {
        const element = document.querySelector(selector);

        return element?.textContent?.includes(expectedText);
      },
      {
        selector: rteEditorBodySelector,
        expectedText: text,
      }
    );
  }
}

export const TranslationSubmitterFactory = (
  page: Page
): TranslationSubmitter => {
  return new TranslationSubmitter(page);
};
