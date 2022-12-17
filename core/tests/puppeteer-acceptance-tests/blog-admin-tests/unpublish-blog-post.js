const e2eBlogPostAdmin = require("../puppeteer-testing-utilities/blogPostAdminUtils.js");
const testConstants = require("../puppeteer-testing-utilities/testConstants.js");

const blogDashboardUrl = testConstants.URLs.BlogDashboard;

async function publishBlogAsBlogPostAdmin() {
  const blogPostAdmin = await new e2eBlogPostAdmin();
  await blogPostAdmin.openBrowser();

  await blogPostAdmin.signInWithEmail("testadmin@example.com");
  await blogPostAdmin.goto(blogDashboardUrl);
  await blogPostAdmin.expectPublishedBlogPostWithTitleToExist("Test Blog Post");
  await blogPostAdmin.unpublishBlogPostByTitle("Test Blog Post");
  await blogPostAdmin.expectPublishedBlogPostWithTitleToNotExist("Test Blog Post");

  await blogPostAdmin.closeBrowser();
}

publishBlogAsBlogPostAdmin();
