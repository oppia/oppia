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

const createNewUser = require(
  '../puppeteer-testing-utilities/initializeUsers.js');

const ROLE_BLOG_ADMIN = 'blog admin';
const ROLE_BLOG_POST_EDITOR = 'blog post editor';

let blogAdminAssignRolesToUsersAndChangeTagProperties = async function() {
  const superAdmin = await createNewUser.superAdmin(
    'superAdm', 'testadmin@example.com', ROLE_BLOG_ADMIN);
  await createNewUser.blogAdmin(
    'blogAdm', 'blog_admin@example.com');
  await createNewUser.blogPostEditor(
    'blogEditor', 'blog_post_editor@example.com');

  await superAdmin.assignUserAsRoleFromRoleDropdown('blogAdm', 'BLOG_ADMIN');
  await superAdmin.expectUserToHaveRole('blogAdm', ROLE_BLOG_ADMIN);
  await superAdmin.assignUserAsRoleFromRoleDropdown(
    'blogEditor', 'BLOG_POST_EDITOR');
  await superAdmin.expectUserToHaveRole('blogEditor', ROLE_BLOG_POST_EDITOR);

  await superAdmin.removeBlogEditorRoleFromUsername('blogEditor');
  await superAdmin.expectUserNotToHaveRole(
    'blogEditor', ROLE_BLOG_POST_EDITOR);

  await superAdmin.expectTagToNotExistInBlogTags('Test_Tag');
  await superAdmin.addNewBlogTag('Test_Tag');
  await superAdmin.expectTagWithNameToExistInTagList('Test_Tag');

  await superAdmin.setMaximumTagLimitTo('5');
  await superAdmin.expectMaximumTagLimitToBe('5');

  await superAdmin.closeBrowser();
};

blogAdminAssignRolesToUsersAndChangeTagProperties();
