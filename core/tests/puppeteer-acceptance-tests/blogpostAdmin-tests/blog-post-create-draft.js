const e2eBlogPostAdmin = require("../utility-functions/blogPostAdminUtils.js");
const testConstants = require("../utility-functions/testConstants.js");

const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const homePage = testConstants.Dashboard.MainDashboard;

async function deleteDraftAsBlogPostAdmin() {
  const blogPostAdmin = await new e2eBlogPostAdmin();
  await blogPostAdmin.openBrowser();

  await blogPostAdmin.signInWithEmail("testadmin@example.com");
  await blogPostAdmin.waitForPageToLoad(homePage);
  await blogPostAdmin.goto(blogDashboardUrl);
  await blogPostAdmin.createDraftBlogPostByTitle("Test Blog Post");
  
  await blogPostAdmin.closeBrowser();
}

deleteDraftAsBlogPostAdmin();
