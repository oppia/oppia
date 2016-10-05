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
 * @fileoverview End-to-end tests for interactions.
 */

var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var editor = require('../protractor_utils/editor.js');
var general = require('../protractor_utils/general.js');
var player = require('../protractor_utils/player.js');
var workflow = require('../protractor_utils/workflow.js');
var interactions = require('../../../extensions/interactions/protractor.js');

describe('Interactions', function() {
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
        player.expectInteractionToMatch.apply(
          null, [interactionId].concat(test.expectedInteractionDetails));
        for (var j = 0; j < test.wrongAnswers.length; j++) {
          player.submitAnswer(interactionId, test.wrongAnswers[j]);
          player.expectLatestFeedbackToMatch(forms.toRichText('no'));
        }
        for (var j = 0; j < test.correctAnswers.length; j++) {
          player.submitAnswer(interactionId, test.correctAnswers[j]);
          player.expectLatestFeedbackToMatch(forms.toRichText('yes'));
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

