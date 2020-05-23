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

describe('Test Translations', function() {
  var creatorDashboardPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorTranslationTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  var libraryPage = null;

  beforeAll(function() {
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorTranslationTab =
      explorationEditorPage.getTranslationTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    libraryPage = new LibraryPage.LibraryPage();

    users.createUser('testTranslations@translations.com', 'testTranslations');
    users.login('testTranslations@translations.com');
    workflow.createExploration();

    explorationEditorMainTab.setStateName('First');
    explorationEditorMainTab.setContent(forms.toRichText(
      'This is the first card.'
    ));
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.navigateToTranslationTab();
    explorationEditorTranslationTab.exitTutorial();
    explorationEditorTranslationTab.changeLanguage('Hindi');
    explorationEditorTranslationTab.openUploadAudioModal();
    explorationEditorTranslationTab.uploadAudio(
      '../data/cafe.mp3');
    explorationEditorPage.saveChanges();
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle('Test Translations');
    explorationEditorSettingsTab.setCategory('Languages');
    explorationEditorSettingsTab.setLanguage('English');
    explorationEditorSettingsTab.setObjective(
      'Testing if translations works');
    explorationEditorPage.saveChanges('Done.');
    workflow.publishExploration();
    users.logout();
  });

  it('should play and pause audio translations', function() {
    users.login('testTranslations@translations.com');
    libraryPage.get();
    libraryPage.playExploration('Test Translations');
    explorationPlayerPage.clickAudioBar();
    explorationPlayerPage.playAudio();
    explorationPlayerPage.expectAudioToBePlaying();
    explorationPlayerPage.pauseAudio();
    explorationPlayerPage.expectAudioToBePaused();
    users.logout();
  });

  it('should play translations for multiple languages', function() {
    users.login('testTranslations@translations.com');
    creatorDashboardPage.get();
    creatorDashboardPage.editExploration('Test Translations');
    explorationEditorPage.navigateToTranslationTab();
    explorationEditorTranslationTab.exitTutorial();
    explorationEditorTranslationTab.changeLanguage('Arabic');
    explorationEditorTranslationTab.openUploadAudioModal();
    explorationEditorTranslationTab.uploadAudio(
      '../data/ambient-noise.mp3');
    explorationEditorPage.saveChanges('Added another translation');
    libraryPage.get();
    libraryPage.playExploration('Test Translations');
    browser.refresh();
    explorationPlayerPage.clickAudioBar();
    explorationPlayerPage.playAudio();
    explorationPlayerPage.expectAudioToBePlaying();
    explorationPlayerPage.pauseAudio();
    explorationPlayerPage.changeLanguage('Arabic');
    explorationPlayerPage.playAudio();
    explorationPlayerPage.expectAudioToBePlaying();
  });
});
