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
 * @fileoverview Acceptance test for checking if a logged-out user
 * is restricted from accessing certain pages and actions.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

ConsoleReporter.setConsoleErrorsToIgnore([
  /http:\/\/localhost:8181\/access_validation_handler\/can_access_classrooms_page Failed to load resource: the server responded with a status of 404 \(Not Found\)/,
]);

describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should not be able to add an exploration to "play later" from the community library page.',
    async function () {
      await loggedOutUser.navigateToCommunityLibraryPage();
      await loggedOutUser.expectCannotAddExplorationToPlayLater();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not be able to visit the learner dashboard.',
    async function () {
      await loggedOutUser.navigateToLearnerDashboard();
      await loggedOutUser.expectToBeOnLoginPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not be able to visit the creator dashboard.',
    async function () {
      await loggedOutUser.navigateToCreatorDashboard();
      await loggedOutUser.expectToBeOnLoginPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not be able to visit the moderator page.',
    async function () {
      await loggedOutUser.navigateToModeratorPage();
      await loggedOutUser.expectToBeOnLoginPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not be able to visit the preferences page.',
    async function () {
      await loggedOutUser.navigateToPreferencesPage();
      await loggedOutUser.expectToBeOnLoginPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not be able to visit the topics and skills dashboard page.',
    async function () {
      await loggedOutUser.navigateToTopicsAndSkillsDashboardPage();
      await loggedOutUser.expectToBeOnLoginPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
