// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * can open links by clicking all buttons in thanks for donating page
 */

const userFactory = require(
  '../../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../../puppeteer-testing-utilities/test-constants.js');

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Logged-in User in Thanks for Donating page', function() {
  let testUser = null;

  beforeAll(async function() {
    testUser = await userFactory.createNewGuestUser(
      'testuser', 'testuser@example.com');
  }, DEFAULT_SPEC_TIMEOUT);

  beforeEach(async function() {
    await testUser.navigateToThanksForDonatingPage();
  }, DEFAULT_SPEC_TIMEOUT);

  it('should open the right page with the Watch A Video button.',
    async function() {
      await testUser.clickWatchAVideoButtonInThanksForDonatingPage();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open the Blog page with the Read Our Blog button.',
    async function() {
      await testUser.clickReadOurBlogButtonInThanksForDonatingPage();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should close the thanks for donating popup and show the Donate Page ' +
    'with the dismiss button.',
  async function() {
    await testUser.clickDismissButtonInThanksForDonatingPage();
  }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
