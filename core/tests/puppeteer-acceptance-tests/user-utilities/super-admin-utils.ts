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
 * @fileoverview Super Admin users utility file.
 */

import {BaseUser} from '../puppeteer-testing-utilities/puppeteer-utils';
import testConstants from '../puppeteer-testing-utilities/test-constants';
import {showMessage} from '../puppeteer-testing-utilities/show-message-utils';

const AdminPageRolesTab = testConstants.URLs.AdminPageRolesTab;
const roleEditorInputField = 'input.e2e-test-username-for-role-editor';
const roleEditorButtonSelector = 'button.e2e-test-role-edit-button';
const rolesSelectDropdown = 'div.mat-select-trigger';
const addRoleButton = 'button.oppia-add-role-button';

export interface ISuperAdmin extends IBaseUser {
  assignRoleToUser: (username: string, role: string) => Promise<void>;
  expectUserToHaveRole: (username: string, role: string) => Promise<void>;
  expectUserNotToHaveRole: (username: string, role: string) => Promise<void>;
  editClassroom: (details: AdminPageClassroomDetails) => Promise<void>;
  createTopic: (details: TopicDetails) => Promise<void>;
  getTopicIdBy: (details: {name: string}) => Promise<void>;
  createSkill: (details: SkillDetails) => Promise<void>;
}

export interface AdminPageClassroomDetails {
  topicId?: string;
}

export interface TopicDetails {
  name: string;
  urlFragment: string;
  webTitleFragment: string;
  description: string;
  thumbnail: string;
  metaContent: string;
  assignedSkills?: SkillDetails[];
  subtopics?: SubtopicDetails[];
  diagnosticTestSkills?: SkillDetails[];
  isPublished: boolean;
}

export interface SkillDetails {
  description: string;
  reviewMaterial: string;
  misconception?: SkillMisconceptionDetails;
  difficulties: {
    Easy?: SkillDifficultyDetails;
    Medium: SkillDifficultyDetails;
    Hard?: SkillDifficultyDetails;
  };
  questionCount?: number;
}

export interface SkillMisconceptionDetails {
  name: string;
  feedback: string;
  mustBeTaggedToQuestion: boolean;
}

export interface SkillDifficultyDetails {
  rubricNotes: string[];
}

export interface SubtopicDetails {
  title: string;
  urlFragment: string;
  description: string;
  thumbnail: string;
  assignedSkills?: SkillDetails[];
}

class SuperAdmin extends BaseUser implements ISuperAdmin {
  /**
   * The function to assign a role to a user.
   */
  async assignRoleToUser(username: string, role: string): Promise<void> {
    await this.goto(AdminPageRolesTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.clickOn(addRoleButton);
    await this.clickOn(rolesSelectDropdown);
    const allRoles = await this.page.$$('.mat-option-text');
    for (let i = 0; i < allRoles.length; i++) {
      const roleText = await this.page.evaluate(
        (role: HTMLElement) => role.innerText,
        allRoles[i]
      );
      if (roleText.toLowerCase() === role) {
        await allRoles[i].click();
        await this.page.waitForNetworkIdle();
        return;
      }
    }
    throw new Error(`Role ${role} does not exists.`);
  }

  /**
   * The function expects the user to have the given role.
   */
  async expectUserToHaveRole(username: string, role: string): Promise<void> {
    const currentPageUrl = this.page.url();
    await this.goto(AdminPageRolesTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    const userRoles = await this.page.$$('.oppia-user-role-description');
    for (let i = 0; i < userRoles.length; i++) {
      const roleText = await this.page.evaluate(
        (role: HTMLElement) => role.innerText,
        userRoles[i]
      );
      if (roleText.toLowerCase() === role) {
        showMessage(`User ${username} has the ${role} role!`);
        await this.goto(currentPageUrl);
        return;
      }
    }
    throw new Error(`User does not have the ${role} role!`);
  }

  /**
   * The function expects the user to not have the given role.
   */
  async expectUserNotToHaveRole(username: string, role: string): Promise<void> {
    const currentPageUrl = this.page.url();
    await this.goto(AdminPageRolesTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    const userRoles = await this.page.$$('.oppia-user-role-description');
    for (let i = 0; i < userRoles.length; i++) {
      const roleText = await this.page.evaluate(
        (role: HTMLElement) => role.innerText,
        userRoles[i]
      );
      if (roleText.toLowerCase() === role) {
        throw new Error(`User has the ${role} role!`);
      }
    }
    showMessage(`User ${username} does not have the ${role} role!`);
    await this.goto(currentPageUrl);
  }

  /**
   * The function edits the classroom on the admin page with the given
   * details.
   */
  async editClassroom({topicId}: AdminPageClassroomDetails): Promise<void> {
    await this.goto('http://localhost:8181/admin#/config');

    if (topicId) {
      await this.clickOn('.e2e-test-add-list-entry');
      // TODO(#19668): Remove the for loop that types in the entire topic id.
      for (let i = 0; i < topicId.length; i++) {
        await this.type(
          '.e2e-test-schema-based-dict-editor ' +
            '.e2e-test-schema-based-list-editor-table-data ' +
            'input[type="text"]',
          topicId[i],
          {visible: true}
        );
      }
    }

    await this.page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await this.clickOn('.e2e-test-save-all-configs');
    await this.page.waitForSelector('.e2e-test-status-message', {
      visible: true,
    });
  }

  /**
   * The function creates a topic with the given details through the topic
   * editor page.
   *
   * Ensure that the Curriculum Admin role is assigned to the super admin
   * before calling this function.
   */
  async createTopic({
    name,
    urlFragment,
    webTitleFragment,
    description,
    thumbnail,
    metaContent,
    assignedSkills,
    subtopics,
    diagnosticTestSkills,
    isPublished,
  }: TopicDetails): Promise<void> {
    await this.goto('http://localhost:8181/topics-and-skills-dashboard');

    await this.page.waitForSelector(
      '.e2e-test-no-topics-and-no-skills-present-message',
      {hidden: true}
    );
    await this.page.waitForSelector('.e2e-test-topics-and-skills-tab-list', {
      visible: true,
    });
    await this.clickOn('.e2e-test-topics-tab');

    await this.clickOn('.e2e-test-create-topic-button', {visible: true});
    await this.withinModal({
      selector: 'oppia-create-new-topic-modal',
      whenOpened: async _this => {
        await _this.type('.e2e-test-new-topic-name-field', name);
        await _this.type('.e2e-test-new-topic-url-fragment-field', urlFragment);
        await _this.type(
          '.e2e-test-new-page-title-fragm-field',
          webTitleFragment
        );

        await _this.clickOn('.e2e-test-photo-button');
        await _this.withinModal({
          selector: 'edit-thumbnail-modal',
          whenOpened: async _this => {
            await _this.uploadFile(thumbnail);
            await _this.clickOn('.e2e-test-photo-upload-submit:enabled');
          },
        });
        await _this.type('.e2e-test-new-topic-description-field', description);

        await _this.clickOn('.e2e-test-confirm-topic-creation-button:enabled');
      },
      afterClosing: async () => {},
    });
    await this.switchToPageOpenedByElementInteraction();

    await this.type('.e2e-test-topic-meta-tag-content-field', metaContent, {
      visible: true,
    });
    // Click anywhere off the Meta Tag text input field. Otherwise, the
    // app won't recognize the meta tag content updates.
    await this.clickOn('.e2e-test-save-topic-button');

    await this.clickOn('.e2e-test-save-topic-button:enabled');
    await this.withinModal({
      selector: 'oppia-topic-editor-save-modal',
      whenOpened: async _this => {
        _this.type('.e2e-test-commit-message-input', 'Init');
        _this.clickOn('.e2e-test-close-save-modal-button');
      },
    });
    await this.page.waitForSelector('.e2e-test-save-topic-button:disabled');

    // Assign skills.
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickOn('.e2e-test-back-to-topics-and-skills-dashboard'),
    ]);

    await this.clickOn('.e2e-test-skills-tab', {visible: true});
    await this.page.waitForSelector('oppia-topics-list', {hidden: true});

    await this.page.waitForSelector('oppia-skills-list', {visible: true});
    await this.clickOn('.e2e-test-assign-skill-to-topic-button');
    await this.withinModal({
      selector: 'oppia-assign-skill-to-topic-modal',
      whenOpened: async _this => {
        await _this.clickOn('.e2e-test-topics-list-item');
        await _this.clickOn('.e2e-test-confirm-move-button');
      },
    });
    await this.clickOn('.e2e-test-topics-tab');
    await this.page.waitForSelector('oppia-skills-list', {hidden: true});

    await this.page.waitForSelector('oppia-topics-list', {visible: true});
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickOn('.e2e-test-topic-name'),
    ]);

    // Add subtopics.
    await this.clickOn('.e2e-test-add-subtopic-button', {visible: true});
    await this.withinModal({
      selector: 'oppia-create-new-subtopic-modal',
      whenOpened: async _this => {
        await _this.type(
          '.e2e-test-new-subtopic-title-field',
          subtopics[0].title
        );

        await _this.clickOn('.e2e-test-show-schema-editor');
        await _this.type(
          '.e2e-test-create-subtopic-page-content .e2e-test-rte',
          subtopics[0].description,
          {visible: true}
        );

        await _this.clickOn(
          '.e2e-test-subtopic-thumbnail .e2e-test-photo-button'
        );
        await _this.withinModal({
          selector: 'edit-thumbnail-modal',
          whenOpened: async _this => {
            await _this.uploadFile(subtopics[0].thumbnail);
            await _this.clickOn('.e2e-test-photo-upload-submit:enabled');
          },
        });
        await _this.type(
          '.e2e-test-new-subtopic-url-fragment-field',
          subtopics[0].urlFragment
        );

        await _this.clickOn(
          '.e2e-test-confirm-subtopic-creation-button:enabled',
          {visible: true}
        );
        await _this.page.waitForNetworkIdle({idleTime: 2000});
      },
      afterClosing: async () => {},
    });

    await this.clickOn('.e2e-test-back-to-topic-editor', {visible: true});

    await this.clickOn('.e2e-test-skill-item-edit-btn', {visible: true});
    await this.page.waitForSelector(
      '.e2e-test-options-for-uncategorized-skill',
      {visible: true}
    );
    await this.clickOn('.e2e-test-assign-skill-to-subtopic');
    await this.page.waitForSelector(
      '.e2e-test-options-for-uncategorized-skill',
      {hidden: true}
    );

    await this.withinModal({
      selector: 'oppia-change-subtopic-assignment-modal',
      whenOpened: async _this => {
        await _this.clickOn('#mat-radio-2');
        await _this.clickOn('.e2e-test-skill-assign-subtopic-confirm');
      },
    });

    await this.clickOn('.e2e-test-save-topic-button:enabled');
    await this.withinModal({
      selector: 'oppia-topic-editor-save-modal',
      whenOpened: async _this => {
        await _this.type('.e2e-test-commit-message-input', 'Create subtopic');
        await _this.clickOn('.e2e-test-close-save-modal-button');
      },
    });
    await this.page.waitForSelector('.e2e-test-save-topic-button:disabled');

    // Assign diagnostic test skills.
    // TODO (#19669): Once the issue is solved, remove this reload
    // page statement and the saving topic changes statements just
    // before the reload page statement.
    await this.reloadPage();
    await this.clickOn('.e2e-test-add-diagnostic-test-skill', {visible: true});
    await this.select(
      '.e2e-test-diagnostic-test-skill-selector',
      await this.page.$eval(
        '.e2e-test-diagnostic-test-skill-selector',
        (dropdown, skillDescription) => {
          for (const option of dropdown.options) {
            if (option.text === skillDescription) {
              return option.value;
            }
          }
          return '';
        },
        diagnosticTestSkills[0].description
      ),
      {visible: true}
    );

    await this.clickOn('.e2e-test-save-topic-button:enabled');
    await this.withinModal({
      selector: 'oppia-topic-editor-save-modal',
      whenOpened: async _this => {
        await _this.type(
          '.e2e-test-commit-message-input',
          'Select diagnostic test skills'
        );
        await _this.clickOn('.e2e-test-close-save-modal-button');
      },
    });
    await this.page.waitForSelector('.e2e-test-save-topic-button:disabled');

    if (isPublished) {
      // Navigates to the Topics and Skills Dashboard.
      await Promise.all([
        this.page.waitForNavigation(),
        this.clickOn('.e2e-test-publish-topic-button'),
      ]);
    }
  }

  /**
   * The function returns the id of the topic with the given details.
   *
   * Ensure that the Curriculum Admin role is assigned to the super admin
   * before calling this function.
   */
  async getTopicIdBy({name}: {name: string}): Promise<void> {
    await this.goto('http://localhost:8181/topics-and-skills-dashboard');
    await this.clickOn('.e2e-test-topics-tab', {visible: true});

    await Promise.all([
      this.page.waitForNavigation({waitUntil: 'networkidle0'}),
      this.clickOn('.e2e-test-topic-name'),
    ]);

    const topicEditorUrl = await this.page.url();

    const topicIdMatcher = /\/\w+\#/;
    const topicIdMatch = topicEditorUrl.match(topicIdMatcher)[0];
    return topicIdMatch.substring(1, topicIdMatch.length - 1);
  }

  /**
   * The function creates a skill with the given details through the skill
   * editor page.
   *
   * Ensure that the Curriculum Admin role is assigned to the super admin
   * before calling this function.
   */
  async createSkill({
    description,
    reviewMaterial,
    misconception,
    rubricNotesBySkillDifficulty,
    questionCount,
  }: SkillDetails): Promise<void> {
    await this.goto('http://localhost:8181/topics-and-skills-dashboard');

    await this.clickOn('.e2e-test-create-skill-button', {visible: true});
    await this.withinModal({
      selector: 'oppia-create-new-skill-modal',
      whenOpened: async _this => {
        await _this.type('.e2e-test-new-skill-description-field', description);
        await _this.clickOn('.e2e-test-open-concept-card');
        await _this.type(
          '.e2e-test-concept-card-text .e2e-test-rte',
          reviewMaterial,
          {visible: true}
        );
        await _this.clickOn('.e2e-test-confirm-skill-creation-button:enabled');
      },
      afterClosing: async () => {},
    });
    await this.switchToPageOpenedByElementInteraction();

    if (misconception) {
      await this.clickOn('.e2e-test-add-misconception-modal-button', {
        visible: true,
      });
      await this.withinModal({
        selector: '.e2e-test-add-misconception-modal',
        whenOpened: async _this => {
          await _this.type(
            '.e2e-test-misconception-name-field',
            misconception.name
          );
          await _this.type(
            '.e2e-test-feedback-textarea .e2e-test-rte',
            misconception.feedback,
            {visible: true}
          );
          if (!misconception.mustBeTaggedToQuestion) {
            await _this.clickOn('.e2e-test-enforce-all-questions-checkbox');
          }
          await _this.clickOn('.e2e-test-confirm-add-misconception-button');
        },
      });
    }

    // Configure difficulties and their rubric notes.
    for (const [difficulty, {rubricNotes}] of Object.entries(difficulties)) {
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
          difficulty
        )
      );
      await this.page.waitForSelector(
        `.e2e-test-add-explanation-button-${difficulty}`,
        {visible: true}
      );

      let noteCount = 0;
      if (await this.page.$('.e2e-test-rubric-explanation-list')) {
        await this.page.waitForSelector('.e2e-test-rubric-explanation-list', {
          visible: true,
        });
        noteCount = await this.page.$eval(
          '.e2e-test-rubric-explanation-list',
          rubricNotes => rubricNotes.childElementCount
        );
      }

      for (let i = 0; i < rubricNotes.length; i++) {
        await this.clickOn(
          i < noteCount
            ? '.e2e-test-rubric-explanation-list > ' +
                `:nth-child(${i + 1}) .oppia-click-to-start-editing`
            : `.e2e-test-add-explanation-button-${difficulty}`
        );

        // Triple-click to highlight the text. Then, the first letter typed
        // will clear the previous text.
        await this.page.waitForSelector(
          '.e2e-test-rubric-explanation-text .e2e-test-rte',
          {visible: true}
        );
        await this.page.click(
          '.e2e-test-rubric-explanation-text .e2e-test-rte',
          {clickCount: 3}
        );
        await this.page.type(
          '.e2e-test-rubric-explanation-text .e2e-test-rte',
          rubricNotes[i]
        );
        await this.clickOn('.e2e-test-save-rubric-explanation-button');
        await this.page.waitForSelector(
          '.e2e-test-rubric-explanation-text .e2e-test-rte',
          {hidden: true}
        );
      }
    }

    // Save skill changes.
    await this.clickOn('.e2e-test-save-or-publish-skill:enabled');
    await this.withinModal({
      selector: 'skill-editor-save-modal',
      whenOpened: async _this => {
        await _this.type('.e2e-test-commit-message-input', 'test');
        await _this.clickOn('.e2e-test-close-save-modal-button');
      },
    });
    await this.page.waitForSelector('.e2e-test-save-or-publish-skill:disabled');
    await this.page.waitForNetworkIdle({idleTime: 2000});

    // Create dummy questions under the skill.
    await Promise.all([
      this.page.waitForNavigation({waitUntil: 'domcontentloaded'}),
      this.clickOn('.e2e-test-questions-tab'),
    ]);
    for (let i = 0; i < questionCount; i++) {
      await this.clickOn('.e2e-test-create-question-button');
      await this.page.waitForSelector('.e2e-test-create-question-progress', {
        visible: true,
      });

      await this.clickOn('.e2e-test-skill-difficulty-medium');
      await this.clickOn('.e2e-test-edit-content');

      await this.type(
        '.e2e-test-state-content-editor .e2e-test-rte',
        'Question created by Skill Owner',
        {visible: true}
      );
      await this.clickOn('.e2e-test-save-state-content');
      await this.page.waitForSelector(
        '.e2e-test-state-content-editor .e2e-test-rte',
        {hidden: true}
      );

      await this.clickOn('.e2e-test-open-add-interaction-modal');
      await this.withinModal({
        selector: 'oppia-customize-interaction',
        whenOpened: async _this => {
          await _this.clickOn('.e2e-test-interaction-tile-TextInput button');
          await _this.clickOn('.e2e-test-save-interaction');
        },
      });
      await this.withinModal({
        selector: 'oppia-add-answer-group-modal-component',
        whenOpened: async _this => {
          await _this.clickOn('.e2e-test-add-list-entry');
          await _this.type(
            '.e2e-test-schema-based-list-editor-table-data input',
            't',
            {visible: true}
          );
          await _this.clickOn('.e2e-test-open-feedback-editor');
          await _this.type(
            '.e2e-test-add-response-details .e2e-test-rte',
            'Correct!',
            {visible: true}
          );
          await _this.clickOn('.e2e-test-editor-correctness-toggle');
          await _this.clickOn('.e2e-test-add-new-response');
        },
      });

      await this.clickOn('.e2e-test-default-response-tab');
      await this.page.waitForSelector('.e2e-test-response-body-default', {
        visible: true,
      });
      await this.clickOn(
        '.e2e-test-response-body-default ' +
          '.e2e-test-open-outcome-feedback-editor'
      );

      await this.page.waitForSelector(
        '.e2e-test-response-body-default .e2e-test-rte',
        {visible: true}
      );
      await this.page.type(
        '.e2e-test-response-body-default .e2e-test-rte',
        'Incorrect!'
      );
      await this.clickOn('.e2e-test-save-outcome-feedback');
      await this.page.waitForSelector(
        '.e2e-test-response-body-default .e2e-test-rte',
        {hidden: true}
      );

      await this.clickOn('.e2e-test-misconception-0-0-options');
      await this.clickOn('.e2e-test-mark-non-applicable-misconception-0-0', {
        visible: true,
      }),
        await this.page.waitForSelector(
          '.e2e-test-mark-non-applicable-misconception-0-0',
          {hidden: true}
        );

      await this.clickOn('.e2e-test-oppia-add-hint-button');
      await this.withinModal({
        selector: 'oppia-add-hint-modal',
        whenOpened: async _this => {
          await _this.type('.e2e-test-hint-text .e2e-test-rte', 'hint text');
          await _this.clickOn('.e2e-test-save-hint');
        },
      });

      await this.clickOn('.e2e-test-oppia-add-solution-button');
      await this.withinModal({
        selector: 'oppia-add-or-update-solution-modal',
        whenOpened: async _this => {
          await _this.type(
            'oppia-add-or-update-solution-modal .e2e-test-description-box',
            't'
          );
          await _this.clickOn('.e2e-test-submit-answer-button');
          await _this.type(
            '.e2e-test-explanation-textarea .e2e-test-rte',
            'Explanation',
            {visible: true}
          );
          await _this.clickOn('.e2e-test-submit-solution-button');
        },
      });

      await this.clickOn('.e2e-test-save-question-button:enabled');
      await this.page.waitForSelector('.e2e-test-create-question-progress', {
        hidden: true,
      });
    }
  }
}

export let SuperAdminFactory = (): SuperAdmin => new SuperAdmin();
