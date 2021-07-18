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

var action = require('./action.js');
var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');

var AdminPage = function() {
  var ADMIN_URL_SUFFIX = '/admin';

  var configTab = element(by.css('.protractor-test-admin-config-tab'));
  var saveAllConfigs = element(by.css('.protractor-test-save-all-configs'));
  var configProperties = element.all(by.css(
    '.protractor-test-config-property'
  ));
  var adminRolesTab = element(by.css('.protractor-test-admin-roles-tab'));
  var adminRolesTabContainer = element(
    by.css('.protractor-test-roles-tab-container'));
  var usernameInputFieldForRolesEditing = element(
    by.css('.protractor-test-username-for-role-editor'));
  var editUserRoleButton = element(by.css('.protractor-test-role-edit-button'));
  var addNewRoleButton = element(
    by.css('.protractor-test-add-new-role-button'));
  var progressSpinner = element(by.css('.protractor-test-progress-spinner'));
  var roleSelector = element(by.css('.protractor-test-new-role-selector'));
  var roleEditorContainer = element(
    by.css('.protractor-test-roles-editor-card-container'));
  var userRoleItems = element.all(
    by.css('.protractor-test-user-role-description'));
  var statusMessage = element(by.css('.protractor-test-status-message'));

  var roleDropdown = element(by.css('.protractor-test-role-method'));
  var roleValueOption = element(by.css('.protractor-test-role-value'));
  var viewRoleButton = element(by.css('.protractor-test-role-success'));

  // The reload functions are used for mobile testing
  // done via Browserstack. These functions may cause
  // a problem when used to run tests directly on Travis.
  if (general.isInDevMode()) {
    var explorationElements = element.all(by.css(
      '.protractor-test-reload-exploration-row'
    ));

    var reloadCollectionButtons = element.all(by.css(
      '.protractor-test-reload-collection-button'));

    var getExplorationTitleElement = function(explorationElement) {
      return explorationElement.element(
        by.css('.protractor-test-reload-exploration-title')
      );
    };

    var getExplorationElementReloadButton = function(explorationElement) {
      return explorationElement.element(
        by.css('.protractor-test-reload-exploration-button')
      );
    };

    this.reloadCollection = async function(collectionId) {
      await this.get();
      var reloadCollectionButton = reloadCollectionButtons.get(collectionId);
      await action.click('Reload Collection Buttons', reloadCollectionButton);
      await general.acceptAlert();
      // Time is needed for the reloading to complete.
      await waitFor.textToBePresentInElement(
        statusMessage, 'Data reloaded successfully.',
        'Collection could not be reloaded');
      return true;
    };

    // The name should be as given in the admin page (including '.yaml' if
    // necessary).
    this.reloadExploration = async function(name) {
      await this.get();
      explorationElements.map(async function(explorationElement) {
        await waitFor.visibilityOf(
          getExplorationTitleElement(
            explorationElement,
            'Exploration title taking too long to appear'));
        var title = await getExplorationTitleElement(
          explorationElement).getText();

        // We use match here in case there is whitespace around the name.
        if (title.match(name)) {
          var explorationElementReloadButton =
            getExplorationElementReloadButton(explorationElement);
          await action.click(
            'Exploration Element Reload Button',
            explorationElementReloadButton);
          await general.acceptAlert();
          // Time is needed for the reloading to complete.
          await waitFor.textToBePresentInElement(
            statusMessage, 'Data reloaded successfully.',
            'Exploration could not be reloaded');
          return true;
        }
      });
    };
  }

  var _switchToRolesTab = async function() {
    await action.click('Admin roles tab button', adminRolesTab);
    await waitFor.pageToFullyLoad();

    expect(await adminRolesTab.getAttribute('class')).toMatch('active');
    await waitFor.visibilityOf(
      adminRolesTabContainer, 'Roles tab page is not visible.');
  };

  var saveConfigProperty = async function(
      configProperty, propertyName, objectType, editingInstructions) {
    await waitFor.visibilityOf(
      configProperty.element(
        by.css('.protractor-test-config-title')),
      'Config Title taking too long too appear');
    var title = await configProperty.element(
      by.css('.protractor-test-config-title')).getText();
    if (title.match(propertyName)) {
      await editingInstructions(
        await forms.getEditor(objectType)(configProperty));
      await action.click('Save All Configs Button', saveAllConfigs);
      await general.acceptAlert();
      // Waiting for success message.
      await waitFor.textToBePresentInElement(
        statusMessage, 'saved successfully',
        'New config could not be saved');
      return true;
    }
  };

  this.get = async function() {
    await browser.get(ADMIN_URL_SUFFIX);
    await waitFor.pageToFullyLoad();
  };

  this.getJobsTab = async function() {
    await browser.get(ADMIN_URL_SUFFIX + '#/jobs');
    await waitFor.pageToFullyLoad();
  };

  this.getFeaturesTab = async function() {
    await this.get();
    var featuresTab = element(by.css('.protractor-test-admin-features-tab'));
    await action.click('Admin features tab', featuresTab);
    var featureFlagElements = element.all(
      by.css('.protractor-test-feature-flag'));
    await waitFor.visibilityOf(
      featureFlagElements.first(), 'Feature flags not showing up');
  };

  this.getDummyFeatureElement = async function() {
    var featureFlagElements = element.all(
      by.css('.protractor-test-feature-flag'));

    var count = await featureFlagElements.count();
    for (let i = 0; i < count; i++) {
      var elem = featureFlagElements.get(i);
      if ((await elem.element(
        by.css('.protractor-test-feature-name')).getText()) ===
          'dummy_feature') {
        return elem;
      }
    }

    return null;
  };

  this.removeAllRulesOfFeature = async function(featureElement) {
    while (!await featureElement.isElementPresent(
      by.css('.protractor-test-no-rule-indicator'))) {
      await action.click(
        'Remove feature rule button',
        featureElement
          .element(by.css('.protractor-test-remove-rule-button'))
      );
    }
  };

  this.saveChangeOfFeature = async function(featureElement) {
    await action.click(
      'Save feature button',
      featureElement
        .element(by.css('.protractor-test-save-button'))
    );

    await general.acceptAlert();
    await waitFor.visibilityOf(statusMessage);
  };

  this.enableFeatureForDev = async function(featureElement) {
    await this.removeAllRulesOfFeature(featureElement);

    await action.click(
      'Add feature rule button',
      featureElement
        .element(by.css('.protractor-test-feature-add-rule-button'))
    );

    await action.sendKeys(
      'Rule value selector',
      featureElement
        .element(by.css('.protractor-test-value-selector')),
      'Enabled');

    await action.click(
      'Add condition button',
      featureElement
        .element(by.css('.protractor-test-add-condition-button'))
    );

    await this.saveChangeOfFeature(featureElement);
  };

  this.editConfigProperty = async function(
      propertyName, objectType, editingInstructions) {
    await this.get();
    await action.click('Config Tab', configTab);
    await waitFor.elementToBeClickable(saveAllConfigs);

    var results = [];
    for (let configProperty of (await configProperties)) {
      results.push(
        await saveConfigProperty(
          configProperty, propertyName, objectType, editingInstructions)
      );
    }
    var success = null;
    for (var i = 0; i < results.length; i++) {
      success = success || results[i];
    }
    if (!success) {
      throw new Error('Could not find config property: ' + propertyName);
    }
  };

  this._editUserRole = async function(username) {
    await this.get();
    await _switchToRolesTab();
    await action.sendKeys(
      'Username input field', usernameInputFieldForRolesEditing, username);
    await action.click('Edit user role button', editUserRoleButton);
    await waitFor.visibilityOf(
      roleEditorContainer, 'Role editor card takes too long to appear.');
  };

  this.addRole = async function(name, newRole) {
    await this._editUserRole(name);

    await action.click('Add new role', addNewRoleButton);
    await action.matSelect('New role selector', roleSelector, newRole);

    await waitFor.invisibilityOf(
      progressSpinner, 'Progress spinner is taking too long to disappear.');
  };

  this.getUsersAsssignedToRole = async function(role) {
    await action.select('Role Drop Down', roleDropdown, 'By Role');
    await action.select('Role Value Option', roleValueOption, role);
    await action.click('View Role Button', viewRoleButton);
  };

  this.expectUserRolesToMatch = async function(name, expectedRoles) {
    await this._editUserRole(name);
    var userRoles = await userRoleItems.map(async function(userRoleContainer) {
      return (
        await action.getText('Role container', userRoleContainer)
      ).toLowerCase();
    });
    expect(expectedRoles.length).toEqual(userRoles.length);
    expectedRoles.sort();
    userRoles.sort();
    for (j = 0; j < userRoles.length; j++) {
      var name = userRoles[j];
      expect(name).toEqual(expectedRoles[j]);
    }
  };

  this.expectUsernamesToMatch = async function(expectedUsernamesArray) {
    var foundUsersArray = [];
    if (expectedUsernamesArray.length !== 0) {
      await waitFor.visibilityOf(element(
        by.css('.protractor-test-roles-result-rows')));
    }
    var usernames = await element.all(
      by.css('.protractor-test-roles-result-rows'))
      .map(async function(elm) {
        var text = await action.getText(
          'Username in roles list on admin page', elm);
        return text;
      });

    for (i = 0; i < usernames.length; i++) {
      var name = usernames[i];
      foundUsersArray.push(name);
    }
    expect(foundUsersArray.length).toEqual(expectedUsernamesArray.length);

    expectedUsernamesArray.sort();
    foundUsersArray.sort();
    for (j = 0; j < foundUsersArray.length; j++) {
      var name = foundUsersArray[j];
      expect(name).toEqual(expectedUsernamesArray[j]);
    }
  };
};

exports.AdminPage = AdminPage;
