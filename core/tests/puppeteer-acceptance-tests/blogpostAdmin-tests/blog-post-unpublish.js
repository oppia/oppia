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
  await blogPostAdmin.unpublishBlogPostByTitle("Test Blog Post");

  await blogPostAdmin.closeBrowser();
}

publishBlogAsBlogPostAdmin();
