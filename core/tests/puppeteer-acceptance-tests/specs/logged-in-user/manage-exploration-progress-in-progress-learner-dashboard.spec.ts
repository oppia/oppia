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
 * @fileoverview Acceptance tests for learner dashboard functionalities in progress tab, specfically
 * interactions with components that use exploration and collectons data (community lessons).
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in User', function () {
  let loggedInUser: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  const explorationTitles = ['Exploration 1', 'Exploration 2', 'Exploration 3'];
  const shortExplorationTitle: string = 'Exploration 4';
  const explorationIds: string[] = [];
  let shortExplorationId = '';

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

    for (const title of explorationTitles) {
      const id =
        await curriculumAdmin.createAndPublishExplorationWithThreeCards(title);
      explorationIds.push(id ?? '');
    }

    shortExplorationId =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        shortExplorationTitle
      );

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );
  }, 600000);

  it(
    'should display in-progress section after starting explorations and show dropdown option if cards do not fit',
    async function () {
      for (const id of explorationIds) {
        await loggedInUser.playExploration(id);
        await loggedInUser.continueToNextCard();
      }
      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToTab('progress');

      await loggedInUser.expectLessonCardsToBePresent({
        subsection: 'Community Lessons',
        expectedTitles: explorationTitles,
        section: 'In Progress',
      });

      await loggedInUser.expectDropdownButton(
        'Community Lessons',
        'In Progress'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display completed section after finishing explorations and hide dropdown option if cards do fit',
    async function () {
      await loggedInUser.playExploration(shortExplorationId);
      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedInUser.navigateToLearnerDashboard();
      await loggedInUser.navigateToTab('progress');

      await loggedInUser.expectLessonCardsToBePresent({
        subsection: 'Community Lessons',
        expectedTitles: explorationTitles,
        section: 'In Progress',
      });

      await loggedInUser.expectLessonCardsToBePresent({
        subsection: 'Community Lessons',
        expectedTitles: [shortExplorationId],
        section: 'Completed',
      });

      await loggedInUser.expectDropdownButton('Community Lessons', 'Completed');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
