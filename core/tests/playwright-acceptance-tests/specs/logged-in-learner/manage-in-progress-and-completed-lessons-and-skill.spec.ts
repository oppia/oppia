// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 *  LI.2. Set goals on the Learner Dashboard
 * Start a Goal and see the changes in the Goals Tab as we progress in a story
 */

import {test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

test.describe.configure({mode: 'serial'});

test.describe('Logged-in Learner', function () {
  let loggedInLearner: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(6000000); // Setup taking longer than default timeout.
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      browser,
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      browser,
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
      'Place Values',
      'Place Values',
      'Place Values'
    );
    await curriculumAdmin.addTopicToClassroom('Math', 'Place Values');
    await curriculumAdmin.publishClassroom('Math');

    const placeValueChapters = [
      'What are the Place Values',
      'Find the Value of a Number',
      'Comparing Numbers',
    ];

    const chapterIds: (string | null)[] = [];

    for (const chapter of placeValueChapters) {
      const id = await curriculumAdmin.createAndPublishExplorationWithCards(
        chapter,
        'Algebra',
        3
      );
      chapterIds.push(id);
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
      'logged_in_learner1@example.com',
      browser
    );
    await UserFactory.closeSuperAdminBrowser();
  });

  test('should display empty progress message when no lessons are in progress', async function () {
    await loggedInLearner.navigateToLearnerDashboardAsLoggedInUser();
    await loggedInLearner.expectSidebarTabToBeActiveAndContainButtonsInOrder(
      'Home'
    );
    await loggedInLearner.navigateToProgressSection();
    await loggedInLearner.expectSidebarTabToBeActiveAndContainButtonsInOrder(
      'Progress'
    );
    await loggedInLearner.expectProgressSectionToBeEmptyInNewLD();
    await loggedInLearner.expectScreenshotToMatch('emptyProgressSection');
  });

  test('should select "Or Explore All Lessons in Classroom" button and navigate to /learn/math', async function () {
    await loggedInLearner.navigateToLearnerDashboardAsLoggedInUser();
    await loggedInLearner.navigateToProgressSection();
    await loggedInLearner.expectClassroomButtonOnRedesignedLearnerDashboardToBePresent(
      true
    );
    await loggedInLearner.navigateThroughClassroomButtonOnRLD();
    await loggedInLearner.expectToBeOnPageAsLoggedInUser('/learn/math');
  });

  test('should select Place Values Topic and play "Chapter 1: What are the Place Values?" but do not finish and see It in Progress Section', async function () {
    await loggedInLearner.selectAndOpenTopic('Place Values');
    await loggedInLearner.selectChapterWithinStoryToLearn(
      "Jamie's Adventures in the Arcade",
      'What are the Place Values'
    );
    await loggedInLearner.continueToNextCardAsLoggedOutUser();

    await loggedInLearner.navigateToLearnerDashboardAsLoggedInUser();
    await loggedInLearner.navigateToProgressSection();

    await loggedInLearner.expectScreenshotToMatch(
      'ProgressSectionInProgressWithOnlyChapter01'
    );
    await loggedInLearner.expectElementsToBePresentInRLD(
      ['In Progress'],
      'tabSection'
    );
    await loggedInLearner.expectElementsToBePresentInRLD(
      ['Classroom Lessons'],
      'cardDisplay'
    );

    await loggedInLearner.expectLessonCardProgressToBe(
      'Classroom Lessons',
      ['Chapter 1: What are the Place Values'],
      0,
      'In Progress'
    );
    await loggedInLearner.navigateToLessonByCard(
      'Classroom Lessons',
      'Chapter 1: What are the Place Values'
    );
    await loggedInLearner.continueToNextCardAsLoggedOutUser();
    await loggedInLearner.continueToNextCardAsLoggedOutUser();
    await loggedInLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInLearner.navigateToLearnerDashboardAsLoggedInUser();
    await loggedInLearner.navigateToProgressSection();
    await loggedInLearner.expectScreenshotToMatch(
      'ProgressSectionInProgressWithOnlyChapter02'
    );
  });

  test("should complete all the lessons of Place Value's Story and see Chapter 1 in the Completed Lessons section", async function () {
    await loggedInLearner.navigateToLearnerDashboardAsLoggedInUser();
    await loggedInLearner.navigateToProgressSection();

    await loggedInLearner.expectLessonCardProgressToBe(
      'Classroom Lessons',
      ['Chapter 2: Find the Value of a Number'],
      0,
      'In Progress'
    );

    await loggedInLearner.navigateToLessonByCard(
      'Classroom Lessons',
      'Chapter 2: Find the Value of a Number'
    );
    await loggedInLearner.continueToNextCardAsLoggedOutUser();
    await loggedInLearner.continueToNextCardAsLoggedOutUser();
    await loggedInLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInLearner.navigateToLearnerDashboardAsLoggedInUser();
    await loggedInLearner.navigateToProgressSection();
    await loggedInLearner.expectLessonCardProgressToBe(
      'Classroom Lessons',
      ['Chapter 3: Comparing Numbers'],
      0,
      'In Progress'
    );

    await loggedInLearner.navigateToLessonByCard(
      'Classroom Lessons',
      'Chapter 3: Comparing Numbers'
    );
    await loggedInLearner.continueToNextCardAsLoggedOutUser();
    await loggedInLearner.continueToNextCardAsLoggedOutUser();
    await loggedInLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInLearner.navigateToLearnerDashboardAsLoggedInUser();
    await loggedInLearner.navigateToProgressSection();

    await loggedInLearner.expectScreenshotToMatch(
      'inProgressTabCompletedSection'
    );
    await loggedInLearner.expectElementsToBePresentInRLD(
      ['Completed'],
      'tabSection'
    );
    await loggedInLearner.expectElementsToBePresentInRLD(
      ['Classroom Lessons'],
      'cardDisplay'
    );

    await loggedInLearner.expectLessonCardProgressToBe(
      'Classroom Lessons',
      ['Chapter 1: What are the Place Values'],
      100,
      'Completed'
    );
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
