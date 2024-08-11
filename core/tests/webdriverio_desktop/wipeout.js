// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for wipeout.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');

var DeleteAccountPage = require('../webdriverio_utils/DeleteAccountPage.js');
var ExplorationEditorPage = require('../webdriverio_utils/ExplorationEditorPage.js');

describe('When account is deleted it', function () {
  var EXPLORATION_TITLE = 'Exploration';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var deleteAccountPage = null;
  var explorationEditorPage = null;
  var explorationEditorSettingsTab = null;
  var expectedConsoleErrors = null;

  beforeEach(function () {
    deleteAccountPage = new DeleteAccountPage.DeleteAccountPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    expectedConsoleErrors = [
      // NOTE: Wipeout disables the Firebase account of users. When we try to
      // login to a disabled user, the Firebase SDK emits an error log. We
      // cannot suppress the error without patching the library, so instead we
      // just ignore it here.
      'The user account has been disabled by an administrator',
    ];
  });

  it('should delete private exploration', async function () {
    await users.createUser('ExpCollaborator@oppia.com', 'ExpCollaborator');
    await users.createAndLoginUser('user2@delete.com', 'userToDelete2');
    await workflow.createExploration(true);
    var explorationId = await general.getExplorationIdFromEditor();
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle('voice artists');
    await workflow.addExplorationCollaborator('ExpCollaborator');
    await deleteAccountPage.get();
    await deleteAccountPage.requestAccountDeletion('userToDelete2');

    await users.login('ExpCollaborator@oppia.com');
    await general.openEditor(explorationId, false);
    await general.expectErrorPage(404);
    expectedConsoleErrors.push(
      'Failed to load resource: the server responded with a status of 404'
    );
    expectedConsoleErrors.push(
      `The requested path /create/${explorationId} is not found.`
    );
    await users.logout();
  });

  it('should set published exploration as community owned', async function () {
    await users.createUser('user@check.com', 'userForChecking');
    await users.createAndLoginUser('user3@delete.com', 'userToDelete3');
    await workflow.createAndPublishExploration(
      EXPLORATION_TITLE,
      EXPLORATION_CATEGORY,
      EXPLORATION_OBJECTIVE,
      'English',
      true
    );
    var explorationId = await general.getExplorationIdFromEditor();
    await deleteAccountPage.get();
    await deleteAccountPage.requestAccountDeletion('userToDelete3');

    await users.login('user@check.com');
    await general.openEditor(explorationId, true);
    await workflow.isExplorationCommunityOwned();
    await users.logout();
  });

  it('should keep published exploration with other owner', async function () {
    await users.createUser('secondOwner@check.com', 'secondOwner');
    await users.createAndLoginUser('user4@delete.com', 'userToDelete4');
    await workflow.createExploration(true);
    var explorationId = await general.getExplorationIdFromEditor();
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle('second owner');
    await workflow.addExplorationManager('secondOwner');
    await deleteAccountPage.get();
    await deleteAccountPage.requestAccountDeletion('userToDelete4');

    await users.login('secondOwner@check.com');
    await general.openEditor(explorationId, true);
    await explorationEditorPage.navigateToSettingsTab();
    expect(await workflow.getExplorationManagers()).toEqual(['secondOwner']);
    await users.logout();
  });

  afterEach(async function () {
    await general.checkForConsoleErrors(expectedConsoleErrors);
  });
});
