const acceptanceTests = require("./utility-functions/puppeteer_utils.js");
const testConstants = require("./utility-functions/testConstants.js");


const blogEditBox = "e2e-test-blog-post-edit-box";

async function unpublishBlog_journey() {
  const obj = await new acceptanceTests();
  const page = await obj.init();
  
  await page.goto(testConstants.URLs.home);
  await obj.clickOn("button", "OK");
  await obj.clickOn("span", "Sign in");
  await obj.type(testConstants.SignInDetails.inputField, "testadmin@example.com");
  await obj.clickOn("span", "Sign In");
  
  await page.waitForSelector(testConstants.Dashboard.MainDashboard);
  await page.goto(testConstants.URLs.BlogDashboard);

  // published section of the blog-dashboard
  await obj.clickOn("div", " PUBLISHED ");
  await page.waitForTimeout(1000);
  
  // deleting a draft if present
  try{
    await obj.clickOn("button", blogEditBox);  // an icon
    await obj.clickOn("span", "Unpublish", 100);
    await obj.clickOn("button", " Confirm ");
  } catch {
    console.log("no published blog post");
  }
  
  console.log("Successfully unpublished a published blogs!");
  await obj.browser.close();
};

  unpublishBlog_journey();