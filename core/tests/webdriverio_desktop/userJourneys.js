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
 * @fileoverview End-to-end tests for user management.
 */

var action = require('../webdriverio_utils/action.js');
var CollectionEditorPage = require('../webdriverio_utils/CollectionEditorPage.js');
var CreatorDashboardPage = require('../webdriverio_utils/CreatorDashboardPage.js');
var ExplorationEditorPage = require('../webdriverio_utils/ExplorationEditorPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');
var ModeratorPage = require('../webdriverio_utils/ModeratorPage.js');
var PreferencesPage = require('../webdriverio_utils/PreferencesPage.js');
var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');

var _selectLanguage = async function (language) {
  var languageDropdown = $('.e2e-test-language-dropdown');
  await action.click('Language Dropdown', languageDropdown);
  var languageOption = $('.e2e-test-i18n-language-' + language);
  await action.click('Language Option', languageOption);
  // Wait for the language-change request to reach the backend.
  await waitFor.pageToFullyLoad();
};

describe('Basic user journeys', function () {
  describe('Account creation', function () {
    var libraryPage = null;
    var moderatorPage = null;

    beforeAll(function () {
      libraryPage = new LibraryPage.LibraryPage();
      moderatorPage = new ModeratorPage.ModeratorPage();
    });

    it('should create users', async function () {
      await users.createUser(
        'ordinaryuser@userManagement.com',
        'ordinaryUserManagement'
      );

      await users.login('ordinaryuser@userManagement.com');
      await libraryPage.get();
      await general.checkForConsoleErrors([]);

      await moderatorPage.get();
      await general.expectErrorPage(401);
      await general.checkForConsoleErrors([
        'Failed to load resource: the server responded with a status of 401',
      ]);
      await users.logout();
    });

    it('should create moderators', async function () {
      await users.createModerator(
        'mod@userManagement.com',
        'moderatorUserManagement'
      );
      await users.login('mod@userManagement.com');
      await general.checkForConsoleErrors([
        'Failed to load resource: the server responded with a status of 401',
      ]);
      await moderatorPage.get();
      await moderatorPage.expectModeratorPageToBeVisible();
      await general.openProfileDropdown();
      await users.logout();
      await general.checkForConsoleErrors([]);
    });

    // Usernames containing "admin" are not permitted.
    it('should create admins', async function () {
      await users.createAdmin(
        'admin@userManagement.com',
        'adm1nUserManagement'
      );
      await general.checkForConsoleErrors([]);
    });
  });
});

describe('Site language', function () {
  var collectionId = null;
  var creatorDashboardPage = null;
  var collectionEditorPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var firstExplorationId = null;
  var libraryPage = null;
  var preferencesPage = null;

  beforeAll(async function () {
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    libraryPage = new LibraryPage.LibraryPage();
    preferencesPage = new PreferencesPage.PreferencesPage();

    var CREATOR_USERNAME = 'langCreatorExplorations';
    var EDITOR_USERNAME = 'langCollections';

    await users.createUser('langCreator@explorations.com', CREATOR_USERNAME);
    await users.createCollectionEditor('lang@collections.com', EDITOR_USERNAME);

    await users.login('langCreator@explorations.com');
    await workflow.createExploration(true);
    firstExplorationId = await general.getExplorationIdFromEditor();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Language Test'),
      true
    );
    await explorationEditorMainTab.setInteraction('NumericInput');
    await explorationEditorMainTab.addResponse(
      'NumericInput',
      await forms.toRichText('Nice!!'),
      'END',
      true,
      'IsLessThanOrEqualTo',
      0
    );
    var responseEditor =
      await explorationEditorMainTab.getResponseEditor('default');
    await responseEditor.setFeedback(await forms.toRichText('Ok!!'));
    await explorationEditorMainTab.moveToState('END');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('END'),
      true
    );
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
    var url = await browser.getUrl();
    var pathname = url.split('/');
    collectionId = pathname[5];
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

  beforeEach(async function () {
    // Starting language is English.
    await browser.url('/about');
    await waitFor.pageToFullyLoad();
    await _selectLanguage('en');
    await libraryPage.get();
    await libraryPage.expectMainHeaderTextToBe(
      'Imagine what you could learn today...'
    );
  });

  it('should change after selecting a different language', async function () {
    await browser.url('/about');
    await waitFor.pageToFullyLoad();
    await _selectLanguage('es');

    await libraryPage.get();
    await libraryPage.expectMainHeaderTextToBe(
      'Imagina lo que podrías aprender hoy...'
    );
    await general.ensurePageHasNoTranslationIds();
  });

  it('should use language selected in the Preferences page.', async function () {
    await users.createUser('varda@example.com', 'Varda');
    await users.login('varda@example.com');
    await preferencesPage.get();
    await preferencesPage.selectSystemLanguage('Español');
    await preferencesPage.expectPageHeaderToBe('Preferencias');
    await general.ensurePageHasNoTranslationIds();
    await users.logout();
  });

  it('should set preferred audio language selected in the Preferences page.', async function () {
    await users.createUser('audioPlayer@example.com', 'audioPlayer');
    await users.login('audioPlayer@example.com');
    await preferencesPage.get();
    await preferencesPage.expectPreferredAudioLanguageNotToBe('中文 (Chinese)');
    await preferencesPage.selectPreferredAudioLanguage('中文 (Chinese)');
    // TODO(DubeySandeep): Add the test to check preferred audio language
    // choice gets reflected to the exploration player. This can be done once
    // we will finalize a way to upload an audio file in e2e test.
    await preferencesPage.expectPreferredAudioLanguageToBe('中文 (Chinese)');
    await general.ensurePageHasNoTranslationIds();
    await users.logout();
  });

  it('should save the language selected in the footer into the preferences.', async function () {
    await users.createUser('feanor@example.com', 'Feanor');
    await users.login('feanor@example.com');
    await browser.url('/about');
    await waitFor.pageToFullyLoad();
    await _selectLanguage('es');
    await libraryPage.get();
    await libraryPage.expectMainHeaderTextToBe(
      'Imagina lo que podrías aprender hoy...'
    );

    // The preference page shows the last selected language.
    await preferencesPage.get();
    await preferencesPage.expectPreferredSiteLanguageToBe('Español');
    await general.ensurePageHasNoTranslationIds();
    await users.logout();
  });

  it('should not change in an exploration', async function () {
    await users.login('langCreator@explorations.com');
    await browser.url('/about');
    await waitFor.pageToFullyLoad();
    await _selectLanguage('es');
    await general.openEditor(firstExplorationId, false);

    // Spanish is still selected.
    var placeholderElement = $('.e2e-test-float-form-input');
    await waitFor.visibilityOf(
      placeholderElement,
      'Placeholder Element taking too long to appear'
    );
    await waitFor.elementAttributeToBe(
      placeholderElement,
      'placeholder',
      'Ingresa un número',
      'Placeholder text taking too long to change from English to Spanish'
    );
    await general.ensurePageHasNoTranslationIds();
    await users.logout();
  });

  it('should not change in exploration and collection player for guest users', async function () {
    await browser.url('/about');
    await waitFor.pageToFullyLoad();
    await _selectLanguage('es');

    // Checking collection player page.
    await browser.url('/collection/' + collectionId);
    await waitFor.pageToFullyLoad();
    expect(await $('.e2e-test-share-collection-footer').getText()).toEqual(
      'COMPARTIR ESTA COLECCIÓN'
    );
    await general.ensurePageHasNoTranslationIds();
  });

  it('should show version details in the about page footer', async function () {
    var footerVersionInfoComponent = $('.e2e-test-footer-version-info');
    await browser.url('/learn');
    await waitFor.pageToFullyLoad();
    var footerVersionInfoInLearnPage =
      await footerVersionInfoComponent.isExisting();
    expect(footerVersionInfoInLearnPage).toBe(false);

    await browser.url('/about');
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      footerVersionInfoComponent,
      'Footer version info component taking too long to appear'
    );
    var footerVersionInfoText = await footerVersionInfoComponent.getText();
    var footerVersionTextRegex = /Version: [^\s]+ \(\w+\)/;
    expect(footerVersionTextRegex.test(footerVersionInfoText)).toBe(true);
  });

  afterEach(async function () {
    // Reset language back to English.
    await browser.url('/about');
    await waitFor.pageToFullyLoad();
    await _selectLanguage('en');
    await general.checkForConsoleErrors([]);
  });
});
