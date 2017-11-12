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
 * @fileoverview End-to-end tests for hints/solutions on explorations.
 * Tests the following sequence:
 * User 1 creates and publishes an exploration with hints/solutions.
 * User 2 plays the exploration and uses the hints/solutions.
 */

var editor = require('../protractor_utils/editor.js');
var general = require('../protractor_utils/general.js');
var forms = require('../protractor_utils/forms.js');
var player = require('../protractor_utils/player.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

describe('HintsAndSolutions', function() {
  beforeEach(function() {
    users.createUser('user1@hintsAndSolutions.com',
                     'hintsAndSolutions');
  });

  it('uses hints and solutions in an exploration', function() {
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
    player.expectContentToMatch(forms.toRichText('What language is Oppia?'));
    player.submitAnswer('TextInput', 'Roman');
    player.viewHint();
    player.submitAnswer('TextInput', 'Greek');
    player.viewSolution();
    player.expectExplorationToNotBeOver();
    player.submitAnswer('TextInput', 'Finnish');
    player.clickThroughToNextCard();
    player.expectExplorationToBeOver();
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
