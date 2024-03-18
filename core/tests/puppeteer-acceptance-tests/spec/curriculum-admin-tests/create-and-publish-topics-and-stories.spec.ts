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
  let explorationUrl: string | null;
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
      await curriculumAdmin.navigateToCreatorDashboardPage();
      explorationUrl = await curriculumAdmin.createExploration();
      explorationId =
        await curriculumAdmin.getExplorationIdFromUrl(explorationUrl);

      await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
      await curriculumAdmin.createTopic();
      await curriculumAdmin.createSubTopic();
      await curriculumAdmin.createSkill();
      await curriculumAdmin.createAndPublishStoryWithChapter(explorationId);

      await curriculumAdmin.expectPublishedTopicToBePresent();
      await curriculumAdmin.expectPublishedStoryToBePresent();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
