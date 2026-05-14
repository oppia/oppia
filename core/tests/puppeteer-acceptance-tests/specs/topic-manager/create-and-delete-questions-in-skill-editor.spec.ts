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
 * @fileoverview Acceptance Test for the journey of a topic manager. The journey includes opening the question editor for a selected skill, editing a question that includes an image, associating and disassociating skills with the question, creating questions for a skill using the skill editor page, deleting the question, and previewing a question.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {TopicManager} from '../../utilities/user/topic-manager';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;
const questionText = 'Add 1+2';

describe('Topic Manager', function () {
  let topicManager: TopicManager & CurriculumAdmin & ExplorationEditor;
  let curriculumAdmin: CurriculumAdmin;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createTopic(
      'Arithmetic Operations',
      'arithmetic-ops'
    );
    await curriculumAdmin.createSkillForTopic(
      'Addition 101',
      'Arithmetic Operations',
      false
    );
    await curriculumAdmin.createSkillForTopic(
      'Subtraction 101',
      'Arithmetic Operations',
      false
    );

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Arithmetic Operations'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to open question editor, edit a question, manage linking and unlinking skills with the questions, create and delete questions, and preview a question.',
    async function () {
      await topicManager.navigateToTopicAndSkillsDashboardPage();

      await topicManager.openSkillEditor('Addition 101');
      await topicManager.navigateToSkillQuestionEditorTab();

      await topicManager.createQuestionsForSkill('Addition 101', 1);
      await topicManager.expectToastMessageToBe(
        'Question created successfully.'
      );

      await topicManager.navigateToQuestionPreviewTab();
      await topicManager.previewQuestion(questionText);
      await topicManager.expectPreviewQuestionText(questionText);
      await topicManager.expectPreviewInteractionType('Numeric Input');

      await topicManager.navigateToSkillQuestionEditorTab();

      // TM.4: Manage complex skill linkages and optimized commit modal flow.
      await topicManager.openQuestionEditor(questionText);

      // Row 1: Link "Subtraction 101". Should NOT show commit modal (auto-saved).
      await topicManager.linkAnotherSkillToQuestion('Subtraction 101');
      await topicManager.expectSaveQuestionButtonDisabled();

      // Row 2: Edit content text. Should TRIGGERS the Commit Modal.
      await topicManager.updateCardContent('Add 4+5');
      // Row 3: Click "Save" (corresponds to "Confirm" in spreadsheet).
      await topicManager.saveQuestionAndExpectCommitModal(
        'Updated question content.'
      );

      // Verify the updated question "Add 4+5" is visible in the list.
      await topicManager.expectQuestionToBeVisible('Add 4+5');

      // TM.4 Row 4: Delete the question via the trash icon in the question list.
      // After the commit modal (Row 3), the editor closes and we are back on
      // the question list. Click the trash icon, confirm the warning modal.
      await topicManager.deleteQuestion('Add 4+5');
      await topicManager.expectToastMessageToBe('Question Removed');
      await topicManager.expectQuestionToNotBeVisible('Add 4+5');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
