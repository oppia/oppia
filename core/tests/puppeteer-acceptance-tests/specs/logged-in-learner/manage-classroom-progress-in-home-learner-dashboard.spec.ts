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
 *  LI.1. Sign up for an account
 *  LI.3. Track progress and get recommendations for next steps on the Learner Dashboard
 * L1.10  Start Lessons from the Home tab in redesigned Learner Dashboard
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {showMessage} from '../../utilities/common/show-message';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-In Learner', function () {
  let loggedInLearner: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & TopicManager & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  const chapterIds: string[] = [];

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseAdm',
      'releaseAdm@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag(
      'show_redesigned_learner_dashboard'
    );
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    await curriculumAdmin.createNewClassroom('Math', 'math');
    await curriculumAdmin.updateClassroom(
      'Math',
      'Welcome to Math classroom!',
      'This course covers basic operations.',
      'In this course, you will learn the following topics: Place Values.'
    );

    await curriculumAdmin.createAndPublishTopic(
      'Division',
      'Division subtopics',
      'Division skills'
    );
    await curriculumAdmin.createAndPublishTopic(
      'Place Values',
      'Place Values subtopics',
      'Place Values skills'
    );
    await curriculumAdmin.addTopicToClassroom('Math', 'Place Values');
    await curriculumAdmin.addTopicToClassroom('Math', 'Division');
    await curriculumAdmin.publishClassroom('Math');

    const placeValueChapters = [
      'What are the Place Values',
      'Find the Value of a Number',
      'Comparing Numbers',
      'Rounding Numbers part 1',
      'Rounding Numbers part 2',
      'Extra chapter',
    ];

    for (const chapter of placeValueChapters) {
      const expId = await curriculumAdmin.createAndPublishExplorationWithCards(
        chapter,
        'Algebra',
        3
      );
      chapterIds.push(expId ?? '');
    }

    await curriculumAdmin.addStoryToTopic(
      "Jamie's Adventures in the Arcade",
      'story',
      'Place Values'
    );

    for (const [index, id] of chapterIds.entries()) {
      await curriculumAdmin.addChapter(placeValueChapters[index], id as string);
    }

    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();
    await UserFactory.closeBrowserForUser(curriculumAdmin);

    loggedInLearner = await UserFactory.createNewUser(
      'loggedInLearner1',
      'logged_in_learner1@example.com'
    );
    await UserFactory.closeSuperAdminBrowser();
  }, 6000000); // Setup taking longer than default timeout.

  it(
    'should have the correct tab title, available sections on landing and Sidebar should contain these items in this order from top to bottom: Profile picture, "Home" button, "Goals" button, "Progress" button',
    async function () {
      await loggedInLearner.navigateToLearnerDashboard();
      await loggedInLearner.expectSidebarTabToBeActiveAndContainButtonsInOrder(
        'Home'
      );

      await loggedInLearner.expectLearnerGreetingsToBe(
        'Welcome, loggedInLearner1!'
      );

      await loggedInLearner.expectElementsToBePresentInRLD(
        ['Learn Something New'],
        'tabSection'
      );
      await loggedInLearner.expectElementsToBePresentInRLD(
        ["Topics available in Oppia's Classroom"],
        'cardDisplay'
      );
      await loggedInLearner.expectClassroomButtonOnRedesignedLearnerDashboardToBePresent(
        true
      );

      await loggedInLearner.expectNumberOfElementsToBe(
        '.e2e-test-learer-topic-summary-tile',
        2
      );

      await loggedInLearner.expectScreenshotToMatch(
        'learnerDashboardHomeTab',
        __dirname
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should navigate directly to math classroom',
    async function () {
      await loggedInLearner.navigateToClassroomFromLearnerDashboard('math');
      await loggedInLearner.expectToBeOnPage('learn/math');
      await loggedInLearner.expectScreenshotToMatch(
        'mathClassroomPage',
        __dirname
      );
      showMessage('Navigated to math classroom from learner dashboard.');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should navigate directly to the Place Values topic in the math classroom',
    async function () {
      await loggedInLearner.navigateToLearnerDashboard();
      await loggedInLearner.navigateToTopicPageByCard('Place Values');
      await loggedInLearner.expectToBeOnPage('learn/math/place-values');
      await loggedInLearner.expectScreenshotToMatch(
        'placeValuesTopicPage',
        __dirname
      );
      showMessage('Navigated to Place Values topic from learner dashboard.');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it('should display in-progress and recommended lessons after starting a lesson', async function () {
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToTopicPageByCard('Place Values');
    await loggedInLearner.expectToBeOnPage('learn/math/place-values');
    await loggedInLearner.selectChapterWithinStoryToLearn(
      "Jamie's Adventures in the Arcade",
      'What are the Place Values'
    );
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.navigateToLearnerDashboard();
    // Did not finish the chapter,So still in  In-progress section.
    await loggedInLearner.expectElementsToBePresentInRLD(
      ['Continue where you left off', 'Learn Something New'],
      'tabSection'
    );
    await loggedInLearner.expectScreenshotToMatch(
      'learnerDashboardHomeTabWithLessonsInProgresschapter1AndRecommendedForYouChapter2',
      __dirname
    );
    await loggedInLearner.expectLessonCardProgressToBe(
      'Lessons in progress',
      ['Chapter 1: What are the Place Values'],
      0
    );

    await loggedInLearner.expectLessonCardProgressToBe(
      'Recommended for you',
      ['Chapter 2: Find the Value of a Number'],
      0
    );

    await loggedInLearner.navigateToLessonByCard(
      'Lessons in progress',
      'Chapter 1: What are the Place Values'
    );

    await loggedInLearner.expectToBeOnLessonPage(
      'Chapter 1: What are the Place Values',
      chapterIds[0]
    );
    await loggedInLearner.expectScreenshotToMatch(
      'lessonPageOfChapter1',
      __dirname
    );
  });

  it('should not recommend any lessons if currently on last lesson', async function () {
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToLessonByCard(
      'Lessons in progress',
      'Chapter 1: What are the Place Values'
    );
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.expectScreenshotToMatch(
      'learnerDashboardHomeTabWithLessonsInProgresschapter2AndRecommendedForYouChapter3',
      __dirname
    );
    await loggedInLearner.expectLessonCardProgressToBe(
      'Lessons in progress',
      ['Chapter 2: Find the Value of a Number'],
      0
    );
    await loggedInLearner.expectLessonCardProgressToBe(
      'Recommended for you',
      ['Chapter 3: Comparing Numbers'],
      0
    );

    await loggedInLearner.navigateToLessonByCard(
      'Lessons in progress',
      'Chapter 2: Find the Value of a Number'
    );
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.expectScreenshotToMatch(
      'learnerDashboardHomeTabWithLessonsInProgresschapter3AndRecommendedForYouChapter4',
      __dirname
    );

    await loggedInLearner.expectLessonCardProgressToBe(
      'Lessons in progress',
      ['Chapter 3: Comparing Numbers'],
      0
    );
    await loggedInLearner.expectLessonCardProgressToBe(
      'Recommended for you',
      ['Chapter 4: Rounding Numbers part 1'],
      0
    );

    await loggedInLearner.navigateToLessonByCard(
      'Lessons in progress',
      'Chapter 3: Comparing Numbers'
    );
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.expectScreenshotToMatch(
      'learnerDashboardHomeTabWithLessonsInProgresschapter4AndRecommendedForYouChapter5',
      __dirname
    );

    await loggedInLearner.expectLessonCardProgressToBe(
      'Lessons in progress',
      ['Chapter 4: Rounding Numbers part 1'],
      0
    );
    await loggedInLearner.expectLessonCardProgressToBe(
      'Recommended for you',
      ['Chapter 5: Rounding Numbers part 2'],
      0
    );

    await loggedInLearner.navigateToLessonByCard(
      'Lessons in progress',
      'Chapter 4: Rounding Numbers part 1'
    );
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.expectScreenshotToMatch(
      'learnerDashboardHomeTabWithLessonsInProgresschapter5AndRecommendedForYouChapter6',
      __dirname
    );

    await loggedInLearner.expectLessonCardProgressToBe(
      'Lessons in progress',
      ['Chapter 5: Rounding Numbers part 2'],
      0
    );
    await loggedInLearner.navigateToLessonByCard(
      'Lessons in progress',
      'Chapter 5: Rounding Numbers part 2'
    );
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.expectScreenshotToMatch(
      'learnerDashboardHomeTabWithLessonsInProgresschapter6AndNoRecommendedForYouChapter',
      __dirname
    );

    await loggedInLearner.expectLessonCardProgressToBe(
      'Lessons in progress',
      ['Chapter 6: Extra chapter'],
      0
    );

    await loggedInLearner.expectElementsNotToBePresentInRLD(
      ['Recommended for you'],
      'cardDisplay'
    );
  }, 480000); // Takes longer than default timeout.

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
