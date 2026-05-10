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
 * BW. Register and update blog profile.
 */

import {test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {BlogPostEditor} from '../../utilities/user/blog-post-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const ROLES = testConstants.Roles;
const URLS = testConstants.URLs;

test.describe.configure({mode: 'serial'});

test.describe('Blog Post Writer', () => {
  let blogPostWriter: BlogPostEditor & LoggedInUser & LoggedOutUser;

  test.beforeAll(async ({browser}) => {
    blogPostWriter = await UserFactory.createNewUser(
      'blogPostWriter',
      'blog_post_writer@example.com',
      browser,
      [ROLES.BLOG_POST_EDITOR]
    );
  });

  test('should be able to register on the blog platform', async () => {
    await blogPostWriter.reloadPage();
    await blogPostWriter.navigateToPageUsingProfileMenu('Blog Dashboard');
    await blogPostWriter.expectPageURLToContain(URLS.BlogDashboard);

    await blogPostWriter.updateUserBioInRegisterModal('I am the test user.');
    await blogPostWriter.updateUsernameInRegisterModal(
      'WhyAreAllTheShortUsernamesAlreadyTaken'
    );
    await blogPostWriter.expectRegisterButtonToBe('disabled');

    await blogPostWriter.updateUsernameInRegisterModal('blogPostWriter');
    await blogPostWriter.expectRegisterButtonToBe('enabled');

    const longBio = 'This is a very long bio.'.repeat(25);
    await blogPostWriter.updateUserBioInRegisterModal(longBio);
    await blogPostWriter.expectRegisterButtonToBe('disabled');

    await blogPostWriter.updateUserBioInRegisterModal('I am a test user.');
    await blogPostWriter.expectRegisterButtonToBe('enabled');

    await blogPostWriter.clickOnSaveProfileButton();
  });

  test('should be able to update blogger details', async () => {
    await blogPostWriter.expectScreenshotToMatch('blogDashboard');
    await blogPostWriter.clickOnUpdateUsernameIcon();
    await blogPostWriter.updateUsernameInRegisterModal('devKitten');
    await blogPostWriter.clickOnSaveProfileButton();
    await blogPostWriter.expectUsernameInBlogDashboardToBe('devKitten');

    await blogPostWriter.clickOnUpdateBioIcon();
    await blogPostWriter.updateUserBioInRegisterModal(
      'I like writing tech blogs.'
    );
    await blogPostWriter.clickOnSaveProfileButton();
    await blogPostWriter.expectBioInBlogDashboardToBe(
      'I like writing tech blogs.'
    );
  });

  test.afterAll(async () => {
    await UserFactory.closeAllBrowsers();
  });
});
