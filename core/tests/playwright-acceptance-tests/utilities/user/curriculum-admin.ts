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
}

export const CurriculumAdminFactory = (page: Page): CurriculumAdmin => {
  return new CurriculumAdmin(page);
};
