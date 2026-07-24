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
 * @fileoverview Acceptance test for story editor adventures (arcs).
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
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
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

    await curriculumAdmin.addStoryToTopic(
      'The Adventure Story',
      'the-adventure-story',
      'Adventure Topic'
    );

    for (let i = 0; i < CHAPTER_TITLES.length; i++) {
      await curriculumAdmin.addChapter(`Chapter ${i + 1}`, explorationIds[i]);
    }

    await curriculumAdmin.saveStoryDraft();
  }, 2100000);

  it(
    'should create adventures by splitting after chapters 3, 7, and 10',
    async function () {
      await curriculumAdmin.expectAllChaptersInSingleAdventure(CHAPTER_TITLES);

      await curriculumAdmin.expectScreenshotToMatch(
        'storyEditorAllChaptersInSingleAdventure',
        __dirname
      );

      await curriculumAdmin.splitIntoAdventure('Chapter 3');
      await curriculumAdmin.expectAdventureCount(2);
      await curriculumAdmin.expectAdventureHeaderToBeVisible('All Chapters');

      await curriculumAdmin.expectScreenshotToMatch(
        'storyEditorAfterSplitAtChapter3',
        __dirname
      );

      await curriculumAdmin.splitIntoAdventure('Chapter 7');
      await curriculumAdmin.expectAdventureCount(3);

      await curriculumAdmin.expectScreenshotToMatch(
        'storyEditorAfterSplitAtChapter7',
        __dirname
      );

      await curriculumAdmin.splitIntoAdventure('Chapter 10');
      await curriculumAdmin.expectAdventureCount(4);

      await curriculumAdmin.expectScreenshotToMatch(
        'storyEditorAfterSplitAtChapter10',
        __dirname
      );

      await curriculumAdmin.expectChaptersOrderToBe(CHAPTER_TITLES);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should edit an adventure metadata',
    async function () {
      await curriculumAdmin.editAdventure(
        'Part Two',
        'The second part of the story'
      );

      await curriculumAdmin.expectAdventureToHave(
        'Part Two',
        'The second part of the story'
      );

      await curriculumAdmin.expectAdventureHeaderToBeVisible('All Chapters');

      await curriculumAdmin.expectScreenshotToMatch(
        'storyEditorAfterEditingAdventureMetadata',
        __dirname
      );

      await curriculumAdmin.expectChaptersOrderToBe(CHAPTER_TITLES);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should remove an adventure boundary',
    async function () {
      await curriculumAdmin.removeAdventureBoundary();
      await curriculumAdmin.expectAdventureCount(3);

      await curriculumAdmin.expectScreenshotToMatch(
        'storyEditorAfterRemovingAdventureBoundary',
        __dirname
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should persist adventure groupings after save and reload',
    async function () {
      await curriculumAdmin.saveStoryDraft();

      await curriculumAdmin.openStoryEditor(
        'The Adventure Story',
        'Adventure Topic'
      );

      await curriculumAdmin.expectAdventureCount(3);

      await curriculumAdmin.expectChaptersOrderToBe(CHAPTER_TITLES);

      await curriculumAdmin.expectAdventureHeaderToBeVisible('All Chapters');

      await curriculumAdmin.expectScreenshotToMatch(
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
