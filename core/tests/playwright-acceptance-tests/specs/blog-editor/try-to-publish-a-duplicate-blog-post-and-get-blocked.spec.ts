// Copyright 2026 The Oppia Authors. All Rights Reserved.
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

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {BlogPostEditor} from '../../utilities/user/blog-post-editor';

const ROLES = testConstants.Roles;
const duplicateBlogPostWarning =
  'Blog Post with the given title exists already. Please use a different title.';

test.describe('Blog Editor', function () {
  let blogPostEditor: BlogPostEditor;

  test.beforeAll(async function ({browser}) {
    blogPostEditor = await UserFactory.createNewUser(
      'blogPostEditor',
      'blog_post_editor@example.com',
      browser,
      [ROLES.BLOG_POST_EDITOR]
    );
  });

  test('should check blog editor unable to publish duplicate blog post', async function () {
    await blogPostEditor.navigateToBlogDashboardPage();
    await blogPostEditor.updateUsernameInRegisterModal('blogPostEditor');
    await blogPostEditor.updateUserBioInRegisterModal('Dummy-User-Bio');
    await blogPostEditor.clickOnSaveProfileButton();
    await blogPostEditor.expectNumberOfBlogPostsToBe(0);
    await blogPostEditor.publishNewBlogPost('Test-Blog');

    await blogPostEditor.navigateToPublishTab();
    await blogPostEditor.expectNumberOfBlogPostsToBe(1);
    await blogPostEditor.expectPublishedBlogPostWithTitleToBePresent(
      'Test-Blog'
    );
    await blogPostEditor.expectScreenshotToMatch(
      'blogEditorPageWithPublishedBlogPostTitle'
    );

    await blogPostEditor.navigateToBlogDashboardPage();
    await blogPostEditor.createNewBlogPostWithTitle('Test-Blog');
    // Navigate to the bottom of the page, to ensure screenshots are taken
    // from the same positions before comparing them.
    await blogPostEditor.scrollToBottomOfPage();
    await blogPostEditor.expectScreenshotToMatch(
      'blogEditorPageWithErrorMessageForDuplicateBlogPostTitle'
    );

    await blogPostEditor.expectUserUnableToPublishBlogPost(
      duplicateBlogPostWarning
    );
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
