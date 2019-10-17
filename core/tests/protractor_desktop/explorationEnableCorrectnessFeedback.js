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
 * @fileoverview End-to-end tests for the procedure of turning on correctness
 * feedback and mark correctness of solutions.
 */

var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('Enable correctness feedback and set correctness', function() {
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  var currentExplorationIndex = 0;
  var EXPLORATION_TITLE = 'Dummy Exploration';
  var explorationTitle = null;
  var libraryPage = null;
  var correctOptions = [
    ['MultipleChoiceInput', 'Correct!'],
    ['TextInput', 'One'],
    ['NumericInput', 3]
  ];


  var applyCommonSettings = function() {
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle(explorationTitle);
    explorationEditorSettingsTab.setCategory('Algorithm');
    explorationEditorSettingsTab.setObjective('Learn more about Oppia');
    explorationEditorSettingsTab.setLanguage('English');
    explorationEditorSettingsTab.enableCorrectnessFeedback();
  };

  beforeAll(function() {
    users.createUser('user@markCorrect.com', 'userMarkCorrect');
    users.login('user@markCorrect.com');
  });

  beforeEach(function() {
    explorationTitle = EXPLORATION_TITLE + String(currentExplorationIndex);
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    workflow.createExploration();
  });

  it('should allow selecting correct feedback from the response editor ' +
     'after the interaction is created', function() {
    explorationEditorMainTab.setStateName('First');
    explorationEditorMainTab.setContent(forms.toRichText(
      'Select the right option.'));

    // Create interaction first.
    explorationEditorMainTab.setInteraction('MultipleChoiceInput', [
      forms.toRichText('Correct!'),
      forms.toRichText('Wrong!')
    ]);
    explorationEditorMainTab.addResponse(
      'MultipleChoiceInput', forms.toRichText('Good!'),
      'End', true, 'Equals', 'Correct!');
    responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setFeedback(forms.toRichText('Wrong!'));
    explorationEditorMainTab.moveToState('End');
    explorationEditorMainTab.setInteraction('EndExploration');
    // Turn on correctness feedback.
    applyCommonSettings();

    // Go back to mark the solution as correct.
    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.moveToState('First');
    responseEditor = explorationEditorMainTab.getResponseEditor(0);
    responseEditor.markAsCorrect();
    explorationEditorMainTab.expectTickMarkIsDisplayed();
    explorationEditorPage.saveChanges();
  });

  it('should allow selecting correct feedback from the response editor ' +
     'during set the interaction', function() {
    // Turn on correctness feedback first.
    applyCommonSettings();

    // Go to main tab to create interactions.
    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.setStateName('First');
    explorationEditorMainTab.setContent(forms.toRichText(
      'Select the right option.'));

    // Create interaction without close the add response modal. Set
    // correctness in the modal.
    explorationEditorMainTab.setInteractionWithoutCloseAddResponse('TextInput');
    responseEditor = explorationEditorMainTab.getResponseEditor('pop');
    responseEditor.markAsCorrect();

    // Set the response for this interaction and close it.
    explorationEditorMainTab.setResponse(
      'TextInput', forms.toRichText('Correct!'),
      'End', true, 'Equals', 'One');

    explorationEditorMainTab.expectTickMarkIsDisplayed();
    responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setFeedback(forms.toRichText('Wrong!'));
    explorationEditorMainTab.moveToState('End');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();
  });

  it('should allow selecting correct feedback from the default response editor',
    function() {
      // Turn on correctness feedback first.
      applyCommonSettings();

      // Go back to main tab to create interactions.
      explorationEditorPage.navigateToMainTab();
      explorationEditorMainTab.setStateName('First');
      explorationEditorMainTab.setContent(forms.toRichText(
        'Select the right option.'));
      explorationEditorMainTab.setInteraction('NumericInput');

      // Set correctness in response editor.
      responseEditor = explorationEditorMainTab.getResponseEditor('default');
      responseEditor.markAsCorrect();
      responseEditor.setFeedback(forms.toRichText('Correct!'));
      responseEditor.setDestination('End', true, true);
      explorationEditorMainTab.expectTickMarkIsDisplayed();

      explorationEditorMainTab.moveToState('End');
      explorationEditorMainTab.setInteraction('EndExploration');
      explorationEditorPage.saveChanges();
    });

  afterEach(function() {
    workflow.publishExploration();
    libraryPage.get();
    libraryPage.findExploration(explorationTitle);
    libraryPage.playExploration(explorationTitle);
    explorationPlayerPage.submitAnswer.apply(
      null, correctOptions[currentExplorationIndex]);
    explorationPlayerPage.expectCorrectFeedback();
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.expectExplorationToBeOver();
    libraryPage.get();
    currentExplorationIndex += 1;
  });
});
