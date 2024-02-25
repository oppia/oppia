// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Super Admin users utility file.
 */

const baseUser = require(
  '../puppeteer-testing-utilities/puppeteer-utils.js');
const testConstants = require(
  '../puppeteer-testing-utilities/test-constants.js');
const { showMessage } = require(
  '../puppeteer-testing-utilities/show-message-utils.js');

const AdminPageRolesTab = testConstants.URLs.AdminPageRolesTab;
const roleEditorInputField = 'input.e2e-test-username-for-role-editor';
const roleEditorButtonSelector = 'button.e2e-test-role-edit-button';
const rolesSelectDropdown = 'div.mat-select-trigger';
const addRoleButton = 'button.oppia-add-role-button';

module.exports = class e2eSuperAdmin extends baseUser {
  /**
   * The function to assign a role to a user.
   * @param {string} username - The username to which role would be assigned.
   * @param {string} role - The role that would be assigned to the user.
   */
  async assignRoleToUser(username, role) {
    await this.goto(AdminPageRolesTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.clickOn(addRoleButton);
    await this.clickOn(rolesSelectDropdown);
    await this.page.evaluate(async(role) => {
      const allRoles = document.getElementsByClassName('mat-option-text');
      for (let i = 0; i < allRoles.length; i++) {
        if (allRoles[i].innerText.toLowerCase() === role) {
          allRoles[i].click({waitUntil: 'networkidle0'});
          return;
        }
      }
      throw new Error(`Role ${role} does not exists.`);
    }, role);
  }

  /**
   * The function excepts the user to have the given role.
   * @param {string} username - The username to which role must be assigned.
   * @param {string} role - The role which must be assigned to the user.
   */
  async expectUserToHaveRole(username, role) {
    const currentPageUrl = this.page.url();
    await this.goto(AdminPageRolesTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    await this.page.evaluate((role) => {
      const userRoles = document.getElementsByClassName(
        'oppia-user-role-description');
      for (let i = 0; i < userRoles.length; i++) {
        if (userRoles[i].innerText.toLowerCase() === role) {
          return;
        }
      }
      throw new Error(`User does not have the ${role} role!`);
    }, role);
    showMessage(`User ${username} has the ${role} role!`);
    await this.goto(currentPageUrl);
  }

  /**
   * The function excepts the user to not have the given role.
   * @param {string} username - The user to which the role must not be assigned.
   * @param {string} role - The role which must not be assigned to the user.
   */
  async expectUserNotToHaveRole(username, role) {
    const currentPageUrl = this.page.url();
    await this.goto(AdminPageRolesTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    await this.page.evaluate((role) => {
      const userRoles = document.getElementsByClassName(
        'oppia-user-role-description');
      for (let i = 0; i < userRoles.length; i++) {
        if (userRoles[i].innerText.toLowerCase() === role) {
          throw new Error(`User has the ${role} role!`);
        }
      }
    }, role);
    showMessage(`User ${username} does not have the ${role} role!`);
    await this.goto(currentPageUrl);
  }
};
