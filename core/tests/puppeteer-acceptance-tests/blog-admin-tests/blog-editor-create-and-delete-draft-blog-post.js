const e2eBlogPostEditor = require('../puppeteer-testing-utilities/blogPostAdminUtils.js');
const testConstants = require('../puppeteer-testing-utilities/testConstants.js');

const blogDashboardUrl = testConstants.URLs.BlogDashboard;
const ROLE_BLOG_ADMIN = 'blog admin';

async function createDraftAndDeleteDraftAsBlogPostAdmin() {
  const blogPostEditor = await new e2eBlogPostEditor();
  await blogPostEditor.openBrowser();

  await blogPostEditor.signUpNewUserWithUsernameAndEmail('superAdm', 'testadmin@example.com');
  await blogPostEditor.assignRoleToUser('superAdm', ROLE_BLOG_ADMIN);
  await blogPostEditor.expectUserToHaveBlogAdminRole();

  await blogPostEditor.goto(blogDashboardUrl);
  await blogPostEditor.expectNumberOfDraftOrPublishedBlogPostsToBe(0);
  await blogPostEditor.createDraftBlogPostWithTitle('Test-Blog');

  await blogPostEditor.goto(blogDashboardUrl);
  await blogPostEditor.expectDraftBlogPostWithTitleToBePresent('Test-Blog');

  await blogPostEditor.deleteDraftBlogPostByTitle('Test-Blog');
  await blogPostEditor.expectDraftBlogPostWithTitleToBeAbsent('Test-Blog');
  
  await blogPostEditor.closeBrowser();
}

createDraftAndDeleteDraftAsBlogPostAdmin();
