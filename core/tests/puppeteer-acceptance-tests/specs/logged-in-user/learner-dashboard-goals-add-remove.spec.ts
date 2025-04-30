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

describe('Logged-in User', function () {
  let loggedInUser: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;
  const placeValueChapters = [
    'What are the Place Values',
    'Find the Value of a Number',
    'Comparing Numbers',
  ];

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

  it(
    'should open add goals modal and show expected content',
    async function () {
      await loggedInUser.openAddGoalsModal('Add Goals Modal');
      await loggedInUser.expectAddGoalsModalToBeVisible(
        'Add or edit a goal',
        'You can select up to 5 goals at a time'
      );
      await loggedInUser.expectModalTitleAndSubtext(
        'Add or edit a goal',
        'You can select up to 5 goals at a time'
      );
      await loggedInUser.expectCancelAndSaveButtonsVisible('Cancel', 'Save');
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
      await loggedInUser.openAddGoalsModal('Add Goals Modal');
      await loggedInUser.uncheckGoal('Place Values');
      await loggedInUser.clickCancel('Add Goals Modal');
      await loggedInUser.openAddGoalsModal('Add Goals Modal');
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
      await loggedInUser.openAddGoalsModal('Add Goals Modal');
      await loggedInUser.checkRandomGoals(5);
      await loggedInUser.expectRemainingGoalsToBeDisabled();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
