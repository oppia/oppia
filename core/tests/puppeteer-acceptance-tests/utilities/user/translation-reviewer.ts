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
import {showMessage} from '../common/show-message';

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
const updateTranslationBtnSelector = '.e2e-test-update-translation-button';

const toastMessageSelector = '.e2e-test-toast-message';

// How long to wait when checking whether the review modal is still open after
// a suggestion has been resolved. The modal closes without a request of its
// own, so this only has to cover a render.
const reviewModalProbeTimeoutMsecs = 2000;

// A resolved suggestion is held for thirty seconds so that it can be undone,
// and only reaches the server when that window closes, which is when the
// outcome toast appears. Reviewing another suggestion flushes the held one
// straight away, so only the last one waits the full window. The bound below
// leaves margin over that thirty seconds, because the default selector
// timeout is exactly thirty seconds and would race it.
const reviewCommitTimeoutMsecs = 45000;

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
    await translateButton.evaluate(el => (el as HTMLElement).click());

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
    const maxRetries = 3;
    let opportunityItem: ElementHandle<Element> | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.expectElementToBeVisible(opportunityItemSelector);
        const opportunityItems = await this.page.$$(opportunityItemSelector);

        for (const opportunityItemElement of opportunityItems) {
          const opportunityItemHeading = await opportunityItemElement.evaluate(
            (el: Element, sel: string) =>
              el.querySelector(sel)?.textContent?.trim(),
            opportunityItemHeadingSelector
          );
          const opportunityItemSubHeading =
            await opportunityItemElement.evaluate(
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
        if (opportunityItem) {
          break;
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('detached')) {
          continue;
        }
        throw error;
      }
      // Wait a moment before retrying if the element wasn't found (it might be rendering).
      await this.page.waitForTimeout(1000);
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

    // Puppeteer scrolls a target back to the centre of the viewport before
    // it dispatches a mouse event, which parks the button underneath the
    // sticky header and delivers the click to the header instead.
    // By evaluating the click, it is dispatched on the element itself where
    // it cannot be intercepted.
    if (this.isViewportAtMobileWidth()) {
      await opportunityItem.evaluate(el => (el as HTMLElement).click());
    } else {
      const translateButton = await opportunityItem.waitForSelector(
        opportunityTranslateButtonSelector
      );
      if (!translateButton) {
        throw new Error(
          `Translate button for chapter ${chapterName} and story ${subheading} not found.`
        );
      }
      await translateButton.evaluate(el => (el as HTMLElement).click());
    }

    await this.expectModalTitleToBe('Review Translation Contributions');
  }

  /**
   * Opens the first suggestion in the list for review. The modal decides its
   * button labels, and whether it closes or walks to the next suggestion, from
   * the position of the row that was opened, so opening the first row keeps
   * that behaviour the same no matter how the list happens to be sorted.
   */
  async openFirstSuggestionForReview(): Promise<void> {
    await this.expectElementToBeVisible(opportunityItemSelector);
    const [firstSuggestion] = await this.page.$$(opportunityItemSelector);
    if (!firstSuggestion) {
      throw new Error('There are no suggestions to review.');
    }

    if (this.isViewportAtMobileWidth()) {
      // At mobile width the whole row is the button, and the click is
      // dispatched on it so the sticky navigation bar cannot intercept it.
      await firstSuggestion.evaluate(el => (el as HTMLElement).click());
    } else {
      const reviewButton = await firstSuggestion.waitForSelector(
        opportunityTranslateButtonSelector
      );
      if (!reviewButton) {
        throw new Error('The review button on the first suggestion is absent.');
      }
      await reviewButton.evaluate(el => (el as HTMLElement).click());
    }

    await this.expectModalTitleToBe('Review Translation Contributions');
  }

  /**
   * Opens the first suggestion in the list and accepts every suggestion the
   * modal then walks through. Opening the first row means the modal holds all
   * of the suggestions, so one pass resolves the whole list without reading it
   * again. That matters because an accepted suggestion is queued for thirty
   * seconds so it can be undone, and its row deliberately stays in the list
   * until that window closes.
   * @param expectedToastMessage - The toast each accept raises.
   * @param maxSuggestions - Safety bound so a modal that stops closing fails
   *     instead of looping forever.
   */
  async acceptAllSuggestionsInReviewModal(
    expectedToastMessage: string,
    maxSuggestions: number
  ): Promise<void> {
    await this.openFirstSuggestionForReview();

    for (let accepted = 1; accepted <= maxSuggestions; accepted++) {
      await this.clickOnElementWithSelector(acceptTranslationButtonSelector);

      const modalIsStillOpen = await this.isElementVisible(
        reviewModalContainerSelector,
        true,
        reviewModalProbeTimeoutMsecs
      );
      if (!modalIsStillOpen) {
        // Only the last accept is still held behind the undo window. Waiting
        // for its toast is what proves every translation has reached the
        // server, which is what a learner then has to be able to see.
        await this.expectReviewOutcomeToast(expectedToastMessage);
        showMessage(`Accepted ${accepted} suggestions.`);
        return;
      }
    }

    throw new Error(
      `The review modal was still open after accepting ${maxSuggestions} ` +
        'suggestions.'
    );
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
      await this.typeInInputField(reviewCommentInputSelector, reviewMessage);
    }

    await this.expectElementToBeVisible(reviewContentContainerSelector);
    const initialReviewContent = await this.page.$eval(
      reviewContentContainerSelector,
      el => el.textContent
    );

    await this.clickOnElementWithSelector(buttonSelector);

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

  /**
   * Clicks on update translation button.
   */
  async clickOnUpdateTranslationButton(): Promise<void> {
    await this.clickOnElementWithSelector(updateTranslationBtnSelector);
    await this.expectElementToBeVisible(updateTranslationBtnSelector, false);
  }

  /**
   * Checks the label on an opportunity card's action button.
   * @param heading - The heading of the opportunity card.
   * @param subheading - The subheading of the opportunity card.
   * @param label - The label the action button is expected to carry.
   */
  async expectOpportunityActionButtonToBe(
    heading: string,
    subheading: string,
    label: string
  ): Promise<void> {
    const opportunityItem = await this.getTranslationOpportunityCard(
      heading,
      subheading
    );
    const buttonText = await opportunityItem.evaluate(
      (el: Element, sel: string) => el.querySelector(sel)?.textContent?.trim(),
      opportunityTranslateButtonSelector
    );
    if (buttonText !== label) {
      throw new Error(
        `Expected the action button on "${heading}" to read "${label}", but ` +
          `it read "${buttonText}".`
      );
    }
  }

  /**
   * Checks whether the "Back to lessons" control is shown. It sits above the
   * suggestion list on the lesson path only, so its absence is what
   * distinguishes the skills path, where the suggestions are listed without an
   * opportunity card to click through first.
   * @param visible - Whether the control should be shown.
   */
  async expectBackToLessonsControlToBeVisible(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(backToLessonButtonSelector, visible);
  }

  /**
   * Submits a review and checks the toast it raises. The toast is short-lived,
   * so it is checked immediately after the click rather than after waiting for
   * the next suggestion to load.
   * @param reviewType - Whether to accept or reject the suggestion.
   * @param expectedToastMessage - The toast the review is expected to raise.
   * @param reviewMessage - The comment to leave, required to reject.
   */
  async submitTranslationReviewAndExpectToast(
    reviewType: 'accept' | 'reject',
    expectedToastMessage: string,
    reviewMessage?: string
  ): Promise<void> {
    const buttonSelector =
      reviewType === 'accept'
        ? acceptTranslationButtonSelector
        : rejectTranslationButtonSelector;
    if (reviewMessage) {
      await this.expectElementToBeVisible(reviewCommentInputSelector);
      await this.typeInInputField(reviewCommentInputSelector, reviewMessage);
    }

    await this.clickOnElementWithSelector(buttonSelector);
    await this.expectReviewOutcomeToast(expectedToastMessage);
  }

  /**
   * Waits for the toast that a review raises once it has been committed to the
   * server. The commit is deferred behind the undo window, so this cannot use
   * the shared toast helper, whose wait is exactly as long as that window.
   * @param expectedToastMessage - The toast the review is expected to raise.
   */
  async expectReviewOutcomeToast(expectedToastMessage: string): Promise<void> {
    const toast = await this.page.waitForSelector(toastMessageSelector, {
      visible: true,
      timeout: reviewCommitTimeoutMsecs,
    });
    const toastMessage = await this.page.evaluate(
      el => el.textContent.trim(),
      toast
    );
    if (toastMessage !== expectedToastMessage) {
      throw new Error(
        `Expected the review toast to be "${expectedToastMessage}", but it ` +
          `was "${toastMessage}".`
      );
    }
  }

  /**
   * Checks the label on the accept or reject button, which names the next
   * suggestion while more remain and drops that mention on the last one.
   * @param reviewType - Whether to check the accept or the reject button.
   * @param label - The label the button is expected to carry.
   */
  async expectReviewButtonLabelToBe(
    reviewType: 'accept' | 'reject',
    label: string
  ): Promise<void> {
    await this.expectTextContentToBe(
      reviewType === 'accept'
        ? acceptTranslationButtonSelector
        : rejectTranslationButtonSelector,
      label
    );
  }
}

export let TranslationReviewerFactory = (): TranslationReviewer =>
  new TranslationReviewer();
