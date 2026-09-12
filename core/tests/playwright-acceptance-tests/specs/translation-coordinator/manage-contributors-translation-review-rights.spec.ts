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
 * https://docs.google.com/spreadsheets/d/1DIZ0_Gmf9uhjTbhuDpA495PTjYZW9ZE97r6urS-iXwg/edit?gid=1105186663#gid=1105186663
 *
 * TC.1. Manage contributors' translation review rights.
 */

import {test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {SuperAdmin} from '../../utilities/user/super-admin';
import {TranslationCoordinator} from '../../utilities/user/translation-coordinator';

const ROLES = testConstants.Roles;

test.describe.configure({mode: 'serial'});

test.describe('Translation Coordinator', function () {
  let superAdmin: SuperAdmin;
  let translationCoordinator: TranslationCoordinator;
  let releaseCoordinator: ReleaseCoordinator;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(300000);

    superAdmin = await UserFactory.createNewSuperAdmin(browser);

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      browser,
      [ROLES.RELEASE_COORDINATOR]
    );
    await releaseCoordinator.enableFeatureFlag('cd_admin_dashboard_new_ui');

    await UserFactory.createNewUser(
      'translationReviewer1',
      'translationReviewer1@example.com',
      browser
    );

    translationCoordinator = await UserFactory.createNewUser(
      'translationCoordinator',
      'translationCoordinator@example.com',
      browser,
      [ROLES.TRANSLATION_COORDINATOR],
      ['en', 'hi']
    );
  });

  test('should be able to add language translation rights for a user', async function () {
    await translationCoordinator.navigateToContributorAdminDashboardPage();
    await translationCoordinator.switchToTabInContributorAdminPage(
      'Translation Reviewers'
    );

    await translationCoordinator.clickOnAddReviewerOrSubmitterButton();
    await translationCoordinator.addUsernameInUsernameInputModal(
      'translationReviewer1'
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
    await translationCoordinator.expectNumberOfContributorsToBe(1);
  });

  test('should filter translation submitters by last submitted date', async function () {
    await translationCoordinator.navigateToContributorAdminDashboardPage();
    await translationCoordinator.switchToTabInContributorAdminPage(
      'Translation Submitters'
    );
    await translationCoordinator.selectLanguageInAdminPage('Hindi (हिन्दी)');
    await translationCoordinator.setLastActivityDateFilterToYesterday();
    await translationCoordinator.expectNumberOfStatsRowsToBe(0);
  });

  test('should be able to remove language translation rights for a user', async function () {
    await translationCoordinator.navigateToContributorAdminDashboardPage();
    await translationCoordinator.switchToTabInContributorAdminPage(
      'Translation Reviewers'
    );
    await translationCoordinator.clickOnAddReviewerOrSubmitterButton();
    await translationCoordinator.addUsernameInUsernameInputModal(
      'translationReviewer1'
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
    await translationCoordinator.expectNumberOfContributorsToBe(0);
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
