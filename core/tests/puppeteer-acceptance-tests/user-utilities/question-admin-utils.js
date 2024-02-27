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
const viewContributorFilterMethodSelector =
  'select#view-contributor-filter-method-select';
const viewContributerUsernameInput =
  'input#view-contributor-username-input';
const viewContributorCategorySelector =
  'select#view-contributor-category-select';
const viewContributorSubmitButton =
  'button#view-contributor-submit-button';

const viewContributorReviewQuestionsResult =
  '.e2e-test-question-reviewer';
const viewContributorSubmitQuestionResult =
  '.e2e-test-question-contributor';
const viewRoleUserResult =
  '.e2e-test-reviewer-roles-result';

// "Add Contribution Rights" form elements.
const addContributorUsernameInput =
  'input#add-contribution-rights-user-input';
const addContributonRightsCategorySelector =
  'select#add-contribution-rights-category-select';
const addContributionRightsSubmitButton =
   'button#add-contribution-rights-submit-button';

// "Remove Contribution Rights" form elements.
const removeContributorUsernameInput =
  'input#remove-contribution-rights-user-input';
const removeContributonRightsCategorySelector =
  'select#remove-contribution-rights-category-select';
const removeContributionRightsSubmitButton =
  'button#remove-contribution-rights-submit-button';

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
      addContributonRightsCategorySelector, reviewQuestionRightValue);
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
      addContributonRightsCategorySelector, submitQuestionRightValue);
    await this.clickOn(addContributionRightsSubmitButton);

    await this.page.waitForNetworkIdle();
  }

  /**
   * Function for removng a right of reviewing questions to a user.
   * @param {string} username - the username of the user.
   */
  async removeReviewQuestionRights(username) {
    await this.type(removeContributorUsernameInput, username);
    await this.select(
      removeContributonRightsCategorySelector, reviewQuestionRightValue);
    await this.clickOn(removeContributionRightsSubmitButton);

    await this.page.waitForNetworkIdle();
  }

  /**
   * Function for removing a right of reviewing questions to a user.
   * @param {string} username - the username of the user.
   */
  async removeSubmitQuestionRights(username) {
    await this.type(removeContributorUsernameInput, username);
    await this.select(
      removeContributonRightsCategorySelector, submitQuestionRightValue);
    await this.clickOn(removeContributionRightsSubmitButton);

    await this.page.waitForNetworkIdle();
  }

  /**
   * Function to return the list of question reviewers
   * @returns {string[]} displayedUsers - list of strings of all username
   */
  async getDisplayedListOfQuestionReviewers() {
    await this.select(viewContributorFilterMethodSelector, roleMethodValue);
    await this.select(
      viewContributorCategorySelector, reviewQuestionRightValue);
    await this.clickOn(viewContributorSubmitButton);

    await this.page.waitForNetworkIdle();

    await this.page.waitForSelector(viewRoleUserResult);
    const displayedUsers = await this.page.$eval(
      viewRoleUserResult,
      element => element.innerText
    );
    return displayedUsers;
  }

  /**
   * Function to return the list of question reviewers
   * @returns {string[]} displayedUsers - list of strings of all username
   */
  async getDisplayedListOfQuestionSubmitters() {
    await this.select(viewContributorFilterMethodSelector, roleMethodValue);
    await this.select(
      viewContributorCategorySelector, submitQuestionRightValue);
    await this.clickOn(viewContributorSubmitButton);

    await this.page.waitForNetworkIdle();

    await this.page.waitForSelector(viewRoleUserResult);
    const displayedUsers = await this.page.$eval(
      viewRoleUserResult,
      element => element.innerText
    );
    return displayedUsers;
  }

  /**
   * Function to return the contribution rights status for the user.
   * @param {string} username - the username of the user.
   * @param {string} contribution - the css element of
   * the result of contribution status to check
   * @returns {string} contributionStatusForUser - the string of the result
   */
  async getContributionStatusForUser(username, contribution) {
    await this.select(viewContributorFilterMethodSelector, usernameMethodValue);
    await this.type(viewContributerUsernameInput, username);
    await this.clickOn(viewContributorSubmitButton);

    await this.page.waitForNetworkIdle();

    await this.page.waitForSelector(contribution);
    const contributionStatusForUser = await this.page.$eval(
      contribution,
      element => element.innerText);
    return contributionStatusForUser;
  }

  /**
   * Function to check if the user has the right to review questions
   * @param {string} username - the username of the user to view.
   */
  async verifyUserCanReviewQuestions(username) {
    const questionReviewStatusForUser = await
    this.getContributionStatusForUser(
      username, viewContributorReviewQuestionsResult);

    if (questionReviewStatusForUser === 'Not-allowed') {
      throw new Error(
        `${username} does not have rights for reviewing questions!`);
    } else {
      showMessage(
        `${username} has rights for reviewing questions.`);
    }
  }

  /**
   * Function to check if the user has the right to submit questions
   * @param {string} username - the username of the user to view.
   */
  async verifyUserCanSubmitQuestions(username) {
    const questionSubmitStatusForUser = await
    this.getContributionStatusForUser(
      username, viewContributorSubmitQuestionResult);

    if (questionSubmitStatusForUser === 'Not-allowed') {
      throw new Error(
        `${username} does not have rights for submitting questions!`);
    } else {
      showMessage(
        `${username} has rights for submitting questions.`);
    }
  }

  /**
   * Function to check if the user doesn't have the right to review questions
   * @param {string} username - the username of the user to view.
   */
  async verifyUserCannotReviewQuestions(username) {
    const questionReviewStatusForUser = await
    this.getContributionStatusForUser(
      username, viewContributorReviewQuestionsResult);

    if (questionReviewStatusForUser === 'Allowed') {
      throw new Error(
        `${username} has rights for reviewing questions!`);
    } else {
      showMessage(
        `${username} doesn't have rights for reviewing questions.`);
    }
  }

  /**
   * Function to check if the user doesn't have the right to submit questions
   * @param {string} username - the username of the user to view.
   */
  async verifyUserCannotSubmitQuestions(username) {
    const questionSubmitStatusForUser = await
    this.getContributionStatusForUser(
      username, viewContributorSubmitQuestionResult);

    if (questionSubmitStatusForUser === 'Allowed') {
      throw new Error(
        `${username} has rights for submitting questions!`);
    } else {
      showMessage(
        `${username} doesn't have rights for submitting questions.`);
    }
  }

  /**
   * Function to check if the user is displayed as a question reviewer
   * @param {string} username - the user expected to be displayed.
   */
  async verifyQuestionReviewersIncludeUser(username) {
    const displayedUsers = await this.getDisplayedListOfQuestionReviewers();

    if (!displayedUsers.includes(username)) {
      throw new Error(
        `${username} does not have rights for reviewing questions!`);
    }
  }

  /**
   * Function to check if the user is displayed as a question submitter
   * @param {string} username - the user expected to be displayed.
   */
  async verifyQuestionSubmittersIncludeUser(username) {
    const displayedUsers = await this.getDisplayedListOfQuestionSubmitters();

    if (!displayedUsers.includes(username)) {
      throw new Error(
        `${username} does not have rights for submitting questions!`);
    }
  }

  /**
   * Function check if the user is not displayed as a question reviewer
   * @param {string} username - the user expected to not be displayed.
   */
  async verifyQuestionReviewersExcludeUser(username) {
    const displayedUsers = await this.getDisplayedListOfQuestionReviewers();

    if (displayedUsers.includes(username)) {
      throw new Error(
        `${username} has the right to review questions!`);
    }
  }

  /**
   * Function to check if the user is not displayed as a question submitter
   * @param {string} username - the user expected to not be displayed.
   */
  async verifyQuestionSubmittersExcludeUser(username) {
    const displayedUsers = await this.getDisplayedListOfQuestionSubmitters();

    if (displayedUsers.includes(username)) {
      throw new Error(
        `${username} has the right to submit questions!`);
    }
  }
};
