const browser = require("./puppeteer_utils.js");
const testConstants = require("./testConstants.js");

const homePage = testConstants.Dashboard.MainDashboard;
const blogEditOptions = "e2e-test-blog-post-edit-box";
const blogTitleInput = "input.e2e-test-blog-post-title-field";
const blogBodyInput = "div.e2e-test-rte";
const thumbnailPhotoBox = "e2e-test-photo-clickable";

module.exports = class e2eBlogPostAdmin {
  page;
  browserInstance;

  async getInitialized() {
    this.browserInstance = await new browser();
    this.page = await (this.browserInstance).initialize();
  }

  async signInWithEmail(email) {
    await (this.browserInstance).signInWithEmail(email);
  }

  async goto(destination) {
    await (this.page).waitForSelector(homePage);
    await (this.browserInstance).goto(destination);
  }

  async deleteDraftBlog() {
    await (this.browserInstance).clickOn("button", blogEditOptions); // an icon
    await (this.browserInstance).clickOn("span", "Delete", 100);
    await (this.browserInstance).clickOn("button", " Confirm ");
    
    console.log("Successfully tested deleting blog drafts");
  }

  async createNewBlogPost() {
    try{
      await (this.browserInstance).clickOn("span", "NEW POST");
    } catch {
      await (this.browserInstance).clickOn("span", " CREATE NEW BLOG POST ");
    }
    await (this.browserInstance).type(blogTitleInput, "random title");
    await (this.browserInstance).type(blogBodyInput, "my blog body content");

    await (this.browserInstance).clickOn("div", thumbnailPhotoBox);
    await (this.browserInstance).uploadFile('collection.svg');
    await (this.browserInstance).clickOn("button", " Add Thumbnail Image ");
    await (this.page).waitForTimeout(500);

    await (this.browserInstance).clickOn("span", " International ");
    await (this.browserInstance).clickOn("span", " DONE ");
  }

  async publishBlog() {
    await (this.browserInstance).clickOn("span", "PUBLISH");
    await (this.browserInstance).clickOn("button", " Confirm ");
    
    console.log("Successfully published a blog!");
  }

  async unpublishBlog() {
    await (this.browserInstance).clickOn("div", " PUBLISHED ");
    await (this.page).waitForTimeout(500);

    await (this.browserInstance).clickOn("button", blogEditOptions);  // an icon
    await (this.browserInstance).clickOn("span", "Unpublish", 100);
    await (this.browserInstance).clickOn("button", " Confirm ", 100);
    
    console.log("Successfully unpublished a published blogs!");
  }

  async closeBrowser() {
    await (this.browserInstance).browser.close();
  }
};
