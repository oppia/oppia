// Copyright 2022 The Oppia Authors. All Rights Reserved.
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

var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');

var AdminPage = require('../webdriverio_utils/AdminPage.js');
var ExplorationEditorPage =
  require('../webdriverio_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../webdriverio_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');
var ReleaseCoordinatorPage = require(
  '../webdriverio_utils/ReleaseCoordinatorPage.js');

describe('Library index page', function() {
  var adminPage = null;
  var libraryPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  let releaseCoordinatorPage = null;

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    libraryPage = new LibraryPage.LibraryPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    releaseCoordinatorPage = (
      new ReleaseCoordinatorPage.ReleaseCoordinatorPage());

    await users.createAndLoginSuperAdminUser(
      'superUser@publicationAndLibrary.com', 'superUser');
    await adminPage.get();
    await adminPage.addRole('superUser', 'release coordinator');
    await releaseCoordinatorPage.getFeaturesTab();
    improvementsTabFeature = (
      await releaseCoordinatorPage.getImprovementsTabFeatureElement());
    await releaseCoordinatorPage.enableFeature(improvementsTabFeature);
    await users.logout();
  });

  it('should display private and published explorations', async function() {
    var EXPLORATION_SILMARILS = 'silmarils';
    var EXPLORATION_VINGILOT = 'Vingilot';
    var CATEGORY_ARCHITECTURE = 'Architecture';
    var CATEGORY_BUSINESS = 'Business';
    var LANGUAGE_ENGLISH = 'English';
    var LANGUAGE_FRANCAIS = 'français (French)';
    var LANGUAGE_FRANCAI = 'français';
    var LANGUAGE_DEUTSCH = 'Deutsch (German)';
    var LANGUAGE_DEUTSC = 'Deutsch';

    await users.createModerator(
      'varda@publicationAndLibrary.com', 'vardaPublicationAndLibrary');
    await users.createUser(
      'feanor@publicationAndLibrary.com', 'feanorPublicationAndLibrary');
    await users.createUser(
      'celebrimor@publicationAndLibrary.com', 'celebriorPublicationAndLibrary');
    await users.createUser(
      'earendil@publicationAndLibrary.com', 'earendilPublicationAndLibrary');

    await users.login('feanor@publicationAndLibrary.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_SILMARILS,
      CATEGORY_ARCHITECTURE,
      'hold the light of the two trees',
      LANGUAGE_DEUTSCH,
      true
    );

    await users.logout();

    await users.login('earendil@publicationAndLibrary.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_VINGILOT,
      CATEGORY_BUSINESS,
      'seek the aid of the Valar',
      LANGUAGE_DEUTSCH,
      true
    );
    await users.logout();

    await users.login('varda@publicationAndLibrary.com');
    await libraryPage.get();
    await libraryPage.selectLanguages([LANGUAGE_DEUTSC]);
    await libraryPage.findExploration(EXPLORATION_VINGILOT);
    await libraryPage.playExploration(EXPLORATION_VINGILOT);
    await general.moveToEditor(true);

    // Moderators can edit explorations.
    await waitFor.pageToFullyLoad();
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setLanguage(LANGUAGE_FRANCAIS);
    await explorationEditorPage.publishChanges('change language');
    await users.logout();

    await users.login('celebrimor@publicationAndLibrary.com');
    await workflow.createExploration(true);
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Celebrimbor wrote this'));
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setObjective(
      'preserve the works of the elves');

    await explorationEditorPage.saveChanges();

    // There are now two non-private explorations whose titles, categories
    // and languages are, respectively:
    // - silmarils, gems, Deutsch
    // - Vingilot, ships, français.
    var ALL_PUBLIC_EXPLORATION_TITLES = [
      EXPLORATION_SILMARILS, EXPLORATION_VINGILOT];

    var testCases = [{
      categories: [],
      languages: [],
      expectVisible: [EXPLORATION_SILMARILS, EXPLORATION_VINGILOT]
    }, {
      categories: [],
      languages: [LANGUAGE_FRANCAI],
      expectVisible: [EXPLORATION_VINGILOT]
    }, {
      categories: [],
      languages: [LANGUAGE_DEUTSC, LANGUAGE_FRANCAI],
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
      languages: [LANGUAGE_DEUTSC],
      expectVisible: [EXPLORATION_SILMARILS]
    }, {
      categories: [CATEGORY_ARCHITECTURE],
      languages: [LANGUAGE_FRANCAI],
      expectVisible: []
    }];

    // We now check explorations are visible under the right conditions.
    await browser.url('/search/find?q=&language_code=("en")');
    // The initial language selection should be just English.
    await libraryPage.expectCurrentLanguageSelectionToBe([LANGUAGE_ENGLISH]);
    // At the start, no categories are selected.
    await libraryPage.expectCurrentCategorySelectionToBe([]);

    // Reset the language selector.
    await libraryPage.deselectLanguages([LANGUAGE_ENGLISH]);

    for (var testCase of testCases) {
      await libraryPage.selectLanguages(testCase.languages);
      await libraryPage.selectCategories(testCase.categories);

      for (var explorationTitle in ALL_PUBLIC_EXPLORATION_TITLES) {
        if (testCase.expectVisible.indexOf(explorationTitle) !== -1) {
          await libraryPage.expectExplorationToBeVisible(explorationTitle);
        } else {
          await libraryPage.expectExplorationToBeHidden(explorationTitle);
        }
      }

      await libraryPage.deselectLanguages(testCase.languages);
      await libraryPage.deselectCategories(testCase.categories);
    }

    // Private explorations are not shown in the library.
    await libraryPage.expectExplorationToBeHidden('Vilya');

    await libraryPage.selectLanguages([LANGUAGE_FRANCAI]);
    await libraryPage.findExploration(EXPLORATION_VINGILOT);
    // The first letter of the objective is automatically capitalized.
    expect(await libraryPage.getExplorationObjective(EXPLORATION_VINGILOT))
      .toBe('Seek the aid of the Valar');

    await libraryPage.selectLanguages([LANGUAGE_DEUTSC]);
    await libraryPage.findExploration(EXPLORATION_SILMARILS);
    await libraryPage.playExploration(EXPLORATION_SILMARILS);
    await explorationPlayerPage.expectExplorationNameToBe('silmarils');

    await users.logout();
  });

  it('should not have any non translated strings', async function() {
    var EXPLORATION_SILMARILS = 'silmarils';
    var EXPLORATION_VINGILOT = 'Vingilot';
    var CATEGORY_ENVIRONMENT = 'Environment';
    var CATEGORY_BUSINESS = 'Business';
    var LANGUAGE_FRANCAIS = 'français (French)';
    var LANGUAGE_FRANCAI = 'français';
    await users.createUser('aule@example.com', 'Aule');

    await users.login('aule@example.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_SILMARILS,
      CATEGORY_BUSINESS,
      'hold the light of the two trees',
      LANGUAGE_FRANCAIS,
      true
    );
    await workflow.createAndPublishExploration(
      EXPLORATION_VINGILOT,
      CATEGORY_ENVIRONMENT,
      'seek the aid of the Valar',
      LANGUAGE_FRANCAIS,
      false
    );
    await users.logout();

    await libraryPage.get();
    await libraryPage.expectMainHeaderTextToBe(
      'Imagine what you could learn today...');
    await general.ensurePageHasNoTranslationIds();

    // Filter library explorations.
    await libraryPage.selectLanguages([LANGUAGE_FRANCAI]);
    await general.ensurePageHasNoTranslationIds();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});


describe('Permissions for private explorations', function() {
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var expectedConsoleErrors = null;

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    expectedConsoleErrors = [
      'Failed to load resource: the server responded with a status of 404'
    ];
  });

  it('should not be changeable if title is not given to exploration',
    async function() {
      await users.createUser('checkFor@title.com', 'Thanos');
      await users.login('checkFor@title.com');
      await workflow.createExploration(true);
      await explorationEditorPage.navigateToSettingsTab();

      await workflow.openEditRolesForm();
      expect(await workflow.canAddRolesToUsers()).toBe(false);
      expect(await workflow.checkForAddTitleWarning()).toBe(true);
      await explorationEditorSettingsTab.setTitle('Pass');
      await workflow.triggerTitleOnBlurEvent();
      expect(await workflow.canAddRolesToUsers()).toBe(true);
      expect(await workflow.checkForAddTitleWarning()).toBe(false);
      await users.logout();
    }
  );

  it('should be correct for collaborators', async function() {
    await users.createUser('alice@privileges.com', 'alicePrivileges');
    await users.createUser('bob@privileges.com', 'bobPrivileges');
    await users.createUser('eve@privileges.com', 'evePrivileges');

    await users.login('alice@privileges.com');
    await workflow.createExploration(true);
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle('CollaboratorPermissions');
    await workflow.addExplorationCollaborator('bobPrivileges');
    expect(await workflow.getExplorationManagers()).toEqual(
      ['alicePrivileges']);
    expect(await workflow.getExplorationCollaborators()).toEqual(
      ['bobPrivileges']);
    expect(await workflow.getExplorationPlaytesters(true)).toEqual([]);
    var explorationId = await general.getExplorationIdFromEditor();
    await users.logout();

    await users.login('bob@privileges.com');
    await general.openEditor(explorationId, true);
    await explorationEditorMainTab.setContent(
      await forms.toRichText('I love you'));
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorPage.saveChanges();
    await users.logout();

    await users.login('eve@privileges.com');
    await general.openEditor(explorationId, false);
    await general.expectErrorPage(404);
    await users.logout();
    expectedConsoleErrors.push(
      `The requested path /create/${explorationId} is not found.`);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors(expectedConsoleErrors);
  });
});
