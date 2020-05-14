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
 * @fileoverview End-to-end tests for the functionality of the translation tab
 * in the exploration editor.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var CreatorDashboardPage = require(
  '../protractor_utils/CreatorDashboardPage.js');
var ExplorationEditorPage = require(
  '../protractor_utils/ExplorationEditorPage.js');

describe('Exploration translation and voiceover tab', function() {
  var adminPage = null;
  var creatorDashboardPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorPage = null;
  var explorationEditorSettingsTab = null;
  var explorationEditorTranslationTab = null;
  var YELLOW_STATE_PROGRESS_COLOR = 'rgb(233, 179, 48)';
  var GREEN_STATE_PROGRESS_COLOR = 'rgb(22, 167, 101)';
  var RED_STATE_PROGRESS_COLOR = 'rgb(209, 72, 54)';

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationEditorTranslationTab = explorationEditorPage.getTranslationTab();
    explorationPreviewTab = explorationEditorPage.getPreviewTab();

    await users.createUser('voiceArtist@translationTab.com', 'userVoiceArtist');
    await users.createUser('user@editorTab.com', 'userEditor');
    await users.createAndLoginAdminUser(
      'superUser@translationTab.com', 'superUser');
    // TODO(#7569): Change this test to work with the improvements tab.
    adminPage.editConfigProperty(
      'Exposes the Improvements Tab for creators in the exploration editor',
      'Boolean', (elem) => elem.setValue(false));
    await users.login('user@editorTab.com');
    await workflow.createExploration();

    explorationEditorMainTab.setStateName('first');
    explorationEditorMainTab.setContent(forms.toRichText(
      'This is first card.'));
    explorationEditorMainTab.setInteraction('NumericInput');
    explorationEditorMainTab.addResponse(
      'NumericInput', forms.toRichText('This is feedback1.'),
      'second', true, 'Equals', 6);
    var responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setFeedback(forms.toRichText('This is default_outcome.'));
    explorationEditorMainTab.addHint('This is hint1.');
    explorationEditorMainTab.addHint('This is hint2.');
    explorationEditorMainTab.addSolution('NumericInput', {
      correctAnswer: 6,
      explanation: 'This is solution.'
    });
    explorationEditorMainTab.moveToState('second');
    explorationEditorMainTab.setContent(
      forms.toRichText('This is second card.'));
    explorationEditorMainTab.setInteraction('Continue');
    var responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setDestination('final card', true, null);
    // Setup a terminating state.
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setContent(
      forms.toRichText('This is final card.'));
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle('Test Exploration');
    explorationEditorSettingsTab.setCategory('Algorithms');
    explorationEditorSettingsTab.setLanguage('English');
    explorationEditorSettingsTab.setObjective(
      'Run tests using same exploration.');
    explorationEditorPage.saveChanges('Done!');
    workflow.addExplorationVoiceArtist('userVoiceArtist');
  });

  it('should walkthrough translation tutorial when user clicks next',
    async function() {
      await users.login('user@editorTab.com');
      creatorDashboardPage.get();
      creatorDashboardPage.editExploration('Test Exploration');
      explorationEditorPage.navigateToTranslationTab();
      explorationEditorTranslationTab.startTutorial();
      explorationEditorTranslationTab.playTutorial();
      explorationEditorTranslationTab.finishTutorial();
      await users.logout();

      await users.login('voiceArtist@translationTab.com');
      creatorDashboardPage.get();
      creatorDashboardPage.editExploration('Test Exploration');
      explorationEditorMainTab.exitTutorial();
      explorationEditorPage.navigateToTranslationTab();
      explorationEditorTranslationTab.startTutorial();
      explorationEditorTranslationTab.playTutorial();
      explorationEditorTranslationTab.finishTutorial();
      await users.logout();
    });

  it('should cache the selected language for translation and voiceover',
    async function() {
      await users.login('voiceArtist@translationTab.com');
      creatorDashboardPage.get();
      creatorDashboardPage.editExploration('Test Exploration');
      explorationEditorMainTab.exitTutorial();
      explorationEditorPage.navigateToTranslationTab();
      explorationEditorTranslationTab.expectSelectedLanguageToBe('English');
      explorationEditorTranslationTab.changeLanguage('Hindi');
      browser.refresh();
      explorationEditorTranslationTab.expectSelectedLanguageToBe('Hindi');
    });

  it('should have voiceover as a default mode', async function() {
    await users.login('voiceArtist@translationTab.com');
    creatorDashboardPage.get();
    creatorDashboardPage.editExploration('Test Exploration');
    explorationEditorPage.navigateToTranslationTab();
    explorationEditorTranslationTab.changeLanguage('Hindi');
    explorationEditorTranslationTab.exitTutorial();
    explorationEditorTranslationTab.expectToBeInVoiceoverMode();
    await users.logout();
  });

  it('should have all the state contents for voiceover in exploration language',
    async function() {
      await users.login('voiceArtist@translationTab.com');
      creatorDashboardPage.get();
      creatorDashboardPage.editExploration('Test Exploration');
      explorationEditorPage.navigateToTranslationTab();
      explorationEditorTranslationTab.changeLanguage('English');
      explorationEditorTranslationTab.expectContentTabContentToMatch(
        'This is first card.');
      explorationEditorTranslationTab.expectFeedbackTabContentsToMatch(
        ['This is feedback1.', 'This is default_outcome.']);
      explorationEditorTranslationTab.expectSolutionTabContentToMatch(
        'This is solution.');
      explorationEditorTranslationTab.expectHintsTabContentsToMatch(
        ['This is hint1.', 'This is hint2.']);
      await users.logout();
    });

  it('should contain accessibility elements', async function() {
    await users.login('voiceArtist@translationTab.com');
    creatorDashboardPage.get();
    creatorDashboardPage.editExploration('Test Exploration');
    explorationEditorPage.navigateToTranslationTab();

    explorationEditorTranslationTab.expectNumericalStatusAccessibilityToMatch(
      '0 items translated out of 8 items');
    explorationEditorTranslationTab.expectContentAccessibilityToMatch(
      'Content of the card');
    explorationEditorTranslationTab.expectFeedbackAccessibilityToMatch(
      'Feedback responses for answer groups');
    explorationEditorTranslationTab.expectHintAccessibilityToMatch(
      'Hints for the state');
    explorationEditorTranslationTab.expectSolutionAccessibilityToMatch(
      'Solutions for the state');
    explorationEditorTranslationTab.expectStartRecordingAccessibilityToMatch(
      'Start recording');
    explorationEditorTranslationTab.expectUploadRecordingAccessibilityToMatch(
      'Upload voiceovered file');
    explorationEditorTranslationTab.expectPlayRecordingAccessibilityToMatch(
      'Play recorded audio');
    await users.logout();
  });

  it(
    'should maintain its active sub-tab on saving draft and publishing changes',
    async function() {
      await users.login('user@editorTab.com');
      creatorDashboardPage.get();
      creatorDashboardPage.editExploration('Test Exploration');
      explorationEditorPage.navigateToTranslationTab();
      explorationEditorTranslationTab.exitTutorial();
      explorationEditorTranslationTab.changeLanguage('Hindi');
      explorationEditorTranslationTab.switchToTranslationMode();
      explorationEditorTranslationTab.navigateToFeedbackTab();
      explorationEditorTranslationTab.setTranslation(forms.toRichText(
        'Sample Translation.'));
      explorationEditorPage.saveChanges('Adds one translation.');
      explorationEditorTranslationTab.expectFeedbackTabToBeActive();
      workflow.publishExploration();
      explorationEditorTranslationTab.expectFeedbackTabToBeActive();
      await users.logout();
    });


  it('should change translation language correctly', async function() {
    await users.login('voiceArtist@translationTab.com');
    creatorDashboardPage.get();
    creatorDashboardPage.editExploration('Test Exploration');
    explorationEditorPage.navigateToTranslationTab();
    explorationEditorTranslationTab.changeLanguage('Hindi');
    explorationEditorTranslationTab.expectSelectedLanguageToBe('Hindi');
    await users.logout();
  });

  it('should correctly switch to different modes', async function() {
    await users.login('voiceArtist@translationTab.com');
    creatorDashboardPage.get();
    creatorDashboardPage.editExploration('Test Exploration');
    explorationEditorPage.navigateToTranslationTab();
    explorationEditorTranslationTab.expectToBeInVoiceoverMode();
    explorationEditorTranslationTab.changeLanguage('Hindi');

    explorationEditorTranslationTab.switchToTranslationMode();
    explorationEditorTranslationTab.expectToBeInTranslationMode();

    explorationEditorTranslationTab.switchToVoiceoverMode();
    explorationEditorTranslationTab.expectToBeInVoiceoverMode();
    await users.logout();
  });

  it('should allow adding translation and reflect the progress',
    async function() {
      await users.login('user@editorTab.com');
      creatorDashboardPage.get();
      creatorDashboardPage.editExploration('Test Exploration');
      explorationEditorPage.navigateToTranslationTab();
      explorationEditorTranslationTab.exitTutorial();
      explorationEditorTranslationTab.changeLanguage('Hindi');
      explorationEditorTranslationTab.switchToTranslationMode();

      explorationEditorTranslationTab.expectCorrectStatusColor(
        'first', YELLOW_STATE_PROGRESS_COLOR);
      explorationEditorTranslationTab.expectCorrectStatusColor(
        'second', RED_STATE_PROGRESS_COLOR);
      explorationEditorTranslationTab.expectCorrectStatusColor(
        'final card', RED_STATE_PROGRESS_COLOR);
      explorationEditorTranslationTab.expectNumericalStatusAccessibilityToMatch(
        '1 item translated out of 8 items');

      explorationEditorTranslationTab.moveToState('first');
      explorationEditorTranslationTab.expectContentTabContentToMatch(
        'This is first card.');
      explorationEditorTranslationTab.setTranslation(forms.toRichText(
        'Yeh pehla panna hain.'));
      explorationEditorTranslationTab.navigateToFeedbackTab();
      explorationEditorTranslationTab.setTranslation(forms.toRichText(
        'Yeh hindi main vishleshad hain.'));
      explorationEditorTranslationTab.moveToState('final card');
      explorationEditorTranslationTab.expectContentTabContentToMatch(
        'This is final card.');
      explorationEditorTranslationTab.setTranslation(forms.toRichText(
        'Yeh aakhri panna hain.'));

      explorationEditorTranslationTab.moveToState('first');
      explorationEditorTranslationTab.expectTranslationToMatch(forms.toRichText(
        'Yeh pehla panna hain.'));
      explorationEditorTranslationTab.navigateToFeedbackTab();
      explorationEditorTranslationTab.expectTranslationToMatch(forms.toRichText(
        'Yeh hindi main vishleshad hain.'));
      explorationEditorTranslationTab.moveToState('final card');
      explorationEditorTranslationTab.expectTranslationToMatch(forms.toRichText(
        'Yeh aakhri panna hain.'));

      explorationEditorTranslationTab.switchToVoiceoverMode();
      explorationEditorTranslationTab.switchToTranslationMode();
      explorationEditorTranslationTab.moveToState('first');
      explorationEditorTranslationTab.expectTranslationToMatch(forms.toRichText(
        'Yeh pehla panna hain.'));
      explorationEditorTranslationTab.navigateToFeedbackTab();
      explorationEditorTranslationTab.expectTranslationToMatch(forms.toRichText(
        'Yeh hindi main vishleshad hain.'));
      explorationEditorTranslationTab.moveToState('final card');
      explorationEditorTranslationTab.expectTranslationToMatch(forms.toRichText(
        'Yeh aakhri panna hain.'));
      explorationEditorTranslationTab.expectCorrectStatusColor(
        'first', YELLOW_STATE_PROGRESS_COLOR);
      explorationEditorTranslationTab.expectCorrectStatusColor(
        'second', RED_STATE_PROGRESS_COLOR);
      explorationEditorTranslationTab.expectCorrectStatusColor(
        'final card', GREEN_STATE_PROGRESS_COLOR);
      explorationEditorTranslationTab.expectNumericalStatusAccessibilityToMatch(
        '3 items translated out of 8 items');
      await users.logout();
    });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
