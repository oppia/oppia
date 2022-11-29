const acceptanceTests = require("../utility-functions/puppeteer_utils.js");
const testConstants = require("../utility-functions/testConstants.js");


const translationTab = "e2e-test-translation-tab";
const uploadAudio = 'e2e-test-accessibility-translation-upload-audio';
const audioPlay = 'e2e-test-play-pause-audio-button';
const audioPause = "fa-pause";



async function playUploadedAudioAsVoiceoverAdmin() {
  const user = await new acceptanceTests;
  const page = await user.init();
  
  await user.signInWithEmail("testadmin@example.com");
  
  // creating a new exploration
  await user.goto(testConstants.URLs.CreatorDashboard, testConstants.Dashboard.MainDashboard);
  await user.clickOn("button", " + Create Exploration ");
  await user.clickOn("li", translationTab); // icon

  // uploading the audio
  await user.clickOn("button", uploadAudio);  // icon
  await user.uploadFile('A4.mp3');
  await user.clickOn("button", " Save ");
  await user.clickOn("button", audioPlay, 500);
  await user.clickOn("i", audioPause, 1000);

  console.log("Successfully played uploaded audio!");
  await user.browser.close();
};

playUploadedAudioAsVoiceoverAdmin();
