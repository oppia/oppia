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
 * @fileoverview End-to-end tests of the i18n platform and the completion of
 * translations.
 *
 * @author Milagro Teruel (milagro.teruel@gmail.com)
 */

var editor = require('../protractor_utils/editor.js');
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var AdminPage = require('../protractor_utils/AdminPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

var _selectLanguage = function(language) {
  element(by.css('.protractor-test-i18n-language-selector')).
    element(by.cssContainingText('option', language)).click();
  // Wait for the language-change request to reach the backend.
  general.waitForSystem();
};

describe('Site language', function() {
  var adminPage = null;
  var libraryPage = null;

  beforeEach(function() {
    adminPage = new AdminPage.AdminPage();
    libraryPage = new LibraryPage.LibraryPage();

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

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
