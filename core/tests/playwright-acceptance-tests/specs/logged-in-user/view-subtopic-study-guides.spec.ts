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

import {test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const ROLES = testConstants.Roles;

test.describe.configure({mode: 'serial'});

test.describe('Logged-in User', function () {
  let loggedInUser1: LoggedInUser & LoggedOutUser;

  test.beforeAll(async function ({browser}) {
    // Setup takes longer than the default timeout.
    test.setTimeout(600000);

    const curriculumAdmin: CurriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      browser,
      [ROLES.CURRICULUM_ADMIN]
    );

    const releaseCoordinator: ReleaseCoordinator =
      await UserFactory.createNewUser(
        'releaseCoordinator',
        'release_coordinator@example.com',
        browser,
        [ROLES.RELEASE_COORDINATOR]
      );

    // Enable the feature flags.
    await releaseCoordinator.enableFeatureFlag(
      'show_restructured_study_guides'
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
      'logged_in_user1@example.com',
      browser
    );
  });

  test('should be able to view the updated study guides', async function () {
    await loggedInUser1.navigateToClassroomPage('math');
    await loggedInUser1.selectAndOpenTopic('Addition and Subtraction');
    await loggedInUser1.navigateToRevisionTabInTopic();
    await loggedInUser1.selectReviewCardToLearn('Adding Numbers');
    // Only the first section is expanded when the study guide is opened.
    await loggedInUser1.expectExpandedStudyGuideSectionsToBe([
      'Adding With Your Fingers',
    ]);
    await loggedInUser1.expectHighlightedStudyGuideSectionToBe(null);
    await loggedInUser1.expectScreenshotToMatch('finalSubtopicViewerView');
    await loggedInUser1.clickOnExpandWorkedexampleButton();
    await loggedInUser1.expectScreenshotToMatch(
      'finalSubtopicViewerViewSolutionExpanded'
    );

    // Expanding a section does not collapse the sections that are open.
    await loggedInUser1.toggleStudyGuideSection('Using an Addition Table');
    await loggedInUser1.expectExpandedStudyGuideSectionsToBe([
      'Adding With Your Fingers',
      'Using an Addition Table',
    ]);
    await loggedInUser1.expectSubtopicStudyGuideToHaveTitleAndSections(
      'Adding Numbers',
      [
        ['Adding With Your Fingers', 'One way to add is using your...'],
        ['Using an Addition Table', 'To add two single-digit...'],
      ]
    );

    // Collapsing a section does not collapse the other sections.
    await loggedInUser1.toggleStudyGuideSection('Adding With Your Fingers');
    await loggedInUser1.expectExpandedStudyGuideSectionsToBe([
      'Using an Addition Table',
    ]);

    // A link to a specific section opens the study guide with only that
    // section expanded and highlighted.
    await loggedInUser1.openCurrentStudyGuideAtSection(2);
    await loggedInUser1.expectExpandedStudyGuideSectionsToBe([
      'Using an Addition Table',
    ]);
    await loggedInUser1.expectHighlightedStudyGuideSectionToBe(
      'Using an Addition Table'
    );

    // The next study guide opens in its default state.
    await loggedInUser1.clickOnNextStudyGuideButton();
    await loggedInUser1.expectSubtopicStudyGuideToHaveTitleAndSections(
      'Subtracting Numbers',
      [['Common Mistakes', 'Some common mistakes students make are...']]
    );
    await loggedInUser1.expectExpandedStudyGuideSectionsToBe([
      'Common Mistakes',
    ]);
    await loggedInUser1.expectHighlightedStudyGuideSectionToBe(null);
    await loggedInUser1.clickOnStudyGuideMenuButton();
    await loggedInUser1.selectReviewCardToLearn('Adding Numbers');
    await loggedInUser1.clickOnPracticeButton();
    await loggedInUser1.expectToBeOnPageAsLoggedInUser('practice');
    await loggedInUser1.navigateToPracticeTabUsingURL('addition-and-subtrac');
    await loggedInUser1.navigateToRevisionTabInTopic();
    await loggedInUser1.selectReviewCardToLearn('Adding Numbers');
    await loggedInUser1.clickOnBackToTopicButton();
    await loggedInUser1.expectToBeOnPageAsLoggedInUser('story');
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
