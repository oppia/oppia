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
 * @fileoverview Acceptance Test for Blog Admin
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {BlogAdmin} from '../../utilities/user/blog-admin';
import {SuperAdmin} from '../../utilities/user/super-admin';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;
const BLOG_RIGHTS = testConstants.BlogRights;

describe('Blog Admin', function () {
  let superAdmin: SuperAdmin;
  let blogAdmin: BlogAdmin;

  beforeAll(async function () {
    superAdmin = await UserFactory.createNewSuperAdmin('superAdm');
    blogAdmin = await UserFactory.createNewUser(
      'blogAdm',
      'blog_admin@example.com',
      [ROLES.BLOG_ADMIN]
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  /** TODO(#17162): This test should be done without the need of super admin, as
   * blog admin must be able to revoke blog editor role of other users from the
   * /blog-admin page. But this is not the case now, only super admin can do this
   */
  it(
    'should assign roles to users and change tag properties',
    async function () {
      const guestUsr1 = await UserFactory.createNewUser(
        'guestUsr1',
        'guest_user1@example.com'
      );
      const guestUsr2 = await UserFactory.createNewUser(
        'guestUsr2',
        'guest_user2@example.com'
      );

      await superAdmin.expectUserNotToHaveRole('guestUsr1', ROLES.BLOG_ADMIN);
      await blogAdmin.assignUserToRoleFromBlogAdminPage(
        'guestUsr1',
        BLOG_RIGHTS.BLOG_ADMIN
      );
      await superAdmin.expectUserToHaveRole('guestUsr1', ROLES.BLOG_ADMIN);

      await superAdmin.expectUserNotToHaveRole(
        'guestUsr2',
        ROLES.BLOG_POST_EDITOR
      );
      await blogAdmin.assignUserToRoleFromBlogAdminPage(
        'guestUsr2',
        BLOG_RIGHTS.BLOG_POST_EDITOR
      );
      await superAdmin.expectUserToHaveRole(
        'guestUsr2',
        ROLES.BLOG_POST_EDITOR
      );

      await blogAdmin.removeBlogEditorRoleFromUsername('guestUsr2');
      await superAdmin.expectUserNotToHaveRole(
        'guestUsr2',
        ROLES.BLOG_POST_EDITOR
      );

      await blogAdmin.expectMaximumTagLimitNotToBe(5);
      await blogAdmin.setMaximumTagLimitTo(5);
      await blogAdmin.expectMaximumTagLimitToBe(5);
      await guestUsr1.closeBrowser();
      await guestUsr2.closeBrowser();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
