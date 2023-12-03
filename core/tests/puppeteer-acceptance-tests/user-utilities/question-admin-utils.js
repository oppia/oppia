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

const reviewQuestionRightValue = 'string:question';
const submitQuestionRightValue = 'string:submit_question';
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
const viewContributorSubmitQuestionResult =
  '.e2e-test-question-contributor';
const viewRoleUserResult =
  '.e2e-test-reviewer-roles-result';

// "Add Contribution Rights" form elements.
const addContributorUsernameInput =
  'input#add-contribution-rights-user-input';
const addContributonRightsCategorySelect =
  'select#add-contribution-rights-category-select';
const addContributionRightsSubmitButton =
   'button#add-contribution-rights-submit-button';

// "Remove Contribution Rights" form elements.
const removeContributorUsernameInput =
  'input#remove-contribution-rights-user-input';
const removeContributonRightsCategorySelect =
  'select#remove-contribution-rights-category-select';
const removeContributionRightsSubmitButton =
  'button#remove-contribution-rights-submit-button';

/**
 * Function to display the list of question reviewers
 * @param {object} user - the class object of the user.
 */
let getDisplayedListOfQuestionReviewers = async function(user) {
  await user.select(viewContributorFilterMethodSelect, roleMethodValue);
  await user.select(viewContributorCategorySelect, reviewQuestionRightValue);
  await user.clickOn(viewContributorSubmitButton);

  await user.page.waitForNetworkIdle();
};

/**
 * Function to display the list of question reviewers
 * @param {object} user - the class object of the user.
 */
let getDisplayedListOfQuestionSubmitters = async function(user) {
  await user.select(viewContributorFilterMethodSelect, roleMethodValue);
  await user.select(viewContributorCategorySelect, submitQuestionRightValue);
  await user.clickOn(viewContributorSubmitButton);

  await user.page.waitForNetworkIdle();
};

/**
 * Function to display the contribution rights status for the user.
 * @param {object} user - the class object of the user.
 * @param {string} username - the username of the user.
 */
let contributionStatusForUser = async function(user, username) {
  await user.select(viewContributorFilterMethodSelect, usernameMethodValue);
  await user.type(viewContributerUsernameInput, username);
  await user.clickOn(viewContributorSubmitButton);

  await user.page.waitForNetworkIdle();
};

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
   * Function for removng a right of reviewing questions to a user.
   * @param {string} username - the username of the user.
   */
  async removeReviewQuestionRights(username) {
    await this.type(removeContributorUsernameInput, username);
    await this.select(
      removeContributonRightsCategorySelect, reviewQuestionRightValue);
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
      removeContributonRightsCategorySelect, submitQuestionRightValue);
    await this.clickOn(removeContributionRightsSubmitButton);

    await this.page.waitForNetworkIdle();
  }

  /**
   * Function to check if the user has the right to review questions
   * @param {string} username - the username of the user to view.
   */
  async verifyUserCanReviewQuestions(username) {
    await contributionStatusForUser(this, username);

    await this.page.waitForSelector(viewContributorReviewQuestionsResult);
    const questionReviewStatusForUser = await this.page.$eval(
      viewContributorReviewQuestionsResult,
      element => element.innerText);
    if (questionReviewStatusForUser.includes('Not-allowed')) {
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
    await contributionStatusForUser(this, username);

    await this.page.waitForSelector(viewContributorSubmitQuestionResult);
    const questionSubmitStatusForUser = await this.page.$eval(
      viewContributorSubmitQuestionResult,
      element => element.innerText);
    if (questionSubmitStatusForUser.includes('Not-allowed')) {
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
    await contributionStatusForUser(this, username);

    await this.page.waitForSelector(viewContributorReviewQuestionsResult);
    const questionReviewStatusForUser = await this.page.$eval(
      viewContributorReviewQuestionsResult,
      element => element.innerText);
    if (!questionReviewStatusForUser.includes('Not-allowed')) {
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
    await contributionStatusForUser(this, username);

    await this.page.waitForSelector(viewContributorSubmitQuestionResult);
    const questionSubmitStatusForUser = await this.page.$eval(
      viewContributorSubmitQuestionResult,
      element => element.innerText);
    if (!questionSubmitStatusForUser.includes('Not-allowed')) {
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
    await getDisplayedListOfQuestionReviewers(this);

    await this.page.waitForSelector(viewRoleUserResult);
    const displayedUsers = await this.page.$eval(
      viewRoleUserResult,
      element => element.innerText
    );
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
    await getDisplayedListOfQuestionSubmitters(this);

    await this.page.waitForSelector(viewRoleUserResult);
    const displayedUsers = await this.page.$eval(
      viewRoleUserResult,
      element => element.innerText
    );
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
    await getDisplayedListOfQuestionReviewers(this);

    await this.page.waitForSelector(viewRoleUserResult);
    const displayedUsers = await this.page.$eval(
      viewRoleUserResult,
      element => element.innerText
    );
    if (displayedUsers.includes(username)) {
      throw new Error(
        `${username} has the right to review question!`);
    }
  }

  /**
   * Function to check if the user is not displayed as a question submitter
   * @param {string} username - the user expected to not be displayed.
   */
  async verifyQuestionSubmittersExcludeUser(username) {
    await getDisplayedListOfQuestionSubmitters(this);

    await this.page.waitForSelector(viewRoleUserResult);
    const displayedUsers = await this.page.$eval(
      viewRoleUserResult,
      element => element.innerText
    );
    if (displayedUsers.includes(username)) {
      throw new Error(
        `${username} has the right to submit question!`);
    }
  }
};
