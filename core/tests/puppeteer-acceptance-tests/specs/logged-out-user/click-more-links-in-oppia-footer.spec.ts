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
 * @fileoverview Acceptance Test for checking if logged-out users can
 * follow links in the oppia footer not covered by other tests.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  beforeEach(async function () {
    // Navigate to a page that has the oppia footer.
    await loggedOutUser.navigateToHome();
  });

  it(
    'should open the "Volunteer" page via the footer',
    async function () {
      await loggedOutUser.clickOnVolunteerLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Donate" page via the footer',
    async function () {
      await loggedOutUser.clickOnDonateLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Terms" page via the footer',
    async function () {
      await loggedOutUser.clickOnTermsOfServiceLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Privacy Policy" page via the footer',
    async function () {
      await loggedOutUser.clickOnPrivacyPolicyLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
