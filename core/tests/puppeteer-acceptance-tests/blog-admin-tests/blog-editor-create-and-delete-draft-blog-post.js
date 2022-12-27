const e2eBlogPostEditor = require("../puppeteer-testing-utilities/blogPostAdminUtils.js");
const testConstants = require("../puppeteer-testing-utilities/testConstants.js");

const blogDashboardUrl = testConstants.URLs.BlogDashboard;

async function createDraftAsBlogPostAdmin() {
  const blogPostEditor = await new e2eBlogPostEditor();
  await blogPostEditor.openBrowser();

  await blogPostEditor.signUpNewUserWithUserNameAndEmail("superAdm", "testadmin@example.com");
  await blogPostEditor.assignBlogAdminRoleToUserWithUserName("superAdm");
  await blogPostEditor.expectUserToHaveBlogAdminRole();

  await blogPostEditor.goto(blogDashboardUrl);
  await blogPostEditor.expectNumberOfDraftOrPublishedBlogPostsToBe(0);
  await blogPostEditor.createDraftBlogPostByTitle("Test-Blog");

  await blogPostEditor.goto(blogDashboardUrl);
  await blogPostEditor.expectDraftBlogPostWithTitleToExist("Test-Blog");

  await blogPostEditor.deleteDraftBlogPostByTitle("Test-Blog");
  await blogPostEditor.expectDraftBlogPostWithTitleToNotExist("Test-Blog");
  
  await blogPostEditor.closeBrowser();
}

createDraftAsBlogPostAdmin();
