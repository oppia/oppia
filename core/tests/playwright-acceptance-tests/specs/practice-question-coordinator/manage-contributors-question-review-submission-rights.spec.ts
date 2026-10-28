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
 * https://docs.google.com/spreadsheets/d/1DIZ0_Gmf9uhjTbhuDpA495PTjYZW9ZE97r6urS-iXwg/edit?gid=369023361#gid=369023361
 *
 * QC.1. Manage contributors' question review/submission rights.
 */

import {test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {Contributor} from '../../utilities/user/contributor';
import {ContributorAdmin} from '../../utilities/user/contributor-admin';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {PracticeQuestionReviewer} from '../../utilities/user/practice-question-reviewer';
import {QuestionCoordinator} from '../../utilities/user/practice-question-coordinator';
import {PracticeQuestionSubmitter} from '../../utilities/user/practice-question-submitter';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const ROLES = testConstants.Roles;

test.describe.configure({mode: 'serial'});

test.describe('Practice Question Coordinator', function () {
  test.skip(
    () => process.env.MOBILE === 'true',
    'Test skipped in mobile viewport'
  );

  let questionCoordinator: QuestionCoordinator & ContributorAdmin;
  let questionReviewer: PracticeQuestionReviewer & LoggedInUser;
  let questionSubmitter: ExplorationEditor &
    CurriculumAdmin &
    Contributor &
    PracticeQuestionSubmitter &
    LoggedInUser;
  let releaseCoordinator: ReleaseCoordinator;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(900000);

    questionCoordinator = await UserFactory.createNewUser(
      'questionCoordinator',
      'questionCoordinator@example.com',
      browser,
      [ROLES.QUESTION_COORDINATOR]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      browser,
      [ROLES.RELEASE_COORDINATOR]
    );

    questionReviewer = await UserFactory.createNewUser(
      'questionReviewer',
      'questionReviewer@example.com',
      browser
    );

    questionSubmitter = await UserFactory.createNewUser(
      'questionSubmitter',
      'questionSubmitter@example.com',
      browser,
      [ROLES.CURRICULUM_ADMIN]
    );

    await releaseCoordinator.enableFeatureFlag('cd_admin_dashboard_new_ui');

    await questionSubmitter.createAndPublishTopic(
      'Arithmetic Operations',
      'Basics of Arithmetic',
      'Addition'
    );

    await questionSubmitter.createAndPublishClassroom(
      'Math',
      'math',
      'Arithmetic Operations'
    );

    await questionSubmitter.navigateToCreatorDashboardPage();
  });

  test('should be able to add question review rights for a user', async function () {
    await questionCoordinator.navigateToContributorDashboardAdminPage();

    await questionCoordinator.switchToTabInContributorAdminPage(
      'Question Reviewers'
    );

    await questionCoordinator.clickOnAddReviewerOrSubmitterButton();
    await questionCoordinator.addUsernameInUsernameInputModal(
      questionReviewer.username ?? ''
    );

    await questionCoordinator.addOrRemoveQuestionRightsInQuestionRoleEditorModal(
      'Reviewer'
    );
    await questionCoordinator.saveAndCloseQuestionRoleEditorModal();
    await questionCoordinator.reloadPage();
    await questionCoordinator.expectTotalQuestionReviewersToBe(1);
  });

  test('should be able to add question submitter rights for a user', async function () {
    await questionCoordinator.clickOnAddReviewerOrSubmitterButton();
    await questionCoordinator.addUsernameInUsernameInputModal(
      questionSubmitter.username ?? ''
    );
    await questionCoordinator.expectScreenshotToMatch('addQuestionRightsModal');

    await questionCoordinator.addOrRemoveQuestionRightsInQuestionRoleEditorModal(
      'Submitter'
    );
    await questionCoordinator.saveAndCloseQuestionRoleEditorModal();

    await questionSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await questionSubmitter.startAndCompleteQuestionSuggestion(
      'Addition',
      'Arithmetic Operations',
      'What is 2 + 3?'
    );

    await questionReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await questionReviewer.startQuestionReview('What is 2 + 3?', 'Addition');
    await questionReviewer.submitReview('accept');
    await questionReviewer.expectQuestionReviewModalToBePresent(false);

    await questionCoordinator.reloadPage();
    await questionCoordinator.expectNumberOfStatsRowsToBe(1);
    await questionCoordinator.setLastActivityDateFilterToYesterday();
    await questionCoordinator.expectNumberOfStatsRowsToBe(1);

    await questionCoordinator.switchToTabInContributorAdminPage(
      'Question Reviewers'
    );
    await questionCoordinator.setLastActivityDateFilterToYesterday();
    await questionCoordinator.expectNumberOfStatsRowsToBe(1);
  });

  test('should be able to remove question submitter rights for a user', async function () {
    await questionCoordinator.clickOnAddReviewerOrSubmitterButton();
    await questionCoordinator.addUsernameInUsernameInputModal(
      questionSubmitter.username ?? ''
    );
    await questionCoordinator.expectScreenshotToMatch(
      'editQuestionRightsModalWithSubmitterChecked'
    );

    await questionCoordinator.addOrRemoveQuestionRightsInQuestionRoleEditorModal(
      'Submitter',
      'remove'
    );
    await questionCoordinator.saveAndCloseQuestionRoleEditorModal();
  });

  test('should be able to remove question review rights for a user', async function () {
    await questionCoordinator.clickOnAddReviewerOrSubmitterButton();
    await questionCoordinator.addUsernameInUsernameInputModal(
      questionReviewer.username ?? ''
    );
    await questionCoordinator.expectScreenshotToMatch(
      'editQuestionRightsModalWithReviewerChecked'
    );

    await questionCoordinator.addOrRemoveQuestionRightsInQuestionRoleEditorModal(
      'Reviewer',
      'remove'
    );
    await questionCoordinator.saveAndCloseQuestionRoleEditorModal();

    await questionCoordinator.reloadPage();
    await questionCoordinator.expectTotalQuestionReviewersToBe(0);
  });

  test('should show the Question Coordinators tab with stats', async function () {
    await questionCoordinator.navigateToContributorDashboardAdminPage();
    await questionCoordinator.switchToTabInContributorAdminPage(
      'Question Coordinators'
    );
    await questionCoordinator.expectStatsTableToBeVisible();
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
