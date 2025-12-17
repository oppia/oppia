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
 *  * CL.6. Resume Community library lessons from Redesigned Learner Dashboard Tabs
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {TopicManager} from '../../utilities/user/topic-manager';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in Learner', function () {
  let loggedInLearner: LoggedInUser & LoggedOutUser;
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
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    for (let i = 0; i < 6; i++) {
      await curriculumAdmin.createAndPublishExplorationWithCards(
        `Explore Title ${i + 1}`,
        'Algebra',
        3
      );
    }
    await UserFactory.closeBrowserForUser(curriculumAdmin);

    loggedInLearner = await UserFactory.createNewUser(
      'loggedInLearner1',
      'logged_in_learner1@example.com'
    );
    await UserFactory.closeSuperAdminBrowser();
  }, 6000000);

  it(
    'should be able to see community lesson in Progress Tab',
    async function () {
      await loggedInLearner.navigateToLearnerDashboard();
      await loggedInLearner.navigateToCommunityLibraryOnNavbar();
      await loggedInLearner.expectToBeOnCommunityLibraryPage();

      await loggedInLearner.searchForLessonInSearchBar('Explore Title 1');
      await loggedInLearner.playLessonFromSearchResults('Explore Title 1');
      await loggedInLearner.continueToNextCard();
      await loggedInLearner.navigateToLearnerDashboard();
      await loggedInLearner.navigateToProgressSection();
      await loggedInLearner.expectScreenshotToMatch(
        'learnerDashboardProgressTabCommunityLessonsExploreTitle1',
        __dirname
      );
      await loggedInLearner.expectLessonCardProgressToBe(
        'Community Lessons',
        ['Explore Title 1'],
        0,
        'In Progress'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it('should be able to see community lessons in Progress Tab and "Display More" Button', async function () {
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToCommunityLibraryOnNavbar();
    await loggedInLearner.expectToBeOnCommunityLibraryPage();

    await loggedInLearner.searchForLessonInSearchBar('Explore Title 2');
    await loggedInLearner.playLessonFromSearchResults('Explore Title 2');
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToProgressSection();

    await loggedInLearner.navigateToCommunityLibraryOnNavbar();
    await loggedInLearner.expectToBeOnCommunityLibraryPage();
    await loggedInLearner.searchForLessonInSearchBar('Explore Title 3');
    await loggedInLearner.playLessonFromSearchResults('Explore Title 3');
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToProgressSection();

    await loggedInLearner.navigateToCommunityLibraryOnNavbar();
    await loggedInLearner.expectToBeOnCommunityLibraryPage();
    await loggedInLearner.searchForLessonInSearchBar('Explore Title 4');
    await loggedInLearner.playLessonFromSearchResults('Explore Title 4');
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToProgressSection();

    await loggedInLearner.navigateToCommunityLibraryOnNavbar();
    await loggedInLearner.expectToBeOnCommunityLibraryPage();
    await loggedInLearner.searchForLessonInSearchBar('Explore Title 5');
    await loggedInLearner.playLessonFromSearchResults('Explore Title 5');
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToProgressSection();

    await loggedInLearner.navigateToCommunityLibraryOnNavbar();
    await loggedInLearner.expectToBeOnCommunityLibraryPage();
    await loggedInLearner.searchForLessonInSearchBar('Explore Title 6');
    await loggedInLearner.playLessonFromSearchResults('Explore Title 6');
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToProgressSection();
    await loggedInLearner.expectScreenshotToMatch(
      'learnerDashboardProgressTabCommunityLessons6Lessons',
      __dirname
    );
    await loggedInLearner.expectCommunityLessonsCollapsed();
    await loggedInLearner.expectLessonCardProgressToBe(
      'Community Lessons',
      [
        'Explore Title 6',
        'Explore Title 5',
        'Explore Title 4',
        'Explore Title 3',
        'Explore Title 2',
        'Explore Title 1',
      ],
      0,
      'In Progress'
    );
    await loggedInLearner.expectDisplayMoreCommunityLessonsToBeVisible();
  }, 600000); // Takes longer than default timeout.

  it(
    'should toggle Display More button for community lessons',
    async function () {
      await loggedInLearner.navigateToLearnerDashboard();
      await loggedInLearner.navigateToProgressSection();

      // Initial state.
      await loggedInLearner.expectCommunityLessonsCollapsed();

      // Expand.
      await loggedInLearner.toggleDisplayMoreCommunityLessons();
      await loggedInLearner.expectCommunityLessonsExpanded();

      // Collapse again.
      await loggedInLearner.toggleDisplayMoreCommunityLessons();
      await loggedInLearner.expectCommunityLessonsCollapsed();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it('should be able to see completed Community Lessons in the Completed section of Progress Tab', async function () {
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToProgressSection();
    await loggedInLearner.expectElementsToBePresentInRLD(
      ['In Progress'],
      'tabSection'
    );

    await loggedInLearner.navigateToLessonByCard(
      'Community Lessons',
      'Explore Title 6',
      'In Progress'
    );
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );

    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.navigateToProgressSection();

    await loggedInLearner.expectScreenshotToMatch(
      'communityLessonExploreTitle6InCompletedSectionOfProgressTab',
      __dirname
    );
    await loggedInLearner.expectElementsToBePresentInRLD(
      ['In Progress', 'Completed'],
      'tabSection'
    );
    await loggedInLearner.expectElementsToBePresentInRLD(
      ['Community Lessons', 'Community Lessons'],
      'cardDisplay'
    );
    await loggedInLearner.expectLessonCardProgressToBe(
      'Community Lessons',
      [
        'Explore Title 5',
        'Explore Title 4',
        'Explore Title 3',
        'Explore Title 2',
        'Explore Title 1',
      ],
      0,
      'In Progress'
    );
    await loggedInLearner.expectLessonCardProgressToBe(
      'Community Lessons',
      ['Explore Title 6'],
      100,
      'Completed'
    );
  }, 420000); // Takes longer to run than default timeout.

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
