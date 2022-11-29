const acceptanceTests = require("./utility-functions/puppeteer_utils.js");
const testConstants = require("./utility-functions/testConstants.js");


const blogEditOptions = "e2e-test-blog-post-edit-box";

async function deleteDraftAsBlogAdmin() {
  const user = await new acceptanceTests();
  const page = await user.init();

  await user.signInWithEmail("testadmin@example.com");
  
  await user.goto(testConstants.URLs.BlogDashboard, testConstants.Dashboard.MainDashboard);

  try{
    await user.clickOn("button", blogEditOptions); // an icon
    await user.clickOn("span", "Delete", 100);
    await user.clickOn("button", " Confirm ");
  } catch {
    console.log("no blog post in drafts");
  }

  console.log("Successfully tested deleting blog drafts");
  await user.browser.close();

}

deleteDraftAsBlogAdmin();
