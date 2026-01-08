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
 * LI.2. Set goals on the Learner Dashboard
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

describe('Logged-In Learner', function () {
  let loggedInUser: LoggedInUser & LoggedOutUser;
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

    // Extra explorations for modal list (not used in chapters)
    for (let i = 0; i < 2; i++) {
      await curriculumAdmin.createAndPublishExplorationWithCards(
        `Explore Title ${i + 1}`,
        'Algebra',
        3
      );
    }

    await curriculumAdmin.addStoryToTopic(
      "Jamie's Adventures in the Arcade",
      'story',
      'Place Values'
    );

    for (const [idx, expId] of chapterIds.entries()) {
      await curriculumAdmin.addChapter(
        placeValueChapters[idx],
        expId as string
      );
    }

    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();
    await UserFactory.closeBrowserForUser(curriculumAdmin);
    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );

    await UserFactory.closeSuperAdminBrowser();
  }, 6000000); // Setup taking longer than default timeout.

  it('should start and complete Chapter 1, then show updated progress (33%)', async function () {
    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToGoalsSection();

    await loggedInUser.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    await loggedInUser.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Place Values',
      true
    );

    await loggedInUser.submitGoalInRedesignedLearnerDashboard();

    await loggedInUser.expectGoalCardToBeVisible('Place Values');
    await loggedInUser.clickOnGoalCard('Place Values');

    await loggedInUser.clickLessonCardButton('What are the Place Values');

    await loggedInUser.expectContinueToNextCardButtonToBePresent(true);
    await loggedInUser.continueToNextCard();
    await loggedInUser.continueToNextCard();

    await loggedInUser.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToGoalsSection();
    await loggedInUser.expectGoalProgressToBeDisplayed('Place Values', 33);

    await loggedInUser.expectScreenshotToMatch(
      'chapter1CompletedWith33PercentProgress',
      __dirname
    );
  });

  it('should complete Chapter 2 and update progress to 66%', async function () {
    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToGoalsSection();
    await loggedInUser.clickOnGoalCard('Place Values');

    await loggedInUser.clickLessonCardButton('Find the Value of a Number');

    await loggedInUser.expectContinueToNextCardButtonToBePresent(true);
    await loggedInUser.continueToNextCard();
    await loggedInUser.continueToNextCard();

    await loggedInUser.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToGoalsSection();

    await loggedInUser.expectGoalProgressToBeDisplayed('Place Values', 66);

    await loggedInUser.expectScreenshotToMatch(
      'chapter2CompletedWith66PercentProgress',
      __dirname
    );
  });

  it('should complete final chapter and move goal to Completed section', async function () {
    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToGoalsSection();
    await loggedInUser.clickOnGoalCard('Place Values');

    await loggedInUser.expectLessonCardToBeVisible('Comparing Numbers');
    await loggedInUser.clickLessonCardButton('Comparing Numbers');

    await loggedInUser.expectContinueToNextCardButtonToBePresent(true);
    await loggedInUser.continueToNextCard();
    await loggedInUser.continueToNextCard();

    await loggedInUser.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToGoalsSection();

    await loggedInUser.expectGoalProgressToBeDisplayed('Place Values', 100);

    await loggedInUser.expectCompletedGoalsSectionInRedesignedDashboardToContain(
      "Place Values: Jamie's Adventures in the Arcade"
    );

    await loggedInUser.expectScreenshotToMatch(
      'chapter3CompletedWith100PercentProgress',
      __dirname
    );
  });

  it('should display correctly on mobile viewport', async function () {
    await loggedInUser.setMobileViewport();

    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToGoalsSection();

    await loggedInUser.expectGoalCardToBeVisible('Place Values');
    await loggedInUser.expectGoalProgressToBeDisplayed('Place Values', 100);

    await loggedInUser.expectMobileLayoutToBeCorrect();

    await loggedInUser.expectScreenshotToMatch('goalsTabMobileView', __dirname);
  });

  afterAll(async function () {
    await UserFactory.closeBrowserForUser(loggedInUser);
    await UserFactory.closeAllBrowsers();
  });
});
