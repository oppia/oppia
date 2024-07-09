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
 * @fileoverview Acceptance Test for the journey of a topic manager to edit topic details, manage practice tab visibility, and preview lesson, practice, and revision.
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

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      ['Addition']
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to edit topic name, thumbnail, description, page title fragment for web, and meta tags, enable or disable the practice tab to learners, and preview lesson, practice, and revision in the topic preview.',
    async function () {
      await topicManager.navigateToTopicDashboardPage();
      await topicManager.openTopicEditor('Topic 1');
      await topicManager.editTopicDetails('Topic 1', {
        name: 'Updated Topic 1',
        thumbnail: 'updated_thumbnail.png',
        description: 'Updated description',
        pageTitleFragment: 'Updated Page Title Fragment',
        metaTags: 'updated, meta, tags',
      });

      await topicManager.saveTopicDraft('Topic 1');
      await topicManager.verifyStatusOfPracticeTab('disabled');
      await topicManager.previewLessonInTopicPreview('Topic 1');
      await topicManager.previewPracticeInTopicPreview('Topic 1');
      await topicManager.previewRevisionInTopicPreview('Topic 1');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
