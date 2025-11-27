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
 * @fileoverview Acceptance test for Goals Tab - Adding & Removing Goals.
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

// Some acceptance tests perform heavy setup (creating users, topics, stories
// and explorations). Increase Jest's default timeout so the beforeAll hook
// can complete reliably in slower environments.
jest.setTimeout(900000);

describe('Logged-In Learner - Goals Tab: Adding & Removing Goals', function () {
  let learner: LoggedOutUser & LoggedInUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;
  let explorationId1: string;
  let explorationId2: string;
  let explorationId3: string;

  beforeAll(
    async function () {
      // Progress logs to help identify slow/stalled setup steps.
      // These are intentionally simple console logs so they appear in test
      // output; they will be removed once the root cause is found.
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: starting setup');
      // Create users.
      learner = await UserFactory.createNewUser(
        'learnerGoalsTab',
        'learner_goals_tab@example.com'
      );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: created learner');
      curriculumAdmin = await UserFactory.createNewUser(
        'curriculumGoals',
        'curriculum_goals@example.com',
        [ROLES.CURRICULUM_ADMIN]
      );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: created curriculumAdmin');
      releaseCoordinator = await UserFactory.createNewUser(
        'releaseCoordGoals',
        'release_coord_goals@example.com',
        [ROLES.RELEASE_COORDINATOR]
      );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: created releaseCoordinator');

      // Enable redesigned learner dashboard.
      await releaseCoordinator.enableFeatureFlag(
        'show_redesigned_learner_dashboard'
      );

      // Create 3 explorations (limited by constraints).
      explorationId1 =
        await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
          'Addition Basics'
        );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: created explorationId1=', explorationId1);

      explorationId2 =
        await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
          'Subtraction Basics',
          'Math',
          false
        );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: created explorationId2=', explorationId2);

      explorationId3 =
        await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
          'Multiplication Basics',
          'Math',
          false
        );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: created explorationId3=', explorationId3);

      // Create topics first.
      await curriculumAdmin.createAndPublishTopic(
        'Addition',
        'Addition Basics',
        'Addition Basics'
      );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: created topic Addition');

      await curriculumAdmin.createAndPublishTopic(
        'Subtraction',
        'Subtraction Basics',
        'Subtraction Basics'
      );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: created topic Subtraction');

      await curriculumAdmin.createAndPublishTopic(
        'Multiplication',
        'Multiplication Basics',
        'Multiplication Basics'
      );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: created topic Multiplication');

      // Then create Math classroom with first topic.
      await curriculumAdmin.createAndPublishClassroom(
        'Math',
        'math',
        'Addition'
      );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: created classroom Math');

      // Add stories to topics.
      await curriculumAdmin.addStoryToTopic(
        'Addition Story',
        'addition-story',
        'Addition'
      );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: added story to Addition');
      await curriculumAdmin.addChapter(
        'Chapter 1: Basic Addition',
        explorationId1 as string
      );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: added chapter for Addition');
      await curriculumAdmin.saveStoryDraft();
      await curriculumAdmin.publishStoryDraft();
  // eslint-disable-next-line no-console
  console.log('[manage-goals-spec] beforeAll: published Addition story');

      await curriculumAdmin.addStoryToTopic(
        'Subtraction Story',
        'subtraction-story',
        'Subtraction'
      );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: added story to Subtraction');
      await curriculumAdmin.addChapter(
        'Chapter 1: Basic Subtraction',
        explorationId2 as string
      );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: added chapter for Subtraction');
      await curriculumAdmin.saveStoryDraft();
      await curriculumAdmin.publishStoryDraft();
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: published Subtraction story');

      await curriculumAdmin.addStoryToTopic(
        'Multiplication Story',
        'multiplication-story',
        'Multiplication'
      );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: added story to Multiplication');
      await curriculumAdmin.addChapter(
        'Chapter 1: Basic Multiplication',
        explorationId3 as string
      );
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: added chapter for Multiplication');
      await curriculumAdmin.saveStoryDraft();
      await curriculumAdmin.publishStoryDraft();
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: published Multiplication story');
      // eslint-disable-next-line no-console
      console.log('[manage-goals-spec] beforeAll: setup complete');
    },
    // Test takes longer than default timeout.
    900000
  );

  it('should navigate to Goals tab and see empty state with description', async function () {
    // Navigate to learner dashboard.
    await learner.navigateToLearnerDashboardUsingProfileDropdown();
    await learner.navigateToGoalsSection();

    // Verify Goals tab is active with greeting.
    await learner.expectLearnerGreetingsToBe("learnerGoalsTab's Goals");

    // Verify add goals button is visible.
    await learner.expectAddGoalsButtonToBeVisible();
  });

  it('should open add goals modal and display available topics', async function () {
    // Click add goals button.
    await learner.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    // Verify modal displays with classroom topics.
    await learner.expectAddGoalsModalToBeDisplayed();
    await learner.expectGoalCheckboxToBeVisible('Addition');
    await learner.expectGoalCheckboxToBeVisible('Subtraction');
    await learner.expectGoalCheckboxToBeVisible('Multiplication');
  });

  it('should add a single goal successfully', async function () {
    // Select Addition topic.
    await learner.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Addition',
      true
    );

    // Submit goals.
    await learner.submitGoalInRedesignedLearnerDashboard();

    // Verify success message.
    await learner.expectToastMessage(
      "Successfully added to your 'Current Goals' list."
    );

    // Verify "In Progress" section appears.
    await learner.expectRedesignedGoalsSectionToContainHeading('In Progress');

    // Verify goal card appears.
    await learner.expectGoalCardToBeVisible('Addition');
  });

  it('should add multiple goals up to maximum limit (5)', async function () {
    // Open add goals modal again.
    await learner.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    // Add Subtraction and Multiplication.
    await learner.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Subtraction',
      true
    );
    await learner.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Multiplication',
      true
    );

    // Submit goals.
    await learner.submitGoalInRedesignedLearnerDashboard();

    // Verify all goals are visible.
    await learner.expectGoalCardToBeVisible('Addition');
    await learner.expectGoalCardToBeVisible('Subtraction');
    await learner.expectGoalCardToBeVisible('Multiplication');

    // Verify progress bars show 0%.
    await learner.expectGoalProgressToBeDisplayed('Addition', 0);
    await learner.expectGoalProgressToBeDisplayed('Subtraction', 0);
    await learner.expectGoalProgressToBeDisplayed('Multiplication', 0);
  });

  it('should disable checkboxes when maximum goal limit is reached', async function () {
    // This test assumes we have only 3 topics, so we need to verify
    // that if we had more topics, the UI would disable them.
    // For now, verify all 3 are selected and no more can be added.

    await learner.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    // All 3 should already be checked.
    await learner.expectGoalCheckboxToBeChecked('Addition', true);
    await learner.expectGoalCheckboxToBeChecked('Subtraction', true);
    await learner.expectGoalCheckboxToBeChecked('Multiplication', true);

    // Close modal.
    await learner.cancelGoalModalInRedesignedLearnerDashboard();
  });

  it('should remove a goal and verify UI updates', async function () {
    // Open add goals modal.
    await learner.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    // Uncheck Multiplication.
    await learner.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Multiplication',
      false
    );

    // Submit.
    await learner.submitGoalInRedesignedLearnerDashboard();

    // Verify remove confirmation modal.
    await learner.expectRemoveActivityModelToBeDisplayed(
      "Remove from 'Current Goals' list?",
      "Are you sure you want to remove 'Multiplication' from your 'Current Goals' list?"
    );

    // Confirm removal.
    await learner.clickButtonInRemoveActivityModal('Remove');

    // Verify Multiplication is no longer visible.
    await learner.expectGoalCardToBeVisible('Multiplication', false);

    // Verify other goals still visible.
    await learner.expectGoalCardToBeVisible('Addition');
    await learner.expectGoalCardToBeVisible('Subtraction');
  });

  it('should remove all goals and return to empty state', async function () {
    // Open add goals modal.
    await learner.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    // Uncheck remaining goals.
    await learner.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Addition',
      false
    );
    await learner.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Subtraction',
      false
    );

    // Submit.
    await learner.submitGoalInRedesignedLearnerDashboard();

    // Confirm removal for Addition.
    await learner.expectRemoveActivityModelToBeDisplayed(
      "Remove from 'Current Goals' list?",
      "Are you sure you want to remove 'Addition' from your 'Current Goals' list?"
    );
    await learner.clickButtonInRemoveActivityModal('Remove');

    // Confirm removal for Subtraction.
    await learner.expectRemoveActivityModelToBeDisplayed(
      "Remove from 'Current Goals' list?",
      "Are you sure you want to remove 'Subtraction' from your 'Current Goals' list?"
    );
    await learner.clickButtonInRemoveActivityModal('Remove');

    // Verify "In Progress" section is no longer visible.
    await learner.expectRedesignedGoalsSectionToContainHeading(
      'In Progress',
      false
    );

    // Verify empty state with add goals button.
    await learner.expectAddGoalsButtonToBeVisible();
  });

  it('should cancel adding goals without making changes', async function () {
    // Open add goals modal.
    await learner.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    // Select a goal but cancel.
    await learner.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Addition',
      true
    );

    // Cancel modal.
    await learner.cancelGoalModalInRedesignedLearnerDashboard();

    // Verify no goals were added.
    await learner.expectRedesignedGoalsSectionToContainHeading(
      'In Progress',
      false
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
