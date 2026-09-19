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
 * @fileoverview Question Submitters utility file.
 */

import {Page} from '@playwright/test';
import {showMessage} from '../common/show-message';
import testConstants from '../common/test-constants';
import {Contributor} from './contributor';

const contributorDashboardUrl = testConstants.URLs.ContributorDashboard;

const submitQuestionTab = 'a.e2e-test-submitQuestionTab';
const suggestQuestionButton = 'button.e2e-test-opportunity-list-item-button';
const confirmSkillDifficultyButton =
  'button.e2e-test-confirm-skill-difficulty-button';
const stateContentInputField = 'div.e2e-test-rte';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const saveInteractionButton = 'button.e2e-test-save-interaction';

const defaultFeedbackTab = 'a.e2e-test-default-response-tab';
const openOutcomeFeedbackEditor = 'div.e2e-test-open-outcome-feedback-editor';
const saveOutcomeFeedbackButton = 'button.e2e-test-save-outcome-feedback';

const addInteractionModalSelector = 'customize-interaction-body-container';
const multipleChoiceInteractionButton =
  'div.e2e-test-interaction-tile-MultipleChoiceInput';
const addResponseOptionButton = 'button.e2e-test-add-list-entry';
const correctAnswerInTheGroupSelector = '.e2e-test-editor-correctness-toggle';
const addNewResponseButton = 'button.e2e-test-add-new-response';
const textStateEditSelector = 'div.e2e-test-state-edit-content';

const submitQuestionButton = '.e2e-test-save-question-button';
const saveStateEditorContentButton = 'button.e2e-test-save-state-content';
const editFeedbackButtonSelector =
  'div.oppia-edit-feedback .oppia-click-to-start-editing';
const editFeedbackButtonMobileSelector = '.e2e-test-open-feedback-editor';
const questionDifficultySelectionModalSelector =
  '.e2e-test-question-opportunity-difficulty';

export class PracticeQuestionSubmitter extends Contributor {
  /**
   * Clicks on the view button in the submitted question.
   * @param {string} question - The question to view.
   * @param {string} skill - The skill the question belongs to.
   */
  async viewSubmittedQuestion(question: string, skill: string): Promise<void> {
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
      const viewButton = await questionElement.$(
        '.e2e-test-opportunity-list-item-button'
      );
      if (!viewButton) {
        throw new Error('View button not found.');
      }
      await this.clickOnElement(viewButton);
    }
    await this.expectElementToBeVisible(
      '.e2e-test-question-suggestion-review-modal-header'
    );
  }

  /**
   * Closes the translation modal.
   */
  async closePracticeQuestionModal(): Promise<void> {
    const closeModalButtonSelector = '.e2e-test-close-modal-button';
    await this.expectElementToBeVisible(closeModalButtonSelector);
    await this.clickOnElementWithSelector(closeModalButtonSelector);
    await this.expectElementToBeVisible(closeModalButtonSelector, false);
  }

  /**
   * Checks if the interaction name is as expected.
   * @param name The name of the interaction.
   */
  async expectSelectedInteractionNameToBe(name: string): Promise<void> {
    const selectedInteractionNameSelector =
      '.e2e-test-selected-interaction-name';
    await this.expectTextContentToBe(
      selectedInteractionNameSelector,
      `Interaction ( ${name} )`
    );
  }

  /**
   * Function for navigating to the contributor dashboard page.
   */
  async navigateToContributorDashboard(): Promise<void> {
    await this.goto(contributorDashboardUrl);
  }

  /**
   * Opens the suggest questions modal and selects a specific skill and topic.
   * @param skillName - The name of the skill to suggest questions for.
   * @param topicName - The name of the topic to suggest questions for.
   */
  async suggestQuestionsForSkillandTopic(
    skillName: string,
    topicName: string
  ): Promise<void> {
    await this.expectElementToBeVisible(submitQuestionTab);
    await this.clickOnElementWithSelector(submitQuestionTab);

    const questionElement = await this.expectOpportunityToBePresent(
      skillName,
      topicName
    );

    if (!questionElement) {
      throw new Error(
        `No opportunity found for topic "${topicName}" and skill "${skillName}".`
      );
    }

    const button = await questionElement.$(suggestQuestionButton);
    if (!button) {
      throw new Error('Suggest Question button not found.');
    }
    await this.clickOnElement(button);

    await this.expectElementToBeVisible(
      questionDifficultySelectionModalSelector
    );
  }

  /**
   * Selects the difficulty level of the question to be suggested.
   * @param difficulty - The difficulty level of the question.
   */
  async selectQuestionDifficultyInPracticeQuestionSubmittion(
    difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'
  ): Promise<void> {
    await this.expectElementToBeVisible(
      questionDifficultySelectionModalSelector
    );
    showMessage(`Selecting default ${difficulty} question difficulty.`);
    await this.clickOnElementWithSelector(confirmSkillDifficultyButton);

    await this.expectElementToBeVisible(confirmSkillDifficultyButton, false);
  }

  /**
   * Seeds text to the question.
   * @param text - The text to be added to the question.
   */
  async seedTextToQuestion(text: string): Promise<void> {
    await this.expectElementToBeVisible(textStateEditSelector);
    await this.waitForElementToStabilize(textStateEditSelector);
    await this.clickOnElementWithSelector(textStateEditSelector);
    await this.expectElementToBeVisible(stateContentInputField);
    await this.waitForElementToStabilize(stateContentInputField);
    await this.typeInInputField(stateContentInputField, text);
    await this.clickOnElementWithSelector(saveStateEditorContentButton);

    await this.expectElementToBeVisible(saveStateEditorContentButton, false);
  }

  /**
   * Adds a multiple choice interaction to the question.
   * @param options - The options to be added to the multiple choice interaction.
   */
  async addMultipleChoiceInteractionByQuestionSubmitter(
    options: string[]
  ): Promise<void> {
    await this.expectElementToBeVisible(addInteractionButton);
    await this.clickOnElementWithSelector(addInteractionButton);
    await this.expectElementToBeVisible(multipleChoiceInteractionButton);
    await this.clickOnElementWithSelector(multipleChoiceInteractionButton);

    for (let i = 0; i < options.length - 1; i++) {
      await this.expectElementToBeVisible(addResponseOptionButton);
      await this.clickOnElementWithSelector(addResponseOptionButton);
    }

    const responseInputs = await this.page.$$(stateContentInputField);
    for (let i = 0; i < options.length; i++) {
      await responseInputs[i].type(options[i]);
    }

    await this.clickOnElementWithSelector(saveInteractionButton);
    await this.expectElementToBeVisible(addInteractionModalSelector, false);

    const editFeedbackSelector = this.isViewportAtMobileWidth()
      ? editFeedbackButtonMobileSelector
      : editFeedbackButtonSelector;

    await this.waitForElementToStabilize(editFeedbackSelector);
    await this.clickOnElementWithSelector(editFeedbackSelector);
    await this.expectElementToBeVisible(stateContentInputField);
    await this.typeInInputField(stateContentInputField, 'Last Card');
    await this.clickOnElementWithSelector(correctAnswerInTheGroupSelector);
    await this.clickOnElementWithSelector(addNewResponseButton);

    await this.expectElementToBeVisible(addNewResponseButton, false);
    showMessage('Multiple choice interaction has been added successfully.');
  }

  /**
   * Adds feedback for default responses of a state interaction.
   * @param defaultResponseFeedback - The feedback for the default responses.
   */
  async editDefaultResponseFeedbackInQuestionEditorPage(
    defaultResponseFeedback: string
  ): Promise<void> {
    await this.clickOnElementWithSelector(defaultFeedbackTab);

    if (defaultResponseFeedback) {
      await this.clickOnElementWithSelector(openOutcomeFeedbackEditor);
      await this.clickOnElementWithSelector(stateContentInputField);
      await this.typeInInputField(
        stateContentInputField,
        defaultResponseFeedback
      );
      await this.clickOnElementWithSelector(saveOutcomeFeedbackButton);
      await this.expectElementToBeVisible(saveOutcomeFeedbackButton, false);
    }
  }

  /**
   * Submits the question suggestion.
   */
  async submitQuestionSuggestion(): Promise<void> {
    await this.expectElementToBeVisible(submitQuestionButton);
    await this.clickOnElementWithSelector(submitQuestionButton);

    await this.expectElementToBeVisible(submitQuestionButton, false);
  }

  /**
   * Starts a question suggestion and completes it.
   * @param skill - The skill to suggest questions for.
   * @param topic - The topic to suggest questions for.
   * @param question - The question to be added.
   * @param multipleChoiceOptions - The options to be added.
   * @param difficulty - The difficulty level of the question.
   * @param defaultResponseFeedback - The feedback for default responses.
   * @param hint - The hint to be added to the current state card.
   */
  async startAndCompleteQuestionSuggestion(
    skill: string,
    topic: string,
    question: string,
    multipleChoiceOptions?: string[],
    difficulty?: 'Easy' | 'Medium' | 'Hard',
    defaultResponseFeedback?: string,
    hint?: string
  ): Promise<void> {
    await this.suggestQuestionsForSkillandTopic(skill, topic);
    await this.selectQuestionDifficultyInPracticeQuestionSubmittion(
      difficulty ?? 'Medium'
    );
    await this.seedTextToQuestion(question);
    await this.addMultipleChoiceInteractionByQuestionSubmitter(
      multipleChoiceOptions ?? ['5', '-1', '6', '1.5']
    );
    await this.editDefaultResponseFeedbackInQuestionEditorPage(
      defaultResponseFeedback ?? 'Wrong Answer'
    );
    await this.addHintToState(
      hint ??
        'If you have 2 apples and someone gives you 3 apples, how many apples do you have?'
    );
    await this.submitQuestionSuggestion();
    await this.expectToastMessage('Submitted question for review.');
  }
}

export const QuestionSubmitterFactory = (
  page: Page
): PracticeQuestionSubmitter => {
  return new PracticeQuestionSubmitter(page);
};
