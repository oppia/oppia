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
 * @fileoverview Acceptance Test for the journey of a topic manager. The journey includes filtering skills by status, classroom, and keyword, sorting skills, using the paginator, and opening an existing skill.
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

    await curriculumAdmin.createTopic('Mathematics', 'math');
    await curriculumAdmin.createSkillForTopic('Subtraction', 'Mathematics');
    await curriculumAdmin.createSkillForTopic('Multiplication', 'Mathematics');

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Mathematics'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to filter skills, sort them, use the paginator, and open an existing skill.',
    async function () {
      await topicManager.navigateToTopicAndSkillsDashboardPage();

      await topicManager.filterSkillsByStatus('Unassigned');
      // All the skills are already assigned as they were created for the topic in the setup.
      await topicManager.expectFilteredSkills([]);

      await topicManager.filterSkillsByStatus('Assigned');
      await topicManager.expectFilteredSkills([
        'Multiplication',
        'Subtraction',
      ]);

      await topicManager.filterSkillsByKeyword('Multiplication');
      await topicManager.expectFilteredSkills(['Multiplication']);

      await topicManager.sortSkills('Least Recently Updated');
      await topicManager.expectSkillsInOrder(['Subtraction', 'Multiplication']);

      await topicManager.adjustPaginatorToShowItemsPerPage(15);
      await topicManager.checkIfSkillPageChangesAfterClickingNext(false);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
