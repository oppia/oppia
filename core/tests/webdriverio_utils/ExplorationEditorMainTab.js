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
var ruleTemplates = require(
  '../../../extensions/interactions/rule_templates.json');
var waitFor = require('../webdriverio_utils/waitFor.js');
var action = require('./action.js');

var _NEW_STATE_OPTION = 'A New Card Called...';
var _CURRENT_STATE_OPTION = '(try again)';

var ExplorationEditorMainTab = function() {
  /*
   * Interactive elements
   */
  var multipleChoiceAnswerOptions = function(optionNum) {
    return $(
      `.protractor-test-html-multiple-select-option=${optionNum}`);
  };

  var itemSelectionAnswerOptions = function(optionNum) {
    return $(
      `.protractor-test-html-item-select-option=${optionNum}`);
  };

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

   // ---- RESPONSE EDITOR ----

  /**
   * This clicks the "add new response" button and then selects the rule type
   * and enters its parameters, and closes the rule editor. Any number of rule
   * parameters may be specified after the ruleName.
   * Note that feedbackInstructions may be null (which means 'specify no
   * feedback'), and only represents a single feedback element.
   * @param {string} interactionId - Interaction type e.g. NumericInput
   * @param {object} feedbackInstructions - A RTE object containing feedback
   *                                        or null
   * @param {string} destStateName - New destination state or 'try again'/null
   * @param {boolean} createNewState - True if the rule creates a new state,
   *                                   else false.
   * @param {string} ruleName - The name of the rule, e.g. IsGreaterThan, must
   *                            match with interaction type.
   */
  this.addResponse = async function(
      interactionId, feedbackInstructions, destStateName,
      createNewState, ruleName) {
    await action.waitForAutosave();
    // Open the "Add Response" modal if it is not already open.
    var addResponseButton = $('.protractor-test-open-add-response-modal');
    await action.click('Response Editor Button', addResponseButton);
    await this.setResponse.apply(null, arguments);
  };

  this.setResponse = async function(
      interactionId, feedbackInstructions, destStateName,
      createNewState, ruleName) {
    // Set the rule description.
    var args = [addResponseDetails, interactionId, ruleName];
    for (var i = 5; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    expect(await addResponseDetails.isDisplayed()).toBe(true);
    await _selectRule(addResponseDetails, interactionId, ruleName);
    await _setRuleParameters.apply(null, args);
    // Open the feedback entry form if it is not already open.
    var isVisible = await feedbackEditor.isPresent();
    if (isVisible) {
      await action.click('Feedback editor', feedbackEditor);
    }

    if (feedbackInstructions) {
      // Set feedback contents.
      await _setOutcomeFeedback(feedbackInstructions);
    }
    // If the destination is being changed, open the corresponding editor.
    if (destStateName || destStateName !== '(try again)') {
    // Set destination contents.
      if (destStateName !== null) {
        await _setOutcomeDest(
          destStateName, createNewState, null);
      }
    }

    // Close new response modal.
    await action.click('New Response Button', addNewResponseButton);
    await waitFor.invisibilityOf(
      addNewResponseButton, 'Add New Response Modal is not closed');
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
  var closeAddResponseModal = async function() {
    // If the "Add Response" modal opens, close it.
    var addResponseHeader = await $(
      '.protractor-test-add-response-modal-header');
    var isVisible = await addResponseHeader.isExisting();
    if (isVisible) {
      var closeAddResponseButton = await $(
        '.protractor-test-close-add-response-modal');
      await action.click('Close Add Response Button', closeAddResponseButton);
    }
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

  // ---- RULES ----
  var _getRuleDescription = function(interactionId, ruleName) {
    if (ruleTemplates.hasOwnProperty(interactionId)) {
      if (ruleTemplates[interactionId].hasOwnProperty(ruleName)) {
        return ruleTemplates[interactionId][ruleName].description;
      } else {
        throw new Error('Unknown rule: ' + ruleName);
      }
    } else {
      throw new Error('Could not find rules for interaction: ' + interactionId);
    }
  };

  // Parses the relevant ruleDescription string, and returns an Array containing
  // the types of the rule input parameters.
  var _getRuleParameterTypes = function(interactionId, ruleName) {
    var ruleDescription = _getRuleDescription(interactionId, ruleName);
    // An example of rule description:
    // is equal to {{a|NonnegativeInt}} and {{b|NonnegativeInt}}.
    // (from NumericInput).
    var parameterTypes = [];
    var re = /\|(.*?)\}/ig;
    // Matched result = Array[|NonnegativeInt}, |NonnegativeInt}].
    var angularSelectors = ruleDescription.match(re);
    // Slicing first and last letter.
    if (angularSelectors) {
      for (var index = 0; index < angularSelectors.length; index++) {
        parameterTypes.push(angularSelectors[index].toString().slice(1, -1));
      }
    }
    // Expected sample output = Array[NonnegativeInt, NonnegativeInt].
    return parameterTypes;
  };

  // This function sets the parameter values for the given rule.
  // Note: The parameter values should be specified as additional arguments
  // after the ruleName. For example, the call
  //   _selectRuleParameters(ruleElement, 'NumericInput', 'Equals', 24)
  // will result in a rule that checks whether the learner's answer equals 24.
  var _setRuleParameters = async function(
      ruleElement, interactionId, ruleName) {
    var parameterValues = [];
    for (var i = 3; i < arguments.length; i++) {
      parameterValues.push(arguments[i]);
    }
    var parameterTypes = _getRuleParameterTypes(interactionId, ruleName);
    expect(parameterValues.length).toEqual(parameterTypes.length);
    for (var i = 0; i < parameterValues.length; i++) {
      var answerDescriptionFragment = $$(
        '.protractor-test-answer-description-fragment');
      var parameterElement = answerDescriptionFragment[i * 2 + 1];
      var parameterEditor = await forms.getEditor(
        parameterTypes[i])(parameterElement);

      if (interactionId === 'MultipleChoiceInput') {
        // This is a special case as it uses a dropdown to set a NonnegativeInt.
        var parameterElementButton = parameterElement.$('<button>');
        await action.click('Parameter Element Button', parameterElementButton);
        var multipleChoiceAnswerOption =
          multipleChoiceAnswerOptions(parameterValues[i]);
        await action.click(
          'Multiple Choice Answer Option: ' + i,
          multipleChoiceAnswerOption);
      } else if (interactionId === 'ItemSelectionInput') {
        var answerArray = Array.from(parameterValues[i]);
        for (var j = 0; j < answerArray.length; j++) {
          var itemSelectionAnswerOption =
            itemSelectionAnswerOptions(answerArray[j]);
          await action.click(
            'Item Selection Answer Option: ' + j,
            itemSelectionAnswerOption);
        }
      } else {
        await parameterEditor.setValue(parameterValues[i]);
      }
    }
  };

  /**
   * Parse for rule input placeholders in ruleDescription and replace them.
   * @param {string} [ruleDescription] - Interaction type.
   * @param {string[]} [providedText] - Feedback text to replace with.
   */
  var _replaceRuleInputPlaceholders = function(ruleDescription, providedText) {
    // An example of rule description:
    // "is equal to {{a|NonnegativeInt}} and {{b|NonnegativeInt}}"
    // (from NumericInput).
    var re = /{{[a-z]+[\|](.*?)}}/ig;
    // Matched result = Array[{{a|NonnegativeInt}}}, {{b|NonnegativeInt}}].
    var placeholders = ruleDescription.match(re);
    var textArray = [];
    // Return as-is if string does not contain placeholders.
    if (placeholders) {
      // Replacing placeholders in ruleDescription with given text.
      for (var index = 0; index < placeholders.length; index++) {
        var placeholderElement = placeholders[index];
        if (providedText[0] === '...') {
          ruleDescription = ruleDescription.replace(placeholderElement, '...');
        } else {
          if (providedText.length !== placeholders.length) {
            throw new Error(
              '# of feedback text(' + textArray.length +
              ') is expected to match # of placeholders(' +
              (placeholders.length) + ')');
          }
          ruleDescription = ruleDescription.replace(
            placeholderElement, providedText[index].toString());
        }
      }
    }
    return ruleDescription;
  };


  // This function selects a rule from the dropdown,
  // but does not set any of its input parameters.
  var _selectRule = async function(ruleElem, interactionId, ruleName) {
    var ruleDescription = _getRuleDescription(interactionId, ruleName);
    // Replace selectors with "...".
    ruleDescription = _replaceRuleInputPlaceholders(ruleDescription, ['...']);
    var ruleDescriptionInDropdown = ruleDescription;
    await action.click('Answer Description', answerDescription);
    var ruleDropdownElement = $$(
      `.select2-results__option=${ruleDescriptionInDropdown}`)[0];
    await action.click('Rule Dropdown Element', ruleDropdownElement);
  };
};

exports.ExplorationEditorMainTab = ExplorationEditorMainTab;
