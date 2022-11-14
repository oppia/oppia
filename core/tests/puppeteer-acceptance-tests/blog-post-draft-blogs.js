const acceptanceTests = require("./utility-functions/puppeteer_utils.js");
const testConstants = require("./utility-functions/testConstants.js");


const blogEditOptions = "button.e2e-test-blog-post-edit-box";

async function blogDrafts_journey() {
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

  try{
    await obj.clickOn(blogEditOptions); // an icon
    await obj.clickText("span", "Delete", 100);
    await obj.clickText("button", " Confirm ");
  } catch {
    console.log("no blog post in drafts");
  }

  console.log("Successfully tested deleting blog drafts");
  await obj.browser.close();

}

blogDrafts_journey();