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
 * @fileoverview Logged-out users utility file.
 */

import {Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import {showMessage} from '../common/show-message';
import testConstants from '../common/test-constants';
import isElementClickable from '../../functions/is-element-clickable';

const communityLibraryUrl = testConstants.URLs.CommunityLibrary;

const signUpUsernameInputField = 'input.e2e-test-username-input';

const navbarLearnTab = 'a.e2e-test-navbar-learn-menu';

const mobileNavbarOpenSidebarButton = 'a.e2e-mobile-test-navbar-button';
const mobileSidebarOpenSelector = '.e2e-test-sidebar-menu-open';

const nextCardButton = '.e2e-test-next-card-button';
const nextCardArrowButton = '.e2e-test-next-button';

const explorationCompletionToastMessage = '.e2e-test-lesson-completion-message';

const stateConversationContent = '.e2e-test-conversation-content';

const searchInputSelector = '.e2e-test-search-input';
const lessonCardTitleSelector = '.e2e-test-exploration-tile-title';

const communityLibraryLinkInNavbarSelector =
  '.e2e-test-topnb-go-to-community-library-link';
const communityLibraryContainerSelector = '.e2e-test-library-container';
const communityLibraryLinkInNavMenuSelector = '.e2e-mobile-test-library-link';

const returnToLibraryButtonSelector = '.e2e-test-exploration-return-to-library';

export class LoggedOutUser extends BaseUser {
  /**
   * Clears all text from the username input field.
   */
  async clearUsernameInput(): Promise<void> {
    await this.clearAllTextFrom(signUpUsernameInputField);
  }

  /**
   * Clicks an element using JavaScript's native click() method.
   * This ensures Angular properly handles the event in its change detection
   * cycle, which is more reliable than Puppeteer's simulated clicks for
   * Angular components like the sidebar.
   * @param {string} selector - The CSS selector of the element to click.
   */
  private async clickWithJavaScript(selector: string): Promise<void> {
    await this.waitForElementToStabilize(selector);
    await this.page.evaluate((sel: string) => {
      const element = document.querySelector(sel) as HTMLElement;
      if (element) {
        element.click();
      }
    }, selector);
  }

  /**
   * Function to navigate to the next card in the preview tab.
   */
  async continueToNextCard(): Promise<void> {
    const currentCardContentSelector = `${stateConversationContent} p`;
    await this.page.waitForSelector(currentCardContentSelector);
    const currentCardContent = await this.page.$eval(
      currentCardContentSelector,
      el => el.textContent
    );
    try {
      await this.page.waitForSelector(nextCardButton, {timeout: 7000});
      await this.clickOnElementWithSelector(nextCardButton);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Timeout')) {
        await this.clickOnElementWithSelector(nextCardArrowButton);
      } else {
        throw error;
      }
    }

    // Wait until card content changes.
    await this.page.waitForFunction(
      ({selector, value}: {selector: string; value: string}) => {
        const element = document.querySelector(selector);
        const text = element?.textContent?.trim();
        return !!text && text !== value?.trim();
      },
      {selector: currentCardContentSelector, value: currentCardContent}
    );
  }

  /**
   * Function to verify if the exploration is completed via checking the toast message.
   * @param {string} message - The expected toast message.
   */
  async expectExplorationCompletionToastMessage(
    message: string
  ): Promise<void> {
    await this.expectElementToBeVisible(explorationCompletionToastMessage);

    const toastMessage = await this.page.$eval(
      explorationCompletionToastMessage,
      element => element.textContent
    );

    if (!toastMessage || !toastMessage.includes(message)) {
      throw new Error('Exploration did not complete successfully');
    }

    showMessage('Exploration has completed successfully');

    await this.expectElementToBeVisible(
      explorationCompletionToastMessage,
      false
    );
  }

  async expectToBeOnCommunityLibraryPage(): Promise<void> {
    await this.page.waitForFunction(
      (url: string) => window.location.href.includes(url),
      testConstants.URLs.CommunityLibrary
    );
  }

  /**
   * Navigates to the community library page using the navbar.
   */
  async navigateToCommunityLibraryOnNavbar(): Promise<void> {
    // Open navigation menu for mobile view.
    await this.openNavMenuInMobile();

    // Click on "Learn" if in desktop view.
    if (!this.isViewportAtMobileWidth()) {
      if ((await this.isElementVisible(navbarLearnTab)) !== true) {
        throw new Error('Learn tab is not visible in the navbar.');
      }
      await this.clickOnElementWithSelector(navbarLearnTab);
    }

    // Click on Community Library link.
    const selector = this.isViewportAtMobileWidth()
      ? communityLibraryLinkInNavMenuSelector
      : communityLibraryLinkInNavbarSelector;
    await this.clickOnElementWithSelector(selector);

    // Verify navigated to Community Library.
    if (
      (await this.isElementVisible(communityLibraryContainerSelector)) !== true
    ) {
      throw new Error('Community Library container is not visible.');
    }
  }

  /**
   * Navigates to the community library page.
   */
  async navigateToCommunityLibraryPage(
    verifyURL: boolean = true
  ): Promise<void> {
    await this.goto(communityLibraryUrl, verifyURL);
  }

  /**
   * Opens the mobile sidebar and waits for the animation to complete.
   * This ensures the sidebar is fully visible before interacting with elements
   * inside it.
   *
   * @throws Error if sidebar is already open (indicates a test logic error).
   */
  private async openMobileSidebar(): Promise<void> {
    // Assert precondition: sidebar should be closed.
    const sidebarAlreadyOpen = await this.page.$(mobileSidebarOpenSelector);
    if (sidebarAlreadyOpen) {
      throw new Error(
        'openMobileSidebar() called but sidebar is already open. ' +
          'This indicates a test logic error.'
      );
    }

    await this.expectElementToBeVisible(mobileNavbarOpenSidebarButton);

    // Check if navbar is hidden (e.g., scrolled up via Headroom).
    const buttonRect = await this.page.$eval(
      mobileNavbarOpenSidebarButton,
      el => {
        const rect = el.getBoundingClientRect();
        return {y: rect.y, height: rect.height};
      }
    );

    // If navbar is hidden (scrolled up), scroll to top to make it visible.
    if (buttonRect.y < 0) {
      await this.page.evaluate(() => window.scrollTo(0, 0));
      await this.page.waitForFunction(
        (selector: string) => {
          const el = document.querySelector(selector);
          if (!el) {
            return false;
          }
          const rect = el.getBoundingClientRect();
          return rect.y >= 0 && rect.height > 0;
        },
        mobileNavbarOpenSidebarButton,
        {timeout: 5000}
      );
    }

    // Wait for Angular to be stable before clicking.
    await this.waitForAngularStability();

    // Use JavaScript click to ensure Angular handles the event properly.
    await this.clickWithJavaScript(mobileNavbarOpenSidebarButton);

    await this.expectElementToBeVisible(mobileSidebarOpenSelector);

    // Wait for the sidebar slide animation to complete by checking element
    // position stability.
    await this.waitForElementToStabilize(mobileSidebarOpenSelector);
  }

  /**
   * Open the navigation menu in mobile view.
   */
  async openNavMenuInMobile(): Promise<void> {
    if (!this.isViewportAtMobileWidth()) {
      showMessage('Skipped: Open Navigation Menu (mobile).');
      return;
    }
    await this.expectElementToBeVisible(mobileNavbarOpenSidebarButton);
    await this.openMobileSidebar();
    await this.expectElementToBeVisible(communityLibraryLinkInNavMenuSelector);
    showMessage('Opened Navigation Menu (mobile).');
  }

  /**
   * Searches for a specific lesson in the search results and opens it.
   * @param {string} lessonTitle - The title of the lesson to search for.
   */
  async playLessonFromSearchResults(lessonTitle: string): Promise<void> {
    try {
      await this.page.waitForSelector(lessonCardTitleSelector);
      const searchResultsElements = await this.page.$$(lessonCardTitleSelector);
      const searchResults = await Promise.all(
        searchResultsElements.map(result =>
          this.page.evaluate(el => el.textContent.trim(), result)
        )
      );

      const lessonIndex = searchResults.indexOf(lessonTitle);
      if (lessonIndex === -1) {
        throw new Error(
          `Lesson "${lessonTitle}" not found in search results.\nFound: ${searchResults.join(', ')}`
        );
      }

      // TODO(#26453): The search page fires /searchhandler/data multiple
      // times on load, causing Angular to re-render the search results list and
      // detach ElementHandle references mid-operation. To avoid stale handles,
      // we re-query the DOM by selector and index on each poll and at click time
      // rather than holding an ElementHandle across async boundaries. Remove this
      // workaround once the upstream re-rendering issue is fixed.
      await this.page.waitForFunction(
        ({selector, index, clickableFn}) => {
          const element = document.querySelectorAll(selector)[index];
          if (!element) {
            return false;
          }
          const fn = new Function(
            'element',
            `return (${clickableFn})(element)`
          );
          return fn(element);
        },
        {
          selector: lessonCardTitleSelector,
          index: lessonIndex,
          clickableFn: isElementClickable.toString(),
        }
      );

      await this.page.evaluate(
        ({selector, index}) => {
          const element = document.querySelectorAll(selector)[
            index
          ] as HTMLElement;
          element.click();
        },
        {selector: lessonCardTitleSelector, index: lessonIndex}
      );
      await this.waitForStaticAssetsToLoad();

      await this.page.waitForSelector(lessonCardTitleSelector, {
        state: 'hidden',
      });
      showMessage(`Lesson "${lessonTitle}" opened from search results.`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const newError = new Error(
        `Failed to open lesson from search results: ${err.message}`
      );
      newError.stack = err.stack;
      throw newError;
    }
  }

  /**
   * Return to Learner Dashboard from exploration completion card.
   */
  async returnToLibraryFromExplorationCompletion(): Promise<void> {
    await this.expectElementToBeVisible(returnToLibraryButtonSelector);
    await this.clickOnElementWithSelector(returnToLibraryButtonSelector);
  }

  /**
   * Searches for a lesson in the search bar present in the community library.
   * @param {string} lessonName - The name of the lesson to search for.
   */
  async searchForLessonInSearchBar(lessonName: string): Promise<void> {
    await this.page.waitForSelector(searchInputSelector, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(searchInputSelector);
    await this.typeInInputField(searchInputSelector, lessonName);

    await this.page.keyboard.press('Enter');
    await this.page.waitForNavigation({waitUntil: 'load'});
  }

  /**
   * Types an invalid username in the username input field and blurs it.
   * Blur is needed to trigger validation on the input field.
   * @param {string} invalidUsername - The invalid username to type.
   */
  async typeInvalidUsernameInUsernameInput(
    invalidUsername: string
  ): Promise<void> {
    await this.typeInInputField(signUpUsernameInputField, invalidUsername);
    await this.page.evaluate(selector => {
      (document.querySelector(selector) as HTMLElement)?.blur();
    }, signUpUsernameInputField);
  }
}

export const LoggedOutUserFactory = (page: Page): LoggedOutUser => {
  return new LoggedOutUser(page);
};
