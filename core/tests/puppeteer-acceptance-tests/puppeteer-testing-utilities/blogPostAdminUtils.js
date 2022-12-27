const puppeteerUtilities = require("./puppeteer_utils.js");
const testConstants = require("./testConstants.js");

const blogTitleInput = "input.e2e-test-blog-post-title-field";
const blogBodyInput = "div.e2e-test-rte";
const thumbnailPhotoBox = "e2e-test-photo-clickable";
const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const unauthErrorContainer = "div.e2e-test-error-container";
const roleEditorInputField = "input.e2e-test-username-for-role-editor"
const roleEditorButtonSelector = "e2e-test-role-edit-button";
const rolesSelectDropdown = "mat-select-trigger";
const blogdDashboardAuthorDetailsModal = "div.modal-dialog";
const RolesEditorTab = testConstants.URLs.RolesEditorTab;
const roleUpdateUsernameInput = "input#label-target-update-form-name";
const removeBlogEditorUsernameInput = "input#label-target-form-reviewer-username";
const maximumTagLimitInput = "input#mat-input-0"

module.exports = class e2eBlogPostAdmin extends puppeteerUtilities {

  async createDraftBlogPostByTitle(draftBlogPostTitle) {
    await this.clickOn("span", "NEW POST");
    await this.type(blogTitleInput, draftBlogPostTitle);
    await this.type(blogBodyInput, "blog post test body content");
    await this.clickOn("span", " DONE ");
    await this.clickOn("span", "SAVE AS DRAFT", 500);
    
    console.log("Successfully created a draft blog post!");
  }

  async deleteDraftBlogPost() {
    console.log("inside this function");
    await this.clickOn("span", "Delete", 100);
    await this.clickOn("button", " Confirm ");

    console.log("draft blog post with given title deleted successfully!");
  }

  async deleteDraftBlogPostByTitle(draftBlogPostTitle) {
    await (this.page).exposeFunction('deleteDraftBlogPost', async() => {
      await this.clickOn("span", "Delete", 100);
      await this.clickOn("button", " Confirm ");

      console.log("draft blog post with given title deleted successfully!");
    });
    await (this.page).evaluate(async({draftBlogPostTitle}) => {
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

  async createNewBlogPostByTitle(newBlogPostTitle) {
    await this.clickOn("span", "NEW POST");
    await this.type(blogTitleInput, newBlogPostTitle);
    await this.type(blogBodyInput, "blog post test body content");

    await this.clickOn("div", thumbnailPhotoBox);
    await this.uploadFile('collection.svg');
    await this.clickOn("button", " Add Thumbnail Image ");
    await (this.page).waitForSelector("body.modal-open", {hidden: true});

    await this.clickOn("button", "mat-button-toggle-button");
    await this.clickOn("span", " DONE ");
  }

  async publishNewBlogPost() {
    await this.clickOn("span", "PUBLISH", 1000);
    await this.clickOn("button", " Confirm ", 1000);
    
    console.log("Successfully published a blog!");
    await this.goto(blogDashboardUrl);
  }

  async unpublishBlogPostByTitle(toUnpublishBlogPostTitle) {
    await this.clickOn("div", " PUBLISHED ");
    await (this.page).exposeFunction('unpublishBlogPost', async() => {
      await this.clickOn("span", "Unpublish", 100);
      await this.clickOn("button", " Confirm ", 100);

      console.log("published blog post with given title unpublished successfully!");
    });
    await (this.page).evaluate(async(toUnpublishBlogPostTitle) => {
      const allPublishedBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      for(let i = 0; i < allPublishedBlogPosts.length; i++) {
        let publishedBlogPostTitle = allPublishedBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(publishedBlogPostTitle === toUnpublishBlogPostTitle) {
          allPublishedBlogPosts[i].getElementsByClassName('e2e-test-blog-post-edit-box')[0].click();
          await window.unpublishBlogPost();
          return;
        }
      }
    }, toUnpublishBlogPostTitle);
  }

  async expectNumberOfDraftOrPublishedBlogPostsGreaterThan(number) {
    await (this.page).evaluate(async(number) => {
      const allDraftBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      if(allDraftBlogPosts.length <= number) {
        throw new Error("Number of draft blog posts is not greater than " + number);
      };
    }, number);
  }

  async expectDraftBlogPostWithTitleToExist(checkDraftBlogPostByTitle) {
    await (this.page).evaluate(async(checkDraftBlogPostByTitle) => {
      const allDraftBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      let count = 0;
      for(let i = 0; i < allDraftBlogPosts.length; i++) {
        let draftBlogPostTitle = allDraftBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(draftBlogPostTitle === checkDraftBlogPostByTitle) {
          count++;
        }
      }
      if (count === 0) {
        throw new Error("Draft blog post with title " + checkDraftBlogPostByTitle + " does not exist!");
      } else if (count > 1) {
        throw new Error("Draft blog post with title " + checkDraftBlogPostByTitle + " exists more than once!");
      }
    }, checkDraftBlogPostByTitle);
  }

  async expectDraftBlogPostWithTitleToNotExist(checkDraftBlogPostByTitle) {
    await (this.page).evaluate(async(checkDraftBlogPostByTitle) => {
      const allDraftBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      let count = 0;
      for(let i = 0; i < allDraftBlogPosts.length; i++) {
        let draftBlogPostTitle = allDraftBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(draftBlogPostTitle === checkDraftBlogPostByTitle) {
          count++;
        }
      }
      if (count > 0) {
        throw new Error("Draft blog post with title " + checkDraftBlogPostByTitle + " exists!");
      }
    }, checkDraftBlogPostByTitle);
  }

  async expectPublishedBlogPostWithTitleToExist(checkPublishBlogPostByTitle) {
    await this.clickOn("div", "PUBLISHED");
    await (this.page).evaluate(async(checkPublishBlogPostByTitle) => {
      const allPublishedBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      let count = 0;
      for(let i = 0; i < allPublishedBlogPosts.length; i++) {
        let publishedBlogPostTitle = allPublishedBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(publishedBlogPostTitle === checkPublishBlogPostByTitle) {
          count++;
        }
      }
      if (count === 0) {
        throw new Error("Draft blog post with title " + checkPublishBlogPostByTitle + " does not exist!");
      } else if (count > 1) {
        throw new Error("Draft blog post with title " + checkPublishBlogPostByTitle + " exists more than once!");
      }
    }, checkPublishBlogPostByTitle);
  }

  async expectPublishedBlogPostWithTitleToNotExist(checkBlogPostByTitle) {
    await (this.page).evaluate(async(checkBlogPostByTitle) => {
      const allDraftBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      let count = 0;
      for(let i = 0; i < allDraftBlogPosts.length; i++) {
        let draftBlogPostTitle = allDraftBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(draftBlogPostTitle === checkBlogPostByTitle) {
          count++;
        }
      }
      if (count > 0) {
        throw new Error("Draft blog post with title " + checkDraftBlogPostByTitle + " exists!");
      }
    }, checkBlogPostByTitle);
  }

  async assignBlogAdminRoleToUserWithUserName(userName) {
    await this.goto(RolesEditorTab);
    await this.type(roleEditorInputField, userName);
    await this.clickOn("button", roleEditorButtonSelector);
    await this.clickOn("h4", "Add role");
    await this.clickOn("div", rolesSelectDropdown);
    await (this.page).evaluate(async() => {
      const allRoles = document.getElementsByClassName('mat-option-text');
      console.log(allRoles.length);
      for(let i = 0; i < allRoles.length; i++) {
        console.log(allRoles[i].innerText);
        if(allRoles[i].innerText === "blog admin") {
          allRoles[i].click({waitUntil: "networkidle0"});
          return;
        }
      }
    });
  }

  async expectUserToHaveBlogAdminRole() {
    await (this.page).evaluate(() => {
      const userRoles = document.getElementsByClassName('oppia-user-role-description');
      for(let i = 0; i < userRoles.length; i++) {
        console.log(userRoles[i].innerText);
        if(userRoles[i].innerText === "Blog Admin") {
          return;
        }
      }
      throw new Error("User does not have blog admin role!");
    });
    console.log("User given the blog admin role successfully!");
  }

  async expectBlogDashboardAccessToBeUnauthorized() {
    try {
      await (this.page).waitForSelector(unauthErrorContainer);
      console.log("User unauthorized to access blog dashboard!");
    } catch(err) {
      throw new Error("No unauthorization error found for the blog dashboard page!");
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
      console.log("User authorized to access blog dashboard!");
    } catch(err) {
      throw new Error("User unauthorized to access blog dashboard!");
    }
  }

  async assignUserAsRoleFromRoleDropdown(username, role) {
    await this.type(roleUpdateUsernameInput, username);
    await this.page.select('select#label-target-update-form-role-select', role);
    await this.clickOn("button", "Update Role", 100);
  }

  async expectUserGivenTheRoleFromRoleDropdown(username, role) {
    const statusMessage = "Role of " + username + " successfully updated to " + role;
    try {
      await this.page.waitForFunction((statusMessage) => {
          return document.querySelector('.oppia-status-message-container').innerText === statusMessage;
        },
        {},
        statusMessage
      );
    } catch(err) {
      throw new Error(username + " not given the " + role + " role from role dropdown!");
    }
    console.log(username + " given the " + role + " role from role dropdown successfully!");
  }

  async removeBlogEditorRoleByUsername(username) {
    await this.type(removeBlogEditorUsernameInput, username);
    await this.clickOn("button", "Remove Blog Editor ");
  }

  async expectRemovedBlogEditorRoleByUsername(username) {
    const statusMessage = "Success.";
    try {
      await this.page.waitForFunction((statusMessage) => {
          return document.querySelector('.oppia-status-message-container').innerText === statusMessage;
        },
        {},
        statusMessage
      );
    } catch(err) {
      throw new Error(username + " not removed from the Blog Editor role!");
    }
    console.log(username + " removed from the Blog Editor role successfully!");
  }

  async expectTagWithNameNotExistInTagList(tagName) {
    await (this.page).evaluate(async(tagName) => {
      const tagList = document.getElementsByClassName('form-control');
      for(let i = 0; i < tagList.length; i++) {
        if(tagList[i].value === tagName) {
          throw new Error("Tag with name " + tagName + " already exists before adding it!");
        }
      }
    }, tagName);
    console.log("Tag with name " + tagName + " does not exist in tag list!");
  }

  async addTagInTagListWithName(tagName) {
    await this.clickOn("button", " Add element ");
    //TODO: this is the bug in the /blog-admin page, use puppeteer type function instead of this after the bug is fixed.
    // await this.page.keyboard.type(tagName);
    await this.page.evaluate(async(tagName) => {
      const tagList = document.getElementsByClassName('form-control');
      tagList[tagList.length - 1].value = tagName;
    }, tagName);
    await this.clickOn("button", "Save");
    console.log("Tag with name " + tagName + " added in tag list successfully!");
  }

  async expectTagWithNameToExistInTagList(tagName) {
    await this.page.evaluate(async(tagName) => {
      const tagList = document.getElementsByClassName('form-control');
      for(let i = 0; i < tagList.length; i++) {
        if(tagList[i].value === tagName) {
          return;
        }
      }
      throw new Error("Tag with name " + tagName + " does not exist in tag list!");
    }, tagName);
    console.log("Tag with name " + tagName + " exists in tag list!");
  }

  async setMaximumTagLimitTo(limit) {
    // these steps are for deleting the existing value in the input field.
    const tagInputField = await this.page.$(maximumTagLimitInput);
    await tagInputField.click({ clickCount: 3 });
    await this.page.keyboard.press('Backspace');

    await this.type(maximumTagLimitInput, limit);
    await this.clickOn("button", "Save");

    console.log("Successfully updated the tag limit to " + limit + "!");
  }

  async expectMaximumTagLimitToBe(limit) {
    await this.page.evaluate(async(limit) => {
      const tagLimit = document.getElementById('mat-input-0').value;
      console.log(tagLimit);
      if(tagLimit.value !== limit) {
        throw new Error("Maximum tag limit is not " + limit + "!");
      }
    });
    console.log("Maximum tag limit changed to " + limit + "!");
  }
};
