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

  async deleteDraftBlogPostByTitle(draftBlogPostTitle) {
    await (this.browserInstance).clickOn("button", blogEditOptions);
    await (this.browserInstance).clickOn("span", "Delete", 100);
    await (this.browserInstance).clickOn("button", " Confirm ");
    
    console.log("Successfully tested deleting blog drafts");
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

  async unpublishBlogPostByTitle(publishedBlogPostTitle) {
    await (this.browserInstance).clickOn("div", " PUBLISHED ");
    await (this.page).waitForTimeout(500);
    await (this.browserInstance).clickOn("button", blogEditOptions);
    await (this.browserInstance).clickOn("span", "Unpublish", 100);
    await (this.browserInstance).clickOn("button", " Confirm ", 100);
    
    console.log("Successfully unpublished a published blogs!");
  }

  async closeBrowser() {
    await (this.browserInstance).closeBrowser();
  }
};
