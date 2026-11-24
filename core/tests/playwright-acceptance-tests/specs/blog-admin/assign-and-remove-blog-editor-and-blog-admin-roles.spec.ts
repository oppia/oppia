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
 *
 * BA. Assign and remove blog editor and blog admin roles.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {BlogAdmin} from '../../utilities/user/blog-admin';
import {BlogPostEditor} from '../../utilities/user/blog-post-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import testConstants, {
  BLOG_RIGHTS,
} from '../../utilities/common/test-constants';

const ROLES = testConstants.Roles;

test.describe.configure({mode: 'serial'});

test.describe('Blog Admin', function () {
  let blogAdmin: BlogAdmin;
  let guestUser1: LoggedInUser;
  let guestUser2: BlogPostEditor & LoggedInUser;

  test.beforeAll(async function ({browser}) {
    blogAdmin = await UserFactory.createNewSuperAdmin(browser);

    guestUser1 = await UserFactory.createNewUser(
      'guestUser1',
      'guest_user1@example.com',
      browser
    );

    guestUser2 = await UserFactory.createNewUser(
      'guestUser2',
      'guest_user2@example.com',
      browser,
      [ROLES.BLOG_POST_EDITOR]
    );
  });

  test('should be able to assign blog editor and blog admin role', async function () {
    await blogAdmin.navigateToBlogAdminPage();
    await blogAdmin.expectScreenshotToMatch('blogAdminPage');

    await blogAdmin.assignUserToRoleFromBlogAdminPage(
      'guestUser1',
      BLOG_RIGHTS.BLOG_POST_EDITOR
    );

    await blogAdmin.expectToastMessage(
      `Role of ${guestUser1.username} successfully updated to ${BLOG_RIGHTS.BLOG_POST_EDITOR}`
    );

    await blogAdmin.assignUserToRoleFromBlogAdminPage(
      'guestUser1',
      BLOG_RIGHTS.BLOG_ADMIN
    );

    await blogAdmin.expectToastMessage(
      `Role of ${guestUser1.username} successfully updated to ${BLOG_RIGHTS.BLOG_ADMIN}`
    );
  });

  test('should be able to remove blog editor role', async function () {
    await blogAdmin.removeBlogEditorRoleFromUsername('guestUser1');
    await blogAdmin.expectToastMessage('Success.');
  });

  test('should be able to update tag limit', async function () {
    await blogAdmin.setMaximumTagLimitTo(7);

    await guestUser2.navigateToBlogDashboardPage();
    await guestUser2.openBlogEditorPage();
    await guestUser2.expectTagLimitTextToBe(7);
    await guestUser2.expectRemainingTagsLimitTextToBe(7);

    await blogAdmin.setMaximumTagLimitTo(6);

    await guestUser2.reloadPage();
    await guestUser2.expectTagLimitTextToBe(6);
    await guestUser2.expectRemainingTagsLimitTextToBe(6);
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
