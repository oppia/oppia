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
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

describe('HintsAndSolutions', function() {
  var explorationPlayerPage = null;

  beforeEach(function() {
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    users.createUser(
      'user1@hintsAndSolutions.com',
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
    explorationPlayerPage.expectContentToMatch(
      forms.toRichText('What language is Oppia?'));
    explorationPlayerPage.submitAnswer('TextInput', 'Roman');
    // We need to wait some time for the hint to activate.
    general.waitForSystem();
    general.waitForSystem();
    general.waitForSystem();

    explorationPlayerPage.viewHint();
    explorationPlayerPage.clickGotItButton();
    explorationPlayerPage.submitAnswer('TextInput', 'Greek');
    // We need to wait some time for the solution to activate.
    general.waitForSystem();
    general.waitForSystem();
    general.waitForSystem();

    explorationPlayerPage.viewSolution();
    explorationPlayerPage.clickGotItButton();
    explorationPlayerPage.expectExplorationToNotBeOver();
    explorationPlayerPage.submitAnswer('TextInput', 'Finnish');
    explorationPlayerPage.clickThroughToNextCard();
    explorationPlayerPage.expectExplorationToBeOver();
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
