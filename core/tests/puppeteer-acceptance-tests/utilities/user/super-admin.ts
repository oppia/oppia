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

import { BaseUser } from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import { showMessage } from '../common/show-message';

const AdminPageRolesTab = testConstants.URLs.AdminPageRolesTab;
const roleEditorInputField = 'input.e2e-test-username-for-role-editor';
const roleEditorButtonSelector = 'button.e2e-test-role-edit-button';
const rolesSelectDropdown = 'div.mat-select-trigger';
const addRoleButton = 'button.oppia-add-role-button';

export class SuperAdmin extends BaseUser {
  async navigateToAdminPage(): Promise<void> {
    await this.goto(testConstants.URLs.AdminPage);
  }

  async navigateToRolesTab(): Promise<void> {
    await this.goto(AdminPageRolesTab);
  }
  /**
   * The function to assign a role to a user.
   */
  async assignRoleToUser(username: string, role: string): Promise<void> {
    await this.goto(AdminPageRolesTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.clickOn(addRoleButton);
    await this.clickOn(rolesSelectDropdown);
    const allRoleElements = await this.page.$$('.mat-option-text');
    for (let i = 0; i < allRoleElements.length; i++) {
      const roleText = await this.page.evaluate(
        (element: HTMLElement) => element.innerText,
        allRoleElements[i]
      );
      if (roleText.toLowerCase() === role) {
        await allRoleElements[i].evaluate(element =>
          (element as HTMLElement).click()
        );
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
    const userRoleElements = await this.page.$$('.oppia-user-role-description');
    for (let i = 0; i < userRoleElements.length; i++) {
      const roleText = await this.page.evaluate(
        (element: HTMLElement) => element.innerText,
        userRoleElements[i]
      );
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
    const userRoleElements = await this.page.$$('.oppia-user-role-description');
    for (let i = 0; i < userRoleElements.length; i++) {
      const roleText = await this.page.evaluate(
        (element: HTMLElement) => element.innerText,
        userRoleElements[i]
      );
      if (roleText.toLowerCase() === role) {
        throw new Error(`User has the ${role} role!`);
      }
    }
    showMessage(`User ${username} does not have the ${role} role!`);
    await this.goto(currentPageUrl);
  }

  async unassignRoleFromUser(username: string, role: string): Promise<void> {
    await this.goto(AdminPageRolesTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    const userRoleElements = await this.page.$$('.oppia-user-role-description');
    for (let i = 0; i < userRoleElements.length; i++) {
      const roleText = await this.page.evaluate(
        (element: HTMLElement) => element.innerText,
        userRoleElements[i]
      );
      if (roleText.toLowerCase() === role) {
        const unassignButton = await userRoleElements[i].$(
          '.oppia-unassign-role-button'
        );
        if (unassignButton) {
          await unassignButton.evaluate(element =>
            (element as HTMLElement).click()
          );
          await this.page.waitForNetworkIdle();
          return;
        }
      }
    }
    throw new Error(`User does not have the ${role} role!`);
  }

  async selectRole(role: string): Promise<void> {
    await this.clickOn(role);
  }

  /**
   * This function checks if the allocated actions for a role are present on the page.
   * @param {string[]} actions - The actions to check for.
   */
  async expectRoleToHaveAllocatedActions(actions: string[]): Promise<void> {
    for (const action of actions) {
      const isActionPresent = await this.isTextPresentOnPage(action);
      if (!isActionPresent) {
        throw new Error(`Action ${action} is not allocated to the role`);
      }
    }
  }

  /**
   * Function to Navigate to the page of the specified role and opens the list of assigned users.
   * @param {string} role - The name of the role to view.
   */
  async viewUsersAssignedToRole(role: string) {
    await this.clickOn(role);
    await this.clickOn(' Assigned users ');
  }

  /**
   * Checks if the specified users are assigned to the current role.
   * @param {string[]} users - An array of usernames to check.
   */
  async expectRoleToHaveAssignedUsers(users: string[]): Promise<void> {
    for (const user of users) {
      const isActionPresent = await this.isTextPresentOnPage(user);
      if (!isActionPresent) {
        throw new Error(`User ${user} is not assigned to the role`);
      }
    }
  }
}

export let SuperAdminFactory = (): SuperAdmin => new SuperAdmin();
