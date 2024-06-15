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

const topicManagerRole = testConstants.Roles.TOPIC_MANAGER;

const roleEditorInputField = 'input.e2e-test-username-for-role-editor';
const roleEditorButtonSelector = 'button.e2e-test-role-edit-button';
const rolesSelectDropdown = 'div.mat-select-trigger';
const addRoleButton = 'button.oppia-add-role-button';

const topicsTab = 'a.e2e-test-topics-tab';
const skillsTab = 'a.e2e-test-skills-tab';

const reloadExplorationRowsSelector = '.e2e-test-reload-exploration-row';
const reloadCollectionsRowsSelector = '.e2e-test-reload-collection-row';

export class SuperAdmin extends BaseUser {
  /**
   * Navigates to the Admin Page Activities Tab.
   */
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
   * Navigates to the blog page.
   */
  async navigateToBlogPage(): Promise<void> {
    await this.goto(testConstants.URLs.Blog);
  }

  /**
   * Navigates to the community library page.
   */
  async navigateToCommunityLibrary(): Promise<void> {
    await this.goto(CommunityLibraryUrl);
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
    await this.navigateToAdminPageActivitiesTab();
    await this.page.waitForSelector(reloadExplorationRowsSelector);
    const reloadExplorationRows = await this.page.$$(
      reloadExplorationRowsSelector
    );

    for (let i = 0; i < reloadExplorationRows.length; i++) {
      const explorationNameElement = await reloadExplorationRows[i].$(
        '.e2e-test-reload-exploration-title'
      );
      const name = await this.page.evaluate(
        element => element.innerText,
        explorationNameElement
      );

      if (name === `${explorationName}`) {
        await reloadExplorationRows[i].waitForSelector(
          '.e2e-test-reload-exploration-button'
        );
        const reloadButton = await reloadExplorationRows[i].$(
          '.e2e-test-reload-exploration-button'
        );

        if (!reloadButton) {
          throw new Error(
            `Failed to find reload button for exploration "${explorationName}"`
          );
        }
        await this.waitForElementToBeClickable(reloadButton);
        await reloadButton.click();
        await this.page.waitForNetworkIdle();
        showMessage(`Reloaded exploration ${explorationName}`);
        return;
      }
    }

    throw new Error(`Failed to find exploration "${explorationName}"`);
  }

  /**
   * Checks if a given activity is present on the page.
   * @param {string} activityName - The name of the activity to check.
   */
  async expectActivityToBePresent(activityName: string): Promise<void> {
    try {
      await this.page.waitForSelector('input.e2e-test-search-input', {
        visible: true,
      });
      await this.type('input.e2e-test-search-input', activityName);

      const isActivityPresent = await this.isTextPresentOnPage(activityName);
      if (!isActivityPresent) {
        throw new Error(`Activity ${activityName} is not present`);
      }

      showMessage(`Activity ${activityName} is present`);
    } catch (error) {
      console.error(
        `An error occurred while checking the presence of the activity "${activityName}":`,
        error
      );
      throw error;
    }
  }

  /**
   * Reloads a specific collection by its name.
   * @param {string} collectionName - The name of the collection to reload.
   */
  async reloadCollections(collectionName: string): Promise<void> {
    try {
      await this.navigateToAdminPageActivitiesTab();
      await this.page.waitForSelector(reloadCollectionsRowsSelector);

      const reloadCollectionRows = await this.page.$$(
        reloadCollectionsRowsSelector
      );
      for (let i = 0; i < reloadCollectionRows.length; i++) {
        const collectionNameElement = await reloadCollectionRows[i].$(
          '.e2e-test-reload-collection-title'
        );
        await this.page.waitForSelector('.e2e-test-reload-collection-title', {
          visible: true,
        });

        const name = await this.page.evaluate(
          element => element.innerText,
          collectionNameElement
        );
        if (name.trim() === collectionName) {
          const reloadButton = await reloadCollectionRows[i].$(
            '.e2e-test-reload-collection-button'
          );
          await this.page.waitForSelector(
            '.e2e-test-reload-collection-button',
            {visible: true}
          );

          if (!reloadButton) {
            throw new Error(
              `Reload button not found for collection "${collectionName}"`
            );
          }
          await this.waitForElementToBeClickable(reloadButton);
          await reloadButton.click();
          return;
        }
      }

      throw new Error(`Collection "${collectionName}" not found`);
    } catch (error) {
      console.error(
        `An error occurred while reloading the collection "${collectionName}":`,
        error
      );
      throw error;
    }
  }

  /**
   * Generates and publishes dummy activities.
   * @param {number} noToGenerate - The number of activities to generate.
   * @param {number} noToPublish - The number of activities to publish.
   */
  async generateAndPublishDummyExplorations(
    noToGenerate: number,
    noToPublish: number
  ): Promise<void> {
    await this.navigateToAdminPageActivitiesTab();
    await this.page.waitForSelector('#label-target-explorations-to-generate', {
      visible: true,
    });
    await this.type(
      '#label-target-explorations-to-generate',
      noToGenerate.toString()
    );

    await this.page.waitForSelector('#label-target-explorations-to-publish', {
      visible: true,
    });
    await this.type(
      '#label-target-explorations-to-publish',
      noToPublish.toString()
    );

    await this.page.waitForSelector('.oppia-generate-exploration-text', {
      visible: true,
    });
    await this.clickOn(' Generate Explorations ');
  }

  /**
   * Checks if the expected number of activities is present on the page.
   * @param {number} expectedNumber - The expected number of activities.
   */
  async expectNoOfActivitiesToBePresent(expectedNumber: number): Promise<void> {
    await this.page.waitForSelector('.e2e-test-exploration-dashboard-card', {
      visible: true,
    });
    const noOfActivities = await this.page.$$(
      '.e2e-test-exploration-dashboard-card'
    );

    if (noOfActivities.length !== expectedNumber) {
      throw new Error(
        `Expected ${expectedNumber} activities, but found ${noOfActivities.length}`
      );
    }
    showMessage('Expected number of activities are present');
  }

  /**
   * Loads dummy new structures data.
   * This function navigates to the Admin Page Activities Tab and
   * clicks on the 'Load Data' button.
   */
  async loadDummyNewStructuresData(): Promise<void> {
    await this.navigateToAdminPageActivitiesTab();
    await this.clickOn(' Load Data ');
  }
  /**
   * Function to check if a topic is present in the Topics and Skills Dashboard.
   * @param {string} topicName - The name of the topic to check.
   */
  async expectTopicInTopicsAndSkillDashboard(topicName: string): Promise<void> {
    await this.navigateToTopicsAndSkillsDashboard();
    await this.clickOn(topicsTab);
    const isTopicPresent = await this.isTextPresentOnPage(topicName);
    if (!isTopicPresent) {
      throw new Error(
        `Topic "${topicName}" was not found.
         It was expected to be present in Topics and Skills Dashboard.`
      );
    } else {
      showMessage(
        `The topic "${topicName}" is present on the Topics and Skills
         Dashboard as expected.`
      );
    }
  }
  /**
   * Function to check if a skill is present in the Topics and Skills Dashboard.
   * @param {string} skillName - The name of the skill to check.
   */
  async expectSkillInTopicsAndSkillsDashboard(
    skillName: string
  ): Promise<void> {
    await this.navigateToTopicsAndSkillsDashboard();
    await this.clickOn(skillsTab);
    const isSkillPresent = await this.isTextPresentOnPage(skillName);
    if (!isSkillPresent) {
      throw new Error(
        `Skill "${skillName}" was not found.
         It was expected to be present in Topics and Skills Dashboard.`
      );
    } else {
      showMessage(
        `The skill "${skillName}" is present on the Topics and Skills
         Dashboard as expected.`
      );
    }
  }

  /**
   * Generates a dummy skill.
   */
  async generateDummySkill(): Promise<void> {
    await this.navigateToAdminPageActivitiesTab();
    await this.clickOn(' Generate Data ');
  }

  /**
   * Generates a dummy math classroom.
   */
  async generateDummyMathClassroom(): Promise<void> {
    await this.navigateToAdminPageActivitiesTab();
    await this.page.waitForSelector('.load-dummy-math-classroom');
    await this.clickOn('.load-dummy-math-classroom');
  }

  /**
   * Checks if the math classroom is present at the given URL.
   * @param {string} Url - The URL to check.
   */
  async expectMathClassroomToBePresentAtTheUrl(Url: string): Promise<void> {
    await this.goto(Url);
    const isClassroomPresent = await this.isTextPresentOnPage(
      'The Oppia Classroom'
    );
    if (isClassroomPresent) {
      showMessage('The Oppia Math Classroom is present at the URL as expected');
    } else {
      throw new Error(
        `The Oppia Math Classroom is not present at the ${Url} url`
      );
    }
  }

  /**
   * Generates a specific blog post.
   * @param {string} blogPostTitle - The title of the blog post to generate.
   */
  async generateDummyBlogPost(blogPostTitle: string): Promise<void> {
    await this.navigateToAdminPageActivitiesTab();
    const generateButton = await this.page.$(
      `.generate-blog-post-${blogPostTitle}`
    );
    if (generateButton) {
      await generateButton.click();
    }
  }

  /**
   * Checks if the blog post is present.
   * @returns {Promise<void>}
   */
  async expectBlogPostToBePresent(BlogName: string): Promise<void> {
    await this.navigateToBlogPage();
    const isBlogPostPresent = await this.isTextPresentOnPage(BlogName);
    if (!isBlogPostPresent) {
      throw new Error('The blog post was not found on the blog dashboard.');
    }
    showMessage('The blog post is present on the blog dashboard.');
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
