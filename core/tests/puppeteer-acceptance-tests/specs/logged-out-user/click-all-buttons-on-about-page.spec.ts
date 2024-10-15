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
    'should open the Impact Report when the "View Report" button is clicked.',
    async function () {
      await loggedOutUser.clickViewReportButtonInAboutPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open the Volunteer form when the "Volunteer with Oppia" button ' +
      'is clicked.',
    async function () {
      await loggedOutUser.clickVolunteerWithOppiaButtonInAboutPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open the donorbox when the "Donate" button is clicked',
    async function () {
      await loggedOutUser.clickDonateButtonInAboutPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
