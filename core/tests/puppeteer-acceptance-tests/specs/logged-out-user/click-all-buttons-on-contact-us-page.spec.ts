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
 * @fileoverview Acceptance Test for checking if all buttons on the
 * "Contact Us" page can be clicked by logged-out users.
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
    await loggedOutUser.navigateToContactUsPage();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to navigate to /donate page from the "DONATE TODAY" button.',
    async function () {
      await loggedOutUser.clickDonateTodayButtonInContactUsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to navigate to /partnerships page from the "BECOME A PARTNER" button.',
    async function () {
      await loggedOutUser.clickBecomeAPartnerButtonInContactUsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to navigate to /volunteer page from the "BECOME A VOLUNTEER" button.',
    async function () {
      await loggedOutUser.clickVolunteerButtonInContactUsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should have a mailto link for "admin@oppia.org" in the other inquiries section.',
    async function () {
      await loggedOutUser.verifyAdminEmailLinkInContactUsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it('should have a mailto link for "press@oppia.org" in the other inquiries section.', async function () {
    await loggedOutUser.verifyPressEmailLinkInContactUsPage();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
