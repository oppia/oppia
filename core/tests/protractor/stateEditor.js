// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests of the state editor.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');

describe('State editor', function() {
  var explorationPlayerPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should walk through the tutorial when user repeatedly clicks Next',
    function() {
      var NUM_TUTORIAL_STAGES = 6;
      users.createUser(
        'userTutorial@stateEditor.com', 'userTutorialStateEditor');
      users.login('userTutorial@stateEditor.com');

      workflow.createExplorationAndStartTutorial();
      explorationEditorMainTab.startTutorial();
      for (var i = 0; i < NUM_TUTORIAL_STAGES; i++) {
        explorationEditorMainTab.progressInTutorial();
        general.waitForSystem();
      }
      explorationEditorMainTab.finishTutorial();
      users.logout();
    }
  );

  it('should display plain text content', function() {
    users.createUser('user1@stateEditor.com', 'user1StateEditor');
    users.login('user1@stateEditor.com');

    workflow.createExploration();
    explorationEditorMainTab.setContent(forms.toRichText('plain text'));
    explorationEditorMainTab.setInteraction('Continue', 'click here');
    explorationEditorMainTab.getResponseEditor('default')
      .setDestination('final card', true, null);

    // Setup a terminating state.
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();

    general.moveToPlayer();
    explorationPlayerPage.expectContentToMatch(forms.toRichText('plain text'));
    explorationPlayerPage.expectExplorationToNotBeOver();
    explorationPlayerPage.expectInteractionToMatch('Continue', 'click here');
    explorationPlayerPage.submitAnswer('Continue', null);
    explorationPlayerPage.expectExplorationToBeOver();

    users.logout();
  });

  it('should create content and multiple choice interactions', function() {
    users.createUser('user2@stateEditor.com', 'user2StateEditor');
    users.login('user2@stateEditor.com');
    workflow.createExploration();
    explorationEditorMainTab.setContent(function(richTextEditor) {
      richTextEditor.appendBoldText('bold text');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendItalicText('italic text');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendOrderedList(['entry 1', 'entry 2']);
      richTextEditor.appendUnorderedList(['an entry', 'another entry']);
    });
    explorationEditorMainTab.setInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('option A'), forms.toRichText('option B')]);
    explorationEditorMainTab.getResponseEditor('default').setDestination(
      'final card', true, null);

    // Setup a terminating state
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();

    general.moveToPlayer();
    explorationPlayerPage.expectExplorationToNotBeOver();
    explorationPlayerPage.expectInteractionToMatch(
      'MultipleChoiceInput',
      [forms.toRichText('option A'), forms.toRichText('option B')]);
    explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'option B');
    explorationPlayerPage.expectExplorationToBeOver();
    users.logout();
  });

  it('should obey numeric interaction rules and display feedback', function() {
    users.createUser('user3@stateEditor.com', 'user3StateEditor');
    users.login('user3@stateEditor.com');

    workflow.createExploration();
    explorationEditorMainTab.setContent(forms.toRichText('some content'));
    explorationEditorMainTab.setInteraction('NumericInput');
    explorationEditorMainTab.addResponse('NumericInput',
      function(richTextEditor) {
        richTextEditor.appendBoldText('correct');
      }, 'final card', true, 'IsInclusivelyBetween', -1, 3);
    explorationEditorMainTab.getResponseEditor(0).expectRuleToBe(
      'NumericInput', 'IsInclusivelyBetween', [-1, 3]);
    explorationEditorMainTab.getResponseEditor(0)
      .expectFeedbackInstructionToBe('correct');
    explorationEditorMainTab.getResponseEditor('default').setFeedback(
      forms.toRichText('out of bounds'));
    explorationEditorMainTab.getResponseEditor('default')
      .expectFeedbackInstructionToBe('out of bounds');
    explorationEditorMainTab.getResponseEditor('default').setDestination(
      null, false, null);

    // Setup a terminating state.

    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();

    general.moveToPlayer();
    explorationPlayerPage.submitAnswer('NumericInput', 5);
    explorationPlayerPage.expectLatestFeedbackToMatch(
      forms.toRichText('out of bounds')
    );
    explorationPlayerPage.expectExplorationToNotBeOver();
    // It's important to test the value 0 in order to ensure that it would
    // still get submitted even though it is a falsy value in JavaScript.
    explorationPlayerPage.submitAnswer('NumericInput', 0);
    explorationPlayerPage.expectLatestFeedbackToMatch(
      function(richTextChecker) {
        richTextChecker.readBoldText('correct');
      });
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.expectExplorationToBeOver();

    users.logout();
  });

  it('should skip the customization modal for interactions having no ' +
      'customization options', function() {
    users.createUser('user4@stateEditor.com', 'user4StateEditor');
    users.login('user4@stateEditor.com');

    workflow.createExploration();
    explorationEditorMainTab.setContent(forms.toRichText('some content'));

    // Numeric input does not have any customization arguments. Therefore the
    // customization modal and the save interaction button does not appear.
    explorationEditorMainTab.setInteraction('NumericInput');
    explorationEditorMainTab.deleteInteraction();
    // The Continue input has customization options. Therefore the
    // customization modal does appear and so does the save interaction button.
    explorationEditorMainTab.setInteraction('Continue');

    users.logout();
  });

  it('should open appropriate modal on re-clicking an interaction to ' +
     'customize it', function() {
    users.createUser('user5@stateEditor.com', 'user5StateEditor');
    users.login('user5@stateEditor.com');

    workflow.createExploration();
    explorationEditorMainTab.setContent(forms.toRichText('some content'));

    // Numeric input does not have any customization arguments. Therefore, on
    // re-clicking, a modal opens up informing the user that this interaction
    // does not have any customization options. To dismiss this modal, user
    // clicks 'Okay' implying that he/she has got the message.
    explorationEditorMainTab.setInteraction('NumericInput');
    element(by.css('.protractor-test-interaction')).click();
    var okayBtn = element(
      by.css('.protractor-test-close-no-customization-modal'));
    expect(okayBtn.isPresent()).toBe(true);
    okayBtn.click();

    // Continue input has customization options. Therefore, on re-clicking, a
    // modal opens up containing the customization arguments for this input.
    // The user can dismiss this modal by clicking the 'Save Interaction'
    // button.
    explorationEditorMainTab.deleteInteraction();
    explorationEditorMainTab.setInteraction('Continue');
    element(by.css('.protractor-test-interaction')).click();
    var saveInteractionBtn = element(
      by.css('.protractor-test-save-interaction'));
    expect(saveInteractionBtn.isPresent()).toBe(true);
    saveInteractionBtn.click();

    users.logout();
  });

  it('should correctly display contents, rule parameters, feedback' +
  'instructions and newly created state', function() {
    users.createUser('stateEditorUser1@example.com', 'stateEditorUser1');
    users.login('stateEditorUser1@example.com');
    workflow.createExploration();
    // Verify exploration's text content.
    explorationEditorMainTab.setContent(forms.toRichText('Happiness Checker'));
    explorationEditorMainTab.expectContentToMatch(
      forms.toRichText('Happiness Checker'));
    // Verify interaction's details.
    explorationEditorMainTab.setInteraction('TextInput', 'How are you?', 5);
    explorationEditorMainTab.expectInteractionToMatch(
      'TextInput', 'How are you?', 5);
    // Verify rule parameter input by checking editor's response tab.
    // Create new state 'I am happy' for 'happy' rule
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('You must be happy!'),
      'I am happy', true, 'FuzzyEquals', 'happy');
    explorationEditorMainTab.getResponseEditor(0).expectRuleToBe(
      'TextInput', 'FuzzyEquals', ['"happy"']);
    explorationEditorMainTab.getResponseEditor(0)
      .expectFeedbackInstructionToBe('You must be happy!');
    // Verify newly created state
    explorationEditorMainTab.moveToState('I am happy');
    explorationEditorMainTab.expectCurrentStateToBe('I am happy');
    // Go back, create default response (try again) and verify response
    explorationEditorMainTab.moveToState('Introduction');
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('You cannot be sad!'),
      '(try again)', false, 'FuzzyEquals', 'sad');
    explorationEditorMainTab.getResponseEditor(1).expectRuleToBe(
      'TextInput', 'FuzzyEquals', ['"sad"']);
    explorationEditorPage.saveChanges();
    users.logout();
  });

  it('should navigate multiple states correctly, with parameters', function() {
    var explorationPlayerPage = (
      new ExplorationPlayerPage.ExplorationPlayerPage());
    users.createUser('user4@parameters.com', 'user4parameters');
    users.login('user4@parameters.com');

    workflow.createExploration();
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.enableParameters();
    explorationEditorSettingsTab.addExplorationLevelParameterChange('z', 2);

    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.setStateName('card 1');
    explorationEditorMainTab.addParameterChange('a', 2);
    explorationEditorMainTab.setContent(forms.toRichText(
      'Change value of a from {{a}} to'));
    explorationEditorMainTab.setInteraction('NumericInput');
    explorationEditorMainTab.addResponse(
      'NumericInput', null, 'card 2', true, 'IsGreaterThan', 0);

    explorationEditorMainTab.moveToState('card 2');
    explorationEditorMainTab.addParameterChange('a', '{{answer}}');
    explorationEditorMainTab.addMultipleChoiceParameterChange('b', [3]);
    explorationEditorMainTab.setContent(forms.toRichText(
      'Change value of b from {{b}} to'));
    explorationEditorMainTab.setInteraction('NumericInput');
    explorationEditorMainTab.addResponse(
      'NumericInput', null, 'card 3', true, 'IsGreaterThan', 0);

    explorationEditorMainTab.moveToState('card 3');
    explorationEditorMainTab.addParameterChange('b', '{{answer}}');
    explorationEditorMainTab.setContent(forms.toRichText(
      'sum of {{z}} and {{b}} is {{z + b}},' +
      ' sum of {{a}} and {{b}} is {{a + b}}'));
    explorationEditorMainTab.setInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('return'), forms.toRichText('complete')]);
    explorationEditorMainTab.addResponse(
      'MultipleChoiceInput', null, 'card 2', false, 'Equals', 'return');
    explorationEditorMainTab.getResponseEditor('default').setDestination(
      'final card', true, null);
    // Setup a terminating state
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();

    general.moveToPlayer();
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'Change value of a from 2 to'));
    explorationPlayerPage.submitAnswer('NumericInput', 5);
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'Change value of b from 3 to'));
    explorationPlayerPage.submitAnswer('NumericInput', 2);
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'sum of 2 and 2 is 4, sum of 5 and 2 is 7'));
    explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'return');
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'Change value of b from 3 to'));
    explorationPlayerPage.submitAnswer('NumericInput', 5);
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'sum of 2 and 5 is 7, sum of 5 and 5 is 10'));
    explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'return');
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'Change value of b from 3 to'));
    explorationPlayerPage.submitAnswer('NumericInput', 4);
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'sum of 2 and 4 is 6, sum of 5 and 4 is 9'));
    explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'complete');
    explorationPlayerPage.expectExplorationToBeOver();
    users.logout();
  });

  it('should add/modify/delete a hint', function() {
    users.createUser('stateEditorUser2@example.com', 'stateEditorUser2');
    users.login('stateEditorUser2@example.com');
    workflow.createExploration();
    // Verify interaction and response is created correctly
    explorationEditorMainTab.setStateName('1st Question');
    explorationEditorMainTab.setContent(
      forms.toRichText('Exploration w/ Hint'));
    explorationEditorMainTab.expectContentToMatch(
      forms.toRichText('Exploration w/ Hint'));
    explorationEditorMainTab.setInteraction('NumericInput');
    explorationEditorMainTab.expectInteractionToMatch('NumericInput');
    explorationEditorMainTab.addResponse(
      'NumericInput', forms.toRichText('What is the product of 8 and 8?'),
      '2nd Question', true, 'Equals', 64);
    // Verify rule parameter input by checking editor's response tab.
    explorationEditorMainTab.getResponseEditor(0).expectRuleToBe(
      'NumericInput', 'Equals', ['64']);
    explorationEditorMainTab.addHint('hint one');
    explorationEditorMainTab.getHintEditor(0).setHint('modified hint one');
    explorationEditorMainTab.getHintEditor(0).deleteHint();
    explorationEditorPage.saveChanges();
    users.logout();
  });

  it('should add a solution', function() {
    users.createUser('stateEditorUser3@example.com', 'stateEditorUser3');
    users.login('stateEditorUser3@example.com');
    workflow.createExploration();
    explorationEditorMainTab.setContent(forms.toRichText('some content'));
    explorationEditorMainTab.setInteraction('TextInput', 'My PlaceHolder', 2);
    explorationEditorMainTab.addResponse('TextInput', function(richTextEditor) {
      richTextEditor.appendBoldText('correct');
    }, 'final card', true, 'Equals', 'Some Text');

    explorationEditorMainTab.addHint('hint one');
    explorationEditorMainTab.addSolution('TextInput', {
      answerIsExclusive: true,
      correctAnswer: 'Some Text',
      explanation: 'sample explanation'
    });

    explorationEditorPage.saveChanges();
    users.logout();
  });

  it('uses hints and solutions in an exploration', function() {
    var explorationPlayerPage = (
      new ExplorationPlayerPage.ExplorationPlayerPage());
    users.createUser('user1@hintsAndSolutions.com', 'hintsAndSolutions');

    // Creator creates and publishes an exploration
    users.login('user1@hintsAndSolutions.com');
    workflow.createExploration();

    explorationEditorMainTab.setStateName('Introduction');
    explorationEditorMainTab.setContent(
      forms.toRichText('What language is Oppia?'));
    explorationEditorMainTab.setInteraction('TextInput');
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('Good job'), 'End', true, 'Equals',
      'Finnish');
    explorationEditorMainTab.getResponseEditor('default').setFeedback(
      forms.toRichText('Try again'));
    explorationEditorMainTab.addHint('Try language of Finland');
    explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'Finnish',
      explanation: 'Finland language'
    });
    explorationEditorMainTab.moveToState('End');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();
    general.moveToPlayer();
    explorationPlayerPage.expectContentToMatch(
      forms.toRichText('What language is Oppia?'));
    explorationPlayerPage.submitAnswer('TextInput', 'Roman');
    explorationPlayerPage.viewHint();
    explorationPlayerPage.submitAnswer('TextInput', 'Greek');

    explorationPlayerPage.viewSolution();
    explorationPlayerPage.expectExplorationToNotBeOver();
    explorationPlayerPage.submitAnswer('TextInput', 'Finnish');
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.expectExplorationToBeOver();
    users.logout();
  });

  it('checks statistics tab for an exploration', function() {
    var EXPLORATION_TITLE = 'Exploration for stats testing';
    var EXPLORATION_OBJECTIVE = 'To explore something';
    var EXPLORATION_CATEGORY = 'Algorithms';
    var EXPLORATION_LANGUAGE = 'English';
    users.createUser(
      'user1@statisticsTab.com', 'statisticsTabCreator');
    users.createUser(
      'user2@statisticsTab.com', 'statisticsTabLearner1');
    users.createUser(
      'user3@statisticsTab.com', 'statisticsTabLearner2');
    var libraryPage = new LibraryPage.LibraryPage();
    var creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    var explorationPlayerPage =
      new ExplorationPlayerPage.ExplorationPlayerPage();
    var explorationStatsTab = explorationEditorPage.getStatsTab();

    // Creator creates and publishes an exploration
    users.login('user1@statisticsTab.com');
    workflow.createExploration();

    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle(EXPLORATION_TITLE);
    explorationEditorSettingsTab.setCategory(EXPLORATION_CATEGORY);
    explorationEditorSettingsTab.setObjective(EXPLORATION_OBJECTIVE);
    explorationEditorSettingsTab.setLanguage(EXPLORATION_LANGUAGE);

    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.setStateName('One');
    explorationEditorMainTab.setContent(
      forms.toRichText('Please write 1 in words.'));
    explorationEditorMainTab.setInteraction('TextInput');
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('Good job'), 'Two', true, 'Equals',
      'One');
    explorationEditorMainTab.getResponseEditor('default').setFeedback(
      forms.toRichText('Try again'));

    explorationEditorMainTab.moveToState('Two');
    explorationEditorMainTab.setContent(
      forms.toRichText('Please write 2 in words.'));
    explorationEditorMainTab.setInteraction('TextInput');
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('Good job'), 'Three', true, 'Equals',
      'Two');
    explorationEditorMainTab.getResponseEditor('default').setFeedback(
      forms.toRichText('Try again'));
    explorationEditorMainTab.addHint('The number 2 in words.');
    explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'Two',
      explanation: 'The English equivalent of 2'
    });
    explorationEditorMainTab.moveToState('Three');
    explorationEditorMainTab.setContent(
      forms.toRichText('Please write 3 in words.'));
    explorationEditorMainTab.setInteraction('TextInput');
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('Good job'), 'End', true, 'Equals',
      'Three');
    explorationEditorMainTab.getResponseEditor('default').setFeedback(
      forms.toRichText('Try again'));

    explorationEditorMainTab.moveToState('End');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();
    workflow.publishExploration();

    users.logout();

    // Learner 1 completes the exploration.
    users.login('user2@statisticsTab.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);

    explorationPlayerPage.submitAnswer('TextInput', 'One');
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.submitAnswer('TextInput', '2');
    explorationPlayerPage.viewHint();
    explorationPlayerPage.submitAnswer('TextInput', '3');
    explorationPlayerPage.viewSolution();
    explorationPlayerPage.submitAnswer('TextInput', 'Two');
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.expectExplorationToNotBeOver();
    explorationPlayerPage.submitAnswer('TextInput', 'Three');
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.expectExplorationToBeOver();

    users.logout();

    // Learner 2 starts the exploration and immediately quits it.
    users.login('user3@statisticsTab.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);

    explorationPlayerPage.expectExplorationToNotBeOver();

    users.logout();

    // Creator visits the statistics tab.
    users.login('user1@statisticsTab.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToExplorationEditor();
    explorationEditorPage.navigateToStatsTab();

    // Now, there should be one passerby for this exploration since only learner
    // 3 quit at the first state.
    explorationStatsTab.expectNumPassersbyToBe('1');

    users.logout();
  });

  afterEach(function() {
    // TODO(pranavsid98): Remove this checked error once we figure out and fix
    // the cause.
    general.checkForConsoleErrors([
      'TypeError: google.visualization.PieChart is not a constructor'
    ]);
  });
});
