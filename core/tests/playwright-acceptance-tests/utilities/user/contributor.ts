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
 * @fileoverview Utility class for contributors.
 */

import {Locator, Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';

// Contributor dashboard selectors.
const contributionTabSelector = '.e2e-test-contribution-tab';
const activeTabNameSelector = '.e2e-test-active-tab-name';

// Contribution opportunities selectors shared by contributor roles.
export const opportunityItemSelector = '.e2e-test-opportunity-list-item';
export const opportunityItemHeadingSelector =
  '.e2e-test-opportunity-list-item-heading';
export const opportunitySubHeadingSelector =
  '.e2e-test-opportunity-list-item-subheading';
export const opportunityTranslateButtonSelector =
  '.e2e-test-opportunity-list-item-button';

// Contributor dashboard > My Contributions selectors.
const contributionTabClass = 'e2e-test-contribution-tab';
const activeElementClass = 'e2e-test-active';

const viewDropdownSelector = '.e2e-test-mobile-contribution-dropdown';
const viewDropdownOptionClass = 'e2e-test-mobile-contribution-dropdown-option';

// Contribution dashboard filters.
const selectedTopicSelector = '.e2e-test-topic-selector-selected';
const topicOptionSelector = '.e2e-test-topic-selector-option';

const mobileElementSelector = '.e2e-test-mobile-element';
const desktopElementSelector = '.e2e-test-desktop-element';

// Language filter selectors.
const languageSelector = '.e2e-test-language-selector';
const selectedLanguageSelector = '.e2e-test-language-selector-selected';
const featuredLanguageOptionSelector = '.e2e-test-featured-language';
const languageOptionSelector = '.e2e-test-language-selector-option';

// Badge selectors.
const desktopBadgeContainerSelector = '.e2e-test-desktop-badge-container';
const mobileBadgeContainerSelector = '.e2e-test-mobile-badge-container';
const badgeSelector = '.e2e-test-badge';
const badgeValueSelector = '.e2e-test-badge-value';
const badgeCaptionSelector = '.e2e-test-badge-caption';
const badgeLanguageSelector = '.e2e-test-badge-language';

// Contribution statistics selectors.
const desktopStatsRowSelector = 'tr';
const desktopStatsCellSelector = 'td';
const mobileStatsRowSelector = '.e2e-test-mobile-stats-row';
const mobileStatsCellSelector = '.e2e-test-mobile-stats-cell';

export class Contributor extends BaseUser {
  /**
   * Clicks the language filter dropdown.
   */
  async clickOnLanguageFilterDropdown(): Promise<void> {
    await this.clickOnElementWithSelector(languageSelector);
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(languageOptionSelector);
  }

  /**
   * Selects the given language from the language filter.
   *
   * @param language - The language to select.
   */
  async selectLanguageFilter(language: string): Promise<void> {
    await this.clickOnLanguageFilterDropdown();

    const languageOptions = this.page.locator(
      `${featuredLanguageOptionSelector}, ${languageOptionSelector}`
    );

    const matchingOption = languageOptions.filter({hasText: language}).first();

    await matchingOption.waitFor({state: 'visible'});
    await matchingOption.click();

    await this.expectTextContentToContain(selectedLanguageSelector, language);
  }

  /**
   * Navigates to a tab in the contribution dashboard.
   *
   * @param tabName - The contribution dashboard tab.
   */
  async switchToTabInContributionDashboard(
    tabName: 'Translate Text' | 'My Contributions' | 'Submit Question'
  ): Promise<void> {
    const tab = this.page
      .locator(contributionTabSelector)
      .filter({hasText: tabName})
      .first();

    await tab.waitFor({state: 'visible'});
    await tab.click();

    if (tabName !== 'My Contributions') {
      await this.expectTextContentToBe(activeTabNameSelector, tabName);
    } else {
      await this.expectElementToBeVisible(activeTabNameSelector, false);
    }
  }

  /**
   * Navigates to a tab in the My Contributions section.
   *
   * @param tabName - The My Contributions tab.
   */
  async navigateToTabInMyContributions(
    tabName: 'Contribution Stats' | 'Badges' | 'Review Questions'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(viewDropdownSelector);
      await this.clickOnElementWithSelector(viewDropdownSelector);

      const option = this.page
        .locator(`.${viewDropdownOptionClass}`)
        .filter({hasText: tabName})
        .first();

      await option.waitFor({state: 'visible'});
      await option.click();

      await this.expectTextContentToBe(viewDropdownSelector, tabName);
      return;
    }

    const tab = this.page
      .locator(`.${contributionTabClass}`)
      .filter({hasText: tabName})
      .first();

    await tab.waitFor({state: 'visible'});
    await tab.click();

    const activeTab = this.page
      .locator(`.${contributionTabClass}.${activeElementClass}`)
      .filter({hasText: tabName})
      .first();

    await activeTab.waitFor({state: 'visible'});
  }

  /**
   * Selects a contribution type in the contribution dashboard.
   *
   * @param contributionType - The contribution type to select.
   */
  async selectContributionTypeInContributionDashboard(
    contributionType:
      | 'Translation Contributions'
      | 'Translation Reviews'
      | 'Question Contributions'
      | 'Question Reviews'
  ): Promise<void> {
    const selectedOptionSelector = this.isViewportAtMobileWidth()
      ? `${selectedTopicSelector}${mobileElementSelector}`
      : `${selectedTopicSelector}${desktopElementSelector}`;

    if (this.isViewportAtMobileWidth()) {
      await this.waitForPageToFullyLoad();
    }

    await this.clickOnElementWithSelector(selectedOptionSelector);
    await this.expectElementToBeVisible(topicOptionSelector);

    const option = this.page
      .locator(topicOptionSelector)
      .filter({hasText: contributionType})
      .first();

    await option.waitFor({state: 'visible'});
    await option.click();

    await this.expectTextContentToBe(selectedOptionSelector, contributionType);
  }

  /**
   * Expects a badge matching the supplied values to be present.
   *
   * @param expectedBadgeValue - The expected badge value.
   * @param expectedBadgeCaption - The expected badge caption.
   * @param expectedBadgeLanguage - The expected badge language.
   */
  async expectBadgesToContain(
    expectedBadgeValue: string,
    expectedBadgeCaption: string,
    expectedBadgeLanguage: string | null = null
  ): Promise<void> {
    const badgeContainerSelector = this.isViewportAtMobileWidth()
      ? `${mobileBadgeContainerSelector} ${badgeSelector}`
      : `${desktopBadgeContainerSelector} ${badgeSelector}`;

    await this.expectElementToBeVisible(badgeContainerSelector);

    const badges = this.page.locator(badgeContainerSelector);
    const badgeCount = await badges.count();

    for (let index = 0; index < badgeCount; index++) {
      const badge = badges.nth(index);

      const badgeValue = (
        await badge.locator(badgeValueSelector).textContent()
      )?.trim();

      if (badgeValue !== expectedBadgeValue) {
        continue;
      }

      const badgeCaption = (
        await badge.locator(badgeCaptionSelector).textContent()
      )?.trim();

      if (badgeCaption !== expectedBadgeCaption) {
        continue;
      }

      if (expectedBadgeLanguage !== null) {
        const badgeLanguage = (
          await badge.locator(badgeLanguageSelector).textContent()
        )?.trim();

        if (badgeLanguage !== expectedBadgeLanguage) {
          continue;
        }
      }

      return;
    }

    throw new Error(
      `Badge not found: value="${expectedBadgeValue}", ` +
        `caption="${expectedBadgeCaption}", ` +
        `language="${expectedBadgeLanguage}"`
    );
  }

  /**
   * Expects the contribution statistics table to contain a matching row.
   *
   * A null value in rowValues means that the corresponding cell should not
   * be compared.
   *
   * @param rowValues - Expected values for the row.
   */
  async expectContributionTableToContainRow(
    rowValues: (string | null)[]
  ): Promise<void> {
    const rowSelector = this.isViewportAtMobileWidth()
      ? mobileStatsRowSelector
      : desktopStatsRowSelector;

    const cellSelector = this.isViewportAtMobileWidth()
      ? mobileStatsCellSelector
      : desktopStatsCellSelector;

    await this.expectElementToBeVisible(rowSelector);

    const rows = this.page.locator(rowSelector);
    const rowCount = await rows.count();

    if (rowCount === 0) {
      throw new Error('No rows found in the contribution table.');
    }

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const row = rows.nth(rowIndex);
      const cells = row.locator(cellSelector);
      const cellCount = await cells.count();

      if (cellCount !== rowValues.length) {
        continue;
      }

      let matches = true;

      for (let cellIndex = 0; cellIndex < rowValues.length; cellIndex++) {
        const expectedValue = rowValues[cellIndex];

        if (expectedValue === null) {
          continue;
        }

        const actualValue = (await cells.nth(cellIndex).textContent())?.trim();

        if (actualValue !== expectedValue) {
          matches = false;
          break;
        }
      }

      if (matches) {
        return;
      }
    }

    throw new Error(
      `Row not found in the contribution table with values: ${JSON.stringify(
        rowValues
      )}`
    );
  }
}

/**
 * Returns the opportunity card for the given heading and subheading.
 *
 * @param page - The page.
 * @param heading - The heading displayed on the opportunity card.
 * @param subheading - The subheading displayed on the opportunity card.
 */
export const getTranslationOpportunityCard = async function (
  page: Page,
  heading: string,
  subheading: string
): Promise<Locator> {
  await page
    .locator(opportunityItemSelector)
    .first()
    .waitFor({state: 'visible'});

  const opportunityItem = page
    .locator(opportunityItemSelector)
    .filter({
      has: page
        .locator(opportunityItemHeadingSelector)
        .filter({hasText: heading}),
    })
    .filter({
      has: page
        .locator(opportunitySubHeadingSelector)
        .filter({hasText: subheading}),
    })
    .first();

  await opportunityItem.waitFor({state: 'visible'});
  return opportunityItem;
};

export const ContributorFactory = (page: Page): Contributor => {
  return new Contributor(page);
};
