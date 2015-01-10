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
var widgets = require('../../../extensions/widgets/protractor.js');
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
  var nameElement = element(by.css('.oppia-state-name-container'))
  nameElement.click();
  nameElement.element(by.tagName('input')).clear();
  nameElement.element(by.tagName('input')).sendKeys(name);
  nameElement.element(by.buttonText('Done')).click();
};

var expectCurrentStateToBe = function(name) {
  expect(
    element(by.css('.oppia-state-name-container')).getText()
  ).toMatch(name);
};

// CONTENT

// 'richTextInstructions' is a function that is sent a RichTextEditor which it
// can then use to alter the state content, for example by calling
// .appendBoldText(...).
var setContent = function(richTextInstructions) {
  element(by.css('.protractor-test-edit-content')).click();
  var richTextEditor = forms.RichTextEditor(
    element(by.css('.oppia-state-content')));
  richTextEditor.clear();
  richTextInstructions(richTextEditor);
  element(by.css('.oppia-state-content')).
    element(by.buttonText('Save Content')).click();
};

// This receives a function richTextInstructions used to verify the display of
// the state's content visible when the content editor is closed. The
// richTextInstructions will be supplied with a handler of the form
// forms.RichTextChecker and can then perform checks such as
//   handler.readBoldText('bold')
//   handler.readWidget('Collapsible', 'outer', 'inner')
// These would verify that the content consists of the word 'bold' in bold
// followed by a Collapsible widget with the given arguments, and nothing else.
// Note that this fails for collapsibles and tabs since it is not possible to
// click on them to view their contents, as clicks instead open the rich text
// editor.
var expectContentToMatch = function(richTextInstructions) {
  // The .last() is necessary because we want the second of two <span>s; the
  // first holds the placeholder text for the exploration content.
  forms.expectRichText(
    element(by.css('.oppia-state-content-display')).all(by.xpath('./span')).last()
  ).toMatch(richTextInstructions);
};

var expectContentTextToEqual = function(text) {
  forms.expectRichText(
    element(by.css('.oppia-state-content-display')).all(by.xpath('./span')).last()
  ).toEqual(text);
};

// INTERACTIVE WIDGETS

// Additional arguments may be sent to this function, and they will be
// passed on to the relevant widget editor.
var setInteraction = function(widgetName) {
  element(by.css('.protractor-test-select-interaction-id')).
    element(by.css('option[value=' + widgetName + ']')).click();

  if (arguments.length > 1) {
    element(by.css('.protractor-test-edit-interaction')).click();

    var elem = element(by.css('.oppia-interactive-widget-editor'));

    // Need to convert arguments to an actual array, discarding widgetName. We
    // also send the interaction editor element, within which the customizer
    // should act.
    var args = [elem];
    for (var i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    widgets.getInteractive(widgetName).customizeInteraction.apply(null, args);

    element(by.css('.protractor-test-save-interaction')).click();
  }
};

// Likewise this can receive additional arguments
var expectInteractionToMatch = function(widgetName) {
  // Convert additional arguments to an array to send on.
  var args = [];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  widgets.getInteractive(widgetName).
    expectInteractionDetailsToMatch.apply(null, args);
};

// RULES

// This function selects a rule for the current interaction and enters the
// entries of the parameterValues array as its parameters; the parameterValues
// should be specified after the ruleName as additional arguments. For example
// with widget 'NumericInput' and rule 'Equals' then there is a single
// parameter which the given answer is required to equal.
var _selectRule = function(ruleElement, widgetName, ruleName) {
  var parameterValues = [];
  for (var i = 3; i < arguments.length; i++) {
    parameterValues.push(arguments[i]);
  }

  var ruleDescription = rules.getDescription(
    widgets.getInteractive(widgetName).answerObjectType, ruleName);

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
    var parameterElement = ruleElement.element(
      by.repeater('item in ruleDescriptionFragments track by $index'
    ).row(i * 2 + 1));
    var parameterEditor = forms.getEditor(parameterTypes[i])(parameterElement);

    if (widgetName === 'MultipleChoiceInput') {
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
var addRule = function(widgetName, ruleName) {
  element(by.css('.oppia-add-rule-button')).click();
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
    element(by.repeater('rule in handler track by $index').row(ruleNum));

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
    setDescription: function(widgetName, ruleName) {
      var args = [elem];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      _selectRule.apply(null, args);
    },
    setFeedback: function(index, richTextInstructions) {
      var feedbackEditor = forms.ListEditor(
        elem.element(by.css('.oppia-feedback-bubble'))
      ).editItem(index, 'RichText');
      feedbackEditor.clear();
      richTextInstructions(feedbackEditor);
    },
    addFeedback: function() {
      forms.ListEditor(elem.element(by.css('.oppia-feedback-bubble'))).
        addItem();
    },
    deleteFeedback: function(index) {
      forms.ListEditor(elem.element(by.css('.oppia-feedback-bubble'))).
        deleteItem(index);
    },
    // Enter 'END' for the end state.
    // This saves the rule after the destination is selected.
    setDestination: function(destinationName) {
      var destinationElement = elem.element(by.css('.oppia-dest-bubble'));
      forms.AutocompleteDropdownEditor(destinationElement).
        setValue(destinationName);
      elem.element(by.css('.protractor-test-save-rule')).click();
    },
    expectAvailableDestinationsToBe: function(stateNames) {
      forms.AutocompleteDropdownEditor(
        elem.element(by.css('.oppia-dest-bubble'))
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
  element(by.css('.oppia-add-state-container')).
    element(by.tagName('input')).sendKeys(newStateName);
  element(by.css('.oppia-add-state-container')).
    element(by.tagName('button')).click();
};

// NOTE: if the state is not visible in the state graph this function will fail
var moveToState = function(targetName) {
  element.all(by.css('.node')).map(function(stateElement) {
    return stateElement.element(by.tagName('text')).getText();
  }).then(function(listOfNames) {
    var matched = false;
    for (var i = 0; i < listOfNames.length; i++) {
      if (listOfNames[i] === targetName) {
        element.all(by.css('.node')).get(i).click();
        matched = true;
      }
    }
    if (! matched) {
      throw Error('State ' + targetName + ' not found by editor.moveToState');
    }
  });
};

var deleteState = function(stateName) {
  element.all(by.css('.node')).map(function(stateElement) {
    return stateElement.element(by.tagName('text')).getText();
  }).then(function(listOfNames) {
    var matched = false;
    for (var i = 0; i < listOfNames.length; i++) {
      if (listOfNames[i] === stateName) {
        element.all(by.css('.node')).get(i).element(by.tagName('g')).click();
        protractor.getInstance().waitForAngular();
        general.waitForSystem();
        element(by.css('.protractor-test-confirm-delete-state')).click();
        matched = true;
      }
    }
    if (! matched) {
      throw Error('State ' + stateName + ' not found by editor.moveToState');
    }
  });
};

var expectStateNamesToBe = function(names) {
  element.all(by.css('.node')).map(function(stateNode) {
    return stateNode.element(by.tagName('text')).getText();
  }).then(function(stateNames) {
    expect(stateNames).toEqual(names);
  });
};

// SETTINGS

// All functions involving the settings tab should be sent through this
// wrapper.
var runFromSettingsTab = function(callbackFunction) {
  element(by.linkText('Settings')).click();
  var result = callbackFunction();
  element(by.linkText('Main')).click();
  return result;
};

var setTitle = function(title) {
  runFromSettingsTab(function() {
    element(by.id('explorationTitle')).clear();
    element(by.id('explorationTitle')).sendKeys(title);
  });
};

var setCategory = function(category) {
  runFromSettingsTab(function() {
    element(by.id('explorationCategory')).clear();
    element(by.id('explorationCategory')).sendKeys(category);
  });
};

var setObjective = function(objective) {
  runFromSettingsTab(function() {
    element(by.id('explorationObjective')).clear();
    element(by.id('explorationObjective')).sendKeys(objective);
  });
};

var setLanguage = function(language) {
  runFromSettingsTab(function() {
    element(by.id('explorationLanguageCode')).
      element(by.cssContainingText('option', language)).click();
  });
};

var expectAvailableFirstStatesToBe = function(names) {
  runFromSettingsTab(function() {
    element(by.id('explorationInitStateName')).
        all(by.tagName('option')).map(function(elem) {
      return elem.getText();
    }).then(function(options) {
      expect(options).toEqual(names);
    });
  });
};

var setFirstState = function(stateName) {
  runFromSettingsTab(function() {
    element(by.id('explorationInitStateName')).
      element(by.cssContainingText('option', stateName)).click();
  });
};

// CONTROLS

var saveChanges = function(commitMessage) {
  element(by.css('.protractor-test-save-changes')).click().then(function() {
    if (commitMessage) {
      element(by.model('commitMessage')).sendKeys(commitMessage);
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
  browser.actions().mouseMove(element(by.css('.navbar-header'))).perform();
  exitButton.click();
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
