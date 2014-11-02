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
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var general = require('./general.js');
var forms = require('./forms.js');

var appendToConfigList = function(listName, textToAppend) {
  browser.get(general.ADMIN_URL_SUFFIX);
  element.all(
      by.repeater('(configPropertyId, configPropertyData) in configProperties')
    ).map(function(configProperty) {
    configProperty.element(by.tagName('em')).getText().then(function(title) {
      if (title.match(listName)) {
        var newEntry = forms.ListEditor(configProperty).addEntry();
        forms.UnicodeEditor(newEntry, true).setText(textToAppend);
        element(by.buttonText('Save')).click();
        browser.driver.switchTo().alert().accept();
        // Time is needed for the saving to complete.
        protractor.getInstance().waitForAngular();
      }
    });
  });
};

// The name should be as given in the admin page (not including '.yaml')
var reloadExploration = function(name) {
  browser.get(general.ADMIN_URL_SUFFIX);
  element.all(by.css('.protractor-test-reload-exploration-row')).
      map(function(explorationElement) {
    explorationElement.element(
        by.css('.protractor-test-reload-exploration-title')
      ).getText().then(function(title) {
      // We use match here in case there is whitespace around the name
      if (title.match(name + '.yaml')) {
        explorationElement.element(by.buttonText('Reload')).click();
        browser.driver.switchTo().alert().accept();
        // Time is needed for the reloading to complete.
        protractor.getInstance().waitForAngular();
      }
    });
  });
};

exports.appendToConfigList = appendToConfigList;
exports.reloadExploration = reloadExploration;