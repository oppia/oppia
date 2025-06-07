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
 * can open link by clicking all buttons on navbar
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

// Exclude the error related to Google Docs Viewer since it's from an external service
// and cannot be controlled by us. (https://stackoverflow.com/q/50909239)
ConsoleReporter.setConsoleErrorsToIgnore([
  /https:\/\/content\.googleapis\.com\/drive\/v2internal\/viewerimpressions\?key=[^&]+&alt=json/,
]);

describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should open Partnerships Url with School and Organizations button ' +
      'in Get Involved menu on navbar',
    async function () {
      await loggedOutUser.clickPartnershipsButtonInGetInvolvedMenuOnNavbar();
      await loggedOutUser.expectScreenshotToMatch(
        'partnershipsPage',
        __dirname
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Volunteer Url with Volunteer button in Get Involved menu ' +
      'on navbar',
    async function () {
      await loggedOutUser.clickVolunteerButtonInGetInvolvedMenuOnNavbar();
      await loggedOutUser.expectScreenshotToMatch('volunteerPage', __dirname);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Donate Url with Donate button in Get Involved menu on navbar',
    async function () {
      await loggedOutUser.clickDonateButtonInGetInvolvedMenuOnNavbar();
      await loggedOutUser.expectScreenshotToMatch('donatePage', __dirname);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Contact Url with Contact Us button in Get Involved menu ' +
      'on navbar',
    async function () {
      await loggedOutUser.clickContactUsButtonInGetInvolvedMenuOnNavbar();
      await loggedOutUser.expectScreenshotToMatch('contactUsPage', __dirname);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Donate Url with Donate button on navbar',
    async function () {
      await loggedOutUser.clickDonateButtonOnNavbar();
      await loggedOutUser.expectScreenshotToMatch('donatePage', __dirname);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open teach page when the "For Parents/Teachers" button is clicked' +
      'in About Menu on navbar',
    async function () {
      await loggedOutUser.clickTeachButtonInAboutMenuOnNavbar();
      await loggedOutUser.expectScreenshotToMatch('teachPage', __dirname);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Impact Report when the "Impact Report" button is clicked' +
      'in About Menu on navbar',
    async function () {
      await loggedOutUser.clickImpactReportButtonInAboutMenuOnNavbar();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
