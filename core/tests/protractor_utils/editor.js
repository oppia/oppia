// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utilities for manipulating the exploration editor when
 * carrrying out end-to-end testing with protractor.
 */

var forms = require('./forms.js');
var general = require('./general.js');
var interactions = require('../../../extensions/interactions/protractor.js');
var ruleTemplates = require(
  '../../../extensions/interactions/rule_templates.json');

var _NEW_STATE_OPTION = 'A New Card Called...';
var _CURRENT_STATE_OPTION = '(try again)';

var exitTutorialIfNecessary = function() {
  // If the editor welcome modal shows up, exit it.
  element.all(by.css('.protractor-test-welcome-modal')).then(function(modals) {
    if (modals.length === 1) {
      element(by.css('.protractor-test-dismiss-welcome-modal')).click();
    } else if (modals.length !== 0) {
      throw 'Expected to find at most one \'welcome modal\'';
    }
  });

  // Otherwise, if the editor tutorial shows up, exit it.
  element.all(by.css('.skipBtn')).then(function(buttons) {
    if (buttons.length === 1) {
      buttons[0].click();
    } else if (buttons.length !== 0) {
      throw 'Expected to find at most one \'exit tutorial\' button';
    }
  });
};

var startTutorial = function() {
  element(by.css('.protractor-test-start-tutorial')).click();
  general.waitForSystem();
};

var progressInTutorial = function() {
  // Progress to the next instruction in the tutorial.
  element.all(by.css('.nextBtn')).then(function(buttons) {
    if (buttons.length === 1) {
      buttons[0].click();
    } else {
      throw 'Expected to find exactly one \'next\' button';
    }
  });
};

var finishTutorial = function() {
  // Finish the tutorial.
  element.all(by.buttonText('Finish')).then(function(buttons) {
    if (buttons.length === 1) {
      buttons[0].click();
    } else {
      throw 'Expected to find exactly one \'Finish\' button';
    }
  });
};

// NAVIGATION

var navigateToMainTab = function() {
  element(by.css('.protractor-test-main-tab')).click();
  general.waitForSystem();
  // Click a neutral element in order to dismiss any warnings.
  element(by.css('.protractor-test-neutral-element')).click();
};

var navigateToPreviewTab = function() {
  element(by.css('.protractor-test-preview-tab')).click();
  general.waitForSystem();
};

var navigateToSettingsTab = function() {
  element(by.css('.protractor-test-settings-tab')).click();
};

var navigateToStatsTab = function() {
  element(by.css('.protractor-test-stats-tab')).click();
};

// UTILITIES

var _getNumPassersby = function() {
  return element(by.css('.protractor-test-num-passersby')).getText();
};

var expectNumPassersbyToBe = function(numPassersby) {
  expect(_getNumPassersby()).toMatch(numPassersby);
};

var setStateName = function(name) {
  var nameElement = element(by.css('.protractor-test-state-name-container'));
  nameElement.click();
  nameElement.element(by.css('.protractor-test-state-name-input')).clear();
  nameElement.element(by.css('.protractor-test-state-name-input')).
    sendKeys(name);
  nameElement.element(by.css('.protractor-test-state-name-submit')).click();
  // Wait for the state to refresh.
  general.waitForSystem();
};

var _getStateName = function() {
  return element(by.css('.protractor-test-state-name-container')).getText();
};

var expectCurrentStateToBe = function(name) {
  expect(_getStateName()).toMatch(name);
};

var expectCurrentTabToBeFeedbackTab = function() {
  expect(element(by.css(
    '.protractor-test-oppia-feedback-tab-row')).isPresent()).toBe(true);
};

// CONTENT

// 'richTextInstructions' is a function that is sent a RichTextEditor which it
// can then use to alter the state content, for example by calling
// .appendBoldText(...).
var setContent = function(richTextInstructions) {
  general.waitForSystem();
  element(by.css('.protractor-test-state-edit-content')).click();
  var richTextEditor = forms.RichTextEditor(
    element(by.css('.protractor-test-state-content-editor')));
  richTextEditor.clear();
  richTextInstructions(richTextEditor);
  element(by.css('.protractor-test-save-state-content')).click();
};

// This receives a function richTextInstructions used to verify the display of
// the state's content visible when the content editor is closed. The
// richTextInstructions will be supplied with a handler of the form
// forms.RichTextChecker and can then perform checks such as
//   handler.readBoldText('bold')
//   handler.readRteComponent('Collapsible', 'outer', 'inner')
// These would verify that the content consists of the word 'bold' in bold
// followed by a Collapsible component with the given arguments, and nothing
// else. Note that this fails for collapsibles and tabs since it is not
// possible to click on them to view their contents, as clicks instead open the
// rich text editor.
var expectContentToMatch = function(richTextInstructions) {
  forms.expectRichText(
    element(by.css('.protractor-test-state-content-display'))
  ).toMatch(richTextInstructions);
};

var expectContentTextToEqual = function(text) {
  forms.expectRichText(
    element(by.css('.protractor-test-state-content-display'))
  ).toEqual(text);
};

// INTERACTIONS

// This function should be used as the standard way to specify interactions for
// most purposes. Additional arguments may be sent to this function,
// and they will be passed on to the relevant interaction editor.
var setInteraction = function(interactionId) {
  general.waitForSystem();
  openInteraction(interactionId);
  customizeInteraction.apply(null, arguments);
  // If the "Add Response" modal opens, close it.
  var headerElem = element(by.css(
    '.protractor-test-add-response-modal-header'));
  headerElem.isPresent().then(function(isVisible) {
    if (isVisible) {
      closeAddResponseModal();
    }
  });
};

// This function should not usually be invoked directly; please consider
// using setInteraction instead.
var openInteraction = function(interactionId) {
  element(by.css('.protractor-test-delete-interaction')).isPresent().then(
    function(isVisible) {
      // If there is already an interaction present, delete it.
      if (isVisible) {
        element(by.css('.protractor-test-delete-interaction')).click();
        // Click through the "are you sure?" warning.
        element(by.css('.protractor-test-confirm-delete-interaction')).click();
      }
    });

  general.waitForSystem();

  element(by.css('.protractor-test-open-add-interaction-modal')).click();

  var INTERACTION_ID_TO_TAB_NAME = {
    Continue: 'General',
    EndExploration: 'General',
    FractionInput: 'Math',
    ImageClickInput: 'General',
    MultipleChoiceInput: 'General',
    TextInput: 'General',
    GraphInput: 'Math',
    LogicProof: 'Math',
    NumericInput: 'Math',
    NumberWithUnits: 'Math',
    SetInput: 'Math',
    CodeRepl: 'Programming',
    MusicNotesInput: 'Music',
    InteractiveMap: 'Geography'
  };

  general.waitForSystem();
  element(by.css(
    '.protractor-test-interaction-tab-' +
    INTERACTION_ID_TO_TAB_NAME[interactionId])).click();
  element(by.css('.protractor-test-interaction-tile-' + interactionId)).click();
};

// This function should not usually be invoked directly; please consider
// using setInteraction instead.
var closeAddResponseModal = function() {
  element(by.css('.protractor-test-close-add-response-modal')).click();
  general.waitForSystem();
};

// This function should not usually be invoked directly; please consider
// using setInteraction instead.
var customizeInteraction = function(interactionId) {
  if (arguments.length > 1) {
    var elem = element(by.css('.protractor-test-interaction-editor'));
    var customizationArgs = [elem];
    for (var i = 1; i < arguments.length; i++) {
      customizationArgs.push(arguments[i]);
    }
    interactions.getInteraction(interactionId).customizeInteraction.apply(
      null, customizationArgs);
  }

  // The save interaction button doesn't appear for interactions having no
  // options to customize.
  var saveInteractionBtn = element(by.css('.protractor-test-save-interaction'));
  saveInteractionBtn.isPresent().then(function(result) {
    if (result) {
      saveInteractionBtn.click();
      // Wait for the customization modal to close.
      general.waitForSystem();
    }
  });
};

// Likewise this can receive additional arguments.
// Note that this refers to the interaction displayed in the editor tab (as
// opposed to the preview tab, which uses the corresponding function in
// player.js).
var expectInteractionToMatch = function(interactionId) {
  // Convert additional arguments to an array to send on.
  var args = [element(by.css('.protractor-test-interaction'))];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  interactions.getInteraction(interactionId).
    expectInteractionDetailsToMatch.apply(null, args);
};

var expectCannotDeleteInteraction = function() {
  expect(element(by.css(
    '.protractor-test-delete-interaction')).isPresent()).toBeFalsy();
};

// PARAMETERS

// This function adds a parameter change, creating the parameter if necessary.
var addParameterChange = function(paramName, paramValue) {
  element(by.css('.protractor-test-state-edit-param-changes')).click();
  element(by.css('.protractor-test-add-param-button')).click();

  var editorRowElem = element.all(by.css(
    '.protractor-test-param-changes-list')).last();

  forms.AutocompleteDropdownEditor(editorRowElem).setValue(paramName);

  /* Setting parameter value is difficult via css since input fields
    are dynamically generated. We isolate it as the last input in the
    current parameter changes UI. */
  var item = editorRowElem.all(by.tagName('input')).last();
  item.clear();
  item.sendKeys(paramValue);

  element(by.css('.protractor-test-save-param-changes-button')).click();

  general.waitForSystem(500);
};

// This function adds a multiple-choice parameter change, creating the
// parameter if necessary.
var addMultipleChoiceParameterChange = function(paramName, paramValues) {
  element(by.css('.protractor-test-state-edit-param-changes')).click();
  element(by.css('.protractor-test-add-param-button')).click();

  var editorRowElem = element.all(by.css(
    '.protractor-test-param-changes-list')).last();

  forms.AutocompleteDropdownEditor(editorRowElem).setValue(paramName);

  editorRowElem.element(by.cssContainingText('option', 'to one of')).click();

  paramValues.forEach(function(paramValue) {
    var item = editorRowElem.all(by.tagName('input')).last();
    item.clear();
    item.sendKeys(paramValue);
  });

  element(by.css('.protractor-test-save-param-changes-button')).click();

  general.waitForSystem(500);
};

// This function adds a exploration level parameter change, creating
// the parameter if necessary.
var addExplorationLevelParameterChange = function(paramName, paramValue) {
  runFromSettingsTab(function() {
    element(by.css('.protractor-test-exploration-edit-param-changes')).click();
    element(by.css('.protractor-test-add-param-button')).click();

    var editorRowElem = element.all(by.css(
      '.protractor-test-param-changes-list')).last();

    forms.AutocompleteDropdownEditor(editorRowElem).setValue(paramName);

    /* Setting parameter value is difficult via css since input fields
      are dynamically generated. We isolate it as the last input in the
      current parameter changes UI. */
    var item = editorRowElem.all(by.tagName('input')).last();
    item.clear();
    item.sendKeys(paramValue);

    element(by.css('.protractor-test-save-param-changes-button')).click();
  });
};

// RULES
var _getRuleDescription = function(interactionId, ruleName) {
  if (ruleTemplates.hasOwnProperty(interactionId)) {
    if (ruleTemplates[interactionId].hasOwnProperty(ruleName)) {
      return ruleTemplates[interactionId][ruleName].description;
    } else {
      throw Error('Unknown rule: ' + ruleName);
    }
  } else {
    throw Error('Could not find rules for interaction: ' + interactionId);
  }
};

var selectRuleInAddResponseModal = function(interactionId, ruleName) {
  var ruleElement = element(by.css('.protractor-test-add-response-details'));
  _selectRule(ruleElement, interactionId, ruleName);
};

var setRuleParametersInAddResponseModal = function() {
  var ruleElement = element(by.css('.protractor-test-add-response-details'));
  var args = [ruleElement];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  _setRuleParameters.apply(null, args);
};

// Parses the relevant ruleDescription string, and returns an Array containing
// the types of the rule input parameters.
var _getRuleParameterTypes = function(interactionId, ruleName) {
  var ruleDescription = _getRuleDescription(interactionId, ruleName);

  var parameterStart = (ruleDescription.indexOf('{{') === -1) ?
    undefined : ruleDescription.indexOf('{{');
  var parameterTypes = [];
  while (parameterStart !== undefined) {
    var parameterEnd = ruleDescription.indexOf('}}', parameterStart) + 2;
    parameterTypes.push(
      ruleDescription.substring(
        ruleDescription.indexOf('|', parameterStart) + 1, parameterEnd - 2));

    var nextParameterStart =
      (ruleDescription.indexOf('{{', parameterEnd) === -1) ?
        undefined : ruleDescription.indexOf('{{', parameterEnd);
    parameterStart = nextParameterStart;
  }
  return parameterTypes;
};

// This function sets the parameter values for the given rule.
// Note: The parameter values should be specified as additional arguments
// after the ruleName. For example, the call
//   _selectRuleParameters(ruleElement, 'NumericInput', 'Equals', 24)
// will result in a rule that checks whether the learner's answer equals 24.
var _setRuleParameters = function(ruleElement, interactionId, ruleName) {
  var parameterValues = [];
  for (var i = 3; i < arguments.length; i++) {
    parameterValues.push(arguments[i]);
  }
  var parameterTypes = _getRuleParameterTypes(interactionId, ruleName);
  expect(parameterValues.length).toEqual(parameterTypes.length);

  for (var i = 0; i < parameterValues.length; i++) {
    var parameterElement = ruleElement.all(by.css(
      '.protractor-test-answer-description-fragment')).get(i * 2 + 1);
    var parameterEditor = forms.getEditor(parameterTypes[i])(parameterElement);

    if (interactionId === 'MultipleChoiceInput') {
      // This is a special case as it uses a dropdown to set a NonnegativeInt
      parameterElement.element(
        by.tagName('button')
      ).click();
      parameterElement.element(
        by.cssContainingText(
          '.protractor-test-html-select-option', parameterValues[i])
      ).click();
    } else {
      parameterEditor.setValue(parameterValues[i]);
    }
  }
};

// This function selects a rule from the dropdown,
// but does not set any of its input parameters.
var _selectRule = function(ruleElement, interactionId, ruleName) {
  var ruleDescription = _getRuleDescription(interactionId, ruleName);

  var parameterStart = (
    ruleDescription.indexOf('{{') === -1) ?
    undefined :
    ruleDescription.indexOf('{{');
  // From the ruleDescription string we can deduce both the description used
  // in the page (which will have the form "is equal to ...") and the types
  // of the parameter objects, which will later tell us which object editors
  // to use to enter the parameterValues.
  var ruleDescriptionInDropdown = ruleDescription.substring(0, parameterStart);
  while (parameterStart !== undefined) {
    var parameterEnd = ruleDescription.indexOf('}}', parameterStart) + 2;
    var nextParameterStart =
      (ruleDescription.indexOf('{{', parameterEnd) === -1) ?
        undefined : ruleDescription.indexOf('{{', parameterEnd);
    ruleDescriptionInDropdown = ruleDescriptionInDropdown + '...' +
      ruleDescription.substring(parameterEnd, nextParameterStart);
    parameterStart = nextParameterStart;
  }

  ruleElement.element(by.css('.protractor-test-answer-description')).click();

  element.all(by.css('.select2-dropdown')).map(function(selectorElement) {
    selectorElement.all(by.cssContainingText(
      'li.select2-results__option', ruleDescriptionInDropdown
    )).filter(function(elem) {
      // We need to do this check because some options may only have
      // 'ruleDescriptionInDropdown' as a substring.
      return elem.getText().then(function(text) {
        return text === ruleDescriptionInDropdown;
      });
    }).then(function(optionElements) {
      if (optionElements.length !== 1) {
        throw (
          'Expected exactly one rule option to match: ' +
          ruleDescriptionInDropdown + '; found ' + optionElements.length +
          ' instead');
      }
      optionElements[0].click();
    });
  });
};

// Checks that the current rule parameter values match the given ones.
// Note: the expected rule parameter values should be specified as
// additional arguments after the ruleName.
//
// Before using this function, ensure that expectValueToBe (see the TODO below)
// is implemented in the corresponding parameter type editor.
var expectRuleParametersToBe = function(interactionId, ruleName) {
  var parameterValues = [];
  for (var i = 2; i < arguments.length; i++) {
    parameterValues.push(arguments[i]);
  }

  parameterTypes = _getRuleParameterTypes(interactionId, ruleName);
  expect(parameterValues.length).toEqual(parameterTypes.length);

  // Now we enter the parameters
  for (var i = 0; i < parameterValues.length; i++) {
    var parameterElement = element.all(by.css(
      '.protractor-test-answer-description-fragment')).get(i * 2 + 1);
    var parameterEditor = forms.getEditor(parameterTypes[i])(parameterElement);
    // TODO(maitbayev): implement expectValueToBe in all parameterEditors.
    parameterEditor.expectValueToBe(parameterValues[i]);
  }
};

var _setOutcomeFeedback = function(feedbackEditorElem, richTextInstructions) {
  var feedbackEditor = forms.RichTextEditor(
    feedbackEditorElem.element(by.css('.protractor-test-feedback-bubble')));
  feedbackEditor.clear();
  richTextInstructions(feedbackEditor);
};

var _setOutcomeDest = function(
    destEditorElem, destName, createDest, refresherExplorationId) {
  expect(destName === null && createDest).toBe(false);
  var destinationElement =
    destEditorElem.element(by.css('.protractor-test-dest-bubble'));

  if (createDest) {
    targetOption = _NEW_STATE_OPTION;
  } else if (destName === null) {
    targetOption = _CURRENT_STATE_OPTION;
  } else {
    targetOption = destName;
  }

  destinationElement.element(
    by.cssContainingText('option', targetOption)).click();
  if (createDest) {
    destinationElement.element(
      by.css('.protractor-test-add-state-input')
    ).sendKeys(destName);
  } else if (refresherExplorationId) {
    destinationElement.element(
      by.css('.protractor-test-add-refresher-exploration-id')
    ).sendKeys(refresherExplorationId);
  }
};

// This clicks the "add new response" button and then selects the rule type and
// enters its parameters, and closes the rule editor. Any number of rule
// parameters may be specified after the ruleName.
// - interactionId: the name of the interaction type, e.g. NumericInput.
// - feedbackInstructions: a rich-text object containing feedback, or null.
// - destStateName: the name of the destination state of the rule, or null if
//     the rule loops to the current state.
// - createState: true if the rule creates a new state, else false.
// - refresherExplorationId: the id of refresher exploration for the current
//     state (if applicable), by default, should be null.
// - ruleName: the name of the rule, e.g. IsGreaterThan.
//
// Note that feedbackInstructions may be null (which means 'specify no
// feedback'), and only represents a single feedback element.
var addResponse = function(interactionId, feedbackInstructions, destStateName,
    createState, ruleName) {
  // Open the "Add Response" modal if it is not already open.
  var headerElem = element(by.css(
    '.protractor-test-add-response-modal-header'));
  headerElem.isPresent().then(function(isVisible) {
    if (!isVisible) {
      element(by.css('.protractor-test-open-add-response-modal')).click();
      general.waitForSystem();
    }
  });

  // Set the rule description.
  var ruleElement = element(by.css('.protractor-test-add-response-details'));
  var args = [ruleElement, interactionId, ruleName];
  for (var i = 5; i < arguments.length; i++) {
    args.push(arguments[i]);
  }

  _selectRule(ruleElement, interactionId, ruleName);
  _setRuleParameters.apply(null, args);

  // Open the feedback entry form if it is not already open.
  var feedbackContainerElem = element(by.css(
    '.protractor-test-open-feedback-editor'));
  feedbackContainerElem.isPresent().then(function(isVisible) {
    if (isVisible) {
      element(by.css('.protractor-test-open-feedback-editor')).click();
    }
  });

  if (feedbackInstructions) {
    // Set feedback contents.
    _setOutcomeFeedback(ruleElement, feedbackInstructions);
  }
  // If the destination is being changed, open the corresponding editor.
  if (destStateName) {
    // Set destination contents.
    _setOutcomeDest(
      ruleElement, destStateName, createState, null);
  }

  // Close new response modal.
  element(by.css('.protractor-test-add-new-response')).click();

  // Wait for modal to close.
  general.waitForSystem();
};

var setDefaultOutcome = function(feedbackInstructions,
    destStateName, createState) {
  // Select the default response.
  var editor = ResponseEditor('default');

  if (feedbackInstructions) {
    editor.setFeedback(feedbackInstructions);
  }

  // If the destination is being changed, open the corresponding editor.
  if (destStateName) {
    editor.setDestination(destStateName, createState, null);
  }

  // Wait for feedback and/or destination editors to finish saving.
  general.waitForSystem();
};

// Rules are zero-indexed; 'default' denotes the default outcome.
var ResponseEditor = function(responseNum) {
  var headerElem;
  if (responseNum === 'default') {
    headerElem = element(by.css('.protractor-test-default-response-tab'));
  } else {
    headerElem = element.all(by.css('.protractor-test-response-tab')).get(
      responseNum);
  }

  var responseBodyElem = element(
    by.css('.protractor-test-response-body-' + responseNum));
  responseBodyElem.isPresent().then(function(isVisible) {
    if (!isVisible) {
      headerElem.click();
    }
  });

  return {
    setFeedback: function(richTextInstructions) {
      // Begin editing feedback.
      element(by.css('.protractor-test-open-outcome-feedback-editor')).click();

      // Set feedback contents.
      var feedbackElement = element(by.css(
        '.protractor-test-edit-outcome-feedback'));
      _setOutcomeFeedback(feedbackElement, richTextInstructions);

      // Save feedback.
      element(by.css('.protractor-test-save-outcome-feedback')).click();
    },
    // This saves the rule after the destination is selected.
    //  - destinationName: The name of the state to move to, or null to stay on
    //    the same state.
    //  - createState: whether the destination state is new and must be created
    //    at this point.
    setDestination: function(
        destinationName, createState, refresherExplorationId) {
      // Begin editing destination.
      element(by.css('.protractor-test-open-outcome-dest-editor')).click();

      // Set destination contents.
      var destElement = element(by.css(
        '.protractor-test-edit-outcome-dest'));
      _setOutcomeDest(
        destElement, destinationName, createState, refresherExplorationId);

      // Save destination.
      general.waitForSystem();
      element(by.css('.protractor-test-save-outcome-dest')).click();
    },
    // The current state name must be at the front of the list.
    expectAvailableDestinationsToBe: function(stateNames) {
      // Begin editing destination.
      element(by.css('.protractor-test-open-outcome-dest-editor')).click();

      var expectedOptionTexts = [_CURRENT_STATE_OPTION].concat(
        stateNames.slice(1));

      // Create new option always at the end of the list.
      expectedOptionTexts.push(_NEW_STATE_OPTION);

      var destElement = element(by.css(
        '.protractor-test-edit-outcome-dest'));
      var destinationElement =
        destElement.element(by.css('.protractor-test-dest-bubble'));
      destinationElement.all(by.tagName('option')).map(function(optionElem) {
        return optionElem.getText();
      }).then(function(actualOptionTexts) {
        expect(actualOptionTexts).toEqual(expectedOptionTexts);
      });

      // Cancel editing the destination.
      element(by.css('.protractor-test-cancel-outcome-dest')).click();
    },
    addRule: function(interactionId, ruleName) {
      // Additional parameters may be provided after ruleName.

      // Add the rule
      element(by.css('.protractor-test-add-answer')).click();

      // Set the rule description.
      var ruleElement = element(by.css('.protractor-test-rule-details'));
      var args = [ruleElement, interactionId, ruleName];
      for (var i = 2; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      _selectRule(ruleElement, interactionId, ruleName);
      _setRuleParameters.apply(null, args);

      // Save the new rule.
      element(by.css('.protractor-test-save-answer')).click();
    },
    // eslint-disable-next-line quote-props
    delete: function() {
      headerElem.element(by.css('.protractor-test-delete-response')).click();
      element(by.css('.protractor-test-confirm-delete-response')).click();
    },
    expectCannotSetFeedback: function() {
      var feedbackEditorElem = element(by.css(
        '.protractor-test-open-outcome-feedback-editor'));
      expect(feedbackEditorElem.isPresent()).toBeFalsy();
    },
    expectCannotSetDestination: function() {
      var destEditorElem = element(by.css(
        '.protractor-test-open-outcome-dest-editor'));
      expect(destEditorElem.isPresent()).toBeFalsy();
    },
    expectCannotAddRule: function() {
      expect(headerElem.element(by.css(
        '.protractor-test-add-answer')).isPresent()).toBeFalsy();
    },
    expectCannotDeleteRule: function(ruleNum) {
      ruleElem = element.all(by.css(
        '.protractor-test-rule-block')).get(ruleNum);
      expect(ruleElem.element(by.css(
        '.protractor-test-delete-answer')).isPresent()).toBeFalsy();
    },
    expectCannotDeleteResponse: function() {
      expect(headerElem.element(by.css(
        '.protractor-test-delete-response')).isPresent()).toBeFalsy();
    }
  };
};

var expectCannotAddResponse = function() {
  expect(element(by.css(
    '.protractor-test-open-add-response-modal')).isPresent()).toBeFalsy();
};

// STATE GRAPH

// NOTE: if the state is not visible in the state graph this function will fail
var moveToState = function(targetName) {
  general.scrollToTop();
  element.all(by.css('.protractor-test-node')).map(function(stateElement) {
    return stateElement.element(by.css('.protractor-test-node-label')).
      getText();
  }).then(function(listOfNames) {
    var matched = false;
    for (var i = 0; i < listOfNames.length; i++) {
      if (listOfNames[i] === targetName) {
        element.all(by.css('.protractor-test-node')).get(i).click();
        matched = true;
        general.waitForSystem();
      }
    }
    if (!matched) {
      throw Error('State ' + targetName + ' not found by editor.moveToState');
    }
  });
};

var deleteState = function(stateName) {
  general.waitForSystem();
  element.all(by.css('.protractor-test-node')).map(function(stateElement) {
    return stateElement.element(by.css('.protractor-test-node-label')).
      getText();
  }).then(function(listOfNames) {
    var matched = false;
    for (var i = 0; i < listOfNames.length; i++) {
      if (listOfNames[i] === stateName) {
        element.all(by.css('.protractor-test-node')).get(i).
          element(by.css('.protractor-test-delete-node')).click();
        browser.waitForAngular();
        general.waitForSystem();
        element(by.css('.protractor-test-confirm-delete-state')).click();
        matched = true;
      }
    }
    if (!matched) {
      throw Error('State ' + stateName + ' not found by editor.deleteState');
    }
  });
};

// For this to work, there must be more than one name, otherwise the
// exploration overview will be disabled.
var expectStateNamesToBe = function(names) {
  element.all(by.css('.protractor-test-node')).map(function(stateNode) {
    return stateNode.element(by.css('.protractor-test-node-label')).getText();
  }).then(function(stateNames) {
    expect(stateNames.sort()).toEqual(names.sort());
  });
};

// SETTINGS

// All functions involving the settings tab should be sent through this
// wrapper.
var runFromSettingsTab = function(callbackFunction) {
  navigateToSettingsTab();
  var result = callbackFunction();
  navigateToMainTab();
  return result;
};

var setTitle = function(title) {
  runFromSettingsTab(function() {
    element(by.css('.protractor-test-exploration-title-input')).clear();
    element(by.css('.protractor-test-exploration-title-input')).sendKeys(
      title);
  });
};

var setCategory = function(category) {
  runFromSettingsTab(function() {
    forms.AutocompleteDropdownEditor(
      element(by.css('.protractor-test-exploration-category-input'))
    ).setValue(category);
  });
};

var setObjective = function(objective) {
  runFromSettingsTab(function() {
    element(by.css('.protractor-test-exploration-objective-input')).clear();
    element(by.css('.protractor-test-exploration-objective-input')).
      sendKeys(objective);
  });
};

var setLanguage = function(language) {
  runFromSettingsTab(function() {
    element(by.css('.protractor-test-exploration-language-select')).
      element(by.cssContainingText('option', language)).click();
  });
};

var expectAvailableFirstStatesToBe = function(names) {
  runFromSettingsTab(function() {
    element(by.css('.protractor-test-initial-state-select'))
      .all(by.tagName('option')).map(function(elem) {
        return elem.getText();
      }).then(function(options) {
        expect(options.sort()).toEqual(names.sort());
      });
  });
};

var setFirstState = function(stateName) {
  runFromSettingsTab(function() {
    element(by.css('.protractor-test-initial-state-select')).
      element(by.cssContainingText('option', stateName)).click();
  });
};

var enableParameters = function() {
  runFromSettingsTab(function() {
    element(by.css('.protractor-test-enable-parameters')).click();
  });
};

var openAndClosePreviewSummaryTile = function() {
  runFromSettingsTab(function() {
    element(by.css('.protractor-test-open-preview-summary-modal')).click();
    general.waitForSystem();
    expect(element(by.css(
      '.protractor-test-exploration-summary-tile')).isPresent()).toBeTruthy();
    element(by.css('.protractor-test-close-preview-summary-modal')).click();
    general.waitForSystem();
    expect(element(by.css(
      '.protractor-test-exploration-summary-tile')).isPresent()).toBeFalsy();
  });
};

// CONTROLS

var saveChanges = function(commitMessage) {
  element(by.css('.protractor-test-save-changes')).click().then(function() {
    if (commitMessage) {
      element(by.css('.protractor-test-commit-message-input')).
        sendKeys(commitMessage);
    }
    browser.waitForAngular();
    general.waitForSystem();
    element(by.css('.protractor-test-close-save-modal')).click();
    // This is necessary to give the page time to record the changes,
    // so that it does not attempt to stop the user leaving.
    browser.waitForAngular();
    general.waitForSystem();
  });
};

var discardChanges = function() {
  element(by.css('.protractor-test-save-discard-toggle')).click();
  element(by.css('.protractor-test-discard-changes')).click();
  element(by.css('.protractor-test-confirm-discard-changes')).click();
  general.waitForSystem();
  browser.waitForAngular();
};

var expectCannotSaveChanges = function() {
  expect(element(by.css(
    '.protractor-test-save-changes')).isPresent()).toBeFalsy();
};

// HISTORY

// Wrapper for functions involving the history tab
var _runFromHistoryTab = function(callbackFunction) {
  element(by.css('.protractor-test-history-tab')).click();
  var result = callbackFunction();
  general.waitForSystem();
  element(by.css('.protractor-test-main-tab')).click();
  return result;
};

// Selects the versions to compare on the history page.
// This function should be run within the runFromHistoryTab wrapper, and
// assumes that the 2 compared versions are found on the first page of
// the exploration history.
var _selectComparedVersions = function(v1, v2) {
  var v1Position = null;
  var v2Position = null;
  element.all(by.css('.protractor-test-history-checkbox-selector')).count()
    .then(function(versionNumber) {
      if (v1 < 0) {
        throw Error(
          'In editor._selectComparedVersions(' + v1 + ', ' + v2 + '),' +
          'expected v1 to be >= 0');
      }
      if (v2 < 0) {
        throw Error(
          'In editor._selectComparedVersions(' + v1 + ', ' + v2 + '),' +
          'expected v2 to be >= 0');
      }
      // Check to ensure no negative indices are queried
      if (v1 > versionNumber) {
        throw Error(
          'In editor._selectComparedVersions(' + v1 + ', ' + v2 + '),' +
          'expected v1 to be less than or equal to total number of saved ' +
          'revisions');
      }
      if (v2 > versionNumber) {
        throw Error(
          'In editor._selectComparedVersions(' + v1 + ', ' + v2 + '),' +
        'expected v2 be less than or equal to total number of saved revisions');
      }

      v1Position = versionNumber - v1;
      v2Position = versionNumber - v2;

      element.all(by.css('.protractor-test-history-checkbox-selector'))
        .get(v1Position).click();
      element.all(by.css('.protractor-test-history-checkbox-selector'))
        .get(v2Position).click();
      browser.waitForAngular();
    });

  // Click button to show graph if necessary
  element(by.css('.protractor-test-show-history-graph')).isDisplayed()
    .then(function(isDisplayed) {
      if (isDisplayed) {
        element(by.css('.protractor-test-show-history-graph')).click();
      }
    });
};

var expectGraphComparisonOf = function(v1, v2) {
  // This function compares the states in the history graph with a list of
  // objects with the following key-value pairs:
  //   - 'label': label of the node (Note: if the node has a secondary label,
  //              the secondary label should appear after a space. It may be
  //              truncated.)
  //   - 'color': color of the node
  var _expectHistoryStatesToBe = function(expectedStates) {
    element(by.css('.protractor-test-history-graph'))
      .all(by.css('.protractor-test-node')).map(function(stateNode) {
        return {
          label: stateNode.element(
            by.css('.protractor-test-node-label')).getText(),
          color: stateNode.element(
            by.css('.protractor-test-node-background')).getCssValue('fill')
        };
      }).then(function(states) {
        // Note: we need to compare this way because the state graph is
        // sometimes generated with states in different configurations.
        expect(states.length).toEqual(expectedStates.length);
        for (var i = 0; i < states.length; i++) {
          expect(expectedStates).toContain(states[i]);
        }
      });
  };

  // Checks that the history graph contains totalLinks links altogether,
  // addedLinks green links and deletedLinks red links.
  var _expectNumberOfLinksToBe = function(
      totalLinks, addedLinks, deletedLinks) {
    var COLOR_ADDED = 'rgb(31, 125, 31)';
    var COLOR_DELETED = 'rgb(178, 34, 34)';
    var totalCount = 0;
    var addedCount = 0;
    var deletedCount = 0;
    element(by.css('.protractor-test-history-graph'))
      .all(by.css('.protractor-test-link')).map(function(link) {
        return link.getCssValue('stroke').then(function(linkColor) {
          if (linkColor === COLOR_ADDED) {
            return 'added';
          } else if (linkColor === COLOR_DELETED) {
            return 'deleted';
          } else {
            return 'other';
          }
        });
      }).then(function(linkTypes) {
        var totalCount = 0;
        var addedCount = 0;
        var deletedCount = 0;
        for (var i = 0; i < linkTypes.length; i++) {
          totalCount++;
          if (linkTypes[i] === 'added') {
            addedCount++;
          } else if (linkTypes[i] === 'deleted') {
            deletedCount++;
          }
        }

        if (totalCount !== totalLinks) {
          throw Error(
            'In editor.expectGraphComparisonOf(' + v1 + ', ' + v2 + '), ' +
            'expected to find ' + totalLinks + ' links in total, ' +
            'but found ' + totalCount);
        }
        if (addedCount !== addedLinks) {
          throw Error(
            'In editor.expectGraphComparisonOf(' + v1 + ', ' + v2 + '), ' +
            'expected to find ' + addedLinks + ' added links, ' + 'but found ' +
            addedCount);
        }
        if (deletedCount !== deletedLinks) {
          throw Error(
            'In editor.expectGraphComparisonOf(' + v1 + ', ' + v2 + '), ' +
            'expected to find ' + deletedLinks + ' deleted links, ' +
            'but found ' + deletedCount);
        }
      });
  };

  return {
    // Checks the nodes in the state graph and the number of links.
    // expectedStates should be a list of objects with the following key-value
    // pairs:
    //   - 'label': label of the node (Note: if the node has a secondary label,
    //              the secondary label should appear after a space. It may be
    //              truncated.)
    //   - 'color': color of the node
    // linksCount should be a list where the first element is the total number
    // of expected links, the second element is the number of added links, the
    // third element is the number of deleted links.
    toBe: function(expectedStates, linksCount) {
      _runFromHistoryTab(function() {
        _selectComparedVersions(v1, v2);
        _expectHistoryStatesToBe(expectedStates);
        _expectNumberOfLinksToBe(linksCount[0], linksCount[1], linksCount[2]);
      });
    }
  };
};

// This function compares the contents of stateName between v1 and v2.
var expectTextComparisonOf = function(v1, v2, stateName) {
  // This function clicks on a state in the history graph, executes
  // callbackFunction, and exits the state comparison modal.
  var _openStateHistoryModal = function(callbackFunction) {
    element.all(by.css('.protractor-test-node')).map(function(stateElement) {
      return stateElement.element(by.css('.protractor-test-node-label')).
        getText();
    }).then(function(listOfNames) {
      var matched = false;
      for (var i = 0; i < listOfNames.length; i++) {
        if (listOfNames[i] === stateName) {
          element.all(by.css('.protractor-test-node')).get(i).click();
          matched = true;
          var result = callbackFunction();
          element(by.css('.protractor-test-close-history-state-modal')).click();
          return result;
        }
      }
      if (!matched) {
        throw Error(
          'State ' + stateName + ' not found by editor.openStateHistoryModal');
      }
    });
  };

  return {
    // This function checks the text contents of stateName. v1StateContents
    // should contain an object representing the newer state and v2StateContents
    // should contain an object representing the older state.
    // The state representations should be an object whose keys are line numbers
    // and whose values should be an object with the following key-value pairs:
    //  - text: the exact string of text expected on that line
    //  - highlighted: true or false
    toBeWithHighlighting: function(v1StateContents, v2StateContents) {
      _runFromHistoryTab(function() {
        _selectComparedVersions(v1, v2);
        _openStateHistoryModal(function() {
          forms.CodeMirrorChecker(
            element.all(by.css('.CodeMirror-code')).first()
          ).expectTextWithHighlightingToBe(v1StateContents);
          forms.CodeMirrorChecker(
            element.all(by.css('.CodeMirror-code')).last()
          ).expectTextWithHighlightingToBe(v2StateContents);
        });
      });
    },
    // This function checks the text contents of stateName. v1StateContents
    // should contain a string representing the newer state and v2StateContents
    // should contain a string representation of the older state.
    toBe: function(v1StateContents, v2StateContents) {
      _runFromHistoryTab(function() {
        _selectComparedVersions(v1, v2);
        _openStateHistoryModal(function() {
          forms.CodeMirrorChecker(
            element.all(by.css('.CodeMirror-code')).first()
          ).expectTextToBe(v1StateContents);
          forms.CodeMirrorChecker(
            element.all(by.css('.CodeMirror-code')).last()
          ).expectTextToBe(v2StateContents);
        });
      });
    }
  };
};

// This function assumes that the selected version is valid and found on the
// first page of the exploration history.
var revertToVersion = function(version) {
  _runFromHistoryTab(function() {
    var versionPosition = null;
    var elem = element.all(by.css(
      '.protractor-test-history-checkbox-selector'
    )).count().then(function(versionNumber) {
      // Note: there is no 'revert' link next to the current version
      versionPosition = versionNumber - version - 1;
      element.all(by.css('.protractor-test-revert-version'))
        .get(versionPosition).click();
      element(by.css('.protractor-test-confirm-revert')).click();
    });
  });
};

// Wrapper for functions involving the feedback tab
var _runFromFeedbackTab = function(callbackFunction) {
  element(by.css('.protractor-test-feedback-tab')).click();
  var result = callbackFunction();
  general.waitForSystem();
  element(by.css('.protractor-test-main-tab')).click();
  return result;
};

var getSuggestionThreads = function() {
  return _runFromFeedbackTab(function() {
    var suggestionRowClassName = '.protractor-test-oppia-feedback-tab-row';
    var threads = [];

    return element.all(by.css(suggestionRowClassName)).then(function(rows) {
      rows.forEach(function() {
        element(by.css('.protractor-test-exploration-feedback-subject'))
          .getText().then(function(subject) {
            threads.push(subject);
          });
      });
      return threads;
    });
  });
};

var acceptSuggestion = function(suggestionDescription) {
  return _runFromFeedbackTab(function() {
    var suggestionRowClassName = '.protractor-test-oppia-feedback-tab-row';
    element.all(by.css(suggestionRowClassName)).then(function(rows) {
      var matchingSuggestionRows = rows.filter(function() {
        return element(by.css('.protractor-test-exploration-feedback-subject')).
          getText().then(function(subject) {
            return suggestionDescription.indexOf(subject) !== -1;
          });
      });

      matchingSuggestionRows[0].click();
      general.waitForSystem();
      element(by.css('.protractor-test-view-suggestion-btn')).click();
      element(by.css('.protractor-test-exploration-accept-suggestion-btn')).
        click();
    });
  });
};

var readFeedbackMessages = function() {
  return _runFromFeedbackTab(function() {
    var feedbackRowClassName = '.protractor-test-oppia-feedback-tab-row';
    var messages = [];
    return element.all(by.css(feedbackRowClassName)).then(function(rows) {
      rows.forEach(function(row) {
        row.click();
        element(by.css('.protractor-test-exploration-feedback'))
          .getText().then(function(message) {
            messages.push(message);
          });
        element(by.css('.protractor-test-oppia-feedback-back-button')).click();
      });
      return messages;
    });
  });
};

var sendResponseToLatestFeedback = function(feedbackResponse) {
  element(by.css('.protractor-test-feedback-tab')).click();
  element.all(by.css('.protractor-test-oppia-feedback-tab-row')).
    first().click();

  element(by.css('.protractor-test-feedback-response-textarea')).
    sendKeys(feedbackResponse);
  element(by.css('.protractor-test-oppia-feedback-response-send-btn')).
    click();
};

var addHint = function(hint) {
  element(by.css('.protractor-test-oppia-add-hint-button')).click();
  general.waitForSystem();
  element(by.css('.protractor-test-hint-text')).all(by.tagName('p'))
    .last().click();
  browser.switchTo().activeElement().sendKeys(hint);
  general.waitForSystem();
  element(by.css('.protractor-test-save-hint')).click();
  general.waitForSystem();
};

// Hints are zero-indexed.
var HintEditor = function(hintNum) {
  var headerElem = element.all(by.css('.protractor-test-hint-tab')).get(
    hintNum);

  var hintBodyElem = element(
    by.css('.protractor-test-hint-body-' + hintNum));
  hintBodyElem.isPresent().then(function(isVisible) {
    if (!isVisible) {
      headerElem.click();
    }
  });

  return {
    setHint: function(hint) {
      hintBodyElem.click();
      hintBodyElem.all(by.tagName('p')).click();
      browser.switchTo().activeElement().clear();
      browser.switchTo().activeElement().sendKeys(hint);
      general.waitForSystem();
      element(by.css('.protractor-test-save-hint-edit')).click();
    },
    deleteHint: function() {
      headerElem.element(by.css('.protractor-test-delete-response')).click();
      element(by.css('.protractor-test-confirm-delete-hint')).click();
    },
    expectCannotDeleteHint: function() {
      expect(headerElem.element(by.css(
        '.protractor-test-delete-response')).isPresent()).toBeFalsy();
    }
  };
};

var addSolution = function(interactionId, solution) {
  element(by.css('.protractor-test-oppia-add-solution-button')).click();
  browser.waitForAngular();
  general.waitForSystem();
  interactions.getInteraction(interactionId).submitAnswer(
    element(by.css('.protractor-test-interaction-html')),
    solution.correctAnswer);
  general.waitForSystem();
  browser.waitForAngular();
  element(by.css('.protractor-test-explanation-textarea'))
    .all(by.tagName('p')).first().click();
  browser.switchTo().activeElement().sendKeys(solution.explanation);
  browser.waitForAngular();
  general.waitForSystem();
  element(by.css('.protractor-test-submit-solution-button')).click();
  general.waitForSystem();
};

exports.exitTutorialIfNecessary = exitTutorialIfNecessary;
exports.startTutorial = startTutorial;
exports.progressInTutorial = progressInTutorial;
exports.finishTutorial = finishTutorial;

exports.navigateToMainTab = navigateToMainTab;
exports.navigateToPreviewTab = navigateToPreviewTab;
exports.navigateToSettingsTab = navigateToSettingsTab;
exports.navigateToStatsTab = navigateToStatsTab;

exports.expectNumPassersbyToBe = expectNumPassersbyToBe;

exports.setStateName = setStateName;
exports.expectCurrentStateToBe = expectCurrentStateToBe;
exports.expectCurrentTabToBeFeedbackTab = expectCurrentTabToBeFeedbackTab;

exports.setContent = setContent;
exports.expectContentToMatch = expectContentToMatch;

exports.setInteraction = setInteraction;
exports.openInteraction = openInteraction;
exports.closeAddResponseModal = closeAddResponseModal;
exports.customizeInteraction = customizeInteraction;
exports.expectInteractionToMatch = expectInteractionToMatch;
exports.expectCannotDeleteInteraction = expectCannotDeleteInteraction;

exports.selectRuleInAddResponseModal = selectRuleInAddResponseModal;
exports.setRuleParametersInAddResponseModal = (
  setRuleParametersInAddResponseModal);
exports.expectRuleParametersToBe = expectRuleParametersToBe;

exports.addParameterChange = addParameterChange;
exports.addMultipleChoiceParameterChange = addMultipleChoiceParameterChange;
exports.addExplorationLevelParameterChange = addExplorationLevelParameterChange;

exports.addResponse = addResponse;
exports.ResponseEditor = ResponseEditor;
exports.expectCannotAddResponse = expectCannotAddResponse;

exports.setDefaultOutcome = setDefaultOutcome;

exports.HintEditor = HintEditor;
exports.addHint = addHint;

exports.addSolution = addSolution;

exports.moveToState = moveToState;
exports.deleteState = deleteState;
exports.expectStateNamesToBe = expectStateNamesToBe;

exports.runFromSettingsTab = runFromSettingsTab;
exports.setTitle = setTitle;
exports.setCategory = setCategory;
exports.setObjective = setObjective;
exports.setLanguage = setLanguage;
exports.expectAvailableFirstStatesToBe = expectAvailableFirstStatesToBe;
exports.setFirstState = setFirstState;
exports.enableParameters = enableParameters;
exports.openAndClosePreviewSummaryTile = openAndClosePreviewSummaryTile;

exports.saveChanges = saveChanges;
exports.discardChanges = discardChanges;
exports.expectCannotSaveChanges = expectCannotSaveChanges;

exports.expectGraphComparisonOf = expectGraphComparisonOf;
exports.expectTextComparisonOf = expectTextComparisonOf;
exports.revertToVersion = revertToVersion;

exports.readFeedbackMessages = readFeedbackMessages;
exports.sendResponseToLatestFeedback = sendResponseToLatestFeedback;

exports.getSuggestionThreads = getSuggestionThreads;
exports.acceptSuggestion = acceptSuggestion;
