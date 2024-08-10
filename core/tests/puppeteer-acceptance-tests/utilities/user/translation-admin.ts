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
const viewContributerUsernameInput = 'input#view-contributor-username-input';
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
  }

  /**
   * Function for adding a translation right to a user.
   */

  async addTranslationLanguageReviewRights(
    username: string,
    languageCode: string
  ): Promise<void> {
    await this.type(addContributorUsernameInput, username);
    await this.select(
      addContributonRightsCategorySelect,
      translationRightValue
    );
    await this.select(addContributonRightsLanguageDropdown, languageCode);
    await this.clickOn(addContributionRightsSubmitButton);

    await this.waitForNetworkIdle();
  }

  /**
   * Function for removing a translation right from a user.
   */
  async removeTranslationLanguageReviewRights(
    username: string,
    languageCode: string
  ): Promise<void> {
    await this.type(removeContributorUsernameInput, username);
    await this.select(
      removeContributonRightsCategorySelect,
      translationRightValue
    );
    await this.select(removeContributonRightsLanguageSelect, languageCode);
    await this.clickOn(removeContributionRightsSubmitButton);

    await this.waitForNetworkIdle();
  }

  /**
   * Function to display contribution rights by user.
   */
  async viewContributionRightsForUser(username: string): Promise<void> {
    await this.select(viewContributorFilterMethodSelect, usernameMethodValue);
    await this.type(viewContributerUsernameInput, username);
    await this.clickOn(viewContributorSubmitButton);

    await this.waitForNetworkIdle();
  }

  /**
   * Function to display translation rights by language.
   */
  async viewContributorTranslationRightsByLanguageCode(
    languageCode: string
  ): Promise<void> {
    await this.select(viewContributorFilterMethodSelect, roleMethodValue);
    await this.select(viewContributorCategorySelect, translationRightValue);
    await this.select(viewContributorLanguageSelect, languageCode);
    await this.clickOn(viewContributorSubmitButton);

    await this.waitForNetworkIdle();
  }

  /**
   * Function to check if the language is displayed as a translation right.
   */
  async expectDisplayedLanguagesToContain(language: string): Promise<void> {
    await this.page.waitForSelector(viewContributorLanguageResult);
    const displayedLanguage = await this.page.$eval(
      viewContributorLanguageResult,
      element => (element as HTMLElement).innerText
    );
    if (!displayedLanguage.includes(language)) {
      throw new Error(
        `Selected user does not have translation rights for ${language}!`
      );
    } else {
      showMessage(
        `Selected user has translation rights for ${displayedLanguage}`
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
    await this.page.waitForSelector(viewLanguageRoleUserResult);
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
