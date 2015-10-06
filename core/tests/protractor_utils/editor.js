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
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var forms = require('./forms.js');
var general = require('./general.js');
var interactions = require('../../../extensions/interactions/protractor.js');
var gadgets = require('../../../extensions/gadgets/protractor.js');
var rules = require('../../../extensions/rules/protractor.js');

// constants
var _OPTION_CREATE_NEW = 'A New Card Called...';

var exitTutorialIfNecessary = function() {
  // If the editor tutorial shows up, exit it.
  element.all(by.css('.skipBtn')).then(function(buttons) {
    if (buttons.length === 1) {
      buttons[0].click();
    } else if (buttons.length !== 0) {
      throw 'Expected to find at most one \'exit tutorial\' button';
    }
  });
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
  // Finish the tutorial
  element(by.buttonText('Finish')).then(function(button) {
    if (button) {
      button.click();
    } else {
      throw 'Expected to find exactly one \'Finish\' button';
    }
  });
};

// NAVIGATION

var navigateToMainTab = function() {
  element(by.css('.protractor-test-main-tab')).click();
  // Click a neutral element in order to dismiss any warnings.
  element(by.css('.protractor-test-editor-neutral-element')).click();
};

var navigateToPreviewTab = function() {
  element(by.css('.protractor-test-preview-tab')).click();
  general.waitForSystem();
};

var navigateToSettingsTab = function() {
  element(by.css('.protractor-test-settings-tab')).click();
};

// UTILITIES

var setStateName = function(name) {
  var nameElement = element(by.css('.protractor-test-state-name-container'))
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

// Additional arguments may be sent to this function, and they will be
// passed on to the relevant interaction editor.
var setInteraction = function(interactionId) {
  element(by.css('.protractor-test-delete-interaction')).isPresent().then(function(isVisible) {
    // If there is already an interaction present, delete it.
    if (isVisible) {
      element(by.css('.protractor-test-delete-interaction')).click();
      // Click through the "are you sure?" warning.
      element(by.css('.protractor-test-confirm-delete-interaction')).click();
    }
  });

  general.waitForSystem();

  element(by.css('.protractor-test-open-add-interaction-modal')).click();

  general.waitForSystem();

  var interactionElem = element(by.css(
    '.protractor-test-interaction-tile-' + interactionId));

  // Try to find the interaction in one of the tabs.
  element.all(by.css('.protractor-test-interaction-tab')).map(function(tabElem) {
    tabElem.click();
    return interactionElem.isDisplayed().then(function(isInteractionVisible) {
      if (isInteractionVisible) {
        return tabElem;
      }
    })
  }).then(function(tabElems) {
    var interactionTileFound = false;
    for (var i = 0; i < tabElems.length; i++) {
      if (tabElems[i]) {
        interactionTileFound = true;
        tabElems[i].click();
        interactionElem.click();
        break;
      }
    }

    if (!interactionTileFound) {
      throw 'Could not find interaction with id ' + interactionId;
    }
  });

  var elem = element(by.css('.protractor-test-interaction-editor'));
  var customizationArgs = [elem];

  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      customizationArgs.push(arguments[i]);
    }
    interactions.getInteraction(interactionId).customizeInteraction.apply(
      null, customizationArgs);
  }

  element(by.css('.protractor-test-save-interaction')).click();
  // Wait for the customization modal to close.
  general.waitForSystem();

  // If the "Add Response" modal opens, close it.
  var headerElem = element(by.css('.protractor-test-add-response-modal-header'));
  headerElem.isPresent().then(function(isVisible) {
    if (isVisible) {
      element(by.css('.protractor-test-close-add-response-modal')).click();
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

// GADGETS

// Additional arguments may be sent to this function, and they will be
// passed on to the relevant gadget editor.
var addGadget = function(gadgetType, gadgetName) {

  // Bring up the gadget insertion modal.
  element(
    by.css('.protractor-test-add-gadget-button'))
    .click();

  general.waitForSystem(2000);

  // Select the desired gadgetType from the modal.
  element(
    by.css('.protractor-test-' + gadgetType + '-gadget-selection-modal'))
    .click();

  var gadgetNameInput = element(by.css('.protractor-test-gadget-name-input'));
  gadgetNameInput.clear().then(function() {
    gadgetNameInput.sendKeys(gadgetName);
  });

  // Locate the customization section and apply any customizations.
  var elem = element(by.css('.protractor-test-gadget-customization-editor'));
  var customizationArgs = [elem];

  if (arguments.length > 2) {
    for (var i = 2; i < arguments.length; i++) {
      customizationArgs.push(arguments[i]);
    }
    gadgets.getGadget(gadgetType).customizeGadget.apply(
      null, customizationArgs);
  }

  element(by.css('.protractor-test-save-gadget-button')).click();

  // Wait for the customization modal to close.
  general.waitForSystem(2000);

};

// Callers should ensure that a gadget with currentName exists.
var renameGadget = function(currentName, newName) {
  openGadgetEditorModal(currentName);
  element(by.css('.protractor-test-open-gadget-name-editor'))
    .click();
  var gadgetNameInput = element(
    by.css('.protractor-test-gadget-rename-text-input'));
  gadgetNameInput.clear().then(function() {
    gadgetNameInput.sendKeys(newName);
  });
  element(
    by.css('.protractor-test-gadget-rename-confirmation-button')).click();
  saveAndCloseGadgetEditorModal();
};

// Callers should ensure that a gadget with gadgetName exists.
var deleteGadget = function(gadgetName) {
  element(by.css('.protractor-test-delete-' + gadgetName + '-gadget-icon'))
    .click();
  general.waitForSystem(2000); // wait for modal popup.
  element(by.css('.protractor-test-delete-gadget-button')).click();
};

var openGadgetEditorModal = function(gadgetName) {
  element(by.css('.protractor-test-edit-' + gadgetName + '-gadget')).click();
};

var saveAndCloseGadgetEditorModal = function() {
  element(by.css('.protractor-test-save-gadget-button')).click();
};

// Enables visibility for a given state.
// openGadgetEditorModal must be called before this method.
// Note: cssContainingText must be used as state names can contain spaces.
var enableGadgetVisibilityForState = function(stateName) {
  element(by.cssContainingText(
    '.protractor-test-state-visibility-checkbox-label',
    stateName)).all(by.css('.protractor-test-gadget-visibility-checkbox'))
    .then(function(items) {
      items[0].isSelected().then(function(selected) {
        if (!selected) {
          items[0].click();
        }
      })
    })
};

// Disables visibility for a given state.
// openGadgetEditorModal must be called before this method.
var disableGadgetVisibilityForState = function(stateName) {
  element(by.cssContainingText(
    '.protractor-test-state-visibility-checkbox-label',
    stateName)).all(by.css('.protractor-test-gadget-visibility-checkbox'))
    .then(function(items) {
      items[0].isSelected().then(function(selected) {
        if (selected) {
          items[0].click();
        }
      })
    })
};

// Verifies a gadget's short description and name show up as expected
// in the gadgets sidebar.
var expectGadgetListNameToMatch = function(
    gadgetType, gadgetShortDescription, gadgetName) {
  var expectedListName;
  if (gadgetShortDescription == gadgetName) {
    expectedListName = gadgetName;
  } else {
    expectedListName = gadgetShortDescription + ' (' + gadgetName + ')';
  }
  expect(element(by.css('.protractor-test-' + gadgetType + '-list-item'))
    .getText()).toBe(expectedListName);
};

var expectGadgetWithNameDoesNotExist = function(gadgetType, gadgetName) {
  expect(element.all(by.css('.protractor-test-' + gadgetType + '-list-item'))
    .count()).toBe(0);
};

// PARAMETERS

// This function adds a parameter change, creating the parameter if necessary.
var addParameterChange = function(paramName, paramValue) {
  element(by.css('.protractor-test-add-param-button')).click();

  forms.AutocompleteDropdownEditor(
    element(by.css('.protractor-test-param-changes-editor'))
  ).setValue(paramName);

  /* Setting parameter value is difficult via css since the associated
  input is a sub-component of the third party select2 library. We isolate
  it as the third input in the current parameter changes UI. */
  element(by.css('.protractor-test-param-changes-editor')).all(
    by.tagName('input')).then(function(items) {
      items[2].sendKeys(paramValue);
    });

  element(by.css('.protractor-test-save-param-change-button')).click();

  general.waitForSystem(500);
}


// RULES

// This function selects a rule for the current interaction and enters the
// entries of the parameterValues array as its parameters; the parameterValues
// should be specified after the ruleName as additional arguments. For example
// with interaction 'NumericInput' and rule 'Equals' then there is a single
// parameter which the given answer is required to equal.
var _selectRule = function(ruleElement, interactionId, ruleName) {
  var parameterValues = [];
  for (var i = 3; i < arguments.length; i++) {
    parameterValues.push(arguments[i]);
  }

  var ruleDescription = rules.getDescription(
    interactions.getInteraction(interactionId).answerObjectType, ruleName);

  var parameterStart = (ruleDescription.indexOf('{{') === -1) ?
    undefined : ruleDescription.indexOf('{{');
  // From the ruleDescription string we can deduce both the description used
  // in the page (which will have the form "is equal to ...") and the types
  // of the parameter objects, which will later tell us which object editors
  // to use to enter the parameterValues.
  var ruleDescriptionInDropdown = ruleDescription.substring(0, parameterStart);
  var parameterTypes = [];
  while (parameterStart !== undefined) {
    var parameterEnd = ruleDescription.indexOf('}}', parameterStart) + 2;
    var nextParameterStart =
      (ruleDescription.indexOf('{{', parameterEnd) === -1) ?
      undefined : ruleDescription.indexOf('{{', parameterEnd);
    ruleDescriptionInDropdown = ruleDescriptionInDropdown + '...' +
      ruleDescription.substring(parameterEnd, nextParameterStart);
    parameterTypes.push(
      ruleDescription.substring(
        ruleDescription.indexOf('|', parameterStart) + 1, parameterEnd - 2));
    parameterStart = nextParameterStart;
  }

  expect(parameterValues.length).toEqual(parameterTypes.length);

  ruleElement.element(by.css('.protractor-test-answer-description')).click();

  element.all(by.id('select2-drop')).map(function(selectorElement) {
    selectorElement.element(by.cssContainingText(
      'li.select2-results-dept-0', ruleDescriptionInDropdown
    )).then(function(optionElement) {
      optionElement.click();
      protractor.getInstance().waitForAngular();
    });
  });

  // Now we enter the parameters
  for (var i = 0; i < parameterValues.length; i++) {
    var parameterElement = ruleElement.all(
      by.css('.protractor-test-answer-description-fragment'
    )).get(i * 2 + 1);
    var parameterEditor = forms.getEditor(parameterTypes[i])(parameterElement);

    if (interactionId === 'MultipleChoiceInput') {
      // This is a special case as it uses a dropdown to set a NonnegativeInt
      parameterElement.element(
        by.cssContainingText('option', parameterValues[i])
      ).click();
    } else {
      parameterEditor.setValue(parameterValues[i]);
    }
  }
};

var _setOutcomeFeedback = function(feedbackEditorElem, richTextInstructions) {
  var feedbackEditor = forms.RichTextEditor(
    feedbackEditorElem.element(by.css('.protractor-test-feedback-bubble')));
  feedbackEditor.clear();
  richTextInstructions(feedbackEditor);
};

var _setOutcomeDest = function(destEditorElem, destName, createDest) {
  var destinationElement =
    destEditorElem.element(by.css('.protractor-test-dest-bubble'));

  var targetOption = createDest ? _OPTION_CREATE_NEW : destName;
  _getStateName().then(function(name) {
    if (name == destName) {
      // Looping, change the target option.
      targetOption = '(try again)';
    }

    destinationElement.element(
      by.cssContainingText('option', targetOption)).click();

    if (createDest) {
      element(by.css('.protractor-test-add-state-input')).sendKeys(destName);
    }
  });
};

// This clicks the "add new response" button and then selects the rule type and
// enters its parameters, and closes the rule editor. Any number of rule
// parameters may be specified after the ruleName.
//
// Note that feedbackInstructions may be null (which means 'specify no
// feedback'), and only represents a single feedback element.
//
// - 'destStateName' is the state name to select as the destination.
// - 'createState' specifies the destination state should be created within the
//   dialog as part of adding this rule.
var addResponse = function(interactionId, feedbackInstructions, destStateName,
    createState, ruleName) {

  // Open the "Add Response" modal if it is not already open.
  var headerElem = element(by.css('.protractor-test-add-response-modal-header'));
  headerElem.isPresent().then(function(isVisible) {
    if (!isVisible) {
      element(by.css('.protractor-test-open-add-response-modal')).click();
      general.waitForSystem();
    }
  });

  // Set the rule description.
  var ruleElement = element(by.css('.protractor-test-add-response-details'));
  var args = [ruleElement, interactionId];
  for (var i = 4; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  _selectRule.apply(null, args);

  if (feedbackInstructions) {
    // Set feedback contents.
    _setOutcomeFeedback(ruleElement, feedbackInstructions);
  }

  // If the destination is being changed, open the corresponding editor.
  if (destStateName) {
    // Set destination contents.
    _setOutcomeDest(ruleElement, destStateName, createState);
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
    editor.setDestination(destStateName, createState);
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
    // Note that the supplied 'destinationName' must be an existing state. If
    // 'createState' is true, it will attempt to create a state named after the
    // input 'destinationName'.
    setDestination: function(destinationName, createState) {
      // Begin editing destination.
      element(by.css('.protractor-test-open-outcome-dest-editor')).click();

      // Set destination contents.
      var destElement = element(by.css(
        '.protractor-test-edit-outcome-dest'));
      _setOutcomeDest(destElement, destinationName, createState);

      // Save destination.
      element(by.css('.protractor-test-save-outcome-dest')).click();
    },
    // The current state name must be at the front of the list.
    expectAvailableDestinationsToBe: function(stateNames) {
      // Begin editing destination.
      element(by.css('.protractor-test-open-outcome-dest-editor')).click();

      var expectedOptionTexts = ['(try again)'].concat(stateNames.slice(1));

      // Create new option always at the end of the list.
      expectedOptionTexts.push(_OPTION_CREATE_NEW);

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
      var args = [ruleElement, interactionId];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      _selectRule.apply(null, args);

      // Save the new rule.
      element(by.css('.protractor-test-save-answer')).click();
    },
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
        '.protractor-test-delete-answer')).get(ruleNum);
      expect(ruleElem.isPresent()).toBeFalsy();
    },
    expectCannotDeleteResponse: function() {
      expect(headerElem.element(by.css(
        '.protractor-test-delete-response')).isPresent()).toBeFalsy();
    }
  }
};

var expectCannotAddResponse = function() {
  expect(element(by.css(
    '.protractor-test-open-add-response-modal')).isPresent()).toBeFalsy();
};

// STATE GRAPH

// NOTE: if the state is not visible in the state graph this function will fail
var moveToState = function(targetName) {
  general.scrollElementIntoView(
    element(by.css('.protractor-test-exploration-graph')));
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
    if (! matched) {
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
        protractor.getInstance().waitForAngular();
        general.waitForSystem();
        element(by.css('.protractor-test-confirm-delete-state')).click();
        matched = true;
      }
    }
    if (! matched) {
      throw Error('State ' + stateName + ' not found by editor.deleteState');
    }
  });
};

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
    element(by.css('protractor-test-exploration-title-input')).clear();
    element(by.css('protractor-test-exploration-title-input')).sendKeys(title);
  });
};

var setCategory = function(category) {
  runFromSettingsTab(function() {
    element(by.css('.protractor-test-exploration-category-input')).clear();
    element(by.css('.protractor-test-exploration-category-input')).
      sendKeys(category);
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
    element(by.css('.protractor-test-initial-state-select')).
        all(by.tagName('option')).map(function(elem) {
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

// CONTROLS

var saveChanges = function(commitMessage) {
  general.scrollElementIntoView(
    element(by.css('.protractor-test-save-changes')));
  element(by.css('.protractor-test-save-changes')).click().then(function() {
    if (commitMessage) {
      element(by.css('.protractor-test-commit-message-input')).
        sendKeys(commitMessage);
    }
    protractor.getInstance().waitForAngular();
    general.waitForSystem();
    element(by.css('.protractor-test-close-save-modal')).click();
    // This is necessary to give the page time to record the changes,
    // so that it does not attempt to stop the user leaving.
    protractor.getInstance().waitForAngular();
    general.waitForSystem();
  });
};

var discardChanges = function() {
  element(by.css('.protractor-test-save-discard-toggle')).click();
  element(by.css('.protractor-test-discard-changes')).click();
  browser.driver.switchTo().alert().accept();
  general.waitForSystem();
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
  element.all(by.css('.protractor-test-history-v1-selector')).first()
      .getAttribute('value').then(function(versionNumber) {
    v1Position = versionNumber - v1;
    v2Position = versionNumber - v2;
    element.all(by.css('.protractor-test-history-v1-selector'))
      .get(v1Position).click();
    element.all(by.css('.protractor-test-history-v2-selector'))
      .get(v2Position).click();
    protractor.getInstance().waitForAngular();
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
  // This function compares the states in the history graph with a list of objects
  // with the following key-value pairs:
  //   - 'label': label of the node (Note: if the node has a secondary label,
  //              the secondary label should appear after a space. It may be
  //              truncated.)
  //   - 'color': color of the node
  var _expectHistoryStatesToBe = function(expectedStates) {
    element(by.css('.protractor-test-history-graph'))
        .all(by.css('.protractor-test-node')).map(function(stateNode) {
      return {
        'label': stateNode.element(
          by.css('.protractor-test-node-label')).getText(),
        'color': stateNode.element(
          by.css('.protractor-test-node-background')).getCssValue('fill')
      };
    }).then(function(states) {
      // Note: we need to compare this way because the state graph is sometimes
      // generated with states in different configurations.
      expect(states.length).toEqual(expectedStates.length);
      for (var i = 0; i < states.length; i++) {
        expect(expectedStates).toContain(states[i]);
      }
    });
  };

  // Checks that the history graph contains totalLinks links altogether,
  // addedLinks green links and deletedLinks red links.
  var _expectNumberOfLinksToBe = function(totalLinks, addedLinks, deletedLinks) {
    var COLOR_ADDED = 'rgb(31, 125, 31)';
    var COLOR_DELETED = 'rgb(178, 34, 34)';
    var totalCount = 0;
    var addedCount = 0;
    var deletedCount = 0;
    element(by.css('.protractor-test-history-graph'))
        .all(by.css('.protractor-test-link')).map(function(link) {
      link.getCssValue('stroke').then(function(linkColor) {
        totalCount++;
        if (linkColor == COLOR_ADDED) {
          addedCount++;
        } else if (linkColor == COLOR_DELETED) {
          deletedCount++;
        }
      });
    }).then(function() {
      if (totalCount != totalLinks) {
        throw Error('In editor.expectGraphComparisonOf(' + v1 + ', ' + v2 + '), ' +
          'expected to find ' + totalLinks + ' links in total, ' +
          'but found ' + totalCount);
      }
      if (addedCount != addedLinks) {
        throw Error('In editor.expectGraphComparisonOf(' + v1 + ', ' + v2 + '), ' +
          'expected to find ' + addedLinks + ' added links, ' + 'but found ' +
          addedCount);
      }
      if (deletedCount != deletedLinks) {
        throw Error('In editor.expectGraphComparisonOf(' + v1 + ', ' + v2 + '), ' +
          'expected to find ' + deletedLinks + ' deleted links, ' + 'but found ' +
          deletedCount);
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
      if (! matched) {
        throw Error('State ' + stateName + ' not found by editor.openStateHistoryModal');
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
          forms.CodeMirrorChecker(element.all(by.css('.CodeMirror-code')).first())
            .expectTextWithHighlightingToBe(v1StateContents);
          forms.CodeMirrorChecker(element.all(by.css('.CodeMirror-code')).last())
            .expectTextWithHighlightingToBe(v2StateContents);
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
          forms.CodeMirrorChecker(element.all(by.css('.CodeMirror-code')).first())
            .expectTextToBe(v1StateContents);
          forms.CodeMirrorChecker(element.all(by.css('.CodeMirror-code')).last())
            .expectTextToBe(v2StateContents);
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
    element.all(by.css('.protractor-test-history-v1-selector')).first()
        .then(function(elem) {
      elem.getAttribute('value').then(function(versionNumber) {
        // Note: there is no 'revert' link next to the current version
        versionPosition = versionNumber - version - 1;
        element.all(by.css('.protractor-test-revert-version'))
          .get(versionPosition).click();
        element(by.css('.protractor-test-confirm-revert')).click();
      });
    });
  });
};

exports.exitTutorialIfNecessary = exitTutorialIfNecessary;
exports.progressInTutorial = progressInTutorial;
exports.finishTutorial  = finishTutorial;

exports.navigateToMainTab = navigateToMainTab;
exports.navigateToPreviewTab = navigateToPreviewTab;
exports.navigateToSettingsTab = navigateToSettingsTab;

exports.setStateName = setStateName;
exports.expectCurrentStateToBe = expectCurrentStateToBe;

exports.setContent = setContent;
exports.expectContentToMatch = expectContentToMatch;

exports.setInteraction = setInteraction;
exports.expectInteractionToMatch = expectInteractionToMatch;
exports.expectCannotDeleteInteraction = expectCannotDeleteInteraction;

exports.addGadget = addGadget;
exports.renameGadget = renameGadget;
exports.deleteGadget = deleteGadget;

exports.expectGadgetListNameToMatch = expectGadgetListNameToMatch;
exports.expectGadgetWithNameDoesNotExist = expectGadgetWithNameDoesNotExist;

exports.openGadgetEditorModal = openGadgetEditorModal;
exports.saveAndCloseGadgetEditorModal = saveAndCloseGadgetEditorModal;

exports.enableGadgetVisibilityForState = enableGadgetVisibilityForState;
exports.disableGadgetVisibilityForState = disableGadgetVisibilityForState;

exports.addParameterChange = addParameterChange;

exports.addResponse = addResponse;
exports.setDefaultOutcome = setDefaultOutcome;
exports.ResponseEditor = ResponseEditor;
exports.expectCannotAddResponse = expectCannotAddResponse;

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

exports.saveChanges = saveChanges;
exports.discardChanges = discardChanges;
exports.expectCannotSaveChanges = expectCannotSaveChanges;

exports.expectGraphComparisonOf = expectGraphComparisonOf;
exports.expectTextComparisonOf = expectTextComparisonOf;
exports.revertToVersion = revertToVersion;
