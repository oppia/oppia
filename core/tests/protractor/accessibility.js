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

var action = require('../protractor_utils/action.js');
var general = require('../protractor_utils/general.js');
var waitFor = require('../protractor_utils/waitFor.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var LibraryPage = require('../protractor_utils/LibraryPage.js');
const { browser } = require('protractor');

var backButton = element(by.css('.e2e-test-back-button'));
var categoryBar = element(by.css(
  '.e2e-test-search-bar-dropdown-toggle'));
var continueButton = element(by.css('.e2e-test-continue-button'));
var mainContent = element(by.css('.e2e-test-main-content'));
var nextButton = element(by.css('.e2e-test-next-button'));
var oppiaLogo = element(by.css('.e2e-test-oppia-main-logo'));
var searchBar = element(by.css('.e2e-test-search-input'));
var skipLink = element(by.css('.e2e-test-skip-link'));

var EXPLORATION = {
  title: 'A new exploration',
  category: 'Learning',
  objective: 'The goal is to create a new exploration',
  language: 'English'
};

describe('screenreader and keyboard user accessibility features', function() {
  var oppiaContentContainer = element(
    by.css('.e2e-test-content-container'));
  var ERROR_MESSAGE = 'Content container taking too long to load';
  var libraryPage = null;
  var GET_STARTED_URL = 'http://localhost:9001/get-started';
  var COMMUNITY_LIBRARY_URL = 'http://localhost:9001/community-library';
  var LEARNER_DASHBOARD_URL = 'http://localhost:9001/learner-dashboard';
  var CREATOR_DASHBOARD_URL = 'http://localhost:9001/creator-dashboard';
  var ABOUT_URL = 'http://localhost:9001/about';
  var PREFERENCES_URL = 'http://localhost:9001/preferences';
  var PRIVACY_POLICY_URL = 'http://localhost:9001/privacy-policy';
  var DONATE_URL = 'http://localhost:9001/donate';

  var holdCtrlAndPressKey = async function(key) {
    await browser.actions().sendKeys(
      protractor.Key.chord(protractor.Key.CONTROL, key)).perform();
  };

  beforeAll(async function() {
    // Should create a user and login.
    await users.createAndLoginSuperAdminUser(
      'user11@accessibility.com', 'user11accessibility');
    libraryPage = new LibraryPage.LibraryPage();
  });

  afterAll(async function() {
    await users.logout();
  });

  var checkActionShortcuts = async function(key, elementToFocus) {
    await waitFor.presenceOf(elementToFocus, 'Element took too long to load');
    // Should move the focus to the elementToFocus.
    await browser.actions().sendKeys(key).perform();
    expect(
      await browser.driver.switchTo().activeElement()
        .getAttribute('class')).toEqual(
      await elementToFocus.getAttribute('class'));

    // Should move the focus away from the elementToFocus.
    // Tab must be pressed twice to move focus away from categoryBar.
    // The categoryBar shares the same class as the next element in DOM order.
    await browser.actions().sendKeys(protractor.Key.TAB).perform();
    await browser.actions().sendKeys(protractor.Key.TAB).perform();
    expect(
      await browser.driver.switchTo().activeElement()
        .getAttribute('class')).not.toEqual(
      await elementToFocus.getAttribute('class'));

    // Should move the focus back to the elementToFocus.
    await browser.actions().sendKeys(key).perform();
    expect(
      await browser.driver.switchTo().activeElement()
        .getAttribute('class')).toEqual(
      await elementToFocus.getAttribute('class'));
  };

  it('should skip to the main content element', async function() {
    await libraryPage.get();
    await browser.actions().sendKeys('s').perform();
    await action.click('Skip link', skipLink);
    expect(await mainContent.getAttribute('class')).toEqual(
      await (await browser.driver.switchTo().activeElement())
        .getAttribute('class'));
  });

  it('should navigate to the get-started page when ctrl+6 is pressed',
    async function() {
      await browser.get('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.get('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.get('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.get('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.get('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.get('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);

      await browser.get('community-library');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('6');
      await waitFor.urlRedirection(GET_STARTED_URL);
    });

  it('should navigate to the community-library page when ctrl+1 is pressed',
    async function() {
      await browser.get('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await browser.get('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await browser.get('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await browser.get('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await browser.get('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await browser.get('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);

      await browser.get('community-library');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('1');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
    });

  it('should navigate to the learner-dashboard page when ctrl+2 is pressed',
    async function() {
      await browser.get('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

      await browser.get('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

      await browser.get('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

      await browser.get('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

      await browser.get('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);


      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

      await browser.get('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);

      await browser.get('community-library');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('2');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
    });

  it('should navigate to the creator-dashboard page when ctrl+3 is pressed',
    async function() {
      await browser.get('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);

      await browser.get('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);

      await browser.get('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);

      await browser.get('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);

      await browser.get('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);


      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);

      await browser.get('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);

      await browser.get('community-library');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('3');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
    });

  it('should navigate to about page when ctrl+4 is pressed',
    async function() {
      await browser.get('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);

      await browser.get('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);

      await browser.get('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);

      await browser.get('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);

      await browser.get('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);


      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);

      await browser.get('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);

      await browser.get('community-library');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('4');
      await waitFor.urlRedirection(ABOUT_URL);
    });

  it('should navigate to the notifications page when ctrl+5 is pressed',
    async function() {
      await browser.get('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);


      await browser.get('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);


      await browser.get('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);


      await browser.get('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);


      await browser.get('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await browser.get('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await browser.get('community-library');
      await waitFor.urlRedirection(COMMUNITY_LIBRARY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);
    });

  it('should navigate to the preferences page when ctrl+5 is pressed',
    async function() {
      await browser.get('get-started');
      await waitFor.urlRedirection(GET_STARTED_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('5');
      await waitFor.urlRedirection(PREFERENCES_URL);

      await browser.get('about');
      await waitFor.urlRedirection(ABOUT_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('5');
      await waitFor.urlRedirection(PREFERENCES_URL);

      await browser.get('privacy-policy');
      await waitFor.urlRedirection(PRIVACY_POLICY_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('5');
      await waitFor.urlRedirection(PREFERENCES_URL);

      await browser.get('learner-dashboard');
      await waitFor.urlRedirection(LEARNER_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('5');
      await waitFor.urlRedirection(PREFERENCES_URL);

      await browser.get('donate');
      await waitFor.urlRedirection(DONATE_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('5');
      await waitFor.urlRedirection(PREFERENCES_URL);

      await browser.get('creator-dashboard');
      await waitFor.urlRedirection(CREATOR_DASHBOARD_URL);
      await waitFor.presenceOf(oppiaContentContainer, ERROR_MESSAGE);

      await holdCtrlAndPressKey('5');
      await waitFor.urlRedirection(PREFERENCES_URL);

      await browser.get('community-library');
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
      await checkActionShortcuts('/', searchBar);

      await libraryPage.get();
      await waitFor.pageToFullyLoad();
      await checkActionShortcuts('s', skipLink);

      await libraryPage.get();
      await waitFor.pageToFullyLoad();
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

      // Should test the skip to main content shortcut.
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
      await waitFor.elementToBeClickable(continueButton);
      await checkActionShortcuts('j', continueButton);
      await browser.actions().sendKeys(protractor.Key.ENTER).perform();

      // Should press 'k' key to navigate to the previous card.
      await waitFor.elementToBeClickable(backButton);
      await checkActionShortcuts('k', backButton);
      await browser.actions().sendKeys(protractor.Key.ENTER).perform();

      // Should press 'j' key to navigate to the next card.
      await waitFor.elementToBeClickable(nextButton);
      await checkActionShortcuts('j', nextButton);
      await browser.actions().sendKeys(protractor.Key.ENTER).perform();

      // Should safely exit out of the exploration.
      await action.click('Oppia Logo', oppiaLogo);
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
