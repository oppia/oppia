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
const reviewModalWindowSelector =
  'ngb-modal-window:has(.e2e-test-question-suggestion-review-modal-header)';

// Question Suggestion Editor Modal Selectors.
const questionSuggestionEditorModalSelector =
  '.e2e-test-question-suggestion-editor-modal';
const editQuestionPencilIconSelector =
  'button.e2e-test-edit-content-pencil-button';
const saveQuestionButtonSelector = '.e2e-test-save-question-button';
const editButtonSelector = `.${reviewButtonPrefix}-edit-button`;
const stateContentInputField = 'div.e2e-test-rte';
const saveContentButton = 'button.e2e-test-save-state-content';

export class PracticeQuestionReviewer extends Contributor {
  /**
   * Opens the question editor and waits for the review modal to be removed.
   */
  private async openQuestionEditorModal(): Promise<void> {
    const reviewModal = await this.page.$(reviewModalWindowSelector);

    await this.clickOnElementWithSelector(editButtonSelector);

    // The review and editor modals contain several identical controls. Wait
    // for the dismissed review modal to detach so that subsequent selectors
    // cannot resolve to one of its controls during the closing animation.
    if (reviewModal) {
      await this.page.waitForFunction(
        element => !element.isConnected,
        reviewModal
      );
    }
    await this.expectElementToBeVisible(questionSuggestionEditorModalSelector);
  }

  /**
   * Checks if the question review modal is present.
   * @param visible Whether the modal should be visible.
   */
  async expectQuestionReviewModalToBePresent(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(reviewModalHeaderSelector, visible);
  }

  /**
   * Edits the question in the question editor modal.
   * @param {string} question - The question to edit.
   */
  async editQuestionInQuestionEditorModal(question: string): Promise<void> {
    const questionEditorModal = await this.getElementInParent(
      questionSuggestionEditorModalSelector
    );
    const editQuestionButton = await this.getElementInParent(
      editQuestionPencilIconSelector,
      questionEditorModal
    );

    await this.clickOnElement(editQuestionButton);

    const contentInput = await this.getElementInParent(
      stateContentInputField,
      questionEditorModal
    );
    await contentInput.press('Control+A');
    await contentInput.press('Backspace');
    await this.typeInInputField(contentInput, question);

    const saveContentButtonElement = await this.getElementInParent(
      saveContentButton,
      questionEditorModal
    );
    await this.clickOnElement(saveContentButtonElement);
    await questionEditorModal.waitForSelector(stateContentInputField, {
      state: 'hidden',
    });
  }

  /**
   * Edits the question in the review.
   * @param {string} question - The question to edit.
   */
  async editQuestionInReview(question: string): Promise<void> {
    await this.openQuestionEditorModal();

    // Update the question.
    await this.editQuestionInQuestionEditorModal(question);

    // Save the question.
    await this.clickOnElementWithSelector(saveQuestionButtonSelector);
    await this.expectToastMessage('Updated question.');
    await this.expectElementToBeVisible(saveQuestionButtonSelector, false);
  }

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
}

export const PracticeQuestionReviewerFactory = (
  page: Page
): PracticeQuestionReviewer => {
  return new PracticeQuestionReviewer(page);
};
