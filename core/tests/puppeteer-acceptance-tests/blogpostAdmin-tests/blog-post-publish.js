const e2eBlogPostAdmin = require("../utility-functions/blogPostAdminUtils.js");
const testConstants = require("../utility-functions/testConstants.js");

const homePage = testConstants.Dashboard.MainDashboard;
const blogDashboardUrl = testConstants.URLs.BlogDashboard;

async function publishBlogAsBlogPostAdmin() {
  const blogPostAdmin = await new e2eBlogPostAdmin();
  await blogPostAdmin.openBrowser();

  await blogPostAdmin.signInWithEmail("testadmin@example.com");
  await blogPostAdmin.waitForPageToLoad(homePage);
  await blogPostAdmin.goto(blogDashboardUrl);
  await blogPostAdmin.expectNumberOfDraftOrPublishedBlogPostsGreaterThan(0);
  await blogPostAdmin.createNewBlogPostByTitle("Test Blog Post");
  await blogPostAdmin.publishNewBlogPost();

  // TODO: how to seperately check that the blog post is published or currently in draft mode?
  // TODO: first corrent the deleteDraftByTitle page.evaluate() function for deleting draft blog post
  // TODO: expectaations in deletedraft and unpublish not done yet
  await blogPostAdmin.expectPublishedBlogPostWithTitleToExist("Test Blog Post");

  await blogPostAdmin.closeBrowser();
}

publishBlogAsBlogPostAdmin();
