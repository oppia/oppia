const puppeteerUtilities = require('./puppeteer_utils.js');
const testConstants = require('./testConstants.js');

const blogTitleInput = 'input.e2e-test-blog-post-title-field';
const blogBodyInput = 'div.e2e-test-rte';
const thumbnailPhotoBox = 'e2e-test-photo-clickable';
const unauthErrorContainer = 'div.e2e-test-error-container';
const roleEditorInputField = 'input.e2e-test-username-for-role-editor'
const roleEditorButtonSelector = 'e2e-test-role-edit-button';
const rolesSelectDropdown = 'mat-select-trigger';
const blogdDashboardAuthorDetailsModal = 'div.modal-dialog';
const rolesEditorTab = testConstants.URLs.RolesEditorTab;
const roleUpdateUsernameInput = 'input#label-target-update-form-name';
const removeBlogEditorUsernameInput = 'input#label-target-form-reviewer-username';
const maximumTagLimitInput = 'input#mat-input-0'

module.exports = class e2eBlogPostAdmin extends puppeteerUtilities {

  async addUserBioInBlogDashboard() {
    await this.type('textarea.e2e-test-blog-author-bio-field', 'Dummy-User-Bio');
    await this.page.waitForSelector('button.e2e-test-save-author-details-button:not([disabled])');
    await this.clickOn('button', ' Save ');
  }

  async createDraftBlogPostWithTitle(draftBlogPostTitle) {
    await this.addUserBioInBlogDashboard();
    await this.page.waitForTimeout(500);  // see Note-1 below
    await this.clickOn('span', ' CREATE NEW BLOG POST ');
    await this.type(blogTitleInput, draftBlogPostTitle);
    await this.page.keyboard.press('Tab');
    await this.type(blogBodyInput, 'test blog post body content');
    await this.clickOn('span', ' DONE ');
    await this.page.waitForSelector('button.e2e-test-save-as-draft-button:not([disabled])');
    await this.clickOn('span', 'SAVE AS DRAFT');

    console.log('Successfully created a draft blog post!');
  }

  async deleteDraftBlogPostWithTitle(draftBlogPostTitle) {
    await this.page.exposeFunction('deleteDraftBlogPost', async() => {
      await this.page.waitForTimeout(100);  // see Note-2 below
      await this.clickOn('span', 'Delete');
      await this.page.waitForSelector('div.modal-dialog');
      await this.clickOn('button', ' Confirm ');
      console.log('Draft blog post with given title deleted successfully!');
    });
    await this.page.evaluate(async({draftBlogPostTitle}) => {
      const allDraftBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      for(let i = 0; i < allDraftBlogPosts.length; i++) {
        let checkDraftBlogPostTitle = allDraftBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(draftBlogPostTitle === checkDraftBlogPostTitle) {
          allDraftBlogPosts[i].getElementsByClassName('e2e-test-blog-post-edit-box')[0].click();
          await window.deleteDraftBlogPost();
          return;
        }
      }
    }, {draftBlogPostTitle});
  }

  async expectPublishButtonToBeDisabled() {
    await this.page.waitForSelector('button.e2e-test-publish-blog-post-button');
    await this.page.evaluate(() => {
      const publishedButtonIsDisabled = document.getElementsByClassName('e2e-test-publish-blog-post-button')[0].disabled;
      if (!publishedButtonIsDisabled) {
          throw new Error('Published button is not disabled even if the blog post is empty');
      }
    });
    console.log("Publushed button is disabled when blog post data is completely not filled.");
  }

  async publishNewBlogPostWithTitle(newBlogPostTitle) {
    await this.addUserBioInBlogDashboard();
    await this.page.waitForTimeout(500);  // see Note-1 below
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

    await this.page.waitForSelector('button.e2e-test-publish-blog-post-button:not([disabled])');
    await this.clickOn('span', 'PUBLISH');
    await this.page.waitForSelector('button.e2e-test-confirm-button');
    await this.clickOn('button', ' Confirm ');
    console.log('Successfully published a blog post!');
  }

  async deletePublishedBlogPostWithTitle(toDeletePublishedBlogPostTitle) {
    await this.clickOn('div', 'PUBLISHED');
    await this.page.exposeFunction('deletePublishedBlogPost', async() => {
      await this.page.waitForTimeout(100);  // see Note-2 below
      await this.clickOn('span', 'Delete');
      await this.page.waitForSelector('button.e2e-test-confirm-button');
      await this.clickOn('button', ' Confirm ');
      console.log('Published blog post with given title deleted successfully!');
    });
    await this.page.evaluate(async(toDeletePublishedBlogPostTitle) => {
      const allPublishedBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      for(let i = 0; i < allPublishedBlogPosts.length; i++) {
        let publishedBlogPostTitle = allPublishedBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(publishedBlogPostTitle === toDeletePublishedBlogPostTitle) {
          allPublishedBlogPosts[i].getElementsByClassName('e2e-test-blog-post-edit-box')[0].click();
          await window.deletePublishedBlogPost();
          return;
        }
      }
    }, toDeletePublishedBlogPostTitle);
  }

  async expectNumberOfDraftOrPublishedBlogPostsToBe(number) {
    await this.page.evaluate(async(number) => {
      const allDraftBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      if(allDraftBlogPosts.length !== number) {
        throw new Error('Number of draft/published blog posts is not equal to ' + number);
      };
    }, number);

    console.log('Number of draft/published blog posts is equal to ' + number);
  }

  async expectDraftBlogPostWithTitleToBePresent(checkDraftBlogPostByTitle) {
    await this.page.evaluate(async(checkDraftBlogPostByTitle) => {
      const allDraftBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      let count = 0;
      for(let i = 0; i < allDraftBlogPosts.length; i++) {
        let draftBlogPostTitle = allDraftBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(draftBlogPostTitle === checkDraftBlogPostByTitle) {
          count++;
        }
      }
      if (count === 0) {
        throw new Error('Draft blog post with title ' + checkDraftBlogPostByTitle + ' does not exist!');
      } else if (count > 1) {
        throw new Error('Draft blog post with title ' + checkDraftBlogPostByTitle + ' exists more than once!');
      }
    }, checkDraftBlogPostByTitle);
    console.log('Draft blog post with title ' + checkDraftBlogPostByTitle + ' exists!')
  }

  async expectDraftBlogPostWithTitleToBeAbsent(checkDraftBlogPostByTitle) {
    await this.page.evaluate(async(checkDraftBlogPostByTitle) => {
      const allDraftBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      let count = 0;
      for(let i = 0; i < allDraftBlogPosts.length; i++) {
        let draftBlogPostTitle = allDraftBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(draftBlogPostTitle === checkDraftBlogPostByTitle) {
          count++;
        }
      }
      if (count > 0) {
        throw new Error('Draft blog post with title ' + checkDraftBlogPostByTitle + ' exists!');
      }
    }, checkDraftBlogPostByTitle);
    console.log('Draft blog post with title ' + checkDraftBlogPostByTitle + ' does not exist!');
  }

  async expectPublishedBlogPostWithTitleToExist(checkPublishBlogPostByTitle) {
    await this.clickOn('div', 'PUBLISHED');
    await this.page.evaluate(async(checkPublishBlogPostByTitle) => {
      const allPublishedBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      let count = 0;
      for(let i = 0; i < allPublishedBlogPosts.length; i++) {
        let publishedBlogPostTitle = allPublishedBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(publishedBlogPostTitle === checkPublishBlogPostByTitle) {
          count++;
        }
      }
      if (count === 0) {
        throw new Error('Blog post with title ' + checkPublishBlogPostByTitle + ' does not exist!');
      } else if (count > 1) {
        throw new Error('Blog post with title ' + checkPublishBlogPostByTitle + ' exists more than once!');
      }
    }, checkPublishBlogPostByTitle);
    console.log('Published blog post with title ' + checkPublishBlogPostByTitle + ' exists!');
  }

  async expectPublishedBlogPostWithTitleToNotExist(checkBlogPostByTitle) {
    await this.page.evaluate(async(checkBlogPostByTitle) => {
      const allDraftBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      let count = 0;
      for(let i = 0; i < allDraftBlogPosts.length; i++) {
        let draftBlogPostTitle = allDraftBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(draftBlogPostTitle === checkBlogPostByTitle) {
          count++;
        }
      }
      if (count > 0) {
        throw new Error('Published blog post with title ' + checkBlogPostByTitle + ' exists!');
      }
    }, checkBlogPostByTitle);
    console.log('Published blog post with title ' + checkBlogPostByTitle + ' does not exist!');
  }

  async assignRoleToUser(username, role) {
    await this.goto(rolesEditorTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn('button', roleEditorButtonSelector);
    await this.clickOn('h4', 'Add role');
    await this.clickOn('div', rolesSelectDropdown);
    await this.page.evaluate(async(role) => {
      const allRoles = document.getElementsByClassName('mat-option-text');
      console.log(allRoles.length);
      for(let i = 0; i < allRoles.length; i++) {
        console.log(allRoles[i].innerText);
        if(allRoles[i].innerText === role) {
          allRoles[i].click({waitUntil: 'networkidle0'});
          return;
        }
      }
    }, role);
  }

  async expectUserToHaveRole(username, role) {
    const currPageUrl = this.page.url();
    await this.goto(rolesEditorTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn('button', roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    await this.page.evaluate((role) => {
      const userRoles = document.getElementsByClassName('oppia-user-role-description');
      for(let i = 0; i < userRoles.length; i++) {
        console.log(userRoles[i].innerText);
        if(userRoles[i].innerText === role) {
          return;
        }
      }
      throw new Error('User does not have ' + role + ' role!');
    }, role);
    console.log('User ' + username + ' has the ' + role + ' role!');
    await this.goto(currPageUrl);
  }

  async expectUserNotToHaveRole(username, role) {
    const currPageUrl = this.page.url();
    await this.goto(rolesEditorTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn('button', roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    await this.page.evaluate((role) => {
      const userRoles = document.getElementsByClassName('oppia-user-role-description');
      for(let i = 0; i < userRoles.length; i++) {
        console.log(userRoles[i].innerText);
        if(userRoles[i].innerText === role) {
          throw new Error('User have the ' + role + ' role!');
        }
      }
    }, role);
    console.log('User ' + username + ' doesnot have the ' + role + ' role!');
    await this.goto(currPageUrl);
  }

  async expectBlogDashboardAccessToBeUnauthorized() {
    try {
      await this.page.waitForSelector(unauthErrorContainer);
      console.log('User unauthorized to access blog dashboard!');
    } catch(err) {
      throw new Error('No unauthorization error found for the blog dashboard page!');
    }
  }

  async expectBlogDashboardAccessToBeAuthorized() {
    /**Here we are trying to check if the blog dashboard is accessible to the 
     * guest user after giving the blog admin role to it. There is a modal dialog box 
     * asking for the user name and bio for the users given blog admin role 
     * as they first time opens the blog-dashboard. */
    await this.reloadPage();
    try {
      await this.waitForPageToLoad(blogdDashboardAuthorDetailsModal);
      console.log('User authorized to access blog dashboard!');
    } catch(err) {
      throw new Error('User unauthorized to access blog dashboard!');
    }
  }

  async assignUserAsRoleFromRoleDropdown(username, role) {
    await this.page.select('select#label-target-update-form-role-select', role);
    await this.type(roleUpdateUsernameInput, username);
    await this.clickOn('button', 'Update Role');
  }

  async removeBlogEditorRoleWithUsername(username) {
    await this.type(removeBlogEditorUsernameInput, username);
    await this.clickOn('button', 'Remove Blog Editor ');
  }

  async expectTagToNotExistInBlogTags(tagName) {
    await (this.page).evaluate(async(tagName) => {
      const tagList = document.getElementsByClassName('form-control');
      for(let i = 0; i < tagList.length; i++) {
        if(tagList[i].value === tagName) {
          throw new Error('Tag with name ' + tagName + ' already exists before adding it!');
        }
      }
    }, tagName);
    console.log('Tag with name ' + tagName + ' does not exist in tag list!');
  }

  async addNewBlogTag(tagName) {
    await this.clickOn('button', ' Add element ');
    //TODO: this is the bug in the /blog-admin page, use puppeteer type function instead of this after the bug is fixed.
    // await this.page.keyboard.type(tagName);
    await this.page.evaluate(async(tagName) => {
      const tagList = document.getElementsByClassName('form-control');
      tagList[tagList.length - 1].value = tagName;
    }, tagName);
    await this.clickOn('button', 'Save');
    console.log('Tag with name ' + tagName + ' added in tag list successfully!');
  }

  async expectTagWithNameToExistInTagList(tagName) {
    await this.page.evaluate(async(tagName) => {
      const tagList = document.getElementsByClassName('form-control');
      for(let i = 0; i < tagList.length; i++) {
        if(tagList[i].value === tagName) {
          return;
        }
      }
      throw new Error('Tag with name ' + tagName + ' does not exist in tag list!');
    }, tagName);
    console.log('Tag with name ' + tagName + ' exists in tag list!');
  }

  async setMaximumTagLimitTo(limit) {
    // these steps are for deleting the existing value in the input field.
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
      if(tagLimit.value !== limit) {
        throw new Error('Maximum tag limit is not ' + limit + '!');
      }
    });
    console.log('Maximum tag limit changed to ' + limit + '!');
  }
};


/* NOTE 1 */
/**giving explicit waitForTime of 500ms for clicking the 'CREATE NEW BLOG POST' button
 * in the blog dashboard page as we need to add Bio for the user for the first time we
 * access the /blog-dashboard page. It is a modal dialog box and beside it the blog dashboard
 * is already loaded (in DOM also), thats why we cannot wait for 'CREATE NEW BLOG POST'
 * button using its selector as it is already there even when the modal dialog box is
 * opened and the button is not clickable. So we need to wait for the modal dialog box
 * to close after saving the author bio details, and after that we can click
 * the 'CREATE NEW BLOG POST' button.
 */

/* NOTE 2 */
/**giving explicit waitForTimeout when clicking 'Unpublish' or 'Delete' button
 * in the blog dashboard page (for deleting or unpublishing any blog post) as we
 * need to wait for the small transition to complete.
 * We cannot wait for the particular element using its selector because on
 * clicking the options button (represented by three dots) that button in 
 * the overlay in instantly loaded in the DOM and also its DOM selector.
 * But the transition of the overlay is not completed and the unpublish or delete button
 * is not clickable until the transition is completed. So we need to wait for 
 * that small transition to complete (just 100millisecond is enough). */
