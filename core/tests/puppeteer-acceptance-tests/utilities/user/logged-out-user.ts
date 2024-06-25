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
 * @fileoverview Logged-out users utility file.
 */

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const _420MillionUrl = testConstants.URLs.ExternalLink61MillionChildren;
const _61MillionChildrenUrl = testConstants.URLs.ExternalLink61MillionChildren;
const aboutFoundationUrl = testConstants.URLs.AboutFoundation;
const aboutUrl = testConstants.URLs.About;
const androidUrl = testConstants.URLs.Android;
const blogPostUrlinPartnershipsPage =
  testConstants.URLs.BlogPostUrlInPartnershipsPage;
const creatorDashboardCreateModeUrl =
  testConstants.URLs.CreatorDashboardCreateMode;
const blogUrl = testConstants.URLs.Blog;
const ccLicenseUrl = testConstants.URLs.CCLicense;
const communityLibraryUrl = testConstants.URLs.CommunityLibrary;
const contactUrl = testConstants.URLs.Contact;
const creatingAnExplorationUrl = testConstants.URLs.CreatingAnExploration;
const desktopWatchAVideoUrl = testConstants.URLs.DesktopExternalLinkWatchAVideo;
const donateUrl = testConstants.URLs.Donate;
const electromagnetismUrl = testConstants.URLs.Electromagnetism;
const embeddingAnExplorationUrl = testConstants.URLs.EmbeddingAnExploration;
const creatorGuidelinesUrl = testConstants.URLs.CreatorGuidelines;
const googleGroupsOppiaUrl = testConstants.URLs.GoogleGroups.Oppia;
const googleGroupsOppiaAnnouceUrl =
  testConstants.URLs.GoogleGroups.OppiaAnnounce;
const allAboutCookiesUrl = testConstants.URLs.ExternalLink.AboutCookies;
const googleAnalyticsPartnerPoliciesUrl =
  testConstants.URLs.GoogleAnalytics.PartnerPolicies;
const googleAnalyticsOptOutUrl = testConstants.URLs.GoogleAnalytics.OptOut;
const CreativeCommonsLegalCodeUrl =
  testConstants.URLs.ExternalLink.CreativeCommonsLegalCode;
const explorationDesignTipsUrl = testConstants.URLs.ExplorationDesignTips;
const googleSignUpUrl = testConstants.URLs.ExternalLink.GoogleSignUp;
const evenThoseWhoAreInSchoolUrl =
  testConstants.URLs.ExternalLinkEvenThoseWhoAreInSchool;
const getStartedUrl = testConstants.URLs.GetStarted;
const homeUrl = testConstants.URLs.Home;
const mathClassroomUrl = testConstants.URLs.MathClassroom;
const mobileWatchAVideoUrl = testConstants.URLs.MobileExternalLinkWatchAVideo;
const OppiaAnnounceGoogleGroupUrl = testConstants.URLs.OppiaAnnounceGoogleGroup;
const partnershipsBrochureUrl = testConstants.URLs.PartnershipsBrochure;
const partnershipsFormInPortugueseUrl =
  testConstants.URLs.PartnershipsFormInPortuguese;
const partnershipsFormShortUrl = testConstants.URLs.PartnershipsFormShortUrl;
const partnershipsFormUrl = testConstants.URLs.PartnershipsForm;
const partnershipsUrl = testConstants.URLs.Partnerships;
const privacyPolicyUrl = testConstants.URLs.PrivacyPolicy;
const profilePageUrlPrefix = testConstants.URLs.ProfilePagePrefix;
const programmingWithCarlaUrl = testConstants.URLs.ProgrammingWithCarla;
const sourceUnescoUrl = testConstants.URLs.ExternalLinkSourceUnesco;
const teachUrl = testConstants.URLs.Teach;
const termsUrl = testConstants.URLs.Terms;
const thanksForDonatingUrl = testConstants.URLs.DonateWithThanksModal;
const volunteerFormShortUrl = testConstants.URLs.VolunteerFormShortUrl;
const volunteerFormUrl = testConstants.URLs.VolunteerForm;
const volunteerUrl = testConstants.URLs.Volunteer;
const welcomeToOppiaUrl = testConstants.URLs.WelcomeToOppia;

const allowedVolunteerFormUrls = [
  volunteerFormUrl,
  `${volunteerFormUrl}?usp=send_form`,
  volunteerFormShortUrl,
];
const allowedPartnershipsFormUrls = [
  partnershipsFormShortUrl,
  partnershipsFormUrl,
  `${partnershipsFormUrl}?usp=send_form`,
];
const impactReportUrl = testConstants.URLs.ImpactReportUrl;

const navbarLearnTab = 'a.e2e-test-navbar-learn-menu';
const navbarLearnTabBasicMathematicsButton =
  'a.e2e-test-basic-mathematics-link';
const navbarAboutTab = 'a.e2e-test-navbar-about-menu';
const navbarAboutTabAboutButton = 'a.e2e-test-about-link';
const navbarAboutTabTeachButton = 'a.e2e-test-navbar-about-menu-teach-button';
const navbarAboutTabImpactReportButton =
  'a.e2e-test-navbar-impact-report-button';
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
const footerTeachLink = 'a.e2e-test-teach-link';
const footerCreatorGuidelinesLink = 'a.e2e-test-creator-guidelines-link';
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
const oppiaAndroidAppButton = '.oppia-android-app-button';

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
const mobileSidebarBasicMathematicsButton =
  'a.e2e-mobile-test-mathematics-link';
const mobileSidebarAboutButton = 'a.e2e-mobile-test-sidebar-about-button';
const mobileSidebarTeachButton = 'a.e2e-mobile-test-sidebar-teach-button';
const mobileSidebarImpactReportButton =
  'a.e2e-mobile-test-sidebar-impact-report-button';
const mobileSidebarExpandAboutMenuButton =
  'div.e2e-mobile-test-sidebar-expand-about-menu';
const mobileSidebarExpandGetInvolvedMenuButton =
  'div.e2e-mobile-test-sidebar-expand-get-involved-menu';
const mobileSidebarGetInvolvedMenuPartnershipsButton =
  'a.e2e-mobile-test-sidebar-get-involved-menu-partnerships-button';
const carouselSlideSelector = '[data-test="mat-card-content"]';
const mobileSidebarGetInvolvedMenuVolunteerButton =
  'a.e2e-mobile-test-sidebar-get-involved-menu-volunteer-button';
const mobileSidevbarGetInvolvedMenuDonateButton =
  'a.e2e-mobile-test-sidebar-get-involved-menu-donate-button';
const mobileSidebarGetInvolvedMenuContactUsButton =
  'a.e2e-mobile-test-sidebar-get-involved-menu-contact-us-button';
const browseOurLessonsDesktopButtonInTeachPage =
  '.e2e-test-teach-page-browse-our-lessons-desktop-button';
const browseOurLessonsMobileButtonInTeachPage =
  '.e2e-test-teach-page-browse-our-lessons-mobile-button';
const accessAndroidAppDesktopButtonInTeachPage =
  '.e2e-test-teach-page-access-android-app-desktop-button';
const accessAndroidAppMobileButtonInTeachPage =
  '.e2e-test-teach-page-access-android-app-mobile-button';
const visitClassroomDesktopButtonInTeachPage =
  '.e2e-test-teach-page-visit-classroom-desktop-button';
const visitClassroomMobileButtonInTeachPage =
  '.e2e-test-teach-page-visit-classroom-mobile-button';
const exploreLessonsDesktopButtonInTeachPage =
  '.e2e-test-teach-page-explore-lessons-desktop-button';
const exploreLessonsMobileButtonInTeachPage =
  '.e2e-test-teach-page-explore-lessons-mobile-button';
const browseLibraryDesktopButtonInTeachPage =
  '.e2e-test-teach-page-browse-library-desktop-button';
const browseLibraryMobileButtonInTeachPage =
  '.e2e-test-teach-page-browse-library-mobile-button';
const partnerWithUsButtonAtTheTopOfPartnershipsPage =
  '.e2e-test-partnerships-page-partner-with-us-button-at-the-top';
const partnerWithUsButtonAtTheBottomOfPartnershipsPage =
  '.e2e-test-partnerships-page-partner-with-us-button-at-the-bottom';
const brochureButtonInPartnershipsPage =
  '.e2e-test-partnerships-page-brochure-button';
const readMoreStoriesButtonInPartnershipsPage =
  '.e2e-test-partnerships-page-partner-stories-button';
const readBlogPostDesktopButtonInPartnershipsPage =
  '.e2e-test-partnerships-page-blog-post-desktop-button';
const readBlogPostMobileButtonInPartnershipsPage =
  '.e2e-test-partnerships-page-blog-post-mobile-button';
const applyToVolunteerButtonAtTheTopOfVolunteerPage =
  '.e2e-test-volunteer-page-apply-to-volunteer-button-at-the-top';
const applyToVolunteerButtonAtTheBottomOfVolunteerPage =
  '.e2e-test-volunteer-page-apply-to-volunteer-button-at-the-bottom';
const donorBoxIframe = '.e2e-test-donate-page-iframe';
const languageDropdown = '.e2e-test-language-dropdown';
const volunteerWithOppiaDesktopButtonInAboutPage =
  '.e2e-test-about-page-desktop-volunteer-button';
const volunteerWithOppiaMobileButtonInAboutPage =
  '.e2e-test-about-page-mobile-volunteer-button';
const partnerWithUsDesktopButtonInAboutPage =
  '.e2e-test-about-page-desktop-partner-button';
const partnerWithUsMobileButtonInAboutPage =
  '.e2e-test-about-page-mobile-partner-button';
const donateDesktopButtonInAboutPage = '.e2e-test-donate-desktop-button';
const donateMobileButtonInAboutPage = '.e2e-test-donate-mobile-button';
const donorDesktopTabInAboutPage = '.e2e-test-about-page-donor-desktop-tab';
const donorMobileTabInAboutPage = '.e2e-test-about-page-donor-mobile-tab';
const partnerDesktopTabInAboutPage = '.e2e-test-about-page-partner-desktop-tab';
const partnerMobileTabInAboutPage = '.e2e-test-about-page-partner-mobile-tab';

const subscribeButton = 'button.oppia-subscription-button';
const unsubscribeLabel = '.e2e-test-unsubscribe-label';
const explorationCard = '.e2e-test-exploration-dashboard-card';

const libraryExplorationsGroupSelector = '.oppia-library-group';

const privacyPolicyLinkInTermsPage = '.e2e-test-privacy-policy-link';
const ccLicenseLinkInTermsPage = '.e2e-test-cc-license-link';
const googleGroupSignUpLinkInTermsPage =
  '.e2e-test-oppia-announce-google-group-link';

const emailLinkSelector = '.oppia-contact-mail';

export class LoggedOutUser extends BaseUser {
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
  async navigateToCreatorGuidelinesPage(): Promise<void> {
    await this.goto(creatorGuidelinesUrl);
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
   * Navigates to the community library page.
   */
  async navigateToCommunitylibrary(): Promise<void> {
    await this.page.goto(communityLibraryUrl);
  }

  /**
   * Function to navigate to the Parents and Teachers page.
   */
  async navigateToTeachPage(): Promise<void> {
    await this.goto(teachUrl);
  }

  /**
   * Function to navigate to the Partnerships page.
   */
  async navigateToPartnershipsPage(): Promise<void> {
    await this.goto(partnershipsUrl);
  }

  /**
   * Function to navigate to the Volunteer page.
   */
  async navigateToVolunteerPage(): Promise<void> {
    await this.goto(volunteerUrl);
  }

  /**
   * Function to navigate to the Donate page.
   */
  async navigateToDonatePage(): Promise<void> {
    await this.goto(donateUrl);
  }

  /**
   * Function to navigate to the Contact Us page.
   */
  async navigateToContactUsPage(): Promise<void> {
    await this.goto(contactUrl);
  }

  /**
   * Function to click a button and check if it opens the expected destination.
   */
  private async clickButtonToNavigateToNewPage(
    button: string,
    buttonName: string,
    expectedDestinationPageUrl: string,
    expectedDestinationPageName: string
  ): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({waitUntil: ['load', 'networkidle0']}),
      this.clickOn(button),
    ]);

    expect(this.page.url())
      .withContext(
        `${buttonName} should open the ${expectedDestinationPageName} page`
      )
      .toBe(expectedDestinationPageUrl);
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
   * Function to click a button and check if it opens the expected destination
   * in a new tab. Closes the tab afterwards.
   */
  private async clickLinkButtonToNewTab(
    button: string,
    buttonName: string,
    expectedDestinationPageUrl: string,
    expectedDestinationPageName: string
  ): Promise<void> {
    const pageTarget = this.page.target();
    await this.clickOn(button);
    const newTarget = await this.browserObject.waitForTarget(
      target => target.opener() === pageTarget
    );
    const newTabPage = await newTarget.page();

    expect(newTabPage).toBeDefined();
    expect(newTabPage?.url())
      .withContext(
        `${buttonName} should open the ${expectedDestinationPageName} page`
      )
      .toBe(expectedDestinationPageUrl);
    await newTabPage?.close();
  }

  /**
   * Function to click the Basic Mathematics button in the Learn Menu on navbar
   * and check if it opens the Math Classroom page.
   */
  async clickBasicMathematicsButtonInLearnMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarOpenSidebarButton);
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarBasicMathematicsButton,
        'Basic Mathematics button in the Learn Menu on navbar',
        mathClassroomUrl,
        'Math Classroom'
      );
    } else {
      await this.clickOn(navbarLearnTab);
      await this.clickButtonToNavigateToNewPage(
        navbarLearnTabBasicMathematicsButton,
        'Basic Mathematics button in the Learn Menu on navbar',
        mathClassroomUrl,
        'Math Classroom'
      );
    }
  }

  /**
   * Function to click the About button in the About Menu on navbar
   * and check if it opens the About page.
   */
  async clickAboutButtonInAboutMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarOpenSidebarButton);
      await this.clickOn(mobileSidebarExpandAboutMenuButton);
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
   * Function to click the Teach button in the About Menu on navbar
   * and check if it opens the Teach page.
   */
  async clickTeachButtonInAboutMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarOpenSidebarButton);
      await this.clickOn(mobileSidebarExpandAboutMenuButton);
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarTeachButton,
        'Teach button in the About Menu on mobile sidebar',
        teachUrl,
        'Teach'
      );
    } else {
      await this.clickOn(navbarAboutTab);
      await this.clickButtonToNavigateToNewPage(
        navbarAboutTabTeachButton,
        'Teach button in the About Menu on navbar',
        teachUrl,
        'Teach'
      );
    }
  }

  /**
   * Function to click the Impact Report button in the About Menu on navbar
   * and check if it opens the Impact Report.
   */
  async clickImpactReportButtonInAboutMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarOpenSidebarButton);
      await this.clickOn(mobileSidebarExpandAboutMenuButton);
      await this.openExternalPdfLink(
        mobileSidebarImpactReportButton,
        impactReportUrl
      );
    } else {
      await this.clickOn(navbarAboutTab);
      await this.openExternalPdfLink(
        navbarAboutTabImpactReportButton,
        impactReportUrl
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
        `The 61 Million Children link should open the right page,
          but it opens ${this.page.url()} instead.`
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

    await Promise.all([
      this.page.waitForNavigation({waitUntil: ['load', 'networkidle2']}),
      this.page.$eval(weCannotContentId, element =>
        element.getElementsByTagName('a')[0].click()
      ),
    ]);

    if (this.page.url() !== _420MillionUrl) {
      throw new Error(
        `The 420 Million link does not open the right page!
          It opens ${this.page.url()} instead.`
      );
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
        `The Learn More About Oppia button does not open the About page!
           It opens ${newTab.url()} instead.`
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
        `The Become A Volunteer button does not open the Volunteer page!
          It opens ${newTab.url()} instead.`
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
        `The Consider becoming a partner today! link does not open
          the Partnerships page! It opens ${this.page.url()} instead.`
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
        `The Join our large volunteer community! link does not open
          the Volunteer page! It opens ${this.page.url()} instead.`
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
      throw new Error(
        `The donations link does not open the Donate page!
          It opens ${this.page.url()} instead.`
      );
    } else {
      showMessage('The donations link opens the Donate page.');
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
      throw new Error(
        `The Watch A Video button should open the right page,
          but it opens ${url} instead.`
      );
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
      throw new Error(
        `The Read Our Blog button should open the Blog page,
          but it opens ${this.page.url()} instead.`
      );
    } else {
      showMessage('The Read Our Blog button opens the Blog page.');
    }
  }

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
   * Function to click the dismiss button in the Thanks for Donating page,
   * and check if the Thanks for Donating popup disappears
   * and if the Donate page is shown.
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
      throw new Error(
        `The dismiss button should show the Donate page,
          but it opens ${this.page.url()} instead.`
      );
    } else {
      showMessage(
        'The dismiss button closes the Thanks for Donating popup ' +
          'and shows the Donate page.'
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
   * Navigates to the Get Started page using the oppia website footer.
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
   * Navigates to the Creator Guidelines page using the oppia website footer.
   */
  async clickOnCreatorGuidelinesLinkinFooter(): Promise<void> {
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
  async clickOnTermsOfServiceLinkInFooter(): Promise<void> {
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
  async clickOnPrivacyPolicyLinkInFooter(): Promise<void> {
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

    expect(newTabPage?.url()).toContain(googleSignUpUrl);
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

    expect(this.page.url()).toBe(explorationDesignTipsUrl);
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

    expect(this.page.url()).toBe(creatorDashboardCreateModeUrl);
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

    expect(this.page.url()).toBe(communityLibraryUrl);
  }

  /**
   * Clicks the link on the Terms page that leads to the Privacy Policy page.
   */
  async clickLinkToPrivacyPolicyOnTermsPage(): Promise<void> {
    await this.page.waitForXPath('//a[contains(text(),"Privacy Policy")]');
    const [link] = await this.page.$x('//a[contains(text(),"Privacy Policy")]');
    await Promise.all([this.page.waitForNavigation(), await link.click()]);

    expect(this.page.url()).toBe(privacyPolicyUrl);
  }

  /**
   * Clicks the link on the Terms page about the CC-BY-SA 4.0 license.
   */
  async clickLinkToLicenseOnTermsPage(): Promise<void> {
    await this.page.waitForXPath('(//a[contains(text(),"here")])[1]');
    const [link] = await this.page.$x('(//a[contains(text(),"here")])[1]');
    await Promise.all([this.page.waitForNavigation(), await link.click()]);

    expect(this.page.url()).toBe(CreativeCommonsLegalCodeUrl);
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

    expect(this.page.url()).toBe(homeUrl);
  }

  /**
   * Clicks the link to learn about cookies on the Privacy Policy page.
   */
  async clickLinkAboutCookiesOnPrivacyPolicyPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'http://www.allaboutcookies.org/manage-cookies/index.html',
      'link to learn about cookies on the Privacy Policy page',
      allAboutCookiesUrl,
      'All About Cookies'
    );
  }

  /**
   * Clicks the link to learn about Google Analytivs on the Privacy Policy page.
   */
  async clickLinkAboutGoogleAnalyticsOnPrivacyPolicyPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'https://www.google.com/policies/privacy/partners/',
      'link to learn about Google Analytivs on the Privacy Policy page',
      googleAnalyticsPartnerPoliciesUrl,
      'Google Privacy & Terms'
    );
  }

  /**
   * Clicks the link to opt out of cookies on the Privacy Policy page.
   */
  async clickLinkAboutGoogleAnalyticsOptOutOnPrivacyPolicyPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      googleAnalyticsOptOutUrl,
      'link to opt out of cookies on the Privacy Policy pager',
      googleAnalyticsOptOutUrl,
      'Google Analytics Opt-out Browser Add-on'
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
    await this.page.click(socialIconSelector);
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

  /**
   * Clicks the Google Play banner in the footer.
   */
  async clickGooglePlayButtonInFooter(): Promise<void> {
    await this.openSocialLinkInNewTabViaIcon(
      oppiaAndroidAppButton,
      testConstants.OppiaSocials.GooglePlay.Domain,
      testConstants.OppiaSocials.GooglePlay.Id
    );
  }

  /**
   * Function to click the Browse Our Lessons button in the Teach page
   * and check if it opens the Math Classroom page.
   */
  async clickBrowseOurLessonsButtonInTeachPage(): Promise<void> {
    const browseOurLessonsButtonInTeachPage = this.isViewportAtMobileWidth()
      ? browseOurLessonsMobileButtonInTeachPage
      : browseOurLessonsDesktopButtonInTeachPage;
    await this.clickButtonToNavigateToNewPage(
      browseOurLessonsButtonInTeachPage,
      'Browse Our Lessons button',
      mathClassroomUrl,
      'Math Classroom'
    );
  }

  /**
   * Function to click the Access Android App button in the Teach page
   * and check if it opens the Android page.
   */
  async clickAccessAndroidAppButtonInTeachPage(): Promise<void> {
    const accessAndroidAppButtonInTeachPage = this.isViewportAtMobileWidth()
      ? accessAndroidAppMobileButtonInTeachPage
      : accessAndroidAppDesktopButtonInTeachPage;
    await this.clickButtonToNavigateToNewPage(
      accessAndroidAppButtonInTeachPage,
      'Access the Android App button',
      androidUrl,
      'Android'
    );
  }

  /**
   * Function to click the Visit Classroom button in the Teach page
   * and check if it opens the Math Classroom page.
   */
  async clickVisitClassroomButtonInTeachPage(): Promise<void> {
    const visitClassroomButtonInTeachPage = this.isViewportAtMobileWidth()
      ? visitClassroomMobileButtonInTeachPage
      : visitClassroomDesktopButtonInTeachPage;
    await this.clickButtonToNavigateToNewPage(
      visitClassroomButtonInTeachPage,
      'Visit Classroom button',
      mathClassroomUrl,
      'Math Classroom'
    );
  }

  /**
   * Function to click the Browse Library button in the Teach page
   * and check if it opens the Community Library page.
   */
  async clickBrowseLibraryButtonInTeachPage(): Promise<void> {
    const browseLibraryButtonInTeachPage = this.isViewportAtMobileWidth()
      ? browseLibraryMobileButtonInTeachPage
      : browseLibraryDesktopButtonInTeachPage;
    await this.clickButtonToNavigateToNewPage(
      browseLibraryButtonInTeachPage,
      'Browse Library button',
      communityLibraryUrl,
      'Community Library'
    );
  }

  /**
   * Function to click the Browse Our Lessons button in the Teach page
   * and check if it opens the Math Classroom page.
   */
  async clickExploreLessonsButtonInTeachPage(): Promise<void> {
    const exploreLessonsButtonInTeachPage = this.isViewportAtMobileWidth()
      ? exploreLessonsMobileButtonInTeachPage
      : exploreLessonsDesktopButtonInTeachPage;
    await this.clickButtonToNavigateToNewPage(
      exploreLessonsButtonInTeachPage,
      'Explore Lessons button',
      mathClassroomUrl,
      'Math Classroom'
    );
  }

  /**
   * Function to click a button and check if it opens any of the allowedUrls
   * in a new tab. Closes the tab afterwards. This function is useful when we try to
   * verify Google Form URLs which changes in a short span of time.
   */
  private async clickLinkButtonToNewTabAndVerifyAllowedUrls(
    button: string,
    buttonName: string,
    allowedUrls: string[],
    expectedDestinationPageName: string
  ): Promise<void> {
    const pageTarget = this.page.target();
    await this.clickOn(button);
    const newTarget = await this.browserObject.waitForTarget(
      target => target.opener() === pageTarget
    );
    const newTabPage = await newTarget.page();

    expect(newTabPage).toBeDefined();
    const newTabPageUrl = newTabPage?.url() as string;
    if (!allowedUrls.includes(newTabPageUrl)) {
      throw new Error(
        `${buttonName} should open ${expectedDestinationPageName} page` +
          `but it opens ${newTabPageUrl} instead.`
      );
    }
    await newTabPage?.close();
  }

  /**
   * Function to change the site language to the given language code.
   * @param langCode - The language code to change the site language to. Example: 'pt-br', 'en'
   */
  private async changeSiteLanguage(langCode: string): Promise<void> {
    const languageOption = `.e2e-test-i18n-language-${langCode} a`;
    await this.clickOn(languageDropdown);
    await this.clickOn(languageOption);
  }

  /**
   * Function to click the Partner With Us button in the Partnerships page
   * and check if it opens the Partnerships Google form.
   * The button is in the first section of the page.
   */
  async clickPartnerWithUsButtonInPartnershipsPage(): Promise<void> {
    // The Google Form URL changes from the 1st to the 2nd and from 2nd to the
    // 3rd in a short span of 500-1000 ms for it's own reasons which we can't
    // control.So we need to check for all the 3 URLs as all of them are valid.
    await this.clickLinkButtonToNewTabAndVerifyAllowedUrls(
      partnerWithUsButtonAtTheTopOfPartnershipsPage,
      'Partner With Us button at the bottom of the Partnerships page',
      allowedPartnershipsFormUrls,
      'Partnerships Google Form'
    );
  }

  /**
   * This function changes the site language based on the provided parameter,
   * then clicks the 'Partner With Us' button in the bottom section of the Partnerships page
   * and verifies if the Partnerships Google form opens in the specified language.
   * @param {string} langCode - The language code to change the site language to.
   */
  async clickPartnerWithUsButtonInPartnershipsPageInGivenLanguage(
    langCode: string
  ): Promise<void> {
    await this.changeSiteLanguage(langCode);
    // Here we need to reload the page again to confirm the language change.
    await this.page.reload();

    // Here we are not verifying the 3 URLs as we did in the English version
    // because we have put the direct translated Google Form URL in the page itself.
    // Refer core/templates/pages/partnerships-page/partnerships-page.component.ts to see how it's done.
    await this.clickLinkButtonToNewTab(
      partnerWithUsButtonAtTheBottomOfPartnershipsPage,
      'Partner With Us button at the bottom of the Partnerships page',
      partnershipsFormInPortugueseUrl,
      'Partnerships Google Form'
    );
  }

  /**
   * Function to click the Download Brochure button in the Partnerships page
   * and check if it opens the Partnerships Brochure.
   */
  async clickDownloadBrochureButtonInPartnershipsPage(): Promise<void> {
    await this.openExternalPdfLink(
      brochureButtonInPartnershipsPage,
      partnershipsBrochureUrl
    );
  }

  /**
   * Function to click the first "Read blog post" link in the Partnerships page
   * and check if it opens the blog page.
   */
  async clickReadBlogPostLinkInPartnershipsPage(): Promise<void> {
    const readBlogPostButtonInPartnershipsPage = this.isViewportAtMobileWidth()
      ? readBlogPostMobileButtonInPartnershipsPage
      : readBlogPostDesktopButtonInPartnershipsPage;

    if (this.isViewportAtMobileWidth()) {
      // Waits for the visibility of the 'mat-card-content' that contains the button to be clicked
      // and clicks on it. This action halts the automatic scrolling of slides in the carousel.
      await this.page.waitForSelector(carouselSlideSelector, {visible: true});
      await this.page.click(carouselSlideSelector);
      await this.page.waitForSelector(readBlogPostButtonInPartnershipsPage, {
        visible: true,
      });
    }

    await this.clickLinkButtonToNewTab(
      readBlogPostButtonInPartnershipsPage,
      'Read blog post button',
      blogPostUrlinPartnershipsPage,
      'Blog Post'
    );
  }

  /**
   * Function to click the Read more stories button in the Partnerships page
   * and check if it opens the blog page.
   */
  async clickReadMoreStoriesButtonInPartnershipsPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      readMoreStoriesButtonInPartnershipsPage,
      'Read more stories button',
      blogUrl,
      'Blog'
    );
  }

  /**
   * Function to click the Apply To Volunteer at the top of the Volunteer page
   * and check if it opens the Volunteer form.
   */
  async clickApplyToVolunteerAtTheTopOfVolunteerPage(): Promise<void> {
    // The Google Form URL changes from the 1st to the 2nd and from 2nd to the
    // 3rd in a short span of 500-1000 ms for it's own reasons which we can't
    // control.So we need to check for all the 3 URLs in the 'allowedVolunteerFormUrls' array
    // as all of them are valid.
    await this.clickLinkButtonToNewTabAndVerifyAllowedUrls(
      applyToVolunteerButtonAtTheTopOfVolunteerPage,
      'Apply To Volunteer at the top of the Volunteer page',
      allowedVolunteerFormUrls,
      'Volunteer Form'
    );
  }

  /**
   * Function to click the Apply To Volunteer at the bottom of the Volunteer page
   * and check if it opens the Volunteer form.
   */
  async clickApplyToVolunteerAtTheBottomOfVolunteerPage(): Promise<void> {
    // The Google Form URL changes from the 1st to the 2nd and from 2nd to the
    // 3rd in a short span of 500-1000 ms for it's own reasons which we can't
    // control.So we need to check for all the 3 URLs in the 'allowedVolunteerFormUrls' array
    // as all of them are valid.
    await this.clickLinkButtonToNewTabAndVerifyAllowedUrls(
      applyToVolunteerButtonAtTheBottomOfVolunteerPage,
      'Apply To Volunteer at the bottom of the Volunteer page',
      allowedVolunteerFormUrls,
      'Volunteer Form'
    );
  }

  /**
   * Function to check if the donor box is visible on the donate page.
   * Here we don't test the functionality of the donor box, just its visibility.
   * because the donor box is an iframe and a third-party service.
   */
  async isDonorBoxVisbleOnDonatePage(): Promise<void> {
    const donorBox = await this.page.waitForSelector(donorBoxIframe);
    if (!donorBox) {
      throw new Error('The donor box is not visible on the donate page.');
    } else {
      showMessage('The donor box is visible on the donate page.');
    }
  }

  /**
   * Clicks on the Privacy Policy link in the /terms page and
   * checks if it opens the correct URL.
   */
  async clickPrivacyPolicyLinkInTermsPage(): Promise<void> {
    await this.page.waitForSelector(privacyPolicyLinkInTermsPage, {
      visible: true,
    });
    await this.clickButtonToNavigateToNewPage(
      privacyPolicyLinkInTermsPage,
      'Privacy Policy link in the terms page',
      privacyPolicyUrl,
      'Privacy Policy'
    );
  }

  /**
   * Clicks on the License link in the /terms page and checks
   * if it opens the correct URL.
   */
  async clickLicenseLinkInTermsPage(): Promise<void> {
    await this.page.waitForSelector(ccLicenseLinkInTermsPage, {visible: true});
    await this.clickButtonToNavigateToNewPage(
      ccLicenseLinkInTermsPage,
      'License link in the terms page',
      ccLicenseUrl,
      'License'
    );
  }

  /**
   * Clicks on the Google Group Sign Up link in the /terms page and checks
   * if it opens the correct URL.
   */
  async clickGoogleGroupSignUpLinkInTermsPage(): Promise<void> {
    await this.page.waitForSelector(googleGroupSignUpLinkInTermsPage, {
      visible: true,
    });
    await this.clickButtonToNavigateToNewPage(
      googleGroupSignUpLinkInTermsPage,
      'Google Group Sign Up link in the terms page',
      OppiaAnnounceGoogleGroupUrl,
      'Oppia-announce Google Group page'
    );
  }

  /**
   * Clicks the "DONATE TODAY" button on the Contact Us page and checks that
   * it navigates to the correct URL.
   */
  async clickDonateTodayButtonInContactUsPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'DONATE TODAY',
      'DONATE TODAY button',
      donateUrl,
      'Donate'
    );
  }

  /**
   * Clicks the "BECOME A PARTNER" button on the Contact Us page and checks that
   * it navigates to the correct URL.
   */
  async clickBecomeAPartnerButtonInContactUsPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'BECOME A PARTNER',
      'BECOME A PARTNER button',
      partnershipsUrl,
      'Partnerships'
    );
  }

  /**
   * Clicks the "VOLUNTEER WITH US" button on the Contact Us page and checks that
   * it navigates to the correct URL.
   */
  async clickVolunteerButtonInContactUsPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'BECOME A VOLUNTEER',
      'BECOME A VOLUNTEER button',
      volunteerUrl,
      'Volunteer'
    );
  }

  /**
   * Checks the admin email link in the Contact Us page and verifies
   * that it navigates to the correct mailto URL.
   */
  async verifyAdminEmailLinkInContactUsPage(): Promise<void> {
    await this.page.waitForSelector(emailLinkSelector);
    const href = await this.page.$eval(emailLinkSelector, el =>
      el.getAttribute('href')
    );
    if (href !== 'mailto:admin@oppia.org') {
      throw new Error(
        `Email link has href "${href}" instead of "mailto:admin@oppia.org"`
      );
    }
  }

  /**
   * Checks the second press email link in the Contact Us page and verifies
   * that it navigates to the correct mailto URL.
   */
  async verifyPressEmailLinkInContactUsPage(): Promise<void> {
    await this.page.waitForSelector(emailLinkSelector);
    const emailLinks = await this.page.$$(emailLinkSelector);

    const href = await this.page.evaluate(
      el => el.getAttribute('href'),
      emailLinks[1]
    );
    if (href !== 'mailto:press@oppia.org') {
      throw new Error(
        `Email link has href ${href} instead of mailto:press@oppia.org`
      );
    }
  }

  /**
   * Clicks on a option of Terms of Use bookmark menu and waits for the page to scroll
   * to the corresponding section.
   */
  async clickBookmarkInTermsPage(bookmark: string): Promise<void> {
    try {
      await this.page.waitForXPath(`//a[text()="${bookmark}"]`, {
        visible: true,
      });
      const linkToClick = await this.page.$x(`//a[text()="${bookmark}"]`);
      if (linkToClick.length > 0) {
        await this.waitForElementToBeClickable(linkToClick[0]);
        await linkToClick[0].click();
      } else {
        throw new Error(`Link not found: ${bookmark}`);
      }

      // Update the bookmark if it's "Hosted Created Content and IP" to match the heading of the
      // corresponding section.
      if (bookmark === 'Hosted Created Content and IP') {
        bookmark = 'Hosted Created Content and Intellectual Property';
      }

      await this.page.waitForFunction(
        (bookmark: string) => {
          const element = document.evaluate(
            `//h2[text()="${bookmark}"]`,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue as HTMLElement;
          if (element) {
            const rect = element.getBoundingClientRect();
            return rect.top >= 0 && rect.bottom <= window.innerHeight;
          }
          return false;
        },
        {},
        bookmark
      );
    } catch (error) {
      error.message =
        `Failed to scroll to bookmark: ${bookmark}. ` + error.message;
      throw error;
    }
    showMessage(`Scrolled successfully to the bookmark: ${bookmark}`);
  }

  /**
   * Views all featured activities on the community library page.
   */
  private async viewAllFeaturedActivities(): Promise<object[]> {
    await this.page.waitForSelector(libraryExplorationsGroupSelector);

    const featuredActivities = await this.page.$$eval(
      libraryExplorationsGroupSelector,
      groups => {
        const featuredGroup = groups.find(group =>
          group
            .querySelector('h2')
            ?.textContent?.includes('Featured Activities')
        );

        const activities = Array.from(
          featuredGroup?.querySelectorAll(
            'oppia-collection-summary-tile, oppia-exploration-summary-tile'
          ) ?? []
        );

        return activities.map(activity => ({
          title: activity
            .querySelector('.e2e-test-exp-summary-tile-title')
            ?.textContent?.trim(),
        }));
      }
    );

    return featuredActivities;
  }

  /**
   * Expects to view the specified featured activities on the community library page.
   * @param {Array<string>} expectedActivityTitles - The titles of the expected featured activities.
   */
  async expectToViewFeaturedActivities(
    expectedActivityTitles: string[] = []
  ): Promise<void> {
    // Reloading to ensure the page is updated with the newly added/removed featured activities.
    await this.page.reload({waitUntil: 'networkidle0'});
    const featuredActivities: {title: string}[] =
      (await this.viewAllFeaturedActivities()) as {title: string}[];

    // If no expected activities were provided, check if the featured activities list is empty.
    if (expectedActivityTitles.length === 0) {
      if (featuredActivities.length === 0) {
        showMessage('No featured activities found as expected.');
        return;
      }
      throw new Error('Expected no featured activities, but found some');
    }

    // Check if each expected activity is in the list of featured activities.
    for (const expectedActivity of expectedActivityTitles) {
      const activity = featuredActivities.find(
        activity => activity.title === expectedActivity
      );

      if (!activity) {
        throw new Error(
          `Expected to find activity with title ${expectedActivity}, but didn't`
        );
      }
      showMessage(`Activity with title ${expectedActivity} found as expected.`);
    }
  }

  /**
   * Function to click the Volunteer with Oppia on the about page
   * and check if it opens the Volunteer form.
   */
  async clickVolunteerWithOppiaButtonInAboutPage(): Promise<void> {
    const volunteerWithOppiaButtonInAboutPage = this.isViewportAtMobileWidth()
      ? volunteerWithOppiaMobileButtonInAboutPage
      : volunteerWithOppiaDesktopButtonInAboutPage;
    // The Google Form URL changes from the 1st to the 2nd and from 2nd to the
    // 3rd in a short span of 500-1000 ms for it's own reasons which we can't
    // control.So we need to check for all the 3 URLs in the 'allowedVolunteerFormUrls' array
    // as all of them are valid.
    await this.clickLinkButtonToNewTabAndVerifyAllowedUrls(
      volunteerWithOppiaButtonInAboutPage,
      'Apply To Volunteer at the top of the Volunteer page',
      allowedVolunteerFormUrls,
      'Volunteer Form'
    );
  }

  /**
   * Function to click the Partner With Us button in the About page
   * and check if it opens the Partnerships Google form.
   */
  async clickPartnerWithUsButtonInAboutPage(): Promise<void> {
    const partnerTab = this.isViewportAtMobileWidth()
      ? partnerMobileTabInAboutPage
      : partnerDesktopTabInAboutPage;

    const partnerWithUsButtonInAboutPage = this.isViewportAtMobileWidth()
      ? partnerWithUsMobileButtonInAboutPage
      : partnerWithUsDesktopButtonInAboutPage;

    await this.clickOn(partnerTab);
    // The Google Form URL changes from the 1st to the 2nd and from 2nd to the
    // 3rd in a short span of 500-1000 ms for it's own reasons which we can't
    // control.So we need to check for all the 3 URLs as all of them are valid.
    await this.clickLinkButtonToNewTabAndVerifyAllowedUrls(
      partnerWithUsButtonInAboutPage,
      'Partner With Us button at the bottom of the Partnerships page',
      allowedPartnershipsFormUrls,
      'Partnerships Google Form'
    );
  }

  /**
   * This function changes the site language based on the provided parameter,
   * then clicks the 'Partner With Us' button on the About page, and
   * verifies if the Partnerships Google form opens in the specified language.
   * @param {string} langCode - The language code to change the site language to.
   */
  async clickPartnerWithUsButtonInAboutPageInGivenLanguage(
    langCode: string
  ): Promise<void> {
    await this.changeSiteLanguage(langCode);
    // Here we need to reload the page again to confirm the language change.
    await this.page.reload();

    const partnerTab = this.isViewportAtMobileWidth()
      ? partnerMobileTabInAboutPage
      : partnerDesktopTabInAboutPage;

    const partnerWithUsButtonInAboutPage = this.isViewportAtMobileWidth()
      ? partnerWithUsMobileButtonInAboutPage
      : partnerWithUsDesktopButtonInAboutPage;

    await this.clickOn(partnerTab);
    // Here we are not verifying the 3 URLs as we did in the English version
    // because we have put the direct translated Google Form URL in the page itself.
    // Refer core/templates/pages/partnerships-page/partnerships-page.component.ts to see how it's done.
    await this.clickLinkButtonToNewTab(
      partnerWithUsButtonInAboutPage,
      'Partner With Us button at the bottom of the Partnerships page',
      partnershipsFormInPortugueseUrl,
      'Partnerships Google Form'
    );
  }

  /**
   * Function to check if the donor box is visible by clicking on the "Donate" button
   * on the about page. Here we don't test the functionality of the donor box, just
   * its visibility, because the donor box is an iframe and a third-party service.
   */
  async clickDonateButtonInAboutPage(): Promise<void> {
    const donorTab = this.isViewportAtMobileWidth()
      ? donorMobileTabInAboutPage
      : donorDesktopTabInAboutPage;

    const donateButtonInAboutPage = this.isViewportAtMobileWidth()
      ? donateMobileButtonInAboutPage
      : donateDesktopButtonInAboutPage;

    await this.clickOn(donorTab);
    await this.clickOn(donateButtonInAboutPage);

    const donorBox = await this.page.waitForSelector(donorBoxIframe);
    if (!donorBox) {
      throw new Error('The donor box is not visible on the about page.');
    } else {
      showMessage('The donor box is visible on the about page.');
    }
  }
}

export let LoggedOutUserFactory = (): LoggedOutUser => new LoggedOutUser();
