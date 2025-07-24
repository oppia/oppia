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
 * FL.CP. Learner discovers the website and navigates to the Math Classroom page
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
  let curriculumAdmin: CurriculumAdmin &
    TopicManager &
    ExplorationEditor &
    LoggedOutUser;
  let explorationId1: string;
  let explorationId2: string;

  beforeAll(async function () {
    // Create Users.
    loggedOutLearner = await UserFactory.createLoggedOutUser();
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Create explorations.
    explorationId1 = await curriculumAdmin.createAndPublishExplorationWithCards(
      'Fractions 1',
      'Algebra'
    );
    explorationId2 = await curriculumAdmin.createAndPublishExplorationWithCards(
      'Fractions 2',
      'Algebra'
    );

    // Create a topic and classroom.
    await curriculumAdmin.createAndPublishTopic(
      'Fractions',
      'Algebra',
      'fractions'
    );
    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();

    await curriculumAdmin.openSkillEditor('fractions');
    await curriculumAdmin.navigateToSkillQuestionEditorTab();

    await curriculumAdmin.createQuestionsForSkill('fractions', 7);

    // Enable the "Show practice tab to learners" in Topic Editor.
    await curriculumAdmin.openTopicEditor('Fractions');
    await curriculumAdmin.togglePracticeTabCheckbox();
    await curriculumAdmin.saveTopicDraft('Fractions');

    await curriculumAdmin.createAndPublishClassroom(
      'Math',
      'math',
      'Fractions'
    );
    await curriculumAdmin.enableDiagnosticTestForClassroom('Math');

    // Add explorations to classroom.
    await curriculumAdmin.addStoryToTopic(
      'Learning Fractions',
      'learn-fractions',
      'Fractions'
    );
    await curriculumAdmin.addChapter('Fractions 1', explorationId1);
    await curriculumAdmin.addChapter('Fractions 2', explorationId2);

    // Save draft.
    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();
  }, 600000);

  it('should be able to find list of subjects to learn', async function () {
    await loggedOutLearner.navigateToSplashPage();
    await loggedOutLearner.expectHomePageTitleToBe(
      'Free Education for Everyone'
    );
    await loggedOutLearner.expectDevModeLabelToBeVisible(
      !(await loggedOutLearner.isInProdMode())
    );

    // Click "Explore Oppia Classrooms" button.
    await loggedOutLearner.clickBrowseLessonsButtonInHomePage();
    await loggedOutLearner.isTextPresentOnPage('The Math Classroom');

    await loggedOutLearner.expectHeadingInClassroomPageToContain(
      'Course Details'
    );
    await loggedOutLearner.expectHeadingInClassroomPageToContain(
      'Topics Covered'
    );
    await loggedOutLearner.expectTopicsToBePresent(['Fractions']);
  });

  it('should be able start learning from the first topic', async function () {
    // Click "Start Here" under "Don't know where to start" section.
    await loggedOutLearner.expectDiagnosticTestBoxToBePresent(
      'Don’t know where to start?',
      'Start here'
    );
    await loggedOutLearner.clickOnStartHereButtonInClassroomPage();
    await loggedOutLearner.expectTabTitleInTopicPageToBe('Fractions');
    await loggedOutLearner.expectTopicToContainStories(['Learning Fractions']);

    await loggedOutLearner.navigateToRevisionTabInTopic();
    await loggedOutLearner.expectTabTitleInTopicPageToBe(
      'Study Skills for Fractions'
    );

    await loggedOutLearner.navigateToPracticeTabInTopic();
    await loggedOutLearner.expectTabTitleInTopicPageToBe(
      'BetaMaster Skills for Fractions'
    );

    await loggedOutLearner.navigateToLessonsTabInTopic();
    await loggedOutLearner.navigateBackToClassroomFromTopicPage();
    await loggedOutLearner.expectToBeInClassroomPage('math');
  });

  it('should be able to figure out which topic would be best for them', async function () {
    await loggedOutLearner.navigateToClassroomPage('math');

    // Click on "Take a Quiz" under "Already know some Math?" section.
    await loggedOutLearner.expectDiagnosticTestBoxToBePresent(
      'Already know some Math?',
      'Take quiz'
    );
    await loggedOutLearner.clickOnTakeQuizButtonInClassroomPage();
    await loggedOutLearner.startDiagnosticTest();
    await loggedOutLearner.expectToBeInDiagnosticTestPlayer();

    await loggedOutLearner.expectCardContentToMatch('Add 1+2');

    await loggedOutLearner.skipQuestionInDiagnosticTest();
    await loggedOutLearner.skipQuestionInDiagnosticTest();

    await loggedOutLearner.isTextPresentOnPage('Test complete. Well Done!');
    await loggedOutLearner.expectTopicsToBePresent(['Fractions']);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
