const { parseHTML } = require("jquery");
const browser = require("./puppeteer_utils.js");
const testConstants = require("./testConstants.js");

const blogEditOptions = "e2e-test-blog-post-edit-box";
const blogTitleInput = "input.e2e-test-blog-post-title-field";
const blogBodyInput = "div.e2e-test-rte";
const thumbnailPhotoBox = "e2e-test-photo-clickable";
const blogDashboardUrl = testConstants.URLs.BlogDashboard;


module.exports = class e2eBlogPostAdmin {
  page;
  browserInstance;

  async openBrowser() {
    this.browserInstance = await new browser();
    this.page = await (this.browserInstance).initialize();
  }

  async signInWithEmail(email) {
    await (this.browserInstance).signInWithEmail(email);
  }

  async waitForPageToLoad(selector) {
    await (this.page).waitForSelector(selector);
  }

  async goto(destination) {
    await (this.browserInstance).goto(destination);
  }

  async createDraftBlogPostByTitle(draftBlogPostTitle) {
    try{
      await (this.browserInstance).clickOn("span", "NEW POST");
    } catch {
      await (this.browserInstance).clickOn("span", " CREATE NEW BLOG POST ");
    }
    await (this.browserInstance).type(blogTitleInput, draftBlogPostTitle);
    await (this.browserInstance).type(blogBodyInput, "blog post test body content");
    await (this.browserInstance).clickOn("span", " DONE ");
    await (this.browserInstance).clickOn("span", "SAVE AS DRAFT", 500);
    
    await console.log("Successfully created a draft blog post!");
    await this.browserInstance.goto(blogDashboardUrl);

    // this.page = await this.browserInstance.browser.newPage();
  }

  async deleteDraftBlogPost() {
    await (this.browserInstance).clickOn("span", "Delete", 100);
    await (this.browserInstance).clickOn("button", " Confirm ");

    console.log("draft blog post with given title deleted successfully!");
  }

  async deleteDraftBlogPostByTitle(draftBlogPostTitle) {
    let draftBlogPostInfo = {
      "draftBlogPostTitle": draftBlogPostTitle,
      "deleteDraftBlogPost": this.deleteDraftBlogPost(),
    }
    await (this.page).evaluate(async(draftBlogPostInfo) => {
      const allDraftBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      for(let i = 0; i < allDraftBlogPosts.length; i++) {
        let draftBlogPostTitle = allDraftBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(draftBlogPostTitle === draftBlogPostInfo.draftBlogPostTitle) {
          allDraftBlogPosts[i].getElementsByClassName('e2e-test-blog-post-edit-box')[0].click();
          await draftBlogPostInfo.deleteDraftBlogPost;
          return;
        }
      }
    }, draftBlogPostInfo);
  }

  async createNewBlogPostByTitle(newBlogPostTitle) {
    try{
      await (this.browserInstance).clickOn("span", "NEW POST");
    } catch {
      await (this.browserInstance).clickOn("span", " CREATE NEW BLOG POST ");
    }
    await (this.browserInstance).type(blogTitleInput, newBlogPostTitle);
    await (this.browserInstance).type(blogBodyInput, "blog post test body content");

    await (this.browserInstance).clickOn("div", thumbnailPhotoBox);
    await (this.browserInstance).uploadFile('collection.svg');
    await (this.browserInstance).clickOn("button", " Add Thumbnail Image ");
    await (this.page).waitForTimeout(500);

    await (this.browserInstance).clickOn("span", " International ");
    await (this.browserInstance).clickOn("span", " DONE ");
  }

  async publishNewBlogPost() {
    await (this.browserInstance).clickOn("span", "PUBLISH");
    await (this.browserInstance).clickOn("button", " Confirm ", 1000);
    
    console.log("Successfully published a blog!");
    await this.goto(blogDashboardUrl);
  }

  async unpublishBlogPost() {
    await (this.browserInstance).clickOn("span", "Unpublish", 100);
    await (this.browserInstance).clickOn("button", " Confirm ", 100);

    console.log("published blog post with given title unpublished successfully!");
  }

  async unpublishBlogPostByTitle(publishedBlogPostTitle) {
    await (this.browserInstance).clickOn("div", " PUBLISHED ");
    await (this.page).waitForTimeout(500);
    let publishedBlogPostInfo = {
      "publishedBlogPostTitle": publishedBlogPostTitle,
      "unpublishBlogPost": this.unpublishBlogPost(),
    }
    await (this.page).evaluate(async(publishedBlogPostInfo) => {
      const allPublishedBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      for(let i = 0; i < allPublishedBlogPosts.length; i++) {
        let publishedBlogPostTitle = allPublishedBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(publishedBlogPostTitle === publishedBlogPostInfo.publishedBlogPostTitle) {
          allPublishedBlogPosts[i].getElementsByClassName('e2e-test-blog-post-edit-box')[0].click();
          await publishedBlogPostInfo.unpublishBlogPost;
          return;
        }
      }
    }, publishedBlogPostInfo);
  }

  async closeBrowser() {
    await (this.page).waitForTimeout(1000);
    await (this.browserInstance).closeBrowser();
  }
};
