const e2eBlogPostAdmin = require("./utility-functions/blogPostAdminUtils.js");
const testConstants = require("./utility-functions/testConstants.js");


const blogDashboardUrl = testConstants.URLs.BlogDashboard;

async function publishBlogAsBlogPostAdmin() {
  const blogPostAdmin = await new e2eBlogPostAdmin();
  await blogPostAdmin.getInitialized();

  await blogPostAdmin.signInWithEmail("testadmin@example.com");
  await blogPostAdmin.goto(blogDashboardUrl);
  await blogPostAdmin.createNewBlogPostByTitle("Test Blog Post");
  await blogPostAdmin.publishNewBlogPost();
  await blogPostAdmin.unpublishBlogPostByTitle("Test Blog Post");

  await blogPostAdmin.closeBrowser();
}

publishBlogAsBlogPostAdmin();
