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
  const explorationIds: string[] = [];

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

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );
  }, 550000);

  it(
    'should display saved community lessons after adding to playlist',
    async function () {
      await loggedInUser.navigateToCommunityLibraryPage();
      await loggedInUser.searchForLessonInSearchBar(explorationTitles[0]);
      await loggedInUser.addLessonToPlayLater(explorationTitles[0], true);
      await loggedInUser.expectToolTipMessage(
        "Successfully added to your 'Play Later' list."
      );

      await loggedInUser.navigateToLearnerDashboard();

      await loggedInUser.expectLessonCardsToBePresent({
        subsection: 'Lessons you saved for later',
        expectedTitles: [explorationTitles[0]],
      });
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  describe('In-progress lessons', function () {
    beforeAll(async function () {
      for (const id of explorationIds) {
        await loggedInUser.playExploration(id);
        await loggedInUser.continueToNextCard();
      }
    }, DEFAULT_SPEC_TIMEOUT_MSECS);

    it(
      'should display in-progress section after starting explorations (no in-progress classroom lessons)',
      async function () {
        await loggedInUser.navigateToLearnerDashboard();
        await loggedInUser.expectLessonCardsToBePresent({
          subsection: 'Lessons in progress',
          expectedTitles: explorationTitles,
        });
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    it(
      'should hide (desktop) / display (mobile) carousel arrows when cards do not fit for LTR languages, shifting through all cards if displayed',
      async function () {
        await loggedInUser.expectCardDisplayControls('Lessons in progress');
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    // TODO(#18384) - Text was corrected (missing a s) for English key, this might fail if translations are updated.
    it(
      'should hide (desktop) / display (mobile) carousel arrows when cards do not fit for RTL languages, shifting through all cards if displayed',
      async function () {
        await loggedInUser.changeSiteLanguage('ar');
        await loggedInUser.navigateToLearnerDashboard();
        await loggedInUser.expectCardDisplayControls(
          'دروس أحرزت فيها بعض التقدم'
        );
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
