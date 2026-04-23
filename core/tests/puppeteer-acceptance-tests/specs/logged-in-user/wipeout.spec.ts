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
 * @fileoverview Acceptance tests for account deletion (wipeout) effects on
 * explorations.
 *
 * Covers:
 *  - Deleting a private exploration when its sole owner deletes their account.
 *  - Making a published exploration community-owned when its sole owner
 *    deletes their account.
 *  - Keeping a private exploration accessible to a co-manager when the
 *    original owner deletes their account.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-in User', function () {
  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });

  it(
    'should delete a private exploration when its sole owner deletes their account',
    async function () {
      const collaborator = await UserFactory.createNewUser(
        'collaborator1',
        'collaborator1@example.com'
      );
      const userToDelete = await UserFactory.createNewUser(
        'userToDelete1',
        'user1@delete.com'
      );

      await userToDelete.navigateToCreatorDashboardPage();
      await userToDelete.navigateToExplorationEditorFromCreatorDashboard();
      await userToDelete.dismissWelcomeModal();
      await userToDelete.createMinimalExploration(
        'Private exploration content',
        'End Exploration'
      );
      await userToDelete.saveExplorationDraft();
      const explorationId = await userToDelete.getExplorationId();

      await userToDelete.navigateToSettingsTab();
      await userToDelete.assignUserToCollaboratorRole('collaborator1');

      await userToDelete.navigateToPreferencesPage();
      await userToDelete.deleteAccount();
      await userToDelete.confirmAccountDeletion('userToDelete1');
      await userToDelete.expectToBeOnPage('pending account deletion');

      await collaborator.navigateToExplorationEditor(explorationId);
      await collaborator.expectErrorPage(404);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should make a published exploration community-owned when its sole owner deletes their account',
    async function () {
      const checker = await UserFactory.createNewUser(
        'checker1',
        'checker1@example.com'
      );
      const userToDelete = await UserFactory.createNewUser(
        'userToDelete2',
        'user2@delete.com'
      );

      const explorationId =
        await userToDelete.createAndPublishAMinimalExplorationWithTitle(
          'Public Exploration'
        );

      await userToDelete.navigateToPreferencesPage();
      await userToDelete.deleteAccount();
      await userToDelete.confirmAccountDeletion('userToDelete2');
      await userToDelete.expectToBeOnPage('pending account deletion');

      await checker.navigateToExplorationEditor(explorationId);
      await checker.navigateToSettingsTab();
      await checker.expectExplorationToBeCommunityOwned();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should keep a private exploration accessible to a co-manager when the original owner deletes their account',
    async function () {
      const secondOwner = await UserFactory.createNewUser(
        'secondOwner1',
        'secondowner1@example.com'
      );
      const userToDelete = await UserFactory.createNewUser(
        'userToDelete3',
        'user3@delete.com'
      );

      await userToDelete.navigateToCreatorDashboardPage();
      await userToDelete.navigateToExplorationEditorFromCreatorDashboard();
      await userToDelete.dismissWelcomeModal();
      await userToDelete.createMinimalExploration(
        'Co-managed exploration content',
        'End Exploration'
      );
      await userToDelete.saveExplorationDraft();
      const explorationId = await userToDelete.getExplorationId();

      await userToDelete.navigateToSettingsTab();
      await userToDelete.assignUserToManagerRole('secondOwner1');

      await userToDelete.navigateToPreferencesPage();
      await userToDelete.deleteAccount();
      await userToDelete.confirmAccountDeletion('userToDelete3');
      await userToDelete.expectToBeOnPage('pending account deletion');

      await secondOwner.navigateToExplorationEditor(explorationId);
      await secondOwner.navigateToSettingsTab();
      await secondOwner.expectManagersListToContain('secondOwner1');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );
});
