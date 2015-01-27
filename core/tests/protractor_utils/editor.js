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
var rules = require('../../../extensions/rules/protractor.js');

var exitTutorialIfNecessary = function() {
  // If the editor tutorial shows up, exit it.
  element.all(by.css('.introjs-skipbutton')).then(function(buttons) {
    if (buttons.length === 1) {
      buttons[0].click();
    } else if (buttons.length !== 0) {
      throw 'Expected to find at most one \'exit tutorial\' button';
    }
  });
};

var setStateName = function(name) {
  var nameElement = element(by.css('.protractor-test-state-name-container'))
  nameElement.click();
  nameElement.element(by.css('.protractor-test-state-name-input')).clear();
  nameElement.element(by.css('.protractor-test-state-name-input')).
    sendKeys(name);
  nameElement.element(by.css('.protractor-test-state-name-submit')).click();
};

var expectCurrentStateToBe = function(name) {
  expect(
    element(by.css('.protractor-test-state-name-container')).getText()
  ).toMatch(name);
};

// CONTENT

// 'richTextInstructions' is a function that is sent a RichTextEditor which it
// can then use to alter the state content, for example by calling
// .appendBoldText(...).
var setContent = function(richTextInstructions) {
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
var setInteraction = function(interactionName) {
  element(by.css('.protractor-test-select-interaction-id')).
    element(by.css('option[value=' + interactionName + ']')).click();

  if (arguments.length > 1) {
    element(by.css('.protractor-test-edit-interaction')).click();

    var elem = element(by.css('.protractor-test-interaction-editor'));
    var args = [elem];
    for (var i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    interactions.getInteraction(interactionName).customizeInteraction.apply(
      null, args);

    element(by.css('.protractor-test-save-interaction')).click();
  }
};

// Likewise this can receive additional arguments
var expectInteractionToMatch = function(interactionName) {
  // Convert additional arguments to an array to send on.
  var args = [];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  interactions.getInteraction(interactionName).
    expectInteractionDetailsToMatch.apply(null, args);
};

// RULES

// This function selects a rule for the current interaction and enters the
// entries of the parameterValues array as its parameters; the parameterValues
// should be specified after the ruleName as additional arguments. For example
// with interaction 'NumericInput' and rule 'Equals' then there is a single
// parameter which the given answer is required to equal.
var _selectRule = function(ruleElement, interactionName, ruleName) {
  var parameterValues = [];
  for (var i = 3; i < arguments.length; i++) {
    parameterValues.push(arguments[i]);
  }

  var ruleDescription = rules.getDescription(
    interactions.getInteraction(interactionName).answerObjectType, ruleName);

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

  ruleElement.element(by.css('.protractor-test-rule-description')).click();

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
      by.css('.protractor-test-rule-description-fragment'
    )).get(i * 2 + 1);
    var parameterEditor = forms.getEditor(parameterTypes[i])(parameterElement);

    if (interactionName === 'MultipleChoiceInput') {
      // This is a special case as it uses a dropdown to set a NonnegativeInt
      parameterElement.element(
        by.cssContainingText('option', parameterValues[i])
      ).click();
    } else {
      parameterEditor.setValue(parameterValues[i]);
    }
  }
};

// This clicks the "add new rule" button and then selects the rule type and
// enters its parameters, and closes the rule editor. Any number of rule
// parameters may be specified after the ruleName.
var addRule = function(interactionName, ruleName) {
  element(by.css('.protractor-test-add-rule')).click();
  var ruleElement = element(by.css('.protractor-test-temporary-rule'))
  var args = [ruleElement];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  _selectRule.apply(null, args);
  ruleElement.element(by.css('.protractor-test-save-rule')).click();
};

// Rules are zero-indexed; 'default' denotes the default rule.
var RuleEditor = function(ruleNum) {
  var elem = (ruleNum === 'default') ?
    element(by.css('.protractor-test-default-rule')):
    element.all(by.css('.protractor-test-rule-block')).get(ruleNum);

  // This button will not be shown if the rule editor is already open.
  elem.all(by.css('.protractor-test-edit-rule')).then(function(buttons) {
    if (buttons.length === 1) {
      buttons[0].click();
    } else if (buttons.length !== 0) {
      throw 'In editor.editRule(), expected to find at most 1 edit-rule ' +
        'button per rule; found ' + buttons.length + ' instead.';
    }
  });

  return {
    // Any number of parameters may be specified after the ruleName
    setDescription: function(interactionName, ruleName) {
      var args = [elem];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      _selectRule.apply(null, args);
    },
    setFeedback: function(index, richTextInstructions) {
      var feedbackEditor = forms.ListEditor(
        elem.element(by.css('.protractor-test-feedback-bubble'))
      ).editItem(index, 'RichText');
      feedbackEditor.clear();
      richTextInstructions(feedbackEditor);
    },
    addFeedback: function() {
      forms.ListEditor(
        elem.element(by.css('.protractor-test-feedback-bubble'))
      ).addItem();
    },
    deleteFeedback: function(index) {
      forms.ListEditor(
        elem.element(by.css('.protractor-test-feedback-bubble'))
      ).deleteItem(index);
    },
    // Enter 'END' for the end state.
    // This saves the rule after the destination is selected.
    setDestination: function(destinationName) {
      var destinationElement =
        elem.element(by.css('.protractor-test-dest-bubble'));
      forms.AutocompleteDropdownEditor(destinationElement).
        setValue(destinationName);
      elem.element(by.css('.protractor-test-save-rule')).click();
    },
    expectAvailableDestinationsToBe: function(stateNames) {
      forms.AutocompleteDropdownEditor(
        elem.element(by.css('.protractor-test-dest-bubble'))
      ).expectOptionsToBe(stateNames);
    },
    delete: function() {
      element(by.css('.protractor-test-delete-rule')).click();
      browser.driver.switchTo().alert().accept();
    }
  }
};

// STATE GRAPH

var createState = function(newStateName) {
  element(by.css('.protractor-test-add-state-input')).sendKeys(newStateName);
  element(by.css('.protractor-test-add-state-submit')).click();
};

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
      }
    }
    if (! matched) {
      throw Error('State ' + targetName + ' not found by editor.moveToState');
    }
  });
};

var deleteState = function(stateName) {
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
    expect(stateNames).toEqual(names);
  });
};

// SETTINGS

// All functions involving the settings tab should be sent through this
// wrapper.
var runFromSettingsTab = function(callbackFunction) {
  element(by.css('.protractor-test-settings-tab')).click();
  var result = callbackFunction();
  element(by.css('.protractor-test-main-tab')).click();
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
      expect(options).toEqual(names);
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
};

var enterPreviewMode = function() {
  element(by.css('.protractor-test-enter-preview-mode')).click();
};

var exitPreviewMode = function() {
  exitButton = element(by.css('.protractor-test-exit-preview-mode'));
  // The process of scrolling to the exit button causes the cursor to rest over
  // the username in the top right, which opens a dropdown menu that then
  // blocks the "Edit" button. To prevent this we move the cursor away.
  general.scrollElementIntoView(exitButton);
  browser.actions().
    mouseMove(element(by.css('.protractor-test-navbar-header'))).perform();
  exitButton.click();
};

// HISTORY

// Wrapper for functions involving the history tab
var runFromHistoryTab = function(callbackFunction) {
  element(by.css('.protractor-test-history-tab')).click();
  var result = callbackFunction();
  element(by.css('.protractor-test-main-tab')).click();
  return result;
};

// Selects the versions to compare on the history page.
// This function should be run within the runFromHistoryTab wrapper, and
// assumes that the 2 compared versions are found on the first page of
// the exploration history.
var historySelectComparedVersions = function(v1, v2) {
  var v1Position = null;
  var v2Position = null;
  element.all(by.css('.protractor-test-history-v1-selector')).first()
      .then(function(elem) {
    elem.getAttribute('value').then(function(versionNumber) {
      v1Position = versionNumber - v1;
      v2Position = versionNumber - v2;
      element.all(by.css('.protractor-test-history-v1-selector'))
        .get(v1Position).click();
      element.all(by.css('.protractor-test-history-v2-selector'))
        .get(v2Position).click();
      protractor.getInstance().waitForAngular();
    });
  });

  // Click button to show graph if necessary
  element(by.css('.protractor-test-show-history-graph')).isDisplayed()
      .then(function(isDisplayed) {
    if (isDisplayed) {
      element(by.css('.protractor-test-show-history-graph')).click();
    }
  });
};

// This function clicks on a state in the history graph, executes
// callbackFunction, and exits the state comparison modal. It should be run
// within the history page.
var openStateHistoryModal = function(stateName, callbackFunction) {
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

// This function compares the states in the history graph with a list of objects
// with the following key-value pairs:
//   - 'label': label of the node (Note: if the node has a secondary label,
//              the secondary label should appear after a space. It may be
//              truncated.)
//   - 'color': color of the node
var expectHistoryStatesToBe = function(expectedStates) {
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
var expectNumberOfLinksToBe = function(totalLinks, addedLinks, deletedLinks) {
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
    expect(totalCount).toBe(totalLinks);
    expect(addedCount).toBe(addedLinks);
    expect(deletedCount).toBe(deletedLinks);
  });
};

// This function should be run within the runFromHistoryTab wrapper, and
// assumes that the selected version is valid and found on the first page of
// the exploration history.
var revertToVersion = function(version) {
  runFromHistoryTab(function() {
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

exports.setStateName = setStateName;
exports.expectCurrentStateToBe = expectCurrentStateToBe;

exports.setContent = setContent;
exports.expectContentToMatch = expectContentToMatch;

exports.setInteraction = setInteraction;
exports.expectInteractionToMatch = expectInteractionToMatch;

exports.addRule = addRule;
exports.RuleEditor = RuleEditor;

exports.createState = createState;
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
exports.enterPreviewMode = enterPreviewMode;
exports.exitPreviewMode = exitPreviewMode;

exports.runFromHistoryTab = runFromHistoryTab;
exports.historySelectComparedVersions = historySelectComparedVersions;
exports.openStateHistoryModal = openStateHistoryModal;
exports.expectHistoryStatesToBe = expectHistoryStatesToBe;
exports.expectNumberOfLinksToBe = expectNumberOfLinksToBe;
exports.revertToVersion = revertToVersion;
