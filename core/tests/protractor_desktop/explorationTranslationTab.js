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

    await users.createUser(
      'voiceArtist@translationTab.com', 'userVoiceArtist');
    await users.createUser('user@editorTab.com', 'userEditor');
    await users.createAndLoginAdminUser(
      'superUser@translationTab.com', 'superUser');
    await users.login('user@editorTab.com');
    await workflow.createExploration();

    await explorationEditorMainTab.setStateName('first');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'This is first card.'));
    await explorationEditorMainTab.setInteraction('NumericInput');
    await explorationEditorMainTab.addResponse(
      'NumericInput', await forms.toRichText('This is feedback1.'),
      'second', true, 'Equals', 6);
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText(
      'This is default_outcome.'));
    await explorationEditorMainTab.addHint('This is hint1.');
    await explorationEditorMainTab.addHint('This is hint2.');
    await explorationEditorMainTab.addSolution('NumericInput', {
      correctAnswer: 6,
      explanation: 'This is solution.'
    });
    await explorationEditorMainTab.moveToState('second');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('This is second card.'));
    await explorationEditorMainTab.setInteraction('Continue');
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setDestination('final card', true, null);
    // Setup a terminating state.
    await explorationEditorMainTab.moveToState('final card');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('This is final card.'));
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle('Test Exploration');
    await explorationEditorSettingsTab.setCategory('Algorithms');
    await explorationEditorSettingsTab.setLanguage('English');
    await explorationEditorSettingsTab.setObjective(
      'Run tests using same exploration.');
    await explorationEditorPage.saveChanges('Done!');
    await workflow.addExplorationVoiceArtist('userVoiceArtist');
  });

  it('should walkthrough translation tutorial when user clicks next',
    async function() {
      await users.login('user@editorTab.com');
      await creatorDashboardPage.get();
      await creatorDashboardPage.editExploration('Test Exploration');
      await explorationEditorPage.navigateToTranslationTab();
      await explorationEditorTranslationTab.startTutorial();
      await explorationEditorTranslationTab.playTutorial();
      await explorationEditorTranslationTab.finishTutorial();
      await users.logout();

      await users.login('voiceArtist@translationTab.com');
      await creatorDashboardPage.get();
      await creatorDashboardPage.editExploration('Test Exploration');
      await explorationEditorMainTab.exitTutorial();
      await explorationEditorPage.navigateToTranslationTab();
      await explorationEditorTranslationTab.startTutorial();
      await explorationEditorTranslationTab.playTutorial();
      await explorationEditorTranslationTab.finishTutorial();
      await users.logout();
    });

  it('should cache the selected language for translation and voiceover',
    async function() {
      await users.login('voiceArtist@translationTab.com');
      await creatorDashboardPage.get();
      await creatorDashboardPage.editExploration('Test Exploration');
      await explorationEditorMainTab.exitTutorial();
      await explorationEditorPage.navigateToTranslationTab();
      await explorationEditorTranslationTab.expectSelectedLanguageToBe(
        'English');
      await explorationEditorTranslationTab.changeLanguage('Hindi');
      await browser.refresh();
      await explorationEditorTranslationTab.expectSelectedLanguageToBe(
        'Hindi');
    });

  it('should have voiceover as a default mode', async function() {
    await users.login('voiceArtist@translationTab.com');
    await creatorDashboardPage.get();
    await creatorDashboardPage.editExploration('Test Exploration');
    await explorationEditorMainTab.exitTutorial();
    await explorationEditorPage.navigateToTranslationTab();
    await explorationEditorTranslationTab.changeLanguage('Hindi');
    await explorationEditorTranslationTab.exitTutorial();
    await explorationEditorTranslationTab.expectToBeInVoiceoverMode();
    await users.logout();
  });

  it('should have all the state contents for voiceover in exploration language',
    async function() {
      await users.login('voiceArtist@translationTab.com');
      await creatorDashboardPage.get();
      await creatorDashboardPage.editExploration('Test Exploration');
      await explorationEditorMainTab.exitTutorial();
      await explorationEditorPage.navigateToTranslationTab();
      await explorationEditorTranslationTab.changeLanguage('English');
      await explorationEditorTranslationTab.expectContentTabContentToMatch(
        'This is first card.');
      await explorationEditorTranslationTab.expectFeedbackTabContentsToMatch(
        ['This is feedback1.', 'This is default_outcome.']);
      await explorationEditorTranslationTab.expectSolutionTabContentToMatch(
        'This is solution.');
      await explorationEditorTranslationTab.expectHintsTabContentsToMatch(
        ['This is hint1.', 'This is hint2.']);
      await users.logout();
    });

  it('should contain accessibility elements', async function() {
    await users.login('voiceArtist@translationTab.com');
    await creatorDashboardPage.get();
    await creatorDashboardPage.editExploration('Test Exploration');
    await explorationEditorMainTab.exitTutorial();
    await explorationEditorPage.navigateToTranslationTab();
    let expEditorTranslationTab = explorationEditorTranslationTab;

    await expEditorTranslationTab.expectNumericalStatusAccessibilityToMatch(
      '0 items translated out of 8 items');
    await expEditorTranslationTab.expectContentAccessibilityToMatch(
      'Content of the card');
    await expEditorTranslationTab.expectFeedbackAccessibilityToMatch(
      'Feedback responses for answer groups');
    await expEditorTranslationTab.expectHintAccessibilityToMatch(
      'Hints for the state');
    await expEditorTranslationTab.expectSolutionAccessibilityToMatch(
      'Solutions for the state');
    await expEditorTranslationTab.expectStartRecordingAccessibilityToMatch(
      'Start recording');
    await expEditorTranslationTab.expectUploadRecordingAccessibilityToMatch(
      'Upload voiceovered file');
    await expEditorTranslationTab.expectPlayRecordingAccessibilityToMatch(
      'Play recorded audio');
    await users.logout();
  });

  it(
    'should maintain its active sub-tab on saving draft and publishing changes',
    async function() {
      await users.login('user@editorTab.com');
      await creatorDashboardPage.get();
      await creatorDashboardPage.editExploration('Test Exploration');
      await explorationEditorMainTab.exitTutorial();
      await explorationEditorPage.navigateToTranslationTab();
      await explorationEditorTranslationTab.exitTutorial();
      await explorationEditorTranslationTab.changeLanguage('Hindi');
      await explorationEditorTranslationTab.switchToTranslationMode();
      await explorationEditorTranslationTab.navigateToFeedbackTab();
      await explorationEditorTranslationTab.setTranslation(
        await forms.toRichText('Sample Translation.'));
      await explorationEditorPage.saveChanges('Adds one translation.');
      explorationEditorTranslationTab.expectFeedbackTabToBeActive();
      await workflow.publishExploration();
      explorationEditorTranslationTab.expectFeedbackTabToBeActive();
      await users.logout();
    });


  it('should change translation language correctly', async function() {
    await users.login('voiceArtist@translationTab.com');
    await creatorDashboardPage.get();
    await creatorDashboardPage.editExploration('Test Exploration');
    await explorationEditorMainTab.exitTutorial();
    await explorationEditorPage.navigateToTranslationTab();
    await explorationEditorTranslationTab.changeLanguage('Hindi');
    await explorationEditorTranslationTab.expectSelectedLanguageToBe('Hindi');
    await users.logout();
  });

  it('should correctly switch to different modes', async function() {
    await users.login('voiceArtist@translationTab.com');
    await creatorDashboardPage.get();
    await creatorDashboardPage.editExploration('Test Exploration');
    await explorationEditorMainTab.exitTutorial();
    await explorationEditorPage.navigateToTranslationTab();
    await explorationEditorTranslationTab.exitTutorial();
    await explorationEditorTranslationTab.changeLanguage('Hindi');
    await explorationEditorTranslationTab.expectToBeInVoiceoverMode();

    await explorationEditorTranslationTab.switchToTranslationMode();
    await explorationEditorTranslationTab.expectToBeInTranslationMode();

    await explorationEditorTranslationTab.switchToVoiceoverMode();
    await explorationEditorTranslationTab.expectToBeInVoiceoverMode();
    await users.logout();
  });

  it('should allow adding translation and reflect the progress',
    async function() {
      const expEditorTranslationTab = explorationEditorTranslationTab;
      await users.login('user@editorTab.com');
      await creatorDashboardPage.get();
      await creatorDashboardPage.editExploration('Test Exploration');
      await explorationEditorMainTab.exitTutorial();
      await explorationEditorPage.navigateToTranslationTab();
      await expEditorTranslationTab.exitTutorial();
      await expEditorTranslationTab.changeLanguage('Hindi');
      await expEditorTranslationTab.switchToTranslationMode();

      await expEditorTranslationTab.expectCorrectStatusColor(
        'first', YELLOW_STATE_PROGRESS_COLOR);
      await expEditorTranslationTab.expectCorrectStatusColor(
        'second', RED_STATE_PROGRESS_COLOR);
      await expEditorTranslationTab.expectCorrectStatusColor(
        'final card', RED_STATE_PROGRESS_COLOR);
      await expEditorTranslationTab.expectNumericalStatusAccessibilityToMatch(
        '1 item translated out of 8 items');

      await expEditorTranslationTab.moveToState('first');
      await expEditorTranslationTab.expectContentTabContentToMatch(
        'This is first card.');
      await expEditorTranslationTab.setTranslation(
        await forms.toRichText('Yeh pehla panna hain.'));
      await expEditorTranslationTab.navigateToFeedbackTab();
      await expEditorTranslationTab.setTranslation(
        await forms.toRichText('Yeh hindi main vishleshad hain.'));
      await expEditorTranslationTab.moveToState('final card');
      await expEditorTranslationTab.expectContentTabContentToMatch(
        'This is final card.');
      await expEditorTranslationTab.setTranslation(
        await forms.toRichText('Yeh aakhri panna hain.'));

      await expEditorTranslationTab.moveToState('first');
      await expEditorTranslationTab.expectTranslationToMatch(
        await forms.toRichText('Yeh pehla panna hain.'));
      await expEditorTranslationTab.navigateToFeedbackTab();
      await expEditorTranslationTab.expectTranslationToMatch(
        await forms.toRichText('Yeh hindi main vishleshad hain.'));
      await expEditorTranslationTab.moveToState('final card');
      await expEditorTranslationTab.expectTranslationToMatch(
        await forms.toRichText('Yeh aakhri panna hain.'));

      await expEditorTranslationTab.switchToVoiceoverMode();
      await expEditorTranslationTab.switchToTranslationMode();
      await expEditorTranslationTab.moveToState('first');
      await expEditorTranslationTab.expectTranslationToMatch(
        await forms.toRichText('Yeh pehla panna hain.'));
      await expEditorTranslationTab.navigateToFeedbackTab();
      await expEditorTranslationTab.expectTranslationToMatch(
        await forms.toRichText('Yeh hindi main vishleshad hain.'));
      await expEditorTranslationTab.moveToState('final card');
      await expEditorTranslationTab.expectTranslationToMatch(
        await forms.toRichText('Yeh aakhri panna hain.'));
      await expEditorTranslationTab.expectCorrectStatusColor(
        'first', YELLOW_STATE_PROGRESS_COLOR);
      await expEditorTranslationTab.expectCorrectStatusColor(
        'second', RED_STATE_PROGRESS_COLOR);
      await expEditorTranslationTab.expectCorrectStatusColor(
        'final card', GREEN_STATE_PROGRESS_COLOR);
      await expEditorTranslationTab.expectNumericalStatusAccessibilityToMatch(
        '3 items translated out of 8 items');
      await users.logout();
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
