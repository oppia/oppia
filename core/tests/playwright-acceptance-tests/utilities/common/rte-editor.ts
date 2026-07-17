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
 * @fileoverview Utility class to interact with RTE editor.
 */

import {Page, ElementHandle} from '@playwright/test';
import {BaseUser} from './playwright-utils';
import {showMessage} from './show-message';

const descriptionBoxSelector = 'textarea.e2e-test-description-box';
const textInputSelector = 'input.e2e-test-text-input';
const closeButtonForExtraModel = '.e2e-test-close-rich-text-component-editor';
const rteHelperModalSelector = 'oppia-rte-helper-modal';
const stateContentInputField = 'div.e2e-test-rte';
const textInputField = '.e2e-test-text-input';
const uploadImageButton = '.e2e-test-upload-image';
const useTheUploadImageButton = '.e2e-test-use-image';

interface RTETabContent {
  title: string;
  content: string;
}

export class RTEEditor extends BaseUser {
  /**
   * Adds a default collapsible block RTE element.
   */
  async addCollapsibleBlockRTE(): Promise<void> {
    await this.clickOnRTEOptionWithTitle('collapsible block');
    await this.clickOnElementWithSelector(closeButtonForExtraModel);
    await this.expectElementToBeVisible(closeButtonForExtraModel, false);
  }

  /**
   * Clicks on the RTE option with the given title.
   * @param {string} title - The title of RTE option.
   */
  async clickOnRTEOptionWithTitle(title: string): Promise<void> {
    const optionSelector = `a.cke_button[title*="${title}"]`;
    await this.expectElementToBeVisible(optionSelector);
    const optionElement = await this.page.$(optionSelector);
    if (optionElement) {
      await this.clickOnElement(optionElement);
    }
  }

  /**
   * Adds an Image RTE element.
   * @param {string} imageFilePath - Path of Image file to add.
   * @param {string} imageDescription - Image Description to add.
   * @param {string | null} imageCaption - Caption to add with image.
   */
  async addImageRTE(
    imageFilePath: string,
    imageDescription: string,
    imageCaption: string | null
  ): Promise<void> {
    await this.clickOnRTEOptionWithTitle('Insert image');

    await this.waitForNetworkIdle();
    const helperModel = await this.page.$(rteHelperModalSelector);

    // Get Fields.
    const imageDescriptionInput = await helperModel?.$(descriptionBoxSelector);
    const imageCaptionInput = await helperModel?.$(textInputSelector);

    if (imageDescriptionInput) {
      await this.typeInInputField(imageDescriptionInput, imageDescription);
    } else {
      throw new Error('Image description input not found in the helper modal');
    }
    if (imageCaptionInput && imageCaption) {
      await this.typeInInputField(imageCaptionInput, imageCaption);
    }

    await this.clickOnElementWithSelector(uploadImageButton);
    await this.uploadFile(imageFilePath);
    await this.clickOnElementWithSelector(useTheUploadImageButton);

    await this.clickOnElementWithSelector(closeButtonForExtraModel);
    await this.expectElementToBeVisible(closeButtonForExtraModel, false);
  }

  /**
   * Creates a Tab Element In RTE.
   * @param {RTETabContent[]} tabContents - A list of tab contents to add.
   */
  async addTabContentsRTE(tabContents: RTETabContent[] = []): Promise<void> {
    await this.clickOnRTEOptionWithTitle('Insert tabs');

    await this.waitForNetworkIdle();
    const helperModel = await this.page.$(rteHelperModalSelector);

    let tabTitleInputElements: ElementHandle<Element>[] = [];
    let tabContentInputElements: ElementHandle<Element>[] = [];

    if (helperModel) {
      tabTitleInputElements = await helperModel.$$(textInputSelector);
      tabContentInputElements = await helperModel.$$(stateContentInputField);
    }

    showMessage(tabContentInputElements?.length + ' tab contents found.');
    showMessage(tabTitleInputElements?.length + ' tab titles found.');

    for (let i = 0; i < tabContents.length; i++) {
      if (i > 1) {
        await this.clickOnElementWithSelector('.e2e-test-add-list-entry');
      }
      await this.clearAllTextFrom(
        `oppia-rte-helper-model input.e2e-test-text-input:nth-child(${i + 1})`
      );
      await this.clearAllTextFrom(
        `oppia-rte-helper-model ${stateContentInputField}:nth-child(${i + 1})`
      );
      if (tabTitleInputElements[i]) {
        await this.typeInInputField(
          tabTitleInputElements[i],
          tabContents[i].title
        );
      }
      if (tabContentInputElements[i]) {
        await this.typeInInputField(
          tabContentInputElements[i],
          tabContents[i].content
        );
      }
    }
    await this.clickOnElementWithSelector(closeButtonForExtraModel);
    await this.expectElementToBeVisible(closeButtonForExtraModel, false);
  }

  /**
   * Adds text with link in RTE editor.
   * @param {string} text - The text that should be displayed
   * @param {string} url - The URL to which the text should redirect to.
   */
  async addTextWithLinkRTE(text: string, url: string): Promise<void> {
    await this.clickOnRTEOptionWithTitle('Insert link');
    await this.waitForNetworkIdle();

    const helperModel = await this.page.$(rteHelperModalSelector);

    let linkInput: ElementHandle<Element> | undefined;
    let linkTextInput: ElementHandle<Element> | undefined;

    // Get Fields.
    if (helperModel) {
      const inputs = await helperModel.$$(textInputSelector);
      linkInput = inputs[0];
      linkTextInput = inputs[1];
    }

    if (linkInput && linkTextInput) {
      await this.typeInInputField(linkInput, url);
      await this.typeInInputField(linkTextInput, text);
    } else {
      throw new Error('Link input fields not found in the helper modal');
    }

    await this.clickOnElementWithSelector(closeButtonForExtraModel);
    await this.expectElementToBeVisible(closeButtonForExtraModel, false);
  }

  /**
   * Adds Video RTE element.
   * @param {string} videoUrl - Youtube Video URL
   */
  async addVideoRTE(videoUrl: string): Promise<void> {
    await this.clickOnRTEOptionWithTitle('Insert video');

    await this.expectElementToBeVisible(rteHelperModalSelector);
    const helperModel = await this.page.$(rteHelperModalSelector);

    // Get Fields.
    const videoUrlInput = await helperModel?.$(textInputField);

    if (!videoUrlInput) {
      throw new Error('Video URL input not found in the helper modal');
    }
    await this.waitForElementToStabilize(videoUrlInput);
    await this.typeInInputField(videoUrlInput, videoUrl);

    await this.expectElementToBeVisible(closeButtonForExtraModel);
    await this.clickOnElementWithSelector(closeButtonForExtraModel);
    await this.expectElementToBeVisible(closeButtonForExtraModel, false);
  }
}

export const RTEEditorFactory = (page: Page): RTEEditor => {
  return new RTEEditor(page);
};
