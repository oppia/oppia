const acceptanceTests = require("../utility-functions/puppeteer_utils.js");
const testConstants = require("../utility-functions/testConstants.js");


const translationTab = "li#tutorialTranslationTab";
const startRecording = "button.e2e-test-accessibility-translation-start-record";
const stopRecording = "button.e2e-test-stop-record-button";

async function voiceoverRecording_journey() {
  const obj = await new acceptanceTests;
  const page = await obj.init();
  
  await page.goto(testConstants.URLs.home);
  // await obj.goto("http://localhost:8181/");
  await obj.clickText("button", "OK");
  await obj.clickText("span", "Sign in");
  await obj.type(testConstants.SignInDetails.inputField, "testadmin@example.com");
  await obj.clickText("span", "Sign In");
  
  await page.waitForSelector(testConstants.Dashboard.MainDashboard);
  
  // creating a new exploration
  await page.goto(testConstants.URLs.CreatorDashboard);
  await obj.clickText("button", " + Create Exploration ");
  await obj.clickOn(translationTab); // icon

  // recording a 3sec audio
  await obj.clickOn(startRecording);  // icon
  await page.waitForSelector(stopRecording);
  await page.waitForTimeout(3000);
  await obj.clickOn(stopRecording);
  await obj.clickText("button", " Confirm ");

  console.log("Successfully tested recording of audio!");
  await obj.browser.close();
};

voiceoverRecording_journey();