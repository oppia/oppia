const puppeteerUtilities = require('./puppeteer_utils.js');


const translationTab = 'e2e-test-translation-tab';
const startRecording = 'e2e-test-accessibility-translation-start-record';
const stopRecording = 'e2e-test-stop-record-button';
const audioPlay = 'e2e-test-play-pause-audio-button';
const audioPause = 'fa-pause';
const uploadAudio = 'e2e-test-accessibility-translation-upload-audio';


module.exports = class e2eVoiceoverAdmin extends puppeteerUtilities {

  async gotoTranslationTabInNewExploration() {
    await this.clickOn('button', ' + Create Exploration ');
    await this.clickOn('li', translationTab);
  }

  async record3SecAudio() {
    await this.clickOn('button', startRecording);
    await (this.page).waitForSelector('button', stopRecording);
    await (this.page).waitForTimeout(3000);
    await this.clickOn('button', stopRecording);
    await this.clickOn('button', ' Confirm ');

    console.log('Successfully tested recording of audio!');
  }

  async uploadAudioFile(audioFileName) {
    await this.clickOn('button', uploadAudio);
    await this.uploadFile(audioFileName);
    await this.clickOn('button', ' Save ');

    console.log('Successfully uploaded audio: ' + audioFileName);
  }

  async playAudio() {
    await this.clickOn('button', audioPlay, 500);
    await this.clickOn('i', audioPause, 1000);

    console.log('Successfully played audio!');
  }
};
