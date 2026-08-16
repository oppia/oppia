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
const baseUrl = testConstants.URLs.BaseURL;
const classroomsPageUrl = testConstants.URLs.ClassroomsPage;
const communityLibraryUrl = testConstants.URLs.CommunityLibrary;
const homeUrl = testConstants.URLs.Home;
const splashPageUrl = testConstants.URLs.splash;

const LABEL_FOR_SUBMIT_BUTTON = 'Submit and start contributing';
const signUpUsernameInputField = 'input.e2e-test-username-input';

const mobileNavbarButtonSelector = '.text-uppercase';
const navbarLearnTab = 'a.e2e-test-navbar-learn-menu';
const languageDropdown = '.e2e-test-language-dropdown';
const navbarAboutTab = 'a.e2e-test-navbar-about-menu';
const navbarAboutTabAboutButton = 'a.e2e-test-about-link';
const embedCodeSelector = '.oppia-embed-modal-code';
const embedLessonButton = '.e2e-test-embed-link';
const closeButtonSelector = '.e2e-test-close-button';
const closeLessonInfoButton = '.e2e-test-close-lesson-info-modal-button';
const createAccountButton = '.create-account-btn';
const validityInfoTextSelector = '.guide-text';

const languageFilterDropdownToggler =
  '.oppia-search-bar-dropdown-toggle-button';
const unselectedFilterOptionsSelector = '.e2e-test-deselected';
const selectedFilterOptionsSelector = '.e2e-test-selected';
const explorationTitleSelector = '.e2e-test-exp-summary-tile-title';
const lessonInfoTextSelector = '.e2e-test-lesson-info-header';
const previousCardButton = '.e2e-test-back-button';
const lessonLanguageSelector = '.oppia-content-language-selector';
const lessonInfoModalHeaderSelector = '.e2e-test-lesson-info-modal-header';
const saveProgressButton = '.save-progress-btn';
const saveProgressBtnTooltipSelector = '.save-progress-btn-tooltip';
const signInBoxInSaveProressModalSelector = '.sign-in-box';
const signInButton = '.conversation-skin-login-button-text';
const singInButtonInProgressModal = '.sign-in-link';
const profilePictureSelector = '.e2e-test-profile-dropdown';
const feedbackSelector = '.e2e-test-conversation-feedback-latest';
const generateAttributionSelector = '.e2e-test-generate-attribution';
const attributionHtmlSectionSelector = '.attribution-html-section';
const attributionHtmlCodeSelector = '.attribution-html-code';
const attributionPrintTextSelector = '.attribution-print-text';
const closeAttributionModalButton = '.attribution-modal button';
const shareExplorationButtonSelector = '.e2e-test-share-exploration-button';
const lessonCardSelector = '.e2e-test-exploration-dashboard-card';
const explorationRatingSelector = '.e2e-test-exp-summary-tile-rating';
const explorationViewsSelector = '.e2e-test-exp-summary-tile-views';
const progressBarSelector = '.oppia-progress-bar';
const rateOptionsSelector = '.conversation-skin-final-ratings';
const suggestionSection = '.suggested-for-you-section';

const errorPageHeading = '.e2e-test-error-page-heading';
const copyProgressUrlButton = '.oppia-uid-copy-btn';

const conceptCardLinkSelector = '.e2e-test-concept-card-link';
const conceptCardViewerSelector = '.e2e-test-concept-card-viewer';
const conceptCardCloseButtonSelector = '.e2e-test-close-concept-card';
const nonInteractiveTabsHeaderSelector =
  '.e2e-test-non-interactive-tabs-headers';

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
const fractionInputSelector = '.e2e-test-fraction-input';
const floatFormInput = '.e2e-test-float-form-input';
const wrongInputErrorContainerSelector = '.oppia-form-error-container';

const resumeExplorationButton = '.resume-button';
const restartExplorationButton = '.restart-button';
const submitAnswerButton = '.e2e-test-submit-answer-button';
const submitResponseToInteractionInput = 'oppia-interaction-display input';
const submitResponseToInteractionTextArea =
  'oppia-interaction-display textarea';

const previousConversationToggleSelector = '.e2e-test-previous-responses-text';
const formErrorContainer = '.e2e-test-form-error-container';
const checkpointModalSelector = '.lesson-info-tooltip-add-ons';
const closeLessonInfoTooltipSelector = '.e2e-test-close-lesson-info-tooltip';
const progressRemainderModalSelector = '.oppia-progress-reminder-modal';
const progressReminderModalHeaderSelector =
  '.e2e-test-progress-reminder-continue-text';
const lessonInfoSignUpButtonSelector = '.e2e-test-sign-up-button';

const communityLibraryLinkInNavbarSelector =
  '.e2e-test-topnb-go-to-community-library-link';
const communityLibraryContainerSelector = '.e2e-test-library-container';
const communityLibraryLinkInNavMenuSelector = '.e2e-mobile-test-library-link';
const youtubePlayerSelector = '.e2e-test-youtube-player iframe';
const collapsibleRTEHeaderSelector = '.e2e-test-collapsible-heading';
const collapsibleRTEContentSelector = '.e2e-test-collapsible-content';

const returnToLibraryButtonSelector = '.e2e-test-exploration-return-to-library';
const backToClassroomBreadcrumbSelectorMobile =
  '.e2e-test-mobile-breadcrumbs-classroom';
const backToClassroomLinkSelector = '.e2e-test-classroom-name';

const lessonInfoButton = '.oppia-lesson-info';
const lessonInfoCardSelector = '.oppia-lesson-info-card';
const hintButtonSelector = '.e2e-test-view-hint';
const gotItButtonSelector = '.e2e-test-learner-got-it-button';
const closeSolutionModalButton = '.e2e-test-learner-got-it-button';
const continueToSolutionButton = '.e2e-test-continue-to-solution-btn';
const viewSolutionButton = '.e2e-test-view-solution';
const feedbackPopupSelector = '.e2e-test-exploration-feedback-popup-link';
const feedbackTextarea = '.e2e-test-exploration-feedback-textarea';
const feedbackSubmissionPopupSelector = '.oppia-feedback-popup-container';
const stayAnonymousCheckbox = '.e2e-test-stay-anonymous-checkbox';

const contributorIconInLessonInfoSelctor =
  '.e2e-test-lesson-info-contributor-profile';
const profileContainerSelector = '.e2e-test-profile-container';
const desktopStoryTitleSelector = '.e2e-test-story-title-in-topic-page';
const mobileStoryTitleSelector = '.e2e-test-mobile-story-title';
const chapterTitleSelector = '.e2e-test-chapter-title';
const loginPromptContainer = '.story-viewer-login-container';
const topicNameSelector = '.e2e-test-topic-name';
const topicViewerContainerSelector = '.e2e-test-topic-viewer-container';

const audioForwardButtonSelector = '.e2e-test-audio-forward-button';
const audioBackwardButtonSelector = '.e2e-test-audio-backward-button';
const audioExpandButtonInLPSelector = '.e2e-test-lp-audio-expand-button';
const audioSliderSelector = 'oppia-audio-slider mat-slider';
const playVoiceoverButton = '.e2e-test-play-circle';
const voiceoverDropdown = '.e2e-test-audio-bar';
const pauseVoiceoverButton = '.e2e-test-pause-circle';

// Classroom Page.
const classroomContentHeadingSelector = '.e2e-test-classroom-content-heading';
const diagnosticTestPlayerSelector = 'oppia-diagnostic-test-player';
const diagnosticTestBoxSelector = '.e2e-test-diagnostic-test-box';
const diagnosticTestHeadingSelector = `${diagnosticTestBoxSelector} h4`;
const diagnosticTestButtonSelector = `${diagnosticTestBoxSelector} a`;
const takeQuizButtonSelector = '.e2e-test-take-diagnostic-test';
const startHereButtonSelector = '.e2e-test-start-here-button';
const startDiagnosticTestButtonSelector = '.e2e-test-start-diagnostic-test';
const skipQuestionButton = '.e2e-test-skip-question-button';
const currentProgessSelector = '.e2e-test-progress-container';

// Common Selectors.
const contributorsContainerSelector = '.e2e-test-contributors-container';
const contributorIconPrefix = `${contributorsContainerSelector} .contributor-`;
const devModeLabelSelector = '.e2e-test-dev-mode';
const lastUpdatedInfoSelector = '.e2e-test-info-card-last-updated';
const storyViewerContainerSelector = '.e2e-test-story-viewer-container';
const storyTitleSelector = '.e2e-test-story-title';
const ratingContainerSelector = '.e2e-test-info-card-rating span:nth-child(2)';
const recommendedNextChapterSelector =
  '.e2e-test-recommended-next-chapter-button';
const returnToStoryFromLastStateSelector =
  '.e2e-test-end-chapter-return-to-story';
const tagsContainerSelector = '.exploration-tags span';
const saveProgressCloseButtonSelector = '.e2e-test-save-progress-close-button';

// Community Library.
const communityLibraryHeading = '.e2e-test-library-main-header';
const communityLibraryGroupHeader = '.e2e-test-library-group-header';
const categoryFilterDropdownToggler = '.e2e-test-search-bar-dropdown-toggle';

// Home Page Selectors.
const homePageHeadingSelector =
  '.e2e-test-splash-page .e2e-test-home-page-title';
const browseLessonButtonSelector =
  '.e2e-test-splash-page .e2e-test-explore-lessons-btn';

// Topic page.
const lessonsTabButtonSelector = '.e2e-test-lesson-tab-link';
const lessonsTabContainerSelector = '.e2e-test-lessons-tab-container';
const practiceTabButtonSelector = '.e2e-test-practice-tab-link';
const practiceTabContainerSelector = '.e2e-test-practice-tab-container';
const practiceTabLink = '.e2e-test-practice-tab-link';
const practiceContainer = '.e2e-test-practice-tab-container';
const practiceQuestionHeaderSelector = '.e2e-test-practice-question-header';
const practiceSessionContainerSelector = 'practice-session-page';
const startPracticeButtonSelector = '.e2e-test-practice-start-button';
const subtopicListItemInPracticeTabSelector = '.e2e-test-subtopic-item';
const tabTitleInTopicPageSelector = '.e2e-test-topic-page-tab-title';
const revisionTabButtonSelector = '.e2e-test-study-tab-link';
const revisionTabSelector = 'subtopics-list';

export class LoggedOutUser extends BaseUser {
  /**
   * Changes the language of the lesson.
   * @param {string} languageCode - The code of the language to change to.
   */
  async changeLessonLanguage(languageCode: string): Promise<void> {
    await this.expectElementToBeVisible(lessonLanguageSelector);
    await this.select(lessonLanguageSelector, languageCode);
    await this.waitForNetworkIdle();
    await this.waitForPageToFullyLoad();

    // Post check: check if value has changed to new code.
    const selectedLanguageCode = await this.page.$eval(
      lessonLanguageSelector,
      el => (el as HTMLSelectElement).value
    );
    if (selectedLanguageCode !== languageCode) {
      throw new Error(
        `Expected language code to be ${languageCode}, but found ${selectedLanguageCode}`
      );
    }
  }

  /**
   * Clears all text from the username input field.
   */
  async clearUsernameInput(): Promise<void> {
    await this.clearAllTextFrom(signUpUsernameInputField);
  }

  /**
   * Function to click the Browse Lessons button on the home page.
   */
  async clickBrowseLessonsButtonInHomePage(): Promise<void> {
    await this.clickOnElementWithSelector(browseLessonButtonSelector);
    showMessage('Clicked on browse lessons button.');

    await this.expectElementToBeVisible(browseLessonButtonSelector, false);
  }

  /**
   * Click on create account button in save progress modal
   */
  async clickOnCreateAccountButtonInSaveProgressModal(): Promise<void> {
    await this.expectElementToBeVisible(lessonInfoSignUpButtonSelector);
    await this.waitForElementToStabilize(lessonInfoSignUpButtonSelector);
    await this.clickOnElementWithSelector(lessonInfoSignUpButtonSelector);

    await this.expectElementToBeVisible(lessonInfoSignUpButtonSelector, false);
  }

  /**
   * Clicks on first contributor in Lesson Info model.
   */
  async clickOnProfileIconInLessonInfoModel(): Promise<void> {
    await this.expectElementToBeVisible(contributorIconInLessonInfoSelctor);
    await this.waitForElementToStabilize(contributorIconInLessonInfoSelctor);
    await this.clickOnElementWithSelector(contributorIconInLessonInfoSelctor);
    await this.expectElementToBeVisible(profileContainerSelector);

    expect(this.page.url()).toContain('/profile');
  }

  /**
   * Function to change the site language to the given language code.
   * @param {string} langCode - The language code to change the site language to. Example: 'pt-br', 'en'
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
    const languageDropdownElement =
      await this.expectElementToBeVisible(languageDropdown);
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
    await this.reloadPage();

    await this.page.waitForFunction(
      ({selector, textContent}: {selector: string; textContent: string}) => {
        const element = document.querySelector(selector);
        return element && element.textContent !== textContent;
      },
      {selector: languageOption, textContent: initialLanguage}
    );
  }

  /**
   * Changes the site language for an embedded exploration without reloading
   * the page, since reloading resets the language in the embedded player.
   * @param {string} langCode - The language code to change to. Example: 'es', 'pt-br'
   */
  async changeSiteLanguageForEmbeddedExploration(
    langCode: string
  ): Promise<void> {
    const languageOption = `.e2e-test-i18n-language-${langCode} a`;

    if (this.isViewportAtMobileWidth()) {
      await this.page.evaluate(() => {
        window.scrollTo(0, 0);
      });
    }
    const languageDropdownElement =
      await this.expectElementToBeVisible(languageDropdown);
    if (!languageDropdownElement) {
      throw new Error('Language dropdown element not found');
    }
    await this.clickOnElement(languageDropdownElement);
    await this.clickOnElementWithSelector(languageOption);
    await this.waitForNetworkIdle();
    await this.waitForPageToFullyLoad();
  }

  /**
   * Checks if the progress URL validity info matches the expected text. (To be used when save progress modal is opened.)
   * @param {string} expectedText - The expected validity info text.
   */
  async checkProgressUrlValidityInfo(expectedText: string): Promise<void> {
    await this.expectElementToBeVisible(validityInfoTextSelector);
    const validityInfoText = await this.getTextContent(
      validityInfoTextSelector
    );

    if (validityInfoText !== expectedText) {
      throw new Error(
        `Validity info text does not match expected text. Found: ${validityInfoText}, Expected: ${expectedText}`
      );
    }
  }

  /**
   * Chooses an action in the progress remainder.
   * @param {string} action - The action to choose. Can be 'Restart' or 'Resume'.
   */
  async chooseActionInProgressRemainder(
    action: 'Restart' | 'Resume'
  ): Promise<void> {
    await this.expectElementToBeVisible(progressRemainderModalSelector);
    await this.expectElementToBeVisible(restartExplorationButton);
    await this.expectElementToBeVisible(resumeExplorationButton);

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
      await this.expectElementToBeVisible(mobileNavbarButtonSelector);
      await this.openMobileSidebar();

      // Wait for Angular to be stable before clicking the expand button.
      await this.waitForAngularStability();

      await this.page
        .locator(mobileSidebarExpandAboutMenuButton)
        .dispatchEvent('click');

      // Wait for the About submenu to expand and the About button to be visible.
      await this.expectElementToBeVisible(mobileSidebarAboutButton);
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarAboutButton,
        aboutUrl
      );
    } else {
      await this.expectElementToBeVisible(navbarAboutTab);
      await this.clickOnElementWithSelector(navbarAboutTab);
      await this.clickButtonToNavigateToNewPage(
        navbarAboutTabAboutButton,
        aboutUrl
      );
    }
  }

  /**
   * Function to click a button and check if it opens the expected destination.
   * @param {string} button - The selector of the button to click.
   * @param {string} expectedDestinationPageUrl - The expected URL of the destination page after clicking the button.
   * @param {boolean} useSelector - Whether to use the selector for clicking (default: true). If false, the button is treated as an ElementHandle.
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
   * Clicks on the start here button in the classroom page.
   */
  async clickOnStartHereButtonInClassroomPage(): Promise<void> {
    await this.expectElementToBeVisible(startHereButtonSelector);

    await this.clickAndWaitForNavigation(startHereButtonSelector, true);
    await this.expectElementToBeVisible(startHereButtonSelector, false);
  }

  /**
   * Click on the submit answer button.
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
   * Clicks on the take quiz button in the classroom page.
   */
  async clickOnTakeQuizButtonInClassroomPage(): Promise<void> {
    await this.expectElementToBeVisible(takeQuizButtonSelector);

    await this.clickOnElementWithSelector(takeQuizButtonSelector);
    await this.expectElementToBeVisible(takeQuizButtonSelector, false);
  }

  /**
   * Function to close the attribution modal.
   */
  async closeAttributionModal(): Promise<void> {
    await this.expectElementToBeVisible(closeAttributionModalButton);
    await this.clickOnElementWithSelector(closeAttributionModalButton);
    showMessage('Attribution modal closed successfully');

    await this.expectElementToBeVisible(closeAttributionModalButton, false);
  }

  /**
   * Function to close the hint modal.
   */
  async closeHintModal(): Promise<void> {
    await this.expectElementToBeVisible(gotItButtonSelector);
    await this.clickOnElementWithSelector(gotItButtonSelector);
    await this.expectElementToBeVisible(gotItButtonSelector, false);
  }

  /**
   * Closes the lesson info modal.
   */
  async closeLessonInfoModal(): Promise<void> {
    await this.clickOnElementWithSelector(closeLessonInfoButton);
    await this.expectElementToBeVisible(lessonInfoCardSelector, false);
  }

  /**
   * Function to close the save progress menu.
   */
  async closeSaveProgressMenu(): Promise<void> {
    await this.clickOnElementWithSelector(saveProgressCloseButtonSelector);
    await this.expectElementToBeVisible(saveProgressCloseButtonSelector, false);
  }

  /**
   * Closes the solution modal by clicking on the close solution modal button.
   */
  async closeSolutionModal(): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(closeSolutionModalButton);
    await this.clickOnElementWithSelector(closeSolutionModalButton);
    await this.expectElementToBeVisible(closeSolutionModalButton, false);
  }

  /**
   * Function to navigate to the next card in the preview tab.
   */
  async continueToNextCard(): Promise<void> {
    const currentCardContentSelector = `${stateConversationContent} p`;
    await this.expectElementToBeVisible(currentCardContentSelector);
    const currentCardContent = await this.page.$eval(
      currentCardContentSelector,
      el => el.textContent
    );
    try {
      await this.expectElementToBeVisible(
        nextCardButton,
        true,
        this.page,
        7000
      );
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
   * Continue to next practice question
   */
  async continueToNextPracticeQuestion(): Promise<void> {
    const currentCardContentSelector = `${stateConversationContent} p`;
    await this.expectElementToBeVisible(currentCardContentSelector);

    const initialHeading = await this.page.$eval(
      practiceQuestionHeaderSelector,
      el => el?.textContent?.trim() ?? ''
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

    await this.page.waitForFunction(
      ({selector, heading}: {selector: string; heading: string}) => {
        const element = document.querySelector(selector);
        // In case of last question, the element should be hidden,
        // else it should have different heading.
        return !element || element.textContent?.trim() !== heading;
      },
      {selector: practiceQuestionHeaderSelector, heading: initialHeading},
      {timeout: 60000}
    );
  }

  /**
   * Clicks on the next recommended chapter button.
   */
  async continueToNextRecommendedLesson(): Promise<void> {
    await this.clickOnElementWithSelector(recommendedNextChapterSelector);
    await this.expectElementToBeVisible(recommendedNextChapterSelector, false);
  }

  /**
   * Copies the progress URL to the clipboard and returns the copied text. (To be used when save progress modal is opened.)
   */
  async copyProgressUrl(): Promise<string> {
    try {
      // OverridePermissions is used to allow clipboard access.
      await this.page
        .context()
        .grantPermissions(['clipboard-read', 'clipboard-write'], {
          origin: 'http://localhost:8181',
        });

      // Click on the copy button.
      await this.waitForPageToFullyLoad();
      await this.expectElementToBeVisible(copyProgressUrlButton);
      await this.clickOnElementWithSelector(copyProgressUrlButton);

      // Reading the clipboard data.
      const clipboardData = await this.page.evaluate(async () => {
        return await navigator.clipboard.readText();
      });

      if (!clipboardData) {
        throw new Error('Failed to copy the exploration URL.');
      }

      return clipboardData;
    } catch (error) {
      console.error('An error occurred:', error);
      throw error;
    }
  }

  /**
   * Expands the voiceover bar by clicking on the dropdown.
   */
  async expandVoiceoverBar(): Promise<void> {
    await this.expectElementToBeVisible(voiceoverDropdown);
    await this.clickOnElementWithSelector(voiceoverDropdown);
    await this.expectElementToBeVisible(voiceoverDropdown, false);
  }

  /**
   * Checks if value of input is equal to the given value.
   * @param {string} value - The value to check.
   */
  async expectAnswerInputValueToBe(value: string): Promise<void> {
    await this.expectElementValueToBe(floatFormInput, value);
  }

  /**
   * Checks if the HTML string is present in the HTML section.
   * @param {string} htmlString - The HTML string to check for.
   */
  async expectAttributionInHtmlSectionToBe(htmlString: string): Promise<void> {
    await this.expectElementToBeVisible(attributionHtmlCodeSelector);
    const attributionHtmlCode = await this.getTextContent(
      attributionHtmlCodeSelector
    );

    if (!attributionHtmlCode.includes(htmlString)) {
      throw new Error(
        `Expected HTML string "${htmlString}" not found in the HTML section. Actual HTML: "${attributionHtmlCode}"`
      );
    }
  }

  /**
   * Checks if the text string is present in the print text.
   * @param {string} textString - The text string to check for.
   */
  async expectAttributionInPrintToBe(textString: string): Promise<void> {
    await this.expectElementToBeVisible(attributionPrintTextSelector);

    const attributionPrintText = await this.getTextContent(
      attributionPrintTextSelector
    );

    if (!attributionPrintText.includes(textString)) {
      throw new Error(
        `Expected text string "${textString}" not found in the print text. Actual text: "${attributionPrintText}"`
      );
    }
  }

  /**
   * Checks if audio expand button is visible in lesson player and in exploration preview.
   */
  async expectAudioExpandButtonToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(audioExpandButtonInLPSelector);
    showMessage('Audio Expand button is visible in lesson player.');
  }

  /**
   * Checks if audio forward and backward buttons are visible in lesson player.
   */
  async expectAudioForwardBackwardButtonToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(audioBackwardButtonSelector);
    await this.expectElementToBeVisible(audioForwardButtonSelector);

    showMessage(
      'Audio forward and backward buttons are visible in lesson player.'
    );
  }

  /**
   * Checks if the current card's content matches the expected content.
   * @param {string} expectedCardContent - The expected content of the card.
   */
  async expectCardContentToMatch(expectedCardContent: string): Promise<void> {
    await this.waitForPageToFullyLoad();

    await this.expectElementToBeVisible(`${stateConversationContent} p`);
    const element = await this.page.$(`${stateConversationContent} p`);
    const cardContent = await this.page.evaluate(
      element => element?.textContent || '',
      element
    );
    expect(cardContent.trim()).toBe(expectedCardContent);
    showMessage('Card content is as expected.');
  }

  /**
   * Check if collapsible RTE element is present or not.
   * @param {string} header - The header of collapsible RTE element.
   * @param {string} content - The content collapsible RTE element should have.
   */
  async expectCollapsibleRTEToBePresent(
    header: string = 'Sample Header',
    content: string = 'You have opened the collapsible block.'
  ): Promise<void> {
    await this.expectElementToBeVisible(collapsibleRTEHeaderSelector);
    const collapsibleRTEHeader = await this.page.$(
      collapsibleRTEHeaderSelector
    );
    if (!collapsibleRTEHeader) {
      throw new Error('Collapsible RTE header not found.');
    }
    const collapsibleRTEHeaderText = await this.page.evaluate(
      element => element.textContent?.trim(),
      collapsibleRTEHeader
    );
    if (collapsibleRTEHeaderText !== header) {
      throw new Error(
        `Expected collapsible RTE header to be ${header}, but it was ${collapsibleRTEHeaderText}`
      );
    }

    await this.clickOnElementWithSelector(collapsibleRTEHeaderSelector);
    await this.expectElementToBeVisible(collapsibleRTEContentSelector);
    const collapsibleRTEContent = await this.page.$(
      collapsibleRTEContentSelector
    );
    const collapsibleRTEContentText = await this.page.evaluate(
      element => element?.textContent,
      collapsibleRTEContent
    );
    expect(collapsibleRTEContentText).toContain(content);
  }

  /**
   * Function to verify the community library group header is present.
   * @param {string[]} groupHeaders - The group headers to verify.
   */
  async expectCommunityLibraryGroupHeaderToContain(
    groupHeaders: string[]
  ): Promise<void> {
    await this.expectElementToBeVisible(communityLibraryGroupHeader);

    const communityLibraryGroupHeaderText = await this.page.$$eval(
      communityLibraryGroupHeader,
      el => el.map(el => el.textContent)
    );

    for (const groupHeader of groupHeaders) {
      if (
        communityLibraryGroupHeaderText?.some(el =>
          el?.trim().includes(groupHeader)
        ) === false
      ) {
        throw new Error(
          `Failed: Community library group header does not contain ${groupHeader}.\nActual: ${communityLibraryGroupHeaderText}`
        );
      }
      showMessage(
        `Success: Community library group header contains ${groupHeader}.`
      );
    }
  }

  /**
   * Function to verify the community library heading is present.
   * @param {string} heading - The heading to verify.
   */
  async expectCommunityLibraryHeadingToBePresent(
    heading: string
  ): Promise<void> {
    await this.expectElementToBeVisible(communityLibraryHeading);

    const communityLibraryHeadingText = await this.getTextContent(
      communityLibraryHeading
    );

    if (communityLibraryHeadingText?.trim() !== heading) {
      throw new Error(
        `Expected community library heading to be ${heading}, but found ${communityLibraryHeadingText}`
      );
    }

    showMessage(`Success: Community library heading is ${heading}.`);
  }

  /**
   * Checks if the concept card link in the lesson works properly.
   * @param {string} content - The expected content of the concept card.
   */
  async expectConceptCardLinkInLessonToWorkProperly(
    content: string
  ): Promise<void> {
    await this.expectElementToBeVisible(conceptCardLinkSelector);

    const conceptCard = await this.page.$(conceptCardLinkSelector);
    if (!conceptCard) {
      throw new Error('Concept card link not found.');
    }
    await this.waitForElementToStabilize(conceptCard);

    await this.clickOnElementWithSelector(conceptCardLinkSelector);
    await this.expectElementContentToContain(
      conceptCardViewerSelector,
      content
    );

    await this.waitForElementToStabilize(conceptCardCloseButtonSelector);
    await this.clickOnElementWithSelector(conceptCardCloseButtonSelector);
    await this.expectElementToBeVisible(conceptCardViewerSelector, false);
  }

  /**
   * Checks if "Continue" button is present in the lesson card.
   * @param {boolean} status - Boolean value representing that button should be present or not. Default is true (visible)
   */
  async expectContinueToNextCardButtonToBePresent(
    status: boolean = true
  ): Promise<void> {
    if (status) {
      await this.expectElementToBeVisible(nextCardButton);
      showMessage('Continue button is present.');
      return;
    } else {
      try {
        await this.expectElementToBeVisible(nextCardButton);
        throw new Error('Continue button is present, but it should not be.');
      } catch (error) {
        if (error instanceof Error && error.message.includes('Timeout')) {
          showMessage('Continue button is not present, as expected.');
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Verifies the contributor icon in the lesson info modal.
   * @param {string} contributorName - The name of the contributor.
   * @param {number} index - The 1-based index of the contributor.
   */
  async expectContributorsInLessonInfoModalToBe(
    contributorName: string,
    index: number
  ): Promise<void> {
    await this.expectElementToBeVisible(contributorsContainerSelector);
    await this.expectElementToBeVisible(`${contributorIconPrefix}${index - 1}`);

    const contributorIcon = await this.page.$(
      `${contributorIconPrefix}${index - 1}`
    );
    if (!contributorIcon) {
      throw new Error('Contributor icon not found');
    }

    const userNameInAltText = await contributorIcon.$eval('img', el =>
      el.getAttribute('alt')
    );

    expect(userNameInAltText).toBe(contributorName);
  }

  /**
   * Checks if the "Create Account" button is present in the save progress modal (which can be opened from the lesson info modal once first checkpoint is reached).
   */
  async expectCreateAccountToBePresent(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.expectElementToBeVisible(createAccountButton);
    showMessage('Create Account button is present.');
  }

  /**
   * Function to verify the dev mode label is visible or not.
   * @param {boolean} visible - Whether the dev mode label should be visible or not.
   */
  async expectDevModeLabelToBeVisible(visible: boolean = true): Promise<void> {
    try {
      await this.expectElementToBeVisible(devModeLabelSelector);

      if (visible) {
        showMessage('Verified: Dev mode label is visible.');
      } else {
        throw new Error('Dev mode label is visible.');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Timeout')) {
        if (visible) {
          throw new Error('Dev mode label is not visible.');
        } else {
          showMessage('Verified: Dev mode label is not visible.');
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Function to verify the diagnostic test box is present.
   * @param {string} expectedHeading - The expected heading of the diagnostic test box.
   * @param {string} expectedButtonText - The expected button text of the diagnostic test box.
   */
  async expectDiagnosticTestBoxToBePresent(
    expectedHeading: string,
    expectedButtonText: string
  ): Promise<void> {
    await this.expectElementToBeVisible(diagnosticTestBoxSelector);

    const headings = (
      await this.page.locator(diagnosticTestHeadingSelector).allTextContents()
    ).map(text => text.trim());
    expect(headings).toContain(expectedHeading);

    showMessage(`Success: Heading is ${expectedHeading}.`);

    const buttons = (
      await this.page.locator(diagnosticTestButtonSelector).allTextContents()
    ).map(text => text.trim());
    expect(buttons).toContain(expectedButtonText);
    showMessage(`Success: Button is ${expectedButtonText}.`);
  }

  /**
   * Checks if embed button works properly, and shows correct embed code.
   * @param {string} expectedCode - The expected embed code.
   */
  async expectEmbedClassroomLinkToWorkProperly(
    expectedCode: string
  ): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.clickOnElementWithSelector(embedLessonButton);
    await this.expectElementToBeVisible(embedCodeSelector);
    const embedCode = await this.getTextContent(embedCodeSelector);
    if (embedCode?.trim() !== expectedCode) {
      throw new Error(
        'Embed code does not match the expected code. Expected: ' +
          expectedCode +
          ', Found: ' +
          embedCode
      );
    }
    await this.clickOnElementWithSelector(closeButtonSelector);
    await this.expectElementToBeVisible(embedCodeSelector, false);
  }

  /**
   * Checks if the embed classroom in lesson info works properly.
   * @param {string} explorationId The exploration id.
   */
  async expectEmbedClassroomInLessonInfoToWorkProperly(
    explorationId: string
  ): Promise<void> {
    const expectedCode = `<iframe src="http://localhost:8181/embed/exploration/${explorationId}" width="700" height="1000">`;

    await this.expectEmbedClassroomLinkToWorkProperly(expectedCode);
  }

  /**
   * Checks if the error message for wrong input is present.
   * @param {string} errorMessage - The expected error message.
   */
  async expectErrorMessageForWrongInputToBe(
    errorMessage: string
  ): Promise<void> {
    await this.expectTextContentToContain(
      wrongInputErrorContainerSelector,
      errorMessage
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

  /**
   * Verifies that the feedback submission was successful by checking for the presence of the feedback popup.
   */
  async expectFeedbackSubmissionPopupToAppear(): Promise<void> {
    try {
      await this.page.waitForFunction(
        `document.querySelector('${feedbackSubmissionPopupSelector}') !== null`,
        {timeout: 5000}
      );
      showMessage('Feedback submitted successfully');
    } catch (error) {
      throw new Error('Feedback was not successfully submitted');
    }
  }

  /**
   * Checks if fraction input is visible.
   */
  async expectFractionInputToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(fractionInputSelector);
  }

  /**
   * Checks if button with "left arrow" icon is present to move back to previous lesson card.
   * @param {boolean} visibility - Boolean value representing should be visible or not.
   */
  async expectGoBackToPreviousCardButton(
    visibility: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(previousCardButton, visibility);
  }

  /**
   * Function to verify the heading in classroom page.
   * @param {string} expectedHeading - The expected heading of the classroom.
   */
  async expectHeadingInClassroomPageToContain(
    expectedHeading: string
  ): Promise<void> {
    await this.expectElementToBeVisible(classroomContentHeadingSelector);
    const headings = (
      await this.page.locator(classroomContentHeadingSelector).allTextContents()
    ).map(text => text.trim());

    expect(headings).toContain(expectedHeading);
    showMessage(`Success: Heading is ${expectedHeading}.`);
  }

  /**
   * Function to verify the number of hint models.
   * @param {number} n - The expected number of hint models.
   */
  async expectHintModelsToBe(n: number): Promise<void> {
    const actualNumberOfHintModels = await this.page.$$(hintButtonSelector);

    if (actualNumberOfHintModels.length !== n) {
      throw new Error(
        `Expected ${n} hint models, but found ${actualNumberOfHintModels.length}`
      );
    }
  }

  /**
   * Function to verify the home page title.
   * @param {string} title - The expected title of the home page.
   */
  async expectHomePageTitleToBe(title: string): Promise<void> {
    await this.expectTextContentToBe(homePageHeadingSelector, title);
  }

  /**
   * Checks if the the language dropdown is available or not.
   * @param {boolean} status - Status of language dropdown.
   */
  async expectLanguageDropdownToBePresent(
    status: boolean = true
  ): Promise<void> {
    const languageDropdownElement = await this.page.$(languageDropdown);
    if (status && !languageDropdownElement) {
      throw new Error(
        'The language dropdown was expected to be present on the page, but it is not.'
      );
    } else if (!status && languageDropdownElement) {
      throw new Error(
        'The language dropdown was expected to be absent on the page, but it is present.'
      );
    } else {
      showMessage(
        `The language dropdown is ${status ? 'present' : 'not present'} on the page.`
      );
    }
  }

  /**
   * Checks if the lesson info modal header matches the expected header.
   * @param {string} header - The expected header.
   */
  async expectLessonInfoModalHeaderToBe(header: string): Promise<void> {
    await this.expectElementToBeVisible(lessonInfoModalHeaderSelector);
    await this.expectTextContentToMatch(lessonInfoModalHeaderSelector, header);
  }

  /**
   * Checks if the lesson info text is present.
   * @param {string} lessonText - The expected lesson info text.
   */
  async expectLessonInfoTextToBe(lessonText: string): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      showMessage('Skipping lesson info text check on mobile viewport.');
      return;
    }
    await this.expectTextContentInElementWithSelectorToBe(
      lessonInfoTextSelector,
      lessonText
    );
  }

  /**
   * Checks if lesson info text is visible or not.
   * @param {boolean} status - Boolean value representing that info text should be visible or not.
   */
  async expectLessonInfoTextToBePresent(status: boolean = true): Promise<void> {
    if (status) {
      await this.expectElementToBeVisible(lessonInfoButton);
      showMessage('Lesson info text is present.');
      return;
    } else {
      try {
        await this.expectElementToBeVisible(lessonInfoButton);
        throw new Error('Lesson info text is present, but it should not be.');
      } catch (error) {
        if (error instanceof Error && error.message.includes('Timeout')) {
          showMessage('Lesson info text is not present, as expected.');
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Checks if the lesson info shows the last updated information.
   */
  async expectLessonInfoToShowLastUpdated(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.expectElementToBeVisible(lastUpdatedInfoSelector);
    showMessage('Last updated info is present.');
  }

  /**
   * Checks if the lesson info shows the expected rating.
   * @param {string} expectedRating - The expected rating.
   */
  async expectLessonInfoToShowRating(expectedRating: string): Promise<void> {
    await this.expectElementToBeVisible(ratingContainerSelector);
    const ratingText = await this.getTextContent(ratingContainerSelector);

    if (ratingText !== expectedRating) {
      throw new Error(
        `Rating text does not match expected rating. Found: ${ratingText}, Expected: ${expectedRating}`
      );
    }
  }

  /**
   * Checks if the lesson info shows the expected tags.
   * @param {string[]} expectedTags - The expected tags.
   */
  async expectLessonInfoToShowTags(expectedTags: string[]): Promise<void> {
    await this.expectElementToBeVisible(tagsContainerSelector);
    const tags = await this.page.$$eval(
      `${tagsContainerSelector}`,
      emElements => {
        return emElements.map(em => em.textContent?.trim());
      }
    );

    for (const tag of expectedTags) {
      if (!tags.includes(tag)) {
        throw new Error(`Tag ${tag} not found.`);
      }
    }
  }

  /**
   * Checks if an exploration has a specific rating.
   *
   * @param {number} expectedRating - The expected rating of the exploration.
   * @param {string} expectedExplorationName - The name of the exploration to check.
   */
  async expectLessonsToHaveRating(
    expectedRating: number,
    expectedExplorationName: string
  ): Promise<void> {
    try {
      await this.expectElementToBeVisible(lessonCardSelector);
      const cards = await this.page.$$(lessonCardSelector);
      for (const card of cards) {
        await card.waitForSelector(lessonCardTitleSelector);
        const titleElement = await card.$(lessonCardTitleSelector);
        if (!titleElement) {
          throw new Error('Title element not found in lesson card.');
        }
        const titleText = await this.getTextContent(titleElement);
        if (titleText === expectedExplorationName) {
          await card.waitForSelector(explorationRatingSelector);
          const ratingElement = await card.$(explorationRatingSelector);
          if (ratingElement) {
            const ratingSpan = await ratingElement.$('span:nth-child(2)');
            if (!ratingSpan) {
              throw new Error(
                `Rating span not found for exploration "${expectedExplorationName}".`
              );
            }
            const ratingText = await this.getTextContent(ratingSpan);
            const rating = parseFloat(ratingText);
            if (rating !== expectedRating) {
              throw new Error(
                `Rating for exploration "${expectedExplorationName}" is ${rating}, but expected ${expectedRating}.`
              );
            }
            return;
          }
        }
      }
      throw new Error(
        `Exploration "${expectedExplorationName}" not found in exploration titles.`
      );
    } catch (error) {
      const newError = new Error(
        `Failed to check rating of exploration: ${error}`
      );
      if (error instanceof Error) {
        newError.stack = error.stack;
      }
      throw newError;
    }
  }

  /**
   * Checks if the views of a lesson card matches the expected views.
   * @param {number} expectedViews - The expected views of the card.
   * @param {string} explorationName - The name of the exploration.
   */
  async expectLessonViewsToBe(
    expectedViews: number,
    explorationName: string
  ): Promise<void> {
    await this.page.waitForSelector(lessonCardSelector);
    const cards = await this.page.$$(lessonCardSelector);
    for (const card of cards) {
      await card.waitForSelector(lessonCardTitleSelector);
      const titleElement = await card.$(lessonCardTitleSelector);
      if (!titleElement) {
        throw new Error('Title element not found in lesson card.');
      }
      const titleText = await this.getTextContent(titleElement);
      if (titleText === explorationName) {
        await card.waitForSelector(explorationViewsSelector);
        const views = await card.$eval(explorationViewsSelector, el =>
          parseInt(el?.textContent?.trim() ?? '0', 10)
        );

        if (views !== expectedViews) {
          throw new Error(
            `Expected views to be ${expectedViews}, but found ${views}`
          );
        }
        return;
      }
    }
  }

  /**
   * Compares the text content of next button in lesson player.
   * @param {string} buttonText - Expected button text.
   */
  async expectNextCardButtonTextToBe(buttonText: string): Promise<void> {
    await this.expectTextContentToBe(nextCardButton, buttonText);
  }

  /**
   * Checks if the "Save Progress" button is not present. Use this function before the first checkpoint is
   * reached.
   */
  async expectNoSaveProgressBeforeCheckpointInfo(): Promise<void> {
    try {
      await this.expectElementToBeVisible(saveProgressButton);
      throw new Error('"Save Progress" button found, which is not expected.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Timeout')) {
        showMessage('"save Progress" button not found, as expected.');
      }
    }
  }

  /**
   * Check if the number input placeholder matches the expected text.
   * @param {string} expectedPlaceholder - Expected placeholder text of the input field.
   */
  async expectNumberInputPlaceholderToMatch(
    expectedPlaceholder: string
  ): Promise<void> {
    // Wait until the placeholder attribute updates to the expected value.
    await this.page.waitForFunction(
      ({selector, expected}: {selector: string; expected: string}) => {
        const el = document.querySelector(selector);
        return el && el.getAttribute('placeholder') === expected;
      },
      {selector: floatFormInput, expected: expectedPlaceholder},
      {timeout: 30000}
    );

    showMessage(`Input placeholder is "${expectedPlaceholder}" as expected.`);
  }

  /**
   * Function to verify if the latest Oppia feedback matches the expected feedback.
   * @param {string} expectedFeedback - The expected feedback.
   */
  async expectOppiaFeedbackToBe(expectedFeedback: string): Promise<void> {
    await this.expectElementToBeVisible(feedbackSelector);
    const feedbackText = await this.getTextContent(`${feedbackSelector} > p`);
    if (feedbackText !== expectedFeedback) {
      throw new Error(
        `Expected feedback to be '${expectedFeedback}', but got '${feedbackText}'.`
      );
    }
  }

  /**
   * Checks if the page's language matches the expected language.
   * @param {string} expectedLanguage - The expected language of the page.
   */
  async expectPageLanguageToMatch(expectedLanguage: string): Promise<void> {
    // Get the 'lang' attribute from the <html> tag.
    await this.waitForStaticAssetsToLoad();

    const actualLanguage = await this.page.evaluate(
      () => document.documentElement.lang
    );

    if (actualLanguage !== expectedLanguage) {
      throw new Error(
        `Expected page language to be ${expectedLanguage}, but it was ${actualLanguage}`
      );
    }
    showMessage('Page language matches the expected one.');
  }

  /**
   * Checks if the progress reminder modal text matches the expected text.
   * @param {string} expectedText - The expected text.
   */
  async expectProgressReminderModalTextToBe(
    expectedText: string
  ): Promise<void> {
    await this.expectElementToBeVisible(progressReminderModalHeaderSelector);
    await this.expectTextContentToMatch(
      progressReminderModalHeaderSelector,
      expectedText
    );
  }

  /**
   * Checks if the rate options are not available.
   */
  async expectRateOptionsNotAvailable(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    const rateOptions = await this.page.$(rateOptionsSelector);
    if (rateOptions !== null) {
      throw new Error('Rate options found.');
    }
  }

  /**
   * Checks if the save progress button is visible.
   */
  async expectSaveProgressButtonToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(saveProgressButton);
  }

  /**
   * Checks if the sign-in button is present on the page.
   */
  async expectSignInButtonToBePresent(present: boolean = true): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    try {
      await this.expectElementToBeVisible(signInButton, true, this.page, 5000);
    } catch (error) {
      try {
        await this.page.waitForSelector(singInButtonInProgressModal, {
          timeout: 5000,
        });

        showMessage('Sign-in button present.');
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Timeout') &&
          !present
        ) {
          showMessage('Sign-in button not present.');
          return;
        }

        throw new Error(
          'Sign-in button not found.\n' +
            `Original error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    if (!present) {
      throw new Error('Sign-in button is present, expected to be absent.');
    }
  }

  /**
   * Checks if submit button is visible.
   * @param {'Visible' | 'Hidden' | 'Disabled'} state - The expected state of the submit button.
   */
  async expectSubmitButtonToBe(
    state: 'Visible' | 'Hidden' | 'Disabled'
  ): Promise<void> {
    if (state === 'Disabled') {
      await this.page.waitForFunction(
        (selector: string) => {
          const submitButton: HTMLButtonElement | null =
            document.querySelector(selector);
          return submitButton?.disabled;
        },
        submitAnswerButton,
        {timeout: 60000}
      );
    } else {
      await this.expectElementToBeVisible(
        submitAnswerButton,
        state === 'Visible'
      );
    }
  }

  /**
   * Expects the subtopics in the practice tab to contain the expected subtopics.
   * @param {string[]} subtopicNames The expected subtopics.
   */
  async expectSubtopicListInPracticeTabToContain(
    subtopicNames: string[]
  ): Promise<void> {
    await this.expectElementToBeVisible(subtopicListItemInPracticeTabSelector);
    const subtopicsInList = await this.page.$$eval(
      subtopicListItemInPracticeTabSelector,
      subtopics => subtopics.map(subtopic => subtopic.textContent?.trim())
    );

    for (const subtopicName of subtopicNames) {
      expect(subtopicsInList).toContain(subtopicName);
    }
  }

  /**
   * Checks if suggestion section is visible or not.
   * @param {boolean} visible - Expected visibility.
   */
  async expectSuggestionSectionToBePresent(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(suggestionSection, visible);
  }

  /**
   * Checks if non-interactive tab with given heading contains expected content in lesson card.
   * @param {string} tabHeading - The tab heading to check content for.
   * @param {string} tabContent - The content of tab
   */
  async expectTabElementInLessonCardToContain(
    tabHeading: string,
    tabContent: string
  ): Promise<void> {
    await this.expectElementToBeVisible(nonInteractiveTabsHeaderSelector);
    const tabHeaders = await this.page.$$eval(
      nonInteractiveTabsHeaderSelector,
      elements => elements.map(element => element.textContent?.trim())
    );

    const tabIndex = tabHeaders.indexOf(tabHeading);
    if (tabIndex === -1) {
      throw new Error(`Tab ${tabHeading} not found`);
    }

    const selector = `${nonInteractiveTabsHeaderSelector} .e2e-test-element-${tabIndex}`;
    await this.expectElementToBeVisible(selector);
    await this.clickOnElementWithSelector(selector);

    const contentSelector = `.e2e-test-tab-content-${tabIndex}`;
    await this.expectElementToBeVisible(contentSelector);
    const actualContent = await this.page.$eval(
      contentSelector,
      el => el.textContent
    );

    expect(actualContent).toContain(tabContent);
  }

  /**
   * Expects the tab title in the topic page to be the expected tab title.
   * @param {string} expectedTabTitle The expected tab title.
   */
  async expectTabTitleInTopicPageToBe(expectedTabTitle: string): Promise<void> {
    await this.expectElementToBeVisible(tabTitleInTopicPageSelector);

    await this.page.waitForFunction(
      ({
        selector,
        expectedTabTitle,
      }: {
        selector: string;
        expectedTabTitle: string;
      }) => {
        const tabTitle = document.querySelector(selector)?.textContent?.trim();
        return tabTitle === expectedTabTitle;
      },
      {selector: tabTitleInTopicPageSelector, expectedTabTitle},
      {timeout: 60000}
    );
  }

  /**
   * Checks if the text content of an element matches the expected value.
   * @param {string} selector - The CSS selector to find the element.
   * @param {string} value - The expected text content value.
   * @param {boolean} exactMatch - If true, checks for exact match. If false, checks if value is contained in text content.
   */
  async expectTextContentInElementWithSelectorToBe(
    selector: string,
    value: string,
    exactMatch: boolean = false
  ): Promise<void> {
    await this.expectElementToBeVisible(selector);

    const actualTextContent = await this.page.$eval(
      selector,
      element => (element as HTMLElement).textContent
    );

    if (!exactMatch && !actualTextContent?.includes(value)) {
      throw new Error(
        `Expected text content to contain ${value}, but found ${actualTextContent}`
      );
    } else if (exactMatch && actualTextContent !== value) {
      throw new Error(
        `Expected text content to be ${value}, but found ${actualTextContent}`
      );
    }
  }

  /**
   * Expects the user to be in the diagnostic test player.
   */
  async expectToBeInDiagnosticTestPlayer(): Promise<void> {
    await this.expectElementToBeVisible(diagnosticTestPlayerSelector);

    await this.isTextPresentOnPage('Learner Diagnostic Test');
  }

  /**
   * Verifies that the user is currently in a practice session.
   */
  async expectToBeInPracticeSession(): Promise<void> {
    expect(await this.isElementVisible(practiceSessionContainerSelector)).toBe(
      true
    );
  }

  /**
   * This function verifies that the user is on the correct classroom page.
   * @param {number} statusCode The status code of the error page.
   */
  async expectToBeOnErrorPage(statusCode: number): Promise<void> {
    await this.expectElementToBeVisible(errorPageHeading);

    const errorText = await this.getTextContent(errorPageHeading);

    if (!errorText) {
      throw new Error(`Error text is not visible. URL: ${this.page.url()}`);
    }

    const currentStatusCode = Number(errorText.split(' ')[1]);

    if (currentStatusCode !== statusCode) {
      throw new Error(
        `Expected status code to be ${statusCode}, found: ${currentStatusCode}`
      );
    }

    showMessage(`User is on error page with status code ${statusCode}.`);
  }

  /**
   * Function to verify that the user is on the login page.
   */
  async expectToBeOnLoginPage(): Promise<void> {
    await this.page.waitForFunction(
      (url: string) => {
        const currentURL = window.location.href;
        return currentURL.includes(url);
      },
      testConstants.URLs.Login,
      {timeout: 60000}
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

    if (!url.includes(expectedPageInUrl)) {
      throw new Error(
        `Expected to be on page ${expectedPage}, but found ${url}`
      );
    }
  }

  /**
   * Function to verify if the user is on the story page.
   * @param {string} storyTitle - The title of the story.
   */
  async expectToBeOnStoryPage(storyTitle: string): Promise<void> {
    await this.page.waitForFunction(
      ({selector, value}: {selector: string; value: string}) => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() === value;
      },
      {selector: storyTitleSelector, value: storyTitle},
      {timeout: 60000}
    );
  }

  /**
   * Verifies that the topic page contains the given story names.
   * @param {string[]} storyNames - The names of the stories to check for.
   */
  async expectTopicToContainStories(storyNames: string[]): Promise<void> {
    const selector = this.isViewportAtMobileWidth()
      ? mobileStoryTitleSelector
      : desktopStoryTitleSelector;

    const storyNamesInPage = (
      await this.page.locator(selector).allTextContents()
    ).map(text => text.trim());

    for (const storyName of storyNames) {
      expect(storyNamesInPage).toContain(storyName);
    }
  }

  /**
   * Checks if a list of topics are present.
   * @param {string[]} expectedTopicNames - The names of the topics to check for.
   */
  async expectTopicsToBePresent(expectedTopicNames: string[]): Promise<void> {
    try {
      await this.expectElementToBeVisible(topicNameSelector);
      const topicNameTexts = (
        await this.page.locator(topicNameSelector).allTextContents()
      ).map(text => text.trim());

      for (const expectedName of expectedTopicNames) {
        if (!topicNameTexts.includes(expectedName.trim())) {
          throw new Error(`Topic "${expectedName}" not found in topic names.`);
        }
      }
    } catch (error) {
      const newError = new Error(`Failed to check for topics: ${error}`);
      if (error instanceof Error) {
        newError.stack = error.stack;
      }
      throw newError;
    }
  }

  /**
   * Expects the profile picture to be present.
   */
  async expectProfilePictureToBePresent(): Promise<void> {
    await this.expectElementToBeVisible(profilePictureSelector);
  }

  /**
   * Checks if progress bar is visible or not.
   * @param {boolean} visible - Expected visibility.
   */
  async expectProgressBarToBePresent(visible: boolean = true): Promise<void> {
    await this.expectElementToBeVisible(progressBarSelector, visible);
  }

  /**
   * Checks if the progress remainder is found or not, based on the shouldBeFound parameter. (It can be found when the an already played exploration is revisited or an ongoing exploration is reloaded, but only if the first checkpoint is reached.)
   * @param {boolean} shouldBeFound - Whether the progress remainder should be found or not.
   */
  async expectProgressReminder(shouldBeFound: boolean): Promise<void> {
    await this.waitForPageToFullyLoad();
    try {
      await this.expectElementToBeVisible(progressRemainderModalSelector);
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

  /**
   * Checks if the search results contain a specific result.
   * @param {string[]} searchResultsExpected - The search result to check for.
   * @param {boolean} present - Whether the search results should be present or not.
   */
  async expectSearchResultsToContain(
    searchResultsExpected: string[],
    present: boolean = true
  ): Promise<void> {
    const selector = this.isViewportAtMobileWidth()
      ? explorationTitleSelector
      : lessonCardTitleSelector;
    await this.waitForPageToFullyLoad();
    if (!present && !(await this.isElementVisible(selector))) {
      return;
    }
    await this.page.waitForSelector(selector);
    const searchResultsElements = await this.page.$$(selector);
    const searchResults = await Promise.all(
      searchResultsElements.map(result =>
        this.page.evaluate(el => el.textContent.trim(), result)
      )
    );

    for (const searchResultExpected of searchResultsExpected) {
      if (searchResults.includes(searchResultExpected) === present) {
        showMessage(
          `Success: Search result "${searchResultExpected}" is ${present ? 'present' : 'not present'}.`
        );
      } else {
        throw new Error(
          `Expected search result "${searchResultExpected}" to be ${
            present ? 'present' : 'not present'
          }, but it was ${present ? 'not ' : ''}found.\nFound search results: ${searchResults}`
        );
      }
    }
  }

  /**
   * Checks if "Stay Anonymous" checkbox is checked or not.
   * @param {boolean} status - Boolean value representing that checkbox should be checked or not.
   */
  async expectStayAnonymousCheckboxToBePresent(
    status: boolean = true
  ): Promise<void> {
    if (status) {
      await this.expectElementToBeVisible(stayAnonymousCheckbox);
      showMessage('Stay anonymous checkbox is present.');
      return;
    } else {
      try {
        await this.expectElementToBeVisible(stayAnonymousCheckbox);
        throw new Error(
          'Stay anonymous checkbox is present, but it should not be.'
        );
      } catch (error) {
        if (error instanceof Error && error.message.includes('Timeout')) {
          showMessage('Stay anonymous checkbox is not present, as expected.');
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Verifies that the current page URL matches the expected classroom page URL.
   */
  async expectToBeInClassroomPage(classroomURLFragment: string): Promise<void> {
    const expectedUrl = `${testConstants.URLs.ClassroomsPage}/${classroomURLFragment}`;

    await this.page.waitForFunction(
      (url: string) => window.location.href === url,
      expectedUrl
    );
  }

  /**
   * Verifies that the user is on the community library page.
   */
  async expectToBeOnCommunityLibraryPage(): Promise<void> {
    await this.page.waitForFunction(
      (url: string) => window.location.href.includes(url),
      testConstants.URLs.CommunityLibrary
    );
  }

  /**
   * Checks if Video RTE is present in current lesson card.
   */
  async expectVideoRTEToBePresent(): Promise<void> {
    await this.expectElementToBeVisible(youtubePlayerSelector);
  }

  /**
   * Checks if voiceover is playable.
   * @param {boolean} playable - If voiceover should be playable or not.
   */
  async expectVoiceoverIsPlayable(playable: boolean = true): Promise<void> {
    try {
      await this.startVoiceover();

      // Wait until slider value changes.
      const currentSliderValue = await this.page.$eval(
        audioSliderSelector,
        el => parseInt(el.textContent?.trim() ?? '', 10)
      );

      await this.page.waitForFunction(
        ({selector, value}: {selector: string; value: number}) => {
          const element = document.querySelector(selector);
          return parseInt(element?.textContent?.trim() ?? '', 10) >= value;
        },
        {selector: audioSliderSelector, value: currentSliderValue}
      );

      // Pause voiceover once checking is done.
      await this.pauseVoiceover();

      if (!playable) {
        throw new Error(
          'Voiceover expected to be not playable, but is playable'
        );
      }

      showMessage('Voiceover is playable.');
    } catch (error) {
      // If we don't press play button again, the voiceover in next interaction
      // will start playing automatically as we continue to next interaction.
      // This will make the test flaky. So, we need to press play button again.
      await this.expectElementToBeVisible(playVoiceoverButton);

      // Report error / success based on playable flag.
      await this.clickOnElementWithSelector(playVoiceoverButton);
      if (playable) {
        throw new Error(
          'Voiceover expected to be playable, but is not playable' + error
        );
      }

      showMessage('Voiceover is not playable.');
    }
  }

  /**
   * Checks if the voiceover is skippable.
   */
  async expectVoiceoverIsSkippable(): Promise<void> {
    await this.waitForPageToFullyLoad();
    const voiceoverDropdownElement = await this.page.$(voiceoverDropdown);
    if (voiceoverDropdownElement) {
      await this.clickOnElementWithSelector(voiceoverDropdown);
    }

    // Start playing the voiceover.
    await this.expectElementToBeVisible(playVoiceoverButton);
    await this.clickOnElementWithSelector(playVoiceoverButton);

    // Check voiceover current time and compare.
    await this.page.waitForFunction(
      ({selector, value}: {selector: string; value: number}) => {
        const element = document.querySelector(selector);
        return parseInt(element?.textContent?.trim() ?? '', 10) >= value;
      },
      {selector: audioSliderSelector, value: 2}
    );

    const currentSliderValue = await this.page.$eval(audioSliderSelector, el =>
      parseInt(el.textContent?.trim() ?? '', 10)
    );

    // Skipping the voiceover for 10 seconds.
    await this.expectElementToBeVisible(audioForwardButtonSelector);
    await this.clickOnElementWithSelector(audioForwardButtonSelector);
    await this.clickOnElementWithSelector(audioForwardButtonSelector);

    // If we skip voiceover twice, and wait for 5 seconds, the audio value should increase
    // between 10 to 15 seconds. We are checking for more than 12 seconds to avoid flaky test.
    await this.page.waitForFunction(
      ({selector, value}: {selector: string; value: number}) => {
        const element = document.querySelector(selector);
        return parseInt(element?.textContent?.trim() ?? '', 10) >= value;
      },
      {selector: audioSliderSelector, value: currentSliderValue + 12}
    );
  }

  /**
   * Checks if Audio bar is visible or not.
   * @param {boolean} visible - Expected visibility.
   */
  async expectVoiceoverBarToBePresent(visible: boolean = true): Promise<void> {
    let isVisible = true;

    try {
      await this.expectElementToBeVisible(voiceoverDropdown);
    } catch (error) {
      isVisible = false;
    }

    if (!visible === isVisible) {
      throw new Error(
        `Expected voiceover bar to be ${
          visible ? 'visible' : 'hidden'
        }, but it was ${isVisible ? 'visible' : 'hidden'}`
      );
    }
  }

  /**
   * Filters lessons by multiple categories.
   * @param {string[]} categoryNames - The names of the categories to filter by.
   */
  async filterLessonsByCategories(categoryNames: string[]): Promise<void> {
    await this.clickOnElementWithSelector(categoryFilterDropdownToggler);
    await this.waitForStaticAssetsToLoad();

    await this.expectElementToBeVisible(unselectedFilterOptionsSelector);
    const filterOptions = await this.page.$$(unselectedFilterOptionsSelector);
    let foundMatch = false;

    for (const option of filterOptions) {
      const optionText = await this.getTextContent(option);

      if (categoryNames.includes(optionText.trim())) {
        foundMatch = true;
        await this.clickOnElement(option);
      }
    }

    if (!foundMatch) {
      throw new Error(
        `No match found for categories: ${categoryNames.join(', ')}`
      );
    }

    await this.clickOnElementWithSelector(searchInputSelector);
    await this.page.keyboard.press('Enter');

    await this.page.waitForFunction(
      (categoryNames: string[]) => {
        // Check if URL contains all the categories. Added %22 to remove false positives.
        return categoryNames.every(category =>
          window.location.href.includes(`%22${category}%22`)
        );
      },
      categoryNames,
      {timeout: 60000}
    );
  }

  /**
   * Filters lessons by multiple languages and deselect the already selected English language.
   * @param {string[]} languageNames - The names of the languages to filter by.
   * @param {string} languageToDeselect - The name of the language to deselect. (Default: 'English')
   */
  async filterLessonsByLanguage(
    languageNames: string[],
    languageToDeselect: string = 'English'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.waitForPageToFullyLoad();
    }
    await this.expectElementToBeVisible(languageFilterDropdownToggler);
    await this.clickOnElementWithSelector(languageFilterDropdownToggler);

    await this.waitForStaticAssetsToLoad();

    await this.expectElementToBeVisible(selectedFilterOptionsSelector);
    const selectedElements = await this.page.$$(selectedFilterOptionsSelector);
    for (const element of selectedElements) {
      const elementText = await this.page.evaluate(
        el => el.textContent.trim(),
        element
      );
      // Deselecting the selected language before choosing new filters.
      if (elementText === languageToDeselect) {
        await this.clickOnElement(element);
      }
    }

    await this.expectElementToBeAttachedInDOM(unselectedFilterOptionsSelector);
    const deselectedLanguages = await this.page.$$(
      unselectedFilterOptionsSelector
    );
    let foundMatch = false;
    let englishMatchCount = 0;

    for (const language of deselectedLanguages) {
      const languageText = await this.page.evaluate(
        el => el.textContent,
        language
      );
      const trimmedLanguageText = languageText.trim();

      if (trimmedLanguageText === 'English') {
        englishMatchCount += 1;
        if (englishMatchCount < 2) {
          continue;
        }
      }

      if (languageNames.includes(trimmedLanguageText)) {
        foundMatch = true;
        await this.clickOnElement(language);
      }
    }

    if (!foundMatch) {
      throw new Error(
        `No match found for languages: ${languageNames.join(', ')}`
      );
    }

    await this.clickOnElementWithSelector(searchInputSelector);
    await this.page.keyboard.press('Enter');

    const buttonTextContent =
      languageNames.length === 1
        ? languageNames[0]
        : `${languageNames.length} Languages`;
    await this.expectTextContentToBe(
      languageFilterDropdownToggler,
      buttonTextContent
    );
  }

  /**
   * Generates attribution
   */
  async generateAttribution(): Promise<void> {
    await this.expectElementToBeVisible(generateAttributionSelector);
    await this.clickOnElementWithSelector(generateAttributionSelector);
    await this.expectElementToBeVisible(attributionHtmlSectionSelector);
  }

  /**
   * Goes through the sign up process.
   * @param {string} email - The email to sign up with.
   * @param {string} username - The username to sign up with.
   */
  async goThroughSignUpProcess(email: string, username: string): Promise<void> {
    await this.expectElementToBeVisible(testConstants.SignInDetails.inputField);
    await this.typeInInputField(testConstants.SignInDetails.inputField, email);
    await this.clickOnElementWithText('Sign In');
    await this.page.waitForNavigation({waitUntil: 'networkidle'});
    await this.typeInInputField('input.e2e-test-username-input', username);
    await this.clickOnElementWithSelector(
      'input.e2e-test-agree-to-terms-checkbox'
    );
    await this.expectElementToBeVisible(
      'button.e2e-test-register-user:not([disabled])'
    );
    await this.clickOnElementWithText(LABEL_FOR_SUBMIT_BUTTON);
    await this.page.waitForNavigation({waitUntil: 'networkidle'});
    await this.expectElementToBeVisible('button.e2e-test-register-user', false);
  }

  /**
   * Navigates back to the classroom from the topic page.
   */
  async navigateBackToClassroomFromTopicPage(): Promise<void> {
    const selector = this.isViewportAtMobileWidth()
      ? backToClassroomBreadcrumbSelectorMobile
      : backToClassroomLinkSelector;
    await this.expectElementToBeVisible(selector);
    await this.clickOnElementWithSelector(selector);

    await this.expectElementToBeVisible(selector, false);
  }

  /**
   * Function to navigate to the classroom page.
   * @param {string} urlFragment - The URL fragment for the classroom page.
   */
  async navigateToClassroomPage(urlFragment: string): Promise<void> {
    await this.goto(`${classroomsPageUrl}/${urlFragment}`);

    await this.waitForPageToFullyLoad();
    showMessage(
      `Navigated to classroom page: ${classroomsPageUrl}/${urlFragment}`
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
   * @param {boolean} verifyURL - Whether to verify the URL after navigation. Defaults to true.
   */
  async navigateToCommunityLibraryPage(
    verifyURL: boolean = true
  ): Promise<void> {
    await this.goto(communityLibraryUrl, verifyURL);
  }

  /**
   * Navigates to the learn tab in the topic page.
   */
  async navigateToLessonsTabInTopic(): Promise<void> {
    await this.expectElementToBeVisible(lessonsTabButtonSelector);
    await this.clickOnElementWithSelector(lessonsTabButtonSelector);

    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(lessonsTabContainerSelector);
  }

  /**
   * Function to navigate to the home page.
   * @param {boolean} verifyURL - Whether to verify the URL after navigation. Defaults to true.
   */
  async navigateToHome(verifyURL: boolean = true): Promise<void> {
    await this.goto(homeUrl, verifyURL);
  }

  /**
   * Navigates to the practice tab in the topic page.
   */
  async navigateToPracticeTabInTopic(): Promise<void> {
    const practiceTabExists = await this.page.$(practiceTabLink);
    if (!practiceTabExists) {
      await this.reloadPage();
      await this.expectElementToBeVisible(practiceTabLink);
    }
    if (this.isViewportAtMobileWidth()) {
      await this.page.evaluate(() => window.scrollTo(0, 0));
    }
    await this.clickOnElementWithSelector(practiceTabLink);
    await this.expectElementToBeVisible(practiceContainer);
    await this.expectElementToBeVisible(practiceTabButtonSelector);
    await this.clickOnElementWithSelector(practiceTabButtonSelector);

    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(practiceTabContainerSelector);

    showMessage('Navigated to practice tab in topic page.');
  }

  /**
   * Navigates to the revision tab in the topic page.
   */
  async navigateToRevisionTabInTopic(): Promise<void> {
    await this.expectElementToBeVisible(revisionTabButtonSelector);
    await this.clickOnElementWithSelector(revisionTabButtonSelector);

    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(revisionTabSelector);
  }

  /**
   * Navigates to the splash page.
   * @param {string} expectedURL - The expected URL after navigation. Defaults to `${baseUrl}/`.
   */
  async navigateToSplashPage(
    expectedURL: string = `${baseUrl}/`
  ): Promise<void> {
    // We explicitly check for expected URL instead of verifying it through
    // BaseUser.goto as /splash redirects user to a different page.
    await this.goto(splashPageUrl, false);

    expect(this.page.url()).toBe(expectedURL);
  }

  /**
   * Opens the feedback popup and checks if the feedback form is present.
   */
  async openFeedbackPopup(): Promise<void> {
    await this.expectElementToBeVisible('nav-options');
    await this.expectElementToBeVisible(feedbackPopupSelector);
    await this.clickOnElementWithSelector(feedbackPopupSelector);
    await this.expectElementToBeVisible(feedbackTextarea);
  }

  /**
   * Opens the lesson info modal.
   */
  async openLessonInfoModal(): Promise<void> {
    await this.expectElementToBeVisible(lessonInfoButton);
    await this.clickOnElementWithSelector(lessonInfoButton);
    await this.expectElementToBeVisible(lessonInfoCardSelector);
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

    await this.page
      .locator(mobileNavbarOpenSidebarButton)
      .dispatchEvent('click');

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
   * Pauses the voiceover by clicking on the pause button.
   */
  async pauseVoiceover(): Promise<void> {
    await this.expectElementToBeVisible(pauseVoiceoverButton);
    await this.clickOnElementWithSelector(pauseVoiceoverButton);
    await this.expectElementToBeVisible(playVoiceoverButton);
    showMessage('Voiceover paused successfully.');
  }

  /**
   * Finds and clicks the chapter with the given name within a story, then
   * verifies navigation to the exploration player.
   * @param {string} chapterName - The name of the chapter to play.
   */
  async playChapterFromStory(chapterName: string): Promise<void> {
    await this.skipLoginPrompt();

    await this.expectElementToBeVisible(chapterTitleSelector);
    const chapterTitles = await this.page.$$(chapterTitleSelector);
    for (const chapter of chapterTitles) {
      const chapterText = await this.page.evaluate(
        el => el.textContent.trim(),
        chapter
      );
      if (chapterText.trim().includes(chapterName.trim())) {
        await this.clickOnElement(chapter);
        await this.expectPageURLToContain(testConstants.URLs.ExplorationPlayer);
        return;
      }
    }

    throw new Error(`Chapter "${chapterName}" not found.`);
  }

  /**
   * Navigates to and plays an exploration by its ID.
   * @param {string | null} explorationId - The ID of the exploration to play.
   */
  async playExploration(explorationId: string | null): Promise<void> {
    await this.goto(`${baseUrl}/explore/${explorationId as string}`);
  }

  /**
   * Searches for a specific lesson in the search results and opens it.
   * @param {string} lessonTitle - The title of the lesson to search for.
   */
  async playLessonFromSearchResults(lessonTitle: string): Promise<void> {
    try {
      await this.expectElementToBeVisible(lessonCardTitleSelector);
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

      await this.expectElementToBeVisible(lessonCardTitleSelector, false);
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
   * Returns to the story from the last state of an exploration.
   */
  async returnToStoryFromLastState(): Promise<void> {
    await this.clickOnElementWithSelector(returnToStoryFromLastStateSelector);
    await this.expectElementToBeVisible(storyViewerContainerSelector);
    showMessage('Returned to story from the last state.');
  }

  /**
   * Return to Learner Dashboard from exploration completion card.
   */
  async returnToLibraryFromExplorationCompletion(): Promise<void> {
    await this.expectElementToBeVisible(returnToLibraryButtonSelector);
    await this.clickOnElementWithSelector(returnToLibraryButtonSelector);
  }

  /**
   * Saves the progress.(To be used when save progress modal is opened.)
   */
  async saveProgress(): Promise<void> {
    await this.expectElementToBeVisible(saveProgressButton);

    // TODO(#26357): Remove this wait once the frontend race condition is fixed.
    // The saveProgressBtnTooltipSelector div is rendered directly below the
    // button in a flex column when checkpointStatusArray[0] === 'in-progress'.
    // This happens when the modal opens before Angular's async checkpoint
    // service has updated completedCheckpointsCount. While the tooltip is
    // present, elementFromPoint at the button's center returns the tooltip div
    // instead of the button, causing waitForElementToBeClickable to time out.
    // We wait here until the tooltip disappears (i.e. completedCheckpointsCount
    // has been updated to reflect the reached checkpoint).
    await this.expectElementToBeVisible(saveProgressBtnTooltipSelector, false);

    await this.clickOnElementWithSelector(saveProgressButton);

    await this.expectElementToBeVisible(signInBoxInSaveProressModalSelector);
  }

  /**
   * Searches for a lesson in the search bar present in the community library.
   * @param {string} lessonName - The name of the lesson to search for.
   */
  async searchForLessonInSearchBar(lessonName: string): Promise<void> {
    await this.expectElementToBeVisible(searchInputSelector);
    if (this.isViewportAtMobileWidth()) {
      await this.page.mouse.move(-1, -1); // Move mouse away to prevent hover effects from blocking the search input.
    }
    await this.clickOnElementWithSelector(searchInputSelector);
    await this.typeInInputField(searchInputSelector, lessonName);

    await this.page.keyboard.press('Enter');
    await this.page.waitForNavigation({waitUntil: 'load'});
  }

  /**
   * Selects and opens a topic by its name.
   * @param {string} topicName - The name of the topic to select and open.
   */
  async selectAndOpenTopic(topicName: string): Promise<void> {
    try {
      await this.expectElementToBeVisible(topicNameSelector);
      const topicNames = await this.page.$$(topicNameSelector);
      for (const name of topicNames) {
        const nameText = await this.page.evaluate(
          el => el.textContent.trim(),
          name
        );
        if (nameText === topicName.trim()) {
          await Promise.all([
            this.page.waitForNavigation({waitUntil: 'networkidle'}),
            this.clickOnElement(name),
          ]);

          await this.expectElementToBeVisible(topicViewerContainerSelector);
          showMessage(`Topic ${topicName} is opened successfully.`);
          return;
        }
      }

      throw new Error(`Topic "${topicName}" not found in topic names.`);
    } catch (error) {
      const newError = new Error(`Failed to select and open topic: ${error}`);
      newError.stack = error instanceof Error ? error.stack : newError.stack;
      throw newError;
    }
  }

  /**
   * Selects and opens a chapter within a story to learn.
   * @param {string} storyName - The name of the story containing the chapter.
   * @param {string} chapterName - The name of the chapter to select and open.
   */
  async selectChapterWithinStoryToLearn(
    storyName: string,
    chapterName: string
  ): Promise<void> {
    const isMobileViewport = this.isViewportAtMobileWidth();
    const storyTitleSelector = isMobileViewport
      ? mobileStoryTitleSelector
      : desktopStoryTitleSelector;

    try {
      await this.expectElementToBeVisible(storyTitleSelector);
      const storyTitles = await this.page.$$(storyTitleSelector);
      for (const title of storyTitles) {
        const titleText = await this.page.evaluate(
          el => el.textContent.trim(),
          title
        );
        if (titleText.trim() === storyName.trim()) {
          await this.clickOnElement(title);
          await this.expectElementToBeVisible(chapterTitleSelector);

          await this.skipLoginPrompt();

          await this.expectElementToBeVisible(chapterTitleSelector);
          const chapterTitles = await this.page.$$(chapterTitleSelector);
          for (const chapter of chapterTitles) {
            const chapterText = await this.page.evaluate(
              el => el.textContent.trim(),
              chapter
            );
            if (chapterText.trim().includes(chapterName.trim())) {
              await this.clickOnElement(chapter);

              await this.expectPageURLToContain(
                testConstants.URLs.ExplorationPlayer
              );
              showMessage(`Chapter ${chapterName} is opened successfully.`);
              return;
            }
          }

          throw new Error(
            `Chapter "${chapterName}" not found in story "${storyName}".`
          );
        }
      }

      throw new Error(`Story "${storyName}" not found in story titles.`);
    } catch (error) {
      const newError = new Error(
        `Failed to select and open chapter within story: ${error}`
      );
      newError.stack = error instanceof Error ? error.stack : newError.stack;
      throw newError;
    }
  }

  /**
   * Function to skip the login prompt that appears while surfing being logged out.
   */
  async skipLoginPrompt(): Promise<void> {
    await this.waitForStaticAssetsToLoad();

    const isLoginPromptContainerPresent =
      await this.page.$(loginPromptContainer);
    if (isLoginPromptContainerPresent) {
      await this.clickOnElementWithText('SKIP');
    }

    await this.expectElementToBeVisible(loginPromptContainer, false);
  }

  /**
   * Shares the exploration.
   * @param {string} platform - The platform to share the exploration on. This should be the name of the platform (e.g., 'facebook', 'twitter')
   * @param {string | null} explorationId - The id of the exploration.
   */
  async shareExplorationAndVerifyRedirect(
    platform: string,
    explorationId: string | null
  ): Promise<void> {
    await this.expectElementToBeVisible(shareExplorationButtonSelector);
    await this.clickOnElementWithSelector(shareExplorationButtonSelector);

    await this.waitForStaticAssetsToLoad();
    await this.expectElementToBeVisible(
      `.e2e-test-share-link-${platform.toLowerCase()}`
    );
    const aTag = await this.page.$(
      `.e2e-test-share-link-${platform.toLowerCase()}`
    );
    if (!aTag) {
      throw new Error(`No share link found for ${platform}.`);
    }
    const href = await this.page.evaluate(
      a => (a as HTMLAnchorElement).href,
      aTag
    );
    let expectedUrl: string;
    switch (platform) {
      case 'Facebook':
        expectedUrl =
          testConstants.SocialsShare.Facebook.Domain +
          explorationId +
          testConstants.SocialsShare.Facebook.queryString;
        break;
      case 'Twitter':
        expectedUrl = testConstants.SocialsShare.Twitter.Domain + explorationId;
        break;
      case 'Classroom':
        expectedUrl =
          testConstants.SocialsShare.Classroom.Domain + explorationId;
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    if (href !== expectedUrl) {
      throw new Error(
        `The ${platform} share link does not match the expected URL. Expected: ${expectedUrl}, Found: ${href}`
      );
    }
    await this.closeAttributionModal();
  }

  /**
   * Shares the exploration.
   * @param {string} platform - The platform to share the exploration on. This should be the name of the platform (e.g., 'facebook', 'twitter')
   * @param {'FaceBook' | 'Twitter' | 'Classroom'} explorationId - The id of the exploration.
   */
  async shareExplorationFromLessonInfoModal(
    platform: 'Facebook' | 'Twitter' | 'Classroom',
    explorationId: string | null
  ): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.expectElementToBeVisible(
      `.e2e-test-share-link-${platform.toLowerCase()}`
    );
    const aTag = await this.page.$(
      `.e2e-test-share-link-${platform.toLowerCase()}`
    );
    if (!aTag) {
      throw new Error(`No share link found for ${platform}.`);
    }
    const href = await this.page.evaluate(
      a => (a as HTMLAnchorElement).href,
      aTag
    );
    let expectedUrl: string;
    switch (platform) {
      case 'Facebook':
        expectedUrl =
          testConstants.SocialsShare.Facebook.Domain +
          explorationId +
          testConstants.SocialsShare.Facebook.queryString;
        break;
      case 'Twitter':
        expectedUrl = testConstants.SocialsShare.Twitter.Domain + explorationId;
        break;
      case 'Classroom':
        expectedUrl =
          testConstants.SocialsShare.Classroom.Domain + explorationId;
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    if (href !== expectedUrl) {
      throw new Error(
        `The ${platform} share link does not match the expected URL. Expected: ${expectedUrl}, Found: ${href}`
      );
    }
  }

  /**
   * Skips the current question in the diagnostic test.
   */
  async skipQuestionInDiagnosticTest(): Promise<void> {
    const initialProgress = await this.getTextContent(currentProgessSelector);
    await this.expectElementToBeVisible(skipQuestionButton);

    await this.clickOnElementWithSelector(skipQuestionButton);

    await this.page.waitForFunction(
      ({selector, value}: {selector: string; value: string}) => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() !== value;
      },
      {selector: currentProgessSelector, value: initialProgress}
    );
  }

  /**
   * Starts a diagnostic test.
   */
  async startDiagnosticTest(): Promise<void> {
    await this.expectElementToBeVisible(startDiagnosticTestButtonSelector);

    await this.clickOnElementWithSelector(startDiagnosticTestButtonSelector);
    await this.expectElementToBeVisible(
      startDiagnosticTestButtonSelector,
      false
    );
  }

  /**
   * Starts an exploration with a progress URL.
   * @param {string} progressUrl - The URL to navigate to.
   * @param {boolean} verifyURL - Whether to verify the URL after navigation. Defaults to true.
   */
  async startExplorationUsingProgressUrl(
    progressUrl: string,
    verifyURL: boolean = true
  ): Promise<void> {
    await this.goto(progressUrl, verifyURL);
  }

  /**
   * Starts a practice session for the given subtopics.
   * @param {string[]} subtopicNames - The names of the subtopics to start a practice session for.
   */
  async startPracticeSession(subtopicNames: string[]): Promise<void> {
    await this.expectElementToBeVisible(subtopicListItemInPracticeTabSelector);

    const subtopicElements = await this.page.$$(
      subtopicListItemInPracticeTabSelector
    );

    const subtopicsAdded = new Set<string>();

    for (const subtopicElement of subtopicElements) {
      const subtopicName = await subtopicElement.evaluate(el =>
        el.textContent?.trim()
      );
      if (!subtopicName) {
        continue;
      }
      if (subtopicNames.includes(subtopicName)) {
        const labelElement = await subtopicElement.$('label');

        if (labelElement) {
          await this.clickOnElement(labelElement);
          await this.page.waitForFunction(
            (element: HTMLInputElement | null) => element?.checked === true,
            await labelElement.$('input'),
            {timeout: 60000}
          );

          subtopicsAdded.add(subtopicName);
        }
      }
    }

    await this.expectElementToBeVisible(startPracticeButtonSelector);
    await this.clickOnElementWithSelector(startPracticeButtonSelector);
    await this.expectElementToBeVisible(startPracticeButtonSelector, false);
  }

  /**
   * Starts the voiceover by clicking on the audio bar (dropdown) and the play circle.
   */
  async startVoiceover(): Promise<void> {
    await this.waitForPageToFullyLoad();

    const isDropdownVisible = await this.isElementVisible(voiceoverDropdown);
    if (isDropdownVisible) {
      await this.expandVoiceoverBar();
    }
    await this.expectElementToBeVisible(playVoiceoverButton);
    await this.clickOnElementWithSelector(playVoiceoverButton);
    await this.expectElementToBeVisible(pauseVoiceoverButton);

    showMessage('Started playing the voiceover.');
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
   * Submits the answer in the text area.
   * @param {string} answer - The answer to submit.
   */
  async submitAnswerInTextArea(answer: string): Promise<void> {
    await this.waitForElementToBeClickable(submitResponseToInteractionTextArea);
    await this.typeInInputField(submitResponseToInteractionTextArea, answer);
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
      await this.expectElementToBeVisible(checkpointModalSelector);
      showMessage('Checkpoint modal found.');
      // Closing the checkpoint modal.
      await this.clickOnElementWithSelector(closeLessonInfoTooltipSelector);
      await this.expectElementToBeVisible(checkpointModalSelector, false);
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
   * Verifies if the voiceover is playing.
   * @param {boolean} shouldBePlaying - If the voiceover should be playing or not.
   */
  async verifyVoiceoverIsPlaying(shouldBePlaying: boolean): Promise<void> {
    try {
      await this.page.waitForSelector(audioSliderSelector);
      const currentSliderValue = await this.page.$eval(
        audioSliderSelector,
        el => parseInt(el.textContent?.trim() ?? '', 10)
      );

      // Wait until value of audio slider is greater than to currentSliderValue.
      await this.page.waitForFunction(
        ({selector, value}: {selector: string; value: number}) => {
          const element = document.querySelector(selector);
          return parseInt(element?.textContent?.trim() ?? '', 10) >= value;
        },
        {selector: audioSliderSelector, value: currentSliderValue}
      );

      if (shouldBePlaying) {
        showMessage('Voiceover is playing, as expected.');
      } else {
        throw new Error('Voiceover is playing, expected to be paused.');
      }
    } catch (error) {
      if (shouldBePlaying) {
        const err = error instanceof Error ? error : new Error(String(error));
        err.message =
          'Voiceover is not playing, expected to be playing.\n' + err.message;
        throw err;
      } else {
        showMessage('Voiceover is not playing, as expected.');
      }
    }
  }

  /**
   * Function to use a hint.
   */
  async viewHint(): Promise<void> {
    // Hint is shown after one minute.
    await this.expectElementToBeVisible(
      hintButtonSelector,
      true,
      this.page,
      80000
    );
    await this.clickOnElementWithSelector(hintButtonSelector);

    await this.expectElementToBeVisible(gotItButtonSelector);
  }

  /**
   * Simulates the action of viewing the solution by clicking on the view solution button and the continue to solution button.
   * @param {number} timeout - The maximum time to wait for the view solution button to be visible, in milliseconds. Defaults to 60000 ms (1 minute).
   */
  async viewSolution(timeout: number = 60000): Promise<void> {
    await this.expectElementToBeVisible(
      viewSolutionButton,
      true,
      this.page,
      timeout
    );
    await this.clickOnElementWithSelector(viewSolutionButton);
    await this.clickOnElementWithSelector(continueToSolutionButton);
    await this.expectElementToBeVisible(closeSolutionModalButton);
  }

  /**
   * Waits until the number of hint models is equal to the expected count.
   * @param {number} numberOfHintModals - The expected number of hint models.
   */
  async waitForHintModelsToBe(numberOfHintModals: number): Promise<void> {
    // Wait until number of elements equals the expected count.
    await this.page.waitForFunction(
      ({
        selector,
        expectedLength,
      }: {
        selector: string;
        expectedLength: number;
      }) => {
        const elements = document.querySelectorAll(selector);
        return elements.length === expectedLength;
      },
      {selector: hintButtonSelector, expectedLength: numberOfHintModals},
      {
        // Each hint modal takes about 1 minute to appear.
        timeout: numberOfHintModals * 65000,
      }
    );
  }

  /**
   * Waits until audio is playing.
   */
  async waitUntilAudioIsPlaying(): Promise<void> {
    // First, confirm playback has actually started.
    await this.page.waitForFunction((selector: string) => {
      const element = document.querySelector(selector);
      return Number(element?.getAttribute('aria-valuenow')) > 0;
    }, audioSliderSelector);
    // Wait until the audio slider value reaches 0, indicating that audio is finished.
    await this.page.waitForFunction((selector: string) => {
      const element = document.querySelector(selector);
      return Number(element?.getAttribute('aria-valuenow')) === 0;
    }, audioSliderSelector);

    // While mouse is over pause button, the pause button doesn't change its state.
    await this.page.mouse.move(10, 10);
  }

  /**
   * Write feedback in the feedback popup and submit it.
   * @param {string} feedback - The feedback to write in the popup.
   * @param {boolean} stayAnonymous - Whether to stay anonymous while giving feedback.
   * @param {boolean} verifyFeedbackPopup - Whether to verify the feedback popup after submission.
   */
  async writeAndSubmitFeedback(
    feedback: string,
    stayAnonymous: boolean = false,
    verifyFeedbackPopup: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(feedbackTextarea);
    await this.typeInInputField(feedbackTextarea, feedback);

    // If stayAnonymous is true, clicking on the "stay anonymous" checkbox.
    if (stayAnonymous) {
      await this.clickOnElementWithSelector(stayAnonymousCheckbox);
    }

    await this.clickOnElementWithText('Submit');

    if (verifyFeedbackPopup) {
      await this.expectFeedbackSubmissionPopupToAppear();
    }
  }
}

export const LoggedOutUserFactory = (page: Page): LoggedOutUser => {
  return new LoggedOutUser(page);
};
