// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * FL.PT. Learner does some practice questions.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

describe('Logged-Out Learner', function () {
  let loggedOutLearner: LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let explorationId: string;

  beforeAll(
    async function () {
      // Create Users.
      loggedOutLearner = await UserFactory.createLoggedOutUser();

      curriculumAdmin = await UserFactory.createNewUser(
        'curriculumAdm',
        'curriculum_admin@example.com',
        [ROLES.CURRICULUM_ADMIN]
      );

      // Create explorations.
      explorationId =
        await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
          'Fractions'
        );

      // Create a topic and add stories.
      await curriculumAdmin.createAndPublishTopic(
        'Fractions',
        'Algebra',
        'fractions'
      );

      await curriculumAdmin.addStoryToTopic(
        'Learning Fractions',
        'learn-fractions',
        'Fractions'
      );
      await curriculumAdmin.addChapter('Fractions 1', explorationId);
      await curriculumAdmin.saveStoryDraft();
      await curriculumAdmin.publishStoryDraft();

      await curriculumAdmin.createQuestionsForSkill('fractions', 7);

      // Enable the "Show practice tab to learners" in Topic Editor.
      await curriculumAdmin.openTopicEditor('Fractions');
      await curriculumAdmin.togglePracticeTabCheckbox();
      await curriculumAdmin.saveTopicDraft('Fractions');

      // Create classroom.
      await curriculumAdmin.createAndPublishClassroom(
        'Math',
        'math',
        'Fractions'
      );
    },
    // Test takes too long to run.
    800000
  );

  it('should be able to do some practice questions through topic page', async function () {
    // Go to topic page.
    await loggedOutLearner.navigateToClassroomPage('math');
    await loggedOutLearner.selectAndOpenTopic('Fractions');
    await loggedOutLearner.navigateToPracticeTabInTopic();

    // Beta is added as the practice tab is in beta and beta tag is contained in the tab title.
    await loggedOutLearner.expectTabTitleInTopicPageToBe(
      'BetaMaster Skills for Fractions'
    );
    await loggedOutLearner.expectSubtopicListInPracticeTabToContain([
      'Algebra',
    ]);
    await loggedOutLearner.startPracticeSession(['Algebra']);
    await loggedOutLearner.expectToBeInPracticeSession();

    // Play full practice session.
    for (let i = 0; i < 10; i++) {
      await loggedOutLearner.submitAnswer('3');
      await loggedOutLearner.continueToNextPracticeQuestion();
    }

    expect(
      await loggedOutLearner.isTextPresentOnPage('Session complete. Well done!')
    ).toBe(true);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
