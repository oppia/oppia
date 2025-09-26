// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utilty class for translation reviewer.
 */

import {ElementHandle} from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';

const opportunityItemSelector = '.e2e-test-opportunity-list-item';
const opportunityItemHeadingSelector =
  '.e2e-test-opportunity-list-item-heading';
const opportunitySubHeadingSelector =
  '.e2e-test-opportunity-list-item-subheading';
const opportunityTranslateButtonSelector =
  '.e2e-test-opportunity-list-item-button';
const translateTextModalHeaderContainerSelector =
  '.e2e-test-translate-text-header-container';
const pinIconSelector = '.e2e-test-pin-icon';
const backToLessonButtonSelector = '.e2e-test-back-to-lesson-button';
const modalHeaderSelector = '.e2e-test-modal-header';
const reviewCommentInputSelector = '.e2e-test-suggestion-review-message';
const acceptTranslationButtonSelector = '.e2e-test-translation-accept-button';
const rejectTranslationButtonSelector = '.e2e-test-translation-reject-button';
const reviewContentContainerSelector = '.e2e-test-review-content-container';
const translatedContentContainerSelector = '.e2e-test-translated-content';
const reviewModalContainerSelector = '.e2e-test-translation-review-modal';

export class TranslationReviewer extends BaseUser {
  /**
   * Clicks on the translate button in the translation modal.
   * @param chapterName - The name of the chapter.
   * @param storyName - The name of the story.
   */
  async clickOnTranslateButtonInTranslateTextTabInTranslationReview(
    chapterName: string,
    storyName: string
  ): Promise<void> {
    const initbackToLessonButtonVisible = await this.isElementVisible(
      backToLessonButtonSelector
    );

    const opportunityItem = await this.getTranslationOpportunityCard(
      chapterName,
      storyName
    );
    // Click on translate button in the opportunity item.
    const translateButton = await opportunityItem.waitForSelector(
      opportunityTranslateButtonSelector
    );
    if (!translateButton) {
      throw new Error(
        `Translate button for chapter ${chapterName} and story ${storyName} not found.`
      );
    }
    await translateButton.click();

    // Verify that the translation editor is opened.
    const backToLessonButtonVisible = await this.isElementVisible(
      backToLessonButtonSelector
    );
    const commonModalHeaderVisible =
      await this.isElementVisible(modalHeaderSelector);
    const translateTextModalHeaderVisible = await this.isElementVisible(
      translateTextModalHeaderContainerSelector
    );
    if (
      backToLessonButtonVisible === initbackToLessonButtonVisible &&
      !commonModalHeaderVisible &&
      !translateTextModalHeaderVisible
    ) {
      throw new Error('Translate/Review button not clicked properly.');
    }
  }

  /**
   * Returns the opportunity card for the given chapter and story.
   * @param {string} heading - The name of the chapter.
   * @param {string} storyName - The name of the story.
   * @returns {Promise<ElementHandle<Element>>} A promise that resolves to the opportunity card element.
   */
  async getTranslationOpportunityCard(
    heading: string,
    subheading: string
  ): Promise<ElementHandle<Element>> {
    await this.expectElementToBeVisible(opportunityItemSelector);

    const opportunityItems = await this.page.$$(opportunityItemSelector);
    let opportunityItem: ElementHandle<Element> | null = null;
    for (const opportunityItemElement of opportunityItems) {
      const opportunityItemHeading = await opportunityItemElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim(),
        opportunityItemHeadingSelector
      );
      const opportunityItemSubHeading = await opportunityItemElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim(),
        opportunitySubHeadingSelector
      );

      if (
        opportunityItemHeading === heading &&
        opportunityItemSubHeading?.includes(subheading)
      ) {
        opportunityItem = opportunityItemElement;
        break;
      }
    }

    if (!opportunityItem) {
      throw new Error(
        `Opportunity item for chapter ${heading} and story ${subheading} not found.`
      );
    }
    return opportunityItem;
  }

  /**
   * Starts a translation review.
   * @param {string} chapterName - The name of the chapter.
   * @param {string} subheading - The subheading of the chapter.
   */
  async startTranslationReview(
    chapterName: string,
    subheading: string
  ): Promise<void> {
    const opportunityItem = await this.getTranslationOpportunityCard(
      chapterName,
      subheading
    );

    if (this.isViewportAtMobileWidth()) {
      await opportunityItem.click();
    } else {
      // Click on translate button in the opportunity item.
      const translateButton = await opportunityItem.waitForSelector(
        opportunityTranslateButtonSelector
      );
      if (!translateButton) {
        throw new Error(
          `Translate button for chapter ${chapterName} and story ${subheading} not found.`
        );
      }
      await translateButton.click();
    }

    await this.expectModalTitleToBe('Review Translation Contributions');
  }

  /**
   * Checks if the pin icon is visible in the review page.
   */
  async expectPinIconToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(pinIconSelector);
  }

  /**
   * Adds a translation review.
   * @param reviewType - The type of the review to add.
   * @param reviewMessage - The message to add to the review.
   */
  async submitTranslationReview(
    reviewType: 'accept' | 'reject',
    reviewMessage?: string
  ): Promise<void> {
    const buttonSelector =
      reviewType === 'accept'
        ? acceptTranslationButtonSelector
        : rejectTranslationButtonSelector;
    if (reviewMessage) {
      await this.expectElementToBeVisible(reviewCommentInputSelector);
      await this.type(reviewCommentInputSelector, reviewMessage);
    }

    await this.expectElementToBeVisible(reviewContentContainerSelector);
    const initialReviewContent = await this.page.$eval(
      reviewContentContainerSelector,
      el => el.textContent
    );

    await this.clickOn(buttonSelector);

    await this.page.waitForFunction(
      (selector: string, initialContent: string) => {
        const element = document.querySelector(selector);
        return element?.textContent !== initialContent;
      },
      {},
      reviewContentContainerSelector,
      initialReviewContent
    );
  }

  /**
   * Checks if the review content is as expected.
   * @param expectedContent - The expected content.
   */
  async expectCardContentToBeInTranslationReview(
    expectedContent: string
  ): Promise<void> {
    await this.expectTextContentToBe(
      `${reviewContentContainerSelector} ${translatedContentContainerSelector}`,
      expectedContent
    );
  }

  /**
   * Expects the reject translation button to be disabled.
   */
  async expectRejectReviewButtonToBeDisabled(): Promise<void> {
    await this.expectElementToBeVisible(rejectTranslationButtonSelector);
    await this.expectElementToBeClickable(
      rejectTranslationButtonSelector,
      false
    );
  }

  /**
   * Checks if the review modal is present or not.
   * @param {boolean} present - Whether the modal should be present.
   */
  async expectReviewModalToBePresent(present: boolean = true): Promise<void> {
    await this.expectElementToBeVisible(reviewModalContainerSelector, present);
  }
}

export let TranslationReviewerFactory = (): TranslationReviewer =>
  new TranslationReviewer();
