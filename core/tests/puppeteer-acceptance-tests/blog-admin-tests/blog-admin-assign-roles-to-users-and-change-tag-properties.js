const e2eSuperAdmin = require('../puppeteer-testing-utilities/blogPostAdminUtils.js');
const e2eBlogAdmin = require('../puppeteer-testing-utilities/blogPostAdminUtils.js');
const e2eBlogPostEditor = require('../puppeteer-testing-utilities/blogPostAdminUtils.js');
const testConstants = require('../puppeteer-testing-utilities/testConstants.js');

const blogAdminUrl = testConstants.URLs.BlogAdmin;
const ROLE_BLOG_ADMIN = 'BLOG_ADMIN';
const ROLE_BLOG_POST_EDITOR = 'BLOG_POST_EDITOR';

async function blogAdminUpdatingRolesAndTagsProperties() {
  const superAdmin = await new e2eSuperAdmin();
  const blogAdmin = await new e2eBlogAdmin();
  const blogPostEditor = await new e2eBlogPostEditor();

  await blogAdmin.openBrowser();
  await blogAdmin.signUpNewUserWithUsernameAndEmail('blogAdm', 'blog_admin@example.com');
  await blogAdmin.closeBrowser();

  await blogPostEditor.openBrowser();
  await blogPostEditor.signUpNewUserWithUsernameAndEmail('blogPostEditor', 'blog_post_editor@example.com');
  await blogPostEditor.closeBrowser();

  await superAdmin.openBrowser();
  await superAdmin.signUpNewUserWithUsernameAndEmail('superAdm', 'testadmin@example.com');
  await superAdmin.assignRoleToUser('superAdm', 'blog admin');
  await superAdmin.expectUserToHaveRole('superAdm', 'Blog Admin');

  await superAdmin.goto(blogAdminUrl);
  await superAdmin.assignUserAsRoleFromRoleDropdown('blogAdm', ROLE_BLOG_ADMIN);
  await superAdmin.expectUserToHaveRole('blogAdm', 'Blog Admin');
  await superAdmin.assignUserAsRoleFromRoleDropdown('blogPostEditor', ROLE_BLOG_POST_EDITOR);
  await superAdmin.expectUserToHaveRole('blogPostEditor', 'Blog Post Editor');

  await superAdmin.removeBlogEditorRoleWithUsername('blogPostEditor');
  await superAdmin.expectUserNotToHaveRole('blogPostEditor', 'Blog Post Editor');

  await superAdmin.expectTagToNotExistInBlogTags('Test_Tag');
  await superAdmin.addNewBlogTag('Test_Tag');
  await superAdmin.expectTagWithNameToExistInTagList('Test_Tag');

  await superAdmin.setMaximumTagLimitTo('5');
  await superAdmin.expectMaximumTagLimitToBe('5');

  await superAdmin.closeBrowser();
}

blogAdminUpdatingRolesAndTagsProperties();
