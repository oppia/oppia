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
 * @fileoverview Accpetance Test for a Super Admin assign Blog Admin role.
 */

const e2eSuperAdmin = require(
  '../puppeteer-testing-utilities/blogPostAdminUtils.js');
const e2eBlogAdmin = require(
  '../puppeteer-testing-utilities/blogPostAdminUtils.js');
const testConstants = require(
  '../puppeteer-testing-utilities/testConstants.js');

const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const ROLE_BLOG_ADMIN = 'blog admin';

let superAdminAssignBlogAdminRole = async function() {
  const blogAdmin = await new e2eBlogAdmin();
  const superAdmin = await new e2eSuperAdmin();

  await blogAdmin.openBrowser();
  await blogAdmin.signUpNewUserWithUsernameAndEmail(
    'blogAdm', 'blog_admin@example.com');
  await blogAdmin.goto(blogDashboardUrl);
  await blogAdmin.expectBlogDashboardAccessToBeUnauthorized();

  await superAdmin.openBrowser();
  await superAdmin.signUpNewUserWithUsernameAndEmail(
    'superAdm', 'testadmin@example.com');
  await superAdmin.assignRoleToUser('blogAdm', ROLE_BLOG_ADMIN);
  await superAdmin.expectUserToHaveBlogAdminRole();
  await superAdmin.closeBrowser();

  await blogAdmin.expectBlogDashboardAccessToBeAuthorized();
  await blogAdmin.closeBrowser();
};

await superAdminAssignBlogAdminRole();
