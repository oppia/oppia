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
 * @fileoverview End-to-end tests for the procedure of enabling correctness of
 * solutions.
 */

var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var waitsFor = require('../protractor_utils/waitFor.js');

var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('Exploration history', function() {
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var libraryPage = null;
  var explorationPlayerPage = null;
  var creatorDashboardPage = null;
  const EXPLORATION_TITLE = 'Dummy Exploration';
  const CORRECT_OPTION = 'This is correct!';

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
  });

  it('should mark one option as correctness by creating interaction first' +
     'and turn on "Enable Correctness" later', function() {
    users.createUser('user@markCorrect.com', 'userMarkCorrect');
    users.login('user@markCorrect.com');
    workflow.createExploration();

    // Check renaming state, editing text, editing interactions and adding
    // state.
    explorationEditorMainTab.setStateName('first');
    explorationEditorMainTab.setContent(forms.toRichText(
      'Select the right option.'));
    explorationEditorMainTab.setInteraction('MultipleChoiceInput', [
      forms.toRichText(CORRECT_OPTION),
      forms.toRichText('This is wrong!'),
      forms.toRichText('Is this wrong?'),
      forms.toRichText('That was wrong!')
    ]);
    explorationEditorMainTab.addResponse(
      'MultipleChoiceInput', null, 'end', true, 'Equals', CORRECT_OPTION);
    var responseEditor = explorationEditorMainTab.getResponseEditor(0);
    responseEditor.setFeedback(forms.toRichText('You are so good!'));
    responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setFeedback(forms.toRichText('That is not correct!'));
    explorationEditorMainTab.moveToState('end');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle(EXPLORATION_TITLE);
    explorationEditorSettingsTab.setCategory('Algorithm');
    explorationEditorSettingsTab.setObjective('Learn more about Oppia');
    explorationEditorSettingsTab.setLanguage('English');
    explorationEditorSettingsTab.enableCorrectnessFeedback();
    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.moveToState('first');
    responseEditor = explorationEditorMainTab.getResponseEditor(0);
    responseEditor.setCorrect();
    explorationEditorPage.saveChanges();
    workflow.publishExploration();
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);
    explorationPlayerPage.submitAnswer(
      'MultipleChoiceInput', 'This is correct!');
    waitsFor.visibilityOf(
      element(by.css(
        '.inner-container-alignment')), 'Waiting for correctness.');
  });

  // it('should mark one option as correctness by enabling mark correctness
  //  first' +
  //    'and add interaction later', function() {
  //   users.createUser('user@markCorrect.com', 'userMarkCorrect');
  //   users.login('user@markCorrect.com');
  //   workflow.createExploration();
  // });

  afterEach(function() {
    creatorDashboardPage.get();
    creatorDashboardPage.editExploration(EXPLORATION_TITLE);
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.deleteExploration();
  });
});
