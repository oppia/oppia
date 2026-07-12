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
 * @fileoverview Topic manager utility file.
 */

import {Page, expect} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const navbarBreadcrumbSelector = '.e2e-test-navbar-breadcrumb';
const topicNameField = '.e2e-test-topic-name-field';
const topicEditorUrlFragmentField =
  '.e2e-test-topic-url-fragment-field .e2e-test-url-fragment-field';
const displayMobileFiltersButton = '.e2e-test-mobile-toggle-filter';
const mobileTopicFilterResetSelector = '.e2e-test-mobile-topic-filter-reset';
const resetTopicFilterButtonSelector = '.e2e-test-topic-filter-reset';
const sortDropdownSelector = '.e2e-test-select-sort-dropdown';
const topicStatusDropdownSelector = '.e2e-test-select-topic-status-dropdown';
const classroomDropdownSelector = '.e2e-test-select-classroom-dropdown';
const skillStatusDropdownSelector = '.e2e-test-select-skill-status-dropdown';
const closeMobileFiltersButton = '.e2e-test-mobile-filter-close';
const keywordDropdownSelector = '.e2e-test-select-keyword-dropdown';
const multiSelectionInputSelector = '.e2e-test-multi-selection-input';
const multiSelectionInputChipSelector = '.e2e-test-multi-selection-chip';
const skillsTab = 'a.e2e-test-skills-tab';
const mobileSkillSelector = 'span.e2e-test-mobile-skill-name';
const desktopSkillSelector = '.e2e-test-skill-description';
const skillSelectInQuestionTabSelector =
  '.e2e-test-select-skill-dropdown mat-select';
const questionTextSelector = '.e2e-test-question-text';
const addQuestionButtonSelector = '.e2e-test-create-question-button';
const saveQuestionButton = 'button.e2e-test-save-question-button';
const mobileNavbarDropdown =
  'div.navbar-mobile-options .e2e-test-mobile-navbar-dropdown';
const mobileOptionsSelector = '.e2e-test-mobile-options-base';
const mobileTopicSelector = 'div.e2e-test-mobile-topic-name a';
const desktopTopicSelector = 'a.e2e-test-topic-name';

const topicsAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;

export class TopicManager extends BaseUser {
  /**
   * Checks if the breadcrumb in the navbar contains the given text.
   */
  async expectNavbarBreadcrumbToContain(text: string): Promise<void> {
    await this.expectElementToBeVisible(navbarBreadcrumbSelector);
    await this.expectTextContentToContain(navbarBreadcrumbSelector, text);
  }

  /**
   * Checks if the topic name field and topic url field are disabled.
   */
  async expectTopicNameAndTopicURLInputToBeDisabled(): Promise<void> {
    const nameField = this.page.locator(topicNameField);
    const urlField = this.page.locator(topicEditorUrlFragmentField);
    await expect(nameField).toBeDisabled();
    await expect(urlField).toBeDisabled();
  }

  /**
   * Helper to select a material option.
   */
  private async selectMatOption(
    selector: string,
    optionText: string
  ): Promise<void> {
    await this.expectElementToBeVisible(selector);
    await this.clickOnElementWithSelector(selector);

    const option = this.page.locator('mat-option', {hasText: optionText});
    await option.waitFor({state: 'visible'});
    await option.click();
    await this.expectElementToBeVisible('mat-option', false);
  }

  /**
   * Navigates to the Topics and Skills Dashboard page.
   */
  async navigateToTopicsAndSkillsDashboardPage(): Promise<void> {
    await this.goto(topicsAndSkillsDashboardUrl);
  }

  /**
   * Filters topics by status.
   */
  async filterTopicsByStatus(
    status: 'Published' | 'Not Published' | 'All'
  ): Promise<void> {
    await this.page.bringToFront();
    await this.navigateToTopicsAndSkillsDashboardPage();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(displayMobileFiltersButton);
    }
    await this.expectElementToBeVisible(topicStatusDropdownSelector);
    await this.selectMatOption(topicStatusDropdownSelector, status);

    const dropdownValue = this.page.locator(
      `${topicStatusDropdownSelector} .mat-select-value-text`
    );
    await expect(dropdownValue).toHaveText(status);

    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(closeMobileFiltersButton);
    }
    showMessage(`Filtered topics by status: ${status}`);
  }

  /**
   * Checks if the filtered topics match the expected topics.
   */
  async expectFilteredTopics(
    expectedTopics: string[],
    visible: boolean = true
  ): Promise<void> {
    const topicNameSelector = this.isViewportAtMobileWidth()
      ? mobileTopicSelector
      : desktopTopicSelector;
    await this.waitForStaticAssetsToLoad();

    if (expectedTopics.length === 0) {
      throw new Error("Topics list can't be empty");
    }

    const topicElements = this.page.locator(topicNameSelector);
    const count = await topicElements.count();
    const topicNames: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await topicElements.nth(i).textContent())?.trim();
      if (text) {
        topicNames.push(text);
      }
    }

    const missingTopics = expectedTopics.filter(
      topic => !topicNames.includes(topic)
    );
    const matchedTopics = topicNames.filter(topic =>
      expectedTopics.includes(topic)
    );

    if (visible && missingTopics.length > 0) {
      throw new Error(
        `Expected topics "${missingTopics.join('", "')}" to be present, but they were not found.\n` +
          `Found topics: "${topicNames.join('", "')}"`
      );
    }

    if (!visible && matchedTopics.length > 0) {
      throw new Error(
        `Expected topics "${matchedTopics.join('", "')}" to not be present, but they were found.\n` +
          `Found topics: "${topicNames.join('", "')}"`
      );
    }

    showMessage('Filtered topics match the expected topics.');
  }

  /**
   * Resets the topic filter.
   */
  async resetTopicFilter(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(displayMobileFiltersButton);
      await this.clickOnElementWithSelector(displayMobileFiltersButton);
      await this.clickOnElementWithSelector(mobileTopicFilterResetSelector);
    } else {
      await this.expectElementToBeVisible(resetTopicFilterButtonSelector);
      await this.clickOnElementWithSelector(resetTopicFilterButtonSelector);
    }

    const sortValue = this.page.locator(
      `${sortDropdownSelector} .mat-select-value-text`
    );
    await expect(sortValue).toHaveText('Most Recently Updated');

    if (await this.isElementVisible(topicStatusDropdownSelector)) {
      const statusValue = this.page.locator(
        `${topicStatusDropdownSelector} .mat-select-value-text`
      );
      await expect(statusValue).toHaveText('All');
    }
    if (await this.isElementVisible(classroomDropdownSelector)) {
      const classroomValue = this.page.locator(
        `${classroomDropdownSelector} .mat-select-min-line`
      );
      await expect(classroomValue).toHaveText('Classrooms');
    }
    if (await this.isElementVisible(skillStatusDropdownSelector)) {
      const skillStatusValue = this.page.locator(
        `${skillStatusDropdownSelector} .mat-select-value-text`
      );
      await expect(skillStatusValue).toHaveText('All');
    }
  }

  /**
   * Sorts topics by a given option.
   */
  async sortTopics(
    sortOption:
      | 'Least Recently Updated'
      | 'Most Recently Updated'
      | 'Newly Created'
      | 'Oldest Created'
  ): Promise<void> {
    await this.page.bringToFront();
    await this.navigateToTopicsAndSkillsDashboardPage();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(displayMobileFiltersButton);
    }
    await this.expectElementToBeVisible(sortDropdownSelector);
    await this.selectMatOption(sortDropdownSelector, sortOption);

    const dropdownValue = this.page.locator(
      `${sortDropdownSelector} .mat-select-value-text`
    );
    await expect(dropdownValue).toHaveText(sortOption);

    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(closeMobileFiltersButton);
    }
    showMessage(`Sorted topics by: ${sortOption}`);
  }

  /**
   * Checks if the topics are in the expected order.
   */
  async expectFilteredTopicsInOrder(expectedOrder: string[]): Promise<void> {
    const topicNameSelector = this.isViewportAtMobileWidth()
      ? mobileTopicSelector
      : desktopTopicSelector;

    await this.waitForStaticAssetsToLoad();
    await this.expectElementToBeVisible(topicNameSelector);

    const topicElements = this.page.locator(topicNameSelector);
    const count = await topicElements.count();
    const topicNames: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await topicElements.nth(i).textContent())?.trim();
      if (text) {
        topicNames.push(text);
      }
    }

    if (!topicNames.every((name, index) => name === expectedOrder[index])) {
      throw new Error(
        'Topics are not in the expected order.\n' +
          `Expected topics: "${expectedOrder.join('", "')}"\n` +
          `Found topics: "${topicNames.join('", "')}"`
      );
    }
    showMessage('Topics are in the expected order.');
  }

  /**
   * Filters topics by keyword.
   */
  async filterTopicsByKeyword(keyword: string): Promise<void> {
    await this.page.bringToFront();
    await this.navigateToTopicsAndSkillsDashboardPage();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(displayMobileFiltersButton);
    }
    await this.expectElementToBeVisible(keywordDropdownSelector);
    await this.clickOnElementWithSelector(keywordDropdownSelector);
    await this.expectElementToBeVisible(multiSelectionInputSelector);
    await this.typeInInputField(multiSelectionInputSelector, keyword);
    await this.page.keyboard.press('Enter');

    const chip = this.page.locator(multiSelectionInputChipSelector);
    await expect(chip).toHaveText(`${keyword} cancel`);

    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(closeMobileFiltersButton);
    }
    showMessage(`Filtered topics by keyword: ${keyword}`);
  }

  /**
   * Navigates to the skills tab in topics and skills dashboard.
   */
  async navigateToSkillsTab(): Promise<void> {
    await this.expectElementToBeVisible(skillsTab);
    await this.clickOnElementWithSelector(skillsTab);
    await this.waitForNetworkIdle();
  }

  /**
   * Expects the keywords selected in the keyword filter to match the given list.
   */
  async expectKeywordsSelectedToBe(keywords: string[]): Promise<void> {
    if (keywords.length === 0) {
      await this.expectElementToBeVisible(
        multiSelectionInputChipSelector,
        false
      );
      return;
    }

    const chips = this.page.locator(multiSelectionInputChipSelector);
    const count = await chips.count();
    expect(count).toBe(keywords.length);

    const keywordChips: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await chips.nth(i).textContent())?.trim();
      if (text) {
        keywordChips.push(text);
      }
    }

    const missedKeywords = keywords.filter(
      keyword => !keywordChips.includes(`${keyword} cancel`)
    );

    if (missedKeywords.length > 0) {
      throw new Error(
        `Keywords ${missedKeywords.join(', ')} were not found in the multi-selection input.\n` +
          `Keywords found: ${keywordChips.join(', ')}`
      );
    }
  }

  /**
   * Filters skills by status.
   */
  async filterSkillsByStatus(status: string): Promise<void> {
    await this.page.bringToFront();
    await this.navigateToTopicsAndSkillsDashboardPage();
    await this.navigateToSkillsTab();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(displayMobileFiltersButton);
    }
    await this.expectElementToBeVisible(skillStatusDropdownSelector);
    await this.selectMatOption(skillStatusDropdownSelector, status);

    const dropdownValue = this.page.locator(
      `${skillStatusDropdownSelector} .mat-select-value-text`
    );
    await expect(dropdownValue).toHaveText(status);

    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(closeMobileFiltersButton);
    }
    showMessage(`Filtered skill by status: ${status}`);
  }

  /**
   * Expects the filtered skills to match the provided list.
   */
  async expectFilteredSkills(
    expectedSkills: string[],
    visible: boolean = true
  ): Promise<void> {
    const skillNameSelector = this.isViewportAtMobileWidth()
      ? mobileSkillSelector
      : desktopSkillSelector;
    await this.waitForStaticAssetsToLoad();

    const skillElements = this.page.locator(skillNameSelector);
    await this.waitForNetworkIdle();
    const count = await skillElements.count();
    const foundSkills: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await skillElements.nth(i).textContent())?.trim();
      if (text) {
        foundSkills.push(text);
      }
    }

    for (const skill of expectedSkills) {
      if (visible) {
        expect(foundSkills).toContain(skill);
      } else {
        expect(foundSkills).not.toContain(skill);
      }
    }
    showMessage('Filtered skills match the expected skills.');
  }

  /**
   * Expects the skills to be in a certain order.
   */
  async expectFilteredSkillsInOrder(expectedOrder: string[]): Promise<void> {
    const skillNameSelector = this.isViewportAtMobileWidth()
      ? mobileSkillSelector
      : desktopSkillSelector;

    await this.waitForStaticAssetsToLoad();
    await this.expectElementToBeVisible(skillNameSelector);

    const skillElements = this.page.locator(skillNameSelector);
    const count = await skillElements.count();
    const skillNames: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await skillElements.nth(i).textContent())?.trim();
      if (text) {
        skillNames.push(text);
      }
    }

    if (!skillNames.every((name, index) => name === expectedOrder[index])) {
      throw new Error(
        'Skills are not in the expected order.\n' +
          `Expected skills: "${expectedOrder.join('", "')}"\n` +
          `Found skills: "${skillNames.join('", "')}"`
      );
    }
    showMessage('Skills are in the expected order.');
  }

  /**
   * Filters skills by keyword.
   */
  async filterSkillsByKeyword(keyword: string): Promise<void> {
    await this.page.bringToFront();
    await this.navigateToTopicsAndSkillsDashboardPage();
    await this.navigateToSkillsTab();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(displayMobileFiltersButton);
    }
    await this.expectElementToBeVisible(keywordDropdownSelector);
    await this.clickOnElementWithSelector(keywordDropdownSelector);
    await this.expectElementToBeVisible(multiSelectionInputSelector);
    await this.typeInInputField(multiSelectionInputSelector, keyword);
    await this.page.keyboard.press('Enter');

    const chip = this.page.locator(multiSelectionInputChipSelector);
    await expect(chip).toHaveText(`${keyword} cancel`);

    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(closeMobileFiltersButton);
    }
    showMessage(`Filtered skills by keyword: ${keyword}`);
  }

  /**
   * Navigates to a tab in the topic editor page.
   */
  async navigateToTabInTopicEditorPage(
    tabName: 'Preview Tab' | 'Questions Tab'
  ): Promise<void> {
    const lowerCaseTabName = tabName.toLocaleLowerCase().replace(' ', '-');
    if (this.isViewportAtMobileWidth()) {
      if (!(await this.isElementVisible(mobileNavbarDropdown))) {
        await this.clickOnElementWithSelector(mobileOptionsSelector);
      }
      await this.clickOnElementWithSelector(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(
        `.e2e-test-mobile-${lowerCaseTabName}`
      );
    } else {
      const tabSelector = `.e2e-test-${lowerCaseTabName}-button`;
      await this.expectElementToBeVisible(tabSelector);
      await this.clickOnElementWithSelector(tabSelector);
    }

    const questionTabContainerSelector = `.e2e-test-topic-${lowerCaseTabName}-container`;
    await this.expectElementToBeVisible(questionTabContainerSelector);
  }

  /**
   * Selects a skill in the questions tab.
   */
  async selectSkillInQuestionsTab(skillName: string): Promise<void> {
    await this.expectElementToBeVisible(skillSelectInQuestionTabSelector);
    await this.clickOnElementWithSelector(skillSelectInQuestionTabSelector);

    const option = this.page.locator('mat-option', {hasText: skillName});
    await option.waitFor({state: 'visible'});
    await option.click();

    const selectValue = this.page.locator(skillSelectInQuestionTabSelector);
    await expect(selectValue).toHaveText(skillName);
  }

  /**
   * Expects a question to be visible.
   */
  async expectQuestionToBeVisible(question: string): Promise<void> {
    const questionTextElement = this.page.locator(questionTextSelector, {
      hasText: question,
    });
    await questionTextElement.waitFor({state: 'visible'});
    showMessage(`Question ${question} is visible.`);
  }

  /**
   * Clicks on the add question button.
   */
  async clickOnAddQuestionButton(): Promise<void> {
    await this.expectElementToBeVisible(addQuestionButtonSelector);
    await this.clickOnElementWithSelector(addQuestionButtonSelector);
    await this.expectElementToBeVisible(addQuestionButtonSelector, false);
  }

  /**
   * Saves a question.
   */
  async saveQuestion(): Promise<void> {
    await this.clickOnElementWithSelector(saveQuestionButton);
    await this.expectElementToBeVisible(saveQuestionButton, false);
  }
}

export let TopicManagerFactory = (page: Page): TopicManager => {
  return new TopicManager(page);
};
