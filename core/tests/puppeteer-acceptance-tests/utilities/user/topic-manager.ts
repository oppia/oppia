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

const topicAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;

const modalDiv = 'div.modal-content';
const closeSaveModalButton = '.e2e-test-close-save-modal-button';
const saveChangesMessageInput = 'textarea.e2e-test-commit-message-input';

// Photo Upload Modal.
const chapterPhotoBoxButton = '.e2e-test-photo-button';
const uploadPhotoButton = 'button.e2e-test-photo-upload-submit';
const photoUploadModal = 'edit-thumbnail-modal';

// Topic and Skills Dashboard Page.
const topicsTab = 'a.e2e-test-topics-tab';
const desktopTopicSelector = 'a.e2e-test-topic-name';
const mobileOptionsSelector = '.e2e-test-mobile-options-base';
const mobileTopicSelector = 'div.e2e-test-mobile-topic-name a';
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
const chapterTitleField = '.e2e-test-chapter-title-field';
const chapterExplorationIdField = '.e2e-test-exploration-id-input';

const subtopicReassignHeader = 'div.subtopic-reassign-header';
const subtopicTitleField = '.e2e-test-subtopic-title-field';
('input.e2e-test-url-fragment-field');
const subtopicUrlFragmentField =
  '.e2e-test-subtopic-url-fragment-field .e2e-test-url-fragment-field';
const richTextAreaField = 'div.e2e-test-rte';
const subtopicPhotoBoxButton =
  '.e2e-test-subtopic-thumbnail .e2e-test-photo-button';
const mobileSaveTopicButton =
  'div.navbar-mobile-options .e2e-test-mobile-save-topic-button';
const mobileNavbarDropdown =
  'div.navbar-mobile-options .e2e-test-mobile-navbar-dropdown';
const saveTopicButton = 'button.e2e-test-save-topic-button';
const mobileChapterCollapsibleCard = '.e2e-test-mobile-add-chapter';

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
const topicEditorUrlFragmentField =
  '.e2e-test-topic-url-fragment-field .e2e-test-url-fragment-field';
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
const workedExampleSelector =
  '.oppia-skill-concept-card-preview-list .e2e-test-worked-example-title';
const misconceptionTitleSelector =
  '.oppia-skill-misconception-card-preview-list .e2e-test-worked-example-title';
const misconceptionTitleElement = '.e2e-test-worked-example-title';
const skillPrerequisiteTitleSelector = '.skill-prerequisite-link';
const skillDescriptionCardSelector = '.skill-description-card';
const skillPrerequisiteLinkSelector = '.skill-prerequisite-link';
const removeSkillIconSelector = '.remove-skill-icon';
const misconceptionDeleteButtonSelector = '.e2e-test-delete-example-button';
const saveOrPublishSkillSelector = '.e2e-test-save-or-publish-skill';
const mobileSaveOrPublishSkillSelector = '.e2e-test-mobile-save-skill-changes';
const mobileSkillNavToggle =
  'div.e2e-test-mobile-toggle-skill-nav-dropdown-icon';
const commitMessageInputSelector = '.e2e-test-commit-message-input';
const closeSaveModalButtonSelector = '.e2e-test-close-save-modal-button';
const skillPreviewModalTitleSelector = '.skill-preview-modal-title';
const skillPreviewModalContentSelector = '.skill-preview-modal-content';
const selectRubricDifficultySelector = '.e2e-test-select-rubric-difficulty';
const rteSelector = '.e2e-test-rte';
const saveRubricExplanationButton = '.e2e-test-save-rubric-explanation-button';
const editConceptCardSelector = '.e2e-test-edit-concept-card';
const saveConceptCardSelector = '.e2e-test-save-concept-card';
const addButtonSelector = '.e2e-test-add-misconception-modal-button';
const misconceptionCardHeader = 'div.oppia-misconception-card-header';
const nameFieldSelector = '.e2e-test-misconception-name-field';
const saveMisconceptionButton = '.e2e-test-confirm-add-misconception-button';
const saveWorkedExamplesButton = '.e2e-test-save-worked-example-button';
const addWorkedExampleButton = '.e2e-test-add-worked-example';
const workedExampleListItem = '.oppia-skill-concept-card-preview-list';
const workedExampleTitleElement = '.e2e-test-worked-example-title';
const workedExampleDeleteButton = '.e2e-test-delete-example-button';
const misconceptionListSelector =
  '.oppia-skill-misconception-card-preview-list';
const confirmDeleteWorkedExampleButton =
  '.e2e-test-confirm-delete-worked-example-button';
const confirmDeleteMisconceptionButton =
  '.e2e-test-confirm-delete-misconception-button';
const optionalMisconceptionToggle = '.e2e-test-misconception-optional-check';
const topicMetaTagInput = '.e2e-test-topic-meta-tag-content-field';
const updateTopicWebFragmentField = '.e2e-test-topic-page-title-fragment-field';
const updateTopicDescriptionField = '.e2e-test-topic-description-field';
const photoBoxButton = 'div.e2e-test-photo-button';
const practiceTabToggle = '.e2e-test-toggle-practice-tab';
const topicPreviewTitleSelector = '.e2e-test-preview-topic-title';
const topicPreviewDescriptionSelector = '.e2e-test-preview-topic-description';
const reassignSkillButton = '.e2e-test-reassign-skill-button';
const editIcon = '.subtopic-header';
const renameSubtopicField = '.e2e-test-rename-subtopic-field';
const saveReassignments = '.e2e-test-save-reassignments';
const saveRearrangeSkills = '.e2e-test-save-rearrange-skills';
const subtopicCardHeader = '.subtopic-name-card-header';
const subtopicTitleSelector = '.e2e-test-subtopic';
const topicPreviewTab = '.e2e-test-topic-preview-button';
const contentTitle = '.content-title';
const htmlContent = '.html-content';
const subtopicAssignmentContainer = '.subtopics-container';
const editSubtopicExplanationSelector = '.e2e-test-edit-html-content';
const topicMobilePreviewTab = '.e2e-test-mobile-preview-tab';
const storyTitleSelector = '.e2e-test-story-title';
const chapterTitleSelector = '.e2e-test-chapter-title';
const chapterDescriptionField = '.e2e-test-add-chapter-description';
const showChapterPreviewButton = '.show-chapter-preview-button';
const titleSelector = '.oppia-thumbnail-preview-title';
const descriptionSelector = '.oppia-thumbnail-preview-description';
const optionsSelector = '.e2e-test-show-subtopic-options';
const deleteSubtopicButtonSelector = '.e2e-test-delete-subtopic-button';
const storyListItemSelector = '.e2e-test-story-list-item';
const deleteStoryButtonSelector = '.e2e-test-delete-story-button';
const confirmStoryDeletionButton = '.e2e-test-confirm-story-deletion-button';
const editOptionsSelector = '.e2e-test-edit-options';
const deleteChapterButtonSelector = '.e2e-test-delete-chapter-button';
const storyEditorNodeSelector = '.story-editor-node';
const resetChapterThumbnailButton = '.e2e-test-thumbnail-reset-button';
const saveExplorationIDButton = '.e2e-test-exploration-id-save-button';
const addPrerequisiteSkillButton = '.e2e-test-add-prerequisite-skill';
const addAcquiredSkillButton = '.e2e-test-add-acquired-skill';
const mobileCollapsibleCardHeaderSelector =
  '.oppia-mobile-collapsible-card-header';
const mobileStoryDropdown = '.e2e-test-story-dropdown';
const confirmDeleteChapterButton = '.e2e-test-confirm-delete-chapter-button';

export class TopicManager extends BaseUser {
  /**
   * Navigate to the topic and skills dashboard page.
   */
  async navigateToTopicAndSkillsDashboardPage(): Promise<void> {
    await this.page.bringToFront();
    await this.waitForNetworkIdle();
    await this.goto(topicAndSkillsDashboardUrl);
  }

  /**
   * Navigate to the skill's question editor tab.
   */
  async navigateToSkillQuestionEditorTab(): Promise<void> {
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
  async openStoryEditorWithId(storyID: string): Promise<void> {
    await this.goto(`http://localhost:8181/story_editor/${storyID}`);
  }

  /**
   * Function to navigate to the skill's question preview tab.
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
   * Expects a toast message to match a given string.
   * @param {string} expectedMessage - The message that the toast is expected to display.
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
      this.page.waitForNavigation({waitUntil: ['load', 'networkidle0']}),
    ]);
    await this.waitForStaticAssetsToLoad();
  }

  /**
   * Edits the details of a topic.
   * @param {string} topicName - The name of the topic.
   * @param {string} urlFragment - The URL fragment of the topic.
   * @param {string} description - The description of the topic.
   * @param {string} titleFragments - The title fragments of the topic.
   * @param {string} metaTags - The meta tags of the topic.
   * @param {string} thumbnail - The thumbnail of the topic.
   */
  async editTopicDetails(
    description: string,
    titleFragments: string,
    metaTags: string,
    thumbnail: string,
    topicName?: string,
    urlFragment?: string
  ): Promise<void> {
    if (topicName) {
      await this.clearAllTextFrom(topicNameField);
      await this.type(topicNameField, topicName);
    }
    if (urlFragment) {
      await this.page.waitForSelector(topicEditorUrlFragmentField, {
        visible: true,
      });
      await this.clearAllTextFrom(topicEditorUrlFragmentField);
      await this.page.type(topicEditorUrlFragmentField, urlFragment);
    }
    await this.clearAllTextFrom(updateTopicWebFragmentField);
    await this.type(updateTopicWebFragmentField, titleFragments);
    await this.clearAllTextFrom(updateTopicDescriptionField);
    await this.type(updateTopicDescriptionField, description);

    await this.clickOn(photoBoxButton);
    await this.page.waitForSelector(photoUploadModal, {visible: true});
    await this.uploadFile(thumbnail);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);
    await this.page.waitForSelector(photoUploadModal, {hidden: true});

    await this.page.waitForSelector(topicMetaTagInput);
    await this.page.focus(topicMetaTagInput);
    await this.clearAllTextFrom(topicMetaTagInput);
    await this.page.type(topicMetaTagInput, metaTags);
    await this.page.keyboard.press('Tab');
  }

  /**
   * Save a topic draft.
   * @param {string} topicName - name of the topic to be saved.
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
      await this.page.waitForSelector(
        `${closeSaveModalButton}:not([disabled])`
      );
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
   * Checks if the filtered topics match the expected topics.
   * @param {string[]} expectedTopics - The expected topics.
   */
  async expectFilteredTopics(expectedTopics: string[]): Promise<void> {
    const isMobileViewport = this.isViewportAtMobileWidth();
    const topicNameSelector = isMobileViewport
      ? mobileTopicSelector
      : desktopTopicSelector;
    try {
      await this.waitForStaticAssetsToLoad();
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
  async expectFilteredTopicsInOrder(expectedOrder: string[]): Promise<void> {
    const isMobileViewport = this.isViewportAtMobileWidth();
    const topicNameSelector = isMobileViewport
      ? mobileTopicSelector
      : desktopTopicSelector;

    try {
      await this.waitForStaticAssetsToLoad();
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
   * Verifies the status of the practice tab.
   * @param {string} expectedStatus - The expected status of the practice tab.
   */
  async verifyStatusOfPracticeTab(expectedStatus: string): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn('Subtopics');
    }
    try {
      const practiceTab = await this.page.$(practiceTabToggle);
      if (practiceTab === null) {
        throw new Error('Practice tab not found.');
      }
      const actualStatus = await (
        await practiceTab.getProperty('disabled')
      ).jsonValue();

      if (expectedStatus === 'disabled' && actualStatus !== true) {
        throw new Error(
          'Expected practice tab to be disabled, but it was enabled.'
        );
      } else if (expectedStatus === 'enabled' && actualStatus !== false) {
        throw new Error(
          'Expected practice tab to be enabled, but it was disabled.'
        );
      }
    } catch (error) {
      const newError = new Error(
        `Failed to verify status of practice tab: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Opens the topic editor for a given topic and previews it by clicking on the third navbar-tab-icon.
   * @param {string} topicName - The name of the topic to be opened in the topic editor.
   */
  async navigateToTopicPreviewTab(topicName: string): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileOptionsSelector);
      await this.clickOn(mobileNavbarDropdown);
      await this.clickOn(topicMobilePreviewTab);
    } else {
      await this.page.waitForSelector(topicPreviewTab);
      await this.clickOn(topicPreviewTab);
    }
  }

  /**
   * Checks if the topic preview has the expected title and description.
   * @param {string} title - The expected title of the topic.
   * @param {string} description - The expected description of the topic.
   */
  async expectTopicPreviewToHaveTitleAndDescription(
    title: string,
    description: string
  ): Promise<void> {
    await this.page.waitForSelector(topicPreviewTitleSelector);
    const titleElement = await this.page.$(topicPreviewTitleSelector);
    const actualTitle = await this.page.evaluate(
      el => el.textContent,
      titleElement
    );
    if (actualTitle.trim() !== title) {
      throw new Error(
        `Expected topic title to be "${title}", but was "${actualTitle}".`
      );
    }

    await this.page.waitForSelector(topicPreviewDescriptionSelector);
    const descriptionElement = await this.page.$(
      topicPreviewDescriptionSelector
    );
    const actualDescription = await this.page.evaluate(
      el => el.textContent,
      descriptionElement
    );
    if (actualDescription.trim() !== description) {
      throw new Error(
        `Expected topic description to be "${description}", but was "${actualDescription}".`
      );
    }
  }

  /**
   * This function checks if the topic name field is disabled as a topic manager cannot edit the topic name.
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
   * This function verifies the absence of the delete topic button for a given topic as topic manager cannot delete a topic.
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
   * This function checks if "Create Topic" button is present or not as topic manager cannot create topics.
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
      this.page.waitForNavigation({waitUntil: ['load', 'networkidle0']}),
      this.waitForStaticAssetsToLoad(),
    ]);
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
    await this.navigateToSkillsTab();

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
    await this.navigateToSkillsTab();

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
   * Filters skills by name and selects the first matching skill.
   *
   * @param {string} skillName - The name of the skill to select.
   */
  async filterAndSelectSkill(skillName: string): Promise<void> {
    // Searching by skill name.
    await this.type(skillNameInputSelector, skillName);

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
    await this.navigateToSkillsTab();

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
    await this.filterAndSelectSkill(skillName2);
  }

  /**
   * Function to delete a question with the given text in the skill's question editor.
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
      await this.type(questionTextInput, questionText);
      await this.page.keyboard.press('Enter');
    } catch (error) {
      console.error(`Error previewing question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Function to expect the preview question text of the question previewed.
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
   * Function to expect the preview interaction type of the question previewed.
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
   * Filters skills by status like assigned or unassigned.
   * @param {string} status - The status to filter by.
   */
  async filterSkillsByStatus(status: string): Promise<void> {
    try {
      await this.navigateToTopicAndSkillsDashboardPage();
      await this.navigateToSkillsTab();
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
   * Filters skills by keyword.
   * @param {string} keyword - The keyword to filter by.
   */
  async filterSkillsByKeyword(keyword: string): Promise<void> {
    try {
      await this.navigateToTopicAndSkillsDashboardPage();
      await this.navigateToSkillsTab();
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
      await this.navigateToSkillsTab();
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
   * Adjusts the paginator to show a certain number of items per page.
   * @param {number} itemsPerPage - The number of items to show per page.
   */
  async adjustPaginatorToShowItemsPerPage(itemsPerPage: number): Promise<void> {
    try {
      await this.page.waitForSelector(itemsPerPageDropdown);
      await this.page.waitForSelector(itemsPerPageDropdown);
      await this.page.select(itemsPerPageDropdown, itemsPerPage.toString());
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
      await this.waitForStaticAssetsToLoad();
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
  async expectFilteredSkillsInOrder(expectedOrder: string[]): Promise<void> {
    const isMobileViewport = this.isViewportAtMobileWidth();
    const skillNameSelector = isMobileViewport
      ? mobileSkillSelector
      : desktopSkillSelector;

    try {
      await this.waitForStaticAssetsToLoad();
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
   * This function checks if "Create Skill" button is not present as topic manager cannot create skills.
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
    await this.navigateToSkillsTab();
    await this.waitForStaticAssetsToLoad();
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

  /**
   * Adds a worked example to the topic.
   * @param {string} exampleQuestion - The question part of the worked example.
   * @param {string} exampleExplanation - The explanation part of the worked example.
   */
  async addWorkedExample(
    exampleQuestion: string,
    exampleExplanation: string
  ): Promise<void> {
    await this.openAllMobileDropdownsInSkillEditor();
    await this.waitForStaticAssetsToLoad();
    await this.clickOn(addWorkedExampleButton);
    await this.type(rteSelector, exampleQuestion);
    const rteElements = await this.page.$$(rteSelector);
    await this.waitForElementToBeClickable(rteElements[1]);
    await rteElements[1].type(exampleExplanation);
    await this.clickOn(saveWorkedExamplesButton);
  }

  /**
   * Deletes a worked example from the topic.
   * @param {string} exampleQuestion - The question part of the worked example to delete.
   */
  async deleteWorkedExample(exampleQuestion: string): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.page.waitForSelector(workedExampleListItem, {visible: true});
    const previewLists = await this.page.$$(workedExampleListItem);
    if (!previewLists) {
      throw new Error('No worked examples found');
    }
    let exampleFound = false;

    for (const previewList of previewLists) {
      await this.page.waitForSelector(workedExampleTitleElement, {
        visible: true,
      });
      const titleElement = await previewList.$(workedExampleTitleElement);
      if (titleElement) {
        const title = await this.page.evaluate(
          el => el.textContent,
          titleElement
        );
        if (title.trim() === exampleQuestion) {
          await this.page.waitForSelector(workedExampleDeleteButton, {
            visible: true,
          });
          const deleteButton = await previewList.$(workedExampleDeleteButton);
          if (deleteButton) {
            await this.waitForElementToBeClickable(deleteButton);
            await deleteButton.click();
            await this.waitForStaticAssetsToLoad();
            await this.clickOn(confirmDeleteWorkedExampleButton);
            exampleFound = true;
            break;
          }
        }
      }
    }
    if (!exampleFound) {
      throw new Error(
        `Worked example with question "${exampleQuestion}" not found.`
      );
    }
  }

  /**
   * Verifies if a worked example is present on the page.
   * @param {string} workedExample - The title of the worked example to verify.
   * @param {boolean} isPresent - Whether the worked example is expected to be present.
   */
  async verifyWorkedExamplePresent(
    workedExample: string,
    isPresent: boolean
  ): Promise<void> {
    await this.openAllMobileDropdownsInSkillEditor();

    try {
      await this.page.waitForSelector(workedExampleSelector, {
        timeout: 5000,
        visible: true,
      });
      const workedExamples = await this.page.$$(workedExampleSelector);

      for (const example of workedExamples) {
        const title = await this.page.evaluate(el => el.textContent, example);
        if (title.trim() === workedExample) {
          if (!isPresent) {
            throw new Error(
              `The worked example ${workedExample} is present, which was not expected`
            );
          }
          return;
        }
      }

      if (isPresent) {
        throw new Error(
          `The worked example ${workedExample} is not present, which was expected`
        );
      }
    } catch (error) {
      if (isPresent) {
        throw new Error(
          `The worked example ${workedExample} is not present, which was expected`
        );
      }
    }

    showMessage(
      `The worked example is ${isPresent ? '' : 'not'} present as expected.`
    );
  }

  /**
   * Adds a misconception to the topic.
   * @param {string} misconceptionName - The name of the misconception to add.
   * @param {string} notes - The notes for question creators to understand how handling this misconception is useful for the skill being tested.
   * @param {string} feedback - The feedback for the misconception to add.
   * @param {boolean} optional - Whether the misconception is optional or not.
   */
  async addMisconception(
    misconceptionName: string,
    notes: string,
    feedback: string,
    optional: boolean = false
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(addButtonSelector);
      // If the misconceptions were collapsed in mobile view.
      if (!element) {
        await this.page.waitForSelector(misconceptionCardHeader);
        const misconceptionHeader = await this.page.$(misconceptionCardHeader);
        if (!misconceptionHeader) {
          throw new Error(
            'Misconception card header not found in mobile view.'
          );
        }
        misconceptionHeader.click();
      }
    }
    await this.clickOn(addButtonSelector);
    await this.type(nameFieldSelector, misconceptionName);
    await this.type(rteSelector, notes);
    const rteElements = await this.page.$$(rteSelector);
    await rteElements[1].type(feedback);
    if (optional) {
      await this.clickOn(optionalMisconceptionToggle);
    }
    await this.clickOn(saveMisconceptionButton);
  }

  /**
   * Verifies if a misconception is present on the page.
   * @param {string} misconceptionName - The name of the misconception to verify.
   * @param {boolean} isPresent - Whether the misconception is expected to be present.
   */
  async verifyMisconceptionPresent(
    misconceptionName: string,
    isPresent: boolean
  ): Promise<void> {
    try {
      await this.page.waitForSelector(misconceptionTitleSelector, {
        timeout: 5000,
        visible: true,
      });
      const misconceptions = await this.page.$$(misconceptionTitleSelector);

      for (const misconception of misconceptions) {
        const title = await this.page.evaluate(
          el => el.textContent,
          misconception
        );
        if (title.trim() === misconceptionName) {
          if (!isPresent) {
            throw new Error(
              `The misconception ${misconceptionName} is present, which was not expected`
            );
          }
          return;
        }
      }

      if (isPresent) {
        throw new Error(
          `The misconception ${misconceptionName} is not present, which was expected`
        );
      }
    } catch (error) {
      if (isPresent) {
        throw new Error(
          `The misconception ${misconceptionName} is not present, which was expected`
        );
      }
    }

    showMessage(
      `The misconception is ${isPresent ? '' : 'not'} present as expected.`
    );
  }

  /**
   * Deletes a misconception.
   * @param {string} misconceptionName - The name of the misconception to delete.
   */
  async deleteMisconception(misconceptionName: string): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.page.waitForSelector(misconceptionListSelector, {visible: true});
    const misconceptionLists = await this.page.$$(misconceptionListSelector);
    let misconceptionFound = false;

    for (const misconceptionList of misconceptionLists) {
      await this.page.waitForSelector(misconceptionTitleElement, {
        visible: true,
      });
      const titleElement = await misconceptionList.$(misconceptionTitleElement);
      if (titleElement) {
        const title = await this.page.evaluate(
          el => el.textContent,
          titleElement
        );
        if (title.trim() === misconceptionName) {
          await this.page.waitForSelector(misconceptionDeleteButtonSelector, {
            visible: true,
          });
          const deleteButton = await misconceptionList.$(
            misconceptionDeleteButtonSelector
          );
          if (deleteButton) {
            await this.waitForElementToBeClickable(deleteButton);
            await deleteButton.click();
            await this.waitForStaticAssetsToLoad();
            await this.clickOn(confirmDeleteMisconceptionButton);
            misconceptionFound = true;
            break;
          } else {
            throw new Error('Misconception delete button not found.');
          }
        }
      }
    }

    if (!misconceptionFound) {
      throw new Error(`The misconception ${misconceptionName} was not found`);
    }
  }

  /**
   * Updates the review material.
   * @param {string} updatedMaterial - The updated review material.
   */
  async updateReviewMaterial(updatedMaterial: string): Promise<void> {
    try {
      await this.clickOn(editConceptCardSelector);
      await this.clearAllTextFrom(rteSelector);
      await this.type(rteSelector, updatedMaterial);
      await this.clickOn(saveConceptCardSelector);
      showMessage('Updated review material');
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Adds a prerequisite skill to a chapter in chapter editor.
   * @param {string} skillName - The name of the skill to add.
   */
  async addPrerequisiteSkill(skillName: string): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.page.waitForSelector(addPrerequisiteSkillButton);
    const elements = await this.page.$$(addPrerequisiteSkillButton);

    if (this.isViewportAtMobileWidth()) {
      if (elements.length < 2) {
        throw new Error('Did not find 2 "add prerequisite" button.');
      }
      await this.waitForElementToBeClickable(elements[1]);
      await elements[1].click();
    } else {
      await this.waitForElementToBeClickable(elements[0]);
      await elements[0].click();
    }
    await this.filterAndSelectSkill(skillName);
  }

  /**
   * Adds a prerequisite skill to a skill in skill chapter.
   * @param {string} skillName - The name of the skill to add.
   */
  async addPrerequisiteSkillInSkillEditor(skillName: string): Promise<void> {
    try {
      await this.clickOn('+ ADD PREREQUISITE SKILL');
      await this.type(skillNameInputSelector, skillName);

      await this.page.waitForSelector(radioInnerCircleSelector);
      const radioInnerCircleSelectorElement = await this.page.$(
        radioInnerCircleSelector
      );
      if (!radioInnerCircleSelectorElement) {
        throw new Error('Radio inner circle selector not found');
      }
      await this.waitForStaticAssetsToLoad();
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
      showMessage(`Added prerequisite skill: ${skillName}`);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Removes a prerequisite skill.
   * @param {string} skillName - The name of the skill to remove.
   */
  async removePrerequisiteSkill(skillName: string): Promise<void> {
    try {
      await this.page.waitForSelector(skillDescriptionCardSelector, {
        visible: true,
      });
      const skillCards = await this.page.$$(skillDescriptionCardSelector);

      for (const skillCard of skillCards) {
        const skillLink = await skillCard.$(skillPrerequisiteLinkSelector);
        const skillText = await this.page.evaluate(
          el => el.textContent,
          skillLink
        );

        if (skillText === skillName) {
          await this.page.waitForSelector(removeSkillIconSelector, {
            visible: true,
          });
          const removeIcon = await skillCard.$(removeSkillIconSelector);
          if (removeIcon) {
            await this.waitForElementToBeClickable(removeIcon);
            await removeIcon.click();
            showMessage(`Removed prerequisite skill: ${skillName}`);
            return;
          }
        }
      }

      throw new Error(`The skill ${skillName} was not found`);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Verifies if a prerequisite skill is present on the page.
   * @param {string} skillName - The name of the skill to verify.
   * @param {boolean} isPresent - Whether the skill is expected to be present.
   */
  async verifyPrerequisiteSkillPresent(
    skillName: string,
    isPresent: boolean
  ): Promise<void> {
    try {
      await this.page.waitForSelector(skillPrerequisiteTitleSelector, {
        timeout: 5000,
      });
      const skillCards = await this.page.$$(skillPrerequisiteTitleSelector);

      for (const skillCard of skillCards) {
        const skillLink = await skillCard.$(skillPrerequisiteTitleSelector);
        const skillText = await this.page.evaluate(
          el => el.textContent,
          skillLink
        );

        if (skillText.trim() === skillName) {
          if (!isPresent) {
            throw new Error(
              `The skill ${skillName} is present, which was not expected`
            );
          }
          return;
        }
      }

      if (isPresent) {
        throw new Error(
          `The skill ${skillName} is not present, which was expected`
        );
      }
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        if (isPresent) {
          throw new Error(
            `The skill ${skillName} is not present, which was expected`
          );
        }
      } else {
        throw error;
      }
    }

    showMessage(
      `The prerequisite skill is ${isPresent ? '' : 'not'} present as expected.`
    );
  }

  /**
   * Updates a rubric.
   * @param {string} difficulty - The difficulty level to update.
   * @param {string} explanation - The explanation to update.
   */
  async updateRubric(difficulty: string, explanation: string): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    let difficultyValue: string;
    switch (difficulty) {
      case 'Easy':
        difficultyValue = '0';
        break;
      case 'Medium':
        difficultyValue = '1';
        break;
      case 'Hard':
        difficultyValue = '2';
        break;
      default:
        throw new Error(`Unknown difficulty: ${difficulty}`);
    }
    await this.waitForElementToBeClickable(selectRubricDifficultySelector);
    await this.select(selectRubricDifficultySelector, difficultyValue);
    await this.waitForStaticAssetsToLoad();
    await this.clickOn(' + ADD EXPLANATION FOR DIFFICULTY ');
    await this.type(rteSelector, explanation);
    await this.clickOn(saveRubricExplanationButton);
  }

  /**
   * Publishes an updated skill.
   * @param {string} updateMessage - The update message.
   */
  async publishUpdatedSkill(updateMessage: string): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileOptionsSelector);
      // The mobile view has 2 instances of the element, from which
      // the first one is inapplicable here.
      const elems = await this.page.$$(mobileSkillNavToggle);
      await elems[1].click();
      await this.page.waitForSelector(mobileSaveOrPublishSkillSelector, {
        visible: true,
      });
      await this.clickOn(mobileSaveOrPublishSkillSelector);
    } else {
      await this.waitForStaticAssetsToLoad();
      await this.page.waitForSelector(saveOrPublishSkillSelector, {
        visible: true,
      });
      await this.clickOn(saveOrPublishSkillSelector);
    }

    await this.page.waitForSelector(commitMessageInputSelector, {
      visible: true,
    });
    await this.type(commitMessageInputSelector, updateMessage);
    await this.page.waitForSelector(closeSaveModalButtonSelector, {
      visible: true,
    });
    await this.clickOn(closeSaveModalButtonSelector);
    await this.expectToastMessageToBe('Changes Saved.');
    showMessage('Skill updated successful');
  }

  /**
   * Previews a concept card.
   */
  async previewConceptCard(): Promise<void> {
    await this.clickOn(' Preview Concept Card ');
  }

  /**
   * Verifies if a concept card preview has the expected skill name and review material.
   * @param {string} skillName - The expected skill name.
   * @param {string} reviewMaterial - The expected review material.
   */
  async expectConceptCardPreviewToHave(
    skillName: string,
    reviewMaterial: string
  ): Promise<void> {
    await this.page.waitForSelector(skillPreviewModalTitleSelector, {
      visible: true,
    });
    const titleElement = await this.page.$(skillPreviewModalTitleSelector);
    const title = await this.page.evaluate(el => el.textContent, titleElement);

    if (title.trim() !== skillName) {
      throw new Error(
        `Expected skill name to be ${skillName} but found ${title}`
      );
    }

    await this.page.waitForSelector(skillPreviewModalContentSelector, {
      visible: true,
    });
    const contentElement = await this.page.$(skillPreviewModalContentSelector);
    const content = await this.page.evaluate(
      el => el.textContent,
      contentElement
    );

    if (content.trim() !== reviewMaterial) {
      throw new Error(
        `Expected review material to be "${reviewMaterial}" but found "${content}"`
      );
    }
  }

  private async openAllMobileDropdownsInSkillEditor(): Promise<void> {
    await this.clickOn('Misconceptions');
    await this.clickOn('Worked Examples');
    await this.clickOn(' Prerequisite Skills ');
    await this.clickOn('Rubrics');
  }

  /**
   * Opens the subtopic editor for a given subtopic and topic.
   * @param {string} subtopicName - The name of the subtopic to open.
   * @param {string} topicName - The name of the topic that contains the subtopic.
   */
  async openSubtopicEditor(
    subtopicName: string,
    topicName: string
  ): Promise<void> {
    await this.openTopicEditor(topicName);

    await this.page.waitForSelector(subtopicReassignHeader);
    let elementToClick = await this.page.$(subtopicReassignHeader);
    if (this.isViewportAtMobileWidth() && elementToClick) {
      await elementToClick.click();
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
          if (titleTextContent.includes(subtopicName)) {
            await this.waitForElementToBeClickable(titleElement);
            await titleElement.click();
            break;
          }
        }
      }
    } catch (error) {
      const newError = new Error(`Failed to open subtopic editor: ${error}`);
      newError.stack = error.stack;
      throw newError;
    }
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
    thumbnail: string
  ): Promise<void> {
    await this.clearAllTextFrom(subtopicTitleField);
    await this.type(subtopicTitleField, title);
    if (urlFragment) {
      await this.page.waitForSelector(subtopicUrlFragmentField, {
        visible: true,
      });
      await this.clearAllTextFrom(subtopicUrlFragmentField);
      await this.page.type(subtopicUrlFragmentField, urlFragment);
    }

    await this.clickOn(editSubtopicExplanationSelector);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.clearAllTextFrom(richTextAreaField);
    await this.type(richTextAreaField, explanation);

    await this.clickOn(subtopicPhotoBoxButton);
    await this.page.waitForSelector(photoUploadModal, {visible: true});
    await this.uploadFile(thumbnail);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {hidden: true});
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
        await this.clickOn(subtopicReassignHeader);
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
      newError.stack = error.stack;
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
    topicName: string,
    shouldExist: boolean
  ): Promise<void> {
    try {
      await this.openTopicEditor(topicName);
      await this.waitForStaticAssetsToLoad();

      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(subtopicReassignHeader);
      }

      const subtopics = await this.page.$$(subtopicTitleSelector);

      for (const subtopicElement of subtopics) {
        const subtopic = await this.page.evaluate(
          el => el.textContent.trim(),
          subtopicElement
        );

        if (subtopic === subtopicName) {
          if (!shouldExist) {
            throw new Error(
              `Subtopic ${subtopicName} exists in topic ${topicName}, but it shouldn't.`
            );
          }
          showMessage(
            `Subtopic ${subtopicName} is ${shouldExist ? 'found' : 'not found'} in topic ${topicName}, as expected.`
          );
          return;
        }
      }

      if (shouldExist) {
        throw new Error(
          `Subtopic ${subtopicName} not found in topic ${topicName}, but it should exist.`
        );
      }

      showMessage(
        `Subtopic ${subtopicName} is ${shouldExist ? 'found' : 'not found'} in topic ${topicName}, as expected.`
      );
    } catch (error) {
      const newError = new Error(
        `Failed to verify subtopic presence in topic: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
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
      await this.clickOn(mobileOptionsSelector);
      await this.clickOn(mobileNavbarDropdown);
      await this.clickOn(topicMobilePreviewTab);
    } else {
      await this.page.waitForSelector(topicPreviewTab);
      await this.clickOn(topicPreviewTab);
    }
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
   * Changes the subtopic assignments.
   */
  async changeSubtopicAssignments(
    newSubtopicName: string,
    topicName: string
  ): Promise<void> {
    // Subtopic assignment is not available in mobile viewport.
    if (this.isViewportAtMobileWidth()) {
      return;
    }

    try {
      await this.page.waitForSelector(reassignSkillButton);
      await this.clickOn(reassignSkillButton);

      await this.page.waitForSelector(subtopicAssignmentContainer, {
        visible: true,
      });
      await this.page.waitForSelector(editIcon);
      await this.waitForStaticAssetsToLoad();
      await this.page.evaluate(selector => {
        document.querySelector(selector).click();
      }, editIcon);

      await this.page.waitForSelector(renameSubtopicField);
      await this.type(renameSubtopicField, newSubtopicName);

      await this.page.waitForSelector(saveReassignments);
      await this.clickOn(saveReassignments);

      await this.page.waitForSelector(saveRearrangeSkills);
      await this.clickOn(saveRearrangeSkills);

      await this.page.waitForSelector(subtopicAssignmentContainer, {
        hidden: true,
      });
      await this.saveTopicDraft(topicName);
    } catch (error) {
      const newError = new Error(
        `Failed to change subtopic assignments. Original error: ${error.message}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Save a story as a curriculum admin.
   */
  async saveStoryDraft(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const isMobileSaveButtonVisible = await this.isElementVisible(
        mobileSaveStoryChangesButton
      );
      if (!isMobileSaveButtonVisible) {
        await this.clickOn(mobileOptionsSelector);
      }
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
   * Opens the story editor for a given story and topic.
   * @param {string} storyName - The name of the story.
   * @param {string} topicName - The name of the topic.
   */
  async openStoryEditor(storyName: string, topicName: string): Promise<void> {
    try {
      await this.openTopicEditor(topicName);
      if (this.isViewportAtMobileWidth()) {
        const elements = await this.page.$$(
          mobileCollapsibleCardHeaderSelector
        );
        if (elements.length < 4) {
          throw new Error('Not enough collapsible cards found');
        }
        // 4th collapsible card is for stories.
        await elements[3].click();
      }

      await this.page.waitForSelector(storyTitleSelector);
      const storyTitles = await this.page.$$(storyTitleSelector);

      for (const titleElement of storyTitles) {
        const title = await this.page.evaluate(
          el => el.textContent.trim(),
          titleElement
        );

        if (title === storyName) {
          await titleElement.click();
          await this.page.waitForNavigation({
            waitUntil: ['load', 'networkidle0'],
          });
          return;
        }
      }

      throw new Error(
        `Story with name ${storyName} not found in topic ${topicName}.`
      );
    } catch (error) {
      const newError = new Error(
        `Failed to open story editor for story ${storyName} in topic ${topicName}: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Verifies the presence of a story in a topic.
   * @param {string} storyName - The name of the story.
   * @param {string} topicName - The name of the topic.
   * @param {boolean} shouldExist - Whether the story should exist.
   */
  async verifyStoryPresenceInTopic(
    storyName: string,
    topicName: string,
    shouldExist: boolean
  ): Promise<void> {
    try {
      await this.openTopicEditor(topicName);
      await this.waitForStaticAssetsToLoad();

      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(mobileStoryDropdown);
      }

      const stories = await this.page.$$(storyTitleSelector);

      for (const storyElement of stories) {
        const story = await this.page.evaluate(
          el => el.textContent.trim(),
          storyElement
        );

        if (story === storyName) {
          if (!shouldExist) {
            throw new Error(
              `Story ${storyName} exists in topic ${topicName}, but it shouldn't.`
            );
          }
          showMessage(
            `Story ${storyName} is ${shouldExist ? 'found' : 'not found'} in topic ${topicName}, as expected.`
          );
          return;
        }
      }

      if (shouldExist) {
        throw new Error(
          `Story ${storyName} not found in topic ${topicName}, but it should exist.`
        );
      }
      showMessage(
        `Story ${storyName} is ${shouldExist ? 'found' : 'not found'} in topic ${topicName}, as expected.`
      );
    } catch (error) {
      const newError = new Error(
        `Failed to verify story presence in topic: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Deletes a story from a topic.
   * @param {string} storyName - The name of the story.
   * @param {string} topicName - The name of the topic.
   */
  async deleteStoryFromTopic(
    storyName: string,
    topicName: string
  ): Promise<void> {
    try {
      await this.openTopicEditor(topicName);
      await this.waitForStaticAssetsToLoad();

      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(mobileStoryDropdown);
      }

      await this.page.waitForSelector(storyListItemSelector);
      const storyListItems = await this.page.$$(storyListItemSelector);

      for (const storyListItem of storyListItems) {
        const storyTitleElement = await storyListItem.$(storyTitleSelector);
        if (storyTitleElement) {
          const storyTitle = await storyTitleElement.evaluate(
            el => el.textContent?.trim() || ''
          );
          if (storyTitle === storyName) {
            const deleteButton = await storyListItem.$(
              deleteStoryButtonSelector
            );
            if (deleteButton) {
              await this.waitForElementToBeClickable(deleteButton);
              await deleteButton.click();
              await this.clickOn(confirmStoryDeletionButton);
              showMessage(
                `Story ${storyName} deleted from the topic ${topicName}.`
              );
              return;
            }
          }
        }
      }

      throw new Error(`Story ${storyName} not found in topic ${topicName}.`);
    } catch (error) {
      const newError = new Error(`Failed to delete story from topic: ${error}`);
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Opens the chapter editor for a given chapter, story, and topic.
   * @param {string} chapterName - The name of the chapter.
   * @param {string} storyName - The name of the story.
   * @param {string} topicName - The name of the topic.
   */
  async openChapterEditor(
    chapterName: string,
    storyName: string,
    topicName: string
  ): Promise<void> {
    try {
      await this.openStoryEditor(storyName, topicName);
      const addChapterButtonElement = await this.page.$(addChapterButton);
      if (!addChapterButtonElement) {
        const mobileChapterCollapsibleCardElement = await this.page.$(
          mobileChapterCollapsibleCard
        );
        mobileChapterCollapsibleCardElement?.click();
        await this.waitForStaticAssetsToLoad();
      }

      await this.page.waitForSelector(chapterTitleSelector);
      const chapterTitles = await this.page.$$(chapterTitleSelector);

      for (const titleElement of chapterTitles) {
        const title = await this.page.evaluate(
          el => el.textContent.trim(),
          titleElement
        );

        if (title === chapterName) {
          await titleElement.click();
          await this.waitForStaticAssetsToLoad();
          showMessage(`Chapter ${chapterName} opened in chapter editor.`);

          // Collapsing all the collapsible card of chapter editor in the mobile viewport.
          if (this.isViewportAtMobileWidth()) {
            await this.page.waitForSelector(
              mobileCollapsibleCardHeaderSelector
            );
            const elements = await this.page.$$(
              mobileCollapsibleCardHeaderSelector
            );
            if (elements.length < 5) {
              throw new Error('Not enough elements collapsible headers found,');
            }
            await elements[2].click();
            await elements[3].click();
            await elements[4].click();
          }
          return;
        }
      }

      throw new Error(
        `Chapter with name ${chapterName} not found in story ${storyName} and topic ${topicName}.`
      );
    } catch (error) {
      const newError = new Error(
        `Failed to open chapter editor for chapter ${chapterName} in story ${storyName} and topic ${topicName}: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Edits the details of a chapter.
   * @param {string} chapterName - The name of the chapter.
   * @param {string} description - The description of the chapter.
   * @param {string} explorationId - The ID of the exploration.
   * @param {string} thumbnailImage - The thumbnail image of the chapter.
   */
  async editChapterDetails(
    chapterName: string,
    description: string,
    explorationId: string,
    thumbnailImage: string
  ): Promise<void> {
    await this.clearAllTextFrom(chapterTitleField);
    await this.type(chapterTitleField, chapterName);
    await this.type(chapterDescriptionField, description);

    await this.clearAllTextFrom(chapterExplorationIdField);
    await this.type(chapterExplorationIdField, explorationId);
    await this.clickOn(saveExplorationIDButton);

    await this.clickOn(chapterPhotoBoxButton);
    await this.clickOn(resetChapterThumbnailButton);
    await this.uploadFile(thumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);
  }

  /**
   * Previews the chapter card.
   */
  async previewChapterCard(): Promise<void> {
    const elementHandle = await this.page.waitForSelector(
      showChapterPreviewButton
    );
    if (!elementHandle) {
      throw new Error('Chapter preview button not found');
    }
    await elementHandle.click();
  }

  /**
   * Expects the chapter preview to have a certain name and explanation.
   * @param {string} chapterName - The name of the chapter.
   * @param {string} explanation - The explanation of the chapter.
   */

  async expectChapterPreviewToHave(
    chapterName: string,
    explanation: string
  ): Promise<void> {
    try {
      await this.page.waitForSelector(titleSelector);
      await this.page.waitForSelector(descriptionSelector);

      const titleElement = await this.page.$(titleSelector);
      const descriptionElement = await this.page.$(descriptionSelector);

      const title = await this.page.evaluate(
        el => el.textContent.trim(),
        titleElement
      );
      const description = await this.page.evaluate(
        el => el.textContent.trim(),
        descriptionElement
      );

      if (title !== chapterName) {
        throw new Error(
          `Expected title to be ${chapterName} but found ${title}`
        );
      }

      if (description !== explanation) {
        throw new Error(
          `Expected description to be ${explanation} but found ${description}`
        );
      }
    } catch (error) {
      const newError = new Error(
        `Failed to validate chapter preview: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Assigns an acquired skill.
   * @param {string} skillName - The name of the skill.
   * @returns {Promise<void>}
   */
  async addAcquiredSkill(skillName: string): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(addAcquiredSkillButton);
    const elements = await this.page.$$(addAcquiredSkillButton);
    if (elements.length < 2) {
      throw new Error('Add Acquired skill button not found.');
    }

    if (this.isViewportAtMobileWidth()) {
      if (elements.length < 2) {
        throw new Error('Did not find 2 "Add Acquired Skill" buttons');
      }
      await this.waitForElementToBeClickable(elements[1]);
      await elements[1].click();
    } else {
      await this.waitForElementToBeClickable(elements[0]);
      await elements[0].click();
    }
    await this.filterAndSelectSkill(skillName);
  }

  /**
   * Verifies the presence of a chapter in a story.
   * @param {string} chapterName - The name of the chapter.
   * @param {string} storyName - The name of the story.
   * @param {boolean} shouldExist - Whether the chapter should exist.
   */
  async verifyChapterPresenceInStory(
    chapterName: string,
    storyName: string,
    topicName: string,
    shouldExist: boolean
  ): Promise<void> {
    try {
      await this.openStoryEditor(storyName, topicName);

      if (this.isViewportAtMobileWidth()) {
        await this.page.waitForSelector(mobileChapterCollapsibleCard);
        const mobileChapterCollapsibleCardElement = await this.page.$(
          mobileChapterCollapsibleCard
        );
        mobileChapterCollapsibleCardElement?.click();
        await this.waitForPageToFullyLoad();
      }

      const chapters = await this.page.$$(chapterTitleSelector);

      for (const chapterElement of chapters) {
        const chapter = await this.page.evaluate(
          el => el.textContent.trim(),
          chapterElement
        );

        if (chapter === chapterName) {
          if (!shouldExist) {
            throw new Error(
              `Chapter ${chapterName} exists in story ${storyName} of topic ${topicName}, but it shouldn't.`
            );
          }
          showMessage(
            `Chapter ${chapterName} is ${shouldExist ? 'found' : 'not found'} in story ${storyName}, as expected.`
          );

          return;
        }
      }

      if (shouldExist) {
        throw new Error(
          `Chapter ${chapterName} not found in story ${storyName} of topic ${topicName}, but it should exist.`
        );
      }
      showMessage(
        `Chapter ${chapterName} is ${shouldExist ? 'found' : 'not found'} in story ${storyName}, as expected.`
      );
    } catch (error) {
      const newError = new Error(
        `Failed to verify chapter presence in story: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Deletes a chapter from a story.
   * @param {string} chapterName - The name of the chapter.
   * @param {string} storyName - The name of the story.
   */
  async deleteChapterFromStory(
    chapterName: string,
    storyName: string,
    topicName: string
  ): Promise<void> {
    try {
      await this.openStoryEditor(storyName, topicName);
      await this.waitForPageToFullyLoad();

      const addChapterButtonElement = await this.page.$(addChapterButton);
      if (!addChapterButtonElement) {
        await this.page.waitForSelector(mobileChapterCollapsibleCard);
        const mobileChapterCollapsibleCardElement = await this.page.$(
          mobileChapterCollapsibleCard
        );
        mobileChapterCollapsibleCardElement?.click();
        await this.waitForStaticAssetsToLoad();
      }

      await this.page.waitForSelector(storyEditorNodeSelector);
      const storyEditorNodes = await this.page.$$(storyEditorNodeSelector);

      for (const storyEditorNode of storyEditorNodes) {
        const chapter = await storyEditorNode.$eval(chapterTitleSelector, el =>
          el.textContent ? el.textContent.trim() : ''
        );

        if (chapter === chapterName) {
          await storyEditorNode.waitForSelector(editOptionsSelector);
          const editOptionsButton =
            await storyEditorNode.$(editOptionsSelector);
          if (editOptionsButton) {
            await this.waitForElementToBeClickable(editOptionsButton);
            await editOptionsButton.click();

            await storyEditorNode.waitForSelector(deleteChapterButtonSelector);
            const deleteButton = await storyEditorNode.$(
              deleteChapterButtonSelector
            );
            if (deleteButton) {
              await this.waitForElementToBeClickable(deleteButton);
              await deleteButton.click();
              await this.clickOn(confirmDeleteChapterButton);

              showMessage(
                `Chapter ${chapterName} deleted from the story ${storyName}.`
              );
              return;
            }
          }
        }
      }

      throw new Error(
        `Chapter ${chapterName} not found in story ${storyName} of topic ${topicName}.`
      );
    } catch (error) {
      const newError = new Error(
        `Failed to delete chapter from story: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }
}

export let TopicManagerFactory = (): TopicManager => new TopicManager();
