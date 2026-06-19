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
 * @fileoverview Logged-in users utility file.
 */

import {Page, expect} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const baseUrl = testConstants.URLs.BaseURL;
const learnerDashboardUrl = testConstants.URLs.LearnerDashboard;

const anonymousCheckboxSelector = '.e2e-test-stay-anonymous-checkbox';
const feedbackTextareaSelector = '.e2e-test-exploration-feedback-textarea';
const submitButtonSelector = '.e2e-test-exploration-feedback-submit-btn';
const submittedMessageSelector = '.e2e-test-rating-submitted-message';

const homeTabSectionInLearnerDashboard = '.e2e-test-learner-dash-home-tab';
const explorationCard = '.e2e-test-exploration-dashboard-card';
const desktopLessonCardTitleSelector = '.e2e-test-exploration-tile-title';
const lessonCardTitleSelector = '.e2e-test-exploration-tile-title';
const desktopAddToPlayLaterButton = '.e2e-test-add-to-playlist-btn';
const mobileAddToPlayLaterButton = '.e2e-test-mobile-add-to-playlist-btn';
const mobileLessonCardTitleSelector = '.e2e-test-exp-summary-tile-title';
const mobileCommunityLessonSectionButton = '.e2e-test-mobile-lessons-section';
const communityLessonsSectionButton = '.e2e-test-community-lessons-section';
const removeFromPlayLaterButtonSelector = '.e2e-test-remove-from-playlist-btn';
const confirmRemovalFromPlayLaterButton =
  '.e2e-test-confirm-delete-interaction';
const playLaterSectionSelector = '.e2e-test-play-later-section';
const lessonCardTitleInPlayLaterSelector = `${playLaterSectionSelector} .e2e-test-exploration-tile-title`;
const mobileLessonCardOptionsDropdownButton =
  '.e2e-test-mobile-lesson-card-dropdown';
const progressSectionSelector = '.e2e-test-progress-section';

const ratingsHeaderSelector = '.conversation-skin-final-ratings-header';
const ratingStarSelector = '.e2e-test-rating-star';
const filledRatingStarSelector = '.fas.fa-star';

// Learner dashboard selectors.
const communityLessonsSectionInLearnerDashboard =
  '.e2e-test-community-lessons-section';

const commonPlayLaterIconSelector = '.e2e-test-lesson-playlist-icon';
const learnerDashboardIconsSelector = 'oppia-learner-dashboard-icons';

// Community Library.
const learnerPlaylistModalSelector = 'oppia-learner-playlist-modal';

export class LoggedInUser extends BaseUser {
  /**
   * Adds a lesson to the 'Play Later' list from community library page.
   * @param {string} lessonTitle - The title of the lesson to add to the 'Play Later' list.
   * @param {boolean} skipVerification - Skip verification that user is logged in and login popup has closed.
   */
  async addLessonToPlayLater(
    lessonTitle: string,
    skipVerification: boolean = false
  ): Promise<void> {
    try {
      await this.waitForPageToFullyLoad();
      const isMobileViewport = this.isViewportAtMobileWidth();
      const lessonCardTitleSelector = isMobileViewport
        ? mobileLessonCardTitleSelector
        : desktopLessonCardTitleSelector;

      await this.expectElementToBeVisible(lessonCardTitleSelector);
      const lessonTitles = await this.page.$$eval(
        lessonCardTitleSelector,
        elements => elements.map(el => el.textContent?.trim())
      );

      const lessonIndex = lessonTitles.indexOf(lessonTitle);

      if (lessonIndex === -1) {
        throw new Error(`Lesson "${lessonTitle}" not found in search results.`);
      }

      if (isMobileViewport) {
        await this.expectElementToBeAttachedInDOM(
          learnerDashboardIconsSelector
        );
        const iconContainers = await this.page.$$(
          learnerDashboardIconsSelector
        );
        const dropdownIcon = await iconContainers[lessonIndex].$(
          mobileLessonCardOptionsDropdownButton
        );
        await dropdownIcon?.click();

        await iconContainers[lessonIndex].waitForSelector(
          mobileAddToPlayLaterButton
        );
        const mobileAddToPlayLaterButtonElement = await iconContainers[
          lessonIndex
        ].$(mobileAddToPlayLaterButton);

        await mobileAddToPlayLaterButtonElement?.click();
      } else {
        await this.expectElementToBeAttachedInDOM(desktopAddToPlayLaterButton);
        const addToPlayLaterButtons = await this.page.$$(
          desktopAddToPlayLaterButton
        );
        await addToPlayLaterButtons[lessonIndex].click();
      }

      // Post-check: Verify if the tooltip appears.
      if (!skipVerification) {
        await this.expectToastMessage(
          "Successfully added to your 'Play Later' list."
        );
      }

      showMessage(`Lesson "${lessonTitle}" added to 'Play Later' list.`);
    } catch (error) {
      const newError = new Error(
        `Failed to add lesson to 'Play Later' list: ${error}`
      );
      newError.stack = (error as Error).stack;
      throw newError;
    }
  }

  /**
   * Navigates to the learner dashboard.
   */
  async navigateToLearnerDashboard(): Promise<void> {
    await this.goto(learnerDashboardUrl);
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(homeTabSectionInLearnerDashboard);
  }

  /**
   * Check if rating stars are displayed.
   */
  async expectRatingStarsToBeVisible(): Promise<void> {
    await this.page.waitForFunction(
      ({headerSelector, starSelector, expectedCount}) => {
        const header = document.querySelector(headerSelector);
        if (!header) {
          return false;
        }
        return document.querySelectorAll(starSelector).length === expectedCount;
      },
      {
        headerSelector: ratingsHeaderSelector,
        starSelector: ratingStarSelector,
        expectedCount: 5,
      }
    );
  }

  /**
   * Expects the tooltip text of the 'Play Later' icon for the given lesson title to match the expected tooltip text.
   * @param {string} lessonTitle - The title of the lesson to check the 'Play Later' icon tooltip text for.
   * @param {string} expectedTooltip - The expected tooltip text for the 'Play Later' icon.
   */
  async expectPlayLaterIconToolTipToBe(
    lessonTitle: string,
    expectedTooltip: string
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      showMessage('Skipped tooltip message check in mobile view.');
      return;
    }
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(explorationCard);

    const lessonCards = await this.page.$$(explorationCard);
    const lessonTitles = await Promise.all(
      lessonCards.map(async card => {
        const titleElement = await card.$(lessonCardTitleSelector);
        const title = titleElement?.evaluate(el => el?.textContent?.trim());
        return title;
      })
    );

    const lessonIndex = lessonTitles.indexOf(lessonTitle);
    if (lessonIndex === -1) {
      throw new Error(`Lesson "${lessonTitle}" not found in search results.`);
    }

    const playLaterButtons = await this.page.$$(commonPlayLaterIconSelector);
    const playLaterButton = playLaterButtons[lessonIndex];

    if (!playLaterButton) {
      throw new Error('Play Later button not found');
    }

    await playLaterButton?.hover({force: true});

    await this.expectElementToBeVisible('.tooltip');

    // Check the tooltip content.
    const tooltipText = await this.page.$eval('.tooltip', el => el.textContent);
    expect(tooltipText).toBe(expectedTooltip);
  }

  /**
   * Waits for the given number of filled stars to be present on the page.
   * @param rating The number of filled stars to wait for.
   */
  async expectStarRatingToBe(rating: number): Promise<void> {
    await this.page.waitForFunction(
      ({selector, rating}: {selector: string; rating: number}) => {
        const filledStars = document.querySelectorAll(selector);
        return filledStars.length === rating;
      },
      {selector: filledRatingStarSelector, rating}
    );
  }

  /**
   * Navigates to the community library tab of the learner dashboard.
   */
  async navigateToCommunityLessonsSection(): Promise<void> {
    await this.waitForPageToFullyLoad();
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(progressSectionSelector);
      await this.clickOnElementWithSelector(progressSectionSelector);

      try {
        await this.expectElementToBeVisible(mobileCommunityLessonSectionButton);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Timeout')) {
          // Try clicking again if does not opens the expected page.
          await this.clickOnElementWithSelector(progressSectionSelector);
        } else {
          throw error;
        }
      }
      await this.clickOnElementWithSelector(mobileCommunityLessonSectionButton);
    } else {
      await this.expectElementToBeVisible(progressSectionSelector);
      await this.clickOnElementWithSelector(communityLessonsSectionButton);
    }

    await this.expectElementToBeVisible(
      communityLessonsSectionInLearnerDashboard
    );
  }

  /**
   * Navigates to the exploration page and starts playing the exploration.
   * @param {string} explorationId - The ID of the exploration to play.
   */
  async playExploration(explorationId: string | null): Promise<void> {
    await this.goto(`${baseUrl}/explore/${explorationId as string}`);
  }

  /**
   * Function to play a specific lesson from the community library tab in learner dashboard.
   * @param {string} lessonName - The name of the lesson to be played.
   */
  async playLessonFromDashboard(lessonName: string): Promise<void> {
    try {
      await this.expectElementToBeVisible(lessonCardTitleSelector);
      const searchResultsElements = await this.page.$$(lessonCardTitleSelector);
      const searchResults = await Promise.all(
        searchResultsElements.map(result =>
          this.page.evaluate(el => el.textContent?.trim() || '', result)
        )
      );

      const lessonIndex = searchResults.indexOf(lessonName);
      if (lessonIndex === -1) {
        throw new Error(`Lesson "${lessonName}" not found in search results.`);
      }

      await this.waitForElementToBeClickable(
        searchResultsElements[lessonIndex]
      );
      await searchResultsElements[lessonIndex].click();

      await this.expectElementToBeVisible(lessonCardTitleSelector, false);
    } catch (error) {
      const newError = new Error(
        `Failed to play lesson from dashboard: ${error}`
      );
      newError.stack = (error as Error).stack;
      throw newError;
    }
  }

  /**
   * Rates an exploration by clicking on the rating stars, providing feedback, and optionally staying anonymous.
   *
   * @param {number} rating - The rating to give to the exploration.
   * @param {string} feedback - The feedback to provide for the exploration.
   * @param {boolean} stayAnonymous - Whether to stay anonymous or not.
   */
  async rateExploration(
    rating: number,
    feedback: string,
    stayAnonymous: boolean
  ): Promise<void> {
    try {
      await this.page.waitForSelector(ratingsHeaderSelector);
      const ratingStars = await this.page.$$(ratingStarSelector);
      await this.waitForElementToBeClickable(ratingStars[rating - 1]);
      await ratingStars[rating - 1].click();

      await this.typeInInputField(feedbackTextareaSelector, feedback);
      if (stayAnonymous) {
        await this.clickOnElementWithSelector(anonymousCheckboxSelector);
      }

      await this.clickOnElementWithSelector(submitButtonSelector);

      // Fix for flaky test (#23488). This uses a single, atomic page.$eval()
      // call to prevent a race condition where the element could be removed
      // from the DOM before its text was read. Using textContent is also
      // more reliable than innerText for automated tests.
      // Explicitly wait for the submitted message to be visible on the page.
      await this.page.waitForSelector(submittedMessageSelector, {
        state: 'visible',
      });
      // Now that we know it's visible, we can safely get its text content.
      const submittedMessageText = await this.page.$eval(
        submittedMessageSelector,
        (el: Element) => el.textContent
      );
      if (
        !submittedMessageText ||
        submittedMessageText.trim() !== 'Thank you for the feedback!'
      ) {
        throw new Error(
          `Unexpected submitted message text: ${submittedMessageText}`
        );
      }
    } catch (error) {
      const newError = new Error(`Failed to rate exploration: ${error}`);
      newError.stack = (error as Error).stack;
      throw newError;
    }
  }

  /**
   * Removes a lesson from the 'Play Later' list in the learner dashboard.
   * @param {string} lessonName - The name of the lesson to remove from the 'Play Later' list.
   */
  async removeLessonFromPlayLater(lessonName: string): Promise<void> {
    try {
      await this.expectElementToBeVisible(lessonCardTitleInPlayLaterSelector);
      const lessonCards = await this.page.$$(
        lessonCardTitleInPlayLaterSelector
      );
      const lessonNames = await Promise.all(
        lessonCards.map(card =>
          this.page.evaluate(el => el.textContent?.trim() || '', card)
        )
      );

      const lessonIndex = lessonNames.indexOf(lessonName);
      if (lessonIndex === -1) {
        throw new Error(
          `Lesson "${lessonName}" not found in 'Play Later' list.`
        );
      }

      // Scroll to the element before hovering so the remove button could be visible.
      await this.page.evaluate(
        el => el.scrollIntoView(),
        lessonCards[lessonIndex]
      );
      await this.page.hover(lessonCardTitleInPlayLaterSelector);

      await this.expectElementToBeVisible(removeFromPlayLaterButtonSelector);
      const removeFromPlayLaterButton = await this.page.$(
        removeFromPlayLaterButtonSelector
      );
      await removeFromPlayLaterButton?.click();

      // Confirm removal.
      await this.clickOnElementWithSelector(confirmRemovalFromPlayLaterButton);

      await this.expectElementToBeVisible(
        confirmRemovalFromPlayLaterButton,
        false
      );

      showMessage(`Lesson "${lessonName}" removed from 'Play Later' list.`);
    } catch (error) {
      const newError = new Error(
        `Failed to remove lesson from 'Play Later' list: ${error}`
      );
      newError.stack = (error as Error).stack;
      throw newError;
    }
  }

  /**
   * Removes a lesson from the 'Play Later' list in the community library.
   * @param {string} lessonTitle - The title of the lesson to remove from the 'Play Later' list.
   */
  async removeLessonFromPlayLaterInlibrary(lessonTitle: string): Promise<void> {
    await this.waitForPageToFullyLoad();
    const isMobileViewport = this.isViewportAtMobileWidth();
    const lessonCardTitleSelector = isMobileViewport
      ? mobileLessonCardTitleSelector
      : desktopLessonCardTitleSelector;

    const lessonTitles = await this.page.$$eval(
      lessonCardTitleSelector,
      elements => elements.map(el => el.textContent?.trim())
    );

    const lessonIndex = lessonTitles.indexOf(lessonTitle);
    if (lessonIndex === -1) {
      throw new Error(`Lesson "${lessonTitle}" not found in search results.`);
    }

    const playLaterButtons = await this.page.$$(commonPlayLaterIconSelector);
    const playLaterButton = playLaterButtons[lessonIndex];

    if (!playLaterButton) {
      throw new Error('Play Later button not found');
    }

    await playLaterButton.click({force: true});

    await this.expectElementToBeVisible(learnerPlaylistModalSelector);

    await this.isTextPresentOnPage("Remove from 'Play Later' list?");

    await this.clickOnElementWithSelector(confirmRemovalFromPlayLaterButton);
    await this.expectElementToBeVisible(learnerPlaylistModalSelector, false);
  }

  /**
   * Verifies whether a lesson is in the 'Play Later' list.
   * @param {string} lessonName - The name of the lesson to check.
   * @param {boolean} shouldBePresent - Whether the lesson should be present in the 'Play Later' list.
   */
  async verifyLessonPresenceInPlayLater(
    lessonName: string,
    shouldBePresent: boolean
  ): Promise<void> {
    try {
      await this.waitForStaticAssetsToLoad();
      await this.expectElementToBeVisible(playLaterSectionSelector);
      const lessonCards = await this.page.$$(
        lessonCardTitleInPlayLaterSelector
      );
      const lessonNames = await Promise.all(
        lessonCards.map(card =>
          this.page.evaluate(el => el.textContent?.trim() || '', card)
        )
      );

      const lessonIndex = lessonNames.indexOf(lessonName);
      if (lessonIndex !== -1 && !shouldBePresent) {
        throw new Error(
          `Lesson "${lessonName}" was found in 'Play Later' list, but it should not be.`
        );
      }

      if (lessonIndex === -1 && shouldBePresent) {
        throw new Error(
          `Lesson "${lessonName}" was not found in 'Play Later' list, but it should be.`
        );
      }
    } catch (error) {
      const newError = new Error(
        `Failed to verify presence of lesson in 'Play Later' list: ${error}`
      );
      newError.stack = (error as Error).stack;
      throw newError;
    }
  }
}

export const LoggedInUserFactory = (page: Page): LoggedInUser => {
  return new LoggedInUser(page);
};
