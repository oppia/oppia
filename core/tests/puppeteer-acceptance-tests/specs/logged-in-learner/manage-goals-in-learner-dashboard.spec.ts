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

  it('should navigate to Goals tab and see empty state with description', async function () {
    // Navigate to learner dashboard.
    await loggedInUser.navigateToLearnerDashboardUsingProfileDropdown();
    await loggedInUser.navigateToGoalsSection();

    // Verify Goals tab is active with greeting.
    await loggedInUser.expectLearnerGreetingsToBe("loggedInUser1's Goals");
    // Verify add goals button is visible.
    await loggedInUser.expectAddGoalsButtonToBeVisible();
  });

  it('should open add goals modal and display available topics', async function () {
    // Click add goals button.
    await loggedInUser.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    // Verify modal displays with classroom topics.
    await loggedInUser.expectAddGoalsModalToBeDisplayed();
    await loggedInUser.expectGoalCheckboxToBeVisible('Division');
    await loggedInUser.expectGoalCheckboxToBeVisible('Place Values');
  });

  it('should add a single goal successfully', async function () {
    await loggedInUser.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    // Select Division topic.
    await loggedInUser.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Division',
      true
    );

    // Submit goals.
    await loggedInUser.submitGoalInRedesignedLearnerDashboard();

    // Verify success message.
    await loggedInUser.expectToastMessage(
      "Successfully added to your 'Current Goals' list."
    );

    // Verify "In Progress" section appears.
    await loggedInUser.expectRedesignedGoalsSectionToContainHeading('In Progress');

    // Verify goal card appears.
    await loggedInUser.expectGoalCardToBeVisible('Division');
  });

  it('should add multiple goals up to maximum limit (5)', async function () {
    // Open add goals modal again.
    await loggedInUser.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    // Add Place Values (Division already added).
    await loggedInUser.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Place Values',
      true
    );

    // Submit goals.
    await loggedInUser.submitGoalInRedesignedLearnerDashboard();

    // Verify all goals are visible.
    await loggedInUser.expectGoalCardToBeVisible('Division');
    await loggedInUser.expectGoalCardToBeVisible('Place Values');

    // Verify progress bars show 0%.
    await loggedInUser.expectGoalProgressToBeDisplayed('Division', 0);
    await loggedInUser.expectGoalProgressToBeDisplayed('Place Values', 0);
  });

  it('should disable checkboxes when maximum goal limit is reached', async function () {
    // Verify all available topics are selected.
    await loggedInUser.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    // Both topics should be checked.
    await loggedInUser.expectGoalCheckboxToBeChecked('Division', true);
    await loggedInUser.expectGoalCheckboxToBeChecked('Place Values', true);

    // Close modal.
    await loggedInUser.cancelGoalModalInRedesignedLearnerDashboard();
  });

  it('should remove a goal and verify UI updates', async function () {
    // Open add goals modal.
    await loggedInUser.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    // Uncheck Place Values.
    await loggedInUser.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Place Values',
      false
    );

    // Submit.
    await loggedInUser.submitGoalInRedesignedLearnerDashboard();

    // Verify remove confirmation modal.
    await loggedInUser.expectRemoveActivityModelToBeDisplayed(
      "Remove from 'Current Goals' list?",
      "Are you sure you want to remove 'Place Values' from your 'Current Goals' list?"
    );

    // Confirm removal.
    await loggedInUser.clickButtonInRemoveActivityModal('Remove');

    // Verify Place Values is no longer visible.
    await loggedInUser.expectGoalCardToBeVisible('Place Values', false);

    // Verify other goals still visible.
    await loggedInUser.expectGoalCardToBeVisible('Division');
  });

  it('should remove all goals and return to empty state', async function () {
    // Open add goals modal.
    await loggedInUser.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    // Uncheck remaining goal.
    await loggedInUser.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Division',
      false
    );

    // Submit.
    await loggedInUser.submitGoalInRedesignedLearnerDashboard();

    // Confirm removal for Division.
    await loggedInUser.expectRemoveActivityModelToBeDisplayed(
      "Remove from 'Current Goals' list?",
      "Are you sure you want to remove 'Division' from your 'Current Goals' list?"
    );
    await loggedInUser.clickButtonInRemoveActivityModal('Remove');
    // Verify "In Progress" section is no longer visible.
    await loggedInUser.expectRedesignedGoalsSectionToContainHeading(
      'In Progress',
      false
    );

    // Verify empty state with add goals button.
    await loggedInUser.expectAddGoalsButtonToBeVisible();
  });

  it('should cancel adding goals without making changes', async function () {
    // Open add goals modal.
    await loggedInUser.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

    // Select a goal but cancel.
    await loggedInUser.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Place Values',
      true
    );

    // Cancel modal.
    await loggedInUser.cancelGoalModalInRedesignedLearnerDashboard();

    // Verify no goals were added (empty state after removing all).
    await loggedInUser.expectRedesignedGoalsSectionToContainHeading(
      'In Progress',
      false
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
