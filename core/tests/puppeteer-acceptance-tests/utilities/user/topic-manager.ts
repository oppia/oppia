// Copyright 2024 The Oppia Authors. All Rights Reserved.
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

import puppeteer from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';
import {showMessage} from '../common/show-message';
import testConstants from '../common/test-constants';

const curriculumAdminThumbnailImage =
  testConstants.data.curriculumAdminThumbnailImage;
const topicAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;

const modalDiv = 'div.modal-content';
const closeSaveModalButton = '.e2e-test-close-save-modal-button';

const chapterPhotoBoxButton =
  '.e2e-test-chapter-input-thumbnail .e2e-test-photo-button';

const topicsTab = 'a.e2e-test-topics-tab';
const desktopTopicSelector = 'a.e2e-test-topic-name';

const saveChangesMessageInput = 'textarea.e2e-test-commit-message-input';

const saveStoryButton = 'button.e2e-test-save-story-button';

const addChapterButton = 'button.e2e-test-add-chapter-button';
const chapterTitleField = 'input.e2e-test-new-chapter-title-field';
const chapterExplorationIdField = 'input.e2e-test-chapter-exploration-input';
const createChapterButton = 'button.e2e-test-confirm-chapter-creation-button';

const mobileOptionsSelector = '.e2e-test-mobile-options-base';
const mobileTopicSelector = 'div.e2e-test-mobile-topic-name a';

const mobileSaveStoryChangesButton =
  'div.navbar-mobile-options .e2e-test-mobile-save-changes';
const mobileAddChapterDropdown = '.e2e-test-mobile-add-chapter';

const subtopicReassignHeader = 'div.subtopic-reassign-header';
const addSubtopicButton = 'button.e2e-test-add-subtopic-button';
const subtopicTitleField = 'input.e2e-test-new-subtopic-title-field';
const subtopicUrlFragmentField =
  'input.e2e-test-new-subtopic-url-fragment-field';
const subtopicDescriptionEditorToggle = 'div.e2e-test-show-schema-editor';
const richTextAreaField = 'div.e2e-test-rte';
const subtopicPhotoBoxButton =
  '.e2e-test-subtopic-thumbnail .e2e-test-photo-button';
const photoUploadModal = 'edit-thumbnail-modal';
const uploadPhotoButton = 'button.e2e-test-photo-upload-submit';
const createSubtopicButton = '.e2e-test-confirm-subtopic-creation-button';

const mobileSaveTopicButton =
  'div.navbar-mobile-options .e2e-test-mobile-save-topic-button';
const saveTopicButton = 'button.e2e-test-save-topic-button';
const mobileStoryDropdown = '.e2e-test-story-dropdown';

const addStoryButton = 'button.e2e-test-create-story-button';
const storyTitleField = 'input.e2e-test-new-story-title-field';
const storyDescriptionField = 'textarea.e2e-test-new-story-description-field';
const storyUrlFragmentField = 'input.e2e-test-new-story-url-fragment-field';
const createStoryButton = 'button.e2e-test-confirm-story-creation-button';
const storyPhotoBoxButton =
  'oppia-create-new-story-modal .e2e-test-photo-button';
const storyMetaTagInput = '.e2e-test-story-meta-tag-content-field';
export class TopicManager extends BaseUser {
  /**
   * Navigate to the topic and skills dashboard page.
   */
  async navigateToTopicAndSkillsDashboardPage(): Promise<void> {
    await this.page.bringToFront();
    await this.page.waitForNetworkIdle();
    await this.goto(topicAndSkillsDashboardUrl);
  }

  /**
   * Open the topic editor page for a topic.
   */
  async openTopicEditor(topicName: string): Promise<void> {
    const topicNameSelector = this.isViewportAtMobileWidth()
      ? mobileTopicSelector
      : desktopTopicSelector;
    await this.navigateToTopicAndSkillsDashboardPage();
    await this.clickOn(topicsTab);
    await this.page.waitForSelector(topicNameSelector, {visible: true});

    await Promise.all([
      this.page.evaluate(
        (topicNameSelector, topicName) => {
          const topicDivs = Array.from(
            document.querySelectorAll(topicNameSelector)
          );
          const topicDivToSelect = topicDivs.find(
            element => element?.textContent.trim() === topicName
          ) as HTMLElement;
          if (topicDivToSelect) {
            topicDivToSelect.click();
          } else {
            throw new Error('Cannot open topic editor page.');
          }
        },
        topicNameSelector,
        topicName
      ),
      this.page.waitForNavigation(),
    ]);
  }

  /**
   * Save a story curriculum admin.
   */
  async saveStoryDraft(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileOptionsSelector);
      await this.clickOn(mobileSaveStoryChangesButton);
    } else {
      await this.clickOn(saveStoryButton);
    }
    await this.type(
      saveChangesMessageInput,
      'Test saving story as curriculum admin.'
    );
    await this.page.waitForSelector(`${closeSaveModalButton}:not([disabled])`);
    await this.clickOn(closeSaveModalButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});
  }

  /**
   * Create a subtopic as a topic manager
   */
  async createSubtopicForTopic(
    title: string,
    urlFragment: string,
    topicName: string
  ): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(subtopicReassignHeader);
    }
    await this.clickOn(addSubtopicButton);
    await this.type(subtopicTitleField, title);
    await this.type(subtopicUrlFragmentField, urlFragment);

    await this.clickOn(subtopicDescriptionEditorToggle);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.type(
      richTextAreaField,
      `Subtopic creation description text for ${title}`
    );

    await this.clickOn(subtopicPhotoBoxButton);
    await this.page.waitForSelector(photoUploadModal, {visible: true});
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {hidden: true});
    await this.clickOn(createSubtopicButton);
    await this.saveTopicDraft(topicName);
  }

  /**
   * Save a topic as a curriculum admin.
   */
  async saveTopicDraft(topicName: string): Promise<void> {
    await this.page.waitForSelector(modalDiv, {hidden: true});
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileOptionsSelector);
      await this.clickOn(mobileSaveTopicButton);
      await this.page.waitForSelector('oppia-topic-editor-save-modal', {
        visible: true,
      });
      await this.type(
        saveChangesMessageInput,
        'Test saving topic as curriculum admin.'
      );
      await this.page.waitForSelector(
        `${closeSaveModalButton}:not([disabled])`
      );
      await this.clickOn(closeSaveModalButton);
      await this.page.waitForSelector('oppia-topic-editor-save-modal', {
        hidden: true,
      });
      await this.openTopicEditor(topicName);
    } else {
      await this.clickOn(saveTopicButton);
      await this.page.waitForSelector(modalDiv, {visible: true});
      await this.clickOn(closeSaveModalButton);
      await this.page.waitForSelector(modalDiv, {hidden: true});
    }
  }

  async verifySubtopicPresenceInTopic(
    topicName: string,
    subtopicName: string,
    isPresent: boolean
  ): Promise<void> {
    await this.openTopicEditor(topicName);

    const subtopicElements = await this.page.$$('.e2e-test-subtopic');
    const subtopicNames = await Promise.all(
      subtopicElements.map(element =>
        this.page.evaluate(el => el.textContent, element)
      )
    );

    const isSubtopicPresent = subtopicNames.includes(subtopicName);

    if (isPresent && !isSubtopicPresent) {
      throw new Error(
        `Expected subtopic '${subtopicName}' to be present in topic '${topicName}', but it was not found.`
      );
    }

    if (!isPresent && isSubtopicPresent) {
      throw new Error(
        `Expected subtopic '${subtopicName}' to be absent in topic '${topicName}', but it was found.`
      );
    }
  }

  /**
   * Add a story with a chapter to a certain topic.
   */
  async addStoryWithChapterToTopic(
    topicName: string,
    storyTitle: string,
    explorationId: string,
    chapterTitle: string
  ): Promise<void> {
    const storyUrlFragment = storyTitle.replace(/\s+/g, '-').toLowerCase();

    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileStoryDropdown);
    }
    await this.clickOn(addStoryButton);
    await this.type(storyTitleField, storyTitle);
    await this.type(storyUrlFragmentField, storyUrlFragment);
    await this.type(
      storyDescriptionField,
      `Story creation description for ${storyTitle}.`
    );

    await this.clickOn(storyPhotoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {hidden: true});
    await this.clickOn(createStoryButton);

    await this.page.waitForSelector(storyMetaTagInput);
    await this.page.focus(storyMetaTagInput);
    await this.page.type(storyMetaTagInput, 'meta');
    await this.page.keyboard.press('Tab');

    await this.createChapter(explorationId, chapterTitle);
    await this.saveStoryDraft();
  }

  /**
   * Create a chapter for a certain story.
   */
  async createChapter(
    explorationId: string,
    chapterTitle: string
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileAddChapterDropdown);
    }
    await this.clickOn(addChapterButton);
    await this.type(chapterTitleField, chapterTitle);
    await this.type(chapterExplorationIdField, explorationId);

    await this.clickOn(chapterPhotoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {hidden: true});
    await this.clickOn(createChapterButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});
  }

  async verifyChapterPresenceInStory(
    storyTitle: string,
    chapterTitle: string,
    isPresent: boolean
  ): Promise<void> {
    await this.openTopicEditor(storyTitle);
    await this.clickOn(storyTitle);

    const chapterElements = await this.page.$$('.e2e-test-chapter-title');
    const chapterTitles = await Promise.all(
      chapterElements.map(element =>
        this.page.evaluate(el => el.textContent, element)
      )
    );

    const isChapterPresent = chapterTitles.includes(chapterTitle);

    if (isPresent && !isChapterPresent) {
      throw new Error(
        `Expected chapter '${chapterTitle}' to be present in story '${storyTitle}', but it was not found.`
      );
    }

    if (!isPresent && isChapterPresent) {
      throw new Error(
        `Expected chapter '${chapterTitle}' to be absent in story '${storyTitle}', but it was found.`
      );
    }
    showMessage('Chapter is present in the story');
  }

  async verifyStoryPresenceInTopic(
    topicName: string,
    storyTitle: string,
    isPresent: boolean
  ): Promise<void> {
    await this.openTopicEditor(topicName);

    const storyElements = await this.page.$$('.e2e-test-story-title');
    const storyTitles = await Promise.all(
      storyElements.map(element =>
        this.page.evaluate(el => el.textContent, element)
      )
    );

    const isStoryPresent = storyTitles.includes(storyTitle);

    if (isPresent && !isStoryPresent) {
      throw new Error(
        `Expected story '${storyTitle}' to be present in topic '${topicName}', but it was not found.`
      );
    }

    if (!isPresent && isStoryPresent) {
      throw new Error(
        `Expected story '${storyTitle}' to be absent in topic '${topicName}', but it was found.`
      );
    }
    showMessage('Story is present in the topic');
  }

  async deleteChapterFromStory(storyName: string, chapterTitle: string) {
    await this.openTopicEditor(storyName);
    await this.clickOn(storyName);

    const chapterElements = await this.page.$$('.e2e-test-chapter-title');
    let chapterElement: puppeteer.ElementHandle<Element> | null = null;
    for (const element of chapterElements) {
      const title = await this.page.evaluate(el => el.textContent, element);
      if (title === chapterTitle) {
        chapterElement = element;
        break;
      }
    }

    if (!chapterElement) {
      throw new Error(`Chapter with title ${chapterTitle} not found.`);
    }

    const editOptionsButton = await chapterElement.$('.e2e-test-edit-options');
    if (!editOptionsButton) {
      throw new Error('Edit options button not found.');
    }

    await editOptionsButton.click();
    await this.page.waitForSelector('.chapter-option-box', {visible: true});
    await this.clickOn('.chapter-option-box');

    await this.page.waitForSelector('.e2e-test-confirm-delete-chapter-button', {
      visible: true,
    });
    await this.clickOn('.e2e-test-confirm-delete-chapter-button');
    await this.page.waitForSelector('.e2e-test-chapter-title', {hidden: true});
  }

  async deleteStoryFromTopic(topicName: string, storyTitle: string) {
    await this.openTopicEditor(topicName);
    const storyElements = await this.page.$$('.e2e-test-story-list-item');

    let storyElement: puppeteer.ElementHandle<Element> | null = null;

    for (const element of storyElements) {
      const titleElement = await element.$('.e2e-test-story-title');
      if (!titleElement) {
        continue;
      }
      const title = await this.page.evaluate(
        el => el.textContent,
        titleElement
      );
      if (title === storyTitle) {
        storyElement = element;
        break;
      }
    }

    if (!storyElement) {
      throw new Error(`Story with title ${storyTitle} not found.`);
    }

    const deleteButton = await storyElement.$('.e2e-test-delete-story-button');
    if (!deleteButton) {
      throw new Error('Delete button not found.');
    }

    await deleteButton.click();

    const confirmDeleteButton = await this.page.$(
      '.e2e-test-confirm-story-deletion-button'
    );
    if (!confirmDeleteButton) {
      throw new Error('Confirm delete button not found.');
    }

    await confirmDeleteButton.click();
  }

  async deleteSubtopicFromTopic(topicName: string, subtopicName: string) {
    await this.openTopicEditor(topicName);
    const subtopicElements = await this.page.$$('.subtopic-name-header');

    let subtopicElement: puppeteer.ElementHandle<Element> | null = null;

    for (const element of subtopicElements) {
      const titleElement = await element.$('.e2e-test-subtopic');
      if (!titleElement) {
        continue;
      }
      const title = await this.page.evaluate(
        el => el.textContent,
        titleElement
      );
      if (title === subtopicName) {
        subtopicElement = element;
        break;
      }
    }

    if (!subtopicElement) {
      throw new Error(`Subtopic with title ${subtopicName} not found.`);
    }

    const showOptionsButton = await subtopicElement.$(
      '.e2e-test-show-subtopic-options'
    );
    if (!showOptionsButton) {
      throw new Error('Show options button not found.');
    }

    await showOptionsButton.click();

    const deleteButton = await this.page.$('.e2e-test-delete-subtopic-button');
    if (!deleteButton) {
      throw new Error('Delete button not found.');
    }

    await deleteButton.click();
  }

  /**
   * Filters topics by status.
   * @param {string} status - The status to filter by.
   */
  async filterTopicsByStatus(status: string): Promise<void> {
    await this.selectOption('.e2e-test-select-status-dropdown', status);
  }

  /**
   * Filters topics by classroom.
   * @param {string} classroom - The classroom to filter by.
   */
  async filterTopicsByClassroom(classroom: string): Promise<void> {
    await this.selectOption('.e2e-test-select-classroom-dropdown', classroom);
  }

  /**
   * Filters topics by keyword.
   * @param {string} keyword - The keyword to filter by.
   */
  async filterTopicsByKeyword(keyword: string): Promise<void> {
    await this.selectOption('.e2e-test-select-keyword-dropdown', keyword);
  }

  /**
   * Sorts topics by a given option.
   * @param {string} sortOption - The option to sort by.
   */
  async sortTopics(sortOption: string): Promise<void> {
    await this.selectOption('.e2e-test-select-sort-dropdown', sortOption);
  }

  /**
   * Selects an option from a dropdown.
   * @param {string} selector - The CSS selector for the dropdown.
   * @param {string} optionText - The text of the option to select.
   */
  private async selectOption(
    selector: string,
    optionText: string
  ): Promise<void> {
    await this.clickOn(selector);
    await this.page.waitForSelector('.mat-option-text');
    await this.clickOn(`.mat-option-text:contains(${optionText})`);
  }

  /**
   * Checks if the filtered topics match the expected topics.
   * @param {string[]} expectedTopics - The expected topics.
   */
  async expectFilteredTopics(expectedTopics: string[]): Promise<void> {
    const topicElements = await this.page.$$('.e2e-test-topic-name');
    const topicNames = await Promise.all(
      topicElements.map(element =>
        this.page.evaluate(el => el.textContent, element)
      )
    );

    const missingTopics = expectedTopics.filter(
      topic => !topicNames.includes(topic)
    );

    if (missingTopics.length > 0) {
      throw new Error(
        `Expected topics ${missingTopics.join(', ')} to be present, but they were not found.`
      );
    }

    showMessage('Filtered topics match the expected topics.');
  }

  /**
   * Checks if the topics are in the expected order.
   * @param {string[]} expectedOrder - The expected order of topics.
   */
  async expectTopicsInOrder(expectedOrder: string[]): Promise<void> {
    const topicElements = await this.page.$$('.e2e-test-topic-name');
    const topicNames = await Promise.all(
      topicElements.map(element =>
        this.page.evaluate(el => el.textContent, element)
      )
    );

    if (!topicNames.every((name, index) => name === expectedOrder[index])) {
      throw new Error('Topics are not in the expected order.');
    }

    showMessage('Topics are in the expected order.');
  }

  /**
   * Adjusts the paginator to show a certain number of items per page.
   * @param {number} itemsPerPage - The number of items to show per page.
   */
  async adjustPaginatorToShowItemsPerPage(itemsPerPage: number): Promise<void> {
    await this.selectOption(
      '.e2e-test-select-items-per-page-dropdown',
      itemsPerPage.toString()
    );
    showMessage(`Paginator adjusted to show ${itemsPerPage} items per page.`);
  }

  async checkIfPageChangesAfterClickingNext(
    shouldChange: boolean
  ): Promise<void> {
    const initialTopic = await this.page.$eval(
      '.e2e-test-topic-name',
      topic => topic.textContent
    );
    await this.clickOn('.e2e-test-next-page-button');
    const finalTopic = await this.page.$eval(
      '.e2e-test-topic-name',
      topic => topic.textContent
    );

    if (shouldChange && initialTopic === finalTopic) {
      throw new Error(
        'Expected the page to change when clicking the next page button, but it did not.'
      );
    } else if (!shouldChange && initialTopic !== finalTopic) {
      throw new Error(
        'Expected the page not to change when clicking the next page button, but it did.'
      );
    }
    showMessage(
      'Page changes as expected after clicking the next page button.'
    );
  }

  /**
   * Filters skills by status.
   * @param {string} status - The status to filter by.
   */
  async filterSkillsByStatus(status: string): Promise<void> {
    await this.clickOn('.e2e-test-select-skill-status-dropdown');
    await this.clickOn(`option[value="${status}"]`);
  }

  /**
   * Filters skills by classroom.
   * @param {string} classroom - The classroom to filter by.
   */
  async filterSkillsByClassroom(classroom: string): Promise<void> {
    await this.clickOn('.e2e-test-select-classroom-dropdown');
    await this.clickOn(`option[value="${classroom}"]`);
  }

  /**
   * Filters skills by keyword.
   * @param {string} keyword - The keyword to filter by.
   */
  async filterSkillsByKeyword(keyword: string): Promise<void> {
    await this.clickOn('.e2e-test-select-keyword-dropdown');
    await this.page.type('.e2e-test-select-keyword-dropdown', keyword);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Sorts skills by a given option.
   * @param {string} sortOption - The option to sort by.
   */
  async sortSkills(sortOption: string): Promise<void> {
    await this.clickOn('.e2e-test-select-sort-dropdown');
    await this.clickOn(`option[value="${sortOption}"]`);
  }

  /**
   * Expects the filtered skills to match the provided list.
   * @param {string[]} expectedSkills - The expected list of skills.
   * @returns {Promise<void>}
   */
  async expectFilteredSkills(expectedSkills: string[]): Promise<void> {
    const skillElements = await this.page.$$('.e2e-test-skill-description');
    const skillDescriptions = await Promise.all(
      skillElements.map(element =>
        this.page.evaluate(el => el.textContent, element)
      )
    );

    const missingSkills = expectedSkills.filter(
      skill => !skillDescriptions.includes(skill)
    );

    if (missingSkills.length > 0) {
      throw new Error(
        `Expected skills ${missingSkills.join(', ')} to be present, but they were not found.`
      );
    }

    showMessage('Filtered skills match the expected skills.');
  }

  /**
   * Expects the skills to be in a certain order.
   * @param {string[]} expectedOrder - The expected order of skills.
   */
  async expectSkillsInOrder(expectedOrder: string[]): Promise<void> {
    const skillElements = await this.page.$$('.e2e-test-skill-description');
    const skillDescriptions = await Promise.all(
      skillElements.map(element =>
        this.page.evaluate(el => el.textContent, element)
      )
    );

    if (
      !skillDescriptions.every((name, index) => name === expectedOrder[index])
    ) {
      throw new Error('Skills are not in the expected order.');
    }

    showMessage('Skills are in the expected order.');
  }

  async checkIfSkillPageChangesAfterClickingNext(
    shouldChange: boolean
  ): Promise<void> {
    const initialSkill = await this.page.$eval(
      '.e2e-test-skill-description',
      skill => skill.textContent
    );
    await this.clickOn('.e2e-test-next-page-button');
    const finalSkill = await this.page.$eval(
      '.e2e-test-skill-description',
      skill => skill.textContent
    );
    if (shouldChange && initialSkill === finalSkill) {
      throw new Error(
        'Expected the page to change when clicking the next page button, but it did not.'
      );
    } else if (!shouldChange && initialSkill !== finalSkill) {
      throw new Error(
        'Expected the page not to change when clicking the next page button, but it did.'
      );
    }
  }
}

export let TopicManagerFactory = (): TopicManager => new TopicManager();
