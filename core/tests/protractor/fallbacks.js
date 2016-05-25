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
 * @fileoverview End-to-end tests of the fallbacks functionality.
 */

var general = require('../protractor_utils/general.js');
var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');

describe('Fallbacks editor', function() {
  it('should allow a fallback to be set and apply it correctly, and ' +
     'disallow editing of fallbacks in read-only explorations', function() {
    users.createUser('user1@fallbacks.com', 'user1Fallbacks');
    users.login('user1@fallbacks.com');

    workflow.createExploration();
    general.getExplorationIdFromEditor().then(function(explorationId) {
      editor.enableFallbacks();

      editor.setStateName('card 1');
      editor.setContent(forms.toRichText('this is card 1'));
      editor.setInteraction('NumericInput');
      editor.addResponse('NumericInput', null, 'card 2', true, 'Equals', 21);
      editor.setDefaultOutcome(forms.toRichText('try again'), null, false);
      editor.addFallback(
        2, forms.toRichText('fallback triggered'), 'final card', true);

      editor.moveToState('card 2');
      editor.setInteraction('Continue', 'click here');
      editor.setDefaultOutcome(null, 'final card', false);

      editor.moveToState('final card');
      // Do a rename, to ensure that the destination states update accordingly.
      editor.setStateName('new name for final card');
      editor.setInteraction('EndExploration');

      editor.setTitle('Fallbacks');
      editor.setCategory('Test');
      editor.setObjective('To test fallbacks.');
      editor.saveChanges();
      workflow.publishExploration();

      // Login as another user and verify that the exploration editor does not
      // allow the second user to modify the exploration.
      users.logout();
      users.login('user7@fallbacks.com');
      general.openEditor(explorationId);
      editor.exitTutorialIfNecessary();

      // Verify nothing can change with this user.
      editor.expectInteractionToMatch('NumericInput');
      editor.expectCannotAddFallback();

      var fallbackEditor = editor.FallbackEditor(0);
      fallbackEditor.expectCannotSetFeedback();
      fallbackEditor.expectCannotSetDestination();
      fallbackEditor.expectCannotDeleteFallback();
      fallbackEditor.expectCannotChangeTriggerCondition();

      general.openPlayer(explorationId);
      player.submitAnswer('NumericInput', 19);
      player.expectLatestFeedbackToMatch(forms.toRichText('try again'));
      player.expectExplorationToNotBeOver();
      player.submitAnswer('NumericInput', 18);
      player.expectLatestFeedbackToMatch(
        forms.toRichText('fallback triggered'));
      player.clickThroughToNextCard();
      player.expectExplorationToBeOver();

      // Verify that an answer which moves to a new state does not trigger a
      // fallback.
      general.openPlayer(explorationId);
      player.submitAnswer('NumericInput', 19);
      player.expectLatestFeedbackToMatch(forms.toRichText('try again'));
      player.expectExplorationToNotBeOver();
      player.submitAnswer('NumericInput', 21);
      player.expectInteractionToMatch('Continue', 'click here');
      player.submitAnswer('Continue', null);
      player.expectExplorationToBeOver();

      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
