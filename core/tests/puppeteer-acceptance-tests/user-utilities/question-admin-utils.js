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
 * @fileoverview Question admin users utility file.
 */

const baseUser = require(
  '../puppeteer-testing-utilities/puppeteer-utils.js');
const testConstants = require(
  '../puppeteer-testing-utilities/test-constants.js');
const contributorDashboardAdminUrl =
  testConstants.URLs.ContributorDashboardAdmin;
const { showMessage } = require(
  '../puppeteer-testing-utilities/show-message-utils.js');

const reviewQuestionRightValue = 'question';
const submitQuestionRightValue = 'submit_question';
const usernameMethodValue = 'username';
const roleMethodValue = 'role';

// "View Contributor Dashboard Users" form elements.
const viewContributorFilterMethodSelect =
  'select#view-contributor-filter-method-select';
const viewContributerUsernameInput =
  'input#view-contributor-username-input';
const viewContributorCategorySelect =
  'select#view-contributor-category-select';
const viewContributorSubmitButton =
  'button#view-contributor-submit-button';

const viewContributorReviewQuestionsResult =
  '.e2e-test-question-reviewer';
const viewReviewQuestionRoleUserResult =
  '.e2e-test-reviewer-roles-result';

// "Add Contribution Rights" form elements.
const addContributorUsernameInput =
  'input#add-contribution-rights-user-input';
const addContributonRightsCategorySelect =
  'select#add-contribution-rights-category-select';
const addContributionRightsSubmitButton =
   'button#add-contribution-rights-submit-button';

module.exports = class QuestionAdmin extends baseUser {
  /**
   * Function for navigating to the contributor dashboard admin page.
   */
  async navigateToContributorDashboardAdminPage() {
    await this.goto(contributorDashboardAdminUrl);
  }

  /**
   * Function for adding a right of reviewing questions to a user.
   * @param {string} username - the username of the user.
   */
  async addReviewQuestionRights(username) {
    await this.type(addContributorUsernameInput, username);
    await this.select(
      addContributonRightsCategorySelect, reviewQuestionRightValue);
    await this.clickOn(addContributionRightsSubmitButton);

    await this.page.waitForNetworkIdle();
  }

  /**
   * Function for adding a right of submitting questions to a user.
   * @param {string} username - the username of the user.
   */
  async addSubmitQuestionRights(username) {
    await this.type(addContributorUsernameInput, username);
    await this.select(
      addContributonRightsCategorySelect, submitQuestionRightValue);
    await this.clickOn(addContributionRightsSubmitButton);

    await this.page.waitForNetworkIdle();
  }

  /**
   * Function to display contribution rights by user.
   * @param {string} username - the username of the user to view.
   */
  async viewContributionRightsForUser(username) {
    await this.select(viewContributorFilterMethodSelect, usernameMethodValue);
    await this.type(viewContributerUsernameInput, username);
    await this.clickOn(viewContributorSubmitButton);

    await this.page.waitForNetworkIdle();
  }

  /**
   * Function to display reviewing questions rights by role.
   */
  async viewContributorReviewQuestionRightsByRole() {
    await this.select(viewContributorFilterMethodSelect, roleMethodValue);
    await this.select(viewContributorCategorySelect, reviewQuestionRightValue);
    await this.clickOn(viewContributorSubmitButton);

    await this.page.waitForNetworkIdle();
  }

  /**
   * Function to check if the username is displayed as one of the users
   * with rights of reviewing question.
   * @param {string} username - the username of the user to check.
   */
  async expectDisplayedUsersToContainReviewQuestionRights(username) {
    await this.page.waitForSelector(viewContributorReviewQuestionsResult);
    const displayedUsername = await this.page.$eval(
      viewContributorReviewQuestionsResult,
      element => element.innerText);
    if (displayedUsername.includes('Not-allowed')) {
      throw new Error(
        `${username} does not have rights for reviewing questions!`);
    } else {
      showMessage(
        `${username} has rights for reviewing questions!`);
    }
  }

  /**
   * Function to check if the user is displayed as a question reviewer.
   * @param {string} username - the user expected to be displayed.
   */
  async expectUserToBeDisplayed(username) {
    await this.page.waitForSelector(viewReviewQuestionRoleUserResult);
    const displayedUsers = await this.page.$eval(
      viewReviewQuestionRoleUserResult,
      element => element.innerText
    );
    if (!displayedUsers.includes(username)) {
      throw new Error(
        `${username} does not have rights for reviewing questions!`);
    }
  }

  /**
   * Function to check that there are no question reviewer.
   * @param {string} usename - the user expected to not be displayed.
   */
  async expectUserToNotBeDisplayed(username) {
    await this.page.waitForSelector(viewReviewQuestionRoleUserResult);
    const displayedUsers = await this.page.$eval(
      viewReviewQuestionRoleUserResult,
      element => element.innerText
    );
    if (displayedUsers.includes(username)) {
      throw new Error(
        `${username} has the right to review question!`);
    }
  }
};
