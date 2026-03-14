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
 * @fileoverview Acceptance Test for crawling the main Oppia pages.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Search Engine Bot', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should verify meta tags on Get Started page',
    async function () {
      await loggedOutUser.navigateToGetStartedPage();
      await loggedOutUser.verifyMetaTags();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should verify meta tags on Donate page',
    async function () {
      await loggedOutUser.navigateToDonatePage();
      await loggedOutUser.verifyMetaTags();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should verify meta tags on Partnerships page',
    async function () {
      await loggedOutUser.navigateToPartnershipsPage();
      await loggedOutUser.verifyMetaTags();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should verify meta tags on Volunteer page',
    async function () {
      await loggedOutUser.navigateToVolunteerPage();
      await loggedOutUser.verifyMetaTags();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should verify meta tags on Teach page',
    async function () {
      await loggedOutUser.navigateToTeachPage();
      await loggedOutUser.verifyMetaTags();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
