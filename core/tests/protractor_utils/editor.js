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
var widgets = require('./widgets.js');

var setStateName = function(name) {
  var nameElement = element(by.css('.oppia-state-name-container'))
  nameElement.click();
  nameElement.element(by.tagName('input')).clear();
  nameElement.element(by.tagName('input')).sendKeys(name);
  nameElement.element(by.buttonText('Done')).click();
};

// Content & non-interactive widgets. It is necessary to run open() at the
// start and close() at the end.
var editContent = function() {
  var operations = forms.RichTextEditor(element(by.css('.oppia-state-content')));
  operations.open = function() {
    element(by.css('.protractor-test-edit-content')).click();
  };
  operations.close = function() {
    element(by.css('.oppia-state-content')).
      element(by.buttonText('Save Content')).click();
  };
  return operations;
};

// This receives a callbackFunction used to verify the display of the state's
// content visible when the content editor is closed. The callbackFunction will
// be supplied with a handler of the form forms.RichTextChecker and can then
// perform checks such as
//   handler.readBoldText('bold')
//   handler.readWidget('Collapsible', 'outer', 'inner')
// These would verify that the content consists of the word 'bold' in bold 
// followed by a Collapsible widget with the given arguments, and nothing else.
// Note that this fails for collapsibles and tabs since it is not possible to
// click on them to view their contents, as clicks instead open the rich text
// editor.
var expectContentToMatch = function(callbackFunction) {
  forms.expectRichText(
    element(by.css('.oppia-state-content-display')).all(by.xpath('./span')).last()
  ).toMatch(callbackFunction);
};

var expectContentTextToEqual = function(text) {
  forms.expectRichText(
    element(by.css('.oppia-state-content-display')).all(by.xpath('./span')).last()
  ).toEqual(text);
};

// Interactive widgets

// Additional arguments may be sent to this function, and they will be
// passed on to the relevant widget editor.
var selectWidget = function(widgetName) {
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

// Likewise additional arguments to this function will be passed on.
var selectComplexWidget = function(widgetName) {
  element(by.css('.protractor-test-select-interaction-id')).
    element(by.css('option[value=' + widgetName + ']')).click();
  element(by.css('.protractor-test-edit-interaction')).click();
  var elem = element(by.css('.oppia-interactive-widget-editor'));
  var args = [elem];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  widgets.getInteractive(widgetName).
    customizeComplexInteraction.apply(null, args);
  element(by.css('.protractor-test-save-interaction')).click();
};

// Rules are zero-indexed; 'default' denotes the default rule.
var editRule = function(ruleNum) {
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
    // Note: this does NOT save the rule after the feedback is entered.
    editFeedback: function() {
      var feedbackElement = elem.element(by.css('.oppia-feedback-bubble'));
      return forms.ListEditor(feedbackElement);
    },
    // Enter 'END' for the end state.
    // NB: This saves the rule after the destination is selected.
    setDestination: function(destinationName) {
      var destinationElement = elem.element(by.css('.oppia-dest-bubble'));
      forms.editAutocompleteDropdown(destinationElement).
        setText(destinationName);
      elem.element(by.css('.protractor-test-save-rule')).click();
    }
  }
};

// This function selects the rule to be used and enters the relevant parameters.
// It assumes that the rule editor is already open.
// parameterArray is an array of elements of the form {
//    value: the value specified for the parameter to take
//    fragmentNum: the index in the list of rule fragments of the parameter
//    type: the type of the parameter
// }
var _editRuleType = function(ruleElement, ruleDescription, parameterArray) {
  ruleElement.element(by.css('.protractor-test-rule-description')).click();
  element(by.id('select2-drop')).element(
      by.cssContainingText('li.select2-results-dept-0', ruleDescription)).then(
      function(optionElt) {
    optionElt.click();
    protractor.getInstance().waitForAngular();

    // Now we enter the parameters
    for (var i = 0; i < parameterArray.length; i++) {
      var parameterElement = ruleElement.element(
        by.repeater('item in ruleDescriptionFragments track by $index'
      ).row(parameterArray[i].fragmentNum));

      if (parameterArray[i].type === 'real') {
        forms.RealEditor(parameterElement).setValue(parameterArray[i].value);
      } else if (parameterArray[i].type === 'unicode') {
        forms.UnicodeEditor(parameterElement).setText(parameterArray[i].value);
      } else if (parameterArray[i].type === 'choice') {
        parameterElement.element(
          by.cssContainingText('option', parameterArray[i].value
        )).click();
      } else {
        throw Error(
          'Unknown type ' + parameterArray[i].type +
          ' sent to editor._editRuleType');
      }
    }
  });
};

var _addRule = function(ruleDescription, parameterArray) {
  element(by.css('.oppia-add-rule-button')).click();
  var newRuleElt = element(by.css('.protractor-test-temporary-rule'));
  _editRuleType(newRuleElt, ruleDescription, parameterArray);
  newRuleElt.element(by.css('.protractor-test-save-rule')).click();
};

var addNumericRule = {
  IsInclusivelyBetween: function(a, b) {
    _addRule('is between ... and ..., inclusive', [{
      value: a,
      fragmentNum: 1,
      type: 'real'
    }, {
      value: b,
      fragmentNum: 3,
      type: 'real'
    }]);
  },
  Equals: function(a) {
    _addRule('is equal to ...', [{
      value: a,
      fragmentNum: 1,
      type: 'real'
    }]);
  },
  IsGreaterThanOrEqualTo: function(a) {
    _addRule('is greater than or equal to ...', [{
      value: a,
      fragmentNum: 1,
      type: 'real'
    }]);
  },
  IsGreaterThan: function(a) {
    _addRule('is greater than ...', [{
      value: a,
      fragmentNum: 1,
      type: 'real'
    }]);
  },
  IsLessThanOrEqualTo: function(a) {
    _addRule('is less than or equal to ...', [{
      value: a,
      fragmentNum: 1,
      type: 'real'
    }]);
  },
  IsLessThan: function(a) {
    _addRule('is less than ...', [{
      value: a,
      fragmentNum: 1,
      type: 'real'
    }]);
  },
  IsWithinTolerance: function(a, b) {
    _addRule('is within ... of ...', [{
      value: a,
      fragmentNum: 1,
      type: 'real'
    }, {
      value: b,
      fragmentNum: 3,
      type: 'real'
    }]);
  }
};

var addMultipleChoiceRule = {
  Equals: function(a) {
    _addRule('is equal to ...', {
      value: a,
      fragmentNum: 1,
      // In the backend this is a non-negative int, but that parameter is
      // presented in the client as a dropdown so we use that here.
      type: 'choice'
    });
  }
};

// NOTE: if the state is not visible in the state graph this function will fail
var moveToState = function(targetName) {
  element.all(by.css('.node')).map(function(stateElement) {
    return stateElement.element(by.tagName('title')).getText();
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

exports.setStateName = setStateName;
exports.editContent = editContent;
exports.expectContentToMatch = expectContentToMatch;
exports.expectContentTextToMatch = expectContentTextToEqual;

exports.selectWidget = selectWidget;
exports.selectComplexWidget = selectComplexWidget;

exports.editRule = editRule;
exports.addNumericRule = addNumericRule;
exports.addMultipleChoiceRule = addMultipleChoiceRule;

exports.moveToState = moveToState;

exports.runFromSettingsTab = runFromSettingsTab;
exports.setTitle = setTitle;
exports.setCategory = setCategory;
exports.setObjective = setObjective;
exports.setLanguage = setLanguage;

exports.saveChanges = saveChanges;
