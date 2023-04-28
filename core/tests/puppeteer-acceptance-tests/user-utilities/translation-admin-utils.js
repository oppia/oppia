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
 * @fileoverview Blog Admin users utility file.
 */

const baseUser = require(
  '../puppeteer-testing-utilities/puppeteer-utils.js');
const testConstants = require(
  '../puppeteer-testing-utilities/test-constants.js');
const { showMessage } = require(
  '../puppeteer-testing-utilities/show-message-utils.js');
const { timeout } = require('d3');
const ContributorDashboardAdminUrl = testConstants.URLs.ContributorDashboardAdmin;

const contributionRightCategoryReviewTranslation = 'REVIEW_TRANSLATION';
const contributorUsernameInputField = 'input.e2e-test-form-contributor-username';
const contributonRightsSelectDropdown = 'select.e2e-test-form-contribution-rights-category-select'
const contributonRightsLanguageDropdown = 'select.e2e-test-translation-reviewer-language'
const contributionRightsSubmitButton = 'button.e2e-test-contribution-rights-form-submit-button'
const reviewLanguage = 'span.e2e-test-translation-reviewer-language'


module.exports = class e2eBlogPostAdmin extends baseUser {
  /**
   * Function for adding blog post author bio in blog dashboard.
   */
  async addUserBioInBlogDashboard() {
    await this.type(blogAuthorBioField, 'Dummy-User-Bio');
    await this.page.waitForSelector(
      'button.e2e-test-save-author-details-button:not([disabled])');
    await this.clickOn(LABEL_FOR_SAVE_BUTTON);
  }

  /**
   * Function for navigating to the blog dashboard page.
   */
  async navigateToContributorDashboardAdminPage() {
    await this.goto(ContributorDashboardAdminUrl);
  }

  async assignTranslationRights(
    username, language) {
    await this.type(contributorUsernameInputField, username);
    await this.clickOn(contributonRightsSelectDropdown);
    await this.page.evaluate(async (right) => {
      const contributonRightsOptions = document.getElementsByClassName('mat-option-text');
      for (let i = 0; i < contributonRightsOptions.length; i++) {
        if (contributonRightsOptions[i].innerText === right) {
          contributonRightsOptions[i].click({ waitUntil: 'networkidle0' });
          return;
        }
      }
      await delay(25000);

      throw new Error(`Option ${right} does not exists.`);
    }, contributionRightCategoryReviewTranslation);

    await this.clickOn(contributonRightsLanguageDropdown);
    await this.page.evaluate(async (language) => {
      const languageDropdownOptions = document.getElementsByClassName('mat-option-text');
      for (let i = 0; i < languageDropdownOptions.length; i++) {
        if (languageDropdownOptions[i].innerText.contains(language)) {
          languageDropdownOptions[i].click({ waitUntil: 'networkidle0' });
          return;
        }
      }

      throw new Error(`Option ${language} does not exists.`);
    }, language);

    await this.clickOn(contributionRightsSubmitButton)
  };
};
