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

import {BaseUser} from '../puppeteer-testing-utilities/puppeteer-utils';
import {showMessage} from '../puppeteer-testing-utilities/show-message-utils';
import testConstants from '../puppeteer-testing-utilities/test-constants';

const curriculumAdminThumbnailImage =
  testConstants.images.curriculumAdminThumbnailImage;
const topicAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;
const creatorDashboardUrl = testConstants.URLs.CreatorDashboard;

const richTextAreaField = 'div.e2e-test-rte';
const floatTextField = '.e2e-test-rule-details .e2e-test-float-form-input';
const solutionFloatTextField =
  'oppia-add-or-update-solution-modal .e2e-test-float-form-input';
const textStateEditSelector = 'div.e2e-test-state-edit-content';
const saveContentButton = 'button.e2e-test-save-state-content';

const saveChangesButton = 'button.e2e-test-save-changes';
const saveDraftButton = 'button.e2e-test-save-draft-button';
const publishExplorationButton = 'button.e2e-test-publish-exploration';
const modalDiv = 'div.modal-content';
const closeSaveModalButton = '.e2e-test-close-save-modal-button';

const photoBoxButton = 'div.e2e-test-photo-button';
const subtopicPhotoBoxButton =
  '.e2e-test-subtopic-thumbnail .e2e-test-photo-button';
const storyPhotoBoxButton =
  'oppia-create-new-story-modal .e2e-test-photo-button';
const chapterPhotoBoxButton =
  '.e2e-test-chapter-input-thumbnail .e2e-test-photo-button';
const uploadPhotoButton = 'button.e2e-test-photo-upload-submit';
const photoUploadModal = 'edit-thumbnail-modal';

const createQuestionButton = 'div.e2e-test-create-question';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const interactionNumberInputButton =
  'div.e2e-test-interaction-tile-NumericInput';
const interactionEndExplorationInputButton =
  'div.e2e-test-interaction-tile-EndExploration';
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
const explorationCategoryDropdown =
  'mat-form-field.e2e-test-exploration-category-metadata-modal';
const saveExplorationChangesButton = 'button.e2e-test-confirm-pre-publication';
const explorationConfirmPublishButton = 'button.e2e-test-confirm-publish';
const explorationIdElement = 'span.oppia-unique-progress-id';

const topicsTab = 'a.e2e-test-topics-tab';
const topic = 'a.e2e-test-topic-name';
const addTopicButton = 'button.e2e-test-create-topic-button';
const topicNameField = 'input.e2e-test-new-topic-name-field';
const topicUrlFragmentField = 'input.e2e-test-new-topic-url-fragment-field';
const topicWebFragmentField = 'input.e2e-test-new-page-title-fragm-field';
const topicDescriptionField = 'textarea.e2e-test-new-topic-description-field';
const createTopicButton = 'button.e2e-test-confirm-topic-creation-button';
const saveTopicButton = 'button.e2e-test-save-topic-button';
const topicMetaTagInput = '.e2e-test-topic-meta-tag-content-field';
const publishTopicButton = 'button.e2e-test-publish-topic-button';

const addSubtopicButton = 'button.e2e-test-add-subtopic-button';
const subtopicTitleField = 'input.e2e-test-new-subtopic-title-field';
const subtopicUrlFragmentField =
  'input.e2e-test-new-subtopic-url-fragment-field';
const subtopicDescriptionEditorToggle = 'div.e2e-test-show-schema-editor';
const createSubtopicButton = '.e2e-test-confirm-subtopic-creation-button';

const skillsTab = 'a.e2e-test-skills-tab';
const skill = 'a.e2e-test-open-skill-editor';
const skillDescriptionField = 'input.e2e-test-new-skill-description-field';
const skillReviewMaterialHeader = 'div.e2e-test-open-concept-card';
const addSkillButton = 'button.e2e-test-add-skill-button';
const confirmSkillCreationButton =
  'button.e2e-test-confirm-skill-creation-button';

const assignSkillButton = 'i.e2e-test-skill-item-edit-btn';
const subtopicRadioButton = '.mat-radio-button';
const confirmSkillAssignationButton =
  'button.e2e-test-skill-assign-subtopic-confirm';

const addDiagnosticTestSkillButton =
  'button.e2e-test-add-diagnostic-test-skill';
const diagnosticTestSkillSelector =
  'select.e2e-test-diagnostic-test-skill-selector';

const addStoryButton = 'button.e2e-test-create-story-button';
const storyTitleField = 'input.e2e-test-new-story-title-field';
const storyDescriptionField = 'textarea.e2e-test-new-story-description-field';
const storyUrlFragmentField = 'input.e2e-test-new-story-url-fragment-field';
const createStoryButton = 'button.e2e-test-confirm-story-creation-button';
const saveStoryButton = 'button.e2e-test-save-story-button';
const saveStoryMessageInput = 'textarea.e2e-test-commit-message-input';
const publishStoryButton = 'button.e2e-test-publish-story-button';
const storyMetaTagInput = '.e2e-test-story-meta-tag-content-field';

const addChapterButton = 'button.e2e-test-add-chapter-button';
const chapterTitleField = 'input.e2e-test-new-chapter-title-field';
const chapterExplorationIdField = 'input.e2e-test-chapter-exploration-input';
const createChapterButton = 'button.e2e-test-confirm-chapter-creation-button';

interface Skill {
  description: string;
  reviewMaterial: string;
  questionCount: number;
}

interface Exploration {
  state: string;
  title: string;
  goal: string;
}

interface Topic {
  name: string;
  url_fragment: string;
  web_fragment: string;
  description: string;
}

interface Subtopic {
  title: string;
  url_fragment: string;
  description: string;
}

interface Story {
  title: string;
  url_fragment: string;
  description: string;
}

export class CurriculumAdmin extends BaseUser {
  /**
   * Function for navigating to the topic and skills dashboard page.
   */
  async navigateToTopicAndSkillsDashboardPage(): Promise<void> {
    await this.page.bringToFront();
    await this.goto(topicAndSkillsDashboardUrl);
  }

  /**
   * Function for creating a skill in the topics and skills dashboard.
   * We need to generate at least 3 questions for the skill as a
   * pre-requisite for publishing the topic later.
   */
  async createSkill(skill: Skill): Promise<void> {
    await this.openTopicEditor();
    await this.clickOn(addSkillButton);
    await this.type(skillDescriptionField, skill.description);
    await this.page.waitForSelector(skillReviewMaterialHeader);
    await this.clickOn(skillReviewMaterialHeader);
    await this.clickOn(richTextAreaField);
    await this.type(richTextAreaField, skill.reviewMaterial);
    await this.page.waitForSelector(
      `${confirmSkillCreationButton}:not([disabled])`
    );
    await this.clickOn(confirmSkillCreationButton);
    await this.page.bringToFront();

    for (let i = 0; i < skill.questionCount; i++) {
      await this.createQuestion();
    }
    await this.assignSkillToSubtopic();
  }

  /**
   * Function for creating a question in the skill editor page.
   */
  async createQuestion(): Promise<void> {
    await this.openSkillEditor();
    await this.clickOn(createQuestionButton);
    await this.clickOn(textStateEditSelector);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.type(richTextAreaField, 'Add 1+2');
    await this.page.waitForSelector(`${saveContentButton}:not([disabled])`);
    await this.clickOn(saveContentButton);

    await this.clickOn(addInteractionButton);
    await this.page.waitForSelector(modalDiv, {visible: true});
    await this.clickOn(interactionNumberInputButton);
    await this.clickOn(saveInteractionButton);
    await this.clickOn(responseRuleDropdown);
    await this.clickOn(equalsRuleButtonText);
    await this.type(floatTextField, '3');
    await this.clickOn(answersInGroupAreCorrectToggle);
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
  }

  /**
   * Function for navigating to the contributor dashboard page.
   */
  async navigateToCreatorDashboardPage(): Promise<void> {
    await this.page.bringToFront();
    await this.goto(creatorDashboardUrl);
  }

  /**
   * Function for creating an exploration as a curriculum admin.
   */
  async createExploration(exploration: Exploration): Promise<string | null> {
    await this.clickOn(createExplorationButton);
    await this.page.waitForSelector(
      `${dismissWelcomeModalSelector}:not([disabled])`
    );
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      hidden: true,
    });
    await this.clickOn(textStateEditSelector);
    await this.page.keyboard.press('Tab');
    await this.type(richTextAreaField, exploration.state);
    await this.clickOn(saveContentButton);

    await this.clickOn(addInteractionButton);
    await this.clickOn(interactionEndExplorationInputButton);
    await this.clickOn(saveInteractionButton);
    await this.clickOn(saveChangesButton);
    await this.clickOn(saveDraftButton);

    await this.page.waitForSelector(
      `${publishExplorationButton}:not([disabled])`
    );
    await this.clickOn(publishExplorationButton);
    await this.type(explorationTitleInput, exploration.title);
    await this.type(explorationGoalInput, exploration.goal);
    await this.clickOn(explorationCategoryDropdown);
    await this.clickOn('Algebra');
    await this.clickOn(saveExplorationChangesButton);
    await this.page.waitForSelector(
      `${publishExplorationButton}:not([disabled])`
    );
    await this.clickOn(publishExplorationButton);
    await this.clickOn(explorationConfirmPublishButton);
    await this.page.waitForSelector(explorationIdElement);
    const explorationIdUrl = await this.page.$eval(
      explorationIdElement,
      element => element.textContent
    );
    return explorationIdUrl;
  }

  async getExplorationIdFromUrl(url: string | null): Promise<string> {
    if (!url) {
      throw new Error('Exploration URL is null or empty');
    }
    const parts = url.split('/');
    const explorationId = parts.length > 0 ? parts[parts.length - 1] : '';
    if (!explorationId) {
      throw new Error('Failed to extract exploration ID from URL');
    }
    return explorationId;
  }

  /**
   * Function for creating a topic in the topics-and-skills dashboard.
   */
  async createTopic(topic: Topic): Promise<void> {
    await this.clickOn(addTopicButton);
    await this.type(topicNameField, topic.name);
    await this.type(topicUrlFragmentField, topic.url_fragment);
    await this.type(topicWebFragmentField, topic.web_fragment);
    await this.type(topicDescriptionField, topic.description);

    await this.clickOn(photoBoxButton);
    await this.page.waitForSelector(photoUploadModal, {visible: true});
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);
    await this.page.waitForSelector(photoUploadModal, {hidden: true});
    await this.clickOn(createTopicButton);

    await this.openTopicEditor();
    await this.page.waitForSelector(topicMetaTagInput);
    await this.page.focus(topicMetaTagInput);
    await this.page.type(topicMetaTagInput, 'meta');
    await this.page.keyboard.press('Tab');
    await this.saveTopicDraft();
  }

  /**
   * Function that opens the topic editor page for the topic created.
   */
  async openTopicEditor(): Promise<void> {
    await this.page.bringToFront();
    await this.navigateToTopicAndSkillsDashboardPage();
    await this.clickOn(topicsTab);
    await this.clickOn(topic);
  }

  /**
   * Function that opens the skill editor page for the topic created.
   */
  async openSkillEditor(): Promise<void> {
    await this.page.bringToFront();
    await this.navigateToTopicAndSkillsDashboardPage();
    await this.clickOn(skillsTab);
    await this.clickOn(skill);
  }

  async saveTopicDraft(): Promise<void> {
    await this.page.waitForSelector(modalDiv, {hidden: true});
    await this.clickOn(saveTopicButton);
    await this.clickOn(closeSaveModalButton);
    await this.page.waitForSelector(closeSaveModalButton, {hidden: true});
  }

  /**
   * Function for creating a subtopic as a curriculum admin.
   */
  async createSubtopic(subtopic: Subtopic): Promise<void> {
    await this.openTopicEditor();
    await this.clickOn(addSubtopicButton);
    await this.type(subtopicTitleField, subtopic.title);
    await this.type(subtopicUrlFragmentField, subtopic.url_fragment);

    await this.clickOn(subtopicDescriptionEditorToggle);
    await this.page.waitForSelector(richTextAreaField, {visible: true});
    await this.type(richTextAreaField, subtopic.description);

    await this.clickOn(subtopicPhotoBoxButton);
    await this.page.waitForSelector(photoUploadModal, {visible: true});
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.page.waitForSelector(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOn(uploadPhotoButton);

    await this.page.waitForSelector(photoUploadModal, {hidden: true});
    await this.clickOn(createSubtopicButton);
    await this.saveTopicDraft();
  }

  /**
   * Function for assigning a skill to a subtopic in the topic editor page.
   */
  async assignSkillToSubtopic() {
    await this.openTopicEditor();
    await this.clickOn(assignSkillButton);
    await this.page.waitForSelector('.e2e-test-assign-subtopic', {
      visible: true,
    });
    await this.clickOn('Assign to Subtopic');
    await this.page.waitForSelector(modalDiv, {visible: true});
    await this.clickOn(subtopicRadioButton);
    await this.page.waitForSelector(
      `${confirmSkillAssignationButton}:not([disabled])`
    );
    await this.clickOn(confirmSkillAssignationButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});
    await this.saveTopicDraft();
  }

  /**
   * Function for adding a skill for diagnostic tests and then publishing the topic.
   * Adding a skill to diagnostic tests is necessary for publishing the topic.
   */
  async addDiagnosticTestSkillAndPublishTopic(skill: Skill) {
    await this.openTopicEditor();
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
      skill.description,
      diagnosticTestSkillSelector
    );

    await this.saveTopicDraft();
    await this.clickOn(publishTopicButton);
  }

  /**
   * Function for creating a story, executing chapter creation for
   * the story, and then publishing the story.
   */
  async createAndPublishStoryWithChapter(
    story: Story,
    explorationId: string
  ): Promise<void> {
    await this.openTopicEditor();
    await this.clickOn(addStoryButton);
    await this.type(storyTitleField, story.title);
    await this.type(storyUrlFragmentField, story.url_fragment);
    await this.type(storyDescriptionField, story.description);

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
    await this.page.waitForSelector(`${publishStoryButton}:not([disabled])`);
    await this.clickOn(publishStoryButton);
  }

  /**
   * Function for creating a chapter for a certain story.
   */
  async createChapter(explorationId: string): Promise<void> {
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
   * Function for saving a story as a curriculum admin.
   */
  async saveStoryDraft(): Promise<void> {
    await this.clickOn(saveStoryButton);
    await this.clickOn(closeSaveModalButton);
    await this.page.waitForSelector(modalDiv, {visible: true});
    await this.type(
      saveStoryMessageInput,
      'Test saving story as curriculum admin.'
    );
    await this.page.waitForSelector(`${closeSaveModalButton}:not([disabled])`);
    await this.clickOn(closeSaveModalButton);
    await this.page.waitForSelector(modalDiv, {hidden: true});
  }

  /**
   * This function checks if the topic has been published successfully,
   * by verifying the status and the counts in the topic and skills dashboard.
   */
  async expectPublishedTopicToBePresent(): Promise<void> {
    await this.navigateToTopicAndSkillsDashboardPage();
    await this.page.waitForSelector('.e2e-test-topics-table', {visible: true});

    let topicStatusText = await this.page.$eval(
      'span.topic-list-status-text',
      element => (element as HTMLElement).innerText
    );

    let topicDetails = await this.page.$eval(
      '.e2e-test-topics-table tr.list-item',
      element => {
        let tds = Array.from(element.querySelectorAll('td'));
        if (!tds) {
          throw new Error('Cannot fetch topic details.');
        }
        return {
          publishedStoryCount: tds[2].textContent?.trim().split(' ')[0] || '0',
          subtopicCount: tds[3].textContent?.trim().split(' ')[0] || '0',
          skillsCount: tds[4].textContent?.trim().split(' ')[0] || '0',
        };
      }
    );
    expect(topicStatusText).toEqual('Published');
    expect(topicDetails.subtopicCount).toEqual('1');
    expect(topicDetails.publishedStoryCount).toEqual('1');
    expect(topicDetails.skillsCount).toEqual('1');
    showMessage(`Topic has been published successfully!`);
  }
}

export let CurriculumAdminFactory = (): CurriculumAdmin =>
  new CurriculumAdmin();
