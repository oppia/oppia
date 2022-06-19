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
 * @fileoverview Page object for the exploration editor, for use in WebdriverIO
 * tests.
 */

var action = require('./action');
var forms = require('./forms.js');
var waitFor = require('./waitFor.js');

var ExplorationEditorMainTab = require(
  '../webdriverio_utils/ExplorationEditorMainTab.js');
var ExplorationEditorSettingsTab = require(
  '../webdriverio_utils/ExplorationEditorSettingsTab.js');

var ExplorationEditorPage = function() {
  /*
   * Workflows
   */
  // ---- CONTROLS ----

  this.saveChanges = async function(commitMessage) {
    await action.waitForAutosave();
    var saveChangesButton = $('.protractor-test-save-changes');
    await action.click('Save changes button', saveChangesButton);
    if (commitMessage) {
      var commitMessageInput = $(
        '.protractor-test-commit-message-input');
      await action.keys(
        'Commit message input', commitMessageInput, commitMessage);
    }
    var commitChangesButton = $(
      '.protractor-test-save-draft-button');
    await action.click('Save draft button', commitChangesButton);
    // TODO(#13096): Remove browser.sleep from e2e files.
    // eslint-disable-next-line wdio/no-pause
    await browser.pause(2500);
    var saveDraftButtonTextContainer = $(
      '.protractor-test-save-draft-message');
    await waitFor.textToBePresentInElement(
      saveDraftButtonTextContainer, 'Save Draft',
      'Changes could not be saved');
  };

  /*
   * Components
   */
  this.getMainTab = function() {
    return new ExplorationEditorMainTab.ExplorationEditorMainTab();
  };
  this.getSettingsTab = function() {
    return new ExplorationEditorSettingsTab.ExplorationEditorSettingsTab();
  };

  // ---- NAVIGATION ----

  this.navigateToSettingsTab = async function() {
    var navigateToSettingsTabButton = await $('.protractor-test-settings-tab');
    await action.click('Settings tab button', navigateToSettingsTabButton);
    await waitFor.pageToFullyLoad();
  };
};

exports.ExplorationEditorPage = ExplorationEditorPage;
