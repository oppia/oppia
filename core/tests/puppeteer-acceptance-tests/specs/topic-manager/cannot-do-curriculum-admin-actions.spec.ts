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
 * @fileoverview Acceptance Test for the journey of a topic manager. The journey includes the inability to edit topics and stories not owned, create and delete topics and skills, add a skill as a diagnostic test skill for a topic, and access the classroom-admin page.
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
      'curriculum_Admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    curriculumAdmin.createTopic('Addition', 'add');
    curriculumAdmin.createSkillForTopic('Single Digit Addition', 'Addition');

    curriculumAdmin.createTopic('Subtraction', 'subtract');
    curriculumAdmin.createSkillForTopic(
      'Single Digit Subtraction',
      'Subtraction'
    );

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Addition'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should not be able to edit topics and stories not owned.',
    async function () {
      // Try to edit a topic not owned.
      await topicManager.navigateToTopicAndSkillsDashboardPage();

      // Topic subtraction is not owned as the topic manager is only assigned with "Addition" topic.
      await topicManager.openTopicEditor('Subtraction');
      await topicManager.expectTopicNameFieldDisabled();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not be able to create and delete topics and skills.',
    async function () {
      // Try to create a new topic.
      await topicManager.navigateToTopicAndSkillsDashboardPage();
      await topicManager.expectCreateTopicButtonNotPresent();

      // Try to delete a owned topic.
      await topicManager.navigateToTopicAndSkillsDashboardPage();
      await topicManager.verifyAbsenceOfDeleteTopicButtonInTopic('Addition');

      // Try to create a new skill.
      await topicManager.navigateToTopicAndSkillsDashboardPage();
      await topicManager.navigateToSkillsTab();
      await topicManager.expectCreateSkillButtonNotPresent();

      // Try to delete a owned skill.
      await topicManager.navigateToTopicAndSkillsDashboardPage();
      await topicManager.navigateToSkillsTab();
      await topicManager.verifyAbsenceOfDeleteSkillButtonInTopic(
        'Single Digit Addition'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not be able to access the classroom-admin page.',
    async function () {
      // Try to access the classroom-admin page.
      await topicManager.navigateToClassroomAdminPage();
      await topicManager.expectError401Unauthorized();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
