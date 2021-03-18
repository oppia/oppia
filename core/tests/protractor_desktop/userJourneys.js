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
 * @fileoverview End-to-end tests for user management.
 */

var action = require('../protractor_utils/action.js');
var AdminPage = require('../protractor_utils/AdminPage.js');
var CollectionEditorPage =
  require('../protractor_utils/CollectionEditorPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationEditorPage = require(
  '../protractor_utils/ExplorationEditorPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var PreferencesPage = require('../protractor_utils/PreferencesPage.js');
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var _selectLanguage = async function(language) {
  await action.select(
    'Language Selector',
    element(by.css('.protractor-test-i18n-language-selector')),
    language);
  // Wait for the language-change request to reach the backend.
  await waitFor.pageToFullyLoad();
};


describe('Basic user journeys', function() {
  describe('Account creation', function() {
    var libraryPage = null;

    beforeAll(function() {
      libraryPage = new LibraryPage.LibraryPage();
    });

    it('should create users', async function() {
      await users.createUser(
        'ordinaryuser@userManagement.com', 'ordinaryUserManagement');

      await users.login('ordinaryuser@userManagement.com');
      await libraryPage.get();
      await general.checkForConsoleErrors([]);

      await browser.get(general.MODERATOR_URL_SUFFIX);
      await general.checkForConsoleErrors([
        'Failed to load resource: the server responded with a status of 401']);
      await users.logout();
    });

    it('should create moderators', async function() {
      await users.createModerator(
        'mod@userManagement.com', 'moderatorUserManagement');

      await users.login('mod@userManagement.com');
      await browser.get(general.MODERATOR_URL_SUFFIX);
      await general.openProfileDropdown();
      await users.logout();
      await general.checkForConsoleErrors([]);
    });

    // Usernames containing "admin" are not permitted.
    it('should create admins', async function() {
      await users.createAdmin(
        'admin@userManagement.com', 'adm1nUserManagement');
      await general.checkForConsoleErrors([]);
    });
  });
});

describe('Site language', function() {
  var adminPage = null;
  var collectionId = null;
  var creatorDashboardPage = null;
  var collectionEditorPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var firstExplorationId = null;
  var libraryPage = null;
  var preferencesPage = null;

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    libraryPage = new LibraryPage.LibraryPage();
    preferencesPage = new PreferencesPage.PreferencesPage();

    var CREATOR_USERNAME = 'langCreatorExplorations';
    var EDITOR_USERNAME = 'langCollections';

    await users.createUser('lang@collections.com', EDITOR_USERNAME);
    await users.createAndLoginAdminUser(
      'langCreator@explorations.com', CREATOR_USERNAME);
    await users.logout();
    await users.createAndLoginAdminUser(
      'testlangadm@collections.com', 'testlangadm');
    await adminPage.get();
    await adminPage.updateRole(EDITOR_USERNAME, 'collection editor');
    await users.logout();

    await users.login('langCreator@explorations.com');
    await workflow.createExploration(true);
    firstExplorationId = await general.getExplorationIdFromEditor();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Language Test'));
    await explorationEditorMainTab.setInteraction('NumericInput');
    await explorationEditorMainTab.addResponse(
      'NumericInput', await forms.toRichText('Nice!!'),
      'END', true, 'IsLessThanOrEqualTo', 0);
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText('Ok!!'));
    await explorationEditorMainTab.moveToState('END');
    await explorationEditorMainTab.setContent(await forms.toRichText('END'));
    await explorationEditorMainTab.setInteraction('EndExploration');

    // Save changes.
    var title = 'Language Test';
    var category = 'Languages';
    var objective = 'To test site language.';
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle(title);
    await explorationEditorSettingsTab.setCategory(category);
    await explorationEditorSettingsTab.setObjective(objective);
    await explorationEditorPage.saveChanges('Done!');

    // Publish changes.
    await workflow.publishExploration();
    await users.logout();

    await users.login('lang@collections.com');
    await creatorDashboardPage.get();
    await creatorDashboardPage.clickCreateActivityButton();
    await creatorDashboardPage.clickCreateCollectionButton();
    await waitFor.pageToFullyLoad();
    var url = await browser.getCurrentUrl();
    var pathname = url.split('/');
    // In the url a # is added at the end that is not part of collection ID.
    collectionId = pathname[5].slice(0, -1);
    // Add existing explorations.
    await collectionEditorPage.addExistingExploration(firstExplorationId);
    await collectionEditorPage.saveDraft();
    await collectionEditorPage.closeSaveModal();
    await collectionEditorPage.publishCollection();
    await collectionEditorPage.setTitle('Test Collection');
    await collectionEditorPage.setObjective('This is the test collection.');
    await collectionEditorPage.setCategory('Algebra');
    await collectionEditorPage.saveChanges();
    await users.logout();
  });

  beforeEach(async function() {
    // Starting language is English.
    await browser.get('/about');
    await waitFor.pageToFullyLoad();
    await _selectLanguage('English');
    await libraryPage.get();
    await libraryPage.expectMainHeaderTextToBe(
      'Imagine what you could learn today...');
  });

  it('should change after selecting a different language', async function() {
    await browser.get('/about');
    await waitFor.pageToFullyLoad();
    await _selectLanguage('Español');

    await libraryPage.get();
    await libraryPage.expectMainHeaderTextToBe(
      'Imagina lo que podrías aprender hoy...');
    await general.ensurePageHasNoTranslationIds();
  });

  it('should use language selected in the Preferences page.', async function() {
    await users.createUser('varda@example.com', 'Varda');
    await users.login('varda@example.com');
    await preferencesPage.get();
    await preferencesPage.selectSystemLanguage('Español');
    await preferencesPage.expectPageHeaderToBe('Preferencias');
    await general.ensurePageHasNoTranslationIds();
    await users.logout();
  });

  it('should set preferred audio language selected in the Preferences page.',
    async function() {
      await users.createUser('audioPlayer@example.com', 'audioPlayer');
      await users.login('audioPlayer@example.com');
      await preferencesPage.get();
      await preferencesPage.expectPreferredAudioLanguageNotToBe('Chinese');
      await preferencesPage.selectPreferredAudioLanguage('Chinese');
      // TODO(DubeySandeep): Add the test to check preferred audio language
      // choice gets reflected to the exploration player. This can be done once
      // we will finalize a way to upload an audio file in e2e test.
      await preferencesPage.expectPreferredAudioLanguageToBe('Chinese');
      await general.ensurePageHasNoTranslationIds();
      await users.logout();
    });

  it('should save the language selected in the footer into the preferences.',
    async function() {
      await users.createUser('feanor@example.com', 'Feanor');
      await users.login('feanor@example.com');
      await browser.get('/about');
      await waitFor.pageToFullyLoad();
      await _selectLanguage('Español');
      await libraryPage.get();
      await libraryPage.expectMainHeaderTextToBe(
        'Imagina lo que podrías aprender hoy...');

      // The preference page shows the last selected language.
      await preferencesPage.get();
      await preferencesPage.expectPreferredSiteLanguageToBe('Español');
      await general.ensurePageHasNoTranslationIds();
      await users.logout();
    }
  );

  it('should not change in an exploration', async function() {
    await users.login('langCreator@explorations.com');
    await browser.get('/about');
    await waitFor.pageToFullyLoad();
    await _selectLanguage('Español');
    await general.openEditor(firstExplorationId, false);

    // Spanish is still selected.
    var placeholder = await element(by.css('.protractor-test-float-form-input'))
      .getAttribute('placeholder');
    expect(placeholder).toEqual('Ingresa un número');
    await general.ensurePageHasNoTranslationIds();
    await users.logout();
  });

  it('should not change in exploration and collection player for guest users',
    async function() {
      await browser.get('/about');
      await waitFor.pageToFullyLoad();
      await _selectLanguage('Español');

      // Checking collection player page.
      await browser.get('/collection/' + collectionId);
      await waitFor.pageToFullyLoad();
      expect(await element(by.css('.oppia-share-collection-footer')).getText())
        .toEqual('COMPARTIR ESTA COLECCIÓN');
      await general.ensurePageHasNoTranslationIds();

      // Checking exploration player page.
      await browser.get('/explore/' + firstExplorationId);
      await waitFor.pageToFullyLoad();
      expect(await element(by.css('.author-profile-text')).getText())
        .toEqual('PERFILES DE AUTORES');
      await general.ensurePageHasNoTranslationIds();
    }
  );

  afterEach(async function() {
    // Reset language back to English.
    await browser.get('/about');
    await waitFor.pageToFullyLoad();
    await _selectLanguage('English');
    await general.checkForConsoleErrors([]);
  });
});
