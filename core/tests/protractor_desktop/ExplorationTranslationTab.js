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

var ExplorationEditorPage = require(
	'../protractor_utils/ExplorationEditorPage.js');
var CreatorDashboardPage = require(
	'../protractor_utils/CreatorDashboardPage');

describe('Exploration translation', function() {
  var creatorDashboardPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorPage = null;
  var explorationEditorSettingsTab = null;
  var explorationEditorTranslationTab = null;
});


  beforeAll(function() {
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationEditorTranslationTab = explorationEditorPage.getTranslationTab();

    // Create a common exploration for testing.
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
    explorationEditorMainTab.setContent(forms.toRichText(
      'This is second card.'));
    explorationEditorMainTab.setInteraction('NumericInput');
    explorationEditorMainTab.addResponse(
      'NumericInput', forms.toRichText('This is feedback1.'),
      'third', true, 'Equals', 6);
    explorationEditorMainTab.moveToState('third');
    explorationEditorMainTab.setContent(
      forms.toRichText('This is third card.'));
    explorationEditorMainTab.setInteraction('Continue');
    responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setDestination('final card', true, null);
    // Setup a terminating state.
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle('tests');
    explorationEditorSettingsTab.setCategory('Algorithms');
    explorationEditorSettingsTab.setObjective('Test');
    explorationEditorPage.saveChanges('Done!');
    users.logout();
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
      general.checkForConsoleErrors([]);
    });

  it('should have all the state contents', function() {
    users.login('user2@translationTab.com');
    creatorDashboardPage.get();
    // Test using common exploration.
    creatorDashboardPage.editExploration('tests');

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
    general.checkForConsoleErrors([]);
  });

  it('should have a correct numerical status', function() {
    users.login('user2@translationTab.com');
    creatorDashboardPage.get();
    // Test using common exploration.
    creatorDashboardPage.editExploration('tests');
    
    explorationEditorPage.navigateToTranslationTab();
    explorationEditorTranslationTab.exitTutorial();
    // To check the absence of any audio translation in exploration initially.
    explorationEditorTranslationTab.expectNumericalStatusToMatch('(0/11)');
    explorationEditorTranslationTab.openUploadAudioModal();
    var relativePathOfAudioToUpload = '../data/cafe.mp3';
    explorationEditorTranslationTab.uploadAudio(relativePathOfAudioToUpload);
    explorationEditorTranslationTab.saveUploadedAudio(true);
    /**
     * To check correct display of numerical status after the upload of audio
     * translation in exploration.
     */
    explorationEditorTranslationTab.expectNumericalStatusToMatch('(1/11)');
    explorationEditorTranslationTab.openUploadAudioModal();
    relativePathOfAudioToUpload = '../data/img.png';
    explorationEditorTranslationTab.uploadAudio(relativePathOfAudioToUpload);
    /**
     * To check behaviour on attempting to
     * upload an image as audio translation.
     */
    expect(explorationEditorTranslationTab.getWrongFileTypeErrorMessage())
    .toContain('This file is not recognized as an audio file.');
    expect(explorationEditorTranslationTab.saveUploadedAudioButton
      .getAttribute('disabled')).toBe('true');
    explorationEditorTranslationTab.expectNumericalStatusToMatch('(1/11)');
    relativePathOfAudioToUpload = '../data/cafe-over-five-minutes.mp3';
    explorationEditorTranslationTab.uploadAudio(relativePathOfAudioToUpload);
    explorationEditorTranslationTab.saveUploadedAudio();
    /**
     * To check behaviour on attempting to upload an audio translation with
     * length above 300 seconds.
     */
    expect(explorationEditorTranslationTab.getAudioOverFiveMinutesErrorMessage())
    .toContain('The uploaded file is 301.87 seconds long.');
    expect(explorationEditorTranslationTab.saveUploadedAudioButton
      .getAttribute('disabled')).toBe('true');
    explorationEditorTranslationTab.expectNumericalStatusToMatch('(1/11)');
    users.logout();

    general.checkForConsoleErrors(
      ['Failed to load resource: the server responded with a status of 400' +
       '(Bad Request)', {'status_code':400,
       'error':'Audio files must be under 300 seconds in length.' +
       ' The uploaded file is 301.87 seconds long.'}]);
  });

  it('should provide correct status color for each state in the graph view',
    function() {
      var ALL_AUDIO_AVAILABLE_COLOR = 'rgb(22, 167, 101)';
      var FEW_AUDIO_AVAILABLE_COLOR = 'rgb(233, 179, 48)';
      var NO_AUDIO_AVAILABLE_COLOR = 'rgb(209, 72, 54)';
      var relativePathOfAudioToUpload = '../data/cafe.mp3';

      users.login('user2@translationTab.com');
      creatorDashboardPage.get();
      // Test using common exploration.
      creatorDashboardPage.editExploration('tests');
      explorationEditorMainTab.moveToState('second');
      explorationEditorPage.navigateToTranslationTab();
      explorationEditorTranslationTab.exitTutorial();
      explorationEditorTranslationTab.openUploadAudioModal();
      explorationEditorTranslationTab.uploadAudio(relativePathOfAudioToUpload);
      explorationEditorTranslationTab.saveUploadedAudio(true);
      explorationEditorPage.navigateToMainTab();
      explorationEditorMainTab.moveToState('final card');
      explorationEditorPage.navigateToTranslationTab();
      explorationEditorTranslationTab.openUploadAudioModal();
      explorationEditorTranslationTab.uploadAudio(relativePathOfAudioToUpload);
      explorationEditorTranslationTab.saveUploadedAudio(true);
      var colorsOfNormalNodes = explorationEditorTranslationTab.getColorsOfNormalNode();
      /**
       * To check correct status color for 'second', 'third' 
       * and 'final card' states.
       */
      colorsOfNormalNodes.then(
        function(colorsOfStates) {
          colorsOfStates.sort();
          expect(colorsOfStates[0]).toBe(NO_AUDIO_AVAILABLE_COLOR);
          expect(colorsOfStates[1]).toBe(FEW_AUDIO_AVAILABLE_COLOR);
        });
      expect(explorationEditorTranslationTab.getColorOfTerminalNode()).
        toBe(ALL_AUDIO_AVAILABLE_COLOR);
      
      general.checkForConsoleErrors([]);
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
      general.checkForConsoleErrors([]);
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
    general.checkForConsoleErrors([]);
  });
