// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 *  CL.4. Select an exploration from the community library
 * CL.6. Resume Community library lessons from Redesigned Learner Dashboard Tabs
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
const ROLES = testConstants.Roles;

test.describe.configure({mode: 'serial'});

test.describe('Logged-In Learner', function () {
  let loggedInLearner: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & TopicManager & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(6000000); // Setup is taking longer than default timeout.
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      browser,
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseAdm',
      'releaseAdm@example.com',
      browser,
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag(
      'show_redesigned_learner_dashboard'
    );
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    for (let i = 0; i < 2; i++) {
      await curriculumAdmin.createAndPublishExplorationWithCards(
        `Explore Title ${i + 1}`,
        'Algebra',
        3
      );
    }
    await UserFactory.closeBrowserForUser(curriculumAdmin);

    loggedInLearner = await UserFactory.createNewUser(
      'loggedInLearner1',
      'logged_in_learner1@example.com',
      browser
    );
    await UserFactory.closeSuperAdminBrowser();
  });

  test('should be able to see community lessons in In Progress section if not completed fully', async function () {
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToCommunityLibraryOnNavbar();
    await loggedInLearner.expectToBeOnCommunityLibraryPage();

    await loggedInLearner.searchForLessonInSearchBar('Explore Title 1');
    await loggedInLearner.playLessonFromSearchResults('Explore Title 1');

    await loggedInLearner.continueToNextCard();
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.expectScreenshotToMatch(
      'learnerDashboardHomeTabWithLessonsInProgressExploreTitle1'
    );
    await loggedInLearner.expectLessonCardProgressToBe(
      'Lessons in progress',
      ['Explore Title 1'],
      0
    );
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
