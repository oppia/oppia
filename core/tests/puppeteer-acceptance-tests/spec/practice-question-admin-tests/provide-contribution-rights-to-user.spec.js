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

/** This test should be done without the need of super admin, as
* practice question admin must be able to revoke question reviewer role 
* of other users from the contributer-dashboard-admin page 
* but this is not the case now, only super admin can do this.
*/
describe('Practice Question Reviewer', function() {
  let contribDashboardAdmin = null;

  beforeAll(async function() {
    contribDashboardAdmin = await userFactory.createNewPracticeQuestionAdmin(
      'contribAdm');
  }, DEFAULT_SPEC_TIMEOUT);

  it('should assign question reviewer/submission rights to users',
    async function() {
      const testerUser1 = await userFactory.createNewGuestUser(
        'Tester', 'admin.tester@example.com');

      // Add question submission rights to testerUser1.
      contribDashboardAdmin.addSubmitQuestionRights('Tester');
      // Check if successfully updated.
      contribDashboardAdmin.expectUserToHaveContributionRight(
        'Tester', 'contributor');
      // Add question review rights to testerUser 1.
      contribDashboardAdmin.addReviewQuestionRights('Tester');
      // Check if successfully added.
      contribDashboardAdmin.expectUserToHaveContributionRight(
        'Tester', 'reviewer');

      // Go to submit question tab on contributer-dashboard page as tester user.
      testerUser1.navigateToSubmitQuestionsTab();
      // Go to review questions tab.
      testerUser1.navigateToReviewQuestionsTab();

    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
