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

let testConstants = {
  URLs: {
    home: 'http://localhost:8181/',
    BlogDashboard: 'http://localhost:8181/blog-dashboard',
    BlogAdmin: 'http://localhost:8181/blog-admin',
    CreatorDashboard: 'http://localhost:8181/creator-dashboard',
    AdminPage: 'http://localhost:8181/admin',
    RolesEditorTab: 'http://localhost:8181/admin#/roles',
    logout: 'http://localhost:8181/logout'
  },
  Dashboard: {
    MainDashboard: '.e2e-test-splash-page',
    LearnerDashboard: '.oppia-learner-dashboard-main-content',
  },
  SignInDetails: {
    inputField: 'input.e2e-test-sign-in-email-input',
  }
};

module.exports = testConstants;
