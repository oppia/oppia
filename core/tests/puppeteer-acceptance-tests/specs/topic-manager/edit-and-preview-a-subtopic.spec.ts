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
 * @fileoverview Acceptance Test for the journey of a topic manager. The journey includes adding a sub-topic to a topic, assigning skills to a sub-topic, changing the assignments and re-publishing the topic, opening an existing sub-topic, modifying its data and publishing it again, and previewing the sub-topic in the preview tab.
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
    curriculumAdmin.createSkillForTopic('Addition', 'Test Skill 1');

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      ['Addition']
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should add a sub-topic to a topic, assign skills to the sub-topic, change the assignments and re-publish the topic, open an existing sub-topic, modify its data and publish it again, and preview the sub-topic in the preview tab.',
    async function () {
      await topicManager.navigateToTopicDashboardPage();
      await topicManager.createSubtopicForTopic('Sub-Topic 1', 'Addition', '');
      await topicManager.createSkillForTopic('Addition', 'Test Skill 2')
      await topicManager.assignSkillToSubtopicInTopicEditor('Sub-Topic 1', '', '')

      await topicManager.changeAssignments();
      await topicManager.openExistingSubTopic('Sub-Topic 1');
      await topicManager.editSubTopicData(
        'Sub-Topic 1',
        'Updated Sub-Topic 1'
      );

      await topicManager.saveSubTopicChanges();
      await topicManager.navigateToSubtopicPreviewTab('Sub-Topic 1');
      await topicManager.expectPreviewSubtopicToMatchData(
        title: 'Updated Sub-Topic 1',
        skillDescription: 'Test Skill 2'
      );

    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
