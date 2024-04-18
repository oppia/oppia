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

import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import testConstants from '../../puppeteer-testing-utilities/test-constants';
import {CurriculumAdmin} from '../../user-utilities/curriculum-admin-utils';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;
const ROLES = testConstants.Roles;

describe('Curriculum Admin', function () {
  let curriculumAdmin: CurriculumAdmin;
  let explorationId: string;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should create and publish topics, subtopics, skills, stories and chapters.',
    async function () {
      explorationId = await curriculumAdmin.createAndPublishExploration(
        'Test Exploration Title 1',
        'Test Exploration'
      );

      await curriculumAdmin.createTopic('Test Topic 1', 'test-topic-one');
      await curriculumAdmin.createSubtopicForTopic(
        'Test Subtopic 1',
        'test-subtopic-one',
        'Test Topic 1'
      );

      await curriculumAdmin.createSkillForTopic('Test Skill 1', 'Test Topic 1');
      await curriculumAdmin.createQuestionsForSkill('Test Skill 1', 3);
      await curriculumAdmin.assignSkillToSubtopicInTopicEditor(
        'Test Skill 1',
        'Test Subtopic 1',
        'Test Topic 1'
      );
      await curriculumAdmin.addSkillToDiagnostingTestsOfTopic(
        'Test Skill 1',
        'Test Topic 1'
      );

      await curriculumAdmin.publishDraftTopic('Test Topic 1');
      await curriculumAdmin.createAndPublishStoryWithChapter(
        'Test Story 1',
        'test-story-one',
        explorationId,
        'Test Topic 1'
      );
      await curriculumAdmin.expectTopicToBePublishedInTopicAndSkillsDashboard(
        'Test Topic 1',
        1,
        1,
        1
      );
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
