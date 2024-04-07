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
 * can open links by clicking all buttons in about foundation page
 */

import {UserFactory} from '../../../puppeteer-testing-utilities/user-factory';
import {LoggedInUser} from '../../../user-utilities/logged-in-users-utils';
import testConstants from '../../../puppeteer-testing-utilities/test-constants';
import {toMatchImageSnapshot} from 'jest-image-snapshot';

expect.extend({toMatchImageSnapshot});
const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Logged-in User in About page', function () {
  let testUser: LoggedInUser;

  beforeAll(async function () {
    testUser = await UserFactory.createNewUser(
      'testuser',
      'testuser@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT);

  beforeEach(async function () {
    await testUser.navigateToAboutPage();
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'About Page Screenshot',
    async function () {
      const screenshot = await testUser.pageScreenshot();
      expect(screenshot).toMatchImageSnapshot({
        failureThresholdType: 'pixel',
        failureThreshold: 250,
      });
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
