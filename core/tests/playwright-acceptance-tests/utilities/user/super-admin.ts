// Copyright 2025 The Oppia Authors. All Rights Reserved.
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

import {expect} from '@playwright/test';
import {LoggedInUser} from './logged-in-user';
import testConstants, {BLOG_RIGHTS, BlogRoles} from '../common/test-constants';
import {showMessage} from '../common/show-message';

// URLs.
const adminPageActivitiesTab = testConstants.URLs.AdminPageActivitiesTab;
const adminPagePlatformParametersTab =
  testConstants.URLs.AdminPagePlatformParametersTab;
const adminPageRolesTab = testConstants.URLs.AdminPageRolesTab;
const adminPageMiscTab = testConstants.URLs.AdminPageMiscTab;
const communityLibraryUrl = testConstants.URLs.CommunityLibrary;
const topicsAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;
const contributorDashboardAdminUrl =
  testConstants.URLs.ContributorDashboardAdmin;
const blogAdminUrl = testConstants.URLs.BlogAdmin;

// Roles.
const topicManagerRole = testConstants.Roles.TOPIC_MANAGER;

// Admin Page selectors — kept identical to Puppeteer so no selector hunting needed.
const actionStatusMessageSelector = '.e2e-test-status-message';
const addRoleButton = 'button.oppia-add-role-button';
const roleEditorButtonSelector = 'button.e2e-test-role-edit-button';
const roleEditorInputField = 'input.e2e-test-username-for-role-editor';
const rolesSelectDropdown = 'div.mat-select-trigger';
const userRoleDescriptionSelector = '.oppia-user-role-description';
const justifyContentDiv = 'div.justify-content-between';
const assignedTopicSelector = '.e2e-test-assigned-topic';
const selectTopicForAssignmentSelector = '.e2e-test-select-topic';
const addTopicButton = '.e2e-test-add-topic-button';
const selectedRoleHeadingSelector = '.e2e-test-active-role';

// Blog Admin selectors.
const roleUpdateUsernameInput = 'input#label-target-update-form-name';
const updateRoleButtonSelector = 'button.oppia-blog-admin-update-role-button';
const blogEditorUsernameField = '.e2e-test-new-blog-editor-username';
const addBlogEditorButton = '.e2e-test-add-blog-editor-button';
const blogEditorUsernameInList = '.e2e-test-blog-editor-username';

// Contributor Dashboard Admin selectors.
const translationReviewerUsernameInput =
  '.e2e-test-translation-reviewer-username';
const addTranslationReviewerButton =
  '.e2e-test-add-translation-reviewer-button';
const languageSelectorBodySelector = '.e2e-test-language-selector-modal-body';
const languageSelectorCloseButtonSelector =
  '.e2e-test-language-selector-close-button';
const addLanguageButtonSelector = '.e2e-test-language-selector-add-button';
const selectedLanguageSelector = '.e2e-test-selected-language';

// Misc Tab selectors.
const enableAutogenerationToggleSelector =
  '.e2e-test-cloud-service-autogeneration-toggle';
const saveAutogenerationToggleButtonSelector =
  '.e2e-test-save-autogeneration-toggle-button';

// Platform Parameters selectors.
const platformParameterSelector = '.e2e-test-platform-param';
const platformParameterNameSelector = '.e2e-test-parameter-name';
const editParamButton = '.oppia-edit-param-button';
const addRuleButtonSelector = '.e2e-test-parameter-add-rule-button';
const addConditionButton = '.e2e-test-add-condition-button';
const serverModeSelector = '.e2e-test-server-mode-selector';
const paramValueInput = '.e2e-test-text-input';
const paramSaveChangesButton = '.save-button-container';
const paramRuleItemHeaderSelector = '.oppia-rule-item-header';
const defaultParamValueDivSelector = '.e2e-test-param-default-value';
const platformParameterDefaultValueContainerSelector =
  '.e2e-test-platform-param-default-value-container';

// Tab container selectors.
const platformParameterTabContainerSelector =
  'oppia-admin-platform-parameters-tab';
const userRolesTabContainerSelector = 'oppia-admin-roles-tab';

export class SuperAdmin extends LoggedInUser {
  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  async navigateToAdminPageActivitiesTab(): Promise<void> {
    await this.goto(adminPageActivitiesTab);
  }

  async navigateToAdminPageMiscTab(): Promise<void> {
    await this.goto(adminPageMiscTab);
  }

  async navigateToAdminPageRolesTab(): Promise<void> {
    await this.goto(adminPageRolesTab);
    await expect(
      this.page.locator(userRolesTabContainerSelector)
    ).toBeVisible();
  }

  async navigateToAdminPagePlatformParametersTab(): Promise<void> {
    await this.goto(adminPagePlatformParametersTab);
    await expect(
      this.page.locator(platformParameterTabContainerSelector)
    ).toBeVisible();
  }

  async navigateToTopicsAndSkillsDashboard(): Promise<void> {
    await this.goto(topicsAndSkillsDashboardUrl);
  }

  async navigateToBlogAdminPage(): Promise<void> {
    await this.goto(blogAdminUrl);
  }

  async navigateToContributorDashboardAdminPage(): Promise<void> {
    await this.goto(contributorDashboardAdminUrl);
  }

  async navigateToBlogPage(): Promise<void> {
    await this.goto(testConstants.URLs.Blog);
  }

  async navigateToCommunityLibrary(): Promise<void> {
    await this.goto(communityLibraryUrl);
  }

  // ---------------------------------------------------------------------------
  // Role assignment — mirrors Puppeteer's assignRoleToUser exactly
  // ---------------------------------------------------------------------------

  /**
   * Assigns a role to a user via the admin roles tab.
   * Mirrors Puppeteer's assignRoleToUser.
   */
  async assignRoleToUser(
    username: string,
    role: string,
    args?: string | string[]
  ): Promise<void> {
    await this.goto(adminPageRolesTab);

    // Enter username and open role editor.
    await this.page.locator(roleEditorInputField).fill(username);
    await this.page.locator(roleEditorButtonSelector).click();

    // Click "Add Role" and open the dropdown.
    await this.page.locator(addRoleButton).click();
    await this.page.locator(rolesSelectDropdown).click();

    // Find and click the matching role in mat-option list.
    const allRoleOptions = this.page.locator('.mat-option-text');
    const count = await allRoleOptions.count();
    let roleFound = false;

    for (let i = 0; i < count; i++) {
      const optionText = await allRoleOptions.nth(i).innerText();
      if (optionText.toLowerCase() === role.toLowerCase()) {
        await allRoleOptions.nth(i).click();
        await this.page.waitForLoadState('networkidle');
        roleFound = true;

        // Handle roles that need extra input after selection.
        if (role === topicManagerRole) {
          if (typeof args !== 'string') {
            throw new Error(
              'Topic name (string) is required for TOPIC_MANAGER role.'
            );
          }
          await this.selectTopicForTopicManagerRole(args);
        }

        if (role === testConstants.Roles.TRANSLATION_COORDINATOR) {
          const languages =
            typeof args === 'string' ? [args] : (args as string[]);
          for (const language of languages) {
            await this.selectLanguageForTranslationCoordinatorRole(language);
          }
          await this.page.locator(languageSelectorCloseButtonSelector).click();
          await expect(
            this.page.locator(languageSelectorCloseButtonSelector)
          ).toBeHidden();
        }

        break;
      }
    }

    if (!roleFound) {
      throw new Error(`Role "${role}" does not exist.`);
    }

    showMessage(`Role "${role}" assigned to "${username}".`);
  }

  /**
   * Selects a topic for the Topic Manager role assignment.
   * Mirrors Puppeteer's selectTopicForTopicManagerRole.
   */
  private async selectTopicForTopicManagerRole(
    topicName: string
  ): Promise<void> {
    await this.page.waitForSelector(selectTopicForAssignmentSelector);
    const selectLocator = this.page.locator(selectTopicForAssignmentSelector);

    // Wait for options to load.
    await this.page.waitForSelector(
      `${selectTopicForAssignmentSelector} option`
    );

    // Get all options and find matching one.
    const options = await selectLocator.locator('option').all();
    let matched = false;

    for (const option of options) {
      const text = (await option.textContent())?.trim();
      if (text === topicName) {
        const value = await option.getAttribute('value');
        if (!value) {
          throw new Error(`Option value not found for topic "${topicName}".`);
        }
        await selectLocator.selectOption(value);
        matched = true;
        break;
      }
    }

    if (!matched) {
      throw new Error(`Topic "${topicName}" not found in options.`);
    }

    // Click the add topic button.
    await this.page.locator(addTopicButton).click();

    // Wait until the topic appears in the assigned topics list.
    await this.page.waitForFunction(
      ({selector, topic}: {selector: string; topic: string}) => {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).some(el => el.textContent === topic);
      },
      {selector: assignedTopicSelector, topic: topicName}
    );

    showMessage(`Topic "${topicName}" selected for Topic Manager role.`);
  }

  /**
   * Selects a language for the Translation Coordinator role.
   * Mirrors Puppeteer's selectLanguageForTranslationCoordinatorRole.
   */
  private async selectLanguageForTranslationCoordinatorRole(
    language: string
  ): Promise<void> {
    const selectedLanguages = this.page.locator(selectedLanguageSelector);
    const initialCount = await selectedLanguages.count();

    const selectLocator = this.page.locator(
      `${languageSelectorBodySelector} select`
    );

    // Wait for the select to have a value (page sets it to first option
    // by default — same race condition guard as Puppeteer).
    await this.page.waitForFunction((selector: string) => {
      const el = document.querySelector(selector) as HTMLSelectElement | null;
      return el && el.value;
    }, `${languageSelectorBodySelector} select`);

    await selectLocator.selectOption(language);
    await this.page.locator(addLanguageButtonSelector).click();

    // Wait until one more language appears in the selected list.
    await this.page.waitForFunction(
      ({selector, count}: {selector: string; count: number}) => {
        return document.querySelectorAll(selector).length === count;
      },
      {selector: selectedLanguageSelector, count: initialCount + 1}
    );
  }

  // ---------------------------------------------------------------------------
  // Role verification
  // ---------------------------------------------------------------------------

  /**
   * Verifies a user has the given role on the admin roles tab.
   * Mirrors Puppeteer's expectUserToHaveRole.
   */
  async expectUserToHaveRole(username: string, role: string): Promise<void> {
    const currentUrl = this.page.url();
    await this.goto(adminPageRolesTab);

    await this.page.locator(roleEditorInputField).fill(username);
    await this.page.locator(roleEditorButtonSelector).click();
    await this.page.waitForSelector(justifyContentDiv);

    const roleElements = this.page.locator(userRoleDescriptionSelector);
    const count = await roleElements.count();

    for (let i = 0; i < count; i++) {
      const text = await roleElements.nth(i).innerText();
      if (text.toLowerCase() === role.toLowerCase()) {
        showMessage(`User "${username}" has the "${role}" role.`);
        await this.goto(currentUrl);
        return;
      }
    }

    throw new Error(`User "${username}" does not have the "${role}" role.`);
  }

  /**
   * Verifies a user does NOT have the given role.
   * Mirrors Puppeteer's expectUserNotToHaveRole.
   */
  async expectUserNotToHaveRole(username: string, role: string): Promise<void> {
    const currentUrl = this.page.url();
    await this.goto(adminPageRolesTab);

    await this.page.locator(roleEditorInputField).fill(username);
    await this.page.locator(roleEditorButtonSelector).click();
    await this.page.waitForSelector(justifyContentDiv);

    const roleElements = this.page.locator(userRoleDescriptionSelector);
    const count = await roleElements.count();

    for (let i = 0; i < count; i++) {
      const text = await roleElements.nth(i).innerText();
      if (text.toLowerCase() === role.toLowerCase()) {
        throw new Error(`User "${username}" has the "${role}" role.`);
      }
    }

    showMessage(`User "${username}" does not have the "${role}" role.`);
    await this.goto(currentUrl);
  }

  /**
   * Removes a role from a user.
   * Mirrors Puppeteer's unassignRoleFromUser.
   */
  async unassignRoleFromUser(username: string, role: string): Promise<void> {
    const roleInSelector = role.replace(/ /g, '-');
    await this.goto(adminPageRolesTab);

    await this.page.locator(roleEditorInputField).fill(username);
    await this.page.locator(roleEditorButtonSelector).click();
    await this.page.waitForSelector(justifyContentDiv);

    const deleteButtonSelector = `.e2e-test-${roleInSelector}-remove-button-container`;
    const deleteButton = this.page.locator(deleteButtonSelector);

    if (!(await deleteButton.isVisible())) {
      throw new Error(`User "${username}" does not have the "${role}" role.`);
    }

    await deleteButton.click();
    await this.page.waitForLoadState('networkidle');
    await expect(deleteButton).toBeHidden();

    showMessage(`Role "${role}" removed from "${username}".`);
  }

  // ---------------------------------------------------------------------------
  // Blog Admin
  // ---------------------------------------------------------------------------

  /**
   * Assigns a user as a blog post editor from the blog admin page.
   * Mirrors Puppeteer's assignUserToRoleFromBlogAdminPage.
   */
  async assignUserToRoleFromBlogAdminPage(
    username: string,
    role: BlogRoles
  ): Promise<void> {
    await this.page
      .locator('select#label-target-update-form-role-select')
      .selectOption(role);
    await this.page.locator(roleUpdateUsernameInput).fill(username);
    await this.page.locator(updateRoleButtonSelector).click();

    await expect(this.page.locator(updateRoleButtonSelector)).not.toBeEnabled();
  }

  // ---------------------------------------------------------------------------
  // Contributor Dashboard Admin
  // ---------------------------------------------------------------------------

  /**
   * Adds translation language review rights for a user.
   * Mirrors Puppeteer's addTranslationLanguageReviewRights.
   */
  async addTranslationLanguageReviewRights(
    username: string,
    language: string
  ): Promise<void> {
    await this.page.locator(translationReviewerUsernameInput).fill(username);

    // Select the language from the dropdown.
    await this.page
      .locator('select.e2e-test-translation-language-selector')
      .selectOption(language);

    await this.page.locator(addTranslationReviewerButton).click();

    showMessage(
      `Translation review rights for "${language}" added to "${username}".`
    );
  }

  /**
   * Adds a voiceover artist to an exploration.
   * Mirrors Puppeteer's addVoiceoverArtistToExplorationWithID.
   */
  async addVoiceoverArtistToExplorationWithID(
    explorationId: string,
    username: string
  ): Promise<void> {
    await this.goto(`${testConstants.URLs.BaseURL}/create/${explorationId}`);

    await this.page
      .locator('input.e2e-test-voice-artist-username-input')
      .fill(username);

    await this.page.locator('button.e2e-test-add-voice-artist-button').click();

    showMessage(
      `Voiceover artist "${username}" added to exploration "${explorationId}".`
    );
  }

  // ---------------------------------------------------------------------------
  // Misc Tab
  // ---------------------------------------------------------------------------

  /**
   * Enables text-to-speech synthesis using cloud service.
   * Mirrors Puppeteer's enableTextToSpeechSynthesisUsingCloudService.
   */
  async enableTextToSpeechSynthesisUsingCloudService(): Promise<void> {
    await this.navigateToAdminPageMiscTab();
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );

    const toggle = this.page.locator(enableAutogenerationToggleSelector);
    await expect(toggle).toBeVisible();
    await toggle.click();

    await this.page.locator(saveAutogenerationToggleButtonSelector).click();

    showMessage('Enabled text-to-speech synthesis using cloud service.');
  }

  // ---------------------------------------------------------------------------
  // Platform Parameters
  // ---------------------------------------------------------------------------

  /**
   * Selects and returns a platform parameter container by name.
   * Mirrors Puppeteer's selectPlatformParameter.
   */
  private async getPlatformParameterLocator(
    parameterName: string
  ): Promise<import('@playwright/test').Locator> {
    await this.page.waitForSelector(platformParameterSelector);
    const params = this.page.locator(platformParameterSelector);
    const count = await params.count();

    for (let i = 0; i < count; i++) {
      const param = params.nth(i);
      const name = await param
        .locator(platformParameterNameSelector)
        .textContent();
      if (name?.trim() === parameterName) {
        return param;
      }
    }

    throw new Error(`Platform parameter "${parameterName}" not found.`);
  }

  /**
   * Adds a rule to a platform parameter.
   * Mirrors Puppeteer's addRuleToPlatformParameter.
   */
  async addRuleToPlatformParameter(
    platformParam: string,
    condition: string,
    ruleValue: string
  ): Promise<void> {
    const param = await this.getPlatformParameterLocator(platformParam);

    await param.locator(editParamButton).click();
    await param.locator(addRuleButtonSelector).click();

    await this.page.locator(addConditionButton).click();
    await this.page.locator(serverModeSelector).selectOption(condition);

    await this.page.locator(paramValueInput).clear();
    await this.page.locator(paramValueInput).fill(ruleValue);

    await expect(this.page.locator(paramValueInput)).toHaveValue(ruleValue);
    showMessage('Rule added successfully.');
  }

  /**
   * Changes the default value of a platform parameter.
   * Mirrors Puppeteer's changeDefaultValueOfPlatformParameter.
   */
  async changeDefaultValueOfPlatformParameter(
    platformParam: string,
    value: string
  ): Promise<void> {
    await this.navigateToAdminPagePlatformParametersTab();
    const param = await this.getPlatformParameterLocator(platformParam);

    await param.locator(editParamButton).click();

    const inputLocator = param.locator(
      `${platformParameterDefaultValueContainerSelector} ${paramValueInput}`
    );
    await expect(inputLocator).toBeVisible();
    await inputLocator.fill(value);
    await expect(inputLocator).toHaveValue(value);

    showMessage('Default value changed successfully.');
  }

  /**
   * Saves changes to a platform parameter.
   * Mirrors Puppeteer's savePlatformParameterChanges.
   */
  async savePlatformParameterChanges(parameterName: string): Promise<void> {
    const param = await this.getPlatformParameterLocator(parameterName);
    const saveButton = param.locator(`${paramSaveChangesButton} button`);

    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Wait for button to become disabled — indicates save succeeded.
    await expect(
      param.locator(`${paramSaveChangesButton} button`)
    ).toBeDisabled();
  }

  /**
   * Verifies a platform parameter has a specific rule.
   * Mirrors Puppeteer's expectPlatformParameterToHaveRule.
   */
  async expectPlatformParameterToHaveRule(
    platformParam: string,
    expectedCondition: string,
    expectedValue: string
  ): Promise<void> {
    await this.navigateToAdminPagePlatformParametersTab();
    const param = await this.getPlatformParameterLocator(platformParam);

    const ruleItems = param.locator(paramRuleItemHeaderSelector);
    await expect(ruleItems.first()).toBeVisible();

    const count = await ruleItems.count();
    for (let i = 0; i < count; i++) {
      const divs = ruleItems.nth(i).locator('div');
      const condition = (await divs.nth(0).textContent())?.trim();
      const value = (await divs.nth(1).textContent())?.trim();

      if (condition !== expectedCondition || value !== expectedValue) {
        throw new Error(
          `Rule with condition "${expectedCondition}" and value ` +
            `"${expectedValue}" not found. ` +
            `Actual: condition="${condition}", value="${value}".`
        );
      }

      showMessage(
        `Rule with condition "${expectedCondition}" and value ` +
          `"${expectedValue}" found in "${platformParam}".`
      );
      break;
    }
  }

  /**
   * Verifies a platform parameter has a specific default value.
   * Mirrors Puppeteer's expectPlatformParameterToHaveDefaultValue.
   */
  async expectPlatformParameterToHaveDefaultValue(
    parameter: string,
    expectedValue: string
  ): Promise<void> {
    const param = await this.getPlatformParameterLocator(parameter);
    const valueLocator = param.locator(defaultParamValueDivSelector);
    const value = (await valueLocator.textContent())?.trim();

    if (value !== expectedValue) {
      throw new Error(
        `Expected "${expectedValue}" but got "${value}" for ` +
          `platform parameter "${parameter}".`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Role visualizer
  // ---------------------------------------------------------------------------

  async expectUserRolesVisualizerToBeVisible(): Promise<void> {
    await expect(
      this.page.locator('oppia-roles-and-actions-visualizer')
    ).toBeVisible();
  }

  /**
   * Selects a role from the roles tab to inspect its details.
   * Mirrors Puppeteer's selectRole.
   */
  async selectRole(role: string): Promise<void> {
    await this.navigateToAdminPageRolesTab();
    const roleTitleCase = role.replace(/\b\w/g, c => c.toUpperCase());
    await this.page.getByText(roleTitleCase).click();
    await expect(this.page.locator(selectedRoleHeadingSelector)).toContainText(
      roleTitleCase
    );
  }

  /**
   * Verifies allocated actions for a role are present on the page.
   * Mirrors Puppeteer's expectRoleToHaveAllocatedActions.
   */
  async expectRoleToHaveAllocatedActions(actions: string[]): Promise<void> {
    for (const action of actions) {
      const isPresent = await this.page
        .getByText(action)
        .isVisible()
        .catch(() => false);
      if (!isPresent) {
        throw new Error(`Action "${action}" is not allocated to the role.`);
      }
    }
    showMessage(`Actions "${actions}" are allocated to the role.`);
  }

  /**
   * Verifies users are (or are not) assigned to the current role.
   * Mirrors Puppeteer's expectRoleToHaveAssignedUsers.
   */
  async expectRoleToHaveAssignedUsers(
    users: string[],
    present: boolean = true
  ): Promise<void> {
    await this.page.getByText(' Assigned users ').click();

    for (const user of users) {
      await this.page.waitForFunction(
        ({
          username,
          shouldBePresent,
        }: {
          username: string;
          shouldBePresent: boolean;
        }) => {
          const regex = new RegExp(`\\b${username}\\b`);
          return (
            regex.test(document.documentElement.outerHTML) === shouldBePresent
          );
        },
        {username: user, shouldBePresent: present}
      );
    }

    showMessage(`Users "${users}" assignment verified.`);
  }
}
