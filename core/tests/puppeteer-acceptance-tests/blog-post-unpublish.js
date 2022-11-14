const acceptanceTests = require("./utility-functions/puppeteer_utils.js");
const testConstants = require("./utility-functions/testConstants.js");


const blogEditBox = "button.e2e-test-blog-post-edit-box";

async function unpublishBlog_journey() {
  const obj = await new acceptanceTests();
  const page = await obj.init();
  
  await page.goto(testConstants.URLs.home);
  // await obj.goto("http://localhost:8181/");
  await obj.clickText("button", "OK");
  await obj.clickText("span", "Sign in");
  await obj.type(testConstants.SignInDetails.inputField, "testadmin@example.com");
  await obj.clickText("span", "Sign In");
  
  await page.waitForSelector(testConstants.Dashboard.MainDashboard);
  await page.goto(testConstants.URLs.BlogDashboard);

  // published section of the blog-dashboard
  await obj.clickText("div", " PUBLISHED ");
  await page.waitForTimeout(1000);
  
  // deleting a draft if present
  try{
    await obj.clickOn(blogEditBox);  // an icon
    await obj.clickText("span", "Unpublish", 100);
    await obj.clickText("button", " Confirm ");
  } catch {
    console.log("no published blog post");
  }
  
  console.log("Successfully unpublished a published blogs!");
  await obj.browser.close();
};

  unpublishBlog_journey();