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

forms = require('./forms.js');
general = require('./general.js');

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
  var operations = forms.editRichText(element(by.css('.oppia-state-content')));
  operations.open = function() {
    element(by.css('.protractor-test-edit-content')).click();
  };
  operations.close = function() {
    element(by.css('.oppia-state-content')).
      element(by.buttonText('Save Content')).click();
  };
  return operations;
};


// Interactive widgets

var _openWidgetEditor = function(widgetName) {
  element(by.css('.protractor-test-edit-interaction')).click();
  element.all(by.repeater('widget in widgetList')).map(function(elem) {
    elem.getText().then(function(name) {
      if (name.match(widgetName)) {
        elem.click();
      }
    });
  });
};

var _closeWidgetEditor = function() {
  element(by.css('.protractor-test-save-interaction')).click();
};

var selectNumericWidget = function() {
  _openWidgetEditor('Numeric input');
  _closeWidgetEditor();
};

var selectContinueWidget = function(buttonText) {
  _openWidgetEditor('Continue');
  if (buttonText) {
    element(by.linkText('Customize')).click();
    forms.editUnicode(element(by.css('.protractor-test-widget-args'))).
      setText(buttonText);
  }
  _closeWidgetEditor();
};

// textArray should be a non-empty array of strings (to be the options)
var selectSimpleMultipleChoiceWidget = function(textArray) {
  _openWidgetEditor('Multiple choice input');
  element(by.linkText('Customize')).click();
  var customizer = forms.editList(
    element(by.css('.protractor-test-widget-args')));
  customizer.editRichTextEntry(0).setPlainText(textArray[0]);
  for (var i = 1; i < textArray.length; i++) {
    var newEntry = customizer.appendEntry('Add multiple choice option');
    forms.editRichText(newEntry).appendPlainText(textArray[i]);
  }
  _closeWidgetEditor();
};


// Rules are zero-indexed; 'default' denotes the default rule.
var editRule = function(ruleNum) {
  var elem = (ruleNum === 'default') ?
    element(by.css('.protractor-test-default-rule')):
    element(by.repeater('rule in handler track by $index').row(ruleNum));
  return {
    editFeedback: function() {
      var feedbackElement = elem.element(by.css('.oppia-feedback-bubble'));
      // This button will not be shown if we are part way through editing.
      feedbackElement.all(by.css('.protractor-test-edit-feedback')).
        then(function(buttons) {
          if (buttons.length > 0) {
            buttons[0].click();
          }
        });
      return forms.editList(feedbackElement);
    },
    // Enter 'END' for the end state.
    setDestination: function(destinationName) {
      var destinationElement = elem.element(by.css('.oppia-dest-bubble'));
      destinationElement.element(by.tagName('button')).click();
      forms.editAutocompleteDropdown(destinationElement).
        setText(destinationName + '\n');
    }
  }
};

// This function is run from the "select rule type" interface being open. It
// will select the rule to be used, enter the relevant parameters and then
// click "Done".
// parameterArray is an array of elements of the form {
//    value: the value specified for the parameter to take
//    fragmentNum: the index in the list of rule fragments of the parameter
//    type: the type of the parameter
// }
var _editRuleType = function(ruleElement, ruleDescription, parameterArray) {
  // It is necessary to get all the texts first, as clicking 'Select' will 
  // remove the allRuleTypes from the DOM.
  ruleElement.all(by.repeater('(description, name) in allRuleTypes')).map(
      function(option) {
    return option.getText();
  }).then(function(descriptions) {
    for (var i = 0; i < descriptions.length; i++) {
      if (descriptions[i].match(ruleDescription)) {
        ruleElement.element(
          by.repeater('(description, name) in allRuleTypes').row(i)
        ).element(by.buttonText('Select')).click();
      }
    }
  });

  // Now we enter the parameters
  for (var i = 0; i < parameterArray.length; i++) {
    var parameterElement = ruleElement.element(
      by.repeater('item in ruleDescriptionFragments track by $index'
    ).row(parameterArray[i].fragmentNum));

    if (parameterArray[i].type === 'real') {
      forms.editReal(parameterElement).setValue(parameterArray[i].value);
    } else if (parameterArray[i].type === 'unicode') {
      forms.editUnicode(parameterElement).setText(parameterArray[i].value);
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
  ruleElement.element(by.buttonText('Done')).click();
};

var _addRule = function(ruleDescription, parameterArray) {
  element(by.css('.oppia-add-rule-button')).click();
  _editRuleType(
    element(by.css('.protractor-test-temporary-rule')), ruleDescription, 
    parameterArray);
};

var addNumericRule = {
  IsInclusivelyBetween: function(a, b) {
    _addRule('is between INPUT and INPUT, inclusive', [{
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
    _addRule('is equal to INPUT', [{
      value: a,
      fragmentNum: 1,
      type: 'real'
    }]);
  },
  IsGreaterThanOrEqualTo: function(a) {
    _addRule('is greater than or equal to INPUT', [{
      value: a,
      fragmentNum: 1,
      type: 'real'
    }]);
  },
  IsGreaterThan: function(a) {
    _addRule('is greater than INPUT', [{
      value: a,
      fragmentNum: 1,
      type: 'real'
    }]);
  },
  IsLessThanOrEqualTo: function(a) {
    _addRule('is less than or equal to INPUT', [{
      value: a,
      fragmentNum: 1,
      type: 'real'
    }]);
  },
  IsLessThan: function(a) {
    _addRule('is less than INPUT', [{
      value: a,
      fragmentNum: 1,
      type: 'real'
    }]);
  },
  IsWithinTolerance: function(a, b) {
    _addRule('is within INPUT of INPUT', [{
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
    _addRule('is equal to INPUT', {
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

exports.selectNumericWidget = selectNumericWidget;
exports.selectContinueWidget = selectContinueWidget;
exports.selectSimpleMultipleChoiceWidget = selectSimpleMultipleChoiceWidget;

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