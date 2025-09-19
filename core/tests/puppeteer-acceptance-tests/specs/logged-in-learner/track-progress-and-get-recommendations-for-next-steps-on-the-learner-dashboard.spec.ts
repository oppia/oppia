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
 * LI.3. Track progress and get recommendations for next steps on the Learner Dashboard
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

describe('Logged-In Learner', function () {
  let loggedInLearner: LoggedInUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [testConstants.Roles.CURRICULUM_ADMIN]
    );

    // Create two explorations.
    const explorationId1: string =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Positive Numbers',
        'Algebra'
      );
    const explorationId2: string =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Negative Numbers',
        'Algebra'
      );

    // Create topic and add three question to the skill.
    await curriculumAdmin.createAndPublishTopic(
      'Algebra I',
      'Negative Numbers',
      'Negative Numbers'
    );

    await curriculumAdmin.addSkillToDiagnosticTest('Negative Numbers');

    // Create story and add chapters.
    await curriculumAdmin.createAndPublishStoryWithChapter(
      'The Broken Calculator',
      'the-broken-calculator',
      'Test Chapter 1',
      explorationId1
    );
    await curriculumAdmin.addChapter('Test Chapter 2', explorationId2);

    // Create a publish a new classroom.
    await curriculumAdmin.createAndPublishClassroom(
      'Maths',
      'math',
      'Algebra I'
    );

    // Enable new learner dashboard.
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [testConstants.Roles.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag(
      'show_redesigned_learner_dashboard'
    );

    // Create a logged in user.
    loggedInLearner = await UserFactory.createNewUser(
      'learner',
      'learner@example.com'
    );
  }, 600000);

  it('should be able to add a goal, and see the incremental progress on the Learner Dashboard while completing the goal.', async function () {
    await loggedInLearner.navigateToGoalsSection();
    await loggedInLearner.addGoalInRedesignedLearnerDashboard('Algebra I');
    await loggedInLearner.expectCurrentGoalsInRedesignedDashboardToContain(
      'Algebra I'
    );

    // TODO: Learn something new should be visible.
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
