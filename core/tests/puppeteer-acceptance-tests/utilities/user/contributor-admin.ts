// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * These users include translation coordinators, and question coordinators.
 */

import {BaseUser} from '../common/puppeteer-utils';
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
const tabSelectionDropdownMobileSelector = '.e2e-test-tab-selection-dropdown';
const newContributorAdminDashboardPageSelector =
  '.e2e-test-new-contributor-admin-dashboard-page';
const oldContributorAdminDashboardPageSelector =
  '.oppia-contributor-dashboard-admin-page-tabs-container';
const featuredLanguagesEditorSelector =
  '.e2e-test-featured-translation-languages';
const toggleFeaturedLanguagesEditorSelector =
  '.e2e-test-toggle-featured-languages-editor';
const featuredLanguageSelectSelector = '#featured-language-select';
const featuredLanguageExplanationSelector = '#featured-language-explanation';
const addFeaturedLanguageButtonSelector = '.e2e-test-add-featured-language';
const saveFeaturedLanguagesButtonSelector = '.e2e-test-save-featured-languages';

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
   * @param {'Translation Submitters' | 'Translation Reviewers' | 'Question Submitters' | 'Question Reviewers'} tabName - The name of the tab to switch to.
   */
  async switchToTabInContributorAdminPage(
    tabName:
      | 'Translation Submitters'
      | 'Translation Reviewers'
      | 'Question Submitters'
      | 'Question Reviewers'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      // Remove last 's' from the tab name.
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
   * @param username The username to add.
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
   * @param {number} number - The expected number of contributors.
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

    await this.clearAllTextFrom(dateInputSelector);
    await this.typeInInputField(dateInputSelector, yesterdayDate);
    await this.page.keyboard.press('Enter');
    await this.expectElementValueToBe(dateInputSelector, yesterdayDate);
  }

  /**
   * Checks if the number of contributor stats rows in the table is as expected.
   * @param {number} number - The expected number of stats rows.
   */
  async expectNumberOfStatsRowsToBe(number: number): Promise<void> {
    await this.page.waitForFunction(
      (selector: string, expectedCount: number) => {
        const rows = document.querySelectorAll(selector);
        return rows.length === expectedCount;
      },
      {},
      statsListItemSelector,
      number
    );
  }

  /**
   * Opens the featured translation languages editor panel.
   */
  async openFeaturedTranslationLanguagesEditor(): Promise<void> {
    await this.expectElementToBeVisible(toggleFeaturedLanguagesEditorSelector);
    await this.clickOnElementWithSelector(
      toggleFeaturedLanguagesEditorSelector
    );
    await this.expectElementToBeVisible(addFeaturedLanguageButtonSelector);
  }

  /**
   * Adds a featured translation language row in the editor.
   * @param languageCode - The language option value (e.g. 'zh').
   * @param explanation - The explanation shown under "Most needed".
   */
  async addFeaturedTranslationLanguage(
    languageCode: string,
    explanation: string
  ): Promise<void> {
    // this.select() is the BaseUser wrapper (waits for the element, then
    // selects) — the convention used across the utilities.
    await this.select(featuredLanguageSelectSelector, languageCode);
    await this.typeInInputField(
      featuredLanguageExplanationSelector,
      explanation
    );
    await this.clickOnElementWithSelector(addFeaturedLanguageButtonSelector);
    // Wait for the new row to render (one Angular change-detection cycle).
    await this.expectFeaturedTranslationLanguageToBeListed(languageCode);
  }

  /**
   * Saves the featured translation languages configuration.
   */
  async saveFeaturedTranslationLanguages(): Promise<void> {
    await this.clickOnElementWithSelector(saveFeaturedLanguagesButtonSelector);
    await this.expectToastMessage('Featured translation languages saved.');
  }

  /**
   * Checks the editor lists the given language code.
   * @param languageCode - The language code, e.g. 'zh'.
   */
  async expectFeaturedTranslationLanguageToBeListed(
    languageCode: string
  ): Promise<void> {
    // Once added, the code appears in the editor table (and is removed from
    // the dropdown options), so a containment check on the editor suffices.
    await this.expectTextContentToContain(
      featuredLanguagesEditorSelector,
      languageCode
    );
  }

  /**
   * Checks whether the featured translation languages editor is present.
   * (It is gated on the Translation Admin role.)
   * @param present - Whether the editor should be present.
   */
  async expectFeaturedTranslationLanguagesEditorToBePresent(
    present: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(
      featuredLanguagesEditorSelector,
      present
    );
  }

  /**
   * Navigates directly to the public Contributor Dashboard by URL.
   *
   * We do NOT reuse `navigateToContributorDashboardUsingProfileDropdown()`
   * here: after saving, the account is on the *new* Contributor Admin
   * Dashboard, whose minimal navbar has no `.e2e-test-profile-dropdown`, so
   * the dropdown-based navigation times out. A direct `goto` is robust
   * regardless of the current page's navbar.
   */
  async navigateToContributorDashboard(): Promise<void> {
    await this.goto(testConstants.URLs.ContributorDashboard);
    // '.e2e-test-oppia-contributor-home' is the contributor dashboard
    // container (see logged-in-user.ts).
    await this.expectElementToBeVisible('.e2e-test-oppia-contributor-home');
  }
}

export let ContributorAdminFactory = (): ContributorAdmin =>
  new ContributorAdmin();
