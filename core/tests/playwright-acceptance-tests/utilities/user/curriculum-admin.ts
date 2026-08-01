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
 * @fileoverview Curriculum Admin users utility file.
 */

import {Page, ElementHandle, expect} from '@playwright/test';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';
import {TopicManager} from './topic-manager';

const baseURL = testConstants.URLs.BaseURL;
const curriculumAdminThumbnailImage =
  testConstants.data.curriculumAdminThumbnailImage;
const classroomBannerImage = testConstants.data.classroomBannerImage;
const classroomAdminUrl = testConstants.URLs.ClassroomAdmin;
const topicAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;

const richTextAreaField = 'div.e2e-test-rte';

const modalDiv = 'div.modal-content';
const changeSubtopicAssignmentModal =
  '.oppia-change-subtopic-assignment-modal div.modal-content';
const closeSaveModalButton = '.e2e-test-close-save-modal-button';

const photoBoxButton = 'div.e2e-test-photo-button';
const subtopicPhotoBoxButton =
  '.e2e-test-subtopic-thumbnail .e2e-test-photo-button';
const uploadPhotoButton = 'button.e2e-test-photo-upload-submit';
const photoUploadModal = 'edit-thumbnail-modal';

const topicsTab = 'a.e2e-test-topics-tab';
const desktopTopicSelector = 'a.e2e-test-topic-name';
const topicNameField = 'input.e2e-test-new-topic-name-field';
const topicUrlFragmentField =
  '.e2e-test-new-topic-url-fragment-field .e2e-test-url-fragment-field';
const topicWebFragmentField = 'input.e2e-test-new-page-title-fragm-field';
const topicDescriptionField = 'textarea.e2e-test-new-topic-description-field';
const createTopicButton = 'button.e2e-test-confirm-topic-creation-button';
const saveTopicButton = 'button.e2e-test-save-topic-button';
const topicMetaTagInput = '.e2e-test-topic-meta-tag-content-field';

const addSubtopicButton = 'button.e2e-test-add-subtopic-button';
const subtopicTitleField = 'input.e2e-test-subtopic-title-field';
const subtopicUrlFragmentField =
  '.e2e-test-create-new-subtopic .e2e-test-url-fragment-field';
const subtopicDescriptionEditorToggle = 'div.e2e-test-show-schema-editor';
const createSubtopicButton = '.e2e-test-confirm-subtopic-creation-button';
const subtopicNameSelector = '.e2e-test-subtopic-name';
const subtopicReassignHeader = 'div.subtopic-reassign-header';
const assignSubtopicButton = '.e2e-test-assign-subtopic';

const skillsTab = 'a.e2e-test-skills-tab';
const desktopSkillSelector = '.e2e-test-skill-description';
const skillDescriptionField = 'input.e2e-test-new-skill-description-field';
const skillEditorCollapsibleCard = '.e2e-test-skill-editor-collapsible-card';
const skillReviewMaterialHeader = 'div.e2e-test-open-concept-card';
const addSkillButton = 'button.e2e-test-add-skill-button';
const confirmSkillCreationButton =
  'button.e2e-test-confirm-skill-creation-button';

const editSkillItemSelector = 'i.e2e-test-skill-item-edit-btn';
const confirmSkillAssignationButton =
  'button.e2e-test-skill-assign-subtopic-confirm';

const addDiagnosticTestSkillButton =
  'button.e2e-test-add-diagnostic-test-skill';
const diagnosticTestSkillSelector =
  'select.e2e-test-diagnostic-test-skill-selector';
const desktopSkillQuestionTab = '.e2e-test-questions-tab';
const mobileSkillQuestionTab = '.e2e-test-mobile-questions-tab';
const saveChangesMessageInput = 'textarea.e2e-test-commit-message-input';

const mobileOptionsSelector = '.e2e-test-mobile-options-base';
const mobileTopicSelector = 'div.e2e-test-mobile-topic-name a';
const mobileSkillSelector = 'span.e2e-test-mobile-skill-name';

const mobileSaveTopicDropdown =
  'div.navbar-mobile-options .e2e-test-mobile-save-topic-dropdown';
const mobileSaveTopicButton =
  'div.navbar-mobile-options .e2e-test-mobile-save-topic-button';

const createNewClassroomModal = '.e2e-test-create-new-classroom-modal';
const createNewClassroomButton = '.e2e-test-add-new-classroom-config';
const newClassroomNameInputField = '.e2e-test-new-classroom-name';
const newClassroomUrlFragmentInputField =
  '.e2e-test-new-classroom-url-fragment';
const newClassroomFeedbackRecipientInputField =
  '.e2e-test-new-classroom-feedback-recipient';
const saveNewClassroomButton = '.e2e-test-create-new-classroom';
const classroomTileSelector = '.e2e-test-classroom-tile';

const editClassroomConfigButton = '.e2e-test-edit-classroom-config-button';
const closeClassroomConfigButton = '.e2e-cancel-classroom-changes';
const editClassroomCourseDetailsInputField =
  '.e2e-test-update-classroom-course-details';
const editClassroomTeaserTextInputField =
  '.e2e-test-update-classroom-teaser-text';
const editClassroomUrlFragmentInputField = '.e2e-update-classroom-url-fragment';
const editClassroomFeedbackRecipientInputField =
  '.e2e-update-classroom-feedback-recipient';
const editClassroomTopicListIntroInputField =
  '.e2e-test-update-classroom-topic-list-intro';
const classroomThumbnailContainer =
  '.e2e-test-classroom-thumbnail-container .e2e-test-photo-button';
const classroomBannerContainer =
  '.e2e-test-classroom-banner-container .e2e-test-photo-button';
const imageUploaderModal = '.e2e-test-image-uploader-modal';
const openTopicDropdownButton = '.e2e-test-add-topic-to-classroom-button';
const topicDropDownFormField = '.e2e-test-classroom-category-dropdown';
const topicSelector = '.e2e-test-classroom-topic-selector-choice';
const publishClassroomButton =
  '.e2e-test-toggle-classroom-publication-status-btn';
const saveClassroomButton = '.e2e-test-save-classroom-config-button';
const classroomTileNameSpan = '.e2e-test-classroom-tile-name';
const addTopicFormFieldInput =
  '.mat-select-search-input:not(.mat-select-search-hidden)';
const createNewTopicButton = '.e2e-test-create-topic-button';
const createNewTopicMobileButton = '.e2e-test-create-topic-mobile-button';
const enableDiagnosticTestButton =
  '.e2e-test-toggle-diagnostic-test-status-btn';

const addStoryButton = 'button.e2e-test-create-story-button';
const storyTitleField = 'input.e2e-test-new-story-title-field';
const storyUrlFragmentField =
  '.e2e-test-create-new-story-url-fragment-field .e2e-test-url-fragment-field';
const storyDescriptionField = 'textarea.e2e-test-new-story-description-field';
const createStoryButton = 'button.e2e-test-confirm-story-creation-button';
const storyPhotoBoxButton =
  'oppia-create-new-story-modal .e2e-test-photo-button';
const storyMetaTagInput = '.e2e-test-story-meta-tag-content-field';
const publishStoryButton = 'button.e2e-test-publish-story-button';
const unpublishStoryButton = 'button.e2e-test-unpublish-story-button';

const mobileStoryDropdown = '.e2e-test-story-dropdown';
const mobileSaveStoryChangesDropdown =
  'div.navbar-mobile-options .e2e-test-mobile-changes-dropdown';
const mobilePublishStoryButton =
  'div.navbar-mobile-options .e2e-test-mobile-publish-button';

const addChapterButton = 'button.e2e-test-add-chapter-button';

const saveStoryButton = 'button.e2e-test-save-story-button';
const mobileSaveStoryChangesButton =
  'div.navbar-mobile-options .e2e-test-mobile-save-changes';
const newChapterTitleField = 'input.e2e-test-new-chapter-title-field';
const newChapterExplorationIdField = 'input.e2e-test-chapter-exploration-input';
const newChapterPhotoBoxButton =
  '.e2e-test-chapter-input-thumbnail .e2e-test-photo-button';
const mobileChapterCollapsibleCard = '.e2e-test-mobile-add-chapter';
const createChapterButton = 'button.e2e-test-confirm-chapter-creation-button';

const insertWorkedExampleButton = '.cke_button__oppiaworkedexample';
const editWorkedExampleModalQuestionRte =
  '.e2e-test-arg-editor-inner-0 .e2e-test-rte';
const editWorkedExampleModalAnswerRte =
  '.e2e-test-arg-editor-inner-1 .e2e-test-rte';
const rteComponentSaveButton = '.e2e-test-close-rich-text-component-editor';

const classroomTopicBoxSelector = '.e2e-test-classroom-topic-box';
const classroomTopicNameSelector = '.e2e-test-classroom-topic-name';
const matFormFieldSelector = 'mat-form-field';
const mobilePublishTopicButton =
  'div.navbar-mobile-options .e2e-test-mobile-publish-topic-button';
const publishTopicButton = 'button.e2e-test-publish-topic-button';

const floatTextField = '.e2e-test-rule-details .e2e-test-float-form-input';
const solutionFloatTextField =
  'oppia-add-or-update-solution-modal .e2e-test-float-form-input';
const textStateEditSelector = 'div.e2e-test-state-edit-content';
const saveContentButton = 'button.e2e-test-save-state-content';
const addQuestionButton = 'button.e2e-test-create-question-button';
const createQuestionButton = 'div.e2e-test-create-question';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const interactionNumberInputButton =
  'div.e2e-test-interaction-tile-NumericInput';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const responseRuleDropdown =
  'oppia-rule-type-selector.e2e-test-answer-description';
const equalsRuleButtonText = 'is equal to ...';
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
const interactionNameDiv = 'div.oppia-interaction-tile-name';
const saveQuestionButton = 'button.e2e-test-save-question-button';

const subtopicExpandHeaderSelector = '.e2e-test-show-subtopics-list';
const practiceTabToggle = '.e2e-test-toggle-practice-tab';

export class CurriculumAdmin extends TopicManager {
  /**
   * Create a basic algebra question in the skill editor page.
   * @param {string} skillName The name of the skill to which the question will be added.
   */
  async addBasicAlgebraQuestionToSkill(skillName: string): Promise<void> {
    await this.openSkillEditor(skillName);
    await this.clickOnElementWithSelector(createQuestionButton);
    await this.clickOnElementWithSelector(textStateEditSelector);
    await this.expectElementToBeVisible(richTextAreaField);
    await this.typeInInputField(richTextAreaField, 'Add 1+2');
    await this.expectElementToBeVisible(`${saveContentButton}:not([disabled])`);
    await this.clickOnElementWithSelector(saveContentButton);

    await this.clickOnElementWithSelector(addInteractionButton);
    await this.expectElementToBeVisible(interactionNumberInputButton);

    await this.clickOnElementWithSelectorAndText(
      interactionNameDiv,
      'Number Input'
    );

    await this.clickOnElementWithSelector(saveInteractionButton);
    await this.expectElementToBeVisible(
      'oppia-add-answer-group-modal-component'
    );
    await this.clickOnElementWithSelector(responseRuleDropdown);
    await this.clickOnElementWithText(equalsRuleButtonText);
    await this.typeInInputField(floatTextField, '3');
    await this.clickOnElementWithSelector(answersInGroupAreCorrectToggle);
    await this.clickOnElementWithSelector(openAnswerGroupFeedBackEditor);
    await this.typeInInputField(richTextAreaField, 'Good job!');
    await this.clickOnElementWithSelector(saveResponseButton);
    await this.expectElementToBeVisible(modalDiv, false);

    await this.clickOnElementWithSelector(defaultFeedbackTab);
    await this.clickOnElementWithSelector(openOutcomeFeedBackEditor);
    await this.clickOnElementWithSelector(richTextAreaField);
    await this.typeInInputField(richTextAreaField, 'The answer is 3');
    await this.clickOnElementWithSelector(saveOutcomeFeedbackButton);

    await this.clickOnElementWithSelector(addHintButton);
    await this.expectElementToBeVisible(modalDiv);
    await this.typeInInputField(richTextAreaField, '3');
    await this.clickOnElementWithSelector(saveHintButton);
    await this.expectElementToBeVisible(modalDiv, false);

    await this.clickOnElementWithSelector(addSolutionButton);
    await this.expectElementToBeVisible(modalDiv);
    await this.expectElementToBeVisible(answerTypeDropdown);
    await this.select(answerTypeDropdown, 'The only');
    await this.expectElementToBeVisible(solutionFloatTextField);
    await this.typeInInputField(solutionFloatTextField, '3');
    await this.expectElementToBeVisible(
      `${submitAnswerButton}:not([disabled])`
    );
    await this.clickOnElementWithSelector(submitAnswerButton);
    await this.typeInInputField(richTextAreaField, '1+2 is 3');
    await this.expectElementToBeVisible(
      `${submitSolutionButton}:not([disabled])`
    );
    await this.clickOnElementWithSelector(submitSolutionButton);
    await this.expectElementToBeVisible(modalDiv, false);

    await this.clickOnElementWithSelector(saveQuestionButton);

    await this.waitForNetworkIdle();
    await this.expectElementToBeVisible(modalDiv, false);
  }

  /**
   * Create a chapter for a certain story.
   * @param {string} chapterName The name of the chapter to be created.
   * @param {string} explorationId The ID of the exploration to be added to the chapter.
   */
  async addChapter(chapterName: string, explorationId: string): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.waitForStaticAssetsToLoad();
      const addChapterButtonElement = await this.page.$(addChapterButton);
      if (!addChapterButtonElement) {
        await this.clickOnElementWithSelector(mobileChapterCollapsibleCard);
      }
    }
    await this.expectElementToBeVisible(addChapterButton);
    await this.clickOnElementWithSelector(addChapterButton);
    await this.typeInInputField(newChapterTitleField, chapterName);
    await this.typeInInputField(newChapterExplorationIdField, explorationId);

    await this.clickOnElementWithSelector(newChapterPhotoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.expectElementToBeVisible(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);

    await this.expectElementToBeVisible(photoUploadModal, false);
    await this.clickOnElementWithSelector(createChapterButton);
    await this.expectElementToBeVisible(modalDiv, false);
    showMessage(`Chapter ${chapterName} is created.`);
  }

  /**
   * Adds a prerequisite topic to a topic in a classroom.
   * @param {string} topicName The name of the topic.
   * @param {string} prerequisiteTopicName The name of the prerequisite topic.
   */
  async addPrerequisiteTopicForATopicInClassroom(
    topicName: string,
    prerequisiteTopicName: string
  ): Promise<void> {
    const topicBox = await this.expectClassroomToContainTopic(topicName);

    const prerequisiteInputElement = await this.getElementInParent(
      matFormFieldSelector,
      topicBox
    );
    if (!prerequisiteInputElement) {
      throw new Error('Prerequisite input element not found');
    }
    await this.clickOnElement(prerequisiteInputElement);

    await this.selectMatOption(prerequisiteTopicName);
    await this.expectMatChipToBeVisible(prerequisiteTopicName);
  }

  /**
   * Add a skill for diagnostic test and then publish the topic.
   * Adding a skill to diagnostic test is necessary for publishing the topic.
   * @param {string} skillName The name of the skill to be added to the diagnostic test.
   * @param {string} topicName The name of the topic to which the skill will be added.
   */
  async addSkillToDiagnosticTest(
    skillName: string,
    topicName?: string
  ): Promise<void> {
    if (topicName) {
      await this.openTopicEditor(topicName);
    }
    await this.clickOnElementWithSelector(addDiagnosticTestSkillButton);
    await this.expectElementToBeVisible(diagnosticTestSkillSelector);
    await this.clickOnElementWithSelector(diagnosticTestSkillSelector);

    /**
     * We select the skill in the dropdown with this method because the event doesn't propagate
     * otherwise and no further changes are made to the DOM, even though the option is selected.
     */
    await this.page.evaluate(
      ({
        optionValue,
        selectElemSelector,
      }: {
        optionValue: string;
        selectElemSelector: string;
      }) => {
        const selectElem = document.querySelector(
          selectElemSelector
        ) as HTMLSelectElement | null;
        if (!selectElem) {
          console.error('Select element not found');
          return;
        }

        const option = Array.from(selectElem.options).find(
          opt => opt.textContent?.trim() === optionValue
        ) as HTMLOptionElement | undefined;
        if (!option) {
          console.error('Option not found');
          return;
        }

        option.selected = true;
        const event = new Event('change', {bubbles: true});
        selectElem.dispatchEvent(event);
      },
      {optionValue: skillName, selectElemSelector: diagnosticTestSkillSelector}
    );
    if (!topicName) {
      throw new Error('topicName is undefined');
    }
    await this.saveTopicDraft(topicName);
  }

  /**
   * Creates a new story with the given title, URL fragment, and topic name.
   * Note: This function only creates a story and does not add any chapters to it.
   * @param {string} storyTitle - The title of the story.
   * @param {string} storyUrlFragment - The URL fragment of the story.
   * @param {string} topicName - The name of the topic.
   * @param {string} metaTag - The meta tag of the story.
   * @param {string} photoURL - The URL of the photo of the story.
   */
  async addStoryToTopic(
    storyTitle: string,
    storyUrlFragment: string,
    topicName: string,
    metaTag: string = 'meta',
    photoURL: string = curriculumAdminThumbnailImage
  ): Promise<string> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(mobileStoryDropdown);
    }
    await this.clickOnElementWithSelector(addStoryButton);
    await this.typeInInputField(storyTitleField, storyTitle);
    await this.expectElementToBeVisible(storyUrlFragmentField);
    await this.typeInInputField(storyUrlFragmentField, storyUrlFragment);
    await this.typeInInputField(
      storyDescriptionField,
      `Story creation description for ${storyTitle}.`
    );

    await this.clickOnElementWithSelector(storyPhotoBoxButton);
    await this.uploadFile(photoURL);
    await this.expectElementToBeVisible(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);

    await this.expectElementToBeVisible(photoUploadModal, false);
    await this.clickAndWaitForNavigation(createStoryButton, true);

    await this.expectElementToBeVisible(storyMetaTagInput);
    await this.page.focus(storyMetaTagInput);
    await this.typeInInputField(storyMetaTagInput, metaTag);
    await this.page.keyboard.press('Tab');
    await this.saveStoryDraft();

    const url = new URL(this.page.url());
    const pathSegments = url.pathname.split('/');
    const storyId = pathSegments[pathSegments.length - 1];
    showMessage(`Story ${storyTitle} is created.`);
    await this.waitForNetworkIdle();

    return storyId;
  }

  /**
   * Function for adding a topic to a classroom.
   * @param {string} classroomName - The name of the classroom.
   * @param {string} topicName - The name of the topic.
   * @param {string[]} prerequisiteTopics - The prerequisite topics of the topic.
   */
  async addTopicToClassroom(
    classroomName: string,
    topicName: string,
    prerequisiteTopics: string[] = []
  ): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.editClassroom(classroomName);

    await this.clickOnElementWithSelector(openTopicDropdownButton);
    await this.clickOnElementWithSelector(topicDropDownFormField);
    await this.expectElementToBeVisible(addTopicFormFieldInput);
    await this.typeInInputField(addTopicFormFieldInput, topicName);

    await this.expectElementToBeVisible(topicSelector);
    await this.clickOnElementWithSelectorAndText(topicSelector, topicName);

    await this.expectElementToBeVisible(openTopicDropdownButton);

    await this.waitForNetworkIdle(); // Wait for the topic to appear in the classroom before adding prerequisites.

    // Increased timeout to 60s because addTopicId makes an async API call that can take time.
    await this.page.waitForFunction(
      ({
        topicBoxSelector,
        topicNameSelector,
        expectedTopicName,
      }: {
        topicBoxSelector: string;
        topicNameSelector: string;
        expectedTopicName: string;
      }) => {
        const topicBoxElements = document.querySelectorAll(topicBoxSelector);
        for (const element of topicBoxElements) {
          const topicNameElement = element.querySelector(topicNameSelector);
          if (topicNameElement?.textContent?.trim() === expectedTopicName) {
            return true;
          }
        }
        return false;
      },
      {
        topicBoxSelector: classroomTopicBoxSelector,
        topicNameSelector: classroomTopicNameSelector,
        expectedTopicName: topicName,
      },
      {timeout: 60000}
    );

    for (const prerequisiteTopic of prerequisiteTopics) {
      await this.addPrerequisiteTopicForATopicInClassroom(
        topicName,
        prerequisiteTopic
      );
    }

    await this.clickOnElementWithSelector(saveClassroomButton);
    await this.expectElementToBeVisible(saveClassroomButton, false);

    showMessage(`Added ${topicName} topic to the ${classroomName} classroom.`);
  }

  /**
   * Assign a skill to a subtopic in the topic editor page.
   * @param {string} skillName The name of the skill to be assigned.
   * @param {string} subtopicName The name of the subtopic to which the skill will be assigned.
   * @param {string} topicName The name of the topic containing the subtopic.
   */
  async assignSkillToSubtopicInTopicEditor(
    skillName: string,
    subtopicName: string,
    topicName: string
  ): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(subtopicReassignHeader);
    }

    await this.expectElementToBeVisible('div.e2e-test-skill-item');
    await this.page.evaluate(
      ({
        skillName,
        topicName,
        editSkillItemSelector,
      }: {
        skillName: string;
        topicName: string;
        editSkillItemSelector: string;
      }) => {
        const skillItemDivs = Array.from(
          document.querySelectorAll('div.e2e-test-skill-item')
        );
        const element = skillItemDivs.find(
          el => el.textContent?.trim() === skillName
        ) as HTMLElement;
        if (element) {
          const assignSkillButton = element.querySelector(
            editSkillItemSelector
          ) as HTMLElement;
          assignSkillButton.click();
        } else {
          throw new Error(
            `Cannot find skill called "${skillName}" in ${topicName}.`
          );
        }
      },
      {skillName, topicName, editSkillItemSelector}
    );

    await this.expectElementToBeVisible(assignSubtopicButton);
    await this.clickOnElementWithText('Assign to Subtopic');

    await this.clickOnElementWithSelectorAndText(
      subtopicNameSelector,
      subtopicName
    );

    await this.expectElementToBeVisible(
      `${confirmSkillAssignationButton}:not([disabled])`
    );
    await this.clickOnElementWithSelector(confirmSkillAssignationButton);
    await this.expectElementToBeVisible(changeSubtopicAssignmentModal, false);
    await this.saveTopicDraft(topicName);
  }

  /**
   * Creates, updates, and publishes a new classroom with a topic.
   * @param {string} classroomName - The name of the classroom.
   * @param {string} urlFragment - The URL fragment for the classroom.
   * @param {string} feedbackRecipientEmail - The feedback recipient email of the classroom.
   * @param {string} topicToBeAssigned - The name of the topic to be assigned to the classroom.
   */
  async createAndPublishClassroom(
    classroomName: string,
    urlFragment: string,
    topicToBeAssigned: string,
    feedbackRecipientEmail: string = 'user@email.com'
  ): Promise<void> {
    await this.createNewClassroom(
      classroomName,
      urlFragment,
      feedbackRecipientEmail
    );
    await this.updateClassroom(
      classroomName,
      'Welcome to Math classroom!',
      'This course covers basic algebra and trigonometry.',
      'In this course, you will learn the following topics: algbera and trigonometry,'
    );
    await this.addTopicToClassroom(classroomName, topicToBeAssigned);
    await this.publishClassroom(classroomName);
  }

  /**
   * Create a story, execute chapter creation for
   * the story, and then publish the story.
   * @param {string} storyTitle - The title of the story.
   * @param {string} storyUrlFragment - The URL fragment for the story.
   * @param {string} chapterTitle - The title of the chapter to be added to the story.
   * @param {string} explorationId - The ID of the exploration to be added to the chapter.
   * @param {string} topicName - The name of the topic to which the story will be added (optional).
   */
  async createAndPublishStoryWithChapter(
    storyTitle: string,
    storyUrlFragment: string,
    chapterTitle: string,
    explorationId: string,
    topicName?: string
  ): Promise<void> {
    if (topicName) {
      await this.openTopicEditor(topicName);
    }
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(mobileStoryDropdown);
    }
    await this.clickOnElementWithSelector(addStoryButton);
    await this.typeInInputField(storyTitleField, storyTitle);
    await this.expectElementToBeVisible(storyUrlFragmentField);
    await this.typeInInputField(storyUrlFragmentField, storyUrlFragment);
    await this.typeInInputField(
      storyDescriptionField,
      `Story creation description for ${storyTitle}.`
    );

    await this.clickOnElementWithSelector(storyPhotoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.expectElementToBeVisible(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);

    await this.expectElementToBeVisible(photoUploadModal, false);
    await this.clickAndWaitForNavigation(createStoryButton, true);

    await this.expectElementToBeVisible(storyMetaTagInput);
    await this.page.focus(storyMetaTagInput);
    await this.typeInInputField(storyMetaTagInput, 'meta');
    await this.page.keyboard.press('Tab');

    await this.addChapter(chapterTitle, explorationId);

    await this.saveStoryDraft();
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(mobileSaveStoryChangesDropdown);
      await this.expectElementToBeVisible(mobilePublishStoryButton);
      await this.clickOnElementWithSelector(mobilePublishStoryButton);
    } else {
      await this.expectElementToBeVisible(
        `${publishStoryButton}:not([disabled])`
      );
      await this.clickOnElementWithSelector(publishStoryButton);
      await this.expectElementToBeVisible(unpublishStoryButton);
    }
  }

  /**
   * Creates and publishes a topic with a subtopic and skill.
   * @param {string} topicName - The name of the topic.
   * @param {string} subtopicName - The name of the subtopic.
   * @param {string} skillName - The name of the skill.
   */
  async createAndPublishTopic(
    topicName: string,
    subtopicName: string,
    skillName: string
  ): Promise<void> {
    await this.createTopic(
      topicName,
      topicName.toLowerCase().replace(/ /g, '-')
    );
    await this.createSubtopicForTopic(
      subtopicName,
      subtopicName.toLowerCase().replace(/ /g, '-'),
      topicName
    );

    await this.createSkillForTopic(skillName, topicName, false);
    await this.createQuestionsForSkill(skillName, 3);
    await this.assignSkillToSubtopicInTopicEditor(
      skillName,
      subtopicName,
      topicName
    );
    await this.addSkillToDiagnosticTest(skillName, topicName);

    await this.publishDraftTopic(topicName);
  }

  /**
   * Function for creating a new classroom.
   * @param {string} classroomName - The name of the classroom.
   * @param {string} urlFragment - The URL fragment for the classroom.
   * @param {string} feedbackRecipientEmail - The feedback recipient email of the classroom.
   */
  async createNewClassroom(
    classroomName: string,
    urlFragment: string,
    feedbackRecipientEmail: string = 'user@email.com'
  ): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.clickOnElementWithSelector(createNewClassroomButton);
    await this.expectElementToBeVisible(createNewClassroomModal);
    await this.typeInInputField(newClassroomNameInputField, classroomName);
    await this.typeInInputField(newClassroomUrlFragmentInputField, urlFragment);
    await this.typeInInputField(
      newClassroomFeedbackRecipientInputField,
      feedbackRecipientEmail
    );
    await this.clickOnElementWithSelector(saveNewClassroomButton);
    await this.expectElementToBeVisible(createNewClassroomModal, false);
    showMessage(`Created ${classroomName} classroom.`);
  }

  /**
   * Create a skill for a particular topic.
   * @param {string} description - The description of the skill to be created.
   * @param {string} topicName - The name of the topic for which the skill is
   * to be created.
   * @param {boolean} addWorkedExample - True if the skill should have a
   * WorkedExample, false otherwise.
   */
  async createSkillForTopic(
    description: string,
    topicName: string,
    addWorkedExample: boolean = false
  ): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(subtopicReassignHeader);
    }
    await this.expectElementToBeVisible(addSkillButton);
    await this.clickOnElementWithSelector(addSkillButton);
    await this.fillSkillInfoAndSubmit(
      description,
      `Review material text content for ${description}.`,
      addWorkedExample
    );
  }

  /**
   * Create a subtopic as a curriculum admin.
   * @param {string} title - The title of the Subtopic.
   * @param {string} urlFragment - The url fragment of the Subtopic.
   * @param {string} topicName - The name of the Topic which storing the new Subtopic.
   */
  async createSubtopicForTopic(
    title: string,
    urlFragment: string,
    topicName: string
  ): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(subtopicReassignHeader);
    }
    await this.clickOnElementWithSelector(addSubtopicButton);
    await this.typeInInputField(subtopicTitleField, title);
    await this.expectElementToBeVisible(subtopicUrlFragmentField);
    await this.typeInInputField(subtopicUrlFragmentField, urlFragment);

    await this.clickOnElementWithSelector(subtopicDescriptionEditorToggle);
    await this.expectElementToBeVisible(richTextAreaField);
    await this.typeInInputField(
      richTextAreaField,
      `Subtopic creation description text for ${title}`
    );

    await this.clickOnElementWithSelector(subtopicPhotoBoxButton);
    await this.expectElementToBeVisible(photoUploadModal);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.expectElementToBeVisible(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);

    await this.expectElementToBeVisible(photoUploadModal, false);
    await this.clickOnElementWithSelector(createSubtopicButton);
    await this.saveTopicDraft(topicName);
    showMessage(`Subtopic ${title} is created.`);
  }

  /**
   * Create a topic in the topics-and-skills dashboard.
   * @param {string} name - The name of the topic.
   * @param {string} urlFragment - The URL fragment for the topic.
   * @returns {Promise<string>} - A promise that resolves to the ID of the created topic.
   */
  async createTopic(name: string, urlFragment: string): Promise<string> {
    await this.navigateToTopicAndSkillsDashboardPage();
    let TopicSelectorElement = null;
    try {
      TopicSelectorElement = await this.expectElementToBeAttachedInDOM(
        desktopTopicSelector,
        this.page,
        10000
      );
    } catch {
      // Element didn't appear in 10 seconds — treat as not present.
    }

    if (!TopicSelectorElement || !this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(createNewTopicButton);
    } else {
      await this.clickOnElementWithSelector(createNewTopicMobileButton);
    }

    await this.typeInInputField(topicNameField, name);
    await this.expectElementToBeVisible(topicUrlFragmentField);
    await this.typeInInputField(topicUrlFragmentField, urlFragment);
    await this.typeInInputField(topicWebFragmentField, name);
    await this.typeInInputField(
      topicDescriptionField,
      `Topic creation description test for ${name}.`
    );

    await this.clickOnElementWithSelector(photoBoxButton);
    await this.expectElementToBeVisible(photoUploadModal);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.expectElementToBeVisible(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);
    await this.expectElementToBeVisible(photoUploadModal, false);
    await this.clickOnElementWithSelector(createTopicButton);

    await this.expectElementToBeAttachedInDOM('.e2e-test-topics-table');
    await this.openTopicEditor(name);
    await this.expectElementToBeVisible(topicMetaTagInput);
    await this.page.focus(topicMetaTagInput);
    await this.typeInInputField(topicMetaTagInput, 'meta');
    await this.page.keyboard.press('Tab');
    await this.saveTopicDraft(name);
    const topicUrl = this.page.url();
    let topicId = topicUrl
      .replace(/^.*\/topic_editor\//, '')
      .replace(/#\/.*/, '');

    return topicId;
  }

  /**
   * Add any number of questions to a particular skill.
   * @param {string} skillName The name of the skill to which the questions will be added.
   * @param {number} questionCount The number of questions to be added.
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
   * Function for opening the classroom tile in edit mode.
   * @param {string} classroomName - The name of the classroom to be edited.
   */
  async editClassroom(classroomName: string): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.expectElementToBeVisible(classroomTileSelector);
    const classroomTiles = await this.page.$$(classroomTileSelector);

    if (classroomTiles.length === 0) {
      throw new Error('No classrooms are present.');
    }

    let foundClassroom = false;

    for (let i = 0; i < classroomTiles.length; i++) {
      const currentClassroomName = await classroomTiles[i].$eval(
        classroomTileNameSpan,
        element => (element as HTMLSpanElement).innerText.trim()
      );

      if (currentClassroomName === classroomName) {
        await this.clickOnElement(classroomTiles[i]);
        await this.expectElementToBeVisible(editClassroomConfigButton);
        await this.clickOnElementWithSelector(editClassroomConfigButton);
        await this.expectElementToBeVisible(closeClassroomConfigButton);

        foundClassroom = true;
        break;
      }
    }

    if (!foundClassroom) {
      throw new Error(`${classroomName} classroom does not exist.`);
    }
  }

  /**
   * Enables diagnostic test for a classroom.
   * @param {string} classroomName - The name of the classroom.
   */
  async enableDiagnosticTestForClassroom(classroomName: string): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.editClassroom(classroomName);
    await this.clickOnElementWithSelector(enableDiagnosticTestButton);
    await this.clickOnElementWithSelector(saveClassroomButton);
    await this.expectElementToBeVisible(saveClassroomButton, false);

    showMessage(`Enabled diagnostic test for ${classroomName} classroom.`);
  }

  /**
   * Checks if the classroom contains a topic with the given name.
   * @param {string} topicName The name of the topic to check for.
   * @returns {Promise<ElementHandle<Element>>} A promise that resolves to the ElementHandle
   * of the topic box if found, or throws an error if not found.
   */
  async expectClassroomToContainTopic(
    topicName: string
  ): Promise<ElementHandle<Element>> {
    await this.expectElementToBeVisible(classroomTopicBoxSelector);

    const topicBoxElements = await this.page.$$(classroomTopicBoxSelector);
    let topicBoxElement: ElementHandle<Element> | null = null;

    for (const element of topicBoxElements) {
      const topicBoxElementText = await element.$eval(
        classroomTopicNameSelector,
        element => element.textContent?.trim()
      );
      if (topicBoxElementText === topicName) {
        topicBoxElement = element;
        break;
      }
    }

    if (!topicBoxElement) {
      throw new Error(`Topic ${topicName} not found in classroom.`);
    }

    return topicBoxElement;
  }

  /**
   * Fills the skill info and submits the form.
   * @param {string} skillName The name of the skill.
   * @param {string} reviewMaterial The review material text content.
   * @param {boolean} addWorkedExample Whether to add a worked example.
   */
  async fillSkillInfoAndSubmit(
    skillName: string,
    reviewMaterial: string,
    addWorkedExample: boolean = false
  ): Promise<void> {
    await this.typeInInputField(skillDescriptionField, skillName);
    await this.expectElementToBeVisible(skillReviewMaterialHeader);
    await this.clickOnElementWithSelector(skillReviewMaterialHeader);
    await this.clickOnElementWithSelector(richTextAreaField);
    await this.typeInInputField(richTextAreaField, reviewMaterial);
    if (addWorkedExample) {
      await this.clickOnElementWithSelector(insertWorkedExampleButton);
      await this.expectElementToBeVisible(editWorkedExampleModalQuestionRte);
      await this.clearAllTextFrom(editWorkedExampleModalQuestionRte);
      await this.typeInInputField(
        editWorkedExampleModalQuestionRte,
        'Type the number one'
      );
      await this.expectElementToBeVisible(editWorkedExampleModalAnswerRte);
      await this.clearAllTextFrom(editWorkedExampleModalAnswerRte);
      await this.waitForElementToStabilize(editWorkedExampleModalAnswerRte);
      await this.typeInInputField(editWorkedExampleModalAnswerRte, '1');
      await this.clickOnElementWithSelector(rteComponentSaveButton);
    }
    await this.expectElementToBeVisible(
      `${confirmSkillCreationButton}:not([disabled])`
    );
    await this.clickOnElementWithSelector(confirmSkillCreationButton);
    await this.waitForNetworkIdle();
    await this.expectElementToBeVisible(confirmSkillCreationButton, false);
    await this.page.bringToFront();
  }

  /**
   * Function for navigating to the classroom admin page.
   */
  async navigateToClassroomAdminPage(): Promise<void> {
    await this.page.bringToFront();
    await this.waitForNetworkIdle();
    await this.goto(classroomAdminUrl);
  }

  /**
   * Function to navigate to exploration editor
   * @param {string | null} explorationId - ID of the exploration
   */
  async navigateToExplorationEditor(
    explorationId: string | null
  ): Promise<void> {
    if (!explorationId) {
      throw new Error('Cannot navigate to editor: explorationId is null');
    }
    const editorUrl = `${baseURL}/create/${explorationId}`;
    await this.goto(editorUrl);
    showMessage('Navigation to exploration editor is successful.');
  }

  /**
   * Navigate to the question editor tab present in the skills tab.
   */
  async navigateToSkillQuestionEditorTab(): Promise<void> {
    const isMobileWidth = this.isViewportAtMobileWidth();
    const skillQuestionTab = isMobileWidth
      ? mobileSkillQuestionTab
      : desktopSkillQuestionTab;

    if (isMobileWidth) {
      await this.page.waitForFunction(() =>
        window.location.href.includes('skill_editor')
      );
      const currentUrl = new URL(this.page.url());
      const hashParts = currentUrl.hash.split('/');

      if (hashParts.length > 1) {
        hashParts[1] = 'questions';
      } else {
        hashParts.push('questions');
      }
      currentUrl.hash = hashParts.join('/');
      await this.goto(currentUrl.toString());
      // Changing only the URL hash triggers a same-document navigation in
      // the browser (no reload, no re-run of the app's bootstrap code),
      // so the app never re-evaluates the hash to switch tabs. A full
      // reload is required to force the app to re-initialize and pick up
      // the 'questions' tab from the updated hash.
      await this.reloadPage();
    } else {
      await this.expectElementToBeVisible(skillQuestionTab);
      await this.clickAndWaitForNavigation(skillQuestionTab, true);
    }
    await this.expectElementToBeVisible(addQuestionButton);
  }

  /**
   * Navigate to the topic and skills dashboard page.
   */
  async navigateToTopicAndSkillsDashboardPage(): Promise<void> {
    await this.page.bringToFront();
    await this.waitForNetworkIdle();
    await this.goto(topicAndSkillsDashboardUrl);
  }

  /**
   * Open the skill editor page for a skill.
   * @param {string} skillName - The name of the skill to be opened in the editor.
   */
  async openSkillEditor(skillName: string): Promise<void> {
    const skillSelector = this.isViewportAtMobileWidth()
      ? mobileSkillSelector
      : desktopSkillSelector;
    await this.page.bringToFront();
    await this.navigateToTopicAndSkillsDashboardPage();
    await this.clickOnElementWithSelector(skillsTab);
    await this.expectElementToBeVisible(skillSelector);
    await this.clickOnElementWithSelectorAndText(skillSelector, skillName);
    await this.expectElementToBeVisible(skillEditorCollapsibleCard);

    expect(this.page.url()).toContain('/skill_editor/');
  }

  /**
   * Open the topic editor page for a topic.
   * @param {string} topicName - The name of the topic to be opened in the editor.
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
   * Function for publishing a classroom.
   * @param {string} classroomName - The name of the classroom.
   */
  async publishClassroom(classroomName: string): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.editClassroom(classroomName);
    await this.clickOnElementWithSelector(publishClassroomButton);
    await this.clickOnElementWithSelector(saveClassroomButton);
    await this.expectElementToBeVisible(saveClassroomButton, false);

    showMessage(`Published ${classroomName} classroom.`);
  }

  /**
   * Publishes a topic draft.
   * @param {string} topicName - Optional. If not provided, the topic editor will be opened.
   *
   * TODO(#22539): This function has a duplicate in topic-manager.ts.
   * To avoid unexpected behavior, ensure that any modifications here are also
   * made in topic-manager.ts.
   */
  async publishDraftTopic(topicName: string): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileSaveTopicDropdown);
      await this.expectElementToBeVisible(mobilePublishTopicButton);
      await this.clickOnElementWithSelector(mobilePublishTopicButton);
      await this.expectElementToBeVisible(mobilePublishTopicButton, false);
    } else {
      await this.clickOnElementWithSelector(publishTopicButton);

      await this.expectElementToBeVisible(publishTopicButton, false);
    }
  }

  /**
   * Publish a story.
   */
  async publishStoryDraft(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(mobileSaveStoryChangesDropdown);
      await this.clickOnElementWithSelector(mobileSaveStoryChangesDropdown);
      await this.expectElementToBeVisible(mobilePublishStoryButton);
      await this.clickOnElementWithSelector(mobilePublishStoryButton);

      await this.page.waitForFunction((selector: string) => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() === 'Unpublish Story';
      }, mobilePublishStoryButton);
    } else {
      await this.expectElementToBeVisible(
        `${publishStoryButton}:not([disabled])`
      );
      await this.clickOnElementWithSelector(publishStoryButton);
      await this.expectElementToBeVisible(unpublishStoryButton);
    }
  }

  /**
   * Save a story.
   */
  async saveStoryDraft(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const isMobileSaveButtonVisible = await this.isElementVisible(
        mobileSaveStoryChangesButton
      );
      if (!isMobileSaveButtonVisible) {
        await this.clickOnElementWithSelector(mobileOptionsSelector);
      }
      await this.expectElementToBeVisible(mobileSaveStoryChangesButton);
      await this.clickOnElementWithSelector(mobileSaveStoryChangesButton);
    } else {
      await this.expectElementToBeVisible(saveStoryButton);
      await this.clickOnElementWithSelector(saveStoryButton);
    }
    await this.typeInInputField(
      saveChangesMessageInput,
      'Test saving story as curriculum admin.'
    );
    await this.expectElementToBeVisible(
      `${closeSaveModalButton}:not([disabled])`
    );
    await this.clickOnElementWithSelector(closeSaveModalButton);
    await this.expectElementToBeVisible(modalDiv, false);
  }

  /**
   * Save a topic as a curriculum admin.
   * @param {string} topicName - The name of the Topic whose draft is to be saved.
   */
  async saveTopicDraft(topicName?: string): Promise<void> {
    await this.expectElementToBeVisible(modalDiv, false);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileSaveTopicButton);
      await this.expectElementToBeVisible('oppia-topic-editor-save-modal');
      await this.typeInInputField(
        saveChangesMessageInput,
        'Test saving topic as curriculum admin.'
      );
      await this.expectElementToBeVisible(
        `${closeSaveModalButton}:not([disabled])`
      );
      await this.clickOnElementWithSelector(closeSaveModalButton);
      await this.expectElementToBeVisible(
        'oppia-topic-editor-save-modal',
        false
      );
      if (topicName) {
        await this.openTopicEditor(topicName);
      }
    } else {
      await this.clickOnElementWithSelector(saveTopicButton);

      await this.expectElementToBeVisible(modalDiv);
      await this.typeInInputField(
        saveChangesMessageInput,
        'Test saving topic as curriculum admin.'
      );
      await this.expectElementToBeVisible(
        `${closeSaveModalButton}:not([disabled])`
      );
      await this.clickOnElementWithSelector(closeSaveModalButton);
      await this.expectElementToBeVisible(modalDiv, false);
    }
  }

  /**
   * Toggles the "Show practice tab to learners" in Topic Editor.
   */
  async togglePracticeTabCheckbox(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(subtopicExpandHeaderSelector);
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
        practiceTabToggle,
        {timeout: 60000}
      );
    } catch (error) {
      console.error(error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Function for updating a classroom.
   * @param {string} classroomName - The name of the classroom.
   * @param {string} teaserText - The teaser text of the classroom.
   * @param {string} topicListIntro - The topic list intro of the classroom.
   * @param {string} courseDetails - The course details of the classroom.
   * @param {string} url - The URL of the classroom.
   * @param {string} feedbackRecipientEmail - The feedback recipient email of the classroom.
   * @param {string} thumbnailImage - The thumbnail image of the classroom.
   * @param {string} bannerImage - The banner image of the classroom.
   */
  async updateClassroom(
    classroomName: string,
    teaserText: string,
    topicListIntro: string,
    courseDetails: string,
    url?: string,
    thumbnailImage: string = curriculumAdminThumbnailImage,
    bannerImage: string = classroomBannerImage,
    feedbackRecipientEmail: string = 'user@email.com'
  ): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.editClassroom(classroomName);

    await this.typeInInputField(editClassroomTeaserTextInputField, teaserText);
    await this.typeInInputField(
      editClassroomTopicListIntroInputField,
      topicListIntro
    );
    await this.typeInInputField(
      editClassroomCourseDetailsInputField,
      courseDetails
    );

    if (url) {
      await this.clearAllTextFrom(editClassroomUrlFragmentInputField);
      await this.typeInInputField(editClassroomUrlFragmentInputField, url);
    }

    await this.clearAllTextFrom(editClassroomFeedbackRecipientInputField);
    await this.page.type(
      editClassroomFeedbackRecipientInputField,
      feedbackRecipientEmail
    );

    await this.clearAllTextFrom(editClassroomTeaserTextInputField);
    await this.typeInInputField(editClassroomTeaserTextInputField, teaserText);

    await this.clearAllTextFrom(editClassroomTopicListIntroInputField);
    await this.typeInInputField(
      editClassroomTopicListIntroInputField,
      topicListIntro
    );

    await this.clearAllTextFrom(editClassroomCourseDetailsInputField);
    await this.typeInInputField(
      editClassroomCourseDetailsInputField,
      courseDetails
    );

    await this.clickOnElementWithSelector(classroomThumbnailContainer);
    await this.uploadFile(thumbnailImage);
    await this.expectElementToBeVisible(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);
    await this.expectElementToBeVisible(uploadPhotoButton, false);

    await this.clickOnElementWithSelector(classroomBannerContainer);
    await this.expectElementToBeVisible(imageUploaderModal);
    await this.uploadFile(bannerImage);
    await this.expectElementToBeVisible(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);
    await this.expectElementToBeVisible(imageUploaderModal, false);

    await this.clickOnElementWithSelector(saveClassroomButton);

    await this.expectElementToBeVisible(saveClassroomButton, false);

    showMessage(`Updated ${classroomName} classroom.`);
  }
}

export const CurriculumAdminFactory = (page: Page): CurriculumAdmin => {
  return new CurriculumAdmin(page);
};
