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
 * @fileoverview Acceptance Test for the journey of a topic manager. The journey includes creating a subtopic, story, adding chapters to it, publishing it, unpublishing and deleting a story, and deleting subtopics and chapters.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {TopicManager} from '../../utilities/user/topic-manager';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Topic Manager User Journey', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let topicManager: TopicManager;
  let explorationId: string | null;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdmin',
      'curriculum_Admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    curriculumAdmin.createTopic('Addition', 'add');

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Addition'
    );

    await curriculumAdmin.navigateToCreatorDashboardPage();
    await curriculumAdmin.navigateToExplorationEditorPage();
    await curriculumAdmin.dismissWelcomeModal();
    await curriculumAdmin.createMinimalExploration(
      'Test Exploration',
      'End Exploration'
    );
    await curriculumAdmin.saveExplorationDraft();
    explorationId = await curriculumAdmin.publishExplorationWithMetadata(
      'Test Exploration Title 1',
      'Test Exploration Goal',
      'Algebra'
    );
    if (!explorationId) {
      throw new Error('Error publishing exploration successfully.');
    }
  }, DEFAULT_SPEC_TIMEOUT_MSECS);
  it(
    'should create a topic, add a subtopic, story, and chapters to it.',
    async function () {
      await topicManager.navigateToTopicAndSkillsDashboardPage();
      await topicManager.createSubtopicForTopic(
        'Test Topic 1',
        'Test Subtopic 1',
        'test-subtopic-one'
      );
      // Verify the subtopic is present in the topic
      await topicManager.verifySubtopicPresenceInTopic(
        'Test Topic 1',
        'Test Subtopic 1',
        true
      );

      await topicManager.addStoryWithChapterToTopic(
        'Test Topic 1',
        'Test Story 1',
        '',
        ''
      );
      // Verify the chapter is present in the story
      await topicManager.verifyChapterPresenceInStory(
        'Test Topic 1',
        'Test Story 1',
        true
      );

      // Verify the story is present in the topic
      await topicManager.verifyStoryPresenceInTopic(
        'Test Topic 1',
        'Test Story 1',
        true
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should delete a chapter from a story, delete the story from a topic, and delete the subtopic from a topic.',
    async function () {
      await topicManager.deleteChapterFromStory('Test Topic 1', 'Test Story 1');
      // Verify the chapter is not present in the story
      await topicManager.verifyChapterPresenceInStory(
        'Test Topic 1',
        'Test Story 1',
        false
      );

      await topicManager.deleteStoryFromTopic('Test Topic 1', 'Test Story 1');
      // Verify the story is not present in the topic
      await topicManager.verifyStoryPresenceInTopic(
        'Test Topic 1',
        'Test Story 1',
        false
      );

      await topicManager.deleteSubtopicFromTopic(
        'Test Topic 1',
        'Test Subtopic 1'
      );
      // Verify the subtopic is not present in the topic
      await topicManager.verifySubtopicPresenceInTopic(
        'Test Topic 1',
        'Test Subtopic 1',
        false
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );
  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
