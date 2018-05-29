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
 * the resultant display of explorations in the library.
 */

var editor = require('../protractor_utils/editor.js');
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('Library index page', function() {
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should display private and published explorations', function() {
    var EXPLORATION_SILMARILS = 'silmarils';
    var EXPLORATION_VINGILOT = 'Vingilot';
    var CATEGORY_ARCHITECTURE = 'Architecture';
    var CATEGORY_BUSINESS = 'Business';
    var LANGUAGE_ENGLISH = 'English';
    var LANGUAGE_FRANCAIS = 'français';
    var LANGUAGE_DEUTSCH = 'Deutsch';

    users.createModerator(
      'varda@publicationAndLibrary.com', 'vardaPublicationAndLibrary');
    users.createUser(
      'feanor@publicationAndLibrary.com', 'feanorPublicationAndLibrary');
    users.createUser(
      'celebrimor@publicationAndLibrary.com', 'celebriorPublicationAndLibrary');
    users.createUser(
      'earendil@publicationAndLibrary.com', 'earendilPublicationAndLibrary');

    users.login('feanor@publicationAndLibrary.com');
    workflow.createAndPublishExploration(
      EXPLORATION_SILMARILS, CATEGORY_ARCHITECTURE,
      'hold the light of the two trees', LANGUAGE_DEUTSCH);
    users.logout();

    users.login('earendil@publicationAndLibrary.com');
    workflow.createAndPublishExploration(
      EXPLORATION_VINGILOT, CATEGORY_BUSINESS, 'seek the aid of the Valar');
    users.logout();

    users.login('varda@publicationAndLibrary.com');
    libraryPage.get();
    libraryPage.playExploration(EXPLORATION_VINGILOT);
    general.moveToEditor();
    // Moderators can edit explorations.
    editor.setLanguage(LANGUAGE_FRANCAIS);
    editor.saveChanges('change language');
    users.logout();

    users.login('celebrimor@publicationAndLibrary.com');
    workflow.createExploration();
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
      categories: [CATEGORY_ARCHITECTURE],
      languages: [],
      expectVisible: [EXPLORATION_SILMARILS]
    }, {
      categories: [CATEGORY_ARCHITECTURE, CATEGORY_BUSINESS],
      languages: [],
      expectVisible: [EXPLORATION_SILMARILS, EXPLORATION_VINGILOT]
    }, {
      categories: [CATEGORY_ARCHITECTURE],
      languages: [LANGUAGE_DEUTSCH],
      expectVisible: [EXPLORATION_SILMARILS]
    }, {
      categories: [CATEGORY_ARCHITECTURE],
      languages: [LANGUAGE_FRANCAIS],
      expectVisible: []
    }];

    // We now check explorations are visible under the right conditions.
    browser.get('/search/find?q=&language_code=("en")');
    // The initial language selection should be just English.
    libraryPage.expectCurrentLanguageSelectionToBe([LANGUAGE_ENGLISH]);
    // At the start, no categories are selected.
    libraryPage.expectCurrentCategorySelectionToBe([]);

    // Reset the language selector.
    libraryPage.deselectLanguages([LANGUAGE_ENGLISH]);

    testCases.forEach(function(testCase) {
      libraryPage.selectLanguages(testCase.languages);
      libraryPage.selectCategories(testCase.categories);

      for (var explorationTitle in ALL_PUBLIC_EXPLORATION_TITLES) {
        if (testCase.expectVisible.indexOf(explorationTitle) !== -1) {
          libraryPage.expectExplorationToBeVisible(explorationTitle);
        } else {
          libraryPage.expectExplorationToBeHidden(explorationTitle);
        }
      }

      libraryPage.deselectLanguages(testCase.languages);
      libraryPage.deselectCategories(testCase.categories);
    });

    // Private explorations are not shown in the library.
    libraryPage.expectExplorationToBeHidden('Vilya');

    // The first letter of the objective is automatically capitalized.
    expect(libraryPage.getExplorationObjective(EXPLORATION_VINGILOT)).toBe(
      'Seek the aid of the Valar');
    general.waitForSystem();
    libraryPage.playExploration(EXPLORATION_SILMARILS);
    explorationPlayerPage.expectExplorationNameToBe('silmarils');

    users.logout();
  });

  it('should not have any non translated strings', function() {
    var EXPLORATION_SILMARILS = 'silmarils';
    var EXPLORATION_VINGILOT = 'Vingilot';
    var CATEGORY_ENVIRONMENT = 'Environment';
    var CATEGORY_BUSINESS = 'Business';
    var LANGUAGE_FRANCAIS = 'français';
    users.createUser('aule@example.com', 'Aule');

    users.login('aule@example.com');
    workflow.createAndPublishExploration(
      EXPLORATION_SILMARILS, CATEGORY_BUSINESS,
      'hold the light of the two trees', LANGUAGE_FRANCAIS);
    workflow.createAndPublishExploration(
      EXPLORATION_VINGILOT, CATEGORY_ENVIRONMENT, 'seek the aid of the Valar');
    users.logout();

    libraryPage.get();
    expect(browser.getTitle()).toEqual('Exploration Library - Oppia');
    general.ensurePageHasNoTranslationIds();

    // Filter library explorations
    libraryPage.selectLanguages([LANGUAGE_FRANCAIS]);
    general.ensurePageHasNoTranslationIds();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});


describe('Permissions for private explorations', function() {
  it('should be correct for collaborators', function() {
    users.createUser('alice@privileges.com', 'alicePrivileges');
    users.createUser('bob@privileges.com', 'bobPrivileges');
    users.createUser('eve@privileges.com', 'evePrivileges');

    users.login('alice@privileges.com');
    workflow.createExploration();
    workflow.addExplorationCollaborator('bobPrivileges');
    expect(workflow.getExplorationManagers()).toEqual(['alicePrivileges']);
    expect(workflow.getExplorationCollaborators()).toEqual(['bobPrivileges']);
    expect(workflow.getExplorationPlaytesters()).toEqual([]);
    general.getExplorationIdFromEditor().then(function(explorationId) {
      users.logout();

      users.login('bob@privileges.com');
      general.openEditor(explorationId);
      editor.setContent(forms.toRichText('I love you'));
      editor.setInteraction('TextInput');
      editor.saveChanges();
      users.logout();

      users.login('eve@privileges.com');
      general.openEditor(explorationId);
      general.expect404Error();
      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([
      'Failed to load resource: the server responded with a status of 404'
    ]);
  });
});
