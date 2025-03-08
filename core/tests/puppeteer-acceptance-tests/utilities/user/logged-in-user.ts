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
const baseUrl = testConstants.URLs.BaseURL;
const homePageUrl = testConstants.URLs.Home;
const signUpEmailField = testConstants.SignInDetails.inputField;
const learnerDashboardUrl = testConstants.URLs.LearnerDashboard;
const feedbackUpdatesUrl = testConstants.URLs.FeedbackUpdates;
const moderatorPageUrl = testConstants.URLs.ModeratorPage;
const topicsAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;
const releaseCoordinatorPageUrl = testConstants.URLs.ReleaseCoordinator;
const contributorDashboardAdminUrl =
  testConstants.URLs.ContributorDashboardAdmin;
const siteAdminPageUrl = testConstants.URLs.AdminPage;

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
const profileDropdown = '.e2e-test-profile-dropdown';
const learnerDashboardMenuLink = '.e2e-test-learner-dashboard-menu-link';
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
const addProfilePictureButton = '.e2e-test-photo-upload-submit';
const editProfilePictureButton = '.e2e-test-photo-clickable';
const bioTextareaSelector = '.e2e-test-user-bio';
const saveChangesButtonSelector = '.e2e-test-save-changes-button';
const subjectInterestsInputSelector = '.e2e-test-subject-interests-input';
const explorationLanguageInputSelector =
  '.e2e-test-preferred-exploration-language-input';
const siteLanguageInputSelector = '.e2e-test-site-language-selector';
const audioLanguageInputSelector = '.e2e-test-audio-language-selector';
const goToProfilePageButton = '.e2e-test-go-to-profile-page';
const profilePictureSelector = '.e2e-test-profile-user-photo';
const bioSelector = '.oppia-user-bio-text';
const subjectInterestSelector = '.e2e-test-profile-interest';
const exportButtonSelector = '.e2e-test-export-account-button';
const angularRootElementSelector = 'oppia-angular-root';
const checkboxesSelector = '.checkbox';
const defaultProfilePicture =
  '/assets/images/avatar/user_blue_150px.png?2983.800000011921';

const ACCOUNT_EXPORT_CONFIRMATION_MESSAGE =
  'Your data is currently being loaded and will be downloaded as a JSON formatted text file upon completion.';
const reportExplorationButtonSelector = '.e2e-test-report-exploration-button';
const reportExplorationTextAreaSelector =
  '.e2e-test-report-exploration-text-area';
const submitReportButtonSelector = '.e2e-test-submit-report-button';
const feedbackThreadSelector = '.e2e-test-feedback-thread';
const feedbackMessageSelector = '.e2e-test-feedback-message';
const desktopCompletedLessonsSectionSelector =
  '.e2e-test-completed-community-lessons-section';
const lessonTileTitleSelector =
  '.e2e-test-topic-name-in-learner-story-summary-tile';
const progressSectionSelector = '.e2e-test-progress-section';
const mobileGoalsSectionSelector = '.e2e-test-mobile-goals-section';
const goalsSectionSelector = '.e2e-test-goals-section';
const homeSectionSelector = '.e2e-test-home-section';
const mobileHomeSectionSelector = '.e2e-test-mobile-home-section';
const topicNameInEditGoalsSelector = '.e2e-test-topic-name-in-edit-goals';
const completedGoalsSectionSelector = '.e2e-test-completed-goals-section';
const completedGoalsTopicNameSelector = '.e2e-test-completed-goals-topic-name';
const completedStoriesSectionSelector = '.completed-stories';
const storyNameSelector = '.e2e-test-story-name-in-learner-story-summary-tile';
const continueFromWhereLeftOffSectionSelector =
  '.continue-where-you-left-off-section';
const issueTypeSelector = '.e2e-test-report-exploration-radio-button';
const addTopicToCurrentGoalsButton =
  '.e2e-test-add-topic-to-current-goals-button';
const mobileCompletedLessonSection = '.community-lessons-section';
const currentGoalsSectionSelector = '.e2e-test-current-goals-section';
const homeSectionGreetingElement = '.greeting';
const LABEL_FOR_SUBMIT_BUTTON = 'Submit and start contributing';
const matFormTextSelector = '.oppia-form-text';

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
   * Navigates to the learner dashboard using profile dropdown in the navbar.
   */
  async navigateToLearnerDashboardUsingProfileDropdown(): Promise<void> {
    await this.clickOn(profileDropdown);
    await this.clickOn(learnerDashboardMenuLink);
  }

  /**
   * Navigates to the progress section of the learner dashboard.
   */
  async navigateToProgressSection(): Promise<void> {
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
      await this.clickOn('Stories');
    } else {
      await this.page.waitForSelector(progressSectionSelector);
      const progressSection = await this.page.$(progressSectionSelector);
      if (!progressSection) {
        throw new Error('Progress section not found.');
      }
      await progressSection.click();
    }

    await this.waitForPageToFullyLoad();
  }

  /**
   * Navigates to the home section of the learner dashboard.
   */
  async navigateToHomeSection(): Promise<void> {
    if (await this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileHomeSectionSelector);
      await this.clickOn(mobileHomeSectionSelector);

      try {
        await this.page.waitForSelector(homeSectionGreetingElement, {
          timeout: 5000,
        });
      } catch (error) {
        if (error instanceof puppeteer.errors.TimeoutError) {
          // Try clicking again if does not opens the expected page.
          await this.clickOn(mobileHomeSectionSelector);
        } else {
          throw error;
        }
      }
    } else {
      await this.page.waitForSelector(homeSectionSelector);
      const homeSectionElement = await this.page.$(homeSectionSelector);
      if (!homeSectionElement) {
        throw new Error('Home section not found.');
      }
      await this.waitForElementToBeClickable(homeSectionElement);
      await homeSectionElement.click();
    }

    await this.waitForPageToFullyLoad();
  }

  /**
   * Navigates to the goals section of the learner dashboard.
   */
  async navigateToGoalsSection(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileGoalsSectionSelector);
      await this.clickOn(mobileGoalsSectionSelector);

      try {
        await this.page.waitForSelector(currentGoalsSectionSelector, {
          timeout: 5000,
        });
      } catch (error) {
        if (error instanceof puppeteer.errors.TimeoutError) {
          // Try clicking again if does not opens the expected page.
          await this.clickOn(mobileGoalsSectionSelector);
        } else {
          throw error;
        }
      }
    } else {
      await this.page.waitForSelector(goalsSectionSelector);
      const goalSectionElement = await this.page.$(goalsSectionSelector);
      if (!goalSectionElement) {
        throw new Error('Progress section not found.');
      }
      await goalSectionElement.click();
    }

    await this.waitForPageToFullyLoad();
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
      await this.page.waitForSelector(toastMessageSelector, {visible: true});
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
    } catch (error) {
      const newError = new Error(
        `Failed to verify presence of lesson in 'Play Later' list: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Updates the profile picture in preference page.
   * @param {string} picturePath - The path of the picture to upload.
   */
  async updateProfilePicture(picturePath: string): Promise<void> {
    await this.clickOn(editProfilePictureButton);
    await this.uploadFile(picturePath);
    await this.clickOn(addProfilePictureButton);
  }

  /**
   * Updates the user's bio in preference page.
   * @param {string} bio - The new bio to set for the user.
   */
  async updateBio(bio: string): Promise<void> {
    await this.clickOn(bioTextareaSelector);
    await this.type(bioTextareaSelector, bio);
  }

  /**
   * Updates the user's preferred dashboard in preference page.
   * @param {string} dashboard - The new dashboard to set for the user. Can be one of 'Learner Dashboard', 'Creator Dashboard', or 'Contributor Dashboard'.
   */
  async updatePreferredDashboard(dashboard: string): Promise<void> {
    const allowedDashboards = [
      'Learner Dashboard',
      'Creator Dashboard',
      'Contributor Dashboard',
    ];

    if (!allowedDashboards.includes(dashboard)) {
      throw new Error(
        `Invalid dashboard: ${dashboard}. Must be one of ${allowedDashboards.join(', ')}.`
      );
    }

    // Converting the dashboard to lowercase and replace spaces with hyphens to match the selector.
    const dashboardInSelector = dashboard.toLowerCase().replace(/\s+/g, '-');
    const dashboardSelector = `.e2e-test-${dashboardInSelector}-radio`;

    await this.clickOn(dashboardSelector);
  }

  /**
   * Updates the user's subject interests in preference page.
   * @param {string[]} interests - The new interests to set for the user after each interest is entered in the input field, followed by pressing the Enter key.
   */
  async updateSubjectInterestsWithEnterKey(interests: string[]): Promise<void> {
    for (const interest of interests) {
      await this.type(subjectInterestsInputSelector, interest);
      await this.page.keyboard.press('Enter');
    }
  }
  /**
   * Updates the user's subject interests in the preferences page
   * when the input field loses focus.
   *
   * @param {string[]} interests - The new interests to set for the user when the input field is blurred (i.e., focus is moved away).
   */
  async updateSubjectInterestsWhenBlurringField(
    interests: string[]
  ): Promise<void> {
    for (const interest of interests) {
      await this.type(subjectInterestsInputSelector, interest);
      await this.page.click(matFormTextSelector);
    }
  }

  /**
   * Updates the user's preferred exploration language in preference page.
   * @param {string} language - The new language to set for the user.
   */
  async updatePreferredExplorationLanguage(language: string): Promise<void> {
    await this.waitForPageToFullyLoad();

    await this.clickOn(explorationLanguageInputSelector);

    await this.page.waitForSelector(optionText);
    const options = await this.page.$$(optionText);
    for (const option of options) {
      const optionText = await this.page.evaluate(
        el => el.textContent.trim(),
        option
      );
      if (optionText === language) {
        await option.click();
        break;
      }
    }
  }

  /**
   * Updates the user's preferred site language in preference page.
   * @param {string} language - The new language to set for the user.
   */
  async updatePreferredSiteLanguage(language: string): Promise<void> {
    await this.type(siteLanguageInputSelector, language);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Updates the user's preferred audio language in preference page.
   * @param {string} language - The new language to set for the user.
   */
  async updatePreferredAudioLanguage(language: string): Promise<void> {
    await this.type(audioLanguageInputSelector, language);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Updates the user's email preferences from the preferences page.
   * @param {string[]} preferences - The new email preferences to set for the user.
   */
  async updateEmailPreferences(preferences: string[]): Promise<void> {
    await this.waitForPageToFullyLoad();

    try {
      await this.page.waitForSelector(checkboxesSelector);
      const checkboxes = await this.page.$$(checkboxesSelector);

      for (const preference of preferences) {
        let found = false;

        for (const checkbox of checkboxes) {
          const label = await checkbox.evaluate(el => el.textContent?.trim());
          if (label === preference) {
            await this.waitForElementToBeClickable(checkbox);
            await checkbox.click();
            found = true;
            break;
          }
        }

        if (!found) {
          throw new Error(`Preference not found: ${preference}`);
        }
      }
    } catch (error) {
      const newError = new Error(
        `Failed to update email preferences: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Navigates to the Profile tab from the Preferences page.
   */
  async navigateToProfilePageFromPreferencePage(): Promise<void> {
    try {
      await this.page.waitForSelector(goToProfilePageButton);
      const profileTab = await this.page.$(goToProfilePageButton);

      if (!profileTab) {
        throw new Error('Profile tab not found');
      }

      await this.clickAndWaitForNavigation(goToProfilePageButton);
      await this.waitForPageToFullyLoad();
    } catch (error) {
      const newError = new Error(
        `Failed to navigate to Profile tab from Preferences page: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Saves the changes made in the preferences page.
   */
  async saveChanges(): Promise<void> {
    await this.waitForNetworkIdle({idleTime: 1000});
    await this.waitForPageToFullyLoad();
    await this.clickAndWaitForNavigation(saveChangesButtonSelector);
  }

  /**
   * Expects the profile picture to not match a certain image.
   */
  async verifyProfilePicUpdate(): Promise<void> {
    try {
      await this.page.waitForSelector(profilePictureSelector);
      const profilePicture = await this.page.$(profilePictureSelector);

      if (!profilePicture) {
        throw new Error('Profile picture not found');
      }
      const actualImageUrl = await this.page.evaluate(
        img => img.src,
        profilePicture
      );

      if (actualImageUrl === defaultProfilePicture) {
        throw new Error(
          `Profile picture does not match. Expected image source to be different from: ${defaultProfilePicture}`
        );
      }
      showMessage('Profile picture is different from the default one.');
    } catch (error) {
      const newError = new Error(`Failed to check profile picture: ${error}`);
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Expects the user's bio to match a certain text.
   * @param {string} expectedBio - The expected bio text.
   */
  async expectBioToBe(expectedBio: string): Promise<void> {
    try {
      await this.page.waitForSelector(bioSelector);
      const bioElement = await this.page.$(bioSelector);

      if (!bioElement) {
        throw new Error('Bio not found');
      }

      const actualBio = await this.page.evaluate(
        el => el.textContent,
        bioElement
      );
      if (actualBio.trim() !== expectedBio) {
        throw new Error(
          `Bio does not match. Expected: ${expectedBio}, but got: ${actualBio}`
        );
      }
    } catch (error) {
      const newError = new Error(`Failed to check bio: ${error}`);
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Expects the user's subject interests to match a certain list.
   * @param {string[]} expectedInterests - The expected list of interests.
   */
  async expectSubjectInterestsToBe(expectedInterests: string[]): Promise<void> {
    try {
      await this.page.waitForSelector(subjectInterestSelector);
      const interestElements = await this.page.$$(subjectInterestSelector);
      const actualInterests = await Promise.all(
        interestElements.map(el =>
          this.page.evaluate(el => el.textContent.trim(), el)
        )
      );

      // Check if the actual interests match the expected interests.
      for (const interest of expectedInterests) {
        if (!actualInterests.includes(interest)) {
          throw new Error(`Interest not found: ${interest}`);
        }
      }
    } catch (error) {
      const newError = new Error(`Failed to check interests: ${error}`);
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Exports the user's account data.
   */
  async exportAccount(): Promise<void> {
    try {
      await this.page.waitForSelector(exportButtonSelector);
      const exportButton = await this.page.$(exportButtonSelector);

      if (!exportButton) {
        throw new Error('Export button not found');
      }

      await this.waitForPageToFullyLoad();
      await exportButton.click();

      const isTextPresent = await this.isTextPresentOnPage(
        ACCOUNT_EXPORT_CONFIRMATION_MESSAGE
      );

      if (!isTextPresent) {
        throw new Error(
          `Expected text not found on page: ${ACCOUNT_EXPORT_CONFIRMATION_MESSAGE}`
        );
      }
    } catch (error) {
      const newError = new Error(`Failed to export account: ${error}`);
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Verifies if the page is displayed in Right-to-Left (RTL) mode.
   */
  async verifyPageIsRTL(): Promise<void> {
    await this.page.waitForSelector(angularRootElementSelector);
    const pageDirection = await this.page.evaluate(selector => {
      const oppiaRoot = document.querySelector(selector);
      if (!oppiaRoot) {
        throw new Error(`${selector} not found`);
      }

      const childDiv = oppiaRoot.querySelector('div');
      if (!childDiv) {
        throw new Error('Child div not found');
      }

      return childDiv.getAttribute('dir');
    }, angularRootElementSelector);

    if (pageDirection !== 'rtl') {
      throw new Error('Page is not in RTL mode');
    }

    showMessage('Page is displayed in RTL mode.');
  }

  /**
   * This function is used to report an exploration. It clicks on the report button,
   * opens the report modal, selects an issue, types a description, and submits the report.
   * @param {string} issueName - The name of the issue to report.
   * @param {string} issueDescription - The description of the issue.
   */
  async reportExploration(issueDescription: string): Promise<void> {
    await this.clickOn(reportExplorationButtonSelector);
    await this.page.waitForSelector(issueTypeSelector);
    const issueTypeElement = await this.page.$(issueTypeSelector);
    await issueTypeElement?.click();
    await this.clickOn(reportExplorationTextAreaSelector);
    await this.type(reportExplorationTextAreaSelector, issueDescription);

    await this.clickOn(submitReportButtonSelector);

    await this.clickOn('Close');
  }

  /**
   * Views a feedback update thread.
   * @param {number} threadNumber - The 0-indexed position of the thread.
   */
  async viewFeedbackUpdateThread(threadNumber: number): Promise<void> {
    await this.page.waitForSelector(feedbackThreadSelector);
    const feedbackThreads = await this.page.$$(feedbackThreadSelector);

    if (threadNumber >= 0 && threadNumber < feedbackThreads.length) {
      await feedbackThreads[threadNumber - 1].click();
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
  ): Promise<void> {
    await this.page.waitForSelector(feedbackMessageSelector);
    const feedbackMessages = await this.page.$$(feedbackMessageSelector);

    if (feedbackMessages.length < 2) {
      throw new Error('Not enough feedback messages found.');
    }

    const actualFeedback = await this.page.$eval(feedbackMessageSelector, el =>
      el.textContent?.trim()
    );

    // Fetch the text content of the second feedbackMessageSelector.
    const actualResponse = await this.page.$$eval(
      feedbackMessageSelector,
      elements => elements[1]?.textContent?.trim()
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
   * Adds goals from the goals section in the learner dashboard.
   * @param {string[]} goals - The goals to add.
   */
  async addGoals(goals: string[]): Promise<void> {
    await this.page.waitForSelector(topicNameInEditGoalsSelector, {
      visible: true,
    });
    await this.page.waitForSelector(addTopicToCurrentGoalsButton, {
      visible: true,
    });

    const topicNames = await this.page.$$(topicNameInEditGoalsSelector);
    const addGoalButtons = await this.page.$$(addTopicToCurrentGoalsButton);

    const actualTopicNames = await Promise.all(
      topicNames.map(topicName =>
        this.page.evaluate(el => el.textContent.trim(), topicName)
      )
    );

    for (const goal of goals) {
      const matchingTopicIndex = actualTopicNames.findIndex(
        topicName => topicName === goal
      );

      if (matchingTopicIndex !== -1) {
        await this.waitForElementToBeClickable(
          addGoalButtons[matchingTopicIndex]
        );
        await addGoalButtons[matchingTopicIndex]?.click();
        showMessage(`Goal "${goal}" added.`);
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
    await this.waitForPageToFullyLoad();

    await this.page.waitForSelector(completedGoalsSectionSelector, {
      visible: true,
    });
    await this.page
      .waitForSelector(completedGoalsTopicNameSelector)
      .catch(() => {
        throw new Error('Completed goals section is empty');
      });

    const completedGoals = await this.page.$$eval(
      `${completedGoalsSectionSelector} ${completedGoalsTopicNameSelector}`,
      (elements: Element[]) =>
        elements.map(el =>
          el.textContent ? el.textContent.trim().replace('Learnt ', '') : ''
        )
    );

    for (const expectedGoal of expectedGoals) {
      if (!completedGoals.includes(expectedGoal)) {
        throw new Error(
          `Goal not found in completed lesson section: ${expectedGoal}`
        );
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
    await this.waitForPageToFullyLoad();

    await this.page.waitForSelector(completedStoriesSectionSelector);
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
   * Checks if the completed lessons include the expected lessons in the community lessons section of learner dashboard.
   * @param {string[]} expectedLessons - The expected lessons.
   */
  async expectCompletedLessonsToInclude(
    expectedLessons: string[]
  ): Promise<void> {
    const isMobileViewport = this.isViewportAtMobileWidth();
    const completedLessonsSection = isMobileViewport
      ? mobileCompletedLessonSection
      : desktopCompletedLessonsSectionSelector;

    await this.page.waitForSelector(completedLessonsSection);
    await this.page.waitForSelector(lessonCardTitleSelector);
    const lessonObjectives = await this.page.$$(
      completedLessonsSection + ' ' + lessonCardTitleSelector
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
   * Plays a lesson from the "Continue Where you Left off section" section in learner dashboard.
   * @param {string} lessonName - The name of the lesson.
   */
  async playLessonFromContinueWhereLeftOff(lessonName: string): Promise<void> {
    await this.page.waitForSelector(continueFromWhereLeftOffSectionSelector);
    await this.page.waitForSelector(lessonTileTitleSelector);

    const lessonTileTitles = await this.page.$$(
      continueFromWhereLeftOffSectionSelector + ' ' + lessonTileTitleSelector
    );

    for (const lessonTileTitle of lessonTileTitles) {
      const actualLessonName = await this.page.evaluate(
        el => el.textContent.trim(),
        lessonTileTitle
      );

      if (actualLessonName === lessonName) {
        await Promise.all([
          this.page.waitForNavigation({waitUntil: 'networkidle0'}),
          await this.waitForElementToBeClickable(lessonTileTitle),
          lessonTileTitle.click(),
        ]);
        return;
      }
    }
    throw new Error(`Lesson not found: ${lessonName}`);
  }

  /**
   * Checks if the error page with the given status code is displayed.
   * @param {number} statusCode - The expected error status code.
   */
  async expectErrorPage(statusCode: number): Promise<void> {
    const isErrorPresent = await this.isTextPresentOnPage(
      `Error ${statusCode}`
    );

    if (!isErrorPresent) {
      throw new Error(
        `Expected "Error ${statusCode}" to be present on the page, but it was not.`
      );
    }

    showMessage(`User is on error page with status code ${statusCode}.`);
  }

  /**
   * Navigates to the Topics and Skills Dashboard page.
   */
  async navigateToTopicsAndSkillsDashboardPage(): Promise<void> {
    await this.goto(topicsAndSkillsDashboardUrl);
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
   * Navigates to the Contributor Admin Dashboard page.
   */
  async navigateToContributorAdminDashboardPage(): Promise<void> {
    await this.goto(contributorDashboardAdminUrl);
  }

  /**
   * Navigates to the Admin page.
   */
  async navigateToSiteAdminPage(): Promise<void> {
    await this.goto(siteAdminPageUrl);
  }
}

export let LoggedInUserFactory = (): LoggedInUser => new LoggedInUser();
