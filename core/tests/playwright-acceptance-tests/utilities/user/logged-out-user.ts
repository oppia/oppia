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

import {expect, Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import {showMessage} from '../common/show-message';
import testConstants from '../common/test-constants';
import isElementClickable from '../../functions/is-element-clickable';

const aboutUrl = testConstants.URLs.About;
const communityLibraryUrl = testConstants.URLs.CommunityLibrary;
const homeUrl = testConstants.URLs.Home;

const signUpUsernameInputField = 'input.e2e-test-username-input';

const mobileNavbarButtonSelector = '.text-uppercase';
const navbarLearnTab = 'a.e2e-test-navbar-learn-menu';
const languageDropdown = '.e2e-test-language-dropdown';
const navbarAboutTab = 'a.e2e-test-navbar-about-menu';
const navbarAboutTabAboutButton = 'a.e2e-test-about-link';

const mobileNavbarOpenSidebarButton = 'a.e2e-mobile-test-navbar-button';
const mobileSidebarOpenSelector = '.e2e-test-sidebar-menu-open';
const mobileSidebarExpandAboutMenuButton =
  'div.e2e-mobile-test-sidebar-expand-about-menu';
const mobileSidebarAboutButton = 'a.e2e-mobile-test-sidebar-about-button';

const nextCardButton = '.e2e-test-next-card-button';
const nextCardArrowButton = '.e2e-test-next-button';

const explorationCompletionToastMessage = '.e2e-test-lesson-completion-message';

const stateConversationContent = '.e2e-test-conversation-content';

const searchInputSelector = '.e2e-test-search-input';
const lessonCardTitleSelector = '.e2e-test-exploration-tile-title';

const resumeExplorationButton = '.resume-button';
const restartExplorationButton = '.restart-button';
const submitAnswerButton = '.e2e-test-submit-answer-button';
const submitResponseToInteractionInput = 'oppia-interaction-display input';

const previousConversationToggleSelector = '.e2e-test-previous-responses-text';
const formErrorContainer = '.e2e-test-form-error-container';
const checkpointModalSelector = '.lesson-info-tooltip-add-ons';
const closeLessonInfoTooltipSelector = '.e2e-test-close-lesson-info-tooltip';
const progressRemainderModalSelector = '.oppia-progress-reminder-modal';

const communityLibraryLinkInNavbarSelector =
  '.e2e-test-topnb-go-to-community-library-link';
const communityLibraryContainerSelector = '.e2e-test-library-container';
const communityLibraryLinkInNavMenuSelector = '.e2e-mobile-test-library-link';

const returnToLibraryButtonSelector = '.e2e-test-exploration-return-to-library';

const lessonInfoButton = '.oppia-lesson-info';
const lessonInfoCardSelector = '.oppia-lesson-info-card';
const hintButtonSelector = '.e2e-test-view-hint';
const gotItButtonSelector = '.e2e-test-learner-got-it-button';

const contributorIconInLessonInfoSelctor =
  '.e2e-test-lesson-info-contributor-profile';
const profileContainerSelector = '.e2e-test-profile-container';

export class LoggedOutUser extends BaseUser {
  /**
   * Clears all text from the username input field.
   */
  async clearUsernameInput(): Promise<void> {
    await this.clearAllTextFrom(signUpUsernameInputField);
  }

  /**
   * Clicks on first contributor in Lesson Info model.
   */
  async clickOnProfileIconInLessonInfoModel(): Promise<void> {
    await this.page.waitForSelector(contributorIconInLessonInfoSelctor, {
      state: 'visible',
    });
    await this.waitForElementToStabilize(contributorIconInLessonInfoSelctor);
    await this.clickOnElementWithSelector(contributorIconInLessonInfoSelctor);
    await this.expectElementToBeVisible(profileContainerSelector);

    expect(this.page.url()).toContain('/profile');
  }

  /**
   * Function to change the site language to the given language code.
   * @param langCode - The language code to change the site language to. Example: 'pt-br', 'en'
   */
  async changeSiteLanguage(langCode: string): Promise<void> {
    const languageOption = `.e2e-test-i18n-language-${langCode} a`;

    if (this.isViewportAtMobileWidth()) {
      // This is required to ensure the language dropdown is visible in mobile view,
      // if the earlier movements of the page have hidden it and since the inbuilt
      // scrollIntoView function call of the clickOn function didn't work as expected.
      await this.page.evaluate(() => {
        window.scrollTo(0, 0);
      });
    }
    const languageDropdownElement = await this.page.waitForSelector(
      languageDropdown,
      {state: 'visible'}
    );
    if (!languageDropdownElement) {
      throw new Error('Language dropdown element not found');
    }
    const initialLanguage = await this.page.$eval(
      languageDropdown,
      el => el.textContent
    );
    await this.clickOnElement(languageDropdownElement);
    // Capture the navigation the language click triggers before reloading.
    await this.clickAndWaitForNavigation(languageOption, true);
    // Here we need to reload the page again to confirm the language change.
    await this.page.reload();

    await this.page.waitForFunction(
      ({selector, textContent}: {selector: string; textContent: string}) => {
        const element = document.querySelector(selector);
        return element && element.textContent !== textContent;
      },
      {selector: languageOption, textContent: initialLanguage}
    );
  }

  /**
   * Chooses an action in the progress remainder.
   * @param {string} action - The action to choose. Can be 'Restart' or 'Resume'.
   */
  async chooseActionInProgressRemainder(
    action: 'Restart' | 'Resume'
  ): Promise<void> {
    await this.page.waitForSelector(progressRemainderModalSelector, {
      state: 'visible',
    });
    await this.page.waitForSelector(restartExplorationButton, {
      state: 'visible',
    });
    await this.page.waitForSelector(resumeExplorationButton, {
      state: 'visible',
    });

    if (action === 'Restart') {
      await this.clickAndWaitForNavigation(restartExplorationButton, true);
    } else if (action === 'Resume') {
      await this.clickOnElementWithSelector(resumeExplorationButton);
      // Closing checkpoint modal if appears.
      const closeLessonInfoTooltipElement = await this.page.$(
        closeLessonInfoTooltipSelector
      );
      if (closeLessonInfoTooltipElement) {
        await this.clickOnElementWithSelector(closeLessonInfoTooltipSelector);
      }
    } else {
      throw new Error(
        `Invalid action: ${action}. Expected 'Restart' or 'Resume'.`
      );
    }
  }

  /**
   * Function to click the About button in the About Menu on navbar
   * and check if it opens the About page.
   */
  async clickAboutButtonInAboutMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileNavbarButtonSelector, {
        state: 'visible',
      });
      await this.openMobileSidebar();

      // Wait for Angular to be stable before clicking the expand button.
      await this.waitForAngularStability();

      // Use JavaScript click for sidebar menu items.
      await this.clickWithJavaScript(mobileSidebarExpandAboutMenuButton);

      // Wait for the About submenu to expand and the About button to be visible.
      await this.page.waitForSelector(mobileSidebarAboutButton, {
        state: 'visible',
      });
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarAboutButton,
        aboutUrl
      );
    } else {
      await this.page.waitForSelector(navbarAboutTab, {
        state: 'visible',
      });
      await this.clickOnElementWithSelector(navbarAboutTab);
      await this.clickButtonToNavigateToNewPage(
        navbarAboutTabAboutButton,
        aboutUrl
      );
    }
  }

  /**
   * Function to click a button and check if it opens the expected destination.
   */
  private async clickButtonToNavigateToNewPage(
    button: string,
    expectedDestinationPageUrl: string,
    useSelector: boolean = true
  ): Promise<void> {
    await this.clickAndWaitForNavigation(button, useSelector);
    await this.expectPageURLToContain(expectedDestinationPageUrl);
  }

  /**
   * Click on the submit answer button.
   * @param skipVerification - If true, skips verification that the button is visible.
   */
  async clickOnSubmitAnswerButton(): Promise<void> {
    const feedbackSelector = '.e2e-test-conversation-feedback-latest';

    await this.expectElementToBeClickable(submitAnswerButton);

    // Get current status of old and latest responses to use it later.
    // Handle cases where elements might not exist.
    const initialPreviousResponses = await this.page
      .$eval(
        previousConversationToggleSelector,
        element => element?.textContent?.trim() || null
      )
      .catch(() => null);

    const initialLatestResponse = await this.page
      .$eval(feedbackSelector, element => element?.textContent?.trim() || null)
      .catch(() => null);

    // Wait for 1s to ensure the selected answer is updated in Angular component.
    await this.page.waitForTimeout(1000);
    // Click on Submit Answer button.
    await this.clickOnElementWithSelector(submitAnswerButton);

    // Wait for either element to change content.
    await this.page.waitForFunction(
      ({
        submitButtonSelector,
        formErrorContainer,
        selector1,
        value1,
        selector2,
        value2,
      }: {
        submitButtonSelector: string;
        formErrorContainer: string;
        selector1: string;
        value1: string | null;
        selector2: string;
        value2: string | null;
      }) => {
        const submitButton = document.querySelector(submitButtonSelector);
        const element1 = document.querySelector(selector1);
        const element2 = document.querySelector(selector2);

        const currentValue1 = element1?.textContent?.trim() || null;
        const currentValue2 = element2?.textContent?.trim() || null;

        return (
          (submitButton as HTMLButtonElement)?.disabled ||
          document.querySelector(formErrorContainer)?.textContent?.trim() !==
            null ||
          currentValue1 !== value1 ||
          currentValue2 !== value2
        );
      },
      {
        submitButtonSelector: submitAnswerButton,
        formErrorContainer,
        selector1: previousConversationToggleSelector,
        value1: initialPreviousResponses,
        selector2: feedbackSelector,
        value2: initialLatestResponse,
      },
      {timeout: 10000}
    );
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
   * Function to close the hint modal.
   */
  async closeHintModal(): Promise<void> {
    await this.page.waitForSelector(gotItButtonSelector, {state: 'visible'});
    await this.clickOnElementWithSelector(gotItButtonSelector);
    await this.page.waitForSelector(gotItButtonSelector, {state: 'hidden'});
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
   * Checks if the current card's content matches the expected content.
   * @param {string} expectedCardContent - The expected content of the card.
   */
  async expectCardContentToMatch(expectedCardContent: string): Promise<void> {
    await this.waitForPageToFullyLoad();

    await this.page.waitForSelector(`${stateConversationContent} p`, {
      state: 'visible',
    });
    const element = await this.page.$(`${stateConversationContent} p`);
    const cardContent = await this.page.evaluate(
      element => element?.textContent || '',
      element
    );
    expect(cardContent.trim()).toBe(expectedCardContent);
    showMessage('Card content is as expected.');
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

  /**
   * Checks if the progress remainder is found or not, based on the shouldBeFound parameter. (It can be found when the an already played exploration is revisited or an ongoing exploration is reloaded, but only if the first checkpoint is reached.)
   * @param {boolean} shouldBeFound - Whether the progress remainder should be found or not.
   */
  async expectProgressReminder(shouldBeFound: boolean): Promise<void> {
    await this.waitForPageToFullyLoad();
    try {
      await this.page.waitForSelector(progressRemainderModalSelector, {
        state: 'visible',
      });
      if (!shouldBeFound) {
        throw new Error('Progress remainder is found, which is not expected.');
      }
      showMessage('Progress reminder modal found.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Timeout')) {
        // Closing checkpoint modal if appears.
        const closeLessonInfoTooltipElement = await this.page.$(
          closeLessonInfoTooltipSelector
        );
        if (closeLessonInfoTooltipElement) {
          await this.clickOnElementWithSelector(closeLessonInfoTooltipSelector);
        }
        if (shouldBeFound) {
          throw new Error(
            'Progress remainder is not found, which is not expected.'
          );
        }
      } else {
        throw error;
      }
    }
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
   * Function to navigate to the home page.
   * @param {boolean} verifyURL - Whether to verify the URL after navigation. Defaults to true.
   */
  async navigateToHome(verifyURL: boolean = true): Promise<void> {
    await this.goto(homeUrl, verifyURL);
  }

  /**
   * Opens the lesson info modal.
   */
  async openLessonInfoModal(): Promise<void> {
    await this.page.waitForSelector(lessonInfoButton, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(lessonInfoButton);
    await this.page.waitForSelector(lessonInfoCardSelector, {state: 'visible'});
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
    if (this.isViewportAtMobileWidth()) {
      await this.page.mouse.move(-1, -1); // Move mouse away to prevent hover effects from blocking the search input.
    }
    await this.clickOnElementWithSelector(searchInputSelector);
    await this.typeInInputField(searchInputSelector, lessonName);

    await this.page.keyboard.press('Enter');
    await this.page.waitForNavigation({waitUntil: 'load'});
  }

  /**
   * Function to submit an answer to a form input field.
   * @param {string} answer - The answer to submit.
   */
  async submitAnswer(answer: string): Promise<void> {
    // Allow input elements to be rendered and ready for interaction.
    await this.page.waitForTimeout(1000);
    await this.waitForElementToBeClickable(submitResponseToInteractionInput);
    await this.clearAllTextFrom(submitResponseToInteractionInput);
    await this.typeInInputField(submitResponseToInteractionInput, answer);
    await this.clickOnSubmitAnswerButton();
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

  /*
   * Function to verify if the checkpoint modal appears on the screen.
   */
  async verifyCheckpointModalAppears(): Promise<void> {
    try {
      await this.page.waitForSelector(checkpointModalSelector, {
        state: 'visible',
      });
      showMessage('Checkpoint modal found.');
      // Closing the checkpoint modal.
      await this.clickOnElementWithSelector(closeLessonInfoTooltipSelector);
      await this.page.waitForSelector(checkpointModalSelector, {
        state: 'hidden',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Timeout')) {
        const newError = new Error('Checkpoint modal not found.');
        newError.stack = error.stack;
        throw newError;
      }
      throw error;
    }
  }

  /**
   * Function to use a hint.
   */
  async viewHint(): Promise<void> {
    await this.page.waitForSelector(hintButtonSelector, {
      // Hint is shown after one minute.
      timeout: 80000,
    });
    await this.clickOnElementWithSelector(hintButtonSelector);

    await this.page.waitForSelector(gotItButtonSelector, {
      state: 'visible',
    });
  }
}

export const LoggedOutUserFactory = (page: Page): LoggedOutUser => {
  return new LoggedOutUser(page);
};
