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
 * @fileoverview Question admin users utility file.
 */

import {Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const contributorDashboardAdminUrl =
  testConstants.URLs.ContributorDashboardAdmin;

const reviewQuestionRightValue = 'question';
const submitQuestionRightValue = 'submit_question';

// "Add Contribution Rights" form elements.
const addContributorUsernameInput = 'input#add-contribution-rights-user-input';
const addContributonRightsCategorySelector =
  'select#add-contribution-rights-category-select';
const addContributionRightsSubmitButton =
  'button#add-contribution-rights-submit-button';

export class QuestionAdmin extends BaseUser {
  /**
   * Function for navigating to the contributor dashboard admin page.
   */
  async navigateToContributorDashboardAdminPage(): Promise<void> {
    await this.goto(contributorDashboardAdminUrl);
  }

  /**
   * Function for adding a contribution right to a user.
   * @param {string} username - The username of the user.
   * @param {string} rightValue - The value of the right in the category dropdown.
   */
  private async addContributionRightsToUser(
    username: string,
    rightValue: string
  ): Promise<void> {
    await this.typeInInputField(addContributorUsernameInput, username);
    await this.select(addContributonRightsCategorySelector, rightValue);
    await this.clickOnElementWithSelector(addContributionRightsSubmitButton);

    await this.waitForNetworkIdle();
    await this.expectElementToBeClickable(
      addContributionRightsSubmitButton,
      false
    );
  }

  /**
   * Function for adding a right of reviewing questions to a user.
   * @param {string} username - The username of the user.
   */
  async addReviewQuestionRights(username: string): Promise<void> {
    await this.addContributionRightsToUser(username, reviewQuestionRightValue);
    showMessage(`Added review question rights to ${username}.`);
  }

  /**
   * Function for adding a right of submitting questions to a user.
   * @param {string} username - The username of the user.
   */
  async addSubmitQuestionRights(username: string): Promise<void> {
    await this.addContributionRightsToUser(username, submitQuestionRightValue);
    showMessage(`Added submit question rights to ${username}.`);
  }
}

export const QuestionAdminFactory = (page: Page): QuestionAdmin => {
  return new QuestionAdmin(page);
};
