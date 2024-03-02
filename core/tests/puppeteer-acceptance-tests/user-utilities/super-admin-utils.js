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

const AdminPageRolesTab = testConstants.URLs.AdminPageRolesTab;
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
    await this.goto(AdminPageRolesTab);
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
    await this.goto(AdminPageRolesTab);
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
    await this.goto(AdminPageRolesTab);
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
        throw new Error(
          'User does not have the proper roles to access the contributor ' +
          'dashboard admin page.');
      }
      showMessage('Error text: ' + errorHeader.innerText);
    });

    await this.type('input#add-contribution-rights-user-input', username);
    await this.page.evaluate(async(right) => {
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
      await this.page.evaluate(async(language) => {
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

  async editClassroom({ topicIds }) {
    await this.goto('http://localhost:8181/admin#/config');

    for (const topicId of topicIds) {
      await this.clickOn('.e2e-test-add-list-entry');
      await this.type('.e2e-test-topic-id-field', topicId);
    }
    await this.clickOn('.e2e-test-save-all-configs');
  }

  async createTopic({
    name, urlFragment, webTitleFragment, description, thumbnail, metaContent,
    assignedSkills, subtopics, diagnosticTestSkills, isPublished }) {
    await this.goto('http://localhost:8181/topics-and-skills-dashboard');

    await this.page.waitForSelector(
      '.e2e-test-no-topics-and-no-skills-present-message', { hidden: true });
    await this.page.waitForSelector(
      '.e2e-test-topics-and-skills-tab-list', { visible: true });
    await this.clickOn('.e2e-test-topics-tab');

    await this.clickOn('.e2e-test-create-topic-button', { visible: true });
    await this.withinContainerAboveCurrentContent({
      containerSelector: 'oppia-create-new-topic-modal',
      whenOpened: async(_this) => {
        await _this.type('.e2e-test-new-topic-name-field', name);
        await _this.type(
          '.e2e-test-new-topic-url-fragment-field', urlFragment);
        await _this.type(
          '.e2e-test-new-page-title-fragm-field', webTitleFragment);
        await _this.type(
          '.e2e-test-new-topic-description-field', description);

        await _this.clickOn('.e2e-test-photo-button');
        await _this.withinContainerAboveCurrentContent({
          containerSelector: 'edit-thumbnail-modal',
          whenOpened: async(_this) => {
            await _this.uploadFile(thumbnail);
            await _this.clickOn('.e2e-test-photo-upload-submit:enabled');
          }
        });

        await _this.clickOn('.e2e-test-confirm-topic-creation-button:enabled');
      },
      afterClosing: async() => {}
    });
    await this.switchToPageOpenedByElementInteraction();

    await this.type(
      '.e2e-test-topic-meta-tag-content-field', metaContent,
      { visible: true });
    // Click anywhere off the Meta Tag text input field. Otherwise, the
    // app won't recognize the meta tag content updates.
    await this.clickOn('.e2e-test-save-topic-button');

    await this.clickOn('.e2e-test-save-topic-button:enabled');
    await this.withinContainerAboveCurrentContent({
      containerSelector: 'oppia-topic-editor-save-modal',
      whenOpened: async(_this) => {
        _this.type('.e2e-test-commit-message-input', 'Init');
        _this.clickOn('.e2e-test-close-save-modal-button');
      }
    });
    await this.page.waitForSelector('.e2e-test-save-topic-button:disabled');

    // Assign skills.
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickOn('.e2e-test-back-to-topics-and-skills-dashboard')
    ]);

    await this.clickOn('.e2e-test-skills-tab', { visible: true });
    await this.page.waitForSelector('oppia-topics-list', { hidden: true });

    await this.withinContainerAboveCurrentContent({
      containerSelector: 'oppia-skills-list',
      whenOpened: async(_this) => {
        await _this.clickOn('.e2e-test-assign-skill-to-topic-button');
        await _this.withinContainerAboveCurrentContent({
          containerSelector: 'oppia-assign-skill-to-topic-modal',
          whenOpened: async(_this) => {
            await _this.clickOn('.e2e-test-topics-list-item');
            await _this.clickOn('.e2e-test-confirm-move-button');
          }
        });
        await _this.clickOn('.e2e-test-topics-tab');
      }
    });

    await this.page.waitForSelector('oppia-topics-list', { visible: true });
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickOn('.e2e-test-topic-name')
    ]);

    // Add subtopics.
    await this.clickOn('.e2e-test-add-subtopic-button', { visible: true });
    await this.withinContainerAboveCurrentContent({
      containerSelector: 'oppia-create-new-subtopic-modal',
      whenOpened: async(_this) => {
        await _this.type(
          '.e2e-test-new-subtopic-title-field', subtopics[0].title);
        await _this.type(
          '.e2e-test-new-subtopic-url-fragment-field',
          subtopics[0].urlFragment);

        await _this.clickOn('.e2e-test-show-schema-editor');
        await _this.withinContainerAboveCurrentContent({
          containerSelector: '.e2e-test-create-subtopic-page-content ' +
            '.e2e-test-rte',
          whenOpened: async(_this) => {
            await _this.page.type(
              '.e2e-test-create-subtopic-page-content .e2e-test-rte',
              subtopics[0].description);
          },
          afterClosing: async() => {}
        });

        await _this.clickOn(
          '.e2e-test-subtopic-thumbnail .e2e-test-photo-button');
        await _this.withinContainerAboveCurrentContent({
          containerSelector: 'edit-thumbnail-modal',
          whenOpened: async(_this) => {
            await _this.uploadFile(subtopics[0].thumbnail);
            await _this.clickOn('.e2e-test-photo-upload-submit:enabled');
          }
        });

        await _this.clickOn(
          '.e2e-test-confirm-subtopic-creation-button:enabled');
      }
    });

    await this.clickOn('.e2e-test-back-to-topic-editor', { visible: true });

    await this.clickOn('.e2e-test-skill-item-edit-btn', { visible: true });
    await this.withinContainerAboveCurrentContent({
      containerSelector: '.e2e-test-options-for-uncategorized-skill',
      whenOpened: async(_this) => {
        await _this.clickOn('.e2e-test-assign-skill-to-subtopic');
      }
    });
    await this.withinContainerAboveCurrentContent({
      containerSelector: 'oppia-change-subtopic-assignment-modal',
      whenOpened: async(_this) => {
        await _this.clickOn('#mat-radio-2');
        await _this.clickOn('.e2e-test-skill-assign-subtopic-confirm');
      }
    });

    await this.clickOn('.e2e-test-save-topic-button:enabled');
    await this.withinContainerAboveCurrentContent({
      containerSelector: 'oppia-topic-editor-save-modal',
      whenOpened: async(_this) => {
        await _this.type(
          '.e2e-test-commit-message-input', 'Create subtopic');
        await _this.clickOn('.e2e-test-close-save-modal-button');
      }
    });
    await this.page.waitForSelector(
      '.e2e-test-save-topic-button:disabled');

    // Assign diagnostic test skills.
    // TODO (#19669): Once the issue is solved, remove this reload
    // page statement and the saving topic changes statements just
    // before the reload page statement.
    await this.reloadPage();
    await this.clickOn(
      '.e2e-test-add-diagnostic-test-skill', { visible: true });
    await this.select(
      '.e2e-test-diagnostic-test-skill-selector',
      diagnosticTestSkills[0].description, { visible: true });

    await this.clickOn('.e2e-test-save-topic-button:enabled');
    await this.withinContainerAboveCurrentContent({
      containerSelector: 'oppia-topic-editor-save-modal',
      whenOpened: async(_this) => {
        await _this.type(
          '.e2e-test-commit-message-input',
          'Select diagnostic test skills');
        await _this.clickOn('.e2e-test-close-save-modal-button');
      }
    });
    await this.page.waitForSelector(
      '.e2e-test-save-topic-button:disabled');

    if (isPublished) {
      // Navigates to the Topics and Skills Dashboard.
      await Promise.all([
        this.page.waitForNavigation(),
        this.clickOn('.e2e-test-publish-topic-button')
      ]);
    }
  }

  async getTopicIdBy({ name }) {
    await this.goto('http://localhost:8181/topics-and-skills-dashboard');
    await this.clickOn('.e2e-test-topics-tab');

    const topicListIndex = await this.page.evaluate(async(name) => {
      const topicNames = document.getElementsByClassName(
        'e2e-test-topic-name');
      for (let i = 0; i < topicNames.length; i++) {
        if (topicNames[i] === name) {
          return i + 1;
        }
      }
    }, name);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
      this.clickOn(`.e2e-test-topic-name:nth-child(${topicListIndex})`)
    ]);

    const topicEditorUrl = await this.page.url();

    const topicIdMatcher = /\/\w+\#/;
    const topicIdMatch = topicEditorUrl.match(topicIdMatcher)[0];
    return topicIdMatch.substring(1, topicIdMatch.length - 1);
  }

  async createSkill({
    description,
    reviewMaterial,
    misconception,
    difficulties,
    questionCount
  }) {
    await this.goto('http://localhost:8181/topics-and-skills-dashboard');

    await this.clickOn('.e2e-test-create-skill-button', { visible: true });
    await this.withinContainerAboveCurrentContent({
      containerSelector: 'oppia-create-new-skill-modal',
      whenOpened: async(_this) => {
        await _this.type(
          '.e2e-test-new-skill-description-field', description);
        await _this.clickOn('.e2e-test-open-concept-card');
        await _this.type(
          '.e2e-test-concept-card-text .e2e-test-rte', reviewMaterial,
          { visible: true });
        await _this.clickOn('.e2e-test-confirm-skill-creation-button:enabled');
      },
      afterClosing: async() => {}
    });
    await this.switchToPageOpenedByElementInteraction();

    if (misconception) {
      await this.clickOn(
        '.e2e-test-add-misconception-modal-button', { visible: true });
      await this.withinContainerAboveCurrentContent({
        containerSelector: '.e2e-test-add-misconception-modal',
        whenOpened: async(_this) => {
          await _this.type(
            '.e2e-test-misconception-name-field', misconception.name);
          await _this.type(
            '.e2e-test-feedback-textarea .e2e-test-rte', misconception.feedback,
            { visible: true });
          if (!misconception.mustBeTaggedToQuestion) {
            await _this.clickOn('.e2e-test-enforce-all-questions-checkbox');
          }
          await _this.clickOn('.e2e-test-confirm-add-misconception-button');
        }
      });
    }

    // Configure difficulties and their rubric notes.
    for (const [difficulty, { rubricNotes }] of Object.entries(difficulties)) {
      await this.select(
        '.e2e-test-select-rubric-difficulty',
        await this.page.$eval(
          '.e2e-test-select-rubric-difficulty',
          (dropdown, difficulty) => {
            for (const option of dropdown.options) {
              if (option.text === difficulty) {
                return option.value;
              }
            }
            return '';
          },
          difficulty));
      await this.page.waitForSelector(
        `.e2e-test-add-explanation-button-${difficulty}`,
        { visible: true });

      let noteCount = 0;
      if (await this.page.$('.e2e-test-rubric-explanation-list')) {
        await this.page.waitForSelector(
          '.e2e-test-rubric-explanation-list',
          { visible: true });
        noteCount = await this.page.$eval(
          '.e2e-test-rubric-explanation-list',
          rubricNotes => rubricNotes.childElementCount);
      }

      for (let i = 0; i < rubricNotes.length; i++) {
        await this.clickOn(
          i < noteCount ?
          '.e2e-test-rubric-explanation-list > ' +
          `:nth-child(${i + 1}) .oppia-click-to-start-editing` :
          `.e2e-test-add-explanation-button-${difficulty}`);
        await this.withinContainerAboveCurrentContent({
          containerSelector: '.e2e-test-rubric-explanation-text .e2e-test-rte',
          whenOpened: async(_this, rteEditor) => {
            // Triple-click to highlight the text. Then, the first letter typed
            // will clear the previous text.
            await _this.page.click(rteEditor, { clickCount: 3 });
            await _this.page.type(rteEditor, rubricNotes[i]);
            await _this.clickOn('.e2e-test-save-rubric-explanation-button');
          }
        });
      }
    }

    // Save skill changes.
    await this.clickOn('.e2e-test-save-or-publish-skill:enabled');
    await this.withinContainerAboveCurrentContent({
      containerSelector: 'skill-editor-save-modal',
      whenOpened: async(_this) => {
        await _this.type('.e2e-test-commit-message-input', 'test');
        await _this.clickOn('.e2e-test-close-save-modal-button');
      }
    });
    await this.page.waitForSelector(
      '.e2e-test-save-or-publish-skill:disabled');
    await this.page.waitForNetworkIdle({ idleTime: 2000 });

    // Create dummy questions under the skill.
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      this.clickOn('.e2e-test-questions-tab')
    ]);
    for (let i = 0; i < questionCount; i++) {
      await this.clickOn('.e2e-test-create-question-button');
      await this.withinContainerAboveCurrentContent({
        containerSelector: '.e2e-test-create-question-progress',
        whenOpened: async(_this) => {
          await _this.clickOn('.e2e-test-skill-difficulty-medium');

          await _this.clickOn('.e2e-test-edit-content');
          await _this.withinContainerAboveCurrentContent({
            containerSelector: '.e2e-test-state-content-editor .e2e-test-rte',
            whenOpened: async(_this, questionTextEditor) => {
              await _this.page.type(
                questionTextEditor, 'Question created by Skill Owner');
              await _this.clickOn('.e2e-test-save-state-content');
            }
          });

          await _this.clickOn('.e2e-test-open-add-interaction-modal');
          await _this.withinContainerAboveCurrentContent({
            containerSelector: 'oppia-customize-interaction',
            whenOpened: async(_this) => {
              await _this.clickOn(
                '.e2e-test-interaction-tile-TextInput button');
              await _this.clickOn('.e2e-test-save-interaction');
            }
          });
          await _this.withinContainerAboveCurrentContent({
            containerSelector: 'oppia-add-answer-group-modal-component',
            whenOpened: async(_this) => {
              await _this.clickOn('.e2e-test-add-list-entry');
              await _this.type(
                '.e2e-test-schema-based-list-editor-table-data input', 't',
                { visible: true });
              await _this.clickOn('.e2e-test-open-feedback-editor');
              await _this.type(
                '.e2e-test-add-response-details .e2e-test-rte', 'Correct!',
                { visible: true });
              await _this.clickOn('.e2e-test-editor-correctness-toggle');
              await _this.clickOn('.e2e-test-add-new-response');
            }
          });

          await _this.clickOn('.e2e-test-default-response-tab');
          await _this.page.waitForSelector(
            '.e2e-test-response-body-default', { visible: true });
          await _this.clickOn(
            '.e2e-test-response-body-default ' +
            '.e2e-test-open-outcome-feedback-editor');
          await _this.withinContainerAboveCurrentContent({
            containerSelector: '.e2e-test-response-body-default ' +
              '.e2e-test-rte',
            whenOpened: async(_this, responseEditor) => {
              _this.page.type(responseEditor, 'Incorrect!');
              _this.clickOn('.e2e-test-save-outcome-feedback');
            }
          });

          await _this.clickOn('.e2e-test-misconception-0-0-options');
          await _this.withinContainerAboveCurrentContent({
            containerSelector:
              '.e2e-test-mark-non-applicable-misconception-0-0',
            whenOpened: async(_this, misconceptionOptions) => {
              _this.page.click(misconceptionOptions);
            }
          });

          await _this.clickOn('.e2e-test-oppia-add-hint-button');
          await _this.withinContainerAboveCurrentContent({
            containerSelector: 'oppia-add-hint-modal',
            whenOpened: async(_this) => {
              await _this.type(
                '.e2e-test-hint-text .e2e-test-rte', 'hint text');
              await _this.clickOn('.e2e-test-save-hint');
            }
          });

          await _this.clickOn('.e2e-test-oppia-add-solution-button');
          await _this.withinContainerAboveCurrentContent({
            containerSelector: 'oppia-add-or-update-solution-modal',
            whenOpened: async(_this) => {
              await _this.type(
                'oppia-add-or-update-solution-modal .e2e-test-description-box',
                't');
              await _this.clickOn('.e2e-test-submit-answer-button');
              await _this.type(
                '.e2e-test-explanation-textarea .e2e-test-rte', 'Explanation',
                { visible: true });
              await _this.clickOn('.e2e-test-submit-solution-button');
            }
          });

          await _this.clickOn('.e2e-test-save-question-button:enabled');
        }
      });
    }
  }
};
