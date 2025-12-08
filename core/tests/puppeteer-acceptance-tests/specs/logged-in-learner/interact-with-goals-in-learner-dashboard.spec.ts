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
 * @fileoverview Acceptance test for Goals Tab - Interacting with Goals.
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

describe('Logged-in User', function () {
  jest.setTimeout(6000000);
  let loggedInUser: LoggedInUser & LoggedOutUser;
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
      'Place Values Introduction',
      'Place Values Practice',
    ];

    // Create and publish Division story with two chapters.
    const divisionChapterIds: string[] = [];
    const divisionChapters = [
      'Introduction to Division',
      'Division Practice',
    ];

    for (const chapter of divisionChapters) {
      const expId = await curriculumAdmin.createAndPublishExplorationWithCards(
        chapter,
        'Algebra',
        3
      );
      divisionChapterIds.push(expId ?? '');
    }

    await curriculumAdmin.addStoryToTopic(
      'Learning Division',
      'division-story',
      'Division'
    );

    for (const [index, id] of divisionChapterIds.entries()) {
      await curriculumAdmin.addChapter(divisionChapters[index], id as string);
    }

    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();

    // Create and publish Place Values story with two chapters.
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

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );
  });
  it('should add a goal and verify initial state', async function () {
    // Navigate to learner dashboard Goals tab.
    await loggedInUser.navigateToLearnerDashboardUsingProfileDropdown();
    await loggedInUser.navigateToGoalsSection();

    // Add Place Values goal.
    await loggedInUser.addGoalInRedesignedLearnerDashboard('Place Values');

    // Verify goal card appears with 0% progress.
    await loggedInUser.expectGoalCardToBeVisible('Place Values');
    await loggedInUser.expectGoalProgressToBeDisplayed('Place Values', 0);

    // Verify "Start" button is visible.
    await loggedInUser.expectGoalCardButtonLabel('Place Values', 'Start');
  });

  it('should drill down into goal and see lesson cards', async function () {
    // Click on the goal card to drill down.
    await loggedInUser.clickOnGoalCard('Place Values');

    // Verify navigation to goal detail page.
    await loggedInUser.expectGoalDetailPageToBeDisplayed('Place Values');

    // Verify lesson cards are visible.
    await loggedInUser.expectLessonCardToBeVisible('Place Values Introduction');
    await loggedInUser.expectLessonCardToBeVisible('Place Values Practice');

    // Verify all have "Start" buttons.
    await loggedInUser.expectLessonCardButtonLabel(
      'Place Values Introduction',
      'Start'
    );
  });

  it('should start first lesson and verify progress update', async function () {
    // Start first lesson.
    await loggedInUser.clickLessonCardButton('Place Values Introduction');

    // Verify exploration player loads.
    await loggedInUser.expectExplorationPlayerToBeLoaded();

    // Complete the lesson (assuming minimal exploration).
    await loggedInUser.completeCurrentLesson();

    // Return to learner dashboard.
    await loggedInUser.navigateToLearnerDashboardUsingOppiaLogo();
    await loggedInUser.navigateToGoalsSection();

    // Verify goal progress updated (50% for 1 of 2 lessons).
    await loggedInUser.expectGoalProgressToBeDisplayed('Place Values', 50);

    // Verify button changed to "Resume" or "Continue".
    await loggedInUser.expectGoalCardButtonLabel('Place Values', 'Resume');
  });

  it('should resume goal and see next lesson ready to start', async function () {
    // Click Resume on goal card.
    await loggedInUser.clickOnGoalCard('Place Values');

    // Verify first lesson shows as completed.
    await loggedInUser.expectLessonCardToShowCompleted('Place Values Introduction');

    // Verify second lesson has "Start" button.
    await loggedInUser.expectLessonCardButtonLabel(
      'Place Values Practice',
      'Start'
    );
  });

  it('should start second lesson partially and verify "Resume" state', async function () {
    // Start second lesson.
    await loggedInUser.clickLessonCardButton('Place Values Practice');

    // Verify exploration player loads.
    await loggedInUser.expectExplorationPlayerToBeLoaded();

    // Partially complete the lesson (do NOT finish).
    await loggedInUser.interactWithLessonPartially();

    // Return to learner dashboard.
    await loggedInUser.navigateToLearnerDashboardUsingOppiaLogo();
    await loggedInUser.navigateToGoalsSection();
    await loggedInUser.clickOnGoalCard('Place Values');

    // Verify second lesson shows "Resume" button.
    await loggedInUser.expectLessonCardButtonLabel(
      'Place Values Practice',
      'Resume'
    );

    // Verify progress still shows partial completion.
    await loggedInUser.navigateToGoalsSection();
    await loggedInUser.expectGoalProgressToBeDisplayed('Place Values', 50);
  });

  it('should complete remaining lessons and verify 100% progress', async function () {
    // Navigate back to goal details.
    await loggedInUser.clickOnGoalCard('Place Values');

    // Resume and complete second lesson.
    await loggedInUser.clickLessonCardButton('Place Values Practice');
    await loggedInUser.completeCurrentLesson();

    // Return to Goals tab.
    await loggedInUser.navigateToLearnerDashboardUsingOppiaLogo();
    await loggedInUser.navigateToGoalsSection();

    // Verify goal shows 100% progress.
    await loggedInUser.expectGoalProgressToBeDisplayed('Place Values', 100);

    // Verify goal moved to "Completed" section or marked complete.
    await loggedInUser.expectGoalCardToShowCompleted('Place Values');
  });

  it('should verify Goals tab sidebar button has green highlight', async function () {
    // Navigate to learner dashboard.
    await loggedInUser.navigateToLearnerDashboardUsingProfileDropdown();

    // Verify Goals tab button exists.
    await loggedInUser.expectGoalsTabButtonToBeVisible();

    // Click Goals tab.
    await loggedInUser.navigateToGoalsSection();

    // Verify green highlight/active state on Goals button.
    await loggedInUser.expectGoalsTabButtonToBeActive();
  });

  it('should verify UI consistency on mobile viewport', async function () {
    // Set viewport to mobile size.
    await loggedInUser.setMobileViewport();

    // Navigate to Goals tab.
    await loggedInUser.navigateToLearnerDashboardUsingProfileDropdown();
    await loggedInUser.navigateToGoalsSection();

    // Verify goal cards are visible and properly formatted.
    await loggedInUser.expectGoalCardToBeVisible('Place Values');
    await loggedInUser.expectGoalProgressToBeDisplayed('Place Values', 100);

    // Verify responsive layout.
    await loggedInUser.expectMobileLayoutToBeCorrect();

    // Reset viewport to desktop.
    await loggedInUser.setDesktopViewport();
  });

  it('should navigate between lessons within goal using navigation controls', async function () {
    // Drill down into goal.
    await loggedInUser.clickOnGoalCard('Place Values');

    // Click on first lesson.
    await loggedInUser.clickLessonCard('Place Values Introduction');

    // Use navigation controls to move to next lesson.
    await loggedInUser.clickNextLessonButton();

    // Verify second lesson loads.
    await loggedInUser.expectCurrentLessonTitleToBe('Place Values Practice');

    // Use back button to return to first lesson.
    await loggedInUser.clickPreviousLessonButton();

    // Verify first lesson loads.
    await loggedInUser.expectCurrentLessonTitleToBe('Place Values Introduction');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
