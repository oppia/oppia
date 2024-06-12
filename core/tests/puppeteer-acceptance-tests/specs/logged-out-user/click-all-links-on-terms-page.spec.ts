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
 * can open all the links on the "Terms of Use" page.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-out Users', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  beforeEach(async function () {
    await loggedOutUser.navigateToTermsPage();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to follow the link to view the Privacy Policy',
    async function () {
      await loggedOutUser.clickLinkToPrivacyPolicyOnTermsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to follow the link about the CC-BY-SA 4.0 license',
    async function () {
      await loggedOutUser.clickLinkToLicenseOnTermsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to follow the link to the Oppia Annouce google group.',
    async function () {
      await loggedOutUser.clickLinkToGoogleGroupOnTermsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
