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

var editor = require('../protractor_utils/editor.js');
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');

describe('State editor', function() {
  var explorationPlayerPage = null;

  beforeEach(function() {
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should walk through the tutorial when user repeatedly clicks Next',
    function() {
      var NUM_TUTORIAL_STAGES = 7;
      users.createUser(
        'userTutorial@stateEditor.com', 'userTutorialStateEditor');
      users.login('userTutorial@stateEditor.com');

      workflow.createExplorationAndStartTutorial();
      editor.startTutorial();
      for (var i = 0; i < NUM_TUTORIAL_STAGES - 1; i++) {
        editor.progressInTutorial();
        general.waitForSystem();
      }
      editor.finishTutorial();
      users.logout();
    }
  );

  it('should display plain text content', function() {
    users.createUser('user1@stateEditor.com', 'user1StateEditor');
    users.login('user1@stateEditor.com');

    workflow.createExploration();
    editor.setContent(forms.toRichText('plain text'));
    editor.setInteraction('Continue', 'click here');
    editor.setDefaultOutcome(null, 'final card', true);

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setInteraction('EndExploration');
    editor.saveChanges();

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
    editor.setContent(function(richTextEditor) {
      richTextEditor.appendBoldText('bold text');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendItalicText('italic text');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendPlainText(' ');
      richTextEditor.appendOrderedList(['entry 1', 'entry 2']);
      richTextEditor.appendUnorderedList(['an entry', 'another entry']);
    });
    editor.setInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('option A'), forms.toRichText('option B')]);
    editor.setDefaultOutcome(null, 'final card', true);

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setInteraction('EndExploration');
    editor.saveChanges();

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
    editor.setContent(forms.toRichText('some content'));
    editor.setInteraction('NumericInput');
    editor.addResponse('NumericInput', function(richTextEditor) {
      richTextEditor.appendBoldText('correct');
    }, 'final card', true, 'IsInclusivelyBetween', -1, 3);
    editor.setDefaultOutcome(forms.toRichText('out of bounds'), null, false);

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setInteraction('EndExploration');
    editor.saveChanges();

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
    editor.setContent(forms.toRichText('some content'));

    // Numeric input does not have any customization arguments. Therefore the
    // customization modal and the save interaction button does not appear.
    editor.openInteraction('NumericInput');
    var saveInteractionBtn = element(
      by.css('.protractor-test-save-interaction'));
    expect(saveInteractionBtn.isPresent()).toBe(false);

    editor.closeAddResponseModal();

    // The Continue input has customization options. Therefore the
    // customization modal does appear and so does the save interaction button.
    editor.openInteraction('Continue');
    expect(saveInteractionBtn.isPresent()).toBe(true);
    users.logout();
  });

  it('should open appropriate modal on re-clicking an interaction to ' +
     'customize it', function() {
    users.createUser('user5@stateEditor.com', 'user5StateEditor');
    users.login('user5@stateEditor.com');

    workflow.createExploration();
    editor.setContent(forms.toRichText('some content'));

    // Numeric input does not have any customization arguments. Therefore, on
    // re-clicking, a modal opens up informing the user that this interaction
    // does not have any customization options. To dismiss this modal, user
    // clicks 'Okay' implying that he/she has got the message.
    editor.setInteraction('NumericInput');
    element(by.css('.protractor-test-interaction')).click();
    var okayBtn = element(
      by.css('.protractor-test-close-no-customization-modal'));
    expect(okayBtn.isPresent()).toBe(true);
    okayBtn.click();

    // Continue input has customization options. Therefore, on re-clicking, a
    // modal opens up containing the customization arguments for this input.
    // The user can dismiss this modal by clicking the 'Save Interaction'
    // button.
    editor.setInteraction('Continue');
    element(by.css('.protractor-test-interaction')).click();
    var saveInteractionBtn = element(
      by.css('.protractor-test-save-interaction'));
    expect(saveInteractionBtn.isPresent()).toBe(true);
    saveInteractionBtn.click();

    users.logout();
  });

  it('should preserve input value when rule type changes in' +
      ' add response modal', function() {
    users.createUser('stateEditorUser1@example.com', 'stateEditorUser1');
    users.login('stateEditorUser1@example.com');
    workflow.createExploration();
    editor.setContent(forms.toRichText('some content'));

    editor.openInteraction('TextInput');
    editor.customizeInteraction('TextInput', 'My PlaceHolder', 2);
    editor.selectRuleInAddResponseModal('TextInput', 'Equals');
    editor.setRuleParametersInAddResponseModal('TextInput',
      'Equals', 'Some Text');
    editor.expectRuleParametersToBe('TextInput', 'Equals', 'Some Text');
    editor.selectRuleInAddResponseModal('TextInput', 'Contains');
    editor.expectRuleParametersToBe('TextInput', 'Equals', 'Some Text');
    editor.closeAddResponseModal();

    editor.saveChanges();
    users.logout();
  });

  it('should navigate multiple states correctly, with parameters', function() {
    var explorationPlayerPage = (
      new ExplorationPlayerPage.ExplorationPlayerPage());
    users.createUser('user4@parameters.com', 'user4parameters');
    users.login('user4@parameters.com');

    workflow.createExploration();
    editor.enableParameters();
    editor.addExplorationLevelParameterChange('z', 2);

    editor.setStateName('card 1');
    editor.addParameterChange('a', 2);
    editor.setContent(forms.toRichText(
      'Change value of a from {{a}} to'));
    editor.setInteraction('NumericInput');
    editor.addResponse(
      'NumericInput', null, 'card 2', true, 'IsGreaterThan', 0);

    editor.moveToState('card 2');
    editor.addParameterChange('a', '{{answer}}');
    editor.addMultipleChoiceParameterChange('b', [3]);
    editor.setContent(forms.toRichText(
      'Change value of b from {{b}} to'));
    editor.setInteraction('NumericInput');
    editor.addResponse(
      'NumericInput', null, 'card 3', true, 'IsGreaterThan', 0);

    editor.moveToState('card 3');
    editor.addParameterChange('b', '{{answer}}');
    editor.setContent(forms.toRichText(
      'sum of {{z}} and {{b}} is {{z + b}},' +
      ' sum of {{a}} and {{b}} is {{a + b}}'));
    editor.setInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('return'), forms.toRichText('complete')]);
    editor.addResponse('MultipleChoiceInput', null, 'card 2', false,
      'Equals', 'return');
    editor.setDefaultOutcome(null, 'final card', true);

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setInteraction('EndExploration');
    editor.saveChanges();

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
    editor.setContent(forms.toRichText('some content'));

    editor.openInteraction('TextInput');
    editor.customizeInteraction('TextInput', 'My PlaceHolder', 2);
    editor.selectRuleInAddResponseModal('TextInput', 'Equals');
    editor.setRuleParametersInAddResponseModal('TextInput',
      'Equals', 'Some Text');
    editor.expectRuleParametersToBe('TextInput', 'Equals', 'Some Text');
    editor.selectRuleInAddResponseModal('TextInput', 'Contains');
    editor.expectRuleParametersToBe('TextInput', 'Equals', 'Some Text');
    editor.closeAddResponseModal();
    editor.addHint('hint one');
    editor.HintEditor(0).setHint('modified hint one');
    editor.HintEditor(0).deleteHint();
    general.waitForSystem();
    editor.saveChanges();
    users.logout();
  });

  it('should add a solution', function() {
    users.createUser('stateEditorUser3@example.com', 'stateEditorUser3');
    users.login('stateEditorUser3@example.com');
    workflow.createExploration();
    editor.setContent(forms.toRichText('some content'));

    editor.openInteraction('TextInput');
    editor.customizeInteraction('TextInput', 'My PlaceHolder', 2);
    editor.addResponse('TextInput', function(richTextEditor) {
      richTextEditor.appendBoldText('correct');
    }, 'final card', true, 'Equals', 'Some Text');

    editor.addHint('hint one');
    editor.addSolution('TextInput', {
      answerIsExclusive: true,
      correctAnswer: 'Some Text',
      explanation: 'sample explanation'
    });

    editor.saveChanges();
    users.logout();
  });

  it('uses hints and solutions in an exploration', function() {
    var explorationPlayerPage = (
      new ExplorationPlayerPage.ExplorationPlayerPage());
    users.createUser('user1@hintsAndSolutions.com', 'hintsAndSolutions');

    // Creator creates and publishes an exploration
    users.login('user1@hintsAndSolutions.com');
    workflow.createExploration();

    editor.setStateName('Introduction');
    editor.setContent(forms.toRichText('What language is Oppia?'));
    editor.setInteraction('TextInput');
    editor.addResponse(
      'TextInput', forms.toRichText('Good job'), 'End', true, 'Equals',
      'Finnish');
    editor.setDefaultOutcome(forms.toRichText('Try again'));
    editor.addHint('Try language of Finland');
    editor.addSolution('TextInput', {
      correctAnswer: 'Finnish',
      explanation: 'Finland language'
    });
    editor.moveToState('End');

    editor.setInteraction('EndExploration');
    editor.saveChanges();

    general.moveToPlayer();
    explorationPlayerPage.expectContentToMatch(
      forms.toRichText('What language is Oppia?'));
    explorationPlayerPage.submitAnswer('TextInput', 'Roman');
    // We need to wait some time for the hint to activate.
    general.waitForSystem();
    general.waitForSystem();
    general.waitForSystem();

    explorationPlayerPage.viewHint();
    explorationPlayerPage.clickGotItButton();
    explorationPlayerPage.submitAnswer('TextInput', 'Greek');
    // We need to wait some time for the solution to activate.
    general.waitForSystem();
    general.waitForSystem();
    general.waitForSystem();

    explorationPlayerPage.viewSolution();
    explorationPlayerPage.clickGotItButton();
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

    // Creator creates and publishes an exploration
    users.login('user1@statisticsTab.com');
    workflow.createExploration();

    editor.setTitle(EXPLORATION_TITLE);
    editor.setCategory(EXPLORATION_CATEGORY);
    editor.setObjective(EXPLORATION_OBJECTIVE);
    if (EXPLORATION_LANGUAGE) {
      editor.setLanguage(EXPLORATION_LANGUAGE);
    }

    editor.setStateName('One');
    editor.setContent(forms.toRichText('Please write 1 in words.'));
    editor.setInteraction('TextInput');
    editor.addResponse(
      'TextInput', forms.toRichText('Good job'), 'Two', true, 'Equals',
      'One');
    editor.setDefaultOutcome(forms.toRichText('Try again'));

    editor.moveToState('Two');
    editor.setContent(forms.toRichText('Please write 2 in words.'));
    editor.setInteraction('TextInput');
    editor.addResponse(
      'TextInput', forms.toRichText('Good job'), 'Three', true, 'Equals',
      'Two');
    editor.setDefaultOutcome(forms.toRichText('Try again'));
    editor.addHint('The number 2 in words.');
    editor.addSolution('TextInput', {
      correctAnswer: 'Two',
      explanation: 'The English equivalent of 2'
    });
    editor.moveToState('Three');
    editor.setContent(forms.toRichText('Please write 3 in words.'));
    editor.setInteraction('TextInput');
    editor.addResponse(
      'TextInput', forms.toRichText('Good job'), 'End', true, 'Equals',
      'Three');
    editor.setDefaultOutcome(forms.toRichText('Try again'));

    editor.moveToState('End');
    editor.setInteraction('EndExploration');
    editor.saveChanges();
    workflow.publishExploration();

    users.logout();

    // Learner 1 completes the exploration.
    users.login('user2@statisticsTab.com');
    libraryPage.get();
    libraryPage.playExploration(EXPLORATION_TITLE);

    explorationPlayerPage.submitAnswer('TextInput', 'One');
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.submitAnswer('TextInput', '2');
    explorationPlayerPage.viewHint();
    explorationPlayerPage.clickGotItButton();
    explorationPlayerPage.submitAnswer('TextInput', '3');
    explorationPlayerPage.viewSolution();
    explorationPlayerPage.clickGotItButton();
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
    libraryPage.playExploration(EXPLORATION_TITLE);

    explorationPlayerPage.expectExplorationToNotBeOver();

    users.logout();

    // Creator visits the statistics tab.
    users.login('user1@statisticsTab.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToExplorationEditor();
    editor.navigateToStatsTab();

    // Now, there should be one passerby for this exploration since only learner
    // 3 quit at the first state.
    editor.expectNumPassersbyToBe('1');

    users.logout();
  });

  afterEach(function() {
    // TODO(pranavsid98): Figure out why this error is raised once before the
    // page is even loaded.
    general.checkForConsoleErrors([
      'TypeError: google.visualization.PieChart is not a constructor'
    ]);
  });
});
