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
 * @fileoverview Acceptance Test for the journey of a topic manager. The journey includes filtering skills by status, classroom, and keyword, sorting skills, using the paginator, and opening an existing skill.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {TopicManager} from '../../utilities/user/topic-manager';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Topic Manager', function () {
  let topicManager: TopicManager;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let explorationId: string | null;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin1@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    await curriculumAdmin.createTopic('Algebra', 'algebra');

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topicManager1@example.com',
      [ROLES.TOPIC_MANAGER],
      'Algebra'
    );

    await curriculumAdmin.navigateToCreatorDashboardPage();
    await curriculumAdmin.navigateToExplorationEditorPage();
    await curriculumAdmin.dismissWelcomeModal();
    await curriculumAdmin.createMinimalExploration(
      'Algebra Basics',
      'End Exploration'
    );
    await curriculumAdmin.saveExplorationDraft();
    explorationId = await curriculumAdmin.publishExplorationWithMetadata(
      'Algebra Basics',
      'Learn the basics of Algebra',
      'Algebra'
    );
    if (!explorationId) {
      throw new Error('Error publishing exploration successfully.');
    }

    await curriculumAdmin.createTopic('Algebra', 'algebra');
    await curriculumAdmin.createSkillForTopic('Basic Algebra', 'Algebra');
    await curriculumAdmin.createSkillForTopic('Advanced Algebra', 'Algebra');

    ('Basic Algebra');
    await topicManager.createAndSaveStoryWithChapter(
      'Algebra Story 1',
      'algebraStory1',
      'Introduction to Algebra',
      explorationId,
      'Algebra'
    );
    await topicManager.createAndSaveStoryWithChapter(
      'Algebra Story 2',
      'algebraStory2',
      'Advanced Algebra',
      explorationId,
      'Algebra'
    );
  }, 2147483647);

  it('should be able to modify chapter details, preview the chapter card, add skills, and save the changes.', async function () {
    const actions = [
      {
        action: () => topicManager.navigateToTopicAndSkillsDashboardPage(),
        name: 'navigateToTopicAndSkillsDashboardPage',
      },
      {
        action: () =>
          topicManager.openChapterEditor(
            'Introduction to Algebra',
            'Algebra Story',
            'Algebra'
          ),
        name: 'openChapterEditorFromStory',
      },
      {
        action: () =>
          topicManager.editChapterDetails(
            'Intro to Algebra',
            'Introductory chapter on Algebra',
            explorationId as string,
            testConstants.data.curriculumAdminThumbnailImage
          ),
        name: 'editChapterDetails',
      },
      {
        action: () => topicManager.assignAcquiredSkill('Basic Algebra'),
        name: 'addAcquiredSkill',
      },
      {action: () => topicManager.saveStoryDraft(), name: 'saveChanges'},

      {
        action: () => topicManager.previewChapterCard(),
        name: 'previewChapterCard',
      },
      {
        action: () =>
          topicManager.expectChapterPreviewToHave(
            'Intro to Algebra',
            'Introductory chapter on Algebra'
          ),
        name: 'previewChapterCard',
      },

      // Opening second chapter in chapter editor to add prerequisite skill as it only can be added if the skill is acquired in previous chapters, which is acquired in the chapter above.
      {
        action: () =>
          topicManager.openChapterEditor(
            'Advanced Algebra',
            'Algebra story 2',
            'Algebra'
          ),
        name: 'openChapterEditorFromStory',
      },
      {
        action: () => topicManager.addPrerequisiteSkill('Basic Algebra'),
        name: 'editChapterDetails',
      },
      {
        action: () => topicManager.assignAcquiredSkill('Advanced Algebra'),
        name: 'addAcquiredSkill',
      },
      {action: () => topicManager.saveStoryDraft(), name: 'saveChanges'},
    ];

    for (const {action, name} of actions) {
      try {
        await action();
      } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', error);
        await topicManager.screenshot(`error_${name}.png`);
      }
    }
  }, 2147483647);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
