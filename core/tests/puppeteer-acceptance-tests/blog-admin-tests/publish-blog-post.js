const e2eBlogPostAdmin = require("../utility-functions/blogPostAdminUtils.js");
const testConstants = require("../utility-functions/testConstants.js");

const homePage = testConstants.Dashboard.LearnerDashboard;
const blogDashboardUrl = testConstants.URLs.BlogDashboard;

async function publishBlogAsBlogPostAdmin() {
  const blogPostAdmin = await new e2eBlogPostAdmin();
  await blogPostAdmin.openBrowser();

  await blogPostAdmin.signInWithEmail("testadmin@example.com");
  await blogPostAdmin.goto(blogDashboardUrl);
  await blogPostAdmin.expectNumberOfDraftOrPublishedBlogPostsGreaterThan(0);
  await blogPostAdmin.createNewBlogPostByTitle("Test Blog Post");
  await blogPostAdmin.publishNewBlogPost();
  await blogPostAdmin.expectPublishedBlogPostWithTitleToExist("Test Blog Post");

  await blogPostAdmin.closeBrowser();
}

publishBlogAsBlogPostAdmin();
