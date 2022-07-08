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

const { element } = require('protractor');
var action = require('./action.js');
var waitFor = require('./waitFor.js');
var forms = require('../protractor_utils/forms.js');
var workflow = require('../protractor_utils/workflow.js');
var general = require('../protractor_utils/general.js');

var BlogDashboardPage = function() {
  var currUserProfilePhoto = element(
    by.css('.e2e-test-profile-current-user-photo'));
  var createBlogPostButton = element(
    by.css('.e2e-test-create-blog-post-button'));
  var editBlogPostButton = element(
    by.css('.e2e-test-edit-blog-post-button'));
  var unpublishBlogPostButton = element(
    by.css('.e2e-test-unpublish-blog-post-button'));
  var deleteBlogPostButton = element(
    by.css('.e2e-test-delete-blog-post-button'));
  var matTabLabels = element.all(by.css('.mat-tab-label'));
  var blogPostEditOptions = by.css(
    '.e2e-test-blog-post-edit-box');
  var blogPostContentEditor = element(
    by.css('.e2e-test-content-editor'));
  var blogPostTitleFieldElement = element(
    by.css('.e2e-test-blog-post-title-field'));
  var listViewButton = element(
    by.css('.e2e-test-list-view-button'));
  var tilesViewButton = element(
    by.css('.e2e-test-tiles-view-button'));
  var draftBlogPostsTable = element(
    by.css('.e2e-test-drafts-blog-post-table'));
  var publishedBlogPostsTable = element(
    by.css('.e2e-test-published-blog-post-table'));
  var blogPostListItems = element.all(
    by.css('.e2e-test-blog-post-list-item'));
  var draftBlogPostTiles = element.all(
    by.css('.e2e-test-draft-blog-post-tile-item'));
  var publishedBlogPostTiles = element.all(
    by.css('.e2e-test-published-blog-post-tile-item'));
  var blogPostTags = element.all(
    by.css('.e2e-test-blog-post-tags'));
  var saveBlogPostAsDraftButton = element(
    by.css('.e2e-test-save-as-draft-button'));
  var publishBlogPostButton = element(
    by.css('.e2e-test-publish-blog-post-button'));
  var thumbnailClickable = element(
    by.css('.e2e-test-photo-clickable'));
  var customThumbnail = element(
    by.css('.e2e-test-custom-photo'));
  var thumbnailCropper = element(
    by.css('.e2e-test-photo-crop .cropper-container'));
  var thumbnailUploadError = element(
    by.css('.e2e-test-upload-error'));
  var saveBlogPostContentButton = element(
    by.css('.e2e-test-save-blog-post-content'));
  var blogPostContentDisplay = element(
    by.css('.e2e-test-content-display'));
  var confirmButton = element(
    by.css('.e2e-test-confirm-button'));
  var currUsername = element(
    by.css('.e2e-test-username-visible'));
  var cancelThumbnailUploadButton = element(
    by.css('.e2e-test-photo-upload-cancel'));
  var blogDashboardIntroMessageContainer = element(
    by.css('.e2e-test-intro-message-container'));
  var closeBlogCardPreviewButton = element(
    by.css('.e2e-test-close-preview-button'));
  var blogCardPreviewButton = element(
    by.css('.e2e-test-blog-card-preview-button'));
  var blogDashboardLink = element(by.css(
    '.e2e-test-blog-dashboard-link'));
  var blogPostTiles = element.all(by.css(
    '.e2e-test-blog-dashboard-tile'));
  var blogPostTileTitle = by.css(
    '.e2e-test-blog-post-title');
  var navigateToBlogDashboardButton = element(
    by.css('.e2e-test-back-button'));

  this.get = async function() {
    await waitFor.pageToFullyLoad();
    await general.openProfileDropdown();
    await action.click(
      'Blog dashboard link from dropdown', blogDashboardLink);
    await waitFor.pageToFullyLoad();
    await waitFor.urlRedirection('http://localhost:9001/blog-dashboard');
  };

  this.navigateToBlogDashboardPageWithBackButton = async function() {
    await action.click(
      'Navigate back to blog dashboard button', navigateToBlogDashboardButton);
    await waitFor.pageToFullyLoad();
  };

  this.waitForDraftBlogPostsToLoad = async function() {
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
    await waitFor.presenceOf(
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
    await waitFor.presenceOf(
      blogPostContentDisplay, 'Blog Post content not showing up');
    await this.setThumbnailImage();
    await action.click('Publish Blog Post Button', publishBlogPostButton);
    await action.click(
      'Confirm Publish Blog Post button', confirmButton);
    await waitFor.visibilityOfSuccessToast(
      'Blog Post Saved and Published Succesfully.');
  };

  this.publishDraftBlogPost = async function(tags) {
    await this.selectTags(tags);
    await this.setThumbnailImage();
    await action.click('Publish Blog Post Button', publishBlogPostButton);
    await action.click(
      'Confirm Publish Blog Post button', confirmButton);
    await waitFor.visibilityOfSuccessToast(
      'Blog Post Saved and Published Succesfully.');
  };

  this.selectTags = async function(tags) {
    await waitFor.visibilityOf(
      blogPostTags.first(), 'Tags take too long to appear.');
    for (i = 0; i < await blogPostTags.count(); i++) {
      var tag = blogPostTags.get(i);
      var tagName = await action.getText(
        `Blog Post Editor tag ${i}`, tag);
      if (tags.includes(tagName)) {
        await action.click(
          'select blog post tag', tag);
      }
    }
  };

  this.getMatTab = async function(tabName) {
    await waitFor.visibilityOf(
      matTabLabels.first(), 'Mat Tab Toggle options take too long to appear.');
    for (i = 0; i < await matTabLabels.count(); i++) {
      var matTab = matTabLabels.get(i);
      var tabText = await action.getText(
        `Blog Dashboard tab ${i}`, matTab);
      if (tabText.startsWith(tabName)) {
        await action.click(`${tabName} tab`, matTab);
        break;
      }
    }
  };

  this.navigateToPublishTab = async function() {
    await waitFor.pageToFullyLoad();
    await this.getMatTab('PUBLISHED');
  };

  this.navigateToDraftsTab = async function() {
    await waitFor.pageToFullyLoad();
    await this.getMatTab('DRAFTS');
  };

  this.expectNumberOfDraftBlogPostsToBe = async function(number) {
    await this.waitForDraftBlogPostsToLoad();
    expect(await draftBlogPostTiles.count()).toBe(number);
  };

  this.blogDashboardIntroMessageIsVisible = async function() {
    await waitFor.visibilityOf(
      blogDashboardIntroMessageContainer, 'Blog Dashboard Intro message ' +
      'taking too long to be visible');
  };

  this.expectNumberOfPublishedBlogPostsToBe = async function(number) {
    await this.waitForPublishedBlogPostsToLoad();
    expect(await publishedBlogPostTiles.count()).toBe(number);
  };

  this.expectNumberOfBlogPostsRowsToBe = async function(number) {
    await this.waitForDraftBlogPostsToLoad();
    expect(await blogPostListItems.count()).toBe(number);
  };

  this.getBlogPostTileEditOption = async function(title) {
    await waitFor.visibilityOf(
      blogPostTiles.first(), 'Blog Post tiles take too long to be visible.');
    for (i = 0; i < await blogPostTiles.count(); i++) {
      var blogPostTile = blogPostTiles.get(i);
      var blogPostTitleContainer = blogPostTile.element(
        blogPostTileTitle);
      var blogPostTitle = await action.getText(
        `Blog Post Tile Title ${i}`, blogPostTitleContainer);
      if (blogPostTitle === title) {
        var blogPostEditOptionButton = blogPostTile.element(
          blogPostEditOptions);
        return blogPostEditOptionButton;
      }
    }
  };

  this.deleteBlogPostWithTitle = async function(title) {
    var blogPostEditOptionButton = await this.getBlogPostTileEditOption(title);
    await action.click(
      'Blog post edit option', blogPostEditOptionButton);
    await action.click('Delete blog post button', deleteBlogPostButton);
    await action.click(
      'Confirm Delete Blog Post button', confirmButton);
    await waitFor.visibilityOfSuccessToast('Blog Post Deleted Successfully.');
    await waitFor.pageToFullyLoad();
  };

  this.navigateToBlogPostEditorWithTitleFromList = async function(title) {
    await waitFor.visibilityOf(
      blogPostListItems.first(), 'Blog post list take too long to be visible.');
    for (i = 0; i < await blogPostListItems.count(); i++) {
      var blogPostRow = blogPostListItems.get(i);
      var blogPostTitleContainer = blogPostRow.element(
        blogPostTileTitle);
      var blogPostTitle = await action.getText(
        `Blog Post Tile Title ${i}`, blogPostTitleContainer);
      if (blogPostTitle === title) {
        await action.click('blog post row', blogPostRow);
        await waitFor.pageToFullyLoad();
        break;
      }
    }
  };

  this.deleteBlogPostFromEditor = async function() {
    await action.click('Delete blog post button', deleteBlogPostButton);
    await action.click(
      'Confirm Delete Blog Post button', confirmButton);
    await waitFor.visibilityOfSuccessToast('Blog Post Deleted Successfully.');
    await waitFor.pageToFullyLoad();
  };

  this.unpublishBlogPostWithTitle = async function(title) {
    var blogPostEditOptionButton = await this.getBlogPostTileEditOption(title);
    await action.click(
      'Blog post edit option', blogPostEditOptionButton);
    await action.click('Unpublish blog post button', unpublishBlogPostButton);
    await action.click(
      'Confirm unpublishing Blog Post button', confirmButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToBlogPostEditorWithTitle = async function(title) {
    var blogPostEditOptionButton = await this.getBlogPostTileEditOption(title);
    await action.click(
      'Blog post edit option', blogPostEditOptionButton);
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
