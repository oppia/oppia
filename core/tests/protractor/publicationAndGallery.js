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
 * @fileoverview End-to-end tests of the publication and featuring process, and
 * the resultant display of explorations in the gallery.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');
var gallery = require('../protractor_utils/gallery.js');

describe('Gallery view', function() {
  it('should display private, published and featured explorations', function() {
    users.createModerator('varda@example.com', 'Varda');
    users.createUser('feanor@exmple.com', 'Feanor');
    users.createUser('celebrimbor@example.com', 'Celebrimbor');
    users.createUser('earendil@example.com', 'Earendil');

    users.login('feanor@exmple.com');
    workflow.createAndPublishExploration(
      'silmarils', 'gems', 'hold the light of the two trees', 'Deutsch');
    users.logout();

    users.login('earendil@example.com');
    workflow.createAndPublishExploration(
      'Vingilot', 'ships', 'seek the aid of the Valar');
    users.logout();

    users.login('varda@example.com');
    browser.get('/gallery');
    gallery.editExploration('Vingilot');
    // Moderators can edit explorations and mark them as featured.
    editor.setLanguage('français');
    editor.saveChanges('change language');
    workflow.markExplorationAsFeatured();
    users.logout();

    users.login('celebrimbor@example.com');
    workflow.createExploration('Vilya', 'rings');
    editor.setObjective('preserve the works of the elves');
    editor.saveChanges();

    // The situation (for non-private explorations) is now:
    names = ['silmarils', 'Vingilot'];
    properties = {
      category: ['gems', 'ships'],
      language: ['Deutsch', 'français']
    };

    // We now check explorations are visible under the right conditions.
    browser.get('/gallery');
    for (var key in properties) {
      for (var i = 0; i < names.length; i++) {
        gallery.tickCheckbox(key, properties[key][i]);
        for (var j = 0; j < names.length; j++) {
          if (j === i) {
            gallery.expectExplorationToBeVisible(names[j]);
          } else {
            gallery.expectExplorationToBeHidden(names[j]);
          }
        }
        gallery.untickCheckbox(key, properties[key][i]);
      }

      // Now select everything in this section ready for the next test
      for (var i = 0; i < names.length; i++) {
        gallery.tickCheckbox(key, properties[key][i]);
      }
    }

    // Private explorations are not shown in the gallery.
    gallery.expectExplorationToBeHidden('Vilya');

    // The first letter of the objective is automatically capitalized.
    expect(gallery.getExplorationObjective('Vingilot')).toBe(
      'Seek the aid of the Valar');
    gallery.playExploration('silmarils');
    player.expectExplorationNameToBe('silmarils');
    player.submitAnswer('Continue');

    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
