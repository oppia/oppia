// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance tests for learner dashboard functionalities.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in User', function () {
  let loggedInUser: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let explorationId1: string | null;
  let explorationId2: string | null;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    explorationId1 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Negative Numbers'
      );

    explorationId2 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Positive Numbers'
      );

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

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );

    // Setup taking longer than 300000ms.
  }, 480000);

  it(
    'should be able to replay a completed or incomplete exploration or collection, learn something new, manage goals, and see completed lesson in the respective sections.',
    async function () {
      await loggedInUser.navigateToClassroomPage('math');
      await loggedInUser.selectAndOpenTopic('Algebra I');
      await loggedInUser.selectChapterWithinStoryToLearn(
        'Test Story 1',
        'Test Chapter 1'
      );
      // The exploration has a single state.
      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedInUser.navigateToLearnerDashboardUsingProfileDropdown();
      await loggedInUser.navigateToGoalsSection();
      await loggedInUser.addGoals(['Algebra I']);
      await loggedInUser.expectToolTipMessage(
        "Successfully added to your 'Current Goals' list."
      );

      await loggedInUser.navigateToHomeSection();
      await loggedInUser.playLessonFromContinueWhereLeftOff('Algebra I');
      // The exploration has a single state.
      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedInUser.navigateToLearnerDashboardUsingProfileDropdown();
      await loggedInUser.navigateToGoalsSection();
      await loggedInUser.expectCompletedGoalsToInclude(['Algebra I']);

      await loggedInUser.navigateToProgressSection();
      await loggedInUser.expectStoriesCompletedToInclude(['Test Story 1']);

      await loggedInUser.navigateToCommunityLessonsSection();
      await loggedInUser.expectCompletedLessonsToInclude(['Negative Numbers']);
      await loggedInUser.verifyLessonPresenceInPlayLater(
        'Positive Numbers',
        false
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
