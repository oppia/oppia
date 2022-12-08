const browser = require("./puppeteer_utils.js");
const testConstants = require("./testConstants.js");

const blogTitleInput = "input.e2e-test-blog-post-title-field";
const blogBodyInput = "div.e2e-test-rte";
const thumbnailPhotoBox = "e2e-test-photo-clickable";
const blogDashboardUrl = testConstants.URLs.BlogDashboard;


module.exports = class e2eBlogPostAdmin extends browser {

  async openBrowser() {
    return await this.initialize();
  }

  async waitForPageToLoad(selector) {
    await (this.page).waitForSelector(selector);
  }

  async createDraftBlogPostByTitle(draftBlogPostTitle) {
    try{
      await this.clickOn("span", "NEW POST");
    } catch {
      await this.clickOn("span", " CREATE NEW BLOG POST ");
    }
    await this.type(blogTitleInput, draftBlogPostTitle);
    await this.type(blogBodyInput, "blog post test body content");
    await this.clickOn("span", " DONE ");
    await this.clickOn("span", "SAVE AS DRAFT", 500);
    
    console.log("Successfully created a draft blog post!");
    await this.goto(blogDashboardUrl);
  }

  async deleteDraftBlogPost() {
    await this.clickOn("span", "Delete", 100);
    await this.clickOn("button", " Confirm ");

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
      await this.clickOn("span", "NEW POST");
    } catch {
      await this.clickOn("span", " CREATE NEW BLOG POST ");
    }
    await this.type(blogTitleInput, newBlogPostTitle);
    await this.type(blogBodyInput, "blog post test body content");

    await this.clickOn("div", thumbnailPhotoBox);
    await this.uploadFile('collection.svg');
    await this.clickOn("button", " Add Thumbnail Image ");
    await this.waitForTimeout(500);

    await this.clickOn("span", " International ");
    await this.clickOn("span", " DONE ");
  }

  async publishNewBlogPost() {
    await this.clickOn("span", "PUBLISH");
    await this.clickOn("button", " Confirm ", 1000);
    
    console.log("Successfully published a blog!");
    await this.goto(blogDashboardUrl);
  }

  async unpublishBlogPost() {
    await this.clickOn("span", "Unpublish", 100);
    await this.clickOn("button", " Confirm ", 100);

    console.log("published blog post with given title unpublished successfully!");
  }

  async unpublishBlogPostByTitle(publishedBlogPostTitle) {
    await this.clickOn("div", " PUBLISHED ");
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
};
