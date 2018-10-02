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

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('Library index page', function() {
  var libraryPage = null;
  var explorationEditorPage = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
    libraryPage = new LibraryPage.LibraryPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
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
    libraryPage.findExploration(EXPLORATION_VINGILOT);
    libraryPage.playExploration(EXPLORATION_VINGILOT);
    general.moveToEditor();
    // Moderators can edit explorations.
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setLanguage(LANGUAGE_FRANCAIS);
    explorationEditorPage.saveChanges('change language');
    users.logout();

    users.login('celebrimor@publicationAndLibrary.com');
    workflow.createExploration();
    explorationEditorMainTab.setContent(
      forms.toRichText('Celebrimbor wrote this'));
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setObjective(
      'preserve the works of the elves');
    explorationEditorPage.saveChanges();

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

    libraryPage.findExploration(EXPLORATION_VINGILOT);
    // The first letter of the objective is automatically capitalized.
    expect(libraryPage.getExplorationObjective(EXPLORATION_VINGILOT)).toBe(
      'Seek the aid of the Valar');
    libraryPage.findExploration(EXPLORATION_SILMARILS);
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
    libraryPage.expectMainHeaderTextToBe(
      'Imagine what you could learn today...');
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
  var explorationEditorPage = null;

  beforeEach(function() {
    libraryPage = new LibraryPage.LibraryPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });
  it('should be correct for collaborators', function() {
    users.createUser('alice@privileges.com', 'alicePrivileges');
    users.createUser('bob@privileges.com', 'bobPrivileges');
    users.createUser('eve@privileges.com', 'evePrivileges');

    users.login('alice@privileges.com');
    workflow.createExploration();
    explorationEditorPage.navigateToSettingsTab();
    workflow.addExplorationCollaborator('bobPrivileges');
    expect(workflow.getExplorationManagers()).toEqual(['alicePrivileges']);
    expect(workflow.getExplorationCollaborators()).toEqual(['bobPrivileges']);
    expect(workflow.getExplorationPlaytesters()).toEqual([]);
    general.getExplorationIdFromEditor().then(function(explorationId) {
      users.logout();

      users.login('bob@privileges.com');
      general.openEditor(explorationId);
      explorationEditorMainTab.setContent(forms.toRichText('I love you'));
      explorationEditorMainTab.setInteraction('TextInput');
      explorationEditorPage.saveChanges();
      users.logout();

      users.login('eve@privileges.com');
      general.openEditor(explorationId);
      general.expect404Error();
      users.logout();
    });
  });

  it('should be correct for translators', function() {
    users.createUser('expOwner@oppia.tests', 'expOwner');
    users.createUser('translator@oppia.tests', 'translator');
    users.createUser('guestUser@oppia.tests', 'guestUser');

    users.login('expOwner@oppia.tests');
    workflow.createExploration();
    explorationEditorMainTab.setContent(forms.toRichText('this is card 1'));
    explorationEditorPage.saveChanges('Added content to first card.');
    explorationEditorPage.navigateToSettingsTab();
    workflow.addExplorationTranslator('translator');
    expect(workflow.getExplorationManagers()).toEqual(['expOwner']);
    expect(workflow.getExplorationCollaborators()).toEqual([]);
    expect(workflow.getExplorationTranslators()).toEqual(['translator']);
    expect(workflow.getExplorationPlaytesters()).toEqual([]);
    general.getExplorationIdFromEditor().then(function(explorationId) {
      users.logout();

      users.login('translator@oppia.tests');
      general.openEditor(explorationId);
      explorationEditorMainTab.expectContentToMatch(
        forms.toRichText('this is card 1'));
      expect(element(by.css(
        '.protractor-test-save-changes')).isPresent()).toBeTruthy();
      users.logout();

      users.login('guestUser@oppia.tests');
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
