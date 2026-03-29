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
 * https://docs.google.com/spreadsheets/d/1DIZ0_Gmf9uhjTbhuDpA495PTjYZW9ZE97r6urS-iXwg/edit?gid=1105186663#gid=1105186663
 *
 * TC.1. Manage contributors' translation review rights.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ContributorAdmin} from '../../utilities/user/contributor-admin';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {TranslationCoordinator} from '../../utilities/user/translation-coordinator';
import {TranslationSubmitter} from '../../utilities/user/translation-submitter';
import {Contributor} from '../../utilities/user/contributor';
import {TranslationReviewer} from '../../utilities/user/translation-reviewer';

const ROLES = testConstants.Roles;

describe('Translation Coordinator', function () {
  let translationCoordinator: TranslationCoordinator & ContributorAdmin;
  let translationSubmitter: ExplorationEditor &
    CurriculumAdmin &
    Contributor &
    TranslationSubmitter &
    LoggedInUser;
  let translationReviewer2: TranslationReviewer & LoggedInUser & Contributor;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    translationCoordinator = await UserFactory.createNewUser(
      'translationCoordinator',
      'translationCoordinator@example.com',
      [ROLES.TRANSLATION_COORDINATOR],
      ['en', 'hi']
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await UserFactory.createNewUser(
      'translationReviewer1',
      'translationReviewer1@example.com'
    );

    translationReviewer2 = await UserFactory.createNewUser(
      'translationReviewer2',
      'translationReviewer2@example.com',
      [ROLES.TRANSLATION_REVIEWER],
      'hi'
    );

    translationSubmitter = await UserFactory.createNewUser(
      'translationSubmitter',
      'translationSubmitter@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Turn on feature flag for new contributor admin dashboard.
    await releaseCoordinator.enableFeatureFlag('cd_admin_dashboard_new_ui');

    const explorationId =
      await translationSubmitter.createAndPublishExplorationWithCards(
        'Solving problems without calculator',
        'Algebra'
      );

    await translationSubmitter.createAndPublishTopic(
      'Fractions',
      'Basics of Fractions',
      'fractions'
    );

    await translationSubmitter.createAndPublishStoryWithChapter(
      'Story 1',
      'story-one',
      'Chapter 1',
      explorationId,
      'Fractions'
    );

    await translationSubmitter.createAndPublishClassroom(
      'Math',
      'math',
      'Fractions'
    );

    // Navigate to contributor dashboard and submit one translation.
    await translationSubmitter.navigateToLearnerDashboard();
    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.selectLanguageFilter('हिन्दी (Hindi)');

    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'Chapter 1',
      'Fractions - Story 1'
    );
    await translationSubmitter.typeTextForRTE('सामग्री शून्य');
    await translationSubmitter.clickOnElementWithText(
      'Save and translate another'
    );
    await translationSubmitter.expectToastMessage(
      'Submitted translation for review.'
    );
    await translationSubmitter.typeTextInTranslationInput('जारी रखना');
    await translationSubmitter.clickOnElementWithText(
      'Save and translate another'
    );
    await translationSubmitter.expectToastMessage(
      'Submitted translation for review.'
    );
    await translationSubmitter.typeTextForRTE('सामग्री एक');
    await translationSubmitter.clickOnElementWithText('Save and close');
    await translationSubmitter.expectToastMessage(
      'Submitted translation for review.'
    );

    await translationReviewer2.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer2.clickOnTranslateButtonInTranslateTextTabInTranslationReview(
      'Chapter 1',
      'Fractions - Story 1'
    );
    await translationReviewer2.startTranslationReview(
      'सामग्री शून्य',
      'Fractions / Story 1'
    );
    await translationReviewer2.submitTranslationReview('accept');
    await translationReviewer2.submitTranslationReview('accept');
    await translationReviewer2.submitTranslationReview('accept', 'Looks good.');
    await translationReviewer2.expectReviewModalToBePresent(false);
  }, 900000);

  it('should be able to add language translation rights for a user', async function () {
    // Navigate to the contributor dashboard admin page.
    await translationCoordinator.navigateToContributorDashboardAdminPage();
    await translationCoordinator.switchToTabInContributorAdminPage(
      'Translation Reviewers'
    );

    // Add translation rights.
    await translationCoordinator.clickOnAddReviewerOrSubmitterButton();
    await translationCoordinator.addUsernameInUsernameInputModal(
      'translationReviewer1'
    );
    await translationCoordinator.expectScreenshotToMatch(
      'addTranslationRightsModal',
      __dirname
    );

    await translationCoordinator.addLanguageInLanguageSelectorModal(
      'hi',
      'हिन्दी (Hindi)'
    );
    await translationCoordinator.closeLanguageSelectorModal();
    await translationCoordinator.page.reload();
    await translationCoordinator.switchToTabInContributorAdminPage(
      'Translation Reviewers'
    );

    await translationCoordinator.selectLanguageInAdminPage('Hindi (हिन्दी)');
    await translationCoordinator.expectNumberOfContributorsToBe(2);
  });

  it('should filter translation submitters by last submitted date', async function () {
    await translationCoordinator.switchToTabInContributorAdminPage(
      'Translation Submitters'
    );
    await translationCoordinator.selectLanguageInAdminPage('Hindi (हिन्दी)');
    await translationCoordinator.setLastActivityDateFilterToYesterday();
    await translationCoordinator.expectNumberOfStatsRowsToBe(1);
  });

  it('should be able to remove language translation rights for a user', async function () {
    await translationCoordinator.switchToTabInContributorAdminPage(
      'Translation Reviewers'
    );
    await translationCoordinator.clickOnAddReviewerOrSubmitterButton();
    await translationCoordinator.addUsernameInUsernameInputModal(
      'translationReviewer1'
    );
    await translationCoordinator.expectScreenshotToMatch(
      'translationRightsModalWithHindiSelected',
      __dirname
    );

    await translationCoordinator.removeLanguageFromLanguageSelectorModal(
      'हिन्दी (Hindi)'
    );
    await translationCoordinator.closeLanguageSelectorModal();
    await translationCoordinator.page.reload();
    await translationCoordinator.switchToTabInContributorAdminPage(
      'Translation Reviewers'
    );
    await translationCoordinator.selectLanguageInAdminPage('Hindi (हिन्दी)');
    await translationCoordinator.expectNumberOfContributorsToBe(1);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
