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
 * @fileoverview Page object for the blog Dashboard page, for use
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
  var matTabLabels = element.all(by.css('.mat-tab-label'));
  var draftTab = matTabLabels.get(0);
  var publishTab = matTabLabels.get(1);
  var blogPostEditOptions = element.all(
    by.css('.protractor-test-blog-post-edit-box'));
  var blogPostContentEditor = element(
    by.css('.protractor-test-content-editor'));
  var blogPostTitleFieldElement = element(
    by.css('.protractor-test-blog-post-title-field'));
  var listViewButton = element(
    by.css('.protractor-test-list-view-button'));
  var tilesViewButton = element(
    by.css('.protractor-test-tiles-view-button'));
  var draftBlogPostsTable = element(
    by.css('.protractor-test-drafts-blog-post-table'));
  var publishedBlogPostsTable = element(
    by.css('.protractor-test-published-blog-post-table'));
  var blogPostListItems = element.all(
    by.css('.protractor-test-blog-post-list-item'));
  var draftBlogPostTiles = element.all(
    by.css('.protractor-test-draft-blog-post-tile-item'));
  var publishedBlogPostTiles = element.all(
    by.css('.protractor-test-published-blog-post-tile-item'));
  var blogPostTags = element.all(
    by.css('.protractor-test-blog-post-tags'));
  var saveBlogPostAsDraftButton = element(
    by.css('.protractor-test-save-as-draft-button'));
  var publishBlogPostButton = element(
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
  var blogDashboardIntroMessageContainer = element(
    by.css('.protractor-test-intro-message-container'));
  var closeBlogCardPreviewButton = element(
    by.css('.protractor-test-close-preview-button'));
  var blogCardPreviewButton = element(
    by.css('.protractor-test-blog-card-preview-button'));
  var blogDashboardLink = element(by.css(
    '.protractor-test-blog-dashboard-link'));

  this.get = async function() {
    await browser.get('/');
    await waitFor.pageToFullyLoad();
    await general.openProfileDropdown();
    await action.click(
      'Blog dashboard link from dropdown', blogDashboardLink);
    await waitFor.pageToFullyLoad();
    await waitFor.urlRedirection('http://localhost:9001/blog-dashboard');
  };

  this.navigateToBlogDashboardPage = async function() {
    await browser.get('/blog-dashboard');
    await waitFor.pageToFullyLoad();
  };

  this.waitForDraftsBlogPostsToLoad = async function() {
    await waitFor.visibilityOf(
      draftBlogPostsTable, 'Blog posts table taking too long to appear.');
  };

  this.showAndCloseBlogCardPreview = async function() {
    await action.click('Preview Button', blogCardPreviewButton);
    await waitFor.visibilityOf(
      currUserProfilePhoto,
      'Current user profile photo taking too long to display');
    await waitFor.visibilityOf(
      currUsername,
      'Current user name taking too long to display');
    await action.click('Close Preview', closeBlogCardPreviewButton);
  };

  this.waitForPublishedBlogPostsToLoad = async function() {
    await waitFor.visibilityOf(
      publishedBlogPostsTable, 'Blog posts table taking too long to appear.');
  };

  this.createNewBlogPost = async function() {
    await action.click('Create Blog Post button', createBlogPostButton);

    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      blogPostTitleFieldElement,
      'Blog Post Editor is taking too long to appear.');
    await waitFor.pageToFullyLoad();
  };

  this.setContent = async function(richTextInstructions) {
    var schemaBasedEditorTag = blogPostContentEditor.element(
      by.tagName('schema-based-editor'));
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
      'New blog post title field', blogPostTitleFieldElement, blogPostTitle);
    await this.setContent(richTextInstructions);
    await waitFor.visibilityOf(
      blogPostContentDisplay, 'Blog Post content not showing up');
    await action.click('Save as draft Button', saveBlogPostAsDraftButton);
    await waitFor.visibilityOfSuccessToast('Blog Post Saved Successfully.');
  };

  this.publishNewBlogPost = async function(
      blogPostTitle, richTextInstructions, tags) {
    await action.sendKeys(
      'New blog post title field', blogPostTitleFieldElement, blogPostTitle);
    await this.selectTags(tags);
    await this.setContent(richTextInstructions);
    await waitFor.visibilityOf(
      blogPostContentDisplay, 'Blog Post content not showing up');
    await this.setThumbnailImage();
    await action.click('Publish Blog Post Button', publishBlogPostButton);
    await action.click(
      'Confirm Publish Blog Post button', confirmButton);
    await waitFor.visibilityOfSuccessToast(
      'Blog Post Saved and Published Succesfully.');
  };

  this.publishDraftBlogPost = async function(tags) {
    await blogDashboardPage.selectTags(tags);
    await blogDashboardPage.setThumbnailImage();
    await action.click('Publish Blog Post Button', publishBlogPostButton);
    await action.click(
      'Confirm Publish Blog Post button', confirmButton);
    await waitFor.visibilityOfSuccessToast(
      'Blog Post Saved and Published Succesfully.');
  };

  this.selectTags = async function(tags) {
    for (let i = 0; i < tags.length; i++) {
      await action.click(
        'select blog post tag', blogPostTags.get(tags[i]));
    }
  };

  this.navigateToPublishTab = async function() {
    await waitFor.pageToFullyLoad();
    await action.click('Publish Tab', publishTab);
  };

  this.navigateToDraftsTab = async function() {
    await waitFor.pageToFullyLoad();
    await action.click('Draft Tab', draftTab);
  };

  this.expectNumberOfDraftBlogPostsToBe = async function(number) {
    var isPresent = await blogDashboardIntroMessageContainer.isPresent();
    if (!isPresent) {
      await this.waitForDraftsBlogPostsToLoad();
    }
    expect(await draftBlogPostTiles.count()).toBe(number);
  };

  this.expectNumberOfPublishedBlogPostsToBe = async function(number) {
    var isPresent = await blogDashboardIntroMessageContainer.isPresent();
    if (!isPresent) {
      await this.waitForPublishedBlogPostsToLoad();
    }
    expect(await publishedBlogPostTiles.count()).toBe(number);
  };

  this.expectNumberOfBlogPostsRowsToBe = async function(number) {
    var isPresent = await blogDashboardIntroMessageContainer.isPresent();
    if (!isPresent) {
      await this.waitForDraftsBlogPostsToLoad();
    }
    expect(await blogPostListItems.count()).toBe(number);
  };

  this.navigateToBlogPostEditorWithIndexFromList = async function(index) {
    await action.click('blog post row', blogPostListItems.get(index));
    await waitFor.pageToFullyLoad();
  };

  this.deleteBlogPostWithIndex = async function(index) {
    await action.click(
      'Blog post edit option', blogPostEditOptions.get(index));
    await action.click('Delete blog post button', deleteBlogPostButton);
    await action.click(
      'Confirm Delete Blog Post button', confirmButton);
    await waitFor.visibilityOfSuccessToast('Blog Post Deleted Successfully.');
    await waitFor.pageToFullyLoad();
  };

  this.deleteBlogPostFromEditor = async function() {
    await action.click('Delete blog post button', deleteBlogPostButton);
    await action.click(
      'Confirm Delete Blog Post button', confirmButton);
    await waitFor.visibilityOfSuccessToast('Blog Post Deleted Successfully.');
    await waitFor.pageToFullyLoad();
  };

  this.unpublishBlogPostWithIndex = async function(index) {
    await this.waitForPublishedBlogPostsToLoad();
    await action.click(
      'Blog post edit option', blogPostEditOptions.get(index));
    await action.click('Unpublish blog post button', unpublishBlogPostButton);
    await action.click(
      'Confirm unpublishing Blog Post button', confirmButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToBlogPostEditorWithIndex = async function(index) {
    await action.click(
      'Blog post edit option', blogPostEditOptions.get(index));
    await action.click(
      'Edit blog post button', editBlogPostButton);
    await waitFor.pageToFullyLoad();
  };

  this.getListView = async function() {
    await action.click('List View Button', listViewButton);
  };

  this.getTilesView = async function() {
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
    await waitFor.visibilityOf(
      thumbnailUploadError,
      'Thumbnail upload error taking too long to display');
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
    await this.submitThumbnail('../data/img.png', false);
    var newThumbnailSource = await this.getThumbnailSource();
    expect(newThumbnailSource).not.toEqual('');
    await waitFor.visibilityOfSuccessToast('Thumbnail Saved Successfully.');
  };
};

exports.BlogDashboardPage = BlogDashboardPage;
