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

import {BaseUser} from '../puppeteer-testing-utilities/puppeteer-utils';
import testConstants from '../puppeteer-testing-utilities/test-constants';
import {showMessage} from '../puppeteer-testing-utilities/show-message-utils';

const creatorDashboardUrl = testConstants.URLs.CreatorDashboard;
const learnerDashboardUrl = testConstants.URLs.LearnerDashboard;
const homeUrl = testConstants.URLs.Home;
const aboutUrl = testConstants.URLs.About;
const mathClassroomUrl = testConstants.URLs.MathClassroom;
const androidUrl = testConstants.URLs.Android;
const communityLibraryUrl = testConstants.URLs.CommunityLibrary;
const creatorDashboardCreateModeUrl =
  testConstants.URLs.CreatorDashboardCreateMode;
const aboutFoundationUrl = testConstants.URLs.AboutFoundation;
const blogUrl = testConstants.URLs.Blog;
const partnershipsUrl = testConstants.URLs.Partnerships;
const volunteerUrl = testConstants.URLs.Volunteer;
const donateUrl = testConstants.URLs.Donate;
const contactUrl = testConstants.URLs.Contact;
const _61MillionChildrenUrl = testConstants.URLs.ExternalLink61MillionChildren;
const sourceUnescoUrl = testConstants.URLs.ExternalLinkSourceUnesco;
const evenThoseWhoAreInSchoolUrl =
  testConstants.URLs.ExternalLinkEvenThoseWhoAreInSchool;
const _420MillionUrl = testConstants.URLs.ExternalLink61MillionChildren;
const thanksForDonatingUrl = testConstants.URLs.DonateWithThanksModal;
const watchAVideoUrl = testConstants.URLs.ExternalLinkWatchAVideo;

const navbarAboutTab = 'a.e2e-test-navbar-about-menu';
const navbarAboutTabAboutButton = 'a.e2e-test-about-link';
const navbarAboutTabAboutFoundationButton =
  'a.e2e-test-navbar-about-menu-about-foundation-button';
const navbarAboutTabBlogButton = 'a.e2e-test-blog-link';
const navbarGetInvolvedTab = 'a.e2e-test-navbar-get-involved-menu';
const navbarGetInvolvedTabSchoolAndOrganizationsButton =
  'a.e2e-test-navbar-get-involved-menu-school-and-organizations-button';
const navbarGetInvolvedTabVolunteerButton =
  'a.e2e-test-navbar-get-involved-menu-volunteer-button';
const navbarGetInvolvedTabDonateButton =
  'a.e2e-test-navbar-get-involved-menu-donate-button';
const navbarGetInvolvedTabContactUsButton =
  'a.e2e-test-navbar-get-involved-menu-contact-us-button';
const navbarDonateButton = 'a.e2e-test-navbar-donate-button';

const browseOurLessonsButton = '.e2e-test-about-page-browse-our-lessons-button';
const accessAndroidAppButton = '.e2e-test-about-page-access-android-app-button';
const visitClassroomButton = '.e2e-test-about-page-visit-classroom-button';
const browseLibraryButton = '.e2e-test-about-page-browse-library-button';
const createLessonsButton = '.e2e-test-about-page-create-lessons-button';
const exploreLessonsButton = '.e2e-test-about-page-explore-lessons-button';

const aboutFoundationClass = '.oppia-about-foundation-hero-content h1';
const millionsOfContentId =
  '.e2e-test-about-foundation-page-millions-of-content';
const weCannotContentId = '.e2e-test-about-foundation-page-we-cannot-content';
const sourceUnescoButton =
  'a.e2e-test-about-foundation-page-source-unesco-button';
const learnMoreAboutOppiaButton =
  '.e2e-test-about-foundation-page-learn-more-about-oppia-button';
const becomeAVolunteerButton =
  '.e2e-test-about-foundation-page-become-a-volunteer-button';
const sectionSixPart1 = '.e2e-test-about-foundation-page-section-six-part-1';
const sectionSixPart2 = '.e2e-test-about-foundation-page-section-six-part-2';
const sectionSixPart3 = '.e2e-test-about-foundation-page-section-six-part-3';

const watchAVideoButton =
  'a.e2e-test-thanks-for-donating-page-watch-a-video-button';
const readOurBlogButton =
  'a.e2e-test-thanks-for-donating-page-read-our-blog-button';
const dismissButton = 'i.e2e-test-thanks-for-donating-page-dismiss-button';
const thanksForDonatingClass = '.modal-open';
const donatePage = '.modal-backdrop.fade';

const createExplorationButton = 'button.e2e-test-create-new-exploration-button';
const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const textStateEditSelector = 'div.e2e-test-state-edit-content';
const richTextAreaField = 'div.e2e-test-rte';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const interactionEndExplorationInputButton =
  'div.e2e-test-interaction-tile-EndExploration';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const saveChangesButton = 'button.e2e-test-save-changes';
const saveDraftButton = 'button.e2e-test-save-draft-button';
const publishExplorationButton = 'button.e2e-test-publish-exploration';
const explorationTitleInput = 'input.e2e-test-exploration-title-input-modal';
const explorationGoalInput = 'input.e2e-test-exploration-objective-input-modal';
const explorationCategoryDropdown =
  'mat-form-field.e2e-test-exploration-category-metadata-modal';
const saveExplorationChangesButton = 'button.e2e-test-confirm-pre-publication';
const explorationConfirmPublishButton = 'button.e2e-test-confirm-publish';
const explorationIdElement = 'span.oppia-unique-progress-id';
const saveContentButton = 'button.e2e-test-save-state-content';

const explorationNameInput = 'input.e2e-test-search-input';
const communityExplorationCard = '.e2e-test-exploration-dashboard-card';
const communityLessonsTabButton = '.e2e-test-community-lessons-section';
const playLaterExplorationCard = '.e2e-test-exploration-dashboard-card';
const confirmRemoveButton = '.e2e-test-confirm-delete-interaction';
const playLaterExplorationCardTitle =
  '.oppia-exploration-dashboard-card .activity-title';
const explorationCompletionToast = '.e2e-test-lesson-completion-message';
const reportExplorationButton = '.e2e-test-report-exploration-button';
const reportOtherOptionSelector =
  '.oppia-flag-modal-long-text:nth-child(3) input';
const reportTextArea = '.e2e-test-report-exploration-text-area';
const explorationFeedbackButton = '.e2e-test-exploration-feedback-popup-link';
const feedbackTextArea = '.e2e-test-exploration-feedback-textarea';

export class LoggedInUser extends BaseUser {
  /**
   * Function to navigate to the home page.
   */
  async navigateToHome(): Promise<void> {
    await this.goto(homeUrl);
  }

  /**
   * Function to navigate to the about page.
   */
  async navigateToAboutPage(): Promise<void> {
    await this.goto(aboutUrl);
  }

  /**
   * Function to navigate to the about foundation page.
   */
  async navigateToAboutFoundationPage(): Promise<void> {
    await this.goto(aboutFoundationUrl);
  }

  /**
   * Function to navigate to the Thanks for Donating page.
   */
  async navigateToThanksForDonatingPage(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.goto(thanksForDonatingUrl),
    ]);
  }

  /**
   * Function to click a button and check if it opens the expected destination.
   */
  async clickButtonToNavigateToNewPage(
    button: string,
    buttonName: string,
    expectedDestinationPageUrl: string,
    expectedDestinationPageName: string
  ): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation(),
      await this.clickOn(button),
    ]);
    if (this.page.url() !== expectedDestinationPageUrl) {
      throw new Error(
        'The ' +
          buttonName +
          ' does not open the ' +
          expectedDestinationPageName +
          ' page!'
      );
    } else {
      showMessage(
        'The ' +
          buttonName +
          ' opens the ' +
          expectedDestinationPageName +
          ' page.'
      );
    }
  }

  /**
   * Function to click the About button in the About Menu on navbar
   * and check if it opens the About page.
   */
  async clickAboutButtonInAboutMenuOnNavbar(): Promise<void> {
    await this.clickOn(navbarAboutTab);
    await this.clickButtonToNavigateToNewPage(
      navbarAboutTabAboutButton,
      'About Oppia button in the About Menu on navbar',
      aboutUrl,
      'About'
    );
  }

  /**
   * Function to click the Browse Our Lessons button in the About page
   * and check if it opens the Math Classroom page.
   */
  async clickBrowseOurLessonsButtonInAboutPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      browseOurLessonsButton,
      'Browse Our Lessons button',
      mathClassroomUrl,
      'Math Classroom'
    );
  }

  /**
   * Function to click the Access Android App button in the About page
   * and check if it opens the Android page.
   */
  async clickAccessAndroidAppButtonInAboutPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      accessAndroidAppButton,
      'Access the Android App button',
      androidUrl,
      'Android'
    );
  }

  /**
   * Function to click the Visit Classroom button in the About page
   * and check if it opens the Math Classroom page.
   */
  async clickVisitClassroomButtonInAboutPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      visitClassroomButton,
      'Visit Classroom button',
      mathClassroomUrl,
      'Math Classroom'
    );
  }

  /**
   * Function to click the Browse Library button in the About page
   * and check if it opens the Community Library page.
   */
  async clickBrowseLibraryButtonInAboutPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      browseLibraryButton,
      'Browse Library button',
      communityLibraryUrl,
      'Community Library'
    );
  }

  /**
   * Function to click the Browse Our Lessons button in the About page
   * and check if it opens the Creator Dashboard page in Create Mode.
   */
  async clickCreateLessonsButtonInAboutPage(): Promise<void> {
    await this.clickOn(createLessonsButton);
    if (this.page.url() !== creatorDashboardCreateModeUrl) {
      throw new Error(
        'The Create Lessons button does not open the Creator Dashboard ' +
          'in Create Mode!'
      );
    } else {
      showMessage(
        'The Create Lessons button opens the Creator Dashboard ' +
          'in Create Mode.'
      );
    }
    await this.page.waitForNavigation();
    const urlRegex =
      /http:\/\/localhost:8181\/create\/\w*(\/gui\/Introduction)?/;
    if (this.page.url().match(urlRegex) === null) {
      throw new Error(
        'The Create Lessons button does not display ' +
          'the Exploration Editor page!'
      );
    } else {
      showMessage(
        'The Create Lessons button displays the Exploration Editor page.'
      );
    }
  }

  /**
   * Function to click the Browse Our Lessons button in the About page
   * and check if it opens the Math Classroom page.
   */
  async clickExploreLessonsButtonInAboutPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      exploreLessonsButton,
      'Explore Lessons button',
      mathClassroomUrl,
      'Math Classroom'
    );
  }

  /**
   * Function to click the The Oppia Foundation button in the About Menu
   * on navbar and check if it opens The About Foundation page.
   */
  async clickAboutFoundationButtonInAboutMenuOnNavbar(): Promise<void> {
    await this.clickOn(navbarAboutTab);
    await this.clickOn(navbarAboutTabAboutFoundationButton);
    await this.page.waitForSelector(aboutFoundationClass);
    const displayedH1 = await this.page.$eval(
      aboutFoundationClass,
      element => (element as HTMLElement).innerText
    );
    if (
      this.page.url() !== aboutFoundationUrl &&
      displayedH1 !== 'THE OPPIA FOUNDATION'
    ) {
      throw new Error(
        'The Oppia Foundation button in About Menu on navbar ' +
          'does not open the About Foundation page!'
      );
    } else {
      showMessage(
        'The Oppia Foundation button in About Menu on navbar ' +
          'opens the About Foundation page.'
      );
    }
  }

  /**
   * Function to click the 61 million children link
   * in the About Foundation page and check if it opens the right page.
   */
  async click61MillionChildrenLinkInAboutFoundation(): Promise<void> {
    await this.page.waitForSelector(millionsOfContentId);
    const buttonText = await this.page.$eval(
      millionsOfContentId,
      element => element.getElementsByTagName('a')[0].textContent
    );

    if (buttonText !== '61 million children') {
      throw new Error('The 61 Million Children button does not exist!');
    }
    await this.page.$eval(millionsOfContentId, element =>
      element.getElementsByTagName('a')[0].click()
    );
    if (this.page.url() !== _61MillionChildrenUrl) {
      throw new Error(
        'The 61 Million Children link does not open the right page!'
      );
    } else {
      showMessage('The 61 Million Children link opens the right page.');
    }
  }
  /**
   * Function to click the even those who are in school link
   * in the About Foundation page and check if it opens the right page.
   */
  async clickEvenThoseWhoAreInSchoolLinkInAboutFoundation(): Promise<void> {
    await this.page.waitForSelector(millionsOfContentId);
    const anchorElementSelector = `${millionsOfContentId} a:nth-child(2)`;
    const buttonText = await this.page.$eval(
      anchorElementSelector,
      element => element.textContent
    );
    if (buttonText !== 'even those who are in school') {
      throw new Error(
        'The Even Those Who Are In School button does not exist!'
      );
    }
    await this.openExternalPdfLink(
      anchorElementSelector,
      evenThoseWhoAreInSchoolUrl
    );
    showMessage('The Even Those Who Are In School link opens the right page.');
  }

  /**
   * Function to click the Source: UNESCO link in the About Foundation page
   * and check if it opens the right page.
   */
  async clickSourceUnescoLinkInAboutFoundation(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      sourceUnescoButton,
      'Source: UNESCO link',
      sourceUnescoUrl,
      'right'
    );
  }

  /**
   * Function to click the 420 million link
   * in the About Foundation page and check if it opens the right page.
   */
  async click420MillionLinkInAboutFoundation(): Promise<void> {
    await this.page.waitForSelector(weCannotContentId);
    const buttonText = await this.page.$eval(
      weCannotContentId,
      element => element.getElementsByTagName('a')[0].textContent
    );
    if (buttonText !== '420 million') {
      throw new Error('The 420 Million link does not exist!');
    }
    await this.page.$eval(weCannotContentId, element =>
      element.getElementsByTagName('a')[0].click()
    );
    if (this.page.url() !== _420MillionUrl) {
      throw new Error('The 420 Million link does not open the right page!');
    } else {
      showMessage('The 420 Million link opens the right page.');
    }
  }

  /**
   * Function to click the Learn More About Oppia button
   * in the About Foundation page and check if it opens the About page.
   */
  async clickLearnMoreAboutOppiaButtonInAboutFoundation(): Promise<void> {
    await this.clickOn(learnMoreAboutOppiaButton);
    const newTab = await this.browserObject.waitForTarget(
      target => target.url() === aboutUrl
    );
    if (newTab.url() !== aboutUrl) {
      throw new Error(
        'The Learn More About Oppia button does not open the About page!'
      );
    } else {
      showMessage('The Learn More About Oppia button opens the About page.');
    }
  }

  /**
   * Function to click the Become A Volunteer button
   * in the About Foundation page and check if it opens the Volunteer page.
   */
  async clickBecomeAVolunteerButtonInAboutFoundation(): Promise<void> {
    await this.clickOn(becomeAVolunteerButton);
    const newTab = await this.browserObject.waitForTarget(
      target => target.url() === volunteerUrl
    );
    if (newTab.url() !== volunteerUrl) {
      throw new Error(
        'The Become A Volunteer button does not open the Volunteer page!'
      );
    } else {
      showMessage('The Become A Volunteer button opens the Volunteer page.');
    }
  }

  /**
   * Function to click the Consider Becoming A Partner Today! link
   * in the About Foundation page and check if it opens the Partnerships page.
   */
  async clickConsiderBecomingAPartnerTodayLinkInAboutFoundation(): Promise<void> {
    await this.page.waitForSelector(sectionSixPart1);
    const buttonText = await this.page.$eval(
      sectionSixPart1,
      element => element.getElementsByTagName('a')[0].textContent
    );
    if (buttonText !== 'Consider becoming a partner today!') {
      throw new Error(
        'The Consider becoming a partner today! link does not exist!'
      );
    }
    await this.page.$eval(sectionSixPart1, element =>
      element.getElementsByTagName('a')[0].click()
    );
    if (this.page.url() !== partnershipsUrl) {
      throw new Error(
        'The Consider becoming a partner today! link does not open ' +
          'the Partnerships page!'
      );
    } else {
      showMessage(
        'The Consider becoming a partner today! link opens ' +
          'the Partnerships page.'
      );
    }
  }

  /**
   * Function to click the Join our large volunteer community! link
   * in the About Foundation page and check if it opens the Volunteer page.
   */
  async clickJoinOurLargeVolunteerCommunityLinkInAboutFoundation(): Promise<void> {
    await this.page.waitForSelector(sectionSixPart2);
    const buttonText = await this.page.$eval(
      sectionSixPart2,
      element => element.getElementsByTagName('a')[0].textContent
    );
    if (buttonText !== 'Join our large volunteer community!') {
      throw new Error(
        'The Join our large volunteer community! link does not exist!'
      );
    }
    await this.page.$eval(sectionSixPart2, element =>
      element.getElementsByTagName('a')[0].click()
    );
    if (this.page.url() !== volunteerUrl) {
      throw new Error(
        'The Join our large volunteer community! link does not open ' +
          'the Volunteer page!'
      );
    } else {
      showMessage(
        'The Join our large volunteer community! link opens ' +
          'the Volunteer page.'
      );
    }
  }

  /**
   * Function to click the donations link
   * in the About Foundation page and check if it opens the Donate page.
   */
  async clickDonationsLinkInAboutFoundation(): Promise<void> {
    await this.page.waitForSelector(sectionSixPart3);
    const buttonText = await this.page.$eval(
      sectionSixPart3,
      element => element.getElementsByTagName('a')[0].textContent
    );
    if (buttonText !== 'donations') {
      throw new Error('The donations link does not exist!');
    }
    await this.page.$eval(sectionSixPart3, element =>
      element.getElementsByTagName('a')[0].click()
    );
    if (this.page.url() !== donateUrl) {
      throw new Error('The donations link does not open the Donate page!');
    } else {
      showMessage('The donations link opens the Donate page.');
    }
  }

  /**
   * Function to click the Blog button in the About Menu on navbar
   * and check if it opens the Blog page.
   */
  async clickBlogButtonInAboutMenuOnNavbar(): Promise<void> {
    await this.clickOn(navbarAboutTab);
    await this.clickButtonToNavigateToNewPage(
      navbarAboutTabBlogButton,
      'Blog button in the About Menu on navbar',
      blogUrl,
      'Blog'
    );
  }

  /**
   * Function to click the School and Organizations button in the
   * Get Involved Menu on navbar and check if it opens the Partnerships page.
   */
  async clickPartnershipsButtonInGetInvolvedMenuOnNavbar(): Promise<void> {
    await this.clickOn(navbarGetInvolvedTab);
    await this.clickButtonToNavigateToNewPage(
      navbarGetInvolvedTabSchoolAndOrganizationsButton,
      'School and Organizations in the Get Involved Menu on navbar',
      partnershipsUrl,
      'Partnerships'
    );
  }

  /**
   * Function to click the Volunteer button in the Get Involved Menu
   * on navbar and check if it opens the Volunteer page.
   */
  async clickVolunteerButtonInGetInvolvedMenuOnNavbar(): Promise<void> {
    await this.clickOn(navbarGetInvolvedTab);
    await this.clickButtonToNavigateToNewPage(
      navbarGetInvolvedTabVolunteerButton,
      'Volunteer button in the Get Involved Menu on navbar',
      volunteerUrl,
      'Volunteer'
    );
  }

  /**
   * Function to click the Donate button in the Get Involved Menu
   * on navbar and check if it opens the Donate page.
   */
  async clickDonateButtonInGetInvolvedMenuOnNavbar(): Promise<void> {
    await this.clickOn(navbarGetInvolvedTab);
    await this.clickButtonToNavigateToNewPage(
      navbarGetInvolvedTabDonateButton,
      'Donate button in the Get Involved Menu on navbar',
      donateUrl,
      'Donate'
    );
  }

  /**
   * Function to click the Contact Us button in the Get Involved Menu
   * on navbar and check if it opens the Partnerships page.
   */
  async clickContactUsButtonInGetInvolvedMenuOnNavbar(): Promise<void> {
    await this.clickOn(navbarGetInvolvedTab);
    await this.clickButtonToNavigateToNewPage(
      navbarGetInvolvedTabContactUsButton,
      'Contact Us button in the Get Involved Menu on navbar',
      contactUrl,
      'Contact'
    );
  }

  /**
   * Function to click the Donate button on navbar
   * and check if it opens the Donate page.
   */
  async clickDonateButtonOnNavbar(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      navbarDonateButton,
      'Donate button on navbar',
      donateUrl,
      'Donate'
    );
  }

  /**
   * Function to click the Watch A Video button
   * in the Thanks for Donating page and check if it opens the right page.
   */
  async clickWatchAVideoButtonInThanksForDonatingPage(): Promise<void> {
    await this.page.waitForSelector(watchAVideoButton);
    const buttonText = await this.page.$eval(
      watchAVideoButton,
      element => (element as HTMLElement).innerText
    );
    if (buttonText !== 'Watch a video') {
      throw new Error('The Watch A Video button does not exist!');
    }
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickOn(watchAVideoButton),
    ]);
    if (this.page.url() !== watchAVideoUrl) {
      throw new Error('The Watch A Video button does not open the right page!');
    } else {
      showMessage('The Watch A Video button opens the right page.');
    }
  }

  /**
   * Function to click the Read Our Blog button
   * in the Thanks for Donating page and check if it opens the Blog page.
   */
  async clickReadOurBlogButtonInThanksForDonatingPage(): Promise<void> {
    await this.page.waitForSelector(readOurBlogButton);
    const buttonText = await this.page.$eval(
      readOurBlogButton,
      element => (element as HTMLElement).innerText
    );
    if (buttonText !== 'Read our blog') {
      throw new Error('The Read Our Blog button does not exist!');
    }
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickOn(readOurBlogButton),
    ]);
    if (this.page.url() !== blogUrl) {
      throw new Error('The Read Our Blog button does not open the Blog page!');
    } else {
      showMessage('The Read Our Blog button opens the Blog page.');
    }
  }

  /**
   * Function for navigating to the creator dashboard page.
   */
  async navigateToCreatorDashboardPage(): Promise<void> {
    await this.goto(creatorDashboardUrl);
  }

  /**
   * Function for navigating to the learner dashboard page.
   */
  async navigateToLearnerDashboardPage(): Promise<void> {
    await this.goto(learnerDashboardUrl);
  }

  /**
   * Function for navigating to the learner dashboard page.
   */
  async openCommunityLessonsTab(): Promise<void> {
    if (this.page.url() !== learnerDashboardUrl) {
      await this.goto(learnerDashboardUrl);
    }
    await this.page.click(communityLessonsTabButton);
    await this.page.waitForSelector('h1.lessons-title');
  }

  /**
   * Function for navigating to the creator dashboard page.
   */
  async navigateToCommunityLibraryPage(): Promise<void> {
    await this.goto(communityLibraryUrl);
  }

  /**
   * Function for opening an exploration from the community library page.
   */
  async searchAndOpenExplorationFromCommunityLibrary(
    explorationName: string
  ): Promise<void> {
    if (this.page.url() !== communityLibraryUrl) {
      await this.navigateToCommunityLibraryPage();
    }
    await this.findExplorationInCommunityLibrary(explorationName);
    await this.page.click(communityExplorationCard);
    await this.page.waitForNavigation();
  }

  /**
   * This function checks whether we have completed an exploration or not.
   */
  async expectReachedTheEndOfExploration(): Promise<void> {
    await this.page.waitForSelector(explorationCompletionToast);
  }

  /**
   * Function for reporting an exploration.
   */
  async reportTheExploration(reportMessage: string): Promise<void> {
    await this.page.click(reportExplorationButton);
    await this.page.waitForSelector('.modal-content');
    await this.page.click(reportOtherOptionSelector);
    await this.page.waitForSelector(reportTextArea);
    await this.type(reportTextArea, reportMessage);
    await this.page.click('.e2e-test-submit-report-button');
    await this.page.waitForSelector('.modal-content');
    await this.page.click(
      'oppia-exploration-successfully-flagged-modal button'
    );
    await this.page.waitForTimeout(500);
  }

  /**
   * Function for giving feedback for an exploration.
   */
  async giveFeedbackToExploration(feedbackMessage: string): Promise<void> {
    await this.page.click(explorationFeedbackButton);
    await this.type(feedbackTextArea, feedbackMessage);
    await this.page.click('.e2e-test-exploration-feedback-submit-btn');
    await this.page.waitForSelector('ngb-popover-window');
  }

  /**
   * This function checks whether explorations with the given title are present in the Play Later.
   */
  async expectExplorationWithTitleToBePresentInPlayLater(
    title: string,
    shouldBePresent: boolean
  ): Promise<void> {
    const allExplorations = await this.page.$$(playLaterExplorationCard);

    if (!shouldBePresent) {
      if (allExplorations.length > 0) {
        throw new Error('There are some explorations present in Play Later');
      } else {
        showMessage(
          `Exploration with title ${title} does not exists in Play Later`
        );
      }
      return;
    }

    if (allExplorations.length === 0) {
      throw new Error(
        `Exploration with title ${title} does not exist in play later`
      );
    }

    const explorationTitle = await allExplorations[0].$eval(
      playLaterExplorationCardTitle,
      element => (element as HTMLElement).innerText
    );

    if (explorationTitle === title) {
      showMessage(`Exploration with title ${title} exists in Play Later`);
    } else {
      throw new Error(
        `Exploration with title ${title} does not exist in play later`
      );
    }
  }

  /**
   * This function to add exploration to play later.
   */
  async addExplorationToPlayLater(): Promise<void> {
    await this.page.hover(communityExplorationCard);
    await this.page.click('.e2e-test-add-to-playlist-btn');
    await this.page.waitForSelector('.e2e-test-toast-message');
  }

  /**
   * This function to remove exploration from play later.
   */
  async removeExplorationFromPlayLater(): Promise<void> {
    await this.page.hover(playLaterExplorationCard);
    await this.page.click('.remove-icon');
    await this.page.waitForSelector(confirmRemoveButton);
    await this.page.click(confirmRemoveButton);
  }

  /**
   * Function for searching a exploration in community library page.
   */
  async findExplorationInCommunityLibrary(
    explorationName: string
  ): Promise<void> {
    await this.type(explorationNameInput, explorationName);
    await this.page.keyboard.press('Enter');
    await this.page.waitForSelector(communityExplorationCard);
  }
  /**
   * Function for checking whether user feedback is present or not.
   */
  async checkUserFeedback(username: string): Promise<void> {
    await this.page.click('.e2e-test-feedback-tab');
    await this.page.waitForSelector('.table');
    let feedbackFound = false;
    const tableData = await this.page.$$eval('.table tr', rows => {
      return Array.from(rows, row => {
        const columns = row.querySelectorAll('td');
        return Array.from(columns, column => column.innerText);
      });
    });

    tableData.forEach(row => {
      if (row[2] === username) {
        feedbackFound = true;
      }
    });

    if (feedbackFound) {
      showMessage(`User feedback by ${username} is present.`);
    } else {
      throw new Error(`User feedback by ${username} is not present.`);
    }
  }

  /**
   * Function to open the exploration editor for a given exploration title.
   */
  async openExplorationEditor(explorationTitle: string): Promise<void> {
    if (this.page.url() !== creatorDashboardUrl) {
      await this.navigateToCreatorDashboardPage();
    }

    const allExplorations = await this.page.$$('.oppia-activity-summary-tile');
    let explorationIndex = -1;

    for (let i = 0; i < allExplorations.length; i++) {
      let currentExplorationTitle = await allExplorations[i].$eval(
        '.e2e-test-exp-summary-tile-title',
        element => (element as HTMLElement).innerText
      );

      if (currentExplorationTitle === explorationTitle) {
        explorationIndex = i;
        break;
      }
    }

    if (explorationIndex === -1) {
      throw new Error(
        `Exploration with title ${explorationTitle} does not exists`
      );
    } else {
      await allExplorations[explorationIndex].click();
      await this.page.waitForNavigation();
    }
  }

  /**
   * Function for creating an exploration with only EndExploration interaction.
   */
  async createEndExploration(): Promise<string | null> {
    await this.navigateToCreatorDashboardPage();
    await this.clickOn(createExplorationButton);
    await this.page.waitForSelector(
      `${dismissWelcomeModalSelector}:not([disabled])`
    );
    await this.clickOn(dismissWelcomeModalSelector);
    /** Giving explicit timeout because we need to wait for small
     * transition to complete. We cannot wait for the next element to click
     * using its selector as it is instantly loaded in the DOM but cannot
     * be clicked until the transition is completed.
     */
    await this.page.waitForTimeout(500);
    await this.clickOn(textStateEditSelector);
    await this.page.waitForTimeout(500);
    await this.type(richTextAreaField, 'Test Exploration');
    await this.clickOn(saveContentButton);

    await this.clickOn(addInteractionButton);
    await this.clickOn(interactionEndExplorationInputButton);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(`${saveChangesButton}:not([disabled])`);
    await this.clickOn(saveChangesButton);
    await this.clickOn(saveDraftButton);

    await this.page.waitForSelector(
      `${publishExplorationButton}:not([disabled])`
    );
    await this.clickOn(publishExplorationButton);
    await this.type(explorationTitleInput, 'Test Exploration');
    await this.type(explorationGoalInput, 'Test Exploration');
    await this.clickOn(explorationCategoryDropdown);
    await this.clickOn('Algebra');
    await this.clickOn(saveExplorationChangesButton);
    await this.page.waitForSelector(
      `${publishExplorationButton}:not([disabled])`
    );
    await this.clickOn(publishExplorationButton);
    await this.clickOn(explorationConfirmPublishButton);
    await this.page.waitForSelector(explorationIdElement);
    const explorationIdUrl = await this.page.$eval(
      explorationIdElement,
      element => element.textContent
    );
    await this.page.click('.e2e-test-share-publish-close');
    return explorationIdUrl;
  }

  /**
   * Function to click the dismiss button in the Thanks for Donating page,
   * and check if the Thanks for Donating popup disappears
   * and if the Donate page is shown
   */
  async clickDismissButtonInThanksForDonatingPage(): Promise<void> {
    await this.clickOn(dismissButton);
    const thanksForDonatingHeader = await this.page.$(thanksForDonatingClass);
    if (thanksForDonatingHeader !== null) {
      throw new Error(
        'The dismiss button does not close the Thanks for Donating popup!'
      );
    }
    const donatePageShowed = await this.page.$(donatePage);
    if (donatePageShowed === null) {
      throw new Error('The dismiss button does not show the Donate page!');
    } else {
      showMessage(
        'The dismiss button closes the Thanks for Donating popup ' +
          'and if the Donate page is shown.'
      );
    }
  }
}

export let LoggedInUserFactory = (): LoggedInUser => new LoggedInUser();
