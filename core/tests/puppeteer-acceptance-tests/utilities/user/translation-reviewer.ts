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
 * @fileoverview Utilty class for translation submitter.
 */

import {ElementHandle} from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';
import {RTEEditor} from '../common/rte-editor';

// Common Selectors.
const activeTabSelector = '.e2e-test-active-tab';

// Contributor Dashboard Selectors.
const contributionTabSelector = '.e2e-test-contribution-tab';
const paginationBtnSelectorPrefix = '.e2e-test-pagination-button';

// Contribution Dashboard > Translate Text Tab Selectors.
const languageSelector = '.e2e-test-language-selector';
const selectedLanguageSelector = '.e2e-test-language-selector-selected';
const featuredLanguageOptionSelector = '.e2e-test-featured-language';
const languageOptionSelector = '.e2e-test-language-selector-option';
const topicSelector = '.e2e-test-topic-selector';
const selectedTopicSelector = '.e2e-test-topic-selector-selected';
const topicOptionSelector = '.e2e-test-topic-selector-option';
const opportunityItemSelector = '.e2e-test-opportunity-list-item';
const opportunityItemHeadingSelector =
  '.e2e-test-opportunity-list-item-heading';
const opportunitySubHeadingSelector =
  '.e2e-test-opportunity-list-item-subheading';
const opportunityTranslateButtonSelector =
  '.e2e-test-opportunity-list-item-button';
const translateTextModalHeaderContainerSelector =
  '.e2e-test-translate-text-header-container';
const textToTranslateContainerSelector = '.oppia-text-to-translate-container';
const skipTranslationButtonSelector = '.e2e-test-skip-translation-button';
const copyButtonSelector = '.e2e-test-copy-button';
const closeModalButtonSelector = '.e2e-test-close-modal-button';
const imageSelector = '.e2e-test-image';
const saveImageButtonSelector = '.e2e-test-close-rich-text-component-editor';
const textInputSelector = '.e2e-test-text-input';
const descriptionSelector = '.e2e-test-description-box';
const rteEditorBodySelector = '.e2e-test-rte';
const rteHelperModalContainerSelector = '.e2e-test-rte-helper-modal-container';
const skillNameInput = '.e2e-test-skill-name-input';
const skillItemInRTESelector = '.e2e-test-rte-skill-selector-item';
const contributionTableSelector = '.e2e-test-topics-table';
const pinIconSelector = '.e2e-test-pin-icon';
const backToLessonButtonSelector = '.e2e-test-back-to-lesson-button';
const modalHeaderSelector = '.e2e-test-modal-header';
const reviewCommentInputSelector = '.e2e-test-suggestion-review-message';
const acceptTranslationButtonSelector = '.e2e-test-translation-accept-button';
const rejectTranslationButtonSelector = '.e2e-test-translation-reject-button';
const reviewContentContainerSelector = '.e2e-test-review-content-container';

export class TranslationReviewer extends BaseUser {
  /**
   * Clicks on the translate button in the translation modal.
   * @param chapterName - The name of the chapter.
   * @param storyName - The name of the story.
   */
  async clickOnTranslateButtonInTranslateTextTabInTranslationReview(
    chapterName: string,
    storyName: string
  ) {
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
   * Expects the contribution table to contain a row with the given topic name,
   * accepted cards, and accepted words.
   * @param topicName - The topic name to search for.
   * @param acceptedCards - The number of accepted cards.
   * @param acceptedWords - The number of accepted words.
   */
  async expectContributionTableToContainRowInTranslationReview(
    rowValues: (string | null)[]
  ): Promise<void> {
    const rowSelector = this.isViewportAtMobileWidth()
      ? '.e2e-test-mobile-stats-row'
      : 'tr';
    const cellSelector = this.isViewportAtMobileWidth()
      ? '.e2e-test-mobile-stats-cell'
      : 'td';
    await this.expectElementToBeVisible(rowSelector);

    const tableRows = await this.page.$$(rowSelector);
    if (!tableRows || tableRows.length === 0) {
      throw new Error('No rows found in the contribution table.');
    }

    console.log('[debug] found rows:' + tableRows.length);
    for (const row of tableRows) {
      const rowCells = await row.$$(cellSelector);
      if (rowValues.length !== rowCells.length) {
        continue;
      }

      let match = true;

      for (let i = 0; i < rowValues.length; i++) {
        if (!rowValues[i]) {
          // If row cell from input is null, we skip comparing it.
          console.log('[debug] row cell from input is null');
          continue;
        }
        const cellValue = await rowCells[i].evaluate((el: Element) =>
          el.textContent?.trim()
        );
        console.log('[debug] cell value: ' + cellValue);
        console.log('[debug] row value: ' + rowValues[i]);
        if (cellValue !== rowValues[i]) {
          console.log('[debug] cell value does not match');
          match = false;
          break;
        }
      }

      console.log('[debug] match: ' + match);

      if (match) {
        return;
      }
    }

    throw new Error('Row not found in the contribution table with values.');
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
   * Expects the reject translation button to be disabled.
   */
  async expectRejectReviewButtonToBeDisabled(): Promise<void> {
    await this.expectElementToBeVisible(rejectTranslationButtonSelector);
    await this.expectElementToBeClickable(
      rejectTranslationButtonSelector,
      false
    );
  }
}

export let TranslationReviewerFactory = (): TranslationReviewer =>
  new TranslationReviewer();
