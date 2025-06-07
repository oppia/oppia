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
 * @fileoverview Acceptance Test for the user journey of changing the site language to an RTL
 * language and navigating through various pages.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in User', function () {
  let loggedInUser1: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let explorationId: string | null;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    explorationId =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Negative Numbers'
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

    await curriculumAdmin.createAndPublishStoryWithChapter(
      'Algebra Story',
      'algebra-story',
      'Understanding Negative Numbers',
      explorationId as string,
      'Algebra I'
    );

    loggedInUser1 = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );

    // Setup taking longer than 300000ms.
  }, 420000);

  it(
    'should be able to change the site language to RTL, navigate and interact with various pages',
    async function () {
      await loggedInUser1.changeSiteLanguage('ar');

      // Navigate through various pages and verify they are properly mirrored.
      await loggedInUser1.navigateToLearnerDashboard();
      await loggedInUser1.verifyPageIsRTL();

      await loggedInUser1.navigateToSplashPage();
      await loggedInUser1.verifyPageIsRTL();

      await loggedInUser1.navigateToAboutPage();
      await loggedInUser1.verifyPageIsRTL();

      await loggedInUser1.navigateToContactUsPage();
      await loggedInUser1.verifyPageIsRTL();

      await loggedInUser1.navigateToCommunityLibraryPage();
      await loggedInUser1.verifyPageIsRTL();

      // Checking story viewer.
      await loggedInUser1.searchForLessonInSearchBar('Negative Numbers');
      await loggedInUser1.playLessonFromSearchResults('Negative Numbers');
      await loggedInUser1.verifyPageIsRTL();

      await loggedInUser1.navigateToClassroomPage('math');
      await loggedInUser1.selectAndOpenTopic('Algebra I');

      // Checking exploration player.
      await loggedInUser1.selectChapterWithinStoryToLearn(
        'Algebra Story',
        'Understanding Negative Numbers'
      );
      await loggedInUser1.verifyPageIsRTL();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
