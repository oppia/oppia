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
 * @fileoverview Contributor users utility file. It contains the functions
 * common to all the users of the contributor dashboard.
 */

import {Page, ElementHandle} from '@playwright/test';
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
const activeElementClass = 'e2e-test-active';
const activeNavbarButtonClass = 'oppia-contributions-active-navbar';
const viewDropdownSelector = '.e2e-test-mobile-contribution-dropdown';
const viewDropdownOptionClass = 'e2e-test-mobile-contribution-dropdown-option';
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
const opportunityStatusLabelSelector = '.e2e-test-opportunity-list-item-label';
const rteDisplaySelector = '.e2e-test-state-content-display';

export class Contributor extends ExplorationEditor {
  /**
   * Checks if the opportunity is visible and matches the expected values.
   * @param {string} heading - The expected heading of the opportunity.
   * @param {string} subheading - The expected subheading of the opportunity.
   * @param {boolean} visible - Whether the opportunity should be visible or not.
   * @returns {Promise<ElementHandle | null>} The opportunity element, if found.
   */
  async expectOpportunityToBePresent(
    heading: string,
    subheading: string,
    visible: boolean = true
  ): Promise<ElementHandle<Element> | null> {
    await this.waitForNetworkIdle();

    // Wait for the opportunities to load. If they are not loaded within the
    // timeout, we still check the list below.
    await this.isElementVisible(opportunityItemSelector);

    // Sometimes, the opportunities refresh after they have been loaded.
    // This causes the older nodes to get detached from the DOM. So, we
    // ensure that the opportunity list hasn't changed for 200 ms.
    let previousElementIds: string[] = [];
    let opportunityItemListChanged = true;

    // TODO(#23395): Currently, the opportunity list is refreshed after the
    // page is loaded. This causes the test to fail. We are using a workaround
    // for now, by waiting for the opportunity list to be loaded.
    // Once the issue is fixed, remove the following do-while loop.
    do {
      await this.page.waitForTimeout(200);

      let currentElementIds: string[];
      try {
        currentElementIds = await this.page.evaluate((selector: string) => {
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).map((el, index) => {
            return el.textContent?.trim() || `element-${index}`;
          });
        }, opportunityItemSelector);
      } catch (error) {
        // The page may still be navigating (e.g. after using the navbar to
        // open the contributor dashboard), which destroys the execution
        // context. In that case, we check the list again in the next
        // iteration.
        showMessage(`Opportunity list is not ready yet: ${error}`);
        previousElementIds = [];
        continue;
      }

      opportunityItemListChanged =
        previousElementIds.length !== currentElementIds.length ||
        !previousElementIds.every(
          (id, index) => id === currentElementIds[index]
        );

      previousElementIds = currentElementIds;
    } while (opportunityItemListChanged);

    // Handle the case where no opportunity is present.
    if (previousElementIds.length === 0) {
      if (visible) {
        throw new Error(
          `Opportunity for ${heading} in ${subheading} not found.`
        );
      }
      showMessage(
        `Success: Opportunity for ${heading} in ${subheading} not found.`
      );
      return null;
    }

    // Get the opportunity item element.
    const opportunityItems = await this.page.$$(opportunityItemSelector);
    for (const opportunityItemElement of opportunityItems) {
      const opportunityItemHeading = await opportunityItemElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim(),
        opportunityItemHeadingSelector
      );
      const opportunityItemSubHeading = await opportunityItemElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim(),
        opportunitySubHeadingSelector
      );

      if (
        opportunityItemHeading === heading &&
        opportunityItemSubHeading?.includes(subheading)
      ) {
        if (!visible) {
          throw new Error(
            `Failure: Opportunity for ${heading} in ${opportunityItemSubHeading} was found.`
          );
        }
        return opportunityItemElement;
      }
    }

    if (visible) {
      throw new Error(`Opportunity for ${heading} in ${subheading} not found.`);
    }
    showMessage(
      `Success: Opportunity for ${heading} in ${subheading} not found.`
    );
    return null;
  }

  /**
   * Navigates to the tab in the My Contributions tab.
   * @param {string} tabName - The name of the tab to navigate to.
   */
  async navigateToTabInMyContributions(
    tabName: 'Contribution Stats' | 'Badges' | 'Review Questions'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.waitForPageToFullyLoad();
      await this.expectElementToBeVisible(viewDropdownSelector);
      await this.page.waitForFunction((selector: string) => {
        const element = document.querySelector(selector);
        return element && element.textContent !== '';
      }, viewDropdownSelector);
      await this.clickOnElementWithSelector(viewDropdownSelector);

      const optionElement = await this.expectElementToBeVisible(
        `xpath=//*[contains(@class, "${viewDropdownOptionClass}") and contains(text(), "${tabName}")]`
      );
      if (!optionElement) {
        throw new Error(`Option ${tabName} not found.`);
      }
      await this.clickOnElement(optionElement);

      await this.expectTextContentToBe(viewDropdownSelector, tabName);
    } else {
      const tabXPath = `//button[contains(@class, "${contributionTabClass}") and contains(text(), "${tabName}")]`;

      const tabElement = await this.expectElementToBeVisible(
        `xpath=${tabXPath}`
      );
      if (!tabElement) {
        throw new Error(`Tab ${tabName} not found in the contributions tab.`);
      }
      await this.clickOnElement(tabElement);

      // Verify that the tab is active. The review tabs don't have the
      // e2e-test-active class, so we also accept the active navbar class.
      await this.expectElementToBeVisible(
        `xpath=${tabXPath}[contains(@class, "${activeElementClass}") or contains(@class, "${activeNavbarButtonClass}")]`
      );
    }
    showMessage(`Navigated to ${tabName} tab in My Contributions.`);
  }

  /**
   * Checks if the badge is present or not.
   * @param {string} expectedBadgeValue - The expected value of the badge.
   * @param {string} expectedBadgeCaption - The expected caption of the badge.
   * @param {string | null} expectedBadgeLanguage - The expected language of the badge.
   */
  async expectBadgesToContain(
    expectedBadgeValue: string,
    expectedBadgeCaption: string,
    expectedBadgeLanguage: string | null = null
  ): Promise<void> {
    const viewBasedBadgeSelector = this.isViewportAtMobileWidth()
      ? `${mobileBadgeContainerSelector} ${badgeSelector}`
      : `${desktopBadgeContainerSelector} ${badgeSelector}`;
    // We only wait for the first badge to be attached (not visible), because
    // the first badge might be hidden.
    await this.expectElementToBeAttachedInDOM(viewBasedBadgeSelector);

    // The badges list may be re-rendered (e.g. after changing the badge
    // type), so we wait until the expected badge is found.
    try {
      await this.page.waitForFunction(
        ({
          selector,
          value,
          caption,
          language,
          selectors,
        }: {
          selector: string;
          value: string;
          caption: string;
          language: string | null;
          selectors: {value: string; caption: string; language: string};
        }) =>
          Array.from(document.querySelectorAll(selector)).some(badge => {
            const getText = (sel: string): string | undefined =>
              badge.querySelector(sel)?.textContent?.trim();
            return (
              getText(selectors.value) === value &&
              getText(selectors.caption) === caption &&
              (!language || getText(selectors.language) === language)
            );
          }),
        {
          selector: viewBasedBadgeSelector,
          value: expectedBadgeValue,
          caption: expectedBadgeCaption,
          language: expectedBadgeLanguage,
          selectors: {
            value: badgeValueSelector,
            caption: badgeCaptionSelector,
            language: badgeLanguageSelector,
          },
        },
        {timeout: 10000}
      );
    } catch (error) {
      throw new Error(
        `Badge "${expectedBadgeValue} ${expectedBadgeCaption}" not found.\n` +
          `Original error: ${error}`
      );
    }
    showMessage(
      `Badge "${expectedBadgeValue} ${expectedBadgeCaption}" is present.`
    );
  }

  /**
   * Selects the badge type in the contribution dashboard (mobile view only).
   * @param {string} badgeType - The badge type to select.
   */
  async selectBadgeTypeInMobileView(
    badgeType: 'Translation' | 'Question'
  ): Promise<void> {
    if (!this.isViewportAtMobileWidth()) {
      showMessage(
        "Skipping selecting badge type in mobile view as it's not required in desktop view"
      );
      return;
    }

    await this.clickOnElementWithSelector(topicSelector);
    await this.expectElementToBeVisible(topicOptionSelector);

    const badgeOption = await this.expectElementToBeVisible(
      `xpath=//*[normalize-space(.)='${badgeType}']`
    );
    if (!badgeOption) {
      throw new Error(`Badge type ${badgeType} not found.`);
    }
    await this.clickOnElement(badgeOption);

    // Verify option is selected.
    await this.expectTextContentToBe(selectedTopicSelector, badgeType);
  }

  /**
   * Selects the contribution type in the contribution dashboard.
   * @param {string} contributionType - The contribution type to select.
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
    const contributionTypeOptions = await this.page.$$(topicOptionSelector);
    let optionElement: ElementHandle<Element> | null = null;
    const foundOptions: string[] = [];
    for (const option of contributionTypeOptions) {
      const optionText = await option.evaluate(el => el.textContent?.trim());
      if (optionText === contributionType) {
        optionElement = option;
        break;
      }
      foundOptions.push(optionText ?? '');
    }

    if (!optionElement) {
      throw new Error(
        `Option "${contributionType}" not found.\n` +
          `Found Options: "${foundOptions.join('", "')}"`
      );
    }

    await this.clickOnElement(optionElement);

    // Verify option is selected.
    await this.expectTextContentToBe(selectedOptionSelector, contributionType);
  }

  /**
   * Switches to the tab in the contribution dashboard.
   * @param {string} tabName - The name of the tab to switch to.
   */
  async switchToTabInContributionDashboard(
    tabName: 'Translate Text' | 'My Contributions' | 'Submit Question'
  ): Promise<void> {
    await this.page.waitForFunction(
      ({selector, name}: {selector: string; name: string}) => {
        const tabs = Array.from(document.querySelectorAll(selector));
        return tabs.some(tab => tab.textContent?.trim() === name);
      },
      {selector: contributionTabSelector, name: tabName}
    );

    // Get required tab element.
    const tabElements = await this.page.$$(contributionTabSelector);
    let tabElement: ElementHandle<Element> | null = null;
    for (const tabEle of tabElements) {
      const tabText = await tabEle.evaluate(el => el.textContent?.trim());
      if (tabText === tabName) {
        tabElement = tabEle;
        break;
      }
    }

    if (!tabElement) {
      throw new Error(`Tab ${tabName} not found.`);
    }

    await this.clickOnElement(tabElement);

    // Verify tab is active.
    if (tabName !== 'My Contributions') {
      await this.expectTextContentToBe(activeTabNameSelector, tabName);
    } else {
      await this.expectElementToBeVisible(activeTabNameSelector, false);
    }
  }

  /**
   * Expects the contribution table to contain a row with the given values.
   * @param {(string | null)[]} rowValues - The values of the row to be
   *     checked. A null value means that the cell is not compared.
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
    await this.expectElementToBeVisible(rowSelector);

    const tableRows = await this.page.$$(rowSelector);
    if (tableRows.length === 0) {
      throw new Error('No rows found in the contribution table.');
    }

    for (const row of tableRows) {
      const rowCells = await row.$$(cellSelector);
      if (rowValues.length !== rowCells.length) {
        continue;
      }

      let match = true;
      for (let i = 0; i < rowValues.length; i++) {
        if (!rowValues[i]) {
          // If row cell from input is null, we skip comparing it.
          continue;
        }
        const cellValue = await rowCells[i].evaluate((el: Element) =>
          el.textContent?.trim()
        );
        if (cellValue !== rowValues[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        showMessage(
          `Contribution table contains row: ${JSON.stringify(rowValues)}.`
        );
        return;
      }
    }

    throw new Error(
      `Row not found in the contribution table with values: ${JSON.stringify(rowValues)}.`
    );
  }

  /**
   * Checks if the contribution status is as expected.
   * @param {string} heading - The heading of the opportunity.
   * @param {string} subheading - The subheading of the opportunity.
   * @param {string} expectedStatus - The expected status.
   */
  async expectContributionStatusToBe(
    heading: string,
    subheading: string,
    expectedStatus: string
  ): Promise<void> {
    const opportunityItem = await this.expectOpportunityToBePresent(
      heading,
      subheading
    );

    if (!opportunityItem) {
      throw new Error(`Opportunity item ${heading} (${subheading}) not found.`);
    }
    await this.expectTextContentToBe(
      opportunityStatusLabelSelector,
      expectedStatus,
      opportunityItem
    );
  }

  /**
   * Checks that the question in the review modal is the same as the one passed in.
   * @param {string} question - The question to check.
   */
  async expectQuestionInReviewModalToBe(question: string): Promise<void> {
    await this.expectTextContentToBe(rteDisplaySelector, question);
  }
}

export const ContributorFactory = (page: Page): Contributor => {
  return new Contributor(page);
};
