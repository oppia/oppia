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
 * @fileoverview Page object for the exploration editor's main tab, for use in
 * WebdriverIO tests.
 */

var forms = require('./forms.js');
var general = require('./general.js');
var interactions = require('../../../extensions/interactions/webdriverio.js');
var ruleTemplates = require(
  '../../../extensions/interactions/rule_templates.json');
var waitFor = require('../webdriverio_utils/waitFor.js');
var action = require('./action.js');

var _NEW_STATE_OPTION = 'A New Card Called...';
var _CURRENT_STATE_OPTION = '(try again)';

var ExplorationEditorMainTab = function() {
  /*
   * Interactive elements
   */
  var addOrUpdateSolutionModal = $('.e2e-test-add-or-update-solution-modal');
  var addResponseDetails = $('.e2e-test-add-response-details');
  var addResponseHeader = $('.e2e-test-add-response-modal-header');
  var answerDescription = $('.e2e-test-answer-description');
  var answerDescriptionElement = $('.e2e-test-answer-description-fragment');
  var answerTab = $('.e2e-test-answer-tab');
  var ckEditorElement = $('.e2e-test-ck-editor');
  var defaultResponseTab = $('.e2e-test-default-response-tab');
  var deleteNodeLocator = '.e2e-test-delete-node';
  var editOutcomeDestAddExplorationId = $(
    '.e2e-test-add-refresher-exploration-id');
  var editOutcomeDestBubble = $('.e2e-test-dest-bubble');
  var editOutcomeDestForm = $('.e2e-test-dest-form');
  var editOutcomeDestDropdownOptions = $(
    '.e2e-test-destination-selector-dropdown');
  var editorWelcomeModal = $('.e2e-test-welcome-modal');
  var explanationTextAreaElement = $('.e2e-test-explanation-textarea');
  var explorationGraph = $('.e2e-test-exploration-graph');
  var feedbackBubble = $('.e2e-test-feedback-bubble');
  var feedbackEditor = $('.e2e-test-open-feedback-editor');
  var hintTextElement = $('.e2e-test-hint-text');
  var interaction = $('.e2e-test-interaction');
  var interactionEditor = $('.e2e-test-interaction-editor');
  var interactionHtmlElement = $('.e2e-test-interaction-html');
  var parameterElementButton = $('.e2e-test-main-html-select-selector');
  var interactionTab = function(tabId) {
    return $('.e2e-test-interaction-tab-' + tabId);
  };
  var interactionTile = function(interactionId) {
    return $(
      '.e2e-test-interaction-tile-' + interactionId);
  };
  var itemSelectionAnswerOptions = function(optionNum) {
    return $(
      `.e2e-test-html-item-select-option=${optionNum}`);
  };
  var multipleChoiceAnswerOptions = function(optionNum) {
    return $$(
      `.e2e-test-html-select-selector=${optionNum}`);
  };
  var nodeLabelLocator = '.e2e-test-node-label';
  var openOutcomeDestEditor = $('.e2e-test-open-outcome-dest-editor');
  var openOutcomeFeedBackEditor = $('.e2e-test-open-outcome-feedback-editor');
  var postTutorialPopover = $('.joyride .popover-content');
  var responseBody = function(responseNum) {
    return $(`.e2e-test-response-body-${responseNum}`);
  };
  var responseTabElement = $('.e2e-test-response-tab');
  var ruleDetails = $('.e2e-test-rule-details');
  var stateContentDisplay = $('.e2e-test-state-content-display');
  var stateEditButton = $('.e2e-test-edit-content-pencil-button');
  var stateEditorTag = $('.e2e-test-state-content-editor');
  var stateNameContainer = $('.e2e-test-state-name-container');
  var stateNameInput = $('.e2e-test-state-name-input');
  var stateNameText = $('.e2e-test-state-name-text');
  var stateNodeLabel = function(nodeElement) {
    return nodeElement.$(nodeLabelLocator);
  };
  var titleElement = $('.e2e-test-joyride-title');

  /*
   * Buttons
   */
  var addAnswerButton = $('.e2e-test-add-answer');
  var addHintButton = $('.e2e-test-oppia-add-hint-button');
  var addInteractionButton = $('.e2e-test-open-add-interaction-modal');
  var addNewResponseButton = $('.e2e-test-add-new-response');
  var addResponseButton = $('.e2e-test-open-add-response-modal');
  var addSolutionButton = $('.e2e-test-oppia-add-solution-button');
  var answerCorrectnessToggle = $('.e2e-test-editor-correctness-toggle');
  var cancelOutcomeDestButton = $('.e2e-test-cancel-outcome-dest');
  var checkpointSelectionCheckbox = $(
    '.e2e-test-checkpoint-selection-checkbox');
  var closeAddResponseButton = $('.e2e-test-close-add-response-modal');
  var confirmDeleteInteractionButton = $(
    '.e2e-test-confirm-delete-interaction');
  var confirmDeleteResponseButton = $('.e2e-test-confirm-delete-response');
  var confirmDeleteStateButton = $('.e2e-test-confirm-delete-state');
  var deleteAnswerButton = $('.e2e-test-delete-answer');
  var deleteInteractionButton = $('.e2e-test-delete-interaction');
  var deleteResponseButton = $('.e2e-test-delete-response');
  var dismissWelcomeModalButton = $('.e2e-test-dismiss-welcome-modal');
  var saveAnswerButton = $('.e2e-test-save-answer');
  var saveHintButton = $('.e2e-test-save-hint');
  var saveInteractionButton = $('.e2e-test-save-interaction');
  var saveOutcomeDestButton = $('.e2e-test-save-outcome-dest');
  var saveOutcomeFeedbackButton = $('.e2e-test-save-outcome-feedback');
  var saveStateContentButton = $('.e2e-test-save-state-content');
  var startTutorialButton = $('.e2e-test-start-tutorial');
  var submitSolutionButton = $('.e2e-test-submit-solution-button');

  /*
   * Symbols
   */
  var correctAnswerTickMark = $('.e2e-test-correct-tick-mark');


  /*
   * Actions
   */

  // ---- TUTORIAL ----

  this.exitTutorial = async function() {
    // Exit the welcome modal.
    await action.click(
      'Dismiss Welcome Modal Button', dismissWelcomeModalButton);
    await waitFor.invisibilityOf(
      editorWelcomeModal, 'Editor Welcome modal takes too long to disappear');

    // Otherwise, if the editor tutorial shows up, exit it.
    var skipButtons = await $$('.joyride-step__close');
    if (await skipButtons.length === 1) {
      await action.click('Skip button', skipButtons[0]);
    } else if (await skipButtons.length !== 0) {
      throw new Error(
        'Expected to find at most one \'exit tutorial\' button');
    }
  };

  this.finishTutorial = async function() {
    // Finish the tutorial.
    var finishTutorialButtons = await $$('.joyride-button=done');
    await waitFor.elementToBeClickable(
      finishTutorialButtons[0],
      'Finish Tutorial Stage button is not clickable');
    if (finishTutorialButtons.length === 1) {
      await action.click(
        'Finish Tutorial Stage button', finishTutorialButtons[0]);
    } else {
      throw new Error('There is more than 1 Finish button!');
    }
  };

  this.playTutorial = async function() {
    var tutorialTabHeadings = [
      'Creating in Oppia',
      'Content',
      'Interaction',
      'Responses',
      'Preview',
      'Save',
    ];
    for (const HEADING of tutorialTabHeadings) {
    // Use: await tutorialTabHeadings.forEach(async function(heading) {
      var tutorialTabHeadingElement = $(`.e2e-test-joyride-title=${HEADING}`);
      await waitFor.visibilityOf(
        tutorialTabHeadingElement, 'Tutorial: ' + HEADING + ' is not visible');
      // Progress to the next instruction in the tutorial.
      var nextTutorialStageButtons = await $$('.joyride-step__next-container');
      await waitFor.elementToBeClickable(
        nextTutorialStageButtons[0],
        'Next Tutorial Stage button is not clickable');
      if (nextTutorialStageButtons.length === 1) {
        await action.click(
          'Next Tutorial Stage button', nextTutorialStageButtons[0]);
        await waitFor.invisibilityOf(
          tutorialTabHeadingElement,
          'Tutorial stage takes too long to disappear');
      } else {
        throw new Error('There is more than one Next button!');
      }
    }
  };

  this.startTutorial = async function() {
    await waitFor.visibilityOf(
      editorWelcomeModal, 'Editor Welcome modal takes too long to appear');
    await action.click('Start Tutorial button', startTutorialButton);
    await waitFor.visibilityOf(
      titleElement, 'Tutorial modal takes too long to appear');
  };

  // ---- RESPONSE EDITOR ----

  /**
   * This clicks the "add new response" button and then selects the rule type
   * and enters its parameters, and closes the rule editor. Any number of rule
   * parameters may be specified after the ruleName.
   * Note that feedbackInstructions may be null (which means 'specify no
   * feedback'), and only represents a single feedback element.
   * @param {string} interactionId - Interaction type e.g. NumericInput
   * @param {object} feedbackInstructions - A RTE object containing feedback
   *                                        or null
   * @param {string} destStateName - New destination state or 'try again'/null
   * @param {boolean} createNewState - True if the rule creates a new state,
   *                                   else false.
   * @param {string} ruleName - The name of the rule, e.g. IsGreaterThan, must
   *                            match with interaction type.
   */
  this.addResponse = async function(
      interactionId, feedbackInstructions, destStateName,
      createNewState, ruleName) {
    await action.waitForAutosave();
    // Open the "Add Response" modal if it is not already open.
    await action.click('Response Editor Button', addResponseButton);
    await this.setResponse.apply(null, arguments);
  };

  this.setResponse = async function(
      interactionId, feedbackInstructions, destStateName,
      createNewState, ruleName) {
    // Set the rule description.
    var args = [addResponseDetails, interactionId, ruleName];
    for (var i = 5; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    await waitFor.visibilityOf(
      addResponseDetails, 'Add New Response details is not visible');
    await _selectRule(addResponseDetails, interactionId, ruleName);
    await _setRuleParameters.apply(null, args);
    // Open the feedback entry form if it is not already open.
    var isVisible = await feedbackEditor.isExisting();
    if (isVisible) {
      await action.click('Feedback editor', feedbackEditor);
    }

    if (feedbackInstructions) {
      // Set feedback contents.
      await _setOutcomeFeedback(feedbackInstructions);
    }
    // If the destination is being changed, open the corresponding editor.
    if (destStateName || destStateName !== '(try again)') {
    // Set destination contents.
      if (destStateName !== null) {
        await _setOutcomeDest(
          destStateName, createNewState, null);
      }
    }

    // Close new response modal.
    await action.click('New Response Button', addNewResponseButton);
    await waitFor.invisibilityOf(
      addNewResponseButton, 'Add New Response Modal is not closed');
  };

  // Rules are zero-indexed; 'default' denotes the default outcome.
  // 'pop' denotes the currently opened one.
  this.getResponseEditor = async function(responseNum) {
    var headerElem;
    if (responseNum !== 'pop') {
      if (responseNum === 'default') {
        headerElem = defaultResponseTab;
      } else {
        await waitFor.visibilityOf(
          responseTabElement, 'Response tab is not visible');
        var responseTab = await $$('.e2e-test-response-tab');
        headerElem = responseTab[responseNum];
      }

      var isVisible = await responseBody(responseNum).isExisting();
      if (!isVisible) {
        await action.click('Response Editor Header', headerElem);
      }
    } else {
      headerElem = addResponseHeader;
      expect(await headerElem.isDisplayed()).toBe(true);
    }
    return {
      /**
       * Check for correct rule parameters.
       * @param {string} [interactionId] - Interaction type.
       * @param {string} [ruleName] - Appropriate rule of provided interaction.
       * @param {string[]} [feedbackTextArray] - Exact feedback text to match.
       */
      expectRuleToBe: async function(
          interactionId, ruleName, feedbackTextArray) {
        var ruleDescription = _getRuleDescription(interactionId, ruleName);
        // Replace selectors with feedbackTextArray's elements.
        ruleDescription = _replaceRuleInputPlaceholders(
          ruleDescription, feedbackTextArray);
        ruleDescription += '...';
        // Adding "..." to end of string.
        expect(await action.getText('Answer Tab', answerTab)).toEqual(
          ruleDescription);
      },
      /**
       * Check for correct learner's feedback.
       * @param {string} [feedbackInstructionText] - Exact feedback to match.
       */
      expectFeedbackInstructionToBe: async function(feedbackInstructionsText) {
        // The first rule block's RTE.
        var feedbackRTE = responseBody(responseNum).$('.oppia-rte-editor');
        await waitFor.visibilityOf(
          feedbackRTE, 'Feedback Rich Text Editor not showing up.');
        expect(await action.getText('Feedback RTE', feedbackRTE)).toEqual(
          feedbackInstructionsText);
      },
      setFeedback: async function(richTextInstructions) {
        await action.waitForAutosave();
        // Begin editing feedback.
        await action.click(
          'openOutcomeFeedBackEditor', openOutcomeFeedBackEditor);

        // Set feedback contents.
        await _setOutcomeFeedback(richTextInstructions);

        // Save feedback.
        await action.click(
          'saveOutcomeFeedbackButton', saveOutcomeFeedbackButton);
      },
      // This saves the rule after the destination is selected.
      //  - destinationName: The name of the state to move to, or null to stay
      //    on the same state.
      //  - createNewState: whether the destination state is new and must be
      //    created at this point.
      setDestination: async function(
          destinationName, createNewState, refresherExplorationId) {
        // Begin editing destination.
        await action.click(
          'Outcome Destination Editor Open Button', openOutcomeDestEditor);

        // Set destination contents.
        await _setOutcomeDest(
          destinationName, createNewState, refresherExplorationId);

        // Save destination.
        await action.click(
          'Outcome Destination Editor Save Button', saveOutcomeDestButton);
      },
      markAsCorrect: async function() {
        await action.click(
          'Answer Correctness Toggle', answerCorrectnessToggle);
      },
      // The current state name must be at the front of the list.
      expectAvailableDestinationsToBe: async function(stateNames) {
        // Begin editing destination.
        await action.click(
          'Outcome Destination Editor Open Button', openOutcomeDestEditor);

        var expectedOptionTexts = [_CURRENT_STATE_OPTION].concat(
          stateNames.slice(1));

        // Create new option always at the end of the list.
        expectedOptionTexts.push(_NEW_STATE_OPTION);

        var actualOptionTexts = await editOutcomeDestBubble.$$(
          '<option>').map(async function(optionElem) {
          return await action.getText('Option element', optionElem);
        });
        expect(actualOptionTexts).toEqual(expectedOptionTexts);

        // Cancel editing the destination.
        await action.click('Cancel Outcome Button', cancelOutcomeDestButton);
      },
      addRule: async function(interactionId, ruleName) {
        // Additional parameters may be provided after ruleName.

        // Add the rule.
        await action.click('Add Answer Button', addAnswerButton);

        // Set the rule description.
        var args = [ruleDetails, interactionId, ruleName];
        for (var i = 2; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        await _selectRule(ruleDetails, interactionId, ruleName);
        await _setRuleParameters.apply(null, args);

        // Save the new rule.
        await action.click('Save Answer Button', saveAnswerButton);
      },
      deleteResponse: async function() {
        await action.click('Delete Response Button', deleteResponseButton);
        await action.click(
          'Confirm Delete Response Button', confirmDeleteResponseButton);
      },
      expectCannotSetFeedback: async function() {
        expect(await openOutcomeFeedBackEditor.isExisting()).toBeFalsy();
      },
      expectCannotSetDestination: async function() {
        var destEditorElem = openOutcomeDestEditor;
        expect(await destEditorElem.isExisting()).toBeFalsy();
      },
      expectCannotAddRule: async function() {
        expect(await addAnswerButton.isExisting()).toBeFalsy();
      },
      expectCannotDeleteRule: async function(ruleNum) {
        expect(await deleteAnswerButton.isExisting()).toBeFalsy();
      },
      expectCannotDeleteResponse: async function() {
        expect(await deleteResponseButton.isExisting()).toBeFalsy();
      }
    };
  };

  this.expectCannotAddResponse = async function() {
    expect(await addResponseButton.isExisting()).toBeFalsy();
  };

  this.expectTickMarkIsDisplayed = async function() {
    await waitFor.visibilityOf(
      correctAnswerTickMark, 'Correct answer tick mark not visible');
  };

  var _setOutcomeDest = async function(
      destName, createNewDest, refresherExplorationId) {
    expect(destName === null && createNewDest).toBe(false);

    var targetOption = null;
    if (createNewDest) {
      targetOption = _NEW_STATE_OPTION;
    } else if (destName === null || destName === '(try again)') {
      targetOption = _CURRENT_STATE_OPTION;
    } else {
      targetOption = destName;
    }

    await editOutcomeDestDropdownOptions.selectByVisibleText(targetOption);

    // 'End' is one of the key names present in Webdriver protocol,
    // and so if we try to pass 'End' in setValue, webdriverio will
    // press the 'End' key present in keyboard instead of typing 'End'
    // as a string. Hence, to type 'End' as a string, we need to pass it
    // as an array of string.
    if (destName === 'End') {
      destName = ['E', 'n', 'd'];
    }
    if (createNewDest) {
      var editOutcomeDestStateInput = editOutcomeDestForm.$(
        '.e2e-test-add-state-input');
      await action.setValue(
        'Edit Outcome State Input', editOutcomeDestStateInput, destName);
    } else if (refresherExplorationId) {
      await action.setValue(
        'Edit Outcome Add Exploration Id',
        editOutcomeDestAddExplorationId, refresherExplorationId);
    }
  };

  // ---- CONTENT ----

  // 'richTextInstructions' is a function that is sent a RichTextEditor which it
  // can then use to alter the state content, for example by calling
  // .appendBoldText(...).
  this.setContent = async function(richTextInstructions, expectFadeIn = false) {
    // Wait for browser to time out the popover, which is 4000 ms.
    await waitFor.invisibilityOf(
      postTutorialPopover, 'Post-tutorial popover does not disappear.');
    await action.waitForAutosave();
    if (expectFadeIn) {
      // We use browser.pause() here because waiting for the fade-in to complete
      // doesn't work for some reason. Also, since the fade-in is a client-side
      // animation, it should always happen in the same amount of time.
      // eslint-disable-next-line oppia/e2e-practices
      await browser.pause(5000);
    }
    await action.click('stateEditButton', stateEditButton);
    await waitFor.visibilityOf(
      stateEditorTag, 'State editor tag not showing up');
    var richTextEditor = await forms.RichTextEditor(stateEditorTag);
    await richTextEditor.clear();
    await richTextInstructions(richTextEditor);
    await action.click('Save State Content Button', saveStateContentButton);
    await waitFor.invisibilityOf(
      saveStateContentButton,
      'State content editor takes too long to disappear');
  };

  // This receives a function richTextInstructions used to verify the display of
  // the state's content visible when the content editor is closed. The
  // richTextInstructions will be supplied with a handler of the form
  // forms.RichTextChecker and can then perform checks such as
  //   handler.readBoldText('bold')
  //   handler.readRteComponent('Collapsible', 'outer', 'inner')
  // These would verify that the content consists of the word 'bold' in bold
  // followed by a Collapsible component with the given arguments, and nothing
  // else. Note that this fails for collapsibles and tabs since it is not
  // possible to click on them to view their contents, as clicks instead open
  // the rich text editor.
  this.expectContentToMatch = async function(richTextInstructions) {
    await forms.expectRichText(stateContentDisplay).toMatch(
      richTextInstructions);
  };

  // ---- HINT ----

  this.addHint = async function(hint) {
    await action.waitForAutosave();
    await action.click('Add Hint', addHintButton);
    var addHintModal = $('.e2e-test-hint-modal=Add Hint');
    await waitFor.visibilityOf(
      addHintModal, 'Add hint modal takes too long to appear');
    var hintTextButton = await hintTextElement.$$('<p>');
    var lastHintElement = hintTextButton.length - 1;
    await action.click('Hint Text Button', hintTextButton[lastHintElement]);
    var CKEditor = await ckEditorElement.$$(
      '.oppia-rte-resizer')[0];
    await action.setValue('Text CKEditor', CKEditor, hint);
    await action.click('Save Hint Button', saveHintButton);
    await waitFor.invisibilityOf(
      addHintModal, 'Add Hint modal takes too long to close');
  };

  this.addSolution = async function(interactionId, solution) {
    await action.waitForAutosave();
    await action.click('Add Solution', addSolutionButton);
    await waitFor.visibilityOf(
      addOrUpdateSolutionModal,
      'Add/Update Solution modal takes to long to appear');
    var interaction = await interactions.getInteraction(interactionId);
    await interaction.submitAnswer(
      interactionHtmlElement, solution.correctAnswer);
    var explanationTextArea = await explanationTextAreaElement.$$('<p>')[0];
    await action.click('Explanation Text Area', explanationTextArea);
    var CKEditor = await ckEditorElement.$$(
      '.oppia-rte-resizer')[0];
    await action.setValue(
      'Text CKEditor', CKEditor, solution.explanation);
    await action.click('Submit Solution Button', submitSolutionButton);
    await waitFor.invisibilityOf(
      addOrUpdateSolutionModal,
      'Add/Update Solution modal takes too long to close');
  };

  // ---- INTERACTIONS ----

  this.deleteInteraction = async function() {
    await action.waitForAutosave();
    await action.click('Delete interaction button', deleteInteractionButton);

    // Click through the "are you sure?" warning.
    await action.click(
      'Confirm Delete Interaction button', confirmDeleteInteractionButton);

    await waitFor.invisibilityOf(
      confirmDeleteInteractionButton,
      'Delete Interaction modal takes too long to close');
  };

  // This function should be used as the standard way to specify interactions
  // for most purposes. Additional arguments may be sent to this function,
  // and they will be passed on to the relevant interaction editor.
  this.setInteraction = async function(interactionId) {
    await action.waitForAutosave();
    await createNewInteraction(interactionId);
    await customizeInteraction.apply(null, arguments);
    await closeAddResponseModal();
    await waitFor.invisibilityOf(
      addResponseHeader, 'Add Response modal takes too long to close');
    await waitFor.visibilityOf(
      interaction, 'interaction takes too long to appear');
  };

  this.setInteractionWithoutCloseAddResponse = async function(interactionId) {
    await action.waitForAutosave();
    await createNewInteraction(interactionId);
    await customizeInteraction.apply(null, arguments);
  };

  this.enableCheckpointForCurrentState = async function() {
    await action.click('Checkpoint checkbox', checkpointSelectionCheckbox);
  };

  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  var createNewInteraction = async function(interactionId) {
    await waitFor.invisibilityOf(
      deleteInteractionButton,
      'Please delete interaction before creating a new one');

    await action.click('Add Interaction button', addInteractionButton);

    var INTERACTION_ID_TO_TAB_NAME = {
      Continue: 'commonly-used',
      EndExploration: 'commonly-used',
      ImageClickInput: 'commonly-used',
      ItemSelectionInput: 'commonly-used',
      MultipleChoiceInput: 'commonly-used',
      NumericInput: 'commonly-used',
      TextInput: 'commonly-used',
      FractionInput: 'math',
      GraphInput: 'math',
      SetInput: 'math',
      AlgebraicExpressionInput: 'math',
      MathEquationInput: 'math',
      NumericExpressionInput: 'math',
      NumberWithUnits: 'math',
      RatioExpressionInput: 'math',
      CodeRepl: 'programming',
      PencilCodeEditor: 'programming',
      MusicNotesInput: 'music',
      InteractiveMap: 'geography'
    };

    var interactionTabButton =
      interactionTab(INTERACTION_ID_TO_TAB_NAME[interactionId]);
    await action.click('Interaction Tab', interactionTabButton);

    var targetTile = interactionTile(interactionId);
    await waitFor.visibilityOf(
      targetTile,
      'Interaction tile ' + interactionId + ' takes too long to be visible'
    );
    await action.click('Interaction tile ' + interactionId, targetTile);
  };

  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  var customizeInteraction = async function(interactionId) {
    if (arguments.length > 1) {
      var customizationArgs = [interactionEditor];
      for (var i = 1; i < arguments.length; i++) {
        customizationArgs.push(arguments[i]);
      }
      await interactions
        .getInteraction(interactionId).customizeInteraction
        .apply(null, customizationArgs);
    }

    // The save interaction button doesn't appear for interactions having no
    // options to customize.
    var result = await saveInteractionButton.isExisting();
    if (result) {
      await action.click('Save Interaction Button', saveInteractionButton);
    }
    await waitFor.invisibilityOf(
      saveInteractionButton,
      'Customize Interaction modal taking too long to close');
  };

  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  var closeAddResponseModal = async function() {
    // If the "Add Response" modal opens, close it.
    var isVisible = await addResponseHeader.isExisting();
    if (isVisible) {
      await action.click('Close Add Response Button', closeAddResponseButton);
    }
  };

  // Likewise this can receive additional arguments.
  // Note that this refers to the interaction displayed in the editor tab (as
  // opposed to the preview tab, which uses the corresponding function in
  // ExplorationPlayerPage.js).
  this.expectInteractionToMatch = async function(interactionId) {
    // Convert additional arguments to an array to send on.
    var args = [interaction];
    for (var i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    await interactions.getInteraction(interactionId).
      expectInteractionDetailsToMatch.apply(null, args);
  };

  this.expectCannotDeleteInteraction = async function() {
    expect(await deleteInteractionButton.isExisting()).toBeFalsy();
  };

  var _setOutcomeFeedback = async function(richTextInstructions) {
    await waitFor.visibilityOf(
      feedbackBubble, 'Feedback bubble takes too long to be visible.');
    var feedbackEditor = await forms.RichTextEditor(
      feedbackBubble);
    await feedbackEditor.clear();
    await richTextInstructions(feedbackEditor);
  };

  // ---- RULES ----
  var _getRuleDescription = function(interactionId, ruleName) {
    if (ruleTemplates.hasOwnProperty(interactionId)) {
      if (ruleTemplates[interactionId].hasOwnProperty(ruleName)) {
        return ruleTemplates[interactionId][ruleName].description;
      } else {
        throw new Error('Unknown rule: ' + ruleName);
      }
    } else {
      throw new Error('Could not find rules for interaction: ' + interactionId);
    }
  };

  // Parses the relevant ruleDescription string, and returns an Array containing
  // the types of the rule input parameters.
  var _getRuleParameterTypes = function(interactionId, ruleName) {
    var ruleDescription = _getRuleDescription(interactionId, ruleName);
    // An example of rule description:
    // is equal to {{a|NonnegativeInt}} and {{b|NonnegativeInt}}.
    // (from NumericInput).
    var parameterTypes = [];
    var re = /\|(.*?)\}/ig;
    // Matched result = Array[|NonnegativeInt}, |NonnegativeInt}].
    var angularSelectors = ruleDescription.match(re);
    // Slicing first and last letter.
    if (angularSelectors) {
      for (var index = 0; index < angularSelectors.length; index++) {
        parameterTypes.push(angularSelectors[index].toString().slice(1, -1));
      }
    }
    // Expected sample output = Array[NonnegativeInt, NonnegativeInt].
    return parameterTypes;
  };

  // This function sets the parameter values for the given rule.
  // Note: The parameter values should be specified as additional arguments
  // after the ruleName. For example, the call
  //   _selectRuleParameters(ruleElement, 'NumericInput', 'Equals', 24)
  // will result in a rule that checks whether the learner's answer equals 24.
  var _setRuleParameters = async function(
      ruleElement, interactionId, ruleName) {
    var parameterValues = [];
    for (var i = 3; i < arguments.length; i++) {
      parameterValues.push(arguments[i]);
    }
    var parameterTypes = _getRuleParameterTypes(interactionId, ruleName);
    expect(parameterValues.length).toEqual(parameterTypes.length);
    await waitFor.visibilityOf(
      answerDescriptionElement,
      'Answer description fragement is not visible');
    var answerDescriptionFragment = await $$(
      '.e2e-test-answer-description-fragment');
    for (var i = 0; i < parameterValues.length; i++) {
      var parameterElement = answerDescriptionFragment[i * 2 + 1];
      var parameterEditor = await forms.getEditor(
        parameterTypes[i])(parameterElement);

      if (interactionId === 'MultipleChoiceInput') {
        // This is a special case as it uses a dropdown to set a NonnegativeInt.
        await action.click(
          'Parameter Element Button', parameterElementButton);

        var multipleChoiceAnswerOption =
          await multipleChoiceAnswerOptions(parameterValues[i])[0];

        await action.click(
          'Multiple Choice Answer Option: ' + i,
          multipleChoiceAnswerOption);
      } else if (interactionId === 'ItemSelectionInput') {
        var answerArray = Array.from(parameterValues[i]);
        for (var j = 0; j < answerArray.length; j++) {
          var itemSelectionAnswerOption =
            itemSelectionAnswerOptions(answerArray[j]);
          await action.click(
            'Item Selection Answer Option: ' + j,
            itemSelectionAnswerOption);
        }
      } else {
        await parameterEditor.setValue(parameterValues[i]);
      }
    }
  };

  /**
   * Parse for rule input placeholders in ruleDescription and replace them.
   * @param {string} [ruleDescription] - Interaction type.
   * @param {string[]} [providedText] - Feedback text to replace with.
   */
  var _replaceRuleInputPlaceholders = function(ruleDescription, providedText) {
    // An example of rule description:
    // "is equal to {{a|NonnegativeInt}} and {{b|NonnegativeInt}}"
    // (from NumericInput).
    var re = /{{[a-z]+[\|](.*?)}}/ig;
    // Matched result = Array[{{a|NonnegativeInt}}}, {{b|NonnegativeInt}}].
    var placeholders = ruleDescription.match(re);
    var textArray = [];
    // Return as-is if string does not contain placeholders.
    if (placeholders) {
      // Replacing placeholders in ruleDescription with given text.
      for (var index = 0; index < placeholders.length; index++) {
        var placeholderElement = placeholders[index];
        if (providedText[0] === '...') {
          ruleDescription = ruleDescription.replace(placeholderElement, '...');
        } else {
          if (providedText.length !== placeholders.length) {
            throw new Error(
              '# of feedback text(' + textArray.length +
              ') is expected to match # of placeholders(' +
              (placeholders.length) + ')');
          }
          ruleDescription = ruleDescription.replace(
            placeholderElement, providedText[index].toString());
        }
      }
    }
    return ruleDescription;
  };


  // This function selects a rule from the dropdown,
  // but does not set any of its input parameters.
  var _selectRule = async function(ruleElem, interactionId, ruleName) {
    var ruleDescription = _getRuleDescription(interactionId, ruleName);
    // Replace selectors with "...".
    ruleDescription = _replaceRuleInputPlaceholders(ruleDescription, ['...']);
    var ruleDescriptionInDropdown = ruleDescription;
    await action.click('Answer Description', answerDescription);
    var ruleDropdownElement = await $$(
      `.e2e-test-rule-type-selector=${ruleDescriptionInDropdown}`)[0];
    await action.click('Rule Dropdown Element', ruleDropdownElement);
  };

  // ---- STATE GRAPH ----

  this.deleteState = async function(stateName) {
    await action.waitForAutosave();
    await general.scrollToTop();
    var nodeElement = await explorationGraph.$(
      `.e2e-test-node*=${stateName}`);
    await waitFor.visibilityOf(
      nodeElement,
      'State ' + stateName + ' takes too long to appear or does not exist');
    var deleteNode = await nodeElement.$(deleteNodeLocator);
    await action.click('Delete Node', deleteNode);
    await action.click('Confirm Delete State Button', confirmDeleteStateButton);
    await waitFor.invisibilityOf(
      confirmDeleteStateButton, 'Deleting state takes too long');
  };

  // For this to work, there must be more than one name, otherwise the
  // exploration overview will be disabled.
  this.expectStateNamesToBe = async function(names) {
    var stateNodes = explorationGraph.$$('.e2e-test-node');
    var stateNames = await stateNodes.map(async function(stateElement) {
      return await action.getText(
        'State node label', stateNodeLabel(stateElement));
    });
    expect(stateNames.sort()).toEqual(names.sort());
  };

  // NOTE: if the state is not visible in the state graph this function will
  // fail.
  this.moveToState = async function(targetName) {
    await action.waitForAutosave();
    await general.scrollToTop();
    var stateNodes = explorationGraph.$$('.e2e-test-node');
    var listOfNames = await stateNodes.map(async function(stateElement) {
      return await action.getText(
        'State node label', stateNodeLabel(stateElement));
    });
    var matched = false;
    for (var i = 0; i < listOfNames.length; i++) {
      if (listOfNames[i] === targetName) {
        await action.click('State Node: ' + i, stateNodes[i]);
        matched = true;
        // Wait to re-load the entire state editor.
      }
    }
    if (!matched) {
      throw new Error(
        'State ' + targetName + ' not found by editorMainTab.moveToState.');
    }
    await waitFor.visibilityOf(
      stateNameContainer, 'State Name Container takes too long to appear');
    var errorMessage = (
      'Current state name is:' +
      await stateNameContainer.getAttribute('textContent') +
      'instead of expected ' + targetName);
    await waitFor.textToBePresentInElement(
      stateNameContainer, targetName, errorMessage);
  };

  this.setStateName = async function(name) {
    await waitFor.invisibilityOf(
      postTutorialPopover, 'Post-tutorial popover takes too long to disappear');
    await action.waitForAutosave();
    await action.click('State Name Container', stateNameContainer);
    await action.clear('State Name input', stateNameInput);
    await action.setValue('State Name input', stateNameInput, name);

    var stateNameSubmitButton = stateNameContainer.$(
      '.e2e-test-state-name-submit');
    await action.click('State Name Submit button', stateNameSubmitButton);

    // We need to use browser.pause() in order to wait for the state name
    // container to disappear as webdriverio checks for its presence even before
    // it disappears.
    // eslint-disable-next-line oppia/e2e-practices
    await browser.pause(2000);
    await waitFor.visibilityOf(
      stateNameContainer, 'State Name Container takes too long to appear');
    await waitFor.textToBePresentInElement(
      stateNameContainer, name,
      'Current state name is:' + await stateNameContainer.getAttribute(
        'textContent') + 'instead of expected ' + name);
  };

  this.expectCurrentStateToBe = async function(name) {
    await waitFor.visibilityOf(
      stateNameContainer, 'State Name Container taking too long to show up');
    await waitFor.textToBePresentInElement(
      stateNameContainer, name,
      'Expecting current state ' + await stateNameText.getText() +
      ' to be ' + name);
    await waitFor.visibilityOf(
      stateNameText, 'State name container taking too long to appear');
    expect(await stateNameText.getText()).toMatch(name);
  };
};

exports.ExplorationEditorMainTab = ExplorationEditorMainTab;
