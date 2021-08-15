// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for the classroom page.
 */

var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');

var BlogDashboardPage = require('../protractor_utils/BlogDashboardPage.js');

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
  });

  beforeEach(async function() {
    await blogDashboardPage.get();
  });

  it('should check that editor name and profile photo is visible',
    async function() {
      await blogDashboardPage.expectCurrUserToHaveProfilePhoto();
      await blogDashboardPage.expectCurrUsernameToBeVisible();
    });

  it('should create and delete a newly created blog post', async function() {
    await blogDashboardPage.createNewBlogPost();

    await blogDashboardPage.navigateToBlogDashboardPage();
    await blogDashboardPage.expectNumberOfBlogPostsToBe(1);

    await blogDashboardPage.deleteBlogPostWithIndex(0);
    await blogDashboardPage.expectNumberOfBlogPostsToBe(0);
  });

  it('should create, edit and delete a blog post from blog dashboard',
    async function() {
      await blogDashboardPage.createNewBlogPost();

      await blogDashboardPage.navigateToBlogDashboardPage();
      await blogDashboardPage.expectNumberOfBlogPostsToBe(1);

      await blogDashboardPage.navigateToBlogPostEditorWithIndex(0);
      await blogDashboardPage.saveBlogPostAsDraft(
        'Sample Title', await forms.toRichText(
          'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'));

      await blogDashboardPage.navigateToBlogDashboardPage();
      await blogDashboardPage.expectNumberOfBlogPostsToBe(1);

      await blogDashboardPage.deleteBlogPostWithIndex(0);
      await blogDashboardPage.expectNumberOfBlogPostsToBe(0);
    });

  it('should create, publish, unpublish and delete the blog post',
    async function() {
      await blogDashboardPage.createNewBlogPost();

      await blogDashboardPage.navigateToBlogDashboardPage();
      await blogDashboardPage.expectNumberOfBlogPostsToBe(1);

      await blogDashboardPage.navigateToBlogPostEditorWithIndex(0);
      await blogDashboardPage.publishBlogPost(
        'Sample Title', await forms.toRichText(
          'Hi there, I’m Oppia! I’m an online personal tutor for everybody!',
          [1, 3, 5]));

      await blogDashboardPage.navigateToBlogDashboardPage();
      await blogDashboardPage.navigateToDraftsTab();
      await blogDashboardPage.expectNumberOfBlogPostsToBe(0);

      await blogDashboardPage.navigateToBlogDashboardPage();
      await blogDashboardPage.navigateToPublishTab();
      await blogDashboardPage.expectNumberOfBlogPostsToBe(1);

      await blogDashboardPage.unpublishBlogPostWithIndex(0);
      await blogDashboardPage.expectNumberOfBlogPostsToBe(0);

      await blogDashboardPage.navigateToDraftsTab();
      await blogDashboardPage.expectNumberOfBlogPostsToBe(1);
      await blogDashboardPage.deleteBlogPostWithIndex(0);
      await blogDashboardPage.expectNumberOfBlogPostsToBe(0);
    });

  it('should create, publish, and delete the published blog post from' +
    ' dashboard.', async function() {
    await blogDashboardPage.createNewBlogPost();

    await blogDashboardPage.publishBlogPost(
      'Sample Title', await forms.toRichText(
        'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'),
      [1, 2, 3]);

    await blogDashboardPage.navigateToBlogDashboardPage();
    await blogDashboardPage.navigateToDraftsTab();
    await blogDashboardPage.expectNumberOfBlogPostsToBe(0);

    await blogDashboardPage.navigateToBlogDashboardPage();
    await blogDashboardPage.navigateToPublishTab();
    await blogDashboardPage.expectNumberOfBlogPostsToBe(1)(0, 'Sample Title');

    await blogDashboardPage.deleteBlogPostWithIndex(0);
    await blogDashboardPage.expectNumberOfBlogPostsToBe(0);
  });

  it('should create blog post, save it as draft and delete it from editor',
    async function() {
      await blogDashboardPage.createNewBlogPost();

      await blogDashboardPage.saveBlogPostAsDraft(
        'Sample Title', await forms.toRichText(
          'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'));

      await blogDashboardPage.navigateToBlogDashboardPage();
      await blogDashboardPage.navigateToDraftsTab();
      await blogDashboardPage.expectNumberOfBlogPostsToBe(1);

      await blogDashboardPage.navigateToBlogPostEditorWithIndex(0);
      await blogDashboardPage.deleteBlogPostFromEditor();

      await waitFor.pageToFullyLoad();
      expect(await browser.getCurrentUrl()).toEqual(
        'http://localhost:9001/blog-dashboard');
      await blogDashboardPage.navigateToDraftsTab();
      await blogDashboardPage.expectNumberOfBlogPostsToBe(0);
    });

  it('should check that blog post editor loads user profile',
    async function() {
      await blogDashboardPage.createNewBlogPost();

      await blogDashboardPage.expectCurrUserToHaveProfilePhoto();
      await blogDashboardPage.expectCurrUsernameToBeVisible();
    });

  it('should create multiple blog posts, publish a few and check for' +
  ' navigation through list view', async function() {
    await blogDashboardPage.createNewBlogPost();

    await blogDashboardPage.saveBlogPostAsDraft(
      'Sample Title1', await forms.toRichText(
        'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'));

    await blogDashboardPage.navigateToBlogDashboardPage();
    await blogDashboardPage.createNewBlogPost();
    await blogDashboardPage.saveBlogPostAsDraft(
      'Sample Title2', await forms.toRichText(
        'Hi there, I’m Oppia! I’m a tutor for everybody!'));

    await blogDashboardPage.navigateToBlogDashboardPage();
    await blogDashboardPage.createNewBlogPost();
    await blogDashboardPage.saveBlogPostAsDraft(
      'Sample Title3', await forms.toRichText(
        'Hi there, I’m Oppia! I’m a tutor for everybody here!'));

    await blogDashboardPage.navigateToBlogDashboardPage();
    await blogDashboardPage.expectNumberOfBlogPostsToBe(3);

    await blogDashboardPage.getListView();
    await blogDashboardPage.expectNumberOfBlogPostsRowsToBe(3);
    await blogDashboardPage.navigateToBlogPostEditorWithIndexFromList(2);

    await blogDashboardPage.publishBlogPost(
      'Sample', await forms.toRichText(
        'Hi there, I’m Oppia! I’m a tutor for everybody here!'),
      [1, 3, 5]);

    await blogDashboardPage.navigateToBlogDashboardPage();
    await blogDashboardPage.navigateToDraftsTab();
    await blogDashboardPage.expectNumberOfBlogPostsToBe(2);

    await blogDashboardPage.navigateToPublishedTab();
    await blogDashboardPage.expectNumberOfBlogPostsToBe(1);
  });


  it('should show an error if uploaded thumbnail is too large' +
  ' in blog post editor', async function() {
    await blogDashboardPage.createNewBlogPost();

    await waitFor.pageToFullyLoad();

    await blogDashboardPage.uploadThumbnail(
      '../data/dummy_large_image.jpg', false);
    await blogDashboardPage.expectUploadError();
    await blogDashboardPage.cancelThumbnailUpload();

    await blogDashboardPage.deleteBlogPostFromEditor();
  });

  afterAll(async function() {
    await users.logout();
  });
});
