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

    var EXPLORATION_SILMARILS = 'silmarils';
    var EXPLORATION_VINGILOT = 'Vingilot';
    var CATEGORY_GEMS = 'gems';
    var CATEGORY_SHIPS = 'ships';
    var LANGUAGE_ENGLISH = 'English';
    var LANGUAGE_FRANCAIS = 'français';
    var LANGUAGE_DEUTSCH = 'Deutsch';

    users.login('feanor@exmple.com');
    workflow.createAndPublishExploration(
      EXPLORATION_SILMARILS, CATEGORY_GEMS,
      'hold the light of the two trees', LANGUAGE_DEUTSCH);
    users.logout();

    users.login('earendil@example.com');
    workflow.createAndPublishExploration(
      EXPLORATION_VINGILOT, CATEGORY_SHIPS, 'seek the aid of the Valar');
    users.logout();

    users.login('varda@example.com');
    browser.get(general.GALLERY_URL_SUFFIX);
    gallery.editExploration(EXPLORATION_VINGILOT);
    // Moderators can edit explorations and mark them as featured.
    editor.setLanguage(LANGUAGE_FRANCAIS);
    editor.saveChanges('change language');
    workflow.markExplorationAsFeatured();
    users.logout();

    users.login('celebrimbor@example.com');
    workflow.createExploration('Vilya', 'rings');
    editor.setObjective('preserve the works of the elves');
    editor.saveChanges();

    // There are now two non-private explorations whose titles, categories
    // and languages are, respectively:
    // - silmarils, gems, Deutsch
    // - Vingilot, ships, français

    var ALL_PUBLIC_EXPLORATION_TITLES = [
      EXPLORATION_SILMARILS, EXPLORATION_VINGILOT];

    var testCases = [{
      categories: [],
      languages: [],
      expectVisible: [EXPLORATION_SILMARILS, EXPLORATION_VINGILOT]
    }, {
      categories: [],
      languages: [LANGUAGE_ENGLISH, LANGUAGE_FRANCAIS],
      expectVisible: [EXPLORATION_VINGILOT]
    }, {
      categories: [],
      languages: [LANGUAGE_ENGLISH, LANGUAGE_DEUTSCH, LANGUAGE_FRANCAIS],
      expectVisible: [EXPLORATION_SILMARILS, EXPLORATION_VINGILOT]
    }, {
      categories: [CATEGORY_GEMS],
      languages: [],
      expectVisible: [EXPLORATION_SILMARILS]
    }, {
      categories: [CATEGORY_GEMS, CATEGORY_SHIPS],
      languages: [],
      expectVisible: [EXPLORATION_SILMARILS, EXPLORATION_VINGILOT]
    }, {
      categories: [CATEGORY_GEMS],
      languages: [LANGUAGE_DEUTSCH],
      expectVisible: [EXPLORATION_SILMARILS]
    }, {
      categories: [CATEGORY_GEMS],
      languages: [LANGUAGE_FRANCAIS],
      expectVisible: []
    }];

    // We now check explorations are visible under the right conditions.
    browser.get('/gallery');
    // The initial language selection should be just English.
    gallery.expectCurrentLanguageSelectionToBe([LANGUAGE_ENGLISH]);

    testCases.forEach(function(testCase) {
      gallery.setLanguages(testCase.languages);
      testCase.categories.forEach(function(category) {
        gallery.tickCheckbox('category', category);
      });

      for (var explorationTitle in ALL_PUBLIC_EXPLORATION_TITLES) {
        if (testCase.expectVisible.indexOf(explorationTitle) !== -1) {
          gallery.expectExplorationToBeVisible(explorationTitle);
        } else {
          gallery.expectExplorationToBeHidden(explorationTitle);
        }
      }

      gallery.setLanguages([]);
      testCase.categories.forEach(function(category) {
        gallery.untickCheckbox('category', category);
      });
    });

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
