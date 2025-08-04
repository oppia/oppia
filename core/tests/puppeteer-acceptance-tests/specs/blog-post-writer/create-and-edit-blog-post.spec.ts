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
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * BW. Create and edit blog post.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {BlogPostEditor} from '../../utilities/user/blog-post-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants, {FILEPATHS} from '../../utilities/common/test-constants';

const ROLES = testConstants.Roles;
const LABELS = {
  CREATE_NEW_BLOG_POST_BTN: 'CREATE NEW BLOG POST',
};

describe('Blog Post Writer', function () {
  let blogPostWriter: BlogPostEditor & LoggedInUser & LoggedOutUser;

  beforeAll(async () => {
    blogPostWriter = await UserFactory.createNewUser(
      'blogPostWriter',
      'blog_post_writer@example.com',
      [ROLES.BLOG_POST_EDITOR]
    );
  });

  it('should be able to create a blog post and save it as draft', async function () {
    // Navigate to blog dashboard.
    await blogPostWriter.reloadPage();
    await blogPostWriter.navigateToPageUsingProfileMenu('Blog Dashboard');
    await blogPostWriter.updateUserBioInRegisterModal('I am the test user.');
    await blogPostWriter.clickOnSaveProfileButton();
    await blogPostWriter.expectNewBlogPostButtonToBeVisible(false);
    await blogPostWriter.expectFirstBlogPostButtonToBeVisible(true);

    // Click on "Create new blog post" button.
    await blogPostWriter.clickOn(LABELS.CREATE_NEW_BLOG_POST_BTN);
    await blogPostWriter.expectToBeOnBlogEditorPage();

    // Check license terms for image uploads.
    await blogPostWriter.clickOnThumbnailImage();
    await blogPostWriter.clickLinkAnchorToNewTab(
      'license terms',
      'http://localhost:8181/license'
    );
    await blogPostWriter.expectScreenshotToMatch('licensePage', __dirname);

    // Upload large thumbnail image.
    await blogPostWriter.uploadFile(FILEPATHS.BANNER_HIGH_RES);
    await blogPostWriter.expectPhotoUploadErrorMessageToBe(
      'The maximum allowed file size is 1024 KB'
    );

    // Upload BMP format thumbnail image.
    await blogPostWriter.clickOnThumbnailImage();
    await blogPostWriter.uploadFile(FILEPATHS.BANNER_BMP);
    await blogPostWriter.expectPhotoUploadErrorMessageToBe(
      'This image format is not supported'
    );

    // Upload GIF format thumbnail image.
    await blogPostWriter.uploadBlogPostThumbnailImage(FILEPATHS.BANNER_GIF);

    // Upload JPG format thumbnail image.
    await blogPostWriter.uploadBlogPostThumbnailImage(FILEPATHS.BANNER_JPG);

    // Upload PNG format thumbnail image.
    await blogPostWriter.uploadBlogPostThumbnailImage(FILEPATHS.BANNER_PNG);

    // Upload SVG format thumbnail image.
    await blogPostWriter.uploadBlogPostThumbnailImage(FILEPATHS.BANNER_SVG);
    await blogPostWriter.expectToolTipMessage('Thumbnail saved successfully');

    // Update blog title of less than 5 characters.
    await blogPostWriter.updateBlogPostTitle('Test');
    await blogPostWriter.expectBlogTitleHelpToContain(
      'Blog Post title should have at least 5 characters.'
    );

    // Update blog title of more than 5 characters.
    await blogPostWriter.updateBlogPostTitle('Test Blog Post Title');

    // Update blog body using all the available RTE features.
    await blogPostWriter.updateBlogBodyUsingAllRTEFeatures();

    // Preview the blog post.
    await blogPostWriter.previewBlogPost();
    await blogPostWriter.expectScreenshotToMatch('blogPostPreview', __dirname);

    // Verify link in blog preview modal.
    await blogPostWriter.clickLinkAnchorToNewTab(
      '( link  )',
      'http://localhost:8181/blog'
    );

    // Close preview modal.
    await blogPostWriter.closePreviewModal();

    // Save blog post draft.
    await blogPostWriter.saveTheDraftBlogPost();
    await blogPostWriter.expectToolTipMessage('Blog Post Saved Successfully.');
  });

  it('should be able to edit draft blog post', async function () {
    // Navigate to blog dashboard.
    await blogPostWriter.navigateToPageUsingProfileMenu('Blog Dashboard');
    await blogPostWriter.expectCurrentMatTabHeaderToBe('DRAFTS (1)');

    // Verify grid view and list view buttons are present.
    await blogPostWriter.expectGridViewAndListViewButtonsArePresent();

    // Check if "three dots" menu works properly.
    await blogPostWriter.editDraftBlogPostWithTitle('Test Blog Post Title');
  });

  afterAll(async () => {
    await UserFactory.closeAllBrowsers();
  });
});
