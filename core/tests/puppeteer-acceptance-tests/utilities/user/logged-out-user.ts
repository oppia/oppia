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

import puppeteer from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const aboutUrl = testConstants.URLs.About;
const androidUrl = testConstants.URLs.Android;
const blogPostUrlinPartnershipsPage =
  testConstants.URLs.BlogPostUrlInPartnershipsPage;
const creatorDashboardCreateModeUrl =
  testConstants.URLs.CreatorDashboardCreateMode;
const blogUrl = testConstants.URLs.Blog;
const ccLicenseUrl = testConstants.URLs.CCLicense;
const communityLibraryUrl = testConstants.URLs.CommunityLibrary;
const recentlyPublishedExplorationsPageUrl =
  testConstants.URLs.recentlyPublishedExplorations;
const splashPageUrl = testConstants.URLs.splash;
const contactUrl = testConstants.URLs.Contact;
const creatingAnExplorationUrl = testConstants.URLs.CreatingAnExploration;
const classroomsPageUrl = testConstants.URLs.ClassroomsPage;
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
const getStartedUrl = testConstants.URLs.GetStarted;
const homeUrl = testConstants.URLs.Home;
const mathClassroomUrl = testConstants.URLs.MathClassroom;
const OppiaAnnounceGoogleGroupUrl = testConstants.URLs.OppiaAnnounceGoogleGroup;
const partnershipsBrochureUrl = testConstants.URLs.PartnershipsBrochure;
const partnershipsFormInPortugueseUrl =
  testConstants.URLs.PartnershipsFormInPortuguese;
const partnershipsFormUrl = testConstants.URLs.PartnershipsForm;
const partnershipsUrl = testConstants.URLs.Partnerships;
const privacyPolicyUrl = testConstants.URLs.PrivacyPolicy;
const profilePageUrlPrefix = testConstants.URLs.ProfilePagePrefix;
const programmingWithCarlaUrl = testConstants.URLs.ProgrammingWithCarla;
const teachUrl = testConstants.URLs.Teach;
const termsUrl = testConstants.URLs.Terms;
const donatePageThanksModalURL = testConstants.URLs.DonatePageThanksModalURL;
const aboutPageThanksModalURL = testConstants.URLs.AboutPageThanksModalURL;
const volunteerFormUrl = testConstants.URLs.VolunteerForm;
const volunteerUrl = testConstants.URLs.Volunteer;
const welcomeToOppiaUrl = testConstants.URLs.WelcomeToOppia;
const impactReport2022Url = testConstants.URLs.ImpactReport2022Url;
const impactReport2023Url = testConstants.URLs.ImpactReport2023Url;
const teacherStoryTaggedBlogsLink =
  testConstants.URLs.TeacherStoryTaggedBlogsLink;
const parentsTeachersGuideUrl = testConstants.URLs.ParentsTeachersGuideUrl;
const lessonCreatorLinkedInUrl = testConstants.URLs.LessonCreatorLinkedInUrl;
const testimonialCarouselNamesInTeachPage =
  testConstants.TeachPageTestimonialsNames;
const creatorsCarouselNamesInTeachPage = testConstants.TeachPageCreatorsNames;
const learnerDashboardUrl = testConstants.URLs.LearnerDashboard;
const creatorDashboardUrl = testConstants.URLs.CreatorDashboard;
const moderatorPageUrl = testConstants.URLs.ModeratorPage;
const preferencesPageUrl = testConstants.URLs.Preferences;
const topicsAndSkillsDashboardUrl = testConstants.URLs.TopicAndSkillsDashboard;

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
const navbarDonateDesktopButton = 'a.e2e-test-navbar-donate-desktop-button';
const navbarDonateMobileButton = 'a.e2e-test-navbar-donate-mobile-button';

const footerAboutLink = 'a.e2e-test-footer-about-link';
const footerBlogLink = 'a.e2e-test-footer-blog-link';
const footerForumlink = 'a.e2e-test-footer-forum-link';
const footerGetStartedLink = 'a.e2e-test-get-started-link';
const footerTeachLink = 'a.e2e-test-teach-link';
const footerCreatorGuidelinesLink = 'a.e2e-test-creator-guidelines-link';
const footerTermsLink = 'a.e2e-test-terms-link';
const footerPrivacyPolicyLink = 'a.e2e-test-privacy-policy-link';
const footerCommunityLibraryLink = 'a.e2e-test-community-library-link';
const footerContactUsLink = 'a.e2e-test-contact-link';

const oppiaYouTubeLinkIcon = '.e2e-test-oppia-youtube-follow';
const oppiaFacebookLinkIcon = '.e2e-test-oppia-facebook-follow';
const oppiaInstagramLinkIcon = '.e2e-test-oppia-instagram-follow';
const oppiaTwitterLinkIcon = '.e2e-test-oppia-twitter-follow';
const oppiaGithubLinkIcon = '.e2e-test-oppia-github-follow';
const oppiaLinkedInLinkIcon = '.e2e-test-oppia-linkedin-follow';
const oppiaAndroidAppButton = '.e2e-test-oppia-android-app';

const watchAVideoButton =
  'a.e2e-test-thanks-for-donating-page-watch-a-video-button';
const readOurBlogButton =
  'a.e2e-test-thanks-for-donating-page-read-our-blog-button';
const dismissButton = 'i.e2e-test-thanks-for-donating-page-dismiss-button';
const thanksForDonatingClass = '.modal-open';
const donatePage = '.donate-content-container';
const aboutPage = '.e2e-test-about-page';

const mobileNavbarOpenSidebarButton = 'a.e2e-mobile-test-navbar-button';
const mobileSidebarBasicMathematicsButton =
  'a.e2e-mobile-test-mathematics-link';
const mobileSidebarAboutButton = 'a.e2e-mobile-test-sidebar-about-button';
const mobileSidebarTeachButton = 'a.e2e-mobile-test-sidebar-teach-button';
const mobileSidebarImpactReportButton =
  'a.e2e-mobile-test-sidebar-impact-report-button';
const mobileSidebarExpandAboutMenuButton =
  'div.e2e-mobile-test-sidebar-expand-about-menu';
const mobileSidebarExpandImpactReportSubMenuButton =
  'div.e2e-mobile-test-sidebar-expand-impactreport-submenu';
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
const exploreLessonsButtonAtTheTopInTeachPage =
  '.e2e-test-teach-page-explore-lessons-button-at-the-top';
const exploreLessonsButtonAtTheBottomInTeachPage =
  '.e2e-test-teach-page-explore-lessons-button-at-the-bottom';
const getAndroidAppButtonInTeachPage =
  '.e2e-test-teach-page-download-android-app-button';
const creatorsCarouselSelectorInTeachPage =
  '.e2e-test-teach-page-creators-carousel';
const creatorsCarouselPrevButton =
  '.e2e-test-teach-page-creators-carousel-prev-btn';
const creatorsCarouselNextButton =
  '.e2e-test-teach-page-creators-carousel-next-btn';
const creatorsCarouselNameInTeachPage =
  '.e2e-test-teach-page-lesson-creator-name';
const testimonialCarouselSelectorInTeachPage =
  '.e2e-test-teach-page-testimonial-carousel';
const testimonialCarouselPrevButton =
  '.e2e-test-teach-page-testimonial-carousel-prev-btn';
const testimonialCarouselNextButton =
  '.e2e-test-teach-page-testimonial-carousel-next-btn';
// The following two are external components' selectors so they are not prefixed with "e2e-test".
const testimonialCarouselNameInTeachPage =
  '.carousel-item.active .e2e-test-teach-page-testimonial-name';
const testimonialCarouselIndicatorsInTeachPage = '.carousel-indicators li';
const lessonCreationAccordionExpandButtonInTeachPage =
  '.e2e-test-teach-page-lesson-panel-title';
const lessonCreationAccordionCloseButtonInTeachPage =
  '.e2e-test-teach-page-lesson-panel button';
const lessonCreationAccordionPanelContentInTeachPage =
  '.e2e-test-teach-page-lesson-panel .panel-content';
const blogButtonInTeachPage = '.e2e-test-teach-page-blog-button';
const guideButtonInTeachPage = '.e2e-test-teach-page-guide-button';
const lessonCreatorLinkedinButtonInTeachPage =
  '.e2e-test-teach-page-linkedin-button';
const lessonCreationSectionInTeachPage =
  '.e2e-test-teach-page-lesson-creation-section';
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
const tabsSectionInVolunteerPage = '.e2e-test-volunteer-page-tabs-section';
const tabsPreviousButtonInVolunteerPage =
  '.e2e-test-volunteer-page-tabs-prev-btn';
const tabsNextButtonInVolunteerPage = '.e2e-test-volunteer-page-tabs-next-btn';
const tabsFirstVolunteerExpectationsInVolunteerPage =
  '.e2e-test-volunteer-page-first-expectations';
const tabsSecondVolunteerExpectationsInVolunteerPage =
  '.e2e-test-volunteer-page-second-expectations';
// This is an external component's selector so it is not prefixed with "e2e-test".
const tabsLabelsInVolunteerPage = '.mat-tab-label';
const donorBoxIframe = '.e2e-test-donate-page-iframe';
const languageDropdown = '.e2e-test-language-dropdown';
const featuresSectionInAboutPage = '.e2e-test-about-page-features-section';
const featuresAccordionExpandButtonDesktopInAboutPage =
  '.e2e-test-about-page-features-panel-title-desktop';
const featuresAccordionExpandButtonMobileInAboutPage =
  '.e2e-test-about-page-features-panel-title-mobile';
const featuresAccordionCloseButtonDesktopInAboutPage =
  '.e2e-test-about-page-features-panel button';
const featuresAccordionCloseButtonMobileInAboutPage =
  '.e2e-test-about-page-features-panel-close-button';
const featuresAccordionPanelContentDesktopInAboutPage =
  '.e2e-test-about-page-features-panel .panel-content';
const featuresAccordionPanelContentMobileInAboutPage =
  '.e2e-test-about-page-features-panel-content';
const volunteerCarouselSelectorDesktopInAboutPage =
  '.e2e-test-about-page-volunteer-carousel-desktop';
const volunteerCarouselSelectorMobileInAboutPage =
  '.e2e-test-about-page-volunteer-carousel-mobile';
const volunteerCarouselSlideHeadingDesktopInAboutPage =
  '.active .e2e-test-about-page-volunteer-carousel-slide-heading-desktop';
const volunteerCarouselSlideHeadingMobileInAboutPage =
  '.active .e2e-test-about-page-volunteer-carousel-slide-heading-mobile';
const volunteerCarouselNextButtonDesktopInAboutPage =
  '.e2e-test-about-page-volunteer-carousel-next-button-desktop';
const volunteerCarouselNextButtonMobileInAboutPage =
  '.e2e-test-about-page-volunteer-carousel-next-button-mobile';
const volunteerCarouselPrevButtonDesktopInAboutPage =
  '.e2e-test-about-page-volunteer-carousel-prev-button-desktop';
const volunteerCarouselPrevButtonMobileInAboutPage =
  '.e2e-test-about-page-volunteer-carousel-prev-button-mobile';
const volunteerCarouselSlideHeadingsInAboutPage =
  testConstants.AboutPageVolunteerCarouselHeadings;
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
const volunteerLearnMoreDesktopButtonInAboutPage =
  '.e2e-test-about-page-volunteer-learn-more-desktop-button';
const volunteerLearnMoreMobileButtonInAboutPage =
  '.e2e-test-about-page-volunteer-learn-more-mobile-button';
const partnerLearnMoreDesktopButtonInAboutPage =
  '.e2e-test-about-page-partner-learn-more-desktop-button';
const partnerLearnMoreMobileButtonInAboutPage =
  '.e2e-test-about-page-partner-learn-more-mobile-button';
const impactReportButtonInAboutPage =
  '.e2e-test-about-page-impact-report-button';

const subscribeButton = 'button.oppia-subscription-button';
const unsubscribeLabel = '.e2e-test-unsubscribe-label';
const explorationCard = '.e2e-test-exploration-dashboard-card';

const libraryExplorationsGroupSelector = '.oppia-library-group';

const privacyPolicyLinkInTermsPage = '.e2e-test-privacy-policy-link';
const ccLicenseLinkInTermsPage = '.e2e-test-cc-license-link';
const googleGroupSignUpLinkInTermsPage =
  '.e2e-test-oppia-announce-google-group-link';
const emailLinkSelector = '.oppia-contact-mail';
const mobileDonateButtonOnDonatePage = '.donate-modal-button';
const donateModalIframeSelector = '.e2e-test-donate-page-iframe';
const classroomNameHeading = '.e2e-test-classroom-name';
const errorPageHeading = '.e2e-test-error-page-heading';
const classroomTileContainer = '.oppia-classroom-tile-container';

const submitResponseToInteractionInput = 'oppia-interaction-display input';
const nextCardButton = '.e2e-test-next-card-button';
const nextCardArrowButton = '.e2e-test-next-button';
const submitAnswerButton = '.e2e-test-submit-answer-button';
const explorationCompletionToastMessage = '.e2e-test-lesson-completion-message';
const searchInputSelector = '.e2e-test-search-input';
const categoryFilterDropdownToggler = '.e2e-test-search-bar-dropdown-toggle';
const unselectedFilterOptionsSelector = '.e2e-test-deselected';
const selectedFilterOptionsSelector = '.e2e-test-selected';
const languageFilterDropdownToggler =
  '.oppia-search-bar-dropdown-toggle-button';
const lessonCardTitleSelector = '.e2e-test-exploration-tile-title';
const explorationTitleSelector = '.e2e-test-exp-summary-tile-title';
const explorationRatingSelector = '.e2e-test-exp-summary-tile-rating';
const desktopStoryTitleSelector = '.e2e-test-story-title-in-topic-page';
const mobileStoryTitleSelector = '.e2e-test-mobile-story-title';
const chapterTitleSelector = '.e2e-test-chapter-title';
const oppiaTopicTitleSelector = '.oppia-topic-title';
const topicPageLessonTabSelector = '.e2e-test-revision-tab-link';
const subTopicTitleInLessTabSelector = '.subtopic-title';
const reviewCardTitleSelector = '.oppia-subtopic-title';
const topicNameSelector = '.e2e-test-topic-name';
const loginPromptContainer = '.story-viewer-login-container';
const NavbarBackButton = '.oppia-navbar-back-button';
const lessonCardSelector = '.e2e-test-exploration-dashboard-card';
const nextLessonButton = '.e2e-test-next-lesson-button';
const feedbackPopupSelector = '.e2e-test-exploration-feedback-popup-link';
const feedbackTextarea = '.e2e-test-exploration-feedback-textarea';
const generateAttributionSelector = '.e2e-test-generate-attribution';
const attributionHtmlSectionSelector = '.attribution-html-section';
const attributionHtmlCodeSelector = '.attribution-html-code';
const attributionPrintTextSelector = '.attribution-print-text';
const shareExplorationButtonSelector = '.e2e-test-share-exploration-button';
const reportExplorationButtonSelector = '.e2e-test-report-exploration-button';
const rateOptionsSelector = '.conversation-skin-final-ratings';
const checkpointModalSelector = '.lesson-info-tooltip-add-ons';
const feedbackSelector = '.e2e-test-conversation-feedback-latest';
const previousCardButton = '.e2e-test-back-button';
const hintButtonSelector = '.e2e-test-view-hint';
const gotItButtonSelector = '.e2e-test-learner-got-it-button';
const responsesDropdownSelector = '.conversation-skin-responses-dropdown-text';
const responseSelector = 'oppia-interaction-display';
const closeLessonInfoTooltipSelector = '.e2e-test-close-lesson-info-tooltip';
const viewSolutionButton = '.e2e-test-view-solution';
const stateConversationContent = '.e2e-test-conversation-content';
const closeSolutionModalButton = '.e2e-test-learner-got-it-button';
const continueToSolutionButton = '.e2e-test-continue-to-solution-btn';
const closeAttributionModalButton = '.attribution-modal button';
const embedCodeSelector = '.oppia-embed-modal-code';
const embedLessonButton = '.e2e-test-embed-link';
const signUpButton = '.e2e-test-login-button';
const signInButton = '.conversation-skin-login-button-text';
const singInButtonInProgressModal = '.sign-in-link';
const lessonInfoButton = '.oppia-lesson-info';
const lessonInfoCardSelector = '.oppia-lesson-info-card';
const closeLessonInfoButton = '.e2e-test-close-lesson-info-modal-button';
const resumeExplorationButton = '.resume-button';
const restartExplorationButton = '.restart-button';
const saveProgressButton = '.save-progress-btn';
const createAccountButton = '.create-account-btn';
const validityInfoTextSelector = '.guide-text';
const copyProgressUrlButton = '.oppia-uid-copy-btn';
const progressRemainderModalSelector = '.oppia-progress-reminder-modal';
const viewsContainerSelector = '.e2e-test-info-card-views';
const lastUpdatedInfoSelector = '.e2e-test-info-card-last-updated';
const tagsContainerSelector = '.exploration-tags span';
const ratingContainerSelector = '.e2e-test-info-card-rating span:nth-child(2)';

const LABEL_FOR_SUBMIT_BUTTON = 'Submit and start contributing';
const desktopNavbarButtonsSelector = '.oppia-navbar-tab-content';
const mobileNavbarButtonSelector = '.text-uppercase';
const mainContentSelector = '.e2e-test-main-content';
const openMobileNavbarMenuButton = '.oppia-navbar-menu-icon';
const closeMobileNavbarMenuButton = '.oppia-navbar-close-icon';
const lessonLanguageSelector = '.oppia-content-language-selector';
const playVoiceoverButton = '.e2e-test-play-circle';
const voiceoverDropdown = '.e2e-test-audio-bar';
const pauseVoiceoverButton = '.e2e-test-pause-circle';
const stayAnonymousCheckbox = '.e2e-test-stay-anonymous-checkbox';

const getStartedHeader = '.e2e-test-get-started-page';
const playLaterButton = '.e2e-test-add-to-playlist-btn';
const newsletterEmailInputField = '.e2e-test-newsletter-input';
const newsletterSubscribeButton = '.e2e-test-newsletter-subscribe-btn';
const newsletterSubscriptionThanksMessage =
  '.e2e-test-thanks-subscribe-message';
const watchAVideoButtonInThanksForSubscribe =
  '.e2e-test-thanks-for-subscribe-watch-video-btn';
const readOurBlogButtonInThanksForSubscribe =
  '.e2e-test-thanks-for-subscribe-read-blog-btn';
const readBlogUrl = testConstants.URLs.ReadBlogLink;
/**
 * The KeyInput type is based on the key names from the UI Events KeyboardEvent key Values specification.
 * According to this specification, the keys for the numbers 0 through 9 are named 'Digit0' through 'Digit9'.
 * The 'Control' key is also named as such in the specification and same with others.
 * We use these key names to ensure that our key names match the official specification.
 * For more details, see: https://www.w3.org/TR/uievents-key/#named-key-attribute-values
 */
type KeyInput =
  | 'Shift'
  | 'Control'
  | 'Alt'
  | 'Meta'
  | 'Enter'
  | 'Tab'
  | 'Backspace'
  | 'Delete'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Digit0'
  | 'Digit1'
  | 'Digit2'
  | 'Digit3'
  | 'Digit4'
  | 'Digit5'
  | 'Digit6'
  | 'Digit7'
  | 'Digit8'
  | 'Digit9';

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
   * Function to navigate to the Donation thanks modal on donate page.
   */
  async navigateToDonationThanksModalOnDonatePage(): Promise<void> {
    await this.goto(donatePageThanksModalURL);
  }

  /**
   * Function to navigate to the Donation thanks modal on About page.
   */
  async navigateToDonationThanksModalOnAboutPage(): Promise<void> {
    await this.goto(aboutPageThanksModalURL);
  }

  /**
   * Function to navigate to the Get Started page.
   */
  async navigateToGetStartedPage(): Promise<void> {
    await this.goto(getStartedUrl);
    await this.page.waitForSelector(getStartedHeader);
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
  async navigateToCommunityLibraryPage(): Promise<void> {
    await this.goto(communityLibraryUrl);
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
   * Function to navigate to the classroom page.
   */
  async navigateToClassroomPage(urlFragment: string): Promise<void> {
    await this.goto(`${classroomsPageUrl}/${urlFragment}`);
  }

  /**
   * Function to navigate to the classrooms page.
   */
  async navigateToClassroomsPage(): Promise<void> {
    if (this.page.url() === classroomsPageUrl) {
      await this.page.reload();
    }
    await this.goto(classroomsPageUrl);
  }

  /**
   * Navigates to the splash page.
   */
  async navigateToSplashPage(): Promise<void> {
    await this.goto(splashPageUrl);
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
    await this.clickAndWaitForNavigation(button);

    expect(this.page.url()).toBe(expectedDestinationPageUrl);
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
    if (newTabPage === null) {
      throw new Error(
        `${buttonName} should open the ${expectedDestinationPageName} page`
      );
    }
    expect(newTabPage.url()).toBe(expectedDestinationPageUrl);
    await newTabPage.close();
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
   * Function to open the external link by class and text inside it
   */
  async openExternalLinkBySelectorAndText(
    selector: string,
    linkText: string,
    expectedUrl: string
  ): Promise<void> {
    await this.page.waitForSelector(selector, {visible: true});

    const url = await this.page.$$eval(
      selector,
      (elements, searchText) => {
        for (const element of elements) {
          if (element.textContent?.trim() === searchText) {
            return element.getAttribute('href');
          }
        }
        return null;
      },
      linkText
    );

    if (!url) {
      throw new Error(`Link with text "${linkText}" not found.`);
    }

    if (url !== expectedUrl) {
      throw new Error(`Actual URL differs from expected. Found: ${url}.`);
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
      await this.clickOn(mobileSidebarExpandImpactReportSubMenuButton);
      await this.openExternalLinkBySelectorAndText(
        mobileSidebarImpactReportButton,
        '2023',
        impactReport2023Url
      );
      await this.openExternalLinkBySelectorAndText(
        mobileSidebarImpactReportButton,
        '2022',
        impactReport2022Url
      );
    } else {
      await this.clickOn(navbarAboutTab);
      await this.openExternalLinkBySelectorAndText(
        navbarAboutTabImpactReportButton,
        '2023',
        impactReport2023Url
      );
      await this.openExternalLinkBySelectorAndText(
        navbarAboutTabImpactReportButton,
        '2022',
        impactReport2022Url
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
    const navbarDonateButton = this.isViewportAtMobileWidth()
      ? navbarDonateMobileButton
      : navbarDonateDesktopButton;
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarOpenSidebarButton);
    }
    await this.clickButtonToNavigateToNewPage(
      navbarDonateButton,
      'Donate button on navbar',
      donateUrl,
      'Donate'
    );
  }

  /**
   * Function to click the Watch A Video button
   * in the Donation thanks modal on donate page and check if it opens the right page.
   */
  async clickWatchAVideoButtonInDonationThanksModalOnDonatePage(): Promise<void> {
    await this.page.waitForSelector(watchAVideoButton);
    const buttonText = await this.page.$eval(
      watchAVideoButton,
      element => (element as HTMLElement).innerText
    );
    if (buttonText !== 'Watch a video') {
      throw new Error('The Watch A Video button does not exist!');
    }
    await Promise.all([this.clickAndWaitForNavigation(watchAVideoButton)]);
    await this.waitForPageToFullyLoad();

    const url = this.page.url();
    if (!url.includes(testConstants.OppiaSocials.FaceBook.Domain)) {
      throw new Error(
        `The Watch A Video button should open the right page,
          but it opens ${url} instead.`
      );
    }
    showMessage('The Watch A Video button opens the right page.');
  }

  /**
   * Function to click the Read Our Blog button
   * in the Donation thanks modal on donate page and check if it opens the Blog page.
   */
  async clickReadOurBlogButtonInDonationThanksModalOnDonatePage(): Promise<void> {
    await this.page.waitForSelector(readOurBlogButton);
    const buttonText = await this.page.$eval(
      readOurBlogButton,
      element => (element as HTMLElement).innerText
    );
    if (buttonText !== 'Read our blog') {
      throw new Error('The Read Our Blog button does not exist!');
    }
    await this.clickAndWaitForNavigation(readOurBlogButton);

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
   * Function to click the dismiss button in the Donation thanks modal on Donate page,
   * and check if the Donation thanks modal disappears
   * and if the Donate page is shown.
   */
  async dismissDonationThanksModalOnDonatePage(): Promise<void> {
    await this.clickOn(dismissButton);
    await this.page.waitForSelector(thanksForDonatingClass, {hidden: true});
    const thanksForDonatingHeader = await this.page.$(thanksForDonatingClass);
    if (thanksForDonatingHeader !== null) {
      throw new Error(
        'The dismiss button does not close the Donation thanks modal on Donate page!'
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
        'The dismiss button closes the Donation thanks modal on Donate page ' +
          'and shows the Donate page.'
      );
    }
  }

  /**
   * Function to click the dismiss button on the Donation thanks modal on About page,
   * and check if the Donation thanks modal disappears
   * and if the About page is shown.
   */
  async dismissDonationThanksModalOnAboutPage(): Promise<void> {
    await this.clickOn(dismissButton);
    await this.page.waitForSelector(thanksForDonatingClass, {hidden: true});
    const thanksForDonatingHeader = await this.page.$(thanksForDonatingClass);
    if (thanksForDonatingHeader !== null) {
      throw new Error(
        'The dismiss button does not close the Donation thanks modal on About page!'
      );
    }

    await this.page.waitForSelector(aboutPage);
    const donatePageShowed = await this.page.$(aboutPage);
    if (donatePageShowed === null) {
      throw new Error(
        `The dismiss button should show the About page,
          but it opens ${this.page.url()} instead.`
      );
    } else {
      showMessage(
        'The dismiss button closes the Donation thanks modal on About page ' +
          'and shows the About page.'
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
    await this.clickAndWaitForNavigation(footerForumlink);

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
    if (newTabPage === null) {
      throw new Error('The "create on here" link did not open a new tab');
    }
    expect(newTabPage.url()).toContain(googleSignUpUrl);
    await newTabPage.close();
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
    await this.clickAndWaitForNavigation('discover more ways to get involved');

    expect(this.page.url()).toBe(contactUrl);
  }

  /**
   * Clicks the link with the text "forum" on the Creator Guidelines page.
   */
  async clickForumLinkOnCreatorGuidelinesPage(): Promise<void> {
    await this.page.waitForXPath('//a[contains(text(),"forum")]');
    await Promise.all([this.page.waitForNavigation(), this.clickOn('forum')]);
    await this.waitForNetworkIdle();

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
      'https://allaboutcookies.org/how-to-manage-cookies',
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
   * Click the specified social icon and checks it's destination.
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
    await this.waitForStaticAssetsToLoad();
    const newTarget = await this.browserObject.waitForTarget(
      target => target.opener() === pageTarget
    );
    if (!newTarget) {
      throw new Error('No new tab opened.');
    }
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
   * Function to click the first LinkedIn button in the Teach page
   * and check if it opens corresponding Creator's LinkedIn Url link
   */
  async clickLinkedInButtonInTeachPage(): Promise<void> {
    // Here we are verifying the href attribute of the first LinkedIn button, not clicking it.
    // LinkedIn requires users to log in before accessing profile pages,
    // so the profile page cannot be opened directly.
    await this.openExternalLink(
      lessonCreatorLinkedinButtonInTeachPage,
      lessonCreatorLinkedInUrl
    );
  }

  /**
   * Function to click the Check out our guide button in the Teach page
   * and check if it opens the parents Teachers Guide Url link
   */
  async clickGuideButtonInTeachPage(): Promise<void> {
    await this.openExternalLink(
      guideButtonInTeachPage,
      parentsTeachersGuideUrl
    );
  }

  /**
   * Function to click the Check out our blog button in the Teach page
   * and check if it opens the Teacher Story tagged blogs link
   */
  async clickBlogButtonInTeachPage(): Promise<void> {
    await this.openExternalLink(
      blogButtonInTeachPage,
      teacherStoryTaggedBlogsLink
    );
  }

  /**
   * Function to click the Explore Lessons button  at the top in the Teach page
   * and check if it opens the classrooms page.
   */
  async clickExploreLessonsButtonAtTheTopInTeachPage(): Promise<void> {
    // This button is only visible in mobile view.
    if (this.isViewportAtMobileWidth()) {
      await this.clickButtonToNavigateToNewPage(
        exploreLessonsButtonAtTheTopInTeachPage,
        'Explore Lessons button',
        classroomsPageUrl,
        'Classrooms page'
      );
    }
  }

  /**
   * Function to click the Explore Lessons button  at the bottom in the Teach page
   * and check if it opens the classrooms page.
   */
  async clickExploreLessonsButtonAtTheBottomInTeachPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      exploreLessonsButtonAtTheBottomInTeachPage,
      'Explore Lessons button',
      classroomsPageUrl,
      'Classrooms page'
    );
  }

  /**
   * Function to click the Get Android App button in the Teach page
   * and check if it opens the Android page.
   */
  async clickGetAndroidAppButtonInTeachPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      getAndroidAppButtonInTeachPage,
      'Get Android App button',
      androidUrl,
      'Android page'
    );
  }

  /**
   * Function to verify the testimonial carousel functionality in the Teach page,
   * ensuring that the carousel correctly displays the first and second testimonials
   * and allows navigation back to the first testimonial.
   */
  async expectTestimonailsCarouselToBeFunctionalInTeachPage(): Promise<void> {
    const testimonialCarousel = await this.page.waitForSelector(
      testimonialCarouselSelectorInTeachPage
    );
    if (!testimonialCarousel) {
      throw new Error('The testimonial carousel is not visible.');
    }
    const firstName = testimonialCarouselNamesInTeachPage[0];
    const secondName = testimonialCarouselNamesInTeachPage[1];
    const carouselIndicators = await this.page.$$(
      testimonialCarouselIndicatorsInTeachPage
    );

    const firstTestimonialName = await this.page.$eval(
      testimonialCarouselNameInTeachPage,
      el => el.textContent
    );
    if (!firstTestimonialName?.includes(firstName)) {
      throw new Error(
        `Expected first testimonial name to contain "${firstName}" , but got "${firstTestimonialName}"`
      );
    }

    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(testimonialCarouselNextButton);
    } else {
      await carouselIndicators[1].click();
    }

    // Toggle to the next slide.
    const secondTestimonialName = await this.page.$eval(
      testimonialCarouselNameInTeachPage,
      el => el.textContent
    );
    if (!secondTestimonialName?.includes(secondName)) {
      throw new Error(
        `Expected second testimonial name to contain "${secondName}", but got "${secondTestimonialName}"`
      );
    }

    // Toggle to the previous slide.
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(testimonialCarouselPrevButton);
    } else {
      await carouselIndicators[0].click();
    }

    const firstTestimonialNameAgain = await this.page.$eval(
      testimonialCarouselNameInTeachPage,
      el => el.textContent
    );
    if (!firstTestimonialNameAgain?.includes(firstName)) {
      throw new Error(
        `Expected first testimonial name to contain "${firstName}" again, but got "${firstTestimonialNameAgain}"`
      );
    }
    showMessage('The testimonial carousel in teach page is working correctly.');
  }

  /**
   * Function to verify the lesson creators carousel functionality in the Teach page,
   * ensuring that the carousel correctly displays the first and second testimonials
   * and allows navigation back to the first testimonial.
   */
  async expectLessonCreatorsCarouselToBeFunctionalInTeachPage(): Promise<void> {
    const creatorsCarousel = await this.page.waitForSelector(
      creatorsCarouselSelectorInTeachPage
    );
    if (!creatorsCarousel) {
      throw new Error('The lesson creators carousel is not visible.');
    }
    const firstName = creatorsCarouselNamesInTeachPage[0];
    const secondName = creatorsCarouselNamesInTeachPage[1];

    const firstLessonCreatorName = await this.page.$eval(
      creatorsCarouselNameInTeachPage,
      el => el.textContent
    );
    if (!firstLessonCreatorName?.includes(firstName)) {
      throw new Error(
        `Expected first lesson creator name to contain "${firstName}" , but got "${firstLessonCreatorName}"`
      );
    }

    if (!this.isViewportAtMobileWidth()) {
      // The carousel displays all creators at once in desktop view as it has enough space.
      return;
    }

    // Toggle to the next slide.
    await this.clickOn(creatorsCarouselNextButton);

    const secondLessonCreatorName = await this.page.$eval(
      creatorsCarouselNameInTeachPage,
      el => el.textContent
    );
    if (!secondLessonCreatorName?.includes(secondName)) {
      throw new Error(
        `Expected second lesson creator name to contain "${secondName}", but got "${secondLessonCreatorName}"`
      );
    }

    // Toggle to the previous slide.
    await this.clickOn(creatorsCarouselPrevButton);

    const firstLessonCreatorNameAgain = await this.page.$eval(
      creatorsCarouselNameInTeachPage,
      el => el.textContent
    );
    if (!firstLessonCreatorNameAgain?.includes(firstName)) {
      throw new Error(
        `Expected first lesson creator name to contain "${firstName}" again, but got "${firstLessonCreatorNameAgain}"`
      );
    }
    showMessage(
      'The lesson creators carousel in teach page is working correctly.'
    );
  }

  /**
   * Function to verify the Lesson Creation Steps accordion functionality in the Teach page.
   * It verifies that the expand button opens the corresponding accordion panel content
   * and the close button closes it.
   */
  async expectLessonCreationStepsAccordionToBeFunctionalInTeachPage(): Promise<void> {
    const lessonCreationSection = await this.page.waitForSelector(
      lessonCreationSectionInTeachPage
    );
    if (!lessonCreationSection) {
      throw new Error(
        'The lesson creation section is not visible on the teach page.'
      );
    } else {
      showMessage('The lesson creation section is visible on the teach page.');
    }
    await this.clickOn(lessonCreationAccordionExpandButtonInTeachPage);
    await this.page.waitForSelector(
      lessonCreationAccordionPanelContentInTeachPage,
      {visible: true}
    );
    showMessage('Lesson Creation accordion expand button is working correctly');
    await this.clickOn(lessonCreationAccordionCloseButtonInTeachPage);
    await this.page.waitForSelector(
      lessonCreationAccordionPanelContentInTeachPage,
      {hidden: true}
    );
    showMessage('Lesson Creation accordion close button is working correctly');
  }

  /**
   * Function to change the site language to the given language code.
   * @param langCode - The language code to change the site language to. Example: 'pt-br', 'en'
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
    await this.page.waitForSelector(languageDropdown);
    const languageDropdownElement = await this.page.$(languageDropdown);
    if (languageDropdownElement) {
      await languageDropdownElement.click();
    }
    await this.clickOn(languageOption);
    // Here we need to reload the page again to confirm the language change.
    await this.page.reload();
  }

  /**
   * Function to click the Partner With Us button in the Partnerships page
   * and check if it opens the Partnerships Google form.
   * The button is in the first section of the page.
   */
  async clickPartnerWithUsButtonInPartnershipsPage(): Promise<void> {
    await this.clickLinkButtonToNewTab(
      partnerWithUsButtonAtTheTopOfPartnershipsPage,
      'Partner With Us button at the bottom of the Partnerships page',
      partnershipsFormUrl,
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
    await this.openExternalLink(
      partnerWithUsButtonAtTheBottomOfPartnershipsPage,
      partnershipsFormInPortugueseUrl
    );
    await this.changeSiteLanguage('en');
  }

  /**
   * Function to click the Download Brochure button in the Partnerships page
   * and check if it opens the Partnerships Brochure.
   */
  async clickDownloadBrochureButtonInPartnershipsPage(): Promise<void> {
    const buttonText = (await this.page.$eval(
      brochureButtonInPartnershipsPage,
      element => element.textContent
    )) as string;
    if (buttonText.trim() !== 'Download Brochure') {
      throw new Error('The "Download Brochure" button does not exist!');
    }

    // Scroll into the view to make the button visible.
    await this.page.$eval(brochureButtonInPartnershipsPage, element =>
      element.scrollIntoView()
    );

    await this.openExternalLink(
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
   * Function to verify the Volunteer tabs functionality in the Volunteer page.
   * It checks if the tabs can be toggled through tab-labels in desktop and arrows in mobile.
   */
  async expectVolunteerExpectationsTabsToBeFunctionalInVolunteerPage(): Promise<void> {
    const tabsSection = await this.page.waitForSelector(
      tabsSectionInVolunteerPage
    );
    if (!tabsSection) {
      throw new Error('The tabs section is not visible in Volunteer page');
    }

    const tabLablels = await this.page.$$(tabsLabelsInVolunteerPage);
    const expectedFirstTabHeading = 'Outreach volunteer expectations';
    const expectedSecondTabHeading = 'Software volunteer expectations';

    const firstTabHeading = await this.page.$eval(
      tabsFirstVolunteerExpectationsInVolunteerPage,
      el => el.textContent
    );
    if (!firstTabHeading?.includes(expectedFirstTabHeading)) {
      throw new Error(
        `Expected first tab heading to contain "${expectedFirstTabHeading}" , but got "${firstTabHeading}"`
      );
    }

    // Toggle to the next tab.
    if (!this.isViewportAtMobileWidth()) {
      await tabLablels[1].click();
    } else {
      await this.clickOn(tabsNextButtonInVolunteerPage);
    }

    const secondTabHeading = await this.page.$eval(
      tabsSecondVolunteerExpectationsInVolunteerPage,
      el => el.textContent
    );
    if (!secondTabHeading?.includes(expectedSecondTabHeading)) {
      throw new Error(
        `Expected second tab heading to contain "${expectedSecondTabHeading}", but got "${secondTabHeading}"`
      );
    }

    // Toggle to the previous tab.
    if (!this.isViewportAtMobileWidth()) {
      await tabLablels[0].click();
    } else {
      await this.clickOn(tabsPreviousButtonInVolunteerPage);
    }

    const firstTabAgain = await this.page.$eval(
      tabsFirstVolunteerExpectationsInVolunteerPage,
      el => el.textContent
    );
    if (!firstTabAgain?.includes(expectedFirstTabHeading)) {
      throw new Error(
        `Expected first tab heading to contain "${expectedFirstTabHeading}" again, but got "${firstTabHeading}"`
      );
    }
  }

  /**
   * Function to click the Apply To Volunteer at the top of the Volunteer page
   * and check if it opens the Volunteer form.
   */
  async clickApplyToVolunteerAtTheTopOfVolunteerPage(): Promise<void> {
    await this.clickLinkButtonToNewTab(
      applyToVolunteerButtonAtTheTopOfVolunteerPage,
      'Apply To Volunteer at the top of the Volunteer page',
      volunteerFormUrl,
      'Volunteer Form'
    );
  }

  /**
   * Function to click the Apply To Volunteer at the bottom of the Volunteer page
   * and check if it opens the Volunteer form.
   */
  async clickApplyToVolunteerAtTheBottomOfVolunteerPage(): Promise<void> {
    await this.clickLinkButtonToNewTab(
      applyToVolunteerButtonAtTheBottomOfVolunteerPage,
      'Apply To Volunteer at the bottom of the Volunteer page',
      volunteerFormUrl,
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
   * Function to verify the Features accordion functionality in the About page.
   * It verifies that the expand button opens the corresponding accordion panel content
   * and the close button closes it.
   */
  async expectFeaturesAccordionToBeFunctionalInAboutPage(): Promise<void> {
    const featuresSection = await this.page.waitForSelector(
      featuresSectionInAboutPage
    );
    if (!featuresSection) {
      throw new Error('The features section is not visible on the About page.');
    }

    const featuresAccordionPanelContentInAboutPage =
      this.isViewportAtMobileWidth()
        ? featuresAccordionPanelContentMobileInAboutPage
        : featuresAccordionPanelContentDesktopInAboutPage;
    const featuresAccordionExpandButtonInAboutPage =
      this.isViewportAtMobileWidth()
        ? featuresAccordionExpandButtonMobileInAboutPage
        : featuresAccordionExpandButtonDesktopInAboutPage;
    const featuresAccordionCloseButtonInAboutPage =
      this.isViewportAtMobileWidth()
        ? featuresAccordionCloseButtonMobileInAboutPage
        : featuresAccordionCloseButtonDesktopInAboutPage;

    await this.clickOn(featuresAccordionExpandButtonInAboutPage);
    await this.page.waitForSelector(featuresAccordionPanelContentInAboutPage, {
      visible: true,
    });

    await this.clickOn(featuresAccordionCloseButtonInAboutPage);
    await this.page.waitForSelector(featuresAccordionPanelContentInAboutPage, {
      hidden: true,
    });
  }

  /**
   * Function to verify the Volunteer carousel functionality in the About page,
   * ensuring that the carousel correctly displays the first and second slides
   * and allows navigation back to the first slide.
   */
  async expectVolunteerCarouselToBeFunctionalInAboutPage(): Promise<void> {
    const volunteerCarouselSelectorInAboutPage = !this.isViewportAtMobileWidth()
      ? volunteerCarouselSelectorDesktopInAboutPage
      : volunteerCarouselSelectorMobileInAboutPage;
    const volunteerCarouselSlideHeadingInAboutPage =
      !this.isViewportAtMobileWidth()
        ? volunteerCarouselSlideHeadingDesktopInAboutPage
        : volunteerCarouselSlideHeadingMobileInAboutPage;
    const volunteerCarouselNextButtonInAboutPage =
      !this.isViewportAtMobileWidth()
        ? volunteerCarouselNextButtonDesktopInAboutPage
        : volunteerCarouselNextButtonMobileInAboutPage;
    const volunteerCarouselPrevButtonInAboutPage =
      !this.isViewportAtMobileWidth()
        ? volunteerCarouselPrevButtonDesktopInAboutPage
        : volunteerCarouselPrevButtonMobileInAboutPage;
    const firstSlideHeading = volunteerCarouselSlideHeadingsInAboutPage[0];
    const secondSlideHeading = !this.isViewportAtMobileWidth()
      ? volunteerCarouselSlideHeadingsInAboutPage[2]
      : volunteerCarouselSlideHeadingsInAboutPage[1];

    const volunteerCarousel = await this.page.waitForSelector(
      volunteerCarouselSelectorInAboutPage
    );
    if (!volunteerCarousel) {
      throw new Error('The volunteer carousel in About page is not visible.');
    }

    const firstVolunteerSlideSlideHeading = await this.page.$eval(
      volunteerCarouselSlideHeadingInAboutPage,
      el => el.textContent
    );
    if (!firstVolunteerSlideSlideHeading?.includes(firstSlideHeading)) {
      throw new Error(
        `Expected first volunteer slide heading to contain "${firstSlideHeading}" , but got "${firstVolunteerSlideSlideHeading}"`
      );
    }

    // Toggle to the next slide.
    await this.clickOn(volunteerCarouselNextButtonInAboutPage);

    const secondVolunteerSlideSlideHeading = await this.page.$eval(
      volunteerCarouselSlideHeadingInAboutPage,
      el => el.textContent
    );
    if (!secondVolunteerSlideSlideHeading?.includes(secondSlideHeading)) {
      throw new Error(
        `Expected second volunteer slide heading to contain "${secondSlideHeading}", but got "${secondVolunteerSlideSlideHeading}"`
      );
    }

    // Toggle to the previous slide.
    await this.clickOn(volunteerCarouselPrevButtonInAboutPage);

    const firstVolunteerSlideHeadingAgain = await this.page.$eval(
      volunteerCarouselSlideHeadingInAboutPage,
      el => el.textContent
    );
    if (!firstVolunteerSlideHeadingAgain?.includes(firstSlideHeading)) {
      throw new Error(
        `Expected first volunteer slide heading to contain "${firstSlideHeading}" again, but got "${firstVolunteerSlideHeadingAgain}"`
      );
    }
  }

  /**
   * Function to click the "View Report" button on the About Page
   * and check if it opens the Impact Report.
   */
  async clickViewReportButtonInAboutPage(): Promise<void> {
    await this.openExternalLink(
      impactReportButtonInAboutPage,
      impactReport2023Url
    );
  }

  /**
   * Function to click the Volunteer with Oppia on the about page
   * and check if it opens the Volunteer form.
   */
  async clickVolunteerWithOppiaButtonInAboutPage(): Promise<void> {
    const volunteerWithOppiaButtonInAboutPage = this.isViewportAtMobileWidth()
      ? volunteerWithOppiaMobileButtonInAboutPage
      : volunteerWithOppiaDesktopButtonInAboutPage;
    await this.clickLinkButtonToNewTab(
      volunteerWithOppiaButtonInAboutPage,
      'Apply To Volunteer at the top of the Volunteer page',
      volunteerFormUrl,
      'Volunteer Form'
    );
  }

  /**
   * Function to click the Learn More button of Volunteer tab on the about page
   * and check if it opens the Volunteer page.
   */
  async clickVolunteerLearnMoreButtonInAboutPage(): Promise<void> {
    const volunteerLearnMoreButtonInAboutPage = this.isViewportAtMobileWidth()
      ? volunteerLearnMoreMobileButtonInAboutPage
      : volunteerLearnMoreDesktopButtonInAboutPage;
    await this.clickButtonToNavigateToNewPage(
      volunteerLearnMoreButtonInAboutPage,
      'Learn More button of Volunteer tab',
      volunteerUrl,
      'Volunteer'
    );
  }

  /**
   * Function to click the Learn More button of Partner tab on the about page
   * and check if it opens the partnerships page.
   */
  async clickPartnerLearnMoreButtonInAboutPage(): Promise<void> {
    const partnerTab = this.isViewportAtMobileWidth()
      ? partnerMobileTabInAboutPage
      : partnerDesktopTabInAboutPage;
    const partnerLearnMoreButtonInAboutPage = this.isViewportAtMobileWidth()
      ? partnerLearnMoreMobileButtonInAboutPage
      : partnerLearnMoreDesktopButtonInAboutPage;

    await this.clickOn(partnerTab);
    await this.clickButtonToNavigateToNewPage(
      partnerLearnMoreButtonInAboutPage,
      'Learn More button of Partner tab',
      partnershipsUrl,
      'Partnerships'
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
    await this.openExternalLink(
      partnerWithUsButtonInAboutPage,
      partnershipsFormUrl
    );
  }

  /**
   * This function verifies that the classroom cards are present in the classrooms page.
   * @param {number} classroomsCount - The expected number of classrooms.
   */
  async expectClassroomCountInClassroomsPageToBe(
    classroomsCount: number
  ): Promise<void> {
    await this.page.waitForSelector(classroomTileContainer);
    const classroomTiles = await this.page.$$(classroomTileContainer);

    if (classroomTiles.length === classroomsCount) {
      showMessage(
        `${classroomsCount} classrooms are present in classrooms page.`
      );
    } else {
      throw new Error(
        `Expect ${classroomsCount} classrooms to be present in classrooms page, found: ${classroomTiles.length} classrooms.`
      );
    }
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

    const partnerTab = this.isViewportAtMobileWidth()
      ? partnerMobileTabInAboutPage
      : partnerDesktopTabInAboutPage;

    const partnerWithUsButtonInAboutPage = this.isViewportAtMobileWidth()
      ? partnerWithUsMobileButtonInAboutPage
      : partnerWithUsDesktopButtonInAboutPage;

    await this.clickOn(partnerTab);
    await this.openExternalLink(
      partnerWithUsButtonInAboutPage,
      partnershipsFormInPortugueseUrl
    );
    await this.changeSiteLanguage('en');
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

  /**
   * Clicks on the donate button on the donate page in mobile mode and waits
   *  for the second iframe to appear(one used in the mobile viewport).
   * @returns {Promise<void>}
   */
  async clickDonateButtonOnDonatePageInMobileMode(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      try {
        await this.page.waitForSelector(mobileDonateButtonOnDonatePage, {
          visible: true,
        });
        const donateButton = await this.page.$(mobileDonateButtonOnDonatePage);
        await donateButton?.click();

        await this.page.waitForFunction(
          `document.querySelectorAll("${donateModalIframeSelector}").length === 2`
        );
      } catch (error) {
        const newError = new Error(
          `Failed to find the donate modal after clicking the donate button.
          Original error: ${error.message}`
        );
        newError.stack = error.stack;
        throw newError;
      }
    } else {
      return;
    }
  }

  /**
   * This function verifies that the user is on the correct classroom page.
   */
  async expectToBeOnClassroomPage(classroomName: string): Promise<void> {
    await this.page.waitForSelector(classroomNameHeading);

    const buttonText = await this.page.$eval(
      classroomNameHeading,
      element => (element as HTMLHeadElement).innerText
    );

    if (buttonText !== classroomName) {
      throw new Error(
        `The ${classroomName} classroom name is not visible. URL: ${this.page.url()}`
      );
    } else {
      showMessage(`The ${classroomName} classroom name is visible.`);
    }
  }

  /**
   * This function verifies that the classroom cards in classrooms page.
   */
  async expectClassroomCountInClassroomsPageUrlToBe(
    classroomsCount: number
  ): Promise<void> {
    await this.page.waitForSelector(classroomTileContainer);
    const classroomTiles = await this.page.$$(classroomTileContainer);

    if (classroomTiles.length === classroomsCount) {
      showMessage(
        `${classroomsCount} classrooms are present in classrooms page.`
      );
    } else {
      throw new Error(
        `Expect ${classroomsCount} classrooms to be present in classrooms page, found: ${classroomTiles.length} classrooms.`
      );
    }
  }

  /**
   * This function verifies that the user is on the correct classroom page.
   */
  async expectToBeOnErrorPage(statusCode: number): Promise<void> {
    await this.page.waitForSelector(errorPageHeading);

    const errorText = await this.page.$eval(
      errorPageHeading,
      element => (element as HTMLSpanElement).textContent
    );

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
   * Function to navigate to the next card in the preview tab.
   */
  async continueToNextCard(): Promise<void> {
    try {
      await this.page.waitForSelector(nextCardButton, {timeout: 7000});
      await this.clickOn(nextCardButton);
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        await this.clickOn(nextCardArrowButton);
      } else {
        throw error;
      }
    }
  }

  /**
   * Function to submit an answer to a form input field.
   * @param {string} answer - The answer to submit.
   */
  async submitAnswer(answer: string): Promise<void> {
    await this.waitForElementToBeClickable(submitResponseToInteractionInput);
    await this.type(submitResponseToInteractionInput, answer);
    await this.clickOn(submitAnswerButton);
  }

  /**
   * Function to submit an email to the newsletter input field.
   * @param {string} email - The email to submit.
   */
  async submitEmailForNewsletter(email: string): Promise<void> {
    await this.waitForElementToBeClickable(newsletterEmailInputField);
    await this.type(newsletterEmailInputField, email);
    await this.clickOn(newsletterSubscribeButton);
  }

  /**
   * Function to check for presence of Thanks Message to verify Newsletter Subscription.
   */
  async expectNewsletterSubscriptionThanksMessage(): Promise<void> {
    await this.page.waitForSelector(newsletterSubscriptionThanksMessage);
    const thanksMessage = await this.page.$eval(
      newsletterSubscriptionThanksMessage,
      element => element.textContent
    );

    if (!thanksMessage || !thanksMessage.includes('Thanks for subscribing!')) {
      throw new Error('Thank you message does not exist or incorrect');
    }

    showMessage('Subscribed to newsletter successfully');
  }

  /**
   * Function to verify the Watch a Video button after subscribing to newsletter.
   */
  async clickWatchAVideoButton(): Promise<void> {
    await this.page.waitForSelector(watchAVideoButtonInThanksForSubscribe);
    const buttonText = await this.page.$eval(
      watchAVideoButtonInThanksForSubscribe,
      element => (element as HTMLElement).innerText
    );
    if (buttonText !== 'Watch a video') {
      throw new Error('The Watch A Video button does not exist!');
    }
    await Promise.all([
      this.clickAndWaitForNavigation(watchAVideoButtonInThanksForSubscribe),
    ]);
    await this.waitForPageToFullyLoad();

    const url = this.page.url();
    if (!url.includes(testConstants.OppiaSocials.YouTube.Domain)) {
      throw new Error(
        `The Watch A Video button should open the right page,
          but it opens ${url} instead.`
      );
    }
    showMessage('The Watch A Video button opens the right page.');
  }

  /**
   * Function to verify the Read Blog button after subscribing to newsletter.
   */
  async clickReadBlogButton(): Promise<void> {
    await this.page.waitForSelector(readOurBlogButtonInThanksForSubscribe);
    const buttonText = await this.page.$eval(
      readOurBlogButtonInThanksForSubscribe,
      element => (element as HTMLElement).innerText
    );
    if (buttonText !== 'Read our blog') {
      throw new Error('The Read Our Blog button does not exist!');
    }
    await this.clickAndWaitForNavigation(readOurBlogButtonInThanksForSubscribe);

    if (this.page.url() !== readBlogUrl) {
      throw new Error(
        `The Read Our Blog button should open the Blog page,
          but it opens ${this.page.url()} instead.`
      );
    } else {
      showMessage('The Read Our Blog button opens the Blog page.');
    }
  }
  /**
   * Function to verify that the user is on the login page.
   */
  async expectToBeOnLoginPage(): Promise<void> {
    const currentUrl = new URL(this.page.url());
    expect(currentUrl.pathname.startsWith('/login')).toBe(true);
  }

  /**
   * Function to navigate to the Creator Dashboard.
   */
  async navigateToCreatorDashboard(): Promise<void> {
    await this.goto(creatorDashboardUrl);
  }

  /**
   * Function to navigate to the Moderator Page.
   */
  async navigateToModeratorPage(): Promise<void> {
    await this.goto(moderatorPageUrl);
  }

  /**
   * Function to navigate to the Preferences Page.
   */
  async navigateToPreferencesPage(): Promise<void> {
    await this.goto(preferencesPageUrl);
  }

  /**
   * Function to navigate to the Topics and Skills Dashboard Page.
   */
  async navigateToTopicsAndSkillsDashboardPage(): Promise<void> {
    await this.goto(topicsAndSkillsDashboardUrl);
  }

  /**
   * Function to verify that the user cannot add an exploration to the Play Later list.
   */
  async expectCannotAddExplorationToPlayLater(): Promise<void> {
    const isButtonVisible = (await this.page.$(playLaterButton)) !== null;
    expect(isButtonVisible).toBe(false);
  }

  /**
   * Function to navigate to the Learner Dashboard.
   */
  async navigateToLearnerDashboard(): Promise<void> {
    await this.goto(learnerDashboardUrl);
  }

  /**
   * Function to verify if the exploration is completed via checking the toast message.
   * @param {string} message - The expected toast message.
   */
  async expectExplorationCompletionToastMessage(
    message: string
  ): Promise<void> {
    await this.page.waitForSelector(explorationCompletionToastMessage);

    const toastMessage = await this.page.$eval(
      explorationCompletionToastMessage,
      element => element.textContent
    );

    if (!toastMessage || !toastMessage.includes(message)) {
      throw new Error('Exploration did not complete successfully');
    }

    showMessage('Exploration has completed successfully');

    await this.page.waitForSelector(explorationCompletionToastMessage, {
      hidden: true,
    });
  }

  /**
   * Searches for a lesson in the search bar present in the community library.
   * @param {string} lessonName - The name of the lesson to search for.
   */
  async searchForLessonInSearchBar(lessonName: string): Promise<void> {
    await this.clickOn(searchInputSelector);
    await this.type(searchInputSelector, lessonName);

    await this.page.keyboard.press('Enter');
    await this.page.waitForNavigation({waitUntil: ['load', 'networkidle0']});
  }

  /**
   * Filters lessons by multiple categories.
   * @param {string[]} categoryNames - The names of the categories to filter by.
   */
  async filterLessonsByCategories(categoryNames: string[]): Promise<void> {
    await this.clickOn(categoryFilterDropdownToggler);
    await this.waitForStaticAssetsToLoad();

    await this.page.waitForSelector(unselectedFilterOptionsSelector);
    const filterOptions = await this.page.$$(unselectedFilterOptionsSelector);
    let foundMatch = false;

    for (const option of filterOptions) {
      const optionText = await this.page.evaluate(
        el => el.textContent.trim(),
        option
      );

      if (categoryNames.includes(optionText.trim())) {
        foundMatch = true;
        await this.waitForElementToBeClickable(option);
        await option.click();
      }
    }

    if (!foundMatch) {
      throw new Error(
        `No match found for categories: ${categoryNames.join(', ')}`
      );
    }

    await this.clickOn(searchInputSelector);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Filters lessons by multiple languages and deselect the already selected English language.
   * @param {string[]} languageNames - The names of the languages to filter by.
   */
  async filterLessonsByLanguage(languageNames: string[]): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.waitForPageToFullyLoad();
    }
    await this.page.waitForSelector(languageFilterDropdownToggler);
    const languageFilterDropdownTogglerElement = await this.page.$(
      languageFilterDropdownToggler
    );
    await languageFilterDropdownTogglerElement?.click();
    await this.waitForStaticAssetsToLoad();

    await this.page.waitForSelector(selectedFilterOptionsSelector);
    const selectedElements = await this.page.$$(selectedFilterOptionsSelector);
    for (const element of selectedElements) {
      const elementText = await this.page.evaluate(
        el => el.textContent.trim(),
        element
      );
      // Deselecting english language.
      if (elementText === 'English') {
        await element.click();
      }
    }

    await this.page.waitForSelector(unselectedFilterOptionsSelector);
    const deselectedLanguages = await this.page.$$(
      unselectedFilterOptionsSelector
    );
    let foundMatch = false;

    for (const language of deselectedLanguages) {
      const languageText = await this.page.evaluate(
        el => el.textContent,
        language
      );

      if (languageNames.includes(languageText.trim())) {
        foundMatch = true;
        await this.waitForElementToBeClickable(language);
        await language.click();
      }
    }

    if (!foundMatch) {
      throw new Error(
        `No match found for languages: ${languageNames.join(', ')}`
      );
    }

    await this.clickOn(searchInputSelector);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Checks if the search results contain a specific result.
   * @param {string[]} searchResultsExpected - The search result to check for.
   */
  async expectSearchResultsToContain(
    searchResultsExpected: string[]
  ): Promise<void> {
    try {
      if (searchResultsExpected.length === 0) {
        await this.waitForPageToFullyLoad();
        const searchResultsElements = await this.page.$$(
          lessonCardTitleSelector
        );
        if (searchResultsElements.length !== 0) {
          throw new Error('No search results expected, but some were found.');
        }
      } else {
        await this.page.waitForSelector(lessonCardTitleSelector);
        const searchResultsElements = await this.page.$$(
          lessonCardTitleSelector
        );
        const searchResults = await Promise.all(
          searchResultsElements.map(result =>
            this.page.evaluate(el => el.textContent.trim(), result)
          )
        );

        for (const resultExpected of searchResultsExpected) {
          if (!searchResults.includes(resultExpected)) {
            throw new Error(
              `Search result "${resultExpected}" not found in search results.`
            );
          }
        }
        showMessage('All expected search results found in search results.');
      }
    } catch (error) {
      const newError = new Error(`Failed to check search results: ${error}`);
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Navigates to the top rated explorations page from the community library.
   */
  async navigateToTopRatedLessonsPage(): Promise<void> {
    await this.navigateToCommunityLibraryPage();
    await this.clickAndWaitForNavigation('Top-Rated Explorations');
  }

  /**
   * Checks if the top rated explorations are in a specific order.
   * @param {string[]} expectedOrder - The expected order of the top rated explorations.
   */
  async expectLessonsInOrder(expectedOrder: string[]): Promise<void> {
    try {
      await this.page.waitForSelector(explorationTitleSelector);
      const explorationTitles = await this.page.$$(explorationTitleSelector);
      for (let i = 0; i < explorationTitles.length; i++) {
        const titleText = await this.page.evaluate(
          el => el.querySelector('span > span').textContent,
          explorationTitles[i]
        );
        if (titleText.trim() !== expectedOrder[i]) {
          throw new Error(
            `Exploration at position ${i} is "${titleText.trim()}", but expected "${expectedOrder[i]}".`
          );
        }
      }
    } catch (error) {
      const newError = new Error(
        `Failed to check order explorations: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Navigates to the page recently published explorations page.
   */
  async navigateToRecentlyPublishedLessonsPage(): Promise<void> {
    await this.goto(recentlyPublishedExplorationsPageUrl);
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
      await this.page.waitForSelector(lessonCardSelector);
      const cards = await this.page.$$(lessonCardSelector);
      for (const card of cards) {
        await card.waitForSelector(lessonCardTitleSelector);
        const titleElement = await card.$(lessonCardTitleSelector);
        const titleText = await this.page.evaluate(
          el => el.textContent.trim(),
          titleElement
        );
        if (titleText === expectedExplorationName) {
          await card.waitForSelector(explorationRatingSelector);
          const ratingElement = await card.$(explorationRatingSelector);
          if (ratingElement) {
            const ratingSpan = await ratingElement.$('span:nth-child(2)');
            const ratingText = await this.page.evaluate(
              el => el.textContent.trim(),
              ratingSpan
            );
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
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Checks if a list of topics are present.
   * @param {string[]} expectedTopicNames - The names of the topics to check for.
   */
  async expectTopicsToBePresent(expectedTopicNames: string[]): Promise<void> {
    try {
      await this.page.waitForSelector(topicNameSelector);
      const topicNames = await this.page.$$(topicNameSelector);
      const topicNameTexts = await Promise.all(
        topicNames.map(name =>
          this.page.evaluate(el => el.textContent.trim(), name)
        )
      );

      for (const expectedName of expectedTopicNames) {
        if (!topicNameTexts.includes(expectedName.trim())) {
          throw new Error(`Topic "${expectedName}" not found in topic names.`);
        }
      }
    } catch (error) {
      const newError = new Error(`Failed to check for topics: ${error}`);
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Selects and opens a topic by its name.
   * @param {string} topicName - The name of the topic to select and open.
   */
  async selectAndOpenTopic(topicName: string): Promise<void> {
    try {
      await this.page.waitForSelector(topicNameSelector);
      const topicNames = await this.page.$$(topicNameSelector);
      for (const name of topicNames) {
        const nameText = await this.page.evaluate(
          el => el.textContent.trim(),
          name
        );
        if (nameText === topicName.trim()) {
          await Promise.all([
            this.page.waitForNavigation({waitUntil: ['networkidle2', 'load']}),
            this.waitForElementToBeClickable(name),
            name.click(),
          ]);
          return;
        }
      }

      throw new Error(`Topic "${topicName}" not found in topic names.`);
    } catch (error) {
      const newError = new Error(`Failed to select and open topic: ${error}`);
      newError.stack = error.stack;
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
      await this.page.waitForSelector(storyTitleSelector);
      const storyTitles = await this.page.$$(storyTitleSelector);
      for (const title of storyTitles) {
        const titleText = await this.page.evaluate(
          el => el.textContent.trim(),
          title
        );
        if (titleText.trim() === storyName.trim()) {
          await Promise.all([
            this.page.waitForNavigation({waitUntil: ['networkidle0', 'load']}),
            this.waitForElementToBeClickable(title),
            title.click(),
          ]);

          await this.skipLoginPrompt();

          await this.page.waitForSelector(chapterTitleSelector);
          const chapterTitles = await this.page.$$(chapterTitleSelector);
          for (const chapter of chapterTitles) {
            const chapterText = await this.page.evaluate(
              el => el.textContent.trim(),
              chapter
            );
            if (chapterText.trim().includes(chapterName.trim())) {
              await Promise.all([
                this.page.waitForNavigation({
                  waitUntil: ['networkidle2', 'load'],
                }),
                this.waitForElementToBeClickable(chapter),
                chapter.click(),
              ]);
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
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Selects and plays a chapter by it's name/title when inside a story.
   * @param {string} chapterName - The name of the chapter to play.
   */
  async selectAndPlayChapter(chapterName: string): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    try {
      await this.skipLoginPrompt();
      await this.page.waitForSelector(chapterTitleSelector);
      const chapterTitles = await this.page.$$(chapterTitleSelector);
      for (const chapter of chapterTitles) {
        const chapterText = await this.page.evaluate(
          el => el.textContent.trim(),
          chapter
        );
        if (chapterText.trim().includes(chapterName.trim())) {
          await Promise.all([
            this.page.waitForNavigation({
              waitUntil: ['networkidle2', 'load'],
            }),
            this.waitForElementToBeClickable(chapter),
            chapter.click(),
          ]);
          return;
        }
      }

      throw new Error(`Chapter "${chapterName}" not found.`);
    } catch (error) {
      const newError = new Error(`Failed to play chapter: ${error}`);
      newError.stack = error.stack;
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
      await this.clickOn('SKIP');
    }
  }

  /**
   * Navigates back to the topic page after completing an exploration.
   */
  async returnToTopicPageAfterCompletingExploration(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickAndWaitForNavigation('Return to Story');
      await this.clickAndWaitForNavigation(NavbarBackButton);
    } else {
      await this.clickAndWaitForNavigation(oppiaTopicTitleSelector);
    }
  }

  /**
   * Navigates to the revision tab on the topic page.
   */
  async navigateToRevisionTab(): Promise<void> {
    await this.page.waitForSelector(topicPageLessonTabSelector);
    const topicPageRevisionTabSelectorElement = await this.page.$(
      topicPageLessonTabSelector
    );
    await topicPageRevisionTabSelectorElement?.click();
  }

  /**
   * Selects a review card based on the subtopic name.
   * @param {string} subtopicName - The name of the subtopic to select.
   */
  async selectReviewCardToLearn(subtopicName: string): Promise<void> {
    try {
      const subtopicElements = await this.page.$$(
        subTopicTitleInLessTabSelector
      );

      for (let i = 0; i < subtopicElements.length; i++) {
        const innerText = await this.page.evaluate(
          el => el.innerText,
          subtopicElements[i]
        );

        if (innerText.trim() === subtopicName) {
          await Promise.all([
            this.page.waitForNavigation({
              waitUntil: ['networkidle0', 'load'],
            }),
            this.waitForElementToBeClickable(subtopicElements[i]),
            subtopicElements[i].click(),
          ]);
          return;
        }
      }

      throw new Error(`No subtopic found with the name: ${subtopicName}`);
    } catch (error) {
      const newError = new Error(`Failed to select review card: ${error}`);
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Verifies if the review card has the expected title and description.
   * @param {string} reviewCardTitle - The expected title of the review card.
   * @param {string} reviewCardDescription - The expected description of the review card.
   */
  async expectReviewCardToHaveContent(
    reviewCardTitle: string,
    reviewCardDescription: string
  ): Promise<void> {
    try {
      const titleElement = await this.page.$(reviewCardTitleSelector);

      // Get the innerText of the title element.
      const titleText = await this.page.evaluate(
        el => el.innerText,
        titleElement
      );

      if (titleText.trim() !== reviewCardTitle) {
        throw new Error(
          `Expected review card title to be ${reviewCardTitle}, but found ${titleText}`
        );
      }

      const isDescriptionPresent = await this.isTextPresentOnPage(
        reviewCardDescription
      );

      if (!isDescriptionPresent) {
        throw new Error(
          'Expected review card description to be present on the page, but it was not found'
        );
      }
    } catch (error) {
      const newError = new Error(
        `Failed to verify content of review card: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Loads the next chapter from the last state of an exploration.
   */
  async loadNextChapterFromLastState(): Promise<void> {
    // TODO(#12345): Currently, this test is skipped for mobile viewport due to an issue where
    // the button is not clickable because it's hidden by the footer.
    // Once the issue is fixed (see: https://github.com/oppia/oppia/issues/12345),
    // remove the skip part to enable this method for mobile viewport too.
    if (this.isViewportAtMobileWidth()) {
      return;
    }
    await this.page.waitForSelector(explorationCompletionToastMessage, {
      hidden: true,
    });

    await this.clickAndWaitForNavigation(nextLessonButton);
  }

  /**
   * Returns to the story from the last state of an exploration.
   */
  async returnToStoryFromLastState(): Promise<void> {
    await this.clickAndWaitForNavigation('Return to Story');
    showMessage('Returned to story from the last state.');
  }

  /**
   * Searches for a specific lesson in the search results and opens it.
   * @param {string} lessonTitle - The title of the lesson to search for.
   */
  async playLessonFromSearchResults(lessonTitle: string): Promise<void> {
    try {
      await this.page.waitForSelector(lessonCardTitleSelector);
      const searchResultsElements = await this.page.$$(lessonCardTitleSelector);
      const searchResults = await Promise.all(
        searchResultsElements.map(result =>
          this.page.evaluate(el => el.textContent.trim(), result)
        )
      );

      const lessonIndex = searchResults.indexOf(lessonTitle);
      if (lessonIndex === -1) {
        throw new Error(`Lesson "${lessonTitle}" not found in search results.`);
      }

      await this.waitForElementToBeClickable(
        searchResultsElements[lessonIndex]
      );
      await searchResultsElements[lessonIndex].click();
      await this.waitForStaticAssetsToLoad();
      showMessage(`Lesson "${lessonTitle}" opened from search results.`);
    } catch (error) {
      const newError = new Error(
        `Failed to open lesson from search results: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Gives feedback on the exploration.
   * @param {string} feedback - The feedback to give on the exploration.
   * @param {boolean} stayAnonymous - Whether to stay anonymous while giving feedback.
   */
  async giveFeedback(feedback: string, stayAnonymous?: boolean): Promise<void> {
    // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
    // in mobile viewport which is required for testing the feedback messages tab),
    // remove this part of skipping this function for Mobile viewport and make it run in mobile viewport
    // as well. see: https://github.com/oppia/oppia/issues/19443.
    if (process.env.MOBILE === 'true') {
      return;
    }
    await this.page.waitForSelector('nav-options', {visible: true});
    await this.clickOn(feedbackPopupSelector);
    await this.page.waitForSelector(feedbackTextarea, {visible: true});
    await this.type(feedbackTextarea, feedback);

    // If stayAnonymous is true, clicking on the "stay anonymous" checkbox.
    if (stayAnonymous) {
      await this.clickOn(stayAnonymousCheckbox);
    }

    await this.clickOn('Submit');

    try {
      await this.page.waitForFunction(
        'document.querySelector(".oppia-feedback-popup-container") !== null',
        {timeout: 5000}
      );
      showMessage('Feedback submitted successfully');
    } catch (error) {
      throw new Error('Feedback was not successfully submitted');
    }
  }

  /**
   * Generates attribution
   */
  async generateAttribution(): Promise<void> {
    await this.page.waitForSelector(generateAttributionSelector, {
      visible: true,
    });
    await this.clickOn(generateAttributionSelector);

    await this.page.waitForSelector(attributionHtmlSectionSelector, {
      visible: true,
    });
  }

  /**
   * Checks if the HTML string is present in the HTML section.
   * @param {string} htmlString - The HTML string to check for.
   */
  async expectAttributionInHtmlSectionToBe(htmlString: string): Promise<void> {
    const attributionHtmlCodeElement = await this.page.$(
      attributionHtmlCodeSelector
    );
    const attributionHtmlCode = await this.page.evaluate(
      el => el.textContent,
      attributionHtmlCodeElement
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
    await this.page.waitForSelector(attributionPrintTextSelector, {
      visible: true,
    });

    const attributionPrintTextElement = await this.page.$(
      attributionPrintTextSelector
    );
    const attributionPrintText = await this.page.evaluate(
      el => el.textContent,
      attributionPrintTextElement
    );

    if (!attributionPrintText.includes(textString)) {
      throw new Error(
        `Expected text string "${textString}" not found in the print text. Actual text: "${attributionPrintText}"`
      );
    }
  }

  /**
   * Function to close the attribution modal.
   */
  async closeAttributionModal(): Promise<void> {
    await this.clickOn(closeAttributionModalButton);
    showMessage('Attribution modal closed successfully');
  }

  /**
   * Shares the exploration.
   * @param {string} platform - The platform to share the exploration on. This should be the name of the platform (e.g., 'facebook', 'twitter')
   * @param {string | null} explorationId - The id of the exploration.
   */
  async shareExploration(
    platform: string,
    explorationId: string | null
  ): Promise<void> {
    await this.clickOn(shareExplorationButtonSelector);

    await this.waitForStaticAssetsToLoad();
    await this.page.waitForSelector(
      `.e2e-test-share-link-${platform.toLowerCase()}`,
      {visible: true}
    );
    const aTag = await this.page.$(
      `.e2e-test-share-link-${platform.toLowerCase()}`
    );
    if (!aTag) {
      throw new Error(`No share link found for ${platform}.`);
    }
    const href = await this.page.evaluate(a => a.href, aTag);
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
   * Function to embed a lesson.
   */
  async embedThisLesson(expectedCode: string): Promise<void> {
    await this.clickOn(shareExplorationButtonSelector);

    await this.waitForStaticAssetsToLoad();
    await this.clickOn(embedLessonButton);
    await this.page.waitForSelector(embedCodeSelector);
    const embedCode = await this.page.$eval(
      embedCodeSelector,
      element => element.textContent
    );
    if (embedCode?.trim() !== expectedCode) {
      throw new Error(
        'Embed code does not match the expected code. Expected: ' +
          expectedCode +
          ', Found: ' +
          embedCode
      );
    }
    await this.clickOn('Close');
  }

  /**
   * Checks if the report exploration button is not available.
   */
  async expectReportOptionsNotAvailable(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    const reportExplorationButton = await this.page.$(
      reportExplorationButtonSelector
    );
    if (reportExplorationButton !== null) {
      throw new Error('Report exploration button found.');
    }
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

  /*
   * Function to verify if the checkpoint modal appears on the screen.
   */
  async verifyCheckpointModalAppears(): Promise<void> {
    try {
      await this.page.waitForSelector(checkpointModalSelector, {
        visible: true,
        timeout: 5000,
      });
      showMessage('Checkpoint modal found.');
      // Closing the checkpoint modal.
      await this.clickOn(closeLessonInfoTooltipSelector);
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        const newError = new Error('Checkpoint modal not found.');
        newError.stack = error.stack;
        throw newError;
      }
      throw error;
    }
  }

  /**
   * Function to verify if the latest Oppia feedback matches the expected feedback.
   * @param {string} expectedFeedback - The expected feedback.
   */
  async expectOppiaFeedbackToBe(expectedFeedback: string): Promise<void> {
    await this.page.waitForSelector(feedbackSelector);
    const feedbackText = await this.page.$eval(
      `${feedbackSelector} > p`,
      element => element.textContent
    );
    if (feedbackText !== expectedFeedback) {
      throw new Error(
        `Expected feedback to be '${expectedFeedback}', but got '${feedbackText}'.`
      );
    }
  }

  /**
   * Function to navigate to the previous card in an exploration.
   */
  async goBackToPreviousCard(): Promise<void> {
    await this.clickOn(previousCardButton);
  }

  /**
   * Function to verify if the page does not have any input fields.
   */
  async verifyCannotAnswerPreviouslyAnsweredQuestion(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    const hasInputFields = await this.page.$('input');
    if (hasInputFields) {
      throw new Error('The page should not have any input fields.');
    }
    showMessage('The page does not have any input fields, as expected.');
  }

  /**
   * Function to use a hint.
   */
  async viewHint(): Promise<void> {
    await this.page.waitForSelector(hintButtonSelector);
    await this.clickOn(hintButtonSelector);
  }

  /**
   * Function to close the hint modal.
   */
  async closeHintModal(): Promise<void> {
    await this.page.waitForSelector(gotItButtonSelector, {visible: true});
    await this.clickOn(gotItButtonSelector);
    await this.page.waitForSelector(gotItButtonSelector, {hidden: true});
  }
  /**
   * Simulates the action of viewing the solution by clicking on the view solution button and the continue to solution button.
   */
  async viewSolution(): Promise<void> {
    await this.clickOn(viewSolutionButton);
    await this.clickOn(continueToSolutionButton);
  }

  /**
   * Closes the solution modal by clicking on the close solution modal button.
   */
  async closeSolutionModal(): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(closeSolutionModalButton, {visible: true});
    const closeSolutionModalButtonElement = await this.page.$(
      closeSolutionModalButton
    );
    await closeSolutionModalButtonElement?.click();
  }
  /**
   * Function to view previous responses in a state.
   * This function clicks on the responses dropdown selector to display previous responses.
   */
  async viewPreviousResponses(): Promise<void> {
    await this.clickOn(responsesDropdownSelector);
  }

  /**
   * Function to verify the number of previous responses displayed.
   * @param {number} expectedNumberOfResponses - The expected number of responses.
   */
  async verifyNumberOfPreviousResponsesDisplayed(
    expectedNumberOfResponses: number
  ): Promise<void> {
    await this.page.waitForSelector(responseSelector);

    const responseElements = await this.page.$$(responseSelector);
    if (responseElements.length !== expectedNumberOfResponses) {
      throw new Error(
        `Expected ${expectedNumberOfResponses} responses, but got ${responseElements.length}.`
      );
    }
  }

  /**
   * Checks if the current card's content matches the expected content.
   * @param {string} expectedCardContent - The expected content of the card.
   */
  async expectCardContentToMatch(expectedCardContent: string): Promise<void> {
    await this.waitForPageToFullyLoad();

    await this.page.waitForSelector(`${stateConversationContent} p`, {
      visible: true,
    });
    const element = await this.page.$(`${stateConversationContent} p`);
    const cardContent = await this.page.evaluate(
      element => element.textContent,
      element
    );
    if (cardContent.trim() !== expectedCardContent) {
      throw new Error(
        `Card content is not same as expected. Actual: ${cardContent.trim()}, Expected: ${expectedCardContent}.`
      );
    }
    showMessage('Card content is as expected.');
  }

  /**
   * Simulates a delay to avoid triggering the fatigue detection service.
   * This is important because the fatigue detection service could be activated again after further submissions. It can by-passed if there is 10 seconds of gap post quick 3 submissions.
   * @returns {Promise<void>}
   */
  async simulateDelayToAvoidFatigueDetection(): Promise<void> {
    await this.page.waitForTimeout(10000);
  }

  /**
   * Checks if the sign-up button is present on the page.
   * @returns {Promise<void>}
   */
  async expectSignUpButtonToBePresent(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.page.waitForSelector(signUpButton, {timeout: 5000});
    showMessage('Sign-up button present.');
  }

  /**
   * Checks if the sign-in button is present on the page.
   * @returns {Promise<void>}
   */
  async expectSignInButtonToBePresent(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    try {
      await this.page.waitForSelector(signInButton, {timeout: 5000});
    } catch (error) {
      try {
        await this.page.waitForSelector(singInButtonInProgressModal, {
          timeout: 5000,
        });
      } catch (error) {
        throw new Error('Sign-in button not found.');
      }
    }
    showMessage('Sign-in button present.');
  }

  /**
   * Opens the lesson info modal.
   */
  async openLessonInfoModal(): Promise<void> {
    await this.clickOn(lessonInfoButton);
    await this.page.waitForSelector(lessonInfoCardSelector, {visible: true});
  }

  /**
   * Closes the lesson info modal.
   */
  async closeLessonInfoModal(): Promise<void> {
    await this.clickOn(closeLessonInfoButton);
    await this.page.waitForSelector(lessonInfoCardSelector, {hidden: true});
  }

  /**
   * Checks if the progress remainder is found or not, based on the shouldBeFound parameter. (It can be found when the an already played exploration is revisited or an ongoing exploration is reloaded, but only if the first checkpoint is reached.)
   * @param {boolean} shouldBeFound - Whether the progress remainder should be found or not.
   */
  async expectProgressRemainder(shouldBeFound: boolean): Promise<void> {
    await this.waitForPageToFullyLoad();
    try {
      await this.page.waitForSelector(progressRemainderModalSelector, {
        visible: true,
      });
      if (!shouldBeFound) {
        throw new Error('Progress remainder is found, which is not expected.');
      }
      showMessage('Progress reminder modal found.');
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        // Closing checkpoint modal if appears.
        const closeLessonInfoTooltipElement = await this.page.$(
          closeLessonInfoTooltipSelector
        );
        if (closeLessonInfoTooltipElement) {
          await this.clickOn(closeLessonInfoTooltipSelector);
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
   * Chooses an action in the progress remainder.
   * @param {string} action - The action to choose. Can be 'Restart' or 'Resume'.
   */
  async chooseActionInProgressRemainder(
    action: 'Restart' | 'Resume'
  ): Promise<void> {
    await this.page.waitForSelector(progressRemainderModalSelector, {
      visible: true,
    });
    await this.page.waitForSelector(restartExplorationButton, {visible: true});
    await this.page.waitForSelector(resumeExplorationButton, {visible: true});

    if (action === 'Restart') {
      await this.clickAndWaitForNavigation(restartExplorationButton);
    } else if (action === 'Resume') {
      await this.clickOn(resumeExplorationButton);
      // Closing checkpoint modal if appears.
      const closeLessonInfoTooltipElement = await this.page.$(
        closeLessonInfoTooltipSelector
      );
      if (closeLessonInfoTooltipElement) {
        await this.clickOn(closeLessonInfoTooltipSelector);
      }
    } else {
      throw new Error(
        `Invalid action: ${action}. Expected 'Restart' or 'Resume'.`
      );
    }
  }

  /**
   * Saves the progress.(To be used when save progress modal is opened.)
   */
  async saveProgress(): Promise<void> {
    await this.clickOn(saveProgressButton);
  }

  /**
   * Checks if the "Create Account" button is present in the save progress modal (which can be opened from the lesson info modal once first checkpoint is reached).
   */
  async expectCreateAccountToBePresent(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.page.waitForSelector(createAccountButton, {timeout: 3000});
    showMessage('Create Account button is present.');
  }

  /**
   * Checks if the progress URL validity info matches the expected text. (To be used when save progress modal is opened.)
   * @param {string} expectedText - The expected validity info text.
   */
  async checkProgressUrlValidityInfo(expectedText: string): Promise<void> {
    const validityInfoText = await this.page.evaluate(selector => {
      const element = document.querySelector(selector);
      return element ? element.textContent.trim() : null;
    }, validityInfoTextSelector);

    if (validityInfoText !== expectedText) {
      throw new Error(
        `Validity info text does not match expected text. Found: ${validityInfoText}, Expected: ${expectedText}`
      );
    }
  }

  /**
   * Copies the progress URL to the clipboard and returns the copied text. (To be used when save progress modal is opened.)
   */
  async copyProgressUrl(): Promise<string> {
    try {
      // OverridePermissions is used to allow clipboard access.
      const context = await this.page.browser().defaultBrowserContext();
      await context.overridePermissions('http://localhost:8181', [
        'clipboard-read',
        'clipboard-write',
      ]);

      // Click on the copy button.
      await this.page.waitForSelector(copyProgressUrlButton, {visible: true});
      await this.page.click(copyProgressUrlButton);

      // Reading the clipboard data.
      const clipboardData = await this.page.evaluate(async () => {
        return await navigator.clipboard.readText();
      });

      return clipboardData;
    } catch (error) {
      console.error('An error occurred:', error);
      throw error;
    }
  }

  /**
   * Starts an exploration with a progress URL.
   * @param {string} progressUrl - The URL to navigate to.
   */
  async startExplorationUsingProgressUrl(progressUrl: string): Promise<void> {
    await this.goto(progressUrl);
  }

  /**
   * Checks if the lesson info shows the expected rating.
   * @param {string} expectedRating - The expected rating.
   */
  async expectLessonInfoToShowRating(expectedRating: string): Promise<void> {
    await this.page.waitForSelector(ratingContainerSelector);
    const ratingText = await this.page.evaluate(selector => {
      const element = document.querySelector(selector);
      return element ? element.textContent.trim() : null;
    }, ratingContainerSelector);

    if (ratingText !== expectedRating) {
      throw new Error(
        `Rating text does not match expected rating. Found: ${ratingText}, Expected: ${expectedRating}`
      );
    }
  }

  /**
   * Checks if the lesson info shows the expected number of views.
   * @param {number} expectedViews - The expected number of views.
   */
  async expectLessonInfoToShowNoOfViews(expectedViews: number): Promise<void> {
    await this.page.waitForSelector(viewsContainerSelector);
    const viewsText = await this.page.evaluate(selector => {
      const element = document.querySelector(selector);
      const textContent = element ? element.textContent : null;
      const match = textContent ? textContent.match(/\d+/) : null;
      return match ? parseInt(match[0], 10) : null;
    }, viewsContainerSelector);

    if (viewsText !== expectedViews) {
      throw new Error(
        `Number of views does not match expected number. Found: ${viewsText}, Expected: ${expectedViews}`
      );
    }
  }

  /**
   * Checks if the lesson info shows the last updated information.
   */
  async expectLessonInfoToShowLastUpdated(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.page.waitForSelector(lastUpdatedInfoSelector, {timeout: 3000});
    showMessage('Last updated info is present.');
  }

  /**
   * Checks if the lesson info shows the expected tags.
   * @param {string[]} expectedTags - The expected tags.
   */
  async expectLessonInfoToShowTags(expectedTags: string[]): Promise<void> {
    await this.page.waitForSelector(tagsContainerSelector);
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
   * Checks if the "Save Progress" button is not present. Use this function before the first checkpoint is
   * reached.
   */
  async expectNoSaveProgressBeforeCheckpointInfo(): Promise<void> {
    try {
      await this.page.waitForSelector(saveProgressButton, {timeout: 3000});
      throw new Error('"Save Progress" button found, which is not expected.');
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        showMessage('"save Progress" button not found, as expected.');
      }
    }
  }

  /**
   * Shares the exploration.
   * @param {string} platform - The platform to share the exploration on. This should be the name of the platform (e.g., 'facebook', 'twitter')
   * @param {string} explorationId - The id of the exploration.
   */
  async shareExplorationFromLessonInfoModal(
    platform: string,
    explorationId: string | null
  ): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.page.waitForSelector(
      `.e2e-test-share-link-${platform.toLowerCase()}`,
      {visible: true}
    );
    const aTag = await this.page.$(
      `.e2e-test-share-link-${platform.toLowerCase()}`
    );
    if (!aTag) {
      throw new Error(`No share link found for ${platform}.`);
    }
    const href = await this.page.evaluate(a => a.href, aTag);
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
   * Signs up a new user from the lesson player.
   * @param email - User's email
   * @param username - User's chosen username
   */
  async signUpFromTheLessonPlayer(
    email: string,
    username: string
  ): Promise<void> {
    await this.clickOn('Sign in');
    await this.type(testConstants.SignInDetails.inputField, email);
    await this.clickOn('Sign In');
    await this.page.waitForNavigation({waitUntil: 'networkidle0'});
    await this.type('input.e2e-test-username-input', username);
    await this.clickOn('input.e2e-test-agree-to-terms-checkbox');
    await this.page.waitForSelector(
      'button.e2e-test-register-user:not([disabled])'
    );
    await this.clickOn(LABEL_FOR_SUBMIT_BUTTON);
    await this.page.waitForNavigation({waitUntil: 'networkidle0'});
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
   * Checks if the navbar buttons' text matches any of the expected text.
   * @param {string[]} expectedText - The expected text for each navbar button.
   */
  async expectNavbarButtonsToHaveText(expectedText: string[]): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(openMobileNavbarMenuButton);
    }

    const isMobileViewport = this.isViewportAtMobileWidth();
    const navbarButtonsSelector = isMobileViewport
      ? mobileNavbarButtonSelector
      : desktopNavbarButtonsSelector;

    // Get the text content of all navbar buttons.
    await this.page.waitForSelector(navbarButtonsSelector, {visible: true});
    const navbarButtonsText = await this.page.evaluate(selector => {
      return Array.from(document.querySelectorAll(selector), element =>
        element.textContent.trim()
      );
    }, navbarButtonsSelector);

    // Check if any of the navbar buttons' text matches the expected text.
    const isMatchFound = expectedText.some(text =>
      navbarButtonsText.includes(text)
    );

    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(closeMobileNavbarMenuButton, {
        visible: true,
      });
      const closeMobileNavbarMenuButtonElement = await this.page.$(
        closeMobileNavbarMenuButton
      );
      if (closeMobileNavbarMenuButtonElement) {
        await closeMobileNavbarMenuButtonElement.click();
      }
    }

    if (!isMatchFound) {
      throw new Error(
        `None of the navbar buttons' text matches the expected text: ${expectedText}`
      );
    }
  }

  /**
   * Simulates pressing a keyboard shortcut.
   * @param {string} shortcut - The keyboard shortcut to press.
   */
  async simulateKeyboardShortcut(shortcut: string): Promise<void> {
    const keys: KeyInput[] = shortcut.split('+') as KeyInput[];

    // Press down all keys.
    for (const key of keys) {
      await this.page.keyboard.down(key);
    }

    // Release all keys.
    for (const key of keys) {
      await this.page.keyboard.up(key);
    }

    try {
      await this.page.waitForNavigation({
        waitUntil: ['load', 'networkidle0'],
        timeout: 5000,
      });
    } catch (error) {
      // Ignoring the error if it's a timeout error.
      if (error instanceof puppeteer.errors.TimeoutError) {
        // Navigation didn't happen, but that's okay as sometimes the shortcuts may not trigger navigation.
      } else {
        throw error;
      }
    }
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
   * Simulates pressing a keyboard shortcut and verifies that the expected element is focused.
   * @param {string} shortcut - The keyboard shortcut to press.
   */
  async verifyFocusAfterShortcut(shortcut: string): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.simulateKeyboardShortcut(shortcut);

    // Determine the expected element to be focused.
    let expectedFocusedElement;
    switch (shortcut) {
      case '/':
        expectedFocusedElement = await this.page.$(searchInputSelector);
        break;
      case 's':
        expectedFocusedElement = await this.page.$(mainContentSelector);
        break;
      case 'c':
        expectedFocusedElement = await this.page.$(
          categoryFilterDropdownToggler
        );
        break;
      case 'j':
        expectedFocusedElement = await this.page.$(
          `:is(${nextCardArrowButton}, ${nextCardButton})`
        );
        break;
      case 'k':
        expectedFocusedElement = await this.page.$(previousCardButton);
        break;
      default:
        throw new Error(`Unsupported shortcut: ${shortcut}`);
    }

    // Check if the expected element is focused.
    const isExpectedElementFocused = await this.page.evaluate(
      element => document.activeElement === element,
      expectedFocusedElement
    );

    if (!isExpectedElementFocused) {
      throw new Error(
        `Expected element is not focused after pressing ${shortcut}`
      );
    }

    // Remove focus from the focused element.
    await this.page.evaluate(element => element.blur(), expectedFocusedElement);
  }

  /**
   * Changes the language of the lesson.
   * @param {string} languageCode - The code of the language to change to.
   */
  async changeLessonLanguage(languageCode: string): Promise<void> {
    await this.select(lessonLanguageSelector, languageCode);
    await this.waitForNetworkIdle();
    await this.waitForPageToFullyLoad();
  }

  /**
   * Starts the voiceover by clicking on the audio bar (dropdown) and the play circle.
   */
  async startVoiceover(): Promise<void> {
    await this.waitForPageToFullyLoad();
    const voiceoverDropdownElement = await this.page.$(voiceoverDropdown);
    if (voiceoverDropdownElement) {
      await this.clickOn(voiceoverDropdown);
    }
    await this.clickOn(playVoiceoverButton);
    await this.page.waitForSelector(pauseVoiceoverButton);
  }

  /**
   * Verifies if the voiceover is playing.
   */
  async verifyVoiceoverIsPlaying(shouldBePlaying: true): Promise<void> {
    // If the pause button is present, it means the audio is playing.
    await this.page.waitForSelector(pauseVoiceoverButton);
    showMessage(`Voiceover is ${shouldBePlaying ? 'playing' : 'paused'}.`);
  }

  /**
   * Pauses the voiceover by clicking on the pause button.
   */
  async pauseVoiceover(): Promise<void> {
    await this.clickOn(pauseVoiceoverButton);
  }
}

export let LoggedOutUserFactory = (): LoggedOutUser => new LoggedOutUser();
