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
  let testUser = null;

  beforeAll(async function() {
    testUser = await userFactory.createNewGuestUser(
      'testuser', 'testuser@example.com');
  }, DEFAULT_SPEC_TIMEOUT);

  beforeEach(async function() {
    await testUser.navigateToAboutFoundationPage();
  }, DEFAULT_SPEC_TIMEOUT);

  it('should open the page with the 61 million children link.',
    async function() {
      await testUser.click61MillionChildrenLinkInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open the page with the Even Those Who Are In School link.',
    async function() {
      await testUser.clickEvenThoseWhoAreInSchoolLinkInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open the page with the Source: UNESCO link.',
    async function() {
      await testUser.clickSourceUnescoLinkInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open the page with the 420 Million link.',
    async function() {
      await testUser.click420MillionLinkInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open the About page with the Learn More About Oppia button.',
    async function() {
      await testUser.clickLearnMoreAboutOppiaButtonInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open the Volunteer page with the Become A Volunteer button.',
    async function() {
      await testUser.clickBecomeAVolunteerButtonInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open the Partnerships page with the Consider Becoming A ' +
    'Partner Today! link.',
  async function() {
    await testUser.clickConsiderBecomingAPartnerTodayLinkInAboutFoundation();
  }, DEFAULT_SPEC_TIMEOUT);

  it('should open the Volunteer page with the Join Our Large Volunteer ' +
    'Community link.',
  async function() {
    await testUser.clickJoinOurLargeVolunteerCommunityLinkInAboutFoundation();
  }, DEFAULT_SPEC_TIMEOUT);

  it('should open the Donate page with the donations link.',
    async function() {
      await testUser.clickDonationsLinkInAboutFoundation();
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
