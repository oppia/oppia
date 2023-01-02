const e2eSuperAdmin = require('../puppeteer-testing-utilities/blogPostAdminUtils.js');
const e2eBlogAdmin = require('../puppeteer-testing-utilities/blogPostAdminUtils.js');
const testConstants = require('../puppeteer-testing-utilities/testConstants.js');

const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const ROLE_BLOG_ADMIN = 'blog admin';

async function superAdminAssignBlogAdminRole() {
  const blogAdmin = await new e2eBlogAdmin();
  const superAdmin = await new e2eSuperAdmin();
  
  await blogAdmin.openBrowser();
  await blogAdmin.signUpNewUserWithUsernameAndEmail('blogAdm', 'blog_admin@example.com');
  await blogAdmin.goto(blogDashboardUrl);
  await blogAdmin.expectBlogDashboardAccessToBeUnauthorized();

  await superAdmin.openBrowser();
  await superAdmin.signUpNewUserWithUsernameAndEmail('superAdm', 'testadmin@example.com');
  await superAdmin.assignRoleToUser('blogAdm', ROLE_BLOG_ADMIN);
  await superAdmin.expectUserToHaveBlogAdminRole();
  await superAdmin.closeBrowser();

  await blogAdmin.expectBlogDashboardAccessToBeAuthorized();
  await blogAdmin.closeBrowser();
}

superAdminAssignBlogAdminRole();
