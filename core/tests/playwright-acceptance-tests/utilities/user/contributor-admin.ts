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
 * @fileoverview Utility file for tasks shared by all contributor admin users.
 */

import {expect, Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';

const ContributorDashboardAdminUrl =
  testConstants.URLs.ContributorDashboardAdmin;

const activeTabInContributorAdminPageSelector = '.dashboard-tabs-active';
const addContributorButtonSelector = '.e2e-test-add-contributor-button';
const commonModalTitleSelector = '.e2e-test-modal-header';
const commonModalContainerSelector = '.e2e-test-modal-container';
const addRightsButtonSelector = '.e2e-test-add-rights-button';
const contributorCountSelector = '.e2e-test-contributor-count';
const lastDatePickerInputSelector = '.e2e-test-last-date-picker-input';
const mobileLastDatePickerInputSelector =
  '.e2e-test-mobile-last-date-picker-input';
const statsListItemSelector = '.e2e-test-stats-list-item';
const statsTableSelector = '.e2e-test-stats-table';
const tabSelectionDropdownMobileSelector = '.e2e-test-tab-selection-dropdown';
const newContributorAdminDashboardPageSelector =
  '.e2e-test-new-contributor-admin-dashboard-page';
const oldContributorAdminDashboardPageSelector =
  '.oppia-contributor-dashboard-admin-page-tabs-container';

export class ContributorAdmin extends BaseUser {
  /**
   * Function for navigating to the contributor dashboard admin page.
   */
  async navigateToContributorDashboardAdminPage(): Promise<void> {
    await this.goto(ContributorDashboardAdminUrl);
    const newDashVisible = await this.isElementVisible(
      newContributorAdminDashboardPageSelector
    );
    const oldDashVisible = await this.isElementVisible(
      oldContributorAdminDashboardPageSelector
    );
    expect(newDashVisible || oldDashVisible).toBe(true);
  }

  /**
   * Switches to the tab in the contributor dashboard admin page.
   * @param tabName - The name of the tab to switch to.
   */
  async switchToTabInContributorAdminPage(
    tabName:
      | 'Translation Submitters'
      | 'Translation Reviewers'
      | 'Question Submitters'
      | 'Question Reviewers'
      | 'Translation Coordinators'
      | 'Question Coordinators'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const modifiedName = tabName.replace(/s$/, '');
      await this.expectElementToBeVisible(tabSelectionDropdownMobileSelector);
      await this.updateMatOption(
        tabSelectionDropdownMobileSelector,
        modifiedName
      );
    } else {
      const tabNameInLowerCase = tabName.toLocaleLowerCase().replace(' ', '-');
      const tabSelector = `.e2e-test-${tabNameInLowerCase}-tab`;
      await this.expectElementToBeVisible(tabSelector);
      await this.clickOnElementWithSelector(tabSelector);

      const activeTabSelector = `${activeTabInContributorAdminPageSelector} ${tabSelector}`;
      await this.expectTextContentToBe(
        activeTabSelector,
        tabName.replace(' ', '')
      );
    }
  }

  /**
   * Clicks on the add contributor button.
   */
  async clickOnAddReviewerOrSubmitterButton(): Promise<void> {
    await this.expectElementToBeVisible(addContributorButtonSelector);
    await this.clickOnElementWithSelector(addContributorButtonSelector);

    await this.expectElementToBeVisible(commonModalTitleSelector);
    await this.expectTextContentToContain(
      commonModalTitleSelector,
      'Enter the username to add'
    );
  }

  /**
   * Adds a username in the username input modal and clicks on the add rights button.
   * @param username - The username to add.
   */
  async addUsernameInUsernameInputModal(username: string): Promise<void> {
    await this.expectElementToBeVisible(commonModalContainerSelector);
    const modalContainer = await this.page.$(commonModalContainerSelector);
    if (!modalContainer) {
      throw new Error('Modal container not found.');
    }

    const usernameInputSelector = `${commonModalContainerSelector} input`;
    await this.typeInInputField(usernameInputSelector, username);

    await this.clickOnElementWithSelector(addRightsButtonSelector);
    await this.expectElementToBeVisible(addRightsButtonSelector, false);
  }

  /**
   * Checks if the number of contributors is as expected.
   * @param number - The expected number of contributors.
   */
  async expectNumberOfContributorsToBe(number: number): Promise<void> {
    await this.expectTextContentToBe(
      contributorCountSelector,
      number.toString()
    );
  }

  /**
   * Sets the "last activity" date filter to yesterday.
   */
  async setLastActivityDateFilterToYesterday(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const day = String(yesterday.getDate()).padStart(2, '0');
    const month = yesterday.toLocaleString('en-US', {month: 'short'});
    const year = String(yesterday.getFullYear());
    const yesterdayDate = `${day}-${month}-${year}`;
    const dateInputSelector = this.isViewportAtMobileWidth()
      ? mobileLastDatePickerInputSelector
      : lastDatePickerInputSelector;

    await this.page.locator(dateInputSelector).fill(yesterdayDate);
    await this.page.keyboard.press('Enter');
    await this.expectElementValueToBe(dateInputSelector, yesterdayDate);
  }

  /**
   * Checks if the number of contributor stats rows in the table is as expected.
   * @param number - The expected number of stats rows.
   */
  async expectNumberOfStatsRowsToBe(number: number): Promise<void> {
    await this.page.waitForFunction(
      ({
        selector,
        expectedCount,
      }: {
        selector: string;
        expectedCount: number;
      }) => {
        const rows = document.querySelectorAll(selector);
        return rows.length === expectedCount;
      },
      {
        selector: statsListItemSelector,
        expectedCount: number,
      }
    );
  }

  /**
   * Checks that the contributor stats table has rendered.
   */
  async expectStatsTableToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(statsTableSelector);
  }
}

export const ContributorAdminFactory = (page: Page): ContributorAdmin => {
  return new ContributorAdmin(page);
};
