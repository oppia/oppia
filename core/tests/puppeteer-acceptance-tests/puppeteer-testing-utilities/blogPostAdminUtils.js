// Copyright 2023 The Oppia Authors. All Rights Reserved.
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

const puppeteerUtilities = require('./puppeteer_utils.js');
const testConstants = require(
  '../puppeteer-testing-utilities/testConstants.js');

const blogTitleInput = 'input.e2e-test-blog-post-title-field';
const blogBodyInput = 'div.e2e-test-rte';
const thumbnailPhotoBox = 'e2e-test-photo-clickable';
const unauthErrorContainer = 'div.e2e-test-error-container';
const blogDashboardAuthorDetailsModal = 'div.modal-dialog';
const roleUpdateUsernameInput = 'input#label-target-update-form-name';
const blogEditorUsernameInput = 'input#label-target-form-reviewer-username';
const maximumTagLimitInput = 'input#mat-input-0';
const blogAuthorBioField = 'textarea.e2e-test-blog-author-bio-field';
const blogDashboardUrl = testConstants.URLs.BlogDashboard;

module.exports = class e2eBlogPostAdmin extends puppeteerUtilities {
  async addUserBioInBlogDashboard() {
    await this.type(blogAuthorBioField, 'Dummy-User-Bio');
    await this.page.waitForSelector(
      'button.e2e-test-save-author-details-button:not([disabled])');
    await this.clickOn('button', ' Save ');
  }

  async createDraftBlogPostWithTitle(draftBlogPostTitle) {
    await this.addUserBioInBlogDashboard();
    // See Note-1 below.
    await this.page.waitForTimeout(500);
    await this.clickOn('span', ' CREATE NEW BLOG POST ');
    await this.type(blogTitleInput, draftBlogPostTitle);
    await this.page.keyboard.press('Tab');
    await this.type(blogBodyInput, 'test blog post body content');
    await this.clickOn('span', ' DONE ');
    await this.page.waitForSelector(
      'button.e2e-test-save-as-draft-button:not([disabled])');
    await this.clickOn('span', 'SAVE AS DRAFT');

    console.log('Successfully created a draft blog post!');
  }

  async deleteDraftBlogPostWithTitle(draftBlogPostTitle) {
    await this.page.exposeFunction('deleteDraftBlogPost', async() => {
      // See Note-2 below.
      await this.page.waitForTimeout(100);
      await this.clickOn('span', 'Delete');
      await this.page.waitForSelector('div.modal-dialog');
      await this.clickOn('button', ' Confirm ');
      console.log('Draft blog post with given title deleted successfully!');
    });
    await this.page.evaluate(async({draftBlogPostTitle}) => {
      const allDraftBlogPosts = document.getElementsByClassName(
        'blog-dashboard-tile-content');
      for (let i = 0; i < allDraftBlogPosts.length; i++) {
        let checkDraftBlogPostTitle = allDraftBlogPosts[i].
          getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if (draftBlogPostTitle === checkDraftBlogPostTitle) {
          allDraftBlogPosts[i].getElementsByClassName(
            'e2e-test-blog-post-edit-box')[0].click();
          await window.deleteDraftBlogPost();
          return;
        }
      }
    }, {draftBlogPostTitle});
  }

  async expectPublishButtonToBeDisabled() {
    await this.page.waitForSelector('button.e2e-test-publish-blog-post-button');
    await this.page.evaluate(() => {
      const publishedButtonIsDisabled = document.getElementsByClassName(
        'e2e-test-publish-blog-post-button')[0].disabled;
      if (!publishedButtonIsDisabled) {
        throw new Error(
          'Published button is not disabled when the ' +
          'blog post data is not completely filled');
      }
    });
    console.log(
      'Published button is disabled when blog post data ' +
      'is not completely filled.');
  }

  async publishNewBlogPostWithTitle(newBlogPostTitle) {
    await this.addUserBioInBlogDashboard();
    // See Note-1 below.
    await this.page.waitForTimeout(500);
    await this.clickOn('span', ' CREATE NEW BLOG POST ');

    await this.expectPublishButtonToBeDisabled();
    await this.clickOn('button', 'mat-button-toggle-button');
    await this.expectPublishButtonToBeDisabled();
    await this.clickOn('div', thumbnailPhotoBox);
    await this.uploadFile('collection.svg');
    await this.clickOn('button', ' Add Thumbnail Image ');
    await this.page.waitForSelector('body.modal-open', {hidden: true});
    await this.expectPublishButtonToBeDisabled();

    await this.type(blogTitleInput, newBlogPostTitle);
    await this.page.keyboard.press('Tab');
    await this.type(blogBodyInput, 'test blog post body content');
    await this.clickOn('span', ' DONE ');

    await this.page.waitForSelector(
      'button.e2e-test-publish-blog-post-button:not([disabled])');
    await this.clickOn('span', 'PUBLISH');
    await this.page.waitForSelector('button.e2e-test-confirm-button');
    await this.clickOn('button', ' Confirm ');
    console.log('Successfully published a blog post!');
  }

  async deletePublishedBlogPostWithTitle(toDeletePublishedBlogPostTitle) {
    await this.clickOn('div', 'PUBLISHED');
    await this.page.exposeFunction('deletePublishedBlogPost', async() => {
      // See Note-2 below.
      await this.page.waitForTimeout(100);
      await this.clickOn('span', 'Delete');
      await this.page.waitForSelector('button.e2e-test-confirm-button');
      await this.clickOn('button', ' Confirm ');
      console.log('Published blog post with given title deleted successfully!');
    });
    await this.page.evaluate(async(toDeletePublishedBlogPostTitle) => {
      const allPublishedBlogPosts = document.getElementsByClassName(
        'blog-dashboard-tile-content');
      for (let i = 0; i < allPublishedBlogPosts.length; i++) {
        let publishedBlogPostTitle = allPublishedBlogPosts[i].
          getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if (publishedBlogPostTitle === toDeletePublishedBlogPostTitle) {
          allPublishedBlogPosts[i].getElementsByClassName(
            'e2e-test-blog-post-edit-box')[0].click();
          await window.deletePublishedBlogPost();
          return;
        }
      }
    }, toDeletePublishedBlogPostTitle);
  }

  async expectNumberOfDraftOrPublishedBlogPostsToBe(number) {
    await this.page.evaluate(async(number) => {
      const allDraftBlogPosts = document.getElementsByClassName(
        'blog-dashboard-tile-content');
      if (allDraftBlogPosts.length !== number) {
        throw new Error(
          'Number of draft/published blog posts is not equal to ' +
          number);
      }
    }, number);

    console.log('Number of draft/published blog posts is equal to ' + number);
  }

  async expectDraftBlogPostWithTitleToBePresent(checkDraftBlogPostByTitle) {
    await this.page.evaluate(async(checkDraftBlogPostByTitle) => {
      const allDraftBlogPosts = document.getElementsByClassName(
        'blog-dashboard-tile-content');
      let count = 0;
      for (let i = 0; i < allDraftBlogPosts.length; i++) {
        let draftBlogPostTitle = allDraftBlogPosts[i].getElementsByClassName(
          'e2e-test-blog-post-title')[0].innerText;
        if (draftBlogPostTitle === checkDraftBlogPostByTitle) {
          count++;
        }
      }
      if (count === 0) {
        throw new Error(
          'Draft blog post with title ' +
          checkDraftBlogPostByTitle + ' does not exist!');
      } else if (count > 1) {
        throw new Error(
          'Draft blog post with title ' +
          checkDraftBlogPostByTitle + ' exists more than once!');
      }
    }, checkDraftBlogPostByTitle);
    console.log(
      'Draft blog post with title ' + checkDraftBlogPostByTitle +
      ' exists!');
  }

  async expectDraftBlogPostWithTitleToBeAbsent(checkDraftBlogPostByTitle) {
    await this.page.evaluate(async(checkDraftBlogPostByTitle) => {
      const allDraftBlogPosts = document.getElementsByClassName(
        'blog-dashboard-tile-content');
      let count = 0;
      for (let i = 0; i < allDraftBlogPosts.length; i++) {
        let draftBlogPostTitle = allDraftBlogPosts[i].getElementsByClassName(
          'e2e-test-blog-post-title')[0].innerText;
        if (draftBlogPostTitle === checkDraftBlogPostByTitle) {
          count++;
        }
      }
      if (count > 0) {
        throw new Error(
          'Draft blog post with title ' +
          checkDraftBlogPostByTitle + ' exists!');
      }
    }, checkDraftBlogPostByTitle);
    console.log(
      'Draft blog post with title ' + checkDraftBlogPostByTitle +
      ' does not exist!');
  }

  async expectPublishedBlogPostWithTitleToExist(checkPublishBlogPostByTitle) {
    await this.clickOn('div', 'PUBLISHED');
    await this.page.evaluate(async(checkPublishBlogPostByTitle) => {
      const allPublishedBlogPosts = document.getElementsByClassName(
        'blog-dashboard-tile-content');
      let count = 0;
      for (let i = 0; i < allPublishedBlogPosts.length; i++) {
        let publishedBlogPostTitle = allPublishedBlogPosts[i].
          getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if (publishedBlogPostTitle === checkPublishBlogPostByTitle) {
          count++;
        }
      }
      if (count === 0) {
        throw new Error(
          'Blog post with title ' +
          checkPublishBlogPostByTitle + ' does not exist!');
      } else if (count > 1) {
        throw new Error(
          'Blog post with title ' +
          checkPublishBlogPostByTitle + ' exists more than once!');
      }
    }, checkPublishBlogPostByTitle);
    console.log(
      'Published blog post with title ' +
      checkPublishBlogPostByTitle + ' exists!');
  }

  async expectPublishedBlogPostWithTitleToNotExist(checkBlogPostByTitle) {
    await this.page.evaluate(async(checkBlogPostByTitle) => {
      const allDraftBlogPosts = document.getElementsByClassName(
        'blog-dashboard-tile-content');
      let count = 0;
      for (let i = 0; i < allDraftBlogPosts.length; i++) {
        let draftBlogPostTitle = allDraftBlogPosts[i].getElementsByClassName(
          'e2e-test-blog-post-title')[0].innerText;
        if (draftBlogPostTitle === checkBlogPostByTitle) {
          count++;
        }
      }
      if (count > 0) {
        throw new Error(
          'Published blog post with title ' +
          checkBlogPostByTitle + ' exists!');
      }
    }, checkBlogPostByTitle);
    console.log(
      'Published blog post with title ' + checkBlogPostByTitle +
      ' does not exist!');
  }

  async expectBlogDashboardAccessToBeUnauthorized() {
    await this.goto(blogDashboardUrl);
    try {
      await this.page.waitForSelector(unauthErrorContainer);
      console.log('User unauthorized to access blog dashboard!');
    } catch (err) {
      throw new Error(
        'No unauthorization error on accessing the ' +
        'blog dashboard page!');
    }
  }

  async expectBlogDashboardAccessToBeAuthorized() {
    /** Here we are trying to check if the blog dashboard is accessible to the
     * guest user after giving the blog admin role to it. There is a
     * modal dialog box asking for the user name and bio for the users
     * given blog admin role as they first time opens the blog-dashboard. */
    await this.goto(blogDashboardUrl);
    try {
      await this.waitForPageToLoad(blogDashboardAuthorDetailsModal);
      console.log('User authorized to access blog dashboard!');
    } catch (err) {
      throw new Error('User unauthorized to access blog dashboard!');
    }
  }

  async assignUserAsRoleFromRoleDropdown(username, role) {
    await this.page.select('select#label-target-update-form-role-select', role);
    await this.type(roleUpdateUsernameInput, username);
    await this.clickOn('button', 'Update Role');
  }

  async removeBlogEditorRoleFromUsername(username) {
    await this.type(blogEditorUsernameInput, username);
    await this.clickOn('button', 'Remove Blog Editor ');
  }

  async expectTagToNotExistInBlogTags(tagName) {
    await (this.page).evaluate(async(tagName) => {
      const tagList = document.getElementsByClassName('form-control');
      for (let i = 0; i < tagList.length; i++) {
        if (tagList[i].value === tagName) {
          throw new Error('Tag ' + tagName + ' already exists in tag list!');
        }
      }
    }, tagName);
    console.log('Tag with name ' + tagName + ' does not exist in tag list!');
  }

  async addNewBlogTag(tagName) {
    await this.clickOn('button', ' Add element ');
    await this.page.waitForTimeout(100);
    await this.keyboard.type(tagName);
    await this.clickOn('button', 'Save');
    console.log('Tag ' + tagName + ' added in tag list successfully!');
  }

  async expectTagWithNameToExistInTagList(tagName) {
    await this.page.evaluate(async(tagName) => {
      const tagList = document.getElementsByClassName('form-control');
      for (let i = 0; i < tagList.length; i++) {
        if (tagList[i].value === tagName) {
          return;
        }
      }
      throw new Error('Tag ' + tagName + ' does not exist in tag list!');
    }, tagName);
    console.log('Tag with name ' + tagName + ' exists in tag list!');
  }

  async setMaximumTagLimitTo(limit) {
    // These steps are for deleting the existing value in the input field.
    const tagInputField = await this.page.$(maximumTagLimitInput);
    await tagInputField.click({ clickCount: 3 });
    await this.page.keyboard.press('Backspace');

    await this.type(maximumTagLimitInput, limit);
    await this.clickOn('button', 'Save');

    console.log('Successfully updated the tag limit to ' + limit + '!');
  }

  async expectMaximumTagLimitToBe(limit) {
    await this.page.evaluate(async(limit) => {
      const tagLimit = document.getElementById('mat-input-0').value;
      console.log(tagLimit);
      if (tagLimit.value !== limit) {
        throw new Error('Maximum tag limit is not ' + limit + '!');
      }
    });
    console.log('Maximum tag limit changed to ' + limit + '!');
  }
};


/* NOTE 1 */
/** Giving explicit waitForTimeout when clicking the 'CREATE NEW BLOG POST'
 * button in the blog dashboard page as we need to add Bio for the user for
 * the first time we access the /blog-dashboard page. It is a modal dialog
 * box and beside it the blog dashboard is already loaded (in DOM also), thats
 * why we cannot wait for 'CREATE NEW BLOG POST' button using its selector
 * as it is already there even when the modal dialog box is opened and the
 * button is not clickable. So we need to wait for the modal dialog box
 * to close after saving the author bio details, and after that we can click
 * the 'CREATE NEW BLOG POST' button.
 */

/* NOTE 2 */
/** Giving explicit waitForTimeout when clicking 'Unpublish' or 'Delete' button
 * in the blog dashboard page (for deleting or unpublishing any blog post) as we
 * need to wait for the small transition to complete.
 * We cannot wait for the particular element using its selector because on
 * clicking the options button (represented by three dots) that button in
 * the overlay in instantly loaded in the DOM and also its DOM selector.
 * But the transition of the overlay is not completed and the unpublish
 * or delete button is not clickable until the transition is completed.
 * So we need to wait for that small transition to complete
 * (just 100millisecond is enough). */


// TODO(#16552): user-story(B8 cell) left as blocked by this issue.
