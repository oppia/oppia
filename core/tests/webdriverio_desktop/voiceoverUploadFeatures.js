// Copyright 2022 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview End-to-end tests for the functionality of voiceover upload.
 */

var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');

var ExplorationEditorPage =
    require('../webdriverio_utils/ExplorationEditorPage.js');
var CreatorDashboardPage =
    require('../webdriverio_utils/CreatorDashboardPage.js');

describe('Voiceover upload features', function() {
  var TEST_USERNAME = 'uploadUser';
  var TEST_EMAIL = TEST_USERNAME + '@example.com';
  var EXPLORATION_TITLE = 'Upload audio file';
  var creatorDashboardPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorTranslationTab = null;
  var explorationEditorSettingsTab = null;

  beforeAll(async function() {
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorTranslationTab = (
      explorationEditorPage.getTranslationTab());
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();

    await users.createUser(TEST_EMAIL, TEST_USERNAME);
    await users.login(TEST_EMAIL);
    await workflow.createExploration(true);

    await explorationEditorMainTab.setStateName('Uploading translation file');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'This is the first card.',
      true,
    ));
    await explorationEditorMainTab.setInteraction('EndExploration');

    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle(EXPLORATION_TITLE);
    await explorationEditorSettingsTab.setCategory('Languages');
    await explorationEditorSettingsTab.setLanguage('English');
    await explorationEditorSettingsTab.setObjective(
      'Upload an translation audio file.');
    await explorationEditorPage.navigateToTranslationTab();
    await explorationEditorTranslationTab.exitTutorial();
    await explorationEditorPage.saveChanges(
      'Created exploration for voiceover upload.');
    await users.logout();
  });

  beforeEach(async function() {
    await users.login(TEST_EMAIL);
    await creatorDashboardPage.get();
    await creatorDashboardPage.editExploration(EXPLORATION_TITLE);
    await explorationEditorPage.navigateToTranslationTab();
  });

  it('should upload an audio file', async function() {
    await explorationEditorTranslationTab.openUploadAudioModal();
    await explorationEditorTranslationTab.uploadAudio(
      '../data/cafe.mp3');

    var playClick = (
      await explorationEditorTranslationTab.playOrPauseAudioFile());
    expect(playClick).toBe(true);

    var pauseClick = (
      await explorationEditorTranslationTab.playOrPauseAudioFile());
    expect(pauseClick).toBe(false);
  });

  it('should not let upload a non audio file', async function() {
    await explorationEditorTranslationTab.openUploadAudioModal();
    await explorationEditorTranslationTab.expectWrongFileType(
      '../data/img.png');
    await explorationEditorTranslationTab
      .expectSaveUploadedAudioButtonToBeDisabled();
    await explorationEditorTranslationTab.closeUploadAudioModal();
  });

  it('should not let upload a five minutes longer audio', async function() {
    await explorationEditorTranslationTab.openUploadAudioModal();
    await explorationEditorTranslationTab.expectAudioOverFiveMinutes(
      '../data/cafe-over-five-minutes.mp3');
    await explorationEditorTranslationTab
      .expectSaveUploadedAudioButtonToBeDisabled();
    await explorationEditorTranslationTab.closeUploadAudioModal();
    await explorationEditorTranslationTab.deleteAudioRecord();
  });

  it('should upload recorded audio and play after logging out',
    async function() {
      await explorationEditorTranslationTab.addAudioRecord();
      await explorationEditorTranslationTab.stopAudioRecord();
      await explorationEditorTranslationTab.confirmAudioRecord();
      await explorationEditorTranslationTab.playAudioRecord();
      await browser.refresh();
      await explorationEditorTranslationTab.playAudioRecord();

      // Try after logging out.
      await users.logout();
      await users.login(TEST_EMAIL);
      await creatorDashboardPage.get();
      await creatorDashboardPage.editExploration(EXPLORATION_TITLE);

      await explorationEditorPage.navigateToTranslationTab();
      await explorationEditorTranslationTab.playAudioRecord();
      await explorationEditorTranslationTab.deleteAudioRecord();
    });

  it('should upload audio file from path and play after logout',
    async function() {
      await explorationEditorTranslationTab.uploadAudioRecord(
        '../../../data/explorations/audio_test/assets/audio/' +
        'test_audio_1_en.mp3');
      await explorationEditorTranslationTab.saveAudioRecord();
      await explorationEditorTranslationTab.playAudioRecord();
      await browser.refresh();
      await explorationEditorTranslationTab.playAudioRecord();

      // Try after logging out.
      await users.logout();
      await users.login(TEST_EMAIL);
      await creatorDashboardPage.get();
      await creatorDashboardPage.editExploration(EXPLORATION_TITLE);

      await explorationEditorPage.navigateToTranslationTab();
      await explorationEditorTranslationTab.playAudioRecord();
      await explorationEditorTranslationTab.deleteAudioRecord();
      await explorationEditorPage.saveChanges(
        'Adds audio file in translation tab.');
      await workflow.publishExploration();
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([
      'Failed to load resource: the server responded with a status of 400' +
      '(Bad Request)', {status_code: 400,
        error: 'Audio files must be under 300 seconds in length.' +
       ' The uploaded file is 301.87 seconds long.'}]);
    await users.logout();
  });
});
