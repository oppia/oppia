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
 * LC.13. Check Improvements Tab (Internal Users)
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import testConstants from '../../utilities/common/test-constants';
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in User - Improvements Tab', function () {
  let loggedInUser: LoggedInUser & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    // Create a release coordinator to enable the improvements tab feature flag.
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    // Enable the improvements tab feature flag.
    await releaseCoordinator.enableFeatureFlag('is_improvements_tab_enabled');

    // Create a logged-in user who will create an exploration.
    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should not show improvements tab in an unpublished exploration',
    async function () {
      // Navigate to creator dashboard and create a new exploration.
      await loggedInUser.navigateToCreatorDashboardPage();
      await loggedInUser.navigateToExplorationEditorPageFromCreatorDashboard();
      await loggedInUser.dismissWelcomeModal();

      // Create a simple exploration with content.
      await loggedInUser.updateCardContent('Test content for improvements tab');

      // Save the draft (but don't publish).
      await loggedInUser.saveExplorationDraft();

      // Verify that the improvements tab is not visible for unpublished exploration.
      await loggedInUser.expectImprovementsTabToBeHidden();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
