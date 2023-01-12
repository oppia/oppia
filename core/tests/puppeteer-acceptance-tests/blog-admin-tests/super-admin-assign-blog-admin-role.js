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

const createNewUser = require(
  '../puppeteer-testing-utilities/initializeUsers.js');

const ROLE_BLOG_ADMIN = 'blog admin';

let superAdminAssignBlogAdminRole = async function() {
  const superAdmin = await createNewUser.superAdmin(
    'superAdm', 'testadmin@example.com');
  const blogAdmin = await createNewUser.blogAdmin(
    'blogAdm', 'blog_admin@example.com');

  await blogAdmin.expectBlogDashboardAccessToBeUnauthorized();

  await superAdmin.assignRoleToUser('blogAdm', ROLE_BLOG_ADMIN);
  await superAdmin.expectUserToHaveRole('blogAdm', ROLE_BLOG_ADMIN);
  await superAdmin.closeBrowser();

  await blogAdmin.expectBlogDashboardAccessToBeAuthorized();
  await blogAdmin.closeBrowser();
};

superAdminAssignBlogAdminRole();
