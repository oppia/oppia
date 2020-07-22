// Copyright 2016 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview End-to-end tests for testing accessibility features
 * and check for any console errors
 */

var general = require('../protractor_utils/general.js');
var waitFor = require('../protractor_utils/waitFor.js');
var AdminPage = require('../protractor_utils/AdminPage.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var ExplorationPlayerPage = require(
  '../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
const { browser } = require('protractor');

describe('screenreader and keyboard user accessibility features', function() {
  var oppiaLogo = element(by.css('.protractor-test-oppia-main-logo'));
  var libraryPage = null;
  var explorationPlayerPage = null;

  beforeEach(function() {
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  var reloadExploration = async function(name) {
    // Reload the welcome.yaml exploration.
    await browser.get('admin');
    await waitFor.pageToFullyLoad();
    // waitFor.pageToFullyLoad() does not fully load admin page.
    // browser.sleep is used instead for now.
    // eslint-disable-next-line
    await browser.sleep(6000);
    var reloadButton = element(by.css(
      '.protractor-test-reload-exploration-button'));
    await reloadButton.click();
    await general.acceptAlert()
  };

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

  it('should move focus to the skip button in the library page', 
    async function() {
      await libraryPage.get();
      await browser.actions().sendKeys('s').perform();
      var skipButton = element(by.css('.protractor-test-skip-link'));
      expect(await skipButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      expect(await skipButton.getAttribute('id')).not.toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      await browser.actions().sendKeys('s').perform();
      expect(await skipButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
    });

  it('should move focus to the search bar in the library page', 
    async function() {
      await libraryPage.get();
      await browser.actions().sendKeys('/').perform();
      var searchBar = element(by.css('.protractor-test-search-input'));
      expect(await searchBar.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      expect(await searchBar.getAttribute('id')).not.toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
      
      await browser.actions().sendKeys('/').perform();
      expect(await searchBar.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
    });

  it('should move focus to the category bar in library page',
    async function() {
      await libraryPage.get();
      await browser.actions().sendKeys('c').perform();
      var categoryBar = element(by.css('.protractor-test-search-bar-dropdown-toggle'));
      expect(await categoryBar.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      expect(await categoryBar.getAttribute('id')).not.toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
      
      await browser.actions().sendKeys('c').perform();
      expect(await categoryBar.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
    });

  it('should move focus to skip to main content button in exploration player',
    async function() {
      // Create a user and login.
      await users.createUser('user11@accessibility.com', 'user11accessibility');
      await users.login('user11@accessibility.com', true);
      // Create a test exploration.
      await reloadExploration('welcome.yaml');
      await libraryPage.get();
      await libraryPage.findExploration('Welcome to Oppia!');
      await libraryPage.playExploration('Welcome to Oppia!');

      await browser.actions().sendKeys('s').perform();
      var skipButton = element(by.css('.protractor-test-skip-link'));
      expect(await skipButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      expect(await skipButton.getAttribute('id')).not.toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      await browser.actions().sendKeys('s').perform();
      expect(await skipButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
    });

  it('should move focus to next and back buttons in exploration player',
    async function() {
      await libraryPage.get();
      await libraryPage.findExploration('Welcome to Oppia!');
      await libraryPage.playExploration('Welcome to Oppia!');

      await explorationPlayerPage.submitAnswer(
        'MultipleChoiceInput', 'It\'s translated from a different language.');
      await explorationPlayerPage.clickThroughToNextCard();
      
      await waitFor.pageToFullyLoad();

      // Should move the focus to the back button and navigate to the previous card.
      await browser.actions().sendKeys('k').perform();
      var backButton = element(by.css('#backButtonId'));
      expect(await backButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      await browser.actions().sendKeys(protractor.Key.TAB).perform();

      await browser.actions().sendKeys('k').perform();
      expect(await backButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
      await browser.actions().sendKeys(protractor.Key.ENTER).perform();
      await waitFor.pageToFullyLoad();

      // Should move the focus to the next button and navigate to the next card.
      var nextButton = element(by.css('.protractor-test-next-button'));
      await browser.actions().sendKeys('j').perform();
      expect(await nextButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
      
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      await browser.actions().sendKeys(protractor.Key.TAB).perform();

      await browser.actions().sendKeys('j').perform();
      expect(await nextButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
      await browser.actions().sendKeys(protractor.Key.ENTER).perform();
      await waitFor.pageToFullyLoad();
      
      // Should safely exit out of the exploration.
      await oppiaLogo.click();
      await general.acceptAlert();
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
