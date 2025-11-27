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

describe('Logged-In Learner - Goals Tab: Interacting with Goals', function () {
  let learner: LoggedOutUser & LoggedInUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;
  let explorationId1: string;
  let explorationId2: string;
  let explorationId3: string;

  beforeAll(
    async function () {
      // Create users.
      learner = await UserFactory.createNewUser(
        'learnerGoalsInteract',
        'learner_goals_interact@example.com'
      );
      curriculumAdmin = await UserFactory.createNewUser(
        'curriculumInteract',
        'curriculum_interact@example.com',
        [ROLES.CURRICULUM_ADMIN]
      );
      releaseCoordinator = await UserFactory.createNewUser(
        'releaseCoordInteract',
        'release_coord_interact@example.com',
        [ROLES.RELEASE_COORDINATOR]
      );

      // Enable redesigned learner dashboard.
      await releaseCoordinator.enableFeatureFlag(
        'show_redesigned_learner_dashboard'
      );

      // Create 3 explorations with multiple chapters each.
      explorationId1 =
        await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
          'Place Values Part 1'
        );

      explorationId2 =
        await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
          'Place Values Part 2',
          'Math',
          false
        );

      explorationId3 =
        await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
          'Place Values Part 3',
          'Math',
          false
        );

      // Create topic first.
      await curriculumAdmin.createAndPublishTopic(
        'Place Values',
        "Jaime's Adventures in the Arcade",
        "Jaime's Adventures in the Arcade"
      );

      // Then create Math classroom with Place Values topic.
      await curriculumAdmin.createAndPublishClassroom(
        'Math',
        'math',
        'Place Values'
      );

      // Add story with 3 chapters.
      await curriculumAdmin.addStoryToTopic(
        "Jaime's Adventures in the Arcade",
        'jamies-adventures',
        'Place Values'
      );

      await curriculumAdmin.addChapter(
        'What are the Place Values?',
        explorationId1 as string
      );
      await curriculumAdmin.addChapter(
        'Find the Value of a Number',
        explorationId2 as string
      );
      await curriculumAdmin.addChapter(
        'Comparing Numbers',
        explorationId3 as string
      );

      await curriculumAdmin.saveStoryDraft();
      await curriculumAdmin.publishStoryDraft();
    },
    // Test takes longer than default timeout.
    600000
  );

  it('should add a goal and verify initial state', async function () {
    // Navigate to learner dashboard Goals tab.
    await learner.navigateToLearnerDashboardUsingProfileDropdown();
    await learner.navigateToGoalsSection();

    // Add Place Values goal.
    await learner.addGoalInRedesignedLearnerDashboard('Place Values');

    // Verify goal card appears with 0% progress.
    await learner.expectGoalCardToBeVisible('Place Values');
    await learner.expectGoalProgressToBeDisplayed('Place Values', 0);

    // Verify "Start" button is visible.
    await learner.expectGoalCardButtonLabel('Place Values', 'Start');
  });

  it('should drill down into goal and see lesson cards', async function () {
    // Click on the goal card to drill down.
    await learner.clickOnGoalCard('Place Values');

    // Verify navigation to goal detail page.
    await learner.expectGoalDetailPageToBeDisplayed('Place Values');

    // Verify lesson cards are visible.
    await learner.expectLessonCardToBeVisible('What are the Place Values?');
    await learner.expectLessonCardToBeVisible('Find the Value of a Number');
    await learner.expectLessonCardToBeVisible('Comparing Numbers');

    // Verify all have "Start" buttons.
    await learner.expectLessonCardButtonLabel(
      'What are the Place Values?',
      'Start'
    );
  });

  it('should start first lesson and verify progress update', async function () {
    // Start first lesson.
    await learner.clickLessonCardButton('What are the Place Values?');

    // Verify exploration player loads.
    await learner.expectExplorationPlayerToBeLoaded();

    // Complete the lesson (assuming minimal exploration).
    await learner.completeCurrentLesson();

    // Return to learner dashboard.
    await learner.navigateToLearnerDashboardUsingOppiaLogo();
    await learner.navigateToGoalsSection();

    // Verify goal progress updated (33% for 1 of 3 lessons).
    await learner.expectGoalProgressToBeDisplayed('Place Values', 33);

    // Verify button changed to "Resume" or "Continue".
    await learner.expectGoalCardButtonLabel('Place Values', 'Resume');
  });

  it('should resume goal and see next lesson ready to start', async function () {
    // Click Resume on goal card.
    await learner.clickOnGoalCard('Place Values');

    // Verify first lesson shows as completed.
    await learner.expectLessonCardToShowCompleted('What are the Place Values?');

    // Verify second lesson has "Start" button.
    await learner.expectLessonCardButtonLabel(
      'Find the Value of a Number',
      'Start'
    );
  });

  it('should start second lesson partially and verify "Resume" state', async function () {
    // Start second lesson.
    await learner.clickLessonCardButton('Find the Value of a Number');

    // Verify exploration player loads.
    await learner.expectExplorationPlayerToBeLoaded();

    // Partially complete the lesson (do NOT finish).
    await learner.interactWithLessonPartially();

    // Return to learner dashboard.
    await learner.navigateToLearnerDashboardUsingOppiaLogo();
    await learner.navigateToGoalsSection();
    await learner.clickOnGoalCard('Place Values');

    // Verify second lesson shows "Resume" button.
    await learner.expectLessonCardButtonLabel(
      'Find the Value of a Number',
      'Resume'
    );

    // Verify progress still shows partial completion.
    await learner.navigateToGoalsSection();
    await learner.expectGoalProgressToBeDisplayed('Place Values', 33);
  });

  it('should complete remaining lessons and verify 100% progress', async function () {
    // Navigate back to goal details.
    await learner.clickOnGoalCard('Place Values');

    // Resume and complete second lesson.
    await learner.clickLessonCardButton('Find the Value of a Number');
    await learner.completeCurrentLesson();

    // Return and start third lesson.
    await learner.navigateToLearnerDashboardUsingOppiaLogo();
    await learner.navigateToGoalsSection();
    await learner.clickOnGoalCard('Place Values');
    await learner.clickLessonCardButton('Comparing Numbers');
    await learner.completeCurrentLesson();

    // Return to Goals tab.
    await learner.navigateToLearnerDashboardUsingOppiaLogo();
    await learner.navigateToGoalsSection();

    // Verify goal shows 100% progress.
    await learner.expectGoalProgressToBeDisplayed('Place Values', 100);

    // Verify goal moved to "Completed" section or marked complete.
    await learner.expectGoalCardToShowCompleted('Place Values');
  });

  it('should verify Goals tab sidebar button has green highlight', async function () {
    // Navigate to learner dashboard.
    await learner.navigateToLearnerDashboardUsingProfileDropdown();

    // Verify Goals tab button exists.
    await learner.expectGoalsTabButtonToBeVisible();

    // Click Goals tab.
    await learner.navigateToGoalsSection();

    // Verify green highlight/active state on Goals button.
    await learner.expectGoalsTabButtonToBeActive();
  });

  it('should verify UI consistency on mobile viewport', async function () {
    // Set viewport to mobile size.
    await learner.setMobileViewport();

    // Navigate to Goals tab.
    await learner.navigateToLearnerDashboardUsingProfileDropdown();
    await learner.navigateToGoalsSection();

    // Verify goal cards are visible and properly formatted.
    await learner.expectGoalCardToBeVisible('Place Values');
    await learner.expectGoalProgressToBeDisplayed('Place Values', 100);

    // Verify responsive layout.
    await learner.expectMobileLayoutToBeCorrect();

    // Reset viewport to desktop.
    await learner.setDesktopViewport();
  });

  it('should navigate between lessons within goal using navigation controls', async function () {
    // Drill down into goal.
    await learner.clickOnGoalCard('Place Values');

    // Click on first lesson.
    await learner.clickLessonCard('What are the Place Values?');

    // Use navigation controls to move to next lesson.
    await learner.clickNextLessonButton();

    // Verify second lesson loads.
    await learner.expectCurrentLessonTitleToBe('Find the Value of a Number');

    // Use back button to return to first lesson.
    await learner.clickPreviousLessonButton();

    // Verify first lesson loads.
    await learner.expectCurrentLessonTitleToBe('What are the Place Values?');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
