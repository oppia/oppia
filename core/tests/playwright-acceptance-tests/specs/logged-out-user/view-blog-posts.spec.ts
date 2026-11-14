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
 * @fileoverview Acceptance Test for viewing blog posts as a logged-out user.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {SuperAdmin} from '../../utilities/user/super-admin';
import {BlogPostEditor} from '../../utilities/user/blog-post-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import testConstants from '../../utilities/common/test-constants';
import {showMessage} from '../../utilities/common/show-message';

const ROLES = testConstants.Roles;
const NUM_OF_DUMMY_BLOGS = 30;

test.describe.configure({mode: 'serial'});

test.describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;
  let superAdmin: SuperAdmin;
  let blogPostEditor: BlogPostEditor & LoggedInUser;

  test.beforeAll(async function ({browser}) {
    loggedOutUser = await UserFactory.createLoggedOutUser(browser);
    superAdmin = await UserFactory.createNewSuperAdmin(browser);
    blogPostEditor = await UserFactory.createNewUser(
      'blogPostEditor',
      'blog_post_editor@example.com',
      browser,
      [ROLES.BLOG_POST_EDITOR]
    );

    const isInProdMode = await superAdmin.isInProdMode();
    if (!isInProdMode) {
      await superAdmin.navigateToAdminPageActivitiesTab();
      await superAdmin.generateDummyBlogPosts(NUM_OF_DUMMY_BLOGS);

      await blogPostEditor.navigateToBlogDashboardPage();
      await blogPostEditor.openBlogEditorPage();
      await blogPostEditor.uploadBlogPostThumbnailImage();
      await blogPostEditor.updateBlogPostTitle('Recipe Post');
      await blogPostEditor.updateBodyTextTo(
        'This is a special recipe that uses a secret ingredient called Pineapple to make it sweet.'
      );
      await blogPostEditor.selectTag('News');
      await blogPostEditor.saveBlogBodyChanges();
      await blogPostEditor.publishTheBlogPost();
    } else {
      showMessage(
        'The application is currently running in production mode. Skipping dummy blog post generation.'
      );
    }

    await UserFactory.closeBrowserForUser(superAdmin);
    await UserFactory.closeBrowserForUser(blogPostEditor);
  });

  test.beforeEach(async function () {
    await loggedOutUser.navigateToBlogPage();
  });

  test('should be able to view blog posts with tags', async function () {
    await loggedOutUser.expectBlogPostsToHaveAtLeastOneTag();
  });

  test('should be able to navigate through blog pages using pagination', async function () {
    await loggedOutUser.expectBlogPaginationControlsVisible();

    await loggedOutUser.clickNextBlogPage();
    await loggedOutUser.clickPreviousBlogPage();
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
