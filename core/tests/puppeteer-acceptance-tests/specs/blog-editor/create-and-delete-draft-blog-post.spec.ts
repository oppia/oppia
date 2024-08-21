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
 * @fileoverview Acceptance Test for creating and deleting draft blog posts.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {BlogPostEditor} from '../../utilities/user/blog-post-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Blog Editor', function () {
  let blogPostEditor: BlogPostEditor;

  beforeAll(async function () {
    blogPostEditor = await UserFactory.createNewUser(
      'blogPostEditor',
      'blog_post_editor@example.com',
      [ROLES.BLOG_POST_EDITOR]
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should create and delete draft blog post',
    async function () {
      await blogPostEditor.navigateToBlogDashboardPage();
      await blogPostEditor.expectNumberOfBlogPostsToBe(0);
      await blogPostEditor.createDraftBlogPostWithTitle('Test Blog Post');
      await blogPostEditor.navigateToBlogDashboardPage();
      await blogPostEditor.expectNumberOfBlogPostsToBe(1);
      await blogPostEditor.expectDraftBlogPostWithTitleToBePresent(
        'Test Blog Post'
      );
      await blogPostEditor.deleteDraftBlogPostWithTitle('Test Blog Post');
      await blogPostEditor.expectNumberOfBlogPostsToBe(0);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
