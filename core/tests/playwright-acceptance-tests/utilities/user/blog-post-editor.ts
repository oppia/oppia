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
const publishedBlogsTabContainerSelector = '.e2e-test-published-blogs-tab';

// Selectors for the blog post editor.
const blogTitleInput = 'input.e2e-test-blog-post-title-field';
const blogBodyInput = 'div.e2e-test-rte';
const editBlogSelector = '.e2e-test-content-button';
const thumbnailPhotoBox = 'div.e2e-test-photo-clickable';
const addThumbnailImageButton = 'button.e2e-test-photo-upload-submit';
const tagSelector = '.e2e-test-blog-post-tags';
const blogBodySaveButtonSelector = '.e2e-test-save-blog-post-content';
const publishBlogPostButton = 'button.e2e-test-publish-blog-post-button';
const saveDraftButtonSelector = '.e2e-test-save-as-draft-button';
const confirmButtonSelector = 'button.e2e-test-confirm-button';
const toastWarningMessageSelector = 'div.e2e-test-toast-warning-message';
const blogPostTitlePage = '.e2e-test-blog-post-title';

export class BlogPostEditor extends BaseUser {
  /**
   * Fills the bio in register modal shown when visiting blog dashboard for
   * the first time.
   * @param {string} bio - The bio to update with.
   */
  async updateUserBioInRegisterModal(bio: string): Promise<void> {
    await this.expectElementToBeVisible(blogAuthorBioField);
    await this.clearAllTextFrom(blogAuthorBioField);
    await this.typeInInputField(blogAuthorBioField, bio);
    await this.expectElementValueToBe(blogAuthorBioField, bio);
  }

  /**
   * Fills username in register modal shown when visiting blog dashboard for
   * the first time.
   * @param {string} username - Username to enter.
   */
  async updateUsernameInRegisterModal(username: string): Promise<void> {
    await this.expectElementToBeVisible(usernameInputSelector);
    await this.clearAllTextFrom(usernameInputSelector);
    await this.typeInInputField(usernameInputSelector, username);
    await this.expectElementValueToBe(usernameInputSelector, username);
  }

  /**
   * Clicks on the save profile button.
   */
  async clickOnSaveProfileButton(): Promise<void> {
    await this.expectElementToBeVisible(authorBioSaveButton);
    await this.clickOnElementWithSelector(authorBioSaveButton);
    await this.expectElementToBeVisible(authorBioSaveButton, false);
  }

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
   * This is a composite function that can be used when a straightforward,
   * simple blog post publish is required. This function publishes a blog
   * post with the given title.
   * @param {string} newBlogPostTitle - The title of the new blog post.
   */
  async publishNewBlogPost(newBlogPostTitle: string): Promise<void> {
    await this.clickOnElementWithSelector(newBlogPostButtonSelector);
    await this.expectElementToBeClickable(publishBlogPostButton, false);

    await this.uploadBlogPostThumbnailImage();
    await this.expectElementToBeClickable(publishBlogPostButton, false);

    await this.updateBlogPostTitle(newBlogPostTitle);
    await this.updateBodyTextTo('test blog post body content');
    await this.selectTag('News');
    await this.selectTag('International');
    await this.saveBlogBodyChanges();

    await this.publishTheBlogPost();
  }

  /**
   * This function creates a new blog post with the given title. Unlike
   * publishNewBlogPost, this does not attempt to publish it, and is used to
   * verify that publishing a blog post with a duplicate title is blocked.
   * @param {string} newBlogPostTitle - The title of the new blog post.
   */
  async createNewBlogPostWithTitle(newBlogPostTitle: string): Promise<void> {
    await this.clickOnElementWithSelector(newBlogPostButtonSelector);
    await this.expectElementToBeClickable(publishBlogPostButton, false);

    await this.uploadBlogPostThumbnailImage();
    await this.expectElementToBeClickable(publishBlogPostButton, false);

    await this.updateBlogPostTitle(newBlogPostTitle);
    await this.updateBodyTextTo('test blog post body content - duplicate');
    await this.selectTag('News');
    await this.selectTag('International');
    await this.saveBlogBodyChanges();
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
   * This function checks that the user is unable to publish a blog post,
   * because of the given warning message.
   * @param {string} expectedWarningMessage - Expected toast warning message.
   */
  async expectUserUnableToPublishBlogPost(
    expectedWarningMessage: string
  ): Promise<void> {
    await this.expectElementToBeVisible(toastWarningMessageSelector);
    await this.expectTextContentToBe(
      toastWarningMessageSelector,
      expectedWarningMessage
    );
    await this.expectElementToBeClickable(publishBlogPostButton, false);

    showMessage(
      'User is unable to publish the blog post because ' +
        expectedWarningMessage
    );
  }

  /**
   * This function checks the number of blog posts in the blog dashboard.
   * @param {number} number - Expected number of blog posts.
   */
  async expectNumberOfBlogPostsToBe(number: number): Promise<void> {
    await this.expectNumberOfElementsToBe(listOfBlogsInBlogDashboard, number);
    showMessage(`Number of blog posts is equal to ${number}`);
  }

  /**
   * This function navigates to the Published tab in the blog dashboard.
   */
  async navigateToPublishTab(): Promise<void> {
    await this.goto(blogDashboardUrl);
    await this.clickOnElementWithText('PUBLISHED');
    await this.expectElementToBeVisible(publishedBlogsTabContainerSelector);
    showMessage('Navigated to publish tab.');
  }

  /**
   * This function checks if the blog post with given title is published.
   * @param {string} blogPostTitle - The title of the blog post to check.
   */
  async expectPublishedBlogPostWithTitleToBePresent(
    blogPostTitle: string
  ): Promise<void> {
    await this.goto(blogDashboardUrl);
    await this.clickOnElementWithText('PUBLISHED');
    await this.waitForPageToFullyLoad();

    const allPublishedBlogPosts = await this.page.$$(
      listOfBlogsInBlogDashboard
    );
    let count = 0;
    for (let i = 0; i < allPublishedBlogPosts.length; i++) {
      const publishedBlogPostTitle = await allPublishedBlogPosts[i].$eval(
        blogPostTitlePage,
        element => (element as HTMLElement).innerText
      );
      if (publishedBlogPostTitle === blogPostTitle) {
        count++;
      }
    }
    if (count === 0) {
      throw new Error(`Blog post with title ${blogPostTitle} does not exist!`);
    } else if (count > 1) {
      throw new Error(
        `Blog post with title ${blogPostTitle} exists more than once!`
      );
    }
    showMessage(`Published blog post with title ${blogPostTitle} exists!`);
  }

  /**
   * Scrolls to the bottom of the page. Used to ensure screenshots are taken
   * from the same scroll position before comparing them.
   */
  async scrollToBottomOfPage(): Promise<void> {
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await this.waitForPageToFullyLoad();
  }
}

export const BlogPostEditorFactory = (page: Page): BlogPostEditor => {
  return new BlogPostEditor(page);
};
