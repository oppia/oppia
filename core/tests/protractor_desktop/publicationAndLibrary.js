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

var AdminPage = require('../protractor_utils/AdminPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('Library index page', function() {
  var adminPage = null;
  var libraryPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    libraryPage = new LibraryPage.LibraryPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();

    await users.createAndLoginAdminUser(
      'superUser@publicationAndLibrary.com', 'superUser');
    // TODO(#7569): Change this test to work with the improvements tab.
    await adminPage.editConfigProperty(
      'Exposes the Improvements Tab for creators in the exploration editor',
      'Boolean',
      async function(elem) {
        await elem.setValue(false);
      });
    await users.logout();
  });

  it('should display private and published explorations', async function() {
    var EXPLORATION_SILMARILS = 'silmarils';
    var EXPLORATION_VINGILOT = 'Vingilot';
    var CATEGORY_ARCHITECTURE = 'Architecture';
    var CATEGORY_BUSINESS = 'Business';
    var LANGUAGE_ENGLISH = 'English';
    var LANGUAGE_FRANCAIS = 'français';
    var LANGUAGE_DEUTSCH = 'Deutsch';

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
      EXPLORATION_SILMARILS, CATEGORY_ARCHITECTURE,
      'hold the light of the two trees', LANGUAGE_DEUTSCH);

    await users.logout();

    await users.login('earendil@publicationAndLibrary.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_VINGILOT, CATEGORY_BUSINESS, 'seek the aid of the Valar');
    await users.logout();

    await users.login('varda@publicationAndLibrary.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_VINGILOT);
    await libraryPage.playExploration(EXPLORATION_VINGILOT);
    await general.moveToEditor();
    // Moderators can edit explorations.
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setLanguage(LANGUAGE_FRANCAIS);
    await explorationEditorPage.saveChanges('change language');
    await users.logout();

    await users.login('celebrimor@publicationAndLibrary.com');
    await workflow.createExploration();
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
    await browser.get('/search/find?q=&language_code=("en")');
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

    await libraryPage.findExploration(EXPLORATION_VINGILOT);
    // The first letter of the objective is automatically capitalized.
    expect(await libraryPage.getExplorationObjective(EXPLORATION_VINGILOT))
      .toBe('Seek the aid of the Valar');
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
    var LANGUAGE_FRANCAIS = 'français';
    await users.createUser('aule@example.com', 'Aule');

    await users.login('aule@example.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_SILMARILS, CATEGORY_BUSINESS,
      'hold the light of the two trees', LANGUAGE_FRANCAIS);
    await workflow.createAndPublishExploration(
      EXPLORATION_VINGILOT, CATEGORY_ENVIRONMENT, 'seek the aid of the Valar');
    await users.logout();

    await libraryPage.get();
    await libraryPage.expectMainHeaderTextToBe(
      'Imagine what you could learn today...');
    await general.ensurePageHasNoTranslationIds();

    // Filter library explorations.
    await libraryPage.selectLanguages([LANGUAGE_FRANCAIS]);
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

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
  });

  it('should not be changeable if title is not given to exploration',
    async function() {
      await users.createUser('checkFor@title.com', 'Thanos');
      await users.login('checkFor@title.com');
      await workflow.createExploration();
      await explorationEditorPage.navigateToSettingsTab();

      await workflow.openEditRolesForm();
      expect(await workflow.canAddRolesToUsers()).toBe(false);
      expect(await workflow.checkForAddTitleWarning()).toBe(true);
      await explorationEditorSettingsTab.setTitle('Pass');
      await workflow.triggerTitleOnBlurEvent();
      expect(await workflow.canAddRolesToUsers()).toBe(true);
      expect(await workflow.checkForAddTitleWarning()).toBe(false);
    }
  );

  it('should be correct for collaborators', async function() {
    await users.createUser('alice@privileges.com', 'alicePrivileges');
    await users.createUser('bob@privileges.com', 'bobPrivileges');
    await users.createUser('eve@privileges.com', 'evePrivileges');

    await users.login('alice@privileges.com');
    await workflow.createExploration();
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle('CollaboratorPermissions');
    await workflow.addExplorationCollaborator('bobPrivileges');
    expect(await workflow.getExplorationManagers()).toEqual(
      ['alicePrivileges']);
    expect(await workflow.getExplorationCollaborators()).toEqual(
      ['bobPrivileges']);
    expect(await workflow.getExplorationPlaytesters()).toEqual([]);
    var explorationId = await general.getExplorationIdFromEditor();
    await users.logout();

    await users.login('bob@privileges.com');
    await general.openEditor(explorationId);
    await explorationEditorMainTab.setContent(
      await forms.toRichText('I love you'));
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorPage.saveChanges();
    await users.logout();

    await users.login('eve@privileges.com');
    await general.openEditor(explorationId);
    await general.expect404Error();
    await users.logout();
  });

  it('should be correct for voice artists', async function() {
    await users.createUser('expOwner@oppia.tests', 'expOwner');
    await users.createUser('voiceArtist@oppia.tests', 'voiceArtist');
    await users.createUser('guestUser@oppia.tests', 'guestUser');

    await users.login('expOwner@oppia.tests');
    await workflow.createExploration();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('this is card 1'));
    await explorationEditorPage.saveChanges('Added content to first card.');
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle('voice artists');
    await workflow.addExplorationVoiceArtist('voiceArtist');
    expect(await workflow.getExplorationManagers()).toEqual(['expOwner']);
    expect(await workflow.getExplorationCollaborators()).toEqual([]);
    expect(await workflow.getExplorationVoiceArtists()).toEqual(
      ['voiceArtist']);
    expect(await workflow.getExplorationPlaytesters()).toEqual([]);
    var explorationId = await general.getExplorationIdFromEditor();
    await users.logout();

    await users.login('voiceArtist@oppia.tests');
    await general.openEditor(explorationId);
    await explorationEditorMainTab.expectContentToMatch(
      await forms.toRichText('this is card 1'));
    expect(await element(by.css(
      '.protractor-test-save-changes')).isPresent()).toBeTruthy();
    await users.logout();

    await users.login('guestUser@oppia.tests');
    await general.openEditor(explorationId);
    await general.expect404Error();
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([
      'Failed to load resource: the server responded with a status of 404'
    ]);
  });
});
