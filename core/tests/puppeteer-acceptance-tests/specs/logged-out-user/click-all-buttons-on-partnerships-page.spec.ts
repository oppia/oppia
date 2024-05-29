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
 * @fileoverview Acceptance Test for checking if Parent/Teacher
 * can open links by clicking all buttons in teach page
 */

import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {LoggedInUser} from '../../user-utilities/logged-in-users-utils';
import testConstants from '../../puppeteer-testing-utilities/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

const now = new Date();
const i =
  now.getHours().toString() +
  now.getMinutes().toString() +
  now.getSeconds().toString();

describe('Partner in Partnerships page', function () {
  let testUser: LoggedInUser;

  beforeAll(async function () {
    testUser = await UserFactory.createNewUser(
      `partner${i}`,
      `partner${i}@example.com`
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  beforeEach(async function () {
    await testUser.navigateToPartnershipsPage();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should open Blog page with the Read More Stories button.',
    async function () {
      await testUser.clickReadMoreStoriesButtonInPartnershipsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Partnerships form with the Partner with us button at the top.',
    async function () {
      await testUser.clickPartnerWithUsButtonInPartnershipsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Partnerships form with the Partner with us button at the bottom.',
    async function () {
      await testUser.clickPartnerWithUsButtonInPartnershipsPageInGivenLanguage(
        'pt-br'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Partnerships Brochure with the Download Brochure button.',
    async function () {
      await testUser.clickDownloadBrochureButtonInPartnershipsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Blog Post with the Read Blog Post button.',
    async function () {
      await testUser.clickReadBlogPostLinkInPartnershipsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
