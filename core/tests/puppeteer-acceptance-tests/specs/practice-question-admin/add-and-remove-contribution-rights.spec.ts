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
 * @fileoverview Acceptance Test for question admins to add and remove
 * reviewing question rights to users.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {QuestionAdmin} from '../../utilities/user/question-admin';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Question Admin', function () {
  let questionAdmin: QuestionAdmin;

  beforeAll(async function () {
    questionAdmin = await UserFactory.createNewUser(
      'questionAdm',
      'question_admin@example.com',
      [ROLES.QUESTION_ADMIN]
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to provide rights to review and submit questions to user.',
    async function () {
      let Tester = await UserFactory.createNewUser(
        'Tester',
        'admin.tester@example.com'
      );
      await UserFactory.closeBrowserForUser(Tester);

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
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
