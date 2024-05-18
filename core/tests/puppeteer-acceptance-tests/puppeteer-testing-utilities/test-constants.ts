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
 * @fileoverview Constants that can be re-used in the accpetance tests.
 */

import path from 'path';

export default {
  URLs: {
    BaseURL: 'http://localhost:8181',
    About: 'http://localhost:8181/about',
    AboutFoundation: 'http://localhost:8181/about-foundation',
    AdminPage: 'http://localhost:8181/admin',
    AdminPageRolesTab: 'http://localhost:8181/admin#/roles',
    Android: 'http://localhost:8181/android',
    Blog: 'http://localhost:8181/blog',
    BlogAdmin: 'http://localhost:8181/blog-admin',
    BlogDashboard: 'http://localhost:8181/blog-dashboard',
    CommunityLibrary: 'http://localhost:8181/community-library',
    Contact: 'http://localhost:8181/contact',
    ContributorDashboard: 'http://localhost:8181/contributor-dashboard',
    ContributorDashboardAdmin:
      'http://localhost:8181/contributor-admin-dashboard',
    CreatorDashboard: 'http://localhost:8181/creator-dashboard',
    CreatorDashboardCreateMode:
      'http://localhost:8181/creator-dashboard?mode=create',
    CreatingAnExploration: 'https://oppia.github.io/#/CreatingAnExploration',
    Donate: 'http://localhost:8181/donate',
    DonateWithThanksModal: 'http://localhost:8181/donate?thanks=',
    EmbeddingAnExploration: 'https://oppia.github.io/#/EmbeddingAnExploration',
    ExternalLink61MillionChildren:
      'https://uis.unesco.org/en/news/world-poverty-could-be-cut-half-if-all-adults-completed-secondary-education',
    ExternalLinkEvenThoseWhoAreInSchool:
      'https://uis.unesco.org/sites/default/files/documents/fs46-more-than-half-children-not-learning-en-2017.pdf',
    ExternalLinkSourceUnesco:
      'https://uis.unesco.org/en/news/new-report-how-measure-equity-education',
    DesktopExternalLinkWatchAVideo:
      'https://www.facebook.com/oppiaorg/videos/189487953721583/',
    Electromagnetism: 'https://www.oppia.org/collection/wqCTKpKA0LBe',
    GetStarted: 'http://localhost:8181/get-started',
    Home: 'http://localhost:8181/',
    Logout: 'http://localhost:8181/logout',
    MathClassroom: 'http://localhost:8181/learn/math',
    MobileExternalLinkWatchAVideo:
      'https://m.facebook.com/oppiaorg/videos/189487953721583/',
    Partnerships: 'http://localhost:8181/partnerships',
    TopicAndSkillsDashboard:
      'http://localhost:8181/topics-and-skills-dashboard',
    ProgrammingWithCarla: 'https://www.oppia.org/collection/inDXV0w8-p1C',
    Volunteer: 'http://localhost:8181/volunteer',
    WelcomeToOppia: 'https://www.oppia.org/explore/0',
    ProfilePagePrefix: 'http://localhost:8181/profile',
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
  } as const,
  BlogRights: {
    BLOG_ADMIN: 'BLOG_ADMIN',
    BLOG_POST_EDITOR: 'BLOG_POST_EDITOR',
  } as const,
  ViewportWidthBreakpoints: {
    MOBILE_PX: 768,
  },
  images: {
    blogPostThumbnailImage: path.resolve(
      __dirname,
      '../images/blog-post-thumbnail.svg'
    ),
    curriculumAdminThumbnailImage: path.resolve(
      __dirname,
      '../images/curriculum-admin-thumbnail.svg'
    ),
  },
  DEFAULT_SPEC_TIMEOUT_MSECS: 300000,
};
