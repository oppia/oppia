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

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var interactions = require('../../../extensions/interactions/protractor.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('rich-text components', function() {
  var explorationEditorPage = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should display correctly', function() {
    users.createUser('user@richTextComponents.com', 'userRichTextComponents');
    users.login('user@richTextComponents.com');

    workflow.createExploration();

    explorationEditorMainTab.setContent(function(richTextEditor) {
      richTextEditor.appendBoldText('bold');
      richTextEditor.appendPlainText(' ');
      // TODO (Jacob) add test for image RTE component
      richTextEditor.addRteComponent('Link', 'http://google.com/', true);
      richTextEditor.addRteComponent('Math', 'abc');
      richTextEditor.addRteComponent('Video', 'M7lc1UVf-VE', 10, 100, false);
      // We put these last as otherwise Protractor sometimes fails to scroll to
      // and click on them.
      richTextEditor.addRteComponent(
        'Collapsible', 'title', forms.toRichText('inner'));
      richTextEditor.addRteComponent('Tabs', [{
        title: 'title 1',
        content: forms.toRichText('contents 1')
      }, {
        title: 'title 1',
        content: forms.toRichText('contents 2')
      }]);
    });

    explorationEditorPage.navigateToPreviewTab();

    explorationPlayerPage.expectContentToMatch(function(richTextChecker) {
      richTextChecker.readBoldText('bold');
      richTextChecker.readPlainText(' ');
      richTextChecker.readRteComponent('Link', 'http://google.com/', true);
      richTextChecker.readRteComponent('Math', 'abc');
      richTextChecker.readRteComponent('Video', 'M7lc1UVf-VE', 10, 100, false);
      richTextChecker.readRteComponent(
        'Collapsible', 'title', forms.toRichText('inner'));
      richTextChecker.readRteComponent('Tabs', [{
        title: 'title 1',
        content: forms.toRichText('contents 1')
      }, {
        title: 'title 1',
        content: forms.toRichText('contents 2')
      }]);
    });

    explorationEditorPage.discardChanges();
    users.logout();
  });

  // TODO (Jacob): Add in a test for the use of rich text inside collapsibles
  // and tabs. Previous attempts at such a test intermittently fail with the
  // rich-text checker unable to read the formatted text.

  afterEach(function() {
    general.checkForConsoleErrors([
      // TODO (@pranavsid98) This error is caused by the upgrade from Chrome 60
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

  it('should pass their own test suites', function() {
    users.createUser('user@interactions.com', 'userInteractions');
    users.login('user@interactions.com');
    workflow.createExploration();
    explorationEditorMainTab.setStateName('first');
    explorationEditorMainTab.setContent(forms.toRichText('some content'));

    var defaultOutcomeSet = false;

    for (var interactionId in interactions.INTERACTIONS) {
      var interaction = interactions.INTERACTIONS[interactionId];
      for (var i = 0; i < interaction.testSuite.length; i++) {
        var test = interaction.testSuite[i];

        explorationEditorMainTab.setInteraction.apply(
          null, [interactionId].concat(test.interactionArguments));

        explorationEditorMainTab.addResponse.apply(null, [
          interactionId, forms.toRichText('yes'), null, false
        ].concat(test.ruleArguments));

        if (!defaultOutcomeSet) {
          // The default outcome will be preserved for subsequent tests.
          explorationEditorMainTab.getResponseEditor('default')
            .setFeedback(forms.toRichText('no'));
          explorationEditorMainTab.getResponseEditor('default')
            .setDestination('(try again)', false, null);
          defaultOutcomeSet = true;
        }

        explorationEditorPage.navigateToPreviewTab();
        explorationPlayerPage.expectInteractionToMatch.apply(
          null, [interactionId].concat(test.expectedInteractionDetails));
        for (var j = 0; j < test.wrongAnswers.length; j++) {
          explorationPlayerPage.submitAnswer(
            interactionId, test.wrongAnswers[j]);
          explorationPlayerPage.expectLatestFeedbackToMatch(
            forms.toRichText('no'));
        }
        // Dismiss conversation help card.
        var clearHelpcardButton = element(by.css(
          '.protractor-test-close-help-card-button'));
        clearHelpcardButton.isPresent().then(function(isPresent) {
          if (isPresent) {
            clearHelpcardButton.click();
          }
        });
        for (var j = 0; j < test.correctAnswers.length; j++) {
          explorationPlayerPage.submitAnswer(
            interactionId, test.correctAnswers[j]);
          explorationPlayerPage.expectLatestFeedbackToMatch(
            forms.toRichText('yes'));
        }
        explorationEditorPage.navigateToMainTab();
        explorationEditorMainTab.deleteInteraction();
      }
    }
    explorationEditorPage.discardChanges();
    users.logout();
  });

  it('publish exploration with graph interaction successfully', function() {
    users.createAndLoginUser('graphEditor@interactions.com', 'graphEditor');
    workflow.createExploration();
    explorationEditorMainTab.setStateName('first');
    explorationEditorMainTab.setContent(forms.toRichText(
      'Draw a complete graph with the given vertices.'));
    var graphDict = {
      vertices: [[277, 77], [248, 179], [405, 144]]
    };
    explorationEditorMainTab.setInteraction('GraphInput', graphDict);
    graphDict = {
      edges: [[0, 1], [1, 2], [0, 2]],
      vertices: [[277, 77], [248, 179], [405, 144]]
    };
    explorationEditorMainTab.addResponse('GraphInput',
      forms.toRichText('Good job!'), 'end', true, 'IsIsomorphicTo', graphDict);
    var responseEditor = explorationEditorMainTab.getResponseEditor('default');
    responseEditor.setFeedback(forms.toRichText(
      'A complete graph is a graph in which each pair of graph vertices is ' +
      'connected by an edge.'));

    explorationEditorMainTab.moveToState('end');
    explorationEditorMainTab.setContent(forms.toRichText(
      'Congratulations, you have finished!'));
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle('Graph Exploration');
    explorationEditorSettingsTab.setObjective(
      'To publish and play this exploration');
    explorationEditorSettingsTab.setCategory('Graph Theory');
    explorationEditorPage.saveChanges();
    workflow.publishExploration();
    users.logout();

    users.createAndLoginUser('graphLearner@interactions.com', 'graphLearner');
    libraryPage.get();
    libraryPage.findExploration('Graph Exploration');
    libraryPage.playExploration('Graph Exploration');
    explorationPlayerPage.expectExplorationNameToBe('Graph Exploration');
    explorationPlayerPage.expectContentToMatch(forms.toRichText(
      'Draw a complete graph with the given vertices.'));
    graphDict = {
      edges: [[1, 2], [1, 0], [0, 2]]
    };
    explorationPlayerPage.submitAnswer('GraphInput', graphDict);
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.expectExplorationToBeOver();
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
