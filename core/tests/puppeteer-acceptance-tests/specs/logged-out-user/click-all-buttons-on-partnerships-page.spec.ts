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
 * can open links by clicking all buttons in the partnerships page
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-out User in Partnerships page', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  beforeEach(async function () {
    await loggedOutUser.navigateToPartnershipsPage();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should open the Blog page when the "Read More Stories" button is clicked.',
    async function () {
      await loggedOutUser.clickReadMoreStoriesButtonInPartnershipsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open the Partnerships form when the "Partner with us" button is clicked at the top.',
    async function () {
      await loggedOutUser.clickPartnerWithUsButtonInPartnershipsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open the correct Blog Post when the "Read Blog Post" button is clicked.',
    async function () {
      await loggedOutUser.clickReadBlogPostLinkInPartnershipsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open the Partnerships Brochure when the "Download Brochure" button is clicked.',
    async function () {
      await loggedOutUser.clickDownloadBrochureButtonInPartnershipsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
