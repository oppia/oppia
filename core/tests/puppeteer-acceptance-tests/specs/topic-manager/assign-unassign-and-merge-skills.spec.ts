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
 * @fileoverview Acceptance Test for the journey of a topic manager. The journey includes assigning and unassigning a skill to a topic, merging two skills and using filters to select a skill for merging.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {TopicManager} from '../../utilities/user/topic-manager';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Topic Manager', function () {
  let topicManager: TopicManager;
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
    await curriculumAdmin.createSkillForTopic('Subtraction', 'Mathematics');

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Mathematics'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to assign and unassign a skill to a topic and merge skills',
    async function () {
      await topicManager.navigateToTopicAndSkillsDashboardPage();
      await topicManager.navigateToSkillsTab();

      // The skill is unassigned first because it was previously assigned during the setup phase in the beforeAll block.
      await topicManager.unassignSkillFromTopic('Addition', 'Mathematics');
      await topicManager.expectToastMessageToBe(
        'The skill has been unassigned to the topic.'
      );

      await topicManager.assignSkillToTopic('Addition', 'Mathematics');
      await topicManager.expectToastMessageToBe(
        'The skill has been assigned to the topic.'
      );

      // Unassigning the skill from the topic because two skills assigned to some topic cannot be merged.
      await topicManager.unassignSkillFromTopic('Subtraction', 'Mathematics');
      await topicManager.expectToastMessageToBe(
        'The skill has been unassigned to the topic.'
      );

      await topicManager.mergeSkills('Addition', 'Subtraction');
      await topicManager.expectToastMessageToBe('Merged Skills.');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
