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
 * @fileoverview End-to-end tests for additional features of the exploration
 * editor and player. Additional features include those features without which
 * an exploration can still be published. These include hints, solutions,
 * refresher explorations, state parameters, etc.
 */

var action = require('../webdriverio_utils/action.js');
var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');

var ExplorationEditorPage =
  require('../webdriverio_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../webdriverio_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');

describe('Full exploration editor', function() {
  var explorationEditorPage = null;
  var explorationPlayerPage = null;
  var libraryPage = null;

  var explorationEditorMainTab = null;

  beforeAll(async function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    libraryPage = new LibraryPage.LibraryPage();

    explorationEditorMainTab = explorationEditorPage.getMainTab();
  });

  it('should walk through the tutorial when user repeatedly clicks Next',
    async function() {
      await users.createUser(
        'userTutorial@stateEditor.com', 'userTutorialStateEditor');
      await users.login('userTutorial@stateEditor.com');

      await workflow.createExplorationAndStartTutorial(false);
      await explorationEditorMainTab.startTutorial();
      await explorationEditorMainTab.playTutorial();
      await explorationEditorMainTab.finishTutorial();
      await users.logout();
    }
  );

  it('should reflect skills and goal in exploration editor settings',
    async function() {
      await users.createUser('user@editorAndPlayer.com', 'userEditorAndPlayer');
      await users.login('user@editorAndPlayer.com');
      const EXPLORATION_OBJECTIVE =
      'Let us learn how to add fractions in an amazing way';
      const EXPLORATION_TITLE = 'Fractions';
      const EXPLORATION_CATEGORY = 'Mathematics';
      const EXPLORATION_LANGUAGE = 'Deutsch (German)';
      const EXPLORATION_TAGS = ['maths', 'english', 'fractions', 'addition'];

      await workflow.createAddExpDetailsAndPublishExp(
        EXPLORATION_TITLE,
        EXPLORATION_CATEGORY,
        EXPLORATION_OBJECTIVE,
        EXPLORATION_LANGUAGE,
        EXPLORATION_TAGS,
        true
      );
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorPage.verifyExplorationSettingFields(
        EXPLORATION_TITLE,
        EXPLORATION_CATEGORY,
        EXPLORATION_OBJECTIVE,
        EXPLORATION_LANGUAGE,
        EXPLORATION_TAGS
      );
      await users.logout();
    });

  it('should report an exploration to moderators', async function() {
    var EXPLORATION_OBJECTIVE = 'Let us learn how to add fractions';
    await users.createUser(
      'creator@editorAndPlayer.com', 'creatorEditorAndPlayer');
    await users.login('creator@editorAndPlayer.com');

    await workflow.createAndPublishExploration(
      'Fractions',
      'Mathematics',
      EXPLORATION_OBJECTIVE,
      'English',
      true
    );
    await users.logout();
    await users.createUser('learner@editorAndPlayer.com', 'learner');
    await users.login('learner@editorAndPlayer.com');
    await libraryPage.get();
    await libraryPage.clickExplorationObjective();
    await explorationPlayerPage.reportExploration();
    await users.logout();
  });

  it('should prevent going back when help card is shown', async function() {
    await users.createUser('user2@editorAndPlayer.com', 'user2EditorAndPlayer');
    await users.login('user2@editorAndPlayer.com');

    await workflow.createExploration(true);
    await explorationEditorMainTab.setStateName('card 1');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('this is card 1'), true);
    await explorationEditorMainTab.setInteraction('Continue');
    await (
      await explorationEditorMainTab.getResponseEditor('default')
    ).setDestination('card 2', true, null);

    await explorationEditorMainTab.moveToState('card 2');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'this is card 2 with non-inline interaction'), true);
    await explorationEditorMainTab.setInteraction('CodeRepl');
    await explorationEditorMainTab.addResponse(
      'CodeRepl', await forms.toRichText('Nice. Press continue button'),
      'final card', true, 'CodeDoesNotContain', 'test');
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText('try again'));

    // Setup a terminating state.
    await explorationEditorMainTab.moveToState('final card');
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.saveChanges();

    await general.moveToPlayer();
    await explorationPlayerPage.submitAnswer('Continue');
    var backButton = $('.e2e-test-back-button');
    var nextCardButton = $('.e2e-test-next-card-button');
    expect(await backButton.isExisting()).toEqual(true);
    await explorationPlayerPage.submitAnswer('CodeRepl');
    await waitFor.visibilityOf(
      nextCardButton, 'Next Card button taking too long to show up.');
    await waitFor.invisibilityOf(
      backButton, 'Back button takes too long to disappear.');

    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.expectExplorationToBeOver();
    await users.logout();
  });

  it('should redirect back to parent exploration correctly when parent id is' +
      ' given as query parameter', async function() {
    await users.createUser('user1@editorAndPlayer.com', 'user1EditorAndPlayer');
    await users.login('user1@editorAndPlayer.com');

    await workflow.createAndPublishExploration(
      'Parent Exploration 1',
      'Algebra',
      'This is the topmost parent exploration.',
      'English',
      true
    );
    var parentId1 = await general.getExplorationIdFromEditor();
    await workflow.createAndPublishExploration(
      'Parent Exploration 2',
      'Algebra',
      'This is the second parent exploration to which refresher ' +
      'exploration redirects.',
      'English',
      false
    );
    var parentId2 = await general.getExplorationIdFromEditor();
    await workflow.createAndPublishExploration(
      'Refresher Exploration',
      'Algebra',
      'This is the most basic refresher exploration',
      'English',
      false
    );

    var refresherExplorationId = await general.getExplorationIdFromEditor();

    await browser.url(
      '/explore/' + refresherExplorationId + '?parent=' + parentId1 +
      '&parent=' + parentId2);
    await waitFor.pageToFullyLoad();

    await explorationPlayerPage.clickOnReturnToParentButton();

    var url = await browser.getUrl();
    var currentExplorationId = url.split('/')[4].split('?')[0];
    expect(currentExplorationId).toBe(parentId2);
    await explorationPlayerPage.clickOnReturnToParentButton();

    url = await browser.getUrl();
    currentExplorationId = url.split('/')[4];
    expect(currentExplorationId).toBe(parentId1);
    await users.logout();
  });

  it('should navigate multiple states correctly, with parameters',
    async function() {
      await users.createUser(
        'user4@editorAndPlayer.com', 'user4EditorAndPlayer');
      await users.login('user4@editorAndPlayer.com');

      await workflow.createExploration(true);
      await explorationEditorMainTab.setStateName('card 1');
      await explorationEditorMainTab.setContent(
        await forms.toRichText('this is card 1'), true);
      await explorationEditorMainTab.setInteraction('NumericInput');
      await explorationEditorMainTab.addResponse(
        'NumericInput', null, 'final card', true, 'Equals', 21);
      await (
        await explorationEditorMainTab.getResponseEditor(0)
      ).setDestination('card 2', true, null);

      await explorationEditorMainTab.moveToState('card 2');
      await explorationEditorMainTab.setContent(
        await forms.toRichText(
          'this is card 2 with previous answer {{answer}}'), true);
      await explorationEditorMainTab.setInteraction(
        'MultipleChoiceInput',
        [
          await forms.toRichText('return'),
          await forms.toRichText('complete'),
          await forms.toRichText('incomplete'),
          await forms.toRichText('needs to be done')
        ]
      );
      await explorationEditorMainTab.addResponse(
        'MultipleChoiceInput', null, 'card 1', false,
        'Equals', 'return');
      await (
        await explorationEditorMainTab.getResponseEditor('default')
      ).setDestination('final card', false, null);
      // Setup a terminating state.
      await explorationEditorMainTab.moveToState('final card');
      await explorationEditorMainTab.setInteraction('EndExploration');
      await explorationEditorPage.saveChanges();

      await general.moveToPlayer();
      await explorationPlayerPage.expectContentToMatch(
        await forms.toRichText('this is card 1'));
      await explorationPlayerPage.submitAnswer('NumericInput', 19);
      await explorationPlayerPage.submitAnswer('NumericInput', 21);
      await explorationPlayerPage.expectContentToMatch(
        await forms.toRichText('this is card 2 with previous answer 21'));
      await explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'return');

      await explorationPlayerPage.expectContentToMatch(
        await forms.toRichText('this is card 1'));
      await explorationPlayerPage.dismissLessonInfoTooltip();
      await explorationPlayerPage.submitAnswer('NumericInput', 21);
      await explorationPlayerPage.expectContentToMatch(
        await forms.toRichText('this is card 2 with previous answer 21'));
      await explorationPlayerPage.expectExplorationToNotBeOver();
      await explorationPlayerPage.submitAnswer(
        'MultipleChoiceInput', 'complete');
      await explorationPlayerPage.expectExplorationToBeOver();
      await users.logout();
    });

  it('should use hints and solutions in an exploration', async function() {
    var explorationPlayerPage = (
      new ExplorationPlayerPage.ExplorationPlayerPage());
    await users.createUser('user1@hintsAndSolutions.com', 'hintsAndSolutions');

    // Creator creates and publishes an exploration.
    await users.login('user1@hintsAndSolutions.com');

    await workflow.createExploration(true);
    await explorationEditorMainTab.setStateName('Introduction');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('What language is Oppia?'), true);
    await explorationEditorMainTab.setInteraction('TextInput');
    await explorationEditorMainTab.addResponse(
      'TextInput', await forms.toRichText('Good job'),
      'End', true, 'Equals', ['Finnish']);
    await (
      await explorationEditorMainTab.getResponseEditor('default')
    ).setFeedback(await forms.toRichText('Try again'));
    await explorationEditorMainTab.addHint('Try language of Finland');
    await explorationEditorMainTab.addSolution('TextInput', {
      correctAnswer: 'Finnish',
      explanation: 'Finland language'
    });
    await explorationEditorMainTab.moveToState('End');
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.saveChanges();
    await general.moveToPlayer();
    await explorationPlayerPage.expectContentToMatch(
      await forms.toRichText('What language is Oppia?'));
    await explorationPlayerPage.submitAnswer('TextInput', 'Roman');
    await explorationPlayerPage.viewHint();
    await explorationPlayerPage.submitAnswer('TextInput', 'Greek');

    await explorationPlayerPage.expectExplorationToNotBeOver();
    await explorationPlayerPage.submitAnswer('TextInput', 'Finnish');
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.expectExplorationToBeOver();
    await users.logout();
  });

  it('should play the recommended exploration successfully', async function() {
    await users.createUser('user9@editorAndPlayer.com', 'user9editorAndPlayer');
    await users.createUser(
      'user10@editorAndPlayer.com', 'user10editorAndPlayer');
    await users.login('user9@editorAndPlayer.com');
    // Publish new exploration.

    await workflow.createExploration(true);
    await explorationEditorMainTab.setContent(
      await forms.toRichText('You should recommend this exploration'));
    await explorationEditorMainTab.setInteraction('EndExploration');
    var explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle('Recommended Exploration 1');
    await explorationEditorSettingsTab.setCategory('Algorithm');
    await explorationEditorSettingsTab.setObjective('To be recommended');
    await explorationEditorPage.navigateToMainTab();
    await explorationEditorPage.saveChanges();
    await workflow.publishExploration();
    await users.logout();

    await users.login('user10@editorAndPlayer.com');
    await libraryPage.get();
    await libraryPage.findExploration('Recommended Exploration 1');
    await libraryPage.playExploration('Recommended Exploration 1');
    // Using the Id from Player and create a new exploration
    // and add the Id as suggestion.
    var recommendedExplorationId = await general.getExplorationIdFromPlayer();

    await workflow.createExploration(true);
    await explorationEditorMainTab.setContent(
      await forms.toRichText('I want to recommend an exploration at the end'));
    await explorationEditorMainTab.setInteraction(
      'EndExploration', [recommendedExplorationId]);
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle(
      'Exploration with Recommendation');
    await explorationEditorSettingsTab.setCategory('Algorithm');
    await explorationEditorSettingsTab.setObjective(
      'To display recommended exploration');
    await explorationEditorPage.navigateToMainTab();
    await explorationEditorPage.saveChanges();
    await workflow.publishExploration();

    // Play-test the exploration and visit the recommended exploration.
    await libraryPage.get();
    await libraryPage.findExploration('Exploration with Recommendation');
    await libraryPage.playExploration('Exploration with Recommendation');
    var recommendedExplorationTile = $('.e2e-test-exp-summary-tile-title');
    var recommendedExplorationName = await action.getText(
      'Recommended Exploration Tile', recommendedExplorationTile);
    expect(recommendedExplorationName).toEqual('Recommended Exploration 1');
    await recommendedExplorationTile.click();
    await explorationPlayerPage.expectExplorationNameToBe(
      'Recommended Exploration 1');
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
