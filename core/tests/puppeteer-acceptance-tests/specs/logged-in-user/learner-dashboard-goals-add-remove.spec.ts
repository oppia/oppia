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
 * @fileoverview Acceptance tests for the goals tab in learner dashboard,
 * specifically adding and removing classroom goals (2.3 blue).
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

describe('Logged-in User - Goals Tab (Add & Remove)', function () {
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
    await curriculumAdmin.createAndPublishTopic('Place Values');
    await curriculumAdmin.addTopicToClassroom('Math', 'Place Values');
    await curriculumAdmin.publishClassroom('Math');

    await curriculumAdmin.createAndPublishExplorationWithCards(
      'What are the Place Values'
    );

    await curriculumAdmin.createAndPublishExplorationWithCards(
      'Find the Value of a Number'
    );

    await curriculumAdmin.createAndPublishExplorationWithCards(
      'Comparing Numbers'
    );

    await curriculumAdmin.addStoryToTopic(
      "Jamie's Adventures in the Arcade",
      'story',
      'Place Values'
    );

    await curriculumAdmin.addChapter(
      'What are the Place Values',
      'What are the Place Values'
    );

    await curriculumAdmin.addChapter(
      'Find the Value of a Number',
      'Find the Value of a Number'
    );

    await curriculumAdmin.addChapter(
      'Comparing Numbers',
      'Comparing Numbers'
    );

    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );
  }, 480000);

  it(
    'should display empty goals tab initially with add goals button',
    async function () {
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToGoalsSection();
      await loggedInUser.expectGoalsTabToBeDisplayed();
      await loggedInUser.expectAddGoalsButtonToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open add goals modal and show expected content',
    async function () {
      await loggedInUser.openAddGoalsModal();
      await loggedInUser.expectAddGoalsModalToBeVisible();
      await loggedInUser.expectModalTitleAndSubtext(
        'Add or edit a goal',
        'You can select up to 5 goals at a time'
      );
      await loggedInUser.expectCancelAndSaveButtonsVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should allow adding a goal and see it under in-progress section',
    async function () {
      await loggedInUser.selectGoal('Place Values');
      await loggedInUser.clickSave();
      await loggedInUser.expectGoalToBeInProgress('Place Values', 0);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should retain selection on cancel and restore it on reopen',
    async function () {
      await loggedInUser.openAddGoalsModal();
      await loggedInUser.uncheckGoal('Place Values');
      await loggedInUser.clickCancel();
      await loggedInUser.openAddGoalsModal();
      await loggedInUser.expectGoalChecked('Place Values');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should remove a goal after saving changes in modal',
    async function () {
      await loggedInUser.uncheckGoal('Place Values');
      await loggedInUser.clickSave();
      await loggedInUser.expectGoalNotPresent('Place Values');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should disable remaining checkboxes after selecting 5 goals',
    async function () {
      await loggedInUser.openAddGoalsModal();
      await loggedInUser.checkRandomGoals(5);
      await loggedInUser.expectRemainingGoalsToBeDisabled();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
