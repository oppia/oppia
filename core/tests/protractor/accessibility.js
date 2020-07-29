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
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage = require(
  '../protractor_utils/ExplorationPlayerPage.js');
var LearnerDashboardPage =
  require('../protractor_utils/LearnerDashboardPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
const { browser } = require('protractor');

var backButton = element(by.css('#backButtonId'));
var categoryBar = element(by.css(
  '.protractor-test-search-bar-dropdown-toggle'));
var continueButton = element(by.css('.protractor-test-continue-button'));
var mainContent = element(by.css('.protractor-test-main-content'));
var nextButton = element(by.css('.protractor-test-next-button'));
var oppiaLogo = element(by.css('.protractor-test-oppia-main-logo'));
var searchBar = element(by.css('.protractor-test-search-input'));
var skipLink = element(by.css('.protractor-test-skip-link'));

var EXPLORATION = {
  title: 'A new exploration',
  category: 'Learning',
  objective: 'The goal is to create a new exploration',
  language: 'English'
};

describe('screenreader and keyboard user accessibility features', function() {
  var adminPage = null;
  var creatorDashboardPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  var libraryPage = null;
  var learnerDashboardPage = null;


  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    libraryPage = new LibraryPage.LibraryPage();
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();
    // The editor and player page objects are only required for desktop testing.
    if (!browser.isMobile) {
      creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
      explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
      explorationEditorMainTab = explorationEditorPage.getMainTab();
      explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
      explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    }
  });

  var checkActionShortcuts = async function(key, elementToFocus) {
    await waitFor.presenceOf(elementToFocus, 'Element took too long to load');

    if (await elementToFocus.getAttribute('id') === '') {
      // Should move the focus to the elementToFocus.
      await browser.actions().sendKeys(key).perform();
      expect(await browser.driver.switchTo().activeElement()
        .getAttribute('class')).toEqual(
        await (await elementToFocus.getAttribute('class')));

      // Should move the focus away from the elementToFocus.
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      expect(await browser.driver.switchTo().activeElement()
        .getAttribute('class')).not.toEqual(
        await (await elementToFocus.getAttribute('class')));

      // Should move the focus back to the elementToFocus.
      await browser.actions().sendKeys(key).perform();
      expect(await browser.driver.switchTo().activeElement()
        .getAttribute('class')).toEqual(
        await (await elementToFocus.getAttribute('class')));
    } else {
      // Should move the focus to the elementToFocus.
      await browser.actions().sendKeys(key).perform();
      expect(await elementToFocus.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      // Should move the focus away from the elementToFocus.
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      expect(await elementToFocus.getAttribute('id')).not.toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      // Should move the focus back to the elementToFocus.
      await browser.actions().sendKeys(key).perform();
      expect(await elementToFocus.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
    }
  };

  it('should skip to the main content element', async function() {
    await libraryPage.get();
    await browser.actions().sendKeys(protractor.Key.TAB).perform();
    await waitFor.elementToBeClickable(skipLink, 'Could not click skip link');
    await skipLink.click();
    expect(await mainContent.getAttribute('id')).toEqual(
      await (await browser.driver.switchTo().activeElement())
        .getAttribute('id'));
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
      // Should create a user and login.
      await users.createUser('user11@accessibility.com', 'user11accessibility');
      await users.login('user11@accessibility.com', true);

      // Should create and play a dummy exploration.
      await workflow.createAndPublishTwoCardExploration(
        EXPLORATION.title,
        EXPLORATION.category,
        EXPLORATION.objective,
        EXPLORATION.language
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
      await oppiaLogo.click();
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
