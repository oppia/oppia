// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for the functionality of the upload files
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationEditorPage =
    require('../protractor_utils/ExplorationEditorPage.js');

describe('Exploration tab', function() {
  var TEST_USERNAME = 'uploadUser';
  var TEST_EMAIL = TEST_USERNAME + '@example.com';
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorTranslationTab = null;
  var explorationEditorSettingsTab = null;

  beforeAll(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab =
      explorationEditorPage.getMainTab();
    explorationEditorTranslationTab =
      explorationEditorPage.getTranslationTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();

    users.createUser(TEST_EMAIL, TEST_USERNAME);
    users.login(TEST_EMAIL);
    workflow.createExploration();

    explorationEditorMainTab.setStateName('Uploading translation file');
    explorationEditorMainTab.setContent(forms.toRichText(
      'This is the first card.'
    ));
    explorationEditorMainTab.setInteraction('EndExploration');
  });

  it('should upload an audio file', function() {
    explorationEditorPage.navigateToTranslationTab();
    explorationEditorTranslationTab
      .exitTutorial();
    explorationEditorTranslationTab.expectUploadRecordingAccessibilityToMatch(
      'Upload voiceovered file');

    explorationEditorTranslationTab.openUploadAudioModal();
    explorationEditorTranslationTab.uploadAudio(
      '../data/cafe.mp3');
  });

  it('should play an uploaded audio file', function() {
    explorationEditorTranslationTab.playOrPauseAudioFile()
      .then(function(isPlaying) {
        expect(isPlaying).toBe(true);
      });
  });

  it('should pause an uploaded audio file', function() {
    explorationEditorTranslationTab.playOrPauseAudioFile()
      .then(function(isPlaying) {
        expect(isPlaying).toBe(false);
      });
  });

  it('should not let upload a non audio file', function() {
    explorationEditorTranslationTab.openUploadAudioModal();
    explorationEditorTranslationTab.expectWrongFileType(
      '../data/img.png');
    explorationEditorTranslationTab.expectSaveUploadedAudioButtonToBeDisabled();
    explorationEditorTranslationTab.closeUploadAudioModal();
  });

  it('should not let upload a five minutes longer video', function() {
    explorationEditorTranslationTab.openUploadAudioModal();
    explorationEditorTranslationTab.expectAudioOverFiveMinutes(
      '../data/cafe-over-five-minutes.mp3');
    explorationEditorTranslationTab.expectSaveUploadedAudioButtonToBeDisabled();
    explorationEditorTranslationTab.closeUploadAudioModal();
  });

  afterAll(function() {
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle('Upload audio file');
    explorationEditorSettingsTab.setCategory('Languages');
    explorationEditorSettingsTab.setLanguage('English');
    explorationEditorSettingsTab
      .setObjective('Upload an translation audio file.');
    explorationEditorPage.saveChanges('Adds audio file in translation tab.');
    workflow.publishExploration();
  });

  afterEach(function() {
    general.checkForConsoleErrors([
      'Failed to load resource: the server responded with a status of 400' +
      '(Bad Request)', {status_code: 400,
        error: 'Audio files must be under 300 seconds in length.' +
       ' The uploaded file is 301.87 seconds long.'}]);
  });
});
