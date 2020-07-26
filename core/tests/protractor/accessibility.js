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
  var timeout = 15000;
  var getStartedUrl = 'http://localhost:9001/get-started';
  var communityLibraryUrl = 'http://localhost:9001/community-library';
  var learnerDashboardUrl = 'http://localhost:9001/learner-dashboard';
  var creatorDashboardUrl = 'http://localhost:9001/creator-dashboard';
  var aboutUrl = 'http://localhost:9001/about';
  var notificationsUrl = 'http://localhost:9001/notifications';
  var preferencesUrl = 'http://localhost:9001/preferences';

  var triggerKeys = async function(key) {
    await browser.actions().sendKeys(
      protractor.Key.chord(protractor.Key.CONTROL, key)).perform();
  };

  var waitForUrlRedirection = async function(url) {
    var EC = browser.ExpectedConditions;
    // Checks that the current URL contains the expected text.
    await browser.wait(EC.urlContains(url), timeout);
  };

  var testNavigationShortcuts = async function(url) {
    await browser.get(url);
    await waitForUrlRedirection(url);
    // Should trigger keyboard shortcuts.
    await triggerKeys('0');
    await waitForUrlRedirection(getStartedUrl);
    expect(await browser.getCurrentUrl()).toEqual(getStartedUrl);
    await triggerKeys('1');
    await waitForUrlRedirection(communityLibraryUrl);
    expect(await browser.getCurrentUrl()).toEqual(communityLibraryUrl);
    await triggerKeys('2');
    await waitForUrlRedirection(learnerDashboardUrl);
    expect(await browser.getCurrentUrl()).toEqual(learnerDashboardUrl);
    await triggerKeys('3');
    await waitForUrlRedirection(creatorDashboardUrl);
    expect(await browser.getCurrentUrl()).toEqual(creatorDashboardUrl);
    await triggerKeys('4');
    await waitForUrlRedirection(aboutUrl);
    expect(await browser.getCurrentUrl()).toEqual(aboutUrl);
    await triggerKeys('5');
    await waitForUrlRedirection(notificationsUrl);
    expect(await browser.getCurrentUrl()).toEqual(notificationsUrl);
    await triggerKeys('6');
    await waitForUrlRedirection(preferencesUrl);
    expect(await browser.getCurrentUrl()).toEqual(preferencesUrl);
  };

  beforeAll(async function() {
    // Should create a user and login.
    await users.createUser('user11@accessibility.com', 'user11accessibility');
    await users.login('user11@accessibility.com', true);
  });

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

  it('should test navigation shortcuts for the community-library page',
    async function() {
      await testNavigationShortcuts('community-library');
    });

  it('should test navigation shortcuts for the creator-dashboard page',
    async function() {
      await testNavigationShortcuts('creator-dashboard');
    });

  it('should test navigation shortcuts for the get-started page',
    async function() {
      await testNavigationShortcuts('get-started');
    });

  it('should test navigation shortcuts for the about page',
    async function() {
      await testNavigationShortcuts('about');
    });

  it('should test navigation shortcuts for the privacy-policy page',
    async function() {
      await testNavigationShortcuts('privacy-policy');
    });

  it('should test navigation shortcuts for the donate page',
    async function() {
      await testNavigationShortcuts('donate');
    });

  it('should test navigation shortcuts for the donate preferences page',
    async function() {
      await testNavigationShortcuts('preferences');
    });

  it('should test navigation shortcuts for the donate learner-dashboard page',
  async function() {
    await testNavigationShortcuts('learner-dashboard');
  });

  it('should test navigation shortcuts for the notifications page',
    async function() {
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
