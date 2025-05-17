// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Blog Admin users utility file.
 */

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const blogTitleInput = 'input.e2e-test-blog-post-title-field';
const blogBodyInput = 'div.e2e-test-rte';
const thumbnailPhotoBox = 'div.e2e-test-photo-clickable';
const unauthErrorContainer = 'div.e2e-test-error-container';
const blogDashboardAuthorDetailsModal = 'div.modal-dialog';
const blogAuthorBioField = 'textarea.e2e-test-blog-author-bio-field';
const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const authorBioSaveButton = 'button.e2e-test-save-author-details-button';
const confirmButton = 'button.e2e-test-confirm-button';
const publishBlogPostButton = 'button.e2e-test-publish-blog-post-button';
const addThumbnailImageButton = 'button.e2e-test-photo-upload-submit';
const blogPostThumbnailImage = testConstants.data.blogPostThumbnailImage;
const toastMessage = 'div.e2e-test-toast-warning-message';
const blogPostTitlePage = '.e2e-test-blog-post-title';
const listOfBlogsInBlogDashboard = '.blog-dashboard-tile-content';

const LABEL_FOR_NEW_BLOG_POST_CREATE_BUTTON = 'CREATE NEW BLOG POST';
const LABEL_FOR_SAVE_BUTTON = 'Save';
const LABEL_FOR_DONE_BUTTON = 'DONE';
const LABEL_FOR_SAVE_DRAFT_BUTTON = 'SAVE AS DRAFT';
const LABEL_FOR_DELETE_BUTTON = 'Delete';
const LABEL_FOR_CONFIRM_BUTTON = 'Confirm';

export class BlogPostEditor extends BaseUser {
  /**
   * Function for adding blog post author bio in blog dashboard.
   */
  async addUserBioInBlogDashboard(): Promise<void> {
    const inputBar = await this.page.$(blogAuthorBioField);
    // It is used here to avoid filling the user bio each time. We fill it only once when
    // the user is accessing the blog dashboard for the first time.
    if (inputBar) {
      await this.type(blogAuthorBioField, 'Dummy-User-Bio');
      await this.page.waitForSelector(`${authorBioSaveButton}:not([disabled])`);
      await this.clickOn(LABEL_FOR_SAVE_BUTTON);
    }
  }

  /**
   * Function for navigating to the blog dashboard page.
   */
  async navigateToBlogDashboardPage(): Promise<void> {
    await this.goto(blogDashboardUrl);
  }

  /**
   * This function creates a blog post with given title.
   * to be created.
   */
  async createDraftBlogPostWithTitle(
    draftBlogPostTitle: string
  ): Promise<void> {
    await this.addUserBioInBlogDashboard();
    await this.clickOn(LABEL_FOR_NEW_BLOG_POST_CREATE_BUTTON);
    await this.updateTitleTo(draftBlogPostTitle);
    await this.updateBodyTextTo('test blog post body content');
    await this.saveTheChanges();
    await this.saveTheDraftBlogPost();

    showMessage('Successfully created a draft blog post!');
    await this.goto(blogDashboardUrl);
  }

  /**
   * This function deletes a draft blog post with given title.
   */
  async deleteDraftBlogPostWithTitle(
    draftBlogPostTitle: string
  ): Promise<void> {
    const allDraftBlogPosts = await this.page.$$(listOfBlogsInBlogDashboard);
    for (let i = 0; i < allDraftBlogPosts.length; i++) {
      let checkDraftBlogPostTitle = await allDraftBlogPosts[i].$eval(
        blogPostTitlePage,
        element => (element as HTMLElement).innerText
      );
      if (draftBlogPostTitle === checkDraftBlogPostTitle) {
        await allDraftBlogPosts[i].$eval(
          '.e2e-test-blog-post-edit-box',
          element => (element as HTMLElement).click()
        );
        await this.clickOn(LABEL_FOR_DELETE_BUTTON);
        await this.doWithinModal({
          selector: 'div.modal-dialog',
          whenOpened: async (_this: BaseUser, container: string) => {
            _this.clickOn(LABEL_FOR_CONFIRM_BUTTON);
          },
        });
        showMessage('Draft blog post with given title deleted successfully!');
        return;
      }
    }
  }

  /**
   * This function checks if the Publish button is disabled.
   */
  async expectPublishButtonToBeDisabled(): Promise<void> {
    await this.page.waitForSelector(publishBlogPostButton);
    const publishedButtonIsDisabled = await this.page.$eval(
      publishBlogPostButton,
      button => (button as HTMLButtonElement).disabled
    );
    if (!publishedButtonIsDisabled) {
      throw new Error(
        'Published button is not disabled when the blog post data is not' +
          ' completely filled.'
      );
    }
    showMessage(
      'Published button is disabled when blog post data is not completely' +
        ' filled.'
    );
  }

  /**
   * This function uploads a blog post thumbnail image.
   */
  async uploadBlogPostThumbnailImage(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.uploadFile(blogPostThumbnailImage);
      await this.clickOn(addThumbnailImageButton);
    } else {
      await this.clickOn(thumbnailPhotoBox);
      await this.uploadFile(blogPostThumbnailImage);
      await this.clickOn(addThumbnailImageButton);
      await this.page.waitForSelector('body.modal-open', {hidden: true});
    }
  }

  /**
   * This is a composite function that can be used when a straightforward, simple blog published is required.
   * This function publishes a blog post with given title.
   */
  async publishNewBlogPost(newBlogPostTitle: string): Promise<string> {
    await this.openBlogEditorPage();
    await this.uploadBlogPostThumbnailImage();
    await this.expectPublishButtonToBeDisabled();

    await this.updateTitleTo(newBlogPostTitle);
    await this.updateBodyTextTo('test blog post body content');
    await this.selectTags('News', 'International');
    const blogId = (await this.page.url().split('/').pop()) as string;
    await this.saveTheChanges();

    await this.publishTheBlogPost();
    return blogId;
  }

  /**
   * This function navigates to the blog editor page.
   */
  async openBlogEditorPage(): Promise<void> {
    await this.addUserBioInBlogDashboard();
    await this.clickOn(LABEL_FOR_NEW_BLOG_POST_CREATE_BUTTON);
    await this.expectPublishButtonToBeDisabled();
  }

  /**
   * This function updates the title of the blog post.
   */
  async updateTitleTo(newBlogPostTitle: string): Promise<void> {
    await this.type(blogTitleInput, newBlogPostTitle);
    await this.page.keyboard.press('Tab');
  }

  /**
   * This function updates the body text of the blog post.
   */
  async updateBodyTextTo(newBodyText: string): Promise<void> {
    await this.type(blogBodyInput, newBodyText);
  }

  /**
   * This function saves the blog post.
   */
  async saveTheChanges(): Promise<void> {
    await this.clickOn(LABEL_FOR_DONE_BUTTON);
  }

  /**
   * This function selects two tags for the blog post.
   */
  async selectTags(Tag1: string, Tag2: string): Promise<void> {
    await this.clickOn(Tag1);
    await this.clickOn(Tag2);
  }

  /**
   * This function saves the draft blog post.
   */
  async saveTheDraftBlogPost(): Promise<void> {
    await this.clickOn(LABEL_FOR_SAVE_DRAFT_BUTTON);
  }

  /**
   * This function publishes the blog post.
   */
  async publishTheBlogPost(): Promise<void> {
    await this.clickOn('PUBLISH');
    await this.page.waitForSelector(confirmButton);
    await this.clickOn(LABEL_FOR_CONFIRM_BUTTON);
    showMessage('Successfully published a blog post!');
  }

  /**
   * This function creates a new blog post with the given title.
   */
  async createNewBlogPostWithTitle(newBlogPostTitle: string): Promise<void> {
    await this.clickOn('NEW POST');
    await this.expectPublishButtonToBeDisabled();

    await this.uploadBlogPostThumbnailImage();
    await this.expectPublishButtonToBeDisabled();

    await this.updateTitleTo(newBlogPostTitle);
    await this.updateBodyTextTo('test blog post body content - duplicate');
    await this.selectTags('News', 'International');
    await this.saveTheChanges();
  }

  /**
   * This function deletes a published blog post with the given title.
   */
  async deletePublishedBlogPostWithTitle(blogPostTitle: string): Promise<void> {
    await this.clickOn('PUBLISHED');
    const allPublishedBlogPosts = await this.page.$$(
      listOfBlogsInBlogDashboard
    );
    for (let i = 0; i < allPublishedBlogPosts.length; i++) {
      let publishedBlogPostTitle = await allPublishedBlogPosts[i].$eval(
        blogPostTitlePage,
        element => (element as HTMLElement).innerText
      );
      if (publishedBlogPostTitle === blogPostTitle) {
        await allPublishedBlogPosts[i].$eval(
          '.e2e-test-blog-post-edit-box',
          element => (element as HTMLElement).click()
        );
        await this.clickOn(LABEL_FOR_DELETE_BUTTON);
        await this.page.waitForSelector(confirmButton);
        await this.clickOn(LABEL_FOR_CONFIRM_BUTTON);
        showMessage(
          'Published blog post with given title deleted successfully!'
        );
        return;
      }
    }
  }

  /**
   * This function checks that the user is unable to publish a blog post.
   */
  async expectUserUnableToPublishBlogPost(
    expectedWarningMessage: string
  ): Promise<void> {
    const toastMessageBox = await this.page.$(toastMessage);
    const toastMessageWarning = await this.page.evaluate(
      (element: HTMLDivElement) => element.textContent,
      toastMessageBox
    );
    const isPublishButtonDisabled = await this.page.$eval(
      publishBlogPostButton,
      button => (button as HTMLButtonElement).disabled
    );

    if (!isPublishButtonDisabled) {
      throw new Error('User is able to publish the blog post');
    }
    if (expectedWarningMessage !== toastMessageWarning) {
      throw new Error(
        'Expected warning message is not same as the actual warning message\n' +
          `Expected warning: ${expectedWarningMessage}\n` +
          `Displayed warning: ${toastMessageWarning}\n`
      );
    }

    showMessage(
      'User is unable to publish the blog post because ' + toastMessageWarning
    );
  }

  /**
   * This function checks the number of the blog posts in the blog dashboard.
   */
  async expectNumberOfBlogPostsToBe(number: number): Promise<void> {
    const allBlogPosts = await this.page.$$(listOfBlogsInBlogDashboard);
    if (allBlogPosts.length !== number) {
      throw new Error(`Number of blog posts is not equal to ${number}`);
    }

    showMessage(`Number of blog posts is equal to ${number}`);
  }

  /**
   * This function navigates to the Published tab in the blog-dashbaord.
   */
  async navigateToPublishTab(): Promise<void> {
    await this.goto(blogDashboardUrl);
    await this.clickOn('PUBLISHED');
    showMessage('Navigated to publish tab.');
  }

  /**
   * This function checks a draft blog post to be created with the given title.
   */
  async expectDraftBlogPostWithTitleToBePresent(
    checkDraftBlogPostByTitle: string
  ): Promise<void> {
    await this.goto(blogDashboardUrl);
    const allDraftBlogPosts = await this.page.$$(listOfBlogsInBlogDashboard);
    let count = 0;
    for (let i = 0; i < allDraftBlogPosts.length; i++) {
      let draftBlogPostTitle = await allDraftBlogPosts[i].$eval(
        blogPostTitlePage,
        element => (element as HTMLElement).innerText
      );
      if (draftBlogPostTitle === checkDraftBlogPostByTitle) {
        count++;
      }
    }
    if (count === 0) {
      throw new Error(
        `Draft blog post with title ${checkDraftBlogPostByTitle} does not` +
          ' exist!'
      );
    } else if (count > 1) {
      throw new Error(
        `Draft blog post with title ${checkDraftBlogPostByTitle} exists` +
          ' more than once!'
      );
    }
    showMessage(
      `Draft blog post with title ${checkDraftBlogPostByTitle} exists!`
    );
  }

  /**
   * This function checks if the blog post with given title is published.
   */
  async expectPublishedBlogPostWithTitleToBePresent(
    blogPostTitle: string
  ): Promise<void> {
    await this.goto(blogDashboardUrl);
    await this.clickOn('PUBLISHED');
    await this.waitForPageToFullyLoad();

    const allPublishedBlogPosts = await this.page.$$(
      listOfBlogsInBlogDashboard
    );
    let count = 0;
    for (let i = 0; i < allPublishedBlogPosts.length; i++) {
      let publishedBlogPostTitle = await allPublishedBlogPosts[i].$eval(
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
   * This function checks if the blog dashboard is not accessible by the user.
   */
  async expectBlogDashboardAccessToBeUnauthorized(): Promise<void> {
    await this.goto(blogDashboardUrl);
    try {
      await this.page.waitForSelector(unauthErrorContainer);
      showMessage('User unauthorized to access blog dashboard!');
    } catch (err) {
      throw new Error(
        'No unauthorization error on accessing the blog dashboard page!'
      );
    }
  }

  /**
   * This function checks if the blog dashboard is accessible by the user.
   */
  async expectBlogDashboardAccessToBeAuthorized(): Promise<void> {
    /** Here we are trying to check if the blog dashboard is accessible to the
     * guest user after giving the blog admin role to it. There is a
     * modal dialog box asking for the user name and bio for the users
     * given blog admin role as they first time opens the blog-dashboard. */
    await this.goto(blogDashboardUrl);
    try {
      await this.page.waitForSelector(blogDashboardAuthorDetailsModal);
      showMessage('User authorized to access blog dashboard!');
    } catch (err) {
      throw new Error('User unauthorized to access blog dashboard!');
    }
  }
}

export let BlogPostEditorFactory = (): BlogPostEditor => new BlogPostEditor();
