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
var waitFor = require('./waitFor.js');

var AdminPage = function() {
  var ADMIN_URL_SUFFIX = '/admin';

  this.get = async function() {
    await browser.url(ADMIN_URL_SUFFIX);
    await waitFor.pageToFullyLoad();
  };

  var _switchToRolesTab = async function() {
    var adminRolesTab = $('.e2e-test-admin-roles-tab');
    await action.click('Admin roles tab button', adminRolesTab);

    await expect(await adminRolesTab.getAttribute('class')).toMatch('active');
    var adminRolesTabContainer = (
      $('.e2e-test-roles-tab-container'));
    await waitFor.visibilityOf(
      adminRolesTabContainer, 'Roles tab page is not visible.');
  };

  this._editUserRole = async function(username) {
    await this.get();
    await _switchToRolesTab();
    var usernameInputFieldForRolesEditing = (
      $('.e2e-test-username-for-role-editor'));
    await action.keys(
      'Username input field', usernameInputFieldForRolesEditing, username);
    var editUserRoleButton = $('.e2e-test-role-edit-button');
    await action.click('Edit user role button', editUserRoleButton);
    var roleEditorContainer = (
      $('.e2e-test-roles-editor-card-container'));
    await waitFor.visibilityOf(
      roleEditorContainer, 'Role editor card takes too long to appear.');
  };

  this.addRole = async function(name, newRole) {
    await this._editUserRole(name);

    var addNewRoleButton = $('.e2e-test-add-new-role-button');
    await action.click('Add new role', addNewRoleButton);
    var roleSelector = $('.e2e-test-new-role-selector');
    await action.matSelect('New role selector', roleSelector, newRole);

    var progressSpinner = $('.e2e-test-progress-spinner');
    await waitFor.invisibilityOf(
      progressSpinner, 'Progress spinner is taking too long to disappear.');
    var removeButtonElement = $(
      '.e2e-test-' + newRole.split(' ').join('-') +
      '-remove-button-container');
    await waitFor.visibilityOf(
      removeButtonElement, 'Role removal button takes too long to appear.');
  };
};

exports.AdminPage = AdminPage;
