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
 * @fileoverview Acceptance tests for practice questions session workflow.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {QuestionAdmin} from '../../utilities/user/question-admin';

const ROLES = testConstants.Roles;

describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & QuestionAdmin;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN, ROLES.QUESTION_ADMIN]
    );

    await curriculumAdmin.createAndPublishTopicForPracticeQues(
      'Algebra I',
      'Negative Numbers',
      'Negative Numbers Skill'
    );

    await curriculumAdmin.createAndPublishClassroom(
      'Math',
      'math',
      'Algebra I'
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, 420000);

  it('should complete a practice questions session as logged-out user', async function () {
    // Step 1: Navigate to topic.
    await loggedOutUser.navigateToClassroomPage('math');
    await loggedOutUser.expectTopicsToBePresent(['Algebra I']);
    await loggedOutUser.selectAndOpenTopic('Algebra I');

    await loggedOutUser.clickPracticeTab();
    // Step 3: Configure & start session.
    await loggedOutUser.startPracticeSession();

    // Step 4: Complete questions.
    await loggedOutUser.answerAllQuestion();

    // Step 5: Verify completion.
    // await loggedOutUser.verifyPracticeScore();
  }, 420000);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
