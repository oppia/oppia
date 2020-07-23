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

var forms = require('../protractor_utils/forms.js');
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

describe('screenreader and keyboard user accessibility features', function() {
  var adminPage = null;
  var creatorDashboardPage = null;
  var collectionEditorPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  var libraryPage = null;
  var learnerDashboardPage = null;
  var oppiaLogo = element(by.css('.protractor-test-oppia-main-logo'));
  var continueButton = element(by.css('.protractor-test-continue-button'));
  var clickContinueButton = async function() {
    await waitFor.elementToBeClickable(
      continueButton, 'Could not click continue button');
    await continueButton.click();
    await waitFor.pageToFullyLoad();
  };

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

  var createDummyExplorationOnDesktop = async function() {
    await creatorDashboardPage.get();
    await creatorDashboardPage.clickCreateActivityButton();
    await waitFor.pageToFullyLoad();
    await explorationEditorMainTab.exitTutorial();
    await explorationEditorMainTab.setStateName('First');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'));
    await explorationEditorMainTab.setInteraction('Continue');
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setDestination('Second', true, null);
    await explorationEditorMainTab.moveToState('Second');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'So what can I tell you?'));
    await explorationEditorMainTab.setInteraction('MultipleChoiceInput', [
      await forms.toRichText('How do your explorations work?'),
      await forms.toRichText('What can you tell me about this website?'),
      await forms.toRichText('How can I contribute to Oppia?'),
      await forms.toRichText('Those were all the questions I had!')
    ]);
    await explorationEditorMainTab.addResponse(
      'MultipleChoiceInput', null, 'End Card', true, 'Equals',
      'Those were all the questions I had!');
    responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText('I do not know!'));
    await explorationEditorMainTab.moveToState('End Card');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Congratulations, you have finished!'));
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle('Dummy Exploration');
    await explorationEditorSettingsTab.setCategory('Algorithm');
    await explorationEditorSettingsTab.setObjective('Learn more about Oppia');
    await explorationEditorSettingsTab.setLanguage('English');
    await explorationEditorPage.saveChanges();
    await workflow.publishExploration();
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
      // Should move the focus to the skip to main content button.
      await libraryPage.get();
      await browser.actions().sendKeys('s').perform();
      var skipButton = element(by.css('.protractor-test-skip-link'));
      expect(await skipButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      // Should move the focus away from the skip to main content button.
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      expect(await skipButton.getAttribute('id')).not.toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      // Should move the focus to the skip to main content button.
      await browser.actions().sendKeys('s').perform();
      expect(await skipButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
    });

  it('should move focus to the search bar in the library page',
    async function() {
      // Should move the focus to the search bar.
      await libraryPage.get();
      await browser.actions().sendKeys('/').perform();
      var searchBar = element(by.css('.protractor-test-search-input'));
      expect(await searchBar.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      // Should move the focus away from the search bar.
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      expect(await searchBar.getAttribute('id')).not.toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      // Should move the focus to the search bar.
      await browser.actions().sendKeys('/').perform();
      expect(await searchBar.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
    });

  it('should move focus to the category bar in library page',
    async function() {
      // Should move the focus to the category bar.
      await libraryPage.get();
      await browser.actions().sendKeys('c').perform();
      var categoryBar = element(by.css(
        '.protractor-test-search-bar-dropdown-toggle'));
      expect(await categoryBar.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      // Should move the focus away from the category bar.
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      expect(await categoryBar.getAttribute('id')).not.toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      // Should move the focus to the category bar.
      await browser.actions().sendKeys('c').perform();
      expect(await categoryBar.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
    });

  it('should move focus to skip to main content button in exploration player',
    async function() {
      // Should Create a user and login.
      await users.createUser('user11@accessibility.com', 'user11accessibility');
      await users.login('user11@accessibility.com', true);

      // Should create and play a dummy exploration.
      await createDummyExplorationOnDesktop();
      await libraryPage.get();
      await libraryPage.findExploration('Dummy Exploration');
      await libraryPage.playExploration('Dummy Exploration');

      // Should move the focus to the skip to main content button.
      await browser.actions().sendKeys('s').perform();
      var skipButton = element(by.css('.protractor-test-skip-link'));
      expect(await skipButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      // Should move the focus away from the skip to main content button.
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      expect(await skipButton.getAttribute('id')).not.toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      // Should move the focus back to the skip to main content button.
      await browser.actions().sendKeys('s').perform();
      expect(await skipButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
    });

  it('should move focus to next and back buttons in exploration player',
    async function() {
      // Play a dummy exploration.
      await libraryPage.get();
      await libraryPage.findExploration('Dummy Exploration');
      await libraryPage.playExploration('Dummy Exploration');
      await explorationPlayerPage.submitAnswer('Continue', null);
      await waitFor.pageToFullyLoad();

      // Should move the focus to the previous card button.
      await browser.actions().sendKeys('k').perform();
      var backButton = element(by.css('#backButtonId'));
      expect(await backButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      // Should move the focus away from the previous card button.
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      await browser.actions().sendKeys(protractor.Key.TAB).perform();

      // Should move the focus back to the previous card button and press enter.
      await browser.actions().sendKeys('k').perform();
      expect(await backButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));
      await browser.actions().sendKeys(protractor.Key.ENTER).perform();
      await waitFor.pageToFullyLoad();

      // Should move the focus to the next card button.
      var nextButton = element(by.css('.protractor-test-next-button'));
      await browser.actions().sendKeys('j').perform();
      expect(await nextButton.getAttribute('id')).toEqual(
        await (await browser.driver.switchTo().activeElement())
          .getAttribute('id'));

      // Should move the focus away from the next card button.
      await browser.actions().sendKeys(protractor.Key.TAB).perform();
      await browser.actions().sendKeys(protractor.Key.TAB).perform();

      // Should move the focus back to the next card button and press enter.
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
