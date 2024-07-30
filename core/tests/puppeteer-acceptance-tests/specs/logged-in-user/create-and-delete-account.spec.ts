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
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-in User', function () {
  let loggedInUser1: LoggedInUser & LoggedOutUser;
  let loggedInUser2: LoggedInUser & LoggedOutUser;

  beforeAll(async function () {
    loggedInUser1 = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user@example.com'
    );
    await loggedInUser1.timeout(2147483647);
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it('should be able to create an account, validate email, check admin suggestion, verify terms of use, login and delete account', async function () {
    await loggedInUser2.openBrowser();
    await loggedInUser2.navigateToSignUpPage();

    await loggedInUser2.clickAdminAccessInfoLink();

    // Entering invalid email.
    await loggedInUser2.enterEmail('123@gmail.');
    await loggedInUser2.expectValidationError('Invalid email address');
    await loggedInUser2.expectAdminEmailSuggestion('testAdmin@example.com');

    // Checking username availability via entering username that already exists.
    await loggedInUser2.enterUsername('loggedInUser1');
    await loggedInUser2.expectUsernameError(
      'Sorry, this username is already taken.'
    );

    // Checking username via entering a username with 'admin' term(which shall is not allowed as admin term is reserved).
    await loggedInUser2.enterUsername('ImAdmin!');
    await loggedInUser2.expectUsernameError(
      "User names with 'admin' are reserved."
    );

    // Signing up with correct credentials.
    await loggedInUser2.signUpNewUser(
      'loggedInUser2',
      'logged_in_user@example.com'
    );

    // Delete the account
    await loggedInUser2.navigateToPreferencesPage();
    await loggedInUser2.deleteAccount();
    // Initiating account deletion from /preferences page redirects to /delete-account page.
    await loggedInUser2.expectToBeOnPage('delete account');
    await loggedInUser2.confirmAccountDeletion();

    await loggedInUser2.navigateToPendingAccountDeletionPage();
    await loggedInUser2.expectNoOfPendingAccountDeletionRequest();
  }, 2147483647);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
