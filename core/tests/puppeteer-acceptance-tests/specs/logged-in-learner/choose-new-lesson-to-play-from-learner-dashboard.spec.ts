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
 * LI.DM Learner chooses new lessons to play from their Learner Dashboard
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

  beforeAll(async function () {
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
  });

  it('should be able add a goal', async function () {
    await loggedInLearner.navigateToLearnerDashboardUsingProfileDropdown();
    await loggedInLearner.navigateToGoalsSection();
    await loggedInLearner.addGoalInRedesignedLearnerDashboard('Algebra I');
    await loggedInLearner.expectCurrentGoalsInRedesignedDashboardToContain(
      'Algebra I'
    );

    await loggedInLearner.navigateToHomeSection();
    // TODO(#22940): Home section should show lesson in "Lessons In Progress" section.
    // Once this feature/bug is fixed, update the test.
    // TODO: I closed the issue, but there is still the bug, so reopen the issue.
    await loggedInLearner.navigateToGoalsSection();
    await loggedInLearner.navigateToCommunityLibraryPage();
    await loggedInLearner.searchForLessonInSearchBar('Negative Numbers');
    await loggedInLearner.playLessonFromSearchResults('Negative Numbers');

    // TODO: Reach upto first checkpoint.
    await loggedInLearner.navigateToLearnerDashboard();
    // TODO: Maybe chapter has different view.
    await loggedInLearner.expectContinueWhereYouLeftOffSectionToContainLessonCards(
      ['Chapter 2: Positive Numbers']
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
