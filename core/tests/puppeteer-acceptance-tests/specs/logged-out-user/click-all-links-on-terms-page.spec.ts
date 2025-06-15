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

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {showMessage} from '../../utilities/common/show-message';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

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

describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  beforeEach(async function () {
    await loggedOutUser.navigateToTermsPage();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to navigate to "privacy policy" page from the link' +
      'in "privacy policy" section.',
    async function () {
      await loggedOutUser.clickPrivacyPolicyLinkInTermsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to navigate to "CC-BY-SA 4.0" license page form the link' +
      'in "Hosted Created Content and IP" section.',
    async function () {
      await loggedOutUser.clickLicenseLinkInTermsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to navigate to "oppia-announce" google group page from the link' +
      'in "Modifications to These Terms" section.',
    async function () {
      await loggedOutUser.clickGoogleGroupSignUpLinkInTermsPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to scroll to the correct section when a bookmark is clicked' +
      'in the "Terms of Use" bookmark menu.',
    async function () {
      // The bookmark menu bar is not available in the mobile view.
      // so, skipping this test in mobile view.
      if (process.env.MOBILE === 'true') {
        showMessage('Test skipped in mobile viewport');
        return;
      }

      await loggedOutUser.clickBookmarkInTermsPage(BOOKMARK.OUR_SERVICES);
      await loggedOutUser.clickBookmarkInTermsPage(BOOKMARK.PRIVACY_POLICY);
      await loggedOutUser.clickBookmarkInTermsPage(
        BOOKMARK.HOSTED_CREATED_CONTENT
      );
      await loggedOutUser.clickBookmarkInTermsPage(
        BOOKMARK.REFRAINING_FROM_CERTAIN_ACTIVITIES
      );
      await loggedOutUser.clickBookmarkInTermsPage(BOOKMARK.TERMINATION);
      await loggedOutUser.clickBookmarkInTermsPage(
        BOOKMARK.DISCLAIMER_OF_WARRANTY
      );
      await loggedOutUser.clickBookmarkInTermsPage(
        BOOKMARK.LIMITATION_OF_LIABILITY
      );
      await loggedOutUser.clickBookmarkInTermsPage(
        BOOKMARK.DISPUTES_AND_JURISDICTION
      );
      await loggedOutUser.clickBookmarkInTermsPage(
        BOOKMARK.MODIFICATIONS_TO_THESE_TERMS
      );
      await loggedOutUser.clickBookmarkInTermsPage(BOOKMARK.CHANGELOG);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
