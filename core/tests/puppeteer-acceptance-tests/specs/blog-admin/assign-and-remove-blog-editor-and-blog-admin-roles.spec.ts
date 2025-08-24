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
 * BA. Assign and remove blog editor and blog admin roles.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {BlogAdmin} from '../../utilities/user/blog-admin';
import testConstants, {
  BLOG_RIGHTS,
} from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {BlogPostEditor} from '../../utilities/user/blog-post-editor';

const ROLES = testConstants.Roles;

describe('Blog Admin', function () {
  let blogAdmin: BlogAdmin & LoggedInUser & LoggedOutUser;
  let guestUser1: LoggedInUser;
  let guestUser2: BlogPostEditor & LoggedInUser;

  beforeAll(async function () {
    blogAdmin = await UserFactory.createNewUser(
      'blogAdm',
      'blog_admin@example.com',
      [ROLES.BLOG_ADMIN]
    );

    guestUser1 = await UserFactory.createNewUser(
      'guestUser1',
      'guest_user1@example.com'
    );

    guestUser2 = await UserFactory.createNewUser(
      'guestUser2',
      'guest_user2@example.com',
      [ROLES.BLOG_POST_EDITOR]
    );
  });

  it('should be able to assign blog editor and blog admin role', async function () {
    // Navigate to blog admin page and verify it.
    await blogAdmin.navigateToBlogAdminPage();
    await blogAdmin.expectScreenshotToMatch('blogAdminPage', __dirname);

    // Assign blog editor role to guestUser1.
    await blogAdmin.assignUserToRoleFromBlogAdminPage(
      'guestUser1',
      BLOG_RIGHTS.BLOG_POST_EDITOR
    );
    await blogAdmin.expectActionStatusMessageToBe(
      `Role of ${guestUser1.username} successfully updated to ${BLOG_RIGHTS.BLOG_POST_EDITOR}`
    );

    // Assign blog admin role to guestUser1.
    await blogAdmin.assignUserToRoleFromBlogAdminPage(
      'guestUser1',
      BLOG_RIGHTS.BLOG_ADMIN
    );
    await blogAdmin.expectActionStatusMessageToBe(
      `Role of ${guestUser1.username} successfully updated to ${BLOG_RIGHTS.BLOG_ADMIN}`
    );
  });

  it('should be able to remove blog editor role', async function () {
    // Remove blog editor role from guestUser1.
    await blogAdmin.removeBlogEditorRoleFromUsername('guestUser1');
    await blogAdmin.expectActionStatusMessageToBe('Success.');
  });

  it('should be able to update tag limit', async function () {
    // Update tag limit to 7.
    await blogAdmin.setMaximumTagLimitTo(7);
    await blogAdmin.expectActionStatusMessageToBe('Data saved successfully.');

    // Verify tag limit text in blog editor page.
    await guestUser2.navigateToBlogDashboardPage();
    await guestUser2.openBlogEditorPage();
    await guestUser2.expectTagLimitTextToBe(7);
    await guestUser2.expectRemainingTagsLimitTextToBe(7);

    // Update tag limit to 6.
    await blogAdmin.setMaximumTagLimitTo(6);
    await blogAdmin.expectActionStatusMessageToBe('Data saved successfully.');

    // Verify tag limit text in blog editor page.
    await guestUser2.reloadPage();
    await guestUser2.expectTagLimitTextToBe(6);
    await guestUser2.expectRemainingTagsLimitTextToBe(6);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
