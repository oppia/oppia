// Copyright 2025 The Oppia Authors. All Rights Reserved.
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

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

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

    // Create two simple explorations.
    explorationId1 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Exploring Quadratic Equations'
      );

    explorationId2 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Understanding Polynomial Functions'
      );

    // Create an exploration with Code Editor.
    await curriculumAdmin.navigateToCreatorDashboardPage();
    await curriculumAdmin.navigateToExplorationEditorPage();
    await curriculumAdmin.dismissWelcomeModal();

    // Create an exlporation unsupported by mobile.
    explorationId3 = await curriculumAdmin.createSimpleProgrammingExploration();

    // Create Topics and add skills.
    await curriculumAdmin.createTopic('Algebra II', 'algebra-ii');
    await curriculumAdmin.createSkillForTopic(
      'Quadratic Equations',
      'Algebra II'
    );
    await curriculumAdmin.createSkillForTopic(
      'Polynomial Functions',
      'Algebra II'
    );

    // Add story to topic.
    await curriculumAdmin.addStoryToTopic(
      'Journey into Quadratic Equations',
      'journey-into-quadratic-equations',
      'Algebra II'
    );
    await curriculumAdmin.addChapter(
      'Quadratic Equations Basics',
      explorationId1 as string
    );

    await curriculumAdmin.saveStoryDraft();

    // Create topic Manager.
    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topicManager1@example.com',
      [ROLES.TOPIC_MANAGER],
      'Algebra II'
    );
    // Setup is taking longer than the Default timeout of 300000 ms.
  }, 380000);

  it(
    'should be able to modify chapter details, preview the chapter card, add skills, and save the changes.',
    async function () {
      // Navigate to topics page.
      await topicManager.navigateToTopicAndSkillsDashboardPage();
      await topicManager.openChapterEditor(
        'Quadratic Equations Basics',
        'Journey into Quadratic Equations',
        'Algebra II'
      );

      // Update story with mobile supported exploration.
      await topicManager.editChapterDetails(
        'Intro to Quadratic Equations',
        'Introductory chapter on Quadratic Equations',
        explorationId2 as string,
        testConstants.data.curriculumAdminThumbnailImage
      );
      await topicManager.saveStoryDraft();

      // Check preview card and expect updated values.
      await topicManager.previewChapterCard();
      await topicManager.expectChapterPreviewToHave(
        'Intro to Quadratic Equations',
        'Introductory chapter on Quadratic Equations'
      );

      // Add exploration with interaction unsupported on mobile and expect topic can't be updated.
      await topicManager.createAndSwitchToNewTab();
      await topicManager.addChapterWithoutSaving(
        'Introduction to Python Programmin',
        explorationId3 as string,
        'Journey into Quadratic Equations',
        'Algebra II'
      );
      await topicManager.clickOnSaveNewChapterButton();
      await topicManager.expectNewChapterErrorSpan(
        'The states [Introduction] contain restricted interaction types.'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
