// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Question admin users utility file.
 */

import {Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';

const reviewQuestionRightValue = 'question';
const submitQuestionRightValue = 'submit_question';

const addContributorUsernameInput = 'input#add-contribution-rights-user-input';
const addContributionRightsCategorySelector =
  'select#add-contribution-rights-category-select';
const addContributionRightsSubmitButton =
  'button#add-contribution-rights-submit-button';
const statusMessageSelector = '.e2e-test-status-message';

export class QuestionAdmin extends BaseUser {
  /**
   * Adds the right to review questions to a user.
   * @param username - The username that should receive the right.
   */
  async addReviewQuestionRights(username: string): Promise<void> {
    await this.addQuestionRights(username, reviewQuestionRightValue);
  }

  /**
   * Adds the right to submit questions to a user.
   * @param username - The username that should receive the right.
   */
  async addSubmitQuestionRights(username: string): Promise<void> {
    await this.addQuestionRights(username, submitQuestionRightValue);
  }

  /**
   * Adds a question contribution right to a user.
   * @param username - The username that should receive the right.
   * @param right - The contribution right to add.
   */
  private async addQuestionRights(
    username: string,
    right: 'question' | 'submit_question'
  ): Promise<void> {
    await this.typeInInputField(addContributorUsernameInput, username);
    await this.select(addContributionRightsCategorySelector, right);
    await this.clickOnElementWithSelector(addContributionRightsSubmitButton);

    await this.expectElementToBeClickable(
      addContributionRightsSubmitButton,
      false
    );
    await this.expectTextContentToBe(statusMessageSelector, 'Success.');
  }
}

export const QuestionAdminFactory = (page: Page): QuestionAdmin => {
  return new QuestionAdmin(page);
};
