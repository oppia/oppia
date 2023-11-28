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
 * @fileoverview End-to-end tests for additional features of the exploration
 * editor and player. Additional features include those features without which
 * an exploration can still be published. These include hints, solutions,
 * refresher explorations, state parameters, etc.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');
var action = require('../webdriverio_utils/action.js');

var ExplorationEditorPage =
  require('../webdriverio_utils/ExplorationEditorPage.js');

describe('Full exploration editor', function() {
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;

  beforeAll(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
  });

  it(
    'should show discard changes modal when the changes are conflicting',
    async function() {
      await users.createUser('user11@editor.com', 'user11Editor');
      await users.createUser('user12@editor.com', 'user12Editor');

      // Create an exploration as user user11Editor with title, category, and
      // objective set and add user user12Editor as a collaborator.
      await users.login('user11@editor.com');
      await workflow.createExploration(true);
      var explorationId = await general.getExplorationIdFromEditor();
      await explorationEditorMainTab.setStateName('first card');
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.setTitle('Testing lost changes modal');
      await explorationEditorSettingsTab.setCategory('Algebra');
      await explorationEditorSettingsTab.setObjective('To assess happiness.');
      await explorationEditorSettingsTab.openAndClosePreviewSummaryTile();
      await explorationEditorPage.saveChanges();
      await workflow.addExplorationManager('user12Editor');
      await explorationEditorPage.navigateToMainTab();

      // Add a content change and does not save the draft.
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('How are you feeling?');
      }, true);
      await action.waitForAutosave();
      await users.logout();

      // Login as collaborator and make changes in the content of first state
      // which conflicts with the user user11editor's unsaved content changes
      // in the same first state.
      await users.login('user12@editor.com');
      await general.openEditor(explorationId, true);
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('You must be feeling great?');
      }, true);
      await explorationEditorPage.saveChanges();
      await users.logout();

      // Open the exploration again from the first user's account and the
      // lost changes should appear.
      await users.login('user11@editor.com');
      await general.openEditor(explorationId, false);
      var lostChangesModal = $('.e2e-test-lost-changes-modal');
      await waitFor.visibilityOf(
        lostChangesModal, 'Lost Changes Modal taking too long to appear');
      await explorationEditorPage.discardLostChanges();
      await waitFor.pageToFullyLoad();
      await explorationEditorMainTab.expectContentToMatch(
        async function(richTextChecker) {
          await richTextChecker.readPlainText('You must be feeling great?');
        }
      );
      await users.logout();
    });

  it(
    'should show discard changes modal and allow downloading of lost changes',
    async function() {
      await users.createUser('user13@editor.com', 'user13Editor');
      await users.createUser('user14@editor.com', 'user14Editor');

      // Create an exploration as user user13Editor with title, category, and
      // objective set and add user user14Editor as a collaborator.
      await users.login('user13@editor.com');
      await workflow.createExploration(true);
      var explorationId = await general.getExplorationIdFromEditor();
      await explorationEditorMainTab.setStateName('first card');
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.setTitle('Testing lost changes modal');
      await explorationEditorSettingsTab.setCategory('Algebra');
      await explorationEditorSettingsTab.setObjective('To assess happiness.');
      await explorationEditorSettingsTab.openAndClosePreviewSummaryTile();
      await explorationEditorPage.saveChanges();
      await workflow.addExplorationManager('user14Editor');
      await explorationEditorPage.navigateToMainTab();

      // Add a content change and does not save the draft.
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('How are you feeling today?');
      }, true);
      await action.waitForAutosave();
      await users.logout();

      // Login as collaborator and make changes in the content of first state
      // which conflicts with the user user13editor's unsaved content changes
      // in the same first state.
      await users.login('user14@editor.com');
      await general.openEditor(explorationId, true);
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Are you feeling great?');
      }, true);
      await explorationEditorPage.saveChanges();
      await users.logout();

      // Open the exploration again from the first user's account and the
      // lost changes modal should appear. Try downloading the lost changes
      // file.
      await users.login('user13@editor.com');
      await general.openEditor(explorationId, false);
      var lostChangesModal = $('.e2e-test-lost-changes-modal');
      await waitFor.visibilityOf(
        lostChangesModal, 'Lost Changes Modal taking too long to appear');
      await explorationEditorPage.discardLostChanges();
      await waitFor.pageToFullyLoad();
      await explorationEditorMainTab.expectContentToMatch(
        async function(richTextChecker) {
          await richTextChecker.readPlainText('Are you feeling great?');
        }
      );
      await users.logout();
    });

  it(
    'should show a warning notification to merge the changes' +
    ' if there are more than 50 changes in the draft',
    async function() {
      await users.createUser('user15@editor.com', 'user15Editor');

      // Create an exploration as user user15editor and add
      // 50 changes to the draft.
      await users.login('user15@editor.com');
      await workflow.createExploration(true);
      await explorationEditorPage.navigateToMainTab();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 1');
      }, true);
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 2');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 3');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 4');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 5');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 6');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 7');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 8');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 9');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 10');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 11');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 12');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 13');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 14');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 15');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 16');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 17');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 18');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 19');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 20');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 21');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 22');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 23');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 24');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 25');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 26');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 27');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 28');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 29');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 30');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 31');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 32');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 33');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 34');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 35');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 36');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 37');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 38');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 39');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 40');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 41');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 42');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 43');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 44');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 45');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 46');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 47');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 48');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 49');
      });
      await action.waitForAutosave();
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Content 50');
      });
      await action.waitForAutosave();

      // After 50th change, modal should appear recommending user to save the
      // changes.
      await waitFor.visibilityOf(
        $('.e2e-test-save-prompt-modal'),
        'Save Recommendation Prompt Modal taking too long to appear');
      await explorationEditorPage.acceptSaveRecommendationPrompt(
        'Changed Content so many times');
      await explorationEditorMainTab.expectContentToMatch(
        async function(richTextChecker) {
          await richTextChecker.readPlainText('Content 50');
        }
      );

      await users.logout();
    });

  it(
    'should be able to make changes offline and the changes ' +
    'should be saved when online.',
    async function() {
      await users.createUser('user16@editor.com', 'user16Editor');

      await users.login('user16@editor.com');
      await workflow.createExploration(true);
      await explorationEditorPage.navigateToMainTab();

      // Add a content change and does not save the draft.
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('How are you feeling?');
      }, true);
      await action.waitForAutosave();

      // Check that the save changes button is enabled when online.
      await explorationEditorPage.expectSaveChangesButtonEnabled();

      // Set network connection to offline.
      await general.goOffline();

      // Check that toast message appeared when offline.
      await explorationEditorPage.waitForOfflineAlert();

      // Add a content change to check changes can be done when offline.
      await explorationEditorMainTab.setContent(async function(richTextEditor) {
        await richTextEditor.appendPlainText('Hello Oppia?');
      });

      // Check that the save changes button is disabled when offline.
      await explorationEditorPage.expectSaveChangesButtonDisabled();

      // Set network connection to online.
      await general.goOnline();

      // Check that toast message appeared when reconnected.
      await explorationEditorPage.waitForOnlineAlert();

      await action.waitForAutosave();

      // Check that the save changes button is enabled when reconnected.
      await explorationEditorPage.expectSaveChangesButtonEnabled();

      await explorationEditorMainTab.expectContentToMatch(
        async function(richTextChecker) {
          await richTextChecker.readPlainText('Hello Oppia?');
        }
      );
      await users.logout();
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
