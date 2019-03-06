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
var path = require('path');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');

describe('Exploration translation', function() {
  var explorationEditorMainTab = null;
  var explorationEditorPage = null;
  var explorationEditorSettingsTab = null;
  var explorationEditorTranslationTab = null;

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationEditorTranslationTab = explorationEditorPage.getTranslationTab();
  });

  it('should walkthrough translation tutorial when user clicks next',
    function() {
      users.createUser('userclicknext@translationTabTutorial.com',
        'userclicknextTranslationTabTutorial');
      users.login('userclicknext@translationTabTutorial.com');
      workflow.createExploration();

      explorationEditorPage.navigateToTranslationTab();
      explorationEditorTranslationTab.startTutorial();
      explorationEditorTranslationTab.playTutorial();
      explorationEditorTranslationTab.finishTutorial();
      users.logout();
    });

  it('should have all the state contents', function() {
    users.createUser('user@translationTab.com', 'userTranslationTab');
    users.login('user@translationTab.com');
    workflow.createExploration();

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
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorMainTab.moveToState('first');
    explorationEditorPage.saveChanges();

    explorationEditorPage.navigateToTranslationTab();
    explorationEditorTranslationTab.exitTutorial();
    explorationEditorTranslationTab.expectContentTabContentToMatch(
      'This is first card.');
    explorationEditorTranslationTab.expectFeedbackTabContentsToMatch(
      ['This is feedback1.', 'This is default_outcome.']);
    explorationEditorTranslationTab.expectSolutionTabContentToMatch(
      'This is solution.');
    explorationEditorTranslationTab.expectHintsTabContentsToMatch(
      ['This is hint1.', 'This is hint2.']);
    users.logout();
  });

  it('should have a correct numerical status', function() {
    users.createUser('user2@translationTab.com', 'user2TranslationTab');
    users.login('user2@translationTab.com');
    workflow.createExploration();

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
    responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setDestination('final card', true, null);
    // Setup a terminating state.
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorMainTab.moveToState('first');
    explorationEditorPage.saveChanges();
    explorationEditorPage.navigateToTranslationTab();
    explorationEditorTranslationTab.exitTutorial();

    explorationEditorTranslationTab.expectNumericalStatusToMatch(
      '(0/8)');

    explorationEditorTranslationTab.openUploadAudioModal();
    var relativePathOfAudioToUpload = '../data/cafe.mp3';
    var audioAbsolutePath = path.resolve(__dirname, relativePathOfAudioToUpload);
    explorationEditorTranslationTab.audioElem.sendKeys(audioAbsolutePath);
    explorationEditorTranslationTab.saveUploadedAudio(true);
    explorationEditorTranslationTab.expectNumericalStatusToMatch(
      '(1/8)');
    explorationEditorTranslationTab.openUploadAudioModal();

    var relativePathOfAudioToUpload = '../data/img.png';
    var audioAbsolutePath = path.resolve(__dirname, relativePathOfAudioToUpload);
    explorationEditorTranslationTab.audioElem.sendKeys(audioAbsolutePath);
    expect(explorationEditorTranslationTab.errorMessage === undefined).
      toBe(false);
    expect(explorationEditorTranslationTab.saveUploadedAudioButton.
      getAttribute('disabled')).toBe('true');
    explorationEditorTranslationTab.expectNumericalStatusToMatch(
      '(1/8)');
    relativePathOfAudioToUpload = '../data/cafe-over-five-minutes.mp3';
    audioAbsolutePath = path.resolve(__dirname, relativePathOfAudioToUpload);
    explorationEditorTranslationTab.audioElem.sendKeys(audioAbsolutePath);
    expect(explorationEditorTranslationTab.
      audioOverFiveMinutesErrorMessageElement === undefined).toBe(false);
    explorationEditorTranslationTab.saveUploadedAudio();
    expect(explorationEditorTranslationTab.saveUploadedAudioButton.
      getAttribute('disabled')).toBe('true');
    explorationEditorTranslationTab.expectNumericalStatusToMatch(
      '(1/8)');

    users.logout();
  });

  it('should provide correct status color for each state in the graph view',
    function() {
      var ALL_AUDIO_AVAILABLE_COLOR = 'rgb(22, 167, 101)';
      var FEW_AUDIO_AVAILABLE_COLOR = 'rgb(233, 179, 48)';
      var NO_AUDIO_AVAILABLE_COLOR = 'rgb(209, 72, 54)';

      users.createUser('user@correctstatus.com', 'correctStatus');
      users.login('user@correctstatus.com');
      workflow.createExploration();

      explorationEditorMainTab.setStateName('First');
      explorationEditorMainTab.setContent(forms.toRichText(
        'This is first card.'));
      explorationEditorMainTab.setInteraction('NumericInput');
      explorationEditorMainTab.addResponse(
        'NumericInput', forms.toRichText('This is feedback.'),
        'Second', true, 'Equals', 6);
      explorationEditorMainTab.moveToState('Second');
      explorationEditorMainTab.setInteraction('Continue');
      var responseEditor = explorationEditorMainTab.
        getResponseEditor('default');
      responseEditor.setDestination('Third', true, null);
      explorationEditorMainTab.moveToState('Third');
      explorationEditorMainTab.setInteraction('EndExploration');
      explorationEditorMainTab.moveToState('First');
      explorationEditorPage.navigateToTranslationTab();
      explorationEditorTranslationTab.exitTutorial();
      explorationEditorTranslationTab.openUploadAudioModal();
      var relativePathOfAudioToUpload = '../data/cafe.mp3';
      var audioAbsolutePath = path.resolve(__dirname, relativePathOfAudioToUpload);
      explorationEditorTranslationTab.audioElem.sendKeys(audioAbsolutePath);
      explorationEditorTranslationTab.saveUploadedAudio(true);
      explorationEditorPage.navigateToMainTab();
      explorationEditorMainTab.moveToState('Third');
      explorationEditorPage.navigateToTranslationTab();
      explorationEditorTranslationTab.openUploadAudioModal();
      explorationEditorTranslationTab.audioElem.sendKeys(audioAbsolutePath);
      explorationEditorTranslationTab.saveUploadedAudio(true);
      expect(explorationEditorTranslationTab.colorOfInitNode()).
        toBe(FEW_AUDIO_AVAILABLE_COLOR);
      expect(explorationEditorTranslationTab.colorOfNormalNode()).
        toBe(NO_AUDIO_AVAILABLE_COLOR);
      expect(explorationEditorTranslationTab.colorOfTerminalNode()).
        toBe(ALL_AUDIO_AVAILABLE_COLOR);
    });

  it(
    'should maintain its active sub-tab on saving draft and publishing changes',
    function() {
      users.createUser('user@translationSubTab.com', 'userTranslationSubTab');
      users.login('user@translationSubTab.com');
      workflow.createExploration();

      explorationEditorPage.navigateToSettingsTab();
      explorationEditorSettingsTab.setTitle('Check');
      explorationEditorSettingsTab.setCategory('Algorithms');
      explorationEditorSettingsTab.setObjective('To check the translation tab');
      explorationEditorPage.navigateToMainTab();
      explorationEditorMainTab.setStateName('one');
      explorationEditorMainTab.setContent(forms.toRichText(
        'This is first card.'));
      explorationEditorMainTab.setInteraction('NumericInput');
      explorationEditorMainTab.addResponse(
        'NumericInput', forms.toRichText('This is feedback1.'),
        'two', true, 'Equals', 6);
      var responseEditor = explorationEditorMainTab.getResponseEditor(
        'default');
      responseEditor.setFeedback(forms.toRichText(
        'This is default_outcome.'));
      explorationEditorMainTab.addHint('This is hint1.');
      explorationEditorMainTab.addHint('This is hint2.');
      explorationEditorMainTab.addSolution('NumericInput', {
        correctAnswer: 6,
        explanation: 'This is solution.'
      });
      explorationEditorMainTab.moveToState('two');
      explorationEditorMainTab.setContent(forms.toRichText(
        'This is second card.'));
      explorationEditorMainTab.setInteraction('NumericInput');
      explorationEditorMainTab.addResponse(
        'NumericInput', forms.toRichText('This is feedback1.'),
        'final card', true, 'Equals', 7);
      responseEditor = explorationEditorMainTab.getResponseEditor(
        'default');
      responseEditor.setFeedback(forms.toRichText('This is default_outcome.'));
      explorationEditorMainTab.addHint('This is hint1.');
      explorationEditorMainTab.addHint('This is hint2.');
      explorationEditorMainTab.addSolution('NumericInput', {
        correctAnswer: 7,
        explanation: 'This is solution.'
      });
      explorationEditorMainTab.moveToState('final card');
      explorationEditorMainTab.setInteraction('EndExploration');
      explorationEditorMainTab.moveToState('two');
      explorationEditorPage.navigateToTranslationTab();
      explorationEditorTranslationTab.exitTutorial();
      explorationEditorTranslationTab.navigateToFeedbackTab();
      explorationEditorPage.saveChanges();
      explorationEditorTranslationTab.expectFeedbackTabToBeActive();
      workflow.publishExploration();
      explorationEditorTranslationTab.expectFeedbackTabToBeActive();
    });


  it('should change translation language correctly', function() {
    users.createUser('user@translationTabLang.com', 'userTranslationTabLang');
    users.login('user@translationTabLang.com');
    workflow.createExploration();

    explorationEditorMainTab.setStateName('first');
    explorationEditorMainTab.setContent(forms.toRichText(
      'this is card 1'));
    explorationEditorPage.navigateToTranslationTab();
    explorationEditorTranslationTab.changeTranslationLanguage('Hindi');
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
