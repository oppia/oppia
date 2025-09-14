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
 * LI.DG. Learner sets goals on the Learner Dashboard
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
  let loggedInLearner: LoggedOutUser & LoggedInUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;
  let explorationId1: string;
  let explorationId2: string;

  beforeAll(
    async function () {
      // Create users.
      loggedInLearner = await UserFactory.createNewUser(
        'loggedInLearner',
        'logged_in_learner@example.com'
      );
      curriculumAdmin = await UserFactory.createNewUser(
        'curriculumAdm',
        'curriculumAdmin@example.com',
        [ROLES.CURRICULUM_ADMIN]
      );
      releaseCoordinator = await UserFactory.createNewUser(
        'releaseCoordinator',
        'releaseCoordinator@example.com',
        [ROLES.RELEASE_COORDINATOR]
      );

      // Enable redesigned learner dashboard.
      await releaseCoordinator.enableFeatureFlag(
        'show_redesigned_learner_dashboard'
      );

      // Reload the page to ensure redesigned learner dashboard is shown.
      await loggedInLearner.reloadPage();

      // Create explorations.
      explorationId1 =
        await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
          'Negative Numbers'
        );

      explorationId2 =
        await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
          'Positive Numbers',
          'Algebra',
          false
        );

      // Create topic, classroom and add explorations to the topic.
      await curriculumAdmin.createAndPublishTopic(
        'Algebra I',
        'Negative Numbers',
        'Negative Numbers'
      );

      await curriculumAdmin.createAndPublishClassroom(
        'Math',
        'math',
        'Algebra I'
      );

      await curriculumAdmin.addStoryToTopic(
        'Test Story 1',
        'test-story-one',
        'Algebra I'
      );
      await curriculumAdmin.addChapter(
        'Test Chapter 1',
        explorationId1 as string
      );
      await curriculumAdmin.addChapter(
        'Test Chapter 2',
        explorationId2 as string
      );
      await curriculumAdmin.saveStoryDraft();
      await curriculumAdmin.publishStoryDraft();
    },
    // Test takes longer than default timeout.
    600000
  );

  it('should be able to see goals section', async function () {
    // Navigate to the goals section.
    await loggedInLearner.navigateToLearnerDashboardUsingProfileDropdown();
    await loggedInLearner.navigateToGoalsSection();

    await loggedInLearner.expectLearnerGreetingsToBe("loggedInLearner's Goals");
  });

  it('should be able to add a goal', async function () {
    await loggedInLearner.addGoalInRedesignedLearnerDashboard('Algebra I');
    await loggedInLearner.expectRedesignedGoalsSectionToContainHeading(
      'In Progress'
    );
    await loggedInLearner.expectToolTipMessage(
      "Successfully added to your 'Current Goals' list."
    );
  });

  it('should be able to remove a goal', async function () {
    await loggedInLearner.clickOnAddGoalsButtonInRedesignedLearnerDashboard();
    await loggedInLearner.clickOnGoalCheckboxInRedesignedLearnerDashboard(
      'Algebra I',
      false
    );
    await loggedInLearner.submitGoalInRedesignedLearnerDashboard();

    await loggedInLearner.expectRemoveActivityModelToBeDisplayed(
      "Remove from 'Current Goals' list?",
      "Are you sure you want to remove 'Algebra I' from your 'Current Goals' list?"
    );
    await loggedInLearner.clickButtonInRemoveActivityModal('Remove');
    await loggedInLearner.expectRedesignedGoalsSectionToContainHeading(
      'In Progress',
      false
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
