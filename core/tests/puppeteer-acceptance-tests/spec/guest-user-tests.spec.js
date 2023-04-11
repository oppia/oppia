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
 * @fileoverview Acceptance Test for Guest User
 */

// Users can open the About, The Oppia Foundation and Blog pages, Schools and
// Organizations, Volunteer, Donate, Contact us and Donate in the Nav bar.

const userFactory = require(
  '../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../puppeteer-testing-utilities/test-constants.js');

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Guest User', function() {
  let guestUser = null;

  beforeAll(async function() {
    guestUser = await userFactory.createNewGuestUser(
      'guestUser', 'guestUser@email.com');
  }, DEFAULT_SPEC_TIMEOUT);

  it('should check if guest users are able to navigate to navbar links',
    async function() {
      await guestUser.goto('http://localhost:8181/about');
      await guestUser.goto('http://localhost:8181/about-foundation');
      await guestUser.goto('https://medium.com/oppia-org');
      await guestUser.goto('http://localhost:8181/about');
      await guestUser.goto('http://localhost:8181/about-foundation');
      await guestUser.goto('https://medium.com/oppia-org');
      await guestUser.goto('http://localhost:8181/about');
      await guestUser.goto('http://localhost:8181/about-foundation');
      await guestUser.goto('https://medium.com/oppia-org');
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
