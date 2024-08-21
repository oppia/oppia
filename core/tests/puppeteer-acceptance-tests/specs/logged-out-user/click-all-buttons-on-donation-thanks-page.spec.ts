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
 * can open links by clicking all buttons in thanks for donating page
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

ConsoleReporter.setConsoleErrorsToIgnore([
  /Error while trying to use the following icon from the Manifest: https:\/\/static\.xx\.fbcdn\.net\/rsrc\.php\/v3\/y0\/r\/eFZD1KABzRA\.png \(Download error or resource isn't a valid image\)/,
  /Occurred at http:\/\/localhost:8181\/donate\?thanks=/,
]);

describe('Logged-out User in Thanks for Donating page', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  beforeEach(async function () {
    await loggedOutUser.navigateToDonationThanksModalOnDonatePage();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should open the right page with the Watch A Video button.',
    async function () {
      await loggedOutUser.clickWatchAVideoButtonInDonationThanksModalOnDonatePage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open the Blog page with the Read Our Blog button.',
    async function () {
      await loggedOutUser.clickReadOurBlogButtonInDonationThanksModalOnDonatePage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should close the thanks for donating popup and show the Donate Page ' +
      'with the dismiss button.',
    async function () {
      await loggedOutUser.dismissDonationThanksModalOnDonatePage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
