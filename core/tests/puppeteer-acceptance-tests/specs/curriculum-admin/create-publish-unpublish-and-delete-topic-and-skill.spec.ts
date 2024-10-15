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
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

// To ignore console errors that occur when checking if the
// topic link returns a 404 status upon unpublishing.
ConsoleReporter.setConsoleErrorsToIgnore([
  /HttpErrorResponse:.*404 Not Found/,
  /Occurred at http:\/\/localhost:8181\/learn\/staging\/test-topic-one \.?/,
  /http:\/\/localhost:8181\/learn\/staging\/test-topic-one \.?/,
  /Failed to load resource: the server responded with a status of 404 \(Not Found\)/,
]);

describe('Curriculum Admin', function () {
  let curriculumAdmin: CurriculumAdmin;
  let loggedInUser: LoggedInUser;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should manage topics and skills: create, assign, publish, unpublish, and delete.',
    async function () {
      await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
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
        0,
        1,
        1
      );

      await curriculumAdmin.unpublishTopic('Test Topic 1');
      await loggedInUser.expectTopicLinkReturns404('test-topic-one');

      await curriculumAdmin.deleteTopic('Test Topic 1');
      await curriculumAdmin.expectTopicNotInTopicsAndSkillDashboard(
        'Test Topic 1'
      );

      // User must remove all questions from the skill before deleting it.
      await curriculumAdmin.removeAllQuestionsFromTheSkill('Test Skill 1');
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
