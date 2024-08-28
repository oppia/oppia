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
 * @fileoverview Acceptance test for checking the behavior of the classroom index page
 * for 0 classrooms, 1 classroom, and more than 1 classroom.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ConsoleReporter} from '../../utilities/common/console-reporter';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

ConsoleReporter.setConsoleErrorsToIgnore([
  /http:\/\/localhost:8181\/access_validation_handler\/can_access_classrooms_page Failed to load resource: the server responded with a status of 404 \(Not Found\)/,
]);

describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag('enable_multiple_classrooms');
    await curriculumAdmin.createTopic('Test Topic 2', 'test-topic-two');
    await curriculumAdmin.createTopic('Test Topic 1', 'test-topic-one');
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be redirected to a 404 error page if no classrooms are present.',
    async function () {
      await loggedOutUser.navigateToClassroomsPage();
      await loggedOutUser.expectToBeOnErrorPage(404);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be redirected to a classroom page if we have 1 public classroom.',
    async function () {
      await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
      await curriculumAdmin.createNewClassroom('Math', 'math');
      await curriculumAdmin.updateClassroom(
        'Math',
        'Welcome to Math classroom!',
        'This course covers basic algebra and trigonometry.',
        'In this course, you will learn the following topics: algbera and trigonometry,'
      );
      await curriculumAdmin.addTopicToClassroom('Math', 'Test Topic 1');
      await curriculumAdmin.publishClassroom('Math');

      await loggedOutUser.navigateToClassroomsPage();
      await loggedOutUser.expectToBeOnClassroomPage('Math');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show classrooms page with classroom cards.',
    async function () {
      await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
      await curriculumAdmin.createNewClassroom('Science', 'science');
      await curriculumAdmin.updateClassroom(
        'Science',
        'Welcome to Science classroom!',
        'This course covers basic physics and chemistry.',
        'In this course, you will learn the following topics: physics and chemistry,'
      );
      await curriculumAdmin.addTopicToClassroom('Science', 'Test Topic 2');
      await curriculumAdmin.publishClassroom('Science');

      await loggedOutUser.navigateToClassroomsPage();
      await loggedOutUser.expectClassroomCountInClassroomsPageToBe(2);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
