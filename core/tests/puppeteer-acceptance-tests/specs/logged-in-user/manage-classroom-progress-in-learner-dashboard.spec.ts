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
 * @fileoverview Acceptance tests for learner dashboard functionalities, specfically
 * interactions with components that use classroom data across all tabs.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in User', function () {
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

    await curriculumAdmin.createNewClassroom('Math', 'math');
    await curriculumAdmin.updateClassroom(
      'Math',
      'Welcome to Math classroom!',
      'This course covers basic operations.',
      'In this course, you will learn the following topics: Place Values.'
    );

    await curriculumAdmin.createAndPublishTopic(
      'Place Values',
      'Place Values subtopics',
      'Place Values skills'
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
      const id =
        await curriculumAdmin.createAndPublishExplorationWithCards(chapter);
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

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );
  }, 480000);

  /**
   * TODO(#22070): Add tests for home tab. Interactions involving recommended
   * lessons, in-progress lessons, topics available, and saved lessons sections.
   */

  /**
   * TODO(#22070): Add tests for goals tab, all interactions.
   */
  it(
    'should be able to manage goals, track progress, and mark lessons as complete',
    async function () {
      // Log in as a creator with username "explorationCreator".
      await loggedInUser.loginAsCreator('explorationCreator');

      // Create a Math classroom with 5 topics and assign lessons to each topic.
      await loggedInUser.createClassroom('Math');
      await loggedInUser.addTopic('Addition');
      await loggedInUser.addTopic('Subtraction');
      await loggedInUser.addTopic('Multiplication');
      await loggedInUser.addTopic('Division');
      await loggedInUser.addTopic('Place Values');

      // Adding lessons under Place Values topic.
      await loggedInUser.addLesson(
        'Place Values',
        'What are the Place Values?'
      );
      await loggedInUser.addLesson(
        'Place Values',
        'Find the Value of a Number'
      );
      await loggedInUser.addLesson('Place Values', 'Comparing Numbers');
      await loggedInUser.addLesson('Place Values', 'Rounding Numbers, Part 1');
      await loggedInUser.addLesson('Place Values', 'Rounding Numbers, Part 2');

      // Adding lessons under Division topic.
      await loggedInUser.addLesson('Division', 'What is Division?');
      await loggedInUser.addLesson('Division', 'Remainders and Special Cases');
      await loggedInUser.addLesson('Division', 'Division by Multiples of Tens');

      // Log out.
      await loggedInUser.logout();

      // Log in as a user with username "Learner Dashboard Goal Tab" and email user@example.com.
      await loggedInUser.login('user@example.com');

      // Navigate to Learner Dashboard Goals section.
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.selectSidebarOption('Goals');

      // The user should land on Goals tab with a description and add goals button.
      await loggedInUser.expectGoalsTabToBeDisplayed();
      await loggedInUser.expectAddGoalsButtonToBeVisible();

      // Click the "Add Goals" button to open the modal.
      await loggedInUser.openAddGoalsModal();

      // Modal should show all lessons with checkboxes unchecked and Save/Cancel buttons.
      await loggedInUser.expectAddGoalsModalToBeVisible();

      // Check 5 random checkboxes.
      await loggedInUser.checkRandomGoals(5);
      await loggedInUser.expectRemainingGoalsToBeDisabled();

      // Uncheck one box and ensure remaining goals are active.
      await loggedInUser.uncheckRandomGoal();
      await loggedInUser.expectRemainingGoalsToBeActive();

      // Uncheck all boxes except for "Place Values" and click "Save".
      await loggedInUser.uncheckAllExceptForGoal('Place Values');
      await loggedInUser.clickSave();

      // Verify "Place Values" appears in the In Progress section with progress bar at 0.
      await loggedInUser.expectGoalToBeInProgress('Place Values', 0);

      // Select "Add Goals" again, uncheck "Place Values" and click "Cancel".
      await loggedInUser.openAddGoalsModal();
      await loggedInUser.uncheckGoal('Place Values');
      await loggedInUser.clickCancel();

      // Check that "Place Values" remains checked and In Progress.
      await loggedInUser.expectGoalToBeInProgress('Place Values', 0);

      // Uncheck "Place Values" and click "Save".
      await loggedInUser.uncheckGoal('Place Values');
      await loggedInUser.clickSave();

      // Verify that "Place Values" is no longer in In Progress.
      await loggedInUser.expectGoalToNotBeInProgress('Place Values');

      // Check "Place Values" again and click "Save".
      await loggedInUser.checkGoal('Place Values');
      await loggedInUser.clickSave();

      // Verify "Place Values" appears in the In Progress section with a progress bar at 0.
      await loggedInUser.expectGoalToBeInProgress('Place Values', 0);

      // Select "Display More" for "Place Values" to show chapters.
      await loggedInUser.openChapterListForGoal('Place Values');

      // Verify chapters display with completion percentages.
      await loggedInUser.verifyChaptersDisplayForGoal('Place Values');

      // Select "Start" for Chapter 1 and complete it.
      await loggedInUser.startChapter('What are Place Values?');
      await loggedInUser.completeChapter('What are Place Values?');

      // Verify the goal progress in the Goals tab.
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.verifyGoalProgress('Place Values', 100);

      // Verify the "Completed" section in the Goals tab.
      await loggedInUser.expectCompletedGoalsToInclude(['Place Values']);

      // Select "Progress" on sidebar and verify "Place Values" under "Completed".
      await loggedInUser.selectSidebarOption('Progress');
      await loggedInUser.expectCompletedGoalsToInclude(['Place Values']);

      // Add "Division" goal and click Save.
      await loggedInUser.addGoals(['Division']);
      await loggedInUser.expectGoalToBeInProgress('Division', 0);

      // Verify "Place Values" remains in the "Completed" section.
      await loggedInUser.expectCompletedGoalsToInclude(['Place Values']);

      // Select "Start" for Chapter 1 in Division.
      await loggedInUser.startChapter('What is Division?');

      // Complete Chapter 1 in Division and verify progress.
      await loggedInUser.completeChapter('What is Division?');
      await loggedInUser.verifyGoalProgress('Division', 33);

      // Select "Add Goals" and verify that "Place Values" is checked and disabled.
      await loggedInUser.openAddGoalsModal();
      await loggedInUser.expectGoalToBeCheckedAndDisabled('Place Values');

      // Click on "Save" and verify "Place Values" remains in the "Completed" section.
      await loggedInUser.clickSave();
      await loggedInUser.expectCompletedGoalsToInclude(['Place Values']);

      // Verify "In Progress" section has updated with the Division goal.
      await loggedInUser.expectGoalToBeInProgress('Division', 33);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  /**
   * TODO(#22070): Add tests for progress tab. Interactions involving in-progress
   * and completed classroom lessons & skills sections.
   */
  it(
    'should navigate to the new learner dashboard',
    async function () {
      await loggedInUser.navigateToLearnerDashboard();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
