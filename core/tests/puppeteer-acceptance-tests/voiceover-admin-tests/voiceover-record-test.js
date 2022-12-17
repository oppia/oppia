const e2eVoiceoverAdmin = require("../puppeteer-testing-utilities/voiceoverAdminUtils.js");
const testConstants = require("../puppeteer-testing-utilities/testConstants.js");


const homePage = testConstants.Dashboard.LearnerDashboard;
const creatorDashboardUrl = testConstants.URLs.CreatorDashboard;



async function recordAudioAsVoiceoverAdmin() {
  const voiceoverAdmin = await new e2eVoiceoverAdmin();
  await voiceoverAdmin.openBrowser();
  
  await voiceoverAdmin.signInWithEmail("testadmin@example.com");
  await voiceoverAdmin.goto(creatorDashboardUrl);
  await voiceoverAdmin.gotoTranslationTabInNewExploration();
  await voiceoverAdmin.record3SecAudio();
  await voiceoverAdmin.playAudio();
  
  await voiceoverAdmin.closeBrowser();
};

recordAudioAsVoiceoverAdmin();
