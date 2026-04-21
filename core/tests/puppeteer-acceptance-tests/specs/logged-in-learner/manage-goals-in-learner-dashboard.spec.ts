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

describe('Logged-In Learner - Manage Goals', function () {
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

  it('should display empty Goals tab with title and Add Goals button', async function () {
    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToGoalsSection();

    await loggedInUser.expectLearnerGreetingsToBe("loggedInUser1's Goals");

    await loggedInUser.expectScreenshotToMatch(
      'goalsTabEmptyStateWithAddGoalsButton',
      __dirname
    );
  });

  it('should open add goals modal with topic checkbox and cancel', async function () {
    await loggedInUser.clickOnAddGoalsButtonInRedesignedLearnerDashboard();
    await loggedInUser.expectAddGoalsModalToBeDisplayed();

    await loggedInUser.expectGoalCheckboxToBeVisible('Place Values');

    await loggedInUser.expectScreenshotToMatch(
      'addGoalsModalInitial',
      __dirname
    );

    await loggedInUser.cancelGoalModalInRedesignedLearnerDashboard();
  });

  it('should add Place Values goal and display In Progress card (0%)', async function () {
    await loggedInUser.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    await loggedInUser.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Place Values',
      true
    );

    await loggedInUser.submitGoalInRedesignedLearnerDashboard();

    await loggedInUser.expectToastMessage(
      "Successfully added to your 'Current Goals' list."
    );

    await loggedInUser.expectRedesignedGoalsSectionToContainHeading(
      'In Progress'
    );
    await loggedInUser.expectGoalCardToBeVisible('Place Values');

    await loggedInUser.expectScreenshotToMatch(
      'goalsTabInProgressCardZeroPercent',
      __dirname
    );
  });

  it('should prompt for goal removal when unchecked in modal', async function () {
    await loggedInUser.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    await loggedInUser.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Place Values',
      false
    );
    await loggedInUser.submitGoalInRedesignedLearnerDashboard();

    await loggedInUser.expectRemoveActivityModelToBeDisplayed(
      "Remove from 'Current Goals' list?",
      "Are you sure you want to remove 'Place Values' from your 'Current Goals' list?"
    );

    await loggedInUser.expectScreenshotToMatch(
      'removeGoalConfirmationModal',
      __dirname
    );

    await loggedInUser.clickButtonInRemoveActivityModal('Remove');
    await loggedInUser.expectGoalCardToBeVisible('Place Values', false);
  });

  it('should return to empty state after removal', async function () {
    await loggedInUser.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    await loggedInUser.expectGoalCheckboxToBeVisible('Place Values');
    await loggedInUser.cancelGoalModalInRedesignedLearnerDashboard();

    await loggedInUser.expectRedesignedGoalsSectionToContainHeading(
      'In Progress',
      false
    );

    await loggedInUser.expectAddGoalsButtonToBeVisible();
  });

  it('should not save checkbox selection when closing modal', async function () {
    await loggedInUser.clickOnAddGoalsButtonInRedesignedLearnerDashboard();
    await loggedInUser.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Place Values',
      true
    );

    await loggedInUser.cancelGoalModalInRedesignedLearnerDashboard();

    await loggedInUser.expectRedesignedGoalsSectionToContainHeading(
      'In Progress',
      false
    );
  });

  it('should show goal card with 0% and Start button after adding goal', async function () {
    await loggedInUser.navigateToLearnerDashboard();
    await loggedInUser.navigateToGoalsSection();

    await loggedInUser.addGoalInRedesignedLearnerDashboard('Place Values');

    await loggedInUser.expectGoalCardToBeVisible('Place Values');
    await loggedInUser.expectGoalProgressToBeDisplayed('Place Values', 0);
    await loggedInUser.expectGoalCardButtonLabel('Place Values', 'Start');
  });

  it('should expand Place Values and show all lessons with Start buttons', async function () {
    await loggedInUser.clickOnGoalCard('Place Values');

    await loggedInUser.expectGoalDetailPageToBeDisplayed('Place Values');

    await loggedInUser.expectLessonCardToBeVisible('What are the Place Values');
    await loggedInUser.expectLessonCardToBeVisible(
      'Find the Value of a Number'
    );
    await loggedInUser.expectLessonCardToBeVisible('Comparing Numbers');

    await loggedInUser.expectLessonCardButtonLabel(
      'What are the Place Values',
      'Start'
    );

    await loggedInUser.expectScreenshotToMatch(
      'goalDetailExpandedLessonList',
      __dirname
    );
  });

  it('should highlight Goals tab in sidebar', async function () {
    await loggedInUser.navigateToLearnerDashboard();

    await loggedInUser.expectGoalsTabButtonToBeVisible();
    await loggedInUser.navigateToGoalsSection();
    await loggedInUser.expectGoalsTabButtonToBeActive();

    await loggedInUser.expectScreenshotToMatch(
      'goalsTabSidebarHighlighted',
      __dirname
    );
  });

  afterAll(async function () {
    await UserFactory.closeBrowserForUser(loggedInUser);
    await UserFactory.closeAllBrowsers();
  });
});
