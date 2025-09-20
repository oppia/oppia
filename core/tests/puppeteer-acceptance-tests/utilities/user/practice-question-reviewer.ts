// Copyright 2025 The Oppia Authors. All Rights Reserved.
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

import {RTEEditor} from '../common/rte-editor';
import {Contributor} from './contributor';
import {INTERACTION_TYPES} from './exploration-editor';

// Contributor Dashboard Selectors.
const opportunityButtonSelector = '.e2e-test-opportunity-list-item-button';

// Question Review Modal Selector.
const reviewButtonPrefix = 'e2e-test-question-suggestion-review';
const editButtonSelector = `.${reviewButtonPrefix}-edit-button`;
const reviewModalHeaderSelector =
  '.e2e-test-question-suggestion-review-modal-header';

// Question Suggestion Editor Modal Selectors.
const questionSuggestionEditorModalSelector =
  '.e2e-test-question-suggestion-editor-modal';
const editQuestionPencilIconSelector = '.e2e-test-edit-content-pencil-button';
const saveQuestionButtonSelector = '.e2e-test-save-question-button';

// Other Selectors.

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
      await questionElement.click();
    } else {
      const reviewButton = await questionElement.waitForSelector(
        opportunityButtonSelector
      );
      if (!reviewButton) {
        throw new Error('Review button not found.');
      }

      await reviewButton.click();
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

    await this.waitForElementToStabilize(buttonSelector);
    await this.clickOn(buttonSelector);
    await this.expectToastMessage('Submitted suggestion review.');
  }

  /**
   * Edits the question in the question editor modal.
   * @param {string} question - The question to edit.
   */
  async editQuestionInQuestionEditorModal(question: string): Promise<void> {
    await this.expectElementToBeVisible(editQuestionPencilIconSelector);
    await this.waitForElementToStabilize(editQuestionPencilIconSelector);
    await this.clickOn(editQuestionPencilIconSelector);

    const questionEditorModal = await this.page.$(
      questionSuggestionEditorModalSelector
    );
    if (!questionEditorModal) {
      throw new Error('Question editor modal not found.');
    }

    const rteEditor = new RTEEditor(this.page, questionEditorModal);
    await rteEditor.clearAll();
    await rteEditor.updateAndSaveContent(question);
  }

  /**
   * Edits the question in the review.
   * @param {string} question - The question to edit.
   */
  async editQuestionInReview(question: string): Promise<void> {
    // Click on edit button.
    await this.expectElementToBeVisible(editButtonSelector);
    await this.clickOn(editButtonSelector);

    await this.expectElementToBeVisible(questionSuggestionEditorModalSelector);

    // Update the question.
    await this.editQuestionInQuestionEditorModal(question);

    // Save the question.
    await this.clickOn(saveQuestionButtonSelector);
    await this.expectToastMessage('Updated question.');
  }

  /**
   * Edits the question interaction in the review.
   */
  async editQuestionInteractionInReview(): Promise<void> {
    // Click on edit button.
    await this.expectElementToBeVisible(editButtonSelector);
    await this.clickOn(editButtonSelector);

    await this.removeInteraction();

    await this.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);

    // Add responses to the number input interaction.
    await this.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMBER_INPUT,
      '100',
      'Perfect!',
      undefined,
      true
    );

    // Add hint.
    await this.addHintToState('Test Hint');

    // Add a solution to the state.
    await this.addSolutionToState(
      '100',
      'As said in the question itself.',
      true
    );

    // Save the question.
    await this.clickOn(saveQuestionButtonSelector);
    await this.expectToastMessage('Updated question.');
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

export let PracticeQuestionReviewerFactory = (): PracticeQuestionReviewer =>
  new PracticeQuestionReviewer();
