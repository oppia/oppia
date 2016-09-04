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
 * @fileoverview End-to-end tests of the gadget editor.
 */

var general = require('../protractor_utils/general.js');
var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');

describe('Gadget editor', function() {
  it('should allow adding a gadget that is listed in the editor side panel ' +
       'and visible in the player view.', function() {
    users.createUser('user1@gadgetEditor.com', 'user1GadgetEditor');
    users.login('user1@gadgetEditor.com');

    workflow.createExploration();

    editor.enableParameters();
    editor.enableGadgets();

    // Setup the first state.
    editor.setStateName('first');
    editor.setContent(forms.toRichText('gadget end-to-end test.'));
    editor.setInteraction('EndExploration');

    // Setup a parameter for the ScoreBar to follow.
    editor.addParameterChange('coconuts', 3000);

    // The arguments here represent: type, name, maxValue, parameter to follow.
    editor.addGadget('ScoreBar', 'Coconut Surplus', '9000', 'coconuts');

    // The arguments here represent: type, short_description, name.
    editor.expectGadgetListNameToMatch(
      'ScoreBar', 'Score Bar', 'Coconut Surplus');

    editor.saveChanges();
    general.moveToPlayer();

    player.expectGadgetToMatch(
      'ScoreBar',
      'Coconut Surplus',
      '9000',
      'coconuts'
    );

    users.logout();
  });

  it('should allow configuration of visibility settings, and properly ' +
      'render as visible or invisible as expected per state.', function() {
    users.createUser('user2@gadgetEditor.com', 'user2GadgetEditor');
    users.login('user2@gadgetEditor.com');

    workflow.createExploration();

    // Setup the first state.
    editor.setStateName('first');
    editor.setContent(forms.toRichText(
      'gadget visibility end-to-end test card 1.'));
    editor.setInteraction('Continue');
    editor.setDefaultOutcome(null, 'second', true);

    // Setup the second state
    editor.moveToState('second');
    editor.setContent(forms.toRichText(
      'gadget visibility end-to-end test card 2.'));
    editor.setInteraction('Continue');
    editor.setDefaultOutcome(null, 'final card', true);

    // Setup a terminating state
    editor.moveToState('final card');
    editor.setContent(forms.toRichText('gadget visibility final card'));
    editor.setInteraction('EndExploration');
    editor.moveToState('first');

    editor.enableParameters();
    editor.enableGadgets();

    // Add a parameter for the ScoreBar to follow.
    editor.addParameterChange('coconuts', 3000);

    // The arguments here represent: type, name, maxValue, parameter to follow.
    editor.addGadget('ScoreBar', 'CoconutSurplus', '9000', 'coconuts');

    // Edit visibility
    editor.openGadgetEditorModal('CoconutSurplus');
    editor.enableGadgetVisibilityForState('final card');
    editor.saveAndCloseGadgetEditorModal();

    editor.saveChanges();
    general.moveToPlayer();

    player.expectVisibleGadget('ScoreBar');
    player.submitAnswer('Continue', null);
    general.waitForSystem(2000);

    player.expectInvisibleGadget('ScoreBar');
    player.submitAnswer('Continue', null);
    general.waitForSystem(2000);

    player.expectVisibleGadget('ScoreBar');
    users.logout();
  });

  // This test inspects within the editor view since gadget names only exist
  // to help authors differentiate between gadgets, and are not visible in the
  // player view.
  it('should allow renaming and deleting gadgets', function() {
    users.createUser('user3@gadgetEditor.com', 'user3GadgetEditor');
    users.login('user3@gadgetEditor.com');

    workflow.createExploration();

    // Setup the first state.
    editor.setStateName('first');
    editor.setContent(forms.toRichText('gadget end-to-end test card 1.'));
    editor.setInteraction('Continue');
    editor.setDefaultOutcome(null, 'second', true);

    editor.enableParameters();
    editor.enableGadgets();

    // Add a parameter for the ScoreBar to follow.
    editor.addParameterChange('coconuts', 3000);

    // The arguments here represent: type, name, maxValue, parameter to follow.
    editor.addGadget('ScoreBar', 'CoconutSurplus', '9000', 'coconuts');

    editor.renameGadget('CoconutSurplus', 'SuperCoconuts');

    // The arguments here represent: type, short_description, name.
    editor.expectGadgetListNameToMatch(
      'ScoreBar', 'Score Bar', 'SuperCoconuts');

    editor.deleteGadget('SuperCoconuts');
    editor.expectGadgetWithTypeDoesNotExist('SuperCoconuts');
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
