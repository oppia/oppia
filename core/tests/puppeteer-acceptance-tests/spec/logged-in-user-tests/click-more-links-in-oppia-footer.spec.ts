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
 * @fileoverview Acceptance Test for checking if logged-in users can
 * follow links in the oppia footer not covered by other tests.
 */

import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {LoggedInUser} from '../../user-utilities/logged-in-users-utils';
import testConstants from '../../puppeteer-testing-utilities/test-constants';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Logged-in User', function () {
  let testUser: LoggedInUser;

  beforeAll(async function () {
    testUser = await UserFactory.createNewUser(
      'testuser',
      'testuser@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT);

  beforeEach(async function () {
    // Navigate to a page that has the oppia footer.
    await testUser.goto(testConstants.URLs.About);
  });

  it(
    'should open the "Volunteer" page via the footer',
    async function () {
      await testUser.navigateToVolunteerPageViaFooter();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'should open "Donate" page via the footer',
    async function () {
      await testUser.navigateToDonatePageViaFooter();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'should open "Contact" page via the footer',
    async function () {
      await testUser.navigateToContactPageViaFooter();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'should open "Community Library" page via the footer',
    async function () {
      await testUser.navigateToCommunityLibraryPageViaFooter();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
