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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * LI.OP Learner cannot access pages that require higher privileges
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-in Learner', function () {
  let loggedInUser: LoggedInUser;

  beforeAll(async function () {
    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  // The logged-in user cannot access the moderator page.
  it('should be restricted from accessing the moderator page', async function () {
    await loggedInUser.navigateToModeratorPage();
    await loggedInUser.expectErrorPage(401); // Expect a 401 Unauthorized error.
  });

  // The logged-in user cannot access the topics and skills dashboard.
  it('should be restricted from accessing the topics and skills dashboard', async function () {
    await loggedInUser.navigateToTopicsAndSkillsDashboardPage();
    await loggedInUser.expectErrorPage(401); // Expect a 401 Unauthorized error.
  });

  // The logged-in user cannot access the release coordinator page.
  it('should be restricted from accessing the release coordinator page', async function () {
    await loggedInUser.navigateToReleaseCoordinatorPage();
    await loggedInUser.expectErrorPage(404); // Expect a 404 Not Found error.
  });

  // The logged-in user cannot access the contributor admin dashboard page.
  it('should be restricted from accessing the contributor admin dashboard page', async function () {
    await loggedInUser.navigateToContributorAdminDashboardPage();
    await loggedInUser.expectErrorPage(401); // Expect a 401 Unauthorized error.
  });

  // The logged-in user cannot access the site admin page.
  it('should be restricted from accessing the site admin page', async function () {
    await loggedInUser.navigateToSiteAdminPage();
    await loggedInUser.expectErrorPage(401); // Expect a 401 Unauthorized error.
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
