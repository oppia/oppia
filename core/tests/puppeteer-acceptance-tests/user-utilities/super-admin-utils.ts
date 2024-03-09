// Copyright 2024 The Oppia Authors. All Rights Reserved.
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

import { IBaseUser, BaseUser } from
  '../puppeteer-testing-utilities/puppeteer-utils';
import testConstants from
  '../puppeteer-testing-utilities/test-constants';
import { showMessage } from
  '../puppeteer-testing-utilities/show-message-utils';

const AdminPageRolesTab = testConstants.URLs.AdminPageRolesTab;
const roleEditorInputField = 'input.e2e-test-username-for-role-editor';
const roleEditorButtonSelector = 'button.e2e-test-role-edit-button';
const rolesSelectDropdown = 'div.mat-select-trigger';
const addRoleButton = 'button.oppia-add-role-button';

export interface ISuperAdmin extends IBaseUser {
  assignRoleToUser: (username: string, role: string) => Promise<void>;
  expectUserToHaveRole: (username: string, role: string) => Promise<void>;
  expectUserNotToHaveRole: (username: string, role: string) => Promise<void>;
}

class SuperAdmin extends BaseUser implements ISuperAdmin {
  /**
   * The function to assign a role to a user.
   */
  async assignRoleToUser(username: string, role: string): Promise<void> {
    await this.goto(AdminPageRolesTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.clickOn(addRoleButton);
    await this.clickOn(rolesSelectDropdown);
    const allRoles = await this.page.$$('.mat-option-text');
    for (let i = 0; i < allRoles.length; i++) {
      const roleText = await this.page.evaluate(
        (role: HTMLElement) => role.innerText, allRoles[i]);
      if (roleText.toLowerCase() === role) {
        await allRoles[i].click();
        await this.page.waitForNetworkIdle();
        return;
      }
    }
    throw new Error(`Role ${role} does not exists.`);
  }

  /**
   * The function expects the user to have the given role.
   */
  async expectUserToHaveRole(username: string, role: string): Promise<void> {
    const currentPageUrl = this.page.url();
    await this.goto(AdminPageRolesTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    const userRoles = await this.page.$$('.oppia-user-role-description');
    for (let i = 0; i < userRoles.length; i++) {
      const roleText = await this.page.evaluate(
        (role: HTMLElement) => role.innerText, userRoles[i]);
      if (roleText.toLowerCase() === role) {
        showMessage(`User ${username} has the ${role} role!`);
        await this.goto(currentPageUrl);
        return;
      }
    }
    throw new Error(`User does not have the ${role} role!`);
  }

  /**
   * The function expects the user to not have the given role.
   */
  async expectUserNotToHaveRole(username: string, role: string): Promise<void> {
    const currentPageUrl = this.page.url();
    await this.goto(AdminPageRolesTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    const userRoles = await this.page.$$('.oppia-user-role-description');
    for (let i = 0; i < userRoles.length; i++) {
      const roleText = await this.page.evaluate(
        (role: HTMLElement) => role.innerText, userRoles[i]);
      if (roleText.toLowerCase() === role) {
        throw new Error(`User has the ${role} role!`);
      }
    }
    showMessage(`User ${username} does not have the ${role} role!`);
    await this.goto(currentPageUrl);
  }
}

export let SuperAdminFactory = (): ISuperAdmin => new SuperAdmin();
