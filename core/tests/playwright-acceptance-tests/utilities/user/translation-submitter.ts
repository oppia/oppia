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

import {expect, Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import {
  getTranslationOpportunityCard,
  opportunityItemHeadingSelector,
  opportunityTranslateButtonSelector,
} from './contributor';

interface MathJaxHub {
  Queue: (callback: () => void) => void;
}

interface MathJaxWindow extends Window {
  MathJax?: {
    isReady?: boolean;
    Hub?: MathJaxHub;
  };
}

const translateTextModalHeaderContainerSelector =
  '.e2e-test-translate-text-header-container';
const textToTranslateContainerSelector = '.oppia-text-to-translate-container';
const skipTranslationButtonSelector = '.e2e-test-skip-translation-button';
const paginationButtonSelectorPrefix = '.e2e-test-pagination-button';
const rteEditorBodySelector = '.e2e-test-rte';
const rteToolbarButtonSelector = 'a.cke_button';
const rteHelperModalSelector = '.e2e-test-rte-helper-modal-container';
const rteModalSaveButtonSelector = '.e2e-test-close-rich-text-component-editor';
const textInputSelector = 'input';
const textareaSelector = 'textarea';
const skillNameInputSelector = '.e2e-test-skill-name-input';
const skillItemSelector = '.e2e-test-rte-skill-selector-item';
const selectedSkillSelector = '.e2e-test-rte-skill-selected';
const copyButtonSelector = '.e2e-test-copy-button';
const imageSelector = '.e2e-test-image';
const savedImageContainerSelector =
  '.e2e-test-saved-diagram-container, .filepath-editor-saved-image-container';
const mathEditorSelector = 'math-expression-content-editor';
const translationSubmittedToastSelector = '.e2e-test-toast-message';

const translateButtonClickAttempts = 3;
const translateModalTimeoutMsecs = 10000;

export class TranslationSubmitter extends BaseUser {
  /** Checks whether the requested pagination control is visible. */
  async expectPaginationButtonToBeVisible(
    button: 'previous' | 'next',
    visible: boolean = true
  ): Promise<void> {
    const paginationButton = this.page.locator(
      `${paginationButtonSelectorPrefix}-${button}`
    );
    if (visible) {
      await expect(paginationButton).toBeVisible();
    } else {
      await expect(paginationButton).toBeHidden();
    }
  }

  /** Advances or rewinds the opportunity list and waits for its heading to change. */
  async clickOnPaginationButtonInTranslationSubmitterPage(
    button: 'previous' | 'next'
  ): Promise<void> {
    const firstHeading = this.page
      .locator(opportunityItemHeadingSelector)
      .first();
    await expect(firstHeading).toBeVisible();
    const previousHeading = (await firstHeading.textContent())?.trim() ?? '';

    await this.page
      .locator(`${paginationButtonSelectorPrefix}-${button}`)
      .click();

    await expect(
      this.page.locator(opportunityItemHeadingSelector).first()
    ).not.toHaveText(previousHeading);
  }

  /** Clicks the translate button for the specified chapter and story. */
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

  /** Skips the current translation and loads the next translation. */
  async clickOnSkipTranslationButton(): Promise<void> {
    const textToTranslate = this.page.locator(textToTranslateContainerSelector);
    await textToTranslate.waitFor({state: 'visible'});
    const previousContent = await textToTranslate.textContent();

    const skipButton = this.page.locator(skipTranslationButtonSelector);
    await skipButton.waitFor({state: 'visible'});
    await skipButton.click();
    await expect(textToTranslate).not.toHaveText(previousContent ?? '');
  }

  /** Clicks a Hindi RTE toolbar control in the translation editor. */
  async clickOnRTEOptionContainingTitle(title: string): Promise<void> {
    await expect(this.page.locator(rteEditorBodySelector)).toBeVisible();
    const option = this.page
      .locator(`${rteToolbarButtonSelector}[title*="${title}"]`)
      .first();
    await expect(option).toBeVisible();
    await option.click();
  }

  /** Fills a component editor field inside the currently open RTE helper modal. */
  async fillValueInTranslateTextCustomizeComponent(
    inputType: 'input' | 'rte' | 'textarea',
    value: string,
    index: number = 0
  ): Promise<void> {
    const modal = this.page.locator(rteHelperModalSelector);
    await expect(modal).toBeVisible();
    const selector =
      inputType === 'rte'
        ? rteEditorBodySelector
        : inputType === 'input'
          ? textInputSelector
          : textareaSelector;
    const field = modal.locator(selector).nth(index);
    await expect(field).toBeVisible();

    const mathEditor = modal.locator(mathEditorSelector);
    if (await mathEditor.isVisible()) {
      await this.page.waitForFunction(() => {
        const mathWindow = window as MathJaxWindow;
        return Boolean(
          mathWindow.MathJax &&
            mathWindow.MathJax.isReady &&
            mathWindow.MathJax.Hub
        );
      });
      await this.page.evaluate(() => {
        return new Promise<void>(resolve => {
          const mathWindow = window as MathJaxWindow;
          if (mathWindow.MathJax?.Hub) {
            mathWindow.MathJax.Hub.Queue(resolve);
          } else {
            resolve();
          }
        });
      });
    }

    await field.fill(value);

    if (inputType === 'rte') {
      await expect(field).toContainText(value);
    } else {
      await expect(field).toHaveValue(value);
    }

    if (await mathEditor.isVisible()) {
      // Allow debouncedUpdate$ (300ms debounce) and MathJax typesetting to settle.
      await this.page.waitForTimeout(350);
      await this.page.evaluate(() => {
        return new Promise<void>(resolve => {
          const mathWindow = window as MathJaxWindow;
          if (mathWindow.MathJax?.Hub) {
            mathWindow.MathJax.Hub.Queue(resolve);
          } else {
            resolve();
          }
        });
      });
    }
  }

  /** Saves the currently open RTE component modal. */
  async clickOnSaveButtonInCustomizeRTEModal(): Promise<void> {
    const saveButton = this.page.locator(rteModalSaveButtonSelector);
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(saveButton).toBeHidden();
  }

  /** Waits for image upload and persistence to complete. */
  async expectImageUploadToComplete(): Promise<void> {
    await expect(this.page.locator(savedImageContainerSelector)).toBeVisible();
  }

  /** Selects a skill in the concept-card component editor. */
  async selectSkillInConceptCard(skill: string): Promise<void> {
    const modal = this.page.locator(rteHelperModalSelector);
    await modal.locator(skillNameInputSelector).fill(skill);
    const skillItem = modal
      .locator(skillItemSelector)
      .filter({hasText: skill})
      .first();
    await expect(skillItem).toBeVisible();
    await skillItem.click();
    await expect(modal.locator(selectedSkillSelector)).toContainText(skill);
  }

  /** Verifies that the translation copy tool preserves image metadata. */
  async expectCopyToolWorksProperly(
    description: string,
    caption: string
  ): Promise<void> {
    const copyButton = this.page.locator(copyButtonSelector);
    await expect(copyButton).toHaveText('Off');
    await copyButton.click();
    await expect(copyButton).toHaveText('On');

    const image = this.page.locator(imageSelector).first();
    await expect(image).toBeVisible();
    await image.click();

    const modal = this.page.locator(rteHelperModalSelector);
    await expect(modal).toBeVisible();
    await modal.locator(textInputSelector).first().fill(caption);
    await modal.locator(textareaSelector).first().fill(description);
    await this.clickOnSaveButtonInCustomizeRTEModal();
    await expect(this.page.locator(imageSelector)).toHaveCount(2);
  }

  /**
   * Confirms submission and dismisses the success toast.
   *
   * The contributor dashboard keeps this toast mounted while the translation
   * modal closes, so dismissing it explicitly avoids coupling the test to the
   * toast timer.
   */
  async expectTranslationSubmittedToast(): Promise<void> {
    const toasts = this.page.locator(translationSubmittedToastSelector);
    const latestToast = toasts.last();
    await expect(latestToast).toHaveText('Submitted translation for review.');

    const count = await toasts.count();
    for (let i = 0; i < count; i++) {
      const toast = toasts.nth(i);
      try {
        await toast.click({timeout: 2000});
      } catch (error) {
        // Toast may have already dismissed automatically.
      }
    }
    await expect(toasts).toHaveCount(0);
  }

  /** Types the given text into the translation RTE. */
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
