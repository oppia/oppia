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

const e2eSuperAdmin = require(
  '../puppeteer-testing-utilities/blogPostAdminUtils.js');
const e2eBlogAdmin = require(
  '../puppeteer-testing-utilities/blogPostAdminUtils.js');
const e2eBlogPostEditor = require(
  '../puppeteer-testing-utilities/blogPostAdminUtils.js');
const testConstants = require(
  '../puppeteer-testing-utilities/testConstants.js');

const blogAdminUrl = testConstants.URLs.BlogAdmin;
const ROLE_BLOG_ADMIN = 'BLOG_ADMIN';
const ROLE_BLOG_POST_EDITOR = 'BLOG_POST_EDITOR';

let blogAdminAssignRolesToUsersAndChangeTagProperties = async function() {
  const superAdmin = await new e2eSuperAdmin();
  const blogAdmin = await new e2eBlogAdmin();
  const blogPostEditor = await new e2eBlogPostEditor();

  await blogAdmin.openBrowser();
  await blogAdmin.signUpNewUserWithUsernameAndEmail(
    'blogAdm', 'blog_admin@example.com');
  await blogAdmin.closeBrowser();

  await blogPostEditor.openBrowser();
  await blogPostEditor.signUpNewUserWithUsernameAndEmail(
    'blogPostEditor', 'blog_post_editor@example.com');
  await blogPostEditor.closeBrowser();

  await superAdmin.openBrowser();
  await superAdmin.signUpNewUserWithUsernameAndEmail(
    'superAdm', 'testadmin@example.com');
  await superAdmin.assignRoleToUser('superAdm', 'blog admin');
  await superAdmin.expectUserToHaveRole('superAdm', 'Blog Admin');

  await superAdmin.goto(blogAdminUrl);
  await superAdmin.assignUserAsRoleFromRoleDropdown('blogAdm', ROLE_BLOG_ADMIN);
  await superAdmin.expectUserToHaveRole('blogAdm', 'Blog Admin');
  await superAdmin.assignUserAsRoleFromRoleDropdown(
    'blogPostEditor', ROLE_BLOG_POST_EDITOR);
  await superAdmin.expectUserToHaveRole('blogPostEditor', 'Blog Post Editor');

  await superAdmin.removeBlogEditorRoleFromUsername('blogPostEditor');
  await superAdmin.expectUserNotToHaveRole(
    'blogPostEditor', 'Blog Post Editor');

  await superAdmin.expectTagToNotExistInBlogTags('Test_Tag');
  await superAdmin.addNewBlogTag('Test_Tag');
  await superAdmin.expectTagWithNameToExistInTagList('Test_Tag');

  await superAdmin.setMaximumTagLimitTo('5');
  await superAdmin.expectMaximumTagLimitToBe('5');

  await superAdmin.closeBrowser();
};

await blogAdminAssignRolesToUsersAndChangeTagProperties();
