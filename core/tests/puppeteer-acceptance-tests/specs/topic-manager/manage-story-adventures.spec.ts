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
 *
 * TM.CUJ-ADVENTURE.1  Create a new adventure from existing chapters.
 * TM.CUJ-ADVENTURE.2  Edit an adventure's metadata.
 * TM.CUJ-ADVENTURE.3  Remove an adventure boundary.
 * TM.CUJ-ADVENTURE.4  Reorder chapters within adventure groupings.
 * TM.CUJ-ADVENTURE.5  Save changes in the story with adventure groupings.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

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

    // Enable the story editor arcs feature flag.
    await releaseCoordinator.enableFeatureFlag('story_editor_arcs');
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    // Create five explorations for the story chapters.
    for (let i = 0; i < 5; i++) {
      const id = await curriculumAdmin.createAndPublishExplorationWithCards(
        `Exploration ${i + 1}`,
        'Mathematics'
      );
      explorationIds.push(id);
    }

    // Create topic and classroom.
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

    // Create a story with five chapters.
    await curriculumAdmin.addStoryToTopic(
      'The Adventure Story',
      'the-adventure-story',
      'Adventure Topic'
    );

    for (let i = 0; i < 5; i++) {
      await curriculumAdmin.addChapter(`Chapter ${i + 1}`, explorationIds[i]);
    }

    await curriculumAdmin.saveStoryDraft();
  }, 600000);

  it(
    'should create a new adventure from existing chapters',
    async function () {
      // Initially all chapters should be in the default "All Chapters"
      // adventure.
      await curriculumAdmin.expectAllChaptersInSingleAdventure([
        'Chapter 1',
        'Chapter 2',
        'Chapter 3',
        'Chapter 4',
        'Chapter 5',
      ]);

      // Split after Chapter 2 to create a new adventure starting at
      // Chapter 3.
      await curriculumAdmin.splitIntoAdventure('Chapter 2');

      // Verify a new adventure boundary was created.
      await curriculumAdmin.expectAdventureCount(2);
      await curriculumAdmin.expectAdventureHeaderToBeVisible('All Chapters');

      // Chapter order must remain unchanged.
      await curriculumAdmin.expectChaptersOrderToBe([
        'Chapter 1',
        'Chapter 2',
        'Chapter 3',
        'Chapter 4',
        'Chapter 5',
      ]);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should edit an adventure metadata',
    async function () {
      // Edit the second (non-default) adventure.
      await curriculumAdmin.editAdventure(
        'Part Two',
        'The second part of the story'
      );

      // Verify the updated title and description are displayed.
      await curriculumAdmin.expectAdventureToHave(
        'Part Two',
        'The second part of the story'
      );

      // The default adventure should still be visible.
      await curriculumAdmin.expectAdventureHeaderToBeVisible('All Chapters');

      // Chapter order must remain unchanged.
      await curriculumAdmin.expectChaptersOrderToBe([
        'Chapter 1',
        'Chapter 2',
        'Chapter 3',
        'Chapter 4',
        'Chapter 5',
      ]);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should remove an adventure boundary',
    async function () {
      // Remove the second adventure boundary.
      await curriculumAdmin.removeAdventureBoundary();

      // All chapters should be merged back into the single default
      // adventure.
      await curriculumAdmin.expectAllChaptersInSingleAdventure([
        'Chapter 1',
        'Chapter 2',
        'Chapter 3',
        'Chapter 4',
        'Chapter 5',
      ]);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should reorder chapters within adventure groupings',
    async function () {
      // Create two adventures: All Chapters [1,2,3] and Arc 2 [4,5].
      await curriculumAdmin.splitIntoAdventure('Chapter 3');
      await curriculumAdmin.expectAdventureCount(2);

      // Reorder chapters within the first adventure (swap Ch 1 and Ch 2).
      await curriculumAdmin.reorderChapters('Chapter 1', 'Chapter 2');
      await curriculumAdmin.expectChaptersOrderToBe([
        'Chapter 2',
        'Chapter 1',
        'Chapter 3',
        'Chapter 4',
        'Chapter 5',
      ]);

      // Save the story.
      await curriculumAdmin.saveStoryDraft();

      // Verify order persists after save.
      await curriculumAdmin.expectChaptersOrderToBe([
        'Chapter 2',
        'Chapter 1',
        'Chapter 3',
        'Chapter 4',
        'Chapter 5',
      ]);

      // Each chapter should still belong to exactly one adventure.
      await curriculumAdmin.expectAdventureCount(2);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should persist adventure groupings after save and reload',
    async function () {
      // Create a third adventure: All Chapters [2,1,3], Arc 2 [4], Arc 3 [5].
      await curriculumAdmin.splitIntoAdventure('Chapter 4');
      await curriculumAdmin.expectAdventureCount(3);

      // Verify the adventure titles are present.
      await curriculumAdmin.expectAdventureHeaderToBeVisible('All Chapters');

      // Save the story.
      await curriculumAdmin.saveStoryDraft();

      // Reload the story editor.
      await curriculumAdmin.openStoryEditor(
        'The Adventure Story',
        'Adventure Topic'
      );

      // Verify adventure groupings persist after reload.
      await curriculumAdmin.expectAdventureCount(3);

      // Verify chapter ordering persists.
      await curriculumAdmin.expectChaptersOrderToBe([
        'Chapter 2',
        'Chapter 1',
        'Chapter 3',
        'Chapter 4',
        'Chapter 5',
      ]);

      // Verify the default adventure title persists.
      await curriculumAdmin.expectAdventureHeaderToBeVisible('All Chapters');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
