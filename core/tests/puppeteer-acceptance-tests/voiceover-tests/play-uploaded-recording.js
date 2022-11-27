const acceptanceTests = require("../utility-functions/puppeteer_utils.js");
const testConstants = require("../utility-functions/testConstants.js");


const translationTab = "e2e-test-translation-tab";
const uploadAudio = 'e2e-test-accessibility-translation-upload-audio';
const audioPlay = 'e2e-test-play-pause-audio-button';
const audioPause = "fa-pause";



async function playUploadedAudioAsVoiceoverAdmin() {
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

  // uploading the audio
  await user.clickOn("button", uploadAudio);  // icon
  const inputUploadHandle = await page.$('input[type=file]');
  let fileToUpload = 'A4.mp3';
  inputUploadHandle.uploadFile(fileToUpload);
  await user.clickOn("button", " Save ");
  await user.clickOn("button", audioPlay, 500);
  await user.clickOn("i", audioPause, 1000);

  console.log("Successfully played uploaded audio!");
  await user.browser.close();
};

playUploadedAudioAsVoiceoverAdmin();
