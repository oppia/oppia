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
import {ElementHandle} from 'puppeteer';

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
const skillTab = '.e2e-test-skills-tab';

const skillEditBox = '.e2e-test-skill-edit-box';
const mobileSkillsOption = '.e2e-test-mobile-skills-option';
const unassignSkillButtonDesktop = `.e2e-test-unassign-skill-button`;
const unassignSkillButtonMobile = `.e2e-test-mobile-unassign-skill-button`;
const confirmSkillButton = '.e2e-test-confirm-skill-button';
const unassignTopicLabel = '.e2e-test-unassign-topic-label';
const unassignTopicCheckbox = '.e2e-test-unassign-topic';
const topicNameSpan = '.topic-name';

const skillItemSelector = '.e2e-test-skill-item';
const skillDescriptionSelector = '.e2e-test-skill-description';
const questionTab = '.e2e-test-question-tab';
const toastMessageSelector = '.e2e-test-toast-message';

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
   * Navigate to the skill tab.
   */
  async navigateToSkillTab(): Promise<void> {
    await this.page.waitForSelector(skillTab);
    await this.clickOn(skillTab);
  }

  /**
   * Unassign a skill from a topic.
   * @param {string} skillName - The name of the skill to unassign.
   * @param {string} topicName - The name of the topic from which to unassign the skill.
   */
  async unassignSkillFromTopic(
    skillName: string,
    topicName: string
  ): Promise<void> {
    const isMobileWidth = this.isViewportAtMobileWidth();
    const unassignSkillSelector = isMobileWidth
      ? unassignSkillButtonMobile
      : unassignSkillButtonDesktop;
    const skillOptions = isMobileWidth ? mobileSkillsOption : skillEditBox;

    await this.navigateToTopicAndSkillsDashboardPage();
    await this.navigateToSkillTab();

    const skillItem = await this.selectSkill(skillName);
    await skillItem.click();

    await this.page.waitForSelector(skillOptions);
    await this.clickOn(skillOptions);

    await this.page.waitForSelector(unassignSkillSelector);
    await this.clickOn(unassignSkillSelector);

    // Select the topic to unassign from.
    const topicLabels = await this.page.$$(unassignTopicLabel);
    for (const topicLabel of topicLabels) {
      const labelTopicName = await topicLabel.$eval(
        topicNameSpan,
        el => el.textContent
      );
      if (labelTopicName === topicName) {
        const checkbox = await topicLabel.$(unassignTopicCheckbox);
        if (checkbox) {
          await checkbox.click();
        }
        break;
      }
    }

    await this.page.waitForSelector(confirmSkillButton);
    await this.clickOn(confirmSkillButton);
  }

  /**
   * Select a skill from the list of skills.
   * @param {string} skillName - The name of the skill to select.
   */
  async selectSkill(skillName: string): Promise<ElementHandle> {
    const skillItems = await this.page.$$(skillItemSelector);
    for (const skillItem of skillItems) {
      const description = await skillItem.$eval(
        skillDescriptionSelector,
        el => el.textContent
      );
      if (description === skillName) {
        return skillItem;
      }
    }

    throw new Error(`Skill with name ${skillName} not found.`);
  }

  /**
   * Navigate to the question editor tab.
   */
  async navigateToQuestionEditorTab(): Promise<void> {
    await this.page.waitForSelector(questionTab);
    await this.clickOn(questionTab);
  }

  /**
   * Create questions for a skill.
   * @param {string} skillName - The name of the skill for which to create questions.
   */
  async expectToastMeassageToBe(expectedMessage: string): Promise<void> {
    await this.page.waitForSelector(toastMessageSelector, {visible: true});
    const actualMessage = await this.page.$eval(
      toastMessageSelector,
      el => el.textContent
    );
    expect(actualMessage).toEqual(expectedMessage);
  }
}

export let TopicManagerFactory = (): TopicManager => new TopicManager();
