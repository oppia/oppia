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
 * @fileoverview Playwright utility file for Translation Coordinator users.
 */

import {Page} from '@playwright/test';
import testConstants from '../common/test-constants';
import {LoggedInUser} from './logged-in-user';

const ContributorDashboardAdminUrl =
  testConstants.URLs.ContributorDashboardAdmin;

const tabSelectionDropdownMobileSelector = '.e2e-test-tab-selection-dropdown';
const addContributorButtonSelector = '.e2e-test-add-contributor-button';
const usernameInputBoxSelector = 'input.username-input-box';
const addRightsSubmitButtonSelector = '.e2e-test-add-rights-button';
const languageSelectorDropdownModalSelector =
  'select.e2e-test-language-selector';
const languageSelectorAddButtonSelector =
  '.e2e-test-language-selector-add-button';
const closeButtonSelector = '.e2e-test-close-button';
const languageFilterSelector = '.e2e-test-language-selector';
const contributorCountSelector = '.e2e-test-contributor-count';
const lastActivityDateFilterSelector = '.e2e-test-last-date-picker-input';
const statsRowItemSelector = '.e2e-test-stats-list-item';
const removeLanguageButtonSelector =
  '.e2e-test-selected-language-container button';

export class TranslationCoordinator extends LoggedInUser {
  /**
   * Navigates to the contributor dashboard admin page.
   */
  async navigateToContributorAdminDashboardPage(): Promise<void> {
    await this.goto(ContributorDashboardAdminUrl);
    await this.waitForPageToFullyLoad();
  }

  /**
   * Switches to the tab in the contributor dashboard admin page.
   */
  async switchToTabInContributorAdminPage(
    tabName:
      | 'Translation Submitters'
      | 'Translation Reviewers'
      | 'Question Submitters'
      | 'Question Reviewers'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const modifiedName = tabName.replace(/s$/, '');
      await this.expectElementToBeVisible(tabSelectionDropdownMobileSelector);
      await this.clickOnElementWithSelector(tabSelectionDropdownMobileSelector);
      await this.clickOnElementWithText(modifiedName);
    } else {
      const tabNameInLowerCase = tabName.toLocaleLowerCase().replace(/ /g, '-');
      const tabSelector = `.e2e-test-${tabNameInLowerCase}-tab`;
      await this.expectElementToBeVisible(tabSelector);
      await this.clickOnElementWithSelector(tabSelector);
    }
  }

  /**
   * Clicks on the add contributor button.
   */
  async clickOnAddReviewerOrSubmitterButton(): Promise<void> {
    await this.expectElementToBeVisible(addContributorButtonSelector);
    await this.clickOnElementWithSelector(addContributorButtonSelector);
    await this.expectElementToBeVisible(usernameInputBoxSelector);
  }

  /**
   * Adds username in the input modal and submits.
   */
  async addUsernameInUsernameInputModal(username: string): Promise<void> {
    await this.expectElementToBeVisible(usernameInputBoxSelector);
    await this.typeInInputField(usernameInputBoxSelector, username);
    await this.expectElementToBeVisible(addRightsSubmitButtonSelector);
    await this.clickOnElementWithSelector(addRightsSubmitButtonSelector);
  }

  /**
   * Adds language in the selector modal.
   */
  async addLanguageInLanguageSelectorModal(
    languageCode: string,
    languageName: string
  ): Promise<void> {
    await this.expectElementToBeVisible(languageSelectorDropdownModalSelector);
    await this.page.selectOption(
      languageSelectorDropdownModalSelector,
      languageCode
    );
    await this.clickOnElementWithSelector(languageSelectorAddButtonSelector);
  }

  /**
   * Removes language from the selector modal.
   */
  async removeLanguageFromLanguageSelectorModal(
    languageName: string
  ): Promise<void> {
    await this.expectElementToBeVisible(removeLanguageButtonSelector);
    await this.clickOnElementWithSelector(removeLanguageButtonSelector);
  }

  /**
   * Closes the language selector modal.
   */
  async closeLanguageSelectorModal(): Promise<void> {
    await this.expectElementToBeVisible(closeButtonSelector);
    await this.clickOnElementWithSelector(closeButtonSelector);
  }

  /**
   * Selects language in the admin page filter dropdown.
   */
  async selectLanguageInAdminPage(language: string): Promise<void> {
    await this.expectElementToBeVisible(languageFilterSelector);
    await this.clickOnElementWithSelector(languageFilterSelector);
    await this.clickOnElementWithText(language);
  }

  /**
   * Verifies number of contributors in the table.
   */
  async expectNumberOfContributorsToBe(count: number): Promise<void> {
    await this.expectElementToBeVisible(contributorCountSelector);
    await this.expectTextContentToBe(contributorCountSelector, String(count));
  }

  /**
   * Sets last activity date filter to Yesterday.
   */
  async setLastActivityDateFilterToYesterday(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const year = yesterday.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;

    if (await this.isElementVisible(lastActivityDateFilterSelector)) {
      await this.typeInInputField(
        lastActivityDateFilterSelector,
        formattedDate
      );
      await this.page.keyboard.press('Enter');
    }
  }

  /**
   * Verifies number of stats rows in the table.
   */
  async expectNumberOfStatsRowsToBe(count: number): Promise<void> {
    if (count === 0) {
      await this.expectElementToBeVisible(statsRowItemSelector, false);
    } else {
      await this.expectComponentCountToEqual(statsRowItemSelector, count);
    }
  }
}

export let TranslationCoordinatorFactory = (
  page: Page
): TranslationCoordinator => new TranslationCoordinator(page);
