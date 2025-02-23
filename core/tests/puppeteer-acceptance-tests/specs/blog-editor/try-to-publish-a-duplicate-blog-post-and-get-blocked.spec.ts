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
 * @fileoverview Acceptance Test for Blog Post Editor
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {BlogPostEditor} from '../../utilities/user/blog-post-editor';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;
const duplicateBlogPostWarning =
  ' Blog Post with the' +
  ' given title exists already. Please use a different title. ';

// This is the error that appears in the console when we try to post a blog with a title
// that already exists. Since we are testing this functionality, this error occurred.
ConsoleReporter.setConsoleErrorsToIgnore([
  'Blog Post with the given title exists already. Please use a different title.',
]);

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
    'should check blog editor unable to publish duplicate blog post',
    async function () {
      await blogPostEditor.navigateToBlogDashboardPage();
      await blogPostEditor.expectNumberOfBlogPostsToBe(0);
      await blogPostEditor.publishNewBlogPost('Test-Blog');

      await blogPostEditor.navigateToPublishTab();
      await blogPostEditor.expectNumberOfBlogPostsToBe(1);
      await blogPostEditor.expectPublishedBlogPostWithTitleToBePresent(
        'Test-Blog'
      );
      await blogPostEditor.expectScreenshotToMatch(
        'blogEditorPageWithPublishedBlogPostTitle',
        __dirname
      );

      await blogPostEditor.navigateToBlogDashboardPage();
      await blogPostEditor.createNewBlogPostWithTitle('Test-Blog');
      await blogPostEditor.expectScreenshotToMatch(
        'blogEditorPageWithErrorMessageForDuplicateBlogPostTitle',
        __dirname
      );

      await blogPostEditor.expectUserUnableToPublishBlogPost(
        duplicateBlogPostWarning
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
