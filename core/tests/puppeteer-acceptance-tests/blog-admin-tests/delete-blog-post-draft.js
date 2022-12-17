const e2eBlogPostAdmin = require("../puppeteer-testing-utilities/blogPostAdminUtils.js");
const testConstants = require("../puppeteer-testing-utilities/testConstants.js");

const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const homePage = testConstants.Dashboard.LearnerDashboard;

async function deleteDraftAsBlogPostAdmin() {
  const blogPostAdmin = await new e2eBlogPostAdmin();
  await blogPostAdmin.openBrowser();

  await blogPostAdmin.signInWithEmail("testadmin@example.com");
  await blogPostAdmin.goto(blogDashboardUrl);
  await blogPostAdmin.expectDraftBlogPostWithTitleToExist("Test Blog Post");
  await blogPostAdmin.deleteDraftBlogPostByTitle("Test Blog Post");
  await blogPostAdmin.expectDraftBlogPostWithTitleToNotExist("Test Blog Post");
  
  await blogPostAdmin.closeBrowser();
}

deleteDraftAsBlogPostAdmin();
