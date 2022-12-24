const e2eSuperAdmin = require("../puppeteer-testing-utilities/blogPostAdminUtils.js");
const testConstants = require("../puppeteer-testing-utilities/testConstants.js");

const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const RolesEditorTab = testConstants.URLs.RolesEditorTab;

async function blogAdminRolesAndTagsProperties() {
  const superAdmin = await new e2eSuperAdmin();

  await superAdmin.openBrowser();
  await superAdmin.signUpNewUserWithUserNameAndEmail("superAdm", "super_admin@example.com");
  // await blogAdmin.goto(blogDashboardUrl);
  // await blogAdmin.expectBlogDashboardAccessToBeUnauthorized();

  // await superAdmin.openBrowser();
  // await superAdmin.signUpNewUserWithUserNameAndEmail("superAdm", "testadmin@example.com");
  // await superAdmin.goto(RolesEditorTab);
  await superAdmin.assignBlogAdminRoleToUserWithUserName("blogAdm");
  // await superAdmin.expectUserToHaveBlogAdminRole();
  // await superAdmin.closeBrowser();

  // await blogAdmin.expectBlogDashboardAccessToBeAuthorized();
  // await blogAdmin.closeBrowser();
}

blogAdminRolesAndTagsProperties();
