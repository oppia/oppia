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

const VIEWPORT_WIDTH_BREAKPOINTS = testConstants.ViewportWidthBreakpoints;

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
    await Promise.all([this.page.waitForNavigation(), this.clickOn(button)]);
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
    if (this.viewport.width < VIEWPORT_WIDTH_BREAKPOINTS.MOBILE_PX) {
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
    if (this.viewport.width < VIEWPORT_WIDTH_BREAKPOINTS.MOBILE_PX) {
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
    const buttonText = await this.page.$eval(
      millionsOfContentId,
      element => element.getElementsByTagName('a')[1].textContent
    );
    if (buttonText !== 'even those who are in school') {
      throw new Error(
        'The Even Those Who Are In School button does not exist!'
      );
    }
    await this.page.$eval(millionsOfContentId, element =>
      element.getElementsByTagName('a')[1].click()
    );
    if (this.page.url() !== evenThoseWhoAreInSchoolUrl) {
      throw new Error(
        'The Even Those Who Are In School link does not open ' +
          'the right page!'
      );
    } else {
      showMessage(
        'The Even Those Who Are In School link opens the right page.'
      );
    }
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
    if (this.viewport.width >= VIEWPORT_WIDTH_BREAKPOINTS.MOBILE_PX) {
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
    if (this.viewport.width < VIEWPORT_WIDTH_BREAKPOINTS.MOBILE_PX) {
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
    if (this.viewport.width < VIEWPORT_WIDTH_BREAKPOINTS.MOBILE_PX) {
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
    if (this.viewport.width < VIEWPORT_WIDTH_BREAKPOINTS.MOBILE_PX) {
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
    if (this.viewport.width < VIEWPORT_WIDTH_BREAKPOINTS.MOBILE_PX) {
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
    if (this.viewport.width >= VIEWPORT_WIDTH_BREAKPOINTS.MOBILE_PX) {
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

    const url = this.page.url().split('?')[0];
    const deviceHasMobileWidth =
      this.viewport.width < VIEWPORT_WIDTH_BREAKPOINTS.MOBILE_PX;
    const expectedWatchAVideoUrl = deviceHasMobileWidth
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
