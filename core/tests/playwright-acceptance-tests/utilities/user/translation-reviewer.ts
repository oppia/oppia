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
 * @fileoverview Utility class for translation reviewers.
 */

import {Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import {
  getTranslationOpportunityCard,
  opportunityTranslateButtonSelector,
} from './contributor';

const translateTextModalHeaderContainerSelector =
  '.e2e-test-translate-text-header-container';
const backToLessonButtonSelector = '.e2e-test-back-to-lesson-button';
const modalHeaderSelector = '.e2e-test-modal-header';
const reviewCommentInputSelector = '.e2e-test-suggestion-review-message';
const acceptTranslationButtonSelector = '.e2e-test-translation-accept-button';
const rejectTranslationButtonSelector = '.e2e-test-translation-reject-button';
const reviewContentContainerSelector = '.e2e-test-review-content-container';

export class TranslationReviewer extends BaseUser {
  /**
   * Clicks on the translate button of the given chapter in the translation
   * review interface.
   *
   * @param chapterName - The name of the chapter.
   * @param storyName - The name of the story.
   */
  async clickOnTranslateButtonInTranslateTextTabInTranslationReview(
    chapterName: string,
    storyName: string
  ): Promise<void> {
    const initBackToLessonButtonVisible = await this.isElementVisible(
      backToLessonButtonSelector
    );

    const opportunityItem = await getTranslationOpportunityCard(
      this.page,
      chapterName,
      storyName
    );
    // Click on translate button in the opportunity item.
    const translateButton = opportunityItem.locator(
      opportunityTranslateButtonSelector
    );
    await translateButton.waitFor({state: 'visible'});
    await translateButton.click();

    // Verify that the translation editor is opened.
    await this.page.waitForFunction(
      ({
        backToLessonSelector,
        modalHeader,
        translateTextHeader,
        wasBackToLessonVisible,
      }: {
        backToLessonSelector: string;
        modalHeader: string;
        translateTextHeader: string;
        wasBackToLessonVisible: boolean;
      }) => {
        const isVisible = (selector: string): boolean => {
          const element = document.querySelector(selector);
          if (!element) {
            return false;
          }
          const style = window.getComputedStyle(element);
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            element.getBoundingClientRect().width > 0 &&
            element.getBoundingClientRect().height > 0
          );
        };
        return (
          isVisible(backToLessonSelector) !== wasBackToLessonVisible ||
          isVisible(modalHeader) ||
          isVisible(translateTextHeader)
        );
      },
      {
        backToLessonSelector: backToLessonButtonSelector,
        modalHeader: modalHeaderSelector,
        translateTextHeader: translateTextModalHeaderContainerSelector,
        wasBackToLessonVisible: initBackToLessonButtonVisible,
      }
    );
  }

  /**
   * Starts reviewing the translation for the given content.
   *
   * @param content - The content to review.
   * @param subheading - The subheading of the review opportunity.
   */
  async startTranslationReview(
    content: string,
    subheading: string
  ): Promise<void> {
    const opportunityItem = await getTranslationOpportunityCard(
      this.page,
      content,
      subheading
    );

    if (this.isViewportAtMobileWidth()) {
      await opportunityItem.click();
    } else {
      // Click on translate button in the opportunity item.
      const translateButton = opportunityItem.locator(
        opportunityTranslateButtonSelector
      );
      await translateButton.waitFor({state: 'visible'});
      await translateButton.click();
    }

    await this.expectTextContentToContain(
      modalHeaderSelector,
      'Review Translation Contributions'
    );
  }

  /**
   * Submits a translation review.
   *
   * @param reviewType - The type of the review to submit.
   * @param reviewMessage - The message to add to the review (optional).
   */
  async submitTranslationReview(
    reviewType: 'accept' | 'reject',
    reviewMessage?: string
  ): Promise<void> {
    const buttonSelector =
      reviewType === 'accept'
        ? acceptTranslationButtonSelector
        : rejectTranslationButtonSelector;
    if (reviewMessage) {
      await this.expectElementToBeVisible(reviewCommentInputSelector);
      await this.typeInInputField(reviewCommentInputSelector, reviewMessage);
    }

    await this.expectElementToBeVisible(reviewContentContainerSelector);
    const initialReviewContent = await this.page
      .locator(reviewContentContainerSelector)
      .textContent();

    await this.clickOnElementWithSelector(buttonSelector);

    // Verify that the next translation is loaded after submitting the review.
    await this.page.waitForFunction(
      ({
        selector,
        initialContent,
      }: {
        selector: string;
        initialContent: string;
      }) => {
        const element = document.querySelector(selector);
        return element?.textContent !== initialContent;
      },
      {
        selector: reviewContentContainerSelector,
        initialContent: initialReviewContent ?? '',
      }
    );
  }
}

export const TranslationReviewerFactory = (page: Page): TranslationReviewer => {
  return new TranslationReviewer(page);
};
