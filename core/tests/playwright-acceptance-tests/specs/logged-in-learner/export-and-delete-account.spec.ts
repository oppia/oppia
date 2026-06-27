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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * LI.PP. Learner Export or Delete the Account from preference page.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Logged-In Learner', function () {
  let loggedInLearner: LoggedInUser & LoggedOutUser;

  test.beforeAll(async function ({browser}) {
    loggedInLearner = await UserFactory.createNewUser(
      'loggedInLearner',
      'logged_in_learner@example.com',
      browser
    );
  });

  test('should be able to export account', async function () {
    await loggedInLearner.navigateToPreferencesPageUsingProfileDropdown();
    await loggedInLearner.exportAccount();
  });

  test('should be able to delete account', async function () {
    // Delete Account.
    await loggedInLearner.deleteAccount();
    // Initiating account deletion from /preferences page redirects to /delete-account page.
    await loggedInLearner.expectToBeOnPage('delete account');
    await loggedInLearner.confirmAccountDeletion('loggedInLearner');

    // After confirmation of account deletion, user is redirected to /pending-account-deletion page.
    await loggedInLearner.expectToBeOnPage('pending account deletion');
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
