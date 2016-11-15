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
 * @fileoverview Utilities for interacting with the admin page, for use in
 * Protractor tests.
 */

var general = require('./general.js');
var forms = require('./forms.js');

// Args:
// - 'propertyName' is the name of the property as given in the left-hand
//     column.
// - 'objectType' is the type of the property, e.g. 'Unicode' or 'List'.
// - 'editingInstructions' is  a function that is sent an editor for the
//     objectType which it can then act on, for example by adding elements to a
//     list.
var editConfigProperty = function(
    propertyName, objectType, editingInstructions) {
  general.waitForSystem();
  browser.get(general.ADMIN_URL_SUFFIX);
  element(by.css('.protractor-test-admin-config-tab')).click();
  element.all(by.css('.protractor-test-config-property')).
      map(function(configProperty) {
    return configProperty.element(by.css('.protractor-test-config-title')).
        getText().then(function(title) {
      if (title.match(propertyName)) {
        editingInstructions(forms.getEditor(objectType)(configProperty));
        element(by.css('.protractor-test-save-all-configs')).click();
        general.acceptAlert();
        // Time is needed for the saving to complete.
        browser.waitForAngular();
        return true;
      }
    });
  }).then(function(results) {
    var success = false;
    for (var i = 0; i < results.length; i++) {
      success = success || results[i];
    }
    if (!success) {
      throw Error('Could not find config property: ' + propertyName);
    }
  });
};

// The name should be as given in the admin page (including '.yaml' if
// necessary).
var reloadExploration = function(name) {
  browser.get(general.ADMIN_URL_SUFFIX);
  element.all(by.css('.protractor-test-reload-exploration-row')).
      map(function(explorationElement) {
    explorationElement.element(
        by.css('.protractor-test-reload-exploration-title')
      ).getText().then(function(title) {
      // We use match here in case there is whitespace around the name
      if (title.match(name)) {
        explorationElement.element(
          by.css('.protractor-test-reload-exploration-button')
        ).click();
        general.acceptAlert();
        // Time is needed for the reloading to complete.
        browser.waitForAngular();
      }
    });
  });
};

exports.editConfigProperty = editConfigProperty;
exports.reloadExploration = reloadExploration;
