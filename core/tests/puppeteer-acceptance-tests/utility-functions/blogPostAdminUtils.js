const puppeteerUtilities = require("./puppeteer_utils.js");
const testConstants = require("./testConstants.js");

const blogTitleInput = "input.e2e-test-blog-post-title-field";
const blogBodyInput = "div.e2e-test-rte";
const thumbnailPhotoBox = "e2e-test-photo-clickable";
const blogDashboardUrl = testConstants.URLs.BlogDashboard;


module.exports = class e2eBlogPostAdmin extends puppeteerUtilities {

  async waitForPageToLoad(selector) {
    await (this.page).waitForSelector(selector);
  }

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
    await (this.page).waitForTimeout(500);

    await this.clickOn("span", " International ");
    await this.clickOn("span", " DONE ");
  }

  async publishNewBlogPost() {
    await this.clickOn("span", "PUBLISH");
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
};
