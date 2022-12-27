const e2eSuperAdmin = require("../puppeteer-testing-utilities/blogPostAdminUtils.js");
const testConstants = require("../puppeteer-testing-utilities/testConstants.js");

const blogAdminUrl = testConstants.URLs.BlogAdmin;

async function blogAdminRolesAndTagsProperties() {
  const superAdmin = await new e2eSuperAdmin();

// test setup
  await superAdmin.openBrowser();
  await superAdmin.signUpNewUserWithUserNameAndEmail("blogAdm", "blog_admin@example.com");
  await superAdmin.logout();

  await superAdmin.signUpNewUserWithUserNameAndEmail("blogPostEditor", "blog_post_editor@example.com");
  await superAdmin.logout();

  await superAdmin.signUpNewUserWithUserNameAndEmail("superAdm", "testadmin@example.com");
  await superAdmin.assignBlogAdminRoleToUserWithUserName("superAdm");
  await superAdmin.expectUserToHaveBlogAdminRole();
// test setup ends

  await superAdmin.goto(blogAdminUrl);
  await superAdmin.assignUserAsRoleFromRoleDropdown("blogAdm", "BLOG_ADMIN"); // passing blog admin as BLOG_ADMIN because the dropdown has BLOG_ADMIN as the value attribute and we are using this value to select the option using puppeteer!
  await superAdmin.expectUserGivenTheRoleFromRoleDropdown("blogAdm", "BLOG_ADMIN");
  await superAdmin.assignUserAsRoleFromRoleDropdown("blogPostEditor", "BLOG_POST_EDITOR");
  await superAdmin.expectUserGivenTheRoleFromRoleDropdown("blogPostEditor", "BLOG_POST_EDITOR");

  await superAdmin.removeBlogEditorRoleByUsername("blogPostEditor");
  await superAdmin.expectRemovedBlogEditorRoleByUsername("blogPostEditor");
  
  await superAdmin.expectTagWithNameNotExistInTagList("Test_Tag");
  await superAdmin.addTagInTagListWithName("Test_Tag");
  await superAdmin.expectTagWithNameToExistInTagList("Test_Tag");

  await superAdmin.setMaximumTagLimitTo('5');
  await superAdmin.expectMaximumTagLimitToBe('5');

  await superAdmin.closeBrowser();
}

blogAdminRolesAndTagsProperties();
