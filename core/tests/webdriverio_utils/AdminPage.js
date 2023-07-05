// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the admin page, for use in WebdriverIO
 * tests.
 */

var action = require('./action.js');
var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');

var AdminPage = function() {
  var ADMIN_URL_SUFFIX = '/admin';
  var addNewRoleButton = $('.e2e-test-add-new-role-button');
  var adminRolesTab = $('.e2e-test-admin-roles-tab');
  var adminRolesTabContainer = $('.e2e-test-roles-tab-container');
  var configTab = $('.e2e-test-admin-config-tab');
  var editUserRoleButton = $('.e2e-test-role-edit-button');
  var explorationElementsSelector = function() {
    return $$('.e2e-test-reload-exploration-row');
  };
  var progressSpinner = $('.e2e-test-progress-spinner');
  var reloadCollectionButtonsSelector = function() {
    return $$('.e2e-test-reload-collection-button');
  };
  var reloadCollectionButtonsSelector = function() {
    return $$('.e2e-test-reload-collection-button');
  };
  var roleDropdown = $('.e2e-test-role-method');
  var roleEditorContainer = $('.e2e-test-roles-editor-card-container');
  var rolesResultRowsElement = $('.e2e-test-roles-result-rows');
  var rolesResultRowsElementsSelector = function() {
    return $$('.e2e-test-roles-result-rows');
  };
  var roleSelector = $('.e2e-test-new-role-selector');
  var roleValueOption = $('.e2e-test-role-value');
  var saveAllConfigs = $('.e2e-test-save-all-configs');

  var statusMessage = $('.e2e-test-status-message');
  var userRoleItemsSelector = function() {
    return $$('.e2e-test-user-role-description');
  };
  var usernameInputFieldForRolesEditing = $(
    '.e2e-test-username-for-role-editor');
  var viewRoleButton = $('.e2e-test-role-success');

  // The reload functions are used for mobile testing
  // done via Browserstack. These functions may cause
  // a problem when used to run tests directly on Travis.
  if (general.isInDevMode()) {
    var getExplorationTitleElement = function(explorationElement) {
      return explorationElement.$(explorationTitleLocator);
    };

    var getExplorationElementReloadButton = function(explorationElement) {
      return explorationElement.$(explorationButtonLocator);
    };

    this.reloadCollection = async function(collectionId) {
      await this.get();
      var reloadCollectionButton = (
        await reloadCollectionButtonsSelector()[collectionId]);
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
      var explorationElements = explorationElementsSelector();
      await explorationElements.map(async function(explorationElement) {
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
    let width = (await browser.getWindowSize()).width;
    if (width < 711) {
      // TODO(#15562): Add proper mobile navigation after this has been fixed.
      await browser.url('/admin#/roles');
    } else {
      await action.click('Admin roles tab button', adminRolesTab);
    }

    await expect(await adminRolesTab.getAttribute('class')).toMatch('active');
    await waitFor.visibilityOf(
      adminRolesTabContainer, 'Roles tab page is not visible.');
  };

  var saveConfigProperty = async function(
      configProperty, propertyName, objectType, editingInstructions) {
    await waitFor.visibilityOf(
      configProperty.$('.e2e-test-config-title'),
      'Config Title taking too long too appear');
    var title = await configProperty.$('.e2e-test-config-title').getText();
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
    await browser.url(ADMIN_URL_SUFFIX);
    await waitFor.pageToFullyLoad();
  };

  this.getJobsTab = async function() {
    await browser.url(ADMIN_URL_SUFFIX + '#/jobs');
    await waitFor.pageToFullyLoad();
  };

  this.editConfigProperty = async function(
      propertyName, objectType, editingInstructions) {
    await this.get();

    let width = (await browser.getWindowSize()).width;

    if (width < 711) {
      // TODO(#15562): Add proper mobile navigation after this has been fixed.
      await browser.url('admin#/config');
    } else {
      await action.click('Config Tab', configTab);
    }

    await waitFor.elementToBeClickable(saveAllConfigs);

    var results = [];
    var configProperties = await $$('.e2e-test-config-property');
    for (let configProperty of configProperties) {
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
    await action.setValue(
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
    var removeButtonElement = $(
      '.e2e-test-' + newRole.split(' ').join('-') +
      '-remove-button-container');
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
    var userRoleItems = userRoleItemsSelector();
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
      await waitFor.visibilityOf(rolesResultRowsElement);
    }
    var rolesResultRowsElements = rolesResultRowsElementsSelector();
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
