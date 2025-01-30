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
 * @fileoverview End-to-end tests for the core features of the exploration
 * editor and player. Core features include the features without which an
 * exploration cannot be published. These include state content, answer groups,
 * oppia's feedback and customization_args.
 */

var action = require('../webdriverio_utils/action.js');
var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');

var CreatorDashboardPage = require('../webdriverio_utils/CreatorDashboardPage.js');
var ExplorationEditorPage = require('../webdriverio_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage = require('../webdriverio_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');

describe('Enable correctness feedback and set correctness', function () {
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
    ['NumericInput', 3],
  ];

  var testEnableCorrectnessInPlayerPage = async function () {
    await libraryPage.get();
    await libraryPage.findExploration(explorationTitle);
    await libraryPage.playExploration(explorationTitle);
    await explorationPlayerPage.submitAnswer.apply(
      null,
      correctOptions[currentExplorationIndex]
    );
    await explorationPlayerPage.expectCorrectFeedback();
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.expectExplorationToBeOver();
  };

  beforeAll(async function () {
    await users.createAndLoginUser('user@markCorrect.com', 'userMarkCorrect');
  });

  afterAll(async function () {
    await users.logout();
  });

  beforeEach(async function () {
    explorationTitle = EXPLORATION_TITLE + String(currentExplorationIndex);
    libraryPage = new LibraryPage.LibraryPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
  });

  it(
    'should allow selecting correct feedback from the response editor ' +
      'after the interaction is created',
    async function () {
      await workflow.createExploration(true);
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.setTitle(explorationTitle);
      await explorationEditorSettingsTab.setCategory('Algorithm');
      await explorationEditorSettingsTab.setObjective('Learn more about Oppia');
      await explorationEditorSettingsTab.setLanguage('English');
      await explorationEditorPage.navigateToMainTab();

      await explorationEditorMainTab.setStateName('First');
      await explorationEditorMainTab.setContent(
        await forms.toRichText('Select the right option.'),
        true
      );

      // Create interaction first.
      await explorationEditorMainTab.setInteraction('MultipleChoiceInput', [
        await forms.toRichText('Correct!'),
        await forms.toRichText('Wrong!'),
        await forms.toRichText('Not correct'),
        await forms.toRichText('Wrong again'),
      ]);
      await explorationEditorMainTab.addResponse(
        'MultipleChoiceInput',
        await forms.toRichText('Good!'),
        'End',
        true,
        'Equals',
        'Correct!'
      );
      var responseEditor =
        await explorationEditorMainTab.getResponseEditor('default');
      await responseEditor.setFeedback(await forms.toRichText('Wrong!'));
      await explorationEditorMainTab.moveToState('End');
      await explorationEditorMainTab.setInteraction('EndExploration');

      // Go back to mark the solution as correct.
      await explorationEditorPage.navigateToMainTab();
      await explorationEditorMainTab.moveToState('First');
      responseEditor = await explorationEditorMainTab.getResponseEditor(0);
      await responseEditor.markAsCorrect();
      await explorationEditorMainTab.expectTickMarkIsDisplayed();
      await explorationEditorPage.saveChanges();
      await workflow.publishExploration();
      await testEnableCorrectnessInPlayerPage();
    }
  );

  it(
    'should allow selecting correct feedback from the response editor ' +
      'during set the interaction',
    async function () {
      await workflow.createExploration(false);
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.setTitle(explorationTitle);
      await explorationEditorSettingsTab.setCategory('Algorithm');
      await explorationEditorSettingsTab.setObjective('Learn more about Oppia');
      await explorationEditorSettingsTab.setLanguage('English');
      await explorationEditorPage.navigateToMainTab();

      // Go to main tab to create interactions.
      await explorationEditorPage.navigateToMainTab();
      await explorationEditorMainTab.setStateName('First');
      await explorationEditorMainTab.setContent(
        await forms.toRichText('Select the right option.'),
        true
      );

      // Create interaction without closing the add response modal. Set
      // correctness in the modal.
      await explorationEditorMainTab.setInteractionWithoutCloseAddResponse(
        'TextInput'
      );
      responseEditor = await explorationEditorMainTab.getResponseEditor('pop');
      await responseEditor.markAsCorrect();

      // Set the response for this interaction and close it.
      await explorationEditorMainTab.setResponse(
        'TextInput',
        await forms.toRichText('Correct!'),
        'End',
        true,
        'Equals',
        ['One']
      );

      await explorationEditorMainTab.expectTickMarkIsDisplayed();
      responseEditor =
        await explorationEditorMainTab.getResponseEditor('default');
      await responseEditor.setFeedback(await forms.toRichText('Wrong!'));
      await explorationEditorMainTab.moveToState('End');
      await explorationEditorMainTab.setInteraction('EndExploration');
      await explorationEditorPage.saveChanges();
      await workflow.publishExploration();
      await testEnableCorrectnessInPlayerPage();
    }
  );

  it('should allow selecting correct feedback from the default response editor', async function () {
    await workflow.createExploration(false);
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle(explorationTitle);
    await explorationEditorSettingsTab.setCategory('Algorithm');
    await explorationEditorSettingsTab.setObjective('Learn more about Oppia');
    await explorationEditorSettingsTab.setLanguage('English');
    await explorationEditorPage.navigateToMainTab();

    // Go back to main tab to create interactions.
    await explorationEditorPage.navigateToMainTab();
    await explorationEditorMainTab.setStateName('First');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Select the right option.'),
      true
    );
    await explorationEditorMainTab.setInteraction('NumericInput');

    // Set correctness in response editor.
    responseEditor =
      await explorationEditorMainTab.getResponseEditor('default');
    await responseEditor.setFeedback(await forms.toRichText('Correct!'));
    await responseEditor.setDestination('End', true, true);
    await responseEditor.markAsCorrect();
    await explorationEditorMainTab.expectTickMarkIsDisplayed();

    await explorationEditorMainTab.moveToState('End');
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.saveChanges();
    await workflow.publishExploration();
    await testEnableCorrectnessInPlayerPage();
  });

  it('should show Learn Again button correctly', async function () {
    await workflow.createExploration(false);
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.setTitle(explorationTitle);
    await explorationEditorSettingsTab.setCategory('Algorithm');
    await explorationEditorSettingsTab.setObjective('Learn more about Oppia');
    await explorationEditorSettingsTab.setLanguage('English');
    await explorationEditorPage.navigateToMainTab();

    // Go to main tab to create interactions.
    await explorationEditorPage.navigateToMainTab();
    await explorationEditorMainTab.setStateName('First');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Select the right option.'),
      true
    );

    await explorationEditorMainTab.setInteraction('MultipleChoiceInput', [
      await forms.toRichText('Correct!'),
      await forms.toRichText('Wrong!'),
      await forms.toRichText('Not correct'),
      await forms.toRichText('Wrong again'),
    ]);
    await explorationEditorMainTab.addResponse(
      'MultipleChoiceInput',
      await forms.toRichText('Good!'),
      'Second',
      true,
      'Equals',
      'Correct!'
    );
    responseEditor =
      await explorationEditorMainTab.getResponseEditor('default');
    await responseEditor.setFeedback(await forms.toRichText('Wrong!'));
    responseEditor = await explorationEditorMainTab.getResponseEditor(0);
    await responseEditor.markAsCorrect();

    await explorationEditorMainTab.moveToState('Second');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Select the right option.'),
      true
    );

    await explorationEditorMainTab.setInteraction('MultipleChoiceInput', [
      await forms.toRichText('Correct!'),
      await forms.toRichText('Wrong!'),
      await forms.toRichText('Not correct'),
      await forms.toRichText('Wrong again'),
    ]);
    await explorationEditorMainTab.addResponse(
      'MultipleChoiceInput',
      await forms.toRichText('Good!'),
      'End',
      true,
      'Equals',
      'Correct!'
    );
    await explorationEditorMainTab.addResponse(
      'MultipleChoiceInput',
      await forms.toRichText('Wrong!'),
      'First',
      false,
      'Equals',
      'Wrong!'
    );
    await explorationEditorMainTab.addResponse(
      'MultipleChoiceInput',
      await forms.toRichText('Not correct'),
      'First',
      false,
      'Equals',
      'Not correct'
    );
    await explorationEditorMainTab.addResponse(
      'MultipleChoiceInput',
      await forms.toRichText('Wrong again'),
      'First',
      false,
      'Equals',
      'Wrong again'
    );

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

    await explorationPlayerPage.submitAnswer.apply(null, [
      'MultipleChoiceInput',
      'Wrong!',
    ]);
    await explorationPlayerPage.expectNextCardButtonTextToBe('LEARN AGAIN');
    await explorationPlayerPage.clickThroughToNextCard();

    await explorationPlayerPage.clickForwardButton();

    await explorationPlayerPage.submitAnswer.apply(null, [
      'MultipleChoiceInput',
      'Wrong!',
    ]);
    await explorationPlayerPage.expectNextCardButtonTextToBe('LEARN AGAIN');
    await explorationPlayerPage.clickThroughToNextCard();

    await explorationPlayerPage.clickForwardButton();

    await explorationPlayerPage.submitAnswer.apply(null, correctOptions[0]);
    await explorationPlayerPage.expectNextCardButtonTextToBe('CONTINUE');
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.expectExplorationToBeOver();
  });

  afterEach(async function () {
    await libraryPage.get();
    currentExplorationIndex += 1;
    await general.checkForConsoleErrors([]);
  });
});

describe('Core exploration functionality', function () {
  var explorationPlayerPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var userNumber = 1;

  beforeEach(async function () {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    await users.createUser(
      `user${userNumber}@stateEditor.com`,
      `user${userNumber}StateEditor`
    );
    await users.login(`user${userNumber}@stateEditor.com`);
    await workflow.createExploration(true);

    userNumber++;
  });

  it('should display plain text content', async function () {
    await explorationEditorMainTab.setContent(
      await forms.toRichText('plain text')
    );
    await explorationEditorMainTab.setInteraction('Continue', 'click here');
    var responseEditor =
      await explorationEditorMainTab.getResponseEditor('default');
    await responseEditor.setDestination('final card', true, null);

    // Setup a terminating state.
    await explorationEditorMainTab.moveToState('final card');
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.saveChanges();

    await general.moveToPlayer();
    await explorationPlayerPage.expectContentToMatch(
      await forms.toRichText('plain text')
    );
    await explorationPlayerPage.expectExplorationToNotBeOver();
    await explorationPlayerPage.expectInteractionToMatch(
      'Continue',
      'click here'
    );
    await explorationPlayerPage.submitAnswer('Continue', null);
    await explorationPlayerPage.expectExplorationToBeOver();
  });

  it('should create content and multiple choice interactions', async function () {
    await explorationEditorMainTab.setContent(async function (richTextEditor) {
      await richTextEditor.appendBoldText('bold text');
      await richTextEditor.appendPlainText(' ');
      await richTextEditor.appendItalicText('italic text');
      await richTextEditor.appendPlainText(' ');
      await richTextEditor.appendPlainText(' ');
      await richTextEditor.appendOrderedList(['entry 1', 'entry 2']);
      await richTextEditor.appendUnorderedList(['an entry', 'another entry']);
    });
    await explorationEditorMainTab.setInteraction('MultipleChoiceInput', [
      await forms.toRichText('option A'),
      await forms.toRichText('option B'),
      await forms.toRichText('option C'),
      await forms.toRichText('option D'),
    ]);
    var responseEditor =
      await explorationEditorMainTab.getResponseEditor('default');
    await responseEditor.setDestination('final card', true, null);

    // Setup a terminating state.
    await explorationEditorMainTab.moveToState('final card');
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.saveChanges();

    await general.moveToPlayer();
    await explorationPlayerPage.expectExplorationToNotBeOver();
    await explorationPlayerPage.expectInteractionToMatch(
      'MultipleChoiceInput',
      ['option A', 'option B', 'option C', 'option D']
    );
    await explorationPlayerPage.submitAnswer('MultipleChoiceInput', 'option B');
    await explorationPlayerPage.expectExplorationToBeOver();
  });

  it('should obey numeric interaction rules and display feedback', async function () {
    await explorationEditorMainTab.setContent(
      await forms.toRichText('some content')
    );
    await explorationEditorMainTab.setInteraction('NumericInput');
    await explorationEditorMainTab.addResponse(
      'NumericInput',
      async function (richTextEditor) {
        await richTextEditor.appendBoldText('correct');
      },
      'final card',
      true,
      'IsInclusivelyBetween',
      -1,
      3
    );
    var responseEditor = await explorationEditorMainTab.getResponseEditor(0);
    await responseEditor.expectRuleToBe(
      'NumericInput',
      'IsInclusivelyBetween',
      [-1, 3]
    );
    responseEditor = await explorationEditorMainTab.getResponseEditor(0);
    await responseEditor.expectFeedbackInstructionToBe('correct');
    responseEditor =
      await explorationEditorMainTab.getResponseEditor('default');
    await responseEditor.setFeedback(await forms.toRichText('out of bounds'));
    responseEditor =
      await explorationEditorMainTab.getResponseEditor('default');
    await responseEditor.expectFeedbackInstructionToBe('out of bounds');
    responseEditor =
      await explorationEditorMainTab.getResponseEditor('default');
    await responseEditor.setDestination(null, false, null);

    // Setup a terminating state.

    await explorationEditorMainTab.moveToState('final card');
    await explorationEditorMainTab.setInteraction('EndExploration');
    await explorationEditorPage.saveChanges();

    await general.moveToPlayer();
    await explorationPlayerPage.submitAnswer('NumericInput', 5);
    await explorationPlayerPage.expectLatestFeedbackToMatch(
      await forms.toRichText('out of bounds')
    );
    await explorationPlayerPage.expectExplorationToNotBeOver();
    // It's important to test the value 0 in order to ensure that it would
    // still get submitted even though it is a falsy value in JavaScript.
    await explorationPlayerPage.submitAnswer('NumericInput', 0);
    await explorationPlayerPage.expectLatestFeedbackToMatch(
      async function (richTextChecker) {
        await richTextChecker.readBoldText('correct');
      }
    );
    await explorationPlayerPage.clickThroughToNextCard();
    await explorationPlayerPage.expectExplorationToBeOver();
  });

  it(
    'should not show self-loop warning when navigating between ' +
      'different states',
    async function () {
      // Setup initial state.
      await explorationEditorMainTab.setContent(
        await forms.toRichText('some content')
      );
      await explorationEditorMainTab.setInteraction('NumericInput');
      await explorationEditorMainTab.addResponse(
        'NumericInput',
        async function (richTextEditor) {
          await richTextEditor.appendBoldText('correct');
        },
        'final card',
        true,
        'IsInclusivelyBetween',
        -1,
        3
      );
      var firstResponseEditor =
        await explorationEditorMainTab.getResponseEditor(0);
      await firstResponseEditor.markAsCorrect();
      var defaultResponseEditor =
        await explorationEditorMainTab.getResponseEditor('default');
      await defaultResponseEditor.setFeedback(
        await forms.toRichText('try again')
      );
      await defaultResponseEditor.setDestination(null, false, null);

      // Setup terminating state.
      await explorationEditorMainTab.moveToState('final card');
      await explorationEditorMainTab.setInteraction('EndExploration');
      await explorationEditorPage.saveChanges();

      // Test the flow.
      await explorationEditorMainTab.moveToState('Introduction');
      await explorationEditorPage.navigateToPreviewTab();
      await explorationEditorPage.waitForPreviewTabToLoad();
      await explorationPlayerPage.submitAnswer('NumericInput', 1);
      await explorationPlayerPage.clickThroughToNextCard();
      await explorationPlayerPage.waitForLessonCompletionMessageToDisappear();
      await explorationEditorPage.navigateToMainTab();
      await explorationEditorMainTab.moveToState('Introduction');
      await explorationEditorMainTab.checkSelfLoopWarningIsNotShown();
    }
  );

  it(
    'should skip the customization modal for interactions having no ' +
      'customization options',
    async function () {
      await explorationEditorMainTab.setContent(
        await forms.toRichText('some content')
      );

      // NumberWithUnits input does not have any customization arguments.
      // Therefore the customization modal and the save interaction button do
      // not appear.
      await explorationEditorMainTab.setInteraction('NumberWithUnits');
      await explorationEditorMainTab.deleteInteraction();
      // The Continue input has customization options. Therefore the
      // customization modal does appear and so does the save interaction button.
      await explorationEditorMainTab.setInteraction('Continue');
    }
  );

  it(
    'should open appropriate modal on re-clicking an interaction to ' +
      'customize it',
    async function () {
      await explorationEditorMainTab.setContent(
        await forms.toRichText('some content')
      );

      // NumberWithUnits input does not have any customization arguments.
      // Therefore, on re-clicking, a modal opens up informing the user that
      // this interaction does not have any customization options. To dismiss
      // this modal, user clicks 'Okay' implying that he/she has got the message.
      await explorationEditorMainTab.setInteraction('NumberWithUnits');
      var testInteractionButton = $('.e2e-test-interaction');
      await action.click('Test Interaction Button', testInteractionButton);
      var okayBtn = $('.e2e-test-close-no-customization-modal');
      await action.click("Close 'No customization modal' button", okayBtn);

      // Continue input has customization options. Therefore, on re-clicking, a
      // modal opens up containing the customization arguments for this input.
      // The user can dismiss this modal by clicking the 'Save Interaction'
      // button.
      await explorationEditorMainTab.deleteInteraction();
      await explorationEditorMainTab.setInteraction('Continue');
      await action.click('Test interaction button', testInteractionButton);
      var saveInteractionBtn = $('.e2e-test-save-interaction');
      await action.click('Save interaction button', saveInteractionBtn);

      // ImagClickInput can also be re-customized. Therefore, on re-clicking,
      // a modal opens displaying the image that was selected. The user expects
      // the right image to be displayed, and then saves the interaction.
      await explorationEditorMainTab.deleteInteraction();
      var addInteractionButton = $('.e2e-test-open-add-interaction-modal');
      await action.click('Add Interaction button', addInteractionButton);
      var imgClickInputTile = $('.e2e-test-interaction-tile-ImageClickInput');
      await action.click('Image Click Input Tile', imgClickInputTile);
      var uploadBtn = $('.e2e-test-upload-image');
      await workflow.uploadImage(uploadBtn, '../data/img.png', false);
      var useImageBtn = $('.e2e-test-use-image');
      await action.click('Use Image Button', useImageBtn);
      var svgElem = $('.e2e-test-svg');
      await svgElem.moveTo(0, 0);
      await svgElem.dragAndDrop({x: 1, y: 1});
      await action.click('Save Interaction Button', saveInteractionBtn);
      var closeAddResponseButton = $('.e2e-test-close-add-response-modal');
      await action.click('Close Add Response Button', closeAddResponseButton);
      await action.click('Test interaction button', testInteractionButton);
      await expect(svgElem).toBeDisplayed();
      await action.click('Save Interaction Button', saveInteractionBtn);
    }
  );

  it(
    'should correctly display contents, rule parameters, feedback' +
      ' instructions and newly created state',
    async function () {
      // Verify exploration's text content.
      await explorationEditorMainTab.setContent(
        await forms.toRichText('Happiness Checker')
      );
      await explorationEditorMainTab.expectContentToMatch(
        await forms.toRichText('Happiness Checker')
      );
      // Verify interaction's details.
      await explorationEditorMainTab.setInteraction(
        'TextInput',
        'How are you?',
        5
      );
      await explorationEditorMainTab.expectInteractionToMatch(
        'TextInput',
        'How are you?',
        5
      );
      // Verify rule parameter input by checking editor's response tab.
      // Create new state 'I am happy' for 'happy' rule.
      await explorationEditorMainTab.addResponse(
        'TextInput',
        await forms.toRichText('You must be happy!'),
        'I am happy',
        true,
        'FuzzyEquals',
        ['happy']
      );
      var responseEditor = await explorationEditorMainTab.getResponseEditor(0);
      await responseEditor.expectRuleToBe('TextInput', 'FuzzyEquals', [
        '[happy]',
      ]);
      responseEditor = await explorationEditorMainTab.getResponseEditor(0);
      await responseEditor.expectFeedbackInstructionToBe('You must be happy!');
      // Verify newly created state.
      await explorationEditorMainTab.moveToState('I am happy');
      await explorationEditorMainTab.expectCurrentStateToBe('I am happy');
      // Go back, create default response (try again) and verify response.
      await explorationEditorMainTab.moveToState('Introduction');
      await explorationEditorMainTab.addResponse(
        'TextInput',
        await forms.toRichText('You cannot be sad!'),
        '(try again)',
        false,
        'FuzzyEquals',
        ['sad']
      );
      responseEditor = await explorationEditorMainTab.getResponseEditor(1);
      await responseEditor.expectRuleToBe('TextInput', 'FuzzyEquals', [
        '[sad]',
      ]);
      await explorationEditorPage.saveChanges();
    }
  );

  it('should be able to edit title', async function () {
    await explorationEditorPage.navigateToSettingsTab();

    await explorationEditorSettingsTab.expectTitleToBe('');
    await explorationEditorSettingsTab.setTitle('title1');
    await explorationEditorPage.navigateToMainTab();
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.expectTitleToBe('title1');
  });

  it('should be able to edit goal', async function () {
    await explorationEditorPage.navigateToSettingsTab();

    await explorationEditorSettingsTab.expectObjectiveToBe('');
    await explorationEditorSettingsTab.setObjective('It is just a test.');
    await explorationEditorPage.navigateToMainTab();
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.expectObjectiveToBe(
      'It is just a test.'
    );
  });

  it('should show warnings when the length of goal < 15', async function () {
    await explorationEditorPage.navigateToSettingsTab();

    // Color grey when there is no warning, red when there is a warning.
    await explorationEditorSettingsTab.expectWarningsColorToBe(
      'rgba(115,115,115,1)'
    );
    await explorationEditorSettingsTab.setObjective('short goal');
    await explorationEditorSettingsTab.expectWarningsColorToBe(
      'rgba(169,68,66,1)'
    );
  });

  it('should be able to select category from the dropdown menu', async function () {
    await explorationEditorPage.navigateToSettingsTab();

    await explorationEditorSettingsTab.expectCategoryToBe('');
    await explorationEditorSettingsTab.setCategory('Biology');
    await explorationEditorPage.navigateToMainTab();
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.expectCategoryToBe('Biology');
  });

  it(
    'should be able to create new category which is not' +
      ' in the dropdown menu',
    async function () {
      await explorationEditorPage.navigateToSettingsTab();

      await explorationEditorSettingsTab.expectCategoryToBe('');
      await explorationEditorSettingsTab.setCategory('New');
      await explorationEditorPage.navigateToMainTab();
      await browser.refresh();
      await waitFor.invisibilityOfLoadingMessage(
        'Loading Message takes long to disappear'
      );
      await explorationEditorPage.navigateToSettingsTab();
      await explorationEditorSettingsTab.expectCategoryToBe('New');
    }
  );

  it('should be able to select language from the dropdown menu', async function () {
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.expectLanguageToBe('English');
    await explorationEditorSettingsTab.setLanguage('italiano (Italian)');
    await explorationEditorPage.navigateToMainTab();
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.expectLanguageToBe('italiano (Italian)');
  });

  it('should change the first card of the exploration', async function () {
    await explorationEditorMainTab.setStateName('card 1');
    await explorationEditorMainTab.setContent(
      await forms.toRichText('this is card 1'),
      true
    );
    await explorationEditorMainTab.setInteraction('Continue');
    var responseEditor =
      await explorationEditorMainTab.getResponseEditor('default');
    await responseEditor.setDestination('card 2', true, null);

    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.expectFirstStateToBe('card 1');
    await explorationEditorSettingsTab.setFirstState('card 2');
    await explorationEditorPage.navigateToMainTab();
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    await explorationEditorPage.navigateToSettingsTab();
    await explorationEditorSettingsTab.expectFirstStateToBe('card 2');
  });

  afterEach(async function () {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });
});
