// Copyright 2022 The Oppia Authors. All Rights Reserved.
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

var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');
var action = require('../webdriverio_utils/action.js');

var ExplorationEditorPage = require('../webdriverio_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage = require('../webdriverio_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');

describe('Full exploration editor', function () {
  var explorationPlayerPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var libraryPage = null;

  beforeAll(function () {
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    libraryPage = new LibraryPage.LibraryPage();
  });

  it('should walk through the tutorial when user repeatedly clicks Next', async function () {
    await users.createUser(
      'userTutorial@stateEditor.com',
      'userTutorialStateEditor'
    );
    await users.login('userTutorial@stateEditor.com');
    await workflow.createExplorationAndStartTutorial(false);
    await explorationEditorMainTab.startTutorial();
    await explorationEditorMainTab.playTutorial();
    await explorationEditorMainTab.finishTutorial();
    await users.logout();
  });

  it('should generate warning message if card height limit is exceeded', async function () {
    await users.createUser('user@heightWarning.com', 'userHeightWarning');
    await users.login('user@heightWarning.com');

    await workflow.createExploration(true);

    var postTutorialPopover = $('.joyride .popover-content');
    var stateEditButton = $('.e2e-test-edit-content-pencil-button');
    await waitFor.invisibilityOf(
      postTutorialPopover,
      'Post-tutorial popover does not disappear.'
    );
    await action.click('State Edit Button', stateEditButton);
    var stateEditorTag = $('.e2e-test-state-content-editor');
    var stateContentEditor = stateEditorTag.$('.e2e-test-state-content-editor');
    await waitFor.visibilityOf(
      stateContentEditor,
      'stateContentEditor taking too long to appear to set content'
    );
    var richTextEditor = await forms.RichTextEditor(stateContentEditor);

    var content = 'line1\n\n\n\nline2\n\n\n\nline3\n\n\nline4';

    var heightMessage = $('.e2e-test-card-height-limit-warning');
    await richTextEditor.appendPlainText(content);
    expect(await heightMessage.isExisting()).toBe(false);

    await richTextEditor.appendPlainText('\n\n\nline5');
    await waitFor.visibilityOf(
      heightMessage,
      'Card height limit message not displayed'
    );

    await richTextEditor.appendPlainText('\b\b\b\b\b\b\b\b');
    expect(await heightMessage.isExisting()).toBe(false);

    await richTextEditor.appendPlainText('\n\n\nline5');
    await waitFor.visibilityOf(
      heightMessage,
      'Card height limit message not displayed'
    );

    var hideHeightWarningIcon = $('.e2e-test-hide-card-height-warning-icon');
    await action.click('Hide Height Warning icon', hideHeightWarningIcon);
    await waitFor.invisibilityOf(
      heightMessage,
      'Height message taking too long to disappear.'
    );

    await users.logout();
  });

  it(
    'should handle discarding changes, navigation, deleting states, ' +
      'changing the first state, displaying content, deleting responses and ' +
      'switching to preview mode',
    async function () {
      await users.createUser(
        'user5@editorAndPlayer.com',
        'user5EditorAndPlayer'
      );
      await users.login('user5@editorAndPlayer.com');

      await workflow.createExploration(true);
      await explorationEditorMainTab.setStateName('card1');
      await explorationEditorMainTab.expectCurrentStateToBe('card1');
      await explorationEditorMainTab.setContent(
        await forms.toRichText('card1 content'),
        true
      );
      await explorationEditorMainTab.setInteraction('TextInput');
      await (
        await explorationEditorMainTab.getResponseEditor('default')
      ).setDestination('final card', true, null);
      await (
        await explorationEditorMainTab.getResponseEditor('default')
      ).setDestination('card2', true, null);
      await explorationEditorMainTab.moveToState('card2');
      // NOTE: we must move to the state before checking state names to avoid
      // inexplicable failures of the protractor utility that reads state names
      // (the user-visible names are fine either way). See issue 732 for more.
      await explorationEditorMainTab.expectStateNamesToBe([
        'final card',
        'card1',
        'card2',
      ]);
      await explorationEditorMainTab.setInteraction('EndExploration');

      // Check discarding of changes.
      await explorationEditorPage.discardChanges();
      await explorationEditorMainTab.expectCurrentStateToBe(
        general.FIRST_STATE_DEFAULT_NAME
      );
      await explorationEditorMainTab.setStateName('first');
      await explorationEditorMainTab.expectCurrentStateToBe('first');
      await explorationEditorMainTab.setContent(
        await forms.toRichText('card1 content'),
        true
      );

      // Check deletion of states and changing the first state.
      await explorationEditorMainTab.setInteraction('TextInput');
      await (
        await explorationEditorMainTab.getResponseEditor('default')
      ).setDestination('final card', true, null);
      await (
        await explorationEditorMainTab.getResponseEditor('default')
      ).setDestination('second', true, null);
      await explorationEditorMainTab.moveToState('second');
      await explorationEditorMainTab.expectStateNamesToBe([
        'final card',
        'first',
        'second',
      ]);
      await explorationEditorMainTab.expectCurrentStateToBe('second');
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.expectAvailableFirstStatesToBe([
        'final card',
        'first',
        'second',
      ]);
      await explorationEditorSettingsTab.setFirstState('second');
      await explorationEditorPage.navigateToMainTab();
      await explorationEditorMainTab.moveToState('first');
      await explorationEditorMainTab.deleteState('first');
      await explorationEditorMainTab.expectCurrentStateToBe('second');
      await explorationEditorMainTab.expectStateNamesToBe([
        'final card',
        'second',
      ]);

      // Check behaviour of the back button.
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.setObjective('do some stuff here');
      await explorationEditorPage.navigateToMainTab();
      var explorationId = await general.getExplorationIdFromEditor();
      expect(await browser.getUrl()).toEqual(
        general.SERVER_URL_PREFIX +
          general.EDITOR_URL_SLICE +
          explorationId +
          '#/gui/second'
      );
      await browser.back();
      expect(await browser.getUrl()).toEqual(
        general.SERVER_URL_PREFIX +
          general.EDITOR_URL_SLICE +
          explorationId +
          '#/settings'
      );
      await browser.back();
      expect(await browser.getUrl()).toEqual(
        general.SERVER_URL_PREFIX +
          general.EDITOR_URL_SLICE +
          explorationId +
          '#/gui/second'
      );

      // Refreshing to prevent stale elements after backing from previous page.
      await browser.refresh();
      await explorationEditorMainTab.setContent(async function (
        richTextEditor
      ) {
        await richTextEditor.appendItalicText('Welcome');
      }, true);
      await explorationEditorMainTab.expectContentToMatch(
        async function (richTextChecker) {
          await richTextChecker.readItalicText('Welcome');
        }
      );
      await explorationEditorMainTab.setInteraction('NumericInput');
      // Check display of content & interaction in the editor.
      await explorationEditorMainTab.expectInteractionToMatch('NumericInput');

      // Check deletion of groups.
      var responseEditor =
        await explorationEditorMainTab.getResponseEditor('default');
      await responseEditor.setFeedback(await forms.toRichText('Farewell'));
      await responseEditor.setDestination(null, false, null);
      await responseEditor.expectAvailableDestinationsToBe([
        'second',
        'final card',
      ]);
      await responseEditor.setDestination('final card', false, null);
      await responseEditor.expectAvailableDestinationsToBe([
        'second',
        'final card',
      ]);
      await explorationEditorMainTab.addResponse(
        'NumericInput',
        null,
        'final card',
        false,
        'IsGreaterThan',
        2
      );
      await (
        await explorationEditorMainTab.getResponseEditor(0)
      ).deleteResponse();

      // Setup a terminating state.
      await explorationEditorMainTab.moveToState('final card');
      await explorationEditorMainTab.setInteraction('EndExploration');

      // Check that preview/editor switch doesn't change state.
      await explorationEditorPage.navigateToPreviewTab();
      await explorationPlayerPage.expectExplorationToBeOver();
      await explorationEditorPage.navigateToMainTab();
      await explorationEditorMainTab.expectCurrentStateToBe('final card');
      await explorationEditorMainTab.moveToState('second');

      // Check editor preview tab.
      await explorationEditorPage.navigateToPreviewTab();
      await explorationPlayerPage.expectContentToMatch(
        async function (richTextEditor) {
          await richTextEditor.readItalicText('Welcome');
        }
      );
      await explorationPlayerPage.expectInteractionToMatch('NumericInput');
      await explorationPlayerPage.submitAnswer('NumericInput', 6);
      // This checks the previously-deleted group no longer applies.
      await explorationPlayerPage.expectLatestFeedbackToMatch(
        await forms.toRichText('Farewell')
      );
      await explorationPlayerPage.clickThroughToNextCard();
      await explorationPlayerPage.expectExplorationToBeOver();
      await explorationEditorPage.discardChanges();
      await users.logout();
    }
  );

  it(
    'should handle multiple rules in an answer group and also disallow ' +
      'editing of a read-only exploration',
    async function () {
      await users.createUser(
        'user6@editorAndPlayer.com',
        'user6EditorAndPlayer'
      );
      await users.createUser(
        'user7@editorAndPlayer.com',
        'user7EditorAndPlayer'
      );
      await users.login('user6@editorAndPlayer.com');

      await workflow.createExploration(true);

      // Create an exploration with multiple groups.
      await explorationEditorMainTab.setStateName('first card');
      await explorationEditorMainTab.setContent(
        await forms.toRichText('How are you feeling?'),
        true
      );
      await explorationEditorMainTab.setInteraction('TextInput');
      await explorationEditorMainTab.addResponse(
        'TextInput',
        await forms.toRichText('You must be happy!'),
        null,
        false,
        'Equals',
        ['happy']
      );
      await explorationEditorMainTab.addResponse(
        'TextInput',
        await forms.toRichText('No being sad!'),
        null,
        false,
        'Contains',
        ['sad']
      );
      var responseEditor =
        await explorationEditorMainTab.getResponseEditor('default');
      await responseEditor.setFeedback(
        await forms.toRichText('Okay, now this is just becoming annoying.')
      );
      await responseEditor.setDestination('final card', true, null);

      // Now, set multiple rules to a single answer group.
      // Function scrollToTop is added to prevent top response from being
      // hidden and become easily clickable.
      await general.scrollToTop();
      await (
        await explorationEditorMainTab.getResponseEditor(0)
      ).addRule('TextInput', 'Contains', ['meh', 'okay']);

      // Ensure that the only rule for this group cannot be deleted.
      await (
        await explorationEditorMainTab.getResponseEditor(1)
      ).expectCannotDeleteRule(0);

      // Setup a terminating state.
      await explorationEditorMainTab.moveToState('final card');
      await explorationEditorMainTab.setInteraction('EndExploration');

      // Save.
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.setTitle('Testing multiple rules');
      await explorationEditorSettingsTab.setCategory('Algebra');
      await explorationEditorSettingsTab.setObjective('To assess happiness.');
      await explorationEditorSettingsTab.openAndClosePreviewSummaryTile();
      await explorationEditorPage.saveChanges();
      await workflow.publishExploration();

      // Login as another user and verify that the exploration editor does not
      // allow the second user to modify the exploration.
      await users.logout();
      await users.login('user7@editorAndPlayer.com');
      // 2nd user finds an exploration, plays it and then try to access
      // its editor via /create/explorationId.
      await libraryPage.get();
      await libraryPage.findExploration('Testing multiple rules');
      await libraryPage.playExploration('Testing multiple rules');
      var explorationId = await general.getExplorationIdFromPlayer();
      await browser.url(
        general.SERVER_URL_PREFIX + general.EDITOR_URL_SLICE + explorationId
      );
      await explorationEditorMainTab.exitTutorial();
      // Verify nothing can change with this user.
      await explorationEditorMainTab.expectInteractionToMatch('TextInput');
      await explorationEditorMainTab.expectCannotDeleteInteraction();
      await explorationEditorMainTab.expectCannotAddResponse();
      await explorationEditorPage.expectCannotSaveChanges();

      // Check answer group 1.
      responseEditor = await explorationEditorMainTab.getResponseEditor(0);
      await responseEditor.expectCannotSetFeedback();
      await responseEditor.expectCannotSetDestination();
      await responseEditor.expectCannotDeleteResponse();
      await responseEditor.expectCannotAddRule();
      await responseEditor.expectCannotDeleteRule(0);
      await responseEditor.expectCannotDeleteRule(1);

      // Check answer group 2.
      responseEditor = await explorationEditorMainTab.getResponseEditor(1);
      await responseEditor.expectCannotSetFeedback();
      await responseEditor.expectCannotSetDestination();
      await responseEditor.expectCannotDeleteResponse();
      await responseEditor.expectCannotAddRule();
      await responseEditor.expectCannotDeleteRule(0);

      // Check default outcome.
      responseEditor =
        await explorationEditorMainTab.getResponseEditor('default');
      await responseEditor.expectCannotSetFeedback();
      await responseEditor.expectCannotSetDestination();

      // Check editor preview tab to verify multiple rules are working.
      await general.moveToPlayer();
      await explorationPlayerPage.expectContentToMatch(
        await forms.toRichText('How are you feeling?')
      );
      await explorationPlayerPage.expectInteractionToMatch('TextInput');

      await explorationPlayerPage.submitAnswer(
        'TextInput',
        "Fine...I'm doing okay"
      );
      await explorationPlayerPage.expectLatestFeedbackToMatch(
        await forms.toRichText('You must be happy!')
      );

      await explorationPlayerPage.submitAnswer('TextInput', "meh, I'm so-so");
      await explorationPlayerPage.expectLatestFeedbackToMatch(
        await forms.toRichText('You must be happy!')
      );

      // Finish the exploration.
      await explorationPlayerPage.submitAnswer('TextInput', 'Whatever...');

      await explorationPlayerPage.expectLatestFeedbackToMatch(
        await forms.toRichText('Okay, now this is just becoming annoying.')
      );
      await explorationPlayerPage.clickThroughToNextCard();
      await explorationPlayerPage.expectExplorationToBeOver();
      await users.logout();
    }
  );

  it('should delete interactions cleanly', async function () {
    await users.createUser('user8@editorAndPlayer.com', 'user8EditorAndPlayer');
    await users.login('user8@editorAndPlayer.com');

    await workflow.createExploration(true);
    await explorationEditorMainTab.setContent(
      await forms.toRichText('How are you feeling?')
    );
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorMainTab.deleteInteraction();
    await explorationEditorPage.navigateToPreviewTab();
    await explorationEditorPage.waitForPreviewTabToLoad();
    await explorationEditorPage.navigateToMainTab();
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput',
      await forms.toRichText('Happy!'),
      null,
      false,
      'Equals',
      ['happy']
    );
    await explorationEditorMainTab.expectInteractionToMatch('TextInput');
    await explorationEditorPage.saveChanges();
    await explorationEditorMainTab.deleteInteraction();
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorMainTab.expectInteractionToMatch('EndExploration');
    await users.logout();
  });

  it(
    'should merge changes when the changes are not conflicting ' +
      'and the frontend version of an exploration is not equal to ' +
      'the backend version',
    async function () {
      await users.createUser('user9@editor.com', 'user9Editor');
      await users.createUser('user10@editor.com', 'user10Editor');

      // Create an exploration as user user9Editor with title, category, and
      // objective set and add user user10Editor as a collaborator.
      await users.login('user9@editor.com');
      await workflow.createExploration(true);
      var explorationId = await general.getExplorationIdFromEditor();
      await explorationEditorMainTab.setStateName('first card');
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.setTitle('Testing lost changes modal');
      await explorationEditorSettingsTab.setCategory('Algebra');
      await explorationEditorSettingsTab.setObjective('To assess happiness.');
      await explorationEditorSettingsTab.openAndClosePreviewSummaryTile();
      await explorationEditorPage.saveChanges();
      await workflow.addExplorationManager('user10Editor');
      await explorationEditorPage.navigateToMainTab();

      // Add a content change and does not save the draft.
      await explorationEditorMainTab.setContent(async function (
        richTextEditor
      ) {
        await richTextEditor.appendPlainText('How are you feeling?');
      }, true);
      await action.waitForAutosave();
      await users.logout();

      // Login as collaborator and make changes in title and objective which
      // do not conflict with the user user9editor's unsaved content changes.
      await users.login('user10@editor.com');
      await general.openEditor(explorationId, true);
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.setTitle('Title Changed');
      await explorationEditorSettingsTab.setObjective('Objective Changed.');
      await explorationEditorPage.saveChanges();
      await users.logout();

      // Open the exploration again from the first user's account and try saving
      // the unsaved changes. They should be saved.
      await users.login('user9@editor.com');
      await general.openEditor(explorationId, false);
      await waitFor.pageToFullyLoad();
      var lostChangesModal = $('.e2e-test-lost-changes-modal');
      expect(await lostChangesModal.isExisting()).toBe(false);
      await explorationEditorPage.saveChanges();
      await explorationEditorMainTab.expectContentToMatch(
        async function (richTextChecker) {
          await richTextChecker.readPlainText('How are you feeling?');
        }
      );
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorPage.verifyExplorationSettingFields(
        'Title Changed',
        'Algebra',
        'Objective Changed.',
        'English',
        []
      );
      await users.logout();
    }
  );

  afterEach(async function () {
    await general.checkForConsoleErrors([]);
  });
});
