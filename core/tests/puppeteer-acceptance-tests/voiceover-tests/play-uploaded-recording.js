const acceptanceTests = require("../utility-functions/puppeteer_utils.js");
const testConstants = require("../utility-functions/testConstants.js");


const translationTab = "li#tutorialTranslationTab";
const uploadAudio = 'button.e2e-test-accessibility-translation-upload-audio';
const audioPlay = 'button.e2e-test-play-pause-audio-button';
const audioPause = "i.fa-pause";

async function voiceoverUploadRecording_journey() {
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

  // uploading the audio
  await obj.clickOn(uploadAudio);  // icon
  const inputUploadHandle = await page.$('input[type=file]');
  let fileToUpload = 'A4.mp3';
  inputUploadHandle.uploadFile(fileToUpload);
  await obj.clickText("button", " Save ");
  await obj.clickOn(audioPlay, 500);
  await obj.clickOn(audioPause, 1000);

  console.log("Successfully played uploaded audio!");
  await obj.browser.close();
};

voiceoverUploadRecording_journey();