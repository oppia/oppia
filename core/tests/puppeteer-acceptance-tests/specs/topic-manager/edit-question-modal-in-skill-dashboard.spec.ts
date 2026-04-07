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
 * @fileoverview Acceptance tests for question editor modal flow.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {TopicManager} from '../../utilities/user/topic-manager';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Question Editor Modal', function () {
  let topicManager: TopicManager & CurriculumAdmin & ExplorationEditor;

  beforeAll(async function () {
    topicManager = await UserFactory.createNewUser(
      'topicManagerQE',
      'topicManagerQE@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Create a topic and skills to test question linkages.
    await topicManager.navigateToTopicAndSkillsDashboardPage();
    await topicManager.createTopic('QuestEditor Topic', 'QuestEditorTopic');

    await topicManager.createSkillForTopic('QEM Skill 1', 'QuestEditor Topic');
    await topicManager.createSkillForTopic('QEM Skill 2', 'QuestEditor Topic');
    await topicManager.createSkillForTopic('QEM Skill 3', 'QuestEditor Topic');

    // Create one question in Skill 1.
    await topicManager.createQuestionsForSkill('QEM Skill 1', 1);
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should show commit modal when editing question content only',
    async function () {
      await topicManager.openSkillEditor('QEM Skill 1');
      await topicManager.navigateToSkillQuestionEditorTab();
      await topicManager.openQuestionEditor('Add 1+2');

      // Edit content ONLY.
      await topicManager.updateCardContent('Add 2+3');
      await topicManager.saveQuestionAndExpectCommitModal(
        'Edited the question content.'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not show commit modal when editing question skill linkage only',
    async function () {
      await topicManager.openSkillEditor('QEM Skill 1');
      await topicManager.navigateToSkillQuestionEditorTab();
      await topicManager.openQuestionEditor('Add 2+3');

      // Edit linkage ONLY - skill linkage is auto-saved without commit modal.
      await topicManager.linkAnotherSkillToQuestion('QEM Skill 2');
      // Verify skill linkage was auto-saved (save button should be disabled)
      await topicManager.expectSaveQuestionButtonDisabled();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show commit modal when editing both content and skill linkage',
    async function () {
      await topicManager.openSkillEditor('QEM Skill 1');
      await topicManager.navigateToSkillQuestionEditorTab();
      // The question content is now 'Add 2+3' and it links to Skill 1 and 2.
      await topicManager.openQuestionEditor('Add 2+3');

      // Edit linkage AND content.
      await topicManager.updateCardContent('Add 4+5');
      await topicManager.linkAnotherSkillToQuestion('QEM Skill 3');
      await topicManager.saveQuestionAndExpectCommitModal(
        'Edited both content and linkage.'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
