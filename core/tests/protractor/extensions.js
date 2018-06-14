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

var editor = require('../protractor_utils/editor.js');
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var interactions = require('../../../extensions/interactions/protractor.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');

describe('rich-text components', function() {
  var explorationPlayerPage = null;

  beforeEach(function() {
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should display correctly', function() {
    users.createUser('user@richTextComponents.com', 'userRichTextComponents');
    users.login('user@richTextComponents.com');

    workflow.createExploration();

    editor.setContent(function(richTextEditor) {
      richTextEditor.appendBoldText('bold');
      richTextEditor.appendPlainText(' ');
      // TODO (Jacob) add test for image RTE component
      richTextEditor.addRteComponent('Link', 'http://google.com/', true);
      richTextEditor.addRteComponent('Math', 'abc');
      richTextEditor.addRteComponent('Video', 'ANeHmk22a6Q', 10, 100, false);
      // We put these last as otherwise Protractor sometimes fails to scroll to
      // and click on them.
      /* richTextEditor.addRteComponent(
        'Collapsible', 'title', forms.toRichText('inner'));
      richTextEditor.addRteComponent('Tabs', [{
        title: 'title 1',
        content: forms.toRichText('contents 1')
      }, {
        title: 'title 1',
        content: forms.toRichText('contents 2')
      }]); */
    });

    editor.navigateToPreviewTab();

    explorationPlayerPage.expectContentToMatch(function(richTextChecker) {
      richTextChecker.readBoldText('bold');
      richTextChecker.readPlainText(' ');
      richTextChecker.readRteComponent('Link', 'http://google.com/', true);
      richTextChecker.readRteComponent('Math', 'abc');
      richTextChecker.readRteComponent('Video', 'ANeHmk22a6Q', 10, 100, false);
      /* richTextChecker.readRteComponent(
        'Collapsible', 'title', forms.toRichText('inner'));
      richTextChecker.readRteComponent('Tabs', [{
        title: 'title 1',
        content: forms.toRichText('contents 1')
      }, {
        title: 'title 1',
        content: forms.toRichText('contents 2')
      }]); */
    });

    editor.discardChanges();
    users.logout();
  });

  // TODO (Jacob): Add in a test for the use of rich text inside collapsibles
  // and tabs. Previous attempts at such a test intermittently fail with the
  // rich-text checker unable to read the formatted text.

  afterEach(function() {
    general.checkForConsoleErrors([
      // TODO (Jacob) Remove when
      // https://code.google.com/p/google-cast-sdk/issues/detail?id=309 is fixed
      'cast_sender.js - Failed to load resource: net::ERR_FAILED',
      'Uncaught ReferenceError: ytcfg is not defined',
      // TODO (@pranavsid98) This error is caused by the upgrade from Chrome 60
      // to Chrome 61. Chrome version at time of recording this is 61.0.3163.
      'chrome-extension://invalid/ - Failed to load resource: net::ERR_FAILED',
      'Error parsing header X-XSS-Protection: 1; mode=block; ' +
      'report=https:\/\/www.google.com\/appserve\/security-bugs\/log\/youtube:',
      'https://www.youtube.com/youtubei/v1/log_interaction?.* Failed to load ' +
      'resource: the server responded with a status of 401 ()',
    ]);
  });
});


describe('Interactions', function() {
  var explorationPlayerPage = null;

  beforeEach(function() {
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should pass their own test suites', function() {
    users.createUser('user@interactions.com', 'userInteractions');
    users.login('user@interactions.com');
    workflow.createExploration();
    editor.setStateName('first');
    editor.setContent(forms.toRichText('some content'));

    var defaultOutcomeSet = false;

    for (var interactionId in interactions.INTERACTIONS) {
      var interaction = interactions.INTERACTIONS[interactionId];
      for (var i = 0; i < interaction.testSuite.length; i++) {
        var test = interaction.testSuite[i];

        editor.setInteraction.apply(
          null, [interactionId].concat(test.interactionArguments));

        editor.addResponse.apply(null, [
          interactionId, forms.toRichText('yes'), null, false
        ].concat(test.ruleArguments));

        if (!defaultOutcomeSet) {
          // The default outcome will be preserved for subsequent tests.
          editor.setDefaultOutcome(forms.toRichText('no'), null, false);
          defaultOutcomeSet = true;
        }

        editor.navigateToPreviewTab();
        explorationPlayerPage.expectInteractionToMatch.apply(
          null, [interactionId].concat(test.expectedInteractionDetails));
        for (var j = 0; j < test.wrongAnswers.length; j++) {
          explorationPlayerPage.submitAnswer(
            interactionId, test.wrongAnswers[j]);
          explorationPlayerPage.expectLatestFeedbackToMatch(
            forms.toRichText('no'));
        }
        for (var j = 0; j < test.correctAnswers.length; j++) {
          explorationPlayerPage.submitAnswer(
            interactionId, test.correctAnswers[j]);
          explorationPlayerPage.expectLatestFeedbackToMatch(
            forms.toRichText('yes'));
        }
        editor.navigateToMainTab();
      }
    }

    editor.discardChanges();
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
