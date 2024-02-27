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

describe('Logged-in User in About page', function() {
  let testUser = null;

  beforeAll(async function() {
    testUser = await userFactory.createNewGuestUser(
      'testuser', 'testuser@example.com');
  }, DEFAULT_SPEC_TIMEOUT);

  beforeEach(async function() {
    await testUser.navigateToAboutPage();
  }, DEFAULT_SPEC_TIMEOUT);

  it('should open Math Classroom page with the Browse Our Lessons button.',
    async function() {
      await testUser.clickBrowseOurLessonsButtonInAboutPage();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open Android page with the Access Android App button.',
    async function() {
      await testUser.clickAccessAndroidAppButtonInAboutPage();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open Math Classroom page with the Visit Classroom button.',
    async function() {
      await testUser.clickVisitClassroomButtonInAboutPage();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open Community Library page with the Browse Library button.',
    async function() {
      await testUser.clickBrowseLibraryButtonInAboutPage();
    }, DEFAULT_SPEC_TIMEOUT);

  it('should open Creator Dashboard page and Exploration Editor ' +
    'with the Create Lessons button',
  async function() {
    await testUser.clickCreateLessonsButtonInAboutPage();
  }, DEFAULT_SPEC_TIMEOUT);

  it('should open Math Classroom page with the Explore Lessons button.',
    async function() {
      await testUser.clickExploreLessonsButtonInAboutPage();
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
