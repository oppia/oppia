const acceptanceTests = require("../utility-functions/puppeteer_utils.js");
const testConstants = require("../utility-functions/testConstants.js");


const translationTab = "e2e-test-translation-tab";
const startRecording = "e2e-test-accessibility-translation-start-record";
const stopRecording = "e2e-test-stop-record-button";



async function voiceoverRecording_journey() {
  const obj = await new acceptanceTests;
  const page = await obj.init();
  
  await page.goto(testConstants.URLs.home);
  await obj.clickOn("button", "OK");
  await obj.clickOn("span", "Sign in");
  await obj.type(testConstants.SignInDetails.inputField, "testadmin@example.com");
  await obj.clickOn("span", "Sign In");
  
  await page.waitForSelector(testConstants.Dashboard.MainDashboard);
  
  // creating a new exploration
  await page.goto(testConstants.URLs.CreatorDashboard);
  await obj.clickOn("button", " + Create Exploration ");
  await obj.clickOn("li", translationTab); // icon

  // recording a 3sec audio
  await obj.clickOn("button", startRecording);  // icon
  await page.waitForSelector("button", stopRecording);
  await page.waitForTimeout(3000);
  await obj.clickOn("button", stopRecording);
  await obj.clickOn("button", " Confirm ");

  console.log("Successfully tested recording of audio!");
  await obj.browser.close();
};

voiceoverRecording_journey();