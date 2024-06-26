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
 * @fileoverview Acceptance Test for the journey of a topic manager. The journey includes editing skill description and concept card explanation, adding and deleting worked examples, adding and deleting misconceptions, managing prerequisite skills, editing rubrics, and publishing the topic again.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {TopicManager} from '../../utilities/user/topic-manager';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Topic Manager User Journey', function () {
  let topicManager: TopicManager;
  let curriculumAdmin: CurriculumAdmin;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_Admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    curriculumAdmin.createTopic('Addition', 'add');
    curriculumAdmin.createSkillForTopic('Skill 1', 'Addition');

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Addition'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to edit skill description and concept card explanation, add and delete worked examples, add and delete misconceptions, manage prerequisite skills, edit rubrics, and publish the topic again.',
    async function () {
      // Navigate to the topic and skills dashboard page
      await topicManager.navigateToTopicAndSkillsDashboardPage();
      await topicManager.openSkillEditor('Skill 1');

      // Make all the changes
      await topicManager.addWorkedExample(
        'Worked Example 1',
        'Worked Example Explanation'
      );
      await topicManager.deleteWorkedExample('Worked Example 1');
      await topicManager.addMisconception(
        'Misconception 1',
        'Misconception Explanation',
        'Misconception Notes'
      );
      await topicManager.deleteMisconception('Misconception 1');
      await topicManager.addPrerequisiteSkill('Prerequisite Skill 1');
      await topicManager.removePrerequisiteSkill('Prerequisite Skill 1');
      await topicManager.updateRubric('New Rubric');

      // Save the changes
      await topicManager.publishUpdatedSkill();

      // Verify the changes
      await topicManager.openSkillEditor();
      await topicManager.verifyWorkedExamplePresent('Worked Example 1', false);
      await topicManager.verifyMisconceptionPresent('Misconception 1', false);
      await topicManager.verifyPrerequisiteSkillPresent(
        'Prerequisite Skill 1',
        false
      );
      await topicManager.expectRubricToMatch('New Rubric');

      // Preview the concept card
      await topicManager.previewConceptCard('New Concept Card Explanation');
      await topicManager.expectConceptCardPreviewToMatch(
        'title',
        'New Concept Card Explanation'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
