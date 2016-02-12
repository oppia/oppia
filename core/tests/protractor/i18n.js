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

var _selectLanguage = function(language) {
  element(by.name('protractor-test-i18n-language-' + language)).click();
};

describe('Translations\' language', function() {
  beforeEach(function() {
    // Starting language is English
    browser.get('/gallery');
    _selectLanguage('English');
    expect(browser.getTitle()).toEqual('Gallery - Oppia');
  });

  it('should change after selecting a different language', function() {
    _selectLanguage('Español');
    expect(browser.getTitle()).toEqual('Galería - Oppia');
  });

  it('should not change between different pages', function() {
    _selectLanguage('Español');
    // Go to a different page
    users.login('varda@example.com');
    browser.get('/signup?return_url=http%3A%2F%2Flocalhost%3A4445%2F');
    // Spanish is still selected
    expect(browser.getTitle()).toEqual('Registro - Oppia');
  });

  afterEach(function() {
    general.ensurePageHasNoTranslationIds();
  });
});
