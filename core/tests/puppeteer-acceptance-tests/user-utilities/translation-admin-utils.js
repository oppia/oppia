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
const contributorUsernameInputField =
  'input.e2e-test-form-contributor-username';
const contributonRightsSelectDropdown =
  'select#label-target-form-add-category-select';
const contributonRightsLanguageDropdown =
  'select.e2e-test-form-language-select';
const contributionRightsSubmitButton =
  'button.e2e-test-contribution-rights-form-submit-button';

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
   * @param {string} language - the language the user can translate.
   */
  async assignTranslationRights(username, language) {
    await this.select(contributonRightsSelectDropdown, translationRightValue);
    await this.type(contributorUsernameInputField, username);
    await this.clickOn(contributorUsernameInputField);
    await this.select(contributonRightsLanguageDropdown, language);
    await this.clickOn(contributionRightsSubmitButton);
  }
};
