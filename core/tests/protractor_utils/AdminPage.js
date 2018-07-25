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

var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');

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
  var statusMessage = element(by.css('[ng-if="statusMessage"]'));

  // The reload functions are used for mobile testing
  // done via Browserstack. These functions may cause
  // a problem when used to run tests directly on Travis.

  var explorationElements = element.all(by.css(
    '.protractor-test-reload-exploration-row'
  ));

  var reloadAllExplorationsButtons = element.all(by.css(
    '.protractor-test-reload-all-explorations-button'
  ));

  var reloadCollectionButton = element.all(by.css(
    '.protractor-test-reload-collection-button'));

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

  this.reloadCollection = function(collectionId) {
    reloadCollectionButton.get(collectionId).click();
    general.acceptAlert();
    // Time is needed for the reloading to complete.
    waitFor.textToBePresentInElement(
      statusMessage, 'Data reloaded successfully.',
      'Collection could not be reloaded');
    return true;
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
            waitFor.textToBePresentInElement(
              statusMessage, 'Data reloaded successfully.',
              'Exploration could not be reloaded');
            return true;
          }
        });
    });
  };

  var saveConfigProperty = function(configProperty) {
    return configProperty.element(by.css('.protractor-test-config-title'))
      .getText()
      .then(function(title) {
        if (title.match(propertyName)) {
          editingInstructions(forms.getEditor(objectType)(configProperty));
          saveAllConfigs.click();
          general.acceptAlert();
          // Waiting for success message.
          waitFor.textToBePresentInElement(
            statusMessage, 'saved successfully',
            'New config could not be saved');
          return true;
        }
      });
  };

  this.get = function(){
    browser.get(ADMIN_URL_SUFFIX);
    return waitFor.pageToFullyLoad();
  };

  this.editConfigProperty = function(
      propertyName, objectType, editingInstructions) {
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
    waitFor.elementToBeClickable(
      adminRolesTab, 'Admin Roles tab is not clickable');
    adminRolesTab.click();

    // Change values for "update role" form, and submit it.
    waitFor.visibilityOf(updateFormName, 'Update Form Name is not visible');
    updateFormName.sendKeys(name);
    var roleOption = roleSelect.element(
      by.cssContainingText('option', newRole));
    roleOption.click();
    updateFormSubmit.click();
    waitFor.textToBePresentInElement(
      statusMessage, 'successfully updated to',
      'Could not set role successfully');
    return true;
  };
};

exports.AdminPage = AdminPage;
