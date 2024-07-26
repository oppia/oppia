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

describe('Topic Manager', function () {
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
    await curriculumAdmin.addTopicToClassroom('Math', 'Addition');

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Addition'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to filter topics, sort them, use the paginator, and open an existing topic.',
    async function () {
      await topicManager.navigateToTopicAndSkillsDashboardPage(),
        await topicManager.filterTopicsByStatus('Not Published'),
        await topicManager.expectFilteredTopics(['Addition', 'Subtraction']),
        await topicManager.filterTopicsByStatus('Published'),
        // No topics are published in the setup.
        await topicManager.expectFilteredTopics([]),
        await topicManager.filterTopicsByClassroom('Math'),
        await topicManager.expectFilteredTopics(['Addition']),
        await topicManager.filterTopicsByKeyword('Addition'),
        await topicManager.expectFilteredTopics(['Addition']),
        await topicManager.sortTopics('Least Recently Updated'),
        await topicManager.expectFilteredTopicsInOrder([
          'Addition',
          'Subtraction',
        ]),
        await topicManager.adjustPaginatorToShowItemsPerPage(15),
        await topicManager.checkIfTopicPageChangesAfterClickingNext(false);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
