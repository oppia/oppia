// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Super Admin users utility file.
 */

const baseUser = require(
  '../puppeteer-testing-utilities/puppeteer-utils.js');
const testConstants = require(
  '../puppeteer-testing-utilities/test-constants.js');
const { showMessage } = require(
  '../puppeteer-testing-utilities/show-message-utils.js');

const rolesEditorTab = testConstants.URLs.RolesEditorTab;
const roleEditorInputField = 'input.e2e-test-username-for-role-editor';
const roleEditorButtonSelector = 'button.e2e-test-role-edit-button';
const rolesSelectDropdown = 'div.mat-select-trigger';
const addRoleButton = 'button.oppia-add-role-button';

const contributorDashboardAdminPage = (
  testConstants.URLs.ContributorDashboardAdmin);

module.exports = class e2eSuperAdmin extends baseUser {
  /**
   * The function to assign a role to a user.
   * @param {string} username - The username to which role would be assigned.
   * @param {string} role - The role that would be assigned to the user.
   */
  async assignRoleToUser(username, role) {
    await this.goto(rolesEditorTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.clickOn(addRoleButton);
    await this.clickOn(rolesSelectDropdown);
    await this.page.evaluate(async(role) => {
      const allRoles = document.getElementsByClassName('mat-option-text');
      for (let i = 0; i < allRoles.length; i++) {
        if (allRoles[i].innerText.toLowerCase() === role) {
          allRoles[i].click({waitUntil: 'networkidle0'});
          return;
        }
      }
      throw new Error(`Role ${role} does not exist.`);
    }, role);
  }

  /**
   * The function excepts the user to have the given role.
   * @param {string} username - The username to which role must be assigned.
   * @param {string} role - The role which must be assigned to the user.
   */
  async expectUserToHaveRole(username, role) {
    const currentPageUrl = this.page.url();
    await this.goto(rolesEditorTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    await this.page.evaluate((role) => {
      const userRoles = document.getElementsByClassName(
        'oppia-user-role-description');
      for (let i = 0; i < userRoles.length; i++) {
        if (userRoles[i].innerText.toLowerCase() === role) {
          return;
        }
      }
      throw new Error(`User does not have the ${role} role!`);
    }, role);
    showMessage(`User ${username} has the ${role} role!`);
    await this.goto(currentPageUrl);
  }

  /**
   * The function excepts the user to not have the given role.
   * @param {string} username - The user to which the role must not be assigned.
   * @param {string} role - The role which must not be assigned to the user.
   */
  async expectUserNotToHaveRole(username, role) {
    const currentPageUrl = this.page.url();
    await this.goto(rolesEditorTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    await this.page.evaluate((role) => {
      const userRoles = document.getElementsByClassName(
        'oppia-user-role-description');
      for (let i = 0; i < userRoles.length; i++) {
        if (userRoles[i].innerText.toLowerCase() === role) {
          throw new Error(`User has the ${role} role!`);
        }
      }
    }, role);
    showMessage(`User ${username} does not have the ${role} role!`);
    await this.goto(currentPageUrl);
  }

  /**
   * The function to assign a contribution right to a user.
   * @param {string} username - The username to which role would be assigned.
   * @param {string} right - The contribution right that would be assigned to
   *   the user.
   * @param {string} language - The language to review translations in when
   *   the review translations right would be assigned to the user.
   */
  async assignContributionRightToUser(username, right, language = '') {
    const addContributionRightsCategorySelectDropdown = (
      'select#add-contribution-rights-category-select');
    const addContributionRightsLanguageSelectDropdown = (
      'select#add-contribution-rights-language-select');

    await this.goto(contributorDashboardAdminPage);
    await this.page.evaluate(() => {
      const errorHeader = document.querySelector(
        'div.e2e-test-error-container div');
      if (errorHeader.innerText === '401 - Unauthorized') {
        throw new Error('User does not have the proper roles to access the ' +
          'contributor dashboard admin page.');
      }
      showMessage('Error text: ' + errorHeader.innerText);
    });

    await this.type('input#add-contribution-rights-user-input', username);
    await this.page.evaluate(async (right) => {
      const availableRights = document.querySelectorAll(
        `${addContributionRightsCategorySelectDropdown} option`);
      for (const availableRight in availableRights) {
        if (availableRight.innerText === right) {
          await this.select(addContributionRightsCategorySelectDropdown, right);
          return;
	}
      }
      throw new Error(
	`Contribution right ${right} is not one of the available rights.` +
        ' Ensure that the text is spelled correctly and that the user has ' +
        'the proper role to add said right.');
    }, right);

    if (right === testConstants.ContributorRights.ReviewTranslation) {
      await this.page.evaluate(async (language) => {
        const availableLanguages = document.querySelectorAll(
          `${addContributionRightsLanguageSelectDropdown} option`); 
        for (const availableLanguage in availableLanguages) {
          if (availableLanguage.innerText === language) {
            await this.select(
              addContributionRightsLanguageSelectDropdown, language);
            return;
          }
        }
        throw new Error(
          `Language ${language} is not one of the available languages.` +
          ' Ensure that the text is spelled correctly.');
      }, language);
    } 

    await this.clickOn('button#add-contribution-rights-submit-button');
    await this.page.evaluate(() => {
      const addContributionRightStatus = document.getElementsByClassName(
        'e2e-test-status-message')[0].innerText;
      if (addContributionRightStatus !== 'Success.' ||
        addContributionRightStatus !== 'Adding contribution rights...') {
        throw new Error(
          `Server error when adding contribution rights: ${
            addContributionRightStatus}`);
      }
    });
  }

  async editClassroom({ topics }) {
    await this.goto('http://localhost:8181/admin#/config');

    for (const topicId of topics) {
      await this.onClick('button.e2e-test-add-list-entry');
      await this.type('input.e2e-test-topic-id-field', topicId);
    }
    await this.clickOn('button.e2e-test-save-all-configs');
  }

  async createTopic({
    name, urlFragment, webTitleFragment, description, thumbnail, metaContent,
    assignedSkills, subtopics, diagnosticTestSkills, isPublished }) {
    await this.goto('http://localhost:8181/topics-and-skills-dashboard');

    await this.clickOn('a.e2e-test-topics-tab');
    await this.clickOn('div.e2e-test-create-topic-button');

    await this.type('input.e2e-test-new-topic-name-field', name);
    await this.type('input.e2e-test-new-topic-url-fragment-field', urlFragment);
    await this.type(
      'input.e2e-test-new-page-title-fragm-field', webTitleFragment);  
    await this.type(
      'textarea.e2e-test-new-topic-description-field', description);

    await this.clickOn('div.e2e-test-photo-button');
    await this.clickOn('label.image-uploader-upload-label-button');
    await this.uploadFile(thumbnail);
    await this.clickOn('button.e2e-test-photo-upload-submit');

    await this.clickOn('button.e2e-test-confirm-topic-creation-button');

    await this.type(
      'textarea.e2e-test-topic-meta-tag-content-field', metaContent);

    await this.clickOn('button.e2e-test-save-topic-button');
    await this.type('textarea.e2e-test-commit-message-input', 'Init');
    await this.onClick('button.e2e-test-close-save-modal-button');

    const topicEditorUrl = await this.page.url();
    // Assign skills
    await this.goto('http://localhost:8181/topics-and-skills-dashboard');
    await this.onClick('.e2e-test-assign-skill-to-topic-button');
    await this.page.evaluate(async (name) => {
      const topicNames = document.getElementsByClassName(
        'e2e-test-topic-name-in-topic-select-modal');
      for (let i = 0; i < topicNames.length; i++) {
        if (topicName === name) {
          await this.onClick(`.e2e-test-topics-list-item:nth-child(${i + 1})`);
          return;
	}
      }
    }, name);
    await this.onClick('.e2e-test-confirm-move-button');
    await this.goto(topicEditorUrl);
 
    // Add subtopics
    await this.onClick('.puppeteer-test-add-subtopic-button');
    await this.type('.e2e-test-new-subtopic-title-field', subtopics[0].title);
    await this.type(
      '.e2e-test-new-subtopic-url-fragment-field', subtopics[0].urlFragment);
    await this.onClick('.e2e-test-show-schema-editor');
    await this.type('.e2e-test-rte', subtopics[0].description);

    await this.clickOn('div.e2e-test-photo-button');
    await this.clickOn('label.image-uploader-upload-label-button');
    await this.uploadFile(subtopics[0].thumbnail);
    await this.clickOn('button.e2e-test-photo-upload-submit');

    await this.clickOn('button.e2e-test-confirm-subtopic-creation-button');
    
    await this.goto(topicEditorUrl);
    await this.clickOn('.e2e-test-skill-item-edit-btn');
    await this.clickOn('.e2e-test-assign-subtopic');
    await this.clickOn('#mat-radio-2');
    await this.clickOn('.e2e-test-skill-assign-subtopic-confirm');

    await this.clickOn('button.e2e-test-save-topic-button');
    await this.type(
      'textarea.e2e-test-commit-message-input', 'Create subtopic');
    await this.onClick('button.e2e-test-close-save-modal-button');

    // Assign diagnostic test skills
    // Reload page is needed which is a bug to fix
    await this.reloadPage();
    await this.clickOn('button.e2e-test-add-diagnostic-test-skill');
    await this.select(
      '.e2e-test-diagnostic-test-skill-selector',
      diagnosticTestSkills[0].skillDescription);

    await this.clickOn('button.e2e-test-save-topic-button');
    await this.type(
      'textarea.e2e-test-commit-message-input', 'Diagnostic test skills');
    await this.onClick('button.e2e-test-close-save-modal-button');

    if (isPublished) {
      await this.onClick('button.e2e-test-publish-topic-button');
    }
  }

  async getTopicIdBy({ name }) {
    await this.goto('http://localhost:8181/topics-and-skills-dashboard');
    await this.clickOn('a.e2e-test-topics-tab');

    await this.page.evaluate(async (name) => {
      const topicNames = document.getElementsByClassName(
        'e2e-test-topic-name');
      for (let i = 0; i < topicNames.length; i++) {
        if (topicNames[i] === name) {
          await this.clickOn(`a.e2e-test-topic-name:nth-child(${i + 1})`);
          return;
	}
      }
    }, name);

    const topicEditorUrl = await this.page.url();

    const topicIdMatcher = /\/\w+\#/;
    const topicIdMatch = topicEditorUrl.match(topicIdMatcher)[0];
    return topicIdMatch.substring(1, topicIdMatch.length - 1);
  }

  async createSkill({ description, reviewMaterial, misconception, questionCount }) {
    await this.goto('http://localhost:8181/topics-and-skills-dashboard');
    // await this.page.waitForSelector('.e2e-test-create-first-skill-button');

    await this.clickOn(
      '.e2e-test-create-first-skill-button');
    await this.page.waitForSelector('.e2e-test-new-skill-description-field');
    await this.type(
      'input.e2e-test-new-skill-description-field', description);
    await this.clickOn('.e2e-test-concept-card-text');
    await this.type('', reviewMaterial);
    await this.clickOn('button.e2e-test-confirm-skill-creation-button');

    await this.page.waitForSelector('.e2e-test-select-rubric-difficulty');
    if (misconception) {
      await this.clickOn('button.e2e-test-add-misconception-modal-button');
      await this.type(
        'input.e2e-test-misconception-name-field', misconception.name);
      await this.type(
        '.e2e-test-feedback-textarea div.e2e-test-rte', misconception.feedback);
      if (!misconception.mustBeTaggedToQuestion) {
        await this.clickOn('input.e2e-test-enforce-all-questions-checkbox');
      }
    }

    for (const [difficulty, { rubricNotes }] of Object.entries(difficulties)) {
      await this.select('select.e2e-test-select-rubric-difficulty',
        difficulty == DIFFICULTY_MEDIUM ? '1' :
        difficulty == DIFFICULTY_HARD ? '2' : '0');

      await this.page.evaluate(async (rubricNotes) => {
        const noteCount = document.getElementsByClassName(
          `e2e-test-edit-rubric-explanation-${difficulty}`).length;
        for (let i = 0; i < rubricNotes.length; i++) {
          await this.onClick(
	    i < noteCount ?
            `i.e2e-test-edit-rubric-explanation-${difficulty}` +
               `:nth-child(${i + 1})` :
            `button.e2e-test-add-explanation-button-${difficulty}`);
          await this.page.waitForSelector(
            '.e2e-test-rubric-explanation-text .e2e-test-rte'); 
          await this.type(
            '.e2e-test-rubric-explanation-text div.e2e-test-rte',
            rubricNotes[i]);
	  await this.onClick('button.e2e-test-save-rubric-explanation-button');
	}
      }, rubricNotes); 
    }

    await this.onClick('button.e2e-test-save-or-publish-skill');
    await this.page.waitForSelector('.e2e-test-commit-message-input');
    await this.type('textarea.e2e-test-commit-message-input', 'test');
    await this.onClick('button.e2e-test-close-save-modal-button');

    // Create questions under the skill
    await this.onClick('.e2e-test-questions-tab');
    for (let i = 0; i < questionCount; i++) {
      await this.page.waitForSelector('.e2e-test-create-question-button');
      await this.onClick('.e2e-test-create-question-button');
      await this.onClick('.e2e-test-skill-difficulty-medium');

      await this.onClick('.e2e-test-state-edit-content');
      await this.page.waitForSelector('.e2e-test-rte');
      await this.type(
        '.e2e-test-rte', 'Question created by Skill Owner');
      await this.onClick('.e2e-test-save-state-content');

      await this.onClick('.e2e-test-open-add-interaction-modal');
      await this.onClick('.e2e-test-interaction-tile-TextInput button');
      await this.page.waitForSelector('.e2e-test-save-interaction');
      await this.onClick('.e2e-test-save-interaction');

      await this.onClick('.e2e-test-add-list-entry');
      await this.page.waitForSelector(
        '.e2e-test-schema-based-list-editor-table-data input');
      await this.type(
        '.e2e-test-schema-based-list-editor-table-data input', 't');
      await this.onClick('.e2e-test-open-feedback-editor');
      await this.type('.e2e-test-rte', 'Correct!');
      await this.onClick('input.e2e-test-editor-correctness-toggle');
      await this.onClick('.e2e-test-add-new-response');

      await this.onClick('.e2e-test-default-response-tab');
      await this.page.waitForSelector(
        '.e2e-test-open-outcome-feedback-editor');
      await this.onClick('.e2e-test-open-outcome-feedback-editor');
      await this.type('.e2e-test-rte', 'Incorrect!');
      await this.onClick('.e2e-test-save-outcome-feedback');

      await this.onClick('.e2e-test-oppia-add-hint-button');
      await this.waitForSelector('.e2e-test-rte');
      await this.type('.e2e-test-rte', 'hint text');
      await this.onClick('.e2e-test-save-hint');

      await this.page.waitForSelector('.e2e-test-oppia-add-solution-button');
      await this.onClick('.e2e-test-oppia-add-solution-button');
      await this.page.waitForSelector('.e2e-test-description-box');
      await this.type('.e2e-test-description-box', 't');
      await this.onClick('.e2e-test-submit-answer-button');
      await this.page.waitForSelector('.e2e-test-rte');
      await this.type('.e2e-test-rte', 'Explain');
      await this.onClick('.e2e-test-submit-solution-button');

      await this.page.waitForSelector('.e2e-test-save-question-button');
      await this.onClick('.e2e-test-save-question-button');
    }
  }
};
