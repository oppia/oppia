// Copyright 2024 The Oppia Authors. All Rights Reserved.
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

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';
import puppeteer from 'puppeteer';

const profilePageUrlPrefix = testConstants.URLs.ProfilePagePrefix;
const WikiPrivilegesToFirebaseAccount =
  testConstants.URLs.WikiPrivilegesToFirebaseAccount;
const PendingAccountDeletionPage = testConstants.URLs.PendingAccountDeletion;
const baseUrl = testConstants.URLs.BaseURL;
const homePageUrl = testConstants.URLs.Home;
const signUpEmailField = testConstants.SignInDetails.inputField;
const LearnerDashboardUrl = testConstants.URLs.LearnerDashboard;
const learnerDashboardUrl = testConstants.URLs.LearnerDashboard;
const feedbackUpdatesUrl = testConstants.URLs.FeedbackUpdates;

const subscribeButton = 'button.oppia-subscription-button';
const unsubscribeLabel = '.e2e-test-unsubscribe-label';
const explorationCard = '.e2e-test-exploration-dashboard-card';
const ratingsHeaderSelector = '.conversation-skin-final-ratings-header';
const ratingStarSelector = '.e2e-test-rating-star';
const feedbackTextareaSelector = '.e2e-test-exploration-feedback-textarea';
const anonymousCheckboxSelector = '.e2e-test-stay-anonymous-checkbox';
const submitButtonSelector = '.e2e-test-exploration-feedback-submit-btn';
const submittedMessageSelector = '.e2e-test-rating-submitted-message';
const PreferencesPageUrl = testConstants.URLs.Preferences;
const deleteAccountButton = '.e2e-test-delete-account-button';
const accountDeletionButtonInDeleteAccountPage =
  '.e2e-test-delete-my-account-button';
const signUpUsernameField = 'input.e2e-test-username-input';
const invalidEmailErrorContainer = '#mat-error-1';
const invalidUsernameErrorContainer = '.oppia-warning-text';
const optionText = '.mat-option-text';
const confirmUsernameField = '.e2e-test-confirm-username-field';
const confirmAccountDeletionButton = '.e2e-test-confirm-deletion-button';
const agreeToTermsCheckbox = 'input.e2e-test-agree-to-terms-checkbox';
const registerNewUserButton = 'button.e2e-test-register-user:not([disabled])';
const desktopLessonCardTitleSelector = '.e2e-test-exploration-tile-title';
const lessonCardTitleSelector = '.e2e-test-exploration-tile-title';
const desktopAddToPlayLaterButton = '.e2e-test-add-to-playlist-btn';
const mobileAddToPlayLaterButton = '.e2e-test-mobile-add-to-playlist-btn';
const toastMessageSelector = '.e2e-test-toast-message';
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
const mobileProgressSectionButton = '.e2e-test-mobile-progress-section';
const reportExplorationButtonSelector = '.e2e-test-report-exploration-button';
const reportExplorationTextAreaSelector =
  '.e2e-test-report-exploration-text-area';
const submitReportButtonSelector = '.e2e-test-submit-report-button';
const feedbackThreadSelector = '.e2e-test-feedback-thread';
const feedbackMessageSelector = '.e2e-test-feedback-message';
const completedLessonsSectionSelector =
  '.e2e-test-completed-community-lessons-section';
const lessonTileTitleSelector = '.e2e-test-exploration-tile-title';
const progressSectionSelector = '.e2e-test-progress-section';
const mobileProgressSectionSelector = '.e2e-test-mobile-progress-section';
const mobileGoalsSectionSelector = '.e2e-test-mobile-goals-section';
const goalsSectionSelector = '.e2e-test-goals-section';
const homeSectionSelector = '.e2e-test-home-section';
const mobileHomeSectionSelector = '.e2e-test-mobile-home-section';
const topicNameInEditGoalsSelector = '.e2e-test-topic-name-in-edit-goals';
const completedGoalsSectionSelector = '.e2e-test-completed-goals-section';
const completedGoalsTopicNameSelector = '.e2e-test-completed-goals-topic-name';
const completedStoriesSectionSelector = '.e2e-test-completed-stories-section';
const storyNameSelector = '.e2e-test-story-name-in-learner-story-summary-tile';
const lessonObjectiveSelector = '.e2e-test-exp-summary-tile-objective > span';
const learnSomethingNewSectionSelector = '.e2e-test-suggested-for-you';

const LABEL_FOR_SUBMIT_BUTTON = 'Submit and start contributing';

export class LoggedInUser extends BaseUser {
  /**
   * Function for navigating to the profile page for a given username.
   */
  async navigateToProfilePage(username: string): Promise<void> {
    const profilePageUrl = `${profilePageUrlPrefix}/${username}`;
    if (this.page.url() === profilePageUrl) {
      return;
    }
    await this.goto(profilePageUrl);
  }

  /**
   * Function for navigating to the Learner dashboard page.
   */
  async navigateToLearnerDashboardPage(): Promise<void> {
    await this.goto(LearnerDashboardUrl);
  }

  /**
   * Navigates to the community library tab of the learner dashboard.
   */
  async navigateToCommunityLessonsSection(): Promise<void> {
    await this.waitForPageToFullyLoad();
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileProgressSectionButton);
      await this.clickOn(mobileProgressSectionButton);

      try {
        await this.page.waitForSelector(mobileCommunityLessonSectionButton, {
          timeout: 5000,
        });
      } catch (error) {
        if (error instanceof puppeteer.errors.TimeoutError) {
          // Try clicking again if does not opens the expected page.
          await this.clickOn(mobileProgressSectionButton);
        } else {
          throw error;
        }
      }
      await this.clickOn(mobileCommunityLessonSectionButton);
    } else {
      await this.page.click(communityLessonsSectionButton);
    }
  }

  /**
   * Function to subscribe to a creator with the given username.
   */
  async subscribeToCreator(username: string): Promise<void> {
    const profilePageUrl = `${profilePageUrlPrefix}/${username}`;

    if (this.page.url() !== profilePageUrl) {
      await this.navigateToProfilePage(username);
    }

    await this.clickOn(subscribeButton);
    await this.page.waitForSelector(unsubscribeLabel);
    showMessage(`Subscribed to the creator with username ${username}.`);
  }

  /**
   * Navigates to the learner dashboard.
   */
  async navigateToLearnerDashboard(): Promise<void> {
    await this.goto(learnerDashboardUrl);
  }

  /**
   * Navigates to the progress section.
   */
  async navigateToProgressSection(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileProgressSectionSelector);
    } else {
      await this.page.waitForSelector(progressSectionSelector);
      const progressSection = await this.page.$(progressSectionSelector);
      if (!progressSection) {
        throw new Error('Progress section not found.');
      }
      await progressSection.click();
    }
  }

  /**
   * Navigates to the home section.
   */
  async navigateToHomeSection(): Promise<void> {
    const isMobile = await this.isViewportAtMobileWidth();
    const selector = isMobile ? mobileHomeSectionSelector : homeSectionSelector;
    const homeSection = await this.page.$(selector);
    if (!homeSection) {
      throw new Error('Home section not found.');
    }

    await homeSection.click();
  }

  /**
   * Navigates to the goals section.
   */
  async navigateToGoalsSection(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileGoalsSectionSelector);
    } else {
      await this.page.waitForSelector(goalsSectionSelector);
      const progressSection = await this.page.$(goalsSectionSelector);
      if (!progressSection) {
        throw new Error('Progress section not found.');
      }
      await progressSection.click();
    }
  }

  /**
   * Navigates to the feedback updates page.
   */
  async navigateToFeedbackUpdatesPage(): Promise<void> {
    await this.goto(feedbackUpdatesUrl);
  }

  /**
   * Checks whether the exploration with the given title is authored by the creator.
   */
  async expectExplorationToBePresentInProfilePageWithTitle(
    title: string
  ): Promise<void> {
    await this.page.waitForSelector(explorationCard);
    const explorations = await this.page.$$(explorationCard);

    if (explorations.length === 0) {
      throw new Error('There are no explorations authored by the creator.');
    }

    const explorationTitle = await explorations[0].$eval(
      '.e2e-test-exp-summary-tile-title span span',
      element => (element as HTMLElement).textContent
    );

    if (explorationTitle?.trim() === title) {
      showMessage(`Exploration with title ${title} is present.`);
    } else {
      throw new Error(`Exploration with title ${title} is not present.`);
    }
  }

  /**
   * Navigates to preference page.
   */
  async navigateToPreferencesPage(): Promise<void> {
    await this.goto(PreferencesPageUrl);
  }

  async navigateToPendingAccountDeletionPage(): Promise<void> {
    await this.goto(PendingAccountDeletionPage);
  }

  /**
   * This function navigates to the given topic URL and checks if the page displays
   * an 'Error 404' message.
   * @param {string} topicUrlFragment - The URL fragment of the topic to check.
   */
  async expectTopicLinkReturns404(topicUrlFragment: string): Promise<void> {
    // Reloading the page to ensure the latest state is reflected,
    // particularly useful if a topic was recently unpublished.
    await this.page.reload();
    await this.goto(`http://localhost:8181/learn/staging/${topicUrlFragment}`);
    const isError404Present = await this.isTextPresentOnPage('Error 404');
    if (!isError404Present) {
      throw new Error(
        'Expected "Error 404" to be present on the page, but it was not.'
      );
    } else {
      showMessage('The link returns 404 as expected.');
    }
  }

  /**
   * Navigates to the exploration page and starts playing the exploration.
   * @param {string} explorationId - The ID of the exploration to play.
   */
  async playExploration(explorationId: string | null): Promise<void> {
    await this.goto(`${baseUrl}/explore/${explorationId as string}`);
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

      await this.type(feedbackTextareaSelector, feedback);
      if (stayAnonymous) {
        await this.clickOn(anonymousCheckboxSelector);
      }

      await this.clickOn(submitButtonSelector);

      // Wait for the submitted message to appear and check its text.
      await this.page.waitForSelector(submittedMessageSelector);
      const submittedMessageElement = await this.page.$(
        submittedMessageSelector
      );
      const submittedMessageText = await this.page.evaluate(
        el => el.innerText,
        submittedMessageElement
      );
      if (submittedMessageText !== 'Thank you for the feedback!') {
        throw new Error(
          `Unexpected submitted message text: ${submittedMessageText}`
        );
      }
    } catch (error) {
      const newError = new Error(`Failed to rate exploration: ${error}`);
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Clicks the delete account button and waits for navigation.
   */
  async deleteAccount(): Promise<void> {
    await this.clickAndWaitForNavigation(deleteAccountButton);
  }

  /**
   * Clicks on the delete button in the page /delete-account to confirm account deletion, also, for confirmation username needs to be entered.
   * @param {string} username - The username of the account.
   */
  async confirmAccountDeletion(username: string): Promise<void> {
    await this.clickOn(accountDeletionButtonInDeleteAccountPage);
    await this.type(confirmUsernameField, username);
    await this.clickAndWaitForNavigation(confirmAccountDeletionButton);
  }

  /**
   * Navigates to the sign up page. If the user hasn't accepted cookies, it clicks 'OK' to accept them.
   * Then, it clicks on the 'Sign in' button.
   */
  async navigateToSignUpPage(): Promise<void> {
    await this.goto(homePageUrl);
    if (!this.userHasAcceptedCookies) {
      await this.clickOn('OK');
      this.userHasAcceptedCookies = true;
    }
    await this.clickOn('Sign in');
  }

  /**
   * Clicks on the link to the Oppia Wiki, which opens in a new tab.
   */
  async clickAdminAccessInfoLink(): Promise<void> {
    await this.clickLinkAnchorToNewTab(
      'Oppia Wiki',
      WikiPrivilegesToFirebaseAccount
    );
  }

  /**
   * Enters the provided username into the sign up username field and sign in if the username is correct.
   * @param {string} username - The username to enter.
   */
  async signInWithUsername(username: string): Promise<void> {
    await this.clearAllTextFrom(signUpUsernameField);
    await this.type(signUpUsernameField, username);
    // Using blur() to remove focus from signUpUsernameField.
    await this.page.evaluate(selector => {
      document.querySelector(selector).blur();
    }, signUpUsernameField);

    await this.waitForPageToFullyLoad();
    const invalidUsernameErrorContainerElement = await this.page.$(
      invalidUsernameErrorContainer
    );
    if (!invalidUsernameErrorContainerElement) {
      await this.clickOn(agreeToTermsCheckbox);
      await this.page.waitForSelector(registerNewUserButton);
      await this.clickOn(LABEL_FOR_SUBMIT_BUTTON);
      await this.page.waitForNavigation({waitUntil: 'networkidle0'});
    }
  }

  /**
   * Function to sign in the user with the given email to the Oppia website only when the email is valid.
   */
  async enterEmail(email: string): Promise<void> {
    await this.clearAllTextFrom(signUpEmailField);
    await this.type(signUpEmailField, email);

    await this.waitForPageToFullyLoad();
    const invalidEmailErrorContainerElement = await this.page.$(
      invalidEmailErrorContainer
    );
    if (!invalidEmailErrorContainerElement) {
      await this.clickOn('Sign In');
      await this.page.waitForNavigation({waitUntil: 'networkidle0'});
    }
  }

  /**
   * Waits for the invalid email error container to appear, then checks if the error message matches the expected error.
   * @param {string} expectedError - The expected error message.
   */
  async expectValidationError(expectedError: string): Promise<void> {
    await this.page.waitForSelector(invalidEmailErrorContainer);
    const errorMessage = await this.page.$eval(
      invalidEmailErrorContainer,
      el => el.textContent
    );
    const trimmedErrorMessage = errorMessage?.trim();

    if (trimmedErrorMessage !== expectedError) {
      throw new Error(
        `Validation error does not match. Expected: ${expectedError}, but got: ${trimmedErrorMessage}`
      );
    }
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
   * Clicks on the sign up email field, waits for the suggestion to appear, then checks if the
   * suggestion matches the expected suggestion.
   * @param {string} expectedSuggestion - The expected suggestion.
   */
  async expectAdminEmailSuggestion(expectedSuggestion: string): Promise<void> {
    await this.clickOn(signUpEmailField);
    await this.page.waitForSelector(optionText);
    const suggestion = await this.page.$eval(optionText, el => el.textContent);

    if (suggestion?.trim() !== expectedSuggestion) {
      throw new Error(
        `Suggestion does not match. Expected: ${expectedSuggestion}, but got: ${suggestion}`
      );
    }

    // Click anywhere on the page to remove focus from the email field.
    await this.page.click('body');
  }

  /**
   * Verifies that the current page URL includes the expected page pathname.
   */
  async expectToBeOnPage(expectedPage: string): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    const url = await this.page.url();

    // Replace spaces in the expectedPage with hyphens.
    const expectedPageInUrl = expectedPage.replace(/\s+/g, '-');

    if (!url.includes(expectedPageInUrl.toLowerCase())) {
      throw new Error(
        `Expected to be on page ${expectedPage}, but found ${url}`
      );
    }
  }

  /**
  /**
   * Adds a lesson to the 'Play Later' list from community library page.
   * @param {string} lessonTitle - The title of the lesson to add to the 'Play Later' list.
   */
  async addLessonToPlayLater(lessonTitle: string): Promise<void> {
    try {
      await this.waitForPageToFullyLoad();
      const isMobileViewport = await this.isViewportAtMobileWidth();
      const lessonCardTitleSelector = isMobileViewport
        ? mobileLessonCardTitleSelector
        : desktopLessonCardTitleSelector;

      await this.page.waitForSelector(lessonCardTitleSelector);
      const lessonTitles = await this.page.$$eval(
        lessonCardTitleSelector,
        elements => elements.map(el => el.textContent?.trim())
      );

      const lessonIndex = lessonTitles.indexOf(lessonTitle);

      if (lessonIndex === -1) {
        throw new Error(`Lesson "${lessonTitle}" not found in search results.`);
      }

      if (isMobileViewport) {
        await this.page.waitForSelector(mobileLessonCardOptionsDropdownButton);
        const optionsDropdownButtons = await this.page.$$(
          mobileLessonCardOptionsDropdownButton
        );
        await optionsDropdownButtons[lessonIndex].click();
        await this.page.waitForSelector(mobileAddToPlayLaterButton);
        const mobileAddToPlayLaterButtons = await this.page.$$(
          mobileAddToPlayLaterButton
        );
        await mobileAddToPlayLaterButtons[lessonIndex].click();
      } else {
        await this.page.waitForSelector(desktopAddToPlayLaterButton);
        const addToPlayLaterButtons = await this.page.$$(
          desktopAddToPlayLaterButton
        );
        await addToPlayLaterButtons[lessonIndex].click();
      }

      showMessage(`Lesson "${lessonTitle}" added to 'Play Later' list.`);
    } catch (error) {
      const newError = new Error(
        `Failed to add lesson to 'Play Later' list: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Expects the text content of the toast message to match the given expected message.
   * @param {string} expectedMessage - The expected message to match the toast message against.
   */
  async expectToolTipMessage(expectedMessage: string): Promise<void> {
    try {
      await this.page.waitForSelector(toastMessageSelector);
      const toastMessageElement = await this.page.$(toastMessageSelector);
      const toastMessage = await this.page.evaluate(
        el => el.textContent.trim(),
        toastMessageElement
      );

      if (toastMessage !== expectedMessage) {
        throw new Error(
          `Expected toast message to be "${expectedMessage}", but it was "${toastMessage}".`
        );
      }
      await this.page.waitForSelector(toastMessageSelector, {hidden: true});
    } catch (error) {
      const newError = new Error(`Failed to match toast message: ${error}`);
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Function to play a specific lesson from the community library tab in learner dashboard.
   * @param {string} lessonName - The name of the lesson to be played.
   */
  async playLessonFromDashboard(lessonName: string): Promise<void> {
    try {
      await this.page.waitForSelector(lessonCardTitleSelector);
      const searchResultsElements = await this.page.$$(lessonCardTitleSelector);
      const searchResults = await Promise.all(
        searchResultsElements.map(result =>
          this.page.evaluate(el => el.textContent.trim(), result)
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
    } catch (error) {
      const newError = new Error(
        `Failed to play lesson from dashboard: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Removes a lesson from the 'Play Later' list in the learner dashboard.
   * @param {string} lessonName - The name of the lesson to remove from the 'Play Later' list.
   */
  async removeLessonFromPlayLater(lessonName: string): Promise<void> {
    try {
      await this.page.waitForSelector(lessonCardTitleInPlayLaterSelector);
      const lessonCards = await this.page.$$(
        lessonCardTitleInPlayLaterSelector
      );
      const lessonNames = await Promise.all(
        lessonCards.map(card =>
          this.page.evaluate(el => el.textContent.trim(), card)
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

      await this.page.waitForSelector(removeFromPlayLaterButtonSelector);
      const removeFromPlayLaterButton = await this.page.$(
        removeFromPlayLaterButtonSelector
      );
      await removeFromPlayLaterButton?.click();

      // Confirm removal.
      await this.clickOn(confirmRemovalFromPlayLaterButton);

      showMessage(`Lesson "${lessonName}" removed from 'Play Later' list.`);
    } catch (error) {
      const newError = new Error(
        `Failed to remove lesson from 'Play Later' list: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
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
      await this.page.waitForSelector(playLaterSectionSelector);
      const lessonCards = await this.page.$$(
        lessonCardTitleInPlayLaterSelector
      );
      const lessonNames = await Promise.all(
        lessonCards.map(card =>
          this.page.evaluate(el => el.textContent.trim(), card)
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
      showMessage('Lesson is present in "Play Later" list.');
    } catch (error) {
      const newError = new Error(
        `Failed to verify presence of lesson in 'Play Later' list: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * This function is used to report an exploration. It clicks on the report button,
   * opens the report modal, selects an issue, types a description, and submits the report.
   * @param {string} issueName - The name of the issue to report.
   * @param {string} issueDescription - The description of the issue.
   */
  async reportExploration(issueName: string, issueDescription: string) {
    await this.clickOn(reportExplorationButtonSelector);
    await this.clickOn(` ${issueName} `);
    await this.clickOn(reportExplorationTextAreaSelector);
    await this.type(reportExplorationTextAreaSelector, issueDescription);

    await this.clickOn(submitReportButtonSelector);
  }

  /**
   * Views a feedback update thread.
   * @param {number} threadNumber - The 0-indexed position of the thread.
   */
  async viewFeedbackUpdateThread(threadNumber: number) {
    await this.page.waitForSelector(feedbackThreadSelector);
    const feedbackThreads = await this.page.$$(feedbackThreadSelector);

    if (threadNumber >= 0 && threadNumber < feedbackThreads.length) {
      await feedbackThreads[threadNumber].click();
    } else {
      throw new Error(`Thread not found: ${threadNumber}`);
    }
  }

  /**
   * Checks if the feedback and response match the expected values.
   * @param {string} expectedFeedback - The expected feedback.
   * @param {string} expectedResponse - The expected response.
   */

  async expectFeedbackAndResponseToMatch(
    expectedFeedback: string,
    expectedResponse: string
  ) {
    const feedbackMessages = await this.page.$$(feedbackMessageSelector);

    if (feedbackMessages.length < 2) {
      throw new Error('Not enough feedback messages found.');
    }

    const actualFeedback = await feedbackMessages[0].$eval('.', el =>
      el.textContent?.trim()
    );
    const actualResponse = await feedbackMessages[1].$eval('.', el =>
      el.textContent?.trim()
    );

    if (actualFeedback !== expectedFeedback) {
      throw new Error(
        `Feedback does not match the expected value. Expected: ${expectedFeedback}, Found: ${actualFeedback}`
      );
    }
    if (actualResponse !== expectedResponse) {
      throw new Error(
        `Response does not match the expected value. Expected: ${expectedResponse}, Found: ${actualResponse}`
      );
    }
  }

  /**
   * Plays a lesson from the completed lessons section.
   * @param {string} lessonName - The name of the lesson.
   */
  async playLessonFromCompleted(lessonName: string): Promise<void> {
    await this.page.waitForSelector(completedLessonsSectionSelector);
    const lessonTileTitles = await this.page.$$(
      completedLessonsSectionSelector + ' ' + lessonTileTitleSelector
    );

    for (const lessonTileTitle of lessonTileTitles) {
      const actualLessonName = await this.page.evaluate(
        el => el.textContent.trim(),
        lessonTileTitle
      );

      if (actualLessonName === lessonName) {
        await lessonTileTitle.click();
        return;
      }
    }

    throw new Error(`Lesson not found: ${lessonName}`);
  }

  /**
   * Adds goals from the goals section in the learner dashboard.
   * @param {string[]} goals - The goals to add.
   */
  async addGoals(goals: string[]): Promise<void> {
    const topicNames = await this.page.$$(topicNameInEditGoalsSelector);
    for (const goal of goals) {
      const matchingTopicName = topicNames.find(async topicName => {
        const actualTopicName = await this.page.evaluate(
          el => el.textContent.trim(),
          topicName
        );
        return actualTopicName === goal;
      });

      if (matchingTopicName) {
        const inputElement = await matchingTopicName.$('+ input');
        await inputElement?.click();
      } else {
        throw new Error(`Goal not found: ${goal}`);
      }
    }
  }

  /**
   * Checks if the completed goals include the expected goals.
   * @param {string[]} expectedGoals - The expected goals.
   */
  async expectCompletedGoalsToInclude(expectedGoals: string[]): Promise<void> {
    const completedGoalsTopicNames = await this.page.$$(
      completedGoalsSectionSelector + ' ' + completedGoalsTopicNameSelector
    );

    const actualGoals = await Promise.all(
      completedGoalsTopicNames.map(async topicName => {
        return await this.page.evaluate(el => el.textContent.trim(), topicName);
      })
    );

    for (const expectedGoal of expectedGoals) {
      if (!actualGoals.includes(expectedGoal)) {
        throw new Error(`Goal not found: ${expectedGoal}`);
      }
    }
  }
  /**
   * Checks if the completed stories include the expected stories.
   * @param {string[]} expectedStories - The expected stories.
   */
  async expectStoriesCompletedToInclude(
    expectedStories: string[]
  ): Promise<void> {
    await this.page.waitForSelector(completedLessonsSectionSelector);
    const storyNames = await this.page.$$(
      completedStoriesSectionSelector + ' ' + storyNameSelector
    );
    const actualStories = await Promise.all(
      storyNames.map(async storyName => {
        return await this.page.evaluate(el => el.textContent.trim(), storyName);
      })
    );

    for (const expectedStory of expectedStories) {
      if (!actualStories.includes(expectedStory)) {
        throw new Error(`Story not found: ${expectedStory}`);
      }
    }
  }

  /**
   * Checks if the completed lessons include the expected lessons.
   * @param {string[]} expectedLessons - The expected lessons.
   */
  async expectCompletedLessonsToInclude(
    expectedLessons: string[]
  ): Promise<void> {
    await this.page.waitForSelector(completedLessonsSectionSelector);
    const lessonObjectives = await this.page.$$(
      completedLessonsSectionSelector + ' ' + lessonObjectiveSelector
    );

    const actualLessons = await Promise.all(
      lessonObjectives.map(async lessonObjective => {
        return await this.page.evaluate(
          el => el.textContent.trim(),
          lessonObjective
        );
      })
    );

    for (const expectedLesson of expectedLessons) {
      if (!actualLessons.includes(expectedLesson)) {
        throw new Error(`Lesson not found: ${expectedLesson}`);
      }
    }
  }

  /**
   * Plays a lesson from the "Learn Something New" section.
   * @param {string} lessonName - The name of the lesson.
   */
  async playLessonFromLearnSomethingNew(lessonName: string): Promise<void> {
    const lessonTileTitles = await this.page.$$(
      learnSomethingNewSectionSelector + ' ' + lessonTileTitleSelector
    );

    for (const lessonTileTitle of lessonTileTitles) {
      const actualLessonName = await this.page.evaluate(
        el => el.textContent.trim(),
        lessonTileTitle
      );

      if (actualLessonName === lessonName) {
        await lessonTileTitle.click();
        return;
      }
    }
    throw new Error(`Lesson not found: ${lessonName}`);
  }
}

export let LoggedInUserFactory = (): LoggedInUser => new LoggedInUser();
