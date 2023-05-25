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
 * @fileoverview Translation admin users utility file.
 */

const baseUser = require(
  '../puppeteer-testing-utilities/puppeteer-utils.js');
const testConstants = require(
  '../puppeteer-testing-utilities/test-constants.js');
const ContributorDashboardAdminUrl =
  testConstants.URLs.ContributorDashboardAdmin;

const translationRightValue = 'string:translation';
const usernameMethodVaue = 'username';
const roleMethodVaue = 'role';

// "View Contributor Dashboard Users" form elements
const viewContributorMethodSelect = 
  'select#view-contributor-method-select';
const viewContributerUsernameInput =
  'input#view-contributor-username-input';
const viewContributorCategorySelect =
  'select#view-contributor-category-select';
const viewContributorLanguageSelect =
  'select#view-contributor-language-select';
const viewContributorSubmitButton = 
  'button#view-contributor-submit-button';
const viewContributorLanguageResult = 
  '.e2e-test-translation-reviewer-language'
const viewLanguageRoleUserResult =
  '.e2e-test-reviewer-roles-result'

// "Add Contribution Rights" form elements
const addContributorUsernameInput =
  'input#add-contribution-rights-user-input';
const addContributonRightsCategorySelect =
  'select#add-contribution-rights-category-select';
const addContributonRightsLanguageDropdown =
  'select#add-contribution-rights-language-select';
const addontributionRightsSubmitButton =
   'button#add-contribution-rights-submit-button';

// "Remove Contribution Rights" form elements
const revokeContributorUsernameInput =
   'input#revoke-contribution-rights-user-input';
 const revokeContributonRightsCategorySelect =
   'select#revoke-contribution-rights-category-select';
 const revokeContributonRightsLanguageSelect =
   'select#revoke-contribution-rights-language-select';
 const revokeContributionRightsSubmitButton =
    'button#revoke-contribution-rights-submit-button';

module.exports = class TranslationAdmin extends baseUser {
  /**
   * Function for navigating to the blog dashboard page.
   */
  async navigateToContributorDashboardAdminPage() {
    await this.goto(ContributorDashboardAdminUrl);
  }

  /**
   * Function for assigning a translation right to a user.
   * @param {string} username - the username of the user.
   * @param {string} language - the language the user needing transltion rights.
   */
  async assignTranslationRights(username, language) {
    await this.type(addContributorUsernameInput, username);
    await this.select(
      addContributonRightsCategorySelect, translationRightValue);
    await this.select(addContributonRightsLanguageDropdown, language);
    await this.clickOn(addontributionRightsSubmitButton);

    // Wait a moment for changes to take effect.
    await this.page.waitForTimeout(500);
  }

  /**
   * Function for revoking a translation right to from user.
   * @param {string} username - the username of the user.
   * @param {string} language - the language the user with translation rights.
   */
  async revokeTranslationRights(username, language) {
    await this.type(revokeContributorUsernameInput, username);
    await this.select(
      revokeContributonRightsCategorySelect, translationRightValue);
    await this.select(revokeContributonRightsLanguageSelect, language);
    await this.clickOn(revokeContributionRightsSubmitButton);
  }

  /**
   * Function to display contributon rights by user.
   * @param {string} username - the user to view.
   */
  async viewContributorRightsByUser(username) {
    await this.select(viewContributorMethodSelect, usernameMethodVaue);
    await this.type(viewContributerUsernameInput, username);
    await this.clickOn(viewContributorSubmitButton);
  }

    /**
   * Function to display translation rights by language.
   * @param {string} language - the language option as an option value
   */
  async viewContributorTranslationRightsByLanguage(language) {
    await this.select(viewContributorMethodSelect, roleMethodVaue);
    await this.select(viewContributorCategorySelect, translationRightValue);
    await this.select(viewContributorLanguageSelect, language);
    await this.clickOn(viewContributorSubmitButton);

    // Wait a moment for usernames to appear.
    await this.page.waitForTimeout(500);
  }

  /**
   * Function to check if the language is displayed as a translation right.
   * @param {string} language - the language.
   */
  async expectLanguageToBeDisplayedforSelectedUser(language) {
    await this.page.waitForSelector(viewContributorLanguageResult);
    let displayedLanguage = await this.page.$eval(
      viewContributorLanguageResult,
      element => element.innerText);
    if (!displayedLanguage.includes(language)){
      throw new Error(
        `Selected user does not have translation rights for ${language}!`);
    } else {
      console.log(
        `Selected user has translation rights for ${displayedLanguage}`);
    }
  }

  async expectNoLanguagesToBeDisplayedSelectedUser() {
    try {
    let displayedLanguage = await this.page.$eval(
      viewContributorLanguageResult,
      el => el.innerText);
      throw new Error('Selected user has translation rights!');
    } catch (error) {
      console.log('User has no translation rights, as expected!');
    }
  }

  async expectUserToBeDisplayedForSelectedLanguage(user) {
    await this.page.waitForSelector(viewLanguageRoleUserResult);
    let displayedUsers = await this.page.$eval(
      viewLanguageRoleUserResult,
      element => element.innerText
    );
    if (!displayedUsers.includes(user)){
      throw new Error(
        `${user} does not have translation rights for selected language!`);
    }
  }
};
