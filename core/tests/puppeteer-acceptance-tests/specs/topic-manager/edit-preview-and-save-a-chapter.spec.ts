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
 * @fileoverview Acceptance Test for a journey of topic manager. It includes modifying chapter details,
 *  previewing the chapter card, adding acquired and prerequisite skills, and saving the changes.
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
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let topicManager: TopicManager;
  let explorationId1: string | null;
  let explorationId2: string | null;
  let explorationId3: string | null;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin1@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    explorationId1 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Exploring Quadratic Equations'
      );

    explorationId2 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Understanding Polynomial Functions'
      );

    explorationId3 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Exploring Advance Equations'
      );

    await curriculumAdmin.createTopic('Algebra II', 'algebra-ii');

    await curriculumAdmin.createSkillForTopic(
      'Quadratic Equations',
      'Algebra II'
    );
    await curriculumAdmin.createSkillForTopic(
      'Polynomial Functions',
      'Algebra II'
    );

    await curriculumAdmin.addStoryToTopic(
      'Journey into Quadratic Equations',
      'journey-into-quadratic-equations',
      'Algebra II'
    );
    await curriculumAdmin.addChapter(
      'Quadratic Equations Basics',
      explorationId1 as string
    );
    await curriculumAdmin.addChapter(
      'Introduction to Polynomial Functions',
      explorationId2 as string
    );
    await curriculumAdmin.saveStoryDraft();

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topicManager1@example.com',
      [ROLES.TOPIC_MANAGER],
      'Algebra II'
    );
    // Setup is taking longer than the Default timeout of 300000 ms.
  }, 360000);

  it(
    'should be able to modify chapter details, preview the chapter card, add skills, and save the changes.',
    async function () {
      await topicManager.navigateToTopicAndSkillsDashboardPage();
      await topicManager.openChapterEditor(
        'Quadratic Equations Basics',
        'Journey into Quadratic Equations',
        'Algebra II'
      );

      await topicManager.editChapterDetails(
        'Intro to Quadratic Equations',
        'Introductory chapter on Quadratic Equations',
        explorationId3 as string,
        testConstants.data.curriculumAdminThumbnailImage
      );

      await topicManager.addAcquiredSkill('Quadratic Equations');

      await topicManager.saveStoryDraft();

      await topicManager.previewChapterCard();
      await topicManager.expectChapterPreviewToHave(
        'Intro to Quadratic Equations',
        'Introductory chapter on Quadratic Equations'
      );

      // Opening second chapter in chapter editor to add prerequisite skill as it only can be added if the skill is acquired in previous chapters, which is acquired in the chapter above.
      await topicManager.createAndSwitchToNewTab();
      await topicManager.openChapterEditor(
        'Introduction to Polynomial Functions',
        'Journey into Quadratic Equations',
        'Algebra II'
      );
      await topicManager.addAcquiredSkill('Polynomial Functions');
      await topicManager.addPrerequisiteSkill('Quadratic Equations');

      await topicManager.saveStoryDraft();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
