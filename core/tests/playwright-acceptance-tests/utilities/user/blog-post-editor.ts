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
 * @fileoverview Blog Post Editor users utility file.
 */

import {Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const blogTitleInput = 'input.e2e-test-blog-post-title-field';
const blogBodyInput = 'div.e2e-test-rte';
const thumbnailPhotoBox = 'div.e2e-test-photo-clickable';
const blogAuthorBioField = 'textarea.e2e-test-blog-author-bio-field';
const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const authorBioSaveButton = 'button.e2e-test-save-author-details-button';
const confirmButtonSelector = 'button.e2e-test-confirm-button';
const publishBlogPostButton = 'button.e2e-test-publish-blog-post-button';
const addThumbnailImageButton = 'button.e2e-test-photo-upload-submit';
const blogPostThumbnailImage = testConstants.data.blogPostThumbnailImage;
const toastWarningMessageSelector = 'div.e2e-test-toast-warning-message';
const blogPostTitlePage = '.e2e-test-blog-post-title';
const listOfBlogsInBlogDashboard = '.blog-dashboard-tile-content';

const usernameInputSelector = '.e2e-test-blog-author-name-field';

const newBlogPostButtonSelector = '.e2e-test-create-blog-post-button';

const blogBodySaveButtonSelector = '.e2e-test-save-blog-post-content';
const publishedBlogsTabContainerSelector = '.e2e-test-published-blogs-tab';

const tagSelector = '.e2e-test-blog-post-tags';
const editBlogSelector = '.e2e-test-content-button';

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
   * This is a composite function that can be used when a straightforward,
   * simple blog post publish is required. This function publishes a blog
   * post with the given title.
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
   */
  async createNewBlogPostWithTitle(newBlogPostTitle: string): Promise<void> {
    await this.clickOnElementWithText('NEW POST');
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
   * This function uploads a blog post thumbnail image.
   * @param {string} imagePath - The path of the image to upload.
   */
  private async uploadBlogPostThumbnailImage(
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
      await this.expectElementToBeVisible(addThumbnailImageButton, false);
    }
  }

  /**
   * This function updates the title of the blog post.
   */
  private async updateBlogPostTitle(newBlogPostTitle: string): Promise<void> {
    await this.expectElementToBeVisible(blogTitleInput);
    await this.clearAllTextFrom(blogTitleInput);
    await this.typeInInputField(blogTitleInput, newBlogPostTitle);
    await this.page.keyboard.press('Tab');
    await this.expectElementValueToBe(blogTitleInput, newBlogPostTitle);
  }

  /**
   * This function updates the body text of the blog post.
   */
  private async updateBodyTextTo(newBodyText: string): Promise<void> {
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
   * This function saves the blog post body changes.
   */
  private async saveBlogBodyChanges(): Promise<void> {
    await this.expectElementToBeVisible(blogBodySaveButtonSelector);
    await this.clickOnElementWithSelector(blogBodySaveButtonSelector);
    await this.expectElementToBeVisible(blogBodySaveButtonSelector, false);
  }

  /**
   * This function selects a tag for the blog post.
   * @param {string} tag - The tag to select.
   */
  private async selectTag(tag: string): Promise<void> {
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
    const tagElements = await this.page.$$(tagSelector);

    for (const tagElement of tagElements) {
      const tagText = await this.page.evaluate(
        (element: Element) => element.textContent?.trim(),
        tagElement
      );
      if (tagText === tag) {
        await tagElement.click();
        await this.page.waitForFunction(
          (element: HTMLElement | null) =>
            element?.getAttribute('aria-pressed') === 'true',
          await tagElement.$('button')
        );
        return;
      }
    }

    throw new Error(`Tag "${tag}" not found in the tag list.`);
  }

  /**
   * This function publishes the blog post.
   */
  private async publishTheBlogPost(): Promise<void> {
    await this.clickOnElementWithText('PUBLISH');
    await this.expectElementToBeVisible(confirmButtonSelector);
    await this.waitForElementToStabilize(confirmButtonSelector);
    await this.clickOnElementWithSelector(confirmButtonSelector);
    await this.expectElementToBeVisible(confirmButtonSelector, false);
    showMessage('Successfully published a blog post!');
  }

  /**
   * This function checks that the user is unable to publish a blog post,
   * because of the given warning message.
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

export const BlogPostEditorFactory = (page: Page): BlogPostEditor =>
  new BlogPostEditor(page);
