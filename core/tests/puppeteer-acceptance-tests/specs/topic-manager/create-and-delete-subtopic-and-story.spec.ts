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
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

// TODO(#20829): Console error "Cannot read properties of undefined (reading 'getStory')" on navigation or reload in Story Editor. Since this error is getting triggered on navigation only, it is causing "Execution context destroyed error". So, creating and switching to a new tab to avoid this error. Please remove the statement below that creates and switches to new tab and this errorToIgnore below.
const errorsToIgnore = [
  /Cannot read properties of undefined \(reading 'storyEditorStalenessDetectionService'\)/,
];

ConsoleReporter.setConsoleErrorsToIgnore(errorsToIgnore);

describe('Topic Manager', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let topicManager: TopicManager & CurriculumAdmin;
  let explorationId1: string | null;
  let explorationId2: string | null;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_Admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    explorationId1 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'test exploration 1'
      );
    explorationId2 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'test exploration 2'
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
      // Creating 2 chapter in the story so that we can test delete the second one (cannot delete the first chapter).
      await topicManager.addChapter('Test Chapter 1', explorationId1 as string);
      await topicManager.addChapter('Test Chapter 2', explorationId2 as string);
      await topicManager.saveStoryDraft();

      // Verify the story is present in the topic.
      await topicManager.createAndSwitchToNewTab();
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
      await topicManager.createAndSwitchToNewTab();

      // Deleting 2nd chapter since topic manager cannot delete the first chapter.
      await topicManager.deleteChapterFromStory(
        'Test Chapter 2',
        'Test Story 1',
        'Addition'
      );
      await topicManager.saveStoryDraft();

      await topicManager.createAndSwitchToNewTab();
      await topicManager.verifyChapterPresenceInStory(
        'Test Chapter 2',
        'Test Story 1',
        'Addition',
        false
      );

      await topicManager.createAndSwitchToNewTab();
      await topicManager.deleteStoryFromTopic('Test Story 1', 'Addition');
      await topicManager.saveTopicDraft('Addition');
      await topicManager.verifyStoryPresenceInTopic(
        'Test Story 1',
        'Addition',
        false
      );

      await topicManager.deleteSubtopicFromTopic('Test Subtopic 1', 'Addition');
      await topicManager.saveTopicDraft('Addition');
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
