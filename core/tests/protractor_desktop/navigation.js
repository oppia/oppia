// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for general site navigation.
 */
var general = require('../protractor_utils/general.js');
var waitFor = require('../protractor_utils/waitFor.js');
var ThanksPage = require('../protractor_utils/ThanksPage.js');
var GetStartedPage = require('../protractor_utils/GetStartedPage.js');

describe('Oppia static pages tour', function() {
  var thanksPage = null;

  beforeEach(function() {
    browser.get(general.SERVER_URL_PREFIX);
    waitFor.pageToFullyLoad();
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
      waitFor.pageToFullyLoad();
    });
  });

  it('visits the donate link', function() {
    element(by.css('.protractor-test-donate-link')).click();
    waitFor.pageToFullyLoad();
  });

  it('visits the thanks for donating page', function() {
    thanksPage = new ThanksPage.ThanksPage();
    thanksPage.get();
  });

  it('visits the terms page', function() {
    element(by.css('.protractor-test-terms-link')).click();
    waitFor.pageToFullyLoad();
  });

  it('visits the privacy page', function() {
    element(by.css('.protractor-test-privacy-policy-link')).click();
    waitFor.pageToFullyLoad();
  });

  it('visits the Fractions landing page', function() {
    browser.get('/fractions');
    waitFor.pageToFullyLoad();
  });

  it('visits the Partners landing page', function() {
    browser.get('/partners');
    waitFor.pageToFullyLoad();
  });

  it('visits the Nonprofits landing page', function() {
    browser.get('/nonprofits');
    waitFor.pageToFullyLoad();
  });

  it('visits the Parents landing page', function() {
    browser.get('/parents');
    waitFor.pageToFullyLoad();
  });

  it('visits the Teachers landing page', function() {
    browser.get('/teachers');
    waitFor.pageToFullyLoad();
  });

  it('visits the Volunteers landing page', function() {
    browser.get('/volunteers');
    waitFor.pageToFullyLoad();
  });

  afterEach(function() {
    general.checkForConsoleErrors([
      // TODO(Jacob): Remove when
      // https://code.google.com/p/google-cast-sdk/issues/detail?id=309 is fixed
      'cast_sender.js - Failed to load resource: net::ERR_FAILED',
      'Uncaught ReferenceError: ytcfg is not defined',
      // TODO(pranavsid98): This error is caused by the upgrade from Chrome 60
      // to Chrome 61. Chrome version at time of recording this is 61.0.3163.
      'chrome-extension://invalid/ - Failed to load resource: net::ERR_FAILED',
      'Error parsing header X-XSS-Protection: 1; mode=block; ' +
      'report=https:\/\/www.google.com\/appserve\/security-bugs\/log\/youtube:',
    ]);
  });
});

describe('Meta Tags', function() {
  var EXPECTED_META_NAME = 'Personalized Online Learning from Oppia';
  var EXPECTED_META_DESCRIPTION = 'Learn how to get started using Oppia.';
  var getStartedPage = new GetStartedPage.GetStartedPage();

  beforeEach(function() {
    getStartedPage.get();
  });

  it('should set the correct itemprop meta tags', function() {
    expect(getStartedPage.getMetaTagContent('name', 'itemprop')).toEqual(
      EXPECTED_META_NAME);
    expect(getStartedPage.getMetaTagContent('description', 'itemprop')).toEqual(
      EXPECTED_META_DESCRIPTION);
  });

  it('should set the correct og meta tags', function() {
    expect(getStartedPage.getMetaTagContent('title', 'og')).toEqual(
      EXPECTED_META_NAME);
    expect(getStartedPage.getMetaTagContent('description', 'og')).toEqual(
      EXPECTED_META_DESCRIPTION);
    expect(getStartedPage.getMetaTagContent('url', 'og')).toEqual(
      'http://localhost:9001/get_started');
  });

  it('should set the correct application name', function() {
    expect(getStartedPage.getMetaTagContent(
      'application-name', 'name')).toEqual('Oppia.org');
  });
});

describe('DEV MODE Test', function() {
  it('should not show Dev Mode label in prod', function() {
    browser.get('/splash');
    waitFor.pageToFullyLoad();
    general.isInDevMode().then(function(isInDevMode) {
      expect(element(
        by.css('.protractor-test-dev-mode')).isPresent()).toBe(isInDevMode);
    });
  });
});

describe('Static Pages Tour', function() {
  var getStartedPage = new GetStartedPage.GetStartedPage();
  it('visits the Get started page', function() {
    getStartedPage.get();
    waitFor.pageToFullyLoad();
    expect(element(
      by.css('.protractor-test-get-started-page')).isPresent()).toBe(true);
  });

  it('visits the Teach page', function() {
    browser.get('/teach');
    waitFor.pageToFullyLoad();
    expect(element(
      by.css('.protractor-test-teach-page')).isPresent()).toBe(true);
  });

  it('visits the Splash page', function() {
    browser.get('/splash');
    waitFor.pageToFullyLoad();
    expect(element(
      by.css('.protractor-test-splash-page')).isPresent()).toBe(true);
  });
});
