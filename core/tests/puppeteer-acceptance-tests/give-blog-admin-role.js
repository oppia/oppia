const { e2eBlogAdmin, e2eSuperAdmin } = require("./puppeteer-testing-utilities/giveBlogAdminRoleUtils.js");
const testConstants = require("./puppeteer-testing-utilities/testConstants.js");

const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const RolesEditorTab = testConstants.URLs.RolesEditorTab;

async function createDraftAsBlogPostAdmin() {
  const blogAdmin = await new e2eBlogAdmin();
  const superAdmin = await new e2eSuperAdmin();
  
  await blogAdmin.openBrowser();
  await blogAdmin.signInWithEmail("blog_admin@example.com");
  await blogAdmin.goto(blogDashboardUrl);
  await blogAdmin.expectBlogDashboardAccessToBeUnauthorized();

  await superAdmin.openBrowser();
  await superAdmin.signInWithEmail("testadmin@example.com");
  await superAdmin.goto(RolesEditorTab);
  await superAdmin.assignBlogAdminRoleToUserWithUserName("test12");
  await superAdmin.expectUserToHaveBlogAdminRole();
  await superAdmin.closeBrowser();

  await blogAdmin.expectBlogDashboardAccessToBeAuthorized();
  await blogAdmin.closeBrowser();
}

createDraftAsBlogPostAdmin();
