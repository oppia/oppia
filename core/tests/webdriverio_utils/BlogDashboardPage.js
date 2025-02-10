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
 * @fileoverview Page object for the blog Dashboard page, for use
 * in Webdriverio tests.
 */

var action = require('./action.js');
var waitFor = require('./waitFor.js');
var forms = require('../webdriverio_utils/forms.js');
var workflow = require('../webdriverio_utils/workflow.js');
var general = require('../webdriverio_utils/general.js');

var BlogDashboardPage = function () {
  var blogAuthorDetailsModal = $('.e2e-test-blog-author-details-modal');
  var blogAuthorDetailsModalBioField = $('.e2e-test-blog-author-bio-field');
  var blogAuthorDetailsModalNameField = $('.e2e-test-blog-author-name-field');
  var saveAuthorDetailsButton = $('.e2e-test-save-author-details-button');
  var userProfilePhoto = $('.e2e-test-profile-user-photo');
  var createBlogPostButton = $('.e2e-test-create-blog-post-button');
  var editBlogPostButton = $('.e2e-test-edit-blog-post-button');
  var unpublishBlogPostButton = $('.e2e-test-unpublish-blog-post-button');
  var deleteBlogPostButton = $('.e2e-test-delete-blog-post-button');
  var matTabLabel = $('.mat-tab-label');
  var matTabLabelsSelector = function () {
    return $$('.mat-tab-label');
  };
  var blogPostContentEditor = $('.e2e-test-content-editor');
  var blogPostTitleFieldElement = $('.e2e-test-blog-post-title-field');
  var listViewButton = $('.e2e-test-list-view-button');
  var tilesViewButton = $('.e2e-test-tiles-view-button');
  var draftBlogPostsTable = $('.e2e-test-drafts-blog-post-table');
  var publishedBlogPostsTable = $('.e2e-test-published-blog-post-table');
  var blogPostListItem = $('.e2e-test-blog-post-list-item');
  var blogPostListItemsSelector = function () {
    return $$('.e2e-test-blog-post-list-item');
  };
  var draftBlogPostTilesSelector = function () {
    return $$('.e2e-test-draft-blog-post-tile-item');
  };
  var publishedBlogPostTilesSelector = function () {
    return $$('.e2e-test-published-blog-post-tile-item');
  };
  var blogPostTag = $('.e2e-test-blog-post-tags');
  var blogPostTagsSelector = function () {
    return $$('.e2e-test-blog-post-tags');
  };
  var saveBlogPostAsDraftButton = $('.e2e-test-save-as-draft-button');
  var publishBlogPostButton = $('.e2e-test-publish-blog-post-button');
  var thumbnailClickable = $('.e2e-test-photo-clickable');
  var customThumbnail = $('.e2e-test-custom-photo');
  var thumbnailCropper = $('.e2e-test-photo-crop .cropper-container');
  var thumbnailUploadError = $('.e2e-test-upload-error');
  var saveBlogPostContentButton = $('.e2e-test-save-blog-post-content');
  var blogPostContentDisplay = $('.e2e-test-content-display');
  var confirmButton = $('.e2e-test-confirm-button');
  var currUsername = $('.e2e-test-username-visible');
  var cancelThumbnailUploadButton = $('.e2e-test-photo-upload-cancel');
  var blogDashboardIntroMessageContainer = $(
    '.e2e-test-intro-message-container'
  );
  var closeBlogCardPreviewButton = $('.e2e-test-close-preview-button');
  var blogCardPreviewButton = $('.e2e-test-blog-card-preview-button');
  var blogDashboardLink = $('.e2e-test-blog-dashboard-link');
  var blogPostTileElement = $('.e2e-test-blog-dashboard-tile');
  var blogPostTilesSelector = function () {
    return $$('.e2e-test-blog-dashboard-tile');
  };
  var matInkBar = $('.mat-ink-bar');
  var navigateToBlogDashboardButton = $('.e2e-test-back-button');

  this.get = async function () {
    await waitFor.pageToFullyLoad();
    await general.openProfileDropdown();
    await action.click('Blog dashboard link from dropdown', blogDashboardLink);
    await waitFor.pageToFullyLoad();
    await waitFor.urlRedirection('http://localhost:8181/blog-dashboard');
  };

  this.navigateToBlogDashboardPageWithBackButton = async function () {
    await action.click(
      'Navigate back to blog dashboard button',
      navigateToBlogDashboardButton
    );
    await waitFor.pageToFullyLoad();
  };

  this.waitForDraftBlogPostsToLoad = async function () {
    await waitFor.visibilityOf(
      draftBlogPostsTable,
      'Blog posts table taking too long to appear.'
    );
  };

  this.showAndCloseBlogCardPreview = async function () {
    await action.click('Preview Button', blogCardPreviewButton);
    await waitFor.visibilityOf(
      userProfilePhoto,
      'Current user profile photo taking too long to display'
    );
    await waitFor.visibilityOf(
      currUsername,
      'Current user name taking too long to display'
    );
    await action.click('Close Preview', closeBlogCardPreviewButton);
  };

  this.waitForPublishedBlogPostsToLoad = async function () {
    await waitFor.visibilityOf(
      publishedBlogPostsTable,
      'Blog posts table taking too long to appear.'
    );
  };

  this.createNewBlogPost = async function () {
    await action.click('Create Blog Post button', createBlogPostButton);

    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      blogPostTitleFieldElement,
      'Blog Post Editor is taking too long to appear.'
    );
    await waitFor.pageToFullyLoad();
  };

  this.setContent = async function (richTextInstructions) {
    var schemaBasedEditorTag = await blogPostContentEditor.$(
      '<schema-based-editor>'
    );
    await waitFor.visibilityOf(
      schemaBasedEditorTag,
      'Schema based editor tag not showing up'
    );
    var richTextEditor = await forms.RichTextEditor(schemaBasedEditorTag);
    await richTextEditor.clear();
    await richTextInstructions(richTextEditor);
    await action.click('Save Content Button', saveBlogPostContentButton);
    await waitFor.invisibilityOf(
      saveBlogPostContentButton,
      'Content editor takes too long to disappear'
    );
  };

  this.saveBlogPostAsDraft = async function (
    blogPostTitle,
    richTextInstructions
  ) {
    await action.setValue(
      'New blog post title field',
      blogPostTitleFieldElement,
      blogPostTitle
    );
    await this.setContent(richTextInstructions);
    await waitFor.visibilityOf(
      blogPostContentDisplay,
      'Blog Post content not showing up'
    );
    await action.click('Save as draft Button', saveBlogPostAsDraftButton);
    await waitFor.visibilityOfSuccessToast('Blog Post Saved Successfully.');
    await waitFor.invisibilityOfSuccessToast('Blog Post Saved Successfully.');
  };

  this.updateAuthorDetails = async function (authorName, authorBio) {
    await waitFor.visibilityOf(
      blogAuthorDetailsModal,
      'Author Details Editor Modal not showing up'
    );
    await action.setValue(
      'New blog post title field',
      blogAuthorDetailsModalNameField,
      authorName
    );
    await action.setValue(
      'New blog post bio field',
      blogAuthorDetailsModalBioField,
      authorBio
    );
    await action.click(
      'Save Blog Author Details button',
      saveAuthorDetailsButton
    );
  };

  this.publishNewBlogPost = async function (
    blogPostTitle,
    richTextInstructions,
    tags
  ) {
    await action.setValue(
      'New blog post title field',
      blogPostTitleFieldElement,
      blogPostTitle
    );
    await this.selectTags(tags);
    await this.setContent(richTextInstructions);
    await waitFor.presenceOf(
      blogPostContentDisplay,
      'Blog Post content not showing up'
    );
    await this.setThumbnailImage();
    await action.click('Publish Blog Post Button', publishBlogPostButton);
    await action.click('Confirm Publish Blog Post button', confirmButton);
    await waitFor.visibilityOfSuccessToast(
      'Blog Post Saved and Published Succesfully.'
    );
    await waitFor.invisibilityOfSuccessToast(
      'Blog Post Saved and Published Succesfully.'
    );
  };

  this.publishDraftBlogPost = async function (tags) {
    await this.selectTags(tags);
    await this.setThumbnailImage();
    await action.click('Publish Blog Post Button', publishBlogPostButton);
    await action.click('Confirm Publish Blog Post button', confirmButton);
    await waitFor.visibilityOfSuccessToast(
      'Blog Post Saved and Published Succesfully.'
    );
    await waitFor.invisibilityOfSuccessToast(
      'Blog Post Saved and Published Succesfully.'
    );
  };

  this.selectTags = async function (tags) {
    await waitFor.visibilityOf(blogPostTag, 'Tags take too long to appear.');
    var blogPostTags = await blogPostTagsSelector();
    for (i = 0; i < blogPostTags.length; i++) {
      var tag = blogPostTags[i];
      var tagName = await action.getText(`Blog Post Editor tag ${i}`, tag);
      if (tags.includes(tagName)) {
        await action.click('select blog post tag', tag);
      }
    }
  };

  this.getMatTab = async function (tabName) {
    await waitFor.visibilityOf(
      matTabLabel,
      'Mat Tab Toggle options take too long to appear.'
    );
    var matTabLabels = await matTabLabelsSelector();
    for (i = 0; i < matTabLabels.length; i++) {
      var matTab = matTabLabels[i];
      var tabText = await action.getText(`Blog Dashboard tab ${i}`, matTab);
      if (tabText.startsWith(tabName)) {
        await action.click(`${tabName} tab`, matTab);
        await waitFor.visibilityOf(
          matInkBar,
          'Mat Ink Bar takes too long to appear'
        );
        await waitFor.rightTransistionToComplete(
          matInkBar,
          `${tabName} tab transition takes too long to complete`
        );
        break;
      }
    }
  };

  this.navigateToPublishTab = async function () {
    await waitFor.pageToFullyLoad();
    await this.getMatTab('PUBLISHED');
  };

  this.navigateToDraftsTab = async function () {
    await waitFor.pageToFullyLoad();
    await this.getMatTab('DRAFTS');
  };

  this.expectNumberOfDraftBlogPostsToBe = async function (number) {
    await this.waitForDraftBlogPostsToLoad();
    var draftBlogPostTiles = await draftBlogPostTilesSelector();
    expect(draftBlogPostTiles.length).toBe(number);
  };

  this.blogDashboardIntroMessageIsVisible = async function () {
    await waitFor.visibilityOf(
      blogDashboardIntroMessageContainer,
      'Blog Dashboard Intro message ' + 'taking too long to be visible'
    );
  };

  this.expectNumberOfPublishedBlogPostsToBe = async function (number) {
    await this.waitForPublishedBlogPostsToLoad();
    var publishedBlogPostTiles = await publishedBlogPostTilesSelector();
    expect(publishedBlogPostTiles.length).toBe(number);
  };

  this.expectNumberOfBlogPostsRowsToBe = async function (number) {
    await this.waitForDraftBlogPostsToLoad();
    var blogPostListItems = await blogPostListItemsSelector();
    expect(blogPostListItems.length).toBe(number);
  };

  this.getBlogPostTileEditOption = async function (title) {
    await waitFor.visibilityOf(
      blogPostTileElement,
      'Blog Post tiles take too long to be visible.'
    );
    var blogPostTiles = await blogPostTilesSelector();
    for (i = 0; i < blogPostTiles.length; i++) {
      var blogPostTile = blogPostTiles[i];
      var blogPostTitleContainer = await blogPostTile.$(
        '.e2e-test-blog-post-title'
      );
      // The element is not interactable when we call getText(), so it returns
      // null. To avoid that we are waiting till the element becomes clickable
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
        var blogPostEditOptionButton = await blogPostTile.$(
          '.e2e-test-blog-post-edit-box'
        );
        return blogPostEditOptionButton;
      }
    }
  };

  this.deleteBlogPostWithTitle = async function (title) {
    var blogPostEditOptionButton = await this.getBlogPostTileEditOption(title);
    await action.click('Blog post edit option', blogPostEditOptionButton);
    await action.click('Delete blog post button', deleteBlogPostButton);
    await action.click('Confirm Delete Blog Post button', confirmButton);
    await waitFor.visibilityOfSuccessToast('Blog Post Deleted Successfully.');
    await waitFor.pageToFullyLoad();
  };

  this.navigateToBlogPostEditorWithTitleFromList = async function (title) {
    await waitFor.visibilityOf(
      blogPostListItem,
      'Blog post list take too long to be visible.'
    );
    var blogPostListItems = await blogPostListItemsSelector();
    for (i = 0; i < blogPostListItems.length; i++) {
      var blogPostRow = blogPostListItems[i];
      var blogPostTitleContainer = await blogPostRow.$(
        '.e2e-test-blog-post-title'
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
        await action.click('blog post row', blogPostRow);
        await waitFor.pageToFullyLoad();
        break;
      }
    }
  };

  this.deleteBlogPostFromEditor = async function () {
    await action.click('Delete blog post button', deleteBlogPostButton);
    await action.click('Confirm Delete Blog Post button', confirmButton);
    await waitFor.visibilityOfSuccessToast('Blog Post Deleted Successfully.');
    await waitFor.pageToFullyLoad();
  };

  this.unpublishBlogPostWithTitle = async function (title) {
    var blogPostEditOptionButton = await this.getBlogPostTileEditOption(title);
    await action.click('Blog post edit option', blogPostEditOptionButton);
    await action.click('Unpublish blog post button', unpublishBlogPostButton);
    await action.click('Confirm unpublishing Blog Post button', confirmButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToBlogPostEditorWithTitle = async function (title) {
    var blogPostEditOptionButton = await this.getBlogPostTileEditOption(title);
    await action.click('Blog post edit option', blogPostEditOptionButton);
    await action.click('Edit blog post button', editBlogPostButton);
    await waitFor.pageToFullyLoad();
  };

  this.getListView = async function () {
    await action.click('List View Button', listViewButton);
  };

  this.getTilesView = async function () {
    await action.click('Tiles View Button', tilesViewButton);
  };

  this.expectCurrUserToHaveProfilePhoto = async function () {
    await waitFor.visibilityOf(
      userProfilePhoto,
      'Current user profile photo taking too long to display'
    );
  };

  this.expectCurrUsernameToBeVisible = async function () {
    await waitFor.visibilityOf(
      currUsername,
      'Current user name taking too long to display'
    );
  };

  this.expectUploadError = async function () {
    await waitFor.visibilityOf(
      thumbnailUploadError,
      'Thumbnail upload error taking too long to display'
    );
  };

  this.uploadThumbnail = async function (imgPath, resetExistingImage) {
    return await workflow.uploadImage(
      thumbnailClickable,
      imgPath,
      resetExistingImage
    );
  };

  this.submitThumbnail = async function (imgPath, resetExistingImage) {
    return await workflow.submitImage(
      thumbnailClickable,
      thumbnailCropper,
      imgPath,
      resetExistingImage
    );
  };

  this.getThumbnailSource = async function () {
    return await workflow.getImageSource(customThumbnail);
  };

  this.cancelThumbnailUpload = async function () {
    await action.click('Cancel upload', cancelThumbnailUploadButton);
  };

  this.setThumbnailImage = async function () {
    await this.submitThumbnail('../data/img.png', false);
    var newThumbnailSource = await this.getThumbnailSource();
    expect(newThumbnailSource).not.toEqual('');
    await waitFor.visibilityOfSuccessToast('Thumbnail Saved Successfully.');
    await waitFor.invisibilityOfSuccessToast('Thumbnail Saved Successfully.');
  };
};

exports.BlogDashboardPage = BlogDashboardPage;
