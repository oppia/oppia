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
 * @fileoverview Practice Question Reviewer utility file.
 */

import {Page} from '@playwright/test';
import {Contributor} from './contributor';

const opportunityButtonSelector = '.e2e-test-opportunity-list-item-button';

const reviewButtonPrefix = 'e2e-test-question-suggestion-review';
const reviewModalHeaderSelector =
  '.e2e-test-question-suggestion-review-modal-header';

export class PracticeQuestionReviewer extends Contributor {
  /**
   * Starts a question review.
   * @param question - The question to review.
   * @param skill - The skill the question belongs to.
   */
  async startQuestionReview(question: string, skill: string): Promise<void> {
    const questionElement = await this.expectOpportunityToBePresent(
      question,
      skill
    );

    if (!questionElement) {
      throw new Error(`Opportunity item for question ${question} not found.`);
    }

    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElement(questionElement);
    } else {
      const reviewButton = await questionElement.waitForSelector(
        opportunityButtonSelector
      );
      if (!reviewButton) {
        throw new Error('Review button not found.');
      }

      await this.clickOnElement(reviewButton);
    }
    await this.expectModalTitleToBe(skill);
  }

  /**
   * Submits a question review.
   * @param reviewType - The type of review to submit.
   * @param reviewMessage - The message to submit.
   */
  async submitReview(
    reviewType: 'accept' | 'reject',
    reviewMessage?: string
  ): Promise<void> {
    const buttonSelector = `.${reviewButtonPrefix}-${reviewType}-button`;
    await this.expectElementToBeVisible(buttonSelector);

    if (reviewMessage) {
      await this.fillReviewComment(reviewMessage);
    }

    await this.clickOnElementWithSelector(buttonSelector);
    await this.expectToastMessage('Submitted suggestion review.');
  }

  /**
   * Checks if the question review modal is present or not.
   * @param visible - Whether the modal should be visible or not.
   */
  async expectQuestionReviewModalToBePresent(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(reviewModalHeaderSelector, visible);
  }
}

export const PracticeQuestionReviewerFactory = (
  page: Page
): PracticeQuestionReviewer => {
  return new PracticeQuestionReviewer(page);
};
