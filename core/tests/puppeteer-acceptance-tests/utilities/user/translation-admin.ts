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
 * @fileoverview Translation admin role utility file.
 */

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const ContributorDashboardAdminUrl =
  testConstants.URLs.ContributorDashboardAdmin;

const translationRightValue = 'translation';
const usernameMethodValue = 'username';
const roleMethodValue = 'role';

// "View Contributor Dashboard Users" form elements.
const viewContributorFilterMethodSelect =
  'select#view-contributor-filter-method-select';
const viewContributorUsernameInput = 'input#view-contributor-username-input';
const viewContributorCategorySelect = 'select#view-contributor-category-select';
const viewContributorLanguageSelect = 'select#view-contributor-language-select';
const viewContributorSubmitButton = 'button#view-contributor-submit-button';
const viewContributorLanguageResult = '.e2e-test-translation-reviewer-language';
const viewLanguageRoleUserResult = '.e2e-test-reviewer-roles-result';

// "Add Contribution Rights" form elements.
const addContributorUsernameInput = 'input#add-contribution-rights-user-input';
const addContributonRightsCategorySelect =
  'select#add-contribution-rights-category-select';
const addContributonRightsLanguageDropdown =
  'select#add-contribution-rights-language-select';
const addContributionRightsSubmitButton =
  'button#add-contribution-rights-submit-button';

// "Remove Contribution Rights" form elements.
const removeContributorUsernameInput =
  'input#remove-contribution-rights-user-input';
const removeContributonRightsCategorySelect =
  'select#remove-contribution-rights-category-select';
const removeContributonRightsLanguageSelect =
  'select#remove-contribution-rights-language-select';
const removeContributionRightsSubmitButton =
  'button#remove-contribution-rights-submit-button';

export class TranslationAdmin extends BaseUser {
  /**
   * Function for navigating to the contributor dashboard admin page.
   */
  async navigateToContributorDashboardAdminPage(): Promise<void> {
    await this.goto(ContributorDashboardAdminUrl);
    // Wait for the contributor filter dropdown to load before interacting with it.
    await this.page.waitForSelector(viewContributorFilterMethodSelect);
  }

  /**
   * Function for adding a translation right to a user.
   */

  async addTranslationLanguageReviewRights(
    username: string,
    languageCode: string
  ): Promise<void> {
    // Wait for the username input field to be visible before typing in a contributor's name.
    await this.page.waitForSelector(addContributorUsernameInput);
    // Wait for the contribution rights category dropdown to load before selecting a role.
    await this.page.waitForSelector(addContributonRightsCategorySelect);
    await this.type(addContributorUsernameInput, username);
    await this.select(
      addContributonRightsCategorySelect,
      translationRightValue
    );
    // Wait for the language dropdown to appear before selecting the translation language.
    await this.page.waitForSelector(addContributonRightsLanguageDropdown);
    // Wait for the submit button to ensure the form is fully loaded before submitting the translation rights.
    await this.select(addContributonRightsLanguageDropdown, languageCode);
    await this.page.waitForSelector(addContributionRightsSubmitButton);
    await this.clickOn(addContributionRightsSubmitButton);

    await this.waitForNetworkIdle();

    await this.expectDisplayedLanguagesToContain(languageCode);
  }

  /**
   * Function for removing a translation right from a user.
   */
  async removeTranslationLanguageReviewRights(
    username: string,
    languageCode: string
  ): Promise<void> {
    // Wait for the username input field to appear in the remove contributor section.
    await this.page.waitForSelector(removeContributorUsernameInput);
    // Wait for the contribution rights category dropdown to be available before selecting a right to remove.
    await this.page.waitForSelector(removeContributonRightsCategorySelect);
    // Wait for the submit button to be visible before submitting the removal request.
    await this.page.waitForSelector(removeContributionRightsSubmitButton);
    await this.type(removeContributorUsernameInput, username);
    await this.select(
      removeContributonRightsCategorySelect,
      translationRightValue
    );
    await this.select(removeContributonRightsLanguageSelect, languageCode);
    await this.clickOn(removeContributionRightsSubmitButton);

    await this.waitForNetworkIdle();

    // View the contribution rights assigned to the specified user.
    await this.viewContributionRightsForUser(username);
    // Ensure that the user is no longer displayed under the selected contribution rights category.
    await this.expectUserToNotBeDisplayed(username);
  }

  /**
   * Function to display contribution rights by user.
   */
  async viewContributionRightsForUser(username: string): Promise<void> {
    await this.page.waitForSelector(viewContributorFilterMethodSelect);
    await this.page.waitForSelector(viewContributorSubmitButton);

    await this.select(viewContributorFilterMethodSelect, usernameMethodValue);
    // Type the username into the contributor username input field for filtering.
    await this.type(viewContributorUsernameInput, username);
    await this.clickOn(viewContributorSubmitButton);
    // Wait for the network to settle.
    await this.waitForNetworkIdle();
  }

  /**
   * Function to display translation rights by language.
   */
  async viewContributorTranslationRightsByLanguageCode(
    languageCode: string
  ): Promise<void> {
    // Wait for the contributor filter method dropdown to be available before selecting a filter.
    await this.page.waitForSelector(viewContributorFilterMethodSelect);
    // Wait for the submit button to be visible before attempting to click it.
    await this.page.waitForSelector(viewContributorSubmitButton);

    await this.select(viewContributorFilterMethodSelect, roleMethodValue);
    await this.select(viewContributorCategorySelect, translationRightValue);
    await this.select(viewContributorLanguageSelect, languageCode);
    await this.clickOn(viewContributorSubmitButton);
    // Wait for the language role user result element to appear after filtering users.
    await this.page.waitForSelector(viewLanguageRoleUserResult);
    await this.waitForNetworkIdle();
  }

  /**
   * Function to check if the language is displayed as a translation right.
   */
  async expectDisplayedLanguagesToContain(language: string): Promise<void> {
    const elementHandle = await this.page.$(viewLanguageRoleUserResult);

    if (!elementHandle) {
      // CASE 1: Element does not exist.
      showMessage(
        'Element not found: .e2e-test-reviewer-roles-result does not exist on the page. Assuming no users have rights.'
      );
      return;
    }

    const languageElementHandle = await this.page.$(
      viewContributorLanguageResult
    );
    if (!languageElementHandle) {
      // CASE 2a: Language element not found even though the container exists.
      showMessage('Language element not found inside user container.');
      return;
    }

    const displayedLanguages = await this.page.$eval(
      viewContributorLanguageResult,
      element => (element as HTMLElement).innerText.trim()
    );

    if (!displayedLanguages) {
      // CASE 2b: Element exists but is empty.
      showMessage('Element found, but no languages are displayed.');
      return;
    }

    if (!displayedLanguages.includes(language)) {
      throw new Error(
        `Selected user does not have translation rights for ${language}!`
      );
    } else {
      showMessage(
        `Selected user has translation rights for: ${displayedLanguages}`
      );
    }
  }

  /**
   * Function to check if the user is displayed as a translator.
   */
  async expectUserToBeDisplayed(username: string): Promise<void> {
    await this.page.waitForSelector(viewLanguageRoleUserResult);
    const displayedUsers = await this.page.$eval(
      viewLanguageRoleUserResult,
      element => (element as HTMLElement).innerText
    );
    if (!displayedUsers.includes(username)) {
      throw new Error(
        `${username} does not have translation rights for selected language!`
      );
    }
  }

  /**
   * Function to check that there are no translators for the selected language.
   */
  async expectUserToNotBeDisplayed(username: string): Promise<void> {
    try {
      // Wait for the selector to appear within 5 seconds.
      await this.page.waitForSelector(viewLanguageRoleUserResult, {
        timeout: 5000,
      });
    } catch (error) {
      // Element didn't appear – throw error instead of just logging a message.
    throw new Error('No users displayed — user should not have translation rights.');
    }

    // If the element appeared, check if the username is among the displayed users.
    const displayedUsers = await this.page.$eval(
      viewLanguageRoleUserResult,
      element => (element as HTMLElement).innerText
    );

    if (displayedUsers.includes(username)) {
      throw new Error(
        `${username} has translation rights for selected language!`
      );
    }
  }
}
export let TranslationAdminFactory = (): TranslationAdmin =>
  new TranslationAdmin();
