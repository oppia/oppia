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
import {showMessage} from '../common/show-message';
import {ExplorationEditor} from './exploration-editor';

const contributionTabSelector = '.e2e-test-contribution-tab';
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

const reviewCommentTextareaSelector = '.e2e-test-suggestion-review-message';

const languageSelector = '.e2e-test-language-selector';
const selectedLanguageSelector = '.e2e-test-language-selector-selected';
const featuredLanguageOptionSelector = '.e2e-test-featured-language';
const languageOptionSelector = '.e2e-test-language-selector-option';
const rteDisplaySelector = '.e2e-test-state-content-display';
const featuredLanguageContainerSelector =
  '.e2e-test-featured-language-container';
const featuredLanguageTooltipSelector = '.e2e-test-featured-language-tooltip';
const featuredLanguageExplainationSelector =
  '.e2e-test-language-selector-featured-explanation';
const languageDropdownToggleArrowSelector =
  '.e2e-test-language-dropdown-toggle-arrow';

export class Contributor extends ExplorationEditor {
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
  async expectOpportunityToBePresent(
    heading: string,
    subheading: string,
    visible: boolean = true
  ): Promise<ElementHandle | null> {
    const translationOpportunitiesPreset = await this.isElementVisible(
      opportunityItemSelector
    );

    // Sometimes, the opportunities refreshes after they have been loaded.
    // This causes problem that older node gets detached from the DOM.
    // So, we are ensuring that the opportunity list hasn't been changed
    // for 200 ms.
    let previousElementIds: string[] = [];
    let opportunityItemListChanged = true;

    // TODO(#23395): Currently, the opportunity list is refreshed after the
    // page is loaded. This causes the test to fail. We are using a workaround
    // for now, by waiting for the opportunity list to be loaded.
    // Once the issue is fixed, remove the following do-while loop.
    do {
      await this.page.waitForTimeout(200);

      const currentElementIds = await this.page.evaluate((selector: string) => {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).map((el, index) => {
          return el.textContent?.trim() || `element-${index}`;
        });
      }, opportunityItemSelector);

      opportunityItemListChanged =
        previousElementIds.length !== currentElementIds.length ||
        !previousElementIds.every(
          (id, index) => id === currentElementIds[index]
        );

      previousElementIds = currentElementIds;
    } while (opportunityItemListChanged);

    // Handle the case where no translation opportunity is present.
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
    button: 'previous' | 'next',
    disabled: boolean = true
  ): Promise<void> {
    const selector =
      button === 'previous'
        ? paginationButtonPreviousSelector
        : paginationButtonNextSelector;
    await this.expectElementToBeVisible(selector);
    await this.expectElementToBeClickable(selector, !disabled);
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
    tabName: 'Contribution Stats' | 'Badges' | 'Review Questions'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.waitForPageToFullyLoad();
      await this.expectElementToBeVisible(viewDropdownSelector);
      await this.page.waitForFunction(
        (selector: string) => {
          const element = document.querySelector(selector);
          return element && element.textContent !== '';
        },
        {},
        viewDropdownSelector
      );
      await this.clickOn(viewDropdownSelector);

      const xpath = `//*[contains(@class, '${viewDropdownOptionClass}') and contains(text(), "${tabName}")]`;

      const optionElement = await this.page.waitForXPath(xpath);

      if (!optionElement) {
        throw new Error(`Option ${tabName} not found.`);
      }
      await this.waitForElementToStabilize(optionElement);
      await optionElement.click();

      await this.expectTextContentToBe(viewDropdownSelector, tabName);
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
      ? `${mobileBadgeContainerSelector} ${badgeSelector}`
      : `${desktopBadgeContainerSelector} ${badgeSelector}`;
    await this.expectElementToBeVisible(viewBasedBadgeSelector);

    const badges = await this.page.$$(viewBasedBadgeSelector);
    let badge: ElementHandle<Element> | null = null;
    for (const badgeElement of badges) {
      const badgeValue = await badgeElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim(),
        badgeValueSelector
      );
      if (badgeValue !== expectedBadgeValue) {
        continue;
      }
      const badgeCaption = await badgeElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim(),
        badgeCaptionSelector
      );
      if (badgeCaption !== expectedBadgeCaption) {
        continue;
      }

      if (expectedBadgeLanguage) {
        const badgeLanguage = await badgeElement.evaluate(
          (el: Element, sel: string) =>
            el.querySelector(sel)?.textContent?.trim(),
          badgeLanguageSelector
        );
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
   * Selects the badge type in the contribution dashboard.
   * @param badgeType - The badge type to select.
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

    await this.expectElementToBeVisible(topicSelector);
    await this.clickOn(topicSelector);

    await this.expectElementToBeVisible(topicOptionSelector);

    const buttonXPath = `//*[normalize-space(.)='${badgeType}']`;
    const badgeOption = await this.page.waitForXPath(buttonXPath);
    if (!badgeOption) {
      throw new Error(`Badge type ${badgeType} not found.`);
    }

    await badgeOption.click();

    // Verify option is selected.
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

    if (this.isViewportAtMobileWidth()) {
      await this.waitForPageToFullyLoad();
    }

    await this.expectElementToBeVisible(selectedOptionSelector);
    await this.clickOn(selectedOptionSelector);

    await this.expectElementToBeVisible(topicOptionSelector);
    const contibutionTypeOptions = await this.page.$$(topicOptionSelector);
    let optionElement: ElementHandle<Element> | null = null;
    let foundOptions: string[] = [];
    for (const option of contibutionTypeOptions) {
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

    // Click on the option.
    await optionElement.click();

    // Verify option is selected.
    await this.expectTextContentToBe(selectedOptionSelector, contributionType);
  }

  /**
   * Filters content by topic.
   * @param {string} topicName - The name of the topic to filter by.
   */
  async filterContentByTopic(topicName: string): Promise<void> {
    await this.expectElementToBeVisible(topicSelector);
    await this.clickOn(topicSelector);

    await this.expectElementToBeVisible(topicOptionSelector);
    const optionElements = await this.page.$$(topicOptionSelector);
    let optionElement: ElementHandle<Element> | null = null;

    for (const option of optionElements) {
      const optionText = await option.evaluate(el => el.textContent?.trim());
      if (optionText === topicName) {
        optionElement = option;
        break;
      }
    }

    if (!optionElement) {
      throw new Error(`Option ${topicName} not found.`);
    }

    // Click on the option.
    await optionElement.click();

    // Verify option is selected.
    await this.expectTextContentToBe(selectedTopicSelector, topicName);
  }

  /**
   * Switches to the tab in the contribution dashboard.
   * @param tabName - The name of the tab to switch to.
   */
  async switchToTabInContributionDashboard(
    tabName: 'Translate Text' | 'My Contributions' | 'Submit Question'
  ): Promise<void> {
    await this.page.waitForSelector(contributionTabSelector);

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

    // Click on the tab.
    await this.waitForElementToBeClickable(tabElement);
    await tabElement.click();

    // Verify tab is active.
    if (tabName !== 'My Contributions') {
      await this.expectTextContentToBe(activeTabNameSelector, tabName);
    } else {
      await this.expectElementToBeVisible(activeTabNameSelector, false);
    }
  }

  /**
   * Expects the contribution table to contain a row with the given topic name,
   * accepted cards, and accepted words.
   * @param {string[]} rowValues - The values of the row to be checked.
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
    if (!tableRows || tableRows.length === 0) {
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
        return;
      }
    }

    throw new Error('Row not found in the contribution table with values.');
  }

  /**
   * Checks if the translation status is as expected.
   * @param {string} heading - The name of the chapter.
   * @param {string} subheading - The subheading of the chapter.
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
    const statusElement = await opportunityItem?.waitForSelector(
      opportunityStatusLabelSelector
    );
    const textContent = await statusElement?.evaluate(element =>
      element.textContent?.trim()
    );
    expect(textContent).toBe(expectedStatus);
  }

  /**
   * Fills the review comment textarea with the given comment.
   * @param comment The comment to fill the textarea with.
   */
  async fillReviewComment(comment: string): Promise<void> {
    await this.expectElementToBeVisible(reviewCommentTextareaSelector);
    await this.type(reviewCommentTextareaSelector, comment);

    await this.expectElementValueToBe(reviewCommentTextareaSelector, comment);
  }

  /**
   * Clicks on the language filter dropdown.
   */
  async clickOnLanguageFilterDropdown(): Promise<void> {
    // Open the language selector dropdown.
    await this.expectElementToBeVisible(languageSelector);
    await this.clickOn(languageSelector);
    await this.waitForPageToFullyLoad();

    await this.expectElementToBeVisible(languageOptionSelector);
  }

  /**
   * Clicks on language selection dropdown and selects the given language.
   * @param language - The language to select.
   */
  async selectLanguageFilter(language: string): Promise<void> {
    await this.clickOnLanguageFilterDropdown();
    // Find the language option in the dropdown.
    let languageOption: ElementHandle<Element> | null = null;
    for (const optionSelector of [
      featuredLanguageOptionSelector,
      languageOptionSelector,
    ]) {
      if (!(await this.isElementVisible(optionSelector))) {
        continue;
      }
      // Get the language option element.
      for (const option of await this.page.$$(optionSelector)) {
        const optionText = await option.evaluate(el => el.textContent?.trim());
        if (optionText?.includes(language)) {
          languageOption = option;
          break;
        }
      }

      // If the language option is found, break the loop.
      if (languageOption) {
        break;
      }
    }

    if (!languageOption) {
      throw new Error(`Language ${language} not found.`);
    }

    // Click on the language option.
    await languageOption.click();

    // Verify language is selected.
    await this.expectTextContentToContain(selectedLanguageSelector, language);
  }

  /**
   * Checks if the selected filter language is present or not.
   * @param language - The language to check.
   */
  async expectSelectedFilterLanguageToBe(language: string): Promise<void> {
    await this.expectTextContentToContain(selectedLanguageSelector, language);
  }

  /**
   * Checks if the featured languages are present or not.
   * @param expectedLanguages - The expected languages.
   */
  async expectFeaturedLangaugesToContain(
    expectedLanguages: string[]
  ): Promise<void> {
    await this.expectElementToBeVisible(featuredLanguageContainerSelector);
    const featuredLanguages = await this.page.$$eval(
      featuredLanguageOptionSelector,
      elements =>
        elements.map(el => el.textContent?.replace('info', '').trim() || '')
    );

    for (const expectedLanguage of expectedLanguages) {
      if (!featuredLanguages.includes(expectedLanguage)) {
        throw new Error(
          'Featured language not found.\n' +
            `Expected: ${expectedLanguage}\n` +
            `Found: ${featuredLanguages.join(', ')}`
        );
      }
    }
  }

  /**
   * Mouse over the featured language tooltip.
   * @param index - The index of the featured language.
   * @param tooltipMessage - The expected tooltip message.
   */
  async mouseOverFeaturedLanguageTooltip(
    index: number,
    tooltipMessage: string
  ): Promise<void> {
    await this.expectElementToBeVisible(featuredLanguageContainerSelector);
    const featuredLanguagesInfoElements = await this.page.$$(
      featuredLanguageTooltipSelector
    );
    await featuredLanguagesInfoElements[index].hover();

    await this.expectTextContentToBe(
      featuredLanguageExplainationSelector,
      tooltipMessage
    );

    await this.clickOn(languageDropdownToggleArrowSelector);

    await this.expectElementToBeVisible(languageOptionSelector, false);
  }

  /**
   * Checks that the question in the review modal is the same as the one passed in.
   * @param question The question to check.
   */
  async expectQuestionInReviewModalToBe(question: string): Promise<void> {
    await this.expectTextContentToBe(rteDisplaySelector, question);
  }
}

export const ContributorFactory = (): Contributor => new Contributor();
