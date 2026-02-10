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
import {ElementHandle, Page} from 'puppeteer';
import puppeteer from 'puppeteer';

const topicAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;
const curriculumAdminThumbnailImage =
  testConstants.data.curriculumAdminThumbnailImage;

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
const skillsAssignmentSelector = '.e2e-test-skill-assignments';
const discardChangesInMobileNavSelector =
  '.e2e-test-mobile-discard-changes-direct';

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
const removeQuestionConfirmationButtonSelector =
  '.e2e-test-remove-question-confirmation-button';
const questionPreviewTab = '.e2e-test-question-preview-tab';
const questionTextInput = '.e2e-test-question-text-input';
const questionContentSelector = '.e2e-test-conversation-content';
const numericInputInteractionField = '.e2e-test-conversation-input';
const skillNameInputSelector = '.e2e-test-skill-name-input';
const radioInnerCircleSelector = '.mat-radio-inner-circle';
const radioInnerCircleContainerSelector = '.mat-radio-container';
const confirmSkillSelectionButtonSelector =
  '.e2e-test-confirm-skill-selection-button';
const questionTextSelector = '.e2e-test-question-text';

const navigationDropdown = '.e2e-test-mobile-skill-nav-dropdown-icon';
const mobilePreviewTab = '.e2e-test-mobile-preview-tab';
const mobileSkillQuestionTab = '.e2e-test-mobile-questions-tab';

const newChapterTitleField = 'input.e2e-test-new-chapter-title-field';
const newChapterExplorationIdField = 'input.e2e-test-chapter-exploration-input';
const newChapterPhotoBoxButton =
  '.e2e-test-chapter-input-thumbnail .e2e-test-photo-button';
const createChapterButton = 'button.e2e-test-confirm-chapter-creation-button';
const newChapterErrorMessageSelector =
  '.acceptance-restricted-interaction-error';

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
const misconceptionListSelector =
  '.oppia-skill-misconception-card-preview-list';
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
const addPrerequisiteSkillMobileButtonSelector =
  '.e2e-test-mobile-add-prerequisite-skill';
const addPrerequisiteSkillInSkillEditorButton =
  '.e2e-test-add-prerequisite-skill-in-skill-editor-button';
const togglePrerequisiteSkillsDropdown =
  '.e2e-test-toggle-prereq-skills-dropdown';
const toggleSkillRubricsDropdown = '.e2e-test-toggle-rubrics-dropdown';
const addAcquiredSkillButton = '.e2e-test-add-acquired-skill';
const mobileCollapsibleCardHeaderSelector =
  '.oppia-mobile-collapsible-card-header';
const mobileStoryDropdown = '.e2e-test-story-dropdown';
const confirmDeleteChapterButton = '.e2e-test-confirm-delete-chapter-button';

const questionContainerSelector = '.e2e-test-skill-questions-container';
const skillPreviewContainerSelector = '.e2e-test-skill-preview-container';
const topicEditorContainerSelector = '.e2e-test-topic-editor-container';
const topicEditorMainTabFormSelector = '.e2e-test-topic-editor-main-tab';
const topicEditorSaveModelSelector = 'oppia-topic-editor-save-modal';
const topicPreviewContainerSelector = '.e2e-test-topic-preview-container';
const subtopicEditorContainerSelector = '.e2e-test-subtopic-editor-container';
const subtopicPreviewContainerSelector = '.e2e-test-subtopic-preview-container';
const skillEditorContainer = '.e2e-test-skill-editor-container';
const conceptCardPreviewModelSelector = '.e2e-test-concept-card-preview-modal';
const skillEditorCollapsibleCardSelector =
  '.e2e-test-skill-editor-collapsible-card';
const storyEditorContainerSelector = '.e2e-test-story-editor';
const chapterEditorContainerSelector = '.e2e-test-chapter-editor';
const chapterPreviewContainerSelector = '.e2e-test-thumbnail-container';
const multiSelectionInputChipSelector = '.e2e-test-multi-selection-chip';

const subtopicExpandHeaderSelector = '.e2e-test-show-subtopics-list';
const mobileSubtopicContainerSelector = '.e2e-test-mobile-subtopic-content';
const addSkillButton = 'button.e2e-test-add-skill-button';
const skillNameInput = '.e2e-test-skill-name-input';
const skillItem = '.e2e-test-skills-list-item';
const skillSelectionItemSelector = '.e2e-test-skill-selection-item';
const confirmSkillButton = '.e2e-test-confirm-skill-selection-button';
const deleteSkillButton = 'i.skill-delete-button';
const mobileToggleSkillCard = '.e2e-test-toggle-skill-card';
const removeSkillModalHeaderSelector =
  '.e2e-test-delete-state-skill-modal-header';
const addMisconceptionHeaderSelector =
  '.e2e-test-oppia-misconception-card-header';
const unsavedChangesWarningModalSelector =
  '.e2e-test-unsaved-changes-info-modal';
const staleTabWarningModalSelector = '.e2e-test-stale-tab-info-modal';
const mobileSaveTopicDropdown =
  'div.navbar-mobile-options .e2e-test-mobile-save-topic-dropdown';
const mobilePublishTopicButton =
  'div.navbar-mobile-options .e2e-test-mobile-publish-topic-button';
const publishTopicButton = 'button.e2e-test-publish-topic-button';
const topicAndSkillDashboardSelector = '.e2e-test-topics-and-skills-dashboard';
const skillEditorSelector = '.e2e-test-skill-editor';

const topicAndSkillsOptionInProfileMenu =
  '.e2e-test-topics-and-skills-dashboard-link';
const topicAndSkillsDashboardPageSelector =
  '.e2e-test-topics-and-skills-dashboard';
const navbarBreadcrumbSelector = '.e2e-test-navbar-breadcrumb';
const resetTopicFilterButtonSelector = '.e2e-test-topic-filter-reset';
const mobileTopicFilterResetSelector = '.e2e-test-mobile-topic-filter-reset';

const floatTextField = '.e2e-test-rule-details .e2e-test-float-form-input';
const solutionFloatTextField =
  'oppia-add-or-update-solution-modal .e2e-test-float-form-input';
const textStateEditSelector = 'div.e2e-test-state-edit-content';
const saveContentButton = 'button.e2e-test-save-state-content';
const createQuestionButton = 'div.e2e-test-create-question';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const interactionNumberInputButton =
  'div.e2e-test-interaction-tile-NumericInput';
const interactionNameDiv = 'div.oppia-interaction-tile-name';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const responseRuleDropdown =
  'oppia-rule-type-selector.e2e-test-answer-description';
const equalsRuleButtonText = 'is equal to ... ';
const answersInGroupAreCorrectToggle =
  'input.e2e-test-editor-correctness-toggle';
const saveResponseButton = 'button.e2e-test-add-new-response';
const defaultFeedbackTab = 'a.e2e-test-default-response-tab';
const openOutcomeFeedBackEditor = 'div.e2e-test-open-outcome-feedback-editor';
const saveOutcomeFeedbackButton = 'button.e2e-test-save-outcome-feedback';
const openAnswerGroupFeedBackEditor = 'i.e2e-test-open-feedback-editor';
const addHintButton = 'button.e2e-test-oppia-add-hint-button';
const saveHintButton = 'button.e2e-test-save-hint';
const addSolutionButton = 'button.e2e-test-oppia-add-solution-button';
const answerTypeDropdown = 'select.e2e-test-answer-is-exclusive-select';
const submitAnswerButton = 'button.e2e-test-submit-answer-button';
const submitSolutionButton = 'button.e2e-test-submit-solution-button';
const saveQuestionButton = 'button.e2e-test-save-question-button';

// Preview tab of the topic editor.
const previewSubtabClass = 'e2e-test-preview-subtab';

// Topic Editor > Questions Tab.
const skillSelectInQuestionTabSelector =
  '.e2e-test-select-skill-dropdown mat-select';
const addQuestionButtonSelector = '.e2e-test-create-question-button';

// Story Editor.
const storyTitleInStoryEditorSelector = '.e2e-test-story-title-field';
const storyDescriptionInStoryEditorSelector =
  '.e2e-test-story-description-field';
const storyMetaTagContentInStoryEditorSelector =
  '.e2e-test-story-meta-tag-content-field';
const storyUrlFragmentInStoryEditorSelector = '.e2e-test-url-fragment-field';

// Chapter Editor.
const prerequisiteSkillSelector =
  '.e2e-test-prerequisite-skill-description-card';
const prerequisiteSkillMobileSelector =
  '.e2e-test-mobile-prerequisite-skill-description-card';
const aquiredSkillSkillSelector = '.e2e-test-acquired-skill-description-card';
const aquiredSkillSkillMobileSelector =
  '.e2e-test-mobile-acquired-skill-description-card';

// Other Selectors.
const activeTabSelector = '.e2e-test-active-tab';
const storyRowSelector = 'tr.e2e-test-story-list-item';
const thumbnailDescriptionSelector = '.e2e-test-thumbnail-description';
const thumbnailTitleSelector = '.e2e-test-thumbnail-title';
const questionEditorContainer = '.e2e-test-question-editor-container';
const confirmSkillDificultyButton =
  'button.e2e-test-confirm-skill-difficulty-button';
const skillSelectionModalSelector = '.e2e-test-skill-container';
const saveSubtopicExplanationButtonSelector =
  '.e2e-test-save-subtopic-content-button';
const noSkillsPresentMessageSelector = '.e2e-test-no-skills-present-message';
const expandStoryHeaderSelector =
  '.e2e-test-mobile-stories-collapsible-card-header';
const addNewStoryButtonSelector = '.e2e-test-create-story-button';
const skillEditOptionsContainerSelector =
  '.e2e-test-skill-edit-options-container';
const navigationContainerSelector = '.e2e-test-mobile-navigation-bar-container';
const responseGroupDiv = '.e2e-test-response-tab';
const toggleResponseTab = '.e2e-test-response-tab-toggle';
const misconceptionTitle = '.e2e-test-misconception-title';
const activeTabClass = 'e2e-test-active-tab';
const previewQuestionSelector = '.e2e-test-preview-question';
const toggleSkillEditOptionsButton =
  'div.e2e-test-mobile-toggle-skill-nav-dropdown-icon';

export class TopicManager extends BaseUser {
  /**
   * Closes navigation in mobile view.
   */
  async closeNavigationInMobileView(): Promise<void> {
    if (!this.isViewportAtMobileWidth()) {
      showMessage('Skipped: Close Navigation in Mobile View');
      return;
    }

    // Close skill edit options dropdown.
    if (await this.isElementVisible(skillEditOptionsContainerSelector)) {
      const elements = await this.page.$$(toggleSkillEditOptionsButton);
      await this.clickOnElement(elements[1]);
      await this.expectElementToBeVisible(
        skillEditOptionsContainerSelector,
        false
      );
    }

    // Close navigation bar.
    if (await this.isElementVisible(navigationContainerSelector)) {
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      await this.expectElementToBeVisible(navigationContainerSelector, false);
    }
  }

  /**
   * Resets the topic filter in Topic and Skills Dashboard.
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

    // Post-check: Ensure all fields are resetted.
    await this.expectTextContentToBe(
      `${sortDropdownSelector} .mat-select-value-text`,
      'Most Recently Updated'
    );
    if (await this.isElementVisible(topicStatusDropdownSelector, true, 5000)) {
      await this.expectTextContentToBe(
        `${topicStatusDropdownSelector} .mat-select-value-text`,
        'All'
      );
    }
    if (await this.isElementVisible(classroomDropdownSelector)) {
      await this.expectTextContentToBe(
        `${classroomDropdownSelector} .mat-select-min-line`,
        'Classrooms'
      );
    }
    if (await this.isElementVisible(skillStatusDropdownSelector)) {
      await this.expectTextContentToBe(
        `${skillStatusDropdownSelector} .mat-select-value-text`,
        'All'
      );
    }
  }

  /**
   * Clicks on Topics and Skills Dashboard option in the profile menu.
   * It does not open the menu.
   */
  async clickOnTopicAndSkillsOptionInProfileMenu(): Promise<void> {
    await this.expectElementToBeVisible(topicAndSkillsOptionInProfileMenu);
    await this.clickOnElementWithSelector(topicAndSkillsOptionInProfileMenu);
    await this.expectElementToBeVisible(topicAndSkillsDashboardPageSelector);
  }

  /**
   * Checks if the breadcrumb in the navbar contains the given text.
   * @param text The text to check for.
   */
  async expectNavbarBreadcrumbToContain(text: string): Promise<void> {
    await this.expectElementToBeVisible(navbarBreadcrumbSelector);
    await this.expectTextContentToContain(navbarBreadcrumbSelector, text);
  }
  /**
   * Checks if we are in topic and skills dashboard.
   */
  async expectToBeInTopicAndSkillsDashboardPage(): Promise<void> {
    await this.expectElementToBeVisible(topicAndSkillDashboardSelector);
  }

  /**
   * Checks if we are in skill editor page.
   * If the skill editor opened in a new tab, switches to that tab.
   * @param context The context in which the skill editor is located.
   */
  async expectToBeInSkillEditorPage(context: Page = this.page): Promise<void> {
    await this.expectElementToBeVisible(skillEditorSelector, true, context);
  }

  /**
   * Navigate to the topic and skills dashboard page.
   */
  async navigateToTopicAndSkillsDashboardPage(): Promise<void> {
    await this.page.bringToFront();
    await this.waitForNetworkIdle();
    await this.goto(topicAndSkillsDashboardUrl);
    await this.expectToBeInTopicAndSkillsDashboardPage();
  }

  /**
   * Checks if the topic name field and topic url field are disabled.
   */
  async expectTopicNameAndTopicURLInputToBeDisabled(): Promise<void> {
    await this.page.waitForFunction(
      (selector1: string, selector2: string) => {
        const element1: HTMLInputElement | null =
          document.querySelector(selector1);
        const element2: HTMLInputElement | null =
          document.querySelector(selector2);
        return element1 && element1.disabled && element2 && element2.disabled;
      },
      {},
      topicNameField,
      topicEditorUrlFragmentField
    );
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
      await this.expectElementToBeVisible(skillQuestionTab);
      await this.clickAndWaitForNavigation(skillQuestionTab, true);
    }

    await this.expectElementToBeVisible(questionContainerSelector);
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
      await this.expectElementToBeVisible(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileOptionsSelector);

      await this.page.waitForSelector(navigationDropdown);
      const navDropdownElements = await this.page.$$(navigationDropdown);
      await this.waitForElementToBeClickable(navDropdownElements[1]);
      await navDropdownElements[1].click();

      await this.page.waitForSelector(mobilePreviewTab);
      await this.clickOnElementWithSelector(mobilePreviewTab);
    } else {
      await this.expectElementToBeVisible(questionPreviewTab);
      await this.page.waitForSelector(questionPreviewTab);
      await this.clickAndWaitForNavigation(questionPreviewTab, true);
    }

    await this.expectElementToBeVisible(skillPreviewContainerSelector);
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
        {timeout: 10000},
        toastMessageSelector,
        expectedMessage
      );
    } catch (error) {
      const actualMessage = await this.page.$eval(toastMessageSelector, el =>
        el.textContent?.trim()
      );

      throw new Error(
        'Text did not match within the specified time.\n' +
          `Actual message: "${actualMessage}"\n` +
          `Expected message: "${expectedMessage}"\n`
      );
    }
  }

  /**
   * Removes the attached skill from the current state card.
   */
  async removeSkillFromState(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(addSkillButton);
      // If the skill menu was collapsed in mobile view.
      if (!element) {
        await this.clickOnElementWithSelector(mobileToggleSkillCard);
      }
    }
    await this.clickOnElementWithSelector(deleteSkillButton);
    await this.clickOnElementWithText('Delete skill');
    await this.expectElementToBeVisible(removeSkillModalHeaderSelector, false);
  }

  /**
   * Adds a particular skill to the current state card.
   * @param skillName - Name of the skill to be linked to state.
   */
  async addSkillToState(skillName: string): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(addSkillButton);
      // If the skill menu was collapsed in mobile view.
      if (!element) {
        await this.clickOnElementWithSelector(mobileToggleSkillCard);
      }
    }
    await this.clickOnElementWithSelector(addSkillButton);
    await this.typeInInputField(skillNameInput, skillName);
    await this.clickOnElementWithSelector(skillItem);
    await this.clickOnElementWithSelector(confirmSkillButton);
    await this.expectPageURLToContain(testConstants.URLs.SkillEditor);
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
    await this.clickOnElementWithSelector(topicsTab);
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

    await this.expectElementToBeVisible(topicEditorContainerSelector);
  }

  /**
   * Checks if we are in topic editor.
   * @param {string} topicName - Optional topic name to check.
   *
   * TODO(#22539): This function has a duplicate in curriculum-admin.ts.
   * To avoid unexpected behavior, ensure that any modifications here are also
   * made in curriculum-admin.ts.
   */
  async expectToBeInTopicEditor(topicName?: string): Promise<void> {
    await this.expectElementToBeVisible(topicEditorMainTabFormSelector);

    if (topicName) {
      await this.expectElementValueToBe(topicNameField, topicName);
    }
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
    await this.expectToBeInTopicEditor();
    if (topicName) {
      await this.clearAllTextFrom(topicNameField);
      await this.typeInInputField(topicNameField, topicName);
      await this.expectElementValueToBe(topicNameField, topicName);
    }
    if (urlFragment) {
      await this.page.waitForSelector(topicEditorUrlFragmentField, {
        visible: true,
      });
      await this.clearAllTextFrom(topicEditorUrlFragmentField);
      await this.page.type(topicEditorUrlFragmentField, urlFragment);
      await this.expectElementValueToBe(
        topicEditorUrlFragmentField,
        urlFragment
      );

      // TODO(#23302): Currently, changing the URL fragment throws some
      // unexpected warnings. Once fixed, remove the three lines below.
      await this.page.keyboard.press('Tab');
      const closeToastMessageButton = 'button.e2e-test-close-toast-warning';
      await this.clickOnElementWithSelector(closeToastMessageButton);
    }
    await this.clearAllTextFrom(updateTopicWebFragmentField);
    await this.typeInInputField(updateTopicWebFragmentField, titleFragments);
    await this.clearAllTextFrom(updateTopicDescriptionField);
    await this.typeInInputField(updateTopicDescriptionField, description);
    await this.expectElementValueToBe(updateTopicDescriptionField, description);

    await this.clickOnElementWithSelector(photoBoxButton);
    await this.page.waitForSelector(photoUploadModal, {visible: true});
    await this.uploadFile(thumbnail);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);
    await this.page.waitForSelector(photoUploadModal, {hidden: true});

    await this.page.waitForSelector(topicMetaTagInput);
    await this.page.focus(topicMetaTagInput);
    await this.clearAllTextFrom(topicMetaTagInput);
    await this.page.type(topicMetaTagInput, metaTags);
    await this.page.keyboard.press('Tab');
    await this.expectElementValueToBe(topicMetaTagInput, metaTags);
  }

  /**
   * Add any number of questions to a particular skill.
   */
  async createQuestionsForSkill(
    skillName: string,
    questionCount: number
  ): Promise<void> {
    for (let i = 0; i < questionCount; i++) {
      await this.addBasicAlgebraQuestionToSkill(skillName);
    }
  }

  /**
   * Click on the create new question button in the skill editor.
   */
  async clickOnCreateNewQuestionButtonInSkillEditor(): Promise<void> {
    // Close navigation bar, as it can block the "Create Question" button.
    if (
      this.isViewportAtMobileWidth() &&
      (await this.isElementVisible(navigationContainerSelector))
    ) {
      await this.closeNavigationInMobileView();
    }

    // Click on "Create Question" button.
    await this.clickOnElementWithSelector(createQuestionButton);
    await this.expectElementToBeVisible(questionEditorContainer);
  }

  /**
   * Create a basic algebra question in the skill editor page.
   */
  async addBasicAlgebraQuestionToSkill(skillName: string): Promise<void> {
    await this.openSkillEditor(skillName);
    await this.clickOnElementWithSelector(createQuestionButton);
    await this.clickOnElementWithSelector(textStateEditSelector);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.typeInInputField(richTextAreaField, 'Add 1+2');
    await this.page.waitForSelector(`${saveContentButton}:not([disabled])`);
    await this.clickOnElementWithSelector(saveContentButton);

    await this.clickOnElementWithSelector(addInteractionButton);
    await this.page.waitForSelector(interactionNumberInputButton, {
      visible: true,
    });
    await this.page.evaluate(interactionNameDiv => {
      const interactionDivs = Array.from(
        document.querySelectorAll(interactionNameDiv)
      );
      const element = interactionDivs.find(
        element => element.textContent?.trim() === 'Number Input'
      ) as HTMLElement;
      if (element) {
        element.click();
      } else {
        throw new Error('Cannot find number input interaction option.');
      }
    }, interactionNameDiv);

    await this.waitForElementToStabilize(saveInteractionButton);
    await this.clickOnElementWithSelector(saveInteractionButton);
    await this.expectModalTitleToBe('Add Response');
    await this.clickOnElementWithSelector(responseRuleDropdown);
    await this.clickOnElementWithText(equalsRuleButtonText);
    await this.typeInInputField(floatTextField, '3');
    await this.clickOnElementWithSelector(answersInGroupAreCorrectToggle);
    await this.clickOnElementWithSelector(openAnswerGroupFeedBackEditor);
    await this.typeInInputField(richTextAreaField, 'Good job!');
    await this.clickOnElementWithSelector(saveResponseButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});

    await this.clickOnElementWithSelector(defaultFeedbackTab);
    await this.clickOnElementWithSelector(openOutcomeFeedBackEditor);
    await this.clickOnElementWithSelector(richTextAreaField);
    await this.typeInInputField(richTextAreaField, 'The answer is 3');
    await this.clickOnElementWithSelector(saveOutcomeFeedbackButton);

    await this.clickOnElementWithSelector(addHintButton);
    await this.page.waitForSelector(modalDiv, {visible: true});
    await this.typeInInputField(richTextAreaField, '3');
    await this.clickOnElementWithSelector(saveHintButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});

    await this.clickOnElementWithSelector(addSolutionButton);
    await this.page.waitForSelector(modalDiv, {visible: true});
    await this.page.waitForSelector(answerTypeDropdown);
    await this.page.select(answerTypeDropdown, 'The only');
    await this.page.waitForSelector(solutionFloatTextField);
    await this.typeInInputField(solutionFloatTextField, '3');
    await this.page.waitForSelector(`${submitAnswerButton}:not([disabled])`);
    await this.clickOnElementWithSelector(submitAnswerButton);
    await this.typeInInputField(richTextAreaField, '1+2 is 3');
    await this.page.waitForSelector(`${submitSolutionButton}:not([disabled])`);
    await this.clickOnElementWithSelector(submitSolutionButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});

    await this.clickOnElementWithSelector(saveQuestionButton);

    await this.waitForNetworkIdle();
    await this.page.waitForSelector(modalDiv, {hidden: true});
  }

  /**
   * Checks if the save question button is enabled.
   */
  async expectSaveQuestionButtonToBeEnabled(): Promise<void> {
    await this.expectElementToBeClickable(saveQuestionButton);
  }

  /**
   * Clicks on "Save" button in the question editor.
   */
  async saveQuestion(): Promise<void> {
    await this.clickOnElementWithSelector(saveQuestionButton);
    await this.expectElementToBeVisible(saveQuestionButton, false);
  }

  /**
   * Save a topic draft.
   * @param {string} topicName - name of the topic to be saved.
   * @param {string} description - description of the topic to be saved.
   */
  async saveTopicDraft(topicName: string, description?: string): Promise<void> {
    await this.page.waitForSelector(modalDiv, {hidden: true});
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileSaveTopicButton);
      await this.page.waitForSelector(topicEditorSaveModelSelector, {
        visible: true,
      });
      await this.typeInInputField(
        saveChangesMessageInput,
        'Test saving topic as curriculum admin.'
      );
      await this.page.waitForSelector(
        `${closeSaveModalButton}:not([disabled])`
      );
      await this.clickOnElementWithSelector(closeSaveModalButton);
      await this.page.waitForSelector(topicEditorSaveModelSelector, {
        hidden: true,
      });
    } else {
      await this.clickOnElementWithSelector(saveTopicButton);
      if (description) {
        await this.typeInInputField(saveChangesMessageInput, description);
        await this.expectElementValueToBe(saveChangesMessageInput, description);
      }
      await this.page.waitForSelector(
        `${closeSaveModalButton}:not([disabled])`
      );
      await this.waitForElementToStabilize(closeSaveModalButton);
      await this.clickOnElementWithSelector(closeSaveModalButton);
      await this.page.waitForSelector(modalDiv, {hidden: true});
    }
  }

  /**
   * Filters topics by status.
   * @param {'Published' | 'Not Published' | 'All'} status - The status to filter by.
   */
  async filterTopicsByStatus(
    status: 'Published' | 'Not Published' | 'All'
  ): Promise<void> {
    try {
      await this.navigateToTopicAndSkillsDashboardPage();
      if (this.isViewportAtMobileWidth()) {
        await this.clickOnElementWithSelector(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(topicStatusDropdownSelector);
      await this.selectOption(topicStatusDropdownSelector, status);

      await this.expectTextContentToBe(
        `${topicStatusDropdownSelector} .mat-select-value-text`,
        status
      );
      showMessage(`Filtered topics by status: ${status}`);
      if (this.isViewportAtMobileWidth()) {
        await this.clickOnElementWithSelector(closeMobileFiltersButton);
      }
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
        await this.clickOnElementWithSelector(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(classroomDropdownSelector);
      await this.selectOption(classroomDropdownSelector, classroom);

      await this.expectTextContentToBe(
        `${classroomDropdownSelector} .mat-select-min-line`,
        classroom
      );
      if (this.isViewportAtMobileWidth()) {
        await this.clickOnElementWithSelector(closeMobileFiltersButton);
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
        await this.clickOnElementWithSelector(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(keywordDropdownSelector);
      await this.clickOnElementWithSelector(keywordDropdownSelector);
      await this.page.waitForSelector(multiSelectionInputSelector);
      await this.typeInInputField(multiSelectionInputSelector, keyword);
      await this.page.keyboard.press('Enter');
      await this.expectTextContentToBe(
        `${multiSelectionInputChipSelector}`,
        // We are checking multi-selection-field components and it has cancel
        // icon (text) within the chip element, so we need to add cancel.
        `${keyword} cancel`
      );
      if (this.isViewportAtMobileWidth()) {
        await this.clickOnElementWithSelector(closeMobileFiltersButton);
      }
      showMessage(`Filtered topics by keyword: ${keyword}`);
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  async expectKeywordsSelectedToBe(keywords: string[]): Promise<void> {
    if (keywords.length === 0) {
      await this.expectElementToBeVisible(
        multiSelectionInputChipSelector,
        false
      );

      return;
    }
    const keywordChips = await this.page.$$eval(
      multiSelectionInputChipSelector,
      chips => chips.map(chip => chip.textContent?.trim())
    );
    expect(keywordChips.length).toBe(keywords.length);

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
   * Sorts topics by a given option.
   * @param {string} sortOption - The option to sort by.
   */
  async sortTopics(
    sortOption:
      | 'Least Recently Updated'
      | 'Most Recently Updated'
      | 'Newly Created'
      | 'Oldest Created'
  ): Promise<void> {
    try {
      await this.navigateToTopicAndSkillsDashboardPage();
      if (this.isViewportAtMobileWidth()) {
        await this.clickOnElementWithSelector(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(sortDropdownSelector);
      await this.selectOption(sortDropdownSelector, sortOption);
      await this.expectTextContentToBe(
        `${sortDropdownSelector} .mat-select-value-text`,
        sortOption
      );
      if (this.isViewportAtMobileWidth()) {
        await this.clickOnElementWithSelector(closeMobileFiltersButton);
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
   * @param {boolean} visible - Whether the topics should be visible.
   */
  async expectFilteredTopics(
    expectedTopics: string[],
    visible: boolean = true
  ): Promise<void> {
    const topicNameSelector = this.isViewportAtMobileWidth()
      ? mobileTopicSelector
      : desktopTopicSelector;
    await this.waitForStaticAssetsToLoad();
    const topicElements = await this.page.$$(topicNameSelector);

    if (expectedTopics.length === 0) {
      throw new Error("Topics list can't be empty");
    }

    const topicNames = await Promise.all(
      topicElements.map(element =>
        this.page.evaluate(el => el.textContent.trim(), element)
      )
    );

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
   * Checks if the topics are in the expected order.
   * @param {string[]} expectedOrder - The expected order of topics.
   */
  async expectFilteredTopicsInOrder(expectedOrder: string[]): Promise<void> {
    const topicNameSelector = this.isViewportAtMobileWidth()
      ? mobileTopicSelector
      : desktopTopicSelector;

    await this.waitForStaticAssetsToLoad();
    await this.page.waitForSelector(topicNameSelector);
    const topicElements = await this.page.$$(topicNameSelector);
    const topicNames = await Promise.all(
      topicElements.map(element =>
        this.page.evaluate(el => el.textContent.trim(), element)
      )
    );
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
   * Toggles the "Show practice tab to learners" in Topic Editor.
   */
  async togglePracticeTabCheckbox(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(subtopicExpandHeaderSelector);
    }
    try {
      await this.page.waitForSelector(practiceTabToggle);
      const practiceTabToggleElement = await this.page.$(practiceTabToggle);
      if (!practiceTabToggleElement) {
        throw new Error('Practice tab toggle not found.');
      }
      await this.waitForElementToBeClickable(practiceTabToggleElement);
      await practiceTabToggleElement.click();

      await this.page.waitForFunction(
        (selector: string) => {
          const element = document.querySelector(selector);
          return (element as HTMLInputElement).checked === true;
        },
        {},
        practiceTabToggle
      );
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
      await this.clickOnElementWithText('Subtopics');
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
   * Navigates to preview tab from the topic editor.
   */
  async navigateToTopicPreviewTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      if (!(await this.isElementVisible(mobileNavbarDropdown))) {
        await this.clickOnElementWithSelector(mobileOptionsSelector);
      }
      await this.clickOnElementWithSelector(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(topicMobilePreviewTab);
    } else {
      await this.page.waitForSelector(topicPreviewTab);
      await this.clickOnElementWithSelector(topicPreviewTab);
    }

    await this.expectElementToBeVisible(topicPreviewContainerSelector);
  }

  /**
   * It's a composite function that opens the topic editor for a given topic
   * and navigates to the preview tab.
   * @param {string} topicName - The name of the topic to be opened in the
   *     topic editor.
   */
  async navigateToTopicPreviewTabOfTopic(topicName: string): Promise<void> {
    await this.openTopicEditor(topicName);
    await this.navigateToTopicPreviewTab();
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
    await this.expectElementToBeVisible(skillsTab);
    await this.clickOnElementWithSelector(skillsTab);

    const skillSelector = this.isViewportAtMobileWidth()
      ? mobileSkillSelector
      : desktopSkillSelector;
    const skillsVisible = await this.isElementVisible(skillSelector);
    const noSkillsMessage = await this.isElementVisible(
      noSkillsPresentMessageSelector
    );

    expect(skillsVisible || noSkillsMessage).toBe(true);
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
    await this.clickOnElementWithSelector(skillsTab);
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

    await this.expectElementToBeVisible(skillEditorContainer);
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

    const skillItem = await this.getSkillElementFromSelection(skillName);
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

        await this.waitForElementToStabilize(checkbox);
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
    await this.clickOnElementWithSelector(confirmUnassignSkillButton);

    await this.expectElementToBeVisible(confirmUnassignSkillButton, false);
  }

  /**
   * Select a skill from the list of skills.
   * @param {string} skillName - The name of the skill to select.
   */
  async getSkillElementFromSelection(
    skillName: string
  ): Promise<ElementHandle> {
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

    const skillItem = await this.getSkillElementFromSelection(skillName);
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

    const assignSkillButtonElement =
      await skillItem.waitForSelector(assignSkillButton);
    if (!assignSkillButtonElement) {
      throw new Error('Assign skill button not found');
    }
    await assignSkillButtonElement.click();

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
    await this.clickOnElementWithSelector(confirmMoveButton);

    await this.expectElementToBeVisible(confirmMoveButton, false);
  }

  /**
   * Checks if the skill is visible in the skill selection modal.
   * @param skillName The name of the skill.
   * @param visible Whether the skill should be visible or not.
   */
  async expectSkillInSkillSelectionModalToBeVisible(
    skillName: string,
    visible: boolean = true
  ): Promise<ElementHandle | null> {
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(skillSelectionModalSelector);
    const skillVisible = await this.isElementVisible(
      skillSelectionItemSelector
    );
    if (!skillVisible) {
      if (visible) {
        throw new Error(
          `Skill ${skillName} is not visible in the skill selection modal.`
        );
      } else {
        showMessage(
          `Skill ${skillName} is not visible in the skill selection modal.`
        );
        return null;
      }
    }

    const skillElements = await this.page.$$(skillSelectionItemSelector);
    for (const skillElement of skillElements) {
      const foundSkillName = await this.page.evaluate(
        (skillElement: Element) => skillElement.textContent?.trim(),
        skillElement
      );
      if (skillName === foundSkillName) {
        if (visible) {
          return skillElement;
        } else {
          throw new Error(
            `Skill ${skillName} is visible in the skill selection modal.`
          );
        }
      }
    }

    if (visible) {
      throw new Error(
        `Skill ${skillName} is not visible in the skill selection modal.`
      );
    } else {
      showMessage(
        `Skill ${skillName} is not visible in the skill selection modal.`
      );
      return null;
    }
  }

  /**
   * Fills the skill name input field with the given skill name.
   * @param {string} skillName - The skill name to fill the input field with.
   */
  async fillSkillNameInSkillSelectionModal(skillName: string): Promise<void> {
    await this.expectElementToBeVisible(skillNameInputSelector);
    await this.typeInInputField(skillNameInputSelector, skillName);
    await this.expectElementValueToBe(skillNameInputSelector, skillName);
  }

  /**
   * Selects the skill with the given name and clicks on the "Done" button in
   * the Skill Selection Modal.
   * @param {string} skillName - The name of the skill to select.
   */
  async selectSkillAndClickOnDoneInSkillSelectionModal(
    skillName: string
  ): Promise<void> {
    const skillElement =
      await this.expectSkillInSkillSelectionModalToBeVisible(skillName);

    if (!skillElement) {
      throw new Error(`Skill ${skillName} not found in Skill Selection Modal`);
    }
    const radioInnerCircleSelectorElement = await skillElement.waitForSelector(
      radioInnerCircleContainerSelector
    );

    if (!radioInnerCircleSelectorElement) {
      throw new Error('Radio inner circle selector not found');
    }

    await radioInnerCircleSelectorElement.click();

    await this.clickOnElementWithSelector(confirmSkillSelectionButtonSelector);
    await this.expectElementToBeVisible(
      confirmSkillSelectionButtonSelector,
      false
    );
  }

  /**
   * Filters skills by name and selects the first matching skill.
   *
   * @param {string} skillName - The name of the skill to select.
   */
  async filterAndSelectSkillInSkillSelector(skillName: string): Promise<void> {
    // Searching by skill name.
    await this.fillSkillNameInSkillSelectionModal(skillName);
    await this.selectSkillAndClickOnDoneInSkillSelectionModal(skillName);
  }

  /**
   * Clicks on the merge skill button.
   * @param {string} skillName - The name of the skill to merge.
   */
  async clickOnMergeSkill(skillName: string): Promise<void> {
    const isMobileWidth = this.isViewportAtMobileWidth();
    const skillOptions = isMobileWidth ? mobileSkillsOption : skillEditBox;
    const mergeSkillsButton = isMobileWidth
      ? mergeSkillsButtonMobile
      : mergeSkillsButtonDesktop;

    await this.navigateToTopicAndSkillsDashboardPage();
    await this.navigateToSkillsTab();

    const skillItem1 = await this.getSkillElementFromSelection(skillName);
    if (!skillItem1) {
      throw new Error(`Skill "${skillName}" not found`);
    }

    await this.page.waitForSelector(skillOptions);
    const skillOptionsElement1 = await skillItem1.$(skillOptions);
    if (!skillOptionsElement1) {
      throw new Error(
        `Skill options element not found for skill "${skillName}"`
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
  }

  /**
   * Function to merge two skills with the given names.
   * @param {string} skillName1 - The name of the first skill to merge.
   * @param {string} skillName2 - The name of the second skill to merge.
   */
  async mergeSkills(skillName1: string, skillName2: string): Promise<void> {
    await this.clickOnMergeSkill(skillName1);
    const skillNameInputSelectorElement = await this.page.$(
      skillNameInputSelector
    );
    if (!skillNameInputSelectorElement) {
      throw new Error('Skill name input selector not found');
    }
    // Searching by skill name.
    await this.filterAndSelectSkillInSkillSelector(skillName2);
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

        await this.page.waitForSelector(
          removeQuestionConfirmationButtonSelector
        );
        const removeQuestionConfirmationButtonElement = await this.page.$(
          removeQuestionConfirmationButtonSelector
        );
        if (!removeQuestionConfirmationButtonElement) {
          throw new Error('Remove question confirmation button not found');
        }

        await this.waitForElementToBeClickable(
          removeQuestionConfirmationButtonElement
        );
        await removeQuestionConfirmationButtonElement.click();

        await this.expectElementToBeVisible(
          removeQuestionConfirmationButtonSelector,
          false
        );
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
    await this.expectElementToBeVisible(questionTextInput);
    await this.clearAllTextFrom(questionTextInput);
    await this.typeInInputField(questionTextInput, questionText);
    await this.page.keyboard.press('Enter');

    await this.expectElementValueToBe(questionTextInput, questionText);
  }

  /**
   * Function to expect the preview question text of the question previewed.
   * @param {string} expectedText - The expected question text.
   */
  async expectPreviewQuestionText(expectedText: string): Promise<void> {
    await this.expectTextContentToContain(
      questionContentSelector,
      expectedText
    );
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
        await this.clickOnElementWithSelector(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(skillStatusDropdownSelector);
      await this.selectOption(skillStatusDropdownSelector, status);
      await this.expectTextContentToBe(
        `${skillStatusDropdownSelector} .mat-select-value-text`,
        status
      );
      if (this.isViewportAtMobileWidth()) {
        await this.clickOnElementWithSelector(closeMobileFiltersButton);
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
        await this.clickOnElementWithSelector(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(keywordDropdownSelector);
      await this.clickOnElementWithSelector(keywordDropdownSelector);
      await this.page.waitForSelector(multiSelectionInputSelector);
      await this.typeInInputField(multiSelectionInputSelector, keyword);
      await this.page.keyboard.press('Enter');
      await this.expectTextContentToBe(
        `${multiSelectionInputChipSelector}`,
        // We are checking multi-selection-field components and it has cancel
        // icon (text) within the chip element, so we need to add cancel.
        `${keyword} cancel`
      );

      if (this.isViewportAtMobileWidth()) {
        await this.clickOnElementWithSelector(closeMobileFiltersButton);
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
        await this.clickOnElementWithSelector(displayMobileFiltersButton);
      }
      await this.page.waitForSelector(sortDropdownSelector);
      await this.selectOption(sortDropdownSelector, sortOption);
      await this.expectTextContentToBe(
        `${sortDropdownSelector} .mat-select-value-text`,
        sortOption
      );
      if (this.isViewportAtMobileWidth()) {
        await this.clickOnElementWithSelector(closeMobileFiltersButton);
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
    await this.expectElementToBeVisible(selector);
    await this.clickOnElementWithSelector(selector);
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

        await this.expectElementToBeVisible(filterOptionSelector, false);
        return;
      }
    }

    throw new Error(`Option ${optionText} not found.`);
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
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
    const paginationValue = await this.page.$eval(
      itemsPerPageDropdown,
      el => (el as HTMLSelectElement).value
    );
    if (paginationValue !== itemsPerPage.toString()) {
      throw new Error(
        `Expected pagination value to be "${itemsPerPage}", but it was "${paginationValue}"`
      );
    }
    showMessage(`Paginator adjusted to show ${itemsPerPage} items per page.`);
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
      await this.clickOnElementWithSelector(nextPageButtonSelector);

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
   * @param {boolean} visible - Whether the skills should be visible or not.
   */
  async expectFilteredSkills(
    expectedSkills: string[],
    visible: boolean = true
  ): Promise<void> {
    const skillNameSelector = this.isViewportAtMobileWidth()
      ? mobileSkillSelector
      : desktopSkillSelector;
    await this.waitForStaticAssetsToLoad();

    await this.page.waitForFunction(
      (selector: string, skills: string[], visible: boolean) => {
        const skillElements = document.querySelectorAll(selector);
        const foundSkills = Array.from(skillElements).map(el =>
          el.textContent?.trim()
        );

        for (const skill of skills) {
          if (foundSkills.includes(skill) !== visible) {
            return false;
          }
        }

        return true;
      },
      {},
      skillNameSelector,
      expectedSkills,
      visible
    );

    showMessage('Filtered skills match the expected skills.');
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
      await this.clickOnElementWithSelector(nextPageButtonSelector);

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
      if (!(await this.isElementVisible(addButtonSelector))) {
        await this.clickOnElementWithSelector(addMisconceptionHeaderSelector);
      }
      await this.page.waitForSelector(addButtonSelector);
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
    await this.clickOnElementWithSelector(addButtonSelector);
    await this.typeInInputField(nameFieldSelector, misconceptionName);
    await this.typeInInputField(rteSelector, notes);
    const rteElements = await this.page.$$(rteSelector);
    await rteElements[1].type(feedback);
    if (optional) {
      await this.clickOnElementWithSelector(optionalMisconceptionToggle);
    }
    await this.clickOnElementWithSelector(saveMisconceptionButton);

    await this.expectElementToBeVisible(saveMisconceptionButton, false);
  }

  /**
   * Verifies if a misconception is present on the page.
   * @param {string} misconceptionName - The name of the misconception to verify.
   * @param {boolean} isPresent - Whether the misconception is expected to be present.
   */
  async verifyMisconceptionPresence(
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
            await this.clickOnElementWithSelector(
              confirmDeleteMisconceptionButton
            );

            await this.expectElementToBeVisible(
              confirmDeleteMisconceptionButton,
              false
            );
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
      await this.expectElementToBeVisible(editConceptCardSelector);
      await this.clickOnElementWithSelector(editConceptCardSelector);
      await this.clearAllTextFrom(rteSelector);
      await this.typeInInputField(rteSelector, updatedMaterial);
      await this.clickOnElementWithSelector(saveConceptCardSelector);
      await this.expectElementToBeVisible(saveConceptCardSelector, false);
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
    if (this.isViewportAtMobileWidth()) {
      await this.expandHeaderInMobile('Prerequisite Skills');
    }

    const selector = this.isViewportAtMobileWidth()
      ? addPrerequisiteSkillMobileButtonSelector
      : addPrerequisiteSkillButton;
    await this.clickOnElementWithSelector(selector);
    await this.filterAndSelectSkillInSkillSelector(skillName);
  }

  /**
   * Adds a prerequisite skill to a skill in skill chapter.
   * @param {string} skillName - The name of the skill to add.
   */
  async addPrerequisiteSkillInSkillEditor(skillName: string): Promise<void> {
    try {
      if (this.isViewportAtMobileWidth()) {
        await this.page.waitForSelector(togglePrerequisiteSkillsDropdown);
        await this.clickOnElementWithSelector(togglePrerequisiteSkillsDropdown);
      }
      await this.clickOnElementWithSelector(
        addPrerequisiteSkillInSkillEditorButton
      );
      await this.typeInInputField(skillNameInputSelector, skillName);

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
      await this.clickOnElementWithSelector(
        confirmSkillSelectionButtonSelector
      );

      await this.expectElementToBeVisible(
        confirmSkillSelectionButtonSelector,
        false
      );
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

      await this.page.waitForFunction(
        (selector: string, skillName: string) => {
          const skillElements = document.querySelectorAll(selector);
          for (const skillElement of Array.from(skillElements)) {
            const skillNameElement = skillElement.querySelector('span');
            if (skillNameElement?.textContent?.trim() === skillName) {
              return false;
            }
          }
          return true;
        },
        {},
        `${skillDescriptionCardSelector} a`,
        skillName
      );

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
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(toggleSkillRubricsDropdown);
    }
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
    await this.clickOnElementWithText(' + ADD EXPLANATION FOR DIFFICULTY ');
    await this.typeInInputField(rteSelector, explanation);
    await this.clickOnElementWithSelector(saveRubricExplanationButton);

    await this.expectElementToBeVisible(saveRubricExplanationButton, false);
  }

  /**
   * Publishes an updated skill.
   * @param {string} updateMessage - The update message.
   */
  async publishUpdatedSkill(updateMessage: string): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      if (
        !(await this.isElementVisible(navigationContainerSelector, true, 5000))
      ) {
        await this.expectElementToBeVisible(mobileOptionsSelector);
        await this.clickOnElementWithSelector(mobileOptionsSelector);
      }
      // The mobile view has 2 instances of the element, from which
      // the first one is inapplicable here.
      const elems = await this.page.$$(mobileSkillNavToggle);
      await elems[1].click();
      await this.page.waitForSelector(mobileSaveOrPublishSkillSelector, {
        visible: true,
      });
      await this.clickOnElementWithSelector(mobileSaveOrPublishSkillSelector);
    } else {
      await this.waitForStaticAssetsToLoad();
      await this.page.waitForSelector(saveOrPublishSkillSelector, {
        visible: true,
      });
      await this.clickOnElementWithSelector(saveOrPublishSkillSelector);
    }

    await this.page.waitForSelector(commitMessageInputSelector, {
      visible: true,
    });
    await this.typeInInputField(commitMessageInputSelector, updateMessage);
    await this.page.waitForSelector(closeSaveModalButtonSelector, {
      visible: true,
    });
    await this.clickOnElementWithSelector(closeSaveModalButtonSelector);
    await this.expectToastMessageToBe('Changes Saved.');
    showMessage('Skill updated successful');
  }

  /**
   * Previews a concept card.
   */
  async previewConceptCard(): Promise<void> {
    await this.clickOnElementWithText(' Preview Concept Card ');
    await this.expectElementToBeVisible(conceptCardPreviewModelSelector);
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
    if (!this.isViewportAtMobileWidth()) {
      showMessage('Skipping opening dropdowns since we are in desktop view');
    }
    await this.clickOnElementWithText('Misconceptions');
    await this.clickOnElementWithText(' Prerequisite Skills ');
    await this.clickOnElementWithText('Rubrics');

    // Post Check: As aim of function is to open all mobile dropdowns, we are checking number of mobile collapsible cards.
    const mobileCollapsibleCards = await this.page.$$(
      skillEditorCollapsibleCardSelector
    );

    if (!mobileCollapsibleCards || mobileCollapsibleCards.length < 5) {
      throw new Error('Failed to open all mobile dropdowns');
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
        visible: true,
      });
      await this.clearAllTextFrom(subtopicUrlFragmentField);
      await this.page.type(subtopicUrlFragmentField, urlFragment);
    }

    await this.clickOnElementWithSelector(editSubtopicExplanationSelector);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.clearAllTextFrom(richTextAreaField);
    await this.typeInInputField(richTextAreaField, explanation);
    await this.clickOnElementWithSelector(
      saveSubtopicExplanationButtonSelector
    );

    // Update the thumbnail if it is provided.
    if (thumbnail) {
      await this.clickOnElementWithSelector(subtopicPhotoBoxButton);
      await this.page.waitForSelector(photoUploadModal, {visible: true});
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
      (selector: string, subtopicName: string, present: boolean) => {
        const subtopicsElements = document.querySelectorAll(selector);
        const subtopics = Array.from(subtopicsElements).map(
          (el: Element) => el.textContent?.trim() || ''
        );
        return subtopics.includes(subtopicName) === present;
      },
      {timeout: 10000},
      subtopicTitleSelector,
      subtopicName,
      shouldExist
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
      await this.clickOnElementWithSelector(reassignSkillButton);

      await this.page.waitForSelector(subtopicAssignmentContainer, {
        visible: true,
      });
      await this.page.waitForSelector(editIcon);
      await this.waitForStaticAssetsToLoad();
      await this.page.evaluate(selector => {
        document.querySelector(selector).click();
      }, editIcon);

      await this.page.waitForSelector(renameSubtopicField);
      await this.typeInInputField(renameSubtopicField, newSubtopicName);

      await this.page.waitForSelector(saveReassignments);
      await this.clickOnElementWithSelector(saveReassignments);

      await this.page.waitForSelector(saveRearrangeSkills);
      await this.clickOnElementWithSelector(saveRearrangeSkills);

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

  async expectSaveStoryButtonToBeDisabled(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const isMobileSaveButtonVisible = await this.isElementVisible(
        mobileSaveStoryChangesButton
      );
      if (!isMobileSaveButtonVisible) {
        await this.clickOnElementWithSelector(mobileOptionsSelector);
      }
    }
    await this.page.waitForFunction(
      (selector: string) => {
        const element = document.querySelector(selector);
        return (element as HTMLButtonElement)?.disabled === true;
      },
      {},
      this.isViewportAtMobileWidth()
        ? mobileSaveStoryChangesButton
        : saveStoryButton
    );
  }

  /**
   * Save a story as a topic manager.
   */
  async saveStoryDraft(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const isMobileSaveButtonVisible = await this.isElementVisible(
        mobileSaveStoryChangesButton
      );
      if (!isMobileSaveButtonVisible) {
        await this.clickOnElementWithSelector(mobileOptionsSelector);
      }
      await this.clickOnElementWithSelector(mobileSaveStoryChangesButton);
    } else {
      await this.clickOnElementWithSelector(saveStoryButton);
    }
    await this.typeInInputField(
      saveChangesMessageInput,
      'Test saving story as topic manager.'
    );
    await this.page.waitForSelector(`${closeSaveModalButton}:not([disabled])`);
    await this.clickOnElementWithSelector(closeSaveModalButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});
  }

  /**
   * Opens the story editor for a given story and topic.
   * @param {string} storyName - The name of the story.
   * @param {string} topicName - The name of the topic.
   */
  async openStoryEditor(storyName: string, topicName?: string): Promise<void> {
    // If topic name is given, navigate to topic.
    if (topicName) {
      await this.openTopicEditor(topicName);
    }

    try {
      if (this.isViewportAtMobileWidth()) {
        await this.expectElementToBeVisible(
          mobileCollapsibleCardHeaderSelector
        );
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

          await this.expectElementToBeVisible(storyEditorContainerSelector);
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
        await this.clickOnElementWithSelector(mobileStoryDropdown);
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
        await this.clickOnElementWithSelector(mobileStoryDropdown);
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
              await this.clickOnElementWithSelector(confirmStoryDeletionButton);
              await this.expectElementToBeVisible(
                confirmStoryDeletionButton,
                false
              );
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
   * Create a chapter for a certain story.
   */
  async addChapterWithoutSaving(
    chapterName: string,
    explorationId: string,
    storyName: string,
    topicName: string
  ): Promise<void> {
    await this.openStoryEditor(storyName, topicName);

    if (this.isViewportAtMobileWidth()) {
      await this.waitForStaticAssetsToLoad();
      const addChapterButtonElement = await this.page.$(addChapterButton);
      if (!addChapterButtonElement) {
        await this.clickOnElementWithSelector(mobileChapterCollapsibleCard);
      }
    }
    await this.clickOnElementWithSelector(addChapterButton);
    await this.typeInInputField(newChapterTitleField, chapterName);
    await this.typeInInputField(newChapterExplorationIdField, explorationId);

    await this.clickOnElementWithSelector(newChapterPhotoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {hidden: true});
  }

  /**
   * Click on save new chapter button.
   */
  async clickOnSaveNewChapterButton(): Promise<void> {
    await this.expectElementToBeVisible(createChapterButton);
    await this.clickOnElementWithSelector(createChapterButton);

    const saveChapterButtonHidden = await this.isElementVisible(
      createChapterButton,
      false
    );
    const errorSpanShown = await this.isElementVisible(
      newChapterErrorMessageSelector
    );
    if (saveChapterButtonHidden || errorSpanShown) {
      return;
    }
    throw new Error(
      'Save chapter button is not visible, nor error span is shown.'
    );
  }

  /**
   * Expect create new chapter to have error
   */
  async expectNewChapterErrorSpan(errorSpan: string): Promise<void> {
    await this.page.waitForSelector(newChapterErrorMessageSelector);

    const errorSpanElement = await this.page.$(newChapterErrorMessageSelector);

    const errorMessage = await this.page.evaluate(
      el => el.textContent.trim(),
      errorSpanElement
    );

    if (!errorMessage.startsWith(errorSpan)) {
      showMessage(errorMessage);
      showMessage(errorSpan);
      throw new Error(
        `Expected error message to be ${errorSpan} but found ${errorMessage}`
      );
    }

    showMessage(`Found expected error message: ${errorMessage}`);
  }

  /**
   * Opens the chapter editor for a given chapter, story, and topic.
   * @param {string} chapterName - The name of the chapter.
   * @param {string} storyName - The name of the story.
   * @param {string} topicName - The name of the topic.
   */
  async openChapterEditor(
    chapterName: string,
    storyName?: string,
    topicName?: string
  ): Promise<void> {
    try {
      if (storyName) {
        await this.openStoryEditor(storyName, topicName);
      }
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
          await this.expectElementToBeVisible(chapterEditorContainerSelector);
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
    await this.typeInInputField(chapterTitleField, chapterName);
    await this.typeInInputField(chapterDescriptionField, description);

    await this.clearAllTextFrom(chapterExplorationIdField);
    await this.typeInInputField(chapterExplorationIdField, explorationId);
    await this.clickOnElementWithSelector(saveExplorationIDButton);

    await this.clickOnElementWithSelector(chapterPhotoBoxButton);
    await this.clickOnElementWithSelector(resetChapterThumbnailButton);
    await this.uploadFile(thumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);
    await this.expectElementToBeVisible(uploadPhotoButton, false);
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

    await this.expectElementToBeVisible(chapterPreviewContainerSelector);
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
    await this.scrollToBottomOfPage();
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
    await this.filterAndSelectSkillInSkillSelector(skillName);
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
              await this.clickOnElementWithSelector(confirmDeleteChapterButton);

              await this.expectElementToBeVisible(
                confirmDeleteChapterButton,
                false
              );

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

  /**
   * Check if the save changes button is enabled or disabled in topic editor.
   * @param {'enabled' | 'disabled'} status - The status to check.
   */
  async expectSaveChangesButtonInTopicEditorToBe(
    status: 'enabled' | 'disabled'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      await this.page.waitForFunction(
        (selector: string, enabled: boolean) => {
          const element = document.querySelector(selector);
          return (
            // Check if the element value is 'Save Changes'. If it is, then
            // there are no changes to be saved and we treat it as disabled.
            !(element?.textContent?.trim() === 'Save Changes') === enabled
          );
        },
        {},
        discardChangesInMobileNavSelector,
        status === 'enabled'
      );
      await this.clickOnElementWithSelector(mobileOptionsSelector);

      await this.expectElementToBeVisible(
        discardChangesInMobileNavSelector,
        false
      );
    } else {
      await this.expectElementToBeVisible(saveTopicButton);
      const buttonIsEnabled = await this.page.$eval(
        saveTopicButton,
        el => !(el as HTMLButtonElement).disabled
      );
      expect(buttonIsEnabled).toBe(status === 'enabled');
    }
  }

  /**
   * Navigates to the tab in the preview tab.
   * @param {'Learn' | 'Practice' | 'Study'} tabName - The name of the tab.
   */
  async navigateToTabInPreview(
    tabName: 'Learn' | 'Practice' | 'Study'
  ): Promise<void> {
    await this.clickOnElementWithText(tabName);

    await this.expectTextContentToBe(
      `.${previewSubtabClass}${activeTabSelector}`,
      tabName
    );
  }

  /**
   * Checks if the save changes button is enabled or disabled in the skill editor.
   * @param {'enabled' | 'disabled'} status - The status to check.
   */
  async expectSaveChangesInSkillEditorToBe(
    status: 'enabled' | 'disabled'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      if (!this.isElementVisible(navigationContainerSelector, true, 5000)) {
        await this.expectElementToBeVisible(mobileOptionsSelector);
        await this.clickOnElementWithSelector(mobileOptionsSelector);
      }
      await this.page.waitForFunction(
        (selector: string, enabled: boolean) => {
          const element = document.querySelector(selector);
          return (
            // Check if the element value is 'Discard Changes'. If it is, then
            // there are no changes to be saved and we treat it as disabled.
            !(element?.textContent?.trim() === 'Discard Changes') === enabled
          );
        },
        {},
        discardChangesInMobileNavSelector,
        status === 'enabled'
      );
    } else {
      await this.expectElementToBeClickable(
        saveOrPublishSkillSelector,
        status === 'enabled'
      );
    }
  }

  /**
   * Checks if the skill is assigned to the given topics.
   * @param {string} skillName - The name of the skill.
   * @param {string} topicName - The names of the topics, separated by comma.
   */
  async expectSkillAssignedToTopic(
    skillName: string,
    topicName: string
  ): Promise<void> {
    const skillItemSelector = this.isViewportAtMobileWidth()
      ? mobileSkillItemSelector
      : desktopSkillItemSelector;
    const skillDescriptionSelector = this.isViewportAtMobileWidth()
      ? mobileSkillDescriptionSelector
      : desktopSkillDescriptionSelector;

    await this.page.waitForFunction(
      (
        selector: string,
        topicName: string,
        skillElementSelector: string,
        skillDescriptionSelector: string,
        skillName: string
      ) => {
        const elements = document.querySelectorAll(skillElementSelector);
        let skillElement: Element | null = null;
        for (const element of Array.from(elements)) {
          const foundSkillName = element
            .querySelector(skillDescriptionSelector)
            ?.textContent?.trim();
          if (foundSkillName === skillName) {
            skillElement = element;
            break;
          }
        }

        if (!skillElement) {
          return false;
        }

        const element = skillElement.querySelector(selector);
        return element?.textContent?.trim() === topicName;
      },
      {},
      skillsAssignmentSelector,
      topicName,
      skillItemSelector,
      skillDescriptionSelector,
      skillName
    );
  }

  /**
   * Navigates to the tab in the topic editor page.
   * @param {'Preview Tab' | 'Questions Tab'} tabName - The name of the tab.
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
   * @param {string} skillName - The name of the skill to select.
   */
  async selectSkillInQuestionsTab(skillName: string): Promise<void> {
    await this.expectElementToBeVisible(skillSelectInQuestionTabSelector);
    await this.clickOnElementWithSelector(skillSelectInQuestionTabSelector);

    await this.selectMatOption(skillName);
    await this.expectTextContentToBe(
      skillSelectInQuestionTabSelector,
      skillName
    );
  }

  /**
   * Checks if the question is visible in the questions tab.
   * @param {string} question - The question to check.
   */
  async expectQuestionToBeVisible(
    question: string
  ): Promise<ElementHandle<Element>> {
    await this.expectElementToBeVisible(questionTextSelector);

    const questionElements = await this.page.$$(questionTextSelector);
    let requiredQuestionElement: ElementHandle<Element> | null = null;
    for (const questionElement of questionElements) {
      const questionText = await questionElement.evaluate(el =>
        el.textContent?.trim()
      );
      if (questionText === question) {
        requiredQuestionElement = questionElement;
        break;
      }
    }

    if (!requiredQuestionElement) {
      throw new Error(`Question ${question} not found.`);
    }

    showMessage(`Question ${question} is visible.`);
    return requiredQuestionElement;
  }

  async openQuestionEditor(question: string): Promise<void> {
    const questionElement = await this.expectQuestionToBeVisible(question);

    await this.waitForElementToStabilize(questionElement);
    await questionElement.click();
    await this.expectElementToBeVisible(addQuestionButtonSelector, false);
  }

  /**
   * Function to select the difficulty level of the question to be suggested.
   * @param {string} difficulty - The difficulty level of the question.
   */
  async selectQuestionDifficulty(
    difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'
  ): Promise<void> {
    const selector = `.e2e-test-skill-difficulty-${difficulty.toLowerCase()}`;
    await this.expectElementToBeVisible(selector);
    await this.clickOnElementWithSelector(selector);
    await this.clickOnElementWithSelector(confirmSkillDificultyButton);

    await this.expectElementToBeVisible(confirmSkillDificultyButton, false);
  }
  /**
   * Function to select the difficulty level of the question to be suggested.
   * @param {string} difficulty - The difficulty level of the question.
   */
  async selectQuestionDifficultyInQuestionEditor(
    difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'
  ): Promise<void> {
    const difficultyContainer = '.e2e-test-question-difficulty-container';
    const difficultyHeader = '.e2e-test-question-difficulty-header';
    if (
      this.isViewportAtMobileWidth() &&
      !(await this.isElementVisible(difficultyContainer, true, 5000))
    ) {
      await this.clickOnElementWithSelector(difficultyHeader);
      await this.expectElementToBeVisible(difficultyContainer);
    }
    const selector = `.e2e-test-skill-difficulty-${difficulty.toLowerCase()}`;
    await this.expectElementToBeVisible(selector);
    await this.clickOnElementWithSelector(selector);

    await this.page.waitForFunction(
      (selector: string, className: string) => {
        const element = document.querySelector(selector);
        return element && element.classList.contains(className);
      },
      {},
      selector,
      'mat-radio-checked'
    );
  }

  /**
   * Clicks on the add question button in the questions tab.
   */
  async clickOnAddQuestionButton(): Promise<void> {
    await this.expectElementToBeVisible(addQuestionButtonSelector);
    await this.clickOnElementWithSelector(addQuestionButtonSelector);
    await this.expectElementToBeVisible(addQuestionButtonSelector, false);
  }

  /**
   * Checks if the stories list is empty.
   */
  async expectStoriesListToBeEmpty(): Promise<void> {
    await this.expectElementToBeVisible(storyRowSelector, false);
  }

  /**
   * Checks if the stories list contains the given story.
   * @param {string} story - The story to check.
   * @returns {Promise<ElementHandle<Element> | null>} The story row element.
   */
  async expectStoriesListToContain(
    story: string,
    visible: boolean = true
  ): Promise<ElementHandle<Element> | null> {
    // Expand stories view in mobile.
    if (
      this.isViewportAtMobileWidth() &&
      !(await this.isElementVisible(addNewStoryButtonSelector))
    ) {
      await this.clickOnElementWithSelector(expandStoryHeaderSelector);
    }

    const storyListVisible = await this.isElementVisible(storyRowSelector);
    if (!storyListVisible) {
      // If we expected the stories list to be visible, but it was not, then
      // throw an error.
      if (visible) {
        throw new Error('Stories list is not visible');
      }
      // If we expected the stories list to be not visible, and it wasn't, then
      // return null.
      showMessage('Stories list is not visible as expected.');
      return null;
    }

    const storyRows = await this.page.$$(storyRowSelector);

    let foundStoryRow: ElementHandle<Element> | null = null;
    for (const storyRow of storyRows) {
      const storyRowText = await storyRow.$eval('td', el =>
        el.textContent?.trim()
      );
      if (storyRowText === story) {
        foundStoryRow = storyRow;
        break;
      }
    }

    if (!foundStoryRow) {
      if (visible) {
        throw new Error(`Story ${story} not found`);
      } else {
        showMessage(`Story ${story} is not found as expected.`);
        return null;
      }
    }

    if (visible) {
      showMessage(`Story ${story} is found as expected.`);
      return foundStoryRow;
    } else {
      throw new Error(`Story ${story} is found but it shouldn't be.`);
    }
  }

  /**
   * Expects the stale tab info modal to be visible.
   */
  async expectUnsavedChangesStatusInfoModalToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(unsavedChangesWarningModalSelector);
  }

  /**
   * Expects the stale tab info modal to be visible.
   */
  async expectStaleTabInfoModalToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(staleTabWarningModalSelector);
  }

  /**
   * Closes concept card preview by clicking at 10 pixels below preivew modal.
   */
  async closeConceptCardPreview(): Promise<void> {
    await this.expectElementToBeVisible(conceptCardPreviewModelSelector);
    const previewModal = await this.getElementInParent(
      conceptCardPreviewModelSelector
    );
    const boundingBox = await previewModal.boundingBox();
    if (!boundingBox) {
      throw new Error('Bounding box not found.');
    }
    await this.page.mouse.click(
      boundingBox.x,
      boundingBox.y + boundingBox.height + 10
    );
    await this.expectElementToBeVisible(conceptCardPreviewModelSelector, false);
  }

  /**
   * Checks if the question is present in the topic.
   * @param {string} question - The question to check.
   * @param {boolean} contains - Whether the question should be present.
   */
  async expectQuestionToBePresent(
    question: string,
    contains: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(questionTextSelector);

    const questionTexts = await this.page.$$eval(
      questionTextSelector,
      elements => elements.map(element => element.textContent?.trim())
    );

    if (contains) {
      expect(questionTexts).toContain(question);
    } else {
      expect(questionTexts).not.toContain(question);
    }
  }

  /**
   * Deletes a story from the stories list.
   * @param {string} storyName - The name of the story to delete.
   */
  async deleteStory(storyName: string): Promise<void> {
    const storyRow = await this.expectStoriesListToContain(storyName);
    if (!storyRow) {
      throw new Error(`Story ${storyName} not found in stories list.`);
    }

    const deleteButton = await storyRow.waitForSelector(
      deleteStoryButtonSelector
    );
    if (!deleteButton) {
      throw new Error('Delete button not found');
    }

    await this.clickOnElement(deleteButton);
    await this.clickOnElementWithText('Delete Story');
  }

  /**
   * Edits the details of a story.
   * @param {string} title - The new title of the story.
   * @param {string} description - The new description of the story.
   * @param {string} metaTag - The new meta tag of the story.
   * @param {string} urlFragment - The new URL fragment of the story.
   */
  async editStoryDetails(
    title: string,
    description: string,
    metaTag: string,
    urlFragment: string
  ): Promise<void> {
    // Title.
    await this.clearAllTextFrom(storyTitleInStoryEditorSelector);
    await this.typeInInputField(storyTitleInStoryEditorSelector, title);
    await this.expectElementValueToBe(storyTitleInStoryEditorSelector, title);

    // Description.
    await this.clearAllTextFrom(storyDescriptionInStoryEditorSelector);
    await this.typeInInputField(
      storyDescriptionInStoryEditorSelector,
      description
    );
    await this.expectElementValueToBe(
      storyDescriptionInStoryEditorSelector,
      description
    );

    // Meta Tag.
    await this.clearAllTextFrom(storyMetaTagContentInStoryEditorSelector);
    await this.typeInInputField(
      storyMetaTagContentInStoryEditorSelector,
      metaTag
    );
    await this.expectElementValueToBe(
      storyMetaTagContentInStoryEditorSelector,
      metaTag
    );

    // URL Fragment.
    await this.clearAllTextFrom(storyUrlFragmentInStoryEditorSelector);
    await this.typeInInputField(
      storyUrlFragmentInStoryEditorSelector,
      urlFragment
    );
    await this.expectElementValueToBe(
      storyUrlFragmentInStoryEditorSelector,
      urlFragment
    );
  }

  /**
   * Checks if the preview card is visible.
   * @param {string} title - The title of the card.
   * @param {string} description - The description of the card.
   */
  async expectPreviewCardToBeVisible(
    title?: string,
    description?: string
  ): Promise<void> {
    await this.expectElementToBeVisible(chapterPreviewContainerSelector);

    if (title) {
      await this.expectTextContentToBe(thumbnailTitleSelector, title);
    }

    if (description) {
      await this.expectTextContentToBe(
        thumbnailDescriptionSelector,
        description
      );
    }
  }

  /**
   * Checks if the prerequisite skill is visible.
   * @param {string} skillName - The name of the prerequisite skill.
   * @returns {Promise<ElementHandle<Element>>} The prerequisite skill element.
   */
  async expectPrerequisiteSkillToBeVisible(
    skillName: string
  ): Promise<ElementHandle<Element>> {
    const selector = this.isViewportAtMobileWidth()
      ? prerequisiteSkillMobileSelector
      : prerequisiteSkillSelector;
    await this.expectElementToBeVisible(selector);
    const prerequisiteSkillElements = await this.page.$$(selector);

    let prerequisiteSkillElement: ElementHandle<Element> | null = null;
    for (const prerequisiteSkill of prerequisiteSkillElements) {
      const prerequisiteSkillText = await prerequisiteSkill.evaluate(el =>
        el.textContent?.trim()
      );
      if (prerequisiteSkillText === skillName) {
        prerequisiteSkillElement = prerequisiteSkill;
        break;
      }
    }

    if (!prerequisiteSkillElement) {
      throw new Error(`Prerequisite skill ${skillName} not found.`);
    }

    showMessage(`Prerequisite skill ${skillName} is visible.`);
    return prerequisiteSkillElement;
  }

  /**
   * Checks if the aquired skill is visible.
   * @param {string} skillName - The name of the aquired skill.
   * @returns {Promise<ElementHandle<Element>>} The aquired skill element.
   */
  async expectAquiredSkillToBeVisible(
    skillName: string
  ): Promise<ElementHandle<Element>> {
    const selector = this.isViewportAtMobileWidth()
      ? aquiredSkillSkillMobileSelector
      : aquiredSkillSkillSelector;
    await this.expectElementToBeVisible(selector);
    const aquiredSkillElements = await this.page.$$(selector);

    let aquiredSkillElement: ElementHandle<Element> | null = null;
    for (const aquiredSkill of aquiredSkillElements) {
      const aquiredSkillText = await aquiredSkill.evaluate(el =>
        el.textContent?.trim()
      );
      if (aquiredSkillText === skillName) {
        aquiredSkillElement = aquiredSkill;
        break;
      }
    }

    if (!aquiredSkillElement) {
      throw new Error(`Aquired skill ${skillName} not found.`);
    }

    showMessage(`Aquired skill ${skillName} is visible.`);
    return aquiredSkillElement;
  }

  /**
   * It's a composite function that checks if the question preview has the expected name.
   * @param {string} question - The expected question.
   */
  async expectQuestionToPreviewProperly(question: string): Promise<void> {
    await this.expectElementToBeVisible(previewQuestionSelector);
    const questionElements = await this.page.$$(previewQuestionSelector);
    let questionElement: ElementHandle | null = null;
    let questions: string[] = [];
    for (const element of questionElements) {
      const elementContent = await this.page.evaluate(
        (el: Element) => el.textContent?.trim(),
        element
      );

      questions.push(elementContent ?? '');

      if (elementContent?.includes(question)) {
        questionElement = element;
        break;
      }
    }
    if (!questionElement) {
      throw new Error(
        `Can't find question ${question}\n` +
          `Found: "${questions.join('", "')}"`
      );
    }
    await questionElement.click();
    await this.expectPreviewQuestionText(question);
  }

  /**
   * Expands the given header in the mobile viewport.
   * @param {string} header - The header to expand.
   */
  async expandHeaderInMobile(header: 'Prerequisite Skills'): Promise<void> {
    if (!this.isViewportAtMobileWidth()) {
      showMessage('Skipping test as the viewport is not mobile');
      return;
    }

    const simplifiedHeader = header.replace(' ', '-').toLowerCase();
    const headerSelector = `.e2e-test-section-header-${simplifiedHeader}`;
    const bodySelector = `.e2e-test-section-body-${simplifiedHeader}`;

    if (await this.isElementVisible(bodySelector, true, 10000)) {
      showMessage(`Skipping test as the ${header} section is already expanded`);
      return;
    }

    await this.expectElementToBeVisible(headerSelector);
    await this.clickOnElementWithSelector(headerSelector);

    await this.expectElementToBeVisible(bodySelector);
  }

  /**
   * Tag an answer response group with a misconception for a state card.
   * @param responseIndex - The index of the response group to be tagged.
   * @param misconceptionName - The name of the misconception to tag response with.
   * @param isOptional - Whether the misconception is optional or compulsory.
   */
  async tagAnswerGroupWithMisconceptionInQuestionEditor(
    responseIndex: number,
    misconceptionName: string,
    isOptional: boolean
  ): Promise<void> {
    let expectedTitle = !isOptional
      ? misconceptionName
      : `(Optional) ${misconceptionName}`;
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(responseGroupDiv);
      // If the responses were collapsed in mobile view.
      if (!element) {
        await this.clickOnElementWithSelector(toggleResponseTab);
      }
    }
    await this.page.waitForSelector(responseGroupDiv, {
      visible: true,
    });
    let responseTabs = await this.page.$$(responseGroupDiv);

    const responseTab = responseTabs[responseIndex];

    // Check if tab is active.
    const isActive = await responseTab.evaluate(
      (el: Element, className: string) => {
        return el.classList.contains(className);
      },
      activeTabClass
    );

    if (!isActive) {
      await this.clickOnElement(responseTabs[responseIndex]);
    }
    await this.clickOnElementWithText('Tag with misconception');

    await this.page.waitForSelector(misconceptionTitle, {
      timeout: 5000,
      visible: true,
    });
    const misconceptionTitles = await this.page.$$(misconceptionTitle);
    for (const misconceptionTitle of misconceptionTitles) {
      const title = await this.page.evaluate(
        el => el.textContent,
        misconceptionTitle
      );
      if (title.trim() === expectedTitle) {
        await this.waitForElementToStabilize(misconceptionTitle);
        await misconceptionTitle.click();
      }
    }

    await this.clickOnElementWithText('Done');
    await this.expectElementToBeVisible(misconceptionTitle, false);
  }

  /**
   * Publishes a topic draft.
   * @param topicName - Optional. If not provided, the topic editor will be opened.
   *
   * TODO(#22539): This function has a duplicate in curriculum-admin.ts.
   * To avoid unexpected behavior, ensure that any modifications here are also
   * made in curriculum-admin.ts.
   */
  async publishDraftTopic(topicName?: string): Promise<void> {
    if (topicName) {
      await this.openTopicEditor(topicName);
    } else {
      await this.expectToBeInTopicEditor();
    }
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileSaveTopicDropdown);
      await this.page.waitForSelector(mobilePublishTopicButton);
      await this.clickOnElementWithSelector(mobilePublishTopicButton);
      await this.page.waitForSelector(mobilePublishTopicButton, {hidden: true});
    } else {
      await this.clickOnElementWithSelector(publishTopicButton);

      await this.page.waitForSelector(publishTopicButton, {hidden: true});
    }
  }
}

export let TopicManagerFactory = (): TopicManager => new TopicManager();
