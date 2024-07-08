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
import {showMessage} from '../common/show-message';
import testConstants from '../common/test-constants';
import {ElementHandle} from 'puppeteer';

const curriculumAdminThumbnailImage =
  testConstants.data.curriculumAdminThumbnailImage;
const topicAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;

const modalDiv = 'div.modal-content';
const closeSaveModalButton = '.e2e-test-close-save-modal-button';
const saveChangesMessageInput = 'textarea.e2e-test-commit-message-input';

// Photo Upload Modal.
const storyPhotoBoxButton =
  'oppia-create-new-story-modal .e2e-test-photo-button';
const chapterPhotoBoxButton =
  '.e2e-test-chapter-input-thumbnail .e2e-test-photo-button';
const uploadPhotoButton = 'button.e2e-test-photo-upload-submit';
const photoUploadModal = 'edit-thumbnail-modal';

// Topic and Skills Dashboard Page.
const topicsTab = 'a.e2e-test-topics-tab';
const desktopTopicSelector = 'a.e2e-test-topic-name';
const mobileOptionsSelector = '.e2e-test-mobile-options-base';
const mobileTopicSelector = 'div.e2e-test-mobile-topic-name a';
const skillTab = '.e2e-test-skills-tab';
const skillEditBox = '.e2e-test-skill-edit-box';
const mobileSkillsOption = '.e2e-test-mobile-skills-option';
const unassignSkillButtonDesktop = '.e2e-test-unassign-skill-button';
const unassignSkillButtonMobile = '.e2e-test-mobile-unassign-skill-button';
const confirmUnassignSkillButton = '.e2e-test-confirm-unassign-skill-button';
const unassignTopicLabel = '.e2e-test-unassign-topic-label';
const unassignTopicCheckbox = '.e2e-test-unassign-topic';
const topicNameSpan = '.topic-name';
const desktopSkillItemSelector = '.e2e-test-skill-item';
const mobileSkillItemSelector = '.e2e-test-mobile-skill-item';
const desktopSkillDescriptionSelector = '.e2e-test-skill-description';
const mobileSkillDescriptionSelector = '.e2e-test-mobile-skill-name';
const assignSkillButtonDesktop = '.e2e-test-assign-skill-to-topic-button';
const assignSkillButtonMobile = '.e2e-test-mobile-assign-skill-to-topic-button';
const topicNameSelector = '.e2e-test-topic-name-in-topic-select-modal';
const confirmMoveButton = '.e2e-test-confirm-move-button';
const mergeSkillsButtonMobile = '.e2e-test-mobile-merge-skills-button';
const mergeSkillsButtonDesktop = '.e2e-test-merge-skills-button';

// Story Creation Modal.
const addStoryButton = 'button.e2e-test-create-story-button';
const storyTitleField = 'input.e2e-test-new-story-title-field';
const storyDescriptionField = 'textarea.e2e-test-new-story-description-field';
const storyUrlFragmentField = 'input.e2e-test-new-story-url-fragment-field';
const createStoryButton = 'button.e2e-test-confirm-story-creation-button';
const saveStoryButton = 'button.e2e-test-save-story-button';
const publishStoryButton = 'button.e2e-test-publish-story-button';
const storyMetaTagInput = '.e2e-test-story-meta-tag-content-field';
const unpublishStoryButton = 'button.e2e-test-unpublish-story-button';
const mobileStoryDropdown = '.e2e-test-story-dropdown';
const mobileSaveStoryChangesDropdown =
  'div.navbar-mobile-options .e2e-test-mobile-changes-dropdown';
const mobileSaveStoryChangesButton =
  'div.navbar-mobile-options .e2e-test-mobile-save-changes';
const mobilePublishStoryButton =
  'div.navbar-mobile-options .e2e-test-mobile-publish-button';

// Chapter Creation Modal.
const addChapterButton = 'button.e2e-test-add-chapter-button';
const chapterTitleField = 'input.e2e-test-new-chapter-title-field';
const chapterExplorationIdField = 'input.e2e-test-chapter-exploration-input';
const createChapterButton = 'button.e2e-test-confirm-chapter-creation-button';
const mobileAddChapterDropdown = '.e2e-test-mobile-add-chapter';

// Question Editor.
const desktopSkillQuestionTab = '.e2e-test-questions-tab';
const toastMessageSelector = '.e2e-test-toast-message';
const editQuestionButtons = '.e2e-test-edit-question-button';
const linkOffIcon = '.link-off-icon';
const removeQuestionConfirmationButton =
  '.e2e-test-remove-question-confirmation-button';
const questionPreviewTab = '.e2e-test-question-preview-tab';
const questionTextInput = '.e2e-test-question-text-input';
const questionContentSelector = '.e2e-test-conversation-content';
const numericInputInteractionField = '.e2e-test-conversation-input';
const skillNameInputSelector = '.e2e-test-skill-name-input';
const radioInnerCircleSelector = '.mat-radio-inner-circle';
const confirmSkillSelectionButtonSelector =
  '.e2e-test-confirm-skill-selection-button';
const questionTextSelector = '.e2e-test-question-text';

const navigationDropdown = '.e2e-test-mobile-skill-nav-dropdown-icon';
const mobilePreviewTab = '.e2e-test-mobile-preview-tab';
const mobileSkillQuestionTab = '.e2e-test-mobile-questions-tab';

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
   * Navigate to the question editor tab.
   */
  async navigateToQuestionEditorTab(): Promise<void> {
    const isMobileWidth = this.isViewportAtMobileWidth();
    const skillQuestionTab = isMobileWidth
      ? mobileSkillQuestionTab
      : desktopSkillQuestionTab;

    if (isMobileWidth) {
      const currentUrl = new URL(this.page.url());
      const hashParts = currentUrl.hash.split('/');

      if (hashParts.length > 1) {
        hashParts[1] = 'questions';
      } else {
        hashParts.push('questions');
      }
      currentUrl.hash = hashParts.join('/');
      await this.goto(currentUrl.toString());
      await this.page.reload({waitUntil: 'networkidle0'});
    } else {
      await this.clickAndWaitForNavigation(skillQuestionTab);
    }
  }

  /**
   * Function to navigate to the question preview tab.
   */
  async navigateToQuestionPreviewTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileOptionsSelector);

      await this.page.waitForSelector(navigationDropdown);
      const navDropdownElements = await this.page.$$(navigationDropdown);
      await this.waitForElementToBeClickable(navDropdownElements[1]);
      await navDropdownElements[1].click();

      await this.page.waitForSelector(mobilePreviewTab);
      await this.clickOn(mobilePreviewTab);
    } else {
      await this.page.waitForSelector(questionPreviewTab);
      await this.clickAndWaitForNavigation(questionPreviewTab);
    }
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

  /**   * Create a chapter for a certain story.
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
    if (!skillItem) {
      throw new Error(`Skill "${skillName}" not found`);
    }

    await skillItem.waitForSelector(skillOptions);
    const skillOptionsElement = await skillItem.$(skillOptions);
    if (!skillOptionsElement) {
      throw new Error(
        `Skill options element not found for skill "${skillName}"`
      );
    }
    await this.waitForElementToBeClickable(skillOptionsElement);
    await skillOptionsElement.click();

    await this.page.waitForSelector(unassignSkillSelector);
    const unassignSkillSelectorElement = await this.page.$(
      unassignSkillSelector
    );
    if (!unassignSkillSelectorElement) {
      throw new Error('Unassign skill selector not found');
    }
    await this.waitForElementToBeClickable(unassignSkillSelectorElement);
    await unassignSkillSelectorElement.click();

    // Select the topic to unassign from.
    await this.page.waitForSelector(unassignTopicLabel);
    const topicLabels = await this.page.$$(unassignTopicLabel);
    let topicFound = false;
    for (const topicLabel of topicLabels) {
      const labelTopicName = await topicLabel.$eval(
        topicNameSpan,
        el => el.textContent
      );
      if (labelTopicName === topicName) {
        const checkbox = await topicLabel.$(unassignTopicCheckbox);
        if (!checkbox) {
          throw new Error(`Checkbox not found for topic "${topicName}"`);
        }
        await checkbox.click();
        topicFound = true;
        break;
      }
    }
    if (!topicFound) {
      throw new Error(`Topic "${topicName}" not found`);
    }

    await this.page.waitForSelector(confirmUnassignSkillButton);
    const confirmSkillButtonElement = await this.page.$(
      confirmUnassignSkillButton
    );
    if (!confirmSkillButtonElement) {
      throw new Error('Confirm skill button not found');
    }
    await this.clickOn(confirmUnassignSkillButton);
  }

  /**
   * Select a skill from the list of skills.
   * @param {string} skillName - The name of the skill to select.
   */
  async selectSkill(skillName: string): Promise<ElementHandle> {
    const isMobileWidth = this.isViewportAtMobileWidth();
    const skillItemSelector = isMobileWidth
      ? mobileSkillItemSelector
      : desktopSkillItemSelector;
    const skillDescriptionSelector = isMobileWidth
      ? mobileSkillDescriptionSelector
      : desktopSkillDescriptionSelector;

    await this.page.waitForSelector(skillItemSelector);
    const skillItems = await this.page.$$(skillItemSelector);

    if (!skillItems || skillItems.length === 0) {
      throw new Error('No skill items found');
    }

    for (const skillItem of skillItems) {
      await skillItem.waitForSelector(skillDescriptionSelector);
      const descriptionElement = await skillItem.$(skillDescriptionSelector);
      if (!descriptionElement) {
        throw new Error(
          `Skill description element not found for skill "${skillName}"`
        );
      }

      const description = await this.page.evaluate(
        el => el.textContent,
        descriptionElement
      );

      if (description.trim() === skillName) {
        showMessage(`Found skill with name ${skillName}`);
        return skillItem;
      }
    }

    throw new Error(`Skill with name ${skillName} not found.`);
  }

  /**
   * Create questions for a skill.
   * @param {string} skillName - The name of the skill for which to create questions.
   */
  async expectToastMessageToBe(expectedMessage: string): Promise<void> {
    try {
      await this.page.waitForFunction(
        (selector: string, expectedText: string) => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() === expectedText.trim();
        },
        {timeout: 5000},
        toastMessageSelector,
        expectedMessage
      );
    } catch (error) {
      const actualMessage = await this.page.$eval(toastMessageSelector, el =>
        el.textContent?.trim()
      );

      throw new Error(
        `Text did not match within the specified time. Actual message: "${actualMessage}", expected message: "${expectedMessage}"`
      );
    }
  }

  /**
   * Assign a skill to a topic.
   *
   * @param {string} topicName - The name of the topic to assign the skill to.
   * @param {string} skillName - The name of the skill to assign.
   */
  async assignSkillToTopic(
    skillName: string,
    topicName: string
  ): Promise<void> {
    const isMobileWidth = this.isViewportAtMobileWidth();
    const skillOptions = isMobileWidth ? mobileSkillsOption : skillEditBox;
    const assignSkillButton = isMobileWidth
      ? assignSkillButtonMobile
      : assignSkillButtonDesktop;

    await this.navigateToTopicAndSkillsDashboardPage();
    await this.navigateToSkillTab();

    const skillItem = await this.selectSkill(skillName);
    if (!skillItem) {
      throw new Error(`Skill "${skillName}" not found`);
    }

    const skillOptionsElement = await skillItem.$(skillOptions);
    if (!skillOptionsElement) {
      throw new Error(
        `Skill options element not found for skill "${skillName}"`
      );
    }
    await this.waitForElementToBeClickable(skillOptionsElement);
    await skillOptionsElement.click();

    await this.page.waitForSelector(assignSkillButton);
    const assignSkillButtonElement = await this.page.$(assignSkillButton);
    if (!assignSkillButtonElement) {
      throw new Error('Assign skill button not found');
    }
    await this.page.evaluate(el => el.click(), assignSkillButtonElement);

    await this.page.waitForSelector(topicNameSelector);
    const topicNames = await this.page.$$(topicNameSelector);
    let topicFound = false;
    for (const topic of topicNames) {
      const name = await topic.evaluate(el => el.textContent);
      if (name === topicName) {
        await topic.click();
        topicFound = true;
        break;
      }
    }
    if (!topicFound) {
      throw new Error(`Topic "${topicName}" not found`);
    }

    await this.page.waitForSelector(confirmMoveButton);
    const confirmMoveButtonElement = await this.page.$(confirmMoveButton);
    if (!confirmMoveButtonElement) {
      throw new Error('Confirm move button not found');
    }
    await this.clickOn(confirmMoveButton);
  }

  /**
   * Function to merge two skills with the given names.
   * @param {string} skillName1 - The name of the first skill to merge.
   * @param {string} skillName2 - The name of the second skill to merge.
   */

  async mergeSkills(skillName1: string, skillName2: string): Promise<void> {
    const isMobileWidth = this.isViewportAtMobileWidth();
    const skillOptions = isMobileWidth ? mobileSkillsOption : skillEditBox;
    const mergeSkillsButton = isMobileWidth
      ? mergeSkillsButtonMobile
      : mergeSkillsButtonDesktop;

    await this.navigateToTopicAndSkillsDashboardPage();
    await this.navigateToSkillTab();

    const skillItem1 = await this.selectSkill(skillName1);
    if (!skillItem1) {
      throw new Error(`Skill "${skillName1}" not found`);
    }

    await this.page.waitForSelector(skillOptions);
    const skillOptionsElement1 = await skillItem1.$(skillOptions);
    if (!skillOptionsElement1) {
      throw new Error(
        `Skill options element not found for skill "${skillName1}"`
      );
    }
    await this.waitForElementToBeClickable(skillOptionsElement1);
    await skillOptionsElement1.click();

    await this.page.waitForSelector(mergeSkillsButton);
    const mergeSkillsButtonElement = await this.page.$(mergeSkillsButton);
    if (!mergeSkillsButtonElement) {
      throw new Error('Merge skills button not found');
    }
    await this.waitForElementToBeClickable(mergeSkillsButtonElement);
    await mergeSkillsButtonElement.click();

    await this.page.waitForSelector(skillNameInputSelector);
    const skillNameInputSelectorElement = await this.page.$(
      skillNameInputSelector
    );
    if (!skillNameInputSelectorElement) {
      throw new Error('Skill name input selector not found');
    }
    // Searching by skill name.
    await this.waitForElementToBeClickable(skillNameInputSelector);
    await this.type(skillNameInputSelector, skillName2);

    await this.page.waitForSelector(radioInnerCircleSelector);
    const radioInnerCircleSelectorElement = await this.page.$(
      radioInnerCircleSelector
    );
    if (!radioInnerCircleSelectorElement) {
      throw new Error('Radio inner circle selector not found');
    }
    await this.page.evaluate(selector => {
      document.querySelector(selector).click();
    }, radioInnerCircleSelector);

    await this.page.waitForSelector(confirmSkillSelectionButtonSelector);
    const confirmSkillSelectionButtonSelectorElement = await this.page.$(
      confirmSkillSelectionButtonSelector
    );
    if (!confirmSkillSelectionButtonSelectorElement) {
      throw new Error('Confirm skill selection button selector not found');
    }
    await this.clickOn(confirmSkillSelectionButtonSelector);
  }

  /**
   * Function to delete a question with the given text.
   * @param {string} questionText - The text of the question to delete.
   */
  async deleteQuestion(questionText: string): Promise<void> {
    try {
      await this.page.waitForSelector(editQuestionButtons);
      const buttons = await this.page.$$(editQuestionButtons);
      if (!editQuestionButtons) {
        throw new Error('Edit question buttons not found');
      }

      for (const button of buttons) {
        await button.waitForSelector(questionTextSelector);
        const text = await button.$eval(
          questionTextSelector,
          el => el.textContent
        );
        if (text !== questionText) {
          continue;
        }

        await button.waitForSelector(linkOffIcon);
        const deleteButton = await button.$(linkOffIcon);
        if (!deleteButton) {
          throw new Error(
            `Link off icon not found for question "${questionText}"`
          );
        }

        await this.waitForElementToBeClickable(deleteButton);
        await deleteButton.click();

        await this.page.waitForSelector(removeQuestionConfirmationButton);
        const removeQuestionConfirmationButtonElement = await this.page.$(
          removeQuestionConfirmationButton
        );
        if (!removeQuestionConfirmationButtonElement) {
          throw new Error('Remove question confirmation button not found');
        }

        await this.waitForElementToBeClickable(
          removeQuestionConfirmationButtonElement
        );
        await removeQuestionConfirmationButtonElement.click();
        return;
      }

      throw new Error(`Question "${questionText}" not found`);
    } catch (error) {
      console.error(`Error deleting question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Function to preview a question.
   * @param {string} questionText - The text of the question to preview.
   */
  async previewQuestion(questionText: string): Promise<void> {
    try {
      await this.waitForElementToBeClickable(questionTextInput);
      await this.type(questionTextInput, questionText);
      await this.page.keyboard.press('Enter');
    } catch (error) {
      console.error(`Error previewing question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Function to expect the preview question text.
   * @param {string} expectedText - The expected question text.
   */
  async expectPreviewQuestionText(expectedText: string): Promise<void> {
    try {
      await this.page.waitForSelector(questionContentSelector);
      const questionContentElement = await this.page.$(questionContentSelector);

      if (!questionContentElement) {
        throw new Error('Question content element not found');
      }

      const questionText = await this.page.evaluate(
        element => element.textContent,
        questionContentElement
      );

      if (questionText !== expectedText) {
        throw new Error(
          `Expected question text to be "${expectedText}", but it was "${questionText}"`
        );
      }
    } catch (error) {
      console.error(`Error in expectPreviewQuestionText: ${error.message}`);
      throw error;
    }
  }

  /**
   * Function to expect the preview interaction type.
   * @param {string} expectedType - The expected interaction type.
   */
  async expectPreviewInteractionType(expectedType: string): Promise<void> {
    try {
      let selector: string;

      // Add cases for different interaction types here.
      // For each case, set the selector to the corresponding element for that interaction type.
      switch (expectedType) {
        case 'Numeric Input':
          selector = numericInputInteractionField;
          break;
        // Add more cases as needed.
        default:
          throw new Error(`Unsupported interaction type: ${expectedType}`);
      }

      await this.page.waitForSelector(selector);
      const element = await this.page.$(selector);
      if (!element) {
        throw new Error(
          `Expected to find element for interaction type "${expectedType}", but it was not found`
        );
      }
    } catch (error) {
      console.error(`Error in expectPreviewInteractionType: ${error.message}`);
      throw error;
    }
  }
}

export let TopicManagerFactory = (): TopicManager => new TopicManager();
