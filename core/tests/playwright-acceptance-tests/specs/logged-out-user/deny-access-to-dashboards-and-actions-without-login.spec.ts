// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test for checking if a logged-out user
 * is restricted from accessing certain pages and actions.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;

  test.beforeAll(async function ({browser}) {
    loggedOutUser = await UserFactory.createLoggedOutUser(browser);
  });

  test(
    'should not be able to add an exploration to "play later" from the' +
      ' community library page.',
    async function () {
      await loggedOutUser.navigateToCommunityLibraryPage(false);
      await loggedOutUser.expectCannotAddExplorationToPlayLater();
    }
  );

  test('should not be able to visit the learner dashboard.', async function () {
    await loggedOutUser.navigateToLearnerDashboard(false);
    await loggedOutUser.expectToBeOnLoginPage();
  });

  test('should not be able to visit the creator dashboard.', async function () {
    await loggedOutUser.navigateToCreatorDashboard(false);
    await loggedOutUser.expectToBeOnLoginPage();
  });

  test('should not be able to visit the moderator page.', async function () {
    await loggedOutUser.navigateToModeratorPage(false);
    await loggedOutUser.expectToBeOnLoginPage();
  });

  test('should not be able to visit the preferences page.', async function () {
    await loggedOutUser.navigateToPreferencesPage(false);
    await loggedOutUser.expectToBeOnLoginPage();
  });

  test(
    'should not be able to visit the topics and skills dashboard page.',
    async function () {
      await loggedOutUser.navigateToTopicsAndSkillsDashboardPage(false);
      await loggedOutUser.expectToBeOnLoginPage();
    }
  );

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
