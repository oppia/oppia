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

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Logged-out Users', function () {
  let loggedOutUser: LoggedOutUser;

  test.beforeAll(async function ({browser}) {
    loggedOutUser = await UserFactory.createLoggedOutUser(browser);
  });

  test.beforeEach(async function () {
    // Navigate to a page that has the oppia footer.
    await loggedOutUser.navigateToHome();
  });

  test('should open "Donate" page via the footer', async function () {
    await loggedOutUser.clickOnDonateLinkInFooter();
  });

  test('should open the "Volunteer" page via the footer', async function () {
    await loggedOutUser.clickOnVolunteerLinkInFooter();
  });

  test('should open "About" page via the footer', async function () {
    await loggedOutUser.clickOnAboutLinkInFooter();
  });

  test('should open "Blog" page via the footer', async function () {
    await loggedOutUser.clickOnBlogLinkInFooter();
  });

  test('should open "Forum" page via the footer', async function () {
    await loggedOutUser.expectForumLinkInFooterToBeCorrect();
  });

  test('should open "Get Started" page via the footer', async function () {
    await loggedOutUser.clickOnGetStartedLinkInFooter();
  });

  test('should open "Creator Guidelines" page via the footer', async function () {
    await loggedOutUser.clickOnCreatorGuidelinesLinkInFooter();
  });

  test('should open "Teach" page via the footer', async function () {
    await loggedOutUser.clickOnForParentsSlashTeachersLinkInFooter();
  });

  test('should open "Community Library" page via the footer', async function () {
    await loggedOutUser.clickOnBrowseTheLibraryLinkInFooter();
  });

  test('should open "Contact" page via the footer', async function () {
    await loggedOutUser.clickOnContactUsLinkInFooter();
  });

  test('should be able to visit the Oppia YouTube', async function () {
    await loggedOutUser.expectYouTubeIconInFooterToBeCorrect();
  });

  test('should be able to visit the Oppia Facebook', async function () {
    await loggedOutUser.expectFacebookIconInFooterToBeCorrect();
  });

  test('should be able to visit the Oppia Twitter', async function () {
    await loggedOutUser.expectTwitterIconInFooterToBeCorrect();
  });

  test('should be able to visit the Oppia Github', async function () {
    await loggedOutUser.expectGithubIconInFooterToBeCorrect();
  });

  test('should be able to visit the Oppia LinkedIn', async function () {
    await loggedOutUser.expectLinkedInIconInFooterToBeCorrect();
  });

  test('should be able to visit the Oppia Google Play page', async function () {
    await loggedOutUser.expectGooglePlayButtonInFooterToBeCorrect();
  });

  test('should open "Terms of Service" page via the footer', async function () {
    await loggedOutUser.clickOnTermsOfServiceLinkInFooter();
  });

  test('should open "Privacy Policy" page via the footer', async function () {
    await loggedOutUser.clickOnPrivacyPolicyLinkInFooter();
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
