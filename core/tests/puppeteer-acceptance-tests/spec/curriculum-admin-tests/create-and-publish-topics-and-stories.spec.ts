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
 * @fileoverview Acceptance Test for curriculum admin
 */

import { UserFactory } from
  '../../puppeteer-testing-utilities/user-factory';
import testConstants from
  '../../puppeteer-testing-utilities/test-constants';
import { ICurriculumAdmin } from '../../user-utilities/curriculum-admin-utils';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;
const ROLES = testConstants.Roles;

describe('Curriculum Admin', function() {
  let curriculumAdmin: ICurriculumAdmin;
  let topicUrl: string | null;
  let explorationUrl: string | null;
  let explorationId: string | null;

  beforeAll(async function() {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm', 'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]);
  }, DEFAULT_SPEC_TIMEOUT);

  it('should create skill.',
    async function() {
      await curriculumAdmin.navigateToCreatorDashboardPage();
      explorationUrl = await curriculumAdmin.createExploration();
      explorationId = explorationUrl ? explorationUrl.match(/explore\/(.*)/)?.[1] ?? '' : '';

      await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
      topicUrl = await curriculumAdmin.createTopic();
      await curriculumAdmin.createSubTopic(topicUrl);
      await curriculumAdmin.createSkill(topicUrl);
      await curriculumAdmin.createStory(topicUrl);
      await curriculumAdmin.createChapter(explorationId);
      await curriculumAdmin.publishStory();
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await UserFactory.closeAllBrowsers();
  });
});
