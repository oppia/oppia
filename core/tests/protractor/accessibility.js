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
  var GET_STARTED_URL = 'http://localhost:9001/get-started';
  var COMMUNITY_LIBRARY_URL = 'http://localhost:9001/community-library';
  var LEARNER_DASHBOARD_URL = 'http://localhost:9001/learner-dashboard';
  var CREATOR_DASHHBOARD_URL = 'http://localhost:9001/creator-dashboard';
  var ABOUT_URL = 'http://localhost:9001/about';
  var NOTIFICATIONS_URL = 'http://localhost:9001/notifications';
  var PREFERENCES_URL = 'http://localhost:9001/preferences';

  var holdCtrlAndPressKey = async function(key) {
    await browser.actions().sendKeys(
      protractor.Key.chord(protractor.Key.CONTROL, key)).perform();
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

  it('should test the navigation shortcut ctrl+0',
    async function() {
      await browser.get('get-started');
      await waitFor.urlRedirection('http://localhost:9001/get-started');

      await holdCtrlAndPressKey('0');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.get('about');
      await waitFor.urlRedirection('http://localhost:9001/about');

      await holdCtrlAndPressKey('0');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.get('privacy-policy');
      await waitFor.urlRedirection('http://localhost:9001/privacy-policy');

      await holdCtrlAndPressKey('0');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.get('learner-dashboard');
      await waitFor.urlRedirection('http://localhost:9001/learner-dashboard');

      await holdCtrlAndPressKey('0');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.get('donate');
      await waitFor.urlRedirection('http://localhost:9001/donate');

      await holdCtrlAndPressKey('0');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.get('notifications');
      await waitFor.urlRedirection('http://localhost:9001/notifications');

      await holdCtrlAndPressKey('0');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.get('creator-dashboard');
      await waitFor.urlRedirection('http://localhost:9001/creator-dashboard');

      await holdCtrlAndPressKey('0');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.get('community-library');
      await waitFor.urlRedirection('http://localhost:9001/community-library');

      await holdCtrlAndPressKey('0');
      await waitFor.urlRedirection(GET_STARTED_URL);
    });

    it('should test the navigation shortcut ctrl+1',
      async function() {
        await browser.get('get-started');
        await waitFor.urlRedirection('http://localhost:9001/get-started');

        await holdCtrlAndPressKey('1');
        await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

        await browser.get('about');
        await waitFor.urlRedirection('http://localhost:9001/about');

        await holdCtrlAndPressKey('1');
        await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

        await browser.get('privacy-policy');
        await waitFor.urlRedirection('http://localhost:9001/privacy-policy');

        await holdCtrlAndPressKey('1');
        await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

        await browser.get('learner-dashboard');
        await waitFor.urlRedirection('http://localhost:9001/learner-dashboard');

        await holdCtrlAndPressKey('1');
        await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

        await browser.get('donate');
        await waitFor.urlRedirection('http://localhost:9001/donate');

        await holdCtrlAndPressKey('1');
        await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

        await browser.get('notifications');
        await waitFor.urlRedirection('http://localhost:9001/notifications');

        await holdCtrlAndPressKey('1');
        await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

        await browser.get('creator-dashboard');
        await waitFor.urlRedirection('http://localhost:9001/creator-dashboard');

        await holdCtrlAndPressKey('1');
        await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

        await browser.get('community-library');
        await waitFor.urlRedirection('http://localhost:9001/community-library');

        await holdCtrlAndPressKey('1');
        await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      });

    it('should test the navigation shortcut ctrl+2',
      async function() {
        await browser.get('get-started');
        await waitFor.urlRedirection('http://localhost:9001/get-started');

        await holdCtrlAndPressKey('2');
        await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

        await browser.get('about');
        await waitFor.urlRedirection('http://localhost:9001/about');

        await holdCtrlAndPressKey('2');
        await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

        await browser.get('privacy-policy');
        await waitFor.urlRedirection('http://localhost:9001/privacy-policy');

        await holdCtrlAndPressKey('2');
        await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

        await browser.get('learner-dashboard');
        await waitFor.urlRedirection('http://localhost:9001/learner-dashboard');

        await holdCtrlAndPressKey('2');
        await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

        await browser.get('donate');
        await waitFor.urlRedirection('http://localhost:9001/donate');

        await holdCtrlAndPressKey('2');
        await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

        await browser.get('notifications');
        await waitFor.urlRedirection('http://localhost:9001/notifications');

        await holdCtrlAndPressKey('2');
        await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

        await browser.get('creator-dashboard');
        await waitFor.urlRedirection('http://localhost:9001/creator-dashboard');

        await holdCtrlAndPressKey('2');
        await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

        await browser.get('community-library');
        await waitFor.urlRedirection('http://localhost:9001/community-library');

        await holdCtrlAndPressKey('2');
        await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      });

    it('should test the navigation shortcut ctrl+3',
      async function() {
        await browser.get('get-started');
        await waitFor.urlRedirection('http://localhost:9001/get-started');

        await holdCtrlAndPressKey('3');
        await waitFor.urlRedirection(CREATOR_DASHHBOARD_URL);

        await browser.get('about');
        await waitFor.urlRedirection('http://localhost:9001/about');

        await holdCtrlAndPressKey('3');
        await waitFor.urlRedirection(CREATOR_DASHHBOARD_URL);

        await browser.get('privacy-policy');
        await waitFor.urlRedirection('http://localhost:9001/privacy-policy');

        await holdCtrlAndPressKey('3');
        await waitFor.urlRedirection(CREATOR_DASHHBOARD_URL);

        await browser.get('learner-dashboard');
        await waitFor.urlRedirection('http://localhost:9001/learner-dashboard');

        await holdCtrlAndPressKey('3');
        await waitFor.urlRedirection(CREATOR_DASHHBOARD_URL);

        await browser.get('donate');
        await waitFor.urlRedirection('http://localhost:9001/donate');

        await holdCtrlAndPressKey('3');
        await waitFor.urlRedirection(CREATOR_DASHHBOARD_URL);

        await browser.get('notifications');
        await waitFor.urlRedirection('http://localhost:9001/notifications');

        await holdCtrlAndPressKey('3');
        await waitFor.urlRedirection(CREATOR_DASHHBOARD_URL);

        await browser.get('creator-dashboard');
        await waitFor.urlRedirection('http://localhost:9001/creator-dashboard');

        await holdCtrlAndPressKey('3');
        await waitFor.urlRedirection(CREATOR_DASHHBOARD_URL);

        await browser.get('community-library');
        await waitFor.urlRedirection('http://localhost:9001/community-library');

        await holdCtrlAndPressKey('3');
        await waitFor.urlRedirection(CREATOR_DASHHBOARD_URL);
      });

    it('should test the navigation shortcut ctrl+4',
      async function() {
        await browser.get('get-started');
        await waitFor.urlRedirection('http://localhost:9001/get-started');

        await holdCtrlAndPressKey('4');
        await waitFor.urlRedirection(ABOUT_URL);

        await browser.get('about');
        await waitFor.urlRedirection('http://localhost:9001/about');

        await holdCtrlAndPressKey('4');
        await waitFor.urlRedirection(ABOUT_URL);

        await browser.get('privacy-policy');
        await waitFor.urlRedirection('http://localhost:9001/privacy-policy');

        await holdCtrlAndPressKey('4');
        await waitFor.urlRedirection(ABOUT_URL);

        await browser.get('learner-dashboard');
        await waitFor.urlRedirection('http://localhost:9001/learner-dashboard');

        await holdCtrlAndPressKey('4');
        await waitFor.urlRedirection(ABOUT_URL);

        await browser.get('donate');
        await waitFor.urlRedirection('http://localhost:9001/donate');

        await holdCtrlAndPressKey('4');
        await waitFor.urlRedirection(ABOUT_URL);

        await browser.get('notifications');
        await waitFor.urlRedirection('http://localhost:9001/notifications');

        await holdCtrlAndPressKey('4');
        await waitFor.urlRedirection(ABOUT_URL);

        await browser.get('creator-dashboard');
        await waitFor.urlRedirection('http://localhost:9001/creator-dashboard');

        await holdCtrlAndPressKey('4');
        await waitFor.urlRedirection(ABOUT_URL);

        await browser.get('community-library');
        await waitFor.urlRedirection('http://localhost:9001/community-library');

        await holdCtrlAndPressKey('4');
        await waitFor.urlRedirection(ABOUT_URL);
      });

    it('should test the navigation shortcut ctrl+5',
      async function() {
        await browser.get('get-started');
        await waitFor.urlRedirection('http://localhost:9001/get-started');

        await holdCtrlAndPressKey('5');
        await waitFor.urlRedirection(NOTIFICATIONS_URL);

        await browser.get('about');
        await waitFor.urlRedirection('http://localhost:9001/about');

        await holdCtrlAndPressKey('5');
        await waitFor.urlRedirection(NOTIFICATIONS_URL);

        await browser.get('privacy-policy');
        await waitFor.urlRedirection('http://localhost:9001/privacy-policy');

        await holdCtrlAndPressKey('5');
        await waitFor.urlRedirection(NOTIFICATIONS_URL);

        await browser.get('learner-dashboard');
        await waitFor.urlRedirection('http://localhost:9001/learner-dashboard');

        await holdCtrlAndPressKey('5');
        await waitFor.urlRedirection(NOTIFICATIONS_URL);

        await browser.get('donate');
        await waitFor.urlRedirection('http://localhost:9001/donate');

        await holdCtrlAndPressKey('5');
        await waitFor.urlRedirection(NOTIFICATIONS_URL);

        await browser.get('notifications');
        await waitFor.urlRedirection('http://localhost:9001/notifications');

        await holdCtrlAndPressKey('5');
        await waitFor.urlRedirection(NOTIFICATIONS_URL);

        await browser.get('creator-dashboard');
        await waitFor.urlRedirection('http://localhost:9001/creator-dashboard');

        await holdCtrlAndPressKey('5');
        await waitFor.urlRedirection(NOTIFICATIONS_URL);

        await browser.get('community-library');
        await waitFor.urlRedirection('http://localhost:9001/community-library');

        await holdCtrlAndPressKey('5');
        await waitFor.urlRedirection(NOTIFICATIONS_URL);
      });

    it('should test the navigation shortcut ctrl+6',
      async function() {
        await browser.get('get-started');
        await waitFor.urlRedirection('http://localhost:9001/get-started');

        await holdCtrlAndPressKey('6');
        await waitFor.urlRedirection(PREFERENCES_URL);

        await browser.get('about');
        await waitFor.urlRedirection('http://localhost:9001/about');

        await holdCtrlAndPressKey('6');
        await waitFor.urlRedirection(PREFERENCES_URL);

        await browser.get('privacy-policy');
        await waitFor.urlRedirection('http://localhost:9001/privacy-policy');

        await holdCtrlAndPressKey('6');
        await waitFor.urlRedirection(PREFERENCES_URL);

        await browser.get('learner-dashboard');
        await waitFor.urlRedirection('http://localhost:9001/learner-dashboard');

        await holdCtrlAndPressKey('6');
        await waitFor.urlRedirection(PREFERENCES_URL);

        await browser.get('donate');
        await waitFor.urlRedirection('http://localhost:9001/donate');

        await holdCtrlAndPressKey('6');
        await waitFor.urlRedirection(PREFERENCES_URL);

        await browser.get('notifications');
        await waitFor.urlRedirection('http://localhost:9001/notifications');

        await holdCtrlAndPressKey('6');
        await waitFor.urlRedirection(PREFERENCES_URL);

        await browser.get('creator-dashboard');
        await waitFor.urlRedirection('http://localhost:9001/creator-dashboard');

        await holdCtrlAndPressKey('6');
        await waitFor.urlRedirection(PREFERENCES_URL);

        await browser.get('community-library');
        await waitFor.urlRedirection('http://localhost:9001/community-library');

        await holdCtrlAndPressKey('6');
        await waitFor.urlRedirection(PREFERENCES_URL);
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
