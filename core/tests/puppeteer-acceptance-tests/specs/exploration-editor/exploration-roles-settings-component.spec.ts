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
 * @fileoverview Acceptance Test for verifying different users roles and their
 * access permissions in an exploration.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {ConsoleReporter} from '../../utilities/common/console-reporter';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
enum INTERACTION_TYPES {
  END_EXPLORATION = 'End Exploration',
}

ConsoleReporter.setConsoleErrorsToIgnore([/.404.*Not Found./]);

describe('Exploration User Roles', function () {
  let newCollaborator: ExplorationEditor;
  let manager: ExplorationEditor;
  let collaborator: ExplorationEditor;
  let playtester: ExplorationEditor;
  let explorationCreator: ExplorationEditor;
  let explorationId: string | null;

  beforeAll(async function () {
    newCollaborator = await UserFactory.createNewUser(
      'newCollaborator',
      'newCollaborator@example.com'
    );

    playtester = await UserFactory.createNewUser(
      'playtester',
      'playtester@example.com'
    );

    collaborator = await UserFactory.createNewUser(
      'collaborator',
      'collaborator@example.com'
    );

    manager = await UserFactory.createNewUser('manager', 'manager@example.com');

    explorationCreator = await UserFactory.createNewUser(
      'explorationCreator',
      'explorationCreator@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should verify correct access permissions for different user roles',
    async function () {
      await UserFactory.closeBrowserForUser(newCollaborator);
      // Create exploration with explorationCreator user.
      await explorationCreator.navigateToCreatorDashboardPage();
      await explorationCreator.navigateToExplorationEditorPage();
      await explorationCreator.dismissWelcomeModal();

      await explorationCreator.createMinimalExploration(
        'Test Exploration',
        INTERACTION_TYPES.END_EXPLORATION
      );

      await explorationCreator.navigateToSettingsTab();

      // Assign roles to users including manager role to manager user.
      await explorationCreator.assignUserToManagerRole('manager');
      await explorationCreator.assignUserToCollaboratorRole('collaborator');
      await explorationCreator.assignUserToPlaytesterRole('playtester');

      await explorationCreator.saveExplorationDraft();
      explorationId = await explorationCreator.publishExplorationWithMetadata(
        'Publish with an interaction',
        'This is the goal of exploration.',
        'Algebra'
      );

      await UserFactory.closeBrowserForUser(explorationCreator);

      // Test manager access.
      await manager.expectExplorationToBeAccessibleByUrl(explorationId);
      await manager.dismissWelcomeModal();
      await manager.navigateToSettingsTab();

      // Verify manager can add users.
      await manager.assignUserToCollaboratorRole('newCollaborator');

      // Verify manager can modify exploration.
      await manager.navigateToEditorTab();
      await manager.updateCardContent('Updated content by manager');
      await manager.saveExplorationDraft();
      await UserFactory.closeBrowserForUser(manager);

      // Test collaborator access.
      await collaborator.expectExplorationToBeAccessibleByUrl(explorationId);
      await collaborator.dismissWelcomeModal();
      await collaborator.navigateToSettingsTab();

      // Verify collaborator cannot add users.
      const isHidden = await collaborator.isEditRolesButtonHidden();
      expect(isHidden).toBe(true);

      // Verify collaborator can modify exploration.
      await collaborator.navigateToEditorTab();
      await collaborator.updateCardContent('Updated content by collaborator');
      await collaborator.saveExplorationDraft();
      await UserFactory.closeBrowserForUser(collaborator);

      // Test playtester access.
      await playtester.expectExplorationToBeAccessibleByUrl(explorationId);
      await playtester.dismissWelcomeModal();

      // Verify playtester can view editor and translation tabs.
      await playtester.navigateToEditorTab();
      // Verify playtester cannot modify exploration.
      const isEditable = await playtester.isStateContentEditorVisible();
      expect(isEditable).toBe(false);
      await playtester.navigateToTranslationsTab();
      await playtester.dismissTranslationTabWelcomeModal();
      // Verify playtester can preview exploration.
      await playtester.navigateToPreviewTab();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
