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
 * TC. Add and remove question review rights.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ContributorAdmin} from '../../utilities/user/contributor-admin';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {TranslationCoordinator} from '../../utilities/user/translation-coordinator';

const ROLES = testConstants.Roles;

describe('Practice Question Coordinator', function () {});

describe('Translation Coordinator', function () {
  let questionCoordinator: ContributorAdmin;
  let loggedInUser1: LoggedInUser;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    questionCoordinator = await UserFactory.createNewUser(
      'translationCoordinator',
      'translationCoordinator@example.com',
      [ROLES.QUESTION_COORDINATOR]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    loggedInUser1 = await UserFactory.createNewUser(
      'loggedInUser1',
      'loggedInUser1@example.com'
    );

    // Turn on feature flag for new contributor admin dashboard.
    await releaseCoordinator.enableFeatureFlag('cd_admin_dashboard_new_ui');
  });

  it('should be able to add question contribution rights', async function () {
    // Navigate to the contributor dashboard admin page.
    await questionCoordinator.navigateToContributorDashboardAdminPage();

    // Add translation rights.
    await questionCoordinator.clickOnAddReviewerOrSubmitterButton();
    await questionCoordinator.addUsernameInUsernameInputModal('loggedInUser1');
    await questionCoordinator.expectScreenshotToMatch(
      'addTranslationRightsModal',
      __dirname
    );
  });

  it('should be able to remove translation rights', async function () {
    await questionCoordinator.clickOnAddReviewerOrSubmitterButton();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
