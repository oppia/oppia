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
 * @fileoverview End-to-end tests for testing accessibility features
 * and check for any console errors
 */

var general = require('../protractor_utils/general.js');
var waitFor = require('../protractor_utils/waitFor.js');

var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('screenreader and keyboard user accessibility features', function() {
  var libraryPage = null;

  beforeEach(function() {
    libraryPage = new LibraryPage.LibraryPage();
  });

  it('should skip to the main content element', function() {
    libraryPage.get();
    browser.actions().sendKeys(protractor.Key.TAB).perform();
    var skipLink = element(by.css('.protractor-test-skip-link'));
    waitFor.elementToBeClickable(skipLink, 'Could not click skip link');
    skipLink.click();
    var mainContent = element(by.css('.protractor-test-main-content'));
    expect(mainContent.getAttribute('id'))
      .toEqual(browser.driver.switchTo().activeElement().getAttribute('id'));
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});

describe('Cache Slugs', function() {
  it('should check that errors get logged for missing resources', function() {
    browser.get('/console_errors');
    var expectedErrors = [
      'http://localhost:9001/build/fail/logo/288x128_logo_white.png'
    ];
    general.checkConsoleErrorsExist(expectedErrors);
  });
});

describe('Meta Tags', function() {
  var GET_STARTED_URL = '/get_started';
  var GET_STARTED_META = {
    name: 'Personalized Online Learning from Oppia',
    description: 'Learn how to get started using Oppia.'
  };
  beforeEach(function() {
    browser.get(GET_STARTED_URL);
    waitFor.pageToFullyLoad();
  });

  it('should set the correct itemprop meta tags', function() {
    var nameMeta = element(by.css('meta[itemprop="name"]'));
    var descriptionMeta = element(by.css('meta[itemprop="description"]'));
    expect(nameMeta.getAttribute('content')).toEqual(GET_STARTED_META.name);
    expect(descriptionMeta.getAttribute('content').toEqual(
      GET_STARTED_META.description));
  });

  it('should set the correct og meta tags', function() {
    var ogTitle = element(by.css('meta[property="og:title"]'));
    var ogDescription = element(by.css('meta[property="og:description"]'));
    var ogUrl = element(by.css('meta[property="og:url"]'));
    var ogImage = element(by.css('meta[property="og:image"]'));
    expect(ogTitle.getAttribute('content')).toEqual(GET_STARTED_META.name);
    expect(ogDescription.getAttribute('content')).toEqual(
      GET_STARTED_META.description);
    expect(ogUrl.getAttribute('content')).toEqual(
      'http://localhost:9001/get_started');
    if (general.isInDevMode()) {
      expect(ogImage.getAttribute('content')).toEqual(
        'http://localhost:9001/assets/images/logo/288x288_logo_mint.png');
    } else {
      expect(ogImage.getAttribute('content')).toEqual(
        'http://localhost:9001/build/assets/images/logo/288x288_logo_mint.png');
    }
  });

  it('should set the correct application name', function() {
    var appName = element(by.css('meta[name="application-name"]'));
    expect(appName.getAttribute('content')).toEqual('Oppia.org');
  });
});
