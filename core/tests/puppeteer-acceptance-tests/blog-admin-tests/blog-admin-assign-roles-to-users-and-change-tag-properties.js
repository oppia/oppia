const e2eSuperAdmin = require('../puppeteer-testing-utilities/blogPostAdminUtils.js');
const testConstants = require('../puppeteer-testing-utilities/testConstants.js');

const blogAdminUrl = testConstants.URLs.BlogAdmin;
const ROLE_BLOG_ADMIN = 'BLOG_ADMIN';
const ROLE_BLOG_POST_EDITOR = 'BLOG_POST_EDITOR';

async function blogAdminUpdatingRolesAndTagsProperties() {
  const superAdmin = await new e2eSuperAdmin();

  await superAdmin.openBrowser();
  await superAdmin.signUpNewUserWithUsernameAndEmail('blogAdm', 'blog_admin@example.com');
  await superAdmin.logout();

  await superAdmin.signUpNewUserWithUsernameAndEmail('blogPostEditor', 'blog_post_editor@example.com');
  await superAdmin.logout();

  await superAdmin.signUpNewUserWithUsernameAndEmail('superAdm', 'testadmin@example.com');
  await superAdmin.assignRoleToUser('superAdm', 'blog admin');
  await superAdmin.expectUserToHaveBlogAdminRole();

  await superAdmin.goto(blogAdminUrl);
  await superAdmin.assignUserAsRoleFromRoleDropdown('blogAdm', ROLE_BLOG_ADMIN);
  await superAdmin.expectRoleOfUserToBe('blogAdm', ROLE_BLOG_ADMIN);
  await superAdmin.assignUserAsRoleFromRoleDropdown('blogPostEditor', ROLE_BLOG_POST_EDITOR);
  await superAdmin.expectRoleOfUserToBe('blogPostEditor', ROLE_BLOG_POST_EDITOR);

  await superAdmin.removeBlogEditorRoleByUsername('blogPostEditor');
  await superAdmin.expectRemovedBlogEditorRoleByUsername('blogPostEditor');
  
  await superAdmin.expectTagToNotExistInBlogTags('Test_Tag');
  await superAdmin.addNewBlogTag('Test_Tag');
  await superAdmin.expectTagWithNameToExistInTagList('Test_Tag');

  await superAdmin.setMaximumTagLimitTo('5');
  await superAdmin.expectMaximumTagLimitToBe('5');

  await superAdmin.closeBrowser();
}

blogAdminUpdatingRolesAndTagsProperties();
