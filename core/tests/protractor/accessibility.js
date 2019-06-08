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
var GetStartedPage = require('../protractio_utils/GetStartedPage.js');

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
    expect(getStartedPage.getMetaTagContent('application-name')).toEqual(
      'Oppia.org');
  });
});
