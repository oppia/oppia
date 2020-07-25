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
var users = require('../protractor_utils/users.js');

var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('screenreader and keyboard user accessibility features', function() {
  var libraryPage = null;

  var triggerKeys = async function(key) {
    await browser.actions().sendKeys(
      protractor.Key.chord(protractor.Key.CONTROL, key)).perform();
    await waitFor.pageToFullyLoad();
  };

  var testNavigationShortcuts = async function(url) {
    await browser.get(url);
    await waitFor.pageToFullyLoad();
    await triggerKeys('0');
    expect(await browser.getCurrentUrl()).toEqual('http://localhost:9001/get-started');
    await triggerKeys('1');
    expect(await browser.getCurrentUrl()).toEqual('http://localhost:9001/community-library');
    await triggerKeys('2');
    expect(await browser.getCurrentUrl()).toEqual('http://localhost:9001/learner-dashboard');
    await triggerKeys('3');
    expect(await browser.getCurrentUrl()).toEqual('http://localhost:9001/creator-dashboard');
    await triggerKeys('4');
    expect(await browser.getCurrentUrl()).toEqual('http://localhost:9001/about');
    await triggerKeys('5');
    expect(await browser.getCurrentUrl()).toEqual('http://localhost:9001/notifications');
    await triggerKeys('6');
    expect(await browser.getCurrentUrl()).toEqual('http://localhost:9001/preferences');
  };

  beforeEach(function() {
    libraryPage = new LibraryPage.LibraryPage();
  });

  it('should skip to the main content element', async function() {
    await libraryPage.get();
    await browser.actions().sendKeys(protractor.Key.TAB).perform();
    var skipLink = element(by.css('.protractor-test-skip-link'));
    await waitFor.elementToBeClickable(skipLink, 'Could not click skip link');
    await skipLink.click();
    var mainContent = element(by.css('.protractor-test-main-content'));
    expect(await mainContent.getAttribute('id')).toEqual(
      await (await browser.driver.switchTo().activeElement())
        .getAttribute('id'));
  });

  it('should test navigation shortcuts for static webpages',
    async function() {
      // Should Create a user and login.
      await users.createUser('user11@accessibility.com', 'user11accessibility');
      await users.login('user11@accessibility.com', true);

      // Should test navigation shortcuts.
      await testNavigationShortcuts('community-library');
      await testNavigationShortcuts('creator-dashboard');
      await testNavigationShortcuts('get-started');
      await testNavigationShortcuts('about');
      await testNavigationShortcuts('privacy-policy');
      await testNavigationShortcuts('donate');
      await testNavigationShortcuts('preferences');
      await testNavigationShortcuts('learner-dashboard');
      await testNavigationShortcuts('notifications');
    });

    afterEach(async function() {
      await general.checkForConsoleErrors([]);
    });
});

describe('Cache Slugs', function() {
  it('should check that errors get logged for missing resources',
    async function() {
      await browser.get('/console_errors');
      var expectedErrors = [
        'http://localhost:9001/build/fail/logo/288x128_logo_white.png',
        'http://localhost:9001/build/fail/logo/288x128_logo_white.webp'
      ];
      await general.checkForConsoleErrors(expectedErrors);
    });
});
