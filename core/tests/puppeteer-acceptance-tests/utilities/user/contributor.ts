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
 * @fileoverview Utilty class for contributor. Not to be used standlone.
 * However, it provides common methods that can be used by different contributors.
 */

import {ElementHandle} from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';
import {showMessage} from '../common/show-message';

const activeTabNameSelector = '.e2e-test-active-tab-name';
const activeTabDescriptionSelector = '.e2e-test-active-tab-description';
const opportunityItemSelector = '.e2e-test-opportunity-list-item';
const opportunityItemHeadingSelector =
  '.e2e-test-opportunity-list-item-heading';
const opportunitySubHeadingSelector =
  '.e2e-test-opportunity-list-item-subheading';
const paginationButtonPreviousSelector = '.e2e-test-pagination-button-previous';
const paginationButtonNextSelector = '.e2e-test-pagination-button-next';
const reviewContentContainerSelector = '.e2e-test-review-content-container';

const contributionTabClass = 'e2e-test-contribution-tab';
const activeElementClass = 'e2e-test-active';
const viewDropdownSelector = '.e2e-test-mobile-contribution-dropdown';
const viewDropdownOptionSelector =
  '.e2e-test-mobile-contribution-dropdown-option';
const badgeSelector = '.e2e-test-badge';
const badgeValueSelector = '.e2e-test-badge-value';
const badgeCaptionSelector = '.e2e-test-badge-caption';
const badgeLanguageSelector = '.e2e-test-badge-language';

const topicSelector = '.e2e-test-topic-selector';
const selectedTopicSelector = '.e2e-test-topic-selector-selected';
const topicOptionSelector = '.e2e-test-topic-selector-option';
const mobileElementSelector = '.e2e-test-mobile-element';
const desktopElementSelector = '.e2e-test-desktop-element';

export class Contributor extends BaseUser {
  /**
   * Checks if the active tab name is visible and matches the expected values.
   * @param tabName - The expected name of the active tab.
   */
  async expectActiveTabNameToBe(tabName: string): Promise<void> {
    await this.expectElementToBeVisible(activeTabNameSelector);
    await this.expectTextContentToBe(activeTabNameSelector, tabName);
  }

  /**
   * Checks if the active tab description is visible and matches the expected value.
   * @param tabDescription - The expected description of the active tab.
   */
  async expectActiveTabDescriptionToBe(tabDescription: string): Promise<void> {
    await this.expectElementToBeVisible(activeTabDescriptionSelector);
    await this.expectTextContentToContain(
      activeTabDescriptionSelector,
      tabDescription
    );
  }

  /**
   * Checks if the translation opportunities are empty.
   */
  async expectTranslationOpportunitiesToBePresent(
    present: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(opportunityItemSelector, present);
  }

  /**
   * Checks if the translation opportunity is visible and matches the expected values.
   * @param heading - The expected heading of the translation opportunity.
   * @param subheading - The expected subheading of the translation opportunity.
   * @param visible - Whether the translation opportunity should be visible or not.
   */
  async expectTranslationOpportunityToBePresent(
    heading: string,
    subheading: string,
    visible: boolean = true
  ): Promise<ElementHandle | null> {
    const translationOpportunitiesPreset = await this.isElementVisible(
      opportunityItemSelector
    );

    // Handle the case where the translation opportunity is not present.
    if (!translationOpportunitiesPreset) {
      if (visible) {
        throw new Error(
          `Translation opportunity for ${heading} in ${subheading} not found.`
        );
      } else {
        showMessage(
          `Success: Translation opportunity for ${heading} in ${subheading} not found.`
        );
        return null;
      }
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
            `Failure: Translation opportunity for ${heading} in ${opportunityItemSubHeading} was found.`
          );
        }
        return opportunityItemElement;
      }
    }

    if (visible) {
      throw new Error(
        `Translation opportunity for ${heading} in ${subheading} not found.`
      );
    }
    showMessage(
      `Success: Translation opportunity for ${heading} in ${subheading} not found.`
    );
    return null;
  }

  /**
   * Expects the pagination button to be disabled.
   * @param button - The button to check for.
   */
  async expectPaginationButtonToBeDisabled(
    button: 'previous' | 'next'
  ): Promise<void> {
    const selector =
      button === 'previous'
        ? paginationButtonPreviousSelector
        : paginationButtonNextSelector;
    await this.expectElementToBeVisible(selector);
    await this.expectElementToBeClickable(selector, false);
  }

  /**
   * Clicks on the pagination button.
   * @param button - The button to click on.
   */
  async clickOnPaginationButton(button: 'previous' | 'next'): Promise<void> {
    const initialReviewContent = await this.page.$eval(
      reviewContentContainerSelector,
      el => el.textContent
    );

    const selector =
      button === 'previous'
        ? paginationButtonPreviousSelector
        : paginationButtonNextSelector;
    await this.expectElementToBeVisible(selector);
    await this.clickOn(selector);

    await this.page.waitForFunction(
      (selector: string, initialContent: string) => {
        const element = document.querySelector(selector);
        return element?.textContent !== initialContent;
      },
      {},
      reviewContentContainerSelector,
      initialReviewContent
    );
  }

  /**
   * Navigates to the tab in the My Contributions tab.
   * @param tabName - The name of the tab to navigate to.
   */
  async navigateToTabInMyContributions(
    tabName: 'Contribution Stats' | 'Badges'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(viewDropdownSelector);
      await this.clickOn(viewDropdownSelector);

      await this.expectElementToBeVisible(viewDropdownOptionSelector);
      const contibutionTypeOptions = await this.page.$$(
        viewDropdownOptionSelector
      );
      let optionElement: ElementHandle<Element> | null = null;
      for (const option of contibutionTypeOptions) {
        const optionText = await option.evaluate(el => el.textContent?.trim());
        if (optionText === tabName) {
          optionElement = option;
          break;
        }
      }

      if (!optionElement) {
        throw new Error(`Option ${tabName} not found.`);
      }

      // Click on the option.
      await this.waitForElementToStabilize(optionElement);
      await optionElement.click();

      await this.expectTextContentToContain(viewDropdownSelector, tabName);
    } else {
      const xpath = `//button[contains(@class, "${contributionTabClass}") and contains(text(), "${tabName}")]`;

      const element = await this.page.waitForXPath(xpath);
      if (!element) {
        throw new Error(`Tab ${tabName} not found in the contributions tab.`);
      }

      await element.click();

      const xpathActive = `//button[contains(@class, "${contributionTabClass}") and contains(text(), "${tabName}") and contains(@class, ${activeElementClass})]`;
      await this.page.waitForXPath(xpathActive);
    }
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
    // We are not checking if the badge is visible because first badge might
    // be hidden.
    const viewBasedBadgeSelector = this.isViewportAtMobileWidth()
      ? `.mobile-badge-container ${badgeSelector}`
      : `.desktop-badge-container ${badgeSelector}`;
    await this.expectElementToBeVisible(viewBasedBadgeSelector);

    const badges = await this.page.$$(viewBasedBadgeSelector);
    let badge: ElementHandle<Element> | null = null;
    for (const badgeElement of badges) {
      const badgeValue = await badgeElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim(),
        badgeValueSelector
      );
      console.log(`[debug] badgeValue: ${badgeValue}`);
      if (badgeValue !== expectedBadgeValue) {
        continue;
      }
      const badgeCaption = await badgeElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim(),
        badgeCaptionSelector
      );
      console.log(`[debug] badgeCaption: ${badgeCaption}`);
      if (badgeCaption !== expectedBadgeCaption) {
        continue;
      }

      if (expectedBadgeLanguage) {
        const badgeLanguage = await badgeElement.evaluate(
          (el: Element, sel: string) =>
            el.querySelector(sel)?.textContent?.trim(),
          badgeLanguageSelector
        );
        console.log(`[debug] badgeLanguage: ${badgeLanguage}`);
        if (badgeLanguage !== expectedBadgeLanguage) {
          continue;
        }
      }
      badge = badgeElement;
      break;
    }
    if (!badge) {
      throw new Error('Badge not found.');
    }
  }

  /**
   * Selects the contribution type in the contribution dashboard.
   * @param contributionType - The contribution type to select.
   */
  async selectContributionTypeInContributionDashboard(
    contributionType: 'Translation Contributions' | 'Translation Reviews'
  ): Promise<void> {
    const dropdownSelector = this.isViewportAtMobileWidth()
      ? `${topicSelector}${mobileElementSelector}`
      : `${topicSelector}${desktopElementSelector}`;
    const selectedOptionSelector = this.isViewportAtMobileWidth()
      ? `${selectedTopicSelector}${mobileElementSelector}`
      : `${selectedTopicSelector}${desktopElementSelector}`;

    await this.expectElementToBeVisible(dropdownSelector);
    await this.clickOn(dropdownSelector);

    await this.expectElementToBeVisible(topicOptionSelector);
    const contibutionTypeOptions = await this.page.$$(topicOptionSelector);
    let optionElement: ElementHandle<Element> | null = null;
    for (const option of contibutionTypeOptions) {
      const optionText = await option.evaluate(el => el.textContent?.trim());
      if (optionText === contributionType) {
        optionElement = option;
        break;
      }
    }

    if (!optionElement) {
      throw new Error(`Option ${contributionType} not found.`);
    }

    // Click on the option.
    await optionElement.click();

    // Verify option is selected.
    await this.expectTextContentToBe(selectedOptionSelector, contributionType);
  }
}

export const ContributorFactory = (): Contributor => new Contributor();
