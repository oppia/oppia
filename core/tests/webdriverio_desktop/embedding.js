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
 * @fileoverview End-to-end tests of embedding explorations in other websites.
 */

var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var ExplorationEditorPage =
  require('../webdriverio_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../webdriverio_utils/ExplorationPlayerPage.js');
var workflow = require('../webdriverio_utils/workflow.js');

describe('Embedding', function() {
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;

  var createCountingExploration = async function() {
    // Intro.
    await explorationEditorMainTab.setStateName('Intro');
    await explorationEditorMainTab.setContent(
      await forms.toRichText(
        'Given three balls of different colors. How many ways are there ' +
        'to arrange them in a straight line?'),
      true,
    );
    await explorationEditorMainTab.setInteraction('NumericInput');
    await explorationEditorMainTab.addResponse(
      'NumericInput', null, 'correct but why', true, 'Equals', 6);
    await explorationEditorMainTab.addResponse(
      'NumericInput', await forms.toRichText('Describe solution!!'),
      null, false, 'IsLessThanOrEqualTo', 0);
    var defaultResponseEditor = await explorationEditorMainTab
      .getResponseEditor('default');
    await defaultResponseEditor.setDestination(
      'Not 6', true, null);

    // Correct but why.
    await explorationEditorMainTab.moveToState('correct but why');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Right! Why do you think it is 6?'), true);
    await explorationEditorMainTab.setInteraction(
      'TextInput', 'Type your answer here.', 5);
    await explorationEditorMainTab.addResponse(
      'TextInput',
      await forms.toRichText('Yes, 3! = 3 x 2 x 1. That\'s 3 x 2 = 6 ways.'),
      'END', true, 'Contains', ['permutation']);
    await explorationEditorMainTab.addResponse(
      'TextInput',
      await forms.toRichText(
        'Yes, 3 factorial, or 3 x 2 x 1. That\'s 3 x 2 = 6 ways.'),
      'END', false, 'Contains', ['factorial']);
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(
      await forms.toRichText('Figure out what the answer for 4 balls is!'));

    // Not 6.
    await explorationEditorMainTab.moveToState('Not 6');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('List the different ways?'), true);
    await explorationEditorMainTab.setInteraction('Continue', 'try again');
    defaultResponseEditor = await explorationEditorMainTab
      .getResponseEditor('default');
    await defaultResponseEditor.setDestination('Intro', false, null);

    // END.
    await explorationEditorMainTab.moveToState('END');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Congratulations, you have finished!'), true);
    await explorationEditorMainTab.setInteraction('EndExploration');

    // Save changes.
    var title = 'Protractor Test';
    var category = 'Mathematics';
    var objective = 'learn how to count permutations' +
      ' accurately and systematically';
    await explorationEditorPage.navigateToSettingsTab();

    await explorationEditorSettingsTab.setTitle(title);
    await explorationEditorSettingsTab.setCategory(category);
    await explorationEditorSettingsTab.setObjective(objective);
    await explorationEditorPage.saveChanges('Done!');
    // Publish changes.
    await workflow.publishExploration();
  };

  // These errors are to be ignored as 'idToBeReplaced' is not a valid
  // exploration id. It appears just after the page loads.
  var EMBEDDING_ERRORS_TO_IGNORE = [
    'http:\/\/localhost:9001\/assets\/scripts\/' +
    'embedding_tests_dev_i18n_0.0.1.html - Refused to display ' +
    '\'http:\/\/localhost:9001\/\' in a frame because it set ' +
    '\'X-Frame-Options\' to \'deny\'.',
    'chrome-error:\/\/chromewebdata\/ - Failed to load resource: the server ' +
    'responded with a status of 400 ()',
    'chrome-error:\/\/chromewebdata\/ 0 Refused to display ' +
    '\'http:\/\/localhost:9001\/\' in a frame because it set ' +
    '\'X-Frame-Options\' to \'deny\'.',
  ];

  beforeAll(async() => {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
  });

  beforeEach(function() {
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
  });

  it('should display and play embedded explorations', async function() {
    var TEST_PAGES = [{
      filename: 'embedding_tests_dev_0.0.1.min.html',
      isVersion1: true
    }, {
      filename: 'embedding_tests_dev_0.0.2.min.html',
      isVersion1: false
    }];

    var playCountingExploration = async function(version) {
      await waitFor.pageToFullyLoad();
      await explorationPlayerPage.expectContentToMatch(
        await forms.toRichText((
          version === 2) ?
          'Given three balls of different colors. How many ways are there ' +
          'to arrange them in a straight line?' : 'Version 3'));
      await explorationPlayerPage.submitAnswer('NumericInput', 6);
      await explorationPlayerPage.expectContentToMatch(
        await forms.toRichText('Right! Why do you think it is 6?'));
      await explorationPlayerPage.expectExplorationToNotBeOver();
      await explorationPlayerPage.submitAnswer('TextInput', 'factorial');
      await explorationPlayerPage.clickThroughToNextCard();
      await explorationPlayerPage.expectExplorationToBeOver();
    };

    var PLAYTHROUGH_LOGS = [
      'Exploration loaded',
      'Transitioned from state Intro via answer 6 to state correct but why',
      'Transitioned from state correct but why via answer \\"factorial\\" ' +
        'to state END',
      'Exploration completed'
    ];

    await users.createAndLoginSuperAdminUser(
      'user1@embedding.com', 'user1Embedding');

    // Create exploration.
    // Version 1 is creation of the exploration.
    await workflow.createExploration(true);
    var explorationId = await general.getExplorationIdFromEditor();
    // Create Version 2 of the exploration.
    await createCountingExploration();
    await general.openEditor(explorationId, false);
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Version 3'));
    await explorationEditorPage.publishChanges('demonstration edit');

    for (var i = 0; i < TEST_PAGES.length; i++) {
      await browser.url(
        general.SERVER_URL_PREFIX + general.SCRIPTS_URL_SLICE +
        TEST_PAGES[i].filename);

      await (await $(
        '.e2e-test-exploration-id-input-field')
      ).setValue(explorationId);

      await (await $(
        '.e2e-test-exploration-id-submit-button')
      ).click();

      // Test of standard loading (new and old versions).
      await browser.switchToFrame(
        await $('.e2e-test-standard > iframe'));
      await playCountingExploration(3);
      await browser.switchToParentFrame();

      if (TEST_PAGES[i].isVersion1) {
        // Test of deferred loading (old version).
        await $('.e2e-test-old-version > oppia > div > button').click();
      }

      await browser.switchToFrame(
        await $('.e2e-test-old-version > iframe'));
      await playCountingExploration(2);
      await browser.switchToParentFrame();
    }

    // Certain events in the exploration playthroughs should trigger hook
    // functions in the outer page; these send logs to the console which we
    // now check to ensure that the hooks work correctly.
    var browserLogs = await browser.getLogs('browser');
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

    await users.logout();
    await general.checkForConsoleErrors(EMBEDDING_ERRORS_TO_IGNORE);
  });

  it('should use the exploration language as site language.',
    async function() {
      // Opens the test file and checks the placeholder in the exploration is
      // correct.
      var explorationId = null;
      var checkPlaceholder = async function(expectedPlaceholder) {
        await browser.url(
          general.SERVER_URL_PREFIX + general.SCRIPTS_URL_SLICE +
          'embedding_tests_dev_i18n_0.0.1.html');

        await (await $(
          '.e2e-test-exploration-id-input-field')).setValue(explorationId);

        await (await $(
          '.e2e-test-exploration-id-submit-button')).click();

        await browser.switchToFrame(await $(
          '.e2e-test-embedded-exploration > iframe'));
        await waitFor.pageToFullyLoad();

        expect(await (await $(
          '.e2e-test-float-form-input')).getAttribute(
          'placeholder')).toBe(expectedPlaceholder);
        await browser.switchToParentFrame();
      };

      await users.createAndLoginSuperAdminUser(
        'embedder2@example.com', 'Embedder2');

      // Create an exploration.
      await workflow.createExploration(true);
      explorationId = await general.getExplorationIdFromEditor();

      await explorationEditorMainTab.setContent(
        await forms.toRichText('Language Test'), true);
      await explorationEditorMainTab.setInteraction('NumericInput');
      await explorationEditorMainTab.addResponse(
        'NumericInput', await forms.toRichText('Nice!!'),
        'END', true, 'IsLessThanOrEqualTo', 0);
      var responseEditor = await explorationEditorMainTab.getResponseEditor(
        'default');
      await responseEditor.setFeedback(await forms.toRichText('Ok!!'));
      responseEditor = await explorationEditorMainTab.getResponseEditor(
        'default');
      await responseEditor.setDestination('(try again)', null, false);

      await explorationEditorMainTab.moveToState('END');
      await explorationEditorMainTab.setContent(
        await forms.toRichText('END'), true);
      await explorationEditorMainTab.setInteraction('EndExploration');

      // Save changes.
      var title = 'Language Test';
      var category = 'Languages';
      var objective = 'This is a Language Test for valid and invalid.';
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.setTitle(title);
      await explorationEditorSettingsTab.setCategory(category);
      await explorationEditorSettingsTab.setObjective(objective);
      await explorationEditorPage.saveChanges('Done!');

      // Publish changes.
      await workflow.publishExploration();

      // Change language to Thai, which is not a supported site language.
      await general.openEditor(explorationId, false);
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.setLanguage('ภาษาไทย (Thai)');
      await explorationEditorPage.publishChanges(
        'Changing the language to a not supported one.');
      // We expect the default language, English.
      await checkPlaceholder('Type a number');

      // Change language to Spanish, which is a supported site language.
      await general.openEditor(explorationId, false);
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.setLanguage('español (Spanish)');
      await explorationEditorPage.publishChanges(
        'Changing the language to a supported one.');
      await checkPlaceholder('Ingresa un número');

      await users.logout();
      await general.checkForConsoleErrors(EMBEDDING_ERRORS_TO_IGNORE);
    });
});
