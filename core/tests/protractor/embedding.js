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
var admin = require('../protractor_utils/admin.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');

describe('Embedding', function() {
  it('should display and play embedded explorations', function() {
    var TEST_PAGES = [
      'embedding_tests_dev_0.0.1.html',
      'embedding_tests_dev_0.0.1.min.html',
      'embedding_tests_jsdelivr_0.0.1.min.html'];
    // The length of time the page waits before confirming an exploration
    // cannot be loaded.
    var LOADING_TIMEOUT = 10000;

    var playCountingExploration = function(version) {
      general.waitForSystem();
      browser.waitForAngular();

      player.expectContentToMatch(
        forms.toRichText((version === 1) ?
          'Suppose you were given three balls: one red, one blue, and one ' +
          'yellow. How many ways are there to arrange them in a straight ' +
          'line?' :
          'Version 2'));
      player.submitAnswer('NumericInput', 6);
      player.expectContentToMatch(
        forms.toRichText('Right! Why do you think it is 6?'));
      player.expectExplorationToNotBeOver();
      player.submitAnswer('TextInput', 'factorial');
      player.clickThroughToNextCard();
      player.expectExplorationToBeOver();
    };

    var PLAYTHROUGH_LOGS = [
      'Exploration loaded',
      'Transitioned from state Intro via answer 6 to state correct but why',
      'Transitioned from state correct but why via answer "factorial" to ' +
        'state END',
      'Exploration completed'
    ];

    users.createUser('user1@embedding.com', 'user1Embedding');
    users.login('user1@embedding.com', true);
    admin.reloadExploration('protractor_test_1.yaml');

    general.openEditor('12');
    editor.setContent(forms.toRichText('Version 2'));
    editor.saveChanges('demonstration edit');

    for (var i = 0; i < TEST_PAGES.length; i++) {
      // This is necessary as the pages are non-angular; we need xpaths below
      // for the same reason.
      var driver = browser.driver;
      driver.get(
        general.SERVER_URL_PREFIX + general.SCRIPTS_URL_SLICE + TEST_PAGES[i]);

      // Test of standard loading (new version)
      browser.switchTo().frame(
        driver.findElement(
          by.xpath("//div[@class='protractor-test-standard']/iframe")));
      playCountingExploration(2);
      browser.switchTo().defaultContent();

      // Test of deferred loading (old version)
      driver.findElement(
        by.xpath(
          "//div[@class='protractor-test-deferred']/oppia/div/button")).click();
      browser.switchTo().frame(
        driver.findElement(
          by.xpath("//div[@class='protractor-test-deferred']/iframe")));
      playCountingExploration(1);
      browser.switchTo().defaultContent();

      // Tests of failed loading
      var missingIdElement = driver.findElement(
        by.xpath("//div[@class='protractor-test-missing-id']/div/span"));
      expect(missingIdElement.getText()).toMatch(
        'This Oppia exploration could not be loaded because no oppia-id ' +
        'attribute was specified in the HTML tag.');
      driver.findElement(
        by.xpath(
          "//div[@class='protractor-test-invalid-id-deferred']/oppia/div/button"
        )).click();
      browser.sleep(LOADING_TIMEOUT);
      expect(
        driver.findElement(
          by.xpath("//div[@class='protractor-test-invalid-id']/div/div/span")
        ).getText()).toMatch('This exploration could not be loaded.');
      expect(
        driver.findElement(
          by.xpath("//div[@class='protractor-test-invalid-id']/div/div/span")
        ).getText()).toMatch('This exploration could not be loaded.');
    }

    // Certain events in the exploration playthroughs should trigger hook
    // functions in the outer page; these send logs to the console which we
    // now check to ensure that the hooks work correctly.
    browser.manage().logs().get('browser').then(function(browserLogs) {
      var embeddingLogs = [];
      for (var i = 0; i < browserLogs.length; i++) {
        // We ignore all logs that are not of the desired form.
        try {
          var message = JSON.parse(browserLogs[i].message).message.
            parameters[0].value;
          var EMBEDDING_PREFIX = 'Embedding test: ';
          if (message.substring(0, EMBEDDING_PREFIX.length) ===
              EMBEDDING_PREFIX) {
            embeddingLogs.push(message.substring(EMBEDDING_PREFIX.length));
          }
        } catch (err) {}
      }

      // We played the exploration twice for each test page.
      var expectedLogs = [];
      for (var i = 0; i < TEST_PAGES.length * 2; i++) {
        expectedLogs = expectedLogs.concat(PLAYTHROUGH_LOGS);
      }
      expect(embeddingLogs).toEqual(expectedLogs);
    });

    users.logout();
    general.checkForConsoleErrors([]);
  });

  it('should use the exploration language as site language.', function() {
    // Opens the test file and checks the placeholder in the exploration is
    // correct.
    var checkPlaceholder = function(expectedPlaceholder) {
      var driver = browser.driver;
      driver.get(
        general.SERVER_URL_PREFIX + general.SCRIPTS_URL_SLICE +
        'embedding_tests_dev_i18n_0.0.1.html');
      browser.switchTo().frame(driver.findElement(by.xpath(
          "//div[@class='protractor-test-embedded-exploration']/iframe")));
      general.waitForSystem();
      browser.waitForAngular();
      expect(driver.findElement(by.css('.protractor-test-float-form-input'))
          .getAttribute('placeholder')).toBe(expectedPlaceholder);
      browser.switchTo().defaultContent();
    };

    users.createUser('embedder2@example.com', 'Embedder2');
    users.login('embedder2@example.com', true);
    admin.reloadExploration('protractor_test_1.yaml');

    // Change language to Thai, which is not a supported site language.
    general.openEditor('12');
    editor.setLanguage('ภาษาไทย');
    editor.saveChanges('Changing the language to a not supported one.');
    // We expect the default language, English
    checkPlaceholder('Type a number');

    // Change language to Spanish, which is a supported site language.
    general.openEditor('12');
    editor.setLanguage('español');
    editor.saveChanges('Changing the language to a supported one.');
    checkPlaceholder('Ingresa un número');

    users.logout();
    general.checkForConsoleErrors([]);
  });
});
