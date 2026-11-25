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
 * @fileoverview Utility class for common contributor interactions.
 */

import {expect, Locator, Page} from '@playwright/test';
import {ExplorationEditor} from './exploration-editor';

const activeTabNameSelector = '.e2e-test-active-tab-name';
const opportunityItemSelector = '.e2e-test-opportunity-list-item';
const opportunityItemHeadingSelector =
  '.e2e-test-opportunity-list-item-heading';
const opportunitySubHeadingSelector =
  '.e2e-test-opportunity-list-item-subheading';
const opportunityLoadingPlaceholderSelector =
  '.e2e-test-opportunity-loading-placeholder';
const paginationButtonPreviousSelector =
  '.e2e-test-pagination-button-previous';
const paginationButtonNextSelector = '.e2e-test-pagination-button-next';
const reviewContentContainerSelector = '.e2e-test-review-content-container';
const viewDropdownSelector = '.e2e-test-mobile-contribution-dropdown';
const viewDropdownOptionSelector =
  '.e2e-test-mobile-contribution-dropdown-option';
const contributionTabSelector = '.e2e-test-contribution-tab';
const selectedTopicSelector = '.e2e-test-topic-selector-selected';
const topicOptionSelector = '.e2e-test-topic-selector-option';
const topicSelector = '.e2e-test-topic-selector';
const selectedLanguageSelector = '.e2e-test-language-selector-selected';
const languageSelector = '.e2e-test-language-selector';
const featuredLanguageOptionSelector = '.e2e-test-featured-language';
const languageOptionSelector = '.e2e-test-language-selector-option';
const desktopBadgeContainerSelector = '.e2e-test-desktop-badge-container';
const mobileBadgeContainerSelector = '.e2e-test-mobile-badge-container';
const badgeSelector = '.e2e-test-badge';
const badgeValueSelector = '.e2e-test-badge-value';
const badgeCaptionSelector = '.e2e-test-badge-caption';
const badgeLanguageSelector = '.e2e-test-badge-language';
const mobileElementSelector = '.e2e-test-mobile-element';
const desktopElementSelector = '.e2e-test-desktop-element';

export class Contributor extends ExplorationEditor {
  /**
   * Finds an opportunity by its heading and a substring of its subheading.
   */
  protected async findOpportunityItem(
    heading: string,
    subheading: string,
    shouldExist: boolean = true
  ): Promise<Locator | null> {
    await this.page
      .locator(opportunityLoadingPlaceholderSelector)
      .waitFor({state: 'hidden'});
    await this.waitForAngularStability();
    await expect(this.page.locator(opportunityItemSelector).first()).toBeVisible();

    const scanForOpportunity = async (): Promise<Locator | null> => {
      const items = await this.page.locator(opportunityItemSelector).all();
      for (const item of items) {
        const itemHeading = await item
          .locator(opportunityItemHeadingSelector)
          .textContent();
        const itemSubheading = await item
          .locator(opportunitySubHeadingSelector)
          .textContent();
        if (
          itemHeading?.trim() === heading &&
          itemSubheading?.trim().includes(subheading)
        ) {
          return item;
        }
      }
      return null;
    };

    if (shouldExist) {
      await expect
        .poll(async () => (await scanForOpportunity()) !== null, {
          timeout: 30000,
        })
        .toBe(true);
    }
    return scanForOpportunity();
  }

  /**
   * Checks whether a translation opportunity is present.
   */
  async expectOpportunityToBePresent(
    heading: string,
    subheading: string,
    visible: boolean = true
  ): Promise<Locator | null> {
    const item = await this.findOpportunityItem(heading, subheading, visible);
    if (visible) {
      expect(item).not.toBeNull();
    } else {
      expect(item).toBeNull();
    }
    return item;
  }

  /**
   * Checks whether a translation review pagination button is disabled.
   */
  async expectPaginationButtonToBeDisabled(
    button: 'previous' | 'next',
    disabled: boolean = true
  ): Promise<void> {
    const selector =
      button === 'previous'
        ? paginationButtonPreviousSelector
        : paginationButtonNextSelector;
    if (disabled) {
      await expect(this.page.locator(selector)).toBeDisabled();
    } else {
      await expect(this.page.locator(selector)).toBeEnabled();
    }
  }

  /**
   * Moves between translation review cards.
   */
  async clickOnPaginationButton(button: 'previous' | 'next'): Promise<void> {
    const selector =
      button === 'previous'
        ? paginationButtonPreviousSelector
        : paginationButtonNextSelector;
    const reviewContent = this.page.locator(reviewContentContainerSelector);
    const previousContent = await reviewContent.textContent();
    await this.page.locator(selector).click();
    await expect(reviewContent).not.toHaveText(previousContent || '');
  }

  /**
   * Navigates to a tab in My Contributions.
   */
  async navigateToTabInMyContributions(
    tabName: 'Contribution Stats' | 'Badges' | 'Review Questions'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const dropdown = this.page.locator(viewDropdownSelector);
      await dropdown.click();
      await this.page
        .locator(viewDropdownOptionSelector)
        .filter({hasText: tabName})
        .click();
      await expect(dropdown).toHaveText(tabName);
      return;
    }

    const tab = this.page
      .locator(contributionTabSelector)
      .filter({hasText: tabName});
    await tab.click();
    await expect(tab).toHaveClass(/e2e-test-active/);
  }

  /**
   * Checks that a badge with the provided details is present.
   */
  async expectBadgesToContain(
    expectedBadgeValue: string,
    expectedBadgeCaption: string,
    expectedBadgeLanguage: string | null = null
  ): Promise<void> {
    const container = this.isViewportAtMobileWidth()
      ? mobileBadgeContainerSelector
      : desktopBadgeContainerSelector;
    const badges = this.page.locator(`${container} ${badgeSelector}`);
    const count = await badges.count();
    for (let index = 0; index < count; index++) {
      const badge = badges.nth(index);
      if (
        (await badge.locator(badgeValueSelector).textContent())?.trim() !==
          expectedBadgeValue ||
        (await badge.locator(badgeCaptionSelector).textContent())?.trim() !==
          expectedBadgeCaption
      ) {
        continue;
      }
      if (
        expectedBadgeLanguage &&
        (await badge.locator(badgeLanguageSelector).textContent())?.trim() !==
          expectedBadgeLanguage
      ) {
        continue;
      }
      return;
    }
    throw new Error('Badge not found.');
  }

  /**
   * Selects a contribution type in the contribution dashboard.
   */
  async selectContributionTypeInContributionDashboard(
    contributionType:
      | 'Translation Contributions'
      | 'Translation Reviews'
      | 'Question Contributions'
      | 'Question Reviews'
  ): Promise<void> {
    const selectedOption = this.page.locator(
      `${selectedTopicSelector}${
        this.isViewportAtMobileWidth()
          ? mobileElementSelector
          : desktopElementSelector
      }`
    );
    await selectedOption.click();
    await this.page
      .locator(topicOptionSelector)
      .filter({hasText: contributionType})
      .click();
    await expect(selectedOption).toHaveText(contributionType);
  }

  /**
   * Filters translation opportunities by topic.
   */
  async filterContentByTopic(topicName: string): Promise<void> {
    await this.page.locator(topicSelector).click();
    const option = this.page
      .locator(topicOptionSelector)
      .filter({hasText: topicName});
    await option.click();
    await expect(this.page.locator(selectedTopicSelector)).toContainText(
      topicName
    );
  }

  /**
   * Switches tabs in the contribution dashboard.
   */
  async switchToTabInContributionDashboard(
    tabName: 'Translate Text' | 'My Contributions' | 'Submit Question'
  ): Promise<void> {
    const tab = this.page
      .locator(contributionTabSelector)
      .filter({hasText: tabName});
    await tab.click();
    if (tabName === 'My Contributions') {
      await expect(this.page.locator(activeTabNameSelector)).toBeHidden();
    } else {
      await expect(this.page.locator(activeTabNameSelector)).toHaveText(
        tabName
      );
    }
  }

  /**
   * Checks that the contribution table contains the given row.
   */
  async expectContributionTableToContainRow(
    rowValues: (string | null)[]
  ): Promise<void> {
    const rowSelector = this.isViewportAtMobileWidth()
      ? '.e2e-test-mobile-stats-row'
      : 'tr';
    const cellSelector = this.isViewportAtMobileWidth()
      ? '.e2e-test-mobile-stats-cell'
      : 'td';
    await expect(this.page.locator(rowSelector).first()).toBeVisible();
    const rows = await this.page.locator(rowSelector).all();
    for (const row of rows) {
      const cells = await row.locator(cellSelector).all();
      if (cells.length !== rowValues.length) {
        continue;
      }
      let matches = true;
      for (let index = 0; index < rowValues.length; index++) {
        if (
          rowValues[index] &&
          (await cells[index].textContent())?.trim() !== rowValues[index]
        ) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return;
      }
    }
    throw new Error('Row not found in the contribution table with values.');
  }

  /**
   * Opens the language filter and selects a language.
   */
  async selectLanguageFilter(language: string): Promise<void> {
    await this.page.locator(languageSelector).click();
    const options = this.page.locator(
      `${featuredLanguageOptionSelector}, ${languageOptionSelector}`
    );
    await options.filter({hasText: language}).first().click();
    await expect(this.page.locator(selectedLanguageSelector)).toContainText(
      language
    );
  }
}

export const ContributorFactory = (page: Page): Contributor =>
  new Contributor(page);
