const e2eVoiceoverAdmin = require("../utility-functions/voiceoverAdminUtils.js");
const testConstants = require("../utility-functions/testConstants.js");


const homePage = testConstants.Dashboard.MainDashboard;
const creatorDashboardUrl = testConstants.URLs.CreatorDashboard;


async function playUploadedAudioAsVoiceoverAdmin() {
  const voiceoverAdmin = await new e2eVoiceoverAdmin();
  await voiceoverAdmin.openBrowser();
  
  await voiceoverAdmin.signInWithEmail("testadmin@example.com");
  await voiceoverAdmin.waitForPageToLoad(homePage);
  await voiceoverAdmin.goto(creatorDashboardUrl);
  await voiceoverAdmin.gotoTranslationTabInNewExploration();
  await voiceoverAdmin.uploadAudioFile('A4.mp3');
  await voiceoverAdmin.playAudio();

  await voiceoverAdmin.closeBrowser();
};

playUploadedAudioAsVoiceoverAdmin();
