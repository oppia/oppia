// Copyright 2025 The Oppia Authors. All Rights Reserved.
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

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Logged-In Learner', function () {
  let loggedInLearner: LoggedInUser & LoggedOutUser;

  beforeAll(async function () {
    loggedInLearner = await UserFactory.createNewUser(
      'loggedInLearner',
      'logged_in_learner@example.com'
    );
  });

  it('should be able to export account', async function () {
    await loggedInLearner.navigateToPreferencesPageUsingProfileDropdown();
    await loggedInLearner.exportAccount();
  });

  it('should be able to delete account', async function () {
    // Delete Account.
    await loggedInLearner.deleteAccount();
    // Initiating account deletion from /preferences page redirects to /delete-account page.
    await loggedInLearner.expectToBeOnPage('delete account');
    await loggedInLearner.confirmAccountDeletion('loggedInLearner');

    // After confirmation of account deletion, user is redirected to /pending-account-deletion page.
    await loggedInLearner.expectToBeOnPage('pending account deletion');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
