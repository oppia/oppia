// Copyright 2023 The Oppia Authors. All Rights Reserved.
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

const userFactory = require(
  '../../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../../puppeteer-testing-utilities/test-constants.js');

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Blog Admin', function() {
  const ROLE_BLOG_ADMIN = 'blog admin';
  const ROLE_BLOG_POST_EDITOR = 'blog post editor';
  let superAdmin = null;
  let blogAdmin = null;

  beforeAll(async function() {
    superAdmin = await userFactory.createNewSuperAdmin('superAdm');
    blogAdmin = await userFactory.createNewBlogAdmin('blogAdm');
  }, DEFAULT_SPEC_TIMEOUT);

  /** TODO(#17162): This test should be done without the need of super admin, as
  * blog admin must be able to revoke blog editor role of other users from the
  * /blog-admin page. But this is not the case now, only super admin can do this
  */
  it('should assign roles to users and change tag properties',
    async function() {
      const guestUsr1 = await userFactory.createNewGuestUser(
        'guestUsr1', 'guest_user1@example.com');
      const guestUsr2 = await userFactory.createNewGuestUser(
        'guestUsr2', 'guest_user2@example.com');

      await superAdmin.expectUserNotToHaveRole('guestUsr1', ROLE_BLOG_ADMIN);
      await blogAdmin.assignUserToRoleFromBlogAdminPage(
        'guestUsr1', 'BLOG_ADMIN');
      await superAdmin.expectUserToHaveRole('guestUsr1', ROLE_BLOG_ADMIN);

      await superAdmin.expectUserNotToHaveRole(
        'guestUsr2', ROLE_BLOG_POST_EDITOR);
      await blogAdmin.assignUserToRoleFromBlogAdminPage(
        'guestUsr2', 'BLOG_POST_EDITOR');
      await superAdmin.expectUserToHaveRole('guestUsr2', ROLE_BLOG_POST_EDITOR);

      await blogAdmin.removeBlogEditorRoleFromUsername('guestUsr2');
      await superAdmin.expectUserNotToHaveRole(
        'guestUsr2', ROLE_BLOG_POST_EDITOR);

      await blogAdmin.expectMaximumTagLimitNotToBe('5');
      await blogAdmin.setMaximumTagLimitTo('5');
      await blogAdmin.expectMaximumTagLimitToBe('5');
      await guestUsr1.closeBrowser();
      await guestUsr2.closeBrowser();
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
