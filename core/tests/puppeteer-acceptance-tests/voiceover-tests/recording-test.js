const acceptanceTests = require("../utility-functions/puppeteer_utils.js");
const testConstants = require("../utility-functions/testConstants.js");


const translationTab = "e2e-test-translation-tab";
const startRecording = "e2e-test-accessibility-translation-start-record";
const stopRecording = "e2e-test-stop-record-button";



async function recordingAudioAsVoiceoverAdmin() {
  const user = await new acceptanceTests;
  const page = await user.init();
  
  await user.goto(testConstants.URLs.home);
  await user.clickOn("button", "OK");
  await user.clickOn("span", "Sign in");
  await user.type(testConstants.SignInDetails.inputField, "testadmin@example.com");
  await user.clickOn("span", "Sign In");
  
  // creating a new exploration
  await user.goto(testConstants.URLs.CreatorDashboard, testConstants.Dashboard.MainDashboard);
  await user.clickOn("button", " + Create Exploration ");
  await user.clickOn("li", translationTab); // icon

  // recording a 3sec audio
  await user.clickOn("button", startRecording);  // icon
  await page.waitForSelector("button", stopRecording);
  await page.waitForTimeout(3000);  // recording for 3sec
  await user.clickOn("button", stopRecording);
  await user.clickOn("button", " Confirm ");

  console.log("Successfully tested recording of audio!");
  await user.browser.close();
};

recordingAudioAsVoiceoverAdmin();
