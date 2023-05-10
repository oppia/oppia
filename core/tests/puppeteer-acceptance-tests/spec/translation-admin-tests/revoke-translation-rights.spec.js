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
 * @fileoverview Acceptance Test for translation admins to assign translation
 * rights to users.
 */

const userFactory = require(
  '../../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../../puppeteer-testing-utilities/test-constants.js');

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Translation Admin', function() {
  let translationAdmin = null;

  beforeAll(async function() {
    translationAdmin =
      await userFactory.createNewTranslationAdmin('translationAdm');
  }, DEFAULT_SPEC_TIMEOUT);

  it('should be able to revoke translation rights from user.',
    async function() {
      const translatorSpanish = await userFactory.createNewGuestUser(
        'translatorSpanish', 'translatorSpanish@example.com');
      translatorSpanish.closeBrowser();

      await translationAdmin.navigateToContributorDashboardAdminPage();
      await translationAdmin.assignTranslationRights(
        'translatorSpanish', 'string:es');
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
