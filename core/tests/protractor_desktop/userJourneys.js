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
var AdminPage = require('../protractor_utils/AdminPage.js');
var CollectionEditorPage =
  require('../protractor_utils/CollectionEditorPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationEditorPage = require(
  '../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage = require(
  '../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var PreferencesPage = require('../protractor_utils/PreferencesPage.js');
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var _selectLanguage = function(language) {
  element(by.css('.protractor-test-i18n-language-selector')).
    element(by.cssContainingText('option', language)).click();
  // Wait for the language-change request to reach the backend.
  waitFor.pageToFullyLoad();
};


describe('Basic user journeys', function() {
  describe('Account creation', function() {
    var libraryPage = null;

    beforeEach(function() {
      libraryPage = new LibraryPage.LibraryPage();
    });

    it('should create users', function() {
      users.createUser(
        'ordinaryuser@userManagement.com', 'ordinaryUserManagement');

      users.login('ordinaryuser@userManagement.com');
      libraryPage.get();
      general.checkForConsoleErrors([]);

      browser.get(general.MODERATOR_URL_SUFFIX);
      general.checkForConsoleErrors([
        'Failed to load resource: the server responded with a status of 401']);
      users.logout();
    });

    it('should create moderators', function() {
      users.createModerator(
        'mod@userManagement.com', 'moderatorUserManagement');

      users.login('mod@userManagement.com');
      browser.get(general.MODERATOR_URL_SUFFIX);
      var profileDropdown = element(
        by.css('.protractor-test-profile-dropdown'));
      waitFor.elementToBeClickable(
        profileDropdown, 'Could not click profile dropdown');
      profileDropdown.click();
      users.logout();
      general.checkForConsoleErrors([]);
    });

    // Usernames containing "admin" are not permitted.
    it('should create admins', function() {
      users.createAdmin('admin@userManagement.com', 'adm1nUserManagement');
      general.checkForConsoleErrors([]);
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

  beforeAll(function() {
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

    users.createUser('lang@collections.com', EDITOR_USERNAME);
    users.createUser('langCreator@explorations.com', CREATOR_USERNAME);
    users.createAndLoginAdminUser('testlangadm@collections.com', 'testlangadm');
    adminPage.get();
    adminPage.updateRole(EDITOR_USERNAME, 'collection editor');
    users.logout();

    users.login('langCreator@explorations.com');
    workflow.createExploration();
    general.getExplorationIdFromEditor().then(function(expId) {
      firstExplorationId = expId;
      explorationEditorMainTab.setContent(forms.toRichText('Language Test'));
      explorationEditorMainTab.setInteraction('NumericInput');
      explorationEditorMainTab.addResponse(
        'NumericInput', forms.toRichText('Nice!!'),
        'END', true, 'IsLessThanOrEqualTo', 0);
      explorationEditorMainTab.getResponseEditor('default').setFeedback(
        forms.toRichText('Ok!!'));
      explorationEditorMainTab.moveToState('END');
      explorationEditorMainTab.setContent(forms.toRichText('END'));
      explorationEditorMainTab.setInteraction('EndExploration');

      // Save changes.
      var title = 'Language Test';
      var category = 'Languages';
      var objective = 'To test site language.';
      explorationEditorPage.navigateToSettingsTab();
      explorationEditorSettingsTab.setTitle(title);
      explorationEditorSettingsTab.setCategory(category);
      explorationEditorSettingsTab.setObjective(objective);
      explorationEditorPage.saveChanges('Done!');

      // Publish changes.
      workflow.publishExploration();
      users.logout();

      users.login('lang@collections.com');
      creatorDashboardPage.get();
      creatorDashboardPage.clickCreateActivityButton();
      creatorDashboardPage.clickCreateCollectionButton();
      browser.getCurrentUrl().then(function(url) {
        var pathname = url.split('/');
        // in the url a # is added at the end that is not part of collection ID
        collectionId = pathname[5].slice(0, -1);
      });
      // Add existing explorations.
      collectionEditorPage.addExistingExploration(firstExplorationId);
      collectionEditorPage.saveDraft();
      collectionEditorPage.closeSaveModal();
      collectionEditorPage.publishCollection();
      collectionEditorPage.setTitle('Test Collection');
      collectionEditorPage.setObjective('This is the test collection.');
      collectionEditorPage.setCategory('Algebra');
      collectionEditorPage.saveChanges();
      users.logout();
    });
  });

  beforeEach(function() {
    // Starting language is English
    browser.get('/about');
    waitFor.pageToFullyLoad();
    _selectLanguage('English');
    libraryPage.get();
    libraryPage.expectMainHeaderTextToBe(
      'Imagine what you could learn today...');
  });

  it('should change after selecting a different language', function() {
    browser.get('/about');
    waitFor.pageToFullyLoad();
    _selectLanguage('Español');

    libraryPage.get();
    libraryPage.expectMainHeaderTextToBe(
      'Imagina lo que podrías aprender hoy...');
    general.ensurePageHasNoTranslationIds();
  });

  it('should use language selected in the Preferences page.', function() {
    users.createUser('varda@example.com', 'Varda');
    users.login('varda@example.com');
    preferencesPage.get();
    preferencesPage.selectSystemLanguage('Español');
    preferencesPage.expectPageHeaderToBe('Preferencias');
    general.ensurePageHasNoTranslationIds();
    users.logout();
  });

  it('should set preferred audio language selected in the Preferences page.',
    function() {
      users.createUser('audioPlayer@example.com', 'audioPlayer');
      users.login('audioPlayer@example.com');
      preferencesPage.get();
      preferencesPage.expectPreferredAudioLanguageNotToBe('Chinese');
      preferencesPage.selectPreferredAudioLanguage('Chinese');
      // TODO(DubeySandeep): Add the test to check preferred audio language
      // choice gets reflected to the exploration player. This can be done once
      // we will finalize a way to upload an audio file in e2e test.
      preferencesPage.expectPreferredAudioLanguageToBe('Chinese');
      general.ensurePageHasNoTranslationIds();
      users.logout();
    });

  it('should save the language selected in the footer into the preferences.',
    function() {
      users.createUser('feanor@example.com', 'Feanor');
      users.login('feanor@example.com');
      browser.get('/about');
      waitFor.pageToFullyLoad();
      _selectLanguage('Español');
      libraryPage.get();
      libraryPage.expectMainHeaderTextToBe(
        'Imagina lo que podrías aprender hoy...');

      // The preference page shows the last selected language
      preferencesPage.get();
      preferencesPage.expectPreferredSiteLanguageToBe('Español');
      general.ensurePageHasNoTranslationIds();
      users.logout();
    }
  );

  it('should not change in an exploration', function() {
    users.login('langCreator@explorations.com', true);
    browser.get('/about');
    waitFor.pageToFullyLoad();
    _selectLanguage('Español');

    general.openEditor(firstExplorationId);

    // Spanish is still selected.
    var placeholder = element(by.css('.protractor-test-float-form-input'))
      .getAttribute('placeholder');
    expect(placeholder).toEqual('Ingresa un número');
    general.ensurePageHasNoTranslationIds();
    users.logout();
  });

  it('should not change in exploration and collection player for guest users',
    function() {
      browser.get('/about');
      waitFor.pageToFullyLoad();
      _selectLanguage('Español');

      // Checking collection player page.
      browser.get('/collection/' + collectionId);
      waitFor.pageToFullyLoad();
      expect(element(by.css('.oppia-share-collection-footer')).getText())
        .toEqual('COMPARTIR ESTA COLECCIÓN');
      general.ensurePageHasNoTranslationIds();

      // Checking exploration player page.
      browser.get('/explore/' + firstExplorationId);
      waitFor.pageToFullyLoad();
      expect(element(by.css('.author-profile-text')).getText())
        .toEqual('PERFILES DE AUTORES');
      general.ensurePageHasNoTranslationIds();
    }
  );

  afterEach(function() {
    // Reset language back to English
    browser.get('/about');
    waitFor.pageToFullyLoad();
    _selectLanguage('English');
    general.checkForConsoleErrors([]);
  });
});
