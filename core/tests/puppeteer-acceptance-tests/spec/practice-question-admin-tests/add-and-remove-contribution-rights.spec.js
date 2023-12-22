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
 * @fileoverview Acceptance Test for question admins to add and remove
 * reviewing question rights to users.
 */

const userFactory = require(
  '../../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../../puppeteer-testing-utilities/test-constants.js');

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Question Admin', function() {
  let questionAdmin = null;

  beforeAll(async function() {
    questionAdmin =
      await userFactory.createNewQuestionAdmin('questionAdm');
  }, DEFAULT_SPEC_TIMEOUT);

  it('should be able to provide rights to review and submit questions to user.',
    async function() {
      let Tester = await userFactory.createNewGuestUser(
        'Tester', 'admin.tester@example.com');
      await userFactory.closeBrowserForUser(Tester);

      await questionAdmin.navigateToContributorDashboardAdminPage();
      await questionAdmin.verifyUserCannotReviewQuestions('Tester');
      await questionAdmin.verifyQuestionReviewersExcludeUser('Tester');
      await questionAdmin.verifyUserCannotSubmitQuestions('Tester');
      await questionAdmin.verifyQuestionSubmittersExcludeUser('Tester');

      await questionAdmin.addSubmitQuestionRights('Tester');
      await questionAdmin.addReviewQuestionRights('Tester');

      await questionAdmin.verifyUserCanReviewQuestions('Tester');
      await questionAdmin.verifyQuestionReviewersIncludeUser('Tester');
      await questionAdmin.verifyUserCanSubmitQuestions('Tester');
      await questionAdmin.verifyQuestionSubmittersIncludeUser('Tester');

      await questionAdmin.removeSubmitQuestionRights('Tester');
      await questionAdmin.removeReviewQuestionRights('Tester');

      await questionAdmin.verifyUserCannotReviewQuestions('Tester');
      await questionAdmin.verifyQuestionReviewersExcludeUser('Tester');
      await questionAdmin.verifyUserCannotSubmitQuestions('Tester');
      await questionAdmin.verifyQuestionSubmittersExcludeUser('Tester');
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
