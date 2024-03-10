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

import { IBaseUser, BaseUser } from
  '../puppeteer-testing-utilities/puppeteer-utils';
import testConstants from
  '../puppeteer-testing-utilities/test-constants';
import { showMessage } from
  '../puppeteer-testing-utilities/show-message-utils';

const richTextAreaField = 'div.e2e-test-rte';
const floatTextField = 'input.e2e-test-float-form-input';
const textStateEditSelector = 'div.e2e-test-state-edit-content';
const saveContentButton = 'div.e2e-test-save-state-content';
const saveChangesButton = 'button.e2e-test-save-changes'
const saveDraftButton = 'button.e2e-test-save-draft-button';
const publishExplorationButton = 'button.e2e-test-publish-exploration'

const photoBoxButton = 'div.e2e-test-photo-button';
const uploadPhotoButton = 'button.e2e-test-photo-upload-submit';
const curriculumAdminThumbnailImage = testConstants.images.curriculumAdminThumbnailImage;

const editorMainTabButton = 'a.e2e-test-main-tab';
const saveStoryButton = 'button.e2e-test-save-story-button'
const saveStoryMessageInput = 'textarea.e2e-test-commit-message-input';
const confirmSaveStoryButton = 'button.e2e-test-close-save-modal-button';
const publishStoryButton = 'button.e2e-test-publish-story-button';

const topicsTab = 'a.e2e-test-topics-tab';

const topicAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;
const creatorDashboardUrl = testConstants.URLs.CreatorDashboard;

const skillDescriptionField = 'input.e2e-test-new-skill-description-field';
const skillReviewMaterialHeader = 'div.e2e-test-open-concept-card';
const createSkillButton = 'button.e2e-test-create-skill-button';
const confirmSkillCreationButton = 'button.e2e-test-confirm-skill-creation-button';

const createQuestionButton = 'div.e2e-test-create-question';
const easyQuestionDifficultyOption = 'div.e2e-test-skill-difficulty-easy';
const addInteractionButton = 'div.e2e-test-open-add-interaction-modal';
const interactionNumberInputButton = 'div.e2e-test-interaction-tile-NumericInput';
const interactionEndExplorationInputButton = 'div.e2e-test-interaction-tile-EndExploration';
const saveInteractionButton = 'div.e2e-test-save-interaction';
const responseRuleDropdown = 'oppia-rule-type-selector.e2e-test-answer-description';
const equalsRuleButtonText = 'is equal to ... ';
const answersInGroupAreCorrectToggle = 'input.e2e-test-editor-correctness-toggle';
const saveResponseButton = 'div.e2e-test-add-new-response';

const openOutcomeFeedBackEditor = 'div.e2e-test-add-new-response';
const saveOutcomeFeedbackButton = 'div.e2e-test-save-outcome-feedback';

const addHintButton = 'button.e2e-test-oppia-add-hint-button';
const saveHintButton = 'button.e2e-test-save-hint';

const addSolutionButton = 'button.e2e-test-oppia-add-solution-button';
const answerTypeDropdown = 'select.e2e-test-answer-is-exclusive-select';
const submitAnswerButton = 'button.e2e-test-submit-answer-button';
const submitSolutionButton = 'button.e2e-test-submit-solution-button';

const saveQuestionButton = 'button.e2e-test-save-question-button';

const createExplorationButton = 'button.e2e-test-create-new-exploration-button';
const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const explorationTitleInput = 'input.e2e-test-exploration-title-input-modal';
const explorationGoalInput = 'input.e2e-test-exploration-objective-input-modal';
const explorationCategoryDropdown = 'mat-form-field.e2e-test-exploration-category-metadata-modal';
const explorationCategorySelectorChoice = 'mat-option.e2e-test-exploration-category-selector-choice';
const saveExplorationChangesButton = 'button.e2e-test-confirm-pre-publication';
const explorationIdElement = 'span.oppia-unique-progress-id';

const addTopicButton = 'button.e2e-test-create-topic-button';
const topicNameField = 'input.e2e-test-new-topic-name-field';
const topicUrlFragmentField = 'input.e2e-test-new-topic-url-fragment-field';
const topicWebFragmentField = 'input.e2e-test-new-page-title-fragm-field';
const topicDescriptionField = 'textarea.e2e-test-new-topic-description-field';
const createTopicButton = 'button.e2e-test-confirm-topic-creation-button';

const addSubTopicButton = 'button.e2e-test-add-subtopic-button';
const subTopicTitleField = 'input.e2e-test-new-subtopic-title-field';
const subTopicUrlFragmentField = 'input.e2e-test-new-subtopic-url-fragment-field';
const subTopicDescriptionEditorToggle = 'div.e2e-test-show-schema-editor';
const createSubTopicButton = 'button.e2e-test-confirm-subtopic-creation-button';

const addStoryButton = 'button.e2e-test-create-story-button';
const storyTitleField = 'input.e2e-test-new-story-title-field';
const storyDescriptionField = 'textarea.e2e-test-new-story-description-field';
const storyUrlFragmentField = 'input.e2e-test-new-story-url-fragment-field';
const createStoryButton = 'button.e2e-test-confirm-story-creation-button';

const addChapterButton = 'button.e2e-test-add-chapter-button';
const chapterTitleField = 'input.e2e-test-new-chapter-title-field';
const chapterExplorationIdField = 'input.e2e-test-chapter-exploration-input';
const createChapterButton = 'button.e2e-test-confirm-chapter-creation-button';


export interface ICurriculumAdmin extends IBaseUser {
  navigateToTopicAndSkillsDashboardPage: () => Promise<void>;
  createSkill: (topicPageUrl: string) => Promise<void>;
  createQuestion: () => Promise<void>;
  navigateToCreatorDashboardPage: () => Promise<void>;
  createExploration: () => Promise<string | null>;
  createTopic: () => Promise<string>;
  createSubTopic: (topicPageUrl: string) => Promise<void>;
  createStory: (topicPageUrl: string) => Promise<void>;
  createChapter: (explorationId: string) => Promise<void>;
  publishStory: () => Promise<void>;
}

class CurriculumAdmin extends BaseUser implements ICurriculumAdmin {
  /**
   * Function for navigating to the topic and skills dashboard page.
   */
  async navigateToTopicAndSkillsDashboardPage() {
    await this.goto(topicAndSkillsDashboardUrl);
  }

  /**
   * Function for creating a skill in the topics and skills dashboard.
   */
  async createSkill(topicPageUrl: string) {
    await this.goto(topicPageUrl);
    await this.clickOn(createSkillButton);
    await this.type(skillDescriptionField, 'Test Skill 3');
    await this.clickOn(skillReviewMaterialHeader)
    await this.type(richTextAreaField, 'This is a test skill with 3 questions');
    await this.page.waitForSelector(
      `${confirmSkillCreationButton}:not([disabled])`);
    await this.clickOn(confirmSkillCreationButton);
  }

  /**
   * Function for creating a question in the skill editor page.
   */
  async createQuestion() {
    await this.clickOn(createQuestionButton);
    await this.clickOn(easyQuestionDifficultyOption);
    await this.clickOn(textStateEditSelector);
    await this.type(richTextAreaField, 'Add 1+2');
    await this.page.waitForSelector(
      `${saveContentButton}:not([disabled])`);
    await this.clickOn(saveContentButton);

    await this.clickOn(addInteractionButton);
    await this.clickOn(interactionNumberInputButton);
    await this.clickOn(saveInteractionButton);
    await this.clickOn(responseRuleDropdown);
    await this.clickOn(equalsRuleButtonText);
    await this.type(floatTextField, '3');
    await this.clickOn(answersInGroupAreCorrectToggle);
    await this.clickOn(saveResponseButton);

    await this.clickOn(openOutcomeFeedBackEditor);
    await this.type(richTextAreaField, 'The answer is 3');
    await this.clickOn(saveOutcomeFeedbackButton);

    await this.clickOn(addHintButton);
    await this.type(richTextAreaField, '3');
    await this.clickOn(saveHintButton);

    await this.clickOn(addSolutionButton);
    await this.page.select(answerTypeDropdown, 'The only');
    await this.type(floatTextField, '3');
    await this.clickOn(submitAnswerButton);
    await this.type(richTextAreaField, '1+2 is 3');
    await this.page.waitForSelector(
      `${submitSolutionButton}:not([disabled])`);
    await this.clickOn(submitSolutionButton);

    await this.clickOn(saveQuestionButton);
  }

  /**
   * Function for navigating to the contributor dashboard page.
   */
  async navigateToCreatorDashboardPage() {
    await this.goto(creatorDashboardUrl);
  }

  /**
   * Function for creating an exploration as a curriculum admin.
   */
  async createExploration() {
    await this.clickOn(createExplorationButton);
    await this.page.waitForSelector(
      `${dismissWelcomeModalSelector}:not([disabled])`);
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForTimeout(500);
    await this.clickOn(textStateEditSelector);
    await this.type(richTextAreaField, 'Test Exploration');
    await this.clickOn(saveContentButton);

    await this.clickOn(addInteractionButton);
    await this.clickOn(interactionEndExplorationInputButton);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(
      `${saveChangesButton}:not([disabled])`);
    await this.clickOn(saveChangesButton);
    await this.clickOn(saveDraftButton);

    await this.page.waitForSelector(
      `${publishExplorationButton}:not([disabled])`);
    await this.clickOn(publishExplorationButton);
    await this.type(explorationTitleInput, 'Test Exploration');
    await this.type(explorationGoalInput, 'Test Exploration');
    await this.clickOn(explorationCategoryDropdown);
    await this.clickOn(explorationCategorySelectorChoice[0]);
    await this.clickOn(saveExplorationChangesButton);
    await this.page.waitForSelector(
      `${publishExplorationButton}:not([disabled])`);
    await this.clickOn(publishExplorationButton);
    await this.page.waitForSelector(explorationIdElement);
    const explorationIdUrl = await this.page.$eval(
      explorationIdElement,
      element => element.textContent);
    return explorationIdUrl;
  }

  /**
   * Function for creating a topic in the topics-and-skills dashboard.
   */
  async createTopic() {
    await this.clickOn(addTopicButton);
    await this.type(topicNameField, 'Test Topic 1');
    await this.type(topicUrlFragmentField, 'test-topic-one');
    await this.type(topicWebFragmentField, 'Test Topic 1');
    await this.type(topicDescriptionField, 'This topic is to test curriculum admin utility.');
    await this.clickOn(photoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(
      `${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);
    await this.page.waitForSelector(
      `${createTopicButton}:not([disabled])`);
    await this.clickOn(createTopicButton);
    await this.page.waitForSelector(addStoryButton);
    return window.location.href;
  }

  /**
   * Function for creating a subtopic as a curriculum admin.
   */
  async createSubTopic(topicPageUrl: string) {
    await this.goto(topicPageUrl);
    await this.clickOn(addSubTopicButton);
    await this.type(subTopicTitleField, 'Test Subtopic 1');
    await this.type(subTopicUrlFragmentField, 'test-subtopic-one');
    await this.clickOn(subTopicDescriptionEditorToggle)
    await this.type(richTextAreaField, 'This subtopic is to test curriculum admin utility.');
    await this.clickOn(photoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(
      `${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);
    await this.page.waitForSelector(
      `${createSubTopicButton}:not([disabled])`);
    await this.clickOn(createSubTopicButton);
  }

  /**
   * Function for creating a story for a certain topic.
   */
  async createStory(topicPageUrl: string) {
    await this.goto(topicPageUrl);
    await this.clickOn(addStoryButton);
    await this.type(storyTitleField, 'Test Story 1');
    await this.type(storyUrlFragmentField, 'test-story-one');
    await this.type(storyDescriptionField, 'This story is to test curriculum admin utility.');
    await this.clickOn(photoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(
      `${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);
    await this.page.waitForSelector(
      `${createStoryButton}:not([disabled])`);
    await this.clickOn(createStoryButton);
  }

  /**
   * Function for publishing a story as a curriculum admin.
   */
  async publishStory() {
    await this.clickOn(editorMainTabButton);
    await this.clickOn(saveStoryButton);
    await this.type(saveStoryMessageInput, 'Test publishing story as curriculum admin.');
    await this.page.waitForSelector(
      `${confirmSaveStoryButton}:not([disabled])`);
    await this.clickOn(confirmSaveStoryButton);
    await this.page.waitForTimeout(500);
    await this.clickOn(publishStoryButton);
  }

  /**
   * Function for creating a chapter for a certain story.
   */
  async createChapter(explorationId: string) {
    await this.clickOn(addChapterButton);
    await this.type(chapterTitleField, 'Test Story 1');
    await this.type(chapterExplorationIdField, explorationId);
    await this.clickOn(photoBoxButton);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(
      `${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);
    await this.page.waitForSelector(
      `${createChapterButton}:not([disabled])`);
    await this.clickOn(createChapterButton);
  }
};

export let CurriculumAdminFactory = (): ICurriculumAdmin => new CurriculumAdmin();
