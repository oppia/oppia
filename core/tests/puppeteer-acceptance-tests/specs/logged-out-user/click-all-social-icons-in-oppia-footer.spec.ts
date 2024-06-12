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
 * can visit all the oppia social pages via icons in the footer.
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
    await loggedOutUser.navigateToAboutFoundationPage();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to visit the Oppia YouTube',
    async function () {
      await loggedOutUser.clickYouTubeIconInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to visit the Oppia Facebook',
    async function () {
      await loggedOutUser.clickFacebookIconInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to visit the Oppia Instagram',
    async function () {
      await loggedOutUser.clickInstagramIconInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to visit the Oppia Twitter',
    async function () {
      await loggedOutUser.clickTwitterIconInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to visit the Oppia Github',
    async function () {
      await loggedOutUser.clickGithubIconInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to visit the Oppia LinkedIn',
    async function () {
      await loggedOutUser.clickLinkedInIconInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to visit the Oppia Google Play page',
    async function () {
      await loggedOutUser.clickGooglePlayButtonInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
