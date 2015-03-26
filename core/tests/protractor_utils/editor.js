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
var setInteraction = function(interactionName) {
  element(by.css('.protractor-test-delete-interaction')).isPresent().then(function(isVisible) {
    // If there is already an interaction present, delete it.
    if (isVisible) {
      element(by.css('.protractor-test-delete-interaction')).click();
      // Click through the "are you sure?" warning.
      browser.driver.switchTo().alert().accept();
    }
  });

  element(by.css('.protractor-test-open-add-interaction-modal')).click();

  var elem = element(by.css('.protractor-test-interaction-editor'));
  var customizationArgs = [elem];
  for (var i = 1; i < arguments.length; i++) {
    customizationArgs.push(arguments[i]);
  }

  general.waitForSystem();
  element(by.css('.protractor-test-select-interaction-id')).click();
  element(by.css('.protractor-test-top-level-interaction-id-' + interactionName)).click();

  if (customizationArgs.length > 1) {
    interactions.getInteraction(interactionName).customizeInteraction.apply(
      null, customizationArgs);
  }

  element(by.css('.protractor-test-save-interaction')).click();
  // Wait for the customization modal to close.
  general.waitForSystem();
};

// Likewise this can receive additional arguments.
// Note that this refers to the interaction displayed in the editor tab (as
// opposed to the preview tab, which uses the corresponding function in
// player.js).
var expectInteractionToMatch = function(interactionName) {
  // Convert additional arguments to an array to send on.
  var args = [element(by.css('.protractor-test-interaction'))];
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

var _setRuleFeedback = function(ruleBodyElem, index, richTextInstructions) {
  var feedbackEditor = forms.ListEditor(
    ruleBodyElem.element(by.css('.protractor-test-feedback-bubble'))
  ).editItem(index, 'RichText');
  feedbackEditor.clear();
  richTextInstructions(feedbackEditor);
};

var _setRuleDest = function(ruleBodyElem, destinationName) {
  var destinationElement =
    ruleBodyElem.element(by.css('.protractor-test-dest-bubble'));
  destinationElement.element(
    by.cssContainingText('option', destinationName)).click();
};

// This clicks the "add new rule" button and then selects the rule type and
// enters its parameters, and closes the rule editor. Any number of rule
// parameters may be specified after the ruleName.
// Note that feedbackInstructions may be null (which means 'specify no feedback'),
// and only represents a single feedback element.
var addRule = function(interactionName, feedbackInstructions, dest, ruleName) {
  element(by.css('.protractor-test-open-add-rule-modal')).click();
  general.waitForSystem();

  var ruleElement = element(by.css('.protractor-test-add-rule-details'));
  var args = [ruleElement, interactionName];
  for (var i = 3; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  _selectRule.apply(null, args);

  if (feedbackInstructions) {
    _setRuleFeedback(ruleElement, 0, feedbackInstructions)
  }
  if (dest) {
    _setRuleDest(ruleElement, dest);
  }

  element(by.css('.protractor-test-add-new-rule')).click();
  general.waitForSystem();
};


// Rules are zero-indexed; 'default' denotes the default rule.
var RuleEditor = function(ruleNum) {
  var _OPTION_CREATE_NEW = 'Create New State...';

  if (ruleNum === 'default') {
    element(by.css('.protractor-test-default-rule-tab')).isPresent().then(function(isVisible) {
      // If there is only one rule, no tabs are shown, so we don't have to click
      // anything.
      if (isVisible) {
        element(by.css('.protractor-test-default-rule-tab')).click();
      }
    });
  } else {
    element.all(by.css('.protractor-test-rule-tab')).get(ruleNum).click();
  }

  var bodyElem = (ruleNum === 'default') ?
    element.all(by.css('.protractor-test-rule-body')).last() :
    element.all(by.css('.protractor-test-rule-body')).get(ruleNum);
  // The clickable well is not shown if the rule editor is already open.
  bodyElem.all(by.css('.protractor-test-edit-rule')).then(function(buttons) {
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
      var args = [bodyElem];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      _selectRule.apply(null, args);
    },
    setFeedback: function(index, richTextInstructions) {
      _setRuleFeedback(bodyElem, index, richTextInstructions);
    },
    addFeedback: function() {
      forms.ListEditor(
        bodyElem.element(by.css('.protractor-test-feedback-bubble'))
      ).addItem();
    },
    deleteFeedback: function(index) {
      forms.ListEditor(
        bodyElem.element(by.css('.protractor-test-feedback-bubble'))
      ).deleteItem(index);
    },
    // This saves the rule after the destination is selected.
    // Note that the supplied destinationName must be an existing state,
    // or 'END' for the end state. To create a new state, use
    // createNewStateAndSetDestination() instead.
    setDestination: function(destinationName) {
      _setRuleDest(bodyElem, destinationName);
      bodyElem.element(by.css('.protractor-test-save-rule')).click();
    },
    // Sets a destination for this rule, creating a state in the process.
    createNewStateAndSetDestination: function(destinationName) {
      var destinationElement =
        bodyElem.element(by.css('.protractor-test-dest-bubble'));
      destinationElement.element(
        by.cssContainingText('option', _OPTION_CREATE_NEW)).click();
      element(by.css('.protractor-test-add-state-input')).sendKeys(destinationName);
      element(by.css('.protractor-test-add-state-submit')).click();
      // Wait for the modal to close.
      general.waitForSystem();
      bodyElem.element(by.css('.protractor-test-save-rule')).click();
    },
    // The current state name must be at the front of the list.
    expectAvailableDestinationsToBe: function(stateNames) {
      var expectedOptionTexts = [
        stateNames[0] + ' ⟳',
        _OPTION_CREATE_NEW
      ].concat(stateNames.slice(1));

      var destinationElement =
        bodyElem.element(by.css('.protractor-test-dest-bubble'));
      destinationElement.all(by.tagName('option')).map(function(optionElem) {
        return optionElem.getText();
      }).then(function(actualOptionTexts) {
        expect(actualOptionTexts).toEqual(expectedOptionTexts);
      });
    },
    delete: function() {
      bodyElem.element(by.css('.protractor-test-delete-rule')).click();
      browser.driver.switchTo().alert().accept();
    }
  }
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
    expect(stateNames).toEqual(names);
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
  general.waitForSystem();
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

exports.addRule = addRule;
exports.RuleEditor = RuleEditor;

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

exports.expectGraphComparisonOf = expectGraphComparisonOf;
exports.expectTextComparisonOf = expectTextComparisonOf;
exports.revertToVersion = revertToVersion;
