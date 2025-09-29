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
const CreatorDashboardUrl = testConstants.URLs.CreatorDashboard;
const splashPageUrl = testConstants.URLs.splash;
const classroomsPageUrl = testConstants.URLs.ClassroomsPage;

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
const cancelProfileUploadButtonSelector = '.e2e-test-photo-upload-cancel';
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
const ACCOUNT_EXPORT_CONFIRMATION_MESSAGE_2 = 'Please do not leave this page.';
const reportExplorationButtonSelector = '.e2e-test-report-exploration-button';
const reportExplorationTextAreaSelector =
  '.e2e-test-report-exploration-text-area';
const submitReportButtonSelector = '.e2e-test-submit-report-button';
const feedbackThreadSelector = '.e2e-test-feedback-thread';
const feedbackMessageSelector = '.e2e-test-feedback-message';
const latestFeedbackMessageSelector = '.e2e-test-conversation-feedback-latest';
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
const creatorDashboardMenuLink = '.e2e-test-creator-dashboard-link';
const contributorDashboardMenuLink =
  '.e2e-test-contributor-dashboard-menu-link';
const profileMenuLink = '.e2e-test-profile-link';
const preferencesMenuLink = '.e2e-test-preferences-link';
const createExplorationButton = 'button.e2e-test-create-new-exploration-button';
const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const saveContentButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const saveChangesButton = 'button.e2e-test-save-changes';
const settingsTab = 'a.e2e-test-exploration-settings-tab';
const addTitleBar = 'input#explorationTitle';
const addInteractionModalSelector = 'customize-interaction-body-container';
const saveDraftButton = 'button.e2e-test-save-draft-button';
const commitMessageSelector = 'textarea.e2e-test-commit-message-input';
const publishExplorationButton = 'button.e2e-test-publish-exploration';
const explorationTitleInput = 'input.e2e-test-exploration-title-input-modal';
const explorationGoalInput = 'input.e2e-test-exploration-objective-input-modal';
const explorationCategoryDropdown =
  'mat-form-field.e2e-test-exploration-category-metadata-modal';
const saveExplorationChangesButton = 'button.e2e-test-confirm-pre-publication';
const explorationConfirmPublishButton = '.e2e-test-confirm-publish';
const explorationIdElement = 'span.oppia-unique-progress-id';
const closePublishedPopUpButton = 'button.e2e-test-share-publish-close';
const stateEditSelector = '.e2e-test-state-edit-content';
const stateContentInputField = 'div.e2e-test-rte';
const addSkillReviewComponentButton = '.cke_button__oppiaskillreview';
const skillInSkillreviewModal = '.e2e-test-rte-skill-selector-item';
const saveRteComponentAndCloseCustomizationModalButton =
  '.e2e-test-close-rich-text-component-editor';
const mobileNavbarPane = '.oppia-exploration-editor-tabs-dropdown';
const previewTabButton = '.e2e-test-preview-tab';
const previewTabContainer = '.e2e-test-preview-tab-container';
const mobilePreviewTabButton = '.e2e-test-mobile-preview-button';
const skillReviewComponent = 'oppia-noninteractive-skillreview';
const skillReviewComponentModal =
  'oppia-noninteractive-skillreview-concept-card-modal';
const toastMessage = '.e2e-test-toast-message';
const mobileSettingsBar = 'li.e2e-test-mobile-settings-button';
const mobileChangesDropdown = 'div.e2e-test-mobile-changes-dropdown';
const mobileSaveChangesButton =
  'button.e2e-test-save-changes-for-small-screens';
const mobilePublishButton = 'button.e2e-test-mobile-publish-button';
const mobileNavbarDropdown = 'div.e2e-test-mobile-options-dropdown';
const mobileNavbarOptions = '.navbar-mobile-options';
const mobileOptionsButton = 'i.e2e-test-mobile-options';
const basicSettingsDropdown = 'h3.e2e-test-settings-container';
const feedbackSettingsDropdown = 'h3.e2e-test-feedback-settings-container';
const permissionSettingsDropdown = 'h3.e2e-test-permission-settings-container';
const voiceArtistSettingsDropdown =
  'h3.e2e-test-voice-artists-settings-container';
const rolesSettingsDropdown = 'h3.e2e-test-roles-settings-container';
const advanceSettingsDropdown = 'h3.e2e-test-advanced-settings-container';
const tagsField = '.e2e-test-chip-list-tags';
const explorationSummaryTileTitleSelector = '.e2e-test-exp-summary-tile-title';
const errorSavingExplorationModal = '.e2e-test-discard-lost-changes-button';
const greetingSelector = '.e2e-learner-dashboard-greeting';

// Auth Pages selectors.
const loginPage = '.e2e-test-login-page';

// Learner dashboard selectors.
const communityLessonsSectionInLearnerDashboard =
  '.e2e-test-community-lessons-section';
const homeTabSectionInLearnerDashboard = '.e2e-test-learner-dash-home-tab';
const progressTabSectionInLearnerDashboard =
  '.e2e-test-learner-dash-progress-tab';
const learnerDashboardContainerSelector = '.e2e-test-learner-dashboard-page';

const emptySuggestionSectionSelector = '.e2e-test-home-tab-empty-suggestions';
const emptyCurrentGoalsSectionSelector =
  '.e2e-test-goals-section .e2e-test-current-goals-section.e2e-test-empty-section';
const nonEmptyCurrentGoalsSectionSelector =
  '.e2e-test-goals-section .e2e-test-current-goals-section.e2e-test-non-empty-section';
const goalsStatusTitleSelector =
  '.e2e-test-goals-section .e2e-test-goals-status-title';
const topicInCurrentGoalsSelector =
  '.e2e-test-goals-section .e2e-test-topic-name-in-current-goals';
const currentGoalsContainerSelector = '.e2e-test-current-goals-section';
const completedGoalsContainerSelector = '.e2e-test-completed-goals-section';
const goalContainerSelector = 'oppia-goal-list';
const goalTitleSelector = '.e2e-test-goal-title';
const startGoalButtonSelector = '.e2e-test-start-lesson-button';

// Learner Dashboard > Home Tab Seclectors.
const hometabSectionHeadingSelector =
  '.e2e-test-learner-dash-home-tab .e2e-test-section-heading';
const emptySuggestedForYouSectionSelector =
  '.e2e-test-learner-dash-home-tab .empty-suggested-for-you';
const learnerGreetingsSelector = '.e2e-test-learner-greetings';
const addGoalsButtonInRedesignedLearnerDashboard = '.e2e-test-add-goals-button';
const newGoalsListInRedesignedLearnerDashboard = '.e2e-test-new-goals-list';
const goalCheckboxInRedesignedLearnerDashboard = `${newGoalsListInRedesignedLearnerDashboard} mat-checkbox`;
const addNewGoalButtonSelector = '.e2e-test-add-new-goal-button';
const goalsHeadingInRedesignedDashbaordSelector = '.e2e-test-goals-heading';
const continueFromWhereLeftOffSectionInRedesignedDashboardSelector =
  '.e2e-test-continue-where-you-left-off';
const learnSomethingNewSectionSelector =
  '.e2e-test-learn-something-new-section';

// Learner Dashboard > Progress section selectors.
const completedLessonsSectionSelector =
  '.e2e-test-completed-community-lessons-section';

// Creator dashboard selectors.
const creatorDashboardContainerSelector =
  '.e2e-test-creator-dashboard-container';
const settingsTabMainContent = '.e2e-test-settings-card';

// Contributor dashboard selectors.
const contributorDashboardContainerSelector =
  '.e2e-test-oppia-contributor-home';

// Preferences page selectors.
const preferencesContainerSelector = '.e2e-test-preferences-container';
const deleteAccountPage = '.e2e-test-delete-account';
const deleteMyAcccountButton = '.e2e-test-delete-my-account-button';
const subjectInterestTagsInPreferencesPage = '.e2e-test-subject-interest-chip';
const explorationLanguagePerferenceChipsSelector =
  '.e2e-test-exploration-language-preference-chips';
const siteLanguageValueSelector = `${siteLanguageInputSelector} span.mat-select-min-line`;
const audioLanguageValueSelector = `${audioLanguageInputSelector} span.mat-select-min-line`;
const photoUploadErrorMessage = '.e2e-test-upload-error';

// Profile Page selectors.
const profileContainerSelector = '.e2e-test-profile-container';

// Exploration player selectors.
const explorationSuccessfullyFlaggedMessage =
  '.e2e-test-exploration-flagged-success-message';

// Feedback updates page.
const feedbackUpdatesMainContentContainer =
  '.e2e-test-feedback-updates-main-content-container';

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

// Common > Lesson Card.
const lessonCardContainer = '.e2e-test-redesigned-lesson-card-container';
const lessonTitleSelector = '.e2e-test-lesson-title';
const circleProgressElementSelector = 'circle-progress';
const resumeLessonButtonSelector = '.e2e-test-resume-lesson-btn';

// Others.
const filledRatingStarSelector = '.fas.fa-star';
const navbarLearnTab = 'a.e2e-test-navbar-learn-menu';
const navbarLearnDropdownContainerSelector =
  '.e2e-test-classroom-oppia-list-item';
const navbarAboutDropdownConatinaerSelector = '.e2e-test-about-oppia-list-item';
const navbarGetInvolvedDropdownContainerSelector =
  '.e2e-test-navbar-get-involved-menu';
const navbarAboutTab = 'a.e2e-test-navbar-about-menu';
const navbarGetInvolvedTab = 'a.e2e-test-navbar-get-involved-menu';
const mobileNavbarOpenSidebarButton = 'a.e2e-mobile-test-navbar-button';
const mobileAboutMenuDropdownSelector =
  '.e2e-mobile-test-sidebar-expand-about-menu';
const mobileAboutPageButtonSelector = '.e2e-mobile-test-sidebar-about-button';
const mobileGetInvolvedDropdownSelector =
  '.e2e-mobile-test-sidebar-expand-get-involved-menu';
const mobileGetInvolvedMenuContainerSelector =
  '.e2e-mobile-test-sidebar-get-involved-menu';
const mobileLearnDropdownSelector = '.e2e-mobile-test-learn';
const mobileLearnSubMenuSelector = '.e2e-test-mobile-learn-submenu';

const commonPlayLaterIconSelector = '.e2e-test-lesson-playlist-icon';
const learnerDashboardIconsSelector = 'oppia-learner-dashboard-icons';

// Community Library.
const learnerPlaylistModalSelector = 'oppia-learner-playlist-modal';
const profileDropdownToggleSelector = '.oppia-navbar-dropdown-toggle';
const profileDropdownContainerSelector = '.e2e-test-profile-dropdown-container';
const profileDropdownAnchorSelector = `${profileDropdownContainerSelector} .nav-link`;
const closeModalButton = '.e2e-test-close-modal-btn';
const goalsSectionContainerSelector = '.e2e-test-goals-section-container';
const usernameSelector = '.e2e-test-username';

export class LoggedInUser extends BaseUser {
  /**
   * Clicks on the given button in the remove activity modal.
   * @param {'Remove' | 'Cancel'} button - The button to click.
   */
  async clickButtonInRemoveActivityModal(
    button: 'Remove' | 'Cancel'
  ): Promise<void> {
    await this.page.waitForSelector(removeModalContainerSelector);

    if (button === 'Remove') {
      await this.clickOn(removeModalConfirmButtonSelector);
    } else if (button === 'Cancel') {
      await this.clickOn(removeModalCancelButtonSelector);
    }

    await this.page.waitForSelector(removeModalContainerSelector, {
      hidden: true,
    });
  }

  /**
   * Function for clicking on the profile dropdown.
   */
  async clickOnProfileDropdown(): Promise<void> {
    await this.isElementVisible(profileDropdownToggleSelector);
    await this.clickOn(profileDropdownToggleSelector);
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
    await this.isElementVisible(profileDropdownContainerSelector);

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
   * Function to navigate to the classrooms page.
   */
  async navigateToClassroomsPage(verifyURL: boolean = true): Promise<void> {
    if (this.page.url() === classroomsPageUrl) {
      await this.page.reload();
    }
    await this.goto(classroomsPageUrl, verifyURL);
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
      await this.page.waitForSelector(progressSectionSelector, {
        visible: true,
      });
      await this.page.click(communityLessonsSectionButton);
    }

    await this.page.waitForSelector(communityLessonsSectionInLearnerDashboard, {
      visible: true,
    });
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
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(profileDropdown, {
      visible: true,
    });
    await this.clickOn(profileDropdown);

    await this.page.waitForSelector(learnerDashboardMenuLink, {
      visible: true,
    });
    await this.clickOn(learnerDashboardMenuLink);

    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(homeTabSectionInLearnerDashboard, {
      visible: true,
    });
  }

  /**
   * Navigates to the given page using the profile dropdown.
   * @param page The page or dashboard to navigate to.
   */
  async navigateToPageUsingProfileMenu(page: 'Blog Dashboard'): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await this.expectElementToBeVisible(profileDropdown);
    await this.clickOn(profileDropdown);

    const selector = `.e2e-test-${page.toLowerCase().replace(/ /g, '-')}-link`;
    await this.clickOn(selector);
    await this.expectElementToBeVisible(`${profileDropdown}.show`, false);
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

      await this.page.waitForSelector(progressTabSectionInLearnerDashboard, {
        visible: true,
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
      visible: true,
    });
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
          timeout: 10000,
        });
      } catch (error) {
        if (error instanceof puppeteer.errors.TimeoutError) {
          // Try clicking again if does not opens the expected page.
          await this.clickOn(mobileHomeSectionSelector);
        } else {
          throw error;
        }
      }

      await this.page.waitForSelector(homeTabSectionInLearnerDashboard, {
        visible: true,
      });
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
    await this.page.waitForSelector(homeTabSectionInLearnerDashboard, {
      visible: true,
    });
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
   * Check if rating stars are displayed.
   */
  async expectRatingStarsToBeVisible(): Promise<void> {
    await this.page.waitForSelector(ratingsHeaderSelector);
    const ratingStars = await this.page.$$(ratingStarSelector);
    if (ratingStars.length !== 5) {
      throw new Error('Rating stars are not visible.');
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
   * Waits for the given number of filled stars to be present on the page.
   * @param rating The number of filled stars to wait for.
   */
  async expectStarRatingToBe(rating: number): Promise<void> {
    await this.page.waitForFunction(
      (selector: string, rating: number) => {
        const filledStars = document.querySelectorAll(selector);
        return filledStars.length === rating;
      },
      {},
      filledRatingStarSelector,
      rating
    );
  }

  /**
   * Clicks the delete account button and waits for navigation.
   */
  async deleteAccount(): Promise<void> {
    await this.clickAndWaitForNavigation(deleteAccountButton);

    await this.page.waitForSelector(deleteAccountPage, {
      visible: true,
    });
  }

  /**
   * Clicks on the delete button in the page /delete-account to confirm account deletion, also, for confirmation username needs to be entered.
   * @param {string} username - The username of the account.
   */
  async confirmAccountDeletion(username: string): Promise<void> {
    await this.page.waitForSelector(accountDeletionButtonInDeleteAccountPage, {
      visible: true,
    });
    await this.clickOn(accountDeletionButtonInDeleteAccountPage);
    await this.type(confirmUsernameField, username);
    await this.clickAndWaitForNavigation(confirmAccountDeletionButton);

    await this.page.waitForSelector(deleteMyAcccountButton, {
      hidden: true,
    });
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

    await this.page.waitForSelector(loginPage, {
      visible: true,
    });
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
   * @param {boolean} verifyLogin - Whether to verify the login after entering the username.
   */
  async signInWithUsername(
    username: string,
    verifyLogin: boolean = true
  ): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(signUpUsernameField, {
      visible: true,
    });
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
      await Promise.all([
        this.page.waitForNavigation({waitUntil: 'networkidle0'}),
        this.clickOn(LABEL_FOR_SUBMIT_BUTTON),
      ]);

      await this.page.waitForSelector(learnerDashboardContainerSelector, {
        visible: true,
      });
    } else if (verifyLogin) {
      // If the username is invalid, we throw an error.
      throw new Error(
        'Invalid username. Please enter a valid username and try again.'
      );
    }
  }

  /**
   * Function to sign in the user with the given email to the Oppia website only when the email is valid.
   */
  async enterEmail(email: string): Promise<void> {
    await this.page.waitForSelector(signUpEmailField, {
      visible: true,
    });
    await this.clearAllTextFrom(signUpEmailField);
    await this.type(signUpEmailField, email);

    await this.waitForPageToFullyLoad();
    const invalidEmailErrorContainerElement = await this.page.$(
      invalidEmailErrorContainer
    );
    if (!invalidEmailErrorContainerElement) {
      await this.clickOn('Sign In');
      await this.page.waitForNavigation({waitUntil: 'networkidle0'});

      // Post Check: Check if the login page is closed. We can't check if user
      // is redirected to the home page it is dependent to "redirects" in URL.
      await this.page.waitForSelector(signUpEmailField, {
        hidden: true,
      });
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
    await this.page.waitForSelector(signUpEmailField, {
      visible: true,
    });
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
        await this.page.waitForSelector(learnerDashboardIconsSelector);
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
        await this.page.waitForSelector(desktopAddToPlayLaterButton);
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
      newError.stack = error.stack;
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

    await playLaterButton.click();

    await this.page.waitForSelector(learnerPlaylistModalSelector, {
      visible: true,
    });

    await this.isTextPresentOnPage("Remove from 'Play Later' list?");

    await this.clickOn(confirmRemovalFromPlayLaterButton);
    await this.page.waitForSelector(learnerPlaylistModalSelector, {
      hidden: true,
    });
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
      visible: true,
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

    await playLaterButton?.hover();

    await this.page.waitForSelector('.tooltip', {
      visible: true,
    });

    // Check the tooltip content.
    const tooltipText = await this.page.$eval('.tooltip', el => el.textContent);
    expect(tooltipText).toBe(expectedTooltip);
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

      await this.page.waitForSelector(lessonCardTitleSelector, {hidden: true});
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
      await this.waitForElementToStabilize(confirmRemovalFromPlayLaterButton);
      await this.clickOn(confirmRemovalFromPlayLaterButton);

      await this.page.waitForSelector(confirmRemovalFromPlayLaterButton, {
        hidden: true,
      });

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
    await this.page.waitForSelector(editProfilePictureButton, {
      visible: true,
    });
    await this.clickOn(editProfilePictureButton);
    await this.uploadFile(picturePath);
    await this.waitForElementToStabilize(addProfilePictureButton);
    await this.clickOn(addProfilePictureButton);

    await this.page.waitForSelector(addProfilePictureButton, {
      hidden: true,
    });
  }

  /**
   * Checks if profile photo doesn't work.
   */
  async expectProfilePhotoDoNotUpdate(picturePath: string): Promise<void> {
    await this.page.waitForSelector(editProfilePictureButton, {
      visible: true,
    });
    await this.clickOn(editProfilePictureButton);
    await this.uploadFile(picturePath);

    await this.expectElementToBeClickable(addProfilePictureButton, false);
    await this.page.waitForSelector(photoUploadErrorMessage, {
      visible: true,
    });
    await this.clickOn(cancelProfileUploadButtonSelector);
    await this.page.waitForSelector(addProfilePictureButton, {
      hidden: true,
    });
  }

  /**
   * Checks if the photo upload error message is visible.
   * @param expectedText - The expected text of the error message.
   */
  async expectPhotoUploadErrorMessageToBe(expectedText: string): Promise<void> {
    await this.expectElementToBeVisible(photoUploadErrorMessage);
    await this.expectTextContentToContain(
      photoUploadErrorMessage,
      expectedText
    );
  }

  /**
   * Cancels the photo upload.
   */
  async cancelPhotoUpload(): Promise<void> {
    await this.expectElementToBeVisible(cancelProfileUploadButtonSelector);
    await this.clickOn(cancelProfileUploadButtonSelector);
    await this.expectElementToBeVisible(
      cancelProfileUploadButtonSelector,
      false
    );
  }

  /**
   * Updates the user's bio in preference page.
   * @param {string} bio - The new bio to set for the user.
   */
  async updateBio(bio: string): Promise<void> {
    await this.page.waitForSelector(bioTextareaSelector, {
      visible: true,
    });
    await this.clickOn(bioTextareaSelector);
    await this.type(bioTextareaSelector, bio);

    const updatedValue = await this.page.$eval(
      bioTextareaSelector,
      el => (el as HTMLTextAreaElement).value
    );
    if (updatedValue !== bio) {
      throw new Error('Bio update failed');
    }
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

    const isChecked = await this.page.$eval(
      dashboardSelector,
      el => (el as HTMLInputElement).checked
    );
    if (!isChecked) {
      throw new Error(`Failed to select ${dashboard} radio button`);
    }
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
   * Updates the user's subject interests in the preferences page
   * when the input field loses focus.
   *
   * @param {string[]} interests - The new interests to set for the user when the input field is blurred (i.e., focus is moved away).
   */
  async updateSubjectInterestsWhenBlurringField(
    interests: string[]
  ): Promise<void> {
    await this.page.waitForSelector(subjectInterestsInputSelector, {
      visible: true,
    });
    for (const interest of interests) {
      await this.type(subjectInterestsInputSelector, interest);
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
   * Updates the user's preferred site language in preference page.
   * @param {string} language - The new language to set for the user.
   */
  async updatePreferredSiteLanguage(language: string): Promise<void> {
    await this.page.waitForSelector(siteLanguageInputSelector, {
      visible: true,
    });
    await this.type(siteLanguageInputSelector, language);
    await this.page.keyboard.press('Enter');

    // Post-check: Ensure the site language is properly selected.
    await this.waitForNetworkIdle();
    await this.page.waitForSelector(siteLanguageValueSelector);
    const siteLanguageValueElement = await this.page.$(
      siteLanguageValueSelector
    );
    const selectedSiteLanguage = await this.page.evaluate(
      el => el.textContent?.trim(),
      siteLanguageValueElement
    );
    if (selectedSiteLanguage !== language) {
      throw new Error(
        `Preferred Site Language ${language} not added. Found Site Language: ${selectedSiteLanguage}`
      );
    }
    showMessage(`Preferred Site Language updated to: ${selectedSiteLanguage}`);
  }

  /**
   * Updates the user's preferred audio language in preference page.
   * @param {string} language - The new language to set for the user.
   */
  async updatePreferredAudioLanguage(language: string): Promise<void> {
    await this.page.waitForSelector(audioLanguageInputSelector, {
      visible: true,
    });
    await this.type(audioLanguageInputSelector, language);
    await this.page.keyboard.press('Enter');

    // Post-check: Ensure the audio language is properly selected.
    await this.waitForNetworkIdle();
    await this.page.waitForSelector(audioLanguageValueSelector);
    const audioLanguageValueElement = await this.page.$(
      audioLanguageValueSelector
    );
    const selectedAudioLanguage = await this.page.evaluate(
      el => el.textContent?.trim(),
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
      if (!this.page.url().includes('/profile')) {
        throw new Error('Failed to navigate to Profile tab');
      }
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
  async saveChangesInPreferencesPage(): Promise<void> {
    await this.waitForNetworkIdle({idleTime: 1000});
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(saveChangesButtonSelector, {
      visible: true,
    });
    await this.clickAndWaitForNavigation(saveChangesButtonSelector);
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
    await this.page.waitForSelector(reportExplorationButtonSelector, {
      visible: true,
    });
    await this.clickOn(reportExplorationButtonSelector);
    await this.page.waitForSelector(issueTypeSelector);
    await this.waitForElementToStabilize(issueTypeSelector);
    await this.page.click(issueTypeSelector);
    await this.type(reportExplorationTextAreaSelector, issueDescription);

    await this.clickOn(submitReportButtonSelector);

    await this.waitForElementToStabilize(closeModalButton);
    await this.clickOn(closeModalButton);

    await this.page.waitForSelector(explorationSuccessfullyFlaggedMessage, {
      hidden: true,
    });
  }

  /**
   * Views a feedback update thread.
   * @param {number} threadNumber - The 0-indexed position of the thread.
   */
  async viewFeedbackUpdateThread(threadNumber: number): Promise<void> {
    await this.page.waitForSelector(feedbackThreadSelector);
    const feedbackThreads = await this.page.$$(feedbackThreadSelector);

    if (threadNumber >= 0 && threadNumber <= feedbackThreads.length) {
      await feedbackThreads[threadNumber - 1].click();
    } else {
      throw new Error(`Thread not found: ${threadNumber}`);
    }

    await this.page.waitForSelector(feedbackUpdatesMainContentContainer);
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
   * Verifies that the feedback and response match the expected values.
   * @param {string} expectedFeedback - The expected feedback.
   */
  async expectResponseFeedbackToBe(expectedFeedback: string): Promise<void> {
    await this.expectElementToBeVisible(latestFeedbackMessageSelector);
    await this.expectTextContentToBe(
      latestFeedbackMessageSelector,
      expectedFeedback
    );
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

        await this.page.waitForSelector(
          continueFromWhereLeftOffSectionSelector,
          {
            hidden: true,
          }
        );
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

  /**
   * Navigates to the Creator Dashboard Using Profile Dropdown Menu.
   */
  async navigateToCreatorDashboardUsingProfileDropdown(): Promise<void> {
    await this.page.waitForSelector(profileDropdown, {
      visible: true,
    });
    await this.clickOn(profileDropdown);

    await this.page.waitForSelector(creatorDashboardMenuLink, {
      visible: true,
    });
    await this.clickOn(creatorDashboardMenuLink);

    await this.page.waitForSelector(creatorDashboardContainerSelector, {
      visible: true,
    });
  }

  /**
   * Navigates to the Contributor Dashboard Using Profile Dropdown Menu.
   */
  async navigateToContributorDashboardUsingProfileDropdown(): Promise<void> {
    await this.expectElementToBeVisible(profileDropdown);
    await this.clickOn(profileDropdown);

    await this.expectElementToBeVisible(contributorDashboardMenuLink);
    await this.clickOn(contributorDashboardMenuLink);

    await this.expectElementToBeVisible(contributorDashboardContainerSelector);
  }

  /**
   * Navigates to the Preferences Page Using Profile Dropdown Menu.
   */
  async navigateToPreferencesPageUsingProfileDropdown(): Promise<void> {
    await this.page.waitForSelector(profileDropdown, {
      visible: true,
    });
    await this.clickOn(profileDropdown);

    await this.page.waitForSelector(preferencesMenuLink, {
      visible: true,
    });
    await this.clickOn(preferencesMenuLink);

    await this.page.waitForSelector(preferencesContainerSelector, {
      visible: true,
    });
  }

  /**
   * Navigates to the Profile Page Using Profile Dropdown Menu.
   */
  async navigateToProfilePageUsingProfileDropdown(): Promise<void> {
    await this.page.waitForSelector(profileDropdown, {
      visible: true,
    });
    await this.clickOn(profileDropdown);

    await this.page.waitForSelector(profileMenuLink, {
      visible: true,
    });
    await this.clickOn(profileMenuLink);

    await this.page.waitForSelector(profileContainerSelector, {
      visible: true,
    });
  }

  /**
   * Deletes the previous written title and updates the new title.
   */
  async updateTitleTo(title: string): Promise<void> {
    await this.page.waitForSelector(addTitleBar, {
      visible: true,
    });
    await this.clearAllTextFrom(addTitleBar);
    await this.type(addTitleBar, title);
    await this.page.keyboard.press('Tab');

    const currentTitle = await this.page.$eval(
      addTitleBar,
      el => (el as HTMLInputElement).value
    );
    if (currentTitle !== title) {
      throw new Error(
        `Title update failed. Expected: ${title}, Found: ${currentTitle}`
      );
    }

    showMessage(`Title has been updated to ${title}`);
  }

  /**
   * Open settings tab.(Note->It also opens all the dropdowns present
   * in the setting tab for mobile view port.)
   */
  async navigateToSettingsTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarDropdown);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to settings tab appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.page.waitForSelector(mobileOptionsButton, {visible: true});
        await this.clickOn(mobileOptionsButton);
      }
      await this.clickOn(mobileNavbarDropdown);
      await this.clickOn(mobileSettingsBar);

      // Open all dropdowns because by default all dropdowns are closed in mobile view.
      await this.clickOn(basicSettingsDropdown);
      await this.clickOn(advanceSettingsDropdown);
      await this.clickOn(rolesSettingsDropdown);
      await this.clickOn(voiceArtistSettingsDropdown);
      await this.clickOn(permissionSettingsDropdown);
      await this.clickOn(feedbackSettingsDropdown);
    } else {
      await this.clickOn(settingsTab);
    }

    await this.page.waitForSelector(settingsTabMainContent, {visible: true});
    showMessage('Settings tab is opened successfully.');
  }

  /**
   * Function to navigate to exploration editor.
   * @param explorationUrl - url of the exploration.
   */
  async navigateToExplorationEditor(
    explorationId: string | null
  ): Promise<void> {
    if (!explorationId) {
      throw new Error('Cannot navigate to editor: explorationId is null');
    }
    const editorUrl = `${baseUrl}/create/${explorationId}#/`;
    await this.goto(editorUrl);

    showMessage('Navigation to exploration editor is successful.');
  }

  /**
   * Function to navigate to Creator Dashboard Page
   */
  async navigateToCreatorDashboardPage(): Promise<void> {
    await this.goto(CreatorDashboardUrl);
    showMessage('Creator dashboard page is opened successfully.');
  }

  /**
   * Function to navigate to exploration editor from creator dashboard.
   */
  async navigateToExplorationEditorPageFromCreatorDashboard(): Promise<void> {
    await this.clickAndWaitForNavigation(createExplorationButton);

    if (!this.page.url().includes('/create/')) {
      throw new Error(
        'Navigation to exploration editor from creator dashboard failed.'
      );
    }
  }

  /**
   * Function to dismiss exploration editor welcome modal.
   */
  async dismissWelcomeModal(): Promise<void> {
    try {
      await this.page.waitForNetworkIdle();
      await this.page.waitForSelector(dismissWelcomeModalSelector, {
        visible: true,
        timeout: 10000,
      });
      await this.clickOn(dismissWelcomeModalSelector);
      await this.page.waitForSelector(dismissWelcomeModalSelector, {
        hidden: true,
      });
      showMessage('Tutorial pop-up closed successfully.');
    } catch (error) {
      showMessage(`welcome modal not found: ${error.message}`);
    }
  }

  /**
   * Function to add content to a card.
   * @param {string} content - The content to be added to the card.
   */
  async updateCardContent(content: string): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.page.waitForSelector(stateEditSelector, {
      visible: true,
    });
    await this.clickOn(stateEditSelector);
    await this.type(stateContentInputField, `${content}`);
    await this.clickOn(saveContentButton);
    await this.page.waitForSelector(stateContentInputField, {hidden: true});
    showMessage('Card content is updated successfully.');
  }

  /**
   * Function to add content to a card.
   * @param {string} content - The content to be added to the card.
   */
  async updateCardContentWithConceptCard(content: string): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.page.waitForSelector(stateEditSelector, {
      visible: true,
    });
    await this.clickOn(stateEditSelector);
    await this.type(stateContentInputField, `${content}`);
    await this.clickOn(addSkillReviewComponentButton);
    await this.clickOn(skillInSkillreviewModal);
    await this.clickOn(saveRteComponentAndCloseCustomizationModalButton);
    await this.clickOn(saveContentButton);
    await this.page.waitForSelector(stateContentInputField, {hidden: true});
    showMessage('Card content is updated successfully with concept card.');
  }

  /**
   * Function to navigate to the exploration editor preview tab.
   */
  async navigateToExplorationEditorPreviewTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileNavbarDropdown, {
        visible: true,
      });
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobilePreviewTabButton);
    } else {
      await this.page.waitForSelector(previewTabButton, {
        visible: true,
      });
      await this.clickOn(previewTabButton);
    }

    await this.expectElementToBeVisible(previewTabContainer);
  }

  /**
   * Function to click on the skillreview component
   */
  async clickOnSkillReviewComponent(): Promise<void> {
    await this.expectElementToBeVisible(skillReviewComponent);
    await this.clickOn(skillReviewComponent);
    await this.expectElementToBeVisible(skillReviewComponentModal);
  }

  /**
   * Function to check that the concept card is successfully inserted.
   * @param {string} question - The question of the WorkedExample.
   * @param {string} answer -  The answer of the WorkedExample.
   */
  async checkConceptCardWithWorkedExampleIsInserted(
    question: string,
    answer: string
  ): Promise<void> {
    try {
      const isQuestionPresent = this.isTextPresentOnPage(question);
      if (!isQuestionPresent) {
        throw new Error(
          'Expected Concept Card to contain WorkedExample question, but it was not found.'
        );
      }
      const isAnswerPresent = this.isTextPresentOnPage(answer);
      if (!isAnswerPresent) {
        throw new Error(
          'Expected Concept Card to contain WorkedExample answer, but it was not found.'
        );
      }
    } catch (error) {
      const newError = new Error(
        `Failed to verify concept card with WorkedExample: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Function to add an interaction to the exploration.
   * @param {string} interactionToAdd - The interaction type to add to the Exploration.
   * Note: A space is added before and after the interaction name to match the format in the UI.
   */
  async addInteraction(interactionToAdd: string): Promise<void> {
    await this.page.waitForSelector(addInteractionButton, {
      visible: true,
    });
    await this.clickOn(addInteractionButton);
    await this.clickOn(` ${interactionToAdd} `);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage(`${interactionToAdd} interaction has been added successfully.`);
  }

  /**
   * Function to create an exploration with a content and interaction.
   * This is a composite function that can be used when a straightforward, simple exploration setup is required.
   *
   * @param content - content of the exploration
   * @param interaction - the interaction to be added to the exploration
   */
  async createMinimalExploration(
    content: string,
    interaction: string
  ): Promise<void> {
    await this.updateCardContent(content);
    await this.addInteraction(interaction);
    showMessage('A simple exploration is created.');
  }

  /**
   * Function to save an exploration draft.
   * @param {string} commitMessage - The commit message to be used for the commit.
   */
  async saveExplorationDraft(
    commitMessage: string = 'Testing Testing'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarOptions);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to save changes appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.clickOn(mobileOptionsButton);
      }
      await this.page.waitForSelector(
        `${mobileSaveChangesButton}:not([disabled])`,
        {visible: true}
      );
      await this.clickOn(mobileSaveChangesButton);
    } else {
      await this.clickOn(saveChangesButton);
    }
    await this.clickOn(commitMessageSelector);
    await this.type(commitMessageSelector, commitMessage);
    await this.clickOn(saveDraftButton);
    await this.page.waitForSelector(saveDraftButton, {hidden: true});

    // Toast message confirms that the draft has been saved.
    await this.page.waitForSelector(toastMessage, {
      visible: true,
    });
    await this.page.waitForSelector(toastMessage, {
      hidden: true,
    });
    showMessage('Exploration is saved successfully.');
    await this.waitForPageToFullyLoad();
  }

  /**
   * Function to publish exploration.
   * This is a composite function that can be used when a straightforward, simple exploration published is required.
   * @param {string} title - The title of the exploration.
   * @param {string} goal - The goal of the exploration.
   * @param {string} category - The category of the exploration.,
   * @param {string} tags - The tags of the exploration.
   */
  async publishExplorationWithMetadata(
    title: string,
    goal: string,
    category: string,
    tags?: string
  ): Promise<string> {
    const fillExplorationMetadataDetails = async () => {
      await this.clickOn(explorationTitleInput);
      await this.type(explorationTitleInput, `${title}`);
      await this.clickOn(explorationGoalInput);
      await this.type(explorationGoalInput, `${goal}`);
      await this.clickOn(explorationCategoryDropdown);
      await this.clickOn(`${category}`);
      if (tags) {
        await this.type(tagsField, tags);
      }
    };
    const publishExploration = async () => {
      if (this.isViewportAtMobileWidth()) {
        await this.waitForPageToFullyLoad();
        const element = await this.page.$(mobileNavbarOptions);
        // If the element is not present, it means the mobile navigation bar is not expanded.
        // The option to save changes appears only in the mobile view after clicking on the mobile options button,
        // which expands the mobile navigation bar.
        if (!element) {
          await this.clickOn(mobileOptionsButton);
        }
        await this.clickOn(mobileChangesDropdown);
        await this.clickOn(mobilePublishButton);
      } else {
        await this.page.waitForSelector(publishExplorationButton, {
          visible: true,
        });
        await this.clickOn(publishExplorationButton);
      }
    };
    const confirmPublish = async () => {
      await this.clickOn(saveExplorationChangesButton);
      await this.waitForPageToFullyLoad();
      await this.page.waitForSelector(explorationConfirmPublishButton, {
        visible: true,
      });
      await this.clickOn(explorationConfirmPublishButton);
      await this.page.waitForSelector(explorationIdElement);
      const explorationIdUrl = await this.page.$eval(
        explorationIdElement,
        element => (element as HTMLElement).innerText
      );
      const explorationId = explorationIdUrl.replace(/^.*\/explore\//, '');
      await this.waitUntilClickFunctionIsAttached(closePublishedPopUpButton);
      await this.clickOn(closePublishedPopUpButton);

      await this.page.waitForSelector(closePublishedPopUpButton, {
        hidden: true,
      });
      return explorationId;
    };

    await publishExploration();
    await fillExplorationMetadataDetails();
    try {
      return await confirmPublish();
    } catch (error) {
      await this.waitForPageToFullyLoad();

      const errorSavingExplorationElement = await this.page.$(
        errorSavingExplorationModal
      );
      if (errorSavingExplorationElement) {
        await this.clickOn(errorSavingExplorationModal);
        await this.page.waitForNavigation({
          waitUntil: ['load', 'networkidle0'],
        });
      }
      await publishExploration();
      return await confirmPublish();
    }
  }

  /**
   * Function for creating an exploration with only EndExploration interaction with given title.
   */
  async createAndPublishAMinimalExplorationWithTitle(
    title: string,
    category: string = 'Algebra'
  ): Promise<string | null> {
    await this.navigateToCreatorDashboardPage();
    await this.navigateToExplorationEditorPageFromCreatorDashboard();
    await this.dismissWelcomeModal();
    await this.createMinimalExploration(
      'Exploration intro text',
      'End Exploration'
    );
    await this.saveExplorationDraft();
    return await this.publishExplorationWithMetadata(
      title,
      'This is Goal here.',
      category
    );
  }

  /**
   * Opens an exploration in the editor.
   * @param {string} explorationName - The name of the exploration.
   */
  async openExplorationInExplorationEditor(
    explorationName: string
  ): Promise<void> {
    await this.page.waitForSelector(explorationSummaryTileTitleSelector, {
      visible: true,
    });
    const title = await this.page.$eval(
      explorationSummaryTileTitleSelector,
      el => el.textContent?.trim()
    );

    if (title === explorationName) {
      const explorationTileElement = await this.page.$(
        explorationSummaryTileTitleSelector
      );
      await explorationTileElement?.click();
    } else {
      throw new Error(`Exploration not found: ${explorationName}`);
    }

    await this.waitForNetworkIdle();
    await this.waitForPageToFullyLoad();

    if (!this.page.url().includes('/create/')) {
      throw new Error(
        'Navigation to exploration editor from creator dashboard failed.'
      );
    }
  }

  /**
   * Function to click on the add goals button in the redesigned learner dashboard.
   */
  async clickOnAddGoalsButtonInRedesignedLearnerDashboard(): Promise<void> {
    await this.page.waitForSelector(
      addGoalsButtonInRedesignedLearnerDashboard,
      {
        visible: true,
      }
    );
    await this.clickOn(addGoalsButtonInRedesignedLearnerDashboard);

    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(newGoalsListInRedesignedLearnerDashboard, {
      visible: true,
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
          (element: Element, checked: boolean) => {
            const inputElement = (element as HTMLInputElement).querySelector(
              'input'
            );
            return inputElement?.checked === checked;
          },
          {},
          goalCheckbox,
          checked
        );
        break;
      }
    }
  }

  /**
   * Function to submit a goal in the redesigned learner dashboard.
   */
  async submitGoalInRedesignedLearnerDashboard(): Promise<void> {
    await this.waitForElementToBeClickable(addNewGoalButtonSelector);
    await this.page.click(addNewGoalButtonSelector);

    await this.page.waitForSelector(newGoalsListInRedesignedLearnerDashboard, {
      visible: false,
    });
  }

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

  async removeGoalInRedesignedLearnerDashboard(goal: string): Promise<void> {
    await this.page.waitForSelector(addGoalsButtonInRedesignedLearnerDashboard);
    await this.clickOn(addGoalsButtonInRedesignedLearnerDashboard);

    const newGoalsCheckboxes = await this.page.$$(
      goalCheckboxInRedesignedLearnerDashboard
    );

    for (const checkbox of newGoalsCheckboxes) {
      const checkboxText = await checkbox.evaluate(el =>
        el.textContent?.trim()
      );

      const checked = await checkbox.$eval(
        'input',
        el => (el as HTMLInputElement).checked
      );

      if (!checked) {
        showMessage(`Skipped: Remove ${goal} from goals.`);
        break;
      }

      if (checkboxText === goal) {
        const goalLabel = await checkbox.$('label');
        await goalLabel?.click();
        break;
      }
    }

    await this.waitForElementToBeClickable(addNewGoalButtonSelector);
    await this.page.click(addNewGoalButtonSelector);
    await this.clickOn('Remove');

    await this.expectElementToBeVisible(removeModalContainerSelector, false);
  }

  /**
   * Gives feedback on the current page.
   * @param {string} feedback - The feedback text to submit.
   * @param {boolean} stayAnonymous - Whether to submit the feedback anonymously.
   */
  async giveFeedback(feedback: string, stayAnonymous: boolean): Promise<void> {
    await this.page.waitForSelector(feedbackTextareaSelector);
    await this.type(feedbackTextareaSelector, feedback);
    if (stayAnonymous) {
      await this.clickOn(anonymousCheckboxSelector);
    }
    await this.clickOn(submitButtonSelector);

    await this.page.waitForSelector(feedbackTextareaSelector, {
      hidden: true,
    });
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
          hidden: true,
        });
        return;
      }
    }

    throw new Error(`Goal not found: ${goal}`);
  }

  /**
   * Function to resume a lesson from the learner dashboard.
   * @param {string} lessonTitle - The title of the lesson.
   * @param {string} progress - The progress of the lesson.
   */
  async resumeLessonFromLearnerDashboard(lessonTitle: string): Promise<void> {
    await this.page.waitForSelector(lessonCardContainer, {
      visible: true,
    });

    const lessonCards = await this.page.$$(lessonCardContainer);

    for (const lessonCard of lessonCards) {
      const lessonTitleText = await lessonCard.$eval(
        lessonTitleSelector,
        el => el.textContent
      );

      if (!lessonTitleText || lessonTitleText !== lessonTitle) {
        continue;
      }

      const resumeLessonButton = await lessonCard.$(resumeLessonButtonSelector);
      await resumeLessonButton?.click();

      await this.page.waitForSelector(resumeLessonButtonSelector, {
        hidden: true,
      });
      return;
    }
    throw new Error(`Lesson not found: ${lessonTitle}`);
  }

  /**
   * Checks if Learner is on the learner dashboard page.
   */
  expectToBeOnLearnerDashboardPage(): void {
    expect(this.page.url()).toBe(`${baseUrl}/learner-dashboard`);
  }

  /**
   * Checks if greeting has name of the user
   */
  async expectGreetingToHaveNameOfUser(userName: string): Promise<void> {
    const greetingElement = await this.page.$(greetingSelector);
    const greetingText = await this.page.evaluate(
      el => el.textContent,
      greetingElement
    );
    expect(greetingText).toContain(userName);
  }

  /**
   * Checks if the suggestion container in Learner Dashboard is empty.
   */
  async expectLearnSomethingNewInLDToBeEmpty(): Promise<void> {
    await this.expectElementToBeVisible(emptySuggestionSectionSelector);
  }

  /**
   * Checks if the continue from where you left off section in Learner Dashboard is present.
   * @param {boolean} visible - Whether the section should be visible or not.
   */
  async expectContinueWhereYouLeftOffSectionInLDToBePresent(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(
      continueFromWhereLeftOffSectionSelector
    );
  }

  /**
   * Function to verify the goals section contains the expected heading.
   * @param {string} heading - The heading to check for.
   */
  async expectGoalsSectionToContainHeadings(
    expectedHeadings: string[]
  ): Promise<void> {
    await this.page.waitForSelector(goalsStatusTitleSelector);
    const headings: (string | null)[] = await this.page.$$eval(
      goalsStatusTitleSelector,
      headings => headings.map(heading => heading.textContent)
    );

    expect(headings).toContain(expectedHeadings);
  }

  /**
   * Function to verify the current goals section is empty or not.
   * @param {boolean} empty - Whether the section should be empty or not.
   */
  async expectCurrentGoalsSectionToBeEmpty(
    empty: boolean = true
  ): Promise<void> {
    if (empty) {
      await this.page.waitForSelector(emptyCurrentGoalsSectionSelector, {
        visible: true,
      });
    } else {
      await this.page.waitForSelector(nonEmptyCurrentGoalsSectionSelector, {
        visible: true,
      });
    }
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
   * Check if the given topic is in the current goals section.
   * @param {string} topicName - The name of the topic to check.
   */
  async expectCurrentGoalsToInclude(topicName: string): Promise<void> {
    await this.page.waitForSelector(nonEmptyCurrentGoalsSectionSelector);

    const topicsInCurrentGoals = await this.page.$$eval(
      topicInCurrentGoalsSelector,
      (elements: Element[]) => elements.map(el => el.textContent)
    );

    expect(topicsInCurrentGoals).toContain(topicName);
  }

  /**
   * Check if the given section heading is in the home tab section.
   * @param {string[]} expectedHeading - The expected heading to check.
   */
  async expectSectinoHeadingInLDToContain(
    expectedHeading: string[]
  ): Promise<void> {
    await this.page.waitForSelector(homeTabSectionInLearnerDashboard);

    const headings = await this.page.$$eval(
      hometabSectionHeadingSelector,
      (elements: Element[]) => elements.map(el => el.textContent)
    );

    expect(headings).toContain(expectedHeading);
  }

  /**
   * Checks if the continue where you left off section is present or not.
   * @param {boolean} empty - Boolean value representing should be visible or not.
   */
  async expectSuggestedForYouSectionToBeEmpty(
    empty: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(
      emptySuggestedForYouSectionSelector,
      empty
    );
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
   * Function to verify the heading of the goals section in the learner dashboard.
   * @param {string} heading - The heading to check for.
   * @param {boolean} visible - Whether the heading should be visible or not.
   */
  async expectRedesignedGoalsSectionToContainHeading(
    heading: string,
    visible: boolean = true
  ): Promise<void> {
    await this.page.waitForFunction(
      (selector: string, heading: string, visible: boolean) => {
        const headingElements = document.querySelectorAll(selector);
        const headings = Array.from(headingElements).map(heading =>
          heading.textContent?.trim()
        );
        return headings.includes(heading) === visible;
      },
      {},
      goalsHeadingInRedesignedDashbaordSelector,
      heading,
      visible
    );
  }

  /**
   * Function to verify the lesson card is present in the page.
   * @param {string} lessonTitle - The title of the lesson card.
   * @param {puppeteer.ElementHandle<Element> | puppeteer.Page} context - The context of the page.
   */
  async expectLessonCardToBePresent(
    lessonTitle: string,
    context: puppeteer.ElementHandle<Element> | puppeteer.Page = this.page
  ): Promise<void> {
    const lessonCards = await context.$$(lessonCardContainer);
    const lessonCardTitles = await Promise.all(
      lessonCards.map(card =>
        card.$eval(lessonTitleSelector, el => el.textContent?.trim())
      )
    );
    expect(lessonCardTitles).toContain(lessonTitle);
  }

  /**
   * Function to verify the lesson cards in the continue where you left off section.
   * @param {string[]} lessonTitles - The titles of the lesson cards to check.
   */
  async expectContinueWhereYouLeftOffSectionToContainLessonCards(
    lessonTitles: string[]
  ): Promise<void> {
    await this.page.waitForSelector(
      continueFromWhereLeftOffSectionInRedesignedDashboardSelector
    );

    const context = await this.page.$(
      continueFromWhereLeftOffSectionInRedesignedDashboardSelector
    );

    if (!context) {
      throw new Error('Continue Where You Left Off Section not found.');
    }

    for (const lessonTitle of lessonTitles) {
      await this.expectLessonCardToBePresent(lessonTitle, context);
    }
  }

  /**
   * Function to verify the lesson cards in the incomplete lessons section.
   * @param {string[]} lessonTitles - The titles of the lesson cards to check.
   */
  async expectCompletedLessonsSectionToContainLessonCards(
    lessonTitles: string[]
  ): Promise<void> {
    await this.page.waitForSelector(completedLessonsSectionSelector);

    const context = await this.page.$(completedLessonsSectionSelector);

    if (!context) {
      throw new Error('Completed Lessons Section not found.');
    }

    for (const lessonTitle of lessonTitles) {
      await this.expectLessonCardToBePresent(lessonTitle, context);
    }
  }

  /**
   * Function to verify the goal in the given context.
   * @param {string} goal - The goal to check for.
   * @param {puppeteer.ElementHandle<Element> | puppeteer.Page} context - The context of the page.
   */
  async expectGoalToBePresent(
    goal: string,
    context: puppeteer.ElementHandle<Element> | puppeteer.Page
  ): Promise<void> {
    await context.waitForSelector(goalContainerSelector, {
      visible: true,
    });

    const goalTitles = await context.$$eval(goalTitleSelector, elements =>
      elements.map(el => el.textContent?.trim())
    );

    expect(goalTitles).toContain(goal);
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
      visible: true,
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
   * Function to verify the goal in the completed goals section in the
   * redesigned learner dashboard.
   * @param {string} goal - The goal to check for.
   */
  async expectCompletedGoalsSectionInRedesignedDashboardToContain(
    goal: string
  ): Promise<void> {
    await this.page.waitForSelector(completedGoalsContainerSelector, {
      visible: true,
    });
    const completedGoalsSection = await this.page.$(
      completedGoalsContainerSelector
    );
    if (!completedGoalsSection) {
      throw new Error('Completed goals section not found.');
    }
    await this.expectGoalToBePresent(goal, completedGoalsSection);
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
   * Function to verify the progress of a lesson in the redesigned learner dashboard.
   * @param {string} lessonTitle - The title of the lesson.
   * @param {string} progress - The progress of the lesson.
   */
  async expectLessonProgressInRedesignedDashboardToBe(
    lessonTitle: string,
    progress: string
  ): Promise<void> {
    await this.page.waitForSelector(lessonCardContainer);
    const lessonCards = await this.page.$$(lessonCardContainer);

    for (const lessonCard of lessonCards) {
      const lessonTitleText = await lessonCard.$eval(
        lessonTitleSelector,
        el => el.textContent
      );

      if (!lessonTitleText || lessonTitleText !== lessonTitle) {
        continue;
      }

      const currentProgress = await lessonCard.$eval(
        circleProgressElementSelector,
        el => el.textContent
      );
      expect(currentProgress).toBe(progress.toString());
      return;
    }
    throw new Error(`Lesson not found: ${lessonTitle}`);
  }

  /**
   * Function to verify if the learner dashboard is opened using URL.
   */
  async expectToBeOnLearnerDashboard(): Promise<void> {
    await this.page.waitForFunction(
      (url: string) => {
        return document.URL.includes(url);
      },
      {},
      testConstants.URLs.LearnerDashboard
    );
  }

  /**
   * Checks if navbar in mobile and desktop view open properly.
   */
  async expectNavbarToWorkProperly(): Promise<void> {
    // Mobile view port.
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarOpenSidebarButton);
      // Learn Dropdown.
      await this.isElementVisible(mobileLearnDropdownSelector);
      await this.isElementVisible(mobileLearnSubMenuSelector);
      await this.clickOn(mobileLearnDropdownSelector);
      await this.isElementVisible(mobileLearnSubMenuSelector, false);
      await this.clickOn(mobileLearnDropdownSelector);

      // About Dropdown.
      await this.isElementVisible(mobileAboutMenuDropdownSelector);
      await this.isElementVisible(mobileAboutPageButtonSelector, false);
      await this.clickOn(mobileAboutMenuDropdownSelector);
      await this.isElementVisible(mobileAboutPageButtonSelector);
      await this.clickOn(mobileAboutMenuDropdownSelector);

      // Get Involved Dropdown.
      await this.isElementVisible(mobileGetInvolvedDropdownSelector);
      await this.isElementVisible(
        mobileGetInvolvedMenuContainerSelector,
        false
      );
      await this.clickOn(mobileGetInvolvedDropdownSelector);
      await this.isElementVisible(mobileGetInvolvedMenuContainerSelector);
      await this.clickOn(mobileGetInvolvedDropdownSelector);

      // Close Navmenu.
      await this.clickOn(mobileNavbarOpenSidebarButton);
    }
    // Desktop view port.
    else {
      await this.clickOn(navbarLearnTab);
      await this.isElementVisible(navbarLearnDropdownContainerSelector);

      await this.clickOn(navbarAboutTab);
      await this.isElementVisible(navbarAboutDropdownConatinaerSelector);

      await this.clickOn(navbarGetInvolvedTab);
      await this.isElementVisible(navbarGetInvolvedDropdownContainerSelector);
    }
  }

  /**
   * Checks if the username matches the expected username.
   * @param expectedUsername - The expected username.
   */
  async expectUsernameToBe(expectedUsername: string): Promise<void> {
    await this.expectTextContentToBe(usernameSelector, expectedUsername);
  }
}

export let LoggedInUserFactory = (): LoggedInUser => new LoggedInUser();
