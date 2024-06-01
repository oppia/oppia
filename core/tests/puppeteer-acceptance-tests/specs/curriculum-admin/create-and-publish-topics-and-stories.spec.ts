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
 * @fileoverview Acceptance Test for topic management by curriculum admin
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Curriculum Admin', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let explorationId: string | null;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should create and publish topics, subtopics, skills, stories and chapters.',
    async function () {
      await curriculumAdmin.navigateToCreatorDashboardPage();
      await curriculumAdmin.expectScreenshotToMatch(
        'navigateToCreatorDashboardPage',
        __dirname
      );
      await curriculumAdmin.navigateToExplorationEditorPage();
      await curriculumAdmin.expectScreenshotToMatch(
        'navigateToExplorationEditorPage',
        __dirname
      );
      await curriculumAdmin.dismissWelcomeModal();
      await curriculumAdmin.expectScreenshotToMatch(
        'dismissWelcomeModal',
        __dirname
      );
      await curriculumAdmin.createExplorationWithMinimumContent(
        'Test Exploration',
        'End Exploration'
      );
      await curriculumAdmin.expectScreenshotToMatch(
        'createExplorationWithMinimumContent',
        __dirname
      );
      await curriculumAdmin.saveExplorationDraft();
      await curriculumAdmin.expectScreenshotToMatch(
        'saveExplorationDraft',
        __dirname
      );
      explorationId = await curriculumAdmin.publishExplorationWithContent(
        'Test Exploration Title 1',
        'Test Exploration Goal',
        'Algebra'
      );
      await curriculumAdmin.expectScreenshotToMatch(
        'publishExplorationWithContent',
        __dirname
      );
      if (!explorationId) {
        throw new Error('Error publishing exploration successfully.');
      }

      await curriculumAdmin.createTopic('Test Topic 1', 'test-topic-one');
      await curriculumAdmin.expectScreenshotToMatch('createTopic', __dirname);
      await curriculumAdmin.createSubtopicForTopic(
        'Test Subtopic 1',
        'test-subtopic-one',
        'Test Topic 1'
      );
      await curriculumAdmin.expectScreenshotToMatch(
        'createSubtopicForTopic',
        __dirname
      );

      await curriculumAdmin.createSkillForTopic('Test Skill 1', 'Test Topic 1');
      await curriculumAdmin.expectScreenshotToMatch(
        'createSkillForTopic',
        __dirname
      );
      await curriculumAdmin.createQuestionsForSkill('Test Skill 1', 3);
      await curriculumAdmin.expectScreenshotToMatch(
        'createQuestionsForSkill',
        __dirname
      );
      await curriculumAdmin.assignSkillToSubtopicInTopicEditor(
        'Test Skill 1',
        'Test Subtopic 1',
        'Test Topic 1'
      );
      await curriculumAdmin.expectScreenshotToMatch(
        'assignSkillToSubtopicInTopicEditor',
        __dirname
      );
      await curriculumAdmin.addSkillToDiagnosticTest(
        'Test Skill 1',
        'Test Topic 1'
      );
      await curriculumAdmin.expectScreenshotToMatch(
        'addSkillToDiagnosticTest',
        __dirname
      );

      await curriculumAdmin.publishDraftTopic('Test Topic 1');
      await curriculumAdmin.expectScreenshotToMatch(
        'publishDraftTopic',
        __dirname
      );
      await curriculumAdmin.createAndPublishStoryWithChapter(
        'Test Story 1',
        'test-story-one',
        explorationId,
        'Test Topic 1'
      );
      await curriculumAdmin.expectTopicToBePublishedInTopicsAndSkillsDashboard(
        'Test Topic 1',
        1,
        1,
        1
      );
      await curriculumAdmin.expectScreenshotToMatch(
        'expectTopicToBePublishedInTopicsAndSkillsDashboard',
        __dirname
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
