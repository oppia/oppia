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
      'curriculum_Admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
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

    await curriculumAdmin.createTopic('Mathematics', 'math');
    await curriculumAdmin.createSkillForTopic('Subtraction', 'Mathematics');
    await curriculumAdmin.createSkillForTopic('Multiplication', 'Mathematics');
    await curriculumAdmin.createAndPublishStoryWithChapter(
      'storyNaem',
      'storyurl'
    );

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Mathematics'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it('should be able to modify chapter details, preview the chapter card, add skills, and save the changes.', async function () {
    await topicManager.navigateToTopicAndSkillsDashboardPage();

    await topicManager.openChapterEditorFromStory('New Chapter Title');
    await topicManager.editChapterDetails('New Chapter Description');

    await topicManager.addAcquiredSkill('New Acquired Skill');
    await topicManager.addPrerequisiteSkill('New Prerequisite Skill');

    await topicManager.previewChapterCard();

    await topicManager.saveChanges();
  }, 2147483647);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
