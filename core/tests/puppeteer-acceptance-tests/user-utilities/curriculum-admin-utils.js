// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Curriculum Admin users utility file.
 */

const baseUser = require(
  '../puppeteer-testing-utilities/puppeteer-utils.js');
const testConstants = require(
  '../puppeteer-testing-utilities/test-constants.js');

const richTextAreaField = 'div.e2e-test-rte';
const floatTextField = 'input.e2e-test-float-form-input';

const topicAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;
const skillDescriptionField = 'input.e2e-test-new-skill-description-field';
const skillReviewMaterialHeader = 'div.e2e-test-open-concept-card';
const createSkillButton = 'button.e2e-test-create-skill-button';
const confirmSkillCreationButton = 'button.e2e-test-confirm-skill-creation-button';

const createQuestionButton = 'div.e2e-test-create-question';
const easyQuestionDifficultyOption = 'div.e2e-test-skill-difficulty-easy';
const questionStateEditSelector = 'div.e2e-test-state-edit-content';
const saveQuestionContentButton = 'div.e2e-test-save-state-content';

const addInteractionButton = 'div.e2e-test-open-add-interaction-modal';
const interactionNumberInputButton = 'div.e2e-test-interaction-tile-NumericInput';
const saveInteractionButton = 'div.e2e-test-save-interaction';
const responseRuleDropdown = 'oppia-rule-type-selector.e2e-test-answer-description';
const equalsRuleButtonText = 'is equal to ... ';
const answersInGroupAreCorrectToggle = 'input.e2e-test-editor-correctness-toggle';
const saveResponseButton = 'div.e2e-test-add-new-response';

const openOutcomeFeedBackEditor = 'div.e2e-test-add-new-response';
const saveOutcomeFeedbackButton = 'div.e2e-test-save-outcome-feedback';

const addHintButton = 'button.e2e-test-oppia-add-hint-button';
const saveHintButton = 'button.e2e-test-save-hint';

const addSolutionButton = 'button.e2e-test-oppia-add-solution-button';
const answerTypeDropdown = 'select.e2e-test-answer-is-exclusive-select';
const submitAnswerButton = 'button.e2e-test-submit-answer-button';
const submitSolutionButton = 'button.e2e-test-submit-solution-button';

const saveQuestionButton = 'button.e2e-test-save-question-button';

module.exports = class e2eCurriculumAdmin extends baseUser {
  /**
   * Function for creating a skill in the topics and skills dashboard.
   */
  async createSkill() {
    await this.page.waitForSelector(
      `${createSkillButton}:not([disabled])`);
    await this.clickOn(createSkillButton);
    await this.type(skillDescriptionField, 'Test Skill 3');
    await this.clickOn(skillReviewMaterialHeader)
    await this.type(richTextAreaField, 'This is a test skill with 3 questions');
    await this.page.waitForSelector(
      `${confirmSkillCreationButton}:not([disabled])`);
    await this.clickOn(confirmSkillCreationButton);
  }

  async createQuestion() {
    await this.clickOn(createQuestionButton);
    await this.clickOn(easyQuestionDifficultyOption);
    await this.clickOn(questionStateEditSelector);
    await this.type(richTextAreaField, 'Add 1+2');
    await this.page.waitForSelector(
      `${saveQuestionContentButton}:not([disabled])`);
    await this.clickOn(saveQuestionContentButton);

    await this.clickOn(addInteractionButton);
    await this.clickOn(interactionNumberInputButton);
    await this.clickOn(saveInteractionButton);
    await this.clickOn(responseRuleDropdown);
    await this.clickOn(equalsRuleButtonText);
    await this.type(floatTextField, '3');
    await this.clickOn(answersInGroupAreCorrectToggle);
    await this.clickOn(saveResponseButton);

    await this.clickOn(openOutcomeFeedBackEditor);
    await this.type(richTextAreaField, 'The answer is 3');
    await this.clickOn(saveOutcomeFeedbackButton);

    await this.clickOn(addHintButton);
    await this.type(richTextAreaField, '3');
    await this.clickOn(saveHintButton);

    await this.clickOn(addSolutionButton);
    await this.page.select(answerTypeDropdown, 'The only');
    await this.type(floatTextField, '3');
    await this.clickOn(submitAnswerButton);
    await this.type(richTextAreaField, '1+2 is 3');
    await this.page.waitForSelector(
      `${submitSolutionButton}:not([disabled])`);
    await this.clickOn(submitSolutionButton);

    await this.clickOn(saveQuestionButton);
  }

  /**
   * Function for navigating to the topic and skills dashboard page.
   */
  async navigateToTopicAndSkillsDashboardPage() {
    await this.goto(topicAndSkillsDashboardUrl);
  }

};