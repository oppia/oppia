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
 * @fileoverview Acceptance Test for checking if logged-out users
 * can open all the links on the "Terms of Service" page.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

enum BOOKMARK {
  OUR_SERVICES = 'Our Services',
  PRIVACY_POLICY = 'Privacy Policy',
  HOSTED_CREATED_CONTENT = 'Hosted Created Content and IP',
  REFRAINING_FROM_CERTAIN_ACTIVITIES = 'Refraining from Certain Activities',
  TERMINATION = 'Termination',
  DISCLAIMER_OF_WARRANTY = 'Disclaimer of Warranty',
  LIMITATION_OF_LIABILITY = 'Limitation of Liability',
  DISPUTES_AND_JURISDICTION = 'Disputes and Jurisdiction',
  MODIFICATIONS_TO_THESE_TERMS = 'Modifications to These Terms',
  CHANGELOG = 'Changelog',
}

test.describe.configure({mode: 'serial'});

test.describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;

  test.beforeAll(async function ({browser}) {
    loggedOutUser = await UserFactory.createLoggedOutUser(browser);
  });

  test.beforeEach(async function () {
    await loggedOutUser.navigateToTermsPage();
  });

  test('should see a correct link to the "oppia-announce" google group in the "Modifications to These Terms" section', async function () {
    await loggedOutUser.expectGoogleGroupSignUpLinkInTermsPageToBeCorrect();
  });

  test('should be able to navigate to "privacy policy" page from the link in "privacy policy" section', async function () {
    await loggedOutUser.clickPrivacyPolicyLinkInTermsPage();
  });

  test('should be able to scroll to the correct section when a bookmark is clicked in the "Terms of Use" bookmark menu', async function () {
    // The bookmark menu is not shown in the mobile view.
    test.skip(
      process.env.MOBILE === 'true',
      'The bookmark menu is not shown in the mobile viewport'
    );

    for (const bookmark of Object.values(BOOKMARK)) {
      await loggedOutUser.clickBookmarkInTermsPage(bookmark);
    }
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
