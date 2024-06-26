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

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';

const curriculumAdminThumbnailImage =
  testConstants.data.curriculumAdminThumbnailImage;
const topicAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;

const modalDiv = 'div.modal-content';
const closeSaveModalButton = '.e2e-test-close-save-modal-button';

const storyPhotoBoxButton =
  'oppia-create-new-story-modal .e2e-test-photo-button';
const chapterPhotoBoxButton =
  '.e2e-test-chapter-input-thumbnail .e2e-test-photo-button';
const uploadPhotoButton = 'button.e2e-test-photo-upload-submit';
const photoUploadModal = 'edit-thumbnail-modal';

const topicsTab = 'a.e2e-test-topics-tab';
const desktopTopicSelector = 'a.e2e-test-topic-name';

const saveChangesMessageInput = 'textarea.e2e-test-commit-message-input';

const addStoryButton = 'button.e2e-test-create-story-button';
const storyTitleField = 'input.e2e-test-new-story-title-field';
const storyDescriptionField = 'textarea.e2e-test-new-story-description-field';
const storyUrlFragmentField = 'input.e2e-test-new-story-url-fragment-field';
const createStoryButton = 'button.e2e-test-confirm-story-creation-button';
const saveStoryButton = 'button.e2e-test-save-story-button';
const publishStoryButton = 'button.e2e-test-publish-story-button';
const storyMetaTagInput = '.e2e-test-story-meta-tag-content-field';
const unpublishStoryButton = 'button.e2e-test-unpublish-story-button';

const addChapterButton = 'button.e2e-test-add-chapter-button';
const chapterTitleField = 'input.e2e-test-new-chapter-title-field';
const chapterExplorationIdField = 'input.e2e-test-chapter-exploration-input';
const createChapterButton = 'button.e2e-test-confirm-chapter-creation-button';

const mobileOptionsSelector = '.e2e-test-mobile-options-base';
const mobileTopicSelector = 'div.e2e-test-mobile-topic-name a';

const mobileStoryDropdown = '.e2e-test-story-dropdown';
const mobileSaveStoryChangesDropdown =
  'div.navbar-mobile-options .e2e-test-mobile-changes-dropdown';
const mobileSaveStoryChangesButton =
  'div.navbar-mobile-options .e2e-test-mobile-save-changes';
const mobilePublishStoryButton =
  'div.navbar-mobile-options .e2e-test-mobile-publish-button';
const mobileAddChapterDropdown = '.e2e-test-mobile-add-chapter';

const skillsTab = 'a.e2e-test-skills-tab';
const desktopSkillSelector = '.e2e-test-skill-description';
const mobileSkillSelector = 'span.e2e-test-mobile-skill-name';

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
   * Create a story, execute chapter creation for
   * the story, and then publish the story.
   */
  async createAndPublishStoryWithChapter(
    storyTitle: string,
    storyUrlFragment: string,
    explorationId: string,
    topicName: string
  ): Promise<void> {
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

    await this.createChapter(explorationId);
    await this.saveStoryDraft();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileSaveStoryChangesDropdown);
      await this.page.waitForSelector(mobilePublishStoryButton);
      await this.clickOn(mobilePublishStoryButton);
    } else {
      await this.page.waitForSelector(`${publishStoryButton}:not([disabled])`);
      await this.clickOn(publishStoryButton);
      await this.page.waitForSelector(unpublishStoryButton, {visible: true});
    }
  }

  /**
   * Create a chapter for a certain story.
   */
  async createChapter(explorationId: string): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileAddChapterDropdown);
    }
    await this.clickOn(addChapterButton);
    await this.type(chapterTitleField, 'Test Chapter 1');
    await this.type(chapterExplorationIdField, explorationId);

    await this.clickOn(chapterPhotoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {hidden: true});
    await this.clickOn(createChapterButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});
  }

  /**
   * Save a story as a curriculum admin.
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
   * Open the skill editor page for a skill.
   */
  async openSkillEditor(skillName: string): Promise<void> {
    const skillSelector = this.isViewportAtMobileWidth()
      ? mobileSkillSelector
      : desktopSkillSelector;
    await this.page.bringToFront();
    await this.navigateToTopicAndSkillsDashboardPage();
    await this.clickOn(skillsTab);
    await this.page.waitForSelector(skillSelector, {visible: true});

    await Promise.all([
      this.page.evaluate(
        (skillSelector, skillName) => {
          const skillDivs = Array.from(
            document.querySelectorAll(skillSelector)
          );
          const skillDivToSelect = skillDivs.find(
            element => element?.textContent.trim() === skillName
          ) as HTMLElement;
          if (skillDivToSelect) {
            skillDivToSelect.click();
          } else {
            throw new Error('Cannot open skill editor page.');
          }
        },
        skillSelector,
        skillName
      ),
      this.page.waitForNavigation(),
    ]);
  }

  /**
   * Adds a worked example to the topic.
   * @param {string} exampleQuestion - The question part of the worked example.
   * @param {string} exampleExplanation - The explanation part of the worked example.
   */
  async addWorkedExample(
    exampleQuestion: string,
    exampleExplanation: string
  ): Promise<void> {
    const exampleQuestionSelector = '.e2e-test-rte';
    const exampleExplanationSelector = '.e2e-test-rte';
    const saveButtonSelector = '.e2e-test-save-worked-example-button';
    const addWorkedExampleButton = '.e2e-test-add-worked-example';

    await this.clickOn(addWorkedExampleButton);
    await this.type(exampleQuestionSelector, exampleQuestion);
    await this.type(exampleExplanationSelector, exampleExplanation);
    await this.clickOn(saveButtonSelector);
  }

  /**
   * Deletes a worked example from the topic.
   * @param {string} exampleQuestion - The question part of the worked example to delete.
   */
  async deleteWorkedExample(exampleQuestion: string): Promise<void> {
    const workedExampleSelector =
      '.oppia-skill-concept-card-preview-list .e2e-test-worked-example-title';
    const deleteButtonSelector =
      '.oppia-skill-concept-card-preview-list .e2e-test-delete-example-button';

    const workedExamples = await this.page.$$(workedExampleSelector);

    for (const workedExample of workedExamples) {
      const title = await this.page.evaluate(
        el => el.textContent,
        workedExample
      );
      if (title.trim() === exampleQuestion) {
        const deleteButton = await workedExample.$(deleteButtonSelector);
        if (deleteButton) {
          await deleteButton.click();
        }
        break;
      }
    }
  }

  /**
   * Adds a misconception to the topic.
   * @param {string} misconceptionName - The name of the misconception to add.
   * @param {string} notes - The notes for question creators to understand how handling this misconception is useful for the skill being tested.
   * @param {string} feedback - The feedback for the misconception to add.
   */
  async addMisconception(
    misconceptionName: string,
    notes: string,
    feedback: string
  ): Promise<void> {
    const addButtonSelector = '.e2e-test-add-misconception-modal-button';
    const nameFieldSelector = '.e2e-test-misconception-name-field';
    const notesFieldSelector = '.e2e-test-rte';
    const feedbackFieldSelector = '.e2e-test-rte';
    const saveButtonSelector = '.e2e-test-confirm-add-misconception-button';

    await this.clickOn(addButtonSelector);
    await this.type(nameFieldSelector, misconceptionName);
    await this.type(notesFieldSelector, notes);
    await this.type(feedbackFieldSelector, feedback);
    await this.clickOn(saveButtonSelector);
  }

  /**
   * Deletes a misconception from the topic.
   * @param {string} misconceptionName - The name of the misconception to delete.
   */
  async deleteMisconception(misconceptionName: string): Promise<void> {}
}

export let TopicManagerFactory = (): TopicManager => new TopicManager();
