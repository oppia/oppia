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

import {TranslationAdminFactory} from './translation-admin';

/**
 * @fileoverview Utilty class for translation submitter.
 */

import {ElementHandle} from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';

// Common Selectors.
const activeTabSelector = '.e2e-test-active-tab';

// Contributor Dashboard Selectors.
const contributionTabSelector = '.e2e-test-contribution-tab';
const paginationBtnSelectorPrefix = '.e2e-test-pagination-button';

// Contribution Dashboard > Translate Text Tab Selectors.
const languageSelector = '.e2e-test-language-selector';
const selectedLanguageSelector = '.e2e-test-language-selector-selected';
const featuredLanguageOptionSelector = '.e2e-test-featured-language';
const languageOptionSelector = '.e2e-test-language-selector-option';
const topicSelector = '.e2e-test-topic-selector';
const selectedTopicSelector = '.e2e-test-topic-selector-selected';
const topicOptionSelector = '.e2e-test-topic-selector-option';
const opportunityItemSelector = '.e2e-test-opportunity-list-item';
const opportunityItemHeadingSelector =
  '.e2e-test-opportunity-list-item-heading';
const opportunitySubHeadingSelector =
  '.e2e-test-opportunity-list-item-subheading';
const opportunityTranslateButtonSelector =
  '.e2e-test-opportunity-list-item-button';
const translateTextModalHeaderContainerSelector =
  '.e2e-test-translate-text-header-container';

export class TranslationSubmitter extends BaseUser {
  /**
   * Clicks on the given pagination button.
   * @param button - The button to click on.
   */
  async clickOnPaginationButton(button: 'previous' | 'next') {
    const selector = `${paginationBtnSelectorPrefix}-${button}`;
    await this.expectElementToBeVisible(selector);

    await this.clickOn(selector);

    // TODO: Post-check: Verify if the page is loaded.
  }

  async clickOnTranslateButtonInTranslateTextTab(
    chapterName: string,
    storyName: string
  ) {
    await this.expectElementToBeVisible(opportunityItemSelector);

    const opportunityItems = await this.page.$$(opportunityItemSelector);
    let opportunityItem: ElementHandle<Element> | null = null;
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
        opportunityItemHeading === chapterName &&
        opportunityItemSubHeading === storyName
      ) {
        opportunityItem = opportunityItemElement;
        break;
      }
    }

    if (!opportunityItem) {
      throw new Error(
        `Opportunity item for chapter ${chapterName} and story ${storyName} not found.`
      );
    }

    // Click on translate button in the opportunity item.
    const translateButton = await opportunityItem.waitForSelector(
      opportunityTranslateButtonSelector
    );
    if (!translateButton) {
      throw new Error(
        `Translate button for chapter ${chapterName} and story ${storyName} not found.`
      );
    }
    await translateButton.click();

    // Verify that the translation editor is opened.
    await this.expectElementToBeVisible(
      translateTextModalHeaderContainerSelector
    );
  }

  /**
   * Checks if the pagination button is visible or not.
   * @param button - The button to check for.
   * @param visible - Whether the button should be visible or not.
   */
  async expectPaginationButtonToBeVisible(
    button: 'previous' | 'next',
    visible: boolean = true
  ) {
    const selector = `${paginationBtnSelectorPrefix}-${button}`;
    await this.expectElementToBeVisible(selector, visible);
  }

  /**
   * Clicks on language selection dropdown and selects the given language.
   * @param language - The language to select.
   */
  async selectLanguageInTranslateTextTab(language: string): Promise<void> {
    // Open the language selector dropdown.
    await this.expectElementToBeVisible(languageSelector);
    await this.clickOn(languageSelector);

    // Find the language option in the dropdown.
    let languageOption: ElementHandle<Element> | null = null;
    for (const optionSelector of [
      featuredLanguageOptionSelector,
      languageOptionSelector,
    ]) {
      await this.expectElementToBeVisible(optionSelector);
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
   * Clicks on subject selection dropdown and selects the given subject.
   * @param subject - The subject to select.
   */
  async selectSubjectInTranslateTextTab(subject: string): Promise<void> {
    await this.expectElementToBeVisible(topicSelector);
    await this.clickOn(topicSelector);

    // Find the subject option in the dropdown.
    let subjectOption: ElementHandle<Element> | null = null;
    await this.expectElementToBeVisible(topicOptionSelector);
    for (const option of await this.page.$$(topicOptionSelector)) {
      const optionText = await option.evaluate(el => el.textContent?.trim());
      if (optionText?.includes(subject)) {
        subjectOption = option;
        break;
      }
    }

    if (!subjectOption) {
      throw new Error(`Subject ${subject} not found.`);
    }

    // Click on the subject option.
    await subjectOption.click();

    // Verify subject is selected.
    await this.expectTextContentToContain(selectedTopicSelector, subject);
  }

  /**
   * Switches to the tab in the contribution dashboard.
   * @param tabName - The name of the tab to switch to.
   */
  async switchToTabInContributionDashboard(tabName: 'Translate Text') {
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
    await tabElement.click();

    // Verify tab is active.
    const activeContributionTabSelector = `${contributionTabSelector}${activeTabSelector}`;
    await this.expectTextContentToBe(activeContributionTabSelector, tabName);
  }
}

export let TranslationSubmitterFactory = (): TranslationSubmitter =>
  new TranslationSubmitter();
