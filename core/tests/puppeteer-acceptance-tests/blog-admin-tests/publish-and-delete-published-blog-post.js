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

const createNewUser = require(
  '../puppeteer-testing-utilities/initializeUsersUtils.js');
const { closeAllBrowsers } = require(
  '../puppeteer-testing-utilities/initializeUsersUtils.js');

let publishBlogPostAndDeletePublishedBlogPost = async function() {
  const blogPostEditor = await createNewUser.blogPostEditor('blogPostEditor');

  await blogPostEditor.expectNumberOfDraftAndPublishedBlogPostsToBe(0);
  await blogPostEditor.publishNewBlogPostWithTitle('Test-Blog');

  await blogPostEditor.expectPublishedBlogPostWithTitleToExist('Test-Blog');
  await blogPostEditor.deletePublishedBlogPostWithTitle('Test-Blog');
  await blogPostEditor.expectNumberOfDraftAndPublishedBlogPostsToBe(0);

  await closeAllBrowsers();
};

publishBlogPostAndDeletePublishedBlogPost();
