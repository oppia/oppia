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
 * @fileoverview Constants that can be re-used in the acceptance tests.
 */

import path from 'path';

export default {
  URLs: {
    BaseURL: 'http://localhost:8181',
    About: 'http://localhost:8181/about',
    AdminPage: 'http://localhost:8181/admin',
    AdminPageRolesTab: 'http://localhost:8181/admin#/roles',
    AdminPageActivitiesTab: 'http://localhost:8181/admin#/activities',
    AdminPageMiscTab: 'http://localhost:8181/admin#/misc',
    AdminPagePlatformParametersTab:
      'http://localhost:8181/admin#/platform-parameters',
    Android: 'http://localhost:8181/android',
    Blog: 'http://localhost:8181/blog',
    BlogAdmin: 'http://localhost:8181/blog-admin',
    BlogDashboard: 'http://localhost:8181/blog-dashboard',
    BlogPostUrlInPartnershipsPage:
      'https://www.oppia.org/blog/teaching-a-chapter-of-expressions-equations-' +
      'in-summer-school-0q6r28fzsrwc',
    CCLicense: 'https://creativecommons.org/licenses/by-sa/4.0/legalcode',
    ClassroomAdmin: 'http://localhost:8181/classroom-admin',
    ClassroomsPage: 'http://localhost:8181/learn',
    CommunityLibrary: 'http://localhost:8181/community-library',
    recentlyPublishedExplorations:
      'http://localhost:8181/community-library/recently-published',
    Contact: 'http://localhost:8181/contact',
    ContributorDashboard: 'http://localhost:8181/contributor-dashboard',
    ContributorDashboardAdmin:
      'http://localhost:8181/contributor-admin-dashboard',
    CreatorDashboard: 'http://localhost:8181/creator-dashboard',
    CreatorDashboardCreateMode:
      'http://localhost:8181/creator-dashboard?mode=create',
    CreatingAnExploration: 'https://oppia.github.io/#/CreatingAnExploration',
    CreatorGuidelines: 'http://localhost:8181/creator-guidelines',
    Donate: 'http://localhost:8181/donate',
    DonatePageThanksModalURL: 'http://localhost:8181/donate?thanks=',
    AboutPageThanksModalURL: 'http://localhost:8181/about?thanks=',
    EmbeddingAnExploration: 'https://oppia.github.io/#/EmbeddingAnExploration',
    ExplorationDesignTips: 'http://oppia.github.io/#/DesignTips',
    ExternalLink61MillionChildren:
      'https://uis.unesco.org/en/news/world-poverty-could-be-cut-half-' +
      'if-all-adults-completed-secondary-education',
    ExternalLinkEvenThoseWhoAreInSchool:
      'https://uis.unesco.org/sites/default/files/documents/' +
      'fs46-more-than-half-children-not-learning-en-2017.pdf',
    ExternalLinkSourceUnesco:
      'https://uis.unesco.org/en/news/new-report-how-measure-equity-education',
    Electromagnetism: 'https://www.oppia.org/collection/wqCTKpKA0LBe',
    FeedbackUpdates: 'http://localhost:8181/feedback-updates',
    GetStarted: 'http://localhost:8181/get-started',
    Home: 'http://localhost:8181/',
    ImpactReport2022Url:
      'https://drive.google.com/file/d/1uRe145ou9Ka5O2duTB-N-i89NVPEtxh1/view',
    ImpactReport2023Url:
      'https://drive.google.com/file/d/1lPu2g3HXpMDrKJu-Nssh67ynxpWxxfw9/view',
    LearnerDashboard: 'http://localhost:8181/learner-dashboard',
    Login: 'http://localhost:8181/login',
    Logout: 'http://localhost:8181/logout',
    MathClassroom: 'http://localhost:8181/learn/math',
    ModeratorPage: 'http://localhost:8181/moderator',
    Partnerships: 'http://localhost:8181/partnerships',
    PartnershipsBrochure:
      'https://drive.google.com/file/d/1RZ1mWDA2XWXTh1GlWFf5AWWuV2iGBBa2/view?usp=sharing',
    PartnershipsForm:
      'https://docs.google.com/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform',
    PartnershipsFormInPortuguese:
      'https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform' +
      '?_x_tr_sl=en&_x_tr_tl=pt&_x_tr_hl=en-US&_x_tr_pto=wapp',
    PartnershipsFormShortUrl: 'https://forms.gle/Y71U8FdhQwZpicJj8',
    PendingAccountDeletion: 'http://localhost:8181/pending-account-deletion',
    PrivacyPolicy: 'http://localhost:8181/privacy-policy',
    ReleaseCoordinator: 'http://localhost:8181/release-coordinator',
    splash: 'http://localhost:8181/splash',
    Teach: 'http://localhost:8181/teach',
    Terms: 'http://localhost:8181/terms',
    TopicAndSkillsDashboard:
      'http://localhost:8181/topics-and-skills-dashboard',
    ProgrammingWithCarla: 'https://www.oppia.org/collection/inDXV0w8-p1C',
    Volunteer: 'http://localhost:8181/volunteer',
    VolunteerForm:
      'https://docs.google.com/forms/d/e/1FAIpQLSc5_rwUjugT_Jt_EB49_zAKWVY68I3fTXF5w9b5faIk7rL6yg/viewform',
    VolunteerFormShortUrl: 'https://forms.gle/rhFYoLLSFr3JEZHy8',
    WelcomeToOppia: 'https://www.oppia.org/explore/0',
    WikiPrivilegesToFirebaseAccount:
      'https://github.com/oppia/oppia/wiki/#2-add-custom-claims-to-a-firebase-account',
    Preferences: 'http://localhost:8181/preferences',
    ProfilePagePrefix: 'http://localhost:8181/profile',
    OppiaAnnounceGoogleGroup: 'https://groups.google.com/g/oppia-announce',
    GoogleGroups: {
      Oppia: 'https://groups.google.com/g/oppia',
      OppiaAnnounce: 'https://groups.google.com/g/oppia-announce',
    },
    GoogleAnalytics: {
      PartnerPolicies: 'https://policies.google.com/technologies/partner-sites',
      OptOut: 'https://tools.google.com/dlpage/gaoptout',
    },
    ExternalLink: {
      AboutCookies: 'https://allaboutcookies.org/how-to-manage-cookies',
      CreativeCommonsLegalCode:
        'https://creativecommons.org/licenses/by-sa/4.0/legalcode',
      GoogleSignUp: 'https://accounts.google.com/lifecycle/steps/signup/name',
    },
    TeacherStoryTaggedBlogsLink:
      'https://www.oppia.org/blog/search/find?q=&tags=(%22Teacher%20story%22)',
    ParentsTeachersGuideUrl:
      'https://drive.google.com/file/d/1gMixZ2c0j5XAGPx4qDBDvRgiFvF6PMkk/view',
    LessonCreatorLinkedInUrl:
      'https://www.linkedin.com/in/rita-santos-guimaraes-prof-matematica/',
    ReadBlogLink: 'https://medium.com/oppia-org',
  },
  Dashboard: {
    MainDashboard: '.e2e-test-splash-page',
    LearnerDashboard: '.oppia-learner-dashboard-main-content',
  },

  SignInDetails: {
    inputField: 'input.e2e-test-sign-in-email-input',
  },

  Roles: {
    TRANSLATION_ADMIN: 'translation admin',
    BLOG_ADMIN: 'blog admin',
    BLOG_POST_EDITOR: 'blog post editor',
    CURRICULUM_ADMIN: 'curriculum admin',
    QUESTION_ADMIN: 'question admin',
    VOICEOVER_ADMIN: 'voiceover admin',
    TOPIC_MANAGER: 'topic manager',
    MODERATOR: 'moderator',
    RELEASE_COORDINATOR: 'release coordinator',
    COLLECTION_EDITOR: 'collection editor',
  } as const,

  BlogRights: {
    BLOG_ADMIN: 'BLOG_ADMIN',
    BLOG_POST_EDITOR: 'BLOG_POST_EDITOR',
  } as const,

  ViewportWidthBreakpoints: {
    MOBILE_PX: 768,
  },

  data: {
    blogPostThumbnailImage: path.resolve(
      __dirname,
      '../../data/blog-post-thumbnail.png'
    ),
    curriculumAdminThumbnailImage: path.resolve(
      __dirname,
      '../../data/curriculum-admin-thumbnail.svg'
    ),
    classroomBannerImage: path.resolve(
      __dirname,
      '../../data/classroom-banner.png'
    ),
    profilePicture: path.resolve(__dirname, '../../data/profile-picture.svg'),
    IntroContentVoiceoverInHindi: path.resolve(
      __dirname,
      '../../data/intro-content-hi.mp3'
    ),
    ContinueInteractionVoiceoverInHindi: path.resolve(
      __dirname,
      '../../data/continue-interaction-hi.mp3'
    ),
    LastCardContentVoiceoverInHindi: path.resolve(
      __dirname,
      '../../data/last-card-hi.mp3'
    ),
  },
  SocialsShare: {
    Facebook: {
      Domain:
        'https://www.facebook.com/sharer/sharer.php?sdk=joey&u=http://localhost:8181/explore/',
      queryString: '&display=popup&ref=plugin&src=share_button',
    },
    Twitter: {
      Domain:
        'https://twitter.com/share?text=Check%20out%20this%20interactive%20lesson%20on%20Oppia%20-%20a%20free%20platform%20for%20teaching%20and%20learning!&url=http://localhost:8181/explore/',
    },
    Classroom: {
      Domain:
        'https://classroom.google.com/share?url=http://localhost:8181/explore/',
    },
  },

  OppiaSocials: {
    YouTube: {
      Domain: 'youtube.com',
      Id: 'UC5c1G7BNDCfv1rczcBp9FPw',
    },
    FaceBook: {
      Domain: 'facebook.com',
      Id: 'oppiaorg',
    },
    Instagram: {
      Domain: 'instagram.com',
      Id: 'oppia.global',
    },
    Twitter: {
      Domain: 'x.com',
      Id: 'oppiaorg',
    },
    Github: {
      Domain: 'github.com',
      Id: 'oppia',
    },
    LinkedIn: {
      Domain: 'linkedin.com',
      Id: 'oppia-org',
    },
    GooglePlay: {
      Domain: 'play.google.com',
      Id: 'org.oppia.android',
    },
  },
  TeachPageTestimonialsNames: ['Riya', 'Wala'],
  TeachPageCreatorsNames: ['Rita Santos', 'Aanuoluwapo Adeoti'],
  AboutPageVolunteerCarouselHeadings: [
    'Outreach',
    'Software',
    'Art and Design',
  ],
  DEFAULT_SPEC_TIMEOUT_MSECS: 300000,
  // The video recording path below is relative to the oppia/ folder's
  // root path.
  TEST_VIDEO_DIR: path.resolve(
    '../oppia_full_stack_test_video_recordings/acceptance'
  ),
};
