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
 * @fileoverview End-to-end tests for the blog Dashboard page.
 */

var forms = require('../webdriverio_utils/forms.js');
var users = require('../webdriverio_utils/users.js');
var general = require('../webdriverio_utils/general.js');

var BlogDashboardPage = require('../webdriverio_utils/BlogDashboardPage.js');

describe('Blog dashboard functionality', function() {
  var blogDashboardPage = null;

  beforeAll(async function() {
    blogDashboardPage = (
      new BlogDashboardPage.BlogDashboardPage());
    await users.createUserWithRole(
      'blog@blogDashboard.com',
      'blog',
      'blog admin');
    await users.login('blog@blogDashboard.com');
    await blogDashboardPage.get();
  });

  it('should check user profile is visible on both blog dashboard and editor,' +
  ' create, edit and delete a blog post from blog dashboard', async function() {
    await blogDashboardPage.updateAuthorDetails('blog', 'Oppia Blog Author');
    await blogDashboardPage.expectCurrUserToHaveProfilePhoto();
    await blogDashboardPage.expectCurrUsernameToBeVisible();
    await blogDashboardPage.blogDashboardIntroMessageIsVisible();

    await blogDashboardPage.createNewBlogPost();
    await blogDashboardPage.expectCurrUserToHaveProfilePhoto();
    await blogDashboardPage.expectCurrUsernameToBeVisible();

    await blogDashboardPage.navigateToBlogDashboardPageWithBackButton();
    await blogDashboardPage.expectNumberOfDraftBlogPostsToBe(1);

    await blogDashboardPage.navigateToBlogPostEditorWithTitle('Untitled');
    await blogDashboardPage.saveBlogPostAsDraft(
      'Sample blog Title', await forms.toRichText(
        'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'));
    await blogDashboardPage.navigateToBlogDashboardPageWithBackButton();
    await blogDashboardPage.expectNumberOfDraftBlogPostsToBe(1);
    await blogDashboardPage.deleteBlogPostWithTitle('Sample blog Title');
    await blogDashboardPage.blogDashboardIntroMessageIsVisible();
  });

  it('should create, publish, and delete the published blog post from' +
    ' dashboard.', async function() {
    await blogDashboardPage.createNewBlogPost();
    await blogDashboardPage.publishNewBlogPost(
      'Sample blog post Title', await forms.toRichText(
        'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'),
      ['News', 'International', 'Educators', 'Learners']);
    await blogDashboardPage.navigateToBlogDashboardPageWithBackButton();
    await blogDashboardPage.navigateToDraftsTab();
    await blogDashboardPage.expectNumberOfDraftBlogPostsToBe(0);

    await blogDashboardPage.navigateToPublishTab();
    await blogDashboardPage.expectNumberOfPublishedBlogPostsToBe(1);
    await blogDashboardPage.deleteBlogPostWithTitle('Sample blog post Title');
    await blogDashboardPage.blogDashboardIntroMessageIsVisible();
  });

  it('should create, publish, check for thumbnail uploading error,' +
  ' unpublish and delete the blog post', async function() {
    await blogDashboardPage.createNewBlogPost();
    await blogDashboardPage.navigateToBlogDashboardPageWithBackButton();
    await blogDashboardPage.expectNumberOfDraftBlogPostsToBe(1);

    await blogDashboardPage.navigateToBlogPostEditorWithTitle('Untitled');

    await blogDashboardPage.uploadThumbnail(
      '../data/dummy_large_image.jpg', false);
    await blogDashboardPage.expectUploadError();
    await blogDashboardPage.cancelThumbnailUpload();

    await blogDashboardPage.publishNewBlogPost(
      'Sample Blog Post', await forms.toRichText(
        'Hi there, I’m Oppia! I’m an online personal tutor for everybody!')
      , ['News', 'Learners']);

    await blogDashboardPage.navigateToBlogDashboardPageWithBackButton();
    await blogDashboardPage.navigateToPublishTab();
    await blogDashboardPage.expectNumberOfPublishedBlogPostsToBe(1);
    await blogDashboardPage.unpublishBlogPostWithTitle('Sample Blog Post');
    await blogDashboardPage.navigateToDraftsTab();
    await blogDashboardPage.navigateToPublishTab();
    await blogDashboardPage.expectNumberOfPublishedBlogPostsToBe(0);

    await blogDashboardPage.navigateToDraftsTab();
    await blogDashboardPage.expectNumberOfDraftBlogPostsToBe(1);
    await blogDashboardPage.deleteBlogPostWithTitle('Sample Blog Post');
    await blogDashboardPage.blogDashboardIntroMessageIsVisible();
  });

  it('should create multiple blog posts both published and drafts and' +
  ' check for navigation through list view', async function() {
    await blogDashboardPage.createNewBlogPost();
    await blogDashboardPage.saveBlogPostAsDraft(
      'Sample Title1', await forms.toRichText(
        'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'));
    await blogDashboardPage.navigateToBlogDashboardPageWithBackButton();

    await blogDashboardPage.createNewBlogPost();
    await blogDashboardPage.saveBlogPostAsDraft(
      'Sample Title2', await forms.toRichText(
        'Hi there, I’m Oppia! I’m a tutor for everybody!'));
    await blogDashboardPage.navigateToBlogDashboardPageWithBackButton();

    await blogDashboardPage.createNewBlogPost();
    await blogDashboardPage.saveBlogPostAsDraft(
      'Sample Title3', await forms.toRichText(
        'Hi there, I’m Oppia! I’m a tutor for everybody here!'));
    await blogDashboardPage.navigateToBlogDashboardPageWithBackButton();

    await blogDashboardPage.expectNumberOfDraftBlogPostsToBe(3);

    await blogDashboardPage.getListView();
    await blogDashboardPage.expectNumberOfBlogPostsRowsToBe(3);
    await blogDashboardPage.navigateToBlogPostEditorWithTitleFromList(
      'Sample Title2');
    await blogDashboardPage.publishDraftBlogPost(
      ['News', 'International', 'Educators', 'Learners',
        'Software development', 'Content']);
    await blogDashboardPage.navigateToBlogDashboardPageWithBackButton();
    await blogDashboardPage.navigateToDraftsTab();

    await blogDashboardPage.getListView();
    await blogDashboardPage.expectNumberOfBlogPostsRowsToBe(2);

    await blogDashboardPage.getTilesView();
    await blogDashboardPage.expectNumberOfDraftBlogPostsToBe(2);

    await blogDashboardPage.navigateToPublishTab();
    await blogDashboardPage.expectNumberOfPublishedBlogPostsToBe(1);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });

  afterAll(async function() {
    await users.logout();
  });
});
