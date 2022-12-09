const browser = require("./puppeteer_utils.js");
const testConstants = require("./testConstants.js");

const blogTitleInput = "input.e2e-test-blog-post-title-field";
const blogBodyInput = "div.e2e-test-rte";
const thumbnailPhotoBox = "e2e-test-photo-clickable";
const blogDashboardUrl = testConstants.URLs.BlogDashboard;


module.exports = class e2eBlogPostAdmin extends browser {

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
  }

  async deleteDraftBlogPost() {
    console.log("inside this function");
    await this.clickOn("span", "Delete", 100);
    await this.clickOn("button", " Confirm ");

    console.log("draft blog post with given title deleted successfully!");
  }

  async deleteDraftBlogPostByTitle(draftBlogPostTitle) {
    let draftBlogPostInfo = {
      "draftBlogPostTitle": draftBlogPostTitle,
      "deleteDraftBlogPost": async() => {
        this.deleteDraftBlogPost();
      }
    }
    await (this.page).evaluate(async(draftBlogPostInfo) => {
      const allDraftBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      for(let i = 0; i < allDraftBlogPosts.length; i++) {
        let draftBlogPostTitle = allDraftBlogPosts[i].getElementsByClassName('e2e-test-blog-post-title')[0].innerText;
        if(draftBlogPostTitle === draftBlogPostInfo.draftBlogPostTitle) {
          allDraftBlogPosts[i].getElementsByClassName('e2e-test-blog-post-edit-box')[0].click();
          console.log(typeof draftBlogPostInfo.deleteDraftBlogPost);
          await draftBlogPostInfo.deleteDraftBlogPost;
          return;
        }
      }
    }, draftBlogPostInfo);
  }

  async expectNumberOfDraftOrPublishedBlogPostsGreaterThan(number) {
    await (this.page).evaluate(async(number) => {
      const allDraftBlogPosts = document.getElementsByClassName('blog-dashboard-tile-content');
      if(allDraftBlogPosts.length <= number) {
        throw new Error("Number of draft blog posts is not greater than " + number);
      };
    }, number);
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

  async publishNewBlogPost() {
    await this.clickOn("span", "PUBLISH");
    await this.clickOn("button", " Confirm ", 1000);
    
    console.log("Successfully published a blog!");
    await this.goto(blogDashboardUrl);
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
