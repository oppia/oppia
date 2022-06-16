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
 * WebdriverIO tests.
 */

var forms = require('./forms.js');
var general = require('./general.js');
var interactions = require('../../../extensions/interactions/webdriverio.js');
// var ruleTemplates = require(
//   '../../../extensions/interactions/rule_templates.json');
var waitFor = require('../webdriverio_utils/waitFor.js');
var action = require('./action.js');

var _NEW_STATE_OPTION = 'A New Card Called...';
var _CURRENT_STATE_OPTION = '(try again)';

var ExplorationEditorMainTab = function() {
  /*
   * Actions
   */

  // ---- TUTORIAL ----

  this.exitTutorial = async function() {
    var dismissWelcomeModalButton = await $(
      '.protractor-test-dismiss-welcome-modal');
    // Exit the welcome modal.
    await action.click(
      'Dismiss Welcome Modal Button', dismissWelcomeModalButton);
    var editorWelcomeModal = await $('.protractor-test-welcome-modal');
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
    var postTutorialPopover = await $('.ng-joyride .popover-content');
    await waitFor.invisibilityOf(
      postTutorialPopover, 'Post-tutorial popover does not disappear.');
    await action.waitForAutosave();
    if (expectFadeIn) {
      var fadeIn = await $('.protractor-test-editor-cards-container');
      await waitFor.fadeInToComplete(
        fadeIn, 'Editor taking long to fade in');
    }
    var stateEditButton = await $(
      '.protractor-test-edit-content-pencil-button');
    await action.click('stateEditButton', stateEditButton);
    var stateEditorTag = await $('.protractor-test-state-content-editor');
    await waitFor.visibilityOf(
      stateEditorTag, 'State editor tag not showing up');
    var stateContentEditorLocator = ('.protractor-test-state-content-editor');
    var stateContentEditor = await stateEditorTag.$(stateContentEditorLocator);
    await waitFor.visibilityOf(
      stateContentEditor,
      'stateContentEditor taking too long to appear to set content');
    var richTextEditor = await forms.RichTextEditor(stateContentEditor);
    await richTextEditor.clear();
    await richTextInstructions(richTextEditor);
    var saveStateContentButton = await $(
      '.protractor-test-save-state-content');
    await action.click('Save State Content Button', saveStateContentButton);
    await waitFor.invisibilityOf(
      saveStateContentButton,
      'State content editor takes too long to disappear');
  };

  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  var customizeInteraction = async function(interactionId) {
    if (arguments.length > 1) {
      var interactionEditor = await $('.protractor-test-interaction-editor');
      var customizationArgs = [interactionEditor];
      for (var i = 1; i < arguments.length; i++) {
        customizationArgs.push(arguments[i]);
      }
      await interactions
        .getInteraction(interactionId).customizeInteraction
        .apply(null, customizationArgs);
    }

    // The save interaction button doesn't appear for interactions having no
    // options to customize.
    var saveInteractionButton = await $(
      '.protractor-test-save-interaction');
    var result = await saveInteractionButton.isExisting();
    if (result) {
      await action.click('Save Interaction Button', saveInteractionButton);
    }
    await waitFor.invisibilityOf(
      saveInteractionButton,
      'Customize Interaction modal taking too long to close');
  };

  // This function should be used as the standard way to specify interactions
  // for most purposes. Additional arguments may be sent to this function,
  // and they will be passed on to the relevant interaction editor.
  this.setInteraction = async function(interactionId) {
    await action.waitForAutosave();
    await createNewInteraction(interactionId);
    await customizeInteraction.apply(null, arguments);
    await closeAddResponseModal();
    var addResponseHeader = await $(
      '.protractor-test-add-response-modal-header');
    await waitFor.invisibilityOf(
      addResponseHeader, 'Add Response modal takes too long to close');
    var interaction = await $('.protractor-test-interaction');
    await waitFor.visibilityOf(
      interaction, 'interaction takes too long to appear');
  };

  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  var createNewInteraction = async function(interactionId) {
    var deleteInteractionButton = await $(
      '.protractor-test-delete-interaction');
    await waitFor.invisibilityOf(
      deleteInteractionButton,
      'Please delete interaction before creating a new one');

    var addInteractionButton = await $(
      '.protractor-test-open-add-interaction-modal');
    await action.click('Add Interaction button', addInteractionButton);

    var INTERACTION_ID_TO_TAB_NAME = {
      Continue: 'commonly-used',
      EndExploration: 'commonly-used',
      ImageClickInput: 'commonly-used',
      ItemSelectionInput: 'commonly-used',
      MultipleChoiceInput: 'commonly-used',
      NumericInput: 'commonly-used',
      TextInput: 'commonly-used',
      FractionInput: 'math',
      GraphInput: 'math',
      SetInput: 'math',
      AlgebraicExpressionInput: 'math',
      MathEquationInput: 'math',
      NumericExpressionInput: 'math',
      NumberWithUnits: 'math',
      RatioExpressionInput: 'math',
      CodeRepl: 'programming',
      PencilCodeEditor: 'programming',
      MusicNotesInput: 'music',
      InteractiveMap: 'geography'
    };

    var tabId = INTERACTION_ID_TO_TAB_NAME[interactionId];
    var interactionTabButton = await $(
      `.protractor-test-interaction-tab-${tabId}`);
    await action.click('Interaction Tab', interactionTabButton);

    var targetTile = await $(
      `.protractor-test-interaction-tile-${interactionId}`);
    await waitFor.visibilityOf(
      targetTile,
      'Interaction tile ' + interactionId + ' takes too long to be visible'
    );
    await action.click('Interaction tile ' + interactionId, targetTile);
  };
};

exports.ExplorationEditorMainTab = ExplorationEditorMainTab;
