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

const topicAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;
const skillDescriptionField = 'input.e2e-test-new-skill-description-field';
const skillReviewMaterialHeader = 'div.e2e-test-open-concept-card';
const skillReviewMaterialField = 'div.e2e-test-rte cke_editable';
const createSkillButton = 'button.e2e-test-create-skill-button';
const confirmSkillCreationButton = 'button.e2e-test-confirm-skill-creation-button';


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
    await this.type(skillReviewMaterialField, 'This is a test skill with 3 questions');
    await this.page.waitForSelector(
      `${confirmSkillCreationButton}:not([disabled])`);
    await this.clickOn(confirmSkillCreationButton);
  }

  /**
   * Function for navigating to the topic and skills dashboard page.
   */
  async navigateToTopicAndSkillsDashboardPage() {
    await this.goto(topicAndSkillsDashboardUrl);
  }

};