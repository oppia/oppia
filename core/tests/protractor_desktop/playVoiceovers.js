// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for the functionality of the voiceover player.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationEditorPage = require(
  '../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage = require(
  '../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('Voiceover player', function() {
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorTranslationTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  var libraryPage = null;

  beforeAll(async function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorTranslationTab = (
      explorationEditorPage.getTranslationTab());
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    libraryPage = new LibraryPage.LibraryPage();

    await users.createAndLoginUser(
      'testVoiceovers@voiceovers.com', 'testVoiceovers');
    await workflow.createExploration();
    await explorationEditorMainTab.exitTutorial();
    await explorationEditorMainTab.setStateName('First');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'This is the first card.'));
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.navigateToTranslationTab();
    await explorationEditorTranslationTab.exitTutorial();
    await explorationEditorTranslationTab.uploadAudioFileForLanguage(
      'Hindi', '../data/cafe.mp3');
    await explorationEditorTranslationTab.uploadAudioFileForLanguage(
      'Arabic', '../data/ambient-noise.mp3');
    await explorationEditorPage.saveChanges('Added voiceovers');
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle('voiceoverPlayerTest');
    await explorationEditorSettingsTab.setCategory('Languages');
    await explorationEditorSettingsTab.setLanguage('English');
    await explorationEditorSettingsTab.setObjective(
      'Testing if voiceovers work');
    await explorationEditorPage.saveChanges('Done.');
    await workflow.publishExploration();
  });

  it('should play voiceovers for multiple languages', async function() {
    await libraryPage.get();
    await libraryPage.playExploration('voiceoverPlayerTest');
    await explorationPlayerPage.expandAudioBar();
    await explorationPlayerPage.changeVoiceoverLanguage('Hindi');
    await explorationPlayerPage.pressPlayButton();
    await explorationPlayerPage.expectAudioToBePlaying();
    await explorationPlayerPage.pressPauseButton();
    await explorationPlayerPage.changeVoiceoverLanguage('Arabic');
    await explorationPlayerPage.pressPlayButton();
    await explorationPlayerPage.expectAudioToBePlaying();
  });

  afterEach(async function() {
    await users.logout();
    await general.checkForConsoleErrors(['The play()']);
  });
});
