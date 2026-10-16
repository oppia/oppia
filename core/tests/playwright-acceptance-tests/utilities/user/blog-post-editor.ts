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
 * @fileoverview Blog post editor utility file for Playwright acceptance tests.
 */

import {Page, expect} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';
import {RTEEditor} from '../common/rte-editor';

const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const blogUrl = testConstants.URLs.Blog;

// Selectors — identical to the Puppeteer version because they share the same
// Angular templates.
const blogTitleInput = 'input.e2e-test-blog-post-title-field';
const thumbnailPhotoBox = 'div.e2e-test-photo-clickable';
const blogAuthorBioField = 'textarea.e2e-test-blog-author-bio-field';
const authorBioSaveButton = 'button.e2e-test-save-author-details-button';
const publishBlogPostButton = 'button.e2e-test-publish-blog-post-button';
const addThumbnailImageButton = 'button.e2e-test-photo-upload-submit';
const usernameInputSelector = '.e2e-test-blog-author-name-field';
const firstPostButtonSelector = '.e2e-test-first-post-button';
const newPostButtonSelector = '.e2e-test-new-post-button';
const blogBodySaveButtonSelector = '.e2e-test-save-blog-post-content';
const tagSelector = '.e2e-test-blog-post-tags';
const saveDraftButtonSelector = '.e2e-test-save-as-draft-button';
const blogPostEditorContainerSelector = '.e2e-test-blog-post-editor-container';
const editBlogBodySelector = '.e2e-test-ck-editor';
const blogTitleHelpSelector = '.e2e-test-blog-title-help';
const previewBlogPostButtonSelector = '.e2e-test-blog-card-preview-button';
const closePreviewModalButtonSelector = '.e2e-test-close-preview-button';
const gridViewButtonSelector = '.e2e-test-tiles-view-button';
const listViewButtonSelector = '.e2e-test-list-view-button';
const editBlogPostBtnSelector = '.e2e-test-edit-blog-post-button';
const deleteBlogPostBtnSelector =
  '.cdk-overlay-pane .e2e-test-delete-blog-post-button';
const editBlogSelector = '.e2e-test-content-button';
const confirmButtonSelector = 'button.e2e-test-confirm-button';
const listOfBlogsInBlogDashboard = '.blog-dashboard-tile-content';
const blogPostTitlePage = '.e2e-test-blog-post-title';
const photoUploadErrorSelector = '.e2e-test-upload-error';

export class BlogPostEditor extends BaseUser {
  /**
   * Navigates to the blog dashboard page.
   */
  async navigateToBlogDashboardPage(): Promise<void> {
    await this.goto(blogDashboardUrl);
  }

  /**
   * Navigates to the blog page.
   */
  async navigateToBlogPage(): Promise<void> {
    await this.goto(blogUrl);
  }

  /**
   * Fills the bio in the register modal shown when first visiting the blog
   * dashboard.
   */
  async updateUserBioInRegisterModal(bio: string): Promise<void> {
    await this.expectElementToBeVisible(blogAuthorBioField);
    await this.clearAllTextFrom(blogAuthorBioField);
    await this.typeInInputField(blogAuthorBioField, bio);
    await this.expectElementValueToBe(blogAuthorBioField, bio);
  }

  /**
   * Fills the username in the register modal shown when first visiting the
   * blog dashboard.
   */
  async updateUsernameInRegisterModal(username: string): Promise<void> {
    await this.expectElementToBeVisible(usernameInputSelector);
    await this.clearAllTextFrom(usernameInputSelector);
    await this.typeInInputField(usernameInputSelector, username);
    await this.expectElementValueToBe(usernameInputSelector, username);
  }

  /**
   * Clicks the Save button in the blog profile modal.
   */
  async clickOnSaveProfileButton(): Promise<void> {
    await this.expectElementToBeVisible(authorBioSaveButton);
    await this.clickOnElementWithSelector(authorBioSaveButton);
    await this.expectElementToBeVisible(authorBioSaveButton, false);
  }

  /**
   * Checks the disabled/enabled state of the Save button in the profile
   * register modal.
   */
  async expectRegisterButtonToBe(
    status: 'disabled' | 'enabled' | 'hidden'
  ): Promise<void> {
    if (status === 'hidden') {
      await this.expectElementToBeVisible(authorBioSaveButton, false);
    } else if (status === 'disabled') {
      await this.expectElementToBeClickable(authorBioSaveButton, false);
    } else {
      await this.expectElementToBeClickable(authorBioSaveButton);
    }
  }

  /**
   * Checks whether the "+ Blog Post" (new post) button is visible.
   */
  async expectNewBlogPostButtonToBeVisible(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(newPostButtonSelector, visible);
  }

  /**
   * Checks whether the "Create new blog post" (first post) button is visible.
   */
  async expectFirstBlogPostButtonToBeVisible(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(firstPostButtonSelector, visible);
  }

  /**
   * Checks that the blog editor container is on screen.
   */
  async expectToBeOnBlogEditorPage(): Promise<void> {
    await this.expectElementToBeVisible(blogPostEditorContainerSelector);
  }

  /**
   * Uploads a thumbnail image. On desktop this clicks the photo box first
   * to open the upload modal; on mobile the input is always visible.
   */
  async uploadBlogPostThumbnailImage(
    imagePath: string = testConstants.data.blogPostThumbnailImage
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
      await this.page.waitForSelector('body.modal-open', {state: 'hidden'});
    }
  }

  /**
   * Clicks on the thumbnail photo box to open the upload dialog (desktop
   * only).
   */
  async clickOnThumbnailImage(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      showMessage('Skipped: click on thumbnail image (mobile).');
      return;
    }
    await this.expectElementToBeVisible(thumbnailPhotoBox);
    await this.clickOnElementWithSelector(thumbnailPhotoBox);
  }

  /**
   * Checks the error message that appears when an invalid image is uploaded.
   */
  async expectPhotoUploadErrorMessageToBe(
    expectedMessage: string
  ): Promise<void> {
    await this.expectElementToBeVisible(photoUploadErrorSelector);
    await this.expectElementContentToContain(
      photoUploadErrorSelector,
      expectedMessage
    );
  }

  /**
   * Updates the blog post title field.
   */
  async updateBlogPostTitle(newBlogPostTitle: string): Promise<void> {
    await this.expectElementToBeVisible(blogTitleInput);
    await this.clearAllTextFrom(blogTitleInput);
    await this.typeInInputField(blogTitleInput, newBlogPostTitle);
    await this.page.keyboard.press('Tab');
    const modelValue = await this.page.$eval(
      blogTitleInput,
      el => (el as HTMLInputElement).value
    );
    if (modelValue !== newBlogPostTitle) {
      throw new Error(
        `Title is not updated! Found ${modelValue}, expected ${newBlogPostTitle}`
      );
    }
  }

  /**
   * Checks that the title validation help text contains the given string.
   */
  async expectBlogTitleHelpToContain(helpText: string): Promise<void> {
    await this.expectElementToBeVisible(blogTitleHelpSelector);
    const blogTitleHelpContents = await this.page.$$eval(
      blogTitleHelpSelector,
      elements => elements.map(element => element.textContent)
    );
    expect(blogTitleHelpContents).toContain(helpText);
  }

  /**
   * Uses all available RTE features to fill the blog body and then saves.
   */
  async updateBlogBodyUsingAllRTEFeatures(): Promise<void> {
    await this.expectElementToBeVisible(editBlogBodySelector);
    const rteEditor = new RTEEditor(this);

    // Heading paragraph.
    await this.clickOnElementWithSelector(editBlogBodySelector);
    await rteEditor.changeFormatTo('heading');
    await this.page.keyboard.type('Test Heading\n');

    // Normal paragraph.
    await rteEditor.changeFormatTo('normal');
    await this.page.keyboard.type('Test Normal Paragraph\n');

    // Bold text.
    await rteEditor.clickOnRTEOptionWithTitle('Bold');
    await this.page.keyboard.type('Test Bold Text\n');
    await rteEditor.clickOnRTEOptionWithTitle('Bold');

    // Italic text.
    await rteEditor.clickOnRTEOptionWithTitle('Italic');
    await this.page.keyboard.type('Test Italic Text\n');
    await rteEditor.clickOnRTEOptionWithTitle('Italic');

    // Numbered list, Increase Indent, and Decrease Indent.
    await rteEditor.clickOnRTEOptionWithTitle('Numbered List');
    await this.page.keyboard.type('Numbered List Item 1\n');
    await rteEditor.clickOnRTEOptionWithTitle('Increase Indent');
    await this.page.keyboard.type('Numbered List Item 1.1\n');
    await rteEditor.clickOnRTEOptionWithTitle('Decrease Indent');
    await this.page.keyboard.type('Numbered List Item 2\n');
    await rteEditor.clickOnRTEOptionWithTitle('Numbered List');

    // Bulleted list.
    await rteEditor.clickOnRTEOptionWithTitle('Bulleted List');
    await this.page.keyboard.type('Bulleted List Item 1\n');
    await this.page.keyboard.type('Bulleted List Item 2\n');
    await rteEditor.clickOnRTEOptionWithTitle('Bulleted List');

    // Pre formatted text.
    await rteEditor.clickOnRTEOptionWithTitle('Pre');
    await this.page.keyboard.type('Pre formatted text\n');

    // Block quote.
    await rteEditor.clickOnRTEOptionWithTitle('Block Quote');
    await this.page.keyboard.type('Block Quote text\n');
    await rteEditor.clickOnRTEOptionWithTitle('Block Quote');

    // Save changes.
    await this.saveBlogBodyChanges();
  }

  /**
   * Opens the blog post preview modal.
   */
  async previewBlogPost(): Promise<void> {
    await this.expectElementToBeVisible(previewBlogPostButtonSelector);
    await this.clickOnElementWithSelector(previewBlogPostButtonSelector);
  }

  /**
   * Closes the blog post preview modal.
   */
  async closePreviewModal(): Promise<void> {
    await this.expectElementToBeVisible(closePreviewModalButtonSelector);
    await this.clickOnElementWithSelector(closePreviewModalButtonSelector);
    await this.expectElementToBeVisible(closePreviewModalButtonSelector, false);
  }

  /**
   * Saves the blog post as a draft.
   */
  async saveTheDraftBlogPost(): Promise<void> {
    await this.expectElementToBeVisible(saveDraftButtonSelector);
    await this.clickOnElementWithSelector(saveDraftButtonSelector);
    // Wait until the save button becomes disabled (save complete).
    await this.page.waitForFunction((selector: string) => {
      const element = document.querySelector(selector);
      return (element as HTMLButtonElement)?.disabled === true;
    }, saveDraftButtonSelector);
  }

  /**
   * Checks that the currently selected tab header in the blog dashboard
   * matches the given text (e.g. 'DRAFTS (1)').
   */
  async expectCurrentMatTabHeaderToBe(expectedHeader: string): Promise<void> {
    const activeTabSelector = '.mat-tab-label-active .mat-tab-label-content';
    await this.expectElementToBeVisible(activeTabSelector);
    await this.expectTextContentToBe(activeTabSelector, expectedHeader);
  }

  /**
   * Checks that both the tiles-view and list-view toggle buttons are visible
   * (desktop only).
   */
  async expectTilesViewAndListViewButtonsArePresent(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      showMessage(
        'Skipped: tiles/list view buttons are not present on mobile.'
      );
      return;
    }
    await this.expectElementToBeVisible(gridViewButtonSelector);
    await this.expectElementToBeVisible(listViewButtonSelector);
  }

  /**
   * Clicks the tiles-view or list-view toggle button and verifies the
   * corresponding container becomes visible.
   */
  async changeBlogPostViewTo(view: 'tiles' | 'list'): Promise<void> {
    const selector = `.e2e-test-${view}-view-button`;
    const viewContainerSelector = `.e2e-test-${view}-view-dashboard`;
    await this.expectElementToBeVisible(selector);
    await this.clickOnElementWithSelector(selector);
    await this.expectElementToBeVisible(viewContainerSelector);
  }

  /**
   * Clicks the edit (three-dots) menu for a draft post with the given title
   * and then clicks the Edit button.
   */
  async editDraftBlogPostWithTitle(draftBlogPostTitle: string): Promise<void> {
    await this.expectElementToBeVisible(listOfBlogsInBlogDashboard);
    const allDraftBlogPosts = await this.page.$$(listOfBlogsInBlogDashboard);
    for (let i = 0; i < allDraftBlogPosts.length; i++) {
      const checkDraftBlogPostTitle = await allDraftBlogPosts[i].$eval(
        blogPostTitlePage,
        element => (element as HTMLElement).innerText
      );
      if (draftBlogPostTitle === checkDraftBlogPostTitle) {
        await allDraftBlogPosts[i].$eval(
          '.e2e-test-blog-post-edit-box',
          element => (element as HTMLElement).click()
        );
        await this.clickOnElementWithSelector(editBlogPostBtnSelector);
        return;
      }
    }
    throw new Error(
      `Draft blog post with title ${draftBlogPostTitle} not found.`
    );
  }

  /**
   * Deletes the draft blog post with the given title via its three-dots menu.
   */
  async deleteDraftBlogPostWithTitle(
    draftBlogPostTitle: string
  ): Promise<void> {
    await this.expectElementToBeVisible(listOfBlogsInBlogDashboard);
    const allDraftBlogPosts = await this.page.$$(listOfBlogsInBlogDashboard);
    for (let i = 0; i < allDraftBlogPosts.length; i++) {
      const checkDraftBlogPostTitle = await allDraftBlogPosts[i].$eval(
        blogPostTitlePage,
        element => (element as HTMLElement).innerText
      );
      if (draftBlogPostTitle === checkDraftBlogPostTitle) {
        await this.clickOnElementWithSelector(
          '.e2e-test-blog-post-edit-box',
          {},
          allDraftBlogPosts[i]
        );
        await this.expectElementToBeClickable(deleteBlogPostBtnSelector);
        await this.clickOnElementWithSelector(deleteBlogPostBtnSelector);
        await this.expectElementToBeVisible('div.modal-dialog');
        await this.clickOnElementWithSelector(confirmButtonSelector);
        await this.expectElementToBeVisible(confirmButtonSelector, false);
        showMessage('Draft blog post deleted successfully.');
        return;
      }
    }
    throw new Error(
      'Draft blog post with given title does not exist in the blog dashboard!'
    );
  }

  /**
   * Checks that the Publish button is currently disabled.
   */
  async expectPublishButtonToBeDisabled(): Promise<void> {
    await this.page.waitForSelector(publishBlogPostButton);
    const isDisabled = await this.page.$eval(
      publishBlogPostButton,
      button => (button as HTMLButtonElement).disabled
    );
    if (!isDisabled) {
      throw new Error(
        'Publish button is not disabled when blog post data is incomplete.'
      );
    }
    showMessage('Publish button is correctly disabled.');
  }

  /**
   * Sets the body text of the blog post. Opens the edit mode first if needed.
   */
  async updateBodyTextTo(newBodyText: string): Promise<void> {
    const blogBodyInput = 'div.e2e-test-rte';
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
   * Clicks the Save button for the blog body content.
   */
  async saveBlogBodyChanges(skipVerification: boolean = false): Promise<void> {
    await this.expectElementToBeVisible(blogBodySaveButtonSelector);
    await this.clickOnElementWithSelector(blogBodySaveButtonSelector);
    if (!skipVerification) {
      await this.expectElementToBeVisible(blogBodySaveButtonSelector, false);
    }
  }

  /**
   * Selects (or deselects) a tag in the blog editor.
   */
  async selectTag(tag: string, shouldBePresent: boolean = true): Promise<void> {
    const blogBodyInput = 'div.e2e-test-rte';
    // On mobile the tag controls are inside the edit view.
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
        const expectedAriaPressed = shouldBePresent ? 'true' : 'false';
        // Use Playwright's built-in retry assertion instead of waitForFunction
        // to avoid passing ElementHandle across the browser/Node context boundary.
        const buttonLocator = this.page
          .locator(tagSelector)
          .filter({hasText: tag})
          .locator('button');
        await expect(buttonLocator).toHaveAttribute(
          'aria-pressed',
          expectedAriaPressed
        );
        return;
      }
    }
  }

  /**
   * Checks that the blog post with the given title appears on the blog page.
   */
  async expectBlogPostToBePresent(blogPostTitle: string): Promise<void> {
    const blogPostTitleSelector = '.e2e-test-blog-post-tile-title';
    await this.expectElementToBeVisible(blogPostTitleSelector);
    const titles = await this.page.$$eval(blogPostTitleSelector, elements =>
      elements.map(el => el.textContent?.trim() ?? '')
    );
    if (!titles.includes(blogPostTitle)) {
      throw new Error(
        `Blog post with title "${blogPostTitle}" was not found on the blog page.`
      );
    }
    showMessage(`Blog post "${blogPostTitle}" is present on the blog page.`);
  }
}

export const BlogPostEditorFactory = (page: Page): BlogPostEditor =>
  new BlogPostEditor(page);
