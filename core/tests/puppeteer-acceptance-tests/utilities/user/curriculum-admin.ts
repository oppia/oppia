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
 * @fileoverview Curriculum Admin users utility file.
 */

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const curriculumAdminThumbnailImage =
  testConstants.data.curriculumAdminThumbnailImage;
const classroomBannerImage = testConstants.data.classroomBannerImage;
const classroomAdminUrl = testConstants.URLs.ClassroomAdmin;
const topicAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;
const baseURL = testConstants.URLs.BaseURL;

const richTextAreaField = 'div.e2e-test-rte';
const richTextParagraphTag = 'div.e2e-test-rte p';
const floatTextField = '.e2e-test-rule-details .e2e-test-float-form-input';
const solutionFloatTextField =
  'oppia-add-or-update-solution-modal .e2e-test-float-form-input';
const textStateEditSelector = 'div.e2e-test-state-edit-content';
const saveContentButton = 'button.e2e-test-save-state-content';

const modalDiv = 'div.modal-content';
const closeSaveModalButton = '.e2e-test-close-save-modal-button';

const photoBoxButton = 'div.e2e-test-photo-button';
const subtopicPhotoBoxButton =
  '.e2e-test-subtopic-thumbnail .e2e-test-photo-button';
const uploadPhotoButton = 'button.e2e-test-photo-upload-submit';
const photoUploadModal = 'edit-thumbnail-modal';

const createQuestionButton = 'div.e2e-test-create-question';
const removeQuestionConfirmationButton =
  '.e2e-test-remove-question-confirmation-button';
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

const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';

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
const publishTopicButton = 'button.e2e-test-publish-topic-button';
const unpublishTopicButton = 'button.e2e-test-unpublish-topic-button';
const mobileUnpublishTopicButton = '.e2e-test-mobile-unpublish-topic-button';
const mobileNavbarDropdownOptions =
  '.oppia-topic-nav-topic-nav-dropdown-options';
const desktopTopicListItemSelector = '.list-item';
const mobileTopicListItemSelector = '.topic-item';
const desktopTopicListItemOptions = '.e2e-test-topic-edit-box';
const mobileTopicListItemOptions = '.e2e-test-mobile-topic-edit-box';
const desktopDeleteTopicButton = '.e2e-test-delete-topic-button';
const mobileDeleteTopicButton = '.e2e-test-mobile-delete-topic-button';
const confirmTopicDeletionButton = '.e2e-test-confirm-topic-deletion-button';

const addSubtopicButton = 'button.e2e-test-add-subtopic-button';
const subtopicTitleField = 'input.e2e-test-new-subtopic-title-field';
const subtopicStudyGuideHeadingField =
  '.e2e-test-new-subtopic-study-guide-section-heading-field';
const subtopicStudyGuideContentField =
  '.e2e-test-create-subtopic-page-content-rich-text-editor';
const showSectionsList = '.e2e-test-show-study-guide-sections-list';
const showSubtopicsList = '.e2e-test-show-subtopics-list';
const firstSubtopicTile = '.e2e-test-subtopic';
const firstStudyGuideSectionTile = '.e2e-test-study-guide-section-0';
const addStudyGuideSectionButton = '.e2e-test-add-study-guide-section';
const addStudyGuideSectionModalHeading =
  '.e2e-test-add-study-guide-section-modal-heading-field';
const addStudyGuideSectionModalContent =
  '.e2e-test-add-study-guide-section-modal-content-field';
const addStudyGuideSectionModalSaveButton =
  '.e2e-test-add-study-guide-section-modal-save-button';
const addStudyGuideSectionModalCancelButton =
  '.e2e-test-add-study-guide-section-modal-cancel-button';
const addStudyGuideSectionContentLength =
  '.e2e-test-add-study-guide-section-content-length-error';
const deleteStudyGuideSectionButton = '.e2e-test-delete-example-button';
const expandedStudyGuideSectionTileHeading =
  '.e2e-test-study-guide-section-heading-field';
const expandedStudyGuideSectionTileContent =
  '.e2e-test-study-guide-section-content-field';
const editStudyGuideSectionHeadingIcon = '.e2e-test-section-heading-edit-icon';
const editStudyGuideSectionContentIcon = '.e2e-test-section-content-edit-icon';
const editStudyGuideSectionHeadingEditor =
  '.e2e-test-study-guide-section-heading-plaintext-editor';
const editStudyGuideSectionContentEditor =
  '.e2e-test-study-guide-section-content-rich-text-editor';
const studyGuideSectionDeleteConfirmButton =
  '.e2e-test-confirm-delete-study-guide-section-button';
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
const desktopSkillListItemOptions = '.e2e-test-skill-edit-box';
const desktopDeleteSkillButton = '.e2e-test-delete-skill-button';
const confirmSkillDeletionButton = '.e2e-test-confirm-skill-deletion-button';
const desktopSkillQuestionTab = '.e2e-test-questions-tab';
const mobileSkillQuestionTab = '.e2e-test-mobile-questions-tab';
const removeQuestion = '.link-off-icon';

const editSkillItemSelector = 'i.e2e-test-skill-item-edit-btn';
const confirmSkillAssignationButton =
  'button.e2e-test-skill-assign-subtopic-confirm';
const desktopSkillListItemSelector = '.list-item';
const mobileSkillListItemSelector = '.skill-item';
const mobileSkillListItemOptions = '.e2e-test-mobile-skills-option';
const mobileDeleteSkillButton = '.e2e-test-mobile-delete-skill-button';

const addDiagnosticTestSkillButton =
  'button.e2e-test-add-diagnostic-test-skill';
const diagnosticTestSkillSelector =
  'select.e2e-test-diagnostic-test-skill-selector';
const saveChangesMessageInput = 'textarea.e2e-test-commit-message-input';

const explorationSettingsTab = '.e2e-test-settings-tab';
const deleteExplorationButton = 'button.e2e-test-delete-exploration-button';
const confirmDeletionButton =
  'button.e2e-test-really-delete-exploration-button';

const mobileOptionsSelector = '.e2e-test-mobile-options-base';
const mobileNavbarDropdown =
  'div.navbar-mobile-options .e2e-test-mobile-navbar-dropdown';
const topicMobilePreviewTab = '.e2e-test-mobile-preview-tab';
const mobileTopicSelector = 'div.e2e-test-mobile-topic-name a';
const mobileSkillSelector = 'span.e2e-test-mobile-skill-name';

const mobileSaveTopicDropdown =
  'div.navbar-mobile-options .e2e-test-mobile-save-topic-dropdown';
const mobileSaveTopicButton =
  'div.navbar-mobile-options .e2e-test-mobile-save-topic-button';
const mobilePublishTopicButton =
  'div.navbar-mobile-options .e2e-test-mobile-publish-topic-button';

const mobileNavToggleButton = '.e2e-test-mobile-options';
const mobileOptionsDropdown = '.e2e-test-mobile-options-dropdown';
const mobileSettingsButton = 'li.e2e-test-mobile-settings-button';
const explorationControlsSettingsDropdown =
  'h3.e2e-test-controls-bar-settings-container';

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
const editClassroomTopicListIntroInputField =
  '.e2e-test-update-classroom-topic-list-intro';
const classroomThumbnailContainer = '.e2e-test-classroom-thumbnail-container';
const classroomBannerContainer = '.e2e-test-classroom-banner-container';
const imageUploaderModal = '.e2e-test-image-uploader-modal';
const openTopicDropdownButton = '.e2e-test-add-topic-to-classroom-button';
const topicDropDownFormField = '.e2e-test-classroom-category-dropdown';
const topicSelector = '.e2e-test-classroom-topic-selector-choice';
const publishClassroomButton =
  '.e2e-test-toggle-classroom-publication-status-btn';
const enableDiagnosticTestButton =
  '.e2e-test-toggle-diagnostic-test-status-btn';
const saveClassroomButton = '.e2e-test-save-classroom-config-button';
const classroomTileNameSpan = '.e2e-test-classroom-tile-name';
const deleteClassroomButton = '.e2e-test-delete-classroom-button';
const deleteClassroomModal = '.e2e-test-delete-classroom-modal';
const confirmDeleteClassroomButton = '.e2e-test-confirm-delete-classroom';
const viewTopicGraphButton = 'button.view-graph-button';
const topicDependencyGraphDiv = '.e2e-test-topic-dependency-graph-container';
const topicNode = '.e2e-test-topic-node';
const closeTopicDependencyButton = '.e2e-test-close-topic-dependency-modal';
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
const selectRubricDifficultySelector = '.e2e-test-select-rubric-difficulty';
const rteSelector = '.e2e-test-rte';
const saveRubricExplanationButton = '.e2e-test-save-rubric-explanation-button';
const saveOrPublishSkillSelector = '.e2e-test-save-or-publish-skill';
const commitMessageInputSelector = '.e2e-test-commit-message-input';
const closeSaveModalButtonSelector = '.e2e-test-close-save-modal-button';
const settingsContainerSelector =
  '.oppia-editor-card.oppia-settings-card-container';
const deleteButtonSelector = 'button.oppia-delete-button';
const navigationDropdownInMobileVisibleSelector =
  '.oppia-exploration-editor-tabs-dropdown.show';

const insertWorkedExampleButton = '.cke_button__oppiaworkedexample';
const editWorkedExampleModalQuestionRte =
  '.e2e-test-arg-editor-inner-0 .e2e-test-rte';
const editWorkedExampleModalAnswerRte =
  '.e2e-test-arg-editor-inner-1 .e2e-test-rte';
const rteComponentSaveButton = '.e2e-test-close-rich-text-component-editor';
const topicPreviewTab = '.e2e-test-topic-preview-tab';
const expandWorkedExampleButton = '.e2e-test-expand-workedexample';
const subtopicExpandHeaderSelector = '.e2e-test-show-subtopics-list';
const practiceTabToggle = '.e2e-test-toggle-practice-tab';

const createNewSkillButton = '.e2e-test-create-skill-button';
const createSkillButton = '.e2e-test-confirm-skill-creation-button';
const editConceptCard = '.e2e-test-edit-concept-card';
const moreThanTwoWorkedExamplesError = '.e2e-test-more-than-2-workedexamples';
const saveReviewMaterialButton = '.e2e-test-save-concept-card';
const publishSkillButton = '.e2e-test-publish-skill-changes-button';
const skillPreviewTabButton = '.e2e-test-question-preview-tab';
const toggleSkillEditOptionsButton =
  'div.e2e-test-mobile-toggle-skill-nav-dropdown-icon';
const mobileSaveSkillButton = '.e2e-test-mobile-save-skill-changes';
const mobilePreviewTab = '.e2e-test-mobile-preview-tab';
const navigationDropdown = '.e2e-test-mobile-skill-nav-dropdown-icon';

export class CurriculumAdmin extends BaseUser {
  /**
   * Navigate to the topic and skills dashboard page.
   */
  async navigateToTopicAndSkillsDashboardPage(): Promise<void> {
    await this.page.bringToFront();
    await this.waitForNetworkIdle();
    await this.goto(topicAndSkillsDashboardUrl);
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
      await this.clickOn(subtopicReassignHeader);
    }
    await this.page.waitForSelector(addSkillButton);
    await this.clickOn(addSkillButton);
    await this.type(skillDescriptionField, description);
    await this.page.waitForSelector(skillReviewMaterialHeader);
    await this.clickOn(skillReviewMaterialHeader);
    await this.clickOn(richTextAreaField);
    await this.type(
      richTextAreaField,
      `Review material text content for ${description}.`
    );
    if (addWorkedExample) {
      await this.clickOn(insertWorkedExampleButton);
      await this.page.waitForSelector(editWorkedExampleModalQuestionRte, {
        visible: true,
      });
      await this.clearAllTextFrom(editWorkedExampleModalQuestionRte);
      await this.type(editWorkedExampleModalQuestionRte, 'Type the number one');
      await this.page.waitForSelector(editWorkedExampleModalAnswerRte, {
        visible: true,
      });
      await this.clearAllTextFrom(editWorkedExampleModalAnswerRte);
      await this.waitForElementToStabilize(editWorkedExampleModalAnswerRte);
      await this.type(editWorkedExampleModalAnswerRte, '1');
      await this.clickOn(rteComponentSaveButton);
    }
    await this.page.waitForSelector(
      `${confirmSkillCreationButton}:not([disabled])`
    );
    await this.clickOn(confirmSkillCreationButton);
    await this.waitForNetworkIdle();
    await this.page.waitForSelector(confirmSkillCreationButton, {
      hidden: true,
    });
    await this.page.bringToFront();
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
      await this.page.reload({waitUntil: 'networkidle0'});
    } else {
      await this.page.waitForSelector(skillQuestionTab, {visible: true});
      await this.clickAndWaitForNavigation(skillQuestionTab);
    }
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
   * Create a basic algebra question in the skill editor page.
   */
  async addBasicAlgebraQuestionToSkill(skillName: string): Promise<void> {
    await this.openSkillEditor(skillName);
    await this.clickOn(createQuestionButton);
    await this.clickOn(textStateEditSelector);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.type(richTextAreaField, 'Add 1+2');
    await this.page.waitForSelector(`${saveContentButton}:not([disabled])`);
    await this.clickOn(saveContentButton);

    await this.clickOn(addInteractionButton);
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

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector('oppia-add-answer-group-modal-component', {
      visible: true,
    });
    await this.clickOn(responseRuleDropdown);
    await this.clickOn(equalsRuleButtonText);
    await this.type(floatTextField, '3');
    await this.clickOn(answersInGroupAreCorrectToggle);
    await this.clickOn(openAnswerGroupFeedBackEditor);
    await this.type(richTextAreaField, 'Good job!');
    await this.clickOn(saveResponseButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});

    await this.clickOn(defaultFeedbackTab);
    await this.clickOn(openOutcomeFeedBackEditor);
    await this.clickOn(richTextAreaField);
    await this.type(richTextAreaField, 'The answer is 3');
    await this.clickOn(saveOutcomeFeedbackButton);

    await this.clickOn(addHintButton);
    await this.page.waitForSelector(modalDiv, {visible: true});
    await this.type(richTextAreaField, '3');
    await this.clickOn(saveHintButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});

    await this.clickOn(addSolutionButton);
    await this.page.waitForSelector(modalDiv, {visible: true});
    await this.page.waitForSelector(answerTypeDropdown);
    await this.page.select(answerTypeDropdown, 'The only');
    await this.page.waitForSelector(solutionFloatTextField);
    await this.type(solutionFloatTextField, '3');
    await this.page.waitForSelector(`${submitAnswerButton}:not([disabled])`);
    await this.clickOn(submitAnswerButton);
    await this.type(richTextAreaField, '1+2 is 3');
    await this.page.waitForSelector(`${submitSolutionButton}:not([disabled])`);
    await this.clickOn(submitSolutionButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});

    await this.clickOn(saveQuestionButton);

    await this.waitForNetworkIdle();
    await this.page.waitForSelector(modalDiv, {hidden: true});
  }

  /**
   * Create a topic in the topics-and-skills dashboard.
   */
  async createTopic(name: string, urlFragment: string): Promise<string> {
    await this.navigateToTopicAndSkillsDashboardPage();
    const TopicSelectorElement = await this.page.$(desktopTopicSelector);

    if (!TopicSelectorElement || !this.isViewportAtMobileWidth()) {
      await this.clickOn(createNewTopicButton);
    } else {
      await this.clickOn(createNewTopicMobileButton);
    }

    await this.type(topicNameField, name);
    await this.page.waitForSelector(topicUrlFragmentField, {
      visible: true,
    });
    await this.type(topicUrlFragmentField, urlFragment);
    await this.type(topicWebFragmentField, name);
    await this.type(
      topicDescriptionField,
      `Topic creation description test for ${name}.`
    );

    await this.clickOn(photoBoxButton);
    await this.page.waitForSelector(photoUploadModal, {visible: true});
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);
    await this.page.waitForSelector(photoUploadModal, {hidden: true});
    await this.clickOn(createTopicButton);

    await this.page.waitForSelector('.e2e-test-topics-table');
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

    expect(this.page.url()).toContain('/topic_editor/');
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

    expect(this.page.url()).toContain('/skill_editor/');
  }

  /**
   * Save a topic as a curriculum admin.
   * @param {string} topicName - The name of the Topic whose draft is to be saved.
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
      await this.type(
        saveChangesMessageInput,
        'Test saving topic as curriculum admin.'
      );
      await this.page.waitForSelector(
        `${closeSaveModalButton}:not([disabled])`,
        {visible: true}
      );
      await this.clickOn(closeSaveModalButton);
      await this.page.waitForSelector(modalDiv, {hidden: true});
    }
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
      await this.clickOn(subtopicReassignHeader);
    }
    await this.clickOn(addSubtopicButton);
    await this.type(subtopicTitleField, title);
    await this.page.waitForSelector(subtopicUrlFragmentField, {
      visible: true,
    });
    await this.page.type(subtopicUrlFragmentField, urlFragment);

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
    showMessage(`Subtopic ${title} is created.`);
  }

  /**
   * Create a subtopic with study guides as a curriculum admin.
   * @param {string} title - The title of the Subtopic.
   * @param {string} urlFragment - The url fragment of the Subtopic.
   * @param {string} heading - The heading of the initial Subtopic Study Guide Section.
   * @param {string} content - The content of the initial Subtopic Study Guide Section.
   * @param {string} topicName - The name of the Topic which storing the new Subtopic.
   * @param {boolean} addWorkedExample - True if the study guide should have a WorkedExample,
   * false otherwise.
   */
  async createSubtopicWithStudyGuideForTopic(
    title: string,
    urlFragment: string,
    heading: string,
    content: string,
    topicName: string,
    addWorkedExample: boolean = false
  ): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(subtopicReassignHeader);
    }
    await this.clickOn(addSubtopicButton);
    await this.type(subtopicTitleField, title);
    await this.page.waitForSelector(subtopicUrlFragmentField, {
      visible: true,
    });
    await this.page.type(subtopicUrlFragmentField, urlFragment);

    await this.page.type(subtopicStudyGuideHeadingField, heading);
    await this.clickOn(subtopicStudyGuideContentField);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.type(richTextAreaField, content);
    if (addWorkedExample) {
      await this.clickOn(insertWorkedExampleButton);
      await this.page.waitForSelector(editWorkedExampleModalQuestionRte, {
        visible: true,
      });
      await this.clearAllTextFrom(editWorkedExampleModalQuestionRte);
      await this.type(editWorkedExampleModalQuestionRte, 'Type the number one');
      await this.page.waitForSelector(editWorkedExampleModalAnswerRte, {
        visible: true,
      });
      await this.clearAllTextFrom(editWorkedExampleModalAnswerRte);
      await this.type(editWorkedExampleModalAnswerRte, '1');
      await this.clickOn(rteComponentSaveButton);
    }

    await this.clickOn(subtopicPhotoBoxButton);
    await this.page.waitForSelector(photoUploadModal, {visible: true});
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {hidden: true});
    await this.clickOn(createSubtopicButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(showSectionsList);
      await this.scrollToBottomOfPage();
    }
    await this.page.waitForSelector(firstStudyGuideSectionTile, {
      visible: true,
    });
    showMessage(`Subtopic ${title} is created.`);
  }

  /**
   * Add a section to the subtopic study guide. Make sure you are
   * on the subtopic editor tab for this to work.
   * @param {string} sectionHeading - The heading of the Section to be added.
   * @param {string} sectionContent - The content of the Section to be added.
   * @param {number} currentNumberOfSections - The number of the Sections currently in the Study Guide.
   */
  async addSubtopicStudyGuideSection(
    sectionHeading: string,
    sectionContent: string,
    currentNumberOfSections: number
  ): Promise<void> {
    await this.clickOn(addStudyGuideSectionButton);
    await this.type(addStudyGuideSectionModalHeading, sectionHeading);
    await this.clickOn(addStudyGuideSectionModalContent);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.type(richTextAreaField, sectionContent);
    await this.clickOn(addStudyGuideSectionModalSaveButton);
    if (this.isViewportAtMobileWidth()) {
      await this.scrollToBottomOfPage();
    }
    await this.page.waitForSelector(
      `.e2e-test-study-guide-section-${currentNumberOfSections}`,
      {
        visible: true,
      }
    );
    await this.page.waitForSelector(deleteStudyGuideSectionButton, {
      visible: true,
    });
  }

  /**
   * Add a section with a WorkedExample to the subtopic study guide. Make sure you are
   * on the subtopic editor tab for this to work.
   * @param {string} sectionHeading - The heading of the Section to be added.
   * @param {string} sectionContent - The content of the Section to be added.
   * @param {number} currentNumberOfSections - The number of the Sections currently in the Study Guide.
   * @param {string} WorkedExampleQuestion - The WorkedExample question.
   * @param {string} WorkedExampleAnswer - The WorkedExample answer.
   */
  async addSubtopicStudyGuideSectionWithWorkedExample(
    sectionHeading: string,
    sectionContent: string,
    currentNumberOfSections: number,
    WorkedExampleQuestion: string,
    WorkedExampleAnswer: string
  ): Promise<void> {
    await this.expectElementToBeVisible(addStudyGuideSectionButton);
    await this.clickOn(addStudyGuideSectionButton);
    await this.type(addStudyGuideSectionModalHeading, sectionHeading);
    await this.clickOn(addStudyGuideSectionModalContent);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.type(richTextAreaField, sectionContent);
    await this.clickOn(insertWorkedExampleButton);
    await this.page.waitForSelector(editWorkedExampleModalQuestionRte, {
      visible: true,
    });
    await this.type(editWorkedExampleModalQuestionRte, WorkedExampleQuestion);
    await this.page.waitForSelector(editWorkedExampleModalAnswerRte, {
      visible: true,
    });
    await this.type(editWorkedExampleModalAnswerRte, WorkedExampleAnswer);
    await this.clickOn(rteComponentSaveButton);
    await this.clickOn(addStudyGuideSectionModalSaveButton);
    if (this.isViewportAtMobileWidth()) {
      await this.scrollToBottomOfPage();
    }
    await this.page.waitForSelector(
      `.e2e-test-study-guide-section-${currentNumberOfSections}`,
      {
        visible: true,
      }
    );
    await this.page.waitForSelector(deleteStudyGuideSectionButton, {
      visible: true,
    });
  }

  /**
   * Navigates to the study guide Previews tab.
   */
  async previewStudyGuide(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(showSubtopicsList);
      await this.clickOn(showSubtopicsList);
      await this.clickOn(firstSubtopicTile);
      await this.clickOn(mobileOptionsSelector);
      await this.clickOn(mobileNavbarDropdown);
      await this.clickOn(topicMobilePreviewTab);
    } else {
      await this.expectElementToBeVisible(topicPreviewTab);
      await this.clickOn(topicPreviewTab);
    }
    await this.waitForPageToFullyLoad();
  }

  /**
   * Verifies if the subtopic study guide has the expected title and sections.
   * @param {string} studyGuideTitle - The expected title of the study guide.
   * @param {string[][]} studyGuideSections - The expected sections of the study guide.
   * It is a list of sections. Sections are a list of strings having length of 2 - heading and content.
   * @param {boolean} expectWorkedExample - If the sections have a WorkedExample or not.
   */
  async expectSubtopicStudyGuideToHaveTitleAndSections(
    studyGuideTitle: string,
    studyGuideSections: string[][],
    expectWorkedExample: boolean
  ): Promise<void> {
    try {
      const isTitlePresent = await this.isTextPresentOnPage(studyGuideTitle);

      if (!isTitlePresent) {
        throw new Error(
          'Expected study guide title to be present, but it was not found.'
        );
      }

      for (var i = 0; i < studyGuideSections.length; i++) {
        for (var j = 0; j < 2; j++) {
          const isHeadingPresent = await this.isTextPresentOnPage(
            studyGuideSections[i][j]
          );
          if (!isHeadingPresent) {
            throw new Error(
              `Expected study guide section ${i + 1} heading to be present on the page, but it was not found`
            );
          }
          j++;
          const isContentPresent = await this.isTextPresentOnPage(
            studyGuideSections[i][j]
          );
          if (!isContentPresent) {
            throw new Error(
              `Expected study guide section ${i + 1} content to be present on the page, but it was not found`
            );
          }
        }
      }
      if (expectWorkedExample) {
        await this.page.waitForSelector(expandWorkedExampleButton, {
          visible: true,
        });
      }
    } catch (error) {
      const newError = new Error(
        `Failed to verify sections of study guide: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Checks if the length error shows up in the Add
   * Study Guide Section Modal of the subtopic study
   * guide. Make sure you are on the subtopic editor
   * tab for this to work.
   */
  async checkAddSectionModalShowsLengthError(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(showSubtopicsList);
      await this.clickOn(firstSubtopicTile);
      await this.clickOn(showSectionsList);
    }
    await this.page.waitForSelector(addStudyGuideSectionButton, {
      visible: true,
    });
    await this.clickOn(addStudyGuideSectionButton);
    await this.type(addStudyGuideSectionModalHeading, 'Section Heading');
    await this.clickOn(addStudyGuideSectionModalContent);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.type(
      richTextAreaField,
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce vulputate eleifend sapien. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. Cras ultricies mi eu turpis hendrerit fringilla. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; In ac dui quis mi consectetuer lacinia. Nam pretium turpis et arcu. Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis, ipsum. Sed aliquam ultrices mauris. Integer ante arcu, accumsan a, consectetuer eget, posuere ut, mauris. Praesent adipiscing. Phasellus ullamcorper ipsum rutrum nunc. Nunc nonummy metus. Vestibulum volutpat pretium libero. Cras id dui. Aenean ut eros et nisl sagittis vestibulum. Nullam nulla eros, ultricies sit amet, nonummy id, imperdiet feugiat, pede. Sed lectus. Donec mollis hendrerit risus. Phasellus nec sem in justo pellentesque facilisis. Etiam imperdiet imperdiet orci. Nunc nec neque. Phasellus leo dolor, tempus non, auctor et, hendrerit quis, nisi. Curabitur ligula sapien, tincidunt non, euismod vitae, posuere imperdiet, leo. Maecenas malesuada. Praesent congue erat at massa. Sed cursus turpis vitae tortor. Donec posuere vulputate arcu. Phasellus accumsan cursus velit. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed aliquam, nisi quis porttitor congue, elit erat euismod orci, ac placerat dolor lectus quis orci. Phasellus consectetuer vestibulum elit. Aenean tellus metus, bibendum sed, posuere ac, mattis non, nunc. Vestibulum fringilla pede sit amet augue. In turpis. Pellentesque posuere. Praesent turpis. Aenean posuere, tortor sed cursus feugiat, nunc augue blandit nunc, eu sollicitudin urna dolor sagittis lacus. Donec elit libero, sodales nec, volutpat a, suscipit non, turpis. Nullam sagittis. Suspendisse pulvinar, augue ac venenatis condimentum, sem libero volutpat nibh, nec pellentesque velit pede quis nunc. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Fusce id purus. Ut varius tincidunt libero. Phasellus dolor. Maecenas vestibulum mollis diam. Pellentesque ut neque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. In dui magna, posuere eget, vestibulum et, tempor auctor, justo. In ac felis quis tortor malesuada pretium. Pellentesque auctor neque nec urna. Proin sapien ipsum, porta a, auctor quis, euismod ut, mi. Aenean viverra rhoncus pede. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut non enim eleifend felis pretium feugiat. Vivamus quis mi. Phasellus a est. Phasellus magna. In hac habitasse platea dictumst. Curabitur at lacus ac velit ornare lobortis. Curabitur a felis in nunc fringilla tristique. Morbi mattis ullamcorper velit. Phasellus gravida semper nisi. Nullam vel sem. Pellentesque libero tortor, tincidunt et, tincidunt eget, semper nec, quam. Sed hendrerit. Morbi ac felis. Nunc egestas, augue at pellentesque laoreet, felis eros vehicula leo, at malesuada velit leo quis pede. Donec interdum, metus et hendrerit aliquet, dolor diam sagittis ligula, eget egestas libero turpis vel mi. Nunc nulla. Fusce risus nisl, viverra et, tempor et, pretium in, sapien. Donec venenatis vulputate lorem. Morbi nec metus. Phasellus blandit leo ut odio. Maecenas ullamcorper, dui et placerat feugiat, eros pede varius nisi, condimentum viverra felis nunc et lorem. Sed magna purus, fermentum eu, tincidunt eu, varius ut, felis. In auctor lobortis lacus. Quisque libero metus, condimentum nec, tempor a, sghasgsdfgxcvbxcvbsdfgsdfgxcvbsgdfsxcvb sdfgcvx asdfgxvba sdfgasdfg. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce vulputate eleifend sapien. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. Cras ultricies mi eu turpis hendrerit fringilla. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; In ac dui quis mi consectetuer lacinia. Nam pretium turpis et arcu. Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis, ipsum. Sed aliquam ultrices mauris. Integer ante arcu, accumsan a, consectetuer eget, posuere ut, mauris. Praesent adipiscing. Phasellus ullamcorper ipsum rutrum nunc. Nunc nonummy metus. Vestibulum volutpat pretium libero. Cras id dui. Aenean ut eros et nisl sagittis vestibulum. Nullam nulla eros, ultricies sit amet, nonummy id, imperdiet feugiat, pede. Sed lectus. Donec mollis hendrerit risus. Phasellus nec sem in justo pellentesque facilisis. Etiam imperdiet imperdiet orci. Nunc nec neque. Phasellus leo dolor, tempus non, auctor et, hendrerit quis, nisi. Curabitur ligula sapien, tincidunt non, euismod vitae, posuere imperdiet, leo. Maecenas malesuada. Praesent congue erat at massa. Sed cursus turpis vitae tortor. Donec posuere vulputate arcu. Phasellus accumsan cursus velit. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed aliquam, nisi quis porttitor congue, elit erat euismod orci, ac placerat dolor lectus quis orci. Phasellus consectetuer vestibulum elit. Aenean tellus metus, bibendum sed, posuere ac, mattis non, nunc. Vestibulum fringilla pede sit amet augue. In turpis. Pellentesque posuere. Praesent turpis. Aenean posuere, tortor sed cursus feugiat, nunc augue blandit nunc, eu sollicitudin urna dolor sagittis lacus. Donec elit libero, sodales nec, volutpat a, suscipit non, turpis. Nullam sagittis. Suspendisse pulvinar, augue ac venenatis condimentum, sem libero volutpat nibh, nec pellentesque velit pede quis nunc. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Fusce id purus. Ut varius tincidunt libero. Phasellus dolor. Maecenas vestibulum mollis diam. Pellentesque ut neque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. In dui magna, posuere eget, vestibulum et, tempor auctor, justo. In ac felis quis tortor malesuada pretium. Pellentesque auctor neque nec urna. Proin sapien ipsum, porta a, auctor quis, euismod ut, mi. Aenean viverra rhoncus pede. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut non enim eleifend felis pretium feugiat. Vivamus quis mi. Phasellus a est. Phasellus magna. In hac habitasse platea dictumst. Curabitur at lacus ac velit ornare lobortis. Curabitur a felis in nunc fringilla tristique. Morbi mattis ullamcorper velit. Phasellus gravida semper nisi. Nullam vel sem. Pellentesque libero tortor, tincidunt et, tincidunt eget, semper nec, quam. Sed hendrerit. Morbi ac felis. Nunc egestas, augue at pellentesque laoreet, felis eros vehicula leo, at malesuada velit leo quis pede. Donec interdum, metus et hendrerit aliquet, dolor diam sagittis ligula, eget egestas libero turpis vel mi. Nunc nulla. Fusce risus nisl, viverra et, tempor et, pretium in, sapien. Donec venenatis vulputate lorem. Morbi nec metus. Phasellus blandit leo ut odio. Maecenas ullamcorper, dui et placerat feugiat, eros pede varius nisi, condimentum viverra felis nunc et lorem. Sed magna purus, fermentum eu, tincidunt eu, varius ut, felis. In auctor lobortis lacus. Quisque libero metus, condimentum nec, tempor a, commodo mollis, magna. Vestibulum ullamcorper mauris at ligula. Fusce fermentum. Nullam cursus lacinia erat. Praesent blandit laoreet nibh. Fusce convallis metus id felis luctus adipiscing. Pellentesque egestas, neque sit amet convallis pulvinar, justo nulla eleifend augue, ac auctor orci leo non est. Quisque id mi. Ut tincidunt tincidunt erat. Etiam feugiat lorem non metus. Vestibulum dapibus nunc ac augue. Curabitur vestibulum aliquam leo. Praesent egestas neque eu enim. In hac habitasse platea dictumst. Fusce a quam. Etiam ut purus mattis mauris sodales aliquam. Curabitur nisi. Quisque malesuada placerat nisl. Nam ipsum risus, rutrum vitae, vestibulum eu, molestie vel, lacus. Sed augue ipsum, egestas nec, vestibulum et, malesuada adipiscing, dui. Vestibulum facilisis, purus nec pulvinar iaculis, ligula mi congue nunc, vitae euismod ligula urna in dolor. Mauris sollicitudin fermentum libero. Praesent nonummy mi in odio. Nunc interdum lacus sit amet orci. Vestibulum rutrum, mi nec elementum vehicula, eros quam gravida nisl, id fringilla neque ante vel mi. Morbi mollis tellus ac sapien. Phasellus volutpat, metus eget egestas mollis, lacus lacus blandit dui, id egestas quam mauris ut lacus. Fusce vel dui. Sed in libero ut nibh placerat accumsan. Proin faucibus arcu quis ante. In consectetuer turpis ut velit. Nulla sit amet est. Praesent metus tellus, elementum eu, semper a, adipiscing nec, purus. Cras risus ipsum, faucibus ut, ullamcorper id, varius ac, leo. Suspendisse feugiat. Suspendisse enim turpis, dictum sed, iaculis a, condimentum nec, nisi. Praesent nec nisl a purus blandit viverra. Praesent ac massa at ligula laoreet iaculis. Nulla neque dolor, sagittis eget, iaculis quis, molestie non, velit. Mauris turpis nunc, blandit et, volutpat molestie, porta ut, ligula. Fusce pharetra convallis urna. Quisque ut nisi. Donec mi odio, faucibus at, scelerisque quis,'
    );
    await this.page.waitForSelector(addStudyGuideSectionContentLength, {
      visible: true,
    });
  }

  /**
   * Clears the content of the Add Section Modal and closes it.
   */
  async clearContentFieldAndCloseAddSectionModal(): Promise<void> {
    await this.clearAllTextFrom(richTextAreaField);
    await this.page.waitForSelector(addStudyGuideSectionContentLength, {
      hidden: true,
    });
    await this.clickOn(addStudyGuideSectionModalCancelButton);
  }

  /**
   * Clicks on a Study Guide Section Tile to expand it.
   * Indexes start from 0.
   * @param {number} index - The index of the Section to be expanded.
   */
  async expandStudyGuideSectionTile(index: number): Promise<void> {
    await this.clickOn(`.e2e-test-study-guide-section-${index}`);
    await this.page.waitForSelector(
      `.e2e-test-study-guide-section-${index}-expanded`,
      {
        visible: true,
      }
    );
    await this.page.waitForSelector(expandedStudyGuideSectionTileHeading, {
      visible: true,
    });
    await this.page.waitForSelector(expandedStudyGuideSectionTileContent, {
      visible: true,
    });
  }

  /**
   * Clicks on the Section heading to open the heading editor.
   */
  async openSectionHeadingEditor(): Promise<void> {
    await this.clickOn(editStudyGuideSectionHeadingIcon);
    await this.page.waitForSelector(editStudyGuideSectionHeadingEditor, {
      visible: true,
    });
  }

  /**
   * Clicks on the Section content to open the content editor.
   */
  async openSectionContentEditor(): Promise<void> {
    await this.clickOn(editStudyGuideSectionContentIcon);
    if (this.isViewportAtMobileWidth()) {
      await this.scrollToBottomOfPage();
    }
    await this.page.waitForSelector(editStudyGuideSectionContentEditor, {
      visible: true,
    });
  }

  /**
   * Deletes a Section of the subtopic study guide.
   * Indexes start from 0.
   * @param {number} index - The index of the Section to be deleted.
   */
  async deleteStudyGuideSection(index: number): Promise<void> {
    await this.clickOn(
      `.e2e-test-study-guide-section-${index} ${deleteStudyGuideSectionButton}`
    );
    await this.clickOn(studyGuideSectionDeleteConfirmButton);

    await this.expectElementToBeVisible(
      studyGuideSectionDeleteConfirmButton,
      false
    );
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
      await this.clickOn(subtopicReassignHeader);
    }

    await this.page.waitForSelector('div.e2e-test-skill-item', {visible: true});
    await this.page.evaluate(
      (skillName, topicName, editSkillItemSelector) => {
        const skillItemDivs = Array.from(
          document.querySelectorAll('div.e2e-test-skill-item')
        );
        const element = skillItemDivs.find(
          element => element.textContent?.trim() === skillName
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
      skillName,
      topicName,
      editSkillItemSelector
    );

    await this.page.waitForSelector(assignSubtopicButton, {
      visible: true,
    });
    await this.clickOn('Assign to Subtopic');

    await this.page.waitForSelector(subtopicNameSelector, {visible: true});
    await this.page.evaluate(
      (subtopicName, subtopicNameSelector) => {
        const subtopicDivs = Array.from(
          document.querySelectorAll(subtopicNameSelector)
        );
        const element = subtopicDivs.find(
          element => element.textContent?.trim() === subtopicName
        ) as HTMLElement;
        if (element) {
          element.click();
        } else {
          throw new Error(
            `Cannot find subtopic called "${subtopicName}" to assign to skill.`
          );
        }
      },
      subtopicName,
      subtopicNameSelector
    );

    await this.page.waitForSelector(
      `${confirmSkillAssignationButton}:not([disabled])`
    );
    await this.clickOn(confirmSkillAssignationButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});
    await this.saveTopicDraft(topicName);
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

    await this.page.waitForSelector(saveRubricExplanationButton, {
      hidden: true,
    });
  }

  /**
   * Publishes an updated skill.
   * @param {string} updateMessage - The update message.
   */
  async publishUpdatedSkill(updateMessage: string): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.page.waitForSelector(saveOrPublishSkillSelector, {
      visible: true,
    });
    await this.clickOn(saveOrPublishSkillSelector);

    await this.page.waitForSelector(commitMessageInputSelector, {
      visible: true,
    });
    await this.type(commitMessageInputSelector, updateMessage);
    await this.page.waitForSelector(closeSaveModalButtonSelector, {
      visible: true,
    });
    await this.clickOn(closeSaveModalButtonSelector);

    await this.page.waitForSelector(closeSaveModalButtonSelector, {
      hidden: true,
    });
    showMessage('Skill updated successful');
  }

  /**
   * Add a skill for diagnostic test and then publish the topic.
   * Adding a skill to diagnostic test is necessary for publishing the topic.
   */
  async addSkillToDiagnosticTest(
    skillName: string,
    topicName: string
  ): Promise<void> {
    await this.openTopicEditor(topicName);
    await this.clickOn(addDiagnosticTestSkillButton);
    await this.page.waitForSelector(diagnosticTestSkillSelector, {
      visible: true,
    });
    await this.clickOn(diagnosticTestSkillSelector);

    /**
     * We select the skill in the dropdown with this method because the event doesn't propagate
     * otherwise and no further changes are made to the DOM, even though the option is selected.
     */
    await this.page.evaluate(
      (optionValue, selectElemSelector) => {
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
      skillName,
      diagnosticTestSkillSelector
    );
    await this.saveTopicDraft(topicName);
  }

  async publishDraftTopic(topicName: string): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileOptionsSelector);
      await this.clickOn(mobileSaveTopicDropdown);
      await this.page.waitForSelector(mobilePublishTopicButton);
      await this.clickOn(mobilePublishTopicButton);
      await this.page.waitForSelector(mobilePublishTopicButton, {hidden: true});
    } else {
      await this.clickOn(publishTopicButton);

      await this.page.waitForSelector(publishTopicButton, {hidden: true});
    }
  }

  /**
   * Check if the topic has been published successfully, by verifying
   * the status and the counts in the topics and skills dashboard.
   */
  /**
   * Check if the topic has been published successfully, by verifying
   * the status and the counts in the topics and skills dashboard.
   */
  async expectTopicToBePublishedInTopicsAndSkillsDashboard(
    topicName: string,
    expectedPublishedStoryCount: number,
    expectedSubtopicCount: number,
    expectedSkillsCount: number
  ): Promise<void> {
    let topicDetails: {
      publishedStoryCount: string | null;
      subtopicCount: string | null;
      skillsCount: string | null;
      topicStatus: string | null;
    };

    const newPage = await this.browserObject.newPage();
    if (this.isViewportAtMobileWidth()) {
      // This is the default viewport and user agent settings for iPhone 6.
      await newPage.setViewport({
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        isLandscape: false,
      });
      await newPage.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) ' +
          'AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 ' +
          'Mobile/15A372 Safari/604.1'
      );
    } else {
      await newPage.setViewport({width: 1920, height: 1080});
    }
    await newPage.bringToFront();
    await newPage.goto(topicAndSkillsDashboardUrl);

    if (this.isViewportAtMobileWidth()) {
      await newPage.waitForSelector('.e2e-test-mobile-topic-table', {
        visible: true,
      });
      topicDetails = await newPage.evaluate(topicName => {
        let items = Array.from(document.querySelectorAll('div.topic-item'));
        let expectedTopicItem = items.find(item => {
          return (
            item
              .querySelector('div.e2e-test-mobile-topic-name a')
              ?.textContent?.trim() === topicName
          );
        }) as HTMLElement;

        let tds = Array.from(
          expectedTopicItem.querySelectorAll('div.topic-item-value')
        ) as HTMLElement[];
        if (!tds || tds.length < 4) {
          throw new Error('Cannot fetch mobile topic details.');
        }

        return {
          publishedStoryCount: tds[0].innerText,
          subtopicCount: tds[1].innerText,
          skillsCount: tds[2].innerText,
          topicStatus: tds[3].innerText,
        };
      }, topicName);
    } else {
      await newPage.waitForSelector('.e2e-test-topics-table', {visible: true});
      topicDetails = await newPage.evaluate(topicName => {
        let items = Array.from(document.querySelectorAll('.list-item'));
        let expectedTopicItem = items.find(item => {
          return (
            item.querySelector('.e2e-test-topic-name')?.textContent?.trim() ===
            topicName
          );
        }) as HTMLElement;

        let tds = Array.from(expectedTopicItem.querySelectorAll('td'));
        if (!tds || tds.length < 5) {
          throw new Error('Cannot fetch topic details.');
        }

        return {
          publishedStoryCount: tds[2].innerText,
          subtopicCount: tds[3].innerText,
          skillsCount: tds[4].innerText,
          topicStatus: tds[5].innerText,
        };
      }, topicName);
    }

    expect(topicDetails.topicStatus).toEqual('Published');
    expect(topicDetails.publishedStoryCount).toEqual(
      expectedPublishedStoryCount.toString()
    );
    expect(topicDetails.subtopicCount).toEqual(
      expectedSubtopicCount.toString()
    );
    expect(topicDetails.skillsCount).toEqual(expectedSkillsCount.toString());
    showMessage('Topic has been published successfully!');
  }

  /**
   * Function to navigate to exploration editor
   * @param explorationUrl - url of the exploration
   */
  async navigateToExplorationEditor(
    explorationId: string | null
  ): Promise<void> {
    if (!explorationId) {
      throw new Error('Cannot navigate to editor: explorationId is null');
    }
    const editorUrl = `${baseURL}/create/${explorationId}`;
    await this.page.goto(editorUrl);
    showMessage('Navigation to exploration editor is successful.');
  }

  /**
   * Function to navigate to exploration settings tab
   */
  async navigateToExplorationSettingsTab(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileNavToggleButton, {visible: true});
      await this.clickOn(mobileNavToggleButton);
      await this.clickOn(mobileOptionsDropdown);
      await this.clickOn(mobileSettingsButton);

      // Close dropdown if it doesn't automatically close.
      const isVisible = await this.isElementVisible(
        navigationDropdownInMobileVisibleSelector
      );
      if (isVisible) {
        // We are using page.click as this button might be overlapped by the
        // dropdown. Thus, it will fail with onClick.
        this.page.click(mobileOptionsDropdown);
      }
    } else {
      await this.page.waitForSelector(explorationSettingsTab, {visible: true});
      await this.clickOn(explorationSettingsTab);
    }
    await this.page.waitForSelector(settingsContainerSelector, {visible: true});
    showMessage('Navigation to settings tab is successful.');
  }

  /**
   * Deletes the exploration permanently.
   * Note: This action requires Curriculum Admin role.
   */
  async deleteExplorationPermanently(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.clickOn(deleteExplorationButton);
    await this.clickOn(confirmDeletionButton);

    await this.page.waitForSelector(confirmDeleteClassroomButton, {
      hidden: true,
    });
  }

  /**
   * Function to dismiss welcome modal
   */
  async dismissWelcomeModal(): Promise<void> {
    try {
      await this.page.waitForNetworkIdle();
      await this.page.waitForSelector(dismissWelcomeModalSelector, {
        visible: true,
        timeout: 10000,
      });
      await this.clickOn(dismissWelcomeModalSelector);
      await this.page.waitForSelector(dismissWelcomeModalSelector, {
        hidden: true,
      });
      showMessage('Tutorial pop-up closed successfully.');
    } catch (error) {
      showMessage(`welcome modal not found: ${error.message}`);
    }
  }

  /**
   * Function to open control dropdown so that delete exploration button is visible
   * in mobile view.
   */
  async openExplorationControlDropdown(): Promise<void> {
    await this.page.waitForSelector(explorationControlsSettingsDropdown, {
      visible: true,
    });
    await this.clickOn(explorationControlsSettingsDropdown);

    await this.page.waitForSelector(deleteButtonSelector, {
      visible: true,
    });
  }

  /**
   * Create a story, execute chapter creation for
   * the story, and then publish the story.
   */
  async createAndPublishStoryWithChapter(
    storyTitle: string,
    storyUrlFragment: string,
    chapterTitle: string,
    explorationId: string,
    topicName: string
  ): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileStoryDropdown);
    }
    await this.clickOn(addStoryButton);
    await this.type(storyTitleField, storyTitle);
    await this.page.waitForSelector(storyUrlFragmentField, {
      visible: true,
    });
    await this.page.type(storyUrlFragmentField, storyUrlFragment);
    await this.type(
      storyDescriptionField,
      `Story creation description for ${storyTitle}.`
    );

    await this.clickOn(storyPhotoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {hidden: true});
    await this.clickAndWaitForNavigation(createStoryButton);

    await this.page.waitForSelector(storyMetaTagInput);
    await this.page.focus(storyMetaTagInput);
    await this.page.type(storyMetaTagInput, 'meta');
    await this.page.keyboard.press('Tab');

    await this.addChapter(chapterTitle, explorationId);

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
   * Creates a new story with the given title, URL fragment, and topic name.
   * Note: This function only creates a story and does not add any chapters to it.
   * @param {string} storyTitle - The title of the story.
   * @param {string} storyUrlFragment - The URL fragment of the story.
   * @param {string} topicName - The name of the topic.
   */
  async addStoryToTopic(
    storyTitle: string,
    storyUrlFragment: string,
    topicName: string
  ): Promise<string> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileStoryDropdown);
    }
    await this.clickOn(addStoryButton);
    await this.type(storyTitleField, storyTitle);
    await this.page.waitForSelector(storyUrlFragmentField, {
      visible: true,
    });
    await this.page.type(storyUrlFragmentField, storyUrlFragment);
    await this.type(
      storyDescriptionField,
      `Story creation description for ${storyTitle}.`
    );

    await this.clickOn(storyPhotoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {hidden: true});
    await this.clickAndWaitForNavigation(createStoryButton);

    await this.page.waitForSelector(storyMetaTagInput);
    await this.page.focus(storyMetaTagInput);
    await this.page.type(storyMetaTagInput, 'meta');
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
   * Create a chapter for a certain story.
   */
  async addChapter(chapterName: string, explorationId: string): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.waitForStaticAssetsToLoad();
      const addChapterButtonElement = await this.page.$(addChapterButton);
      if (!addChapterButtonElement) {
        await this.clickOn(mobileChapterCollapsibleCard);
      }
    }
    await this.page.waitForSelector(addChapterButton, {
      visible: true,
    });
    await this.clickOn(addChapterButton);
    await this.type(newChapterTitleField, chapterName);
    await this.type(newChapterExplorationIdField, explorationId);

    await this.clickOn(newChapterPhotoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {hidden: true});
    await this.clickOn(createChapterButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});
    showMessage(`Chapter ${chapterName} is created.`);
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
        await this.clickOn(mobileOptionsSelector);
      }
      await this.page.waitForSelector(mobileSaveStoryChangesButton, {
        visible: true,
      });
      await this.clickOn(mobileSaveStoryChangesButton);
    } else {
      await this.page.waitForSelector(saveStoryButton, {visible: true});
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
   * Publish a story.
   */
  async publishStoryDraft(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileSaveStoryChangesDropdown, {
        visible: true,
      });
      await this.clickOn(mobileSaveStoryChangesDropdown);
      await this.page.waitForSelector(mobilePublishStoryButton);
      await this.clickOn(mobilePublishStoryButton);

      await this.page.waitForFunction(
        (selector: string) => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() === 'Unpublish Story';
        },
        {},
        mobilePublishStoryButton
      );
    } else {
      await this.page.waitForSelector(`${publishStoryButton}:not([disabled])`);
      await this.clickOn(publishStoryButton);
      await this.page.waitForSelector(unpublishStoryButton, {visible: true});
    }
  }

  /**
   * Function to unpublish a topic.
   * @param {string} topicName - The name of the topic to unpublish.
   */
  async unpublishTopic(topicName: string): Promise<void> {
    await this.openTopicEditor(topicName);

    const isMobileWidth = this.isViewportAtMobileWidth();
    if (isMobileWidth) {
      await this.clickOn(mobileOptionsSelector);
      await this.clickOn(mobileSaveTopicDropdown);
      await this.page.waitForSelector(mobileNavbarDropdownOptions);
      await this.clickOn(mobileUnpublishTopicButton);
      await this.page.reload({waitUntil: 'networkidle0'});
      await this.clickOn(mobileOptionsSelector);
      await this.clickOn(mobileSaveTopicDropdown);
      await this.page.waitForSelector(mobileNavbarDropdownOptions);
    } else {
      await this.clickOn(unpublishTopicButton);
      await this.page.reload({waitUntil: 'networkidle0'});
    }

    const isTextPresent = await this.isTextPresentOnPage('Unpublish Topic');
    if (isTextPresent) {
      throw new Error('Topic is not unpublished successfully.');
    }
  }

  /**
   * Function to delete a topic.
   * @param {string} topicName - The name of the topic to delete.
   */
  async deleteTopic(topicName: string): Promise<void> {
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
        const name = await (
          await topicNameElement.getProperty('textContent')
        ).jsonValue();

        if (name === ` ${topicName} `) {
          await this.page.waitForSelector(topicListItemOptions);
          const editBox = await topic.$(topicListItemOptions);
          if (editBox) {
            await this.waitForElementToBeClickable(editBox);
            await editBox.click();
            await this.page.waitForSelector(deleteTopicButton);
          } else {
            throw new Error('Edit button not found');
          }

          const deleteButton = await topic.$(deleteTopicButton);
          if (deleteButton) {
            await this.waitForElementToBeClickable(deleteButton);
            await deleteButton.click();
            await this.page.waitForSelector(confirmTopicDeletionButton);
          } else {
            throw new Error('Delete button not found');
          }

          const confirmButton = await this.page.$(confirmTopicDeletionButton);
          if (confirmButton) {
            await this.waitForElementToBeClickable(confirmButton);
            await confirmButton.click();
            await this.page.waitForSelector(modalDiv, {hidden: true});
          } else {
            throw new Error('Confirm button not found');
          }

          await this.page.waitForSelector(confirmTopicDeletionButton, {
            hidden: true,
          });
          break;
        }
      }
    }
    showMessage(`Topic "${topicName}" has been successfully deleted.`);
  }

  /**
   * Function to check if a topic is not present in the Topics and Skills Dashboard.
   * @param {string} topicName - The name of the topic to check.
   */
  async expectTopicNotInTopicsAndSkillDashboard(
    topicName: string
  ): Promise<void> {
    await this.goto(topicAndSkillsDashboardUrl);
    const isTextPresent = await this.isTextPresentOnPage(
      'No topics or skills have been created yet.'
    );
    if (isTextPresent) {
      showMessage(`The skill "${topicName}" is not present on the Topics and Skills
      Dashboard as expected.`);
    }

    await this.clickOn(topicsTab);
    const isTopicPresent = await this.isTextPresentOnPage(topicName);
    if (isTopicPresent) {
      throw new Error(
        `Topic "${topicName}" was found.
          It was expected to be absent from Topics and Skills Dashboard.`
      );
    } else {
      showMessage(
        `The topic "${topicName}" is not present on the Topics and Skills
         Dashboard as expected.`
      );
    }
  }

  /**
   * Function to delete a skill.
   * @param {string} skillName - The name of the skill to delete.
   */
  async deleteSkill(skillName: string): Promise<void> {
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
    await this.clickOn(skillsTab);
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(skillSelector, {visible: true});
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
            await this.page.waitForSelector(deleteSkillButton);
          } else {
            throw new Error('Edit button not found');
          }

          const deleteButton = await skill.$(deleteSkillButton);
          if (deleteButton) {
            await this.waitForElementToBeClickable(deleteButton);
            await deleteButton.click();
            await this.page.waitForSelector(confirmSkillDeletionButton);
          } else {
            throw new Error('Delete button not found');
          }

          const confirmButton = await this.page.$(confirmSkillDeletionButton);
          if (confirmButton) {
            await this.waitForElementToBeClickable(confirmButton);
            await confirmButton.click();
            await this.page.waitForSelector(modalDiv, {hidden: true});
          } else {
            throw new Error('Confirm button not found');
          }

          await this.page.waitForSelector(confirmSkillDeletionButton, {
            hidden: true,
          });
          break;
        }
      }
    }

    showMessage(`Skill "${skillName}" has been successfully deleted.`);
  }

  /**
   * Function to check if a skill is not present in the Topics and Skills Dashboard.
   * @param {string} skillName - The name of the skill to check.
   */
  async expectSkillNotInTopicsAndSkillsDashboard(
    skillName: string
  ): Promise<void> {
    await this.goto(topicAndSkillsDashboardUrl);
    await this.waitForPageToFullyLoad();

    // If no skills or Topics is created than skills tab will not be present.
    const isTextPresent = await this.isTextPresentOnPage(
      'No topics or skills have been created yet.'
    );

    if (isTextPresent) {
      showMessage(`The skill "${skillName}" is not present on the Topics and Skills
      Dashboard as expected.`);
      return;
    }

    // Visiting the skills tab to check if the skill is present.
    await this.clickOn(skillsTab);
    const isSkillPresent = await this.isTextPresentOnPage(skillName);
    if (isSkillPresent) {
      throw new Error(
        `Skill "${skillName}" was found.
          It was expected to be absent from Topics and Skills Dashboard.`
      );
    }
    showMessage(
      `The skill "${skillName}" is not present on the Topics and Skills
      Dashboard as expected.`
    );
  }

  /**
   * Function to delete all questions in a skill.
   * @param {string} skillName - The name of the skill to delete questions from.
   */
  async removeAllQuestionsFromTheSkill(skillName: string): Promise<void> {
    try {
      await this.openSkillEditor(skillName);

      const isMobileWidth = this.isViewportAtMobileWidth();
      const skillQuestionTab = isMobileWidth
        ? mobileSkillQuestionTab
        : desktopSkillQuestionTab;

      if (isMobileWidth) {
        const currentUrl = this.page.url();
        const questionsTabUrl = `${currentUrl}questions`;
        await this.goto(questionsTabUrl);
        await this.page.reload({waitUntil: 'networkidle0'});
      } else {
        await this.clickAndWaitForNavigation(skillQuestionTab);
      }

      while (true) {
        try {
          await this.page.waitForSelector(removeQuestion, {visible: true});
        } catch (error) {
          break;
        }

        let button = await this.page.$(removeQuestion);
        if (!button) {
          break;
        }

        await this.waitForElementToBeClickable(button);
        await button.click();

        try {
          await this.page.waitForSelector(modalDiv, {visible: true});
          await this.clickOn(removeQuestionConfirmationButton);
          await this.page.waitForSelector(modalDiv, {hidden: true});
        } catch (error) {
          console.error('Failed to remove question', error.stack);
          throw error;
        }

        await this.page.reload({waitUntil: 'networkidle0'});
      }

      showMessage(
        `All questions have been successfully removed from the skill "${skillName}".`
      );
    } catch (error) {
      throw new Error(
        `Failed to remove all questions from the skill "${skillName}"` +
          error.stack
      );
    }
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
        await this.clickOn(editClassroomConfigButton);
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
   * Function for creating a new classroom.
   */
  async createNewClassroom(
    classroomName: string,
    urlFragment: string
  ): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.clickOn(createNewClassroomButton);
    await this.page.waitForSelector(createNewClassroomModal);
    await this.page.type(newClassroomNameInputField, classroomName);
    await this.page.type(newClassroomUrlFragmentInputField, urlFragment);
    await this.clickOn(saveNewClassroomButton);
    await this.page.waitForSelector(createNewClassroomModal, {visible: false});
    showMessage(`Created ${classroomName} classroom.`);
  }

  /**
   * Function for updating a classroom.
   */
  async updateClassroom(
    classroomName: string,
    teaserText: string,
    topicListIntro: string,
    courseDetails: string
  ): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.editClassroom(classroomName);

    await this.page.type(editClassroomTeaserTextInputField, teaserText);
    await this.page.type(editClassroomTopicListIntroInputField, topicListIntro);
    await this.page.type(editClassroomCourseDetailsInputField, courseDetails);
    await this.clickOn(classroomThumbnailContainer);

    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);
    await this.page.waitForSelector(uploadPhotoButton, {hidden: true});

    await this.clickOn(classroomBannerContainer);
    await this.page.waitForSelector(imageUploaderModal, {visible: true});
    await this.uploadFile(classroomBannerImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);
    await this.page.waitForSelector(imageUploaderModal, {hidden: true});

    await this.clickOn(saveClassroomButton);

    await this.page.waitForSelector(saveClassroomButton, {hidden: true});

    showMessage(`Updated ${classroomName} classroom.`);
  }

  /**
   * Function for adding a topic to a classroom
   */
  async addTopicToClassroom(
    classroomName: string,
    topicName: string
  ): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.editClassroom(classroomName);

    await this.clickOn(openTopicDropdownButton);
    await this.clickOn(topicDropDownFormField);
    await this.page.waitForSelector(addTopicFormFieldInput);
    await this.page.type(addTopicFormFieldInput, topicName);
    await this.clickOn(topicSelector);
    await this.page.waitForSelector(openTopicDropdownButton);
    await this.clickOn(saveClassroomButton);
    await this.page.waitForSelector(saveClassroomButton, {hidden: true});

    showMessage(`Added ${topicName} topic to the ${classroomName} classroom.`);
  }

  /**
   * Function to check number of classrooms present in classroom-admin page.
   */
  async expectNumberOfClassroomsToBe(classroomsCount: number): Promise<void> {
    await this.navigateToClassroomAdminPage();
    const classroomTiles = await this.page.$$(classroomTileSelector);

    if (classroomTiles.length === classroomsCount) {
      showMessage(`There are ${classroomsCount} classrooms present.`);
    } else {
      throw new Error(
        `Expected ${classroomTiles.length} classrooms found ${classroomsCount} classrooms.`
      );
    }
  }

  /**
   * Function for publishing a classroom.
   * @param {string} classroomName - The name of the classroom.
   */
  async publishClassroom(classroomName: string): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.editClassroom(classroomName);
    await this.clickOn(publishClassroomButton);
    await this.clickOn(saveClassroomButton);
    await this.page.waitForSelector(saveClassroomButton, {hidden: true});

    showMessage(`Published ${classroomName} classroom.`);
  }

  /**
   * Enables diagnostic test for a classroom.
   * @param {string} classroomName - The name of the classroom.
   */
  async enableDiagnosticTestForClassroom(classroomName: string): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.editClassroom(classroomName);
    await this.clickOn(enableDiagnosticTestButton);
    await this.clickOn(saveClassroomButton);
    await this.page.waitForSelector(saveClassroomButton, {hidden: true});

    showMessage(`Enabled diagnostic test for ${classroomName} classroom.`);
  }

  /**
   * Function for deleting a classroom.
   */
  async deleteClassroom(classroomName: string): Promise<void> {
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
        element => element.textContent?.trim()
      );

      if (currentClassroomName === classroomName) {
        const classroomTile = classroomTiles[i];

        await classroomTile.waitForSelector(deleteClassroomButton);
        const deleteClassroomButtonElement = await classroomTile.$(
          deleteClassroomButton
        );
        if (deleteClassroomButtonElement) {
          await this.waitForElementToBeClickable(deleteClassroomButtonElement);
          await deleteClassroomButtonElement.click();
        }

        await this.page.waitForSelector(deleteClassroomModal, {visible: true});
        await this.clickOn(confirmDeleteClassroomButton);
        await this.page.waitForSelector(deleteClassroomModal, {hidden: true});

        showMessage(`Deleted ${classroomName} classroom.`);
        foundClassroom = true;
        break;
      }
    }

    if (!foundClassroom) {
      throw new Error(`${classroomName} classroom does not exists.`);
    }
  }

  /**
   * Function for opening topic dependency graph modal.
   * And checking the number of topics in a classroom.
   */
  async expectNumberOfTopicsInTopicDependencyGraphToBe(
    classroomName: string,
    numberOfTopics: number
  ): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.editClassroom(classroomName);

    await this.clickOn(viewTopicGraphButton);
    await this.page.waitForSelector(topicDependencyGraphDiv);

    const topicNodes = await this.page.$$(topicNode);

    if (topicNodes.length === numberOfTopics) {
      showMessage(
        `The ${classroomName} classroom has ${numberOfTopics} topics.`
      );
    } else {
      throw new Error(
        `${classroomName} classroom has ${topicNodes.length} topics, expected ${numberOfTopics} topics.`
      );
    }

    await this.clickOn(closeTopicDependencyButton);
    await this.page.waitForSelector(topicDependencyGraphDiv, {visible: false});
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
   * Creates a topic with a skill.
   * @param {string} topicName - The name of the topic.
   * @param {string} skillName - The name of the skill.
   */
  async createTopicWithSkill(
    topicName: string,
    skillName: string
  ): Promise<void> {
    await this.createTopic(
      topicName,
      topicName.toLowerCase().replace(/ /g, '-')
    );
    await this.createSkillForTopic(skillName, topicName, true);
  }

  /**
   * Creates a skill from the topics and skills dashboard.
   * @param description - The description of the skill.
   * @param reviewMaterial - the content of the skill.
   */
  async createSkillFromTopicsAndSkillsDashboard(
    description: string,
    reviewMaterial: string
  ): Promise<void> {
    await this.expectElementToBeVisible(createNewSkillButton);
    await this.clickOn(createNewSkillButton);
    await this.type(skillDescriptionField, description);
    await this.clickOn(skillReviewMaterialHeader);
    await this.clickOn(richTextAreaField);
    await this.type(richTextAreaField, reviewMaterial);
    await this.addWorkedExampleRteComponent('Type the number one', '1');
    await this.clickOn(createSkillButton);
    await this.openSkillEditor(description);
  }

  /**
   * Click on the edit button of the review material section of
   * a skill that opens up the rich text editor.
   */
  async clickOnReviewMaterialEditButton(): Promise<void> {
    await this.expectElementToBeVisible(editConceptCard);
    await this.clickOn(editConceptCard);
    await this.expectElementToBeVisible(rteSelector);
  }

  /**
   * Copies all the content from the review material rich text
   * editor.
   */
  async copyContentFromReviewMaterialRte(): Promise<void> {
    // OverridePermissions is used to allow clipboard access.
    const context = this.page.browser().defaultBrowserContext();
    await context.overridePermissions('http://localhost:8181', [
      'clipboard-read',
      'clipboard-write',
    ]);
    await this.copyAllTextFrom(richTextParagraphTag);
  }

  /**
   * Copies the WorkedExample from the review material rich text
   * editor.
   */
  async copyWorkedExampleFromReviewMaterialRte(): Promise<void> {
    // OverridePermissions is used to allow clipboard access.
    const context = this.page.browser().defaultBrowserContext();
    await context.overridePermissions('http://localhost:8181', [
      'clipboard-read',
      'clipboard-write',
    ]);
    await this.copyTextFrom(richTextAreaField);
  }

  /**
   * Adds a WorkedExample rich text editor component to a
   * supporting rich text editor.
   * @param question - The question of the WorkedExample
   * @param answer - The solution of the WorkedExample.
   */
  async addWorkedExampleRteComponent(
    question: string,
    answer: string
  ): Promise<void> {
    await this.expectElementToBeVisible(insertWorkedExampleButton);
    await this.clickOn(insertWorkedExampleButton);
    await this.page.waitForSelector(editWorkedExampleModalQuestionRte, {
      visible: true,
    });
    await this.clearAllTextFrom(editWorkedExampleModalQuestionRte);
    await this.type(editWorkedExampleModalQuestionRte, question);
    await this.page.waitForSelector(editWorkedExampleModalAnswerRte, {
      visible: true,
    });
    await this.clearAllTextFrom(editWorkedExampleModalAnswerRte);
    await this.waitForElementToStabilize(editWorkedExampleModalAnswerRte);
    await this.type(editWorkedExampleModalAnswerRte, answer);
    await this.clickOn(rteComponentSaveButton);
    await this.page.waitForSelector(editWorkedExampleModalAnswerRte, {
      hidden: true,
    });
  }

  /**
   * Clears all the content from a rich text editor.
   */
  async clearRte(): Promise<void> {
    await this.expectElementToBeVisible(richTextAreaField);
    await this.clickOn(richTextAreaField);
    await this.clearAllTextFrom(richTextAreaField);
  }

  /**
   * Clears all the content from a rich text editor and checks if the
   * limit of WorkedExamples error disappears.
   */
  async clearRteAndCheckIfErrorDisappears(): Promise<void> {
    await this.expectElementToBeVisible(richTextAreaField);
    await this.clickOn(richTextAreaField);
    await this.clearAllTextFrom(richTextAreaField);
    await this.page.waitForSelector(moreThanTwoWorkedExamplesError, {
      hidden: true,
    });
  }

  /**
   * Saves the changes made to the review material.
   */
  async saveReviewMaterial(): Promise<void> {
    await this.expectElementToBeVisible(saveReviewMaterialButton);
    await this.clickOn(saveReviewMaterialButton);
  }

  /**
   * Clicks on the rich text editor and presses enter
   * to go to the next line.
   */
  async clickOnRteAndPressEnter(): Promise<void> {
    await this.clickOnReviewMaterialEditButton();
    await this.clickOn(richTextAreaField);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Types the given text in the review material rich text editor.
   * @param text - The text to be typed in the rich text editor.
   */
  async typeTextInReviewMaterialEditor(text: string): Promise<void> {
    await this.expectElementToBeVisible(richTextAreaField);
    await this.clickOn(richTextAreaField);
    await this.type(richTextAreaField, text);
  }

  /**
   * Publish the changes made to the skill.
   */
  async publishSkillChanges(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(mobileOptionsSelector);
      await this.clickOn(mobileOptionsSelector);
      // The mobile view has 2 instances of the element, from which
      // the first one is inapplicable here.
      const elems = await this.page.$$(toggleSkillEditOptionsButton);
      await elems[1].click();
      await this.clickOn(mobileSaveSkillButton);
    } else {
      await this.expectElementToBeVisible(publishSkillButton);
      await this.clickOn(publishSkillButton);
    }
    await this.type(
      saveChangesMessageInput,
      'Test saving skill as curriculum admin.'
    );
    await this.page.waitForSelector(`${closeSaveModalButton}:not([disabled])`);
    await this.clickOn(closeSaveModalButton);
    await this.page.waitForSelector('oppia-skill-editor-save-modal', {
      hidden: true,
    });
  }

  /**
   * Navigate to the skill preview tab.
   */
  async navigateToSkillPreviewTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(navigationDropdown);
      const navDropdownElements = await this.page.$$(navigationDropdown);
      await this.waitForElementToBeClickable(navDropdownElements[1]);
      await navDropdownElements[1].click();

      await this.page.waitForSelector(mobilePreviewTab);
      await this.clickOn(mobilePreviewTab);
    } else {
      await this.clickOn(skillPreviewTabButton);
    }
    await this.waitForPageToFullyLoad();
    await this.scrollToBottomOfPage();
  }

  /**
   * Checks of the WorkedExamples have been correctly added to the
   * skill.
   * @param {string[][]} workedExamples - A list of WorkedExamples.
   * Each entry is a list with 2 strings - Question and Answer.
   */
  async checkWorkedExamplesExistForSkill(
    workedExamples: string[][]
  ): Promise<void> {
    if (!this.isViewportAtMobileWidth()) {
      try {
        for (var i = 0; i < workedExamples.length; i++) {
          const isQuestionPresent = this.isTextPresentOnPage(
            workedExamples[i][0]
          );
          if (!isQuestionPresent) {
            throw new Error(
              `Expected WorkedExample Question ${workedExamples[i][0]} to be present on the page, but it was not found.`
            );
          }
          const isAnswerPresent = this.isTextPresentOnPage(
            workedExamples[i][1]
          );
          if (!isAnswerPresent) {
            throw new Error(
              `Expected WorkedExample Answer ${workedExamples[i][1]} to be present on the page, but it was not found.`
            );
          }
        }
      } catch (error) {
        const newError = new Error(
          `Failed to verify WorkedExamples of skill: ${error}`
        );
        newError.stack = error.stack;
        throw newError;
      }
    }
  }

  /**
   * Creates and publishes a topic with a subtopic (having study guides) and skill.
   * @param {string} topicName - The name of the topic.
   * @param {string} subtopicName - The name of the subtopic.
   * @param {string} skillName - The name of the skill.
   */
  async createAndPublishTopicWithSubtopicsAndStudyGuides(
    topicName: string,
    subtopicName: string,
    skillName: string
  ): Promise<void> {
    await this.createTopic(
      topicName,
      topicName.toLowerCase().replace(/ /g, '-')
    );
    await this.createSubtopicWithStudyGuideForTopic(
      subtopicName,
      subtopicName.toLowerCase().replace(/ /g, '-'),
      'Adding With Your Fingers',
      'One way to add is using your...',
      topicName,
      true
    );
    await this.addSubtopicStudyGuideSection(
      'Using an Addition Table',
      'To add two single-digit...',
      1
    );
    await this.saveTopicDraft(topicName);

    await this.createSkillForTopic(skillName, topicName);
    await this.createQuestionsForSkill(skillName, 10);
    await this.assignSkillToSubtopicInTopicEditor(
      skillName,
      subtopicName,
      topicName
    );
    await this.addSkillToDiagnosticTest(skillName, topicName);
    await this.togglePracticeTabCheckbox();
    await this.saveTopicDraft(topicName);

    await this.createSubtopicWithStudyGuideForTopic(
      'Subtracting Numbers',
      'subtract-nos',
      'Common Mistakes',
      'Some common mistakes students make are...',
      topicName,
      true
    );
    await this.saveTopicDraft(topicName);

    await this.createSkillForTopic('Skill 2', topicName, false);
    await this.assignSkillToSubtopicInTopicEditor(
      'Skill 2',
      'Subtracting Numbers',
      topicName
    );

    await this.publishDraftTopic(topicName);
  }

  /**
   * Toggles the "Show practice tab to learners" in Topic Editor.
   */
  async togglePracticeTabCheckbox(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(subtopicExpandHeaderSelector);
      await this.clickOn(subtopicExpandHeaderSelector);
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
}

export let CurriculumAdminFactory = (): CurriculumAdmin =>
  new CurriculumAdmin();
