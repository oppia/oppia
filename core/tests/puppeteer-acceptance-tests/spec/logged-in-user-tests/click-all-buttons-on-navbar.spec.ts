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
 * @fileoverview Acceptance Test for checking if logged-in users
 * can open link by clicking all buttons on navbar
 */

import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {LoggedInUser} from '../../user-utilities/logged-in-users-utils';
import testConstants from '../../puppeteer-testing-utilities/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-in User', function () {
  let testUser: LoggedInUser;

  beforeAll(async function () {
    testUser = await UserFactory.createNewUser(
      'testuser',
      'testuser@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should open About Url with About Oppia button in About Menu on navbar',
    async function () {
      await testUser.clickAboutButtonInAboutMenuOnNavbar();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open About Foundation Url with The Oppia Foundation button ' +
      'in About Menu on navbar',
    async function () {
      await testUser.clickAboutFoundationButtonInAboutMenuOnNavbar();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Blog Url with Blog button in About Menu on navbar',
    async function () {
      await testUser.clickBlogButtonInAboutMenuOnNavbar();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Partnerships Url with School and Organizations button ' +
      'in Get Involved menu on navbar',
    async function () {
      await testUser.clickPartnershipsButtonInGetInvolvedMenuOnNavbar();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Volunteer Url with Volunteer button in Get Involved menu ' +
      'on navbar',
    async function () {
      await testUser.clickVolunteerButtonInGetInvolvedMenuOnNavbar();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Donate Url with Donate button in Get Involved menu on navbar',
    async function () {
      await testUser.clickDonateButtonInGetInvolvedMenuOnNavbar();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Contact Url with Contact Us button in Get Involved menu ' +
      'on navbar',
    async function () {
      await testUser.clickContactUsButtonInGetInvolvedMenuOnNavbar();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open Donate Url with Donate button on navbar',
    async function () {
      await testUser.clickDonateButtonOnNavbar();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
