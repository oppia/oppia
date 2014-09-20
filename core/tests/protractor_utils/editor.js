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

// TODO (Jacob) convert to referring to widgets by name.
var _openWidgetEditor = function(widgetIndex, widgetName) {
  element(by.css('.protractor-test-edit-interaction')).click();
  expect(element(by.repeater('widget in widgetList').row(widgetIndex)).
    getText()).toBe(widgetName);
  element(by.repeater('widget in widgetList').row(widgetIndex)).click();
};

var _closeWidgetEditor = function() {
  element(by.css('.protractor-test-save-interaction')).click();
};

var selectNumericWidget = function() {
  _openWidgetEditor(2, 'Numeric input');
  _closeWidgetEditor();
};

var selectContinueWidget = function(buttonText) {
  _openWidgetEditor(0, 'Continue');
  if (buttonText) {
    element(by.linkText('Customize')).click();
    forms.editUnicode(element(by.css('.protractor-test-widget-args'))).setText(buttonText);
  }
  _closeWidgetEditor();
};

// textArray should be a non-empty array of strings (to be the options)
var selectSimpleMultipleChoiceWidget = function(textArray) {
  _openWidgetEditor(1, 'Multiple choice input');
  element(by.linkText('Customize')).click();
  var customizer = forms.editList(element(by.css('.protractor-test-widget-args')));
  customizer.editRichTextEntry(0).appendPlainText(textArray[0]);
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
      feedbackElement.element.all(by.css('.protractor-test-edit-feedback')).
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

var saveChanges = function(commitMessage) {
  element(by.css('.protractor-test-save-changes')).click().then(function() {
    if (commitMessage) {
      element(by.model('commitMessage')).sendKeys(commitMessage);
    }
    element(by.css('.protractor-test-close-save-modal')).click();
    // This is necessary to give the page time to record the changes,
    // so that it does not attempt to stop the user leaving.
    protractor.getInstance().waitForAngular();
    general.waitForSystem();
  });
};

exports.editContent = editContent;

exports.selectNumericWidget = selectNumericWidget;
exports.selectContinueWidget = selectContinueWidget;
exports.selectSimpleMultipleChoiceWidget = selectSimpleMultipleChoiceWidget;

exports.editRule = editRule;

exports.saveChanges = saveChanges;