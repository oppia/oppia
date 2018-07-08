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

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var CollectionEditorPage =
  require('../protractor_utils/CollectionEditorPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('Full exploration editor', function() {
  var explorationPlayerPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var creatorDashboardPage = null;
  var libraryPage = null;

  beforeAll(function() {
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    libraryPage = new LibraryPage.LibraryPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
  });

  it('should prevent going back when help card is shown', function() {
    users.createUser('user2@editorAndPlayer.com', 'user2EditorAndPlayer');
    users.login('user2@editorAndPlayer.com');
    workflow.createExploration();
    explorationEditorMainTab.setStateName('card 1');
    explorationEditorMainTab.setContent(forms.toRichText('this is card 1'));
    explorationEditorMainTab.setInteraction('Continue');
    explorationEditorMainTab.getResponseEditor('default').setDestination(
      'card 2', true, null);

    explorationEditorMainTab.moveToState('card 2');
    explorationEditorMainTab.setContent(forms.toRichText(
      'this is card 2 with non-inline interaction'));
    explorationEditorMainTab.setInteraction(
      'LogicProof',
      '', '', 'from p we have p');
    explorationEditorMainTab.addResponse(
      'LogicProof', forms.toRichText('Great'), 'final card', true, 'Correct');

    // Setup a terminating state.
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();

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
          general.waitForLoadingMessage();

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

    // Create Parent Exploration not added to collection.
    creatorDashboardPage.get();
    creatorDashboardPage.clickCreateActivityButton();
    creatorDashboardPage.clickCreateExplorationButton();
    explorationEditorMainTab.exitTutorial();
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle(
      'Parent Exploration not in collection');
    explorationEditorSettingsTab.setCategory('Algebra');
    explorationEditorSettingsTab.setObjective('This is a parent exploration');
    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.setContent(forms.toRichText(
      'Parent Exploration Content'));
    explorationEditorMainTab.setInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('Correct'), forms.toRichText('Incorrect')]);
    explorationEditorMainTab.addResponse(
      'MultipleChoiceInput', null, 'card 2', true,
      'Equals', 'Correct');
    var responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setFeedback(forms.toRichText('try again'));
    explorationEditorMainTab.moveToState('card 2');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();
    workflow.publishExploration();

    // Create Parent Exploration added in collection.
    creatorDashboardPage.get();
    creatorDashboardPage.clickCreateActivityButton();
    creatorDashboardPage.clickCreateExplorationButton();
    explorationEditorMainTab.exitTutorial();
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle('Parent Exploration in collection');
    explorationEditorSettingsTab.setCategory('Algebra');
    explorationEditorSettingsTab.setObjective('This is a parent exploration');
    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.setContent(forms.toRichText(
      'Parent Exploration Content'));
    explorationEditorMainTab.setInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('Correct'), forms.toRichText('Incorrect')]);
    explorationEditorMainTab.addResponse(
      'MultipleChoiceInput', null, 'card 2', true,
      'Equals', 'Correct');
    responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setFeedback(forms.toRichText('try again'));
    explorationEditorMainTab.moveToState('card 2');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();
    workflow.publishExploration();

    // Create Refresher Exploration.
    creatorDashboardPage.get();
    creatorDashboardPage.clickCreateActivityButton();
    creatorDashboardPage.clickCreateExplorationButton();
    explorationEditorMainTab.exitTutorial();
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle('Refresher Exploration');
    explorationEditorSettingsTab.setCategory('Algebra');
    explorationEditorSettingsTab.setObjective(
      'This is the refresher exploration');
    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.setContent(forms.toRichText(
      'Refresher Exploration Content'));
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();
    workflow.publishExploration();
    // Add refresher exploration's Id to both parent explorations.
    general.getExplorationIdFromEditor().then(function(refresherExplorationId) {
      creatorDashboardPage.get();
      creatorDashboardPage.editExploration('Parent Exploration in collection');
      responseEditor = explorationEditorMainTab.getResponseEditor('default');
      responseEditor.setDestination(null, false, refresherExplorationId);
      explorationEditorPage.saveChanges('Add Refresher Exploration Id');

      creatorDashboardPage.get();
      creatorDashboardPage.editExploration(
        'Parent Exploration not in collection');
      responseEditor = explorationEditorMainTab.getResponseEditor('default');
      responseEditor.setDestination(null, false, refresherExplorationId);
      explorationEditorPage.saveChanges('Add Refresher Exploration Id');
    });

    // Create collection and add created exploration.
    creatorDashboardPage.get();
    creatorDashboardPage.clickCreateActivityButton();
    creatorDashboardPage.clickCreateCollectionButton();
    collectionEditorPage.searchForAndAddExistingExploration(
      'Parent Exploration in collection');
    collectionEditorPage.saveDraft();
    collectionEditorPage.closeSaveModal();
    collectionEditorPage.publishCollection();
    collectionEditorPage.setTitle('Test Collection');
    collectionEditorPage.setObjective('This is a test collection.');
    collectionEditorPage.setCategory('Algebra');
    collectionEditorPage.saveChanges();

    // Play-test exploration and visit the refresher exploration.
    libraryPage.get();
    libraryPage.findExploration('Parent Exploration not in collection');
    libraryPage.playExploration('Parent Exploration not in collection');
    explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'Incorrect');
    explorationPlayerPage.clickConfirmRedirectionButton();
    explorationPlayerPage.expectExplorationNameToBe(
      'Refresher Exploration');
    explorationPlayerPage.clickOnReturnToParentButton();
    explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'Incorrect');
    explorationPlayerPage.clickCancelRedirectionButton();
    explorationPlayerPage.expectContentToMatch(
      forms.toRichText('Parent Exploration Content'));
    explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'Correct');

    libraryPage.get();
    libraryPage.findExploration('Test Collection');
    libraryPage.playCollection('Test Collection');
    // Click first exploration in collection.
    element.all(by.css(
      '.protractor-test-collection-exploration')).first().click();
    explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'Incorrect');
    explorationPlayerPage.clickConfirmRedirectionButton();
    // Check the current url to see if collection_id is present in it.
    browser.getCurrentUrl().then(function(url) {
      var pathname = url.split('/');
      expect(
        pathname[4].split('?')[1].split('=')[0]).toEqual('collection_id');
      users.logout();
    });
  });

  it('should navigate multiple states correctly, with parameters', function() {
    users.createUser('user4@editorAndPlayer.com', 'user4EditorAndPlayer');
    users.login('user4@editorAndPlayer.com');

    workflow.createExploration();
    explorationEditorMainTab.setStateName('card 1');
    explorationEditorMainTab.setContent(forms.toRichText('this is card 1'));
    explorationEditorMainTab.setInteraction('NumericInput');
    explorationEditorMainTab.addResponse(
      'NumericInput', null, 'final card', true, 'Equals', 21);
    explorationEditorMainTab.getResponseEditor(0).setDestination(
      'card 2', true, null);

    explorationEditorMainTab.moveToState('card 2');
    explorationEditorMainTab.setContent(forms.toRichText(
      'this is card 2 with previous answer {{answer}}'));
    explorationEditorMainTab.setInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('return'), forms.toRichText('complete')]);
    explorationEditorMainTab.addResponse(
      'MultipleChoiceInput', null, 'card 1', false,
      'Equals', 'return');
    explorationEditorMainTab.getResponseEditor('default').setDestination(
      'final card', false, null);
    // Setup a terminating state.
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();

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
    explorationEditorMainTab.setStateName('card1');
    explorationEditorMainTab.expectCurrentStateToBe('card1');
    explorationEditorMainTab.setContent(forms.toRichText('card1 content'));
    explorationEditorMainTab.setInteraction('TextInput');
    explorationEditorMainTab.getResponseEditor('default').setDestination(
      'final card', true, null);
    explorationEditorMainTab.getResponseEditor('default').setDestination(
      'card2', true, null);
    explorationEditorMainTab.moveToState('card2');
    // NOTE: we must move to the state before checking state names to avoid
    // inexplicable failures of the protractor utility that reads state names
    // (the user-visible names are fine either way). See issue 732 for more.
    explorationEditorMainTab.expectStateNamesToBe(
      ['final card', 'card1', 'card2']);
    explorationEditorMainTab.setInteraction('EndExploration');

    // Check discarding of changes.
    explorationEditorPage.discardChanges();
    explorationEditorMainTab.expectCurrentStateToBe(
      general.FIRST_STATE_DEFAULT_NAME);
    explorationEditorMainTab.setStateName('first');
    explorationEditorMainTab.expectCurrentStateToBe('first');
    explorationEditorMainTab.setContent(forms.toRichText('card1 content'));

    // Check deletion of states and changing the first state.
    explorationEditorMainTab.setInteraction('TextInput');
    explorationEditorMainTab.getResponseEditor('default').setDestination(
      'final card', true, null);
    explorationEditorMainTab.getResponseEditor('default').setDestination(
      'second', true, null);
    explorationEditorMainTab.moveToState('second');
    explorationEditorMainTab.expectStateNamesToBe(
      ['final card', 'first', 'second']);
    explorationEditorMainTab.expectCurrentStateToBe('second');
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.expectAvailableFirstStatesToBe(
      ['final card', 'first', 'second']);
    explorationEditorSettingsTab.setFirstState('second');
    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.moveToState('first');
    explorationEditorMainTab.deleteState('first');
    explorationEditorMainTab.expectCurrentStateToBe('second');
    explorationEditorMainTab.expectStateNamesToBe(['final card', 'second']);

    // Check behaviour of the back button
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setObjective('do some stuff here');
    explorationEditorPage.navigateToMainTab();
    general.getExplorationIdFromEditor().then(function(explorationId) {
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
    });

    // Refreshing to prevent stale elements after backing from previous page.
    browser.refresh();
    explorationEditorMainTab.setContent(function(richTextEditor) {
      richTextEditor.appendItalicText('Welcome');
    });
    explorationEditorMainTab.expectContentToMatch(function(richTextChecker) {
      richTextChecker.readItalicText('Welcome');
    });
    explorationEditorMainTab.setInteraction('NumericInput');
    // Check display of content & interaction in the editor
    explorationEditorMainTab.expectInteractionToMatch('NumericInput');

    // Check deletion of groups
    var responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setFeedback(forms.toRichText('Farewell'));
    responseEditor.setDestination(null, false, null);
    responseEditor.expectAvailableDestinationsToBe(['second', 'final card']);
    responseEditor.setDestination('final card', false, null);
    responseEditor.expectAvailableDestinationsToBe(['second', 'final card']);
    explorationEditorMainTab.addResponse(
      'NumericInput', null, 'final card', false,
      'IsGreaterThan', 2);
    explorationEditorMainTab.getResponseEditor(0).deleteResponse();

    // Setup a terminating state.
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');

    // Check that preview/editor switch doesn't change state.
    explorationEditorPage.navigateToPreviewTab();
    explorationPlayerPage.expectExplorationToBeOver();
    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.expectCurrentStateToBe('final card');
    explorationEditorMainTab.moveToState('second');

    // Check editor preview tab.
    explorationEditorPage.navigateToPreviewTab();
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
    explorationEditorPage.discardChanges();
    users.logout();
  });

  it('should handle multiple rules in an answer group and also disallow ' +
      'editing of a read-only exploration', function() {
    users.createUser('user6@editorAndPlayer.com', 'user6EditorAndPlayer');
    users.createUser('user7@editorAndPlayer.com', 'user7EditorAndPlayer');
    users.login('user6@editorAndPlayer.com');
    workflow.createExploration();

    // Create an exploration with multiple groups.
    explorationEditorMainTab.setStateName('first card');
    explorationEditorMainTab.setContent(forms.toRichText(
      'How are you feeling?'));
    explorationEditorMainTab.setInteraction('TextInput');
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('You must be happy!'),
      null, false, 'Equals', 'happy');
    explorationEditorMainTab.addResponse('TextInput',
      forms.toRichText('No being sad!'),
      null, false, 'Contains', 'sad');
    var responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setFeedback(forms.toRichText(
      'Okay, now this is just becoming annoying.'));
    responseEditor.setDestination('final card', true, null);

    // Now, add multiple rules to a single answer group.
    responseEditor = explorationEditorMainTab.getResponseEditor(0);
    responseEditor.addRule('TextInput', 'Contains', 'meh');
    responseEditor.addRule('TextInput', 'Contains', 'okay');

    // Ensure that the only rule for this group cannot be deleted.
    explorationEditorMainTab.getResponseEditor(1).expectCannotDeleteRule(0);

    // Setup a terminating state.
    explorationEditorMainTab.moveToState('final card');
    explorationEditorMainTab.setInteraction('EndExploration');

    // Save.
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle('Testing multiple rules');
    explorationEditorSettingsTab.setCategory('Algebra');
    explorationEditorSettingsTab.setObjective('To assess happiness.');
    explorationEditorSettingsTab.openAndClosePreviewSummaryTile();
    explorationEditorPage.saveChanges();
    workflow.publishExploration();

    // Login as another user and verify that the exploration editor does not
    // allow the second user to modify the exploration.
    users.logout();
    users.login('user7@editorAndPlayer.com');
    // 2nd user finds an exploration, plays it and then try to access
    // its editor via /create/explorationId.
    libraryPage.get();
    libraryPage.findExploration('Testing multiple rules');
    libraryPage.playExploration('Testing multiple rules');
    general.getExplorationIdFromPlayer().then(function(explorationId) {
      browser.get(general.SERVER_URL_PREFIX + general.EDITOR_URL_SLICE +
          explorationId);
    });
    explorationEditorMainTab.exitTutorial();

    // Verify nothing can change with this user.
    explorationEditorMainTab.expectInteractionToMatch('TextInput');
    explorationEditorMainTab.expectCannotDeleteInteraction();
    explorationEditorMainTab.expectCannotAddResponse();
    explorationEditorPage.expectCannotSaveChanges();

    // Check answer group 1.
    responseEditor = explorationEditorMainTab.getResponseEditor(0);
    responseEditor.expectCannotSetFeedback();
    responseEditor.expectCannotSetDestination();
    responseEditor.expectCannotDeleteResponse();
    responseEditor.expectCannotAddRule();
    responseEditor.expectCannotDeleteRule(0);
    responseEditor.expectCannotDeleteRule(1);

    // Check answer group 2.
    responseEditor = explorationEditorMainTab.getResponseEditor(1);
    responseEditor.expectCannotSetFeedback();
    responseEditor.expectCannotSetDestination();
    responseEditor.expectCannotDeleteResponse();
    responseEditor.expectCannotAddRule();
    responseEditor.expectCannotDeleteRule(0);

    // Check default outcome.
    responseEditor = explorationEditorMainTab.getResponseEditor('default');
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

  it('should delete interactions cleanly', function() {
    users.createUser('user8@editorAndPlayer.com', 'user8EditorAndPlayer');
    users.login('user8@editorAndPlayer.com');
    workflow.createExploration();
    explorationEditorMainTab.setContent(forms.toRichText(
      'How are you feeling?'));
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorMainTab.deleteInteraction();
    explorationEditorMainTab.setInteraction('TextInput');
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('Happy!'), null, false, 'Equals',
      'happy');
    explorationEditorMainTab.expectInteractionToMatch('TextInput');
    explorationEditorPage.saveChanges();
    explorationEditorMainTab.deleteInteraction();
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorMainTab.expectInteractionToMatch('EndExploration');
    users.logout();
  });

  it('should play the recommended exploration successfully', function() {
    users.createUser('user9@editorAndPlayer.com', 'user9editorAndPlayer');
    users.createUser('user10@editorAndPlayer.com',
      'user10editorAndPlayer');
    users.login('user9@editorAndPlayer.com');
    // Publish new exploration.
    workflow.createExploration();
    explorationEditorMainTab.setContent(
      forms.toRichText('You should recommend this exploration'));
    explorationEditorMainTab.setInteraction('EndExploration');
    var explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle('Recommended Exploration 1');
    explorationEditorSettingsTab.setCategory('Algorithm');
    explorationEditorSettingsTab.setObjective('To be recommended');
    explorationEditorPage.navigateToMainTab();
    explorationEditorPage.saveChanges();
    workflow.publishExploration();
    users.logout();

    users.login('user10@editorAndPlayer.com');
    libraryPage.get();
    libraryPage.findExploration('Recommended Exploration 1');
    libraryPage.playExploration('Recommended Exploration 1');
    // Using the Id from Player and create a new exploration
    // and add the Id as suggestion.
    general.getExplorationIdFromPlayer()
      .then(function(recommendedExplorationId) {
        workflow.createExploration();
        explorationEditorMainTab.setContent(
          forms.toRichText('I want to recommend an exploration at the end'));
        explorationEditorMainTab.setInteraction(
          'EndExploration', [recommendedExplorationId]);
        explorationEditorPage.navigateToSettingsTab();
        explorationEditorSettingsTab.setTitle(
          'Exploration with Recommendation');
        explorationEditorSettingsTab.setCategory('Algorithm');
        explorationEditorSettingsTab.setObjective(
          'To display recommended exploration');
        explorationEditorPage.navigateToMainTab();
        explorationEditorPage.saveChanges();
        workflow.publishExploration();
      });

    // Play-test the exploration and visit the recommended exploration
    libraryPage.get();
    libraryPage.findExploration('Exploration with Recommendation');
    libraryPage.playExploration('Exploration with Recommendation');
    var recommendedExplorationTile = element(
      by.css('.protractor-test-exp-summary-tile-title'));
    expect(recommendedExplorationTile.getText())
      .toEqual('Recommended Exploration 1');
    recommendedExplorationTile.click();
    explorationPlayerPage.expectExplorationNameToBe(
      'Recommended Exploration 1');
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
    libraryPage.findExploration(EXPLORATION_RATINGTEST);
    libraryPage.playExploration(EXPLORATION_RATINGTEST);
    explorationPlayerPage.expectExplorationNameToBe(explorationName);
    explorationPlayerPage.rateExploration(ratingValue);
    users.logout();
  };

  it('should display ratings on exploration when minimum ratings have been ' +
     'submitted', function() {
    users.createUser('user11@explorationRating.com', 'user11Rating');
    // Create a test exploration.
    users.login('user11@explorationRating.com');
    workflow.createAndPublishExploration(
      EXPLORATION_RATINGTEST, CATEGORY_BUSINESS,
      'this is an objective', LANGUAGE_ENGLISH);
    users.logout();

    // Create test users, play exploration and review them after completion.
    for (var i = 0; i < MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS - 1; i++) {
      var userEmail = 'NoDisplay' + i + '@explorationRating.com';
      var username = 'NoDisplay' + i;
      addRating(userEmail, username, EXPLORATION_RATINGTEST, 4);
    }

    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_RATINGTEST);
    libraryPage.expectExplorationRatingToEqual(EXPLORATION_RATINGTEST, 'N/A');

    var userEmail = 'Display@explorationRating.com';
    var username = 'Display';
    addRating(userEmail, username, EXPLORATION_RATINGTEST, 4);

    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_RATINGTEST);
    libraryPage.expectExplorationRatingToEqual(EXPLORATION_RATINGTEST, '4.0');

    libraryPage.playExploration(EXPLORATION_RATINGTEST);
    explorationPlayerPage.expectExplorationRatingOnInformationCardToEqual(
      '4.0');
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
