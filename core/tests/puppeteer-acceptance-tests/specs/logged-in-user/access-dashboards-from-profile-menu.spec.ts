// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance Test for checking if a user can access dashboards
 * and other pages from the profile menu.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-in User', function () {
  let loggedInUser: LoggedInUser;

  beforeAll(async function () {
    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  // Checking User can navigate to Learner Dashboard from profile menu.
  it(
    'should navigate to Learner Dashboard from profile menu',
    async function () {
      await loggedInUser.navigateToLearnerDashboardUsingProfileDropdown();
      await loggedInUser.expectToBeOnPage('learner-dashboard');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  // Checking User can navigate to Contributor Dashboard from profile menu.
  it(
    'should navigate to Contributor Dashboard from profile menu',
    async function () {
      await loggedInUser.navigateToContributorDashboardUsingProfileDropdown();
      await loggedInUser.expectToBeOnPage('contributor-dashboard');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  // Checking User can navigate to Creator Dashboard from profile menu.
  it(
    'should navigate to Creator Dashboard from profile menu',
    async function () {
      await loggedInUser.navigateToCreatorDashboardUsingProfileDropdown();
      await loggedInUser.expectToBeOnPage('creator-dashboard');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  // Checking User can navigate to Profile page from profile menu.
  it(
    'should navigate to Profile page from profile menu',
    async function () {
      await loggedInUser.navigateToProfilePageUsingProfileDropdown();
      await loggedInUser.expectToBeOnPage('profile');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  // Checking User can navigate to Preferences page from profile menu.
  it(
    'should navigate to Preferences page from profile menu',
    async function () {
      await loggedInUser.navigateToPreferencesPageUsingProfileDropdown();
      await loggedInUser.expectToBeOnPage('preferences');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
