// Copyright 2023 The Oppia Authors. All Rights Reserved.
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

const path = require('path');

let testConstants = {
  URLs: {
    home: 'http://localhost:8181/',
    About: 'http://localhost:8181/about',
    AboutFoundation: 'http://localhost:8181/about-foundation',
    Android: 'http://localhost:8181/android',
    Blog: 'http://localhost:8181/blog',
    BlogDashboard: 'http://localhost:8181/blog-dashboard',
    BlogAdmin: 'http://localhost:8181/blog-admin',
    BlogWeb: 'https://www.oppia.org/blog',
    CreatorDashboard: 'http://localhost:8181/creator-dashboard',
    CreatorDashboardCreateMode: 'http://localhost:8181/creator-dashboard?mode=create',
    ContributorDashboardAdmin: 'http://localhost:8181/contributor-dashboard-admin/',
    Contact: 'http://localhost:8181/contact',
    CommunityLibrary: 'http://localhost:8181/community-library',
    Donate: 'http://localhost:8181/donate',
    AdminPage: 'http://localhost:8181/admin',
    RolesEditorTab: 'http://localhost:8181/admin#/roles',
    MathClassroom: 'http://localhost:8181/learn/math',
    Partnerships: 'http://localhost:8181/partnerships',
    Volunteer: 'http://localhost:8181/volunteer',
    ThanksForDonating: 'http://localhost:8181/donate?thanks=',
    logout: 'http://localhost:8181/logout',
    _61MillionChildren: 'https://uis.unesco.org/en/news/world-poverty-could-be-cut-half-if-all-adults-completed-secondary-education',
    EvenThoseWhoAreInSchool: 'https://uis.unesco.org/sites/default/files/documents/fs46-more-than-half-children-not-learning-en-2017.pdf',
    SourceUnesco: 'https://uis.unesco.org/en/news/new-report-how-measure-equity-education',
    WatchAVideo: 'https://www.facebook.com/oppiaorg/videos/189487953721583/'
  },
  Dashboard: {
    MainDashboard: '.e2e-test-splash-page',
    LearnerDashboard: '.oppia-learner-dashboard-main-content',
  },
  SignInDetails: {
    inputField: 'input.e2e-test-sign-in-email-input',
  },
  images: {
    blogPostThumbnailImage: path.resolve(
      __dirname, '../images/blog-post-thumbnail.svg')
  },
  DEFAULT_SPEC_TIMEOUT: 300000
};

module.exports = testConstants;
