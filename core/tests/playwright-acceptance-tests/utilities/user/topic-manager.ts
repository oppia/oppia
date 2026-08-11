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

const modalDiv = 'div.modal-content';
const closeSaveModalButton = '.e2e-test-close-save-modal-button';
const saveChangesMessageInput = 'textarea.e2e-test-commit-message-input';
const uploadPhotoButton = 'button.e2e-test-photo-upload-submit';
const photoUploadModal = 'edit-thumbnail-modal';
const subtopicReassignHeader = 'div.subtopic-reassign-header';
const subtopicTitleField = '.e2e-test-subtopic-title-field';
const subtopicUrlFragmentField =
  '.e2e-test-subtopic-url-fragment-field .e2e-test-url-fragment-field';
const richTextAreaField = 'div.e2e-test-rte';
const subtopicPhotoBoxButton =
  '.e2e-test-subtopic-thumbnail .e2e-test-photo-button';
const mobileSaveTopicButton =
  'div.navbar-mobile-options .e2e-test-mobile-save-topic-button';
const saveTopicButton = 'button.e2e-test-save-topic-button';
const subtopicCardHeader = '.subtopic-name-card-header';
const subtopicTitleSelector = '.e2e-test-subtopic';
const topicPreviewTab = '.e2e-test-topic-preview-button';
const contentTitle = '.content-title';
const htmlContent = '.html-content';
const editSubtopicExplanationSelector = '.e2e-test-edit-html-content';
const topicMobilePreviewTab = '.e2e-test-mobile-preview-tab';
const optionsSelector = '.e2e-test-show-subtopic-options';
const deleteSubtopicButtonSelector = '.e2e-test-delete-subtopic-button';
const topicEditorSaveModelSelector = 'oppia-topic-editor-save-modal';
const subtopicEditorContainerSelector = '.e2e-test-subtopic-editor-container';
const subtopicPreviewContainerSelector =
  '.e2e-test-subtopic-preview-container';
const subtopicExpandHeaderSelector = '.e2e-test-show-subtopics-list';
const mobileSubtopicContainerSelector = '.e2e-test-mobile-subtopic-content';
const saveSubtopicExplanationButtonSelector =
  '.e2e-test-save-subtopic-content-button';
const topicEditorContainerSelector = '.e2e-test-topic-editor-container';
const topicsTab = 'a.e2e-test-topics-tab';

const topicsAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;

export class TopicManager extends BaseUser {
  /**
   * Open the topic editor page for a topic.
   */
  async openTopicEditor(topicName: string): Promise<void> {
    const topicNameSelector = this.isViewportAtMobileWidth()
      ? mobileTopicSelector
      : desktopTopicSelector;
    await this.navigateToTopicAndSkillsDashboardPage();
    await this.clickOnElementWithSelector(topicsTab);
    await this.expectElementToBeVisible(topicNameSelector);

    await Promise.all([
      this.clickOnElementWithSelectorAndText(topicNameSelector, topicName),
      this.page.waitForNavigation(),
    ]);

    expect(this.page.url()).toContain('/topic_editor/');
  }

  /**
   * Saves topic draft.
   * @param {string} topicName - name of the topic to be saved.
   * @param {string} description - description of the topic to be saved.
   */
  async saveTopicDraft(topicName: string, description?: string): Promise<void> {
    await this.expectElementToBeVisible(modalDiv, false);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileSaveTopicButton);
      await this.expectElementToBeVisible(topicEditorSaveModelSelector);
      await this.typeInInputField(
        saveChangesMessageInput,
        'Test saving topic as curriculum admin.'
      );
      await this.expectElementToBeVisible(
        `${closeSaveModalButton}:not([disabled])`
      );
      await this.clickOnElementWithSelector(closeSaveModalButton);
      await this.expectElementToBeVisible(
        topicEditorSaveModelSelector,
        false
      );
    } else {
      await this.clickOnElementWithSelector(saveTopicButton);
      if (description) {
        await this.typeInInputField(saveChangesMessageInput, description);
        await this.expectElementValueToBe(saveChangesMessageInput, description);
      }
      await this.expectElementToBeVisible(
        `${closeSaveModalButton}:not([disabled])`
      );
      await this.waitForElementToStabilize(closeSaveModalButton);
      await this.clickOnElementWithSelector(closeSaveModalButton);
      await this.expectElementToBeVisible(modalDiv, false);
    }
  }

  /**
   * Opens the subtopic editor for a given subtopic and topic.
   * @param {string} subtopicName - The name of the subtopic to open.
   * @param {string} topicName - The name of the topic that contains the subtopic.
   */
  async openSubtopicEditor(
    subtopicName: string,
    topicName?: string
  ): Promise<void> {
    if (topicName) {
      await this.openTopicEditor(topicName);
    }

    // Expand subtopic list if it is not expanded.
    if (
      this.isViewportAtMobileWidth() &&
      !(await this.isElementVisible(mobileSubtopicContainerSelector))
    ) {
      await this.expectElementToBeVisible(subtopicExpandHeaderSelector);
      await this.clickOnElementWithSelector(subtopicExpandHeaderSelector);
    }

    try {
      await this.page.waitForSelector(subtopicCardHeader);
      const subtopicElements = await this.page.$$(subtopicCardHeader);
      for (let i = 0; i < subtopicElements.length; i++) {
        const element = subtopicElements[i];
        await this.page.waitForSelector(subtopicTitleSelector);
        const titleElement = await element.$(subtopicTitleSelector);
        if (titleElement) {
          const titleTextContent = await this.page.evaluate(
            el => el.textContent,
            titleElement
          );
          if (titleTextContent && titleTextContent.includes(subtopicName)) {
            await this.waitForElementToBeClickable(titleElement);
            await titleElement.click();
            break;
          }
        }
      }
    } catch (error) {
      const newError = new Error(`Failed to open subtopic editor: ${error}`);
      newError.stack = (error as Error).stack;
      throw newError;
    }

    await this.expectElementToBeVisible(subtopicEditorContainerSelector);
  }

  /**
   * Edits the details of a subtopic.
   *
   * @param {string} title - The new title of the subtopic.
   * @param {string} urlFragment - The new URL fragment of the subtopic.
   * @param {string} explanation - The new explanation of the subtopic.
   * @param {string} thumbnail - The path to the new thumbnail image for the subtopic.
   */
  async editSubTopicDetails(
    title: string,
    urlFragment: string,
    explanation: string,
    thumbnail?: string
  ): Promise<void> {
    await this.expectElementToBeVisible(subtopicTitleField);
    await this.clearAllTextFrom(subtopicTitleField);
    await this.typeInInputField(subtopicTitleField, title);
    if (urlFragment) {
      await this.page.waitForSelector(subtopicUrlFragmentField, {
        state: 'visible',
      });
      await this.clearAllTextFrom(subtopicUrlFragmentField);
      await this.page.type(subtopicUrlFragmentField, urlFragment);
    }

    await this.clickOnElementWithSelector(editSubtopicExplanationSelector);
    await this.page.waitForSelector(richTextAreaField, {state: 'visible'});
    await this.clearAllTextFrom(richTextAreaField);
    await this.typeInInputField(richTextAreaField, explanation);
    await this.clickOnElementWithSelector(
      saveSubtopicExplanationButtonSelector
    );

    // Update the thumbnail if it is provided.
    if (thumbnail) {
      await this.clickOnElementWithSelector(subtopicPhotoBoxButton);
      await this.page.waitForSelector(photoUploadModal, {state: 'visible'});
      await this.uploadFile(thumbnail);
      await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
      await this.clickOnElementWithSelector(uploadPhotoButton);
    }

    await this.expectElementToBeVisible(photoUploadModal, false);
  }

  /**
   * Deletes a subtopic from a topic.
   * @param {string} subtopicName - The name of the subtopic.
   * @param {string} topicName - The name of the topic.
   */
  async deleteSubtopicFromTopic(
    subtopicName: string,
    topicName: string
  ): Promise<void> {
    try {
      await this.openTopicEditor(topicName);
      await this.waitForStaticAssetsToLoad();

      if (this.isViewportAtMobileWidth()) {
        await this.clickOnElementWithSelector(subtopicReassignHeader);
      }

      await this.page.waitForSelector(subtopicCardHeader);
      const subtopics = await this.page.$$(subtopicCardHeader);

      for (const subtopic of subtopics) {
        const subtopicTitle = await subtopic.$eval(
          subtopicTitleSelector,
          el => el.textContent?.trim() || ''
        );

        if (subtopicTitle === subtopicName) {
          await subtopic.waitForSelector(optionsSelector);
          const optionsButton = await subtopic.$(optionsSelector);
          if (optionsButton) {
            await this.waitForElementToBeClickable(optionsButton);
            await optionsButton.click();
            await subtopic.waitForSelector(deleteSubtopicButtonSelector);
            const deleteButton = await subtopic.$(deleteSubtopicButtonSelector);
            if (deleteButton) {
              await this.waitForElementToBeClickable(deleteButton);
              await deleteButton.click();
              await this.expectElementToBeVisible(
                deleteSubtopicButtonSelector,
                false
              );
              showMessage(
                `Subtopic ${subtopicName} deleted from the topic ${topicName}.`
              );
              return;
            }
          }
        }
      }

      throw new Error(
        `Subtopic ${subtopicName} not found in topic ${topicName}.`
      );
    } catch (error) {
      const newError = new Error(
        `Failed to delete subtopic from topic: ${error}`
      );
      newError.stack = (error as Error).stack;
      throw newError;
    }
  }

  /**
   * Verifies the presence of a subtopic in a topic.
   * @param {string} subtopicName - The name of the subtopic.
   * @param {string} topicName - The name of the topic.
   * @param {boolean} shouldExist - Whether the subtopic should exist.
   */
  async verifySubtopicPresenceInTopic(
    subtopicName: string,
    topicName: string | null = null,
    shouldExist: boolean = true
  ): Promise<void> {
    // Navigate to topic editor if topic name is provided.
    if (topicName) {
      await this.openTopicEditor(topicName);
      await this.waitForStaticAssetsToLoad();

      if (this.isViewportAtMobileWidth()) {
        await this.clickOnElementWithSelector(subtopicReassignHeader);
      }
    }

    // Expand subtopic list if it is not expanded.
    if (
      this.isViewportAtMobileWidth() &&
      !(await this.isElementVisible(mobileSubtopicContainerSelector))
    ) {
      await this.expectElementToBeVisible(subtopicExpandHeaderSelector);
      await this.clickOnElementWithSelector(subtopicExpandHeaderSelector);
    }

    // Check if subtopic exists or not.
    await this.page.waitForFunction(
      ({selector, subtopicName, present}) => {
        const subtopicsElements = document.querySelectorAll(selector);
        const subtopics = Array.from(subtopicsElements).map(
          (el: Element) => el.textContent?.trim() || ''
        );
        return subtopics.includes(subtopicName) === present;
      },
      {
        selector: subtopicTitleSelector,
        subtopicName: subtopicName,
        present: shouldExist,
      },
      {timeout: 10000}
    );
  }

  /**
   * Navigates to the subtopic preview tab.
   */
  async navigateToSubtopicPreviewTab(
    subtopicName: string,
    topicName: string
  ): Promise<void> {
    await this.openSubtopicEditor(subtopicName, topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(topicMobilePreviewTab);
    } else {
      await this.page.waitForSelector(topicPreviewTab);
      await this.clickOnElementWithSelector(topicPreviewTab);
    }

    await this.expectElementToBeVisible(subtopicPreviewContainerSelector);
    showMessage('Navigated to Subtopic Preview Tab');
  }

  /**
   * Checks if the preview subtopic has the expected name and explanation.
   * @param {string} subtopicName - The expected name of the subtopic.
   * @param {string} explanation - The expected explanation of the subtopic.
   */
  async expectSubtopicPreviewToHave(
    subtopicName: string,
    explanation: string
  ): Promise<void> {
    await this.page.waitForSelector(contentTitle);
    const previewSubtopicName = await this.page.$eval(
      contentTitle,
      el => el.textContent
    );
    if (previewSubtopicName !== subtopicName) {
      throw new Error(
        `Expected subtopic name to be "${subtopicName}", but it was "${previewSubtopicName}"`
      );
    }

    await this.page.waitForSelector(htmlContent);
    const isExplanationPresent = await this.isTextPresentOnPage(explanation);
    if (!isExplanationPresent) {
      throw new Error(
        `Expected explanation "${explanation}" to be present on the page, but it was not`
      );
    }
  }
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
    await this.navigateToTopicsAndSkillsDashboardPage();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(displayMobileFiltersButton);
    }
    await this.expectElementToBeVisible(topicStatusDropdownSelector);
    await this.selectMatOptionUsingSelector(
      topicStatusDropdownSelector,
      status
    );

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
    await this.navigateToTopicsAndSkillsDashboardPage();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(displayMobileFiltersButton);
    }
    await this.expectElementToBeVisible(sortDropdownSelector);
    await this.selectMatOptionUsingSelector(
      sortDropdownSelector,
      sortOption,
      false
    );

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
    await this.navigateToTopicsAndSkillsDashboardPage();
    await this.navigateToSkillsTab();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(displayMobileFiltersButton);
    }
    await this.expectElementToBeVisible(skillStatusDropdownSelector);
    await this.selectMatOptionUsingSelector(
      skillStatusDropdownSelector,
      status
    );

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
   * Expects the filtered skills to match the provided list (doesn't check exclusively).
   * @param expectedSkills {string[]} List of skills that should be checked for.
   * @param visible {Boolean} If skills should be visible or hidden.
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

    await expect
      .poll(
        async () => {
          const foundSkills = (await skillElements.allTextContents())
            .map(text => text.trim())
            .filter(Boolean);

          for (const skill of expectedSkills) {
            if (visible) {
              expect(foundSkills).toContain(skill);
            } else {
              expect(foundSkills).not.toContain(skill);
            }
          }

          return true;
        },
        {timeout: 5000}
      )
      .toBe(true);

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
   * Navigate to the topic and skills dashboard page.
   */
  async navigateToTopicAndSkillsDashboardPage(): Promise<void> {
    await this.waitForNetworkIdle();
    await this.goto(topicsAndSkillsDashboardUrl);
  }

  /**
   * Sorts skills by a given option.
   * @param {string} currentSort Current sort method used to find select element
   * @param {string} newSort New sort method to choose.
   */
  async changeSkillSort(currentSort: string, newSort: string): Promise<void> {
    await this.navigateToTopicAndSkillsDashboardPage();
    await this.navigateToSkillsTab();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(displayMobileFiltersButton);
    }

    await this.changeMatSelectOption(currentSort, newSort);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(closeMobileFiltersButton);
    }
    showMessage(`Sorted skills by "${newSort}"`);
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
    const questionTextElement = this.page
      .locator(questionTextSelector, {
        hasText: question,
      })
      .first();
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
