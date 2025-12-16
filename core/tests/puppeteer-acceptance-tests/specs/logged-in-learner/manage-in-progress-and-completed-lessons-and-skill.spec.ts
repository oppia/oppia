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
 *  LI.2. Set goals on the Learner Dashboard
 * Start a Goal and see the changes in the Goals Tab as we progress in a story
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {TopicManager} from '../../utilities/user/topic-manager';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in Learner', function () {
  let loggedInLearner: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
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
      'logged_in_learner1@example.com'
    );
    await UserFactory.closeSuperAdminBrowser();
  }, 6000000); // Setup taking longer than default timeout.

  it(
    'should display empty progress message when no lessons are in progress',
    async function () {
      await loggedInLearner.navigateToLearnerDashboard();
      await loggedInLearner.expectSidebarTabToBeActiveAndContainButtonsInOrder(
        'Home'
      );
      await loggedInLearner.navigateToProgressSection();
      await loggedInLearner.expectSidebarTabToBeActiveAndContainButtonsInOrder(
        'Progress'
      );
      await loggedInLearner.expectProgressSectionToBeEmptyInNewLD();
      await loggedInLearner.expectScreenshotToMatch(
        'emptyProgressSection',
        __dirname
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should select "Or Explore All Lessons in Classroom" button and navigate to /learn/math',
    async function () {
      await loggedInLearner.navigateToLearnerDashboard();
      await loggedInLearner.navigateToProgressSection();
      await loggedInLearner.expectClassroomButtonOnRedesignedLearnerDashboardToBePresent(
        true
      );
      await loggedInLearner.navigateThroughClassroomButtonOnRLD();
      await loggedInLearner.expectToBeOnPage('/learn/math');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it('should select Place Values Topic and play "Chapter 1: What are the Place Values?" but do not finish and see It in Progress Section', async function () {
    await loggedInLearner.selectAndOpenTopic('Place Values');
    await loggedInLearner.selectChapterWithinStoryToLearn(
      "Jamie's Adventures in the Arcade",
      'What are the Place Values'
    );
    await loggedInLearner.continueToNextCard();

    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToProgressSection();

    await loggedInLearner.expectScreenshotToMatch(
      'ProgressSectionInProgressWithOnlyChapter01',
      __dirname
    );
    await loggedInLearner.expectElementsToBePresentInRLD(
      ['In Progress'],
      'tabSection'
    );
    await loggedInLearner.expectElementsToBePresentInRLD(
      ['Classroom Lessons', 'Skills'],
      'cardDisplay'
    );

    await loggedInLearner.expectLessonCardProgressToBe(
      'Classroom Lessons',
      ['Chapter 1: What are the Place Values'],
      0,
      'In Progress'
    );
    await loggedInLearner.expectSkillCardProgressToBe(
      'Skills',
      ['Place Values'],
      0
    );
    await loggedInLearner.navigateToLessonByCard(
      'Classroom Lessons',
      'Chapter 1: What are the Place Values'
    );
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToProgressSection();
    await loggedInLearner.expectScreenshotToMatch(
      'ProgressSectionInProgressWithOnlyChapter02',
      __dirname
    );
    await loggedInLearner.navigateToSkillByCard('Skills', 'Place Values');
  });

  it("should complete all the lessons of Place Value's Story and see Chapter 1 in the Completed Lessons section", async function () {
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToProgressSection();

    await loggedInLearner.expectLessonCardProgressToBe(
      'Classroom Lessons',
      ['Chapter 2: Find the Value of a Number'],
      0,
      'In Progress'
    );
    await loggedInLearner.expectSkillCardProgressToBe(
      'Skills',
      ['Place Values'],
      0
    );

    await loggedInLearner.navigateToLessonByCard(
      'Classroom Lessons',
      'Chapter 2: Find the Value of a Number'
    );
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToProgressSection();
    await loggedInLearner.expectLessonCardProgressToBe(
      'Classroom Lessons',
      ['Chapter 3: Comparing Numbers'],
      0,
      'In Progress'
    );
    await loggedInLearner.expectSkillCardProgressToBe(
      'Skills',
      ['Place Values'],
      0
    );

    await loggedInLearner.navigateToLessonByCard(
      'Classroom Lessons',
      'Chapter 3: Comparing Numbers'
    );
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToProgressSection();

    await loggedInLearner.expectScreenshotToMatch(
      'inProgressTabCompletedSection',
      __dirname
    );
    await loggedInLearner.expectElementsToBePresentInRLD(
      ['Completed'],
      'tabSection'
    );
    await loggedInLearner.expectElementsToBePresentInRLD(
      ['Classroom Lessons', 'Skills'],
      'cardDisplay'
    );

    await loggedInLearner.expectLessonCardProgressToBe(
      'Classroom Lessons',
      ['Chapter 1: What are the Place Values'],
      100,
      'Completed'
    );
    await loggedInLearner.expectSkillCardProgressToBe(
      'Skills',
      ['Place Values'],
      0
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
