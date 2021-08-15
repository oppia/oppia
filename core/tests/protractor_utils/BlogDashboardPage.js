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
 * @fileoverview Page object for the classroom page, for use
 * in Protractor tests.
 */

var action = require('./action.js');
var waitFor = require('./waitFor.js');
var forms = require('../protractor_utils/forms.js');
var workflow = require('../protractor_utils/workflow.js');
var general = require('../protractor_utils/general.js');

var BlogDashboardPage = function() {
  var currUserProfilePhoto = element(
    by.css('.protractor-test-profile-current-user-photo'));
  var createBlogPostButton = element(
    by.css('.protractor-test-create-blog-post-button'));
  var editBlogPostButton = element(
    by.css('.protractor-test-edit-blog-post-button'));
  var unpublishBlogPostButton = element(
    by.css('.protractor-test-unpublish-blog-post-button'));
  var deleteBlogPostButton = element(
    by.css('.protractor-test-delete-blog-post-button'));
  var draftTab = element(
    by.cssContainingText('.mat-tab-label', 'Drafts'));
  var publishTab = element(
    by.cssContainingText('.mat-tab-label', 'Published'));
  var BlogPostEditOptions = element.all(
    by.css('.protractor-test-blog-post-edit-box'));
  var BlogPostTitleFieldElement = element(
    by.css('.protractor-test-blog-post-title-field'));
  var listViewButton = element(
    by.css('.protractor-test-list-view-button'));
  var tilesViewButton = element(
    by.css('.protractor-test-tiles-view-button'));
  var matTabBody = element(by.tagName('mat-tab-body'));
  var blogPostsTable = matTabBody.element(
    by.css('.protractor-test-blog-post-table'));
  var blogPostListItems = element.all(
    by.css('.protractor-test-blog-post-list-item'));
  var blogPostTiles = element.all(
    by.css('.protractor-test-blog-post-tile-item'));
  var blogPostTags = element.all(
    by.css('.protractor-test-blog-post-tags'));
  var saveBlogPostAsDraft = element(
    by.css('.protractor-test-save-as-draft-button'));
  var publishBlogPost = element(
    by.css('.protractor-test-publish-blog-post-button'));
  var thumbnailClickable = element(
    by.css('.protractor-test-photo-clickable'));
  var customThumbnail = element(
    by.css('.protractor-test-custom-photo'));
  var thumbnailCropper = element(
    by.css('.protractor-test-photo-crop .cropper-container'));
  var thumbnailUploadError = element(
    by.css('.protractor-test-upload-error'));
  var saveBlogPostContentButton = element(
    by.css('.protractor-test-save-blog-post-content'));
  var blogPostContentDisplay = element(
    by.css('.protractor-test-content-display'));
  var confirmButton = element(
    by.css('.protractor-test-confirm-button'));
  var currUsername = element(
    by.css('.protractor-test-username-visible'));
  var cancelThumbnailUploadButton = element(
    by.css('.protractor-test-photo-upload-cancel'));
  this.get = async function() {
    await browser.get('/');
    await waitFor.pageToFullyLoad();
    await general.navigateToBlogDashboardPage();
    expect(await browser.getCurrentUrl()).toEqual(
      'http://localhost:9001/blog-dashboard');
  };

  this.navigateToBlogDashboardPage = async function() {
    await browser.get('/blog-dashboard');
    await waitFor.pageToFullyLoad();
  };

  // Only use this if the blog posts count is not zero. This is supposed
  // to be used for actions being performed on the blog posts like deleting,
  // editting etc.
  this.waitForBlogPostsToLoad = async function() {
    await waitFor.visibilityOf(
      blogPostsTable, 'Blog posts table taking too long to appear.');
  };

  this.createNewBlogPost = async function() {
    await action.click('Create Blog Post button', createBlogPostButton);

    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      BlogPostTitleFieldElement,
      'Blog Post Editor is taking too long to appear.');
    return await waitFor.pageToFullyLoad();
  };

  this.setContent = async function(richTextInstructions) {
    var schemaBasedEditorTag = element(by.tagName('schema-based-editor'));
    await waitFor.visibilityOf(
      schemaBasedEditorTag, 'Schema based editor tag not showing up');
    var richTextEditor = await forms.RichTextEditor(schemaBasedEditorTag);
    await richTextEditor.clear();
    await richTextInstructions(richTextEditor);
    await action.click('Save Content Button', saveBlogPostContentButton);
    await waitFor.invisibilityOf(
      saveBlogPostContentButton,
      'Content editor takes too long to disappear');
  };

  this.saveBlogPostAsDraft = async function(
      blogPostTitle, richTextInstructions) {
    await action.sendKeys(
      'New blog post title field', BlogPostTitleFieldElement, blogPostTitle);
    await this.setContent(richTextInstructions);
    await this.expectContentToMatch(richTextInstructions);
    await action.click('Save as draft Button', saveBlogPostAsDraft);
  };

  this.publishBlogPost = async function(
      blogPostTitle, richTextInstructions, tags) {
    await this.saveBlogPostAsDraft(blogPostTitle, richTextInstructions);
    await this.selectTags(tags);
    await this.setThumbnailImage();
    await action.click('Publish Blog Post', publishBlogPost);
  };

  this.selectTags = async function(tags) {
    for (let i = 0; i < tags.length; i++) {
      await action.click(
        'select blog post tag', blogPostTags.get(tags[i]));
    }
  };

  this.expectContentToMatch = async function(richTextInstructions) {
    await forms.expectRichText(blogPostContentDisplay).toMatch(
      richTextInstructions);
  };

  this.navigateToPublishedTab = async function() {
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      publishTab, 'Unable to find publish tab button');
    await action.click('Publish Tab', publishTab);
  };

  this.navigateToDraftsTab = async function() {
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      draftTab, 'Unable to find drafts tab button');
    await action.click('Draft Tab', draftTab);
  };

  this.expectNumberOfBlogPostsToBe = async function(number) {
    await this.waitForBlogPostsToLoad();
    expect(await blogPostTiles.count()).toBe(number);
  };

  this.expectNumberOfBlogPostsRowsToBe = async function(number) {
    await this.waitForBlogPostsToLoad();
    expect(await blogPostListItems.count()).toBe(number);
  };

  this.navigateToBlogPostEditorWithIndexFromList = async function(index) {
    await action.click('blog post row', blogPostListItems.get(index));
    await waitFor.pageToFullyLoad();
  };

  this.getBlogPostCount = async function() {
    return await BlogPostListItems.count();
  };

  this.deleteBlogPostWithIndex = async function(index) {
    await this.waitForBlogPostsToLoad();
    await action.click(
      'Blog post edit option', BlogPostEditOptions.get(index));
    await action.click('Delete blog post button', deleteBlogPostButton);
    await action.click(
      'Confirm Delete Blog Post button', confirmButton);
    await waitFor.pageToFullyLoad();
  };

  this.deleteBlogPostFromEditor = async function() {
    await waitFor.visibilityOf(
      deleteBlogPostButton, 'Unable to find delete button');
    await action.click('Delete blog post button', deleteBlogPostButton);
    await action.click(
      'Confirm Delete Blog Post button', confirmButton);
    await waitFor.pageToFullyLoad();
  };

  this.unpublishBlogPostWithIndex = async function(index) {
    await this.waitForBlogPostsToLoad();
    await action.click(
      'Blog post edit option', BlogPostEditOptions.get(index));
    await action.click('Unpublish blog post button', unpublishBlogPostButton);
    await action.click(
      'Confirm unpublishing Blog Post button', confirmButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToBlogPostEditorWithIndex = async function(index) {
    await this.waitForBlogPostsToLoad();
    await action.click(
      'Blog post edit option', BlogPostEditOptions.get(index));
    await action.click(
      'Edit blog post button', editBlogPostButton);
    await waitFor.pageToFullyLoad();
  };

  this.getListView = async function() {
    await waitFor.visibilityOf(
      listViewButton, 'Unable to find list view button');
    await action.click('List View Button', listViewButton);
  };

  this.getTilesView = async function() {
    await waitFor.visibilityOf(
      tilesViewButton, 'Unable to find tiles view button');
    await action.click('Tiles View Button', tilesViewButton);
  };

  this.expectCurrUserToHaveProfilePhoto = async function() {
    await waitFor.visibilityOf(
      currUserProfilePhoto,
      'Current user profile photo taking too long to display');
  };

  this.expectCurrUsernameToBeVisible = async function() {
    await waitFor.visibilityOf(
      currUsername,
      'Current user name taking too long to display');
  };

  this.expectUploadError = async function() {
    expect(await thumbnailUploadError.isDisplayed()).toBe(true);
  };

  this.uploadThumbnail = async function(imgPath, resetExistingImage) {
    return await workflow.uploadImage(
      thumbnailClickable, imgPath, resetExistingImage);
  };

  this.submitThumbnail = async function(imgPath, resetExistingImage) {
    return await workflow.submitImage(
      thumbnailClickable, thumbnailCropper, imgPath, resetExistingImage);
  };

  this.getThumbnailSource = async function() {
    return await workflow.getImageSource(customThumbnail);
  };

  this.cancelThumbnailUpload = async function() {
    await action.click('Cancel upload', cancelThumbnailUploadButton);
  };

  this.setThumbnailImage = async function() {
    var defaultThumbnailSource = (
      await this.getThumbnailSource());
    await this.submitThumbnail('../data/img.png', false);
    var newThumbnailSource = await this.getThumbnailSource();
    expect(defaultThumbnailSource).not.toEqual(newThumbnailSource);
  };
};

exports.BlogDashboardPage = BlogDashboardPage;
