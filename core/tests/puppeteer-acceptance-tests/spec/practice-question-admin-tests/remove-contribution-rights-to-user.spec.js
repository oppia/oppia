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
 * @fileoverview Acceptance Test for Practice Question Admin
 */

const userFactory = require(
  '../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../puppeteer-testing-utilities/test-constants.js');
const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Practice Question Reviewer', function() {
  let contribDashboardAdmin = null;

  beforeAll(async function() {
    contribDashboardAdmin = await userFactory.createNewPracticeQuestionAdmin(
      'contribAdm');
  }, DEFAULT_SPEC_TIMEOUT);

  it('should remove question reviewer/submission rights to users',
    async function() {
      const testerUser1 = await userFactory.createNewGuestUser(
        'Tester', 'admin.tester@example.com');

      // Remove question submission rights from testerUser1.
      contribDashboardAdmin.removeReviewQuestionRights('Tester');

      // Check if successfully updated.
      contribDashboardAdmin.expectUserToNotHaveRight(
        'Tester', 'contributer');

      // Remove question review rights from testerUser1.
      contribDashboardAdmin.removeSubmitQuestionRights('Tester');

      // Check if successfully updated.
      contribDashboardAdmin.expectUserToNotHaveRight(
        'Tester', 'reviewer');

      // See if testerUser1 can access submit question tab 
      // and review questions tab.
      testerUser1.expectNoSubmitQuestionTab();
      testerUser1.expectNoReviewQuestionTab();
    });

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
