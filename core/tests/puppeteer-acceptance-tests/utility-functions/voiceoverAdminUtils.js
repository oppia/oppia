const browser = require("./puppeteer_utils.js");
const testConstants = require("./testConstants.js");


const translationTab = "e2e-test-translation-tab";
const startRecording = "e2e-test-accessibility-translation-start-record";
const stopRecording = "e2e-test-stop-record-button";
const audioPlay = 'e2e-test-play-pause-audio-button';
const audioPause = "fa-pause";
const uploadAudio = 'e2e-test-accessibility-translation-upload-audio';


module.exports = class e2eVoiceoverAdmin {
  page;
  browserInstance;

  async openBrowser() {
    this.browserInstance = await new browser();
    this.page = await (this.browserInstance).initialize();
  }

  async signInWithEmail(email) {
    await (this.browserInstance).signInWithEmail(email);
  }

  async waitForPageToLoad(selector) {
    await (this.page).waitForSelector(selector);
  }

  async goto(destination) {
    await (this.browserInstance).goto(destination);
  }

  async gotoTranslationTabInNewExploration() {
    await (this.browserInstance).clickOn("button", " + Create Exploration ");
    await (this.browserInstance).clickOn("li", translationTab);
  }

  async record3secAudio() {
    await (this.browserInstance).clickOn("button", startRecording);
    await (this.page).waitForSelector("button", stopRecording);
    await (this.page).waitForTimeout(3000);  // recording for 3sec
    await (this.browserInstance).clickOn("button", stopRecording);
    await (this.browserInstance).clickOn("button", " Confirm ");

    console.log("Successfully tested recording of audio!");
  }

  async uploadAudioFile(audioFileName) {
    await (this.browserInstance).clickOn("button", uploadAudio);  // icon
    await (this.browserInstance).uploadFile(audioFileName);
    await (this.browserInstance).clickOn("button", " Save ");

    console.log("Successfully uploaded audio: " + audioFileName);
  }

  async playAudio() {
    await (this.browserInstance).clickOn("button", audioPlay, 500);
    await (this.browserInstance).clickOn("i", audioPause, 1000);

    console.log("Successfully played audio!");
  }

  async closeBrowser() {
    await (this.browserInstance).closeBrowser();
  }
};
