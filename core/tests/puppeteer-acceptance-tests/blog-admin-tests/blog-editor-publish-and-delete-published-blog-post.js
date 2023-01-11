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
 * @fileoverview Accpetance Test for a Blog Post Editor to publish
 * and delete blog posts.
 */

const createNewUser = require('../puppeteer-testing-utilities/initializeUsers.js');
const testConstants = require(
  '../puppeteer-testing-utilities/testConstants.js');

const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const ROLE_BLOG_ADMIN = 'blog admin';
const blogAdminUrl = testConstants.URLs.BlogAdmin;
const ROLE_BLOG_POST_EDITOR = 'blog post editor';

let blogEditorPublishBlogPostAndDeletePublishedBlogPost = async function() {
  const superAdmin = await createNewUser.superAdmin(
    'superAdm', 'testadmin@example.com', ROLE_BLOG_ADMIN);
  const blogPostEditor = await createNewUser.blogPostEditor(
    'blogPostEditor', 'blog_post_editor@example.com');

  await superAdmin.goto(blogAdminUrl);
  await superAdmin.assignUserAsRoleFromRoleDropdown(
    'blogPostEditor', 'BLOG_POST_EDITOR');
  await superAdmin.expectUserToHaveRole('blogPostEditor', ROLE_BLOG_POST_EDITOR);
  await superAdmin.closeBrowser();

  await blogPostEditor.goto(blogDashboardUrl);
  await blogPostEditor.expectNumberOfDraftOrPublishedBlogPostsToBe(0);
  await blogPostEditor.publishNewBlogPostWithTitle('Test-Blog');

  await blogPostEditor.goto(blogDashboardUrl);
  await blogPostEditor.expectPublishedBlogPostWithTitleToExist('Test-Blog');
  await blogPostEditor.deletePublishedBlogPostWithTitle('Test-Blog');
  await blogPostEditor.expectPublishedBlogPostWithTitleToNotExist('Test-Blog');

  await blogPostEditor.closeBrowser();
};

blogEditorPublishBlogPostAndDeletePublishedBlogPost();
