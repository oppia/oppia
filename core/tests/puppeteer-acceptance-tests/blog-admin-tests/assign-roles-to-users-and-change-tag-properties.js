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
 * @fileoverview Accpetance Test for a Blog Admin to assign roles and change
 * tag properties from the blog-admin page.
 */

const userFactory = require(
  '../puppeteer-testing-utilities/userFactory.js');
const { closeAllBrowsers } = require(
  '../puppeteer-testing-utilities/userFactory.js');

const ROLE_BLOG_ADMIN = 'blog admin';
const ROLE_BLOG_POST_EDITOR = 'blog post editor';

let assignRolesToUsersAndChangeTagProperties = async function() {
  const blogAdmin = await userFactory.createNewBlogAdmin('blogAdm');
  const superAdmin = await userFactory.createNewSuperAdmin('superAdm');
  await userFactory.createNewGuestUser('guestUsr1', 'guest_user1@example.com');
  await userFactory.createNewGuestUser('guestUsr2', 'guest_user2@example.com');

  await superAdmin.expectUserNotToHaveRole('guestUsr1', ROLE_BLOG_ADMIN);
  await blogAdmin.assignUserToRoleFromBlogAdminPage('guestUsr1', 'BLOG_ADMIN');
  await superAdmin.expectUserToHaveRole('guestUsr1', ROLE_BLOG_ADMIN);

  await superAdmin.expectUserNotToHaveRole('guestUsr2', ROLE_BLOG_POST_EDITOR);
  await blogAdmin.assignUserToRoleFromBlogAdminPage(
    'guestUsr2', 'BLOG_POST_EDITOR');
  await superAdmin.expectUserToHaveRole('guestUsr2', ROLE_BLOG_POST_EDITOR);

  await blogAdmin.removeBlogEditorRoleFromUsername('guestUsr2');
  await superAdmin.expectUserNotToHaveRole(
    'guestUsr2', ROLE_BLOG_POST_EDITOR);

  await blogAdmin.expectTagToNotExistInBlogTags('Test_Tag');
  await blogAdmin.addNewBlogTag('Test_Tag');
  await blogAdmin.expectTagToExistInBlogTags('Test_Tag');

  await blogAdmin.expectMaximumTagLimitNotToBe('5');
  await blogAdmin.setMaximumTagLimitTo('5');
  await blogAdmin.expectMaximumTagLimitToBe('5');

  await closeAllBrowsers();
};

assignRolesToUsersAndChangeTagProperties();
