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
const desktopWatchAVideoUrl = testConstants.URLs.DesktopExternalLinkWatchAVideo;
const mobileWatchAVideoUrl = testConstants.URLs.MobileExternalLinkWatchAVideo;
const getStartedUrl = testConstants.URLs.GetStarted;
const welcomeToOppiaUrl = testConstants.URLs.WelcomeToOppia;
const electromagnetismUrl = testConstants.URLs.Electromagnetism;
const programmingWithCarlaUrl = testConstants.URLs.ProgrammingWithCarla;
const creatingAnExplorationUrl = testConstants.URLs.CreatingAnExploration;
const embeddingAnExplorationUrl = testConstants.URLs.EmbeddingAnExploration;
const creatorGuidelinesUrl = testConstants.URLs.CreatorGuidelines;
const teachUrl = testConstants.URLs.Teach;
const termsUrl = testConstants.URLs.Terms;
const privacyPolicyUrl = testConstants.URLs.PrivacyPolicy;
const googleGroupsOppiaUrl = testConstants.URLs.GoogleGroups.Oppia;
const googleGroupsOppiaAnnouceUrl =
  testConstants.URLs.GoogleGroups.OppiaAnnounce;
const learnerDashboardUrl = testConstants.URLs.LearnerDashboard;
const allAboutCookiesUrl = testConstants.URLs.ExternalLink.AboutCookies;
const googleAnalyticsPartnerPoliciesUrl =
  testConstants.URLs.GoogleAnalytics.PartnerPolicies;
const googleAnalyticsOptOutUrl = testConstants.URLs.GoogleAnalytics.OptOut;

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

const footerAboutLink = 'a.e2e-test-footer-about-link';
const footerAboutFoundationLink = 'a.e2e-test-footer-about-foundation-link';
const footerBlogLink = 'a.e2e-test-footer-blog-link';
const footerForumlink = 'a.e2e-test-footer-forum-link';
const footerGetStartedLink = 'a.e2e-test-get-started-link';
const footerCreatorGuidelinesLink = 'a.e2e-test-creator-guidelines-link';
const footerTeachLink = 'a.e2e-test-teach-link';
const footerTermsLink = 'a.e2e-test-terms-link';
const footerPrivacyPolicyLink = 'a.e2e-test-privacy-policy-link';
const footerCommunityLibraryLink = 'a.e2e-test-community-library-link';
const footerContactUsLink = 'a.e2e-test-contact-link';

const oppiaYouTubeLinkIcon = '.oppia-youtube-follow';
const oppiaFacebookLinkIcon = '.oppia-facebook-follow';
const oppiaInstagramLinkIcon = '.oppia-instagram-follow';
const oppiaTwitterLinkIcon = '.oppia-twitter-follow';
const oppiaGithubLinkIcon = '.oppia-github-follow';
const oppiaLinkedInLinkIcon = '.oppia-linkedin-follow';

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
const donatePage = '.donate-content-container';

const mobileNavbarOpenSidebarButton = 'a.e2e-mobile-test-navbar-button';
const mobileSidebarAboutButton = 'a.e2e-mobile-test-sidebar-about-button';
const mobileSidebarAboutFoundationButton =
  'a.e2e-mobile-test-sidebar-about-foundation-button';
const mobileSidebarExpandGetInvolvedMenuButton =
  'div.e2e-mobile-test-sidebar-expand-get-involved-menu';
const mobileSidebarGetInvolvedMenuPartnershipsButton =
  'a.e2e-mobile-test-sidebar-get-involved-menu-partnerships-button';
const mobileSidebarGetInvolvedMenuVolunteerButton =
  'a.e2e-mobile-test-sidebar-get-involved-menu-volunteer-button';
const mobileSidevbarGetInvolvedMenuDonateButton =
  'a.e2e-mobile-test-sidebar-get-involved-menu-donate-button';
const mobileSidebarGetInvolvedMenuContactUsButton =
  'a.e2e-mobile-test-sidebar-get-involved-menu-contact-us-button';

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
   * Function to navigate to the Get Started page.
   */
  async navigateToGetStartedPage(): Promise<void> {
    await this.goto(getStartedUrl);
  }

  /**
   * Function to navigate to the Creator Guidelines page.
   */
  async clickOnCreatorGuidelinesLinkinFooter(): Promise<void> {
    await this.goto(creatorGuidelinesUrl);
  }

  /**
   * Function to navigate to the Teach page.
   */
  async navigateToTeachPage(): Promise<void> {
    await this.goto(teachUrl);
  }

  /**
   * Function to navigate to the Terms page.
   */
  async navigateToTermsPage(): Promise<void> {
    await this.goto(termsUrl);
  }

  /**
   * Function to navigate to the Privacy Policy page.
   */
  async navigateToPrivacyPolicyPage(): Promise<void> {
    await this.goto(privacyPolicyUrl);
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
    await Promise.all([this.page.waitForNavigation(), this.clickOn(button)]);

    expect(this.page.url())
      .withContext(
        `${buttonName} should open the ${expectedDestinationPageName} page`
      )
      .toBe(expectedDestinationPageUrl);
  }

  /**
   * Function to click the About button in the About Menu on navbar
   * and check if it opens the About page.
   */
  async clickAboutButtonInAboutMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarOpenSidebarButton);
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarAboutButton,
        'About Oppia button in the About Menu on mobile sidebar',
        aboutUrl,
        'About'
      );
    } else {
      await this.clickOn(navbarAboutTab);
      await this.clickButtonToNavigateToNewPage(
        navbarAboutTabAboutButton,
        'About Oppia button in the About Menu on navbar',
        aboutUrl,
        'About'
      );
    }
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
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarOpenSidebarButton);
      await this.clickOn(mobileSidebarAboutFoundationButton);
    } else {
      await this.clickOn(navbarAboutTab);
      await this.clickOn(navbarAboutTabAboutFoundationButton);
    }
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
    if (!this.isViewportAtMobileWidth()) {
      await this.clickOn(navbarAboutTab);
      await this.clickButtonToNavigateToNewPage(
        navbarAboutTabBlogButton,
        'Blog button in the About Menu on navbar',
        blogUrl,
        'Blog'
      );
    }
  }

  /**
   * Function to click the School and Organizations button in the
   * Get Involved Menu on navbar and check if it opens the Partnerships page.
   */
  async clickPartnershipsButtonInGetInvolvedMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarOpenSidebarButton);
      await this.clickOn(mobileSidebarExpandGetInvolvedMenuButton);
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarGetInvolvedMenuPartnershipsButton,
        'School and Organizations in the Get Involved Menu on mobile sidebar',
        partnershipsUrl,
        'Partnerships'
      );
    } else {
      await this.clickOn(navbarGetInvolvedTab);
      await this.clickButtonToNavigateToNewPage(
        navbarGetInvolvedTabSchoolAndOrganizationsButton,
        'School and Organizations in the Get Involved Menu on navbar',
        partnershipsUrl,
        'Partnerships'
      );
    }
  }

  /**
   * Function to click the Volunteer button in the Get Involved Menu
   * on navbar and check if it opens the Volunteer page.
   */
  async clickVolunteerButtonInGetInvolvedMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarOpenSidebarButton);
      await this.clickOn(mobileSidebarExpandGetInvolvedMenuButton);
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarGetInvolvedMenuVolunteerButton,
        'Volunteer in the Get Involved Menu on mobile sidebar',
        volunteerUrl,
        'Volunteer'
      );
    } else {
      await this.clickOn(navbarGetInvolvedTab);
      await this.clickButtonToNavigateToNewPage(
        navbarGetInvolvedTabVolunteerButton,
        'Volunteer in the Get Involved Menu on navbar',
        volunteerUrl,
        'Volunteer'
      );
    }
  }

  /**
   * Function to click the Donate button in the Get Involved Menu
   * on navbar and check if it opens the Donate page.
   */
  async clickDonateButtonInGetInvolvedMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarOpenSidebarButton);
      await this.clickOn(mobileSidebarExpandGetInvolvedMenuButton);
      await this.clickButtonToNavigateToNewPage(
        mobileSidevbarGetInvolvedMenuDonateButton,
        'Donate in the Get Involved Menu on mobile sidebar',
        donateUrl,
        'Donate'
      );
    } else {
      await this.clickOn(navbarGetInvolvedTab);
      await this.clickButtonToNavigateToNewPage(
        navbarGetInvolvedTabDonateButton,
        'Donate in the Get Involved Menu on navbar',
        donateUrl,
        'Donate'
      );
    }
  }

  /**
   * Function to click the Contact Us button in the Get Involved Menu
   * on navbar and check if it opens the Partnerships page.
   */
  async clickContactUsButtonInGetInvolvedMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarOpenSidebarButton);
      await this.clickOn(mobileSidebarExpandGetInvolvedMenuButton);
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarGetInvolvedMenuContactUsButton,
        'Contact Us in the Get Involved Menu on mobile sidebar',
        contactUrl,
        'Contact'
      );
    } else {
      await this.clickOn(navbarGetInvolvedTab);
      await this.clickButtonToNavigateToNewPage(
        navbarGetInvolvedTabContactUsButton,
        'Contact Us in the Get Involved Menu on navbar',
        contactUrl,
        'Contact'
      );
    }
  }

  /**
   * Function to click the Donate button on navbar
   * and check if it opens the Donate page.
   */
  async clickDonateButtonOnNavbar(): Promise<void> {
    if (!this.isViewportAtMobileWidth()) {
      await this.clickButtonToNavigateToNewPage(
        navbarDonateButton,
        'Donate button on navbar',
        donateUrl,
        'Donate'
      );
    }
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

    const url = this.getCurrentUrlWithoutParameters();
    const expectedWatchAVideoUrl = this.isViewportAtMobileWidth()
      ? mobileWatchAVideoUrl
      : desktopWatchAVideoUrl;
    if (url !== expectedWatchAVideoUrl) {
      throw new Error('The Watch A Video button does not open the right page!');
    }
    showMessage('The Watch A Video button opens the right page.');
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
   * Function to click the dismiss button in the Thanks for Donating page,
   * and check if the Thanks for Donating popup disappears
   * and if the Donate page is shown
   */
  async clickDismissButtonInThanksForDonatingPage(): Promise<void> {
    await this.clickOn(dismissButton);
    await this.page.waitForSelector(thanksForDonatingClass, {hidden: true});
    const thanksForDonatingHeader = await this.page.$(thanksForDonatingClass);
    if (thanksForDonatingHeader !== null) {
      throw new Error(
        'The dismiss button does not close the Thanks for Donating popup!'
      );
    }
    await this.page.waitForSelector(donatePage);
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

  /**
   * Navigates to the About page using the oppia website footer.
   */
  async clickOnAboutLinkInFooter(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      footerAboutLink,
      'About Oppia link in the About Oppia section in the footer',
      aboutUrl,
      'About'
    );
  }
  /**
   * Navigates to the About Foundation page using the oppia website footer.
   */
  async clickOnTheOppiaFoundationLinkInFooter(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      footerAboutFoundationLink,
      'About Foundation link in the About Oppia section in the footer',
      aboutFoundationUrl,
      'About Foundation'
    );
  }
  /**
   * Navigates to the Blog page using the oppia website footer.
   */
  async clickOnBlogLinkInFooter(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      footerBlogLink,
      'Blog link in the About Oppia section in the footer',
      blogUrl,
      'Blog'
    );
  }

  /**
   * Navigates to the Forum page using the oppia website footer.
   */
  async clickOnForumLinkInFooter(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation(),
      await this.clickOn(footerForumlink),
    ]);

    expect(this.page.url()).toBe(googleGroupsOppiaUrl);
  }

  /**
   * Navigates to the GetStarted page using the oppia website footer.
   */
  async clickOnGetStartedLinkInFooter(): Promise<void> {
    await this.page.waitForSelector(footerGetStartedLink);
    await this.clickButtonToNavigateToNewPage(
      footerGetStartedLink,
      'Get Started link in the footer',
      getStartedUrl,
      'Get Started'
    );
  }

  /**
   * Navigates to the GetStarted page using the oppia website footer.
   */
  async navigateToCreatorGuidelinesPageViaFooter(): Promise<void> {
    await this.page.waitForSelector(footerCreatorGuidelinesLink);
    await this.clickButtonToNavigateToNewPage(
      footerCreatorGuidelinesLink,
      'Creator Guidelines link in the footer',
      creatorGuidelinesUrl,
      'Creator Guidelines'
    );
  }

  /**
   * Navigates to the Teach page using the oppia website footer.
   */
  async clickOnForParentsSlashTeachersLinkInFooter(): Promise<void> {
    await this.page.waitForSelector(footerCreatorGuidelinesLink);
    await this.clickButtonToNavigateToNewPage(
      footerTeachLink,
      'For Parents/Teachers link in footer',
      teachUrl,
      'Oppia for Parents, Teachers, and Guardians'
    );
  }

  /**
   * Navigates to the Terms page using the oppia website footer.
   */
  async navigateToTermsPageViaFooter(): Promise<void> {
    await this.page.waitForSelector(footerCreatorGuidelinesLink);
    await this.clickButtonToNavigateToNewPage(
      footerTermsLink,
      'Terms of use link in footer',
      termsUrl,
      'Terms of Use'
    );
  }

  /**
   * Navigates to the Privacy Policy page using the oppia website footer.
   */
  async navigateToPrivacyPolicyPageViaFooter(): Promise<void> {
    await this.page.waitForSelector(footerCreatorGuidelinesLink);
    await this.clickButtonToNavigateToNewPage(
      footerPrivacyPolicyLink,
      'Privacy Policy link in the footer',
      privacyPolicyUrl,
      'Privacy Policy'
    );
  }

  /**
   * Navigates to the Community Library page using the oppia website footer.
   */
  async clickOnBrowseTheLibraryLinkInFooter(): Promise<void> {
    await this.page.waitForSelector(footerCreatorGuidelinesLink);
    await this.clickButtonToNavigateToNewPage(
      footerCommunityLibraryLink,
      'Browse the Library link in the footer',
      communityLibraryUrl,
      'Community Library'
    );
  }

  /**
   * Navigates to the Contact page using the oppia website footer.
   */
  async clickOnContactUsLinkInFooter(): Promise<void> {
    await this.page.waitForSelector(footerCreatorGuidelinesLink);
    await this.clickButtonToNavigateToNewPage(
      footerContactUsLink,
      'Contact Us link in the footer',
      contactUrl,
      'Contact'
    );
  }

  /**
   * Navigates to the Terms page using the oppia website footer.
   */
  async clickOnDonateLinkInFooter(): Promise<void> {
    await this.page.waitForXPath('(//a[contains(text(),"Donate")])');
    const [link] = await this.page.$x('(//a[contains(text(),"Donate")])');
    await Promise.all([this.page.waitForNavigation(), await link.click()]);

    expect(this.page.url()).toBe(donateUrl);
  }

  /**
   * Navigates to the Terms page using the oppia website footer.
   */
  async clickOnVolunteerLinkInFooter(): Promise<void> {
    await this.page.waitForXPath('(//a[contains(text(),"volunteer")])');
    const [link] = await this.page.$x('(//a[contains(text(),"volunteer")])');
    await Promise.all([this.page.waitForNavigation(), await link.click()]);

    expect(this.page.url()).toBe(volunteerUrl);
  }

  /**
   * Function to click an anchor tag and check if it opens the expected destination
   * in a new tab. Closes the tab afterwards.
   */
  private async clickLinkAnchorToNewTab(
    anchorInnerText: string,
    expectedDestinationPageUrl: string
  ): Promise<void> {
    await this.page.waitForXPath(`//a[contains(text(),"${anchorInnerText}")]`);
    const pageTarget = this.page.target();
    await this.clickOn(anchorInnerText);
    const newTarget = await this.browserObject.waitForTarget(
      target => target.opener() === pageTarget
    );
    const newTabPage = await newTarget.page();

    expect(newTabPage).toBeDefined();
    expect(newTabPage?.url()).toBe(expectedDestinationPageUrl);
    await newTabPage?.close();
  }

  /**
   * Clicks the link with the text "create on here" on the Get Stated page.
   */
  async clickCreateOneHereLinkOnGetStartedPage(): Promise<void> {
    await this.page.waitForXPath('//a[contains(text(),"create one here")]');
    const pageTarget = this.page.target();
    await this.clickOn('create one here');
    const newTarget = await this.browserObject.waitForTarget(
      target => target.opener() === pageTarget
    );
    const newTabPage = await newTarget.page();
    await newTabPage?.waitForNetworkIdle();

    expect(newTabPage?.url()).toContain(
      'https://accounts.google.com/lifecycle/steps/signup/name'
    );
    await newTabPage?.close();
  }

  /**
   * Clicks the link with the text "Welcome to Oppia" on the Get Stated page.
   */
  async clickWelcomeToOppiaLinkOnGetStartedPage(): Promise<void> {
    await this.clickLinkAnchorToNewTab('Welcome to Oppia', welcomeToOppiaUrl);
  }

  /**
   * Clicks the link with the text "Get Electrified!" on the Get Stated page.
   */
  async clickGetElectrifiedLinkOnGetStartedPage(): Promise<void> {
    await this.clickLinkAnchorToNewTab('Get Electrified!', electromagnetismUrl);
  }

  /**
   * Clicks the link with the text "Programming with Carla" on the Get Stated page.
   */
  async clickProgrammingWithCarlaLinkOnGetStartedPage(): Promise<void> {
    await this.clickLinkAnchorToNewTab(
      'Programming with Carla',
      programmingWithCarlaUrl
    );
  }

  /**
   * Clicks the link with the text "in our user documentation" on the Get Stated page.
   */
  async clickInOurUserDocumentationLinkOnGetStartedPage(): Promise<void> {
    await this.clickLinkAnchorToNewTab(
      'in our user documentation',
      creatingAnExplorationUrl
    );
  }

  /**
   * Clicks the link with the text "embed it in your own web page" on the Get Stated page.
   */
  async clickEmbedItInYourOwnWebPageLinkOnGetStartedPage(): Promise<void> {
    await this.clickLinkAnchorToNewTab(
      'embed it in your own web page',
      embeddingAnExplorationUrl
    );
  }

  /**
   * Clicks the link with the text "discover more ways to get involved" on the Get Stated page.
   */
  async clickDiscoverMoreWaysToGetInvolvedLinkOnGetStartedPage(): Promise<void> {
    await this.page.waitForXPath(
      '//a[contains(text(),"discover more ways to get involved")]'
    );
    await Promise.all([
      this.page.waitForNavigation(),
      await this.clickOn('discover more ways to get involved'),
    ]);

    expect(this.page.url()).toBe(contactUrl);
  }

  /**
   * Clicks the link with the text "forum" on the Creator Guidelines page.
   */
  async clickForumLinkOnCreatorGuidelinesPage(): Promise<void> {
    await this.page.waitForXPath('//a[contains(text(),"forum")]');
    await Promise.all([this.page.waitForNavigation(), this.clickOn('forum')]);
    await this.page.waitForNetworkIdle();

    expect(this.page.url()).toBe(googleGroupsOppiaUrl);
  }

  /**
   * Clicks the link with the text "Design Tips" on the Creator Guidelines page.
   */
  async clickDesignTipsLinkOnCreatorGuidelinesPage(): Promise<void> {
    await this.page.waitForXPath('//a[contains(text(),"Design Tips")]');

    await Promise.all([
      this.page.waitForNavigation(),
      await this.clickOn('Design Tips'),
    ]);

    expect(this.page.url()).toBe('http://oppia.github.io/#/DesignTips');
  }

  /**
   * Clicks the link with the text "Create an Exploration" on the Creator Guidelines page.
   */
  async clickCreateAnExplorationLinkOnCreatorGuidelinesPage(): Promise<void> {
    await this.page.waitForXPath(
      '//a[contains(text(),"Create an Exploration")]'
    );

    await Promise.all([
      this.page.waitForNavigation(),
      await this.clickOn('Create an Exploration'),
    ]);

    expect(this.page.url()).toBe(
      'http://localhost:8181/creator-dashboard?mode=create'
    );
  }

  /**
   * Clicks the link with the text "Browse our Expectations" on the Creator Guidelines page.
   */
  async clickBrowseOurExpectationsLinkOnCreatorGuidelinesPage(): Promise<void> {
    await this.page.waitForXPath(
      '//a[contains(text(),"Browse our Explorations")]'
    );

    await Promise.all([
      this.page.waitForNavigation(),
      await this.clickOn('Browse our Explorations'),
    ]);

    expect(this.page.url()).toBe('http://localhost:8181/community-library');
  }

  /**
   * Clicks the link with the text "Browse out Lessons" on the Teach page.
   */
  async clickBrowseOurLessonsOnTeachPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'Browse our Lessons',
      'Creator Guidelines in the About Menu on navbar',
      mathClassroomUrl,
      'Creator Guidelines'
    );
  }

  /**
   * Clicks the link with the text "Access the Android app" on the Teach page.
   */
  async clickAccessTheAndroidAppOnTeachPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'Access the Android app',
      'Creator Guidelines in the About Menu on navbar',
      androidUrl,
      'Creator Guidelines'
    );
  }

  /**
   * Clicks the link with the text "VISIT CLASSROOM" on the Teach page.
   */
  async clickVisitClassroomOnTeachPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'VISIT CLASSROOM',
      'Creator Guidelines in the About Menu on navbar',
      mathClassroomUrl,
      'Creator Guidelines'
    );
  }

  /**
   * Clicks the link with the text "BROWSE LIBRARY" on the Teach page.
   */
  async clickBrowseLibraryOnTeachPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'BROWSE LIBRARY',
      'Creator Guidelines in the About Menu on navbar',
      communityLibraryUrl,
      'Creator Guidelines'
    );
  }

  /**
   * Clicks the link with the text "Explore Lessons" on the Teach page.
   */
  async clickExploreLessonsOnTeachPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'Explore lessons',
      'Creator Guidelines in the About Menu on navbar',
      mathClassroomUrl,
      'Creator Guidelines'
    );
  }

  /**
   * Clicks the link on the Terms page about the CC-BY-SA 4.0 license.
   */
  async clickLinkToLicenseOnTermsPage(): Promise<void> {
    await this.page.waitForXPath('(//a[contains(text(),"here")])[1]');
    const [link] = await this.page.$x('(//a[contains(text(),"here")])[1]');
    await Promise.all([this.page.waitForNavigation(), await link.click()]);

    expect(this.page.url()).toBe(
      'https://creativecommons.org/licenses/by-sa/4.0/legalcode'
    );
  }

  /**
   * Clicks the link on the Terms page that leads to the Oppia Announce google group.
   */
  async clickLinkToGoogleGroupOnTermsPage(): Promise<void> {
    await this.page.waitForXPath('(//a[contains(text(),"here")])[2]');
    const [link] = await this.page.$x('(//a[contains(text(),"here")])[2]');
    await Promise.all([this.page.waitForNavigation(), await link.click()]);

    expect(this.page.url()).toBe(googleGroupsOppiaAnnouceUrl);
  }

  /**
   * Clicks the link on the Privacy Policy page that goes to the home page.
   */
  async clickLinkToHomePageOnPrivacyPolicyPage(): Promise<void> {
    await this.page.waitForXPath(
      '//a[contains(text(),"https://www.oppia.org")]'
    );
    await Promise.all([
      this.page.waitForNavigation({waitUntil: 'networkidle0'}),
      this.clickOn('https://www.oppia.org'),
    ]);

    expect(this.page.url()).toBe(learnerDashboardUrl);
  }

  /**
   * Clicks the link to learn about cookies on the Privacy Policy page.
   */
  async clickLinkAboutCookiesOnPrivacyPolicyPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'http://www.allaboutcookies.org/manage-cookies/index.html',
      'Creator Guidelines in the About Menu on navbar',
      allAboutCookiesUrl,
      'Creator Guidelines'
    );
  }

  /**
   * Clicks the link to learn about Google Analytivs on the Privacy Policy page.
   */
  async clickLinkAboutGoogleAnalyticsOnPrivacyPolicyPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'https://www.google.com/policies/privacy/partners/',
      'Creator Guidelines in the About Menu on navbar',
      googleAnalyticsPartnerPoliciesUrl,
      'Creator Guidelines'
    );
  }

  /**
   * Clicks the link to opt out of cookies on the Privacy Policy page.
   */
  async clickLinkAboutGoogleAnalyticsOptOutOnPrivacyPolicyPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      googleAnalyticsOptOutUrl,
      'Creator Guidelines in the About Menu on navbar',
      googleAnalyticsOptOutUrl,
      'Creator Guidelines'
    );
  }

  /**
   * Click the speficed social icon and checks it's destination.
   *
   * Due to the somewhat unpredictable behaviors of these external sites,
   * such as sometimes redirecting to log-in pages,
   * we don't match the full url.
   */
  private async openSocialLinkInNewTabViaIcon(
    socialIconSelector: string,
    expectedDestinationDomain: string,
    expectedAccountId: string
  ): Promise<void> {
    await this.page.waitForSelector(socialIconSelector);
    const pageTarget = this.page.target();
    await this.clickOn(socialIconSelector);
    const newTarget = await this.browserObject.waitForTarget(
      target => target.opener() === pageTarget
    );
    const newTabPage = await newTarget.page();

    expect(newTabPage).toBeDefined();
    expect(newTabPage?.url()).toContain(expectedDestinationDomain);
    expect(newTabPage?.url()).toContain(expectedAccountId);
    await newTabPage?.close();
  }

  /**
   * Clicks the YouTube social icon in the footer.
   */
  async clickYouTubeIconInFooter(): Promise<void> {
    await this.openSocialLinkInNewTabViaIcon(
      oppiaYouTubeLinkIcon,
      testConstants.OppiaSocials.YouTube.Domain,
      testConstants.OppiaSocials.YouTube.Id
    );
  }

  /**
   * Clicks the Facebooksocial icon in the footer.
   */
  async clickFacebookIconInFooter(): Promise<void> {
    await this.openSocialLinkInNewTabViaIcon(
      oppiaFacebookLinkIcon,
      testConstants.OppiaSocials.FaceBook.Domain,
      testConstants.OppiaSocials.FaceBook.Id
    );
  }

  /**
   * Clicks the Instagram social icon in the footer.
   */
  async clickInstagramIconInFooter(): Promise<void> {
    await this.openSocialLinkInNewTabViaIcon(
      oppiaInstagramLinkIcon,
      testConstants.OppiaSocials.Instagram.Domain,
      testConstants.OppiaSocials.Instagram.Id
    );
  }

  /**
   * Clicks the Twitter social icon in the footer.
   */
  async clickTwitterIconInFooter(): Promise<void> {
    await this.openSocialLinkInNewTabViaIcon(
      oppiaTwitterLinkIcon,
      testConstants.OppiaSocials.Twitter.Domain,
      testConstants.OppiaSocials.Twitter.Id
    );
  }

  /**
   * Clicks the Github social icon in the footer.
   */
  async clickGithubIconInFooter(): Promise<void> {
    await this.openSocialLinkInNewTabViaIcon(
      oppiaGithubLinkIcon,
      testConstants.OppiaSocials.Github.Domain,
      testConstants.OppiaSocials.Github.Id
    );
  }

  /**
   * Clicks the LinkedIn social icon in the footer.
   */
  async clickLinkedInIconInFooter(): Promise<void> {
    await this.openSocialLinkInNewTabViaIcon(
      oppiaLinkedInLinkIcon,
      testConstants.OppiaSocials.LinkedIn.Domain,
      testConstants.OppiaSocials.LinkedIn.Id
    );
  }
}

export let LoggedInUserFactory = (): LoggedInUser => new LoggedInUser();
