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
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Curriculum Admin', function () {
  let curriculumAdmin: CurriculumAdmin;
  let guestUser: LoggedInUser;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    guestUser = await UserFactory.createNewUser(
      'guestUser1',
      'guest_user1@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should create and publish topics, subtopics, skills, stories and chapters.',
    async function () {
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
      await curriculumAdmin.addSkillToDiagnosticTest(
        'Test Skill 1',
        'Test Topic 1'
      );

      await curriculumAdmin.publishDraftTopic('Test Topic 1');
      await curriculumAdmin.expectTopicToBePublishedInTopicsAndSkillsDashboard(
        'Test Topic 1',
        1,
        1,
        1
      );
      await curriculumAdmin.unpublishTopic('Test Topic 1');
      await guestUser.expectTopicLinkReturns404('Test Topic 1');
      await curriculumAdmin.deleteTopic('Test Topic 1');
      await curriculumAdmin.expectTopicNotInTopicsAndSkillDashboard(
        'Test Topic 1'
      );

      await curriculumAdmin.deleteSkill('Test Skill 1');
      await curriculumAdmin.expectSkillNotInTopicsAndSkillsDashboard(
        'Test Skill 1'
      );
    },

    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
