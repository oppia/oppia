// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview  End-to-end tests which visit the static pages
 * and check for any console errors
 */

var general = require('../protractor_utils/general.js');
var ThanksPage = require('../protractor_utils/ThanksPage.js');

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
