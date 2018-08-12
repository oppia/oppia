// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for translation tab.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');



describe('Exploration translation', function() {
  var explorationEditorPage = null;
  var explorationPlayerPage = null;
  var explorationEditorHistoryTab = null;
  var explorationEditorMainTab = null;
  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorTranslationTab = explorationEditorPage.getTranslationTab();
  });

  fit('should have all the state contents', function() {
    users.createUser('user@translationTab.com', 'userTranslationTab');
    users.login('user@translationTab.com');
    workflow.createExploration();

    explorationEditorMainTab.setStateName('first');
    explorationEditorMainTab.setContent(forms.toRichText(
      'this is card 1'));
      /*
    explorationEditorMainTab.setInteraction('NumericInput');
    explorationEditorMainTab.addResponse(
      'NumericInput', null, 'second', true, 'Equals', 6);
    var responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setFeedback(forms.toRichText('This is default_outcome'));
    explorationEditorMainTab.addHint('This is hint1');
    explorationEditorMainTab.addHint('This is hint2');
    explorationEditorMainTab.addSolution('NumericInput', {
      correctAnswer: 6,
      explanation: 'This is solution.'
    });
    explorationEditorMainTab.moveToState('second');
    explorationEditorMainTab.setContent(forms.toRichText('this is card 2'));
    explorationEditorMainTab.setInteraction('Continue');
    var responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setDestination('final card', true, null);
    // Setup a terminating state.
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorMainTab.moveToState('first');
    explorationEditorPage.saveChanges();
    */

    explorationEditorPage.navigateToTranslationTab();
    explorationEditorTranslationTab.expectContentTabContentToMatch(
      forms.toRichText('this is card 1'));
  });

  it('should change translation language correctly', function() {
    users.createUser('user@translationTab.com', 'userTranslationTab');
    users.login('user@translationTab.com');
    workflow.createExploration();

    explorationEditorMainTab.setStateName('first');
    explorationEditorMainTab.setContent(forms.toRichText(
      'this is card 1'));
    explorationEditorPage.navigateToTranslationTab();
    explorationEditorTranslationTab.changeTranslationLanguage('Hindi');
  });
});
