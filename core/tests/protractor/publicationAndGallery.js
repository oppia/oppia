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
 * @fileoverview End-to-end tests of the publication and release process, and
 * the resultant display of explorations in the gallery.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');
var gallery = require('../protractor_utils/gallery.js');

describe('Gallery view', function() {
  it('should display private, published and released explorations', function() {
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
    gallery.tickCheckbox('status', 'Beta');
    gallery.editExploration('Vingilot');
    // Moderators can edit and release explorations.
    editor.setLanguage('français');
    editor.saveChanges('change language');
    workflow.releaseExploration();
    users.logout();

    users.login('celebrimbor@example.com');
    workflow.createExploration('Vilya', 'rings');
    editor.setObjective('preserve the works of the elves');
    editor.saveChanges();

    // The situation is now:
    names = ['silmarils', 'Vingilot', 'Vilya'];
    properties = {
      status: ['Beta', 'Released', 'Private'],
      category: ['gems', 'ships', 'rings'],
      language: ['Deutsch', 'français', 'English']
    };

    browser.get('/gallery');
    // This box is checked by default so we uncheck it.
    gallery.untickCheckbox('status', 'Released');

    // We next check explorations are visible under the right conditions.
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

    expect(gallery.getExplorationObjective('Vilya')).toBe(
      'Preserve the works of the elves');
    gallery.playExploration('silmarils');
    expect(player.getExplorationName()).toBe('silmarils');
    player.answerContinueWidget();

    users.logout();
  });
});
