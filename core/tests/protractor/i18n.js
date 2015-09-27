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
var gallery = require('../protractor_utils/gallery.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var checkForTranslationIds = function(selector) {
  element(by.css('.oppia-base-container')).then(function(value) {
    value.getInnerHtml().then(function(promiseValue) {
      expect(promiseValue).not.toContain('I18N_GALLERY');
    });
  });
};

describe('Gallery page', function() {
  it('should not have any non translated strings', function() {
    var EXPLORATION_SILMARILS = 'silmarils';
    var EXPLORATION_VINGILOT = 'Vingilot';
    var CATEGORY_ENVIRONMENT = 'Environment';
    var CATEGORY_BUSINESS = 'Business';
    var LANGUAGE_FRANCAIS = 'français';
    users.createUser('feanor@exmple.com', 'Feanor');

    users.login('feanor@exmple.com');
    workflow.createAndPublishExploration(
      EXPLORATION_SILMARILS, CATEGORY_BUSINESS,
      'hold the light of the two trees', LANGUAGE_FRANCAIS);
    workflow.createAndPublishExploration(
      EXPLORATION_VINGILOT, CATEGORY_ENVIRONMENT, 'seek the aid of the Valar');
    users.logout();

    browser.get('/gallery');
    checkForTranslationIds();

    // Filter gallery explorations
    gallery.setLanguages([LANGUAGE_FRANCAIS]);
    checkForTranslationIds();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
