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
 * @fileoverview Utility class for translation admins.
 */

import {Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';

const ContributorDashboardAdminUrl =
  testConstants.URLs.ContributorDashboardAdmin;

const translationRightValue = 'translation';

// "Add Contribution Rights" form elements.
const addContributorUsernameInput = 'input#add-contribution-rights-user-input';
const addContributonRightsCategorySelect =
  'select#add-contribution-rights-category-select';
const addContributonRightsLanguageDropdown =
  'select#add-contribution-rights-language-select';
const addContributionRightsSubmitButton =
  'button#add-contribution-rights-submit-button';

const actionStatusMessageSelector = '.e2e-test-status-message';

export class TranslationAdmin extends BaseUser {
  /**
   * Navigates to the contributor dashboard admin page.
   */
  async navigateToContributorDashboardAdminPage(): Promise<void> {
    await this.goto(ContributorDashboardAdminUrl);
  }

  /**
   * Adds translation review rights for a user in the given language.
   *
   * @param username - The username of the user.
   * @param languageCode - The language code (e.g. 'hi' for Hindi).
   */
  async addTranslationLanguageReviewRights(
    username: string,
    languageCode: string
  ): Promise<void> {
    await this.expectElementToBeVisible(addContributorUsernameInput);
    await this.typeInInputField(addContributorUsernameInput, username);
    await this.select(
      addContributonRightsCategorySelect,
      translationRightValue
    );
    await this.select(addContributonRightsLanguageDropdown, languageCode);
    await this.clickOnElementWithSelector(addContributionRightsSubmitButton);

    // The status message first shows 'Adding contribution rights...' and
    // then changes to 'Success.' once the rights have been granted.
    await this.waitForNetworkIdle();
    await this.expectTextContentToContain(
      actionStatusMessageSelector,
      'Success.'
    );
  }
}

export const TranslationAdminFactory = (page: Page): TranslationAdmin => {
  return new TranslationAdmin(page);
};
