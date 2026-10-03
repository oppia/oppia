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
 * @fileoverview Acceptance test for the user journey of account creation and
 * deletion.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Logged-in User', function () {
  let loggedInUser2: LoggedInUser & LoggedOutUser;

  test.beforeAll(async function ({browser}) {
    const loggedInUser1 = await UserFactory.createNewUser(
      'loggedInUser1',
      'logged_in_user1@example.com',
      browser
    );
    await loggedInUser1.closeBrowser();
    loggedInUser2 = await UserFactory.createUserForSignup(browser);
  });

  test(
    'should be able to create an account, validate email, check admin ' +
      'suggestion, verify terms of use, login and delete account',
    async function () {
      await loggedInUser2.navigateToSignUpPage();

      await loggedInUser2.clickAdminAccessInfoLink();
      await loggedInUser2.expectAdminEmailSuggestion('testadmin@example.com');

      // Enter an invalid email.
      await loggedInUser2.enterEmailAndProceedToNextPage('123@gmail.');
      await loggedInUser2.expectValidationError('Invalid email address');

      // Enter a valid email.
      await loggedInUser2.enterEmailAndProceedToNextPage(
        'logged_in_user2@example.com'
      );

      // Verify that a username which already exists is rejected.
      await loggedInUser2.signInWithUsername('loggedInUser1', false);
      await loggedInUser2.expectUsernameError(
        'Sorry, this username is already taken.'
      );

      // Verify that usernames containing the reserved term "admin" are
      // rejected.
      await loggedInUser2.signInWithUsername('ImAdmin', false);
      await loggedInUser2.expectUsernameError(
        "User names with 'admin' are reserved."
      );

      // Enter a valid username and complete signup.
      await loggedInUser2.signInWithUsername('loggedInUser2');

      // Delete the account.
      await loggedInUser2.navigateToPreferencesPageUsingProfileDropdown();
      await loggedInUser2.deleteAccount();
      await loggedInUser2.expectToBeOnPageAsLoggedInUser('delete account');
      await loggedInUser2.confirmAccountDeletion('loggedInUser2');
      await loggedInUser2.expectToBeOnPageAsLoggedInUser(
        'pending account deletion'
      );
    }
  );

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
