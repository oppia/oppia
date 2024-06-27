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

describe('Topic Manager User Journey', function () {
  let topicManager: TopicManager & CurriculumAdmin;
  let curriculumAdmin: CurriculumAdmin;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_Admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    curriculumAdmin.createTopic('Addition', 'add');
    curriculumAdmin.createSkillForTopic('Skill 1', 'Addition');
    curriculumAdmin.createSkillForTopic('skill 2', 'Addition');

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Addition'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to open question editor, edit a question, manage skill associations, create and delete questions, and preview a question.',
    async function () {
      await topicManager.navigateToTopicAndSkillsDashboardPage();
      await topicManager.openSkillEditor('Skill Name');
      await topicManager.navigateToQuestionEditorTab();

      await topicManager.createQuestionsForSkill('Skill Name', 1);
      await topicManager.expectToastMeassageToBe(
        'Question created successfully.'
      );

      await topicManager.navigateToQuestionPreviewTab();
      await topicManager.previewQuestion('Question Text');
      await topicManager.expectPreviewQuestionText('Question Text');
      await topicManager.expectPreviewInteractionType('Multiple Choice');

      await topicManager.navigateToQuestionEditorTab();
      await topicManager.deleteQuestion('Question Text');
      await topicManager.expectToastMeassageToBe(
        'Question deleted successfully.'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
