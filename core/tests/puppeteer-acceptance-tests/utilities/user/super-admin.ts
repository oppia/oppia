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

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const AdminPageRolesTab = testConstants.URLs.AdminPageRolesTab;
const AdminPageActivitiesTab = testConstants.URLs.AdminPageActivitiesTab;
const CommunityLibraryUrl = testConstants.URLs.CommunityLibrary;
const topicsAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;
const roleEditorInputField = 'input.e2e-test-username-for-role-editor';
const roleEditorButtonSelector = 'button.e2e-test-role-edit-button';
const rolesSelectDropdown = 'div.mat-select-trigger';
const addRoleButton = 'button.oppia-add-role-button';
const reloadExplorationRowsSelector = '.e2e-test-reload-exploration-row';
const reloadCollectionsRowsSelector = '.e2e-test-reload-collection-row';
const topicManagerRole = testConstants.Roles.TOPIC_MANAGER;

export class SuperAdmin extends BaseUser {
  /**
   * Navigates to the Admin Page Activities Tab.
   */
  async navigateToAdminPageActivitiesTab(): Promise<void> {
    await this.goto(AdminPageActivitiesTab);
  }

  /**
   * Navigates to the Admin Page Roles Tab.
   */
  async navigateToAdminPageRolesTab(): Promise<void> {
    await this.goto(AdminPageRolesTab);
  }

  /**
   * Navigates to the Topics and Skills Dashboard.
   */
  async navigateToTopicsAndSkillsDashboard(): Promise<void> {
    await this.goto(topicsAndSkillsDashboardUrl);
  }

  /**
   * The function to assign a role to a user.
   */
  async assignRoleToUser(
    username: string,
    role: string,
    topicName?: string
  ): Promise<void> {
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
        if (role === topicManagerRole) {
          await this.selectTopicForTopicManagerRole(topicName as string);
        }
        return;
      }
    }
    throw new Error(`Role ${role} does not exists.`);
  }

  /**
   * Selects a topic for the Topic Manager role.
   * @param {string} topicName - The name of the topic to select.
   */
  private async selectTopicForTopicManagerRole(
    topicName: string
  ): Promise<void> {
    await this.page.waitForSelector('.e2e-test-select-topic');
    const selectElement = await this.page.$('.e2e-test-select-topic');
    if (!selectElement) {
      throw new Error('Select element not found');
    }

    await this.page.waitForSelector('.e2e-test-select-topic option');
    const optionElements = await selectElement.$$('option');
    if (!optionElements.length) {
      throw new Error('No options found in the select element');
    }

    for (const optionElement of optionElements) {
      const optionText = await this.page.evaluate(
        el => el.textContent,
        optionElement
      );
      if (!optionText) {
        throw new Error('Option text not found');
      }

      if (optionText.trim() === topicName) {
        const optionValue = await this.page.evaluate(
          el => el.value,
          optionElement
        );
        if (!optionValue) {
          throw new Error('Option value not found');
        }

        await this.page.select('.e2e-test-select-topic', optionValue);
        await this.page.waitForSelector('.e2e-test-add-topic-button');
        const button = await this.page.$('.e2e-test-add-topic-button');
        if (!button) {
          throw new Error('Button not found');
        }
        await this.waitForElementToBeClickable(button);
        await button.click();

        return;
      }
    }

    throw new Error(`Topic "${topicName}" not found in the options`);
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

  /**
   * Unassigns a role from a user.
   * @param {string} username - The username of the user.
   */
  async unassignRoleFromUser(username: string, role: string): Promise<void> {
    role = role.replace(/ /g, '-');
    await this.goto(AdminPageRolesTab);
    await this.page.waitForSelector(roleEditorInputField);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    await this.page.waitForSelector(
      `.e2e-test-${role}-remove-button-container`
    );

    const deleteRoleButton = await this.page.$(
      `.e2e-test-${role}-remove-button-container`
    );
    if (!deleteRoleButton) {
      throw new Error(`User does not have the ${role} role!`);
    }

    await this.waitForElementToBeClickable(deleteRoleButton);
    await deleteRoleButton.click();
    showMessage(`Role ${role} has been removed from user ${username}`);
    return;
  }

  /**
   * Selects a role.
   * @param {string} role - The role to select.
   */
  async selectRole(role: string): Promise<void> {
    await this.navigateToAdminPageRolesTab();
    role = role.replace(/\b\w/g, char => char.toUpperCase());
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
    showMessage(`${actions} is/are allocated to the role`);
  }

  /**
   * Checks if the specified users are assigned to the current role.
   * @param {string[]} users - An array of usernames to check.
   */
  async expectRoleToHaveAssignedUsers(users: string[]): Promise<void> {
    await this.clickOn(' Assigned users ');
    for (const user of users) {
      const isUserPresent = await this.isTextPresentOnPage(user);
      if (!isUserPresent) {
        throw new Error(`User ${user} is not assigned to the role`);
      }
    }
    showMessage(`${users} is/are assigned to the role`);
  }

  /**
   * Reloads the specified exploration.
   * @param {string} explorationName - The name of the exploration to reload.
   */
  async reloadExplorations(explorationName: string): Promise<void> {
    await this.page.waitForSelector(reloadExplorationRowsSelector);
    const reloadExplorationRows = await this.page.$$(
      reloadExplorationRowsSelector
    );
    console.log(reloadExplorationRows.length);

    for (let i = 0; i < reloadExplorationRows.length; i++) {
      const explorationNameElement = await reloadExplorationRows[i].$(
        '.e2e-test-reload-exploration-title'
      );
      const name = await this.page.evaluate(
        element => element.innerText,
        explorationNameElement
      );
      console.log(name);

      if (name === ` ${explorationName} `) {
        await reloadExplorationRows[i].waitForSelector(
          '.e2e-test-reload-exploration-button'
        );
        const reloadButton = await reloadExplorationRows[i].$(
          '.e2e-test-reload-exploration-button'
        );
        console.log('third');

        if (!reloadButton) {
          throw new Error(
            `Failed to find reload button for exploration "${explorationName}"`
          );
        }
        await this.waitForElementToBeClickable(reloadButton);
        await reloadButton.click();
        await this.page.waitForNetworkIdle();
        await this.clickOn('OK');
        return;
      }
    }

    throw new Error(`Failed to find exploration "${explorationName}"`);
  }

  async expectExplorationToBePresent(explorationName: string): Promise<void> {
    await this.type('input.e2e-test-search-input', explorationName);
    const isExplorationPresent =
      await this.isTextPresentOnPage(explorationName);
    if (!isExplorationPresent) {
      throw new Error(`Exploration ${explorationName} is not present`);
    }
  }

  async navigateToCommunityLibrary(): Promise<void> {
    await this.goto(CommunityLibraryUrl);
  }

  async reloadCollections(collectionName: string): Promise<void> {
    await this.page.waitForSelector(reloadCollectionsRowsSelector);
    const reloadExplorationRows = await this.page.$$(
      reloadCollectionsRowsSelector
    );
    for (let i = 0; i < reloadExplorationRows.length; i++) {
      const explorationNameElement = await reloadExplorationRows[i].$(
        '.e2e-test-reload-collection-title'
      );
      const name = await this.page.evaluate(
        element => element.innerText,
        explorationNameElement
      );
      if (name === ` ${collectionName} `) {
        const reloadButton = await reloadExplorationRows[i].$(
          '.e2e-test-reload-collection-button'
        );
        if (reloadButton) {
          await reloadButton.evaluate(element =>
            (element as HTMLElement).click()
          );
          await this.page.waitForNetworkIdle();
          return;
        }
      }
    }
  }

  async expectCollectionToBePresent(collectionName: string): Promise<void> {
    await this.type('input.e2e-test-search-input', collectionName);
    const isCollectionPresent = await this.isTextPresentOnPage(collectionName);
    if (!isCollectionPresent) {
      throw new Error(`Collection ${collectionName} is not present`);
    }
  }

  async generateAndPublishDummyExplorations(
    noToGenerate: number,
    noToPublish: number
  ): Promise<void> {
    await this.type(
      '.label-target-explorations-to-generate',
      noToGenerate.toString()
    );
    await this.type(
      '.label-target-explorations-to-publish',
      noToPublish.toString()
    );
    await this.clickOn(' Generate Explorations ');
  }

  async expectNoOfExplorationToBePresent(
    expectedNumber: number
  ): Promise<void> {
    const noOfExplorations = await this.page.$$(
      '.label-target-no-of-explorations'
    );

    if (noOfExplorations.length !== expectedNumber) {
      throw new Error('No explorations are present');
    }
  }

  async loadDummyNewStructuresData(): Promise<void> {
    await this.clickOn(' Load Data ');
  }

  /**
   * Checks if the 'Activities' tab is not available in the production environment.
   */
  async expectControlsNotAvailable(): Promise<void> {
    try {
      const activitiesTabElement = await this.page.$(
        'oppia-admin-prod-mode-activities-tab'
      );
      const activitiesTabText = await this.page.evaluate(
        element => element.textContent,
        activitiesTabElement
      );

      const expectedText =
        "The 'Activities' tab is not available in the production environment.";

      if (activitiesTabText.trim() !== expectedText) {
        throw new Error(
          'Activities tab is present in the production environment'
        );
      }

      showMessage(
        'Activities tab is not available in the production environment, as expected.'
      );
    } catch (error) {
      console.error(
        'An error occurred while checking the availability of the Activities tab:',
        error
      );
      throw error;
    }
  }
}

export let SuperAdminFactory = (): SuperAdmin => new SuperAdmin();
