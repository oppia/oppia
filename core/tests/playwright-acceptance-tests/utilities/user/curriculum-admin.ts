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

import {Page} from '@playwright/test';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';
import {TopicManager} from './topic-manager';

const baseURL = testConstants.URLs.BaseURL;
const curriculumAdminThumbnailImage =
  testConstants.data.curriculumAdminThumbnailImage;
const classroomBannerImage = testConstants.data.classroomBannerImage;

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
const expandWorkedExampleButton = '.e2e-test-expand-workedexample';
const topicPreviewTab = '.e2e-test-topic-preview-tab';
const topicMobilePreviewTab = '.e2e-test-mobile-preview-tab';
const mobileNavbarDropdown =
  'div.navbar-mobile-options .e2e-test-mobile-navbar-dropdown';

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

const publishClassroomButton =
  '.e2e-test-toggle-classroom-publication-status-btn';
const saveClassroomButton = '.e2e-test-save-classroom-config-button';
const enableDiagnosticTestButton =
  '.e2e-test-toggle-diagnostic-test-status-btn';

const topicEditorMainTabFormSelector = '.e2e-test-topic-editor-main-tab';
const oldTopicNameField = '.e2e-test-topic-name-field';
const unpublishTopicButton = 'button.e2e-test-unpublish-topic-button';
const mobileUnpublishTopicButton = '.e2e-test-mobile-unpublish-topic-button';
const mobileNavbarDropdownOptions =
  '.oppia-topic-nav-topic-nav-dropdown-options';
const topicAndSkillsDashboardSelector = '.e2e-test-topics-and-skills-dashboard';
const skillEditorSelector = '.e2e-test-skill-editor';

const desktopTopicListItemSelector = '.list-item';
const desktopTopicListItemOptions = '.e2e-test-topic-edit-box';
const desktopDeleteTopicButton = '.e2e-test-delete-topic-button';
const confirmTopicDeletionButton = '.e2e-test-confirm-topic-deletion-button';
const mobileTopicEditBoxButton = '.e2e-test-mobile-topic-edit-box';
const mobileDeleteTopicButton = '.e2e-test-mobile-delete-topic-button';

const desktopSkillListItemSelector = '.list-item';
const desktopSkillListItemOptions =
  '.e2e-test-skill-edit-box .skill-edit-box-icon';
const desktopDeleteSkillButton = '.e2e-test-delete-skill-button';
const confirmSkillDeletionButton = '.e2e-test-confirm-skill-deletion-button';
const mobileSkillItemSelector = '.e2e-test-mobile-skill-item';
const mobileSkillOptionsButton =
  '.e2e-test-mobile-skills-option p.skill-edit-box-icon';
const mobileDeleteSkillButton = '.e2e-test-mobile-delete-skill-button';

const removeQuestion = '.link-off-icon';
const removeQuestionConfirmationButton =
  '.e2e-test-remove-question-confirmation-button';

const createNewSkillButton = '.e2e-test-create-skill-button';
const createNewSkillButtonInSkillDashboardSelector =
  '.e2e-test-create-skill-button-circle';
const mobileCreateSkillButton =
  '.e2e-test-mobile-create-skill-button-secondary';

const errorPageHeading = '.e2e-test-error-page-heading';
const noSkillsPresentMessageSelector = '.e2e-test-no-skills-present-message';

const editConceptCard = '.e2e-test-edit-concept-card';
const moreThanTwoWorkedExamplesError = '.e2e-test-more-than-2-workedexamples';
const saveReviewMaterialButton = '.e2e-test-save-concept-card';
const publishSkillButton = '.e2e-test-publish-skill-changes-button';
const toggleSkillEditOptionsButton =
  'div.e2e-test-mobile-toggle-skill-nav-dropdown-icon';
const mobileSaveSkillButton = '.e2e-test-mobile-save-skill-changes';
const skillMobileNavDropdown = '.e2e-test-mobile-skill-nav-dropdown-icon';
const skillMobileNavContainer = '.e2e-test-mobile-navigation-bar-container';
const skillMobilePreviewTab = '.e2e-test-mobile-preview-tab';
const skillPreviewTabButton = '.e2e-test-question-preview-tab';

const classroomTileContainerSelector = '.e2e-test-classroom-tile-container';
const classroomDetailsSelector = '.e2e-test-classroom-details';
const classroomNameSelector = '.e2e-test-classroom-name-view';
const classroomURLSelector = '.e2e-test-classroom-url-view';
const classroomFeedbackRecipientEmailSelector =
  '.e2e-test-classroom-feedback-recipient-view';
const classroomTeaserSelector = '.e2e-test-classroom-teaser-view';
const classroomTopicListIntroSelector =
  '.e2e-test-classroom-topic-list-intro-view';
const classroomCourseDetailsSelector =
  '.e2e-test-classroom-course-details-view';
const deleteClassroomButton = '.e2e-test-delete-classroom-button';
const deleteClassroomModal = '.e2e-test-delete-classroom-modal';
const confirmDeleteClassroomButton = '.e2e-test-confirm-delete-classroom';
const topicPrerequisitesContainerSelector =
  '.e2e-test-topic-prerquisites-container';
const movableClassroomTileSelector = '.e2e-test-movable-classroom-tile';

export class CurriculumAdmin extends TopicManager {
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
    // Use DOM visibility of the desktop tab instead of isViewportAtMobileWidth()
    // because CI mobile environments may report incorrect viewport dimensions.
    const desktopTabVisible = await this.page.isVisible(
      desktopSkillQuestionTab
    );

    if (desktopTabVisible) {
      await this.clickAndWaitForNavigation(desktopSkillQuestionTab, true);
    } else {
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

  private async openClassroomDetails(classroomName: string): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.expectElementToBeVisible(classroomTileContainerSelector);

    const containerElements = await this.page.$$(
      classroomTileContainerSelector
    );

    for (const container of containerElements) {
      const nameSpan = await container.$(classroomTileNameSpan);
      if (!nameSpan) {
        continue;
      }

      const name = await nameSpan.evaluate(el => el.textContent?.trim() ?? '');
      if (name !== classroomName) {
        continue;
      }

      const detailsEl = await container.$(classroomDetailsSelector);
      if (detailsEl && (await detailsEl.isVisible())) {
        return;
      }

      const tileEl = await container.$(classroomTileSelector);
      if (!tileEl) {
        throw new Error(
          `Classroom tile element not found for ${classroomName}.`
        );
      }

      await tileEl.click();
      await this.expectElementToBeVisible(classroomDetailsSelector);
      return;
    }

    throw new Error(`Classroom ${classroomName} not found.`);
  }

  async expectClassroomTileToBePresent(classroomName: string): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.expectElementToBeVisible(classroomTileNameSpan);
    const classroomTiles = await this.page.$$(classroomTileNameSpan);

    for (const tile of classroomTiles) {
      const text = await tile.evaluate(el => el.textContent?.trim() ?? '');
      if (text === classroomName) {
        showMessage(`Classroom ${classroomName} is present.`);
        return;
      }
    }

    throw new Error(`Classroom ${classroomName} not found.`);
  }

  async expectClassroomDetailsToBe(
    classroomName: string,
    classroomURL: string,
    classroomTeaser: string,
    classroomTopicListIntro: string,
    classroomCourseDetails: string,
    classroomFeedbackRecipientEmail: string = 'user@email.com'
  ): Promise<void> {
    await this.openClassroomDetails(classroomName);

    await this.expectTextContentToBe(classroomNameSelector, classroomName);
    await this.expectTextContentToBe(classroomURLSelector, classroomURL);
    await this.expectTextContentToBe(
      classroomFeedbackRecipientEmailSelector,
      classroomFeedbackRecipientEmail
    );
    await this.expectTextContentToBe(classroomTeaserSelector, classroomTeaser);
    await this.expectTextContentToBe(
      classroomTopicListIntroSelector,
      classroomTopicListIntro
    );
    await this.expectTextContentToBe(
      classroomCourseDetailsSelector,
      classroomCourseDetails
    );
  }

  async expectTopicToContainPrerequisiteTopic(
    topicName: string,
    prerequisiteTopic: string | null
  ): Promise<void> {
    const topicBox = await this.expectClassroomToContainTopic(topicName);

    if (!prerequisiteTopic) {
      await this.expectTextContentToBe(
        topicPrerequisitesContainerSelector,
        'No Prerequisites'
      );
    } else {
      const matChipElements = await topicBox.$$('mat-chip');

      for (const element of matChipElements) {
        const textContent = await element.evaluate(el => el.textContent);
        if (textContent?.includes(prerequisiteTopic)) {
          return;
        }
      }

      throw new Error(
        `Prerequisite topic ${prerequisiteTopic} not found in topic ${topicName}.`
      );
    }
  }

  async moveClassroomInOrder(classroomNames: string[]): Promise<void> {
    await this.expectElementToBeVisible(movableClassroomTileSelector);
    let requiredIndex = 0;

    for (const classroomName of classroomNames) {
      const classroomElementTexts = await this.page.$$eval(
        movableClassroomTileSelector,
        elements => elements.map(element => element.textContent?.trim())
      );

      const currentIndex = classroomElementTexts.indexOf(classroomName);
      if (currentIndex === requiredIndex) {
        requiredIndex += 1;
        continue;
      }

      const classroomElements = await this.page.$$(
        movableClassroomTileSelector
      );
      const sourceElement = classroomElements[currentIndex];
      const targetElement = classroomElements[requiredIndex];

      const sourceBoundingBox = await sourceElement.boundingBox();
      const targetBoundingBox = await targetElement.boundingBox();

      if (!sourceBoundingBox || !targetBoundingBox) {
        throw new Error('Could not get bounding box for classroom elements');
      }

      const sourceCenter = {
        x: sourceBoundingBox.x + sourceBoundingBox.width / 2,
        y: sourceBoundingBox.y + sourceBoundingBox.height / 2,
      };

      const targetCenter = {
        x: targetBoundingBox.x + targetBoundingBox.width / 2,
        y: targetBoundingBox.y + targetBoundingBox.height / 2,
      };

      await this.page.mouse.move(sourceCenter.x, sourceCenter.y);
      await this.page.mouse.down();
      await this.page.mouse.move(targetCenter.x, targetCenter.y, {
        steps: 10,
      });
      await this.page.mouse.up();

      requiredIndex += 1;
    }

    const classroomTexts = await this.page.$$eval(
      movableClassroomTileSelector,
      elements => elements.map(element => element.textContent?.trim())
    );
    expect(classroomTexts).toEqual(classroomNames);
  }

  async expectClassroomsInOrder(classroomNames: string[]): Promise<void> {
    await this.page.waitForFunction(
      ({
        selector,
        orderedClassroom,
      }: {
        selector: string;
        orderedClassroom: string[];
      }) => {
        const spans = document.querySelectorAll(selector);
        if (spans.length !== orderedClassroom.length) {
          return false;
        }
        for (let i = 0; i < spans.length; i++) {
          if (spans[i].textContent?.trim() !== orderedClassroom[i]) {
            return false;
          }
        }
        return true;
      },
      {selector: classroomTileNameSpan, orderedClassroom: classroomNames}
    );
  }

  async expectNumberOfClassroomsToBe(classroomsCount: number): Promise<void> {
    await this.navigateToClassroomAdminPage();
    if (classroomsCount > 0) {
      await this.expectElementToBeVisible(classroomTileSelector);
    }
    const classroomTiles = await this.page.$$(classroomTileSelector);

    if (classroomTiles.length === classroomsCount) {
      showMessage(`There are ${classroomsCount} classrooms present.`);
    } else {
      throw new Error(
        `Expected ${classroomsCount} classrooms but found ${classroomTiles.length}.`
      );
    }
  }

  async deleteClassroom(classroomName: string): Promise<void> {
    await this.navigateToClassroomAdminPage();
    await this.expectElementToBeVisible(classroomTileSelector);
    const classroomTiles = await this.page.$$(classroomTileSelector);

    if (classroomTiles.length === 0) {
      throw new Error('No classrooms are present.');
    }

    for (const classroomTile of classroomTiles) {
      const currentClassroomName = await classroomTile.$eval(
        classroomTileNameSpan,
        el => el.textContent?.trim()
      );

      if (currentClassroomName !== classroomName) {
        continue;
      }

      await classroomTile.click();
      await this.expectElementToBeVisible(deleteClassroomButton);
      await this.clickOnElementWithSelector(deleteClassroomButton);

      await this.expectElementToBeVisible(deleteClassroomModal);
      await this.clickOnElementWithSelector(confirmDeleteClassroomButton);
      await this.expectElementToBeVisible(deleteClassroomModal, false);

      showMessage(`Deleted ${classroomName} classroom.`);
      return;
    }

    throw new Error(`${classroomName} classroom does not exist.`);
  }

  async expectToBeInTopicEditor(topicName?: string): Promise<void> {
    await this.expectElementToBeVisible(topicEditorMainTabFormSelector);
    if (topicName) {
      await expect(this.page.locator(oldTopicNameField)).toHaveValue(topicName);
    }
  }

  async expectToBeInTopicAndSkillsDashboardPage(): Promise<void> {
    await this.expectElementToBeVisible(topicAndSkillsDashboardSelector);
  }

  async expectTopicToBePublishedInTopicsAndSkillsDashboard(
    topicName: string,
    expectedPublishedStoryCount: number,
    expectedSubtopicCount: number,
    expectedSkillsCount: number
  ): Promise<void> {
    await this.navigateToTopicAndSkillsDashboardPage();

    let topicDetails: {
      publishedStoryCount: string | null | undefined;
      subtopicCount: string | null | undefined;
      skillsCount: string | null | undefined;
      topicStatus: string | null | undefined;
    };

    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible('.e2e-test-mobile-topic-table');
      topicDetails = await this.page.evaluate(topicName => {
        const items = Array.from(document.querySelectorAll('div.topic-item'));
        const topicItem = items.find(item => {
          return (
            item
              .querySelector('div.e2e-test-mobile-topic-name a')
              ?.textContent?.trim() === topicName
          );
        }) as HTMLElement;
        if (!topicItem) {
          throw new Error(
            `Topic "${topicName}" not found in mobile dashboard.`
          );
        }
        const tds = Array.from(
          topicItem.querySelectorAll('div.topic-item-value')
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
      await this.expectElementToBeVisible('.e2e-test-topics-table');
      topicDetails = await this.page.evaluate(topicName => {
        const items = Array.from(document.querySelectorAll('.list-item'));
        const topicRow = items.find(item => {
          return (
            item.querySelector('.e2e-test-topic-name')?.textContent?.trim() ===
            topicName
          );
        });
        if (!topicRow) {
          throw new Error(`Topic "${topicName}" not found in dashboard.`);
        }
        const tds = Array.from(topicRow.querySelectorAll('td'));
        return {
          publishedStoryCount: tds[2]?.textContent?.trim(),
          subtopicCount: tds[3]?.textContent?.trim(),
          skillsCount: tds[4]?.textContent?.trim().match(/^\d+/)?.[0],
          topicStatus: tds[5]?.textContent?.trim(),
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

  async expectUnpublishTopicButtonToBeVisible(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileSaveTopicDropdown);
      await this.page.waitForSelector(mobileNavbarDropdownOptions);
      await this.expectElementToBeVisible(mobileUnpublishTopicButton);
    } else {
      await this.expectElementToBeVisible(unpublishTopicButton);
    }
  }

  async navigateToSkillsTab(): Promise<void> {
    await this.expectElementToBeVisible(skillsTab);
    await this.clickOnElementWithSelector(skillsTab);

    const skillsVisible = await this.isElementVisible(desktopSkillSelector);
    const mobileSkillsVisible =
      await this.isElementVisible(mobileSkillSelector);
    const noSkillsVisible = await this.isElementVisible(
      noSkillsPresentMessageSelector
    );
    if (!skillsVisible && !mobileSkillsVisible && !noSkillsVisible) {
      throw new Error('Skills tab content not loaded.');
    }
  }

  async clickOnCreateNewSkillButtonInSkillDashboard(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(mobileCreateSkillButton);
      await this.clickOnElementWithSelector(mobileCreateSkillButton);
    } else {
      await this.expectElementToBeVisible(
        createNewSkillButtonInSkillDashboardSelector
      );
      await this.clickOnElementWithSelector(
        createNewSkillButtonInSkillDashboardSelector
      );
    }
    await this.expectElementToBeVisible(
      '.e2e-test-new-skill-description-field'
    );
  }

  async fillSkillDetailsInNewSkillModal(
    description: string,
    reviewMaterial: string
  ): Promise<void> {
    await this.expectElementToBeVisible(skillDescriptionField);
    await this.typeInInputField(skillDescriptionField, description);
    await this.expectElementToBeVisible(skillReviewMaterialHeader);
    await this.clickOnElementWithSelector(skillReviewMaterialHeader);
    await this.clickOnElementWithSelector(richTextAreaField);
    await this.typeInInputField(richTextAreaField, reviewMaterial);
  }

  async clickOnElementAndGetNewPage(text: string): Promise<Page> {
    const newPagePromise = this.page.context().waitForEvent('page');
    await this.clickOnElementWithText(text);
    const newPage = await newPagePromise;
    await newPage.waitForLoadState('networkidle');
    return newPage;
  }

  async expectToBeInSkillEditorPage(page: Page = this.page): Promise<void> {
    await page.waitForSelector(skillEditorSelector, {state: 'visible'});
    showMessage('Navigated to skill editor page successfully.');
  }

  async unpublishTopic(topicName: string): Promise<void> {
    await this.openTopicEditor(topicName);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileSaveTopicDropdown);
      await this.page.waitForSelector(mobileNavbarDropdownOptions);
      await this.clickOnElementWithSelector(mobileUnpublishTopicButton);
      await this.page.reload({waitUntil: 'networkidle'});
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileSaveTopicDropdown);
      await this.page.waitForSelector(mobileNavbarDropdownOptions);
    } else {
      await this.clickOnElementWithSelector(unpublishTopicButton);
      await this.page.reload({waitUntil: 'networkidle'});
    }

    const isUnpublishPresent =
      await this.isTextPresentOnPage('Unpublish Topic');
    if (isUnpublishPresent) {
      throw new Error('Topic is not unpublished successfully.');
    }
    showMessage(`Topic "${topicName}" has been unpublished.`);
  }

  async deleteTopic(topicName: string): Promise<void> {
    await this.navigateToTopicAndSkillsDashboardPage();
    await this.clickOnElementWithSelector(topicsTab);

    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible('.e2e-test-mobile-topic-table');
      const topicItems = await this.page.$$('div.topic-item');
      for (const item of topicItems) {
        const nameEl = await item.$('div.e2e-test-mobile-topic-name a');
        if (!nameEl) {
          continue;
        }
        const name = await nameEl.evaluate(el => el.textContent?.trim() ?? '');
        if (name !== topicName) {
          continue;
        }

        const editBtn = await item.$(mobileTopicEditBoxButton);
        if (!editBtn) {
          throw new Error('Mobile topic edit button not found.');
        }
        await editBtn.click();

        await this.expectElementToBeVisible(mobileDeleteTopicButton);
        await this.clickOnElementWithSelector(mobileDeleteTopicButton);

        await this.expectElementToBeVisible(confirmTopicDeletionButton);
        await this.clickOnElementWithSelector(confirmTopicDeletionButton);
        await this.expectElementToBeVisible(confirmTopicDeletionButton, false);

        showMessage(`Topic "${topicName}" has been successfully deleted.`);
        return;
      }
    } else {
      await this.expectElementToBeVisible(desktopTopicListItemSelector);

      const topics = await this.page.$$(desktopTopicListItemSelector);
      for (const topic of topics) {
        const nameEl = await topic.$(desktopTopicSelector);
        if (!nameEl) {
          continue;
        }
        const name = await nameEl.evaluate(el => el.textContent?.trim() ?? '');
        if (name !== topicName) {
          continue;
        }

        const editBox = await topic.$(desktopTopicListItemOptions);
        if (!editBox) {
          throw new Error('Topic edit button not found.');
        }
        await editBox.click();

        await this.expectElementToBeVisible(desktopDeleteTopicButton);
        await this.clickOnElementWithSelector(desktopDeleteTopicButton);

        await this.expectElementToBeVisible(confirmTopicDeletionButton);
        await this.clickOnElementWithSelector(confirmTopicDeletionButton);
        await this.expectElementToBeVisible(confirmTopicDeletionButton, false);

        showMessage(`Topic "${topicName}" has been successfully deleted.`);
        return;
      }
    }
    throw new Error(`Topic "${topicName}" not found in dashboard.`);
  }

  async expectTopicNotInTopicsAndSkillDashboard(
    topicName: string
  ): Promise<void> {
    await this.navigateToTopicAndSkillsDashboardPage();
    const isEmptyDashboard = await this.isTextPresentOnPage(
      'No topics or skills have been created yet.'
    );
    if (isEmptyDashboard) {
      showMessage(`Topic "${topicName}" is not present as expected.`);
      return;
    }
    await this.clickOnElementWithSelector(topicsTab);
    const isPresent = await this.isTextPresentOnPage(topicName);
    if (isPresent) {
      throw new Error(
        `Topic "${topicName}" was found but expected to be absent.`
      );
    }
    showMessage(`Topic "${topicName}" is not present as expected.`);
  }

  async deleteSkill(skillName: string): Promise<void> {
    await this.navigateToTopicAndSkillsDashboardPage();
    await this.clickOnElementWithSelector(skillsTab);

    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible('.e2e-test-mobile-skills-table');
      const skillItems = this.page.locator(mobileSkillItemSelector);
      const count = await skillItems.count();
      for (let i = 0; i < count; i++) {
        const item = skillItems.nth(i);
        const name =
          (
            await item.locator('.e2e-test-mobile-skill-name').textContent()
          )?.trim() ?? '';
        if (name !== skillName) {
          continue;
        }

        await item.locator(mobileSkillOptionsButton).click();

        await this.expectElementToBeVisible(mobileDeleteSkillButton);
        await this.clickOnElementWithSelector(mobileDeleteSkillButton);

        // Build a stable locator for the skill row so we can wait for it to
        // detach after deletion (item.nth(i) would shift if rows reorder).
        const mobileSkillRow = this.page
          .locator(mobileSkillItemSelector)
          .filter({
            has: this.page.locator('.e2e-test-mobile-skill-name', {
              hasText: skillName,
            }),
          });

        await this.expectElementToBeVisible(confirmSkillDeletionButton);
        await this.clickOnElementWithSelector(confirmSkillDeletionButton);
        await this.expectElementToBeVisible(confirmSkillDeletionButton, false);
        // Wait for Angular to remove the row and for all network requests
        // (including the DELETE call) to settle before navigating away.
        await mobileSkillRow.waitFor({state: 'detached'});
        await this.page.waitForLoadState('networkidle');

        showMessage(`Skill "${skillName}" has been successfully deleted.`);
        return;
      }
      throw new Error(`Skill "${skillName}" not found in dashboard.`);
    } else {
      await this.expectElementToBeVisible(desktopSkillListItemSelector);

      const skillRow = this.page.locator(desktopSkillListItemSelector).filter({
        has: this.page.locator(desktopSkillSelector, {hasText: skillName}),
      });

      if (!(await skillRow.count())) {
        throw new Error(`Skill "${skillName}" not found in dashboard.`);
      }

      await skillRow.locator(desktopSkillListItemOptions).click();

      // Scope to skillRow first; fall back to full-page if not found (in case
      // the dropdown portal renders outside the .list-item container).
      let deleteBtn = skillRow.locator(desktopDeleteSkillButton);
      if (!(await deleteBtn.count())) {
        deleteBtn = this.page.locator(desktopDeleteSkillButton);
      }
      await deleteBtn.waitFor({state: 'visible'});
      await deleteBtn.click();

      await this.expectElementToBeVisible(confirmSkillDeletionButton);
      await this.clickOnElementWithSelector(confirmSkillDeletionButton);
      await this.expectElementToBeVisible(confirmSkillDeletionButton, false);
      // Wait for Angular to remove the row and for all network requests
      // (including the DELETE call) to settle before navigating away.
      await skillRow.waitFor({state: 'detached'});
      await this.page.waitForLoadState('networkidle');

      showMessage(`Skill "${skillName}" has been successfully deleted.`);
    }
  }

  async expectSkillNotInTopicsAndSkillsDashboard(
    skillName: string
  ): Promise<void> {
    await this.navigateToTopicAndSkillsDashboardPage();
    const isEmptyDashboard = await this.isTextPresentOnPage(
      'No topics or skills have been created yet.'
    );
    if (isEmptyDashboard) {
      showMessage(`Skill "${skillName}" is not present as expected.`);
      return;
    }
    await this.clickOnElementWithSelector(skillsTab);
    const isPresent = await this.isTextPresentOnPage(skillName);
    if (isPresent) {
      throw new Error(
        `Skill "${skillName}" was found but expected to be absent.`
      );
    }
    showMessage(`Skill "${skillName}" is not present as expected.`);
  }

  async removeAllQuestionsFromTheSkill(skillName: string): Promise<void> {
    await this.openSkillEditor(skillName);
    await this.navigateToSkillQuestionEditorTab();
    await this.page.waitForLoadState('networkidle');

    while (true) {
      const questionLocator = this.page.locator(removeQuestion);
      if (!(await questionLocator.count())) {
        break;
      }

      await questionLocator.first().click();
      await this.expectElementToBeVisible(removeQuestionConfirmationButton);
      await this.clickOnElementWithSelector(removeQuestionConfirmationButton);
      await this.expectElementToBeVisible(
        removeQuestionConfirmationButton,
        false
      );
      await this.page.reload({waitUntil: 'networkidle'});
    }
    showMessage(`All questions removed from skill "${skillName}".`);
  }

  async expectToBeOnErrorPage(statusCode: number): Promise<void> {
    await this.page.waitForSelector(errorPageHeading);
    const errorText = await this.page.$eval(
      errorPageHeading,
      el => (el as HTMLElement).textContent
    );
    if (!errorText) {
      throw new Error(
        `Error page heading not visible. URL: ${this.page.url()}`
      );
    }
    const currentCode = Number(errorText.replace(/\D/g, ''));
    if (currentCode !== statusCode) {
      throw new Error(
        `Expected error page ${statusCode} but found ${currentCode}.`
      );
    }
    showMessage(`Error page ${statusCode} is visible.`);
  }

  async createSkillFromTopicsAndSkillsDashboard(
    description: string,
    reviewMaterial: string
  ): Promise<void> {
    await this.expectElementToBeVisible(createNewSkillButton);
    await this.clickOnElementWithSelector(createNewSkillButton);
    await this.typeInInputField(skillDescriptionField, description);
    await this.clickOnElementWithSelector(skillReviewMaterialHeader);
    await this.clickOnElementWithSelector(richTextAreaField);
    if (reviewMaterial) {
      await this.typeInInputField(richTextAreaField, reviewMaterial);
    }
    await this.addWorkedExampleRteComponent('Type the number one', '1');
    await this.clickOnElementWithSelector(confirmSkillCreationButton);
    await this.openSkillEditor(description);
    showMessage(`Skill "${description}" created from dashboard.`);
  }

  async clickOnReviewMaterialEditButton(): Promise<void> {
    await this.expectElementToBeVisible(editConceptCard);
    await this.clickOnElementWithSelector(editConceptCard);
    await this.expectElementToBeVisible(richTextAreaField);
  }

  async addWorkedExampleRteComponent(
    question: string,
    answer: string
  ): Promise<void> {
    await this.expectElementToBeVisible(insertWorkedExampleButton);
    await this.clickOnElementWithSelector(insertWorkedExampleButton);
    await this.page.waitForSelector(editWorkedExampleModalQuestionRte, {
      state: 'visible',
    });
    await this.clearAllTextFrom(editWorkedExampleModalQuestionRte);
    await this.typeInInputField(editWorkedExampleModalQuestionRte, question);
    await this.page.waitForSelector(editWorkedExampleModalAnswerRte, {
      state: 'visible',
    });
    await this.clearAllTextFrom(editWorkedExampleModalAnswerRte);
    await this.waitForElementToStabilize(editWorkedExampleModalAnswerRte);
    await this.typeInInputField(editWorkedExampleModalAnswerRte, answer);
    await this.clickOnElementWithSelector(rteComponentSaveButton);
    await this.page.waitForSelector(editWorkedExampleModalAnswerRte, {
      state: 'hidden',
    });
  }

  async saveReviewMaterial(): Promise<void> {
    await this.expectElementToBeVisible(saveReviewMaterialButton);
    await this.clickOnElementWithSelector(saveReviewMaterialButton);
  }

  async clickOnRteAndPressEnter(): Promise<void> {
    await this.clickOnReviewMaterialEditButton();
    await this.clickOnElementWithSelector(richTextAreaField);
    await this.page.keyboard.press('Enter');
  }

  async clearRteAndCheckIfErrorDisappears(): Promise<void> {
    await this.expectElementToBeVisible(richTextAreaField);
    await this.clickOnElementWithSelector(richTextAreaField);
    await this.clearAllTextFrom(richTextAreaField);
    await this.page.waitForSelector(moreThanTwoWorkedExamplesError, {
      state: 'hidden',
    });
  }

  async publishSkillChanges(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      const elems = await this.page.$$(toggleSkillEditOptionsButton);
      await elems[1].click();
      await this.clickOnElementWithSelector(mobileSaveSkillButton);
    } else {
      await this.expectElementToBeVisible(publishSkillButton);
      await this.clickOnElementWithSelector(publishSkillButton);
    }
    await this.typeInInputField(
      saveChangesMessageInput,
      'Test saving skill as curriculum admin.'
    );
    await this.page.waitForSelector(`${closeSaveModalButton}:not([disabled])`);
    await this.clickOnElementWithSelector(closeSaveModalButton);
    await this.page.waitForSelector('oppia-skill-editor-save-modal', {
      state: 'hidden',
    });
  }

  async navigateToSkillPreviewTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      if (!(await this.isElementVisible(skillMobileNavContainer, true, 5000))) {
        await this.clickOnElementWithSelector(mobileOptionsSelector);
      }
      const navDropdownElements = await this.page.$$(skillMobileNavDropdown);
      await this.waitForElementToBeClickable(navDropdownElements[1]);
      await navDropdownElements[1].click();
      await this.expectElementToBeVisible(skillMobilePreviewTab);
      await this.clickOnElementWithSelector(skillMobilePreviewTab);
    } else {
      await this.clickOnElementWithSelector(skillPreviewTabButton);
    }
    await this.waitForPageToFullyLoad();
  }

  async checkWorkedExamplesExistForSkill(
    workedExamples: string[][]
  ): Promise<void> {
    for (let i = 0; i < workedExamples.length; i++) {
      const isQuestionPresent = await this.isTextPresentOnPage(
        workedExamples[i][0]
      );
      if (!isQuestionPresent) {
        throw new Error(
          `Expected WorkedExample Question ${workedExamples[i][0]} to be present on the page, but it was not found.`
        );
      }
      const isAnswerPresent = await this.isTextPresentOnPage(
        workedExamples[i][1]
      );
      if (!isAnswerPresent) {
        throw new Error(
          `Expected WorkedExample Answer ${workedExamples[i][1]} to be present on the page, but it was not found.`
        );
      }
    }
  }

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
      await this.clickOnElementWithSelector(subtopicReassignHeader);
    }
    await this.clickOnElementWithSelector(addSubtopicButton);
    await this.typeInInputField(subtopicTitleField, title);
    await this.expectElementToBeVisible(subtopicUrlFragmentField);
    await this.typeInInputField(subtopicUrlFragmentField, urlFragment);

    await this.typeInInputField(subtopicStudyGuideHeadingField, heading);
    await this.clickOnElementWithSelector(subtopicStudyGuideContentField);
    await this.expectElementToBeVisible(richTextAreaField);
    await this.typeInInputField(richTextAreaField, content);
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
      await this.typeInInputField(editWorkedExampleModalAnswerRte, '1');
      await this.clickOnElementWithSelector(rteComponentSaveButton);
    }

    await this.clickOnElementWithSelector(subtopicPhotoBoxButton);
    await this.expectElementToBeVisible(photoUploadModal);
    await this.uploadFile(curriculumAdminThumbnailImage);
    await this.expectElementToBeVisible(`${uploadPhotoButton}:not([disabled])`);
    await this.clickOnElementWithSelector(uploadPhotoButton);

    await this.expectElementToBeVisible(photoUploadModal, false);
    await this.clickOnElementWithSelector(createSubtopicButton);
    await this.expectElementToBeVisible(modalDiv, false);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(showSectionsList);
      await this.scrollToBottomOfPage();
    }
    await this.expectElementToBeVisible(firstStudyGuideSectionTile);
    showMessage(`Subtopic ${title} is created.`);
  }

  async checkAddSectionModalShowsLengthError(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElementWithSelector(showSubtopicsList);
      await this.clickOnElementWithSelector(firstSubtopicTile);
      await this.clickOnElementWithSelector(showSectionsList);
    }
    await this.expectElementToBeVisible(addStudyGuideSectionButton);
    await this.clickOnElementWithSelector(addStudyGuideSectionButton);
    await this.typeInInputField(
      addStudyGuideSectionModalHeading,
      'Section Heading'
    );
    await this.clickOnElementWithSelector(addStudyGuideSectionModalContent);
    await this.expectElementToBeVisible(richTextAreaField);
    const longText =
      'This sentence is 84 characters long. Multiply it by 72 to get more than 6000 chars. '.repeat(
        72
      );
    await this.page.evaluate(async textContent => {
      await navigator.clipboard.writeText(textContent);
    }, longText);

    const richTextAreaFieldElement =
      await this.getElementInParent(richTextAreaField);
    await richTextAreaFieldElement.focus();
    const pasteModifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await this.page.keyboard.down(pasteModifier);
    await this.page.keyboard.press('KeyV');
    await this.page.keyboard.up(pasteModifier);
    await this.expectElementToBeVisible(addStudyGuideSectionContentLength);
  }

  async clearContentFieldAndCloseAddSectionModal(): Promise<void> {
    await this.clearAllTextFrom(richTextAreaField);
    await this.expectElementToBeVisible(
      addStudyGuideSectionContentLength,
      false
    );
    await this.clickOnElementWithSelector(
      addStudyGuideSectionModalCancelButton
    );
  }

  async addSubtopicStudyGuideSection(
    sectionHeading: string,
    sectionContent: string,
    currentNumberOfSections: number
  ): Promise<void> {
    await this.clickOnElementWithSelector(addStudyGuideSectionButton);
    await this.typeInInputField(
      addStudyGuideSectionModalHeading,
      sectionHeading
    );
    await this.clickOnElementWithSelector(addStudyGuideSectionModalContent);
    await this.expectElementToBeVisible(richTextAreaField);
    await this.typeInInputField(richTextAreaField, sectionContent);
    await this.clickOnElementWithSelector(addStudyGuideSectionModalSaveButton);
    if (this.isViewportAtMobileWidth()) {
      await this.scrollToBottomOfPage();
    }
    await this.expectElementToBeVisible(
      `.e2e-test-study-guide-section-${currentNumberOfSections}`
    );
    await this.expectElementToBeVisible(deleteStudyGuideSectionButton);
  }

  async addSubtopicStudyGuideSectionWithWorkedExample(
    sectionHeading: string,
    sectionContent: string,
    currentNumberOfSections: number,
    workedExampleQuestion: string,
    workedExampleAnswer: string
  ): Promise<void> {
    await this.expectElementToBeVisible(addStudyGuideSectionButton);
    await this.clickOnElementWithSelector(addStudyGuideSectionButton);
    await this.typeInInputField(
      addStudyGuideSectionModalHeading,
      sectionHeading
    );
    await this.clickOnElementWithSelector(addStudyGuideSectionModalContent);
    await this.expectElementToBeVisible(richTextAreaField);
    await this.typeInInputField(richTextAreaField, sectionContent);
    await this.clickOnElementWithSelector(insertWorkedExampleButton);
    await this.expectElementToBeVisible(editWorkedExampleModalQuestionRte);
    await this.typeInInputField(
      editWorkedExampleModalQuestionRte,
      workedExampleQuestion
    );
    await this.expectElementToBeVisible(editWorkedExampleModalAnswerRte);
    await this.typeInInputField(
      editWorkedExampleModalAnswerRte,
      workedExampleAnswer
    );
    await this.clickOnElementWithSelector(rteComponentSaveButton);
    await this.clickOnElementWithSelector(addStudyGuideSectionModalSaveButton);
    if (this.isViewportAtMobileWidth()) {
      await this.scrollToBottomOfPage();
    }
    await this.expectElementToBeVisible(
      `.e2e-test-study-guide-section-${currentNumberOfSections}`
    );
    await this.expectElementToBeVisible(deleteStudyGuideSectionButton);
  }

  async expandStudyGuideSectionTile(index: number): Promise<void> {
    await this.clickOnElementWithSelector(
      `.e2e-test-study-guide-section-${index}`
    );
    await this.expectElementToBeVisible(
      `.e2e-test-study-guide-section-${index}-expanded`
    );
    await this.expectElementToBeVisible(expandedStudyGuideSectionTileHeading);
    await this.expectElementToBeVisible(expandedStudyGuideSectionTileContent);
  }

  async openSectionHeadingEditor(): Promise<void> {
    await this.clickOnElementWithSelector(editStudyGuideSectionHeadingIcon);
    await this.expectElementToBeVisible(editStudyGuideSectionHeadingEditor);
  }

  async openSectionContentEditor(): Promise<void> {
    await this.clickOnElementWithSelector(editStudyGuideSectionContentIcon);
    if (this.isViewportAtMobileWidth()) {
      await this.scrollToBottomOfPage();
    }
    await this.expectElementToBeVisible(editStudyGuideSectionContentEditor);
  }

  async deleteStudyGuideSection(index: number): Promise<void> {
    await this.clickOnElementWithSelector(
      `.e2e-test-study-guide-section-${index} ${deleteStudyGuideSectionButton}`
    );
    await this.clickOnElementWithSelector(studyGuideSectionDeleteConfirmButton);

    await this.expectElementToBeVisible(
      studyGuideSectionDeleteConfirmButton,
      false
    );
  }

  async previewStudyGuide(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(showSubtopicsList);
      await this.clickOnElementWithSelector(showSubtopicsList);
      await this.clickOnElementWithSelector(firstSubtopicTile);
      await this.clickOnElementWithSelector(mobileOptionsSelector);
      await this.clickOnElementWithSelector(mobileNavbarDropdown);
      await this.clickOnElementWithSelector(topicMobilePreviewTab);
    } else {
      await this.expectElementToBeVisible(topicPreviewTab);
      await this.clickOnElementWithSelector(topicPreviewTab);
    }
    await this.waitForPageToFullyLoad();
  }

  async expectSubtopicStudyGuideToHaveTitleAndSections(
    studyGuideTitle: string,
    studyGuideSections: string[][],
    expectWorkedExample: boolean
  ): Promise<void> {
    const isTitlePresent = await this.isTextPresentOnPage(studyGuideTitle);
    if (!isTitlePresent) {
      throw new Error(
        'Expected study guide title to be present, but it was not found.'
      );
    }

    for (let i = 0; i < studyGuideSections.length; i++) {
      const [heading, content] = studyGuideSections[i];
      const isHeadingPresent = await this.isTextPresentOnPage(heading);
      if (!isHeadingPresent) {
        throw new Error(
          `Expected study guide section ${i + 1} heading to be present on the page, but it was not found`
        );
      }
      const isContentPresent = await this.isTextPresentOnPage(content);
      if (!isContentPresent) {
        throw new Error(
          `Expected study guide section ${i + 1} content to be present on the page, but it was not found`
        );
      }
    }
    if (expectWorkedExample) {
      await this.expectElementToBeVisible(expandWorkedExampleButton);
    }
  }

  async clearRte(): Promise<void> {
    await this.expectElementToBeVisible(richTextAreaField);
    await this.clickOnElementWithSelector(richTextAreaField);
    await this.clearAllTextFrom(richTextAreaField);
  }

  async typeTextInReviewMaterialEditor(text: string): Promise<void> {
    await this.expectElementToBeVisible(richTextAreaField);
    await this.clickOnElementWithSelector(richTextAreaField);
    await this.typeInInputField(richTextAreaField, text);
  }

  async copyWorkedExampleFromReviewMaterialRte(): Promise<string> {
    await this.expectElementToBeVisible(richTextAreaField);
    const html = await this.page.evaluate((selector: string) => {
      const el = document.querySelector(selector);
      // eslint-disable-next-line oppia/no-inner-html
      return el ? el.innerHTML : '';
    }, richTextAreaField);
    return html;
  }

  async copyContentFromReviewMaterialRte(): Promise<string> {
    await this.expectElementToBeVisible(richTextAreaField);
    const html = await this.page.evaluate((selector: string) => {
      const el = document.querySelector(selector);
      // eslint-disable-next-line oppia/no-inner-html
      return el ? el.innerHTML : '';
    }, richTextAreaField);
    return html;
  }
}

export const CurriculumAdminFactory = (page: Page): CurriculumAdmin => {
  return new CurriculumAdmin(page);
};
