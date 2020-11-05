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
 * @fileoverview End-to-end tests for rich-text components and interactions.
 */

var action = require('../protractor_utils/action.js');
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var interactions = require('../../../extensions/interactions/protractor.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');
var action = require('../protractor_utils/action.js');

var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('rich-text components', function() {
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should display correctly', async function() {
    await users.createAndLoginUser(
      'user@richTextComponents.com', 'userRichTextComponents');

    await workflow.createExploration();

    await explorationEditorMainTab.setContent(async function(richTextEditor) {
      await richTextEditor.appendBoldText('bold');
      await richTextEditor.appendPlainText(' ');
      // TODO(Jacob): Add test for image RTE component.
      await richTextEditor.addRteComponent('Link', 'http://google.com/', true);
      await richTextEditor.addRteComponent(
        'Video', 'M7lc1UVf-VE', 10, 100, false);
      // We put these last as otherwise Protractor sometimes fails to scroll to
      // and click on them.
      await richTextEditor.addRteComponent(
        'Collapsible', 'title', await forms.toRichText('inner'));
      await richTextEditor.addRteComponent('Tabs', [{
        title: 'title 1',
        content: await forms.toRichText('contents 1')
      }, {
        title: 'title 1',
        content: await forms.toRichText('contents 2')
      }]);
    });

    await explorationEditorPage.navigateToPreviewTab();

    await explorationPlayerPage.expectContentToMatch(
      async function(richTextChecker) {
        await richTextChecker.readBoldText('bold');
        await richTextChecker.readPlainText(' ');
        await richTextChecker.readRteComponent(
          'Link', 'http://google.com/', true);
        await richTextChecker.readRteComponent(
          'Video', 'M7lc1UVf-VE', 10, 100, false);
        await richTextChecker.readRteComponent(
          'Collapsible', 'title', await forms.toRichText('inner'));
        await richTextChecker.readRteComponent('Tabs', [{
          title: 'title 1',
          content: await forms.toRichText('contents 1')
        }, {
          title: 'title 1',
          content: await forms.toRichText('contents 2')
        }]);
      });

    await explorationEditorPage.discardChanges();
    await users.logout();
  });

  // TODO(Jacob): Add in a test for the use of rich text inside collapsibles
  // and tabs. Previous attempts at such a test intermittently fail with the
  // rich-text checker unable to read the formatted text.

  afterEach(async function() {
    await general.checkForConsoleErrors([
      // TODO(pranavsid98): This error is caused by the upgrade from Chrome 60
      // to Chrome 61. Chrome version at time of recording this is 61.0.3163.
      'chrome-extension://invalid/ - Failed to load resource: net::ERR_FAILED',
    ]);
  });
});


describe('Interactions', function() {
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  var libraryPage = null;

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    libraryPage = new LibraryPage.LibraryPage();
  });

  it('should pass their own test suites', async function() {
    await users.createUser('user@interactions.com', 'userInteractions');
    await users.login('user@interactions.com');
    await workflow.createExploration();
    await explorationEditorMainTab.setStateName('first');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('some content'));

    var defaultOutcomeSet = false;

    for (var interactionId in interactions.INTERACTIONS) {
      var interaction = interactions.INTERACTIONS[interactionId];

      for (var i = 0; i < interaction.testSuite.length; i++) {
        var test = interaction.testSuite[i];

        await explorationEditorMainTab.setInteraction.apply(
          null, [interactionId].concat(test.interactionArguments));

        // Delete any leftover rules that may remain from previous tests of the
        // same interaction, so they won't interfere with the current test.
        var deleteResponseButton = element(by.css(
          '.protractor-test-delete-response'));
        var confirmDeleteResponseButton = element(by.css(
          '.protractor-test-confirm-delete-response'));
        if (await deleteResponseButton.isPresent()) {
          await action.click('Delete Response button', deleteResponseButton);
          await action.click(
            'Confirm Delete Response button', confirmDeleteResponseButton);
        }

        await explorationEditorMainTab.addResponse.apply(
          explorationEditorMainTab, [
            interactionId, await forms.toRichText('yes'), null, false
          ].concat(test.ruleArguments));

        if (!defaultOutcomeSet) {
          // The default outcome will be preserved for subsequent tests.
          var responseEditor = (
            await explorationEditorMainTab.getResponseEditor('default'));
          await responseEditor.setFeedback(await forms.toRichText('no'));
          responseEditor = await explorationEditorMainTab.getResponseEditor(
            'default');
          await responseEditor.setDestination('(try again)', false, null);
          defaultOutcomeSet = true;
        }

        await explorationEditorPage.navigateToPreviewTab();
        await explorationPlayerPage.expectInteractionToMatch.apply(
          null, [interactionId].concat(test.expectedInteractionDetails));

        for (var j = 0; j < test.wrongAnswers.length; j++) {
          await explorationPlayerPage.submitAnswer(
            interactionId, test.wrongAnswers[j]);
          await explorationPlayerPage.expectLatestFeedbackToMatch(
            await forms.toRichText('no'));
        }
        // Dismiss conversation help card.
        var clearHelpcardButton = element(by.css(
          '.protractor-test-close-help-card-button'));
        var helpCard = element(
          by.css('.protractor-test-conversation-skin-help-card'));
        var isPresent = await clearHelpcardButton.isPresent();
        if (isPresent) {
          await action.click('Clear Helper Button', clearHelpcardButton);
          await waitFor.invisibilityOf(
            helpCard, 'Help Card takes too long to disappear.');
        }

        for (var j = 0; j < test.correctAnswers.length; j++) {
          await explorationPlayerPage.submitAnswer(
            interactionId, test.correctAnswers[j]);
          await explorationPlayerPage.expectLatestFeedbackToMatch(
            await forms.toRichText('yes'));
        }
        await explorationEditorPage.navigateToMainTab();
        await explorationEditorMainTab.deleteInteraction();
      }
    }
    await explorationEditorPage.discardChanges();
    await users.logout();
  });

  it('should publish and play exploration successfully', async function() {
    /*
     * This suite should be expanded as new interaction's e2e utility is added.
     */
    await users.createAndLoginUser(
      'explorationEditor@interactions.com', 'explorationEditor');
    await workflow.createExploration();

    await explorationEditorMainTab.setStateName('Graph');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'Draw a complete graph with the given vertices.'));
    var graphDictForInput = {
      vertices: [[277, 77], [248, 179], [405, 144]]
    };
    await explorationEditorMainTab.setInteraction(
      'GraphInput', graphDictForInput);
    var graphDictForResponse = {
      edges: [[0, 1], [1, 2], [0, 2]],
      vertices: [[277, 77], [248, 179], [405, 144]]
    };
    await explorationEditorMainTab.addResponse(
      'GraphInput', await forms.toRichText('Good job!'), 'MathExp',
      true, 'IsIsomorphicTo', graphDictForResponse);
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText(
      'A complete graph is a graph in which each pair of graph vertices is ' +
      'connected by an edge.'));

    await explorationEditorMainTab.moveToState('MathExp');
    await explorationEditorMainTab.setContent(async function(richTextEditor) {
      await richTextEditor.appendPlainText(
        'Please simplify the following expression: 16x^{12}/4x^2');
    });

    await explorationEditorMainTab.setInteraction(
      'AlgebraicExpressionInput', ['x']);
    // Proper Latex styling for rule spec is required.
    await explorationEditorMainTab.addResponse(
      'AlgebraicExpressionInput', await forms.toRichText('Good job!'), 'End',
      true, 'IsEquivalentTo', '(16(x^12))/4x^2');
    // Expecting answer to be 4x^10.
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText(
      'A simplified expression should be smaller than the original.'));

    await explorationEditorMainTab.moveToState('End');
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle('Regression Test Exploration');
    await explorationEditorSettingsTab.setObjective(
      'To publish and play this exploration');
    await explorationEditorSettingsTab.setCategory('Logic');
    await explorationEditorPage.saveChanges();
    await workflow.publishExploration();
    await users.logout();

    await users.createAndLoginUser(
      'graphLearner@interactions.com', 'graphLearner');
    await libraryPage.get();
    await libraryPage.findExploration('Regression Test Exploration');
    await libraryPage.playExploration('Regression Test Exploration');
    await explorationPlayerPage.expectExplorationNameToBe(
      'Regression Test Exploration');

    // Play Graph Input interaction.
    await explorationPlayerPage.expectContentToMatch(await forms.toRichText(
      'Draw a complete graph with the given vertices.'));
    var graphDictForAnswer = {
      edges: [[1, 2], [1, 0], [0, 2]]
    };
    await explorationPlayerPage.submitAnswer('GraphInput', graphDictForAnswer);
    await explorationPlayerPage.expectLatestFeedbackToMatch(
      await forms.toRichText('Good job!'));
    await explorationPlayerPage.clickThroughToNextCard();

    // Play Math Expression Input interaction.
    await explorationPlayerPage.submitAnswer(
      'AlgebraicExpressionInput', '4 * x^10');
    await explorationPlayerPage.expectLatestFeedbackToMatch(
      await forms.toRichText('Good job!'));
    await explorationPlayerPage.clickThroughToNextCard();

    await explorationPlayerPage.expectExplorationToBeOver();
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
