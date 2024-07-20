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
 * @fileoverview Acceptance Test for checking if logged-out users can
 * navigate using all the links under the "About Oppia" footer section.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-out Users', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  beforeEach(async function () {
    // Navigate to a page that has the oppia footer.
    await loggedOutUser.navigateToHome();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should open "Donate" page via the footer',
    async function () {
      await loggedOutUser.clickOnDonateLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open the "Volunteer" page via the footer',
    async function () {
      await loggedOutUser.clickOnVolunteerLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "About" page via the footer',
    async function () {
      await loggedOutUser.clickOnAboutLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Blog" page via the footer',
    async function () {
      await loggedOutUser.clickOnBlogLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Forum" page via the footer',
    async function () {
      await loggedOutUser.clickOnForumLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Get Started" page via the footer',
    async function () {
      await loggedOutUser.clickOnGetStartedLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Creator Guidelines" page via the footer',
    async function () {
      await loggedOutUser.clickOnCreatorGuidelinesLinkinFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Teach" page via the footer',
    async function () {
      await loggedOutUser.clickOnForParentsSlashTeachersLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Community Library" page via the footer',
    async function () {
      await loggedOutUser.clickOnBrowseTheLibraryLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Contact" page via the footer',
    async function () {
      await loggedOutUser.clickOnContactUsLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to visit the Oppia YouTube',
    async function () {
      await loggedOutUser.clickYouTubeIconInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to visit the Oppia Facebook',
    async function () {
      await loggedOutUser.clickFacebookIconInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to visit the Oppia Twitter',
    async function () {
      await loggedOutUser.clickTwitterIconInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to visit the Oppia Github',
    async function () {
      await loggedOutUser.clickGithubIconInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to visit the Oppia LinkedIn',
    async function () {
      await loggedOutUser.clickLinkedInIconInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to visit the Oppia Google Play page',
    async function () {
      await loggedOutUser.clickGooglePlayButtonInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Terms of Service" page via the footer',
    async function () {
      await loggedOutUser.clickOnTermsOfServiceLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Privacy Policy" page via the footer',
    async function () {
      await loggedOutUser.clickOnPrivacyPolicyLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
