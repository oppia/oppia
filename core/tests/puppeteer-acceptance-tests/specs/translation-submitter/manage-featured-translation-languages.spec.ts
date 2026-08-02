// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test for configurable featured translation
 * languages (#19666).
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ContributorAdmin} from '../../utilities/user/contributor-admin';
import {Contributor} from '../../utilities/user/contributor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const ROLES = testConstants.Roles;

Error.stackTraceLimit = 20;

// The language the admin adds. 'zh' is a supported audio language whose
// description in assets/constants.ts (SUPPORTED_AUDIO_LANGUAGES) is
// '中文 (Chinese)' — which is how it renders in the "Most needed" list.
const ADDED_LANGUAGE_CODE = 'zh';
const ADDED_LANGUAGE_DISPLAY = '中文 (Chinese)';

describe('Featured Translation Languages', function () {
  // One account carries three roles so no role_services change is needed:
  //   - TRANSLATION_COORDINATOR → grants ACTION_ACCESS_NEW_CONTRIBUTOR_
  //     DASHBOARD_ADMIN_PAGE, i.e. access to the new dashboard.
  //   - TRANSLATION_ADMIN       → makes the featured-languages editor visible
  //     and permits saving.
  //   - RELEASE_COORDINATOR     → lets this account enable the new-UI flag.
  // Every UserFactory user also gets Contributor methods, so this same account
  // views the "Most needed" list. The coordinator stays a separate, non-admin
  // account for the negative test.
  let translationAdmin: ContributorAdmin &
    ReleaseCoordinator &
    Contributor &
    LoggedInUser;
  let translationCoordinator: ContributorAdmin & LoggedInUser;

  beforeAll(async function () {
    translationAdmin = await UserFactory.createNewUser(
      'translationLead',
      'translation-lead@example.com',
      [
        ROLES.TRANSLATION_ADMIN,
        ROLES.TRANSLATION_COORDINATOR,
        ROLES.RELEASE_COORDINATOR,
      ],
      // Coordinated language codes (required by TRANSLATION_COORDINATOR).
      ['en', 'hi']
    );
    translationCoordinator = await UserFactory.createNewUser(
      'translationCoord',
      'translation-coord@example.com',
      [ROLES.TRANSLATION_COORDINATOR],
      ['en', 'hi']
    );

    // Turn on the new contributor admin dashboard (where the editor lives).
    await translationAdmin.enableFeatureFlag('cd_admin_dashboard_new_ui');
  }, 300000);

  it(
    'should let a translation admin edit featured languages, and reflect ' +
      'them on the contributor dashboard',
    async function () {
      // Translation admin opens the editor, adds a language, and saves.
      // (The editor loads the current config first, so the save persists the
      // existing languages plus the newly added one.)
      await translationAdmin.navigateToContributorDashboardAdminPage();
      await translationAdmin.openFeaturedTranslationLanguagesEditor();
      await translationAdmin.addFeaturedTranslationLanguage(
        ADDED_LANGUAGE_CODE,
        'For learners in China.'
      );
      await translationAdmin.saveFeaturedTranslationLanguages();

      // The SAME account (it also has Contributor methods) opens the public
      // Contributor Dashboard and sees the newly added language under "Most
      // needed", proving the datastore config drives the dashboard end-to-end.
      // Navigate by URL (not the profile dropdown): after saving we're on the
      // new admin dashboard, whose navbar has no profile dropdown.
      await translationAdmin.navigateToContributorDashboard();
      await translationAdmin.switchToTabInContributionDashboard(
        'Translate Text'
      );
      await translationAdmin.clickOnLanguageFilterDropdown();
      await translationAdmin.expectFeaturedLanguagesToContain([
        ADDED_LANGUAGE_DISPLAY,
      ]);
    }
  );

  it(
    'should not show the featured languages editor to a translation ' +
      'coordinator',
    async function () {
      await translationCoordinator.navigateToContributorDashboardAdminPage();
      await translationCoordinator.expectFeaturedTranslationLanguagesEditorToBePresent(
        false
      );
    }
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
