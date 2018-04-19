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
 * @fileoverview End-to-end tests of the full exploration editor.
 */

var editor = require('../protractor_utils/editor.js');
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var interactions = require('../../../extensions/interactions/protractor.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var CollectionEditorPage =
  require('../protractor_utils/CollectionEditorPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('Full exploration editor', function() {
  var explorationPlayerPage = null;
  var creatorDashboardPage = null;
  var libraryPage = null;

  beforeAll(function() {
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    libraryPage = new LibraryPage.LibraryPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
  });

  it('should prevent going back when help card is shown', function() {
    users.createUser('user2@editorAndPlayer.com', 'user2EditorAndPlayer');
    users.login('user2@editorAndPlayer.com');
    workflow.createExploration();

    editor.setStateName('card 1');
    editor.setContent(forms.toRichText('this is card 1'));
    editor.setInteraction('Continue');
    editor.ResponseEditor('default').setDestination('card 2', true, null);

    editor.moveToState('card 2');
    editor.setContent(forms.toRichText(
      'this is card 2 with non-inline interaction'));
    editor.setInteraction(
      'LogicProof',
      '', '', 'from p we have p');
    editor.addResponse(
      'LogicProof', forms.toRichText('Great'), 'final card', true, 'Correct');

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setInteraction('EndExploration');
    editor.saveChanges();

    general.moveToPlayer();
    explorationPlayerPage.submitAnswer('Continue');
    element.all(
      by.css('.protractor-test-back-button')).then(function(buttons){
      expect(buttons.length).toBe(1);
    });
    explorationPlayerPage.submitAnswer('LogicProof');
    element.all(
      by.css('.protractor-test-back-button')).then(function(buttons){
      expect(buttons.length).toBe(0);
    });

    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.expectExplorationToBeOver();
    users.logout();
  });

  it('should redirect back to parent exploration correctly when parent id is' +
      ' given as query parameter', function() {
    users.createUser('user1@editorAndPlayer.com', 'user1EditorAndPlayer');
    users.login('user1@editorAndPlayer.com');

    workflow.createAndPublishExploration(
      'Parent Exploration 1',
      'Algebra',
      'This is the topmost parent exploration.');
    general.getExplorationIdFromEditor().then(function(explorationId) {
      var parentId1 = explorationId;

      workflow.createAndPublishExploration(
        'Parent Exploration 2',
        'Algebra',
        'This is the second parent exploration to which refresher ' +
        'exploration redirects.');
      general.getExplorationIdFromEditor().then(function(explorationId) {
        var parentId2 = explorationId;

        workflow.createAndPublishExploration(
          'Refresher Exploration',
          'Algebra',
          'This is the most basic refresher exploration');
        general.getExplorationIdFromEditor().then(function(explorationId) {
          var refresherExplorationId = explorationId;

          browser.get('/explore/' + refresherExplorationId + '?parent=' +
            parentId1 + '&parent=' + parentId2);
          browser.waitForAngular();

          explorationPlayerPage.clickOnReturnToParentButton();

          browser.getCurrentUrl().then(function(url) {
            var currentExplorationId = url.split('/')[4].split('?')[0];
            expect(currentExplorationId).toBe(parentId2);

            explorationPlayerPage.clickOnReturnToParentButton();

            browser.getCurrentUrl().then(function(url) {
              currentExplorationId = url.split('/')[4];
              expect(currentExplorationId).toBe(parentId1);
              users.logout();
            });
          });
        });
      });
    });
  });

  it('should give option for redirection when author has specified ' +
      'a refresher exploration Id', function() {
    users.createAndLoginAdminUser('testadm@collections.com', 'testadm');

    browser.get(general.SERVER_URL_PREFIX);
    var dropdown = element(by.css('.protractor-test-profile-dropdown'));
    browser.actions().mouseMove(dropdown).perform();
    dropdown.element(by.css('.protractor-test-dashboard-link')).click();
    general.waitForSystem();
    browser.waitForAngular();
    creatorDashboardPage.clickCreateActivityButton();
    creatorDashboardPage.clickCreateExplorationButton();
    editor.exitTutorialIfNecessary();
    editor.setTitle('Refresher Exploration');
    editor.setCategory('Algebra');
    editor.setObjective('This is the refresher exploration');
    editor.setContent(forms.toRichText('Refresher Exploration Content'));
    editor.setInteraction('EndExploration');
    editor.saveChanges();
    workflow.publishExploration();
    general.waitForSystem();

    general.getExplorationIdFromEditor().then(function(refresherExplorationId) {
      browser.get(general.SERVER_URL_PREFIX);
      dropdown = element(by.css('.protractor-test-profile-dropdown'));
      browser.actions().mouseMove(dropdown).perform();
      dropdown.element(by.css('.protractor-test-dashboard-link')).click();
      general.waitForSystem();
      browser.waitForAngular();
      creatorDashboardPage.clickCreateActivityButton();
      creatorDashboardPage.clickCreateExplorationButton();
      editor.exitTutorialIfNecessary();
      editor.setTitle('Parent Exploration not in collection');
      editor.setCategory('Algebra');
      editor.setObjective('This is a parent exploration');
      editor.setContent(forms.toRichText('Parent Exploration Content'));
      editor.setInteraction(
        'MultipleChoiceInput',
        [forms.toRichText('Correct'), forms.toRichText('Incorrect')]);
      editor.addResponse('MultipleChoiceInput', null, 'card 2', true,
        'Equals', 'Correct');

      editor.ResponseEditor(
        'default').setFeedback(forms.toRichText('try again'));
      editor.ResponseEditor(
        'default').setDestination(null, false, refresherExplorationId);

      editor.moveToState('card 2');
      editor.setInteraction('EndExploration');
      editor.saveChanges();
      workflow.publishExploration();
      browser.waitForAngular();

      browser.get(general.SERVER_URL_PREFIX);
      dropdown = element(by.css('.protractor-test-profile-dropdown'));
      browser.actions().mouseMove(dropdown).perform();
      dropdown.element(by.css('.protractor-test-dashboard-link')).click();
      general.waitForSystem();
      browser.waitForAngular();
      creatorDashboardPage.clickCreateActivityButton();
      creatorDashboardPage.clickCreateExplorationButton();
      editor.exitTutorialIfNecessary();
      editor.setTitle('Parent Exploration in collection');
      editor.setCategory('Algebra');
      editor.setObjective('This is a parent exploration');
      editor.setContent(forms.toRichText('Parent Exploration Content'));
      editor.setInteraction(
        'MultipleChoiceInput',
        [forms.toRichText('Correct'), forms.toRichText('Incorrect')]);
      editor.addResponse('MultipleChoiceInput', null, 'card 2', true,
        'Equals', 'Correct');

      editor.ResponseEditor(
        'default').setFeedback(forms.toRichText('try again'));
      editor.ResponseEditor(
        'default').setDestination(null, false, refresherExplorationId);

      editor.moveToState('card 2');
      editor.setInteraction('EndExploration');
      editor.saveChanges();
      workflow.publishExploration();
      browser.waitForAngular();

      browser.get(general.SERVER_URL_PREFIX);
      dropdown = element(by.css('.protractor-test-profile-dropdown'));
      browser.actions().mouseMove(dropdown).perform();
      dropdown.element(by.css('.protractor-test-dashboard-link')).click();
      general.waitForSystem();
      browser.waitForAngular();
      creatorDashboardPage.clickCreateActivityButton();
      creatorDashboardPage.clickCreateCollectionButton();
      general.waitForSystem();
      browser.waitForAngular();
      collectionEditorPage.searchForAndAddExistingExploration(
        'Parent Exploration in collection');
      collectionEditorPage.saveDraft();
      collectionEditorPage.closeSaveModal();
      collectionEditorPage.publishCollection();
      collectionEditorPage.setTitle('Test Collection');
      collectionEditorPage.setObjective('This is a test collection.');
      collectionEditorPage.setCategory('Algebra');
      collectionEditorPage.saveChanges();
      browser.waitForAngular();

      browser.get('/search/find?q=');
      libraryPage.playExploration('Parent Exploration not in collection');
      explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'Incorrect');
      general.waitForSystem();
      explorationPlayerPage.clickConfirmRedirectionButton();
      general.waitForSystem();
      browser.waitForAngular();
      general.getExplorationIdFromPlayer().then(function(currentId) {
        expect(currentId).toEqual(refresherExplorationId);
        general.waitForSystem();
        explorationPlayerPage.clickOnReturnToParentButton();
        browser.waitForAngular();
        explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'Incorrect');
        general.waitForSystem();
        explorationPlayerPage.clickCancelRedirectionButton();
        browser.waitForAngular();
        explorationPlayerPage.expectContentToMatch(
          forms.toRichText('Parent Exploration Content'));
        explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'Correct');
        browser.waitForAngular();

        browser.get('/search/find?q=');
        element.all(by.css(
          '.protractor-test-collection-summary-tile-title')).first().click();
        element.all(by.css(
          '.protractor-test-collection-exploration')).first().click();
        explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'Incorrect');
        general.waitForSystem();
        explorationPlayerPage.clickConfirmRedirectionButton();
        general.waitForSystem();
        browser.waitForAngular();
        // Check the current url to see if collection_id is present in it.
        browser.getCurrentUrl().then(function(url) {
          var pathname = url.split('/');
          expect(
            pathname[4].split('?')[1].split('=')[0]).toEqual('collection_id');
          general.waitForSystem();
          users.logout();
        });
      });
    });
  });

  it('should navigate multiple states correctly, with parameters', function() {
    users.createUser('user4@editorAndPlayer.com', 'user4EditorAndPlayer');
    users.login('user4@editorAndPlayer.com');

    workflow.createExploration();
    editor.setStateName('card 1');
    editor.setContent(forms.toRichText('this is card 1'));
    editor.setInteraction('NumericInput');
    editor.addResponse(
      'NumericInput', null, 'final card', true, 'Equals', 21);
    editor.ResponseEditor(0).setDestination('card 2', true, null);

    editor.moveToState('card 2');
    editor.setContent(forms.toRichText(
      'this is card 2 with previous answer {{answer}}'));
    editor.setInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('return'), forms.toRichText('complete')]);
    editor.addResponse('MultipleChoiceInput', null, 'card 1', false,
      'Equals', 'return');
    editor.setDefaultOutcome(null, 'final card', false);

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setInteraction('EndExploration');
    editor.saveChanges();

    general.moveToPlayer();
    explorationPlayerPage.expectContentToMatch(
      forms.toRichText('this is card 1'));
    explorationPlayerPage.submitAnswer('NumericInput', 19);
    explorationPlayerPage.submitAnswer('NumericInput', 21);
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'this is card 2 with previous answer 21'));
    explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'return');
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'this is card 1'));
    explorationPlayerPage.submitAnswer('NumericInput', 21);
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'this is card 2 with previous answer 21'));
    explorationPlayerPage.expectExplorationToNotBeOver();
    explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'complete');
    explorationPlayerPage.expectExplorationToBeOver();
    users.logout();
  });

  it('should handle discarding changes, navigation, deleting states, ' +
      'changing the first state, displaying content, deleting responses and ' +
      'switching to preview mode', function() {
    users.createUser('user5@editorAndPlayer.com', 'user5EditorAndPlayer');
    users.login('user5@editorAndPlayer.com');

    workflow.createExploration();
    general.getExplorationIdFromEditor().then(function(explorationId) {
      // Check discarding of changes
      editor.setStateName('card1');
      editor.expectCurrentStateToBe('card1');
      editor.setContent(forms.toRichText('card1 content'));
      editor.setInteraction('TextInput');
      editor.setDefaultOutcome(null, 'final card', true);
      editor.ResponseEditor('default').setDestination('card2', true, null);
      editor.moveToState('card2');
      // NOTE: we must move to the state before checking state names to avoid
      // inexplicable failures of the protractor utility that reads state names
      // (the user-visible names are fine either way). See issue 732 for more.
      editor.expectStateNamesToBe(['final card', 'card1', 'card2']);
      editor.setInteraction('EndExploration');

      editor.discardChanges();
      editor.expectCurrentStateToBe(general.FIRST_STATE_DEFAULT_NAME);
      editor.setStateName('first');
      editor.expectCurrentStateToBe('first');
      editor.setContent(forms.toRichText('card1 content'));

      // Check deletion of states and changing the first state
      editor.setInteraction('TextInput');
      editor.setDefaultOutcome(null, 'final card', true);
      editor.ResponseEditor('default').setDestination('second', true, null);
      editor.moveToState('second');
      editor.expectStateNamesToBe(['final card', 'first', 'second']);
      editor.expectCurrentStateToBe('second');
      editor.expectAvailableFirstStatesToBe(['final card', 'first', 'second']);
      editor.setFirstState('second');
      editor.moveToState('first');
      editor.deleteState('first');
      editor.expectCurrentStateToBe('second');
      editor.expectStateNamesToBe(['final card', 'second']);

      // Check behaviour of the back button
      editor.setObjective('do some stuff here');
      expect(browser.getCurrentUrl()).toEqual(
        general.SERVER_URL_PREFIX + general.EDITOR_URL_SLICE +
        explorationId + '#/gui/second');
      browser.navigate().back();
      expect(browser.getCurrentUrl()).toEqual(
        general.SERVER_URL_PREFIX + general.EDITOR_URL_SLICE +
        explorationId + '#/settings');
      browser.navigate().back();
      expect(browser.getCurrentUrl()).toEqual(
        general.SERVER_URL_PREFIX + general.EDITOR_URL_SLICE +
        explorationId + '#/gui/second');

      // Check display of content & interaction in the editor
      editor.setContent(function(richTextEditor) {
        richTextEditor.appendItalicText('Welcome');
      });
      editor.expectContentToMatch(function(richTextChecker) {
        richTextChecker.readItalicText('Welcome');
      });
      editor.setInteraction('NumericInput');
      editor.expectInteractionToMatch('NumericInput');

      // Check deletion of groups
      editor.setDefaultOutcome(forms.toRichText('Farewell'), null, false);
      editor.ResponseEditor('default').
        expectAvailableDestinationsToBe(['second', 'final card']);
      editor.ResponseEditor(
        'default').setDestination('final card', false, null);
      editor.ResponseEditor('default').
        expectAvailableDestinationsToBe(['second', 'final card']);
      editor.addResponse('NumericInput', null, 'final card', false,
        'IsGreaterThan', 2);
      // eslint-disable-next-line dot-notation
      editor.ResponseEditor(0).delete();

      // Setup a terminating state
      editor.moveToState('final card');
      editor.setInteraction('EndExploration');

      // Check that preview/editor switch doesn't change state
      editor.navigateToPreviewTab();
      explorationPlayerPage.expectExplorationToBeOver();
      editor.navigateToMainTab();
      editor.expectCurrentStateToBe('final card');
      editor.moveToState('second');

      // Check editor preview tab
      editor.navigateToPreviewTab();
      explorationPlayerPage.expectContentToMatch(function(richTextEditor) {
        richTextEditor.readItalicText('Welcome');
      });
      explorationPlayerPage.expectInteractionToMatch('NumericInput');
      explorationPlayerPage.submitAnswer('NumericInput', 6);
      // This checks the previously-deleted group no longer applies.
      explorationPlayerPage.expectLatestFeedbackToMatch(
        forms.toRichText('Farewell'));
      explorationPlayerPage.clickThroughToNextCard();
      explorationPlayerPage.expectExplorationToBeOver();

      editor.discardChanges();
      users.logout();
    });
  });

  it('should handle multiple rules in an answer group and also disallow ' +
      'editing of a read-only exploration', function() {
    users.createUser('user6@editorAndPlayer.com', 'user6EditorAndPlayer');
    users.createUser('user7@editorAndPlayer.com', 'user7EditorAndPlayer');
    users.login('user6@editorAndPlayer.com');
    workflow.createExploration();

    general.getExplorationIdFromEditor().then(function(explorationId) {
      // Create an exploration with multiple groups.
      editor.setStateName('first card');
      editor.setContent(forms.toRichText('How are you feeling?'));
      editor.setInteraction('TextInput');
      editor.addResponse('TextInput', forms.toRichText('You must be happy!'),
        null, false, 'Equals', 'happy');
      editor.addResponse('TextInput', forms.toRichText('No being sad!'),
        null, false, 'Contains', 'sad');
      editor.setDefaultOutcome(forms.toRichText(
        'Okay, now this is just becoming annoying.'), 'final card', true);

      // Now, add multiple rules to a single answer group.
      editor.ResponseEditor(0).addRule('TextInput', 'Contains', 'meh');
      editor.ResponseEditor(0).addRule('TextInput', 'Contains', 'okay');

      // Ensure that the only rule for this group cannot be deleted.
      editor.ResponseEditor(1).expectCannotDeleteRule(0);

      // Setup a terminating state.
      editor.moveToState('final card');
      editor.setInteraction('EndExploration');

      // Save.
      editor.setTitle('Testing multiple rules');
      editor.setCategory('Algebra');
      editor.setObjective('To assess happiness.');
      editor.openAndClosePreviewSummaryTile();
      editor.saveChanges();
      workflow.publishExploration();

      // Login as another user and verify that the exploration editor does not
      // allow the second user to modify the exploration.
      users.logout();
      users.login('user7@editorAndPlayer.com');
      general.openEditor(explorationId);
      editor.exitTutorialIfNecessary();

      // Verify nothing can change with this user.
      editor.expectInteractionToMatch('TextInput');
      editor.expectCannotDeleteInteraction();
      editor.expectCannotAddResponse();
      editor.expectCannotSaveChanges();

      // Check answer group 1.
      var responseEditor = editor.ResponseEditor(0);
      responseEditor.expectCannotSetFeedback();
      responseEditor.expectCannotSetDestination();
      responseEditor.expectCannotDeleteResponse();
      responseEditor.expectCannotAddRule();
      responseEditor.expectCannotDeleteRule(0);
      responseEditor.expectCannotDeleteRule(1);

      // Check answer group 2.
      responseEditor = editor.ResponseEditor(0);
      responseEditor.expectCannotSetFeedback();
      responseEditor.expectCannotSetDestination();
      responseEditor.expectCannotDeleteResponse();
      responseEditor.expectCannotAddRule();
      responseEditor.expectCannotDeleteRule(0);

      // Check default outcome.
      responseEditor = editor.ResponseEditor('default');
      responseEditor.expectCannotSetFeedback();
      responseEditor.expectCannotSetDestination();

      // Check editor preview tab to verify multiple rules are working.
      general.moveToPlayer();
      explorationPlayerPage.expectContentToMatch(
        forms.toRichText('How are you feeling?'));
      explorationPlayerPage.expectInteractionToMatch('TextInput');

      explorationPlayerPage.submitAnswer('TextInput', 'happy');
      explorationPlayerPage.expectLatestFeedbackToMatch(
        forms.toRichText('You must be happy!'));

      explorationPlayerPage.submitAnswer('TextInput', 'meh, I\'m okay');
      explorationPlayerPage.expectLatestFeedbackToMatch(
        forms.toRichText('You must be happy!'));

      explorationPlayerPage.submitAnswer('TextInput', 'NO I\'M SAD');
      explorationPlayerPage.expectLatestFeedbackToMatch(
        forms.toRichText('No being sad!'));

      explorationPlayerPage.submitAnswer('TextInput', 'Fine...I\'m doing okay');
      explorationPlayerPage.expectLatestFeedbackToMatch(
        forms.toRichText('You must be happy!'));

      // Finish the exploration.
      explorationPlayerPage.submitAnswer('TextInput', 'Whatever...');

      explorationPlayerPage.expectLatestFeedbackToMatch(
        forms.toRichText('Okay, now this is just becoming annoying.'));
      explorationPlayerPage.clickThroughToNextCard();
      explorationPlayerPage.expectExplorationToBeOver();

      users.logout();
    });
  });

  it('should delete interactions cleanly', function() {
    users.createUser('user8@editorAndPlayer.com', 'user8EditorAndPlayer');
    users.login('user8@editorAndPlayer.com');
    workflow.createExploration();

    general.getExplorationIdFromEditor().then(function(explorationId) {
      editor.setContent(forms.toRichText('How are you feeling?'));
      editor.setInteraction('EndExploration');
      editor.setInteraction('TextInput');
      editor.addResponse(
        'TextInput', forms.toRichText('Happy!'), null, false, 'Equals',
        'happy');
      editor.setInteraction('EndExploration');
      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});


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

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});

describe('Rating', function() {
  var EXPLORATION_RATINGTEST = 'RatingTest';
  var CATEGORY_BUSINESS = 'Business';
  var LANGUAGE_ENGLISH = 'English';
  var MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS = 1;
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  var addRating = function(userEmail, userName, explorationName, ratingValue) {
    users.createUser(userEmail, userName);
    users.login(userEmail);
    libraryPage.get();
    libraryPage.playExploration(EXPLORATION_RATINGTEST);
    explorationPlayerPage.expectExplorationNameToBe(explorationName);
    explorationPlayerPage.rateExploration(ratingValue);
    users.logout();
  };

  it('should display ratings on exploration when minimum ratings have been ' +
     'submitted', function() {
    users.createUser('user1@explorationRating.com', 'user1Rating');
    // Create an test exploration
    users.login('user1@explorationRating.com');
    workflow.createAndPublishExploration(
      EXPLORATION_RATINGTEST, CATEGORY_BUSINESS,
      'this is an objective', LANGUAGE_ENGLISH);
    users.logout();

    // Create test users, play exploration and review them after completion
    for (var i = 0; i < MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS - 1; i++) {
      var userEmail = 'NoDisplay' + i + '@explorationRating.com';
      var username = 'NoDisplay' + i;
      addRating(userEmail, username, EXPLORATION_RATINGTEST, 4);
    }

    libraryPage.get();
    libraryPage.expectExplorationRatingToEqual(EXPLORATION_RATINGTEST, 'N/A');

    var userEmail = 'Display@explorationRating.com';
    var username = 'Display';
    addRating(userEmail, username, EXPLORATION_RATINGTEST, 4);

    libraryPage.get();
    libraryPage.expectExplorationRatingToEqual(EXPLORATION_RATINGTEST, '4.0');

    libraryPage.playExploration(EXPLORATION_RATINGTEST);
    explorationPlayerPage.expectExplorationRatingOnInformationCardToEqual(
      '4.0');
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
