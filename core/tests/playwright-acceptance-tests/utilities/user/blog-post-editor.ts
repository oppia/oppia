// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Blog post editor users utility file.
 */

import {expect, Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

// URLs.
const blogDashboardUrl = testConstants.URLs.BlogDashboard;

const blogPostThumbnailImage = testConstants.data.blogPostThumbnailImage;

// Selectors for the blog dashboard.
const blogAuthorBioField = 'textarea.e2e-test-blog-author-bio-field';
const usernameInputSelector = '.e2e-test-blog-author-name-field';
const authorBioSaveButton = 'button.e2e-test-save-author-details-button';
const newBlogPostButtonSelector = '.e2e-test-create-blog-post-button';
const listOfBlogsInBlogDashboard = '.blog-dashboard-tile-content';

// Selectors for the blog post editor.
const blogTitleInput = 'input.e2e-test-blog-post-title-field';
const blogBodyInput = 'div.e2e-test-rte';
const mobileBlogBodyInputWithText = 'div.e2e-test-rte p';
const editBlogSelector = '.e2e-test-content-button';
const thumbnailPhotoBox = 'div.e2e-test-photo-clickable';
const addThumbnailImageButton = 'button.e2e-test-photo-upload-submit';
const tagSelector = '.e2e-test-blog-post-tags';
const blogBodySaveButtonSelector = '.e2e-test-save-blog-post-content';
const publishBlogPostButton = 'button.e2e-test-publish-blog-post-button';
const saveDraftButtonSelector = '.e2e-test-save-as-draft-button';
const confirmButtonSelector = 'button.e2e-test-confirm-button';

// Selectors for the paste error box in the blog post editor.
const pasteErrorBox = '.e2e-test-oppia-rte-paste-error-box';
const dismissPasteErrorButton = '.e2e-test-oppia-dismiss-paste-error-button';
const pasteValidComponentsButton = '.e2e-test-oppia-paste-valid-content-button';
const cancelPasteButton = '.e2e-test-oppia-cancel-rte-paste-button';

export class BlogPostEditor extends BaseUser {
  /**
   * Function for navigating to the blog dashboard page.
   */
  async navigateToBlogDashboardPage(): Promise<void> {
    await this.goto(blogDashboardUrl);
  }

  /**
   * Function for adding blog post author bio in blog dashboard.
   */
  async addUserBioInBlogDashboard(): Promise<void> {
    const inputBar = await this.isElementVisible(blogAuthorBioField);
    // It is used here to avoid filling the user bio each time. We fill it
    // only once when the user is accessing the blog dashboard for the first
    // time.
    if (inputBar) {
      await this.typeInInputField(usernameInputSelector, 'blogPostWriter');
      await this.typeInInputField(blogAuthorBioField, 'Dummy-User-Bio');
      await this.expectElementToBeClickable(authorBioSaveButton);
      await this.clickOnElementWithSelector(authorBioSaveButton);
      await this.expectElementToBeVisible(authorBioSaveButton, false);
    }
  }

  /**
   * Function for verifying that the expected number of blog posts are visible
   * on the blog dashboard.
   * @param {number} number - The expected number of blog posts.
   */
  async expectNumberOfBlogPostsToBe(number: number): Promise<void> {
    const allBlogPosts = await this.page.$$(listOfBlogsInBlogDashboard);
    if (allBlogPosts.length !== number) {
      throw new Error(`Number of blog posts is not equal to ${number}`);
    }
    showMessage(`Number of blog posts is equal to ${number}`);
  }

  /**
   * Function for opening the blog editor page for a new blog post.
   */
  async openBlogEditorPage(): Promise<void> {
    await this.addUserBioInBlogDashboard();
    await this.clickOnElementWithSelector(newBlogPostButtonSelector);
    await this.expectPublishButtonToBeDisabled();
  }

  /**
   * Function for checking that the publish button is disabled when the blog
   * post data is not completely filled.
   */
  async expectPublishButtonToBeDisabled(): Promise<void> {
    await this.expectElementToBeVisible(publishBlogPostButton);
    await expect(this.page.locator(publishBlogPostButton)).toBeDisabled();
    showMessage(
      'Published button is disabled when blog post data is not completely' +
        ' filled.'
    );
  }

  /**
   * Function for uploading a thumbnail image for the blog post.
   * @param {string} imagePath - The path of the image to upload.
   */
  async uploadBlogPostThumbnailImage(
    imagePath: string = blogPostThumbnailImage
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.uploadFile(imagePath);
      await this.clickOnElementWithSelector(addThumbnailImageButton);

      await this.expectElementToBeVisible(addThumbnailImageButton, false);
    } else {
      await this.expectElementToBeVisible(thumbnailPhotoBox);
      await this.clickOnElementWithSelector(thumbnailPhotoBox);
      await this.uploadFile(imagePath);
      await this.waitForElementToStabilize(addThumbnailImageButton);
      await this.clickOnElementWithSelector(addThumbnailImageButton);
      await this.page.waitForSelector('body.modal-open', {state: 'detached'});
    }
  }

  /**
   * Function for updating the title of the blog post.
   * @param {string} newBlogPostTitle - The new title of the blog post.
   */
  async updateBlogPostTitle(newBlogPostTitle: string): Promise<void> {
    await this.expectElementToBeVisible(blogTitleInput);
    await this.clearAllTextFrom(blogTitleInput);
    await this.typeInInputField(blogTitleInput, newBlogPostTitle);
    await this.page.keyboard.press('Tab');

    await expect(this.page.locator(blogTitleInput)).toHaveValue(
      newBlogPostTitle
    );
  }

  /**
   * Function for updating the body text of the blog post.
   * @param {string} newBodyText - The new body text of the blog post.
   */
  async updateBodyTextTo(newBodyText: string): Promise<void> {
    if (!(await this.isElementVisible(blogBodyInput))) {
      await this.expectElementToBeVisible(editBlogSelector);
      await this.clickOnElementWithSelector(editBlogSelector);
    }
    await this.expectElementToBeVisible(blogBodyInput);
    await this.clearAllTextFrom(blogBodyInput);
    await this.typeInInputField(blogBodyInput, newBodyText);

    await this.expectTextContentToBe(blogBodyInput, newBodyText);
  }

  /**
   * Function for creating a draft blog post with the given title and opening
   * its body editor.
   * @param {string} draftBlogPostTitle - The title for the draft blog post.
   */
  async createDraftBlogPostWithTitleAndOpenBodyRte(
    draftBlogPostTitle: string
  ): Promise<void> {
    await this.addUserBioInBlogDashboard();
    await this.clickOnElementWithSelector(newBlogPostButtonSelector);
    await this.updateBlogPostTitle(draftBlogPostTitle);
    await this.updateBodyTextTo('test blog post body content');
  }

  /**
   * Function for selecting or deselecting a tag of the blog post.
   * @param {string} tag - The name of the tag.
   * @param {boolean} shouldBePresent - Whether the tag should be selected
   *     after clicking on it.
   */
  async selectTag(tag: string, shouldBePresent: boolean = true): Promise<void> {
    // If the viewport is mobile and the blog body is not in edit mode,
    // click on the edit button to open the edit mode, so tags can be added.
    if (
      this.isViewportAtMobileWidth() &&
      !(await this.isElementVisible(blogBodyInput))
    ) {
      await this.expectElementToBeVisible(editBlogSelector);
      await this.clickOnElementWithSelector(editBlogSelector);
    }
    await this.expectElementToBeVisible(tagSelector);

    const tagElement = this.page
      .locator(tagSelector)
      .filter({hasText: new RegExp(`^\\s*${tag}\\s*$`)})
      .first();
    await tagElement.click();

    await expect(tagElement.locator('button')).toHaveAttribute(
      'aria-pressed',
      shouldBePresent ? 'true' : 'false'
    );
  }

  /**
   * Function for saving the changes made to the blog post body.
   * @param {boolean} skipVerification - Whether to skip verifying that the
   *     save button is hidden after saving.
   */
  async saveBlogBodyChanges(skipVerification: boolean = false): Promise<void> {
    await this.expectElementToBeVisible(blogBodySaveButtonSelector);
    await this.clickOnElementWithSelector(blogBodySaveButtonSelector);
    if (!skipVerification) {
      await this.expectElementToBeVisible(blogBodySaveButtonSelector, false);
    }
  }

  /**
   * Function for publishing the blog post.
   */
  async publishTheBlogPost(): Promise<void> {
    await this.clickOnElementWithText('PUBLISH');
    await this.expectElementToBeVisible(confirmButtonSelector);
    await this.waitForElementToStabilize(confirmButtonSelector);
    await this.clickOnElementWithSelector(confirmButtonSelector);
    await this.expectElementToBeVisible(confirmButtonSelector, false);
    showMessage('Successfully published a blog post!');
  }

  /**
   * Function for saving the blog post as a draft.
   */
  async saveTheDraftBlogPost(): Promise<void> {
    await this.expectElementToBeVisible(saveDraftButtonSelector);
    await this.clickOnElementWithSelector(saveDraftButtonSelector);

    await expect(this.page.locator(saveDraftButtonSelector)).toBeDisabled();
  }

  /**
   * Function for writing the given HTML to the page clipboard.
   * @param {string} html - The HTML content to write to the clipboard.
   */
  async setClipboardContent(html: string): Promise<void> {
    await this.page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);
    await this.page.evaluate(async (htmlContent: string) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlContent], {type: 'text/html'}),
          'text/plain': new Blob([''], {type: 'text/plain'}),
        }),
      ]);
    }, html);
  }

  /**
   * Function for pasting clipboard content into the blog post content editor.
   */
  async pasteContentInBlogPostContentRte(): Promise<void> {
    await this.page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(mobileBlogBodyInputWithText);
      await this.page.click(mobileBlogBodyInputWithText);
    } else {
      await this.expectElementToBeVisible(blogBodyInput);
      await this.page.click(blogBodyInput);
    }
    await this.page.keyboard.press('ControlOrMeta+KeyV');
  }

  /**
   * Function for dismissing the paste error box without keeping the pasted
   * content.
   */
  async clickOnDismissPasteErrorButton(): Promise<void> {
    await this.expectElementToBeVisible(pasteErrorBox);
    await this.clickOnElementWithSelector(dismissPasteErrorButton);
    await this.expectElementToBeVisible(pasteErrorBox, false);
  }

  /**
   * Function for accepting the valid portion of pasted content and verifying
   * that it appears.
   * @param {string} textPasted - The text expected to be present after pasting.
   */
  async clickOnPasteValidComponentsButton(textPasted: string): Promise<void> {
    await this.expectElementToBeVisible(pasteErrorBox);
    await this.clickOnElementWithSelector(pasteValidComponentsButton);
    await this.expectElementToBeVisible(pasteErrorBox, false);
    const isTextPresent = await this.isTextPresentOnPage(textPasted);
    if (!isTextPresent) {
      throw new Error(
        'Expected pasted text to be present, but it was not found.'
      );
    }
  }

  /**
   * Function for cancelling the paste flow from the paste error box.
   */
  async clickOnCancelPasteButton(): Promise<void> {
    await this.expectElementToBeVisible(pasteErrorBox);
    await this.clickOnElementWithSelector(cancelPasteButton);
    await this.expectElementToBeVisible(pasteErrorBox, false);
  }

  /**
   * Function for typing in the editor to dismiss the paste error box.
   */
  async typeInRteToDismissError(): Promise<void> {
    await this.expectElementToBeVisible(pasteErrorBox);
    await this.expectElementToBeVisible(blogBodyInput);
    await this.typeInInputField(blogBodyInput, 'qwerty');
    await this.expectElementToBeVisible(pasteErrorBox, false);
  }
}

export const BlogPostEditorFactory = (page: Page): BlogPostEditor => {
  return new BlogPostEditor(page);
};
