// Copyright 2022 The Oppia Authors. All Rights Reserved.
// //
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// //
//      http://www.apache.org/licenses/LICENSE-2.0
// //
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview End-to-end tests for the blog pages.
 */

var users = require('../webdriverio_utils/users.js');
var general = require('../webdriverio_utils/general.js');


var BlogPages = require('../webdriverio_utils/BlogPages.js');
var BlogDashboardPage = require('../webdriverio_utils/BlogDashboardPage.js');

describe('Blog Pages functionality', function() {
  var blogPages = null;
  var blogDashboardPage = null;

  beforeAll(async function() {
    blogPages = new BlogPages.BlogPages();
    blogDashboardPage = new BlogDashboardPage.BlogDashboardPage();
    await users.createUserWithRole(
      'blog@blogDashboard.com',
      'blog',
      'blog admin');
    await users.createUserWithRole(
      'secondBlog@blogDashboard.com',
      'secondUser',
      'blog admin');
    await users.login('secondBlog@blogDashboard.com');
  });

  it('should checks welcome message is visible on homepage, with' +
  ' no results found page as no blog post is published', async function() {
    await blogPages.get();
    await blogPages.expectNoResultsFoundShown();
    await blogPages.expectBlogHomePageWelcomeHeadingToBeVisible();
    await blogPages.expectOppiaAvatarImageToBeVisible();
    await blogPages.expectTagFilterComponentToBeVisible();
    await blogPages.expectBlogPostSearchFieldToBeVisible();
  });

  it('should only show published blog post on blog page, navigate to blog ' +
  'post page and show no recommendations', async function() {
    await blogDashboardPage.get();
    await blogDashboardPage.updateAuthorDetails(
      'secondUser', 'Oppia Blog Author');

    await blogPages.saveBlogPostAsDraftFromBlogDashboard(
      'Draft blog post Title',
      'Hi there, I’m Oppia! I’m an online personal tutor for everybody!',
    );
    await blogDashboardPage.expectNumberOfDraftBlogPostsToBe(1);

    await blogPages.publishNewBlogPostFromBlogDashboard(
      'Published Blog Post Title',
      'Hi there, I’m Oppia! I’m an online personal tutor for everybody!',
      ['News', 'International', 'Educators']);
    await blogDashboardPage.navigateToPublishTab();
    await blogDashboardPage.expectNumberOfPublishedBlogPostsToBe(1);

    await blogPages.get();
    await blogPages.expectNumberOfBlogPostsToBe(1);
    await blogPages.navigateToBlogPostPage('Published Blog Post Title');
    await blogPages.expectBlogPostPageTitleToBe('Published Blog Post Title');
    await blogPages.expectBlogAuthorDetailsToBeVisible('secondUser');
    await blogPages.expectNumberOfRecommendationPostsToBe(0);
    await blogPages.navigateToBlogHomePageWithBackButton();
    await users.logout();

    // Logging in for user with username 'blog'.
    await users.login('blog@blogDashboard.com');
    await blogPages.get();
    await blogPages.expectNumberOfBlogPostsToBe(1);
    await blogPages.navigateToBlogPostPage('Published Blog Post Title');
    await blogPages.expectBlogPostPageTitleToBe('Published Blog Post Title');
    await blogPages.expectBlogAuthorDetailsToBeVisible('secondUser');
  });

  it('should show published blog posts on blog page and use pagination,',
    async function() {
      // Publishing 7 blog posts by user with username 'blog'.
      await blogDashboardPage.get();
      await blogDashboardPage.updateAuthorDetails(
        'blog', 'Oppia Blog Author with name blog');
      await blogPages.publishNewBlogPostFromBlogDashboard(
        'Blog post Title Two',
        'Hi there, I’m Oppia! I’m an online personal tutor for everybody!' +
        'Second Blog Post Content.',
        ['News', 'International', 'Educators']);
      await blogPages.publishNewBlogPostFromBlogDashboard(
        'Blog Three',
        'Hi there, I’m Oppia! I’m an online personal tutor for everybody!' +
        'Third Blog Post Content.',
        ['International', 'Educators', 'Learners']);
      await blogPages.publishNewBlogPostFromBlogDashboard(
        'Post Title Four',
        'Hi there, I’m Oppia! I’m an online personal tutor for everybody!',
        ['International', 'Learners']);
      await blogPages.publishNewBlogPostFromBlogDashboard(
        'Blog post Title Five',
        'Hi there, I’m Oppia! I’m an online personal tutor for everybody!',
        ['Partnerships', 'Volunteer', 'Stories', 'New features']);
      await blogPages.publishNewBlogPostFromBlogDashboard(
        'Sixth Blog',
        'I’m Oppia! I’m an online personal tutor for everybody!',
        ['Partnerships', 'Volunteer', 'Stories', 'Languages']);
      await blogPages.publishNewBlogPostFromBlogDashboard(
        'Seventh Bloggers Post',
        'I’m Oppia! I’m an online personal tutor for everybody!',
        ['Stories', 'Languages', 'New features']);
      await blogPages.publishNewBlogPostFromBlogDashboard(
        'Eight Article by blog author',
        'I’m Oppia! I’m an online personal tutor for everybody!',
        ['News', 'International', 'Stories', 'Languages', 'New features']);
      await blogDashboardPage.navigateToPublishTab();
      await blogDashboardPage.expectNumberOfPublishedBlogPostsToBe(7);

      // Checking for blog posts on blog homepage.
      await blogPages.get();
      await blogPages.expectNumberOfBlogPostsToBe(8);
      await users.logout();

      // Logging in with different username - 'secondUser' and publishing a
      // few more blog posts.
      await users.login('secondBlog@blogDashboard.com');
      await blogDashboardPage.get();
      await blogPages.publishNewBlogPostFromBlogDashboard(
        'Article number Nine',
        'I’m Oppia! I’m an online personal tutor for everybody!',
        ['News', 'New features']);
      await blogPages.publishNewBlogPostFromBlogDashboard(
        'Tenth blog post',
        'I’m Oppia! I’m an online personal tutor for everybody!',
        ['News', 'Stories']);
      await blogPages.publishNewBlogPostFromBlogDashboard(
        '11th Published blog post',
        'I’m Oppia! I’m an online personal tutor for everybody!',
        ['News', 'Volunteer', 'Stories']);
      await blogPages.publishNewBlogPostFromBlogDashboard(
        'Latest Published blog post',
        'I’m Oppia! I’m an online personal tutor for everybody!',
        ['News', 'Volunteer', 'Stories', 'Languages']);
      await blogDashboardPage.navigateToPublishTab(5);
      await blogDashboardPage.expectNumberOfPublishedBlogPostsToBe(5);

      // Checking for blog posts on blog homepage.
      await blogPages.get();
      await blogPages.expectNumberOfBlogPostsToBe(10);
      await blogPages.moveToNextPage();
      await blogPages.expectNumberOfBlogPostsToBe(2);
      await blogPages.moveToPrevPage();
      await blogPages.expectNumberOfBlogPostsToBe(10);
    });

  it('should navigate to blog post pages, show correct blog post title and' +
  ' show correct blog post recommendations', async function() {
    await blogPages.navigateToBlogPostPage('Blog post Title Five');
    await blogPages.expectBlogPostPageTitleToBe('Blog post Title Five');
    await blogPages.expectBlogAuthorDetailsToBeVisible('blog');
    await blogPages.expectNumberOfRecommendationPostsToBe(2);
    await blogPages.expectRecommendationsToContainPostWithTitle(
      'Eight Article by blog author');
    await blogPages.expectRecommendationsToContainPostWithTitle(
      'Seventh Bloggers Post');

    await blogPages.navigateToBlogPostPageFromRecommendations(
      'Eight Article by blog author');
    await blogPages.expectBlogPostPageTitleToBe('Eight Article by blog author');
    await blogPages.expectBlogAuthorDetailsToBeVisible('blog');
    await blogPages.expectNumberOfRecommendationPostsToBe(2);
    await blogPages.expectRecommendationsToContainPostWithTitle(
      'Seventh Bloggers Post');
    await blogPages.expectRecommendationsToContainPostWithTitle(
      'Sixth Blog');

    await blogPages.navigateToBlogAuthorPage();
    await blogPages.expectBlogAuthorDetailsToBeVisible('blog');
    await blogPages.expectNumberOfBlogPostsOnAuthorPageToBe(7);

    await blogPages.navigateToBlogPostPage('Post Title Four');
    await blogPages.expectBlogPostPageTitleToBe('Post Title Four');
    await blogPages.navigateToBlogHomePageWithBackButton();

    await blogPages.navigateToBlogPostPage('Article number Nine');
    await blogPages.expectBlogPostPageTitleToBe('Article number Nine');
    await blogPages.expectBlogAuthorDetailsToBeVisible('secondUser');
    await blogPages.expectNumberOfRecommendationPostsToBe(2);
    await blogPages.expectRecommendationsToContainPostWithTitle(
      'Seventh Bloggers Post');
    await blogPages.expectRecommendationsToContainPostWithTitle(
      'Eight Article by blog author');

    await blogPages.navigateToBlogAuthorPage();
    await blogPages.expectBlogAuthorDetailsToBeVisible('secondUser');
    await blogPages.expectNumberOfBlogPostsOnAuthorPageToBe(5);

    await blogPages.navigateToBlogPostPage('Latest Published blog post');
    await blogPages.expectBlogPostPageTitleToBe('Latest Published blog post');
    await blogPages.expectNumberOfRecommendationPostsToBe(2);
    await blogPages.expectRecommendationsToContainPostWithTitle(
      'Sixth Blog');
    await blogPages.expectRecommendationsToContainPostWithTitle(
      '11th Published blog post');
    await blogPages.navigateToBlogHomePageWithBackButton();
  });

  it('should load correct search results on performing search using query and' +
  ' on applying tag filters', async function() {
    await blogPages.get();
    await blogPages.submitSearchQuery('blog');
    await blogPages.getBlogPostSearchPage('blog');
    await blogPages.expectNumberOfBlogPostsToBe(9);

    await blogPages.applyTagFilter(['Educators']);
    await blogPages.getBlogPostSearchPage('blog&tags=("Educators")');
    await blogPages.expectNumberOfBlogPostsToBe(3);

    await blogPages.applyTagFilter(['Stories', 'Languages']);
    await blogPages.getBlogPostSearchPage(
      'blog&tags=("Stories"%20OR%20"Languages")');
    await blogPages.expectNumberOfBlogPostsToBe(3);

    await blogPages.applyTagFilter(['Learners']);
    await blogPages.getBlogPostSearchPage('blog&tags=("Learners")');
    await blogPages.expectNumberOfBlogPostsToBe(1);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });

  afterAll(async function() {
    await users.logout();
  });
});
