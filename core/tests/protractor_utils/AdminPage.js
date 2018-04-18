// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the admin page, for use in Protractor
 * tests.
 */

var general = require('./general.js');
var forms = require('./forms.js');

var AdminPage = function(){
  var ADMIN_URL_SUFFIX = '/admin';
  var configTab = element(by.css('.protractor-test-admin-config-tab'));
  var saveAllConfigs = element(by.css('.protractor-test-save-all-configs'));
  var configProperties = element.all(by.css(
    '.protractor-test-config-property'
  ));
  var adminRolesTab = element(by.css('.protractor-test-admin-roles-tab'));
  var updateFormName = element(by.css('.protractor-update-form-name'));
  var updateFormSubmit = element(by.css('.protractor-update-form-submit'));
  var roleSelect = element(by.css('.protractor-update-form-role-select'));
  var explorationElements = element.all(by.css(
    '.protractor-test-reload-exploration-row'
  ));
  var reloadAllExplorationsButtons = element.all(by.css(
    '.protractor-test-reload-all-explorations-button'
  ));
  var reloadCollectionButton = element.all(by.css(
    '.protractor-test-reload-collection-button')).first();

  var roleOption = function(role){
    return roleSelect.element(by.cssContainingText('option', role));
  };

  var explorationTitleElement = function(explorationElement) {
    return explorationElement.element(
      by.css('.protractor-test-reload-exploration-title')
    );
  };

  var explorationElementReloadButton = function(explorationElement) {
    return explorationElement.element(
      by.css('.protractor-test-reload-exploration-button')
    );
  };

  var saveConfigProperty = function(configProperty) {
    return configProperty.element(by.css('.protractor-test-config-title'))
      .getText()
      .then(function(title) {
        if (title.match(propertyName)) {
          editingInstructions(forms.getEditor(objectType)(configProperty));
          saveAllConfigs.click();
          general.acceptAlert();
          // Time is needed for the saving to complete.
          browser.waitForAngular();
          return true;
        }
      });
  };

  this.get = function(){
    return browser.get(ADMIN_URL_SUFFIX);
  };

  this.editConfigProperty = function(
      propertyName, objectType, editingInstructions) {
    general.waitForSystem();
    this.get();
    configTab.click();
    configProperties.map(saveConfigProperty).then(function(results) {
      var success = false;
      for (var i = 0; i < results.length; i++) {
        success = success || results[i];
      }
      if (!success) {
        throw Error('Could not find config property: ' + propertyName);
      }
    });
  };

  this.updateRole = function(name, newRole) {
    general.waitForSystem();
    this.get();
    adminRolesTab.click();
    browser.waitForAngular();
    // Change values for "update role" form, and submit it.
    updateFormName.sendKeys(name);
    roleOption(newRole).click();
    updateFormSubmit.click();
    general.waitForSystem();
    return true;
  };

  this.reloadCollection = function() {
    general.waitForSystem();
    this.get();
    browser.waitForAngular();

    reloadCollectionButton.click();
    general.acceptAlert();
    // Time is needed for the reloading to complete.
    browser.waitForAngular();
  };

  // The name should be as given in the admin page (including '.yaml' if
  // necessary).
  this.reloadExploration = function(name) {
    this.get();
    explorationElements.map(function(explorationElement) {
      explorationTitleElement(explorationElement)
        .getText().then(function(title) {
          // We use match here in case there is whitespace around the name
          if (title.match(name)) {
            explorationElementReloadButton(explorationElement).click();
            general.acceptAlert();
            // Time is needed for the reloading to complete.
            browser.waitForAngular();
          }
        });
    });
  };

  // Imports all the demo explorations.
  this.reloadAllExplorations = function(name) {
    this.get();
    reloadAllExplorationsButtons.click();
    general.acceptAlert();
    browser.waitForAngular();
  };
};

exports.AdminPage = AdminPage;
