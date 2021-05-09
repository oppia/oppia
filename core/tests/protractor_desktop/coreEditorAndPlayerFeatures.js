// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for the core features of the exploration
 * editor and player. Core features include the features without which an
 * exploration cannot be published. These include state content, answer groups,
 * oppia's feedback and customization_args.
 */

var action = require('../protractor_utils/action.js');
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');


describe('Enable correctness feedback and set correctness', function() {
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  var currentExplorationIndex = 0;
  var EXPLORATION_TITLE = 'Dummy Exploration';
  var explorationTitle = null;
  var libraryPage = null;
  var correctOptions = [
    ['MultipleChoiceInput', 'Correct!'],
    ['TextInput', 'One'],
    ['NumericInput', 3]
  ];

  var enableCorrectnessFeedbackSetting = async function() {
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.enableCorrectnessFeedback();
  };

  var testEnableCorrectnessInPlayerPage = async function() {
    await libraryPage.get();
    await libraryPage.findExploration(explorationTitle);
    await libraryPage.playExploration(explorationTitle);
    await explorationPlayerPage.submitAnswer.apply(
      null, correctOptions[currentExplorationIndex]);
    await explorationPlayerPage.expectCorrectFeedback();
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.expectExplorationToBeOver();
  };

  beforeAll(async function() {
    await users.createAndLoginUser('user@markCorrect.com', 'userMarkCorrect');
  });

  afterAll(async function() {
    await users.logout();
  });

  beforeEach(async function() {
    explorationTitle = EXPLORATION_TITLE + String(currentExplorationIndex);
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
  });

  it('should allow selecting correct feedback from the response editor ' +
     'after the interaction is created', async function() {
    await workflow.createExploration(true);
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle(explorationTitle);
    await explorationEditorSettingsTab.setCategory('Algorithm');
    await explorationEditorSettingsTab.setObjective('Learn more about Oppia');
    await explorationEditorSettingsTab.setLanguage('English');
    await explorationEditorPage.navigateToMainTab();

    await explorationEditorMainTab.setStateName('First');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'Select the right option.'));

    // Create interaction first.
    await explorationEditorMainTab.setInteraction('MultipleChoiceInput', [
      await forms.toRichText('Correct!'),
      await forms.toRichText('Wrong!')
    ]);
    await explorationEditorMainTab.addResponse(
      'MultipleChoiceInput', await forms.toRichText('Good!'),
      'End', true, 'Equals', 'Correct!');
    var responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText('Wrong!'));
    await explorationEditorMainTab.moveToState('End');
    await explorationEditorMainTab.setInteraction('EndExploration');
    // Turn on correctness feedback.
    await enableCorrectnessFeedbackSetting();

    // Go back to mark the solution as correct.
    await explorationEditorPage.navigateToMainTab();
    await explorationEditorMainTab.moveToState('First');
    responseEditor = await explorationEditorMainTab.getResponseEditor(0);
    await responseEditor.markAsCorrect();
    await explorationEditorMainTab.expectTickMarkIsDisplayed();
    await explorationEditorPage.saveChanges();
    await workflow.publishExploration();
    await testEnableCorrectnessInPlayerPage();
  });

  it('should allow selecting correct feedback from the response editor ' +
     'during set the interaction', async function() {
    await workflow.createExploration(false);
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle(explorationTitle);
    await explorationEditorSettingsTab.setCategory('Algorithm');
    await explorationEditorSettingsTab.setObjective('Learn more about Oppia');
    await explorationEditorSettingsTab.setLanguage('English');
    await explorationEditorPage.navigateToMainTab();

    // Turn on correctness feedback first.
    await enableCorrectnessFeedbackSetting();

    // Go to main tab to create interactions.
    await explorationEditorPage.navigateToMainTab();
    await explorationEditorMainTab.setStateName('First');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'Select the right option.'));

    // Create interaction without closing the add response modal. Set
    // correctness in the modal.
    await explorationEditorMainTab.setInteractionWithoutCloseAddResponse(
      'TextInput');
    responseEditor = await explorationEditorMainTab.getResponseEditor('pop');
    await responseEditor.markAsCorrect();

    // Set the response for this interaction and close it.
    await explorationEditorMainTab.setResponse(
      'TextInput', await forms.toRichText('Correct!'),
      'End', true, 'Equals', ['One']);

    await explorationEditorMainTab.expectTickMarkIsDisplayed();
    responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText('Wrong!'));
    await explorationEditorMainTab.moveToState('End');
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.saveChanges();
    await workflow.publishExploration();
    await testEnableCorrectnessInPlayerPage();
  });

  it('should allow selecting correct feedback from the default response editor',
    async function() {
      await workflow.createExploration(false);
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.setTitle(explorationTitle);
      await explorationEditorSettingsTab.setCategory('Algorithm');
      await explorationEditorSettingsTab.setObjective('Learn more about Oppia');
      await explorationEditorSettingsTab.setLanguage('English');
      await explorationEditorPage.navigateToMainTab();
      // Turn on correctness feedback first.
      await enableCorrectnessFeedbackSetting();

      // Go back to main tab to create interactions.
      await explorationEditorPage.navigateToMainTab();
      await explorationEditorMainTab.setStateName('First');
      await explorationEditorMainTab.setContent(await forms.toRichText(
        'Select the right option.'));
      await explorationEditorMainTab.setInteraction('NumericInput');

      // Set correctness in response editor.
      responseEditor = await explorationEditorMainTab.getResponseEditor(
        'default');
      await responseEditor.markAsCorrect();
      await responseEditor.setFeedback(await forms.toRichText('Correct!'));
      await responseEditor.setDestination('End', true, true);
      await explorationEditorMainTab.expectTickMarkIsDisplayed();

      await explorationEditorMainTab.moveToState('End');
      await explorationEditorMainTab.setInteraction('EndExploration');
      await explorationEditorPage.saveChanges();
      await workflow.publishExploration();
      await testEnableCorrectnessInPlayerPage();
    });

  it('should show Learn Again button correctly', async function() {
    await workflow.createExploration(false);
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle(explorationTitle);
    await explorationEditorSettingsTab.setCategory('Algorithm');
    await explorationEditorSettingsTab.setObjective('Learn more about Oppia');
    await explorationEditorSettingsTab.setLanguage('English');
    await explorationEditorPage.navigateToMainTab();

    // Turn on correctness feedback first.
    await enableCorrectnessFeedbackSetting();

    // Go to main tab to create interactions.
    await explorationEditorPage.navigateToMainTab();
    await explorationEditorMainTab.setStateName('First');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'Select the right option.'));

    await explorationEditorMainTab.setInteraction('MultipleChoiceInput', [
      await forms.toRichText('Correct!'),
      await forms.toRichText('Wrong!')
    ]);
    await explorationEditorMainTab.addResponse(
      'MultipleChoiceInput', await forms.toRichText('Good!'),
      'Second', true, 'Equals', 'Correct!');
    responseEditor = await explorationEditorMainTab.getResponseEditor(
      'default');
    await responseEditor.setFeedback(await forms.toRichText('Wrong!'));
    responseEditor = await explorationEditorMainTab.getResponseEditor(0);
    await responseEditor.markAsCorrect();

    await explorationEditorMainTab.moveToState('Second');
    await explorationEditorMainTab.setContent(await forms.toRichText(
      'Select the right option.'));

    await explorationEditorMainTab.setInteraction('MultipleChoiceInput', [
      await forms.toRichText('Correct!'),
      await forms.toRichText('Wrong!')
    ]);
    await explorationEditorMainTab.addResponse(
      'MultipleChoiceInput', await forms.toRichText('Good!'),
      'End', true, 'Equals', 'Correct!');
    await explorationEditorMainTab.addResponse(
      'MultipleChoiceInput', await forms.toRichText('Wrong!'),
      'First', false, 'Equals', 'Wrong!');

    await explorationEditorMainTab.moveToState('End');
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.saveChanges();
    await workflow.publishExploration();

    await libraryPage.get();
    await libraryPage.findExploration(explorationTitle);
    await libraryPage.playExploration(explorationTitle);

    await explorationPlayerPage.submitAnswer.apply(null, correctOptions[0]);
    await explorationPlayerPage.expectNextCardButtonTextToBe('CONTINUE');
    await explorationPlayerPage.clickThroughToNextCard();

    await explorationPlayerPage.submitAnswer.apply(
      null, ['MultipleChoiceInput', 'Wrong!']);
    await explorationPlayerPage.expectNextCardButtonTextToBe('LEARN AGAIN');
    await explorationPlayerPage.clickThroughToNextCard();

    await explorationPlayerPage.submitAnswer.apply(null, correctOptions[0]);
    await explorationPlayerPage.expectNextCardButtonTextToBe('CONTINUE');
    await explorationPlayerPage.clickThroughToNextCard();

    await explorationPlayerPage.submitAnswer.apply(
      null, ['MultipleChoiceInput', 'Wrong!']);
    await explorationPlayerPage.expectNextCardButtonTextToBe('LEARN AGAIN');
    await explorationPlayerPage.clickThroughToNextCard();

    await explorationPlayerPage.submitAnswer.apply(null, correctOptions[0]);
    await explorationPlayerPage.expectNextCardButtonTextToBe('CONTINUE');
    await explorationPlayerPage.clickThroughToNextCard();

    await explorationPlayerPage.submitAnswer.apply(null, correctOptions[0]);
    await explorationPlayerPage.expectNextCardButtonTextToBe('CONTINUE');
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.expectExplorationToBeOver();
  });

  afterEach(async function() {
    await libraryPage.get();
    currentExplorationIndex += 1;
    await general.checkForConsoleErrors([]);
  });
});
