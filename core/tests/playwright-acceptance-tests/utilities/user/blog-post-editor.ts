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

const blogDashboardUrl = testConstants.URLs.BlogDashboard;

const newBlogPostButtonSelector = '.e2e-test-create-blog-post-button';
const blogTitleInput = 'input.e2e-test-blog-post-title-field';
const blogBodyInput = 'div.e2e-test-rte';
const mobileBlogBodyInputWithText = 'div.e2e-test-rte p';
const blogAuthorBioField = 'textarea.e2e-test-blog-author-bio-field';
const usernameInputSelector = '.e2e-test-blog-author-name-field';
const authorBioSaveButton = 'button.e2e-test-save-author-details-button';
const listOfBlogsInBlogDashboard = '.blog-dashboard-tile-content';
const pasteErrorBox = '.e2e-test-oppia-rte-paste-error-box';
const dismissPasteErrorButton = '.e2e-test-oppia-dismiss-paste-error-button';
const pasteValidComponentsButton = '.e2e-test-oppia-paste-valid-content-button';
const cancelPasteButton = '.e2e-test-oppia-cancel-rte-paste-button';
const editBlogSelector = '.e2e-test-content-button';

export class BlogPostEditor extends BaseUser {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigates to the blog dashboard page.
   */
  async navigateToBlogDashboardPage(): Promise<void> {
    await this.goto(blogDashboardUrl);
  }

  /**
   * Adds the default user bio in the blog dashboard if the bio form is visible.
   */
  async addUserBioInBlogDashboard(): Promise<void> {
    const inputBar = await this.isElementVisible(blogAuthorBioField);
    if (inputBar) {
      await this.typeInInputField(usernameInputSelector, 'blogPostWriter');
      await this.typeInInputField(blogAuthorBioField, 'Dummy-User-Bio');
      await this.expectElementToBeVisible(
        `${authorBioSaveButton}:not([disabled])`
      );
      await this.clickOnElementWithSelector(authorBioSaveButton);
      await this.expectElementToBeVisible(authorBioSaveButton, false);
    }
  }

  /**
   * Verifies that the expected number of blog posts are visible on the dashboard.
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
   * Updates the blog post title with the given text.
   * @param {string} newBlogPostTitle - The new title for the blog post.
   */
  async updateBlogPostTitle(newBlogPostTitle: string): Promise<void> {
    await this.expectElementToBeVisible(blogTitleInput);
    await this.clearAllTextFrom(blogTitleInput);
    await this.typeInInputField(blogTitleInput, newBlogPostTitle);
    await this.page.keyboard.press('Tab');
  }

  /**
   * Updates the blog post body with the given text.
   * @param {string} newBodyText - The new body text for the blog post.
   */
  async updateBodyTextTo(newBodyText: string): Promise<void> {
    const bodyVisible = await this.isElementVisible(blogBodyInput);
    if (!bodyVisible) {
      await this.expectElementToBeVisible(editBlogSelector);
      await this.clickOnElementWithSelector(editBlogSelector);
    }
    await this.expectElementToBeVisible(blogBodyInput);
    await this.clearAllTextFrom(blogBodyInput);
    await this.typeInInputField(blogBodyInput, newBodyText);
  }

  /**
   * Creates a draft blog post with the given title and opens its body editor.
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
   * Writes the given HTML to the page clipboard.
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
   * Pastes clipboard content into the blog post content editor.
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
   * Dismisses the paste error box without keeping pasted content.
   */
  async clickOnDismissPasteErrorButton(): Promise<void> {
    await this.expectElementToBeVisible(pasteErrorBox);
    await this.clickOnElementWithSelector(dismissPasteErrorButton);
    await this.expectElementToBeVisible(pasteErrorBox, false);
  }

  /**
   * Accepts the valid portion of pasted content and verifies it appears.
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
   * Cancels the paste flow from the paste error box.
   */
  async clickOnCancelPasteButton(): Promise<void> {
    await this.expectElementToBeVisible(pasteErrorBox);
    await this.clickOnElementWithSelector(cancelPasteButton);
    await this.expectElementToBeVisible(pasteErrorBox, false);
  }

  /**
   * Types in the editor to dismiss the paste error box.
   */
  async typeInRteToDismissError(): Promise<void> {
    await this.expectElementToBeVisible(pasteErrorBox);
    await this.expectElementToBeVisible(blogBodyInput);
    await this.typeInInputField(blogBodyInput, 'qwerty');
    await this.expectElementToBeVisible(pasteErrorBox, false);
  }
}

export const BlogPostEditorFactory = (page: Page): BlogPostEditor =>
  new BlogPostEditor(page);
