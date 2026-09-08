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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1mDDP9joYRWjYExWghmPcqV4RTut6BOMqqUHOkxL_npI/edit?tab=t.4t336fwwj9ly
 *
 * TM.SA Manage story adventures in the story editor.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const CHAPTER_TITLES = Array.from({length: 11}, (_, i) => `Chapter ${i + 1}`);

describe('Topic Manager', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let topicManager: TopicManager & CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  const explorationIds: string[] = [];

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_adm@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseAdm',
      'release_adm@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag('story_editor_arcs');
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    for (let i = 0; i < 11; i++) {
      const id = await curriculumAdmin.createAndPublishExplorationWithCards(
        `Exploration ${i + 1}`,
        'Mathematics'
      );
      explorationIds.push(id);
    }

    await curriculumAdmin.createAndPublishTopic(
      'Adventure Topic',
      'adventure-topic',
      'Adventure Topic'
    );
    await curriculumAdmin.createAndPublishClassroom(
      'Maths',
      'maths',
      'Adventure Topic'
    );

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Adventure Topic'
    );

    await curriculumAdmin.addStoryToTopic(
      'The Adventure Story',
      'the-adventure-story',
      'Adventure Topic'
    );

    for (let i = 0; i < CHAPTER_TITLES.length; i++) {
      await curriculumAdmin.addChapter(`Chapter ${i + 1}`, explorationIds[i]);
    }

    await curriculumAdmin.saveStoryDraft();
    // TODO(#27082): Reduce the setup time for this spec while migrating to
    // Playwright. The 45-minute timeout is needed because the beforeAll hook
    // creates 11 published explorations, a topic, a classroom, and an
    // 11-chapter story, which can take 30+ minutes on slow CI runners.
  }, 2700000);

  it(
    'should create a new adventure from existing chapters',
    async function () {
      await topicManager.openStoryEditor(
        'The Adventure Story',
        'Adventure Topic'
      );

      await topicManager.expectAllChaptersInSingleAdventure(CHAPTER_TITLES);

      await topicManager.scrollToTopOfPage();

      await topicManager.expectScreenshotToMatch(
        'storyEditorAllChaptersInSingleAdventure',
        __dirname
      );

      await topicManager.splitIntoAdventure('Chapter 3');
      await topicManager.expectAdventureCount(2);
      await topicManager.expectAdventureHeaderToBeVisible('Module 2');

      await topicManager.scrollToTopOfPage();

      await topicManager.expectScreenshotToMatch(
        'storyEditorAfterSplitAtChapter3',
        __dirname
      );

      await topicManager.expectChaptersOrderToBe(CHAPTER_TITLES);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should edit an adventure metadata',
    async function () {
      await topicManager.fillEditAdventureModal(
        'Part Two',
        'The second part of the story'
      );

      await topicManager.expectScreenshotToMatch(
        'storyEditorEditAdventureModal',
        __dirname
      );

      await topicManager.saveEditAdventureModal();

      await topicManager.expectAdventureToHave(
        'Part Two',
        'The second part of the story'
      );

      await topicManager.scrollToTopOfPage();

      await topicManager.expectScreenshotToMatch(
        'storyEditorAfterEditingAdventureMetadata',
        __dirname
      );

      await topicManager.saveStoryDraft();

      await topicManager.openStoryEditor(
        'The Adventure Story',
        'Adventure Topic'
      );

      await topicManager.expectAdventureToHave(
        'Part Two',
        'The second part of the story'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should remove an adventure boundary',
    async function () {
      await topicManager.removeAdventureBoundary();
      await topicManager.expectAdventureCount(1);

      await topicManager.splitIntoAdventure('Chapter 7');
      await topicManager.expectAdventureCount(2);

      await topicManager.removeAdventureBoundary();
      await topicManager.expectAdventureCount(1);

      await topicManager.closeStoryEditorMobileNavbarOptions();

      await topicManager.scrollToTopOfPage();

      await topicManager.expectScreenshotToMatch(
        'storyEditorAfterRemovingAdventureBoundary',
        __dirname
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should save changes in the story with adventure groupings',
    async function () {
      await topicManager.splitIntoAdventure('Chapter 7');
      await topicManager.expectAdventureCount(2);

      await topicManager.saveStoryDraft();

      await topicManager.openStoryEditor(
        'The Adventure Story',
        'Adventure Topic'
      );

      await topicManager.expectAdventureCount(2);

      await topicManager.expectScreenshotToMatch(
        'storyEditorAfterReloadPersistedGroupings',
        __dirname
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
