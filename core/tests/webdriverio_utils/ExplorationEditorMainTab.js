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
 * @fileoverview Page object for the exploration editor's main tab, for use in
 * Protractor tests.
 */

var forms = require('./forms.js');
var general = require('./general.js');
var action = require('./action.js');
const { default: $ } = require('webdriverio/build/commands/browser/$.js');

var _NEW_STATE_OPTION = 'A New Card Called...';
var _CURRENT_STATE_OPTION = '(try again)';

var ExplorationEditorMainTab = function() {
  /*
   * Actions
   */

  // ---- TUTORIAL ----

  this.exitTutorial = async function() {
    var dismissWelcomeModalButton = (
      await $('.protractor-test-dismiss-welcome-modal'));
    // Exit the welcome modal.
    await action.click(
      'Dismiss Welcome Modal Button', dismissWelcomeModalButton);
    await waitFor.invisibilityOf(
      editorWelcomeModal, 'Editor Welcome modal takes too long to disappear');

    // Otherwise, if the editor tutorial shows up, exit it.
    var skipButtons = await $$('.ng-joyride .skipBtn');
    if (await skipButtons.length === 1) {
      await action.click('Skip button', skipButtons.get(0));
    } else if (await skipButtons.length !== 0) {
      throw new Error(
        'Expected to find at most one \'exit tutorial\' button');
    }
  };

  // ---- CONTENT ----

  // 'richTextInstructions' is a function that is sent a RichTextEditor which it
  // can then use to alter the state content, for example by calling
  // .appendBoldText(...).
  this.setContent = async function(richTextInstructions, expectFadeIn = false) {
    // Wait for browser to time out the popover, which is 4000 ms.
    await waitFor.invisibilityOf(
      postTutorialPopover, 'Post-tutorial popover does not disappear.');
    await action.waitForAutosave();
    if (expectFadeIn) {
      await waitFor.fadeInToComplete(
        fadeIn, 'Editor taking long to fade in');
    }
    var stateEditButton = (
      await $('.protractor-test-edit-content-pencil-button'));
    await action.click('stateEditButton', stateEditButton);
    var stateEditorTag = await $('.protractor-test-state-content-editor');
    await waitFor.visibilityOf(
      stateEditorTag, 'State editor tag not showing up');
    var stateContentEditorLocator = ('.protractor-test-state-content-editor');
    var stateContentEditor = stateEditorTag.$(stateContentEditorLocator);
    await waitFor.visibilityOf(
      stateContentEditor,
      'stateContentEditor taking too long to appear to set content');
    var richTextEditor = await forms.RichTextEditor(stateContentEditor);
    await richTextEditor.clear();
    await richTextInstructions(richTextEditor);
    await action.click('Save State Content Button', saveStateContentButton);
    await waitFor.invisibilityOf(
      saveStateContentButton,
      'State content editor takes too long to disappear');
  };
};

exports.ExplorationEditorMainTab = ExplorationEditorMainTab;
