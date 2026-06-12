// Copyright 2026 The Oppia Authors. All Rights Reserved.
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

import {Page} from '@playwright/test';
import {LoggedInUser} from './logged-in-user';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const adminPageRolesTab = testConstants.URLs.AdminPageRolesTab;

const topicManagerRole = testConstants.Roles.TOPIC_MANAGER;

// Skills and Topics.
const addTopicButton = '.e2e-test-add-topic-button';

const assignedTopicSelector = '.e2e-test-assigned-topic';

const addLanguageButtonSelector = '.e2e-test-language-selector-add-button';
const selectedLanguageSelector = '.e2e-test-selected-language';
const languageSelectorBodySelector = '.e2e-test-language-selector-modal-body';
const languageSelectorCloseButtonSelector =
  '.e2e-test-language-selector-close-button';

const roleEditorInputField = 'input.e2e-test-username-for-role-editor';
const roleEditorButtonSelector = 'button.e2e-test-role-edit-button';
const addRoleButton = 'button.oppia-add-role-button';
const rolesSelectDropdown = 'div.mat-select-trigger';
const selectTopicForAssignmentSelector = '.e2e-test-select-topic';

const justifyContentDiv = 'div.justify-content-between';
const userRoleDescriptionSelector = '.oppia-user-role-description';

export class SuperAdmin extends LoggedInUser {
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
        (element: SVGElement | HTMLElement) =>
          (element as HTMLElement).innerText,
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

  /**
   * The function expects the user to have the given role.
   * @param {string} username - The username of the user to check the role for.
   * @param {string} role - The role to check.
   */
  async expectUserToHaveRole(username: string, role: string): Promise<void> {
    const currentPageUrl = this.page.url();
    await this.goto(adminPageRolesTab);
    await this.typeInInputField(roleEditorInputField, username);
    await this.clickOnElementWithSelector(roleEditorButtonSelector);
    await this.expectElementToBeVisible(justifyContentDiv);
    const userRoleElements = await this.page.$$(userRoleDescriptionSelector);
    for (let i = 0; i < userRoleElements.length; i++) {
      const roleText = await this.page.evaluate(
        (element: SVGElement | HTMLElement) =>
          (element as HTMLElement).innerText,
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
   * Selects a topic for the Topic Manager role.
   * @param {string} topicName - The name of the topic to select.
   */
  private async selectTopicForTopicManagerRole(
    topicName: string
  ): Promise<void> {
    await this.expectElementToBeVisible(selectTopicForAssignmentSelector);
    const selectElement = await this.page.$(selectTopicForAssignmentSelector);
    if (!selectElement) {
      throw new Error('Select element not found');
    }

    await this.expectElementToBeVisible('.e2e-test-select-topic option');
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

        await this.select(selectTopicForAssignmentSelector, optionValue);
        await this.expectElementToBeVisible(addTopicButton);
        const button = await this.page.$(addTopicButton);
        if (!button) {
          throw new Error('Button not found');
        }
        await this.waitForElementToBeClickable(button);
        await button.click();

        await this.page.waitForFunction(
          ({selector, topic}: {selector: string; topic: string}) => {
            const assignedTopicElements = document.querySelectorAll(selector);
            for (const element of Array.from(assignedTopicElements)) {
              if (element.textContent === topic) {
                return true;
              }
            }
            return false;
          },
          {selector: assignedTopicSelector, topic: topicName}
        );
        return;
      }
    }

    throw new Error(`Topic "${topicName}" not found in the options`);
  }

  /**
   * Selects a language for the translation coordinator role.
   * Waits for the language selector to be ready before selecting to avoid
   * a race condition where the page resets the select value to the first
   * option after selection. After clicking 'Add Language', waits for the
   * selected languages list to reflect the newly added language.
   * @param {string} language - The language to select for the translation coordinator role.
   */
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
    await this.page.waitForFunction((selector: string) => {
      const element = document.querySelector(selector);
      return element && (element as HTMLSelectElement).value;
    }, selectElementSelector);
    await this.select(selectElementSelector, language);

    await this.clickOnElementWithSelector(addLanguageButtonSelector);

    await this.page.waitForFunction(
      ({
        selector,
        numberOfLanguages,
      }: {
        selector: string;
        numberOfLanguages: number;
      }) => {
        const elements = document.querySelectorAll(selector);
        return elements.length === numberOfLanguages;
      },
      {
        selector: selectedLanguageSelector,
        numberOfLanguages: initalNumberOfLanguages + 1,
      }
    );
  }
}

export const SuperAdminFactory = (page: Page): SuperAdmin => {
  return new SuperAdmin(page);
};
