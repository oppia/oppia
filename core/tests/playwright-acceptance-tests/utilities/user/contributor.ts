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

import {expect, Locator, Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';

const contributionTabSelector = '.e2e-test-contribution-tab';
const activeTabNameSelector = '.e2e-test-active-tab-name';
const activeTabDescriptionSelector = '.e2e-test-active-tab-description';
const usernameSelector = '.e2e-test-username';

export const opportunityItemSelector = '.e2e-test-opportunity-list-item';
export const opportunityItemHeadingSelector =
  '.e2e-test-opportunity-list-item-heading';
export const opportunitySubHeadingSelector =
  '.e2e-test-opportunity-list-item-subheading';
export const opportunityTranslateButtonSelector =
  '.e2e-test-opportunity-list-item-button';

const selectedTopicSelector = '.e2e-test-topic-selector-selected';
const topicOptionSelector = '.e2e-test-topic-selector-option';
const languageSelector = '.e2e-test-language-selector';
const selectedLanguageSelector = '.e2e-test-language-selector-selected';
const featuredLanguageOptionSelector = '.e2e-test-featured-language';
const languageOptionSelector = '.e2e-test-language-selector-option';
const featuredLanguageContainerSelector =
  '.e2e-test-featured-language-container';
const featuredLanguageTooltipSelector = '.e2e-test-featured-language-tooltip';
const featuredLanguageExplanationSelector =
  '.e2e-test-language-selector-featured-explanation';
const languageDropdownToggleArrowSelector =
  '.e2e-test-language-dropdown-toggle-arrow';
const languageDropdownSelector = '.e2e-test-language-selector-dropdown';
const topicSelector = '.e2e-test-topic-selector';
const opportunityStatusLabelSelector = '.e2e-test-opportunity-list-item-label';

export class Contributor extends BaseUser {
  /**
   * Verifies the username shown in the contributor dashboard.
   *
   * The dashboard hides this element on narrow viewports; callers should
   * perform the desktop-only check when the viewport requires it.
   */
  async expectUsernameToBe(expectedUsername: string): Promise<void> {
    await expect(this.page.locator(usernameSelector)).toHaveText(
      expectedUsername
    );
  }

  /** Verifies the active contribution tab name. */
  async expectActiveTabNameToBe(tabName: string): Promise<void> {
    await expect(this.page.locator(activeTabNameSelector)).toHaveText(tabName);
  }

  /** Verifies the active contribution tab description. */
  async expectActiveTabDescriptionToBe(description: string): Promise<void> {
    await expect(this.page.locator(activeTabDescriptionSelector)).toContainText(
      description
    );
  }

  /** Verifies whether the current tab contains translation opportunities. */
  async expectTranslationOpportunitiesToBePresent(
    present: boolean = true
  ): Promise<void> {
    const opportunities = this.page.locator(opportunityItemSelector);
    if (present) {
      await expect(opportunities.first()).toBeVisible();
    } else {
      await expect(opportunities).toHaveCount(0);
    }
  }

  /** Verifies that a specific translation opportunity is present or absent. */
  async expectOpportunityToBePresent(
    heading: string,
    subheading: string,
    visible: boolean = true
  ): Promise<void> {
    const opportunity = this.page
      .locator(opportunityItemSelector)
      .filter({
        has: this.page
          .locator(opportunityItemHeadingSelector)
          .filter({hasText: heading}),
      })
      .filter({
        has: this.page
          .locator(opportunitySubHeadingSelector)
          .filter({hasText: subheading}),
      });

    if (visible) {
      await expect(opportunity.first()).toBeVisible();
    } else {
      await expect(opportunity).toHaveCount(0);
    }
  }

  /** Opens the language filter dropdown. */
  async clickOnLanguageFilterDropdown(): Promise<void> {
    await this.clickOnElementWithSelector(languageSelector);
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(languageOptionSelector);
  }

  /** Selects a language from the translation opportunity filter. */
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

  /** Verifies the selected language filter. */
  async expectSelectedFilterLanguageToBe(language: string): Promise<void> {
    await expect(this.page.locator(selectedLanguageSelector)).toContainText(
      language
    );
  }

  /** Verifies that all expected featured languages are listed. */
  async expectFeaturedLanguagesToContain(
    expectedLanguages: string[]
  ): Promise<void> {
    await expect(
      this.page.locator(featuredLanguageContainerSelector)
    ).toBeVisible();

    const featuredLanguages = this.page.locator(featuredLanguageOptionSelector);
    for (const language of expectedLanguages) {
      await expect(
        featuredLanguages.filter({hasText: language}).first()
      ).toBeVisible();
    }
  }

  /** Verifies the explanation shown for a featured language. */
  async mouseOverFeaturedLanguageTooltip(
    index: number,
    tooltipMessage: string
  ): Promise<void> {
    await expect(
      this.page.locator(featuredLanguageContainerSelector)
    ).toBeVisible();
    await this.page.locator(featuredLanguageTooltipSelector).nth(index).hover();
    await expect(
      this.page.locator(featuredLanguageExplanationSelector)
    ).toHaveText(tooltipMessage);
    await this.page.locator(languageDropdownToggleArrowSelector).click();
    await expect(this.page.locator(languageDropdownSelector)).toBeHidden();
  }

  /** Selects a subject in the translation opportunity filter. */
  async selectSubjectInTranslateTextTab(subject: string): Promise<void> {
    await this.page.locator(topicSelector).click();
    const option = this.page
      .locator(topicOptionSelector)
      .filter({hasText: subject})
      .first();
    await expect(option).toBeVisible();
    await option.click();
    await expect(this.page.locator(selectedTopicSelector)).toContainText(
      subject
    );
  }

  /** Verifies the status displayed for a submitted contribution. */
  async expectContributionStatusToBe(
    heading: string,
    subheading: string,
    expectedStatus: string
  ): Promise<void> {
    const opportunity = this.page
      .locator(opportunityItemSelector)
      .filter({
        has: this.page
          .locator(opportunityItemHeadingSelector)
          .filter({hasText: heading}),
      })
      .filter({
        has: this.page
          .locator(opportunitySubHeadingSelector)
          .filter({hasText: subheading}),
      })
      .first();
    await expect(opportunity).toBeVisible();
    await expect(
      opportunity.locator(opportunityStatusLabelSelector)
    ).toHaveText(expectedStatus);
  }

  /** Navigates to a tab in the contribution dashboard. */
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
}

/** Returns an opportunity card matching the supplied heading and subheading. */
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
