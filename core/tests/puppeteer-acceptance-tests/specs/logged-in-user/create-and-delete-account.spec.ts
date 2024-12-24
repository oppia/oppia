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
 * @fileoverview Acceptance Test for the user journey of account creation and deletion.
 * The test includes:
 * - User Journey: Navigation to sign up page, creation of an account, email validation, checking admin suggestion,
 *   verifying terms of use, logging in, and account deletion by a logged-out user.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-in User', function () {
  let loggedInUser2: LoggedInUser = new LoggedInUser();

  beforeAll(async function () {
    const loggedInUser1 = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com'
    );
    await loggedInUser1.closeBrowser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to create an account, validate email, check admin suggestion, verify terms of use, login and delete account',
    async function () {
      // Calling openBrowser since we didn't use createNewUser to create loggedInUser2 as it needs a username and a email.
      await loggedInUser2.openBrowser();
      await loggedInUser2.navigateToSignUpPage();

      await loggedInUser2.clickAdminAccessInfoLink();
      await loggedInUser2.expectAdminEmailSuggestion('testadmin@example.com');

      // Entering invalid email.
      await loggedInUser2.enterEmail('123@gmail.');
      await loggedInUser2.expectValidationError('Invalid email address');

      // Entering valid email.
      await loggedInUser2.enterEmail('logged_in_user2@example.com');

      // Checking username availability via entering username that already exists.
      await loggedInUser2.signInWithUsername('loggedInUser1');
      await loggedInUser2.expectUsernameError(
        'Sorry, this username is already taken.'
      );

      // Checking username via entering a username with 'admin' term(which shall is not allowed as  term "admin" is reserved).
      await loggedInUser2.signInWithUsername('ImAdmin');
      await loggedInUser2.expectUsernameError(
        "User names with 'admin' are reserved."
      );

      // Entering valid username and signing up.
      await loggedInUser2.signInWithUsername('loggedInUser2');

      // Delete the account.
      await loggedInUser2.navigateToPreferencesPage();
      await loggedInUser2.deleteAccount();
      // Initiating account deletion from /preferences page redirects to /delete-account page.
      await loggedInUser2.expectToBeOnPage('delete account');
      await loggedInUser2.confirmAccountDeletion('loggedInUser2');

      // After confirmation of account deletion, user is redirected to /pending-account-deletion page.
      await loggedInUser2.expectToBeOnPage('pending account deletion');
      // Calling closeBrowser since we didn't call createNewUser for loggedInUser2, so loggedInUser2 is not in the array activeUsers.
      // UserFactory.closeAllBrowsers closes all browsers based on activeUsers. Therefore, closeBrowser is called to close loggedInUser2's browser.
      await loggedInUser2.closeBrowser();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
