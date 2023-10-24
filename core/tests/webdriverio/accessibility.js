// Copyright 2022 The Oppia Authors. All Rights Reserved.
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

var action = require('../webdriverio_utils/action.js');
var general = require('../webdriverio_utils/general.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');

var ExplorationPlayerPage = require(
  '../webdriverio_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');

var EXPLORATION = {
  title: 'A new exploration',
  category: 'Learning',
  objective: 'The goal is to create a new exploration',
  language: 'English'
};

describe('screenreader and keyboard user accessibility features', function() {
  var ERROR_MESSAGE = 'Content container taking too long to load';
  var libraryPage = null;
  var GET_STARTED_URL = 'http://localhost:8181/get-started';
  var COMMUNITY_LIBRARY_URL = 'http://localhost:8181/community-library';
  var LEARNER_DASHBOARD_URL = 'http://localhost:8181/learner-dashboard';
  var CREATOR_DASHBOARD_URL = 'http://localhost:8181/creator-dashboard';
  var ABOUT_URL = 'http://localhost:8181/about';
  var PREFERENCES_URL = 'http://localhost:8181/preferences';
  var PRIVACY_POLICY_URL = 'http://localhost:8181/privacy-policy';
  var DONATE_URL = 'http://localhost:8181/donate';

  var holdCtrlAndPressKey = async function(key) {
    await browser.keys(['Control', key]);
  };

  beforeAll(async function() {
    // Should create a user and login.
    await users.createAndLoginSuperAdminUser(
      'user11@accessibility.com', 'user11accessibility');
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  afterAll(async function() {
    await users.logout();
  });

  var checkActionShortcuts = async function(key, elementToFocus) {
    await waitFor.presenceOf(elementToFocus, 'Element took too long to load');
    // Should move the focus to the elementToFocus.
    await browser.keys(key);
    expect(await elementToFocus.isFocused()).toEqual(true);

    // Should move the focus away from the elementToFocus.
    // Tab must be pressed twice to move focus away from categoryBar.
    // The categoryBar shares the same class as the next element in DOM order.
    await browser.keys('Tab');
    await browser.keys('Tab');
    expect(await elementToFocus.isFocused()).toEqual(false);

    // Should move the focus back to the elementToFocus.
    await browser.keys(key);
    expect(await elementToFocus.isFocused()).toEqual(true);
  };

  it('should skip to the main content element', async function() {
    await libraryPage.get();
    await browser.keys('s');
    var skipLink = $('.e2e-test-skip-link');
    await action.click('Skip link', skipLink);
    var mainContent = $('.e2e-test-main-content');
    expect(await mainContent.isFocused()).toEqual(true);
  });

  it('should navigate to the get-started page when ctrl+6 is pressed',
    async function() {
      await browser.url('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      var oppiaContentContainer = $('.e2e-test-content-container');
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.url('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.url('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.url('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.url('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.url('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.url('community-library');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);
    });

  it('should navigate to the community-library page when ctrl+1 is pressed',
    async function() {
      await browser.url('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      var oppiaContentContainer = $('.e2e-test-content-container');
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await browser.url('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await browser.url('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await browser.url('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await browser.url('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await browser.url('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await browser.url('community-library');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
    });

  it('should navigate to the learner-dashboard page when ctrl+2 is pressed',
    async function() {
      await browser.url('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      var oppiaContentContainer = $('.e2e-test-content-container');
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

      await browser.url('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

      await browser.url('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

      await browser.url('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

      await browser.url('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);


      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

      await browser.url('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

      await browser.url('community-library');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
    });

  it('should navigate to the creator-dashboard page when ctrl+3 is pressed',
    async function() {
      await browser.url('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      var oppiaContentContainer = $('.e2e-test-content-container');
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);

      await browser.url('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);

      await browser.url('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);

      await browser.url('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);

      await browser.url('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);


      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);

      await browser.url('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);

      await browser.url('community-library');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
    });

  it('should navigate to about page when ctrl+4 is pressed',
    async function() {
      await browser.url('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      var oppiaContentContainer = $('.e2e-test-content-container');
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);

      await browser.url('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);

      await browser.url('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);

      await browser.url('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);

      await browser.url('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);


      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);

      await browser.url('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);

      await browser.url('community-library');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);
    });

  it('should navigate to the notifications page when ctrl+5 is pressed',
    async function() {
      await browser.url('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      var oppiaContentContainer = $('.e2e-test-content-container');
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);


      await browser.url('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);


      await browser.url('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);


      await browser.url('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);


      await browser.url('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await browser.url('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await browser.url('community-library');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);
    });

  it('should navigate to the preferences page when ctrl+5 is pressed',
    async function() {
      await browser.url('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      var oppiaContentContainer = $('.e2e-test-content-container');
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('5');
      await waitFor.urlRedirection(PREFERENCES_URL);

      await browser.url('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('5');
      await waitFor.urlRedirection(PREFERENCES_URL);

      await browser.url('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('5');
      await waitFor.urlRedirection(PREFERENCES_URL);

      await browser.url('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('5');
      await waitFor.urlRedirection(PREFERENCES_URL);

      await browser.url('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('5');
      await waitFor.urlRedirection(PREFERENCES_URL);

      await browser.url('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('5');
      await waitFor.urlRedirection(PREFERENCES_URL);

      await browser.url('community-library');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('5');
      await waitFor.urlRedirection(PREFERENCES_URL);
    });


  it('should test the action shortcuts in library page',
    async function() {
      // Should test the skip to main content shortcut.
      await libraryPage.get();
      await waitFor.pageToFullyLoad();
      var searchBar = $('.e2e-test-search-input');
      await checkActionShortcuts('/', searchBar);

      await libraryPage.get();
      await waitFor.pageToFullyLoad();
      var skipLink = $('.e2e-test-skip-link');
      await checkActionShortcuts('s', skipLink);

      await libraryPage.get();
      await waitFor.pageToFullyLoad();
      var categoryBar = $('.e2e-test-search-bar-dropdown-toggle');
      await checkActionShortcuts('c', categoryBar);
    });

  it('should move focus to skip to main content button in exploration player',
    async function() {
      // Should create and play a dummy exploration.
      await workflow.createAndPublishTwoCardExploration(
        EXPLORATION.title,
        EXPLORATION.category,
        EXPLORATION.objective,
        EXPLORATION.language,
        true
      );
      await libraryPage.get();
      await libraryPage.findExploration('A new exploration');
      await libraryPage.playExploration('A new exploration');

      // This forces a wait until the exploration card fully loads on the page.
      await explorationPlayerPage.expectExplorationToNotBeOver();

      // Should test the skip to main content shortcut.
      var skipLink = $('.e2e-test-skip-link');
      await checkActionShortcuts('s', skipLink);
    });

  it('should move focus to next and back buttons in exploration player',
    async function() {
      // Play a dummy exploration.
      await libraryPage.get();
      await libraryPage.findExploration('A new exploration');
      await libraryPage.playExploration('A new exploration');
      // Do not change order of actions below.
      // The exploration needs to be navigated in a specific order.

      // Should press 'j' key to navigate to the next card.
      var continueButton = $('.e2e-test-continue-button');
      await waitFor.elementToBeClickable(continueButton);
      await checkActionShortcuts('j', continueButton);
      await browser.keys('Enter');

      // Should press 'k' key to navigate to the previous card.
      var backButton = $('.e2e-test-back-button');
      await waitFor.elementToBeClickable(backButton);
      await checkActionShortcuts('k', backButton);
      await browser.keys('Enter');

      // Should press 'j' key to navigate to the next card.
      var nextButton = $('.e2e-test-next-button');
      await waitFor.elementToBeClickable(nextButton);
      await checkActionShortcuts('j', nextButton);
      await browser.keys('Enter');

      // Should safely exit out of the exploration.
      var oppiaLogo = $('.e2e-test-oppia-main-logo');
      await action.click('Oppia Logo', oppiaLogo);
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});

describe('Cache Slugs', function() {
  it('should check that errors get logged for missing resources',
    async function() {
      await browser.url('/console_errors');
      var expectedErrors = [
        'http://localhost:8181/build/fail/logo/288x128_logo_white.png',
        'http://localhost:8181/build/fail/logo/288x128_logo_white.webp'
      ];
      await general.checkForConsoleErrors(expectedErrors);
    });
});
