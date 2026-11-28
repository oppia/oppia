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
 * @fileoverview Acceptance Test for the journey of a topic manager. The journey
 * includes the inability to edit topics and stories not owned, create and
 * delete topics and skills, and access the classroom-admin page.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {TopicManager} from '../../utilities/user/topic-manager';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const ROLES = testConstants.Roles;

test.describe.configure({mode: 'serial'});

test.describe('Topic Manager', function () {
  let topicManager: TopicManager & LoggedInUser;
  let curriculumAdmin: CurriculumAdmin;
  let storyID: string;

  test.beforeAll(async function ({browser}) {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_Admin@example.com',
      browser,
      [ROLES.CURRICULUM_ADMIN]
    );

    await curriculumAdmin.createTopic('Addition', 'add', true);
    await curriculumAdmin.createSkillForTopic(
      'Single Digit Addition',
      'Addition',
      false
    );

    await curriculumAdmin.createTopic('Subtraction', 'subtract');
    storyID = await curriculumAdmin.addStoryToTopic(
      'Subtraction Story',
      'story',
      'Subtraction'
    );

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      browser,
      [ROLES.TOPIC_MANAGER],
      'Addition'
    );
  });

  test('should not be able to edit topics and stories not owned', async function () {
    await topicManager.navigateToTopicsAndSkillsDashboardPageAsTopicManager();

    await topicManager.openTopicEditor('Subtraction');
    // Topic "Subtraction" is not owned by the topic manager as it is not assigned to them during setup.
    await topicManager.expectTopicNameFieldDisabled();

    await topicManager.openStoryEditorWithId(storyID);
    // Story "Subtraction Story" belongs to the topic "Subtraction" which is not owned by the topic manager.
    await topicManager.expectErrorPage(401);
  });

  test('should not be able to create and delete topics and skills', async function () {
    await topicManager.navigateToTopicsAndSkillsDashboardPageAsTopicManager();

    await topicManager.expectCreateTopicButtonNotPresent();
    await topicManager.verifyAbsenceOfDeleteTopicButtonInTopic('Addition');

    await topicManager.navigateToSkillsTab();

    await topicManager.expectCreateSkillButtonNotPresent();
    await topicManager.verifyAbsenceOfDeleteSkillButtonInSkill(
      'Single Digit Addition'
    );
  });

  test('should not be able to access the classroom-admin page', async function () {
    await topicManager.navigateToClassroomAdminPage();
    await topicManager.expectErrorPage(401);
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
