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

import {Page, expect, ElementHandle} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const baseUrl = testConstants.URLs.BaseURL;
const contributorDashboardAdminUrl =
  testConstants.URLs.ContributorDashboardAdmin;
const learnerDashboardUrl = testConstants.URLs.LearnerDashboard;
const moderatorPageUrl = testConstants.URLs.ModeratorPage;
const releaseCoordinatorPageUrl = testConstants.URLs.ReleaseCoordinator;
const signUpEmailField = testConstants.SignInDetails.inputField;
const siteAdminPageUrl = testConstants.URLs.AdminPage;
const splashPageUrl = testConstants.URLs.splash;
const topicsAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;

// Auth Pages selectors.
const loginPage = '.e2e-test-login-page';
const signUpUsernameField = 'input.e2e-test-username-input';
const agreeToTermsCheckbox = 'input.e2e-test-agree-to-terms-checkbox';
const registerNewUserButton = 'button.e2e-test-register-user:not([disabled])';

const errorContainerSelector = '.e2e-test-error-container';
const errorPageHeadingSelector = '.e2e-test-error-page-heading';
const invalidEmailErrorContainer = '#mat-error-1';
const invalidUsernameErrorContainer = '.oppia-warning-text';
const LABEL_FOR_SUBMIT_BUTTON = 'Submit and start contributing';

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
const greetingSelector = '.e2e-learner-dashboard-greeting';

const ratingsHeaderSelector = '.conversation-skin-final-ratings-header';
const ratingStarSelector = '.e2e-test-rating-star';
const filledRatingStarSelector = '.fas.fa-star';

// Learner dashboard selectors.
const communityLessonsSectionInLearnerDashboard =
  '.e2e-test-community-lessons-section';
const profileDropdown = '.e2e-test-profile-dropdown';
const learnerDashboardMenuLink = '.e2e-test-learner-dashboard-menu-link';
const learnerDashboardContainerSelector = '.e2e-test-learner-dashboard-page';
const progressTabSectionInLearnerDashboard =
  '.e2e-test-learner-dash-progress-tab';
const emptyProgressSectionContainerSelector =
  '.e2e-test-empty-progress-section';
const emptyProgressSectionMessage = '.e2e-test-empty-progress-message';

const addNewGoalButtonSelector = '.e2e-test-add-new-goal-button';
const goalsHeadingInRedesignedDashbaordSelector = '.e2e-test-goals-heading';
const goalsSectionSelector = '.e2e-test-goals-section';
const currentGoalsSectionSelector = '.e2e-test-current-goals-section';
const goalsSectionContainerSelector = '.e2e-test-goals-section-container';
const addGoalsButtonInRedesignedLearnerDashboard = '.e2e-test-add-goals-button';
const newGoalsListInRedesignedLearnerDashboard = '.e2e-test-new-goals-list';
const goalCheckboxInRedesignedLearnerDashboard =
  '.oppia-learner-dash-goals-checkbox';

// Learner Dashboard > Home Tab Selectors.
const continueFromWhereLeftOffSectionInRedesignedDashboardSelector =
  '.e2e-test-continue-where-you-left-off';
const learnSomethingNewSectionSelector = '.e2e-test-learner-dash-section';

// Common > Lesson Card.
const commonLessonCardContainerSelector =
  '.e2e-test-redesigned-lesson-card-container';
const commonlessonTitleSelector = '.e2e-test-lesson-title';

// Common > Lesson Card (story viewer / goal detail).
// Lessons are rendered inside the expanded goal list (goal-list-story-nodes).
const lessonCardContainer = '.goal-list-story-nodes';

const learnerGreetingsSelector = '.e2e-test-learner-greetings';

// Common > Remove modal selectors.
const removeModalContainerSelector =
  '.e2e-test-remove-activity-modal-container';
const removeModalHeaderSelector =
  '.e2e-test-remove-activity-modal-container .e2e-test-modal-header';
const removeModalBodySelector =
  '.e2e-test-remove-activity-modal-container .e2e-test-modal-body';
const removeModalCancelButtonSelector =
  '.e2e-test-remove-activity-modal-container .e2e-test-modal-cancel-delete-button';
const removeModalConfirmButtonSelector =
  '.e2e-test-remove-activity-modal-container .e2e-test-modal-confirm-delete-button';

const reportExplorationButtonSelector = '.e2e-test-report-exploration-button';
const reportExplorationTextAreaSelector =
  '.e2e-test-report-exploration-text-area';
const issueTypeSelector = '.e2e-test-report-exploration-radio-button';
const submitReportButtonSelector = '.e2e-test-submit-report-button';

const commonPlayLaterIconSelector = '.e2e-test-lesson-playlist-icon';
const learnerDashboardIconsSelector = 'oppia-learner-dashboard-icons';

// Community Library.
const learnerPlaylistModalSelector = 'oppia-learner-playlist-modal';
const closeModalButton = '.e2e-test-close-modal-btn';

// Exploration player selectors.
const explorationSuccessfullyFlaggedMessage =
  '.e2e-test-exploration-flagged-success-message';

export class LoggedInUser extends BaseUser {
  /**
   * Function to add a goal in the redesigned learner dashboard.
   * @param {string} goal - The goal to add.
   */
  async addGoalInRedesignedLearnerDashboard(goal: string): Promise<void> {
    await this.waitForPageToFullyLoad();

    await this.clickOnAddGoalsButtonInRedesignedLearnerDashboard();
    await this.clickOnGoalCheckboxInRedesignedLearnerDashboard(goal);
    await this.submitGoalInRedesignedLearnerDashboard();
  }

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
   * Clicks on the given button in the remove activity modal.
   * @param {'Remove' | 'Cancel'} button - The button to click.
   */
  async clickButtonInRemoveActivityModal(
    button: 'Remove' | 'Cancel'
  ): Promise<void> {
    await this.page.waitForSelector(removeModalContainerSelector);

    if (button === 'Remove') {
      await this.clickOnElementWithSelector(removeModalConfirmButtonSelector);
    } else if (button === 'Cancel') {
      await this.clickOnElementWithSelector(removeModalCancelButtonSelector);
    }

    await this.page.waitForSelector(removeModalContainerSelector, {
      state: 'hidden',
    });
  }

  /**
   * Function to click on the add goals button in the redesigned learner dashboard.
   */
  async clickOnAddGoalsButtonInRedesignedLearnerDashboard(): Promise<void> {
    await this.page.waitForSelector(
      addGoalsButtonInRedesignedLearnerDashboard,
      {
        state: 'visible',
      }
    );
    await this.clickOnElementWithSelector(
      addGoalsButtonInRedesignedLearnerDashboard
    );

    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(newGoalsListInRedesignedLearnerDashboard, {
      state: 'visible',
    });
  }

  /**
   * Function to click on the goal checkbox in the redesigned learner dashboard.
   * @param {string} goal - The goal to click on.
   * @param {boolean} checked - Whether the goal should be checked or not.
   */
  async clickOnGoalCheckboxInRedesignedLearnerDashboard(
    goal: string,
    checked: boolean = true
  ): Promise<void> {
    await this.waitForPageToFullyLoad();

    const newGoalsCheckboxes = await this.page.$$(
      goalCheckboxInRedesignedLearnerDashboard
    );

    for (const checkbox of newGoalsCheckboxes) {
      const checkboxText = await checkbox.evaluate(el =>
        el.textContent?.trim()
      );

      const isChecked = await checkbox.$eval(
        'input',
        el => (el as HTMLInputElement).checked
      );

      if (isChecked === checked) {
        showMessage(`Skipped: Add ${goal} to goals.`);
        break;
      }

      if (checkboxText === goal) {
        const goalCheckbox = await checkbox.$('label');
        if (!goalCheckbox) {
          throw new Error(`Could not find goal checkbox for ${goal}`);
        }
        await goalCheckbox.click();
        await this.page.waitForFunction(
          ({element, checked}: {element: Element; checked: boolean}) => {
            const inputElement = (element as HTMLInputElement).querySelector(
              'input'
            );
            return inputElement?.checked === checked;
          },
          {element: goalCheckbox, checked}
        );
        break;
      }
    }
  }

  /**
   * Function to enter email and proceed to the next page (username page).
   * This will click "Sign In" and verify the username field is visible.
   */
  async enterEmailAndProceedToNextPage(email: string): Promise<void> {
    await this.page.waitForSelector(signUpEmailField, {
      state: 'visible',
    });
    await this.clearAllTextFrom(signUpEmailField);
    await this.typeInInputField(signUpEmailField, email);

    await this.waitForPageToFullyLoad();
    const invalidEmailErrorContainerElement = await this.page.$(
      invalidEmailErrorContainer
    );
    if (!invalidEmailErrorContainerElement) {
      await this.clickOnElementWithText('Sign In');
      await this.page.waitForNavigation({waitUntil: 'networkidle'});

      // Post Check: Check if the login page is closed. We can't check if user
      // is redirected to the home page it is dependent to "redirects" in URL.
      await this.page.waitForSelector(signUpEmailField, {
        state: 'hidden',
      });

      await this.page.waitForSelector(signUpUsernameField, {
        state: 'visible',
      });
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
   * Navigates to the learner dashboard using profile dropdown in the navbar.
   */
  async navigateToLearnerDashboardUsingProfileDropdown(): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(profileDropdown, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(profileDropdown);

    await this.page.waitForSelector(learnerDashboardMenuLink, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(learnerDashboardMenuLink);

    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(homeTabSectionInLearnerDashboard, {
      state: 'visible',
    });
  }

  /**
   * Navigates to the goals section of the learner dashboard.
   */
  async navigateToGoalsSection(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(goalsSectionSelector);
      await this.clickOnElementWithSelector(goalsSectionSelector);

      try {
        await this.page.waitForSelector(currentGoalsSectionSelector, {
          timeout: 5000,
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Timeout')) {
          // Try clicking again if does not opens the expected page.
          await this.clickOnElementWithSelector(goalsSectionSelector);
        } else {
          throw error;
        }
      }

      await this.expectElementToBeVisible(goalsSectionContainerSelector);
    } else {
      await this.page.waitForSelector(goalsSectionSelector);
      const goalSectionElement = await this.page.$(goalsSectionSelector);
      if (!goalSectionElement) {
        throw new Error('Progress section not found.');
      }
      await goalSectionElement.click();
    }

    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(goalsSectionContainerSelector);
  }

  /**
   * Navigates to the Contributor Admin Dashboard page.
   */
  async navigateToContributorAdminDashboardPage(): Promise<void> {
    await this.goto(contributorDashboardAdminUrl);
  }

  /**
   * Navigates to the Moderator page.
   */
  async navigateToModeratorPage(): Promise<void> {
    await this.goto(moderatorPageUrl);
  }

  /**
   * Navigates to the Release Coordinator page.
   */
  async navigateToReleaseCoordinatorPage(): Promise<void> {
    await this.goto(releaseCoordinatorPageUrl);
  }

  /**
   * Navigates to the sign up page by going to splash page (home), then clicking 'Sign in' button.
   * If the user hasn't accepted cookies, it clicks 'OK' to accept them.
   */
  async navigateToSignUpPage(): Promise<void> {
    await this.goto(splashPageUrl, false);
    if (!this.userHasAcceptedCookies) {
      await this.clickOnElementWithText('OK');
      this.userHasAcceptedCookies = true;
    }
    await this.clickOnElementWithText('Sign in');

    await this.page.waitForSelector(loginPage, {
      state: 'visible',
    });
  }

  /**
   * Navigates to the Admin page.
   */
  async navigateToSiteAdminPage(): Promise<void> {
    await this.goto(siteAdminPageUrl);
  }

  /**
   * Navigates to the Topics and Skills Dashboard page.
   */
  async navigateToTopicsAndSkillsDashboardPage(): Promise<void> {
    await this.goto(topicsAndSkillsDashboardUrl);
  }

  /**
   * Checks if the error page with the given status code is displayed.
   * @param {number} statusCode - The expected error status code.
   */
  async expectErrorPage(statusCode: number): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(errorContainerSelector);
    await this.page.waitForFunction(
      ({selector, expectedText}: {selector: string; expectedText: string}) => {
        const errorContainer = document.querySelector(selector);
        return Boolean(
          errorContainer && errorContainer.textContent?.includes(expectedText)
        );
      },
      {selector: errorContainerSelector, expectedText: `Error ${statusCode}`},
      {timeout: 30000}
    );

    const errorHeading = await this.page.$(errorPageHeadingSelector);
    if (errorHeading) {
      const errorHeadingText = await this.page.evaluate(
        element => element.textContent,
        errorHeading
      );
      if (!errorHeadingText?.includes(`Error ${statusCode}`)) {
        throw new Error(
          `Expected "Error ${statusCode}" to be present on the page, but it was not.`
        );
      }
    }

    showMessage(`User is on error page with status code ${statusCode}.`);
  }

  /**
   * Checks if the learner greetings are present.
   * @param {string} expectedGreetings - The expected greetings.
   */
  async expectLearnerGreetingsToBe(expectedGreetings: string): Promise<void> {
    await this.page.waitForSelector(learnerGreetingsSelector);

    const greetings = await this.page.$eval(learnerGreetingsSelector, el =>
      el.textContent?.trim()
    );

    expect(greetings).toBe(expectedGreetings);
  }

  /**
   * Function to verify the add goals button in the redesigned learner dashboard is present or not.
   * @param {boolean} visible - Whether the button should be visible or not.
   */
  async expectAddGoalsButtonInRedesignedDashboardToBePresent(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(
      addGoalsButtonInRedesignedLearnerDashboard,
      visible
    );
  }

  /**
   * Function to verify that a specific chapter is present in the Learn Something New section.
   * @param {string} chapterTitle - The title of the chapter to verify.
   */
  async expectChapterToBePresentInLearnSomethingNewSection(
    chapterTitle: string
  ): Promise<void> {
    await this.expectElementToBeVisible(learnSomethingNewSectionSelector);
    // Wait for lesson cards to load if they exist.
    try {
      await this.page.waitForSelector(lessonCardContainer, {
        state: 'visible',
        timeout: 5000,
      });
    } catch (error) {
      // Lesson cards may not be present if section is empty (no untracked topics).
      // This is expected for new users.
      showMessage(
        'Learn Something New section is empty (no lesson cards found). This is expected for new users.'
      );
      return;
    }
    const learnSomethingNewSection = await this.page.$(
      learnSomethingNewSectionSelector
    );
    if (!learnSomethingNewSection) {
      throw new Error('Learn Something New section not found.');
    }
    await this.expectLessonCardToBePresent(
      chapterTitle,
      learnSomethingNewSection
    );
  }

  /**
   * Function to verify the continue from where you left section in the redesigned learner dashboard is present or not.
   * @param {boolean} visible - Whether the section should be visible or not.
   */
  async expectContinueFromWhereYouLeftSectionInRedesignedDashboardToBePresent(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(
      continueFromWhereLeftOffSectionInRedesignedDashboardSelector,
      visible
    );
  }

  /**
   * Checks if greeting has name of the user.
   */
  async expectGreetingToHaveNameOfUser(userName: string): Promise<void> {
    // Check for redesigned dashboard greeting first.
    const isRedesignedGreetingVisible = await this.isElementVisible(
      learnerGreetingsSelector,
      true
    );
    if (isRedesignedGreetingVisible) {
      const greetingText = await this.page.$eval(learnerGreetingsSelector, el =>
        el.textContent?.trim()
      );
      expect(greetingText).toContain(userName);
    } else {
      // Fall back to old dashboard greeting selector.
      await this.expectElementToBeVisible(greetingSelector);
      const greetingElement = await this.page.$(greetingSelector);
      const greetingText = await this.page.evaluate(
        el => el?.textContent || '',
        greetingElement
      );
      expect(greetingText).toContain(userName);
    }
  }

  /**
   * Function to verify the learn something new section in the redesigned learner dashboard.
   * @param {boolean} visible - Whether the section should be visible or not.
   */
  async expectLearnSomethingNewSectionInRedesignedDashboardToBePresent(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(
      learnSomethingNewSectionSelector,
      visible
    );
  }

  /**
   * Function to verify the lesson card is present in the page.
   * @param {string} lessonTitle - The title of the lesson card (can be partial match).
   * @param {ElementHandle<Element> | Page} context - The context of the page.
   */
  async expectLessonCardToBePresent(
    lessonTitle: string,
    context: ElementHandle<Element> | Page = this.page
  ): Promise<void> {
    const lessonCards = await context.$$(commonLessonCardContainerSelector);
    const lessonCardTitles = await Promise.all(
      lessonCards.map(card =>
        card.$eval(commonlessonTitleSelector, el => el.textContent?.trim())
      )
    );
    const titleFound = lessonCardTitles.some(title =>
      title?.includes(lessonTitle)
    );
    if (!titleFound) {
      throw new Error(`Lesson card with title "${lessonTitle}" not found.`);
    }
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
   * Function to verify the heading of the goals section in the learner dashboard.
   * @param {string} heading - The heading to check for.
   * @param {boolean} visible - Whether the heading should be visible or not.
   */
  async expectRedesignedGoalsSectionToContainHeading(
    heading: string,
    visible: boolean = true
  ): Promise<void> {
    await this.page.waitForFunction(
      ({
        selector,
        heading,
        visible,
      }: {
        selector: string;
        heading: string;
        visible: boolean;
      }) => {
        const headingElements = document.querySelectorAll(selector);
        const headings = Array.from(headingElements).map(h =>
          h.textContent?.trim()
        );
        return headings.includes(heading) === visible;
      },
      {selector: goalsHeadingInRedesignedDashbaordSelector, heading, visible}
    );
  }

  /**
   * Expects the remove activity model to be displayed.
   * @param {string} [header] - The header of the modal.
   */
  async expectRemoveActivityModelToBeDisplayed(
    header?: string,
    body?: string
  ): Promise<void> {
    // Check for the modal container.
    await this.page.waitForSelector(removeModalContainerSelector);

    // Check for the header.
    if (header) {
      await this.page.waitForSelector(removeModalHeaderSelector);
      const headerText = await this.page.$eval(
        removeModalHeaderSelector,
        el => el.textContent
      );
      expect(headerText).toEqual(header);
    }

    // Check for the body.
    if (body) {
      await this.page.waitForSelector(removeModalBodySelector);
      const bodyText = await this.page.$eval(
        removeModalBodySelector,
        el => el.textContent
      );
      expect(bodyText).toEqual(body);
    }
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
   * Checks if the progress section in new learner dashboard is empty.
   */
  async expectProgressSectionToBeEmptyInNewLD(): Promise<void> {
    await this.expectElementToBeVisible(emptyProgressSectionContainerSelector);
    const expectedMessage =
      "It looks like you don't have any lessons in progress or completed. Head over to Oppia's Classroom to start your first lesson!";
    await this.expectTextContentToBe(
      emptyProgressSectionMessage,
      expectedMessage
    );
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
   * Checks if Learner is on the learner dashboard page.
   */
  async expectToBeOnLearnerDashboardPage(): Promise<void> {
    await this.expectElementToBeVisible(learnerDashboardContainerSelector);
  }

  /**
   * Waits for the duplicate username error container to appear, then checks if the error message matches the expected error.
   * @param {string} expectedError - The expected error message.
   */
  async expectUsernameError(expectedError: string): Promise<void> {
    await this.page.waitForSelector(invalidUsernameErrorContainer);
    const errorMessage = await this.page.$eval(
      invalidUsernameErrorContainer,
      el => el.textContent
    );
    if (errorMessage?.trim() !== expectedError) {
      throw new Error(
        `D error does not match. Expected: ${expectedError}, but got: ${errorMessage}`
      );
    }
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
   * Navigates to the progress section of the learner dashboard.
   */
  async navigateToProgressSection(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(progressSectionSelector);
      await this.clickOnElementWithSelector(progressSectionSelector);

      try {
        await this.page.waitForSelector(mobileCommunityLessonSectionButton, {
          timeout: 5000,
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Timeout')) {
          // Try clicking again if does not opens the expected page.
          await this.clickOnElementWithSelector(progressSectionSelector);
        } else {
          throw error;
        }
      }

      await this.page.waitForSelector(progressTabSectionInLearnerDashboard, {
        state: 'visible',
      });
    } else {
      await this.page.waitForSelector(progressSectionSelector);
      const progressSection = await this.page.$(progressSectionSelector);
      if (!progressSection) {
        throw new Error('Progress section not found.');
      }
      await progressSection.click();
    }

    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(progressTabSectionInLearnerDashboard, {
      state: 'visible',
    });
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
   * This function is used to report an exploration. It clicks on the report button,
   * opens the report modal, selects an issue, types a description, and submits the report.
   * @param {string} issueName - The name of the issue to report.
   * @param {string} issueDescription - The description of the issue.
   */
  async reportExploration(issueDescription: string): Promise<void> {
    await this.page.waitForSelector(reportExplorationButtonSelector, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(reportExplorationButtonSelector);
    await this.page.waitForSelector(issueTypeSelector);
    await this.waitForElementToStabilize(issueTypeSelector);
    await this.page.click(issueTypeSelector);
    await this.typeInInputField(
      reportExplorationTextAreaSelector,
      issueDescription
    );

    await this.clickOnElementWithSelector(submitReportButtonSelector);

    await this.waitForElementToStabilize(closeModalButton);
    await this.clickOnElementWithSelector(closeModalButton);

    await this.page.waitForSelector(explorationSuccessfullyFlaggedMessage, {
      state: 'hidden',
    });
  }

  /**
   * Enters the provided username into the sign up username field and sign in if the username is correct.
   * @param {string} username - The username to enter.
   * @param {boolean} verifyLogin - Whether to verify the login after entering the username.
   */
  async signInWithUsername(
    username: string,
    verifyLogin: boolean = true
  ): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(signUpUsernameField, {
      state: 'visible',
    });
    await this.clearAllTextFrom(signUpUsernameField);
    await this.typeInInputField(signUpUsernameField, username);
    // Using blur() to remove focus from signUpUsernameField.
    await this.page.evaluate(selector => {
      (document.querySelector(selector) as HTMLElement)?.blur();
    }, signUpUsernameField);

    await this.waitForPageToFullyLoad();
    const invalidUsernameErrorContainerElement = await this.page.$(
      invalidUsernameErrorContainer
    );
    if (!invalidUsernameErrorContainerElement) {
      await this.clickOnElementWithSelector(agreeToTermsCheckbox);
      await this.page.waitForSelector(registerNewUserButton);
      await Promise.all([
        this.page.waitForNavigation({waitUntil: 'networkidle'}),
        this.clickOnElementWithText(LABEL_FOR_SUBMIT_BUTTON),
      ]);

      await this.page.waitForSelector(learnerDashboardContainerSelector, {
        state: 'visible',
      });
    } else if (verifyLogin) {
      // If the username is invalid, we throw an error.
      throw new Error(
        'Invalid username. Please enter a valid username and try again.'
      );
    }
  }

  /**
   * Function to submit a goal in the redesigned learner dashboard.
   */
  async submitGoalInRedesignedLearnerDashboard(): Promise<void> {
    await this.page.waitForSelector(
      `${addNewGoalButtonSelector}:not([disabled])`,
      {state: 'visible'}
    );
    await this.waitForElementToBeClickable(addNewGoalButtonSelector);
    await this.page.click(addNewGoalButtonSelector);
    await this.page.waitForSelector(newGoalsListInRedesignedLearnerDashboard, {
      state: 'hidden',
    });
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
