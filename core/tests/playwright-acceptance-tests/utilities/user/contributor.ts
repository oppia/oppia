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
 * @fileoverview Utility class for contributor actions.
 */

import {expect, Locator, Page} from '@playwright/test';
import {showMessage} from '../common/show-message';
import {ExplorationEditor} from './exploration-editor';

const contributionTabSelector = '.e2e-test-contribution-tab';
const activeTabNameSelector = '.e2e-test-active-tab-name';
const opportunityItemSelector = '.e2e-test-opportunity-list-item';
const opportunityItemHeadingSelector =
  '.e2e-test-opportunity-list-item-heading';
const opportunitySubHeadingSelector =
  '.e2e-test-opportunity-list-item-subheading';
const contributionTabClass = 'e2e-test-contribution-tab';
const activeElementClass = 'oppia-contributions-active-navbar';
const viewDropdownSelector = '.e2e-test-mobile-contribution-dropdown';
const viewDropdownOptionSelector =
  '.e2e-test-mobile-contribution-dropdown-option';
const desktopBadgeContainerSelector = '.e2e-test-desktop-badge-container';
const mobileBadgeContainerSelector = '.e2e-test-mobile-badge-container';
const badgeSelector = '.e2e-test-badge';
const badgeValueSelector = '.e2e-test-badge-value';
const badgeCaptionSelector = '.e2e-test-badge-caption';
const badgeLanguageSelector = '.e2e-test-badge-language';
const topicSelector = '.e2e-test-topic-selector';
const selectedTopicSelector = '.e2e-test-topic-selector-selected';
const topicOptionSelector = '.e2e-test-topic-selector-option';
const mobileElementSelector = '.e2e-test-mobile-element';
const desktopElementSelector = '.e2e-test-desktop-element';
const reviewCommentTextareaSelector = '.e2e-test-suggestion-review-message';
const mobileStatsRowSelector = '.e2e-test-mobile-stats-row';
const mobileStatsCellSelector = '.e2e-test-mobile-stats-cell';
const desktopStatsRowSelector = 'tr';
const desktopStatsCellSelector = 'td';

const exactText = (value: string): RegExp =>
  new RegExp(`^\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

export class Contributor extends ExplorationEditor {
  /**
   * Checks if the opportunity is visible and matches the expected values.
   * @param heading - The expected heading of the opportunity.
   * @param subheading - The expected subheading of the opportunity.
   * @param visible - Whether the opportunity should be visible or not.
   */
  async expectOpportunityToBePresent(
    heading: string,
    subheading: string,
    visible: boolean = true
  ): Promise<Locator | null> {
    await this.waitForNetworkIdle();
    const opportunityItems = this.page
      .locator(opportunityItemSelector)
      .filter({
        has: this.page
          .locator(opportunityItemHeadingSelector)
          .filter({hasText: exactText(heading)}),
      })
      .filter({
        has: this.page
          .locator(opportunitySubHeadingSelector)
          .filter({hasText: subheading}),
      });

    if (visible) {
      const opportunityItem = opportunityItems.first();
      await expect(opportunityItem).toBeVisible();
      return opportunityItem;
    }

    await expect(opportunityItems).toHaveCount(0);
    showMessage(
      `Success: Opportunity for ${heading} in ${subheading} not found.`
    );
    return null;
  }

  /**
   * Navigates to a tab within the My Contributions view.
   * @param tabName - The name of the tab to navigate to.
   */
  async navigateToTabInMyContributions(
    tabName: 'Contribution Stats' | 'Badges' | 'Review Questions'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.waitForPageToFullyLoad();
      await this.expectElementToBeVisible(viewDropdownSelector);
      await this.clickOnElementWithSelector(viewDropdownSelector);

      const option = this.page
        .locator(viewDropdownOptionSelector)
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

    await this.page
      .locator(`.${contributionTabClass}.${activeElementClass}`)
      .filter({hasText: tabName})
      .first()
      .waitFor({state: 'visible'});
  }

  /**
   * Checks whether a badge with the expected value and caption is present.
   * @param expectedBadgeValue - The expected value of the badge.
   * @param expectedBadgeCaption - The expected caption of the badge.
   * @param expectedBadgeLanguage - The expected language of the badge.
   */
  async expectBadgesToContain(
    expectedBadgeValue: string,
    expectedBadgeCaption: string,
    expectedBadgeLanguage: string | null = null
  ): Promise<void> {
    const viewBasedBadgeSelector = this.isViewportAtMobileWidth()
      ? `${mobileBadgeContainerSelector} ${badgeSelector}`
      : `${desktopBadgeContainerSelector} ${badgeSelector}`;
    await this.expectElementToBeVisible(viewBasedBadgeSelector);

    let matchingBadges = this.page
      .locator(viewBasedBadgeSelector)
      .filter({
        has: this.page
          .locator(badgeValueSelector)
          .filter({hasText: exactText(expectedBadgeValue)}),
      })
      .filter({
        has: this.page
          .locator(badgeCaptionSelector)
          .filter({hasText: exactText(expectedBadgeCaption)}),
      });

    if (expectedBadgeLanguage !== null) {
      matchingBadges = matchingBadges.filter({
        has: this.page
          .locator(badgeLanguageSelector)
          .filter({hasText: exactText(expectedBadgeLanguage)}),
      });
    }

    await expect(matchingBadges.first()).toBeVisible();
  }

  /**
   * Selects the badge type in the contribution dashboard.
   * @param badgeType - The badge type to select.
   */
  async selectBadgeType(badgeType: 'Translation' | 'Question'): Promise<void> {
    if (!this.isViewportAtMobileWidth()) {
      // Desktop requires no action since both badge types are displayed.
      return;
    }

    await this.clickOnElementWithSelector(topicSelector);
    const badgeOption = this.page
      .locator(topicOptionSelector)
      .filter({hasText: badgeType})
      .first();
    await badgeOption.waitFor({state: 'visible'});
    await badgeOption.click();
    await this.expectTextContentToBe(selectedTopicSelector, badgeType);
  }

  /**
   * Selects the contribution type in the contribution dashboard.
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

    await this.clickOnElementWithSelector(selectedOptionSelector);
    await this.expectElementToBeVisible(topicOptionSelector);

    const option = this.page
      .locator(topicOptionSelector)
      .filter({hasText: exactText(contributionType)})
      .first();
    await option.click();
    await this.expectTextContentToBe(selectedOptionSelector, contributionType);
  }

  /**
   * Switches to a tab in the contribution dashboard.
   * @param tabName - The name of the tab to switch to.
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

    if (tabName === 'My Contributions') {
      await this.expectElementToBeVisible(activeTabNameSelector, false);
    } else {
      await this.expectTextContentToBe(activeTabNameSelector, tabName);
    }
  }

  /**
   * Checks whether the contribution table contains the expected row.
   * A null expected value skips comparison for that cell.
   * @param rowValues - The expected values of the row.
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

    const tableRows = this.page.locator(rowSelector);
    await expect
      .poll(
        async () => {
          for (
            let rowIndex = 0;
            rowIndex < (await tableRows.count());
            rowIndex++
          ) {
            const rowCells = tableRows.nth(rowIndex).locator(cellSelector);
            if (rowValues.length !== (await rowCells.count())) {
              continue;
            }

            let rowMatches = true;
            for (let cellIndex = 0; cellIndex < rowValues.length; cellIndex++) {
              const expectedValue = rowValues[cellIndex];
              if (expectedValue === null) {
                continue;
              }
              const cellValue = (
                await rowCells.nth(cellIndex).textContent()
              )?.trim();
              if (cellValue !== expectedValue) {
                rowMatches = false;
                break;
              }
            }

            if (rowMatches) {
              return true;
            }
          }
          return false;
        },
        {message: 'Expected row not found in the contribution table.'}
      )
      .toBe(true);
  }

  /**
   * Fills the review comment textarea with the given comment.
   * @param comment - The comment to fill the textarea with.
   */
  async fillReviewComment(comment: string): Promise<void> {
    await this.expectElementToBeVisible(reviewCommentTextareaSelector);
    await this.typeInInputField(reviewCommentTextareaSelector, comment);

    await this.expectElementValueToBe(reviewCommentTextareaSelector, comment);
  }
}

export const ContributorFactory = (page: Page): Contributor => {
  return new Contributor(page);
};
