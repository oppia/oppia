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
 * @fileoverview Acceptance Test for checking if logged-out users
 * can open links by clicking all buttons in about foundation page
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

ConsoleReporter.setConsoleErrorsToIgnore([
  /http:\/\/localhost:8181\/access_validation_handler\/can_access_classroom_page\?/,
  /classroom_url_fragment=math Failed to load resource: the server responded with a status of 404 \(Not Found\)/,
  /webpack:\/\/\/\.\/core\/templates\/services\/contextual\/logger\.service\.ts\?/,
  /The requested path \/learn\/math is not found\./,
]);

describe('Logged-out User in About page', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  beforeEach(async function () {
    await loggedOutUser.navigateToAboutPage();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should open Math Classroom page with the Browse Our Lessons button.',
    async function () {
      await loggedOutUser.clickBrowseOurLessonsButtonInAboutPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Android page with the Access Android App button.',
    async function () {
      await loggedOutUser.clickAccessAndroidAppButtonInAboutPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Math Classroom page with the Visit Classroom button.',
    async function () {
      await loggedOutUser.clickVisitClassroomButtonInAboutPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Community Library page with the Browse Library button.',
    async function () {
      await loggedOutUser.clickBrowseLibraryButtonInAboutPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open the Sign-in page when the Create Lessons button is clicked by a logged-out user',
    async function () {
      // The Contributor Dashboard is not accessible to logged-out users.
      // Therefore, clicking the Create Lessons button will redirect the user to the Sign-in page.
      await loggedOutUser.clickCreateLessonsButtonInAboutPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Math Classroom page with the Explore Lessons button.',
    async function () {
      await loggedOutUser.clickExploreLessonsButtonInAboutPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
