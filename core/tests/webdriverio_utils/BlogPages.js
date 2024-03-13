// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the blog pages, for use in WebdriverIO
 * tests.
 */

var action = require('./action.js');
var waitFor = require('./waitFor.js');
var general = require('./general.js');
var BlogDashboardPage = require('./BlogDashboardPage.js');
var forms = require('../webdriverio_utils/forms.js');

var BlogPages = function () {
  var blogDashboardPage = new BlogDashboardPage.BlogDashboardPage();
  var noResultsFoundContainer = $('.e2e-test-no-results-found');
  var oppiaBlogHomePageCardContainer = $('.e2e-test-oppia-blog-home-page-card');
  var oppiaAuthorProfilePageCardContainer = $(
    '.e2e-test-oppia-author-profile-page-card'
  );
  var blogHomepageWelcomeHeading = $('.e2e-test-blog-welcome-heading');
  var oppiaAvatarImage = $('.e2e-test-oppia-avatar-image');
  var oppiaBlogPostPageContainer = $('.e2e-test-oppia-blog-post-page-card');
  var blogPostTitleContainer = $('.e2e-test-blog-post-page-title-container');
  var authorProfilePhoto = $('.e2e-test-author-profile-photo');
  var authorNameContainer = $('.e2e-test-author-name');
  var blogPostTagFilter = $('.e2e-test-tag-filter-component');
  var blogPostSearchField = $('.e2e-test-search-field');
  var blogPostsList = $('.e2e-test-blog-post-list');
  var navigateToBlogHomePageButton = $('.e2e-test-back-button');
  var paginationNextButton = $('.e2e-test-pagination-next-button');
  var paginationPrevButton = $('.e2e-test-pagination-prev-button');
  var paginationContainer = $('.e2e-test-pagination');
  var searchInput = $('.e2e-test-search-input');
  var blogPostTilesSelector = function () {
    return $$('.e2e-test-blog-post-tile-item');
  };

  this.submitSearchQuery = async function (searchQuery) {
    await action.clear('Search input', searchInput);
    await action.setValue('Search input', searchInput, searchQuery);
  };

  this.get = async function () {
    await browser.url(general.BLOG_PAGE_URL_SUFFIX);
    await waitFor.pageToFullyLoad();
  };

  this.getBlogPostSearchPage = async function (searchQuery) {
    await browser.url(
      general.BLOG_PAGE_SEARCH_URL_PREFIX + '?q=' + searchQuery
    );
    await waitFor.pageToFullyLoad();
  };

  this.expectNoResultsFoundShown = async function () {
    await this.waitForVisibilityOfBlogHomePageContainer();
    await waitFor.visibilityOf(
      noResultsFoundContainer,
      'No results found container taking too long to display'
    );
  };

  this.expectBlogHomePageWelcomeHeadingToBeVisible = async function () {
    await waitFor.visibilityOf(
      blogHomepageWelcomeHeading,
      'Blog Home Page Heading taking too long to display'
    );
  };

  this.expectOppiaAvatarImageToBeVisible = async function () {
    await waitFor.visibilityOf(
      oppiaAvatarImage,
      'Oppia Avatar image taking too long to display'
    );
  };

  this.expectTagFilterComponentToBeVisible = async function () {
    await waitFor.visibilityOf(
      blogPostTagFilter,
      'Tag Filter component taking too long to display'
    );
  };

  this.publishNewBlogPostFromBlogDashboard = async function (
    blogPostTitle,
    richTextContent,
    tagsList
  ) {
    await blogDashboardPage.createNewBlogPost();
    await blogDashboardPage.publishNewBlogPost(
      blogPostTitle,
      await forms.toRichText(richTextContent),
      tagsList
    );
    await blogDashboardPage.navigateToBlogDashboardPageWithBackButton();
  };

  this.saveBlogPostAsDraftFromBlogDashboard = async function (
    blogPostTitle,
    richTextContent
  ) {
    await blogDashboardPage.createNewBlogPost();
    await blogDashboardPage.saveBlogPostAsDraft(
      blogPostTitle,
      await forms.toRichText(richTextContent)
    );
    await blogDashboardPage.navigateToBlogDashboardPageWithBackButton();
  };

  this.expectBlogPostSearchFieldToBeVisible = async function () {
    await waitFor.visibilityOf(
      blogPostSearchField,
      'Search Field taking too long to display'
    );
  };

  this.expectNumberOfBlogPostsToBe = async function (number) {
    await this.waitForVisibilityOfBlogHomePageContainer();
    await this.waitForBlogPostsToLoad();
    var blogPostTiles = await blogPostTilesSelector();
    expect(blogPostTiles.length).toBe(number);
  };

  this.expectNumberOfBlogPostsOnAuthorPageToBe = async function (number) {
    await waitFor.visibilityOf(
      oppiaAuthorProfilePageCardContainer,
      'Oppia Author Profile Page Card taking too long to display'
    );
    await this.waitForBlogPostsToLoad();
    var blogPostTiles = await blogPostTilesSelector();
    expect(blogPostTiles.length).toBe(number);
  };

  this.waitForVisibilityOfBlogHomePageContainer = async function () {
    await waitFor.visibilityOf(
      oppiaBlogHomePageCardContainer,
      'Oppia Blog Home Page taking too long to display'
    );
  };

  this.waitForBlogPostsToLoad = async function () {
    await waitFor.visibilityOf(
      blogPostsList,
      'Blog posts list taking too long to appear.'
    );
  };

  this.applyTagFilter = async function (keywords) {
    await waitFor.visibilityOf(
      blogPostTagFilter,
      'Blog Post Tags filter parent taking too long to appear.'
    );
    var tagFilterInput = blogPostTagFilter.$(
      '.e2e-test-tag-filter-selection-input'
    );
    await action.click('Tag Filter', tagFilterInput);
    for (i = 0; i < keywords.length; i++) {
      // Here Newline Character is used as ENTER KEY.
      await action.setValue(
        'Blog Post Tag filter dropdown ',
        tagFilterInput,
        keywords[i] + '\n'
      );
    }
  };

  this.navigateToBlogPostPage = async function (title) {
    await this.waitForBlogPostsToLoad();
    var blogPostTiles = await blogPostTilesSelector();
    for (i = 0; i < blogPostTiles.length; i++) {
      var blogPostTile = blogPostTiles[i];
      var blogPostTitleContainer = await blogPostTile.$(
        '.e2e-test-blog-post-tile-title'
      );
      // The element is not interactable when we call getText(), so it returns
      // null. To avoid that we are waiting till the element becomes clicakble
      // as we do not have any alternative for checking interactibility.
      await waitFor.elementToBeClickable(
        blogPostTitleContainer,
        'Blog Post title is not interactable'
      );
      var blogPostTitle = await action.getText(
        `Blog Post Tile Title ${i}`,
        blogPostTitleContainer
      );
      if (blogPostTitle === title) {
        await action.click('blog post tile', blogPostTile);
        await waitFor.pageToFullyLoad();
        break;
      }
    }
  };

  this.expectBlogPostPageTitleToBe = async function (title) {
    await waitFor.visibilityOf(
      oppiaBlogPostPageContainer,
      'Oppia Blog Post Page taking too long to display'
    );
    await waitFor.visibilityOf(
      blogPostTitleContainer,
      'Oppia Blog Post Page taking too long to display'
    );
    var blogPostTitle = await action.getText(
      'Blog Post Title',
      blogPostTitleContainer
    );
    expect(blogPostTitle).toEqual(title);
  };

  this.navigateToBlogHomePageWithBackButton = async function () {
    await action.click(
      'button to navigate back to blog home page',
      navigateToBlogHomePageButton
    );
    await waitFor.pageToFullyLoad();
    await this.waitForVisibilityOfBlogHomePageContainer();
  };

  this.navigateToBlogAuthorPage = async function () {
    // The element is not interactable when we call getText(), so it returns
    // null. To avoid that we are waiting till the element becomes clicakble
    // as we do not have any alternative for checking interactibility.
    await waitFor.elementToBeClickable(
      authorProfilePhoto,
      'Author Profile photo is not interactable'
    );
    await action.click('author profile photo', authorProfilePhoto);
    await waitFor.pageToFullyLoad();
  };

  this.expectNumberOfRecommendationPostsToBe = async function (number) {
    if (number) {
      await this.waitForBlogPostsToLoad();
    } else {
      expect(await blogPostsList.isDisplayed()).toBe(false);
    }
    var blogPostRecommendationTiles = await blogPostTilesSelector();
    expect(blogPostRecommendationTiles.length).toBe(number);
  };

  this.expectRecommendationsToContainPostWithTitle = async function (title) {
    await this.waitForBlogPostsToLoad();
    var blogPostRecommendationTiles = await blogPostTilesSelector();
    var titleList = await Promise.all(
      blogPostRecommendationTiles.map(async function (blogPostTile) {
        var blogPostTitle = await blogPostTile.$(
          '.e2e-test-blog-post-tile-title'
        );
        var blogPostTitleText = await action.getText(
          'Blog Post Tile Title',
          blogPostTitle
        );
        return blogPostTitleText;
      })
    );
    expect(titleList).toContain(title);
  };

  this.navigateToBlogPostPageFromRecommendations = async function (title) {
    await this.waitForBlogPostsToLoad();
    var blogPostTiles = await blogPostTilesSelector();
    for (i = 0; i < blogPostTiles.length; i++) {
      var blogPostTile = blogPostTiles[i];
      var blogPostTitleContainer = await blogPostTile.$(
        '.e2e-test-blog-post-tile-title'
      );
      // The element is not interactable when we call getText(), so it returns
      // null. To avoid that we are waiting till the element becomes clicakble
      // as we do not have any alternative for checking interactibility.
      await waitFor.elementToBeClickable(
        blogPostTitleContainer,
        'Blog Post title is not interactable'
      );
      var blogPostTitle = await action.getText(
        `Blog Post Tile Title ${i}`,
        blogPostTitleContainer
      );
      if (blogPostTitle === title) {
        await action.click('blog post tile', blogPostTile);
        await waitFor.pageToFullyLoad();
        break;
      }
    }
  };

  this.expectBlogAuthorDetailsToBeVisible = async function (authorName) {
    await waitFor.visibilityOf(
      authorNameContainer,
      'Author name taking too long to display'
    );
    var name = await action.getText('author Name', authorNameContainer);
    expect(name).toBe(authorName);
    await waitFor.visibilityOf(
      authorProfilePhoto,
      'Author Profile photo taking too long to display'
    );
  };

  this.moveToNextPage = async function () {
    await waitFor.visibilityOf(
      paginationContainer,
      'Pagination taking to long to display.'
    );
    await action.click('pagination next button', paginationNextButton);
  };

  this.moveToPrevPage = async function () {
    await waitFor.visibilityOf(
      paginationContainer,
      'Pagination taking to long to display.'
    );
    await action.click('pagination prev button', paginationPrevButton);
  };
};

exports.BlogPages = BlogPages;
