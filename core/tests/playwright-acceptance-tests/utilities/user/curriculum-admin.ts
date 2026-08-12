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
}

export const CurriculumAdminFactory = (page: Page): CurriculumAdmin => {
  return new CurriculumAdmin(page);
};
