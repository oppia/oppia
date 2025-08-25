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
 * @fileoverview Acceptance Test for the user journey of accessing the study guides through the
 * subtopic viewer page.
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
  let loggedInUser1: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
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

    // Enable the feature flags.
    await releaseCoordinator.enableFeatureFlag(
      'show_restructured_study_guides'
    );
    await releaseCoordinator.enableFeatureFlag(
      'enable_worked_examples_rte_component'
    );

    await curriculumAdmin.createAndPublishTopicWithSubtopicsAndStudyGuides(
      'Addition and Subtraction',
      'Adding Numbers',
      'Skill 1'
    );

    await curriculumAdmin.createAndPublishClassroom(
      'Math',
      'math',
      'Addition and Subtraction'
    );

    loggedInUser1 = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );

    // Setup taking longer than 300000ms.
  }, 420000);

  it(
    'should be able to view the updated study guides',
    async function () {
      await loggedInUser1.navigateToClassroomPage('math');
      await loggedInUser1.selectAndOpenTopic('Addition and Subtraction');
      await loggedInUser1.navigateToStudyTab();
      await loggedInUser1.selectReviewCardToLearn('Adding Numbers');
      await loggedInUser1.expectSubtopicStudyGuideToHaveTitleAndSections(
        'Adding Numbers',
        [
          ['Adding With Your Fingers', 'One way to add is using your...'],
          ['Using an Addition Table', 'To add two single-digit...'],
        ]
      );
      await loggedInUser1.expectScreenshotToMatch(
        'finalSubtopicViewerView',
        __dirname
      );
      await loggedInUser1.clickOnExpandWorkedexampleButton();
      await loggedInUser1.expectScreenshotToMatch(
        'finalSubtopicViewerViewSolutionExpanded',
        __dirname
      );
      await loggedInUser1.clickOnNextStudyGuideButton();
      await loggedInUser1.expectSubtopicStudyGuideToHaveTitleAndSections(
        'Subtracting Numbers',
        [['Common Mistakes', 'Some common mistakes students make are...']]
      );
      await loggedInUser1.clickOnStudyGuideMenuButton();
      await loggedInUser1.selectReviewCardToLearn('Adding Numbers');
      await loggedInUser1.clickOnPracticeButton();
      await loggedInUser1.expectToBeOnPage('practice');
      await loggedInUser1.navigateToPracticeTabUsingURL('addition-and-subtrac');
      await loggedInUser1.navigateToStudyTab();
      await loggedInUser1.selectReviewCardToLearn('Adding Numbers');
      await loggedInUser1.clickOnBackToTopicButton();
      await loggedInUser1.expectToBeOnPage('story');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
