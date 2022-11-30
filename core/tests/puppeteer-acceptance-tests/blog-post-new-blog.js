const e2eBlogPostAdmin = require("./utility-functions/blogAdminUtils.js");
const testConstants = require("./utility-functions/testConstants.js");


const blogDashboard = testConstants.URLs.BlogDashboard;

async function publishBlogAsBlogAdmin() {
  const blogPostAdmin = await new e2eBlogPostAdmin();
  await blogPostAdmin.getInitialized();

  await blogPostAdmin.signInWithEmail("testadmin@example.com");
  await blogPostAdmin.goto(blogDashboard);
  await blogPostAdmin.createNewBlogPost();
  await blogPostAdmin.publishBlog();

  await blogPostAdmin.closeBrowser();
}

publishBlogAsBlogAdmin();
