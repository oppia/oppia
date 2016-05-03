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
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');
var gallery = require('../protractor_utils/gallery.js');
var forms = require('../protractor_utils/forms.js');

describe('Gallery view', function() {
  it('should display private, published and featured explorations', function() {
    var EXPLORATION_SILMARILS = 'silmarils';
    var EXPLORATION_VINGILOT = 'Vingilot';
    var CATEGORY_BUSINESS = 'Business';
    var CATEGORY_ENVIRONMENT = 'Environment';
    var LANGUAGE_ENGLISH = 'English';
    var LANGUAGE_FRANCAIS = 'français';
    var LANGUAGE_DEUTSCH = 'Deutsch';

    users.createModerator(
      'varda@publicationAndGallery.com', 'vardaPublicationAndGallery');
    users.createUser(
      'feanor@publicationAndGallery.com', 'feanorPublicationAndGallery');
    users.createUser(
      'celebrimor@publicationAndGallery.com', 'celebriorPublicationAndGallery');
    users.createUser(
      'earendil@publicationAndGallery.com', 'earendilPublicationAndGallery');

    users.login('feanor@publicationAndGallery.com');
    workflow.createAndPublishExploration(
      EXPLORATION_SILMARILS, CATEGORY_ENVIRONMENT,
      'hold the light of the two trees', LANGUAGE_DEUTSCH);
    users.logout();

    users.login('earendil@publicationAndGallery.com');
    workflow.createAndPublishExploration(
      EXPLORATION_VINGILOT, CATEGORY_BUSINESS, 'seek the aid of the Valar');
    users.logout();

    users.login('varda@publicationAndGallery.com');
    browser.get(general.GALLERY_URL_SUFFIX);
    gallery.playExploration(EXPLORATION_VINGILOT);
    general.moveToEditor();
    // Moderators can edit explorations and mark them as featured.
    editor.setLanguage(LANGUAGE_FRANCAIS);
    editor.saveChanges('change language');
    workflow.markExplorationAsFeatured();
    users.logout();

    users.login('celebrimor@publicationAndGallery.com');
    workflow.createExploration('Vilya', 'rings');
    editor.setContent(forms.toRichText('Celebrimbor wrote this'));
    editor.setInteraction('EndExploration');
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
      categories: [CATEGORY_ENVIRONMENT],
      languages: [],
      expectVisible: [EXPLORATION_SILMARILS]
    }, {
      categories: [CATEGORY_ENVIRONMENT, CATEGORY_BUSINESS],
      languages: [],
      expectVisible: [EXPLORATION_SILMARILS, EXPLORATION_VINGILOT]
    }, {
      categories: [CATEGORY_ENVIRONMENT],
      languages: [LANGUAGE_DEUTSCH],
      expectVisible: [EXPLORATION_SILMARILS]
    }, {
      categories: [CATEGORY_ENVIRONMENT],
      languages: [LANGUAGE_FRANCAIS],
      expectVisible: []
    }];

    // We now check explorations are visible under the right conditions.
    browser.get('/search/find?q=&language_code=("en")');
    // The initial language selection should be just English.
    gallery.expectCurrentLanguageSelectionToBe([LANGUAGE_ENGLISH]);
    // At the start, no categories are selected.
    gallery.expectCurrentCategorySelectionToBe([]);

    // Reset the language selector.
    gallery.deselectLanguages([LANGUAGE_ENGLISH]);

    testCases.forEach(function(testCase) {
      gallery.selectLanguages(testCase.languages);
      gallery.selectCategories(testCase.categories);

      for (var explorationTitle in ALL_PUBLIC_EXPLORATION_TITLES) {
        if (testCase.expectVisible.indexOf(explorationTitle) !== -1) {
          gallery.expectExplorationToBeVisible(explorationTitle);
        } else {
          gallery.expectExplorationToBeHidden(explorationTitle);
        }
      }

      gallery.deselectLanguages(testCase.languages);
      gallery.deselectCategories(testCase.categories);
    });

    // Private explorations are not shown in the gallery.
    gallery.expectExplorationToBeHidden('Vilya');

    // The first letter of the objective is automatically capitalized.
    expect(gallery.getExplorationObjective(EXPLORATION_VINGILOT)).toBe(
      'Seek the aid of the Valar');
    general.waitForSystem();
    gallery.playExploration(EXPLORATION_SILMARILS);
    player.expectExplorationNameToBe('silmarils');
    player.submitAnswer('Continue');

    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
