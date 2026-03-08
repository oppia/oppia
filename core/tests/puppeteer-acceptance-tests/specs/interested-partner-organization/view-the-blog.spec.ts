// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/spreadsheets/d/1IrxN13IC5xwWdAFnGMu_4p3FU1ADL4QO-eLZIuTowIA/edit?gid=565576955#gid=565576955
 *
 * IO.2. View the blog.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {BlogPostEditor} from '../../utilities/user/blog-post-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-out User', function () {
  let interestedPartnerOrg: LoggedOutUser;
  let blogPostWriter: BlogPostEditor & LoggedInUser;

  beforeAll(async function () {
    interestedPartnerOrg = await UserFactory.createLoggedOutUser();
    blogPostWriter = await UserFactory.createNewUser(
      'blogPostWriter',
      'blog_post_writer@example.com',
      [ROLES.BLOG_POST_EDITOR]
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should observe the welcome message and empty-state notice when no blog posts exist',
    async function () {
      await interestedPartnerOrg.navigateToBlogPageViaNavbar();
      await interestedPartnerOrg.expectBlogWelcomeMessageToBeVisible(
        'Welcome to the Oppia Blog!'
      );
      await interestedPartnerOrg.expectNoBlogPostsMessageToBeVisible(
        'Sorry, there are no blog posts matching this query.'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should observe blogs with navigation',
    async function () {
      // As blogPostWriter: Create and publish blog "International Blog".
      await blogPostWriter.navigateToBlogDashboardPage();
      await blogPostWriter.openBlogEditorPage();
      await blogPostWriter.uploadBlogPostThumbnailImage();
      await blogPostWriter.updateBlogPostTitle('International Blog');
      await blogPostWriter.updateBodyTextTo('International News Blog');
      await blogPostWriter.selectTag('International');
      await blogPostWriter.saveBlogBodyChanges();
      await blogPostWriter.publishTheBlogPost();

      await blogPostWriter.navigateToBlogDashboardPage();
      await blogPostWriter.openBlogEditorPage();
      await blogPostWriter.uploadBlogPostThumbnailImage();
      await blogPostWriter.updateBlogPostTitle('Blog 2');
      await blogPostWriter.updateBodyTextTo('Content for Blog 2');
      await blogPostWriter.selectTag('News');
      await blogPostWriter.saveBlogBodyChanges();
      await blogPostWriter.saveTheDraftBlogPost();

      // As interestedPartnerOrg: Refresh the page.
      await interestedPartnerOrg.reloadPage();

      await interestedPartnerOrg.expectNumberOfBlogPostsOnPageToBe(1);
      await interestedPartnerOrg.expectBlogPostWithTitleToBePresent(
        'International Blog'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should paginate blog posts after the first 10 items',
    async function () {
      // As blogPostWriter: Create and publish 11 new blogs.
      await blogPostWriter.navigateToBlogDashboardPage();
      for (let i = 3; i <= 13; i++) {
        await blogPostWriter.openBlogEditorPage();
        await blogPostWriter.uploadBlogPostThumbnailImage();
        await blogPostWriter.updateBlogPostTitle(`Blog ${i}`);
        await blogPostWriter.updateBodyTextTo(`Content for Blog ${i}`);
        await blogPostWriter.selectTag('News');
        await blogPostWriter.saveBlogBodyChanges();
        await blogPostWriter.publishTheBlogPost();
        await blogPostWriter.navigateToBlogDashboardPage();
      }
      // Pagination shows 10 blogs per page. Since 12 blogs exist,
      // page 1 should display 10 blogs and page 2 should display the remaining 2.
      await interestedPartnerOrg.navigateToBlogPage();
      await interestedPartnerOrg.expectNumberOfBlogPostsOnPageToBe(10);

      await interestedPartnerOrg.clickNextBlogPage();
      await interestedPartnerOrg.expectNumberOfBlogPostsOnPageToBe(2);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display blog page with correct layout elements',
    async function () {
      await interestedPartnerOrg.navigateToBlogPageViaNavbar();

      await interestedPartnerOrg.expectBlogPageLayoutToBeCorrect();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should display blog post page with all required elements',
    async function () {
      await interestedPartnerOrg.clickOnFirstBlogPost();

      await interestedPartnerOrg.expectBlogPostTitleToBeVisible();
      await interestedPartnerOrg.expectBlogPostAuthorToBeVisible();
      await interestedPartnerOrg.expectBlogPostPublishDateToBeVisible();
      await interestedPartnerOrg.expectBlogPostContentToBeVisible();
      await interestedPartnerOrg.expectBlogPostTagsToBeVisible();
      await interestedPartnerOrg.expectBlogShareButtonToBeVisible();
      await interestedPartnerOrg.expectSuggestedBlogPostsSectionToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to search and filter blog posts',
    async function () {
      await interestedPartnerOrg.navigateToBlogPage();
      await interestedPartnerOrg.filterBlogPostsByTag('International');
      await interestedPartnerOrg.expectBlogSearchResultsToHaveTag(
        'International'
      );

      await interestedPartnerOrg.navigateToBlogPage();
      await interestedPartnerOrg.filterBlogPostsByKeyword('International');
      await interestedPartnerOrg.expectBlogSearchResultsToContain(
        'International'
      );

      await interestedPartnerOrg.navigateToBlogPage();
      await interestedPartnerOrg.filterBlogPostsByKeyword('fashion');
      await interestedPartnerOrg.expectNoBlogPostsMessageToBeVisible(
        'Sorry, there are no blog posts matching this query.'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
