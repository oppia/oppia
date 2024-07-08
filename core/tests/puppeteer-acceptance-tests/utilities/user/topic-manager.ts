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
import puppeteer from 'puppeteer';

const curriculumAdminThumbnailImage =
  testConstants.data.curriculumAdminThumbnailImage;
const topicAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;

const modalDiv = 'div.modal-content';
const closeSaveModalButton = '.e2e-test-close-save-modal-button';
const saveChangesMessageInput = 'textarea.e2e-test-commit-message-input';

// Photo Upload Modal.
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
const skillsTab = 'a.e2e-test-skills-tab';

// Story Creation Modal.
const saveStoryButton = 'button.e2e-test-save-story-button';
const mobileSaveStoryChangesButton =
  'div.navbar-mobile-options .e2e-test-mobile-save-changes';

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

const subtopicReassignHeader = 'div.subtopic-reassign-header';
const addSubtopicButton = 'button.e2e-test-add-subtopic-button';
const subtopicTitleField = 'input.e2e-test-new-subtopic-title-field';
const subtopicUrlFragmentField =
  'input.e2e-test-new-subtopic-url-fragment-field';
const subtopicDescriptionEditorToggle = 'div.e2e-test-show-schema-editor';
const richTextAreaField = 'div.e2e-test-rte';
const subtopicPhotoBoxButton =
  '.e2e-test-subtopic-thumbnail .e2e-test-photo-button';
const createSubtopicButton = '.e2e-test-confirm-subtopic-creation-button';

const mobileSaveTopicButton =
  'div.navbar-mobile-options .e2e-test-mobile-save-topic-button';
const saveTopicButton = 'button.e2e-test-save-topic-button';

const topicStatusDropdownSelector = '.e2e-test-select-topic-status-dropdown';
const classroomDropdownSelector = '.e2e-test-select-classroom-dropdown';
const keywordDropdownSelector = '.e2e-test-select-keyword-dropdown';
const multiSelectionInputSelector = '.e2e-test-multi-selection-input';
const sortDropdownSelector = '.e2e-test-select-sort-dropdown';
const displayMobileFiltersButton = '.e2e-test-mobile-toggle-filter';
const closeMobileFiltersButton = '.e2e-test-mobile-filter-close';
const skillStatusDropdownSelector = '.e2e-test-select-skill-status-dropdown';
const topicNextPageMobileButton = '.e2e-test-mobile-topics-next-page-button';
const topicNextPageDesktopButton = '.e2e-test-topics-next-page-button';
const skillsNextPageMobileButton = '.e2e-test-mobile-skills-next-page-button';
const skillsNextPageDesktopButton = '.e2e-test-skills-next-page-button';
const mobileSkillSelector = 'span.e2e-test-mobile-skill-name';
const desktopSkillSelector = '.e2e-test-skill-description';
const itemsPerPageDropdown = '.e2e-test-select-items-per-page-dropdown';
const filterOptionSelector = '.mat-option-text';
const topicNameField = '.e2e-test-topic-name-field';
const errorPageHeadingSelector = '.e2e-test-error-page-heading';
const createNewTopicMobileButton = '.e2e-test-create-topic-mobile-button';
const createNewTopicButton = '.e2e-test-create-topic-button';
const createNewSkillMobileButton =
  '.e2e-test-mobile-create-skill-button-secondary';
const createNewSkillButton = '.e2e-test-create-skill-button-circle';
const desktopTopicListItemSelector = '.list-item';
const mobileTopicListItemSelector = '.topic-item';
const desktopTopicListItemOptions = '.e2e-test-topic-edit-box';
const mobileTopicListItemOptions = '.e2e-test-mobile-topic-edit-box';
const desktopDeleteTopicButton = '.e2e-test-delete-topic-button';
const mobileDeleteTopicButton = '.e2e-test-mobile-delete-topic-button';
const desktopSkillListItemSelector = '.list-item';
const mobileSkillListItemSelector = '.skill-item';
const desktopSkillListItemOptions = '.e2e-test-skill-edit-box';
const desktopDeleteSkillButton = '.e2e-test-delete-skill-button';
const mobileSkillListItemOptions = '.e2e-test-mobile-skills-option';
const mobileDeleteSkillButton = '.e2e-test-mobile-delete-skill-button';

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
   * Function to open the story editor page.
   * @param {string} storyID - The Id of the story to open.
   */
  async openStoryEditor(storyID: string): Promise<void> {
    await this.goto(`http://localhost:8181/story_editor/${storyID}`);
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
   * Function to navigate to classroom admin page.
   */
  async navigateToClassroomAdminPage(): Promise<void> {
    await this.goto(testConstants.URLs.ClassroomAdmin);
  }

  /**
   * Function to navigate the skills tab in topics and skills dashboard.
   */
  async navigateToSkillsTab(): Promise<void> {
    const skillSelector = this.isViewportAtMobileWidth()
      ? mobileSkillSelector
      : desktopSkillSelector;
    await this.page.waitForSelector(skillsTab, {visible: true});
    await this.clickOn(skillsTab);
    await this.page.waitForSelector(skillSelector, {visible: true});
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

  /**   * Create a chapter for a certain story.
   */
  async createChapter(
    explorationId: string,
    chapterName: string
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileAddChapterDropdown);
    }
    await this.clickOn(addChapterButton);
    await this.type(chapterTitleField, chapterName);
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

  /**
   * Filters topics by status.
   * @param {string} status - The status to filter by.
   */
  async filterTopicsByStatus(status: string): Promise<void> {
    try {
      await this.navigateToTopicAndSkillsDashboardPage();
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(topicStatusDropdownSelector);
      await this.selectOption(topicStatusDropdownSelector, status);
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(closeMobileFiltersButton);
      }
      showMessage(`Filtered topics by status: ${status}`);
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Filters skills by status.
   * @param {string} status - The status to filter by.
   */
  async filterSkillsByStatus(status: string): Promise<void> {
    try {
      await this.navigateToTopicAndSkillsDashboardPage();
      await this.navigateToSkillTab();
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(skillStatusDropdownSelector);
      await this.selectOption(skillStatusDropdownSelector, status);
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(closeMobileFiltersButton);
      }
      showMessage(`Filtered skill by status: ${status}`);
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Filters topics by classroom.
   * @param {string} classroom - The classroom to filter by.
   */
  async filterTopicsByClassroom(classroom: string): Promise<void> {
    try {
      await this.navigateToTopicAndSkillsDashboardPage();
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(classroomDropdownSelector);
      await this.selectOption(classroomDropdownSelector, classroom);
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(closeMobileFiltersButton);
      }
      showMessage(`Filtered topics by classroom: ${classroom}`);
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Filters topics by keyword.
   * @param {string} keyword - The keyword to filter by.
   */
  async filterTopicsByKeyword(keyword: string): Promise<void> {
    try {
      await this.navigateToTopicAndSkillsDashboardPage();
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(keywordDropdownSelector);
      await this.clickOn(keywordDropdownSelector);
      await this.page.waitForSelector(multiSelectionInputSelector);
      await this.type(multiSelectionInputSelector, keyword);
      await this.page.keyboard.press('Enter');
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(closeMobileFiltersButton);
      }
      showMessage(`Filtered topics by keyword: ${keyword}`);
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Sorts topics by a given option.
   * @param {string} sortOption - The option to sort by.
   */
  async sortTopics(sortOption: string): Promise<void> {
    try {
      await this.navigateToTopicAndSkillsDashboardPage();
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(sortDropdownSelector);
      await this.selectOption(sortDropdownSelector, sortOption);
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(closeMobileFiltersButton);
      }
      showMessage(`Sorted topics by: ${sortOption}`);
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Filters skills by keyword.
   * @param {string} keyword - The keyword to filter by.
   */
  async filterSkillsByKeyword(keyword: string): Promise<void> {
    try {
      await this.navigateToTopicAndSkillsDashboardPage();
      await this.navigateToSkillTab();
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(keywordDropdownSelector);
      await this.clickOn(keywordDropdownSelector);
      await this.page.waitForSelector(multiSelectionInputSelector);
      await this.type(multiSelectionInputSelector, keyword);
      await this.page.keyboard.press('Enter');
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(closeMobileFiltersButton);
      }
      showMessage(`Filtered skills by keyword: ${keyword}`);
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Sorts skills by a given option.
   * @param {string} sortOption - The option to sort by.
   */
  async sortSkills(sortOption: string): Promise<void> {
    try {
      await this.navigateToTopicAndSkillsDashboardPage();
      await this.navigateToSkillTab();
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(sortDropdownSelector);
      await this.selectOption(sortDropdownSelector, sortOption);
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(closeMobileFiltersButton);
      }
      showMessage(`Sorted skills by: ${sortOption}`);
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
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
    await this.page.waitForSelector(filterOptionSelector);

    const optionElements = await this.page.$$(filterOptionSelector);

    for (const optionElement of optionElements) {
      const text = await this.page.evaluate(
        el => el.textContent.trim(),
        optionElement
      );

      if (text === optionText) {
        await this.waitForElementToBeClickable(optionElement);
        await optionElement.click();
        break;
      }
    }
  }

  /**
   * Checks if the filtered topics match the expected topics.
   * @param {string[]} expectedTopics - The expected topics.
   */
  async expectFilteredTopics(expectedTopics: string[]): Promise<void> {
    const isMobileViewport = this.isViewportAtMobileWidth();
    const topicNameSelector = isMobileViewport
      ? mobileTopicSelector
      : desktopTopicSelector;
    try {
      await this.waitForPageToFullyLoad();
      const topicElements = await this.page.$$(topicNameSelector);

      if (expectedTopics.length === 0) {
        if (topicElements.length !== 0) {
          throw new Error('Expected no topics, but some were found.');
        }
        showMessage('No topics found, as expected.');
        return;
      }

      if (!topicElements || topicElements.length === 0) {
        throw new Error(`No elements found for selector ${topicNameSelector}`);
      }

      const topicNames = await Promise.all(
        topicElements.map(element =>
          this.page.evaluate(el => el.textContent.trim(), element)
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
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Checks if the topics are in the expected order.
   * @param {string[]} expectedOrder - The expected order of topics.
   */
  async expectTopicsInOrder(expectedOrder: string[]): Promise<void> {
    const isMobileViewport = this.isViewportAtMobileWidth();
    const topicNameSelector = isMobileViewport
      ? mobileTopicSelector
      : desktopTopicSelector;

    try {
      await this.waitForPageToFullyLoad();
      await this.page.waitForSelector(topicNameSelector);
      const topicElements = await this.page.$$(topicNameSelector);
      const topicNames = await Promise.all(
        topicElements.map(element =>
          this.page.evaluate(el => el.textContent.trim(), element)
        )
      );
      if (!topicNames.every((name, index) => name === expectedOrder[index])) {
        throw new Error('Topics are not in the expected order.');
      }
      showMessage('Topics are in the expected order.');
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Adjusts the paginator to show a certain number of items per page.
   * @param {number} itemsPerPage - The number of items to show per page.
   */
  async adjustPaginatorToShowItemsPerPage(itemsPerPage: number): Promise<void> {
    try {
      await this.page.waitForSelector(itemsPerPageDropdown);
      await this.select(itemsPerPageDropdown, itemsPerPage.toString());
      showMessage(`Paginator adjusted to show ${itemsPerPage} items per page.`);
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Checks if the page changes after clicking the next button.
   * @param shouldChange - A boolean indicating whether the page should change.
   */
  async checkIfTopicPageChangesAfterClickingNext(
    shouldChange: boolean
  ): Promise<void> {
    const isMobileViewport = this.isViewportAtMobileWidth();
    const topicNameSelector = isMobileViewport
      ? mobileTopicSelector
      : desktopTopicSelector;
    const nextPageButtonSelector = isMobileViewport
      ? topicNextPageMobileButton
      : topicNextPageDesktopButton;
    try {
      await this.page.waitForSelector(topicNameSelector);
      const initialTopic = await this.page.$eval(
        topicNameSelector,
        topic => topic.textContent
      );

      await this.page.waitForSelector(nextPageButtonSelector);
      await this.clickOn(nextPageButtonSelector);

      await this.page.waitForSelector(topicNameSelector);
      const finalTopic = await this.page.$eval(
        topicNameSelector,
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
        'Page change status after clicking the next button is as expected.'
      );
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Expects the filtered skills to match the provided list.
   * @param {string[]} expectedSkills - The expected list of skills.
   * @returns {Promise<void>}
   */
  async expectFilteredSkills(expectedSkills: string[]): Promise<void> {
    const isMobileViewport = this.isViewportAtMobileWidth();
    const skillNameSelector = isMobileViewport
      ? mobileSkillSelector
      : desktopSkillSelector;
    try {
      await this.waitForPageToFullyLoad();
      const topicElements = await this.page.$$(skillNameSelector);

      if (expectedSkills.length === 0) {
        if (topicElements.length !== 0) {
          throw new Error('Expected no skills, but some were found.');
        }
        showMessage('No skills found, as expected.');
        return;
      }

      if (!topicElements || topicElements.length === 0) {
        throw new Error(`No elements found for selector ${skillNameSelector}`);
      }

      const topicNames = await Promise.all(
        topicElements.map(element =>
          this.page.evaluate(el => el.textContent.trim(), element)
        )
      );

      const missingTopics = expectedSkills.filter(
        topic => !topicNames.includes(topic)
      );

      if (missingTopics.length > 0) {
        throw new Error(
          `Expected skill ${missingTopics.join(', ')} to be present, but they were not found.`
        );
      }

      showMessage('Filtered skills match the expected skills.');
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Expects the skills to be in a certain order.
   * @param {string[]} expectedOrder - The expected order of skills.
   */
  async expectSkillsInOrder(expectedOrder: string[]): Promise<void> {
    const isMobileViewport = this.isViewportAtMobileWidth();
    const skillNameSelector = isMobileViewport
      ? mobileSkillSelector
      : desktopSkillSelector;

    try {
      await this.waitForPageToFullyLoad();
      await this.page.waitForSelector(skillNameSelector);
      const topicElements = await this.page.$$(skillNameSelector);
      const topicNames = await Promise.all(
        topicElements.map(element =>
          this.page.evaluate(el => el.textContent.trim(), element)
        )
      );
      if (!topicNames.every((name, index) => name === expectedOrder[index])) {
        throw new Error('Skills are not in the expected order.');
      }
      showMessage('Skills are in the expected order.');
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Checks if the page changes after clicking the next button.
   * @param shouldChange - A boolean indicating whether the page should change.
   */
  async checkIfSkillPageChangesAfterClickingNext(
    shouldChange: boolean
  ): Promise<void> {
    const isMobileViewport = this.isViewportAtMobileWidth();
    const skillNameSelector = isMobileViewport
      ? mobileSkillSelector
      : desktopSkillSelector;
    const nextPageButtonSelector = isMobileViewport
      ? skillsNextPageMobileButton
      : skillsNextPageDesktopButton;
    try {
      await this.page.waitForSelector(skillNameSelector);
      const initialTopic = await this.page.$eval(
        skillNameSelector,
        topic => topic.textContent
      );

      await this.page.waitForSelector(nextPageButtonSelector);
      await this.clickOn(nextPageButtonSelector);

      await this.page.waitForSelector(skillNameSelector);
      const finalTopic = await this.page.$eval(
        skillNameSelector,
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
        'Page change status after clicking the next button is as expected.'
      );
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * This function checks if the topic name field is disabled.
   */
  async expectTopicNameFieldDisabled(): Promise<void> {
    try {
      await this.page.waitForSelector(topicNameField);
      const topicNameFieldElement = await this.page.$(topicNameField);
      const isDisabled = await this.page.evaluate(
        el => el.disabled,
        topicNameFieldElement
      );

      if (!isDisabled) {
        throw new Error(
          'Expected topic name field to be disabled, but it is not.'
        );
      }

      showMessage('Verified: Topic name field is disabled as expected.');
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * This function checks if the error page heading is "Error 401".
   */
  async expectError401Unauthorized(): Promise<void> {
    try {
      await this.page.waitForSelector(errorPageHeadingSelector);
      const errorPageHeadingElement = await this.page.$(
        errorPageHeadingSelector
      );
      const errorPageHeadingText = await this.page.evaluate(
        element => element.textContent,
        errorPageHeadingElement
      );
      const trimmedErrorPageHeadingText = errorPageHeadingText.trim();

      if (trimmedErrorPageHeadingText !== 'Error 401') {
        throw new Error(
          `Expected error page heading to be "Error 401", but got "${trimmedErrorPageHeadingText}"`
        );
      }

      showMessage('Verified: Error 401 Unauthorized is displayed as expected.');
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * This function checks if "Create Topic" button is present or not.
   */
  async expectCreateTopicButtonNotPresent(): Promise<void> {
    const isMobileViewport = this.isViewportAtMobileWidth();
    const createTopicButton = isMobileViewport
      ? createNewTopicMobileButton
      : createNewTopicButton;
    try {
      await this.page.waitForSelector(createTopicButton, {timeout: 5000});
      throw new Error('Create topic button is present, which is not expected.');
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        showMessage('Create topic button is not present as expected.');
      } else {
        throw error;
      }
    }
  }

  /**
   * This function checks if "Create Skill" button is not present.
   */
  async expectCreateSkillButtonNotPresent(): Promise<void> {
    const isMobileViewport = this.isViewportAtMobileWidth();
    const createSkillButton = isMobileViewport
      ? createNewSkillMobileButton
      : createNewSkillButton;
    try {
      await this.page.waitForSelector(createSkillButton, {timeout: 5000});
      throw new Error('Create skill button is present, which is not expected.');
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        showMessage('Create skill button is not present as expected.');
      } else {
        throw error;
      }
    }
  }

  /**
   * This function verifies the absence of the delete topic button for a given topic.
   * @param {string} topicName - The name of the topic to check.
   */
  async verifyAbsenceOfDeleteTopicButtonInTopic(
    topicName: string
  ): Promise<void> {
    await this.goto(topicAndSkillsDashboardUrl);

    const isMobileWidth = this.isViewportAtMobileWidth();
    const topicListItemSelector = isMobileWidth
      ? mobileTopicListItemSelector
      : desktopTopicListItemSelector;
    const topicSelector = isMobileWidth
      ? mobileTopicSelector
      : desktopTopicSelector;
    const topicListItemOptions = isMobileWidth
      ? mobileTopicListItemOptions
      : desktopTopicListItemOptions;
    const deleteTopicButton = isMobileWidth
      ? mobileDeleteTopicButton
      : desktopDeleteTopicButton;

    await this.page.waitForSelector(topicListItemSelector);

    const topics = await this.page.$$(topicListItemSelector);
    for (let topic of topics) {
      const topicNameElement = await topic.$(topicSelector);
      if (topicNameElement) {
        const name: string = await (
          await topicNameElement.getProperty('textContent')
        ).jsonValue();

        if (name.trim() === topicName) {
          await this.page.waitForSelector(topicListItemOptions);
          const editBox = await topic.$(topicListItemOptions);
          if (editBox) {
            await this.waitForElementToBeClickable(editBox);
            await editBox.click();
          } else {
            throw new Error('Edit button not found');
          }

          const deleteButton = await topic.$(deleteTopicButton);
          if (deleteButton) {
            throw new Error('Delete button is available');
          }
        }
      }
    }
    showMessage('Delete button is not available in the topic');
  }

  /**
   * This function verifies the absence of the delete skill button for a given skill.
   * @param {string} skillName - The name of the skill to check.
   */
  async verifyAbsenceOfDeleteSkillButtonInSkill(
    skillName: string
  ): Promise<void> {
    await this.goto(topicAndSkillsDashboardUrl);

    const isMobileWidth = this.isViewportAtMobileWidth();
    const skillSelector = isMobileWidth
      ? mobileSkillSelector
      : desktopSkillSelector;
    const skillListItemSelector = isMobileWidth
      ? mobileSkillListItemSelector
      : desktopSkillListItemSelector;
    const skillListItemOptions = isMobileWidth
      ? mobileSkillListItemOptions
      : desktopSkillListItemOptions;
    const deleteSkillButton = isMobileWidth
      ? mobileDeleteSkillButton
      : desktopDeleteSkillButton;

    await this.page.waitForSelector(skillsTab, {visible: true});
    await this.navigateToSkillTab();
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(skillListItemSelector, {visible: true});

    const skills = await this.page.$$(skillListItemSelector);
    for (let skill of skills) {
      const skillNameElement = await skill.$(skillSelector);
      if (skillNameElement) {
        const name: string = await (
          await skillNameElement.getProperty('textContent')
        ).jsonValue();

        if (name.trim() === `${skillName}`) {
          await this.page.waitForSelector(skillListItemOptions, {
            visible: true,
          });
          const editBox = await skill.$(skillListItemOptions);
          if (editBox) {
            await editBox.click();
          } else {
            throw new Error('Edit button not found');
          }

          const deleteButton = await skill.$(deleteSkillButton);
          if (deleteButton) {
            throw new Error('Delete skill button is available');
          }
        }
      }
    }
    showMessage('Delete button is not available in the skill');
  }
}

export let TopicManagerFactory = (): TopicManager => new TopicManager();
