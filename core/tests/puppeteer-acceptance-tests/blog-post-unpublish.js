const acceptanceTests = require("./utility-functions/puppeteer_utils.js");
const testConstants = require("./utility-functions/testConstants.js");


const blogEditBox = "e2e-test-blog-post-edit-box";

async function unpublishBlogAsBlogAdmin() {
  const user = await new acceptanceTests();
  const page = await user.init();
  
  await user.goto(testConstants.URLs.home);
  await user.clickOn("button", "OK");
  await user.clickOn("span", "Sign in");
  await user.type(testConstants.SignInDetails.inputField, "testadmin@example.com");
  await user.clickOn("span", "Sign In");
  
  await user.goto(testConstants.URLs.BlogDashboard, testConstants.Dashboard.MainDashboard);

  // published section of the blog-dashboard
  await user.clickOn("div", " PUBLISHED ");
  await page.waitForTimeout(500);
  
  // deleting a draft if present
  try{
    await user.clickOn("button", blogEditBox);  // an icon
    await user.clickOn("span", "Unpublish", 100);
    await user.clickOn("button", " Confirm ");
  } catch {
    console.log("no published blog post");
  }
  
  console.log("Successfully unpublished a published blogs!");
  await user.browser.close();
};

unpublishBlogAsBlogAdmin();
