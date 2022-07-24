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

const { element } = require('protractor');
var action = require('./action.js');
var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');

var AdminPage = function() {
  var ADMIN_URL_SUFFIX = '/admin';

  var configTab = element(by.css('.e2e-test-admin-config-tab'));
  var saveAllConfigs = element(by.css('.e2e-test-save-all-configs'));
  var configProperties = element.all(by.css(
    '.e2e-test-config-property'
  ));
  var adminRolesTab = element(by.css('.e2e-test-admin-roles-tab'));
  var adminRolesTabContainer = element(
    by.css('.e2e-test-roles-tab-container'));
  var usernameInputFieldForRolesEditing = element(
    by.css('.e2e-test-username-for-role-editor'));
  var editUserRoleButton = element(by.css('.e2e-test-role-edit-button'));
  var addNewRoleButton = element(
    by.css('.e2e-test-add-new-role-button'));
  var progressSpinner = element(by.css('.e2e-test-progress-spinner'));
  var roleSelector = element(by.css('.e2e-test-new-role-selector'));
  var roleEditorContainer = element(
    by.css('.e2e-test-roles-editor-card-container'));
  var userRoleItems = element.all(
    by.css('.e2e-test-user-role-description'));
  var statusMessage = element(by.css('.e2e-test-status-message'));

  var roleDropdown = element(by.css('.e2e-test-role-method'));
  var roleValueOption = element(by.css('.e2e-test-role-value'));
  var viewRoleButton = element(by.css('.e2e-test-role-success'));
  var explorationElements = element.all(by.css(
    '.e2e-test-reload-exploration-row'));
  var reloadCollectionButtons = element.all(by.css(
    '.e2e-test-reload-collection-button'));
  var explorationTitleLocator = by.css(
    '.e2e-test-reload-exploration-title');
  var explorationButtonLocator = by.css(
    '.e2e-test-reload-exploration-button');
  var configTitleLocator = by.css('.e2e-test-config-title');
  var featuresTab = element(by.css('.e2e-test-admin-features-tab'));
  var featureFlagElements = element.all(by.css(
    '.e2e-test-feature-flag'));
  var featureNameLocator = by.css('.e2e-test-feature-name');
  var noRuleIndicatorLocator = by.css('.e2e-test-no-rule-indicator');
  var removeRuleButtonLocator = by.css(
    '.e2e-test-remove-rule-button');
  var saveButtonLocator = by.css('.e2e-test-save-button');
  var addFeatureRuleButtonLocator = by.css(
    '.e2e-test-feature-add-rule-button');
  var valueSelectorLocator = by.css('.e2e-test-value-selector');
  var serverModeSelectorLocator = by.css(
    '.e2e-test-server-mode-selector');
  var addConditionButtonLocator = by.css(
    '.e2e-test-add-condition-button');
  var rolesResultRowsElements = element.all(
    by.css('.e2e-test-roles-result-rows'));


  // The reload functions are used for mobile testing
  // done via Browserstack. These functions may cause
  // a problem when used to run tests directly on Travis.
  if (general.isInDevMode()) {
    var getExplorationTitleElement = function(explorationElement) {
      return explorationElement.element(explorationTitleLocator);
    };

    var getExplorationElementReloadButton = function(explorationElement) {
      return explorationElement.element(explorationButtonLocator);
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

    expect(await adminRolesTab.getAttribute('class')).toMatch('active');
    await waitFor.visibilityOf(
      adminRolesTabContainer, 'Roles tab page is not visible.');
  };

  var saveConfigProperty = async function(
      configProperty, propertyName, objectType, editingInstructions) {
    await waitFor.visibilityOf(
      configProperty.element(configTitleLocator),
      'Config Title taking too long too appear');
    var title = await configProperty.element(configTitleLocator).getText();
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
    await action.click('Admin features tab', featuresTab);
    await waitFor.visibilityOf(
      featureFlagElements.first(), 'Feature flags not showing up');
  };

  this.getDummyFeatureElement = async function() {
    var count = await featureFlagElements.count();
    for (let i = 0; i < count; i++) {
      var elem = featureFlagElements.get(i);
      if ((await elem.element(featureNameLocator).getText()) ===
          'dummy_feature') {
        return elem;
      }
    }

    return null;
  };

  // Remove this method after the end_chapter_celebration feature flag
  // is deprecated.
  this.getEndChapterCelebrationFeatureElement = async function() {
    var count = await featureFlagElements.count();
    for (let i = 0; i < count; i++) {
      var elem = featureFlagElements.get(i);
      if ((await elem.element(featureNameLocator).getText()) ===
          'end_chapter_celebration') {
        return elem;
      }
    }

    return null;
  };

  this.removeAllRulesOfFeature = async function(featureElement) {
    while (!await featureElement.isElementPresent(noRuleIndicatorLocator)) {
      await action.click(
        'Remove feature rule button',
        featureElement
          .element(removeRuleButtonLocator)
      );
    }
  };

  this.saveChangeOfFeature = async function(featureElement) {
    await action.click(
      'Save feature button',
      featureElement
        .element(saveButtonLocator)
    );

    await general.acceptAlert();
    await waitFor.visibilityOf(statusMessage);
  };

  this.enableFeatureForDev = async function(featureElement) {
    await this.removeAllRulesOfFeature(featureElement);

    await action.click(
      'Add feature rule button',
      featureElement
        .element(addFeatureRuleButtonLocator)
    );

    await action.sendKeys(
      'Rule value selector',
      featureElement
        .element(valueSelectorLocator),
      'Enabled');

    await action.click(
      'Add condition button',
      featureElement
        .element(addConditionButtonLocator)
    );

    await this.saveChangeOfFeature(featureElement);
  };

  // Remove this method after the end_chapter_celebration feature flag
  // is deprecated.
  this.enableFeatureForProd = async function(featureElement) {
    await this.removeAllRulesOfFeature(featureElement);

    await action.click(
      'Add feature rule button',
      featureElement
        .element(addFeatureRuleButtonLocator)
    );

    await action.sendKeys(
      'Rule value selector',
      featureElement
        .element(valueSelectorLocator),
      'Enabled');

    await action.click(
      'Add condition button',
      featureElement
        .element(addConditionButtonLocator)
    );

    await action.sendKeys(
      'Server mode selector',
      featureElement.element(serverModeSelectorLocator),
      'prod');

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
    var removeButtonElement = element(by.css(
      '.e2e-test-' + newRole.split(' ').join('-') +
      '-remove-button-container'));
    await waitFor.visibilityOf(
      removeButtonElement, 'Role removal button takes too long to appear.');
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
      await waitFor.visibilityOf(rolesResultRowsElements.first());
    }
    var usernames = await rolesResultRowsElements.map(async function(elm) {
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
