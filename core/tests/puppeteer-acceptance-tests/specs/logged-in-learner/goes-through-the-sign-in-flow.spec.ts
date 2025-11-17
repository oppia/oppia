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
 * LI.SI. Learner goes through the sign-in flow
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Logged In Learner', function () {
  const loggedInUser: LoggedInUser & LoggedOutUser = Object.assign(
    new LoggedInUser(),
    new LoggedOutUser()
  );

  it('should be able to login and see Learner Dashboard', async function () {
    // Click on "Sign In" button and fill email.
    await loggedInUser.openBrowser();
    await loggedInUser.navigateToSignUpPage();

    // Verify the signup page is shown with username field.
    await loggedInUser.page.waitForSelector('input.e2e-test-username-input', {
      visible: true,
    });

    await loggedInUser.enterEmail('logged_in_user@example.com');

    // Fill an invalid username and verify error message.
    await loggedInUser.typeInInputField(
      'input.e2e-test-username-input',
      'invalid@user!'
    );
    await loggedInUser.page.evaluate(selector => {
      document.querySelector(selector).blur();
    }, 'input.e2e-test-username-input');

    // Verify error message with clear instructions is shown.
    await loggedInUser.expectUsernameError(
      'Usernames can only have lowercase letters and numbers.'
    );

    // Clear the invalid username and sign in with valid username.
    await loggedInUser.clearAllTextFrom('input.e2e-test-username-input');
    await loggedInUser.signInWithUsername('loggedInUser');

    // Verify learner is redirected to Learner Dashboard.
    await loggedInUser.expectToBeOnLearnerDashboardPage();

    // Verify welcome message with username.
    await loggedInUser.expectGreetingToHaveNameOfUser('loggedInUser');

    // Verify "Continue where you left off" section is NOT available.
    await loggedInUser.expectContinueFromWhereYouLeftSectionInRedesignedDashboardToBePresent(
      false
    );

    // Verify "Learn Something New" section is visible.
    await loggedInUser.expectLearnSomethingNewSectionInRedesignedDashboardToBePresent();

    // Click on "Progress" tab and verify it's empty.
    await loggedInUser.navigateToProgressSection();
    await loggedInUser.expectProgressSectionToBeEmptyInNewLD();
  });

  it('should land on navbar', async function () {
    // Check if "Learn", "About", and "Get Involved" works properly.
    await loggedInUser.expectNavbarToWorkProperly();

    // Check if profile dropdown works properly.
    await loggedInUser.clickOnProfileDropdown();
    await loggedInUser.expectProfileDropdownToContainElementWithContent(
      'loggedInUser'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
    await loggedInUser.closeBrowser();
  });
});
