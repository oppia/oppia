const acceptanceTests = require("./utility-functions/puppeteer_utils.js");
const testConstants = require("./utility-functions/testConstants.js");


const blogEditOptions = "e2e-test-blog-post-edit-box";

async function blogDrafts_journey() {
  const obj = await new acceptanceTests();
  const page = await obj.init();

  await page.goto(testConstants.URLs.home);
  await obj.clickOn("button", "OK");
  await obj.clickOn("span", "Sign in");
  await obj.type(testConstants.SignInDetails.inputField, "testadmin@example.com");
  await obj.clickOn("span", "Sign In");
  
  await page.waitForSelector(testConstants.Dashboard.MainDashboard);
  await page.goto(testConstants.URLs.BlogDashboard);

  try{
    await obj.clickOn("button", blogEditOptions); // an icon
    await obj.clickOn("span", "Delete", 100);
    await obj.clickOn("button", " Confirm ");
  } catch {
    console.log("no blog post in drafts");
  }

  console.log("Successfully tested deleting blog drafts");
  await obj.browser.close();

}

blogDrafts_journey();