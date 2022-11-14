const acceptanceTests = require("../utility-functions/puppeteer_utils.js");
const testConstants = require("../utility-functions/testConstants.js");


const translationTab = "e2e-test-translation-tab";
const uploadAudio = 'e2e-test-accessibility-translation-upload-audio';
const audioPlay = 'e2e-test-play-pause-audio-button';
const audioPause = "fa-pause";



async function voiceoverUploadRecording_journey() {
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

  // uploading the audio
  await obj.clickOn("button", uploadAudio);  // icon
  const inputUploadHandle = await page.$('input[type=file]');
  let fileToUpload = 'A4.mp3';
  inputUploadHandle.uploadFile(fileToUpload);
  await obj.clickOn("button", " Save ");
  await obj.clickOn("button", audioPlay, 500);
  await obj.clickOn("i", audioPause, 1000);

  console.log("Successfully played uploaded audio!");
  await obj.browser.close();
};

voiceoverUploadRecording_journey();