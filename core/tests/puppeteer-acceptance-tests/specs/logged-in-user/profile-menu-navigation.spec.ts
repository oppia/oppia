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
 * @fileoverview Acceptance tests for accessing dashboards and other pages from the profile menu.
 */

import { UserFactory } from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import { LoggedInUser } from '../../utilities/user/logged-in-user';

const ROLES = testConstants.Roles;

describe('Profile Menu Navigation', function () {
  let loggedInUser: LoggedInUser;

  beforeAll(async function () {
    loggedInUser = await UserFactory.createNewUser(
      'testUser',
      'testUser@example.com',
      [ROLES.LEARNER, ROLES.CREATOR]
    );
  }, 420000);

  it('should redirect to preferred dashboard if set in preferences', async function () {
    await loggedInUser.login();
    await loggedInUser.navigateToPreferencesPage();
    await loggedInUser.setPreferredDashboard('creator-dashboard');

    await loggedInUser.navigateToDashboard();
    await loggedInUser.expectCurrentPageToBe('creator-dashboard');
  }, 420000);

  it('should access all dashboards and pages from the profile dropdown menu', async function () {
    await loggedInUser.openProfileMenu();

    await loggedInUser.navigateToPageFromProfileMenu('creator-dashboard');
    await loggedInUser.expectCurrentPageToBe('creator-dashboard');

    await loggedInUser.navigateToPageFromProfileMenu('contributor-dashboard');
    await loggedInUser.expectCurrentPageToBe('contributor-dashboard');

    await loggedInUser.navigateToPageFromProfileMenu('learner-dashboard');
    await loggedInUser.expectCurrentPageToBe('learner-dashboard');

    await loggedInUser.navigateToPageFromProfileMenu('profile');
    await loggedInUser.expectCurrentPageToBe('profile');

    await loggedInUser.navigateToPageFromProfileMenu('topics-and-skills-dashboard');
    await loggedInUser.expectCurrentPageToBe('topics-and-skills-dashboard');

    await loggedInUser.navigateToPageFromProfileMenu('preferences');
    await loggedInUser.expectCurrentPageToBe('preferences');
  }, 420000);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
