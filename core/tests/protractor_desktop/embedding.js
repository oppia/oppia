// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests of embedding explorations in other websites.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var workflow = require('../protractor_utils/workflow.js');

describe('Embedding', function() {
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;

  explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  explorationEditorMainTab = explorationEditorPage.getMainTab();
  explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();

  var createCountingExploration = function() {
    // Intro.
    explorationEditorMainTab.setStateName('Intro');
    explorationEditorMainTab.setContent(forms.toRichText(
      'Given three balls of different colors. How many ways are there ' +
      'to arrange them in a straight line?')
    );
    explorationEditorMainTab.setInteraction('NumericInput');
    explorationEditorMainTab.addResponse(
      'NumericInput', null, 'correct but why', true, 'Equals', 6);
    explorationEditorMainTab.addResponse('NumericInput', forms.toRichText(
      'Describe solution!!')
      , null, false, 'IsLessThanOrEqualTo', 0);
    var defaultResponseEditor = explorationEditorMainTab
      .getResponseEditor('default');
    defaultResponseEditor.setDestination(
      'Not 6', true, null);

    // correct but why.
    explorationEditorMainTab.moveToState('correct but why');
    explorationEditorMainTab.setContent(
      forms.toRichText('Right! Why do you think it is 6?'));
    explorationEditorMainTab.setInteraction(
      'TextInput', 'Type your answer here.', 5);
    explorationEditorMainTab.addResponse('TextInput', forms.toRichText(
      'Yes, 3! = 3 x 2 x 1. That\'s 3 x 2 = 6 ways.')
      , 'END', true, 'Contains', 'permutation');
    explorationEditorMainTab.addResponse('TextInput', forms.toRichText(
      'Yes, 3 factorial, or 3 x 2 x 1. That\'s 3 x 2 = 6 ways.')
      , 'END', false, 'Contains', 'factorial');
    explorationEditorMainTab.getResponseEditor('default').setFeedback(
      forms.toRichText('Figure out what the answer for 4 balls is!'));

    // Not 6.
    explorationEditorMainTab.moveToState('Not 6');
    explorationEditorMainTab.setContent(
      forms.toRichText('List the different ways?'));
    explorationEditorMainTab.setInteraction('Continue', 'try again');
    defaultResponseEditor = explorationEditorMainTab
      .getResponseEditor('default');
    defaultResponseEditor.setDestination('Intro', false, null);

    // END.
    explorationEditorMainTab.moveToState('END');
    explorationEditorMainTab.setContent(
      forms.toRichText('Congratulations, you have finished!'));
    explorationEditorMainTab.setInteraction('EndExploration');

    // Save changes.
    title = 'Protractor Test';
    category = 'Mathematics';
    objective = 'learn how to count permutations' +
      ' accurately and systematically';
    explorationEditorPage.navigateToSettingsTab();

    explorationEditorSettingsTab.setTitle(title);
    explorationEditorSettingsTab.setCategory(category);
    explorationEditorSettingsTab.setObjective(objective);
    explorationEditorPage.saveChanges('Done!');
    // Publish changes.
    workflow.publishExploration();
  };

  beforeEach(function() {
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should display and play embedded explorations', function() {
    var TEST_PAGES = [{
      filename: 'embedding_tests_dev_0.0.1.min.html',
      isVersion1: true
    }, {
      filename: 'embedding_tests_dev_0.0.2.min.html',
      isVersion1: false
    }];

    var playCountingExploration = function(version) {
      waitFor.pageToFullyLoad();
      explorationPlayerPage.expectContentToMatch(
        forms.toRichText((version === 2) ?
          'Given three balls of different colors. How many ways are there ' +
          'to arrange them in a straight line?' : 'Version 3'));
      explorationPlayerPage.submitAnswer('NumericInput', 6);
      explorationPlayerPage.expectContentToMatch(
        forms.toRichText('Right! Why do you think it is 6?'));
      explorationPlayerPage.expectExplorationToNotBeOver();
      explorationPlayerPage.submitAnswer('TextInput', 'factorial');
      explorationPlayerPage.clickThroughToNextCard();
      explorationPlayerPage.expectExplorationToBeOver();
    };

    var PLAYTHROUGH_LOGS = [
      'Exploration loaded',
      'Transitioned from state Intro via answer 6 to state correct but why',
      'Transitioned from state correct but why via answer \\"factorial\\" ' +
        'to state END',
      'Exploration completed'
    ];

    users.createUser('user1@embedding.com', 'user1Embedding');
    users.login('user1@embedding.com', true);

    // Create exploration.
    // Version 1 is creation of the exploration.
    workflow.createExploration();
    general.getExplorationIdFromEditor().then(function(expId) {
      var explorationId = expId;
      // Create Version 2 of the exploration.
      createCountingExploration();

      general.openEditor(explorationId);
      explorationEditorMainTab.setContent(forms.toRichText('Version 3'));
      explorationEditorPage.saveChanges('demonstration edit');

      for (var i = 0; i < TEST_PAGES.length; i++) {
        // This is necessary as the pages are non-angular.
        var driver = browser.driver;
        driver.get(
          general.SERVER_URL_PREFIX + general.SCRIPTS_URL_SLICE +
          TEST_PAGES[i].filename);

        driver.findElement(by.css(
          '.protractor-test-exploration-id-input-field')
        ).sendKeys(explorationId);

        driver.findElement(by.css(
          '.protractor-test-exploration-id-submit-button')
        ).click();

        // Test of standard loading (new and old versions).
        browser.switchTo().frame(
          driver.findElement(
            by.css('.protractor-test-standard > iframe')));
        playCountingExploration(3);
        browser.switchTo().defaultContent();

        if (TEST_PAGES[i].isVersion1) {
          // Test of deferred loading (old version).
          driver.findElement(
            by.css('.protractor-test-old-version > oppia > div > button')
          ).click();
        }

        browser.switchTo().frame(
          driver.findElement(
            by.css('.protractor-test-old-version > iframe')));
        playCountingExploration(2);
        browser.switchTo().defaultContent();
      }

      // Certain events in the exploration playthroughs should trigger hook
      // functions in the outer page; these send logs to the console which we
      // now check to ensure that the hooks work correctly.
      browser.manage().logs().get('browser').then(function(browserLogs) {
        var embeddingLogs = [];
        for (var i = 0; i < browserLogs.length; i++) {
          // We ignore all logs that are not of the desired form.
          try {
            var message = browserLogs[i].message;
            var EMBEDDING_PREFIX = 'Embedding test: ';
            if (message.indexOf(EMBEDDING_PREFIX) !== -1) {
              var index = message.indexOf(EMBEDDING_PREFIX);
              // The "-1" in substring() removes the trailing quotation mark.
              embeddingLogs.push(message.substring(
                index + EMBEDDING_PREFIX.length, message.length - 1));
            }
          } catch (err) {}
        }

        // We played the exploration twice for each test page.
        var expectedLogs = [];
        for (var i = 0; i < TEST_PAGES.length; i++) {
          if (TEST_PAGES[i].isVersion1) {
            expectedLogs = expectedLogs.concat(PLAYTHROUGH_LOGS);
            expectedLogs = expectedLogs.concat(PLAYTHROUGH_LOGS);
          } else {
            // The two loading events are fired first ...
            expectedLogs = expectedLogs.concat(PLAYTHROUGH_LOGS[0]);
            expectedLogs = expectedLogs.concat(PLAYTHROUGH_LOGS[0]);
            // ... followed by the rest of the events, as each playthrough
            // occurs.
            expectedLogs = expectedLogs.concat(PLAYTHROUGH_LOGS[1]);
            expectedLogs = expectedLogs.concat(PLAYTHROUGH_LOGS[2]);
            expectedLogs = expectedLogs.concat(PLAYTHROUGH_LOGS[3]);
            expectedLogs = expectedLogs.concat(PLAYTHROUGH_LOGS[1]);
            expectedLogs = expectedLogs.concat(PLAYTHROUGH_LOGS[2]);
            expectedLogs = expectedLogs.concat(PLAYTHROUGH_LOGS[3]);
          }
        }
        expect(embeddingLogs).toEqual(expectedLogs);
      });

      users.logout();
      general.checkForConsoleErrors([]);
    });
  });

  it('should use the exploration language as site language.', function() {
    // Opens the test file and checks the placeholder in the exploration is
    // correct.
    var explorationId = null;
    var checkPlaceholder = function(expectedPlaceholder) {
      var driver = browser.driver;
      driver.get(
        general.SERVER_URL_PREFIX + general.SCRIPTS_URL_SLICE +
        'embedding_tests_dev_i18n_0.0.1.html');

      driver.findElement(by.css(
        '.protractor-test-exploration-id-input-field')
      ).sendKeys(explorationId);

      driver.findElement(by.css(
        '.protractor-test-exploration-id-submit-button')
      ).click();

      browser.switchTo().frame(driver.findElement(
        by.css('.protractor-test-embedded-exploration > iframe')));
      waitFor.pageToFullyLoad();
      expect(driver.findElement(by.css('.protractor-test-float-form-input'))
        .getAttribute('placeholder')).toBe(expectedPlaceholder);
      browser.switchTo().defaultContent();
    };

    users.createUser('embedder2@example.com', 'Embedder2');
    users.login('embedder2@example.com', true);

    // Create an exploration.
    workflow.createExploration();
    general.getExplorationIdFromEditor().then(function(expId) {
      explorationId = expId;

      explorationEditorMainTab.setContent(forms.toRichText('Language Test'));
      explorationEditorMainTab.setInteraction('NumericInput');
      explorationEditorMainTab.addResponse(
        'NumericInput', forms.toRichText('Nice!!'),
        'END', true, 'IsLessThanOrEqualTo', 0);
      explorationEditorMainTab.getResponseEditor('default').setFeedback(
        forms.toRichText('Ok!!'));
      explorationEditorMainTab.getResponseEditor('default').setDestination(
        '(try again)', null, false);
      // editor.setDefaultOutcome(forms.toRichText('Ok!!'), null, false);

      explorationEditorMainTab.moveToState('END');
      explorationEditorMainTab.setContent(forms.toRichText('END'));
      explorationEditorMainTab.setInteraction('EndExploration');

      // Save changes.
      title = 'Language Test';
      category = 'Languages';
      objective = 'This is a Language Test for valid and invalid.';
      explorationEditorPage.navigateToSettingsTab();
      explorationEditorSettingsTab.setTitle(title);
      explorationEditorSettingsTab.setCategory(category);
      explorationEditorSettingsTab.setObjective(objective);
      explorationEditorPage.saveChanges('Done!');

      // Publish changes.
      workflow.publishExploration();

      // Change language to Thai, which is not a supported site language.
      general.openEditor(explorationId);
      explorationEditorPage.navigateToSettingsTab();
      explorationEditorSettingsTab.setLanguage('ภาษาไทย');
      explorationEditorPage.saveChanges(
        'Changing the language to a not supported one.');
      // We expect the default language, English.
      checkPlaceholder('Type a number');

      // Change language to Spanish, which is a supported site language.
      general.openEditor(explorationId);
      explorationEditorPage.navigateToSettingsTab();
      explorationEditorSettingsTab.setLanguage('español');
      explorationEditorPage.saveChanges(
        'Changing the language to a supported one.');
      checkPlaceholder('Ingresa un número');

      users.logout();

      // This error is to be ignored as 'idToBeReplaced' is not a valid
      // exploration id. It appears just after the page loads.
      var errorToIgnore = 'http:\/\/localhost:9001\/assets\/' +
        'scripts\/embedding_tests_dev_i18n_0.0.1.html - Refused to display ' +
        '\'http:\/\/localhost:9001\/explore\/idToBeReplaced\\?iframed=true&' +
        'locale=en#version=0.0.1&secret=';
      general.checkForConsoleErrors([errorToIgnore]);
    });
  });
});
