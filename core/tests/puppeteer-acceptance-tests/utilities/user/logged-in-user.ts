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

const profilePageUrlPrefix = testConstants.URLs.ProfilePagePrefix;
const WikiPrivilegesToFirebaseAccount =
  testConstants.URLs.WikiPrivilegesToFirebaseAccount;
const PendingAccountDeletionPage = testConstants.URLs.PendingAccountDeletion;
const baseUrl = testConstants.URLs.BaseURL;
const homePageUrl = testConstants.URLs.Home;
const signUpEmailField = testConstants.SignInDetails.inputField;

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
}

export let LoggedInUserFactory = (): LoggedInUser => new LoggedInUser();
