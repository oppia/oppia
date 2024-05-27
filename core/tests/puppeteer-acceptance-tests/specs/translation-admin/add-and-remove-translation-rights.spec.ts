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
 * @fileoverview Acceptance Test for translation admins to add and remove translation
 * rights to users.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {TranslationAdmin} from '../../utilities/user/translation-admin';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Translation Admin', function () {
  let translationAdmin: TranslationAdmin;

  beforeAll(async function () {
    translationAdmin = await UserFactory.createNewUser(
      'translationAdm',
      'translation_admin@example.com',
      [ROLES.TRANSLATION_ADMIN]
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to provide and remove translation rights to user.',
    async function () {
      let translatorSpanish = await UserFactory.createNewUser(
        'translatorSpanish',
        'translatorSpanish@example.com'
      );
      await UserFactory.closeBrowserForUser(translatorSpanish);
      await translationAdmin.navigateToContributorDashboardAdminPage();

      await translationAdmin.addTranslationLanguageReviewRights(
        'translatorSpanish',
        'es'
      );

      await translationAdmin.viewContributionRightsForUser('translatorSpanish');
      await translationAdmin.expectDisplayedLanguagesToContain('Spanish');
      await translationAdmin.viewContributorTranslationRightsByLanguageCode(
        'es'
      );
      await translationAdmin.expectUserToBeDisplayed('translatorSpanish');

      await translationAdmin.removeTranslationLanguageReviewRights(
        'translatorSpanish',
        'es'
      );

      await translationAdmin.viewContributorTranslationRightsByLanguageCode(
        'es'
      );
      await translationAdmin.expectUserToNotBeDisplayed('translatorSpanish');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
