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

import {expect, Page} from '@playwright/test';
import {Contributor} from './contributor';

const opportunityTranslateButtonSelector =
  '.e2e-test-opportunity-list-item-button';
const backToLessonButtonSelector = '.e2e-test-back-to-lesson-button';
const modalHeaderSelector = '.e2e-test-modal-header';
const translateTextModalHeaderContainerSelector =
  '.e2e-test-translate-text-header-container';
const pinIconSelector = '.e2e-test-pin-icon';
const reviewCommentInputSelector = '.e2e-test-suggestion-review-message';
const acceptTranslationButtonSelector =
  '.e2e-test-translation-accept-button';
const rejectTranslationButtonSelector =
  '.e2e-test-translation-reject-button';
const reviewContentContainerSelector = '.e2e-test-review-content-container';
const translatedContentContainerSelector = '.e2e-test-translated-content';
const reviewModalContainerSelector = '.e2e-test-translation-review-modal';
const updateTranslationButtonSelector =
  '.e2e-test-update-translation-button';

export class TranslationReviewer extends Contributor {
  /**
   * Opens a translation review from the opportunity list.
   */
  async clickOnTranslateButtonInTranslateTextTabInTranslationReview(
    chapterName: string,
    storyName: string
  ): Promise<void> {
    const backToLessonButton = this.page.locator(backToLessonButtonSelector);
    const wasBackToLessonButtonVisible = await backToLessonButton.isVisible();
    const opportunity = await this.findOpportunityItem(chapterName, storyName);
    if (!opportunity) {
      throw new Error(
        `Opportunity item for chapter ${chapterName} and story ${storyName} not found.`
      );
    }
    await opportunity.locator(opportunityTranslateButtonSelector).click();
    await expect
      .poll(async () => {
        return (
          (await backToLessonButton.isVisible()) !==
            wasBackToLessonButtonVisible ||
          (await this.page.locator(modalHeaderSelector).isVisible()) ||
          (await this.page
            .locator(translateTextModalHeaderContainerSelector)
            .isVisible())
        );
      })
      .toBe(true);
  }

  /**
   * Starts reviewing a translation from the review modal.
   */
  async startTranslationReview(
    chapterName: string,
    subheading: string
  ): Promise<void> {
    const opportunity = await this.findOpportunityItem(
      chapterName,
      subheading
    );
    if (!opportunity) {
      throw new Error(
        `Opportunity item for chapter ${chapterName} and story ${subheading} not found.`
      );
    }
    if (this.isViewportAtMobileWidth()) {
      await opportunity.click();
    } else {
      await opportunity.locator(opportunityTranslateButtonSelector).click();
    }
    await expect(this.page.locator(modalHeaderSelector)).toContainText(
      'Review Translation Contributions'
    );
  }

  /**
   * Checks that the review tab pin icon is visible.
   */
  async expectPinIconToBeVisible(): Promise<void> {
    await expect(this.page.locator(pinIconSelector)).toBeVisible();
  }

  /**
   * Submits an accept or reject review, optionally with a comment.
   */
  async submitTranslationReview(
    reviewType: 'accept' | 'reject',
    reviewMessage?: string
  ): Promise<void> {
    if (reviewMessage) {
      await this.page.locator(reviewCommentInputSelector).fill(reviewMessage);
    }
    const reviewContent = this.page.locator(reviewContentContainerSelector);
    const previousContent = await reviewContent.textContent();
    const buttonSelector =
      reviewType === 'accept'
        ? acceptTranslationButtonSelector
        : rejectTranslationButtonSelector;
    await this.page.locator(buttonSelector).click();
    await expect(reviewContent).not.toHaveText(previousContent || '');
  }

  /**
   * Checks the translation currently shown in the review card.
   */
  async expectCardContentToBeInTranslationReview(
    expectedContent: string
  ): Promise<void> {
    await expect(
      this.page.locator(
        `${reviewContentContainerSelector} ${translatedContentContainerSelector}`
      )
    ).toHaveText(expectedContent);
  }

  /**
   * Checks whether the reject button is disabled.
   */
  async expectRejectReviewButtonToBeDisabled(): Promise<void> {
    await expect(
      this.page.locator(rejectTranslationButtonSelector)
    ).toBeDisabled();
  }

  /**
   * Checks whether the translation review modal is present.
   */
  async expectReviewModalToBePresent(present: boolean = true): Promise<void> {
    const modal = this.page.locator(reviewModalContainerSelector);
    if (present) {
      await expect(modal).toBeVisible();
    } else {
      await expect(modal).toBeHidden();
    }
  }

  /**
   * Saves edits to the translation currently under review.
   */
  async clickOnUpdateTranslationButton(): Promise<void> {
    await this.page.locator(updateTranslationButtonSelector).click();
    await expect(
      this.page.locator(updateTranslationButtonSelector)
    ).toBeHidden();
  }
}

export const TranslationReviewerFactory = (page: Page): TranslationReviewer =>
  new TranslationReviewer(page);
