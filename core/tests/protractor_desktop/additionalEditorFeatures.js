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
 * @fileoverview End-to-end tests for additional features of the exploration
 * editor and player. Additional features include those features without which
 * an exploration can still be published. These include hints, solutions,
 * refresher explorations, state parameters, etc.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');


var AdminPage = require('../protractor_utils/AdminPage.js');
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
  var adminPage = null;
  var collectionEditorPage = null;
  var explorationPlayerPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var creatorDashboardPage = null;
  var libraryPage = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    libraryPage = new LibraryPage.LibraryPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();

    users.createAndLoginAdminUser('superUser@test.com', 'superUser');
    // TODO(#7569): Change this test to work with the improvements tab.
    adminPage.editConfigProperty(
      'Exposes the Improvements Tab for creators in the exploration editor',
      'Boolean', (elem) => elem.setValue(false));
    users.logout();
  });

  it('should walk through the tutorial when user repeatedly clicks Next',
    function() {
      users.createUser(
        'userTutorial@stateEditor.com', 'userTutorialStateEditor');
      users.login('userTutorial@stateEditor.com');

      workflow.createExplorationAndStartTutorial();
      explorationEditorMainTab.startTutorial();
      explorationEditorMainTab.playTutorial();
      explorationEditorMainTab.finishTutorial();
      users.logout();
    }
  );

  it('should generate warning message if card height limit is exceeded ',
    function() {
      users.createUser('user@heightWarning.com', 'userHeightWarning');
      users.login('user@heightWarning.com');

      workflow.createExploration();

      var postTutorialPopover = element(by.css('.popover-content'));
      var stateEditContent = element(by.css('.protractor-test-edit-content'));
      waitFor.invisibilityOf(
        postTutorialPopover, 'Post-tutorial popover does not disappear.');
      waitFor.elementToBeClickable(
        stateEditContent,
        'stateEditContent taking too long to appear to set content');
      stateEditContent.click();
      var stateEditorTag = element(by.tagName('state-content-editor'));
      var stateContentEditor = stateEditorTag.element(
        by.css('.protractor-test-state-content-editor'));
      waitFor.visibilityOf(
        stateContentEditor,
        'stateContentEditor taking too long to appear to set content');
      var richTextEditor = forms.RichTextEditor(stateContentEditor);

      var content = 'line1\n\n\n\nline2\n\n\n\nline3\n\n\nline4';

      var heightMessage = element(by.css('.oppia-card-height-limit-warning'));

      richTextEditor.appendPlainText(content);
      expect(heightMessage.isPresent()).toBe(false);

      richTextEditor.appendPlainText('\n\n\nline5');
      waitFor.visibilityOf(
        heightMessage, 'Card height limit message not displayed');

      richTextEditor.appendPlainText('\b\b\b\b\b\b\b\b');
      expect(heightMessage.isPresent()).toBe(false);

      richTextEditor.appendPlainText('\n\n\nline5');
      waitFor.visibilityOf(
        heightMessage, 'Card height limit message not displayed');

      element(by.css('.oppia-hide-card-height-warning-icon')).click();
      expect(heightMessage.isPresent()).toBe(false);

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
    browser.driver.navigate().refresh();
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

    explorationPlayerPage.submitAnswer('TextInput', 'Fine...I\'m doing okay');
    explorationPlayerPage.expectLatestFeedbackToMatch(
      forms.toRichText('You must be happy!'));

    explorationPlayerPage.submitAnswer('TextInput', 'meh, I\'m so-so');
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
    explorationEditorPage.navigateToPreviewTab();
    explorationEditorPage.navigateToMainTab();
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

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
