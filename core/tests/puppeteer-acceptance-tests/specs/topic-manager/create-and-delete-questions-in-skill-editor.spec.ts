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

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;
const questionText = 'Add 1+2';

describe('Topic Manager', function () {
  let topicManager: TopicManager & CurriculumAdmin;
  let curriculumAdmin: CurriculumAdmin;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createTopic('Mathematics', 'math');
    await curriculumAdmin.createSkillForTopic('Addition', 'Mathematics');

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Mathematics'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to open question editor, edit a question, manage linking and unlinking skills with the questions, create and delete questions, and preview a question.',
    async function () {
      // TODO(#20590): Once the issue is resolved, please ensure to add a check for
      // this scenario (linking and unlinking a skill to a question) in the acceptance test.
      // See: https://github.com/oppia/oppia/issues/20590
      await topicManager.navigateToTopicAndSkillsDashboardPage();

      await topicManager.openSkillEditor('Addition');
      await topicManager.navigateToSkillQuestionEditorTab();

      await topicManager.createQuestionsForSkill('Addition', 1);
      await topicManager.expectToastMessageToBe(
        'Question created successfully.'
      );

      await topicManager.navigateToQuestionPreviewTab();
      await topicManager.previewQuestion(questionText);
      await topicManager.expectPreviewQuestionText(questionText);
      await topicManager.expectPreviewInteractionType('Numeric Input');

      await topicManager.navigateToSkillQuestionEditorTab();
      await topicManager.deleteQuestion(questionText);
      await topicManager.expectToastMessageToBe('Question Removed');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
