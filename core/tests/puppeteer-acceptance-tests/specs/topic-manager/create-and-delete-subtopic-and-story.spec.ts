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
 * @fileoverview Acceptance Test for the journey of a topic manager. The journey includes creating a subtopic, story, adding chapters to it, and deleting the story, subtopics and chapters.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {TopicManager} from '../../utilities/user/topic-manager';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Topic Manager', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let topicManager: TopicManager & CurriculumAdmin;
  let explorationId: string | null;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_Admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    explorationId =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'test exploration 1'
      );
    await curriculumAdmin.createTopic('Addition', 'add');

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Addition'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should create a topic, add a subtopic, story, and chapters to it.',
    async function () {
      await topicManager.navigateToTopicAndSkillsDashboardPage();
      await topicManager.createSubtopicForTopic(
        'Test Subtopic 1',
        'test-subtopic-one',
        'Addition'
      );
      // Verify the subtopic is present in the topic.
      await topicManager.verifySubtopicPresenceInTopic(
        'Test Subtopic 1',
        'Addition',
        true
      );

      await topicManager.addStoryToTopic(
        'Test Story 1',
        'test-story-one',
        'Addition'
      );

      await topicManager.addChapter('test chapter 1', explorationId as string);
      await topicManager.saveStoryDraft();

      // Verify the story is present in the topic.
      await topicManager.verifyStoryPresenceInTopic(
        'Test Story 1',
        'Addition',
        true
      );

      // Verify the chapter is present in the story.
      await topicManager.verifyChapterPresenceInStory(
        'Test Chapter 1',
        'Test Story 1',
        'Addition',
        true
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should delete a chapter from a story, delete the story from a topic, and delete the subtopic from a topic.',
    async function () {
      await topicManager.deleteChapterFromStory(
        'Test Chapter 1',
        'Test Story 1',
        'Addition'
      );
      // Verify the chapter is not present in the story.
      await topicManager.verifyChapterPresenceInStory(
        'Test Chapter 1',
        'Test Story 1',
        'Addition',
        false
      );

      await topicManager.deleteStoryFromTopic('Test Story 1', 'Addition');
      // Verify the story is not present in the topic.
      await topicManager.verifyStoryPresenceInTopic(
        'Test Story 1',
        'Addition',
        false
      );

      await topicManager.deleteSubtopicFromTopic('Test Subtopic 1', 'Addition');
      // Verify the subtopic is not present in the topic.
      await topicManager.verifySubtopicPresenceInTopic(
        'Test Subtopic 1',
        'Addition',
        false
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
