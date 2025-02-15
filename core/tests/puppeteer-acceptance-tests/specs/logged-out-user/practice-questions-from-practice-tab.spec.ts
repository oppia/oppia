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

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;
  // eslint-disable-next-line
  // let explorationId: string | null;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;

  beforeAll(async function () {
    // Create curriculum admin.
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Create and publish exploration.
    // explorationId =
    //   await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
    //     'Negative Numbers'
    //   );

    // Create topic.
    await curriculumAdmin.createAndPublishTopic(
      'Algebra I',
      'Negative Numbers',
      'Negative Numbers'
    );

    // Create classroom.
    await curriculumAdmin.createAndPublishClassroom(
      'Math',
      'math',
      'Algebra I'
    );
    // Create story with chapter.
    // await curriculumAdmin.createAndPublishStoryWithChapter(
    //   'Algebra Story',
    //   'algebra-story',
    //   'Understanding Negative Numbers',
    //   explorationId as string,
    //   'Algebra I'
    // );
    // eslint-disable-next-line no-console
    // await curriculumAdmin.createSkillForTopic('This lesson gonna teach you algebra.', 'Algebra I');
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, 900000);

  it(
    'should complete a practice questions session as logged-out user',
    async function () {
      // Step 1: Navigate to topic.
      // eslint-disable-next-line no-console
      console.log('Successfully navigated to classroom page.');
      await loggedOutUser.navigateToClassroomPage('math');
      // eslint-disable
      await loggedOutUser.expectTopicsToBePresent(['Algebra I']);
      await loggedOutUser.selectAndOpenTopic('Algebra I');
      // eslint-disable-next-line no-console
      console.log('Successfully navigated to topic page.');
      // Step 2: Access practice tab.
      // eslint-disable-next-line no-console
      console.log('Attempting to access practice tab.');
      await loggedOutUser.clickPracticeTab();
      // eslint-disable-next-line no-console
      console.log('Successfully navigated from practice page.');
      // Step 3: Configure & start session.
      await loggedOutUser.startPracticeSession();

      // Step 4: Complete questions.
      await loggedOutUser.answerPracticeQuestions();

      // Step 5: Verify completion.
      // await loggedOutUser.verifyPracticeScore();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
