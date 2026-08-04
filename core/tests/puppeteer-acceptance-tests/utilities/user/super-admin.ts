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

import puppeteer, {ElementHandle} from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

// URLs.
const adminPageActivitiesTab = testConstants.URLs.AdminPageActivitiesTab;
const adminPagePlatformParametersTab =
  testConstants.URLs.AdminPagePlatformParametersTab;
const adminPageRolesTab = testConstants.URLs.AdminPageRolesTab;
const adminPageMiscTab = testConstants.URLs.AdminPageMiscTab;
const communityLibraryUrl = testConstants.URLs.CommunityLibrary;
const topicsAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;

// Roles.
const topicManagerRole = testConstants.Roles.TOPIC_MANAGER;

// Admin Page.
const actionStatusMessageSelector = '.e2e-test-status-message';
const addRoleButton = 'button.oppia-add-role-button';
const roleEditorButtonSelector = 'button.e2e-test-role-edit-button';
const roleEditorInputField = 'input.e2e-test-username-for-role-editor';
const rolesSelectDropdown = 'div.mat-select-trigger';
const userRoleDescriptionSelector = '.oppia-user-role-description';

// Blog Post.
const generateBlogPostButton = '.e2e-test-generate-blog-post';
const blogPostTitleSelector = '.e2e-test-blog-post-tile-title';

// Community Library.
const searchFieldCommunityLibrary = 'input.e2e-test-search-input';

// Exploration.
const explorationTileSelector = '.e2e-test-exploration-dashboard-card';
const generateExplorationButton = '.oppia-generate-exploration-text';
const noOfExplorationToGeneratorField =
  '#label-target-explorations-to-generate';
const noOfExplorationToPublishField = '#label-target-explorations-to-generate';
const reloadExplorationButton = '.e2e-test-reload-exploration-button';
const reloadExplorationRowsSelector = '.e2e-test-reload-exploration-row';
const reloadExplorationTitle = '.e2e-test-reload-exploration-title';

// Platform Parameters.
const addConditionButton = '.e2e-test-add-condition-button';
const addRuleButtonSelector = '.e2e-test-parameter-add-rule-button';
const defaultParamValueDivSelector = '.e2e-test-param-default-value';
const editParamButton = '.oppia-edit-param-button';
const paramRuleItemHeaderSelector = '.oppia-rule-item-header';
const paramSaveChangesButton = '.save-button-container';
const paramValueInput = '.e2e-test-text-input';
const platformParameterNameSelector = '.e2e-test-parameter-name';
const platformParameterSelector = '.e2e-test-platform-param';
const serverModeSelector = '.e2e-test-server-mode-selector';

// Skills and Topics.
const addTopicButton = '.e2e-test-add-topic-button';
const justifyContentDiv = 'div.justify-content-between';
const selectTopicForAssignmentSelector = '.e2e-test-select-topic';
const skillsTab = 'a.e2e-test-skills-tab';
const topicsTab = 'a.e2e-test-topics-tab';

// Collections.
const reloadCollectionButton = '.e2e-test-reload-collection-button';
const reloadCollectionTitleSelector = '.e2e-test-reload-collection-title';
const reloadCollectionsRowsSelector = '.e2e-test-reload-collection-row';

// Other.
const loadDummyMathClassRoomButton = '.load-dummy-math-classroom';
const prodModeActivitiesTab = 'oppia-admin-prod-mode-activities-tab';

// Misc Tab selectors.
const topicIdInputSelector = '.e2e-test-topic-id-input';
const regenerateOpportunitiesButton =
  '.e2e-test-regenerate-opportunities-button';
const regenerateTopicSummariesButton =
  '.e2e-test-regenerate-topic-summaries-button';
const blogIdInputSelector = '.e2e-test-blog-id-input';
const blogAuthorInputSelector = '.e2e-test-blog-author-name-input';
const blogPublishedOnInputSelector = '.e2e-test-blog-published-on-input';
const updateBlogPostButtonSelector = '.e2e-test-update-blog-post-button';
const rollbackExplorationButton = '.e2e-test-rollback-exploration-button';
const explorationIdInputSelector = '.e2e-test-exploration-id-input';
const updateUserNameButtonSelector = '.e2e-test-update-username-button';
const oldUserNameInputSelector = '.e2e-test-old-username-input';
const newUserNameInputSelector = '.e2e-test-new-username-input';
const getPendingDeletionRequestsCountButton =
  '.e2e-test-get-deletion-request-button';
const explorationIdToGetInteractionsInput =
  '.e2e-test-exploration-id-to-get-interactions-input';
const getInteractionsButton = '.e2e-test-get-interactions-button';
const grantSuperAdminButtonSelector = '.e2e-test-grant-super-admin-button';
const usernameToGrantPrivilegeInput = '.e2e-test-username-to-grant-input';
const revokeSuperAdminButton = '.e2e-test-revoke-super-admin-button';
const usernameToRevokePrivilegeInput = '.e2e-test-username-to-revoke-input';
const saveAutogenerationToggleButtonSelector =
  '.e2e-test-save-autogeneration-toggle-button';
const enableAutogenerationToggleSelector =
  '.e2e-test-cloud-service-autogeneration-toggle';
const assignedTopicSelector = '.e2e-test-assigned-topic';
const selectedRoleHeadingSelector = '.e2e-test-active-role';
const languageSelectorCloseButtonSelector =
  '.e2e-test-language-selector-close-button';
const languageSelectorBodySelector = '.e2e-test-language-selector-modal-body';
const addLanguageButtonSelector = '.e2e-test-language-selector-add-button';
const selectedLanguageSelector = '.e2e-test-selected-language';

const platformParameterTabContainerSelector =
  'oppia-admin-platform-parameters-tab';
const userRolesTabContainerSelector = 'oppia-admin-roles-tab';
const userRolesVisualizationContainerSelector =
  'oppia-roles-and-actions-visualizer';
const platformParameterDefaultValueContainerSelector =
  '.e2e-test-platform-param-default-value-container';

export class SuperAdmin extends BaseUser {
  /**
   * Navigates to the Admin Page Activities Tab.
   */
  async navigateToAdminPageActivitiesTab(): Promise<void> {
    await this.goto(adminPageActivitiesTab);
  }

  async navigateToAdminPageMiscTab(): Promise<void> {
    await this.goto(adminPageMiscTab);
  }

  /**
   * Navigates to the Admin Page Roles Tab.
   */
  async navigateToAdminPageRolesTab(): Promise<void> {
    await this.goto(adminPageRolesTab);
    await this.expectElementToBeVisible(userRolesTabContainerSelector);
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
    await this.goto(communityLibraryUrl);
  }

  /**
   * Navigates to the Admin Page Platform Parameters Tab.
   */
  async navigateToAdminPagePlatformParametersTab(): Promise<void> {
    await this.goto(adminPagePlatformParametersTab);
    await this.expectElementToBeVisible(platformParameterTabContainerSelector);
  }

  /**
   * Navigates to the Admin Page Roles Tab.
   */
  async expectUserRolesVisualizerToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(
      userRolesVisualizationContainerSelector
    );
  }

  /**
   * The function to assign a role to a user.
   * @param {string} username - The username of the user to assign the role to.
   * @param {string} role - The role to assign to the user.
   * @param {string | string[]} args - The arguments to pass to the role
   *     assignment function. For Topic Manager, it should be the topic
   *     name. For Translation Coordinator, it should be the array of
   *     language code.
   */
  async assignRoleToUser(
    username: string,
    role: string,
    args?: string | string[]
  ): Promise<void> {
    await this.goto(adminPageRolesTab);
    await this.typeInInputField(roleEditorInputField, username);
    await this.clickOnElementWithSelector(roleEditorButtonSelector);
    await this.clickOnElementWithSelector(addRoleButton);
    await this.clickOnElementWithSelector(rolesSelectDropdown);
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
        await this.waitForStaticAssetsToLoad();
        if (role === topicManagerRole) {
          if (typeof args !== 'string') {
            throw new Error('Expected additional argument to be string.');
          }
          const topicName = args as string;
          await this.selectTopicForTopicManagerRole(topicName as string);
        }
        if (role === testConstants.Roles.TRANSLATION_COORDINATOR) {
          for (const language of args as string[]) {
            await this.selectLanguageForTranslationCoordinatorRole(language);
          }

          await this.clickOnElementWithSelector(
            languageSelectorCloseButtonSelector
          );
          await this.expectElementToBeVisible(
            languageSelectorCloseButtonSelector,
            false
          );
        }
        return;
      }
    }
    throw new Error(`Role ${role} does not exists.`);
  }

  private async selectLanguageForTranslationCoordinatorRole(
    language: string
  ): Promise<void> {
    const visible = await this.isElementVisible(
      selectedLanguageSelector,
      true,
      5000
    );
    const initalNumberOfLanguages = !visible
      ? 0
      : (await this.page.$$(selectedLanguageSelector)).length;
    const selectElementSelector = `${languageSelectorBodySelector} select`;

    // Page updates select value to the first option by default.
    // If we don't wait for the page to update the value, we end up in race
    // condition where the page updates the value to the first option after
    // we select the language.
    await this.page.waitForFunction(
      (selector: string) => {
        const element = document.querySelector(selector);
        return element && (element as HTMLSelectElement).value;
      },
      {},
      selectElementSelector
    );
    await this.select(selectElementSelector, language);

    await this.clickOnElementWithSelector(addLanguageButtonSelector);

    await this.page.waitForFunction(
      (selector: string, numberOfLanguages: number) => {
        const elements = document.querySelectorAll(selector);
        return elements.length === numberOfLanguages;
      },
      {},
      selectedLanguageSelector,
      initalNumberOfLanguages + 1
    );
  }

  /**
   * Selects a topic for the Topic Manager role.
   * @param {string} topicName - The name of the topic to select.
   */
  private async selectTopicForTopicManagerRole(
    topicName: string
  ): Promise<void> {
    await this.page.waitForSelector(selectTopicForAssignmentSelector);
    const selectElement = await this.page.$(selectTopicForAssignmentSelector);
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

        await this.page.select(selectTopicForAssignmentSelector, optionValue);
        await this.page.waitForSelector(addTopicButton);
        const button = await this.page.$(addTopicButton);
        if (!button) {
          throw new Error('Button not found');
        }
        await this.waitForElementToBeClickable(button);
        await button.click();

        await this.page.waitForFunction(
          (selector: string, topic: string) => {
            const assingedTopicElements = document.querySelectorAll(selector);
            for (const element of Array.from(assingedTopicElements)) {
              const textContent = element.textContent;
              if (textContent === topic) {
                return true;
              }
            }
            return false;
          },
          {},
          assignedTopicSelector,
          topicName
        );
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
    await this.goto(adminPageRolesTab);
    await this.typeInInputField(roleEditorInputField, username);
    await this.clickOnElementWithSelector(roleEditorButtonSelector);
    await this.page.waitForSelector(justifyContentDiv);
    const userRoleElements = await this.page.$$(userRoleDescriptionSelector);
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
    throw new Error(`User does not have the "${role}" role!`);
  }

  /**
   * The function expects the user to not have the given role.
   */
  async expectUserNotToHaveRole(username: string, role: string): Promise<void> {
    const currentPageUrl = this.page.url();
    await this.goto(adminPageRolesTab);
    await this.typeInInputField(roleEditorInputField, username);
    await this.clickOnElementWithSelector(roleEditorButtonSelector);
    await this.page.waitForSelector(justifyContentDiv);
    const userRoleElements = await this.page.$$(userRoleDescriptionSelector);
    for (let i = 0; i < userRoleElements.length; i++) {
      const roleText = await this.page.evaluate(
        (element: HTMLElement) => element.innerText,
        userRoleElements[i]
      );
      if (roleText.toLowerCase() === role) {
        throw new Error(`User has the "${role}" role!`);
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
    await this.goto(adminPageRolesTab);
    await this.page.waitForSelector(roleEditorInputField);
    await this.typeInInputField(roleEditorInputField, username);
    await this.clickOnElementWithSelector(roleEditorButtonSelector);
    await this.page.waitForSelector(justifyContentDiv);
    await this.page.waitForSelector(
      `.e2e-test-${role}-remove-button-container`
    );

    const deleteRoleButtonSelector = `.e2e-test-${role}-remove-button-container`;
    const deleteRoleButton = await this.page.$(deleteRoleButtonSelector);
    if (!deleteRoleButton) {
      throw new Error(`User does not have the "${role}" role!`);
    }

    await this.waitForElementToBeClickable(deleteRoleButton);
    await deleteRoleButton.click();

    await this.waitForNetworkIdle();
    await this.expectElementToBeVisible(deleteRoleButtonSelector, false);
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
    await this.clickOnElementWithText(role);

    await this.expectTextContentToContain(selectedRoleHeadingSelector, role);
  }

  /**
   * This function checks if the allocated actions for a role are present on the page.
   * @param {string[]} actions - The actions to check for.
   */
  async expectRoleToHaveAllocatedActions(actions: string[]): Promise<void> {
    for (const action of actions) {
      const isActionPresent = await this.isTextPresentOnPage(action);
      if (!isActionPresent) {
        throw new Error(`Action "${action}" is not allocated to the role`);
      }
    }
    showMessage(`"${actions}" is/are allocated to the role`);
  }

  /**
   * Checks if the specified users are assigned to the current role.
   * @param {string[]} users - An array of usernames to check.
   * @param {boolean} present - Whether the users should be present or not.
   */
  async expectRoleToHaveAssignedUsers(
    users: string[],
    present: boolean = true
  ): Promise<void> {
    await this.clickOnElementWithText(' Assigned users ');

    for (const user of users) {
      try {
        await this.page.waitForFunction(
          (user: string, present: boolean) => {
            const regex = new RegExp(`\\b${user}\\b`);
            return regex.test(document.documentElement.outerHTML) === present;
          },
          {timeout: 10000},
          user,
          present
        );
      } catch (error) {
        if (error instanceof puppeteer.errors.TimeoutError) {
          const newError = new Error(
            `User "${user}" is ${present ? 'not ' : ''}assigned to the role`
          );
          newError.stack = error.stack;
          throw newError;
        }
        throw error;
      }
    }

    showMessage(`"${users}" is/are assigned to the role`);
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
        reloadExplorationTitle
      );
      const name = await this.page.evaluate(
        element => element.innerText,
        explorationNameElement
      );

      if (name === `${explorationName}`) {
        await reloadExplorationRows[i].waitForSelector(reloadExplorationButton);
        const reloadButton = await reloadExplorationRows[i].$(
          reloadExplorationButton
        );

        if (!reloadButton) {
          throw new Error(
            `Failed to find reload button for exploration "${explorationName}"`
          );
        }
        await this.waitForElementToBeClickable(reloadButton);
        await reloadButton.click();
        await this.waitForNetworkIdle();

        await this.expectActionStatusMessageToBe('Data reloaded successfully.');
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
      await this.page.waitForSelector(searchFieldCommunityLibrary, {
        visible: true,
      });
      await this.typeInInputField(searchFieldCommunityLibrary, activityName);

      const isActivityPresent = await this.isTextPresentOnPage(activityName);
      if (!isActivityPresent) {
        throw new Error(`Activity "${activityName}" is not present`);
      }

      showMessage(`Activity "${activityName}" is present`);
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
          reloadCollectionTitleSelector
        );
        await this.page.waitForSelector(reloadCollectionTitleSelector, {
          visible: true,
        });

        const name = await this.page.evaluate(
          element => element.innerText,
          collectionNameElement
        );
        if (name.trim() === collectionName) {
          const reloadButton = await reloadCollectionRows[i].$(
            reloadCollectionButton
          );
          await this.page.waitForSelector(reloadCollectionButton, {
            visible: true,
          });

          if (!reloadButton) {
            throw new Error(
              `Reload button not found for collection "${collectionName}"`
            );
          }
          await this.waitForElementToBeClickable(reloadButton);
          await reloadButton.click();

          await this.waitForNetworkIdle();
          await this.expectActionStatusMessageToBe(
            'Data reloaded successfully.'
          );
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
    await this.page.waitForSelector(noOfExplorationToGeneratorField, {
      visible: true,
    });
    await this.typeInInputField(
      noOfExplorationToGeneratorField,
      noToGenerate.toString()
    );

    await this.page.waitForSelector(noOfExplorationToPublishField, {
      visible: true,
    });
    await this.typeInInputField(
      noOfExplorationToPublishField,
      noToPublish.toString()
    );

    await this.page.waitForSelector(generateExplorationButton, {
      visible: true,
    });
    await this.clickOnElementWithText(' Generate Explorations ');

    await this.waitForNetworkIdle();
    await this.expectActionStatusMessageToBe(
      'Dummy explorations generated successfully.'
    );
    showMessage('Successfully generated and published the dummy explorations.');
  }

  /**
   * Checks if the expected number of activities is present on the page.
   * @param {number} expectedNumber - The expected number of activities.
   */
  async expectNoOfActivitiesToBePresent(expectedNumber: number): Promise<void> {
    await this.page.waitForSelector(explorationTileSelector, {
      visible: true,
    });
    const noOfActivities = await this.page.$$(explorationTileSelector);

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
    await this.clickOnElementWithText(' Load Data ');

    await this.waitForNetworkIdle();
    await this.expectActionStatusMessageToBe(
      'Dummy new structures data generated successfully.'
    );
  }

  /**
   * Function to check if a topic is present in the Topics and Skills Dashboard.
   * @param {string} topicName - The name of the topic to check.
   */
  async expectTopicInTopicsAndSkillDashboard(topicName: string): Promise<void> {
    await this.navigateToTopicsAndSkillsDashboard();
    await this.clickOnElementWithSelector(topicsTab);
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
    await this.clickOnElementWithSelector(skillsTab);
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
    await this.clickOnElementWithText(' Generate Data ');

    await this.waitForNetworkIdle();
    await this.expectActionStatusMessageToBe(
      'Dummy new skill and questions generated successfully.'
    );
  }

  /**
   * Generates a dummy math classroom.
   */
  async generateDummyMathClassroom(): Promise<void> {
    await this.navigateToAdminPageActivitiesTab();
    await this.page.waitForSelector(loadDummyMathClassRoomButton);
    await this.clickOnElementWithSelector(loadDummyMathClassRoomButton);

    await this.waitForNetworkIdle();
    await this.expectActionStatusMessageToBe(
      'Dummy new classroom generated successfully.'
    );
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
   * Generates a dummy blog post.
   */
  async generateDummyBlogPost(): Promise<void> {
    await this.navigateToAdminPageActivitiesTab();
    await this.expectElementToBeVisible(generateBlogPostButton);
    await this.clickOnElementWithSelector(generateBlogPostButton);

    await this.expectActionStatusMessageToBe(
      'Dummy Blog Post generated successfully.'
    );
  }

  /**
   * Generates N dummy blog posts.
   */
  async generateDummyBlogPosts(numBlogs: number): Promise<void> {
    await this.navigateToAdminPageActivitiesTab();
    for (let i = 0; i < numBlogs; i++) {
      await this.generateDummyBlogPost();
    }
  }

  /**
   * Checks if the blog post is present.
   * @param {string} expectedBlog - the title of the expected blog post.
   */
  async expectBlogPostToBePresent(expectedBlog: string): Promise<void> {
    await this.navigateToBlogPage();

    await this.expectElementToBeVisible(blogPostTitleSelector);
    const blogTitles = await this.page.$$eval(blogPostTitleSelector, elements =>
      elements.map(element => element.textContent)
    );
    for (const title of blogTitles) {
      if (!title) {
        continue;
      }
      if (title.includes(expectedBlog)) {
        showMessage('The blog post is present on the blog dashboard.');
        return;
      }
    }

    throw new Error(
      `Blog post with title ${expectedBlog} not found on the blog dashboard.`
    );
  }

  /**
   * Checks if the 'Activities' tab is not available in the production environment.
   */
  async expectControlsNotAvailable(): Promise<void> {
    try {
      const activitiesTabElement = await this.page.$(prodModeActivitiesTab);
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

  /**
   * Selects a platform parameter by its name.
   * @param {string} parameterName - The name of the platform parameter.
   * @returns {Promise<ElementHandle<Element>>} - The ElementHandle of the selected platform parameter.
   */
  async selectPlatformParameter(
    parameterName: string
  ): Promise<puppeteer.ElementHandle<Element>> {
    await this.page.waitForSelector(platformParameterSelector);
    const platformParameters = await this.page.$$(platformParameterSelector);
    for (const platformParameter of platformParameters) {
      const nameElement = await platformParameter.$(
        platformParameterNameSelector
      );
      const name = await this.page.evaluate(
        element => element.textContent,
        nameElement
      );
      if (name === parameterName) {
        showMessage('Platform parameter found.');
        return platformParameter;
      }
    }
    throw new Error(`Platform parameter "${parameterName}" not found.`);
  }

  /**
   * Waits for a success message to appear and checks if it matches the expected message.
   * @param {string} expectedMessage - The expected success message.
   */
  async expectActionSuccessMessage(expectedMessage: string): Promise<void> {
    await this.page.waitForSelector(actionStatusMessageSelector, {
      visible: true,
    });

    try {
      await this.page.waitForFunction(
        (selector: string, expectedText: string) => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() === expectedText.trim();
        },
        {timeout: 5000},
        actionStatusMessageSelector,
        expectedMessage
      );
    } catch (error) {
      const actualMessage = await this.page.$eval(
        actionStatusMessageSelector,
        el => el.textContent?.trim()
      );

      throw new Error(
        `Text did not match within the specified time. Actual message: "${actualMessage}", expected message: "${expectedMessage}"`
      );
    }
  }

  /**
   * Adds a rule to a platform parameter.
   * @param {string} platformParam - The name of the platform parameter.
   * @param {string} condition - The condition for the rule.
   * @param {string} ruleValue - The value to be typed.
   */
  async addRuleToPlatformParameter(
    platformParam: string,
    condition: string,
    ruleValue: string
  ): Promise<void> {
    try {
      const platformParameter =
        await this.selectPlatformParameter(platformParam);

      await platformParameter.waitForSelector(editParamButton, {visible: true});
      const editButton = await platformParameter.$(editParamButton);
      if (!editButton) {
        throw new Error(
          `Edit button not found for platform parameter "${platformParam}".`
        );
      }
      await this.waitForElementToBeClickable(editButton);
      await editButton.click();

      const addRuleButton = await platformParameter.$(addRuleButtonSelector);
      if (!addRuleButton) {
        throw new Error(
          `Add rule button not found for platform parameter "${platformParam}".`
        );
      }
      await this.waitForElementToBeClickable(addRuleButton);
      await addRuleButton.click();

      await this.waitForElementToBeClickable(addConditionButton);
      await this.waitForElementToStabilize(addConditionButton);
      await this.clickOnElementWithSelector(addConditionButton);

      await this.page.waitForSelector(serverModeSelector, {visible: true});
      await this.waitForElementToBeClickable(serverModeSelector);
      await this.page.select(serverModeSelector, condition);

      await this.waitForElementToBeClickable(paramValueInput);
      await this.clearAllTextFrom(paramValueInput);
      await this.page.type(paramValueInput, ruleValue);

      await this.expectElementValueToBe(paramValueInput, ruleValue);
      showMessage('Rule added successfully.');
    } catch (error) {
      console.error(
        `Failed to add rule to platform parameter "${platformParam}": ${error}`
      );
      throw error;
    }
  }

  /**
   * Changes the default value of a platform parameter to the provided value.
   * @param {string} platformParam - The name of the platform parameter.
   * @param {string} value - The new default value.
   */
  async changeDefaultValueOfPlatformParameter(
    platformParam: string,
    value: string
  ): Promise<void> {
    await this.navigateToAdminPagePlatformParametersTab();
    try {
      const platformParameter =
        await this.selectPlatformParameter(platformParam);

      await platformParameter.waitForSelector(editParamButton, {visible: true});
      const editButton = await platformParameter.$(editParamButton);
      if (!editButton) {
        throw new Error(
          `Edit button not found for platform parameter "${platformParam}".`
        );
      }
      await this.waitForElementToBeClickable(editButton);
      await editButton.click();

      const deafultValueInputSelector = `${platformParameterDefaultValueContainerSelector} ${paramValueInput}`;
      const inputElement = await platformParameter.waitForSelector(
        deafultValueInputSelector,
        {visible: true}
      );

      if (!inputElement) {
        throw new Error(
          `Input field not found for platform parameter "${platformParam}".`
        );
      }

      await inputElement.type(value);
      await this.page.waitForFunction(
        (element: Element, value: string) => {
          return (element as HTMLInputElement).value.trim() === value.trim();
        },
        {},
        inputElement,
        value
      );
      showMessage('Default value changed successfully.');
    } catch (error) {
      console.error(
        `Failed to change default value of platform parameter "${platformParam}".\n` +
          'Original Error:\n' +
          error.stack
      );
      throw error;
    }
  }

  /**
   * Saves changes to a platform parameter.
   * @param {string} parameterName - The name of the platform parameter.
   */
  async savePlatformParameterChanges(parameterName: string): Promise<void> {
    try {
      const platformParameter =
        await this.selectPlatformParameter(parameterName);
      await platformParameter.waitForSelector(paramSaveChangesButton, {
        visible: true,
      });
      const saveButton = await platformParameter.$(
        `${paramSaveChangesButton} button`
      );
      if (!saveButton) {
        throw new Error(
          `Save button not found for platform parameter "${parameterName}".`
        );
      }
      await this.waitForElementToBeClickable(saveButton);
      await saveButton.click();

      await platformParameter.waitForSelector(
        `${paramSaveChangesButton} .btn[disabled]`,
        {visible: true}
      );
    } catch (error) {
      console.error(
        `Failed to save changes to platform parameter "${parameterName}": ${error}`
      );
      throw error;
    }
  }

  /**
   * Checks if a platform parameter has a specific rule.
   * @param {string} platformParam - The name of the platform parameter.
   * @param {string} expectedCondition - The expected condition.
   * @param {string} expectedValue - The expected value.
   */
  async expectPlatformParameterToHaveRule(
    platformParam: string,
    expectedCondition: string,
    expectedValue: string
  ): Promise<void> {
    await this.navigateToAdminPagePlatformParametersTab();
    const platformParameter = await this.selectPlatformParameter(platformParam);

    await platformParameter.waitForSelector(paramRuleItemHeaderSelector, {
      visible: true,
    });
    const ruleItems = await platformParameter.$$(paramRuleItemHeaderSelector);
    if (ruleItems.length === 0) {
      throw new Error(
        `No rule items found in platform parameter "${platformParam}".`
      );
    }

    for (const ruleItem of ruleItems) {
      const divs = await ruleItem.$$('div');
      if (divs.length < 2) {
        throw new Error(
          `Expected at least two divs in rule item, but found ${divs.length}.`
        );
      }
      const condition = (
        await this.page.evaluate(element => element.textContent, divs[0])
      ).trim();
      const value = (
        await this.page.evaluate(element => element.textContent, divs[1])
      ).trim();

      if (condition !== expectedCondition || value !== expectedValue) {
        throw new Error(
          `Rule with condition "${expectedCondition}" and value "${expectedValue}" 
          not found in platform parameter "${platformParam}". Actual conditions: ${condition} and value: ${value}`
        );
      } else {
        showMessage(
          `Rule with condition "${expectedCondition}" and value "${expectedValue}" 
          found in platform parameter "${platformParam}".`
        );
        break;
      }
    }
  }

  /**
   * Checks if a platform parameter has a specific default value.
   * @param {string} parameter - The name of the platform parameter.
   * @param {string} expectedValue - The expected default value.
   */
  async expectPlatformParameterToHaveDefaultValue(
    parameter: string,
    expectedValue: string
  ): Promise<void> {
    const platformParameter = await this.selectPlatformParameter(parameter);
    if (!platformParameter) {
      throw new Error(`Platform parameter "${parameter}" not found.`);
    }

    await platformParameter.waitForSelector(defaultParamValueDivSelector, {
      visible: true,
    });
    const valueElement = await platformParameter.$(
      defaultParamValueDivSelector
    );
    if (!valueElement) {
      throw new Error(
        `Default value element not found in platform parameter "${parameter}".`
      );
    }

    const value = (
      await this.page.evaluate(element => element.textContent, valueElement)
    ).trim();

    if (value !== expectedValue) {
      throw new Error(
        `Expected "${expectedValue}" but got "${value}" for platform parameter "${parameter}".`
      );
    }
  }

  /**
   * Regenerates contribution opportunities for a given topic.
   * @param {string} topicId - The ID of the topic.
   */
  async regenerateContributionOpportunitiesForTopic(
    topicId: string
  ): Promise<void> {
    await this.expectElementToBeVisible(topicIdInputSelector);
    await this.typeInInputField(topicIdInputSelector, topicId);

    await this.page.waitForSelector(regenerateOpportunitiesButton);
    await this.clickOnElementWithSelector(regenerateOpportunitiesButton);

    await this.expectActionStatusMessageToBe(
      'No. of opportunities model created:',
      'Regenerating opportunities...'
    );
  }

  /**
   * Regenerates the topic summaries.
   */
  async regenerateTopicSummaries(): Promise<void> {
    await this.page.waitForSelector(regenerateTopicSummariesButton);
    await this.clickOnElementWithSelector(regenerateTopicSummariesButton);

    await this.expectActionStatusMessageToBe(
      'Successfully regenerated all topic summaries.',
      'Regenerating all topic summaries'
    );
  }

  /**
   * Rolls back an exploration to a safe state.
   */
  async rollbackExplorationToSafeState(
    explorationId: string | null
  ): Promise<void> {
    await this.expectElementToBeVisible(explorationIdInputSelector);
    await this.typeInInputField(
      explorationIdInputSelector,
      explorationId as string
    );

    await this.page.waitForSelector(rollbackExplorationButton);
    await this.clickOnElementWithSelector(rollbackExplorationButton);

    await this.expectActionStatusMessageToBe(
      'Exploration rolledback to version:',
      'Rollingback exploration'
    );
  }

  /**
   * Updates the username of a user.
   * @param {string} oldUserName - The old username.
   * @param {string} newUserName - The new username.
   */
  async updateUserName(
    oldUserName: string,
    newUserName: string
  ): Promise<void> {
    await this.expectElementToBeVisible(oldUserNameInputSelector);
    await this.typeInInputField(oldUserNameInputSelector, oldUserName);

    await this.typeInInputField(newUserNameInputSelector, newUserName);

    await this.page.waitForSelector(updateUserNameButtonSelector);
    await this.clickOnElementWithSelector(updateUserNameButtonSelector);

    await this.expectActionStatusMessageToBe(
      `Successfully renamed ${oldUserName} to ${newUserName}!`,
      'Updating username'
    );
  }

  /**
   * Finds the number of pending account deletion requests.
   */
  async getNumberOfPendingDeletionRequests(): Promise<void> {
    await this.page.waitForSelector(getPendingDeletionRequestsCountButton);
    await this.clickOnElementWithSelector(
      getPendingDeletionRequestsCountButton
    );

    await this.expectActionStatusMessageToBe(
      'The number of users that are being deleted is:',
      'Getting the number of users that are being deleted'
    );
  }

  /**
   * Gets the interactions for a given exploration.
   * @param {string} explorationId - The ID of the exploration.
   */
  async getExplorationInteractions(
    explorationId: string | null
  ): Promise<void> {
    await this.expectElementToBeVisible(explorationIdToGetInteractionsInput);
    await this.typeInInputField(
      explorationIdToGetInteractionsInput,
      explorationId as string
    );

    await this.page.waitForSelector(getInteractionsButton);
    await this.clickOnElementWithSelector(getInteractionsButton);

    await this.expectActionStatusMessageToBe(
      'Successfully fetched interactionIds in exploration.',
      'Retrieving interactions in exploration'
    );
  }

  /**
   * Grants super admin privileges to a user.
   * @param {string} username - The username of the user to grant privileges to.
   * @returns {Promise<void>}
   */
  async grantSuperAdminPrivileges(username: string): Promise<void> {
    await this.expectElementToBeVisible(usernameToGrantPrivilegeInput);
    await this.typeInInputField(usernameToGrantPrivilegeInput, username);

    await this.page.waitForSelector(grantSuperAdminButtonSelector);
    await this.clickOnElementWithSelector(grantSuperAdminButtonSelector);

    await this.expectActionStatusMessageToBe(
      'Success!',
      'Communicating with Firebase server'
    );
  }

  /**
   * Revokes super admin privileges from a user.
   * @param {string} username - The username of the user to revoke privileges from.
   * @returns {Promise<void>}
   */
  async revokeSuperAdminPrivileges(username: string): Promise<void> {
    await this.expectElementToBeVisible(usernameToRevokePrivilegeInput);
    await this.typeInInputField(usernameToRevokePrivilegeInput, username);

    await this.page.waitForSelector(revokeSuperAdminButton);
    await this.clickOnElementWithSelector(revokeSuperAdminButton);

    await this.expectActionStatusMessageToBe(
      'Success!',
      'Communicating with Firebase server'
    );
  }

  /**
   * Updates the data of a blog post.
   * @param {string} blogId - The ID of the blog post.
   * @param {string} author - The author of the blog post.
   * @param {string} publishedOn - The published date of the blog post.
   */
  async updateBlogPostData(
    blogId: string,
    author: string,
    publishedOn: string
  ): Promise<void> {
    await this.expectElementToBeVisible(blogIdInputSelector);
    await this.typeInInputField(blogIdInputSelector, blogId);

    await this.typeInInputField(blogAuthorInputSelector, author);

    await this.typeInInputField(blogPublishedOnInputSelector, publishedOn);

    await this.page.waitForSelector(updateBlogPostButtonSelector);
    await this.clickOnElementWithSelector(updateBlogPostButtonSelector);

    await this.expectActionStatusMessageToBe(
      'Successfully updated blog post data'
    );
  }

  /**
   * Enables text-to-speech synthesis for Oppia voiceovers using a cloud
   * service.
   */
  async enableTextToSpeechSynthesisUsingCloudService(): Promise<void> {
    await this.navigateToAdminPageMiscTab();
    await this.scrollToBottomOfPage();
    await this.page.waitForSelector(enableAutogenerationToggleSelector);
    const toggle = await this.page.$(enableAutogenerationToggleSelector);
    if (!toggle) {
      throw new Error('Enable autogeneration toggle not found on the page.');
    }
    await toggle.click();
    await this.page.waitForSelector(saveAutogenerationToggleButtonSelector);
    await this.clickOnElementWithSelector(
      saveAutogenerationToggleButtonSelector
    );
  }

  /**
   * Checks if a platform parameter is visible.
   * @param {string} parameterName - The name of the platform parameter.
   */
  async expectPlatformParameterToBeVisible(
    parameterName: string
  ): Promise<ElementHandle<Element>> {
    await this.expectElementToBeVisible(platformParameterSelector);

    // Get all platform parameter containers.
    const platformParameterContainerElements = await this.page.$$(
      platformParameterSelector
    );
    const platformParameterContainerNames = await this.page.$$eval(
      `${platformParameterSelector} ${platformParameterNameSelector}`,
      elements => elements.map(element => element.textContent?.trim())
    );

    // Check if the platform parameter is present in the container.
    const index = platformParameterContainerNames.indexOf(parameterName);
    if (index === -1) {
      throw new Error(
        `Platform parameter "${parameterName}" not found in platform parameters.`
      );
    }

    return platformParameterContainerElements[index];
  }
}

export let SuperAdminFactory = (): SuperAdmin => new SuperAdmin();
