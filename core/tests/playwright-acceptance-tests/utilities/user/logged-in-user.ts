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
const profilePageUrlPrefix = testConstants.URLs.ProfilePagePrefix;
const loginPageUrl = testConstants.URLs.Login;
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
const matFormTextSelector = '.oppia-form-text';
const audioLanguageInputSelector = '.e2e-test-audio-language-selector';
const audioLanguageSearchInputSelector =
  'input.mat-select-search-input:not(.mat-select-search-hidden)';
const explorationLanguageInputSelector =
  '.e2e-test-preferred-exploration-language-input';
const optionText = '.mat-option-text';
const checkboxesSelector = '.checkbox';
const saveChangesButtonSelector = '.e2e-test-save-changes-button';
const goToProfilePageButton = '.e2e-test-go-to-profile-page';
const profilePictureSelector = '.e2e-test-profile-user-photo';
const defaultProfilePicture =
  '/assets/images/avatar/user_blue_150px.png?2983.800000011921';
const bioSelector = '.oppia-user-bio-text';
const subjectInterestSelector = '.e2e-test-profile-interest';
const subscribeButton = 'button.oppia-subscription-button';
const unsubscribeLabel = '.e2e-test-unsubscribe-label';

const angularRootElementSelector = 'oppia-angular-root';
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
const exportButtonSelector = '.e2e-test-export-account-button';

const addProfilePictureButton = '.e2e-test-photo-upload-submit';
const editProfilePictureButton = '.e2e-test-photo-clickable';
const bioTextareaSelector = '.e2e-test-user-bio';
const subjectInterestsInputSelector = '.e2e-test-subject-interests-input';

// Preferences page selectors.
const confirmUsernameField = '.e2e-test-confirm-username-field';
const confirmAccountDeletionButton = '.e2e-test-confirm-deletion-button';
const deleteAccountPage = '.e2e-test-delete-account';
const deleteAccountButton = '.e2e-test-delete-account-button';
const deleteMyAcccountButton = '.e2e-test-delete-my-account-button';
const photoUploadErrorMessage = '.e2e-test-upload-error';
const cancelProfileUploadButtonSelector = '.e2e-test-photo-upload-cancel';
const subjectInterestTagsInPreferencesPage = '.e2e-test-subject-interest-chip';
const audioLanguageValueSelector = `${audioLanguageInputSelector} span.mat-select-min-line`;
const explorationLanguagePerferenceChipsSelector =
  '.e2e-test-exploration-language-preference-chips';
const accountDeletionButtonInDeleteAccountPage =
  '.e2e-test-delete-my-account-button';
const preferencesContainerSelector = '.e2e-test-preferences-container';
const preferencesMenuLink = '.e2e-test-preferences-link';
const ACCOUNT_EXPORT_CONFIRMATION_MESSAGE =
  'Your data is currently being loaded and will be downloaded as a JSON formatted text file upon completion.';
const ACCOUNT_EXPORT_CONFIRMATION_MESSAGE_2 = 'Please do not leave this page.';

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
const sidebarSelector = '.e2e-test-learner-dashboard-sidebar';
const sidebarSelectorPic = '.e2e-test-learner-dash-sidebar-pic';
const classroomButtonOnRedesignedLearnerDashboard =
  '.e2e-test-learner-dash-classroom-button';
const learnerDashSelectors: Record<string, Record<string, string>> = {
  tabSection: {
    content: '.e2e-test-learner-dash-section',
    heading: '.e2e-test-learner-dash-section-heading',
  },
  cardDisplay: {
    content: '.e2e-test-card-display',
    heading: '.e2e-test-card-display-heading',
  },
  topicCard: {
    content: '.e2e-test-learner-topic-summary-tile',
    heading: '.e2e-test-learner-topic-summary-tile-title',
  },
  lessonCard: {
    content: '.e2e-test-redesigned-lesson-card-container',
    heading: '.e2e-test-lesson-card-title',
    button: '.e2e-test-resume-lesson-btn',
    progress: '.e2e-test-progress-lesson',
  },
  skillCard: {
    content: '.e2e-test-skill-card',
    heading: '.e2e-test-skill-card-title',
    button: '.e2e-test-skill-button',
    progress: '.e2e-test-progress-skill',
  },
};
const tabSelectorMap: Record<string, string> = {
  Home: '.e2e-test-home-section',
  Goals: '.e2e-test-goals-section',
  Progress: '.e2e-test-progress-section',
};
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
const currentGoalsContainerSelector = '.e2e-test-current-goals-section';
const goalContainerSelector = 'oppia-goal-list';
const goalTitleSelector = '.e2e-test-goal-title';
const startGoalButtonSelector = '.e2e-test-start-lesson-button';

// Community Library.
const learnerPlaylistModalSelector = 'oppia-learner-playlist-modal';
const closeModalButton = '.e2e-test-close-modal-btn';
const profileDropdownToggleSelector = '.oppia-navbar-dropdown-toggle';
const profileDropdownContainerSelector = '.e2e-test-profile-dropdown-container';
const profileDropdownAnchorSelector = `${profileDropdownContainerSelector} .nav-link`;
const continueWhereYouLeftOffSection = '.e2e-test-continue-section';
const nonEmptySectionSelector = '.e2e-test-non-empty-section';

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
   * Function for clicking on the profile dropdown.
   */
  async clickOnProfileDropdown(): Promise<void> {
    await this.expectElementToBeVisible(profileDropdownToggleSelector);
    await this.clickOnElementWithSelector(profileDropdownToggleSelector);
  }

  /**
   * Clicks the delete account button and waits for navigation.
   */
  async deleteAccount(): Promise<void> {
    await this.clickAndWaitForNavigation(deleteAccountButton, true);

    await this.page.waitForSelector(deleteAccountPage, {
      state: 'visible',
    });
  }

  /**
   * Clicks on the delete button in the page /delete-account to confirm account deletion, also, for confirmation username needs to be entered.
   * @param {string} username - The username of the account.
   */
  async confirmAccountDeletion(username: string): Promise<void> {
    await this.page.waitForSelector(accountDeletionButtonInDeleteAccountPage, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(
      accountDeletionButtonInDeleteAccountPage
    );
    await this.typeInInputField(confirmUsernameField, username);
    await this.clickAndWaitForNavigation(confirmAccountDeletionButton, true);

    await this.page.waitForSelector(deleteMyAcccountButton, {
      state: 'hidden',
    });
    showMessage(`Account deleted for ${username}.`);
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
      newError.stack = (error as Error).stack;
      throw newError;
    }
  }

  /**
   * Function to verify the Or Explore All Lessons in Classroom section in the redesigned learner dashboard is present or not.
   * @param {boolean} visible - Whether the section should be visible or not.
   */
  async expectClassroomButtonOnRedesignedLearnerDashboardToBePresent(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(
      classroomButtonOnRedesignedLearnerDashboard,
      visible
    );
  }

  /**
   * Verifies elements' existence on Redesigned Learner Dashboard(learnerDashSelectors).
   * @param {string[]} expectedTexts - Text content expected in elements.
   * @param {string} selector - Selector type.
   * @param {ParentNode} root - Page or element type we're verifying.
   */
  async expectElementsToBePresentInRLD(
    expectedTexts: string[],
    selector: string,
    root: Page | ElementHandle | undefined = this.page
  ): Promise<void> {
    await this.page.waitForSelector(learnerDashSelectors[selector].heading);

    const allElements =
      (await root?.$$(learnerDashSelectors[selector].heading)) ?? [];

    const sectionHeadingTexts: string[] = [];
    for (const el of allElements) {
      const isHidden = await el.evaluate(node => {
        const style = window.getComputedStyle(node as HTMLElement);
        return style.display === 'none' || style.visibility === 'hidden';
      });
      if (isHidden) {
        continue;
      }

      const text = await el.evaluate(e => (e.textContent || '').trim());
      if (text) {
        sectionHeadingTexts.push(text);
      }
    }

    const allExpectedElementsFound = expectedTexts.every(expectedText =>
      sectionHeadingTexts.includes(expectedText)
    );
    if (!allExpectedElementsFound) {
      throw new Error(
        `Expected elements not found: ${expectedTexts.join(
          ', '
        )} sectionHeadingTexts: ${sectionHeadingTexts.join(', ')}`
      );
    }
    showMessage(`Expected elements found: ${expectedTexts.join(', ')}`);
  }

  /**
   * Verifies that elements with the given texts DO NOT exist (or are not visible)
   * for the given selector group of Learner Dashboard (learnerDashSelectors).
   *
   * @param expectedTexts - Texts that must NOT appear in the matched elements.
   * @param selector - Selector type..
   * @param root - Page or element type we're verifying.
   */
  async expectElementsNotToBePresentInRLD(
    expectedTexts: string[],
    selectorKey: string,
    root: Page | ElementHandle | undefined = this.page
  ): Promise<void> {
    const selectors = learnerDashSelectors[selectorKey];
    const headingSelector = selectors.heading;
    const allElements = (await root?.$$(headingSelector)) ?? [];

    const sectionHeadingTexts: string[] = [];
    for (const el of allElements) {
      const isHidden = await el.evaluate(node => {
        const style = window.getComputedStyle(node as HTMLElement);
        return style.display === 'none' || style.visibility === 'hidden';
      });
      if (isHidden) {
        continue;
      }

      const text = await el.evaluate(e => (e.textContent || '').trim());
      if (text) {
        sectionHeadingTexts.push(text);
      }
    }

    const foundUnexpected = expectedTexts.filter(text =>
      sectionHeadingTexts.includes(text)
    );

    if (foundUnexpected.length > 0) {
      throw new Error(
        `Unexpected elements found: ${foundUnexpected.join(
          ', '
        )} sectionHeadingTexts: ${sectionHeadingTexts.join(', ')}`
      );
    }

    showMessage(`Confirmed elements not present: ${expectedTexts.join(', ')}`);
  }

  /**
   * Verifies lesson card titles and their progress inside a subsection.
   * @param {string} criteria - Subsection title value to match.
   * @param {string[]} expectedTitles - Lesson card titles expected.
   *  @param {number} progress - Expected numeric progress (e.g. 20 for 20%).
   * @param {string} section - Overarching section, only needed to differentiate same title subsections in progress tab.
   */
  async expectLessonCardProgressToBe(
    criteria: string,
    expectedTitles: string[],
    progress: number,
    section: string = 'N/A'
  ): Promise<void> {
    const subsectionElement = await this.findSubsectionElementBasedOnTitle(
      criteria,
      section
    );

    await this.expectElementsToBePresentInRLD(
      expectedTitles,
      'lessonCard',
      subsectionElement
    );

    for (const title of expectedTitles) {
      const lessonCardElement = await this.findChildElementInParent(
        subsectionElement,
        learnerDashSelectors.lessonCard,
        title
      );
      if (!lessonCardElement) {
        throw new Error(`Lesson card with title "${title}" was not found.`);
      }

      const progressText = await lessonCardElement.$eval(
        learnerDashSelectors.lessonCard.progress,
        el => el.textContent?.trim() || ''
      );

      const match = progressText.match(/\d+/);
      const numericProgress = match ? parseInt(match[0], 10) : NaN;

      expect(numericProgress).toBe(progress);
    }
  }

  /**
   * Checks if the profile dropdown contains the given element.
   * @param item The element to check for.
   * @param visible - Whether the element should be visible or not.
   */
  async expectProfileDropdownToContainElementWithContent(
    item: string,
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(profileDropdownContainerSelector);

    const elementsContents = await this.page.$$eval(
      profileDropdownAnchorSelector,
      elements =>
        elements.map(el => (el as HTMLAnchorElement).textContent?.trim())
    );

    if (visible) {
      expect(elementsContents).toContain(item);
    } else {
      expect(elementsContents).not.toContain(item);
    }
  }

  /**
   * Checks if profile photo doesn't work.
   */
  async expectProfilePhotoDoNotUpdate(picturePath: string): Promise<void> {
    await this.page.waitForSelector(editProfilePictureButton, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(editProfilePictureButton);
    await this.uploadFile(picturePath);

    await this.expectElementToBeClickable(addProfilePictureButton, false);
    await this.page.waitForSelector(photoUploadErrorMessage, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(cancelProfileUploadButtonSelector);
    await this.page.waitForSelector(addProfilePictureButton, {
      state: 'hidden',
    });
  }

  /**
   * Verifies that the desktop sidebar is visible and the given tab is active.
   * @param {('Home' | 'Goals' | 'Progress')} activeTab - The tab that should be active.
   */
  async expectSidebarTabToBeActiveAndContainButtonsInOrder(
    activeTab: 'Home' | 'Goals' | 'Progress'
  ): Promise<void> {
    await this.page.waitForSelector(sidebarSelector, {state: 'visible'});

    await this.isElementVisible(sidebarSelectorPic, true);
    const buttonTexts = await this.page.$$eval(
      `${sidebarSelector} .oppia-learner-dash-sidebar_btn`,
      els => els.map(el => el.textContent?.trim() || '')
    );

    expect(buttonTexts).toHaveLength(3);
    expect(buttonTexts[0]).toBe('Home');
    expect(buttonTexts[1]).toBe('Goals');
    expect(buttonTexts[2]).toBe('Progress');

    const activeSelector = `${sidebarSelector} ${tabSelectorMap[activeTab]}`;

    const isActive = await this.page.$eval(activeSelector, el =>
      el.classList.contains('oppia-learner-dash-sidebar_btn--active')
    );

    expect(isActive).toBe(true);
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
      newError.stack = (error as Error).stack;
      throw newError;
    }
  }

  /**
   * Verifies user is on correct lesson page.
   * @param {string} lessonTitle - Lesson card title expected.
   * @param {string} lessonId - Lesson card id expected.
   */
  async expectToBeOnLessonPage(
    lessonTitle: string,
    lessonId: string
  ): Promise<void> {
    expect(`/explore/${lessonId}`.toLowerCase()).toBe(
      new URL(this.page.url()).pathname.toLowerCase()
    );
    showMessage(`Navigated to ${lessonTitle}`);
  }

  /**
   * Function to verify if the learner dashboard is opened using URL.
   */
  async expectToBeOnLearnerDashboard(): Promise<void> {
    await this.page.waitForFunction(
      (url: string) => document.URL.includes(url),
      testConstants.URLs.LearnerDashboard
    );
  }

  /**
   * Verifies that the current page URL includes the expected page pathname.
   */
  async expectToBeOnPage(expectedPage: string): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    const url = this.page.url();

    // Replace spaces in the expectedPage with hyphens.
    const expectedPageInUrl = expectedPage.replace(/\s+/g, '-');

    if (!url.includes(expectedPageInUrl.toLowerCase())) {
      throw new Error(
        `Expected to be on page ${expectedPage}, but found ${url}`
      );
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

      const isTextPresent2 = await this.isTextPresentOnPage(
        ACCOUNT_EXPORT_CONFIRMATION_MESSAGE_2
      );

      if (!isTextPresent) {
        throw new Error(
          `Expected text not found on page: ${ACCOUNT_EXPORT_CONFIRMATION_MESSAGE}`
        );
      }
      if (!isTextPresent2) {
        throw new Error(
          `Expected text not found on page: ${ACCOUNT_EXPORT_CONFIRMATION_MESSAGE_2}`
        );
      }
    } catch (error) {
      const newError = new Error(`Failed to export account: ${error}`);
      newError.stack = (error as Error).stack;
      throw newError;
    }
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
      state: 'attached',
    });
  }

  /**
   * Gets subsection element based on title. We need to differentiate parent elements
   * in progress tab because the subsections are titled the same.
   * @param {string} criteria - Subsection title value to match.
   * @param {string} section - Overarching section.
   */
  async findSubsectionElementBasedOnTitle(
    criteria: string,
    section: string = 'N/A'
  ): Promise<ElementHandle | undefined> {
    let sectionElement: Page | ElementHandle | undefined = this.page;
    if (section === 'In Progress' || section === 'Completed') {
      try {
        sectionElement = await this.findChildElementInParent(
          this.page,
          learnerDashSelectors.tabSection,
          section
        );
      } catch (e) {
        showMessage(
          `Section "${section}" not found with tabSection; falling back to page.`
        );
        sectionElement = this.page;
      }
    }

    const subsectionElement = await this.findChildElementInParent(
      sectionElement,
      learnerDashSelectors.cardDisplay,
      criteria
    );

    return subsectionElement;
  }

  /**
   * Navigate to any classroom using button in topics available in classroom section.
   * Currently there is only math.
   * @param {string} classroom - Classroom.
   */
  async navigateToClassroomFromLearnerDashboard(
    classroom: string
  ): Promise<void> {
    await this.isElementVisible(
      classroomButtonOnRedesignedLearnerDashboard,
      true
    );
    let targetHref = '';
    const allClassroomButtonElements = await this.page.$$(
      classroomButtonOnRedesignedLearnerDashboard
    );
    for (const buttonElement of allClassroomButtonElements) {
      const buttonHref = await buttonElement.evaluate(ele =>
        ele.getAttribute('href')
      );
      if (buttonHref?.includes(classroom)) {
        targetHref = buttonHref;
        await buttonElement.click();
        await this.page.waitForNavigation({waitUntil: 'networkidle'});
        break;
      }
    }
    if (!targetHref) {
      throw new Error(`${classroom} is not a valid classroom`);
    }
  }

  /**
   * Navigates to the learner dashboard.
   */
  async navigateToLearnerDashboard(): Promise<void> {
    await this.goto(learnerDashboardUrl);
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeAttachedInDOM(homeTabSectionInLearnerDashboard);
  }

  /**
   * Navigates to lesson using lesson card.
   * @param {string} criteria - Subsection title value to match.
   * @param {string} lessonTitle - Lesson card title expected.
   * @param {string} section - Overarching section, only needed to differentiate same title subsections in progress tab.
   */
  async navigateToLessonByCard(
    criteria: string,
    lessonTitle: string,
    section: string = 'N/A'
  ): Promise<void> {
    const subsectionElement = await this.findSubsectionElementBasedOnTitle(
      criteria,
      section
    );

    const lessonCardElement = await this.findChildElementInParent(
      subsectionElement,
      learnerDashSelectors.lessonCard,
      lessonTitle
    );

    if (lessonCardElement) {
      const lessonCardButtonElement = await lessonCardElement.$(
        learnerDashSelectors.lessonCard.button
      );
      if (lessonCardButtonElement) {
        await lessonCardButtonElement.click();
        await this.page.waitForNavigation({waitUntil: 'networkidle'});
      }
    } else {
      throw new Error(
        `${lessonTitle} is not a valid lesson in ${criteria} of ${section} section`
      );
    }
  }

  /**
   * Navigate directly to topic in math classroom using topic card.
   * @param {string} topic - Classroom topic.
   */
  async navigateToTopicPageByCard(topic: string): Promise<void> {
    await this.page.waitForFunction((c: string) => {
      return Array.from(document.querySelectorAll(c))
        .map(h => h.textContent?.trim())
        .includes("Topics available in Oppia's Classroom");
    }, learnerDashSelectors.cardDisplay.heading);

    const topicsAvailableInClassroomElement =
      await this.findChildElementInParent(
        this.page,
        learnerDashSelectors.cardDisplay,
        "Topics available in Oppia's Classroom"
      );

    const topicCardElement = await this.findChildElementInParent(
      topicsAvailableInClassroomElement,
      learnerDashSelectors.topicCard,
      topic
    );

    if (topicCardElement) {
      await topicCardElement.click();
      await this.page.waitForNavigation({waitUntil: 'networkidle'});
    } else {
      throw new Error(`${topic} is not a valid topic`);
    }
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
   * Checks if the continue from where you left off section in Learner Dashboard is present.
   * @param {boolean} visible - Whether the section should be visible or not.
   */
  async expectContinueWhereYouLeftOffSectionInLDToBePresent(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(
      `${continueWhereYouLeftOffSection}${nonEmptySectionSelector}`,
      visible
    );
  }

  /**
   * Function to verify the goal in the current goals section in the
   * redesigned learner dashboard.
   * @param {string} goal - The goal to check for.
   */
  async expectCurrentGoalsInRedesignedDashboardToContain(
    goal: string
  ): Promise<void> {
    await this.page.waitForSelector(currentGoalsContainerSelector, {
      state: 'visible',
    });
    const currentGoalsSection = await this.page.$(
      currentGoalsContainerSelector
    );
    if (!currentGoalsSection) {
      throw new Error('Current goals section not found.');
    }
    await this.expectGoalToBePresent(goal, currentGoalsSection);
  }

  /**
   * Function to verify the goal in the given context.
   * @param {string} goal - The goal to check for.
   * @param {ElementHandle<Element> | Page} context - The context of the page.
   */
  async expectGoalToBePresent(
    goal: string,
    context: ElementHandle<Element> | Page
  ): Promise<void> {
    await context.waitForSelector(goalContainerSelector, {
      state: 'visible',
    });

    const goalTitles = await context.$$eval(goalTitleSelector, elements =>
      elements.map(el => el.textContent?.trim())
    );

    expect(goalTitles).toContain(goal);
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
   * Navigates to the Preferences Page Using Profile Dropdown Menu.
   */
  async navigateToPreferencesPageUsingProfileDropdown(): Promise<void> {
    await this.page.waitForSelector(profileDropdown, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(profileDropdown);

    await this.page.waitForSelector(preferencesMenuLink, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(preferencesMenuLink);

    await this.page.waitForSelector(preferencesContainerSelector, {
      state: 'visible',
    });
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
    await this.page.waitForSelector(explorationCard, {
      state: 'visible',
    });

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
      await this.page.waitForSelector(progressSectionSelector);
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
      await this.page.click(communityLessonsSectionButton);
    }

    await this.expectElementToBeVisible(
      communityLessonsSectionInLearnerDashboard
    );
  }

  /**
   * Navigates to the login page.
   */
  async navigateToLoginPage(): Promise<void> {
    await this.goto(loginPageUrl, false);
  }

  /**
   * Function for navigating to the profile page for a given username.
   */
  async navigateToProfilePage(
    username: string,
    verifyURL: boolean = true
  ): Promise<void> {
    const profilePageUrl = `${profilePageUrlPrefix}/${username}`;
    if (this.page.url() === profilePageUrl) {
      return;
    }
    await this.goto(profilePageUrl, verifyURL);
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

      await this.clickAndWaitForNavigation(goToProfilePageButton, true);
      await this.waitForPageToFullyLoad();
      if (!this.page.url().includes('/profile')) {
        throw new Error('Failed to navigate to Profile tab');
      }
    } catch (error) {
      const newError = new Error(
        `Failed to navigate to Profile tab from Preferences page: ${error}`
      );
      newError.stack = (error as Error).stack;
      throw newError;
    }
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
   * Navigates to the splash page.
   * @param expectedURL - The expected URL after navigation. Defaults to `${baseUrl}/`.
   */
  async navigateToSplashPage(
    expectedURL: string = learnerDashboardUrl
  ): Promise<void> {
    // We explicitly check for expected URL instead of verifying it through
    // BaseUser.goto as /splash redirects user to a different page.
    await this.goto(splashPageUrl, false);

    expect(this.page.url()).toBe(expectedURL);
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
   * Saves the changes made in the preferences page.
   */
  async saveChangesInPreferencesPage(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(saveChangesButtonSelector, {
      state: 'visible',
    });
    await this.clickAndWaitForNavigation(saveChangesButtonSelector, true);
    // Wait for the button to re-appear in the reloaded DOM before querying it.
    await this.page.waitForSelector(`button${saveChangesButtonSelector}`, {
      state: 'visible',
    });
    const isDisabled = await this.page.$eval(
      `button${saveChangesButtonSelector}`,
      btn => (btn as HTMLButtonElement).disabled
    );
    if (!isDisabled) {
      throw new Error(
        'Save Changes button is not disabled after saving changes'
      );
    }
    showMessage('Changes saved successfully in preferences page.');
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
   * Function to start a goal from the goal section in the
   * redesigned learner dashboard.
   * @param {string} goal - The goal to start.
   */
  async startGoalFromGoalsSectionInRedesignedDashboard(
    goal: string
  ): Promise<void> {
    await this.page.waitForSelector(goalContainerSelector);
    const goalContainers = await this.page.$$(goalContainerSelector);

    for (const goalContainer of goalContainers) {
      const goalTitle = await goalContainer.$eval(goalTitleSelector, el =>
        el.textContent?.trim()
      );

      if (goalTitle === goal) {
        const startGoalButton = await goalContainer.$(startGoalButtonSelector);
        await startGoalButton?.click();

        await this.page.waitForSelector(startGoalButtonSelector, {
          state: 'hidden',
        });
        return;
      }
    }

    throw new Error(`Goal not found: ${goal}`);
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
   * Function to subscribe to a creator with the given username.
   * @param {string} username - The username of the creator to subscribe to.
   *     If not provided, the function will subscribe to the creator of the
   *     current page.
   */
  async subscribeToCreator(username?: string): Promise<void> {
    // Navigate to user's profile if username is given.
    if (username) {
      await this.navigateToProfilePage(username);
    }

    await this.clickOnElementWithSelector(subscribeButton);
    await this.expectElementToBeVisible(unsubscribeLabel);
    showMessage(
      `Subscribed to the creator${username ? ` (${username})` : ''}.`
    );
  }

  /**
   * Updates the user's bio in preference page.
   * @param {string} bio - The new bio to set for the user.
   */
  async updateBio(bio: string): Promise<void> {
    await this.page.waitForSelector(bioTextareaSelector, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(bioTextareaSelector);
    await this.typeInInputField(bioTextareaSelector, bio);

    const updatedValue = await this.page.$eval(
      bioTextareaSelector,
      el => (el as HTMLTextAreaElement).value
    );
    if (updatedValue !== bio) {
      throw new Error('Bio update failed');
    }
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
            // Check if the checkbox is checked after clicking.
            const isChecked = await checkbox.evaluate(el => {
              const input = el.querySelector(
                'input[type="checkbox"]'
              ) as HTMLInputElement | null;
              return input?.checked;
            });
            if (!isChecked) {
              throw new Error(
                `Checkbox for "${preference}" was not checked after click.`
              );
            }

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
      newError.stack = (error as Error).stack;
      throw newError;
    }
  }

  /**
   * Updates the user's preferred audio language in preference page.
   * @param {string} language - The new language to set for the user.
   */
  async updatePreferredAudioLanguage(language: string): Promise<void> {
    const select = await this.page.waitForSelector(audioLanguageInputSelector, {
      state: 'visible',
    });
    await select.click();

    const searchInput = await this.page.waitForSelector(
      audioLanguageSearchInputSelector,
      {state: 'visible'}
    );
    await this.typeInInputField(searchInput, language);

    const targetOption = await this.page.waitForSelector(
      `mat-option:has-text("${language}")`,
      {state: 'visible'}
    );
    await targetOption.scrollIntoViewIfNeeded();
    await targetOption.click();

    // Post-check: Ensure the audio language is properly selected.
    await this.page.waitForSelector(audioLanguageValueSelector);
    const audioLanguageValueElement = await this.page.$(
      audioLanguageValueSelector
    );
    const selectedAudioLanguage = await this.page.evaluate(
      el => el?.textContent?.trim() || '',
      audioLanguageValueElement
    );
    if (selectedAudioLanguage !== language) {
      throw new Error(
        `Preferred Audio Language ${language} not selected. Found Audio Language: ${selectedAudioLanguage}`
      );
    }
    showMessage(
      `Preferred Audio Language updated to: ${selectedAudioLanguage}`
    );
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

    await this.clickOnElementWithSelector(dashboardSelector);

    const isChecked = await this.page.$eval(
      dashboardSelector,
      el => (el as HTMLInputElement).checked
    );
    if (!isChecked) {
      throw new Error(`Failed to select ${dashboard} radio button`);
    }
  }

  /**
   * Updates the user's preferred exploration language in preference page.
   * @param {string} language - The new language to set for the user.
   */
  async updatePreferredExplorationLanguage(language: string): Promise<void> {
    await this.waitForPageToFullyLoad();

    await this.clickOnElementWithSelector(explorationLanguageInputSelector);

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

    const foundExplorationLanguages = await this.page.$$eval(
      explorationLanguagePerferenceChipsSelector,
      elements => elements.map(el => el.textContent?.trim() || '')
    );
    showMessage(`Found Languages: ${foundExplorationLanguages.join(', ')}`);
    if (!foundExplorationLanguages.some(lng => lng === language)) {
      throw new Error(
        `Preferred Language ${language} not added. Found Languages: ${foundExplorationLanguages.join(', ')}`
      );
    }
  }

  /**
   * Updates the profile picture in preference page.
   * @param {string} picturePath - The path of the picture to upload.
   */
  async updateProfilePicture(picturePath: string): Promise<void> {
    await this.page.waitForSelector(editProfilePictureButton, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(editProfilePictureButton);
    await this.uploadFile(picturePath);
    await this.clickOnElementWithSelector(addProfilePictureButton);

    await this.page.waitForSelector(addProfilePictureButton, {
      state: 'hidden',
    });
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
    await this.page.waitForSelector(subjectInterestsInputSelector, {
      state: 'visible',
    });
    for (const interest of interests) {
      await this.typeInInputField(subjectInterestsInputSelector, interest);
      await this.page.click(matFormTextSelector);
    }

    // Post-check: ensure all interests are present as tags.
    for (const interest of interests) {
      const foundTexts = await this.page.$$eval(
        subjectInterestTagsInPreferencesPage,
        elements => elements.map(el => el.textContent?.trim() || '')
      );

      const found = foundTexts.some(text => text === interest);

      if (!found) {
        throw new Error(
          `Subject interest ${interests} not added. Actual chip texts found: ${foundTexts.join(', ')}`
        );
      }
    }
  }

  /**
   * Updates the user's subject interests in preference page.
   * @param {string[]} interests - The new interests to set for the user after each interest is entered in the input field, followed by pressing the Enter key.
   */
  async updateSubjectInterestsWithEnterKey(interests: string[]): Promise<void> {
    for (const interest of interests) {
      await this.typeInInputField(subjectInterestsInputSelector, interest);
      await this.page.keyboard.press('Enter');
    }

    // Post-check: ensure all interests are present as tags.
    const foundTexts = await this.page.$$eval(
      subjectInterestTagsInPreferencesPage,
      elements => elements.map(el => el.textContent?.trim() || '')
    );
    for (const interest of interests) {
      const found = foundTexts.some(text => text === interest);

      if (!found) {
        throw new Error(
          `Subject interest ${interests} not added. Actual chip texts found: ${foundTexts.join(', ')}`
        );
      }
    }
    showMessage(`Subject interests updated to ${foundTexts.join(', ')}`);
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
        img => (img as HTMLImageElement).src,
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
      newError.stack = (error as Error).stack;
      throw newError;
    }
  }
}

export const LoggedInUserFactory = (page: Page): LoggedInUser => {
  return new LoggedInUser(page);
};
