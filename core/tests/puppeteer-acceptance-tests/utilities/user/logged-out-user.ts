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
const impactReport2024Url = testConstants.URLs.ImpactReport2024Url;
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
const baseUrl = testConstants.URLs.BaseURL;

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

const navbarLearnDropdownContainerSelector =
  '.e2e-test-classroom-oppia-list-item';
const navbarAboutDropdownConatinaerSelector = '.e2e-test-about-oppia-list-item';
const navbarGetInvolvedDropdownContainerSelector =
  '.e2e-test-navbar-get-involved-menu';

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
const profileContainerSelector = '.e2e-test-profile-container';

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
const submitResponseToInteractionTextArea =
  'oppia-interaction-display textarea';
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
const topicPageLessonTabSelector = '.e2e-test-study-tab-link';
const subTopicTitleInLessTabSelector = '.subtopic-title';
const reviewCardTitleSelector = '.oppia-subtopic-title';
const goBackToTopicButton = '.e2e-test-go-back-to-topic-button';
const goToPracticeSectionButton = '.e2e-test-go-to-practice-section-button';
const goToNextStudyGuideButton = '.e2e-test-go-to-next-study-guide-button';
const goToStudyGuideMenuButton = '.e2e-test-go-to-study-guide-menu-button';
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
const saveProgressCloseButtonSelector = '.e2e-test-save-progress-close-button';
const recommendedNextChapterSelector =
  '.e2e-test-recommended-next-chapter-button';

const topicDescriptionSelector = '.e2e-test-topic-description';
const storyViewerContainerSelector = '.e2e-test-story-viewer-container';

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
const noBlogPostsFoundSelector = '.e2e-no-blog-posts-found';
const blogTagContainerSelector = '.e2e-test-blog-tag-container';
const blogPostTagSelector = '.e2e-test-blog-post-tag';
const blogSearchInputSelector = '.e2e-test-search-input';
const blogSubmitButtonSelector = '.e2e-test-search-submit-btn';
const blogTagFilterSelector = '.e2e-test-tag-filter-component';
const blogTagFilterDropdownSelector = '.e2e-test-tag-filter-selection-dropdown';
const blogPaginationSelector = '.e2e-test-pagination';
const blogPaginationNextSelector = '.e2e-test-pagination-next-button';
const blogPaginationPrevSelector = '.e2e-test-pagination-prev-button';
const blogPostTitleContainerSelector =
  '.e2e-test-blog-post-page-title-container';
const blogPostContentSelector = '.e2e-test-blog-post-content';
const blogPostTitleSelector = '.e2e-test-blog-post-tile-title';
const explorationViewsSelector = '.e2e-test-exp-summary-tile-views';

// Common Selectors.
const commonModalTitleSelector = '.e2e-test-modal-header';
const commonModalBodySelector = '.e2e-test-modal-body';
const returnToStoryFromLastStateSelector =
  '.e2e-test-end-chapter-return-to-story';
const contributorsContainerSelector = '.e2e-test-contributors-container';
const contributorIconPrefix = `${contributorsContainerSelector} .contributor-`;

// Common Selectors.
const devModeLabelSelector = '.e2e-test-dev-mode';

// Home Page Selectors.
const homePageHeadingSelector =
  '.e2e-test-splash-page .e2e-test-home-page-title';
const browseLessonButtonSelector =
  '.e2e-test-splash-page .e2e-test-explore-lessons-btn';
const audioSliderSelector = 'oppia-audio-slider mat-slider';

// Topic Viewer Page Selectors.
const topicPageRevisionTabContentSelector =
  '.e2e-test-topic-viewer-revision-tab';

// Exploration Player Selectors.
const learnerViewCardSelector = '.oppia-learner-view-card-content';
const signInBoxInSaveProressModalSelector = '.sign-in-box';
const loginButtonSelector = '.e2e-mobile-test-login';

const youtubePlayerSelector = '.e2e-test-youtube-player';
const collapsibleRTEHeaderSelector = '.e2e-test-collapsible-heading';
const collapsibleRTEContentSelector = '.e2e-test-collapsible-content';

const returnToLibraryButtonSelector = '.e2e-test-exploration-return-to-library';
const conceptCardLinkSelector = '.e2e-test-concept-card-link';
const conceptCardViewerSelector = '.e2e-test-concept-card-viewer';
const nonInteractiveTabsHeaderSelector =
  '.e2e-test-non-interactive-tabs-headers';

const audioExpandButtonInLPSelector = '.e2e-test-lp-audio-expand-button';
const audioForwardButtonSelector = '.e2e-test-audio-forward-button';
const audioBackwardButtonSelector = '.e2e-test-audio-backward-button';

const fractionInputSelector = '.e2e-test-fraction-input';
const wrongInputErrorContainerSelector = '.oppia-form-error-container';
const communityLibraryLinkInNavbarSelector =
  '.e2e-test-topnb-go-to-community-library-link';
const communityLibraryContainerSelector = '.e2e-test-library-container';
const communityLibraryLinkInNavMenuSelector = '.e2e-mobile-test-library-link';
const contributorIconInLessonInfoSelctor =
  '.e2e-test-lesson-info-contributor-profile';

// Splash page.
const getAndroidAppButtonSelector = '.e2e-test-splash-android-app-button';

// Partnership Page.
const partnershipsHeadingSelector = '.e2e-test-partnership-heading';
const partnershipPageSubheadingsSelector =
  '.e2e-test-partnerships-page .oppia-partnerships-h3';
const partneringWithUsImageSelector = '.e2e-test-partnering-with-oppia-image';
const partnershipYoutubeVideoIFrameSelector =
  '.e2e-test-partnership-youtube-video-iframe';
const learnerStoriesHeadingSelector = '.e2e-test-learner-stories-heading';
const learnerStoriesCarouselContainerSelector =
  '.e2e-test-learner-stories-coursal-container';

// About Us Page Selectors.
const aboutUsHeadingSelector = '.e2e-test-about-us-title';
const aboutUsSubheadingSelector = '.e2e-test-about-page-title-new';
const exploreLessonsButtonInAboutUsPageSelector =
  '.e2e-test-about-page-explore-lessons-button';
const androidAppButtonInAboutUsPageSelector =
  '.e2e-test-about-page-android-button';
const partnershipStoryBoardDesktopSelector =
  '.oppia-about-partnerships-cards-container-desktop .oppia-about-partnerships-card';
const partnershipStoryBoardMobileSelector =
  '.oppia-about-partnerships-cards-container-tablet .oppia-about-partnerships-card';
const impactStatsTitleSelector = '.e2e-test-about-oppia-impact-stat-title';
const impactChartContainerSelector = '.e2e-test-about-impact-chart-container';

// Parents and Teachers Page.
const subheadingInParentsAndTeachersPageSelector =
  '.e2e-test-teach-page-subheading';

// Android Page.
const redirectToPlayStoreImageSelector = '.e2e-test-play-store-redirect-img';

// Donation Page.
const ourLearnersSectionSelector = '.e2e-test-donate-our-learners';
const donationHighlightsSelector = '.e2e-test-donate-highlights';
const ourNetworkHeadingSelector = '.e2e-test-dp-our-network-heading';
const ourNetworkSectionSelector = '.e2e-test-dp-our-network-section';
const donationHeadingSelector = '.e2e-test-donate-heading';
const readyToMakeDonationSelector = '.e2e-test-ready-to-donate-title';
const ourImpactSectionSelector = '.e2e-test-dp-our-impact-section';

// Volunteer Page.
const volunteerPageHeadingSelector = '.e2e-test-volunteer-page-headings';

// Contact Us Page.
const contactUsSubheadingSelector = '.e2e-test-contact-subheading';
const contactUsContentCard = '.e2e-test-contact-page-content';
const contactUsContentCardHeadingSelector = `${contactUsContentCard} h2`;

// Community Library.
const communityLibraryHeading = '.e2e-test-library-main-header';
const communityLibraryGroupHeader = '.e2e-test-library-group-header';

// Other Selectors.
const closeButtonSelector = '.e2e-test-close-button';
const backToClassroomBreadcrumbSelectorMobile =
  '.e2e-test-mobile-breadcrumbs-classroom';

// Learn Page (/learn).
const classroomHeadingSelector = '.e2e-test-classroom-heading';
const classroomTileContainerSelector = '.e2e-test-classroom-tile';
const classroomNameSelector = '.e2e-test-classroom-name';

// Classroom Page.
const classroomContentHeadingSelector = '.e2e-test-classroom-content-heading';
const diagnosticTestBoxSelector = '.e2e-test-diagnostic-test-box';
const diagnosticTestHeadingSelector = `${diagnosticTestBoxSelector} h4`;
const diagnosticTestButtonSelector = `${diagnosticTestBoxSelector} a`;

const startHereButtonSelector = '.e2e-test-start-here-button';
const takeQuizButtonSelector = '.e2e-test-take-diagnostic-test';

const startDiagnosticTestButtonSelector = '.e2e-test-start-diagnostic-test';

// Diagnostic Test Player.
const diagnosticTestPlayerSelector = 'oppia-diagnostic-test-player';
const skipQuestionButton = '.e2e-test-skip-question-button';
const currentProgessSelector = '.e2e-test-progress-container';

// Topic Page.
const tabTitleInTopicPageSelector = '.e2e-test-topic-page-tab-title';
const practiceTabButtonSelector = '.e2e-test-practice-tab-link';
const lessonsTabButtonSelector = '.e2e-test-lesson-tab-link';
const revisionTabButtonSelector = '.e2e-test-study-tab-link';
const practiceTabContainerSelector = '.e2e-test-practice-tab-container';
const lessonsTabContainerSelector = '.e2e-test-lessons-tab-container';
const revisionTabSelector = 'subtopics-list';

const subtopicListItemInPracticeTabSelector = '.e2e-test-subtopic-item';
const startPracticeButtonSelector = '.e2e-test-practice-start-button';
const practiceSessionContainerSelector = 'practice-session-page';

const backToClassroomLinkSelector = '.e2e-test-classroom-name';

const storyTitleSelector = '.e2e-test-story-title';
const lessonInfoModalHeaderSelector = '.e2e-test-lesson-info-modal-header';
const progressReminderModalHeaderSelector =
  '.e2e-test-progress-reminder-continue-text';
const lessonInfoSignUpButtonSelector = '.e2e-test-sign-up-button';
const profilePictureSelector = '.e2e-test-profile-dropdown';
const lessonInfoTextSelector = '.e2e-test-lesson-info-header';
const floatFormInput = '.e2e-test-float-form-input';
const expandWorkedExampleButton = '.e2e-test-expand-workedexample';
const collapseWorkedExampleButton = '.e2e-test-collapse-workedexample';
const topicViewerContainerSelector = '.e2e-test-topic-viewer-container';
const toastMessageSelector = '.e2e-test-toast-message';
const previousConversationToggleSelector = '.e2e-test-previous-responses-text';
const formErrorContainer = '.e2e-test-form-error-container';
const voiceoverSelectSelector = '.e2e-test-audio-lang-select';

const conceptCardCloseButtonSelector = '.e2e-test-close-concept-card';
const promoBarTextSelector = '.e2e-test-promo-bar-text';
const practiceQuestionHeaderSelector = '.e2e-test-practice-question-header';

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
   * @param {boolean} verifyURL - Whether to verify the URL after navigation. Defaults to true.
   */
  async navigateToHome(verifyURL: boolean = true): Promise<void> {
    await this.goto(homeUrl, verifyURL);
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
    await this.page.waitForSelector(thanksForDonatingClass, {visible: true});
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
  async navigateToCommunityLibraryPage(
    verifyURL: boolean = true
  ): Promise<void> {
    await this.goto(communityLibraryUrl, verifyURL);
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

    await this.waitForPageToFullyLoad();
    showMessage(
      `Navigated to classroom page: ${classroomsPageUrl}/${urlFragment}`
    );
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
   * Navigates to the splash page.
   * @param expectedURL - The expected URL after navigation. Defaults to `${baseUrl}/`.
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
   * Navigates to the blog page
   */
  async navigateToBlogPage(): Promise<void> {
    await this.goto(blogUrl);
  }

  /**
   * Function to check whether any blog posts are found.
   * @returns {Promise<boolean>} A promise that resolves to a boolean
   * indicating whether any blog posts are found.
   */
  async checkIfBlogPostsAreFound(): Promise<boolean> {
    const noPostsElement = await this.page.$(noBlogPostsFoundSelector);
    if (noPostsElement) {
      return false;
    }
    return true;
  }

  /**
   * Function to verify that the each blog post has a tag
   * associated with it
   */
  async expectBlogPostsToHaveAtLeastOneTag(): Promise<void> {
    let blogPostsFound = await this.checkIfBlogPostsAreFound();
    if (!blogPostsFound) {
      return;
    }
    const allPostsHaveTags = await this.page.$$eval(
      blogTagContainerSelector,
      (posts, tagSelector) =>
        posts.every(post => post.querySelector(tagSelector as string) !== null),
      blogPostTagSelector
    );
    if (!allPostsHaveTags) {
      throw new Error('Not all blog posts have tags');
    }
  }

  /**
   * Return to Learner Dashboard from exploration completion card.
   */
  async returnToLibraryFromExplorationCompletion(): Promise<void> {
    await this.expectElementToBeVisible(returnToLibraryButtonSelector);
    await this.clickOnElementWithSelector(returnToLibraryButtonSelector);
  }

  /**
   * Function to filter blog posts by a keyword
   */
  async filterBlogPostsByKeyword(keyword: string): Promise<void> {
    await this.page.waitForSelector(blogSearchInputSelector, {
      visible: true,
    });
    await this.typeInInputField(blogSearchInputSelector, keyword);
    await this.clickAndWaitForNavigation(blogSubmitButtonSelector, true);

    const url = new URL(this.page.url());
    const queryParam = url.searchParams.get('q');

    if (queryParam !== keyword) {
      throw new Error(
        `Query Parameter doesn't match. Expected ${keyword}, but found ${queryParam}`
      );
    }
  }

  /**
   * Function to verify that the filtered blog posts contain the keyword
   */
  async expectBlogSearchResultsToContain(text: string): Promise<void> {
    let blogPostsFound = await this.checkIfBlogPostsAreFound();
    if (!blogPostsFound) {
      return;
    }
    const contentFound = await this.page.$$eval(
      `${blogPostTitleContainerSelector}, ${blogPostContentSelector}`,
      (elements, searchText) =>
        elements.some(el =>
          el.textContent
            ?.toLowerCase()
            .includes((searchText as string).toLowerCase())
        ),
      text
    );

    if (!contentFound) {
      throw new Error(`No results found containing "${text}"`);
    }
  }

  /**
   * Function to filter blog posts by a tag
   */
  async filterBlogPostsByTag(tagName: string): Promise<void> {
    await this.page.waitForSelector(blogTagFilterSelector, {
      visible: true,
    });
    await this.clickOnElementWithSelector(blogTagFilterSelector);
    await this.clickOnElementWithSelector(`.e2e-test-select-${tagName}`);
    await this.page.waitForSelector(blogTagFilterDropdownSelector, {
      hidden: true,
    });
    await this.clickAndWaitForNavigation(blogSubmitButtonSelector, true);

    const url = new URL(this.page.url());
    const queryParam = url.searchParams.get('tags');

    if (queryParam !== `("${tagName}")`) {
      throw new Error(
        `Query Parameter doesn't match. Expected ${tagName}, but found ${queryParam}`
      );
    }
  }

  /**
   * Function to verify that the filtered blog posts contain the tag
   */
  async expectBlogSearchResultsToHaveTag(tagName: string): Promise<void> {
    let blogPostsFound = await this.checkIfBlogPostsAreFound();
    if (!blogPostsFound) {
      return;
    }
    const tagFound = await this.page.$$eval(
      blogPostTagSelector,
      (elements, expectedTag) =>
        elements.some(el => el.textContent?.trim() === expectedTag),
      tagName
    );

    if (!tagFound) {
      throw new Error(`No results found with tag "${tagName}"`);
    }
  }

  /**
   * Function to check whether the pagination controls are visible
   */
  async expectBlogPaginationControlsVisible(): Promise<void> {
    let blogPostsFound = await this.checkIfBlogPostsAreFound();
    if (!blogPostsFound) {
      return;
    }
    try {
      await this.page.waitForSelector(blogPaginationSelector, {
        visible: true,
      });
    } catch (error) {
      throw new Error('Pagination controls not visible');
    }
  }

  /**
   * Function to click the next button in the pagination controls
   */
  async clickNextBlogPage(): Promise<void> {
    await this.page.waitForSelector(blogPostTitleSelector, {
      visible: true,
    });
    const firstPostTitle = await this.page.$eval(
      blogPostTitleSelector,
      el => el.textContent
    );
    const nextButton = await this.page.$(blogPaginationNextSelector);
    if (!nextButton) {
      return;
    }
    await this.clickOnElementWithSelector(blogPaginationNextSelector);
    await this.waitForNetworkIdle();

    const newFirstPostTitle = await this.page.$eval(
      blogPostTitleSelector,
      el => el.textContent
    );
    if (newFirstPostTitle === firstPostTitle) {
      throw new Error('Next button did not navigate to the next page');
    }
  }

  /**
   * Function to click the previous button in the pagination controls
   */
  async clickPreviousBlogPage(): Promise<void> {
    await this.page.waitForSelector(blogPostTitleSelector, {
      visible: true,
    });
    const firstPostTitle = await this.page.$eval(
      blogPostTitleSelector,
      el => el.textContent
    );
    const prevButton = await this.page.$(blogPaginationPrevSelector);
    if (!prevButton) {
      return;
    }
    await this.clickOnElementWithSelector(blogPaginationPrevSelector);

    const newFirstPostTitle = await this.page.$eval(
      blogPostTitleSelector,
      el => el.textContent
    );
    if (newFirstPostTitle === firstPostTitle) {
      throw new Error('Next button did not navigate to the next page');
    }
  }

  /**
   * Function to click a button and check if it opens the expected destination.
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
    await this.clickOnElementWithSelector(button);
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
      await this.page.waitForSelector(mobileNavbarButtonSelector, {
        visible: true,
      });
      await this.clickOnElementWithSelector(mobileNavbarOpenSidebarButton);
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarBasicMathematicsButton,
        mathClassroomUrl
      );
    } else {
      await this.page.waitForSelector(navbarLearnTab, {
        visible: true,
      });
      await this.clickOnElementWithSelector(navbarLearnTab);
      await this.clickButtonToNavigateToNewPage(
        navbarLearnTabBasicMathematicsButton,
        mathClassroomUrl
      );
    }
  }

  /**
   * Function to click the About button in the About Menu on navbar
   * and check if it opens the About page.
   */
  async clickAboutButtonInAboutMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileNavbarButtonSelector, {
        visible: true,
      });
      await this.clickOnElementWithSelector(mobileNavbarOpenSidebarButton);
      await this.clickOnElementWithSelector(mobileSidebarExpandAboutMenuButton);
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarAboutButton,
        aboutUrl
      );
    } else {
      await this.page.waitForSelector(navbarAboutTab, {
        visible: true,
      });
      await this.clickOnElementWithSelector(navbarAboutTab);
      await this.clickButtonToNavigateToNewPage(
        navbarAboutTabAboutButton,
        aboutUrl
      );
    }
  }

  /**
   * Function to click the Teach button in the About Menu on navbar
   * and check if it opens the Teach page.
   */
  async clickTeachButtonInAboutMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileNavbarButtonSelector, {
        visible: true,
      });
      await this.clickOnElementWithSelector(mobileNavbarOpenSidebarButton);
      await this.clickOnElementWithSelector(mobileSidebarExpandAboutMenuButton);
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarTeachButton,
        teachUrl
      );
    } else {
      await this.page.waitForSelector(navbarAboutTab, {
        visible: true,
      });
      await this.clickOnElementWithSelector(navbarAboutTab);
      await this.clickButtonToNavigateToNewPage(
        navbarAboutTabTeachButton,
        teachUrl
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
   * Open the navigation menu in mobile view.
   */
  async openNavMenuInMobile(): Promise<void> {
    if (!this.isViewportAtMobileWidth()) {
      showMessage('Skipped: Open Navigation Menu (mobile).');
      return;
    }
    await this.page.waitForSelector(mobileNavbarOpenSidebarButton, {
      visible: true,
    });
    await this.clickOnElementWithSelector(mobileNavbarOpenSidebarButton);
    await this.page.waitForSelector(communityLibraryLinkInNavMenuSelector, {
      visible: true,
    });
    showMessage('Opened Navigation Menu (mobile).');
  }

  /**
   * Function to click the Impact Report button in the About Menu on navbar
   * and check if it opens the Impact Report.
   */
  async verifyImpactReportButtonInAboutMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileNavbarButtonSelector, {
        visible: true,
      });
      await this.clickOnElementWithSelector(mobileNavbarOpenSidebarButton);
      await this.clickOnElementWithSelector(mobileSidebarExpandAboutMenuButton);
      await this.clickOnElementWithSelector(
        mobileSidebarExpandImpactReportSubMenuButton
      );
      await this.openExternalLinkBySelectorAndText(
        mobileSidebarImpactReportButton,
        '2024',
        impactReport2024Url
      );
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

      // Close Navbar once links are verified.
      await this.clickOnElementWithSelector(mobileSidebarExpandAboutMenuButton);
      await this.clickOnElementWithSelector(mobileNavbarOpenSidebarButton);
    } else {
      await this.page.waitForSelector(navbarAboutTab, {
        visible: true,
      });
      await this.clickOnElementWithSelector(navbarAboutTab);
      await this.openExternalLinkBySelectorAndText(
        navbarAboutTabImpactReportButton,
        '2024',
        impactReport2024Url
      );
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
      await this.page.waitForSelector(mobileNavbarButtonSelector, {
        visible: true,
      });
      await this.clickOnElementWithSelector(mobileNavbarOpenSidebarButton);
      await this.clickOnElementWithSelector(
        mobileSidebarExpandGetInvolvedMenuButton
      );
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarGetInvolvedMenuPartnershipsButton,
        partnershipsUrl
      );
    } else {
      await this.page.waitForSelector(navbarGetInvolvedTab, {
        visible: true,
      });
      await this.clickOnElementWithSelector(navbarGetInvolvedTab);
      await this.clickButtonToNavigateToNewPage(
        navbarGetInvolvedTabSchoolAndOrganizationsButton,
        partnershipsUrl
      );
    }
  }

  /**
   * Function to click the Volunteer button in the Get Involved Menu
   * on navbar and check if it opens the Volunteer page.
   */
  async clickVolunteerButtonInGetInvolvedMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileNavbarButtonSelector, {
        visible: true,
      });
      await this.clickOnElementWithSelector(mobileNavbarOpenSidebarButton);
      await this.clickOnElementWithSelector(
        mobileSidebarExpandGetInvolvedMenuButton
      );
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarGetInvolvedMenuVolunteerButton,
        volunteerUrl
      );
    } else {
      await this.page.waitForSelector(navbarGetInvolvedTab, {
        visible: true,
      });
      await this.clickOnElementWithSelector(navbarGetInvolvedTab);
      await this.clickButtonToNavigateToNewPage(
        navbarGetInvolvedTabVolunteerButton,
        volunteerUrl
      );
    }
  }

  /**
   * Function to click the Donate button in the Get Involved Menu
   * on navbar and check if it opens the Donate page.
   */
  async clickDonateButtonInGetInvolvedMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileNavbarButtonSelector, {
        visible: true,
      });
      await this.clickOnElementWithSelector(mobileNavbarOpenSidebarButton);
      await this.clickOnElementWithSelector(
        mobileSidebarExpandGetInvolvedMenuButton
      );
      await this.clickButtonToNavigateToNewPage(
        mobileSidevbarGetInvolvedMenuDonateButton,
        donateUrl
      );
    } else {
      await this.page.waitForSelector(navbarGetInvolvedTab, {
        visible: true,
      });
      await this.clickOnElementWithSelector(navbarGetInvolvedTab);
      await this.clickButtonToNavigateToNewPage(
        navbarGetInvolvedTabDonateButton,
        donateUrl
      );
    }
  }

  /**
   * Function to click the Contact Us button in the Get Involved Menu
   * on navbar and check if it opens the Partnerships page.
   */
  async clickContactUsButtonInGetInvolvedMenuOnNavbar(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileNavbarButtonSelector, {
        visible: true,
      });
      await this.clickOnElementWithSelector(mobileNavbarOpenSidebarButton);
      await this.clickOnElementWithSelector(
        mobileSidebarExpandGetInvolvedMenuButton
      );
      await this.clickButtonToNavigateToNewPage(
        mobileSidebarGetInvolvedMenuContactUsButton,
        contactUrl
      );
    } else {
      await this.page.waitForSelector(navbarGetInvolvedTab, {
        visible: true,
      });
      await this.clickOnElementWithSelector(navbarGetInvolvedTab);
      await this.clickButtonToNavigateToNewPage(
        navbarGetInvolvedTabContactUsButton,
        contactUrl
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
      await this.page.waitForSelector(mobileNavbarButtonSelector, {
        visible: true,
      });
      await this.clickOnElementWithSelector(mobileNavbarOpenSidebarButton);
    }
    await this.page.waitForSelector(navbarDonateButton, {
      visible: true,
    });
    await this.clickButtonToNavigateToNewPage(navbarDonateButton, donateUrl);
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
    await this.clickAndWaitForNavigation(watchAVideoButton, true);
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
    await this.clickAndWaitForNavigation(readOurBlogButton, true);

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

    await this.clickOnElementWithSelector(subscribeButton);
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
    await this.page.waitForSelector(dismissButton, {visible: true});
    await this.clickOnElementWithSelector(dismissButton);
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
    await this.page.waitForSelector(dismissButton, {visible: true});
    await this.clickOnElementWithSelector(dismissButton);
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
    await this.clickButtonToNavigateToNewPage(footerAboutLink, aboutUrl);
  }
  /**
   * Navigates to the Blog page using the oppia website footer.
   */
  async clickOnBlogLinkInFooter(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(footerBlogLink, blogUrl);
  }

  /**
   * Navigates to the Forum page using the oppia website footer.
   */
  async clickOnForumLinkInFooter(): Promise<void> {
    await this.page.waitForSelector(footerForumlink, {
      visible: true,
    });
    await this.clickAndWaitForNavigation(footerForumlink, true);

    expect(this.page.url()).toBe(googleGroupsOppiaUrl);
  }

  /**
   * Navigates to the Get Started page using the oppia website footer.
   */
  async clickOnGetStartedLinkInFooter(): Promise<void> {
    await this.page.waitForSelector(footerGetStartedLink);
    await this.clickButtonToNavigateToNewPage(
      footerGetStartedLink,
      getStartedUrl
    );
  }

  /**
   * Navigates to the Creator Guidelines page using the oppia website footer.
   */
  async clickOnCreatorGuidelinesLinkinFooter(): Promise<void> {
    await this.page.waitForSelector(footerCreatorGuidelinesLink);
    await this.clickButtonToNavigateToNewPage(
      footerCreatorGuidelinesLink,
      creatorGuidelinesUrl
    );
  }

  /**
   * Navigates to the Teach page using the oppia website footer.
   */
  async clickOnForParentsSlashTeachersLinkInFooter(): Promise<void> {
    await this.page.waitForSelector(footerCreatorGuidelinesLink);
    await this.clickButtonToNavigateToNewPage(footerTeachLink, teachUrl);
  }

  /**
   * Navigates to the Terms page using the oppia website footer.
   */
  async clickOnTermsOfServiceLinkInFooter(): Promise<void> {
    await this.page.waitForSelector(footerCreatorGuidelinesLink);
    await this.clickButtonToNavigateToNewPage(footerTermsLink, termsUrl);
  }

  /**
   * Navigates to the Privacy Policy page using the oppia website footer.
   */
  async clickOnPrivacyPolicyLinkInFooter(): Promise<void> {
    await this.page.waitForSelector(footerCreatorGuidelinesLink);
    await this.clickButtonToNavigateToNewPage(
      footerPrivacyPolicyLink,
      privacyPolicyUrl
    );
  }

  /**
   * Navigates to the Community Library page using the oppia website footer.
   */
  async clickOnBrowseTheLibraryLinkInFooter(): Promise<void> {
    await this.page.waitForSelector(footerCreatorGuidelinesLink);
    await this.clickButtonToNavigateToNewPage(
      footerCommunityLibraryLink,
      communityLibraryUrl
    );
  }

  /**
   * Navigates to the Contact page using the oppia website footer.
   */
  async clickOnContactUsLinkInFooter(): Promise<void> {
    await this.page.waitForSelector(footerCreatorGuidelinesLink);
    await this.clickButtonToNavigateToNewPage(footerContactUsLink, contactUrl);
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
    await this.clickOnElementWithText('create one here');
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
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickOnElementWithText('forum'),
    ]);
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
      await this.clickOnElementWithText('Design Tips'),
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
      await this.clickOnElementWithText('Create an Exploration'),
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
      await this.clickOnElementWithText('Browse our Explorations'),
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
      this.clickOnElementWithText('https://www.oppia.org'),
    ]);

    expect(this.page.url()).toBe(homeUrl);
  }

  /**
   * Clicks the link to learn about cookies on the Privacy Policy page.
   */
  async clickLinkAboutCookiesOnPrivacyPolicyPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'https://allaboutcookies.org/how-to-manage-cookies',
      allAboutCookiesUrl,
      false
    );
  }

  /**
   * Clicks the link to learn about Google Analytivs on the Privacy Policy page.
   */
  async clickLinkAboutGoogleAnalyticsOnPrivacyPolicyPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'https://www.google.com/policies/privacy/partners/',
      googleAnalyticsPartnerPoliciesUrl,
      false
    );
  }

  /**
   * Clicks the link to opt out of cookies on the Privacy Policy page.
   */
  async clickLinkAboutGoogleAnalyticsOptOutOnPrivacyPolicyPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      googleAnalyticsOptOutUrl,
      googleAnalyticsOptOutUrl,
      false
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
    await this.clickOnElementWithSelector(socialIconSelector);
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
  async verifyGuideButtonInTeachPage(): Promise<void> {
    await this.openExternalLink(
      guideButtonInTeachPage,
      parentsTeachersGuideUrl
    );
  }

  /**
   * Function to click the Check out our blog button in the Teach page
   * and check if it opens the Teacher Story tagged blogs link
   */
  async clickAndVerifyBlogButtonInTeachPage(): Promise<void> {
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
        classroomsPageUrl
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
      classroomsPageUrl
    );
  }

  /**
   * Function to click the Get Android App button in the Teach page
   * and check if it opens the Android page.
   */
  async clickGetAndroidAppButtonInTeachPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      getAndroidAppButtonInTeachPage,
      androidUrl
    );
  }

  /**
   * Function to click the Get Android App button in the Splash page
   * and check if it opens the Android page.
   */
  async clickGetAndroidAppButtonInSplashPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      getAndroidAppButtonSelector,
      androidUrl
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
      await this.clickOnElementWithSelector(testimonialCarouselNextButton);
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
      await this.clickOnElementWithSelector(testimonialCarouselPrevButton);
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
    await this.clickOnElementWithSelector(creatorsCarouselNextButton);

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
    await this.clickOnElementWithSelector(creatorsCarouselPrevButton);

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
    await this.clickOnElementWithSelector(
      lessonCreationAccordionExpandButtonInTeachPage
    );
    await this.page.waitForSelector(
      lessonCreationAccordionPanelContentInTeachPage,
      {visible: true}
    );
    showMessage('Lesson Creation accordion expand button is working correctly');
    await this.clickOnElementWithSelector(
      lessonCreationAccordionCloseButtonInTeachPage
    );
    await this.page.waitForSelector(
      lessonCreationAccordionPanelContentInTeachPage,
      {hidden: true}
    );
    showMessage('Lesson Creation accordion close button is working correctly');
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
    if (!languageDropdownElement) {
      throw new Error('Language dropdown element not found');
    }
    const initialLanguage = await this.page.$eval(
      languageDropdown,
      el => el.textContent
    );
    await languageDropdownElement.click();
    await this.clickOnElementWithSelector(languageOption);
    // Here we need to reload the page again to confirm the language change.
    await this.page.reload();

    await this.page.waitForFunction(
      (selector: string, textContent: string) => {
        const element = document.querySelector(selector);
        return element && element.textContent !== textContent;
      },
      {},
      languageOption,
      initialLanguage
    );
  }

  /**
   * Checks if the the language dropdown is available or not.
   * @param status - Status of language dropdown.
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
   * Function to click the Partner With Us button in the Partnerships page
   * and check if it opens the Partnerships Google form.
   * The button is in the first section of the page.
   */
  async clickPartnerWithUsButtonInPartnershipsPage(): Promise<void> {
    await this.waitForElementToStabilize(
      partnerWithUsButtonAtTheTopOfPartnershipsPage
    );
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
  async verifyDownloadBrochureButtonInPartnershipsPage(): Promise<void> {
    await this.page.waitForSelector(brochureButtonInPartnershipsPage, {
      visible: true,
    });
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
  async clickReadMoreStoriesButtonInPartnershipsPageAndVerifyNavigation(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      readMoreStoriesButtonInPartnershipsPage,
      blogUrl
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
      await this.clickOnElementWithSelector(tabsNextButtonInVolunteerPage);
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
      await this.clickOnElementWithSelector(tabsPreviousButtonInVolunteerPage);
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
      privacyPolicyUrl
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
      ccLicenseUrl
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
      OppiaAnnounceGoogleGroupUrl
    );
  }

  /**
   * Clicks the "DONATE TODAY" button on the Contact Us page and checks that
   * it navigates to the correct URL.
   */
  async clickDonateTodayButtonInContactUsPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage('DONATE TODAY', donateUrl, false);
  }

  /**
   * Clicks the "BECOME A PARTNER" button on the Contact Us page and checks that
   * it navigates to the correct URL.
   */
  async clickBecomeAPartnerButtonInContactUsPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'BECOME A PARTNER',
      partnershipsUrl,
      false
    );
  }

  /**
   * Clicks the "VOLUNTEER WITH US" button on the Contact Us page and checks that
   * it navigates to the correct URL.
   */
  async clickVolunteerButtonInContactUsPage(): Promise<void> {
    await this.clickButtonToNavigateToNewPage(
      'BECOME A VOLUNTEER',
      volunteerUrl,
      false
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

    await this.clickOnElementWithSelector(
      featuresAccordionExpandButtonInAboutPage
    );
    await this.page.waitForSelector(featuresAccordionPanelContentInAboutPage, {
      visible: true,
    });

    await this.clickOnElementWithSelector(
      featuresAccordionCloseButtonInAboutPage
    );
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
    await this.clickOnElementWithSelector(
      volunteerCarouselNextButtonInAboutPage
    );

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
    await this.clickOnElementWithSelector(
      volunteerCarouselPrevButtonInAboutPage
    );

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
      impactReport2024Url
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
      volunteerUrl
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

    await this.page.waitForSelector(partnerTab, {
      visible: true,
    });
    await this.clickOnElementWithSelector(partnerTab);
    await this.clickButtonToNavigateToNewPage(
      partnerLearnMoreButtonInAboutPage,
      partnershipsUrl
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

    await this.page.waitForSelector(partnerTab, {
      visible: true,
    });
    await this.clickOnElementWithSelector(partnerTab);
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

    await this.page.waitForSelector(partnerTab, {
      visible: true,
    });
    await this.clickOnElementWithSelector(partnerTab);
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

    await this.page.waitForSelector(donorTab, {
      visible: true,
    });
    await this.clickOnElementWithSelector(donorTab);
    await this.clickOnElementWithSelector(donateButtonInAboutPage);

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
   * @param statusCode The status code of the error page.
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
   * Click on the submit answer button.
   * @param skipVerification - If true, skips verification that the button is visible.
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
      (
        submitButtonSelector: string,
        formErrorContainer: string,
        selector1: string,
        value1: string | null,
        selector2: string,
        value2: string | null
      ) => {
        const submitButton = document.querySelector(submitButtonSelector);
        const element1 = document.querySelector(selector1);
        const element2 = document.querySelector(selector2);

        const currentValue1 = element1?.textContent?.trim() || null;
        const currentValue2 = element2?.textContent?.trim() || null;

        // Return true if either: submit button is disabled, or if number of
        // previous responses has increased, or if there was no previous
        // response and we got the first response.
        return (
          (submitButton as HTMLButtonElement)?.disabled ||
          document.querySelector(formErrorContainer)?.textContent?.trim() !==
            null ||
          currentValue1 !== value1 ||
          currentValue2 !== value2
        );
      },
      {timeout: 10000},
      submitAnswerButton,
      formErrorContainer,
      previousConversationToggleSelector,
      initialPreviousResponses,
      feedbackSelector,
      initialLatestResponse
    );
  }

  /**
   * Continue to next practice question
   */
  async continueToNextPracticeQuestion(): Promise<void> {
    const currentCardContentSelector = `${stateConversationContent} p`;
    await this.page.waitForSelector(currentCardContentSelector);

    const initialHeading = await this.page.$eval(
      practiceQuestionHeaderSelector,
      el => el?.textContent?.trim() ?? ''
    );
    try {
      await this.page.waitForSelector(nextCardButton, {timeout: 7000});
      await this.clickOnElementWithSelector(nextCardButton);
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        await this.clickOnElementWithSelector(nextCardArrowButton);
      } else {
        throw error;
      }
    }

    await this.page.waitForFunction(
      (selector: string, heading: string) => {
        const element = document.querySelector(selector);
        // In case of last question, the element should be hidden,
        // else it should have different heading.
        return !element || element.textContent?.trim() !== heading;
      },
      {},
      practiceQuestionHeaderSelector,
      initialHeading
    );
  }

  /**
   * Function to navigate to the next card in the preview tab.
   */
  async continueToNextCard(): Promise<void> {
    const currentCardContentSelector = `${stateConversationContent} p`;
    await this.page.waitForSelector(currentCardContentSelector);
    const currentCardContent = await this.page.$eval(
      currentCardContentSelector,
      el => el.textContent
    );
    try {
      await this.page.waitForSelector(nextCardButton, {timeout: 7000});
      await this.clickOnElementWithSelector(nextCardButton);
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        await this.clickOnElementWithSelector(nextCardArrowButton);
      } else {
        throw error;
      }
    }

    // Wait until card content changes.
    await this.page.waitForFunction(
      (selector: string, value: string) => {
        const element = document.querySelector(selector);
        return element?.textContent !== value;
      },
      {},
      currentCardContentSelector,
      currentCardContent
    );
  }

  /**
   * Clicks on continue button in continue button interaction.
   */
  async clickOnContinueButtonInInteractionCard(): Promise<void> {
    await this.expectElementToBeVisible(nextCardButton);
    await this.clickOnElementWithSelector(nextCardButton);

    await this.expectElementToBeVisible(nextCardButton, false);
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
   * @param answer - The answer to submit.
   */
  async submitAnswerInTextArea(answer: string): Promise<void> {
    await this.waitForElementToBeClickable(submitResponseToInteractionTextArea);
    await this.typeInInputField(submitResponseToInteractionTextArea, answer);
    await this.clickOnSubmitAnswerButton();
  }

  /**
   * Checks if value of input is equal to the given value.
   * @param {string} value - The value to check.
   */
  async expectAnswerInputValueToBe(value: string): Promise<void> {
    await this.expectElementValueToBe(floatFormInput, value);
  }

  /**
   * Checks if submit button is visible.
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
        {},
        submitAnswerButton
      );
    } else {
      await this.expectElementToBeVisible(
        submitAnswerButton,
        state === 'Visible'
      );
    }
  }

  /**
   * Function to submit an email to the newsletter input field.
   * @param {string} email - The email to submit.
   */
  async submitEmailForNewsletter(email: string): Promise<void> {
    await this.waitForElementToBeClickable(newsletterEmailInputField);
    await this.typeInInputField(newsletterEmailInputField, email);
    await this.clickOnElementWithSelector(newsletterSubscribeButton);
    await this.expectElementToBeVisible(newsletterSubscriptionThanksMessage);
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
    await this.clickAndWaitForNavigation(
      watchAVideoButtonInThanksForSubscribe,
      true
    );
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
    await this.clickAndWaitForNavigation(
      readOurBlogButtonInThanksForSubscribe,
      true
    );

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
    await this.page.waitForFunction(
      (url: string) => {
        const currentURL = window.location.href;
        return currentURL.includes(url);
      },
      {},
      testConstants.URLs.Login
    );
  }

  /**
   * Function to navigate to the Creator Dashboard.
   */
  async navigateToCreatorDashboard(verifyURL: boolean = true): Promise<void> {
    await this.goto(creatorDashboardUrl, verifyURL);
  }

  /**
   * Function to navigate to the Moderator Page.
   */
  async navigateToModeratorPage(verifyURL: boolean = true): Promise<void> {
    await this.goto(moderatorPageUrl, verifyURL);
  }

  /**
   * Function to navigate to the Preferences Page.
   */
  async navigateToPreferencesPage(verifyURL: boolean = true): Promise<void> {
    await this.goto(preferencesPageUrl, verifyURL);
  }

  /**
   * Function to navigate to the Topics and Skills Dashboard Page.
   */
  async navigateToTopicsAndSkillsDashboardPage(
    verifyURL: boolean = true
  ): Promise<void> {
    await this.goto(topicsAndSkillsDashboardUrl, verifyURL);
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
  async navigateToLearnerDashboard(verifyURL: boolean = true): Promise<void> {
    await this.goto(learnerDashboardUrl, verifyURL);
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
    await this.page.waitForSelector(searchInputSelector, {
      visible: true,
    });
    await this.clickOnElementWithSelector(searchInputSelector);
    await this.typeInInputField(searchInputSelector, lessonName);

    await this.page.keyboard.press('Enter');
    await this.page.waitForNavigation({waitUntil: ['load', 'networkidle0']});
  }

  /**
   * Filters lessons by multiple categories.
   * @param {string[]} categoryNames - The names of the categories to filter by.
   */
  async filterLessonsByCategories(categoryNames: string[]): Promise<void> {
    await this.page.waitForSelector(categoryFilterDropdownToggler, {
      visible: true,
    });
    await this.clickOnElementWithSelector(categoryFilterDropdownToggler);
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

    await this.clickOnElementWithSelector(searchInputSelector);
    await this.page.keyboard.press('Enter');

    await this.page.waitForFunction(
      (categoryNames: string[]) => {
        // Check if URL contains all the categories. Added %22 to remove false positives.
        return categoryNames.every(category =>
          window.location.href.includes(`%22${category}%22`)
        );
      },
      {},
      categoryNames
    );
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

          await this.expectElementToBeVisible(topicViewerContainerSelector);
          showMessage(`Topic ${topicName} is opened successfully.`);
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

  async expectTopicToContainStories(storyNames: string[]): Promise<void> {
    const selector = this.isViewportAtMobileWidth()
      ? mobileStoryTitleSelector
      : desktopStoryTitleSelector;

    const storyElements = await this.getAllElementsBySelector(selector);
    const storyNamesInPage =
      await this.getTextContentsFromElements(storyElements);

    for (const storyName of storyNames) {
      expect(storyNamesInPage).toContain(storyName);
    }
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
   * Navigates to the practice tab in the topic page.
   */
  async navigateToPracticeTabInTopic(): Promise<void> {
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

  async expectToBeInClassroomPage(classroomURLFragment: string): Promise<void> {
    await this.page.waitForFunction(
      (url: string) => {
        return window.location.href === url;
      },
      {},
      `${testConstants.URLs.ClassroomsPage}/${classroomURLFragment}`
    );
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
   * Clicks on the take quiz button in the classroom page.
   */
  async clickOnTakeQuizButtonInClassroomPage(): Promise<void> {
    await this.expectElementToBeVisible(takeQuizButtonSelector);

    await this.clickOnElementWithSelector(takeQuizButtonSelector);
    await this.expectElementToBeVisible(takeQuizButtonSelector, false);
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
   * Skips the current question in the diagnostic test.
   */
  async skipQuestionInDiagnosticTest(): Promise<void> {
    const initialProgress =
      (await this.page.$eval(currentProgessSelector, el =>
        el.textContent?.trim()
      )) ?? '';
    await this.expectElementToBeVisible(skipQuestionButton);

    await this.clickOnElementWithSelector(skipQuestionButton);

    await this.page.waitForFunction(
      (selector: string, value: string) => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() !== value;
      },
      {},
      currentProgessSelector,
      initialProgress
    );
  }

  async playChapterFromStory(chapterName: string): Promise<void> {
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

          await this.expectPageURLToContain(
            testConstants.URLs.ExplorationPlayer
          );
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
      await this.clickOnElementWithText('SKIP');
    }

    await this.page.waitForSelector(loginPromptContainer, {
      hidden: true,
    });
  }

  /**
   * Navigates back to the topic page after completing an exploration.
   */
  async returnToTopicPageAfterCompletingExploration(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickAndWaitForNavigation('Return to Story');
      await this.clickAndWaitForNavigation(NavbarBackButton, true);
    } else {
      await this.clickAndWaitForNavigation(oppiaTopicTitleSelector, true);
    }

    await this.page.waitForSelector(topicDescriptionSelector, {
      visible: true,
    });
  }

  /**
   * Navigates to the study tab on the topic page.
   * @param {string} topicUrlFragment - The url fragment of the current topic
   */
  async navigateToPracticeTabUsingURL(topicUrlFragment: string): Promise<void> {
    await this.goto(`${mathClassroomUrl}/${topicUrlFragment}/practice`);
    await this.waitForPageToFullyLoad();
  }

  /**
   * Navigates to the study tab on the topic page.
   */
  async navigateToStudyTab(): Promise<void> {
    await this.page.waitForSelector(topicPageLessonTabSelector);
    const topicPageStudyTabSelectorElement = await this.page.$(
      topicPageLessonTabSelector
    );
    await topicPageStudyTabSelectorElement?.click();

    await this.page.waitForSelector(topicPageRevisionTabContentSelector, {
      visible: true,
    });
  }

  /**
   * Selects a review card based on the subtopic name.
   * @param {string} subtopicName - The name of the subtopic to select.
   */
  async selectReviewCardToLearn(subtopicName: string): Promise<void> {
    try {
      await this.expectElementToBeVisible(subTopicTitleInLessTabSelector);
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

          await this.expectElementToBeVisible(
            subTopicTitleInLessTabSelector,
            false
          );
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
   * Verifies if the subtopic study guide has the expected title and sections.
   * @param {string} studyGuideTitle - The expected title of the study guide.
   * @param {string[][]} studyGuideSections - The expected sections of the study guide.
   * It is a list of sections. Sections are a list of strings having length of 2 - heading and content.
   */
  async expectSubtopicStudyGuideToHaveTitleAndSections(
    studyGuideTitle: string,
    studyGuideSections: string[][]
  ): Promise<void> {
    try {
      const isTitlePresent = await this.isTextPresentOnPage(studyGuideTitle);

      if (!isTitlePresent) {
        throw new Error(
          'Expected study guide title to be present, but it was not found.'
        );
      }

      for (var i = 0; i < studyGuideSections.length; i++) {
        for (var j = 0; j < 2; j++) {
          const isHeadingPresent = await this.isTextPresentOnPage(
            studyGuideSections[i][j]
          );
          if (!isHeadingPresent) {
            throw new Error(
              `Expected study guide section ${i + 1} heading to be present on the page, but it was not found`
            );
          }
          j++;
          const isContentPresent = await this.isTextPresentOnPage(
            studyGuideSections[i][j]
          );
          if (!isContentPresent) {
            throw new Error(
              `Expected study guide section ${i + 1} content to be present on the page, but it was not found`
            );
          }
        }
      }
    } catch (error) {
      const newError = new Error(
        `Failed to verify asections of study guide: ${error}`
      );
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * Click on the expand workedexample button.
   */
  async clickOnExpandWorkedexampleButton(): Promise<void> {
    await this.expectElementToBeVisible(expandWorkedExampleButton);
    await this.clickOnElementWithSelector(expandWorkedExampleButton);
    await this.page.waitForSelector(collapseWorkedExampleButton, {
      visible: true,
    });
  }

  /**
   * Click on the next study guide button.
   */
  async clickOnNextStudyGuideButton(): Promise<void> {
    await this.clickOnElementWithSelector(goToNextStudyGuideButton);
    await this.waitForPageToFullyLoad();
  }

  /**
   * Click on the study guide menu button.
   */
  async clickOnStudyGuideMenuButton(): Promise<void> {
    await this.clickOnElementWithSelector(goToStudyGuideMenuButton);
    await this.waitForPageToFullyLoad();
  }

  /**
   * Click on the practice button
   */
  async clickOnPracticeButton(): Promise<void> {
    await this.clickOnElementWithSelector(goToPracticeSectionButton);
    await this.waitForPageToFullyLoad();
  }

  /**
   * Click on the back to topic button
   */
  async clickOnBackToTopicButton(): Promise<void> {
    await this.clickOnElementWithSelector(goBackToTopicButton);
    await this.waitForPageToFullyLoad();
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

    await this.clickAndWaitForNavigation(nextLessonButton, true);

    await this.page.waitForSelector(nextLessonButton, {
      hidden: true,
    });
  }

  /**
   * Returns to the story from the last state of an exploration.
   */
  async returnToStoryFromLastState(): Promise<void> {
    await this.page.waitForSelector(returnToStoryFromLastStateSelector, {
      visible: true,
    });
    await this.page.click(returnToStoryFromLastStateSelector);

    await this.page.waitForSelector(storyViewerContainerSelector, {
      visible: true,
    });
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
        throw new Error(
          `Lesson "${lessonTitle}" not found in search results.\nFound: ${searchResults.join(', ')}`
        );
      }

      await this.waitForElementToBeClickable(
        searchResultsElements[lessonIndex]
      );
      await searchResultsElements[lessonIndex].click();
      await this.waitForStaticAssetsToLoad();

      await this.page.waitForSelector(lessonCardTitleSelector, {hidden: true});
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
    await this.clickOnElementWithSelector(feedbackPopupSelector);
    await this.page.waitForSelector(feedbackTextarea, {visible: true});
    await this.typeInInputField(feedbackTextarea, feedback);

    // If stayAnonymous is true, clicking on the "stay anonymous" checkbox.
    if (stayAnonymous) {
      await this.clickOnElementWithSelector(stayAnonymousCheckbox);
    }

    await this.clickOnElementWithText('Submit');

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
    await this.clickOnElementWithSelector(generateAttributionSelector);

    await this.page.waitForSelector(attributionHtmlSectionSelector, {
      visible: true,
    });
  }

  /**
   * Checks if the HTML string is present in the HTML section.
   * @param {string} htmlString - The HTML string to check for.
   */
  async expectAttributionInHtmlSectionToBe(htmlString: string): Promise<void> {
    await this.page.waitForSelector(attributionHtmlCodeSelector, {
      visible: true,
    });
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
    await this.page.waitForSelector(closeAttributionModalButton, {
      visible: true,
    });
    await this.clickOnElementWithSelector(closeAttributionModalButton);
    showMessage('Attribution modal closed successfully');

    await this.page.waitForSelector(closeAttributionModalButton, {
      hidden: true,
    });
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
    await this.page.waitForSelector(shareExplorationButtonSelector, {
      visible: true,
    });
    await this.clickOnElementWithSelector(shareExplorationButtonSelector);

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
    await this.page.waitForSelector(shareExplorationButtonSelector, {
      visible: true,
    });
    await this.clickOnElementWithSelector(shareExplorationButtonSelector);

    await this.expectEmbedClassroomLinkToWorkProperly(expectedCode);
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

    await this.waitForElementToStabilize(closeButtonSelector);
    await this.page.click(closeButtonSelector);
    await this.page.waitForSelector(embedCodeSelector, {hidden: true});
  }

  /**
   * Checks if the embed classroom in lesson info works properly.
   * @param explorationId The exploration id.
   */
  async expectEmbedClassroomInLessonInfoToWorkProperly(
    explorationId: string
  ): Promise<void> {
    const expectedCode = `<iframe src="http://localhost:8181/embed/exploration/${explorationId}" width="700" height="1000">`;

    await this.expectEmbedClassroomLinkToWorkProperly(expectedCode);
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

  /**
   * Checks if the lesson info text is present.
   * @param lessonText - The expected lesson info text.
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

  /*
   * Function to verify if the checkpoint modal appears on the screen.
   */
  async verifyCheckpointModalAppears(): Promise<void> {
    try {
      await this.page.waitForSelector(checkpointModalSelector, {
        visible: true,
      });
      showMessage('Checkpoint modal found.');
      // Closing the checkpoint modal.
      await this.clickOnElementWithSelector(closeLessonInfoTooltipSelector);
      await this.page.waitForSelector(checkpointModalSelector, {hidden: true});
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
    await this.page.waitForSelector(previousCardButton, {visible: true});
    await this.clickOnElementWithSelector(previousCardButton);

    await this.page.waitForSelector(nextCardArrowButton, {
      visible: true,
    });
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
    await this.page.waitForSelector(hintButtonSelector, {
      // Hint is shown after one minute.
      timeout: 80000,
    });
    await this.clickOnElementWithSelector(hintButtonSelector);

    await this.page.waitForSelector(gotItButtonSelector, {
      visible: true,
    });
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
   * Waits until the number of hint models is not equal to given.
   * @param {number} numberOfHintModals - The expected number of hint models.
   */
  async waitForHintModelsToBe(numberOfHintModals: number): Promise<void> {
    // Wait until number of elements is not equal to given.
    await this.page.waitForFunction(
      (selector: string, expectedLength: number) => {
        const elements = document.querySelectorAll(selector);
        return elements.length === expectedLength;
      },
      {
        // Each hint modal takes about 1 minute to appear.
        timeout: numberOfHintModals * 65000,
      },
      hintButtonSelector,
      numberOfHintModals
    );
  }

  /**
   * Function to close the hint modal.
   */
  async closeHintModal(): Promise<void> {
    await this.page.waitForSelector(gotItButtonSelector, {visible: true});
    await this.clickOnElementWithSelector(gotItButtonSelector);
    await this.page.waitForSelector(gotItButtonSelector, {hidden: true});
  }

  /**
   * Simulates the action of viewing the solution by clicking on the view solution button and the continue to solution button.
   */
  async viewSolution(timeout: number = 60000): Promise<void> {
    await this.page.waitForSelector(viewSolutionButton, {
      visible: true,
      timeout: timeout,
    });
    await this.clickOnElementWithSelector(viewSolutionButton);
    await this.clickOnElementWithSelector(continueToSolutionButton);
    await this.page.waitForSelector(closeSolutionModalButton, {
      visible: true,
    });
  }

  /**
   * Closes the solution modal by clicking on the close solution modal button.
   */
  async closeSolutionModal(): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(closeSolutionModalButton);
    const closeSolutionModalButtonElement = await this.page.$(
      closeSolutionModalButton
    );
    await closeSolutionModalButtonElement?.click();

    await this.expectElementToBeVisible(closeSolutionModalButton, false);
  }
  /**
   * Function to view previous responses in a state.
   * This function clicks on the responses dropdown selector to display previous responses.
   */
  async viewPreviousResponses(): Promise<void> {
    await this.page.waitForSelector(responsesDropdownSelector, {
      visible: true,
    });

    const divCounts = await this.page.$$eval(
      `${learnerViewCardSelector} div`,
      divs => divs.length
    );

    await this.clickOnElementWithSelector(responsesDropdownSelector);

    const newDivCounts = await this.page.$$eval(
      `${learnerViewCardSelector} div`,
      divs => divs.length
    );

    if (newDivCounts <= divCounts) {
      throw new Error(
        'No additional responses found. The dropdown did not expand.'
      );
    }
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
    expect(cardContent.trim()).toBe(expectedCardContent);
    showMessage('Card content is as expected.');
  }

  /**
   * Simulates a delay to avoid triggering the fatigue detection service.
   * This is important because the fatigue detection service could be activated again after further submissions. It can by-passed if there is 10 seconds of gap post quick 3 submissions.
   */
  async simulateDelayToAvoidFatigueDetection(): Promise<void> {
    await this.page.waitForTimeout(10000);
  }

  /**
   * Checks if the sign-up button is present on the page.
   */
  async expectSignUpButtonToBePresent(): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    await this.page.waitForSelector(signUpButton, {timeout: 5000});
    showMessage('Sign-up button present.');
  }

  /**
   * Checks if the sign-in button is present on the page.
   */
  async expectSignInButtonToBePresent(present: boolean = true): Promise<void> {
    await this.waitForStaticAssetsToLoad();
    try {
      await this.page.waitForSelector(signInButton, {timeout: 5000});
    } catch (error) {
      try {
        await this.page.waitForSelector(singInButtonInProgressModal, {
          timeout: 5000,
        });

        showMessage('Sign-in button present.');
      } catch (error) {
        if (error instanceof puppeteer.errors.TimeoutError && !present) {
          showMessage('Sign-in button not present.');
          return;
        }

        throw new Error(
          'Sign-in button not found.\n' + `Original error: ${error.message}`
        );
      }
    }

    if (!present) {
      throw new Error('Sign-in button is present, expected to be absent.');
    }
  }

  /**
   * Opens the lesson info modal.
   */
  async openLessonInfoModal(): Promise<void> {
    await this.page.waitForSelector(lessonInfoButton, {
      visible: true,
    });
    await this.clickOnElementWithSelector(lessonInfoButton);
    await this.page.waitForSelector(lessonInfoCardSelector, {visible: true});
  }

  /**
   * Closes the lesson info modal.
   */
  async closeLessonInfoModal(): Promise<void> {
    await this.page.waitForSelector(closeLessonInfoButton, {visible: true});
    await this.clickOnElementWithSelector(closeLessonInfoButton);
    await this.page.waitForSelector(lessonInfoCardSelector, {hidden: true});
  }

  /**
   * Checks if the progress remainder is found or not, based on the shouldBeFound parameter. (It can be found when the an already played exploration is revisited or an ongoing exploration is reloaded, but only if the first checkpoint is reached.)
   * @param {boolean} shouldBeFound - Whether the progress remainder should be found or not.
   */
  async expectProgressReminder(shouldBeFound: boolean): Promise<void> {
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
   * Saves the progress.(To be used when save progress modal is opened.)
   */
  async saveProgress(): Promise<void> {
    await this.page.waitForSelector(saveProgressButton, {visible: true});
    await this.clickOnElementWithSelector(saveProgressButton);

    await this.page.waitForSelector(signInBoxInSaveProressModalSelector, {
      visible: true,
    });
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
    await this.page.waitForSelector(validityInfoTextSelector, {visible: true});
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
      const context = this.page.browser().defaultBrowserContext();
      await context.overridePermissions('http://localhost:8181', [
        'clipboard-read',
        'clipboard-write',
      ]);

      // Click on the copy button.
      await this.waitForPageToFullyLoad();
      await this.page.waitForSelector(copyProgressUrlButton, {visible: true});
      await this.page.click(copyProgressUrlButton);

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
   * Starts an exploration with a progress URL.
   * @param {string} progressUrl - The URL to navigate to.
   */
  async startExplorationUsingProgressUrl(
    progressUrl: string,
    verifyURL: boolean = true
  ): Promise<void> {
    await this.goto(progressUrl, verifyURL);
  }

  /**
   * Clicks on first contributor in Lesson Info model.
   */
  async clickOnProfileIconInLessonInfoModel(): Promise<void> {
    await this.page.waitForSelector(contributorIconInLessonInfoSelctor, {
      visible: true,
    });
    await this.waitForElementToStabilize(contributorIconInLessonInfoSelctor);
    await this.clickOnElementWithSelector(contributorIconInLessonInfoSelctor);
    await this.expectElementToBeVisible(profileContainerSelector);

    expect(this.page.url()).toContain('/profile');
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
   * @param {'FaceBook' | 'Twitter' | 'Classroom'} explorationId - The id of the exploration.
   */
  async shareExplorationFromLessonInfoModal(
    platform: 'Facebook' | 'Twitter' | 'Classroom',
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
   * Goes through the sign up process.
   * @param {string} email - The email to sign up with.
   * @param {string} username - The username to sign up with.
   */
  async goThoroughSignUpProcess(
    email: string,
    username: string
  ): Promise<void> {
    await this.page.waitForSelector(testConstants.SignInDetails.inputField, {
      visible: true,
    });
    await this.typeInInputField(testConstants.SignInDetails.inputField, email);
    await this.clickOnElementWithText('Sign In');
    await this.page.waitForNavigation({waitUntil: 'networkidle0'});
    await this.typeInInputField('input.e2e-test-username-input', username);
    await this.clickOnElementWithSelector(
      'input.e2e-test-agree-to-terms-checkbox'
    );
    await this.page.waitForSelector(
      'button.e2e-test-register-user:not([disabled])'
    );
    await this.clickOnElementWithText(LABEL_FOR_SUBMIT_BUTTON);
    await this.page.waitForNavigation({waitUntil: 'networkidle0'});
    await this.page.waitForSelector('button.e2e-test-register-user', {
      hidden: true,
    });
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
    await this.page.waitForSelector(loginButtonSelector, {
      visible: true,
    });
    await this.clickOnElementWithText('Sign in');

    await this.goThoroughSignUpProcess(email, username);
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
      await this.clickOnElementWithSelector(openMobileNavbarMenuButton);
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
   * Simulates pressing a keyboard shortcut and verifies that the expected element is focused.
   * @param {string} shortcut - The keyboard shortcut to press.
   */
  async verifyFocusAfterShortcut(shortcut: string): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.simulateKeyboardShortcut(shortcut);

    // Determine the expected element to be focused.
    let expectedFocusedElement: puppeteer.ElementHandle | null = null;
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
    await this.page.waitForSelector(lessonLanguageSelector, {visible: true});
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
   * Expands the voiceover bar by clicking on the dropdown.
   */
  async expandVoiceoverBar(): Promise<void> {
    await this.expectElementToBeVisible(voiceoverDropdown);
    await this.clickOnElementWithSelector(voiceoverDropdown);
    await this.expectElementToBeVisible(voiceoverDropdown, false);
  }

  /**
   * Checks if the current voiceover language matches the expected language.
   * @param language - The expected language.
   */
  async expectCurrentVoiceoverLanguageToBe(language: string): Promise<void> {
    await this.expectElementToBeVisible(voiceoverSelectSelector);
    await this.expectElementValueToBe(voiceoverSelectSelector, language);
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
    await this.page.waitForSelector(playVoiceoverButton, {
      visible: true,
    });
    await this.clickOnElementWithSelector(playVoiceoverButton);
    await this.page.waitForSelector(pauseVoiceoverButton, {visible: true});

    showMessage('Started playing the voiceover.');
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
        (selector: string, value: number) => {
          const element = document.querySelector(selector);
          return parseInt(element?.textContent?.trim() ?? '', 10) >= value;
        },
        {},
        audioSliderSelector,
        currentSliderValue
      );

      if (shouldBePlaying) {
        showMessage('Voiceover is playing, as expected.');
      } else {
        throw new Error('Voiceover is playing, expected to be paused.');
      }
    } catch (error) {
      if (shouldBePlaying) {
        error.message =
          'Voiceover is not playing, expected to be playing.\n' + error.message;
        throw error;
      } else {
        showMessage('Voiceover is not playing, as expected.');
      }
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
    await this.page.waitForSelector(playVoiceoverButton);
    await this.clickOnElementWithSelector(playVoiceoverButton);

    // Check voiceover current time and compare.
    await this.page.waitForFunction(
      (selector: string, value: number) => {
        const element = document.querySelector(selector);
        return parseInt(element?.textContent?.trim() ?? '', 10) >= value;
      },
      {},
      audioSliderSelector,
      2
    );

    const currentSliderValue = await this.page.$eval(audioSliderSelector, el =>
      parseInt(el.textContent?.trim() ?? '', 10)
    );

    // Skipping the voiceover for 10 seconds.
    await this.page.waitForSelector(audioForwardButtonSelector);
    await this.page.click(audioForwardButtonSelector);
    await this.page.click(audioForwardButtonSelector);

    // If we skip voiceover twice, and wait for 5 seconds, the audio value should increase
    // between 10 to 15 seconds. We are checking for more than 12 seconds to avoid flaky test.
    await this.page.waitForFunction(
      (selector: string, value: number) => {
        const element = document.querySelector(selector);
        return parseInt(element?.textContent?.trim() ?? '', 10) >= value;
      },
      {},
      audioSliderSelector,
      currentSliderValue + 12
    );
  }

  /**
   * Pauses the voiceover by clicking on the pause button.
   */
  async pauseVoiceover(): Promise<void> {
    await this.page.waitForSelector(pauseVoiceoverButton, {visible: true});
    await this.clickOnElementWithSelector(pauseVoiceoverButton);
    await this.page.waitForSelector(playVoiceoverButton, {visible: true});
    showMessage('Voiceover paused successfully.');
  }

  /**
   * Checks if voiceover is playable.
   * @param playable - If voiceover should be playable or not.
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
        (selector: string, value: number) => {
          const element = document.querySelector(selector);
          return parseInt(element?.textContent?.trim() ?? '', 10) >= value;
        },
        {},
        audioSliderSelector,
        currentSliderValue
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
      await this.page.waitForSelector(playVoiceoverButton, {
        visible: true,
      });

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
   * Waits until audio is playing.
   * @param {number} timeout - The timeout for waiting until audio is playing.
   */
  async waitUntilAudioIsPlaying(timeout: number = 20000): Promise<void> {
    await this.page.waitForFunction((selector: string) => {
      const element = document.querySelector(selector);
      return (
        element?.textContent?.trim() === element?.getAttribute('aria-valuemax')
      );
    });

    // While mouse is over pause button, the pause button doesn't change its state.
    await this.page.mouse.move(10, 10);
  }

  /**
   * Navigates to and plays an exploration by its ID.
   * @param {string | null} explorationId - The ID of the exploration to play.
   */
  async playExploration(explorationId: string | null): Promise<void> {
    await this.goto(`${baseUrl}/explore/${explorationId as string}`);
  }

  /**
   * Opens the feedback popup and checks if the feedback form is present.
   */
  async openFeedbackPopup(): Promise<void> {
    await this.page.waitForSelector('nav-options', {visible: true});
    await this.page.waitForSelector(feedbackPopupSelector, {visible: true});
    await this.clickOnElementWithSelector(feedbackPopupSelector);
    await this.page.waitForSelector(feedbackTextarea, {visible: true});
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
    await this.page.waitForSelector(feedbackTextarea, {
      visible: true,
    });
    await this.typeInInputField(feedbackTextarea, feedback);

    // If stayAnonymous is true, clicking on the "stay anonymous" checkbox.
    if (stayAnonymous) {
      await this.clickOnElementWithSelector(stayAnonymousCheckbox);
    }

    await this.clickOnElementWithText('Submit');

    if (verifyFeedbackPopup) {
      await this.verifyFeedbackSubmissionSuccess();
    }
  }

  /**
   * TODO(#22716): Update naming to be more descriptive and start with expect.
   * Verifies that the feedback submission was successful by checking for the presence of the feedback popup.
   */
  async verifyFeedbackSubmissionSuccess(): Promise<void> {
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
   * Checks if Video RTE is present in current lesson card.
   */
  async expectVideoRTEToBePresent(): Promise<void> {
    await this.page.waitForSelector(youtubePlayerSelector, {visible: true});
  }

  /**
   * Checks if there is link text RTE present in current lesson card.
   * @param linkURL - The URL to which link text should redirect when clicked.
   */
  async expectLinkRTEToPresent(linkURL: string): Promise<void> {
    const linkSelector = `oppia-noninteractive-link a.linkText[href="${linkURL}"]`;
    await this.page.waitForSelector(linkSelector, {visible: true});
  }

  /**
   * Check if colllapsible RTE element is present or not.
   * @param header - The header of collapsible RTE element.
   * @param content - The content collapsible RTE element should have.
   */
  async expectCollapsibleRTEToBePresent(
    header: string = 'Sample Header',
    content: string = 'You have opened the collapsible block.'
  ): Promise<void> {
    await this.page.waitForSelector(collapsibleRTEHeaderSelector, {
      visible: true,
    });
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
    await this.page.waitForSelector(collapsibleRTEContentSelector, {
      visible: true,
    });
    const collapsibleRTEContent = await this.page.$(
      collapsibleRTEContentSelector
    );
    const collapsibleRTEContentText = await this.page.evaluate(
      element => element.textContent,
      collapsibleRTEContent
    );
    expect(collapsibleRTEContentText).toContain(content);
  }

  /**
   * Checks if button with "left arrow" icon is present to move back to previous lesson card.
   * @param visibility - Boolean value representing should be visible or not.
   */
  async expectGoBackToPreviousCardButton(
    visibility: boolean = true
  ): Promise<void> {
    if (visibility) {
      await this.page.waitForSelector(previousCardButton, {visible: true});
    } else {
      await this.page.waitForSelector(previousCardButton, {hidden: true});
    }
  }

  /**
   * Checks if "Stay Anonymous" checkbox is checked or not.
   * @param status - Boolean value representing that checkbox should be checked or not.
   */
  async expectStayAnonymousCheckboxToBePresent(
    status: boolean = true
  ): Promise<void> {
    if (status) {
      await this.page.waitForSelector(stayAnonymousCheckbox, {visible: true});
      showMessage('Stay anonymous checkbox is present.');
      return;
    } else {
      try {
        await this.page.waitForSelector(stayAnonymousCheckbox, {visible: true});
        throw new Error(
          'Stay anonymous checkbox is present, but it should not be.'
        );
      } catch (error) {
        if (error instanceof puppeteer.errors.TimeoutError) {
          showMessage('Stay anonymous checkbox is not present, as expected.');
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Checks if "Continue" button is present in the lesson card.
   * @param status - Boolean value representing that button should be present or not. Default is true (visible)
   */
  async expectContinueToNextCardButtonToBePresent(
    status: boolean = true
  ): Promise<void> {
    if (status) {
      await this.page.waitForSelector(nextCardButton, {visible: true});
      showMessage('Continue button is present.');
      return;
    } else {
      try {
        await this.page.waitForSelector(nextCardButton, {visible: true});
        throw new Error('Continue button is present, but it should not be.');
      } catch (error) {
        if (error instanceof puppeteer.errors.TimeoutError) {
          showMessage('Continue button is not present, as expected.');
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Checks if lesson info text is visible or not.
   * @param status - Boolean value representing that info text should be visible or not.
   */
  async expectLessonInfoTextToBePresent(status: boolean = true): Promise<void> {
    if (status) {
      await this.page.waitForSelector(lessonInfoButton, {visible: true});
      showMessage('Lesson info text is present.');
      return;
    } else {
      try {
        await this.page.waitForSelector(lessonInfoButton, {visible: true});
        throw new Error('Lesson info text is present, but it should not be.');
      } catch (error) {
        if (error instanceof puppeteer.errors.TimeoutError) {
          showMessage('Lesson info text is not present, as expected.');
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Checks if all dropdowns in navbar open properly.
   */
  async expectDropdownsInNavbarToWorkProperly(): Promise<void> {
    await this.expectElementToBeVisible(navbarLearnTab);
    await this.clickOnElementWithSelector(navbarLearnTab);
    await this.expectElementToBeVisible(navbarLearnDropdownContainerSelector);

    await this.clickOnElementWithSelector(navbarAboutTab);
    await this.expectElementToBeVisible(navbarAboutDropdownConatinaerSelector);

    await this.clickOnElementWithSelector(navbarGetInvolvedTab);
    await this.expectElementToBeVisible(
      navbarGetInvolvedDropdownContainerSelector
    );
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
   * Checks if non-interactive tab with given heading contains expected content in lesson card.
   * @param tabHeading - The tab heading to check content for.
   * @param tabContent - The content of tab
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
    await this.page.waitForSelector(selector);
    await this.clickOnElementWithSelector(selector);

    const contentSelector = `.e2e-test-tab-content-${tabIndex}`;
    await this.page.waitForSelector(contentSelector);
    const actualContent = await this.page.$eval(
      contentSelector,
      el => el.textContent
    );

    expect(actualContent).toContain(tabContent);
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
   * Checks if fraction input is visible.
   */
  async expectFractionInputToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(fractionInputSelector);
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
   * Checks if Audio bar is visible or not.
   * @param visible - Expected visibility.
   */
  async expectVoiceoverBarToBePresent(visible: boolean = true): Promise<void> {
    let isVisible = true;

    try {
      await this.page.waitForSelector(voiceoverDropdown);
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
   * Checks if the text content of an element matches the expected value.
   * @param selector - The CSS selector to find the element.
   * @param value - The expected text content value.
   * @param exactMatch - If true, checks for exact match. If false, checks if value is contained in text content.
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
   * Checks if text content of any element with given selector matches the
   * given value.
   * @param selector - The CSS selector to find the elements.
   * @param value - The expected text content value.
   */
  async expectAnyElementWithSelectorToHaveTextContent(
    selector: string,
    value: string
  ): Promise<void> {
    const values = await this.page.$$eval(selector, elements =>
      elements.map(element => (element as HTMLElement).textContent)
    );

    if (!values.includes(value)) {
      throw new Error(
        `Expected text content to contain ${value}, but found ${values.join(',')}`
      );
    }
  }

  /**
   * Checks if heading in partnership matches the expected heading.
   * @param heading - The expected heading.
   */
  async expectPartnershipHeadingToBe(heading: string): Promise<void> {
    try {
      await this.expectTextContentInElementWithSelectorToBe(
        partnershipsHeadingSelector,
        heading,
        true
      );
    } catch (error) {
      throw new Error(
        `Expected heading to be ${heading}, but found got error: ${error}`
      );
    }
  }

  /**
   * Checks if the partner with us button is visible at the top of the partnerships page.
   */
  async expectPartnerWithUsButtonIsVisible(): Promise<void> {
    await this.expectElementToBeVisible(
      partnerWithUsButtonAtTheTopOfPartnershipsPage
    );
  }

  /**
   * Checks if the subheadings in the partnerships page contain the expected subheading.
   * @param subheading - The expected subheading.
   */
  async expectSubheadingsInPartnershipPageToContain(
    subheading: string
  ): Promise<void> {
    const subheadings = await this.page.$$eval(
      partnershipPageSubheadingsSelector,
      elements => elements.map(element => (element as HTMLElement).textContent)
    );

    if (subheadings.includes(subheading)) {
      showMessage(`Subheading ${subheading} is present.`);
    } else {
      throw new Error(
        `Subheading "${subheading}" is not present. Subheading present: ${subheadings.join(', ')}`
      );
    }
  }

  /**
   * Checks if the partnerships page contains the expected image.
   */
  async expectPartneringWithUsImageToBePresent(): Promise<void> {
    await this.expectElementToBeVisible(partneringWithUsImageSelector);
  }

  /**
   * Checks if heading in about us page matches the expected heading.
   * @param heading - The expected heading.
   */
  async expectAboutUsPageHeadingToBe(heading: string): Promise<void> {
    await this.expectTextContentInElementWithSelectorToBe(
      aboutUsHeadingSelector,
      heading
    );
  }

  /**
   * Checks if given subheading is available in about page.
   * @param subheading - The expected subheading.
   */
  async expectSubheadingInAboutUsPageToContain(
    subheading: string
  ): Promise<void> {
    const subheadings = await this.page.$$eval(
      aboutUsSubheadingSelector,
      elements => elements.map(element => (element as HTMLElement).textContent)
    );

    if (subheadings.includes(subheading)) {
      showMessage(`Subheading ${subheading} is present.`);
    } else {
      throw new Error(
        `Subheading "${subheading}" is not present. Subheading present: ${subheadings.join(', ')}`
      );
    }
  }

  /**
   * Checks if given goal listed in any section of about page.
   * @param sectionGoal - The expected section goal.
   */
  async expectSectionGoalsInAboutPageToContain(
    sectionGoal: string
  ): Promise<void> {
    await this.expectAnyElementWithSelectorToHaveTextContent(
      '.oppia-about-foundation-section-goal-title',
      sectionGoal
    );
  }

  /**
   * Checks if explore button is visible in about page.
   */
  async expectExploreLessonsButtonInAboutPageToBePresent(): Promise<void> {
    await this.expectElementToBeVisible(
      exploreLessonsButtonInAboutUsPageSelector
    );
  }

  /**
   * Checks if android app button is visible in about page.
   */
  async expectAndroidAppButtonInAboutPageToBePresent(): Promise<void> {
    await this.expectElementToBeVisible(androidAppButtonInAboutUsPageSelector);
  }

  /**
   * Checks for number of partnership stories.
   * @param n - The expected number of story boards.
   */
  async expectPartnershipStoryBoardsToBe(n: number): Promise<void> {
    const selector = this.isViewportAtMobileWidth()
      ? partnershipStoryBoardMobileSelector
      : partnershipStoryBoardDesktopSelector;
    const storyBoards = await this.page.$$eval(selector, elements =>
      elements.map(element => (element as HTMLElement).textContent)
    );

    if (storyBoards.length !== n) {
      throw new Error(
        `Expected ${n} story boards, but found ${storyBoards.length} (${storyBoards.join(', ')})`
      );
    }
  }

  /**
   * Checks for number of impact stats listed.
   * @param n - The expected number of impact stats.
   */
  async expectImpactStatsTitlesToBe(n: number): Promise<void> {
    const impactStats = await this.page.$$eval(
      impactStatsTitleSelector,
      elements => elements.map(element => (element as HTMLElement).textContent)
    );

    if (impactStats.length !== n) {
      throw new Error(
        `Expected ${n} impact stats, but found ${impactStats.length} (${impactStats.join(', ')})`
      );
    }
  }

  /**
   * Checks for number of impact histogram shown.
   * @param n - The expected number of histograms.
   */
  async expectImpactChartsToBe(n: number): Promise<void> {
    const impactCharts = await this.page.$$eval(
      impactChartContainerSelector,
      elements => elements.map(element => (element as HTMLElement).textContent)
    );

    if (impactCharts.length !== n) {
      throw new Error(
        `Expected ${n} impact charts, but found ${impactCharts.length} (${impactCharts.join(', ')})`
      );
    }
  }

  /**
   * Checks if "Our Impact" section is visible in donation page.
   */
  async expectOurImpactSectionInDonationPageToBePresent(): Promise<void> {
    await this.expectElementToBeVisible(ourImpactSectionSelector);
  }

  /**
   * Checks if "Our Learners" section is visible in donation page.
   */
  async expectOurLearnersSectionInDonationPageToBePresent(): Promise<void> {
    await this.expectElementToBeVisible(ourLearnersSectionSelector);
  }

  /**
   * Matches donation page heading with given heading.
   * @param heading - The expected heading.
   */
  async expectDonationPageHeadingToBe(heading: string): Promise<void> {
    await this.expectTextContentInElementWithSelectorToBe(
      donationHeadingSelector,
      heading
    );
  }

  /**
   * Verifies that the "Ready to make an impact?" text is present on the page.
   */
  async expectReadyToMakeAnImpactToBePresent(): Promise<void> {
    await this.expectTextContentInElementWithSelectorToBe(
      readyToMakeDonationSelector,
      ' Ready to make an impact? '
    );
  }

  /**
   * Checks if "Our Network" section is visible in donation page.
   */
  async expectOurNetworkSectionInDonationPageToBePresent(): Promise<void> {
    await this.expectElementToBeVisible(ourNetworkHeadingSelector);

    await this.expectTextContentInElementWithSelectorToBe(
      ourNetworkHeadingSelector,
      'Our Network'
    );

    await this.expectElementToBeVisible(ourNetworkSectionSelector);
    await this.expectElementToBeVisible(donationHighlightsSelector);
  }

  /**
   * Checks that the "View Report" button on the About page is visible.
   */
  async expectViewReportButtonInAboutPageToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(impactReportButtonInAboutPage);
  }

  /**
   * Validates that a given subheading text appears on the Parents and Teachers page.
   *
   * @param subheading - The expected subheading text to be found.
   */
  async subheadingInParentsAndTeachersPageToContain(
    subheading: string
  ): Promise<void> {
    await this.expectAnyElementWithSelectorToHaveTextContent(
      subheadingInParentsAndTeachersPageSelector,
      subheading
    );
  }

  /**
   * Clicks the Play Store image on the Android page and verifies that it navigates
   * to the correct Google Play Store URL for the Oppia Android app.
   */
  async clickOnPlayStoreImageInAndroidPageAndVerifyNavigation(): Promise<void> {
    await this.expectElementToBeVisible(redirectToPlayStoreImageSelector);

    await this.clickLinkButtonToNewTab(
      redirectToPlayStoreImageSelector,
      'Play Store Image',
      'https://play.google.com/store/apps/details?id=org.oppia.android',
      'Oppia - Apps on Google Play'
    );
  }

  /**
   * Ensures that the heading on the Volunteer page contains the specified text.
   *
   * @param heading - The expected heading text to be validated.
   */
  async expectVolunteerPageHeadingToContain(heading: string): Promise<void> {
    await this.expectAnyElementWithSelectorToHaveTextContent(
      volunteerPageHeadingSelector,
      heading
    );
  }

  /**
   * Checks for subheading in Contact Us Page.
   * @param subheading - The expected subheading text to be found.
   */
  async verifyContactUsSubHeading(subheading: string): Promise<void> {
    const actualSubheading = await this.page.$eval(
      contactUsSubheadingSelector,
      element => (element as HTMLElement).textContent
    );

    if (actualSubheading !== subheading) {
      throw new Error(
        `Expected subheading to be ${subheading}, but found ${actualSubheading}`
      );
    }
  }

  /**
   * Checks if content card with given heading exists in contact us page.
   * @param heading - The heading to check for in content cards.
   */
  async expectContactUsPageToContainContentCardWithHeading(
    heading: string
  ): Promise<void> {
    const contentCardHeadings = this.page.$$eval(
      contactUsContentCardHeadingSelector,
      elements => elements.map(element => (element as HTMLElement).textContent)
    );

    if ((await contentCardHeadings).includes(heading)) {
      showMessage(`Heading ${heading} is present.`);
    } else {
      throw new Error(
        `Heading "${heading}" is not present. Heading present: ${(await contentCardHeadings).join(', ')}`
      );
    }
  }

  /**
   * Checks if content cards with given heading exists in contact us page.
   * @param headings - The headings to check for in content cards.
   */
  async expectContactUsPageToContainContentCardsWithHeading(
    headings: string[]
  ): Promise<void> {
    for (let heading of headings) {
      await this.expectContactUsPageToContainContentCardWithHeading(heading);
    }
  }

  /**
   * Checks if YouTube video IFrame has Youtube URL and Video ID.
   * @param videoID - The expected video ID to be found in the YouTube video URL.
   */
  async expectYouTubeVideoInPartnershipWithVideoID(
    videoID: string
  ): Promise<void> {
    const videoBaseURI = await this.page.$eval(
      partnershipYoutubeVideoIFrameSelector,
      el => (el as HTMLIFrameElement).src
    );

    expect(videoBaseURI).toContain('https://www.youtube.com/embed');
    expect(videoBaseURI).toContain(videoID);
  }

  /**
   * Checks if Carousel of Learner Stories in Partnership Page works properly.
   */
  async verifyLearnerStoriesCarouselInPartnershipPageWorksProperly(): Promise<void> {
    const activeItemSelector = `${learnerStoriesCarouselContainerSelector} .carousel-item.active`;
    await this.expectElementToBeVisible(learnerStoriesHeadingSelector);

    // Verify Coursal Heading.
    const subHeading = await this.page.$eval(
      learnerStoriesHeadingSelector,
      element => (element as HTMLElement).textContent
    );
    expect(subHeading).toBe('Learner Stories');

    // Check if coursal works properly.
    const carouselItems = await this.page.$$eval(
      `${learnerStoriesCarouselContainerSelector} .carousel-item`,
      elements => elements.map(element => (element as HTMLElement).textContent)
    );
    expect(carouselItems.length).toBe(3);

    const activeCarouselItems = await this.page.$$eval(
      activeItemSelector,
      elements => elements.map(element => (element as HTMLElement).textContent)
    );
    expect(activeCarouselItems.length).toBe(1);

    // Check if carousel items are moving.
    // Capture the initial slide ID.
    const initialSlideId = await this.page.$eval(
      activeItemSelector,
      el => el.id
    );

    // Wait for the active class to move to a different slide.
    await this.page.waitForFunction(
      (initialId: string, selector: string) => {
        const active = document.querySelector(selector);
        return active && active.id !== initialId;
      },
      {timeout: 10000}, // Timeout after 10 seconds if no change.
      initialSlideId,
      activeItemSelector
    );

    // Confirm new slide ID is different.
    const newSlideId = await this.page.$eval(activeItemSelector, el => el.id);
    expect(newSlideId).not.toBe(initialSlideId);
  }

  /**
   * Function to verify the hint in the hint modal.
   * @param {string} expectedHint - The expected hint.
   */
  async expectHintInHintModalToContain(expectedHint: string): Promise<void> {
    await this.expectElementToBeVisible(commonModalTitleSelector);

    await this.expectTextContentToBe(commonModalTitleSelector, 'Hint');
    await this.expectTextContentToContain(
      commonModalBodySelector,
      expectedHint
    );
  }
  /**
   * Function to verify the community library heading is present.
   * @param {string} heading - The heading to verify.
   */
  async expectCommunityLibraryHeadingToBePresent(
    heading: string
  ): Promise<void> {
    await this.page.waitForSelector(communityLibraryHeading, {
      visible: true,
      timeout: 5000,
    });

    const communityLibraryHeadingText = await this.page.$eval(
      communityLibraryHeading,
      el => el.textContent
    );

    if (communityLibraryHeadingText?.trim() !== heading) {
      throw new Error(
        `Expected community library heading to be ${heading}, but found ${communityLibraryHeadingText}`
      );
    }

    showMessage(`Success: Community library heading is ${heading}.`);
  }

  /**
   * Function to verify the community library group header is present.
   * @param {string[]} groupHeaders - The group headers to verify.
   */
  async expectCommunityLibraryGroupHeaderToContain(
    groupHeaders: string[]
  ): Promise<void> {
    await this.page.waitForSelector(communityLibraryGroupHeader, {
      visible: true,
    });

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
   * Function to verify the dev mode label is visible or not.
   * @param {boolean} visible - Whether the dev mode label should be visible or not.
   */
  async expectDevModeLabelToBeVisible(visible: boolean = true): Promise<void> {
    try {
      await this.page.waitForSelector(devModeLabelSelector, {
        visible: true,
      });

      if (visible) {
        showMessage('Verified: Dev mode label is visible.');
      } else {
        throw new Error('Dev mode label is visible.');
      }
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
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
   * Function to click the Browse Lessons button on the home page.
   */
  async clickBrowseLessonsButtonInHomePage(): Promise<void> {
    await this.expectElementToBeVisible(browseLessonButtonSelector);
    await this.page.click(browseLessonButtonSelector);
    showMessage('Clicked on browse lessons button.');

    await this.expectElementToBeVisible(browseLessonButtonSelector, false);
  }

  /**
   * Function to verify the home page title.
   * @param {string} title - The expected title of the home page.
   */
  async expectHomePageTitleToBe(title: string): Promise<void> {
    await this.page.waitForSelector(homePageHeadingSelector);
    expect(
      await this.page.$eval(homePageHeadingSelector, el => el.textContent)
    ).toBe(title);
  }

  /**
   * Function to click on the classroom tile in the learn page.
   * @param {string} classroomName - The name of the classroom.
   */
  async clickOnClassroomTileInLearnPage(classroomName: string): Promise<void> {
    await this.expectElementToBeVisible(classroomTileContainerSelector);

    const classroomTiles = await this.page.$$(classroomTileContainerSelector);

    for (const classroomTile of classroomTiles) {
      const classroomTileName = await classroomTile.$eval(
        classroomNameSelector,
        el => el.textContent
      );

      if (classroomTileName === classroomName) {
        await classroomTile.click();
        break;
      }
    }

    await this.waitForPageToFullyLoad();
    await this.page.waitForFunction(
      (url: string) => {
        return url !== `${baseUrl}/learn`;
      },
      {},
      this.page.url()
    );
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
    const headings = await this.page.$$eval(diagnosticTestHeadingSelector, el =>
      el.map(el => el.textContent)
    );

    expect(headings).toContain(expectedHeading);
    showMessage(`Success: Heading is ${expectedHeading}.`);

    const buttons = await this.page.$$eval(diagnosticTestButtonSelector, el =>
      el.map(el => el.textContent)
    );

    expect(buttons).toContain(expectedButtonText);
    showMessage(`Success: Button is ${expectedButtonText}.`);
  }

  /**
   * Function to verify the heading in classroom page.
   * @param {string} expectedHeading - The expected heading of the classroom.
   */
  async expectHeadingInClassroomPageToContain(
    expectedHeading: string
  ): Promise<void> {
    await this.expectElementToBeVisible(classroomContentHeadingSelector);
    const headings = await this.page.$$eval(
      classroomContentHeadingSelector,
      el => el.map(el => el.textContent)
    );

    expect(headings).toContain(expectedHeading);
    showMessage(`Success: Heading is ${expectedHeading}.`);
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
      const titleText = await this.page.evaluate(
        el => el.textContent.trim(),
        titleElement
      );
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
   * Function to verify the classroom heading.
   * @param {string} expectedHeading - The expected heading of the classroom.
   */
  async expectClassroomHeadingToBe(expectedHeading: string): Promise<void> {
    await this.expectTextContentToBe(classroomHeadingSelector, expectedHeading);
  }

  /**
   * Starts a practice session for the given subtopics.
   * @param {string[]} subtopicNames - The names of the subtopics to start a practice session for.
   */
  async startPracticeSession(subtopicNames: string[]): Promise<void> {
    await this.page.waitForSelector(subtopicListItemInPracticeTabSelector);

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
          await labelElement.click();
          await this.page.waitForFunction(
            (element: HTMLInputElement) => element.checked === true,
            {},
            await labelElement.$('input')
          );

          subtopicsAdded.add(subtopicName);
        }
      }
    }

    await this.page.waitForSelector(startPracticeButtonSelector);
    await this.clickOnElementWithSelector(startPracticeButtonSelector);
    await this.page.waitForSelector(startPracticeButtonSelector, {
      hidden: true,
    });
  }

  /**
   * Expects the tab title in the topic page to be the expected tab title.
   * @param expectedTabTitle The expected tab title.
   */
  async expectTabTitleInTopicPageToBe(expectedTabTitle: string): Promise<void> {
    await this.page.waitForSelector(tabTitleInTopicPageSelector);

    await this.page.waitForFunction(
      (selector: string, expectedTabTitle: string) => {
        const tabTitle = document.querySelector(selector)?.textContent?.trim();
        return tabTitle === expectedTabTitle;
      },
      {},
      tabTitleInTopicPageSelector,
      expectedTabTitle
    );
  }

  /**
   * Expects the subtopics in the practice tab to contain the expected subtopics.
   * @param subtopicNames The expected subtopics.
   */
  async expectSubtopicListInPracticeTabToContain(
    subtopicNames: string[]
  ): Promise<void> {
    await this.page.waitForSelector(subtopicListItemInPracticeTabSelector);
    const subtopicsInList = await this.page.$$eval(
      subtopicListItemInPracticeTabSelector,
      subtopics => subtopics.map(subtopic => subtopic.textContent?.trim())
    );

    for (const subtopicName of subtopicNames) {
      expect(subtopicsInList).toContain(subtopicName);
    }
  }

  async expectToBeInPracticeSession(): Promise<void> {
    expect(await this.isElementVisible(practiceSessionContainerSelector)).toBe(
      true
    );
  }

  /**
   * Expects the user to be in the diagnostic test player.
   */
  async expectToBeInDiagnosticTestPlayer(): Promise<void> {
    await this.expectElementToBeVisible(diagnosticTestPlayerSelector);

    await this.isTextPresentOnPage('Learner Diagnostic Test');
  }

  /**
   * Function to close the save progress menu.
   */
  async closeSaveProgressMenu(): Promise<void> {
    await this.page.waitForSelector(saveProgressCloseButtonSelector);
    await this.clickOnElementWithSelector(saveProgressCloseButtonSelector);

    await this.page.waitForSelector(saveProgressCloseButtonSelector, {
      hidden: true,
    });
  }

  /**
   * Clicks on the next recommended chapter button.
   */
  async continueToNextRecommendedLesson(): Promise<void> {
    await this.page.waitForSelector(recommendedNextChapterSelector);
    await this.clickOnElementWithSelector(recommendedNextChapterSelector);

    await this.page.waitForSelector(recommendedNextChapterSelector, {
      hidden: true,
    });
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
    await this.page.waitForSelector(contributorsContainerSelector);
    await this.page.waitForSelector(`${contributorIconPrefix}${index - 1}`);

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
   * Function to verify if the user is on the story page.
   * @param {string} storyTitle - The title of the story.
   */
  async expectToBeOnStoryPage(storyTitle: string): Promise<void> {
    await this.page.waitForFunction(
      (selector: string, value: string) => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() === value;
      },
      {},
      storyTitleSelector,
      storyTitle
    );
  }

  /**
   * Checks if the lesson info modal header matches the expected header.
   * @param header - The expected header.
   */
  async expectLessonInfoModalHeaderToBe(header: string): Promise<void> {
    await this.expectElementToBeVisible(lessonInfoModalHeaderSelector);
    await this.expectTextContentToMatch(lessonInfoModalHeaderSelector, header);
  }

  /**
   * Checks if the save progress button is visible.
   */
  async expectSaveProgressButtonToBeVisible(): Promise<void> {
    await this.page.waitForSelector(saveProgressButton, {
      visible: true,
    });
  }

  /**
   * Checks if the progress reminder modal text matches the expected text.
   * @param expectedText - The expected text.
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
   * Expects the profile picture to be present.
   */
  async expectProfilePictureToBePresent(): Promise<void> {
    await this.page.waitForSelector(profilePictureSelector, {
      visible: true,
    });
  }

  /**
   * Checks if the user is on the community library page.
   */
  async expectToBeOnCommunityLibraryPage(): Promise<void> {
    await this.page.waitForFunction(
      (url: string) => {
        return window.location.href.includes(url);
      },
      {},
      testConstants.URLs.CommunityLibrary
    );
  }

  /**
   * Hovers over the toast message to see the error message.
   */
  async hoverOverToastMessage(): Promise<void> {
    await this.page.waitForSelector(toastMessageSelector);
    await this.page.hover(toastMessageSelector);
  }

  /**
   * Updates the toast style to make it visible.
   */
  async updateToastStyle(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        .e2e-test-toast-message {
          opacity: 1 !important;
          transition: none !important;
          animation: none !important;
        }
      `,
    });
  }

  /**
   * Checks if the blog post is present.
   * @param {string} expectedBlog - the title of the expected blog post.
   */
  async expectBlogPostToBePresent(expectedBlog: string): Promise<void> {
    await this.navigateToBlogPage();

    await this.expectElementToBeVisible(blogPostTitleSelector);
    const blogTitles = await this.page.$$eval(blogPostTitleSelector, elements =>
      elements.map(element => element.textContent)
    );
    for (const title of blogTitles) {
      if (!title) {
        continue;
      }
      if (title.includes(expectedBlog)) {
        showMessage('The blog post is present on the blog dashboard.');
        return;
      }
    }

    throw new Error(
      `The blog post "${expectedBlog}" was not found on the blog dashboard.\n` +
        `Found blog posts: "${blogTitles.join('", "')}"`
    );
  }

  /**
   * Checks if the promo bar is visible and if the promotion content is correct.
   * @param {boolean} visible - Whether the promo bar should be visible or not.
   * @param {string} promotionContent - The expected promotion content.
   */
  async expectPromoBarToBeVisible(
    visible: boolean = true,
    promotionContent?: string
  ): Promise<void> {
    await this.expectElementToBeVisible(promoBarTextSelector, visible);

    if (visible && promotionContent) {
      await this.expectTextContentToBe(promoBarTextSelector, promotionContent);
    }
  }

  /**
   * Compares the text content of next button in lesson player.
   * @param buttonText - Expected button text.
   */
  async expectNextCardButtonTextToBe(buttonText: string): Promise<void> {
    await this.expectTextContentToBe(nextCardButton, buttonText);
  }
}

export let LoggedOutUserFactory = (): LoggedOutUser => new LoggedOutUser();
