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

var general = require('../protractor_utils/general.js');
var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var CollectionEditorPage =
  require('../protractor_utils/CollectionEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
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
