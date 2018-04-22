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

var editor = require('../protractor_utils/editor.js');
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var CollectionEditorPage =
  require('../protractor_utils/CollectionEditorPage.js');
var AdminPage = require('../protractor_utils/AdminPage.js');
var ExplorationPlayerPage = require(
  '../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var PreferencesPage = require('../protractor_utils/PreferencesPage.js');
var ThanksPage = require('../protractor_utils/ThanksPage.js');

var ERROR_PAGE_URL_SUFFIX = '/console_errors';

var _selectLanguage = function(language) {
  element(by.css('.protractor-test-i18n-language-selector')).
    element(by.cssContainingText('option', language)).click();
  // Wait for the language-change request to reach the backend.
  general.waitForSystem();
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
      users.logout();

      general.checkForConsoleErrors([]);
    });

    // Usernames containing "admin" are not permitted.
    it('should create admins', function() {
      users.createAdmin('admin@userManagement.com', 'adm1nUserManagement');
      general.checkForConsoleErrors([]);
    });
  });

  describe('Login Flow', function() {
    beforeEach(function() {
      users.createAndLoginUser('randomuser@gmail.com', 'r4nd0m');
    });

    it('visits the links in the dropdown', function() {
      var profileDropdown = element(by.css(
        '.protractor-test-profile-dropdown'));

      var classNames = [
        '.protractor-test-profile-link',
        '.protractor-test-dashboard-link',
        '.protractor-test-preferences-link',
        '.protractor-test-notifications-link'
      ];
      classNames.forEach(function(className) {
        browser.actions().mouseMove(profileDropdown).perform();
        general.waitForSystem(100);
        profileDropdown.element(by.css(className)).click();
      });
    });

    afterEach(function() {
      general.checkForConsoleErrors([]);
      users.logout();
    });
  });

  describe('Preferences', function() {
    var preferencesPage = null;

    beforeEach(function() {
      preferencesPage = new PreferencesPage.PreferencesPage();
    });

    it('should change editor role email checkbox value', function() {
      users.createUser('alice@preferences.com', 'alicePreferences');
      users.login('alice@preferences.com');
      preferencesPage.get();
      expect(preferencesPage.isEditorRoleEmailsCheckboxSelected()).toBe(true);
      preferencesPage.toggleEditorRoleEmailsCheckbox();
      expect(preferencesPage.isEditorRoleEmailsCheckboxSelected()).toBe(false);
      browser.refresh();
      expect(preferencesPage.isEditorRoleEmailsCheckboxSelected()).toBe(false);
    });

    it('should change feedback message email checkbox value', function() {
      users.createUser('bob@preferences.com', 'bobPreferences');
      users.login('bob@preferences.com');
      preferencesPage.get();
      expect(preferencesPage.isFeedbackEmailsCheckboxSelected()).toBe(true);
      preferencesPage.toggleFeedbackEmailsCheckbox();
      expect(preferencesPage.isFeedbackEmailsCheckboxSelected()).toBe(false);
      browser.refresh();
      expect(preferencesPage.isFeedbackEmailsCheckboxSelected()).toBe(false);
    });

    afterEach(function() {
      general.checkForConsoleErrors([]);
    });
  });

  describe('Library pages tour', function() {
    var EXPLORATION_TITLE = 'Test Exploration';
    var EXPLORATION_OBJECTIVE = 'To learn testing';
    var EXPLORATION_CATEGORY = 'Algorithms';
    var EXPLORATION_LANGUAGE = 'English';
    var EXPLORATION_RATING = 4;
    var SEARCH_TERM = 'python';
    var libraryPage = null;
    var explorationPlayerPage = null;

    beforeEach(function() {
      libraryPage = new LibraryPage.LibraryPage();
      explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    });

    var visitLibraryPage = function() {
      libraryPage.get();
    };

    var visitRecentlyPublishedPage = function() {
      browser.get('library/recently_published');
    };

    it('visits the search page', function() {
      visitLibraryPage();
      element(by.css('.protractor-test-search-input')).sendKeys(SEARCH_TERM);
      // It takes a while for the URL to change.
      general.waitForSystem();
      general.waitForSystem();
      expect(browser.getCurrentUrl()).toContain('search/find?q=python');
    });

    it('visits the library index page', function() {
      visitLibraryPage();
    });

    it('visits the top rated page', function() {
      // To visit the top rated page, at least one
      // exploration has to be rated by the user
      users.createUser('random@gmail.com', 'random');
      users.login('random@gmail.com');
      workflow.createAndPublishExploration(
        EXPLORATION_TITLE,
        EXPLORATION_CATEGORY,
        EXPLORATION_OBJECTIVE,
        EXPLORATION_LANGUAGE
      );
      visitLibraryPage();
      libraryPage.playExploration(EXPLORATION_TITLE);
      explorationPlayerPage.rateExploration(EXPLORATION_RATING);

      visitLibraryPage();
      element(by.css('.protractor-test-library-top-rated')).click();
      expect(browser.getCurrentUrl()).toContain('library/top_rated');
      users.logout();
    });

    it('visits the recent explorations page', function() {
      visitRecentlyPublishedPage();
      expect(browser.getCurrentUrl()).toContain('library/recently_published');
    });

    afterEach(function() {
      general.checkForConsoleErrors([]);
    });
  });
});

describe('Oppia static pages tour', function() {
  var thanksPage = null;

  beforeEach(function() {
    browser.get(general.SERVER_URL_PREFIX);
    thanksPage = new ThanksPage.ThanksPage();
  });

  it('visits the links in About dropdown', function() {
    var LINKS_CLASS_NAMES = [
      '.protractor-test-about-link',
      '.protractor-test-get-started-link',
      '.protractor-test-playbook-link'
    ];

    LINKS_CLASS_NAMES.forEach(function(className) {
      var dropdown = element(by.css('.protractor-test-about-oppia-list-item'));
      browser.actions().mouseMove(dropdown).perform();
      dropdown.element(by.css(className)).click();
      general.waitForSystem();
    });
  });

  it('visits the donate link', function() {
    element(by.css('.protractor-test-donate-link')).click();
  });

  it('visits the thanks for donating page', function() {
    thanksPage.get();
  });

  it('visits the terms page', function() {
    element(by.css('.protractor-test-terms-link')).click();
  });

  it('visits the privacy page', function() {
    element(by.css('.protractor-test-privacy-policy-link')).click();
  });

  afterEach(function() {
    general.checkForConsoleErrors([
      // TODO (Jacob) Remove when
      // https://code.google.com/p/google-cast-sdk/issues/detail?id=309 is fixed
      'cast_sender.js - Failed to load resource: net::ERR_FAILED',
      'Uncaught ReferenceError: ytcfg is not defined',
      // TODO (@pranavsid98) This error is caused by the upgrade from Chrome 60
      // to Chrome 61. Chrome version at time of recording this is 61.0.3163.
      'chrome-extension://invalid/ - Failed to load resource: net::ERR_FAILED',
      'Error parsing header X-XSS-Protection: 1; mode=block; ' +
      'report=https:\/\/www.google.com\/appserve\/security-bugs\/log\/youtube:',
    ]);
  });
});


describe('Site language', function() {
  var adminPage = null;
  var libraryPage = null;
  var creatorDashboardPage = null;
  var collectionEditorPage = null;
  var firstExplorationId = null;
  var collectionId = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    libraryPage = new LibraryPage.LibraryPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    collectionEditorPage = new CollectionEditorPage.CollectionEditorPage();

    var EDITOR_USERNAME = 'langCollections';
    var CREATOR_USERNAME = 'langCreatorExplorations';

    users.createUser('lang@collections.com', EDITOR_USERNAME);
    users.createUser('langCreator@explorations.com', CREATOR_USERNAME);
    users.createAndLoginAdminUser('testlangadm@collections.com', 'testlangadm');
    adminPage.get();
    adminPage.updateRole(EDITOR_USERNAME, 'collection editor');
    users.logout();

    users.login('langCreator@explorations.com');
    workflow.createAndPublishExploration(
      'First Exploration',
      'Languages',
      'First Test Exploration.'
    );
    general.getExplorationIdFromEditor().then(function(expId) {
      firstExplorationId = expId;
      users.logout();

      users.login('lang@collections.com');
      browser.get(general.SERVER_URL_PREFIX);
      var dropdown = element(by.css('.protractor-test-profile-dropdown'));
      browser.actions().mouseMove(dropdown).perform();
      dropdown.element(by.css('.protractor-test-dashboard-link')).click();
      browser.waitForAngular();
      creatorDashboardPage.clickCreateActivityButton();
      creatorDashboardPage.clickCreateCollectionButton();
      browser.getCurrentUrl().then(function(url) {
        var pathname = url.split('/');
        //in the url a # is added at the end that is not part of collection ID
        collectionId = pathname[5].slice(0, -1);
      });
      browser.waitForAngular();
      // Add existing explorations.
      collectionEditorPage.addExistingExploration(firstExplorationId);
      collectionEditorPage.saveDraft();
      collectionEditorPage.closeSaveModal();
      collectionEditorPage.publishCollection();
      collectionEditorPage.setTitle('Test Collection');
      collectionEditorPage.setObjective('This is the test collection.');
      collectionEditorPage.setCategory('Algebra');
      collectionEditorPage.saveChanges();
      browser.waitForAngular();
      users.logout();
    });
  });

  beforeEach(function() {
    // Starting language is English
    browser.get('/about');
    _selectLanguage('English');
    expect(browser.getTitle()).toEqual('About us - Oppia');
  });

  afterEach(function() {
    // Reset language back to English
    browser.get('/about');
    _selectLanguage('English');
  });

  it('should change after selecting a different language', function() {
    browser.get('/about');
    _selectLanguage('Español');
    libraryPage.get();
    expect(browser.getTitle()).toEqual('Biblioteca - Oppia');
    general.ensurePageHasNoTranslationIds();
  });

  it('should use language selected in the Preferences page.', function() {
    users.createUser('varda@example.com', 'Varda');
    users.login('varda@example.com');
    browser.get('/preferences');
    element(by.css('.protractor-test-system-language-selector')).click();
    var options = element.all(by.css('.select2-dropdown li')).filter(
      function(elem) {
        return elem.getText().then(function(text) {
          return text === 'Español';
        });
      });
    options.first().click();
    expect(element(by.css('.protractor-test-preferences-title'))
      .getText()).toEqual('Preferencias');
    general.ensurePageHasNoTranslationIds();
    users.logout();
  });

  it('should save the language selected in the footer into the preferences.',
    function() {
      users.createUser('feanor@example.com', 'Feanor');
      users.login('feanor@example.com');
      browser.get('/about');
      _selectLanguage('Español');
      libraryPage.get();
      expect(browser.getTitle()).toEqual('Biblioteca - Oppia');

      // The preference page shows the last selected language
      browser.get('/preferences');
      language = element(by.css('.protractor-test-system-language-selector'))
        .element(by.css('.select2-selection__rendered'));
      expect(language.getText(), 'Español');
      expect(browser.getTitle()).toEqual(
        'Cambiar sus preferencias de perfil - Oppia');
      general.ensurePageHasNoTranslationIds();
      users.logout();
    }
  );

  it('should be used in titles of pages without controllers', function() {
    browser.get('/about');
    _selectLanguage('English');
    expect(browser.getTitle()).toEqual('About us - Oppia');
    _selectLanguage('Español');
    expect(browser.getTitle()).toEqual('Acerca de nosotros - Oppia');
    general.ensurePageHasNoTranslationIds();
  });

  it('should not change in an exploration', function() {
    users.createUser('mangue@example.com', 'Mangue');
    users.login('mangue@example.com', true);
    browser.get('/about');
    _selectLanguage('Español');

    // Create an exploration.
    workflow.createExploration();
    general.getExplorationIdFromEditor().then(function(expId) {
      explorationId = expId;
      editor.setContent(forms.toRichText('Language Test'));
      editor.setInteraction('NumericInput');
      editor.addResponse(
        'NumericInput', forms.toRichText('Nice!!'),
        'END', true, 'IsLessThanOrEqualTo', 0);
      editor.setDefaultOutcome(forms.toRichText('Ok!!'), null, false);
      editor.moveToState('END');
      editor.setContent(forms.toRichText('END'));
      editor.setInteraction('EndExploration');

      // Save changes.
      title = 'Language Test';
      category = 'Languages';
      objective = 'To test site language.';
      editor.setTitle(title);
      editor.setCategory(category);
      editor.setObjective(objective);
      editor.saveChanges('Done!');

      // Publish changes.
      workflow.publishExploration();
      general.openEditor(expId);

      // Spanish is still selected.
      var placeholder = element(by.css('.protractor-test-float-form-input'))
        .getAttribute('placeholder');
      expect(placeholder).toEqual('Ingresa un número');
      general.ensurePageHasNoTranslationIds();
      users.logout();
    });
  });

  it('should not change in exploration and collection player for guest users',
    function() {
      browser.get('/about');
      _selectLanguage('Español');

      // Checking collection player page.
      browser.get('/collection/' + collectionId);
      browser.waitForAngular();
      expect(element(by.css('.oppia-share-collection-footer')).getText())
        .toEqual('COMPARTIR ESTA COLECCIÓN');
      general.ensurePageHasNoTranslationIds();

      // Checking exploration player page.
      browser.get('/explore/' + firstExplorationId);
      browser.waitForAngular();
      expect(element(by.css('.author-profile-text')).getText())
        .toEqual('PERFILES DE AUTORES');
      general.ensurePageHasNoTranslationIds();
    }
  );

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});


describe('Cache Slugs', function() {
  it('should check that errors get logged for missing resources', function() {
    browser.get(ERROR_PAGE_URL_SUFFIX);
    var expectedErrors = [
      'http://localhost:9001/build/fail/logo/288x128_logo_white.png'
    ];
    general.checkConsoleErrorsExist(expectedErrors);
  });
});
