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
 * @fileoverview Practice question reviewer users utility file.
 */

import {Page} from '@playwright/test';
import {showMessage} from '../common/show-message';
import {Contributor} from './contributor';

const opportunityButtonSelector = '.e2e-test-opportunity-list-item-button';
const reviewButtonPrefix = 'e2e-test-question-suggestion-review';
const editButtonSelector = `.${reviewButtonPrefix}-edit-button`;
const questionSuggestionEditorModalSelector =
  '.e2e-test-question-suggestion-editor-modal';
const editQuestionPencilIconSelector =
  'button.e2e-test-edit-content-pencil-button';
const saveQuestionButtonSelector = '.e2e-test-save-question-button';
const rteTextAreaSelector = '.e2e-test-rte';
const saveRTEButtonSelector = '.e2e-test-save-state-content';

export class PracticeQuestionReviewer extends Contributor {
  /**
   * Starts a question review.
   * @param {string} question - The question to review.
   * @param {string} skill - The skill the question belongs to.
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
      await this.clickOnElement(reviewButton);
    }
    await this.expectModalTitleToBe(skill);
  }

  /**
   * Submits a question review.
   * @param {string} reviewType - The type of review to submit.
   * @param {string} reviewMessage - The message to submit.
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
   * Replaces the question text in the question editor modal.
   * @param {string} question - The new question text.
   */
  async editQuestionInQuestionEditorModal(question: string): Promise<void> {
    await this.waitForElementToStabilize(editQuestionPencilIconSelector);
    await this.clickOnElementWithSelector(editQuestionPencilIconSelector);

    const questionEditorModal = await this.expectElementToBeVisible(
      questionSuggestionEditorModalSelector
    );
    if (!questionEditorModal) {
      throw new Error('Question editor modal not found.');
    }

    // Clear the existing content of the editor.
    const textAreaElement = await questionEditorModal.waitForSelector(
      rteTextAreaSelector,
      {state: 'visible'}
    );
    await textAreaElement.click({clickCount: 3});
    await this.page.keyboard.press('Backspace');
    await this.page.waitForFunction(
      (element: Element) => element.textContent === '',
      textAreaElement
    );

    // Type the new content and save it.
    await textAreaElement.type(question);
    await this.clickOnElementWithSelector(saveRTEButtonSelector);
    await this.expectElementToBeVisible(rteTextAreaSelector, false);
  }

  /**
   * Edits the question in the review.
   * @param {string} question - The new question text.
   */
  async editQuestionInReview(question: string): Promise<void> {
    await this.clickOnElementWithSelector(editButtonSelector);

    await this.expectElementToBeVisible(questionSuggestionEditorModalSelector);

    await this.editQuestionInQuestionEditorModal(question);

    await this.clickOnElementWithSelector(saveQuestionButtonSelector);
    await this.expectToastMessage('Updated question.');
    await this.expectElementToBeVisible(saveQuestionButtonSelector, false);
    showMessage(`Question updated to "${question}".`);
  }
}

export const PracticeQuestionReviewerFactory = (
  page: Page
): PracticeQuestionReviewer => {
  return new PracticeQuestionReviewer(page);
};
