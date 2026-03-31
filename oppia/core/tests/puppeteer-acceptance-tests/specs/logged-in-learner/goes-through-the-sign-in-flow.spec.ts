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
 * LI.1. Sign up for an account
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

describe('Logged In Learner', function () {
  const loggedInUser: LoggedInUser & LoggedOutUser = Object.assign(
    new LoggedInUser(),
    new LoggedOutUser()
  );
  let releaseCoordinator: ReleaseCoordinator;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let explorationId: string;

  beforeAll(async function () {
    // Create release coordinator to enable redesigned learner dashboard.
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );
    await releaseCoordinator.enableFeatureFlag(
      'show_redesigned_learner_dashboard'
    );

    // Create curriculum admin to create topic, story, and chapter.
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Create exploration for chapter.
    explorationId =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Test Exploration'
      );

    // Create topic, classroom, story, and chapter.
    await curriculumAdmin.createAndPublishTopic(
      'Test Topic',
      'Test Skill',
      'Test Skill'
    );

    await curriculumAdmin.createAndPublishClassroom(
      'Math',
      'math',
      'Test Topic'
    );

    await curriculumAdmin.addStoryToTopic(
      'Test Story',
      'test-story',
      'Test Topic'
    );
    await curriculumAdmin.addChapter('Chapter 1', explorationId);
    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();
  }, 600000);

  it('should be able to login and see Learner Dashboard', async function () {
    // Click on "Sign In" button and fill email.
    await loggedInUser.openBrowser();
    await loggedInUser.navigateToSignUpPage();

    // Enter email to proceed to username page.
    // The enterEmailAndProceedToNextPage function will click "Sign In" and verify username field is visible.
    await loggedInUser.enterEmailAndProceedToNextPage(
      'logged_in_user@example.com'
    );

    // Fill an invalid username and verify error message.
    await loggedInUser.typeInvalidUsernameInUsernameInput('invalid@user!');

    // Verify error message with clear instructions is shown.
    await loggedInUser.expectUsernameError(
      'Usernames can only have alphanumeric characters.'
    );

    // Clear the invalid username and try username with "Admin" in it.
    await loggedInUser.clearUsernameInput();
    await loggedInUser.typeInvalidUsernameInUsernameInput('TopicAdmin');

    // Verify different error message for username with "Admin".
    await loggedInUser.expectUsernameError(
      "User names with 'admin' are reserved."
    );

    // Clear the invalid username and sign in with valid username.
    await loggedInUser.clearUsernameInput();
    await loggedInUser.signInWithUsername('loggedInUser');

    // Verify learner is redirected to Learner Dashboard.
    await loggedInUser.expectToBeOnLearnerDashboardPage();

    // Verify welcome message with username.
    await loggedInUser.expectGreetingToHaveNameOfUser('loggedInUser');

    // Verify "Continue where you left off" section is NOT available.
    await loggedInUser.expectContinueFromWhereYouLeftSectionInRedesignedDashboardToBePresent(
      false
    );

    // Verify "Learn Something New" section is visible and shows Chapter 1.
    await loggedInUser.expectLearnSomethingNewSectionInRedesignedDashboardToBePresent();
    await loggedInUser.expectChapterToBePresentInLearnSomethingNewSection(
      'Chapter 1'
    );

    // Click on "Progress" tab and verify it's empty.
    await loggedInUser.navigateToProgressSection();
    await loggedInUser.expectProgressSectionToBeEmptyInNewLD();
  });
  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
    await loggedInUser.closeBrowser();
  });
});
