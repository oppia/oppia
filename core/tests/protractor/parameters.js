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
 * @fileoverview End-to-end tests of parameters / expressions.
 */

var general = require('../protractor_utils/general.js');
var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');

describe('Parameters', function() {
  it('should navigate multiple states correctly, with parameters', function() {
    users.createUser('user4@parameters.com', 'user4parameters');
    users.login('user4@parameters.com');

    workflow.createExploration();
    editor.enableParameters();
    editor.addExplorationLevelParameterChange('z', 2);

    editor.setStateName('card 1');
    editor.addParameterChange('a', 2);
    editor.setContent(forms.toRichText(
      'Change value of a from {{a}} to'));
    editor.setInteraction('NumericInput');
    editor.addResponse(
      'NumericInput', null, 'card 2', true, 'IsGreaterThan', 0);

    editor.moveToState('card 2');
    editor.addParameterChange('a', '{{answer}}');
    editor.addParameterChange('b', 3);
    editor.setContent(forms.toRichText(
      'Change value of b from {{b}} to'));
    editor.setInteraction('NumericInput');
    editor.addResponse(
      'NumericInput', null, 'card 3', true, 'IsGreaterThan', 0);

    editor.moveToState('card 3');
    editor.addParameterChange('b', '{{answer}}');
    editor.setContent(forms.toRichText(
      'sum of {{z}} and {{b}} is {{z + b}},' + (
      ' sum of {{a}} and {{b}} is {{a + b}}')));
    editor.setInteraction(
      'MultipleChoiceInput',
      [forms.toRichText('return'), forms.toRichText('complete')]);
    editor.addResponse('MultipleChoiceInput', null, 'card 2', false,
      'Equals', 'return');
    editor.setDefaultOutcome(null, 'final card', true);

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setInteraction('EndExploration');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(forms.toRichText(
      'Change value of a from 2 to'));
    player.submitAnswer('NumericInput', 5);
    player.expectContentToMatch(forms.toRichText(
      'Change value of b from 3 to'));
    player.submitAnswer('NumericInput', 2);
    player.expectContentToMatch(forms.toRichText(
      'sum of 2 and 2 is 4, sum of 5 and 2 is 7'));
    player.submitAnswer('MultipleChoiceInput', 'return');
    player.expectContentToMatch(forms.toRichText(
      'Change value of b from 3 to'));
    player.submitAnswer('NumericInput', 5);
    player.expectContentToMatch(forms.toRichText(
      'sum of 2 and 5 is 7, sum of 5 and 5 is 10'));
    player.submitAnswer('MultipleChoiceInput', 'return');
    player.expectContentToMatch(forms.toRichText(
      'Change value of b from 3 to'));
    player.submitAnswer('NumericInput', 4);
    player.expectContentToMatch(forms.toRichText(
      'sum of 2 and 4 is 6, sum of 5 and 4 is 9'));
    player.submitAnswer('MultipleChoiceInput', 'complete');
    player.expectExplorationToBeOver();
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
