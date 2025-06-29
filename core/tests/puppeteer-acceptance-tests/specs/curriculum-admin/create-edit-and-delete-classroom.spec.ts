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
 * @fileoverview Acceptance Test for Creating, Updating, Publishing, and Deleting a Classroom by a Curriculum Admin.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

ConsoleReporter.setConsoleErrorsToIgnore([/[\s\S]*/]);

describe('Curriculum Admin', function () {
  let curriculumAdmin: CurriculumAdmin;
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();

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

    // Setup taking longer than 300000 ms.
  }, 480000);

  it(
    'should create, publish and delete a classroom.',
    async function () {
      await curriculumAdmin.expectNumberOfClassroomsToBe(0);
      await curriculumAdmin.createNewClassroom('Math', 'math');
      await curriculumAdmin.expectNumberOfClassroomsToBe(1);
      await curriculumAdmin.updateClassroom(
        'Math',
        'Teaser text',
        'Course details',
        'Topic list intro'
      );
      await curriculumAdmin.addTopicToClassroom('Math', 'Test Topic 1');
      await curriculumAdmin.publishClassroom('Math');
      await curriculumAdmin.expectNumberOfTopicsInTopicDependencyGraphToBe(
        'Math',
        1
      );

      await loggedOutUser.navigateToClassroomPage('math');
      await loggedOutUser.expectToBeOnClassroomPage('Math');

      await curriculumAdmin.deleteClassroom('Math');
      await curriculumAdmin.expectNumberOfClassroomsToBe(0);
    },

    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
