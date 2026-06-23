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
const saveNewClassroomButton = '.e2e-test-create-new-classroom';
const classroomTileSelector = '.e2e-test-classroom-tile';

const editClassroomConfigButton = '.e2e-test-edit-classroom-config-button';
const closeClassroomConfigButton = '.e2e-cancel-classroom-changes';
const editClassroomCourseDetailsInputField =
  '.e2e-test-update-classroom-course-details';
const editClassroomTeaserTextInputField =
  '.e2e-test-update-classroom-teaser-text';
const editClassroomUrlFragmentInputField = '.e2e-update-classroom-url-fragment';
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
const addTopicFormFieldInput = '.mat-input-element';
const createNewTopicButton = '.e2e-test-create-topic-button';
const createNewTopicMobileButton = '.e2e-test-create-topic-mobile-button';

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

export class CurriculumAdmin extends TopicManager {
  /**
   * Create a basic algebra question in the skill editor page.
   */
  async addBasicAlgebraQuestionToSkill(skillName: string): Promise<void> {
    await this.openSkillEditor(skillName);
    await this.clickOnElementWithSelector(createQuestionButton);
    await this.clickOnElementWithSelector(textStateEditSelector);
    await this.page.waitForSelector(richTextAreaField, {state: 'visible'});
    await this.typeInInputField(richTextAreaField, 'Add 1+2');
    await this.page.waitForSelector(`${saveContentButton}:not([disabled])`);
    await this.clickOnElementWithSelector(saveContentButton);

    await this.clickOnElementWithSelector(addInteractionButton);
    await this.page.waitForSelector(interactionNumberInputButton, {
      state: 'visible',
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

    await this.clickOnElementWithSelector(saveInteractionButton);
    await this.page.waitForSelector('oppia-add-answer-group-modal-component', {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(responseRuleDropdown);
    await this.clickOnElementWithText(equalsRuleButtonText);
    await this.typeInInputField(floatTextField, '3');
    await this.clickOnElementWithSelector(answersInGroupAreCorrectToggle);
    await this.clickOnElementWithSelector(openAnswerGroupFeedBackEditor);
    await this.typeInInputField(richTextAreaField, 'Good job!');
    await this.clickOnElementWithSelector(saveResponseButton);
    await this.page.waitForSelector(modalDiv, {state: 'hidden'});

    await this.clickOnElementWithSelector(defaultFeedbackTab);
    await this.clickOnElementWithSelector(openOutcomeFeedBackEditor);
    await this.clickOnElementWithSelector(richTextAreaField);
    await this.typeInInputField(richTextAreaField, 'The answer is 3');
    await this.clickOnElementWithSelector(saveOutcomeFeedbackButton);

    await this.clickOnElementWithSelector(addHintButton);
    await this.page.waitForSelector(modalDiv, {state: 'visible'});
    await this.typeInInputField(richTextAreaField, '3');
    await this.clickOnElementWithSelector(saveHintButton);
    await this.page.waitForSelector(modalDiv, {state: 'hidden'});

    await this.clickOnElementWithSelector(addSolutionButton);
    await this.page.waitForSelector(modalDiv, {state: 'visible'});
    await this.page.waitForSelector(answerTypeDropdown);
    await this.page.selectOption(answerTypeDropdown, 'The only');
    await this.page.waitForSelector(solutionFloatTextField);
    await this.typeInInputField(solutionFloatTextField, '3');
    await this.page.waitForSelector(`${submitAnswerButton}:not([disabled])`);
    await this.clickOnElementWithSelector(submitAnswerButton);
    await this.typeInInputField(richTextAreaField, '1+2 is 3');
    await this.page.waitForSelector(`${submitSolutionButton}:not([disabled])`);
    await this.clickOnElementWithSelector(submitSolutionButton);
    await this.page.waitForSelector(modalDiv, {state: 'hidden'});

    await this.clickOnElementWithSelector(saveQuestionButton);

    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector(modalDiv, {state: 'hidden'});
  }

  /**
   * Create a chapter for a certain story.
   */
  async addChapter(chapterName: string, explorationId: string): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.waitForStaticAssetsToLoad();
      const addChapterButtonElement = await this.page.$(addChapterButton);
      if (!addChapterButtonElement) {
        await this.clickOnElementWithSelector(mobileChapterCollapsibleCard);
      }
    }
    await this.page.waitForSelector(addChapterButton, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(addChapterButton);
    await this.typeInInputField(newChapterTitleField, chapterName);
    await this.typeInInputField(newChapterExplorationIdField, explorationId);

    await this.clickOnElementWithSelector(newChapterPhotoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {state: 'hidden'});
    await this.clickOnElementWithSelector(createChapterButton);
    await this.page.waitForSelector(modalDiv, {state: 'hidden'});
    showMessage(`Chapter ${chapterName} is created.`);
  }

  /**
   * Adds a prerequisite topic to a topic in a classroom.
   * @param topicName The name of the topic.
   * @param prerequisiteTopicName The name of the prerequisite topic.
   */
  async addPrerequisiteTopicForATopicInClassroom(
    topicName: string,
    prerequisiteTopicName: string
  ): Promise<void> {
    const topicBox = await this.expectClassroomToContainTopic(topicName);

    const prerequisiteInputElement =
      await topicBox.waitForSelector(matFormFieldSelector);
    if (!prerequisiteInputElement) {
      throw new Error('Prerequisite input element not found');
    }
    await prerequisiteInputElement.click();

    await this.selectMatOption(prerequisiteTopicName);
    await this.expectMatChipToBeVisible(prerequisiteTopicName);
  }

  /**
   * Add a skill for diagnostic test and then publish the topic.
   * Adding a skill to diagnostic test is necessary for publishing the topic.
   */
  async addSkillToDiagnosticTest(
    skillName: string,
    topicName?: string
  ): Promise<void> {
    if (topicName) {
      await this.openTopicEditor(topicName);
    }
    await this.clickOnElementWithSelector(addDiagnosticTestSkillButton);
    await this.page.waitForSelector(diagnosticTestSkillSelector, {
      state: 'visible',
    });
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
    await this.page.waitForSelector(storyUrlFragmentField, {
      state: 'visible',
    });
    await this.page.type(storyUrlFragmentField, storyUrlFragment);
    await this.typeInInputField(
      storyDescriptionField,
      `Story creation description for ${storyTitle}.`
    );

    await this.clickOnElementWithSelector(storyPhotoBoxButton);
    await this.uploadFile(photoURL);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {state: 'hidden'});
    await this.clickAndWaitForNavigation(createStoryButton, true);

    await this.page.waitForSelector(storyMetaTagInput);
    await this.page.focus(storyMetaTagInput);
    await this.page.type(storyMetaTagInput, metaTag);
    await this.page.keyboard.press('Tab');
    await this.saveStoryDraft();

    const url = new URL(this.page.url());
    const pathSegments = url.pathname.split('/');
    const storyId = pathSegments[pathSegments.length - 1];
    showMessage(`Story ${storyTitle} is created.`);
    await this.page.waitForLoadState('networkidle');

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
    await this.page.waitForSelector(addTopicFormFieldInput);
    await this.page.type(addTopicFormFieldInput, topicName);

    await this.page.waitForSelector(topicSelector, {state: 'visible'});
    const options = await this.page.$$(topicSelector);
    let foundOption = false;

    for (const option of options) {
      const text = await option.evaluate(el => el.textContent?.trim());
      if (text === topicName) {
        await this.clickOnElement(option);
        foundOption = true;
        break;
      }
    }

    if (!foundOption) {
      throw new Error(`Could not find topic option matching: ${topicName}`);
    }

    await this.page.waitForSelector(openTopicDropdownButton);

    await this.page.waitForLoadState('networkidle'); // Wait for the topic to appear in the classroom before adding prerequisites.

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
    await this.page.waitForSelector(saveClassroomButton, {state: 'hidden'});

    showMessage(`Added ${topicName} topic to the ${classroomName} classroom.`);
  }

  /**
   * Assign a skill to a subtopic in the topic editor page.
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

    await this.page.waitForSelector('div.e2e-test-skill-item', {
      state: 'visible',
    });
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

    await this.page.waitForSelector(assignSubtopicButton, {
      state: 'visible',
    });
    await this.clickOnElementWithText('Assign to Subtopic');

    await this.page.waitForSelector(subtopicNameSelector, {state: 'visible'});
    await this.page.evaluate(
      ({
        subtopicName,
        subtopicNameSelector,
      }: {
        subtopicName: string;
        subtopicNameSelector: string;
      }) => {
        const subtopicDivs = Array.from(
          document.querySelectorAll(subtopicNameSelector)
        );
        const element = subtopicDivs.find(
          el => el.textContent?.trim() === subtopicName
        ) as HTMLElement;
        if (element) {
          element.click();
        } else {
          throw new Error(
            `Cannot find subtopic called "${subtopicName}" to assign to skill.`
          );
        }
      },
      {subtopicName, subtopicNameSelector}
    );

    await this.page.waitForSelector(
      `${confirmSkillAssignationButton}:not([disabled])`
    );
    await this.clickOnElementWithSelector(confirmSkillAssignationButton);
    await this.page.waitForSelector(changeSubtopicAssignmentModal, {
      state: 'hidden',
    });
    await this.saveTopicDraft(topicName);
  }

  /**
   * Creates, updates, and publishes a new classroom with a topic.
   * @param {string} classroomName - The name of the classroom.
   * @param {string} urlFragment - The URL fragment for the classroom.
   * @param {string} topicToBeAssigned - The name of the topic to be assigned to the classroom.
   */
  async createAndPublishClassroom(
    classroomName: string,
    urlFragment: string,
    topicToBeAssigned: string
  ): Promise<void> {
    await this.createNewClassroom(classroomName, urlFragment);
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
   */
  async createNewClassroom(
    classroomName: string,
    urlFragment: string
  ): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.clickOnElementWithSelector(createNewClassroomButton);
    await this.page.waitForSelector(createNewClassroomModal);
    await this.page.type(newClassroomNameInputField, classroomName);
    await this.page.type(newClassroomUrlFragmentInputField, urlFragment);
    await this.clickOnElementWithSelector(saveNewClassroomButton);
    await this.page.waitForSelector(createNewClassroomModal, {state: 'hidden'});
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
    await this.page.waitForSelector(addSkillButton);
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
    await this.page.waitForSelector(subtopicUrlFragmentField, {
      state: 'visible',
    });
    await this.page.type(subtopicUrlFragmentField, urlFragment);

    await this.clickOnElementWithSelector(subtopicDescriptionEditorToggle);
    await this.page.waitForSelector(richTextAreaField, {state: 'visible'});
    await this.typeInInputField(
      richTextAreaField,
      `Subtopic creation description text for ${title}`
    );

    await this.clickOnElementWithSelector(subtopicPhotoBoxButton);
    await this.page.waitForSelector(photoUploadModal, {state: 'visible'});
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {state: 'hidden'});
    await this.clickOnElementWithSelector(createSubtopicButton);
    await this.saveTopicDraft(topicName);
    showMessage(`Subtopic ${title} is created.`);
  }

  /**
   * Create a topic in the topics-and-skills dashboard.
   */
  async createTopic(name: string, urlFragment: string): Promise<string> {
    await this.navigateToTopicAndSkillsDashboardPage();
    const TopicSelectorElement = await this.page.$(desktopTopicSelector);

    if (!TopicSelectorElement || !this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(createNewTopicButton);
    } else {
      await this.clickOnElementWithSelector(createNewTopicMobileButton);
    }

    await this.typeInInputField(topicNameField, name);
    await this.page.waitForSelector(topicUrlFragmentField, {
      state: 'visible',
    });
    await this.typeInInputField(topicUrlFragmentField, urlFragment);
    await this.typeInInputField(topicWebFragmentField, name);
    await this.typeInInputField(
      topicDescriptionField,
      `Topic creation description test for ${name}.`
    );

    await this.clickOnElementWithSelector(photoBoxButton);
    await this.page.waitForSelector(photoUploadModal, {state: 'visible'});
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);
    await this.page.waitForSelector(photoUploadModal, {state: 'hidden'});
    await this.clickOnElementWithSelector(createTopicButton);

    await this.page.waitForSelector('.e2e-test-topics-table', {
      state: 'attached',
    });
    await this.openTopicEditor(name);
    await this.page.waitForSelector(topicMetaTagInput);
    await this.page.focus(topicMetaTagInput);
    await this.page.type(topicMetaTagInput, 'meta');
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
   */
  async editClassroom(classroomName: string): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.page.waitForSelector(classroomTileSelector);
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
        await classroomTiles[i].click();
        await this.page.waitForSelector(editClassroomConfigButton);
        await this.clickOnElementWithSelector(editClassroomConfigButton);
        await this.page.waitForSelector(closeClassroomConfigButton);

        foundClassroom = true;
        break;
      }
    }

    if (!foundClassroom) {
      throw new Error(`${classroomName} classroom does not exist.`);
    }
  }

  /**
   * Checks if the classroom contains a topic with the given name.
   * @param topicName The name of the topic to check for.
   * @returns The element handle of the topic box if it exists.
   */
  async expectClassroomToContainTopic(
    topicName: string
  ): Promise<ElementHandle<Element>> {
    await this.page.waitForSelector(classroomTopicBoxSelector);

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
   * @param skillName The name of the skill.
   * @param reviewMaterial The review material text content.
   * @param addWorkedExample Whether to add a worked example.
   */
  async fillSkillInfoAndSubmit(
    skillName: string,
    reviewMaterial: string,
    addWorkedExample: boolean = false
  ): Promise<void> {
    await this.typeInInputField(skillDescriptionField, skillName);
    await this.page.waitForSelector(skillReviewMaterialHeader);
    await this.clickOnElementWithSelector(skillReviewMaterialHeader);
    await this.clickOnElementWithSelector(richTextAreaField);
    await this.typeInInputField(richTextAreaField, reviewMaterial);
    if (addWorkedExample) {
      await this.clickOnElementWithSelector(insertWorkedExampleButton);
      await this.page.waitForSelector(editWorkedExampleModalQuestionRte, {
        state: 'visible',
      });
      await this.clearAllTextFrom(editWorkedExampleModalQuestionRte);
      await this.typeInInputField(
        editWorkedExampleModalQuestionRte,
        'Type the number one'
      );
      await this.page.waitForSelector(editWorkedExampleModalAnswerRte, {
        state: 'visible',
      });
      await this.clearAllTextFrom(editWorkedExampleModalAnswerRte);
      await this.waitForElementToStabilize(editWorkedExampleModalAnswerRte);
      await this.typeInInputField(editWorkedExampleModalAnswerRte, '1');
      await this.clickOnElementWithSelector(rteComponentSaveButton);
    }
    await this.page.waitForSelector(
      `${confirmSkillCreationButton}:not([disabled])`
    );
    await this.clickOnElementWithSelector(confirmSkillCreationButton);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector(confirmSkillCreationButton, {
      state: 'hidden',
    });
    await this.page.bringToFront();
  }

  /**
   * Function for navigating to the classroom admin page.
   */
  async navigateToClassroomAdminPage(): Promise<void> {
    await this.page.bringToFront();
    await this.page.waitForLoadState('networkidle');
    await this.goto(classroomAdminUrl);
  }

  /**
   * Navigate to the topic and skills dashboard page.
   */
  async navigateToTopicAndSkillsDashboardPage(): Promise<void> {
    await this.page.bringToFront();
    await this.page.waitForLoadState('networkidle');
    await this.goto(topicAndSkillsDashboardUrl);
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
    await this.page.waitForSelector(skillSelector, {state: 'visible'});

    await Promise.all([
      this.page.evaluate(
        ({
          skillSelector,
          skillName,
        }: {
          skillSelector: string;
          skillName: string;
        }) => {
          const skillDivs = Array.from(
            document.querySelectorAll(skillSelector)
          );
          const skillDivToSelect = skillDivs.find(
            element => element?.textContent?.trim() === skillName
          ) as HTMLElement;
          if (skillDivToSelect) {
            skillDivToSelect.click();
          } else {
            throw new Error('Cannot open skill editor page.');
          }
        },
        {skillSelector, skillName}
      ),
      this.page.waitForNavigation(),
    ]);

    expect(this.page.url()).toContain('/skill_editor/');
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
    await this.page.waitForSelector(topicNameSelector, {state: 'visible'});

    await Promise.all([
      this.page.evaluate(
        ({
          topicNameSelector,
          topicName,
        }: {
          topicNameSelector: string;
          topicName: string;
        }) => {
          const topicDivs = Array.from(
            document.querySelectorAll(topicNameSelector)
          );
          const topicDivToSelect = topicDivs.find(
            element => element?.textContent?.trim() === topicName
          ) as HTMLElement;
          if (topicDivToSelect) {
            topicDivToSelect.click();
          } else {
            throw new Error('Cannot open topic editor page.');
          }
        },
        {topicNameSelector, topicName}
      ),
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
    await this.page.waitForSelector(saveClassroomButton, {state: 'hidden'});

    showMessage(`Published ${classroomName} classroom.`);
  }

  /**
   * Publishes a topic draft.
   * @param topicName - Optional. If not provided, the topic editor will be opened.
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
      await this.page.waitForSelector(mobilePublishTopicButton);
      await this.clickOnElementWithSelector(mobilePublishTopicButton);
      await this.page.waitForSelector(mobilePublishTopicButton, {
        state: 'hidden',
      });
    } else {
      await this.clickOnElementWithSelector(publishTopicButton);

      await this.page.waitForSelector(publishTopicButton, {state: 'hidden'});
    }
  }

  /**
   * Publish a story.
   */
  async publishStoryDraft(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileSaveStoryChangesDropdown, {
        state: 'visible',
      });
      await this.clickOnElementWithSelector(mobileSaveStoryChangesDropdown);
      await this.page.waitForSelector(mobilePublishStoryButton);
      await this.clickOnElementWithSelector(mobilePublishStoryButton);

      await this.page.waitForFunction((selector: string) => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() === 'Unpublish Story';
      }, mobilePublishStoryButton);
    } else {
      await this.page.waitForSelector(`${publishStoryButton}:not([disabled])`);
      await this.clickOnElementWithSelector(publishStoryButton);
      await this.page.waitForSelector(unpublishStoryButton, {state: 'visible'});
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
      await this.page.waitForSelector(mobileSaveStoryChangesButton, {
        state: 'visible',
      });
      await this.clickOnElementWithSelector(mobileSaveStoryChangesButton);
    } else {
      await this.page.waitForSelector(saveStoryButton, {state: 'visible'});
      await this.clickOnElementWithSelector(saveStoryButton);
    }
    await this.typeInInputField(
      saveChangesMessageInput,
      'Test saving story as curriculum admin.'
    );
    await this.page.waitForSelector(`${closeSaveModalButton}:not([disabled])`);
    await this.clickOnElementWithSelector(closeSaveModalButton);
    await this.page.waitForSelector(modalDiv, {state: 'hidden'});
  }

  /**
   * Save a topic as a curriculum admin.
   * @param {string} topicName - The name of the Topic whose draft is to be saved.
   */
  async saveTopicDraft(topicName?: string): Promise<void> {
    await this.page.waitForSelector(modalDiv, {state: 'hidden'});
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileSaveTopicButton);
      await this.page.waitForSelector('oppia-topic-editor-save-modal', {
        state: 'visible',
      });
      await this.typeInInputField(
        saveChangesMessageInput,
        'Test saving topic as curriculum admin.'
      );
      await this.page.waitForSelector(
        `${closeSaveModalButton}:not([disabled])`
      );
      await this.clickOnElementWithSelector(closeSaveModalButton);
      await this.page.waitForSelector('oppia-topic-editor-save-modal', {
        state: 'hidden',
      });
      if (topicName) {
        await this.openTopicEditor(topicName);
      }
    } else {
      await this.clickOnElementWithSelector(saveTopicButton);

      await this.page.waitForSelector(modalDiv, {state: 'visible'});
      await this.typeInInputField(
        saveChangesMessageInput,
        'Test saving topic as curriculum admin.'
      );
      await this.page.waitForSelector(
        `${closeSaveModalButton}:not([disabled])`,
        {state: 'visible'}
      );
      await this.clickOnElementWithSelector(closeSaveModalButton);
      await this.page.waitForSelector(modalDiv, {state: 'hidden'});
    }
  }

  /**
   * Function for updating a classroom.
   * @param {string} classroomName - The name of the classroom.
   * @param {string} teaserText - The teaser text of the classroom.
   * @param {string} topicListIntro - The topic list intro of the classroom.
   * @param {string} courseDetails - The course details of the classroom.
   * @param {string} url - The URL of the classroom.
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
    bannerImage: string = classroomBannerImage
  ): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.editClassroom(classroomName);

    await this.page.type(editClassroomTeaserTextInputField, teaserText);
    await this.page.type(editClassroomTopicListIntroInputField, topicListIntro);
    await this.page.type(editClassroomCourseDetailsInputField, courseDetails);

    if (url) {
      await this.clearAllTextFrom(editClassroomUrlFragmentInputField);
      await this.page.type(editClassroomUrlFragmentInputField, url);
    }

    await this.clearAllTextFrom(editClassroomTeaserTextInputField);
    await this.page.type(editClassroomTeaserTextInputField, teaserText);

    await this.clearAllTextFrom(editClassroomTopicListIntroInputField);
    await this.page.type(editClassroomTopicListIntroInputField, topicListIntro);

    await this.clearAllTextFrom(editClassroomCourseDetailsInputField);
    await this.page.type(editClassroomCourseDetailsInputField, courseDetails);

    await this.clickOnElementWithSelector(classroomThumbnailContainer);
    await this.uploadFile(thumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);
    await this.page.waitForSelector(uploadPhotoButton, {state: 'hidden'});

    await this.clickOnElementWithSelector(classroomBannerContainer);
    await this.page.waitForSelector(imageUploaderModal, {state: 'visible'});
    await this.uploadFile(bannerImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);
    await this.page.waitForSelector(imageUploaderModal, {state: 'hidden'});

    await this.clickOnElementWithSelector(saveClassroomButton);

    await this.page.waitForSelector(saveClassroomButton, {state: 'hidden'});

    showMessage(`Updated ${classroomName} classroom.`);
  }
}

export const CurriculumAdminFactory = (page: Page): CurriculumAdmin => {
  return new CurriculumAdmin(page);
};
