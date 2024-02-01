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
 * can open links by clicking all buttons in about foundation page
 */

const userFactory = require(
  '../../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../../puppeteer-testing-utilities/test-constants.js');

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Logged-in User in About Foundation page', function() {
  let testuser = null;

  beforeAll(async function() {
    testuser = await userFactory.createNewGuestUser(
      'testuser', 'testuser@example.com');
  }, DEFAULT_SPEC_TIMEOUT);

  beforeEach(async function() {
    await testuser.navigateToAboutFoundationPage();
  }, DEFAULT_SPEC_TIMEOUT);

  it('should open right page with the 61 million children button.',
    async function() {
      await testuser.click61MillionChildrenButtonInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open right page with the Even Those Who Are In School button.',
    async function() {
      await testuser.clickEvenThoseWhoAreInSchoolButtonInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open right page with the Source: UNESCO button.',
    async function() {
      await testuser.clickSourceUnescoButtonInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open right page with the 420 Million button.',
    async function() {
      await testuser.click420MillionButtonInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open the About page with the Learn More About Oppia button.',
    async function() {
      await testuser.clickLearnMoreAboutOppiaButtonInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open the Volunteer page with the Become A Volunteer button.',
    async function() {
      await testuser.clickBecomeAVolunteerButtonInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open the Partnerships page with the Consider Becoming A ' +
    'Partner Today! button.',
  async function() {
    await testuser.clickConsiderBecomingAPartnerTodayButtonInAboutFoundation();
  }, DEFAULT_SPEC_TIMEOUT);

  it('should open the Volunteer page with the Join Our Large Volunteer ' +
    'Community button.',
  async function() {
    await testuser.clickJoinOurLargeVolunteerCommunityButtonInAboutFoundation();
  }, DEFAULT_SPEC_TIMEOUT);

  it('should open the Partnerships page with the donations button.',
    async function() {
      await testuser.clickDonationsButtonInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
