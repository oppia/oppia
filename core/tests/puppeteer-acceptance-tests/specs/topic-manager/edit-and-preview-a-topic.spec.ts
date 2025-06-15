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
 * @fileoverview Acceptance Test for the journey of a topic manager to edit topic details, manage practice tab visibility, and preview lesson.
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
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    await curriculumAdmin.createTopic('Mathematics', 'math');

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topicManager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Mathematics'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to edit topic name, thumbnail, description, page title fragment for web, and meta tags, and preview lesson in the topic preview.',
    async function () {
      await topicManager.openTopicEditor('Mathematics');

      // Topic Manager cannot edit the name and url Fragment of a topic (Curriculum Admin can do that).
      await topicManager.editTopicDetails(
        'A comprehensive course on advanced mathematics',
        'mathematics, advanced, course',
        'Advanced Mathematics Course',
        testConstants.data.curriculumAdminThumbnailImage
      );

      await topicManager.verifyStatusOfPracticeTab('disabled');
      await topicManager.saveTopicDraft('Mathematics');

      if (process.env.MOBILE === 'true') {
        // TODO(20665): Resolve the issue of inconsistent topic preview navigation between desktop and mobile modes.
        // Once the issue is resolved, remove the following line to allow the flow to check the preview tab in mobile viewport.
        // Refer to the issue: [https://github.com/oppia/oppia/issues/20665]
        return;
      }
      await topicManager.navigateToTopicPreviewTab('Mathematics');
      await topicManager.expectTopicPreviewToHaveTitleAndDescription(
        'Mathematics',
        'A comprehensive course on advanced mathematics'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
