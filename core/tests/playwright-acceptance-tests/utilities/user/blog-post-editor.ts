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
const blogBodySaveButtonSelector = '.e2e-test-save-blog-post-content';
const blogAuthorBioField = 'textarea.e2e-test-blog-author-bio-field';
const usernameInputSelector = '.e2e-test-blog-author-name-field';
const authorBioSaveButton = 'button.e2e-test-save-author-details-button';
const listOfBlogsInBlogDashboard = '.blog-dashboard-tile-content';
const pasteErrorBox = '.e2e-test-oppia-rte-paste-error-box';
const dismissPasteErrorButton = '.e2e-test-oppia-dismiss-paste-error-button';
const pasteValidComponentsButton = '.e2e-test-oppia-paste-valid-content-button';
const cancelPasteButton = '.e2e-test-oppia-cancel-rte-paste-button';
const editBlogBodySelector = '.e2e-test-ck-editor';
const editBlogSelector = '.e2e-test-content-button';

export class BlogPostEditor extends BaseUser {
  constructor(page: Page) {
    super(page);
  }

  async navigateToBlogDashboardPage(): Promise<void> {
    await this.goto(blogDashboardUrl);
  }

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

  async expectNumberOfBlogPostsToBe(number: number): Promise<void> {
    const allBlogPosts = await this.page.$$(listOfBlogsInBlogDashboard);
    if (allBlogPosts.length !== number) {
      throw new Error(`Number of blog posts is not equal to ${number}`);
    }
    showMessage(`Number of blog posts is equal to ${number}`);
  }

  async updateBlogPostTitle(newBlogPostTitle: string): Promise<void> {
    await this.expectElementToBeVisible(blogTitleInput);
    await this.clearAllTextFrom(blogTitleInput);
    await this.typeInInputField(blogTitleInput, newBlogPostTitle);
    await this.page.keyboard.press('Tab');
  }

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

  async createDraftBlogPostWithTitleAndOpenBodyRte(
    draftBlogPostTitle: string
  ): Promise<void> {
    await this.addUserBioInBlogDashboard();
    await this.clickOnElementWithSelector(newBlogPostButtonSelector);
    await this.updateBlogPostTitle(draftBlogPostTitle);
    await this.updateBodyTextTo('test blog post body content');
  }

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

  async pasteContentInBlogPostContentRte(): Promise<void> {
    await this.page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(mobileBlogBodyInputWithText);
      await this.page.click(mobileBlogBodyInputWithText);
    } else {
      await this.expectElementToBeVisible(blogBodyInput);
      await this.page.click(blogBodyInput);
    }
    await this.page.keyboard.down(modifier);
    await this.page.keyboard.press('KeyV');
    await this.page.keyboard.up(modifier);
  }

  async clickOnDismissPasteErrorButton(): Promise<void> {
    await this.expectElementToBeVisible(pasteErrorBox);
    await this.clickOnElementWithSelector(dismissPasteErrorButton);
    await this.expectElementToBeVisible(pasteErrorBox, false);
  }

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

  async clickOnCancelPasteButton(): Promise<void> {
    await this.expectElementToBeVisible(pasteErrorBox);
    await this.clickOnElementWithSelector(cancelPasteButton);
    await this.expectElementToBeVisible(pasteErrorBox, false);
  }

  async typeInRteToDismissError(): Promise<void> {
    await this.expectElementToBeVisible(pasteErrorBox);
    await this.expectElementToBeVisible(blogBodyInput);
    await this.typeInInputField(blogBodyInput, 'qwerty');
    await this.expectElementToBeVisible(pasteErrorBox, false);
  }
}

export const BlogPostEditorFactory = (page: Page): BlogPostEditor =>
  new BlogPostEditor(page);
