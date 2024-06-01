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
 * navigate using all the links under the "About Oppia" footer section.
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
    // Navigate to a page that has the oppia footer.
    await loggedOutUser.goto(testConstants.URLs.Volunteer);
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should open About page via the footer',
    async function () {
      await loggedOutUser.navigateToAboutPageViaFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "About Foundation" page via the footer',
    async function () {
      await loggedOutUser.navigateToAboutFoundationPageViaFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Blog" page via the footer',
    async function () {
      await loggedOutUser.navigateToBlogPageViaFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Forum" page via the footer',
    async function () {
      await loggedOutUser.navigateToForumPageViaFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
