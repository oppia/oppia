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
 * @fileoverview  End-to-end tests for testing accessibility features
 * and check for any console errors
 */

var general = require('../protractor_utils/general.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('screenreader and keyboard user accessibility features', function() {
  var libraryPage = null;

  beforeEach(function() {
    libraryPage = new LibraryPage.LibraryPage();
  });

  it('should skip to the main content element', function() {
    var mainContent = element(by.css('.protractor-test-main-content'));
    var skipToMainContentLink = element(by.css('.protractor-test-skip-link'));
    var until = protractor.ExpectedConditions;
    libraryPage.get();
    browser.actions().sendKeys(protractor.Key.TAB).perform();
    browser.wait(
      until.elementToBeClickable(skipToMainContentLink),
      5000, 'Skip to main content link is not clickable');
    skipToMainContentLink.click();
    expect(mainContent.getAttribute('id'))
      .toEqual(browser.driver.switchTo().activeElement().getAttribute('id'));
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
