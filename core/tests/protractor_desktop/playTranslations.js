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
 * @fileoverview End-to-end tests for the functionality of voiceover upload.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationEditorPage =
    require('../protractor_utils/ExplorationEditorPage.js');
var CreatorDashboardPage =
    require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationPlayerPage =
    require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage =
    require('../protractor_utils/LibraryPage.js');

describe('Test if Translations Play', function() {
  var creatorDashboardPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorTranslationTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  var libraryPage = null;

  beforeAll(async function() {
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorTranslationTab =
      explorationEditorPage.getTranslationTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    libraryPage = new LibraryPage.LibraryPage();

    await users.createUser('testTranslations@translations.com',
      'testTranslations');
    await users.login('testTranslations@translations.com');
    await workflow.createExploration();
    await explorationEditorMainTab.exitTutorial();
    await explorationEditorMainTab.setStateName('First');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'This is the first card.'));
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.navigateToTranslationTab();
    await explorationEditorTranslationTab.uploadAudioFileForLanguage(
      'Hindi', '../data/cafe.mp3');
    await explorationEditorPage.saveChanges();
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle('translationPlayerTest');
    await explorationEditorSettingsTab.setCategory('Languages');
    await explorationEditorSettingsTab.setLanguage('English');
    await explorationEditorSettingsTab.setObjective(
      'Testing if translations works');
    await explorationEditorPage.saveChanges('Done.');
    await workflow.publishExploration();
    await users.logout();
  });

  it('should play and pause voiceovers', async function() {
    await users.login('testTranslations@translations.com');
    await libraryPage.get();
    await libraryPage.playExploration('translationPlayerTest');
    await explorationPlayerPage.clickAudioBar();
    await explorationPlayerPage.playAudio();
    await explorationPlayerPage.expectAudioToBePlaying();
    await explorationPlayerPage.pauseAudio();
    await explorationPlayerPage.expectAudioToBePaused();
  });

  it('should play translations for multiple languages', async function() {
    await creatorDashboardPage.get();
    await creatorDashboardPage.editExploration('translationPlayerTest');
    await explorationEditorPage.navigateToTranslationTab();
    await explorationEditorTranslationTab.uploadAudioFileForLanguage(
      'Arabic', '../data/ambient-noise.mp3');
    await explorationEditorPage.saveChanges('Added another translation');
    await libraryPage.get();
    await libraryPage.playExploration('translationPlayerTest');
    await explorationPlayerPage.clickAudioBar();
    await explorationPlayerPage.playAudio();
    await explorationPlayerPage.expectAudioToBePlaying();
    await explorationPlayerPage.pauseAudio();
    await browser.refresh();
    await explorationPlayerPage.clickAudioBar();
    await explorationPlayerPage.changeLanguage('Arabic');
    await explorationPlayerPage.playAudio();
    await explorationPlayerPage.expectAudioToBePlaying();
  });
});
