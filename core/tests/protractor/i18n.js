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

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var admin = require('../protractor_utils/admin.js');

var _selectLanguage = function(language) {
  element(by.css('.protractor-test-i18n-language-selector')).
    element(by.cssContainingText('option', language)).click();
};

describe('Site language', function() {
  beforeEach(function() {
    // Starting language is English
    browser.get('/splash');
    _selectLanguage('English');
    expect(browser.getTitle()).toEqual('Home - Oppia');
  });

  afterEach(function() {
    // Reset language back to English
    browser.get('/splash');
    _selectLanguage('English');
  });

  it('should change after selecting a different language', function() {
    browser.get('/splash');
    _selectLanguage('Español');
    browser.get('/library');
    expect(browser.getTitle()).toEqual('Oppia - Biblioteca');
    general.ensurePageHasNoTranslationIds();
  });

  it('should use language selected in the Preferences page.', function() {
    users.createUser('varda@example.com', 'Varda');
    users.login('varda@example.com');
    browser.get('/preferences');
    element(by.css('.protractor-test-system-language-selector')).click();
    var options = element.all(by.css('.select2-drop-active li div')).filter(
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
    browser.get('/splash');
    _selectLanguage('Español');
    browser.get('/library');
    expect(browser.getTitle()).toEqual('Oppia - Biblioteca');

    // The preference page shows the last selected language
    browser.get('/preferences');
    language = element(by.css('.protractor-test-system-language-selector'))
      .element(by.css('.select2-chosen'));
    expect(language.getText(), 'Español');
    expect(browser.getTitle()).toEqual('Preferencias - Oppia');
    general.ensurePageHasNoTranslationIds();
    users.logout();
  });

  it('should be used in titles of pages without controllers', function() {
    browser.get('/about');
    _selectLanguage('English');
    expect(browser.getTitle()).toEqual('About - Oppia');
    _selectLanguage('Español');
    expect(browser.getTitle()).toEqual('Acerca de - Oppia');
    general.ensurePageHasNoTranslationIds();
  });

  it('should not change in an exploration', function() {
    users.createUser('mangue@example.com', 'Mangue');
    users.login('mangue@example.com', true);
    browser.get('/splash');
    _selectLanguage('Español');
    admin.reloadExploration('protractor_test_1.yaml');
    // Open exploration
    general.openPlayer('12');
    // Spanish is still selected
    var placeholder = element(by.css('.protractor-test-float-form-input'))
      .getAttribute('placeholder');
    expect(placeholder).toEqual('Ingresa un número');
    general.ensurePageHasNoTranslationIds();
    users.logout();
  });
});
