const { e2eGuestUser, e2eSuperAdmin } = require("./utility-functions/guestUserToBlogAdminUtils.js");
const testConstants = require("./utility-functions/testConstants.js");

const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const homePage = testConstants.Dashboard.LearnerDashboard;
const RolesEditorPage = testConstants.URLs.RolesEditorPage;

async function createDraftAsBlogPostAdmin() {
  const guestUser = await new e2eGuestUser();
  const superAdmin = await new e2eSuperAdmin();
  
  await guestUser.openBrowser();
  await guestUser.signInWithEmail("guest_user@example.com");
  await guestUser.waitForPageToLoad(homePage);
  await guestUser.goto(blogDashboardUrl);
  await guestUser.expectBlogDashboardAccessToBeUnauthorized();

  await superAdmin.openBrowser();
  await superAdmin.signInWithEmail("testadmin@example.com");
  await superAdmin.waitForPageToLoad(homePage);
  await superAdmin.goto(RolesEditorPage);
  await superAdmin.assignGuestUserWithUserNameBlogAdminRole("test");
  await superAdmin.expectGuestUserToHaveBlogAdminRole();
  await superAdmin.closeBrowser();

  await guestUser.reloadPage();
  await guestUser.expectBlogDashboardAccessToBeAuthorized();
  await guestUser.closeBrowser();
}

createDraftAsBlogPostAdmin();
