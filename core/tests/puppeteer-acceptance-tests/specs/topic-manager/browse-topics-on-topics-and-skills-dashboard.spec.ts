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
 * @fileoverview Acceptance Test for the journey of a topic manager. The journey includes filtering topics by status, classroom, and keyword, sorting topics, using the paginator, and opening an existing topic.
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

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createTopic('Addition', 'add');
    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createTopic('Subtraction', 'subtract');
    await curriculumAdmin.createNewClassroom('Math', 'math');

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Addition'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it('should filter topics, sort them, use the paginator, and open an existing topic.', async function () {
    const actions = [
      {
        action: () => topicManager.navigateToTopicAndSkillsDashboardPage(),
        name: 'navigateToTopicAndSkillsDashboardPage',
      },
      {
        action: () => topicManager.filterTopicsByStatus('Not Published'),
        name: 'filterTopicsByStatus_NotPublished',
      },
      {
        action: () =>
          topicManager.expectFilteredTopics(['Addition', 'Subtraction']),
        name: 'expectFilteredTopics_AdditionSubtraction',
      },
      {
        action: () => topicManager.filterTopicsByStatus('Published'),
        name: 'filterTopicsByStatus_Published',
      },
      {
        action: () => topicManager.expectFilteredTopics([]),
        name: 'expectFilteredTopics_Empty',
      },
      {
        action: () => topicManager.filterTopicsByClassroom('Math'),
        name: 'filterTopicsByClassroom_Math',
      },
      {
        action: () => topicManager.expectFilteredTopics([]),
        name: 'expectFilteredTopics_Empty',
      },
      {
        action: () => topicManager.filterItemsByKeyword('Addition'),
        name: 'filterTopicsByKeyword_Addition',
      },
      {
        action: () => topicManager.expectFilteredTopics(['Addition']),
        name: 'expectFilteredTopics_Addition',
      },
      {
        action: () => topicManager.sortItems('Least Recently Updated'),
        name: 'sortTopics_LeastRecentlyUpdated',
      },
      {
        action: () =>
          topicManager.expectTopicsInOrder(['Addition', 'Subtraction']),
        name: 'expectTopicsInOrder_AdditionSubtraction',
      },
      {
        action: () => topicManager.adjustPaginatorToShowItemsPerPage(15),
        name: 'adjustPaginatorToShowItemsPerPage_15',
      },
      {
        action: () =>
          topicManager.checkIfTopicPageChangesAfterClickingNext(false),
        name: 'checkIfPageChangesAfterClickingNext_false',
      },
      {action: () => topicManager.timeout(2147483647), name: 'timeout'},
    ];
    for (const {action, name} of actions) {
      try {
        await action();
      } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', error);
        await topicManager.screenshot(`error_${name}.png`);
      }
    }
  }, 2147483647);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
