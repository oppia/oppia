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
    CommunityLibrary: 'http://localhost:8181/community-library',
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
    DonateWithThanksModal: 'http://localhost:8181/donate?thanks=',
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
    DesktopExternalLinkWatchAVideo:
      'https://www.facebook.com/oppiaorg/videos/189487953721583/',
    Electromagnetism: 'https://www.oppia.org/collection/wqCTKpKA0LBe',
    GetStarted: 'http://localhost:8181/get-started',
    Home: 'http://localhost:8181/',
    ImpactReportUrl:
      'https://drive.google.com/file/d/1uRe145ou9Ka5O2duTB-N-i89NVPEtxh1/view',
    LearnerDashboard: 'http://localhost:8181/learner-dashboard',
    Login: 'http://localhost:8181/login',
    Logout: 'http://localhost:8181/logout',
    MathClassroom: 'http://localhost:8181/learn/math',
    MobileExternalLinkWatchAVideo:
      'https://m.facebook.com/oppiaorg/videos/189487953721583/',
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
      '../../data/blog-post-thumbnail.svg'
    ),
    curriculumAdminThumbnailImage: path.resolve(
      __dirname,
      '../../data/curriculum-admin-thumbnail.svg'
    ),
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
  DEFAULT_SPEC_TIMEOUT_MSECS: 300000,
};
