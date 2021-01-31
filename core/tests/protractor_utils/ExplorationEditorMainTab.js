// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * Protractor tests.
 */

var forms = require('./forms.js');
var general = require('./general.js');
var interactions = require('../../../extensions/interactions/protractor.js');
var ruleTemplates = require(
  '../../../extensions/interactions/rule_templates.json');
var waitFor = require('../protractor_utils/waitFor.js');
var action = require('./action.js');

var _NEW_STATE_OPTION = 'A New Card Called...';
var _CURRENT_STATE_OPTION = '(try again)';

var ExplorationEditorMainTab = function() {
  /*
   * Interactive elements
   */
  var addResponseDetails = element(
    by.css('.protractor-test-add-response-details'));
  var addResponseHeader = element(
    by.css('.protractor-test-add-response-modal-header'));
  var multipleChoiceAnswerOptions = function(optionNum) {
    return element(
      by.cssContainingText(
        '.protractor-test-html-multiple-select-option', optionNum));
  };
  var itemSelectionAnswerOptions = function(optionNum) {
    return element(
      by.cssContainingText(
        '.protractor-test-html-item-select-option', optionNum));
  };
  var defaultResponseTab = element(
    by.css('.protractor-test-default-response-tab'));
  var editorWelcomeModal = element(by.css('.protractor-test-welcome-modal'));
  var editOutcomeDestBubble = element(by.css('.protractor-test-dest-bubble'));
  var editOutcomeDestStateInput = editOutcomeDestBubble.element(
    by.css('.protractor-test-add-state-input'));
  var editOutcomeDestAddExplorationId = element(
    by.css('.protractor-test-add-refresher-exploration-id'));
  var editOutcomeDestDropdownOptions = function(targetOption) {
    return element.all(by.cssContainingText('option', targetOption)).first();
  };
  var feedbackBubble = element(by.css('.protractor-test-feedback-bubble'));
  var feedbackEditor = element(by.css('.protractor-test-open-feedback-editor'));
  var interaction = element(by.css('.protractor-test-interaction'));
  var interactionEditor = element(
    by.css('.protractor-test-interaction-editor'));
  var explorationGraph = element(by.css('.protractor-test-exploration-graph'));
  var stateNodes = explorationGraph.all(by.css('.protractor-test-node'));
  var stateNodeLabel = function(nodeElement) {
    return nodeElement.element(by.css('.protractor-test-node-label'));
  };
  var interactionTab = function(tabId) {
    return element(by.css('.protractor-test-interaction-tab-' + tabId));
  };
  var interactionTile = function(interactionId) {
    return element(by.css(
      '.protractor-test-interaction-tile-' + interactionId));
  };
  var openOutcomeDestEditor = element(
    by.css('.protractor-test-open-outcome-dest-editor'));
  var openOutcomeFeedBackEditor = element(
    by.css('.protractor-test-open-outcome-feedback-editor'));
  var postTutorialPopover = element(by.css('.popover-content'));
  var responseBody = function(responseNum) {
    return element(by.css('.protractor-test-response-body-' + responseNum));
  };
  var responseTab = element.all(by.css('.protractor-test-response-tab'));
  var stateContentDisplay = element(
    by.css('.protractor-test-state-content-display'));
  var stateEditButton = element(
    by.css('.protractor-test-edit-content-pencil-button'));
  var stateNameContainer = element(
    by.css('.protractor-test-state-name-container'));
  var stateNameInput = element(
    by.css('.protractor-test-state-name-input'));

  /*
   * Buttons
   */
  var addAnswerButton = element(by.css('.protractor-test-add-answer'));
  var addHintButton = element(by.css('.protractor-test-oppia-add-hint-button'));
  var addNewResponseButton = element(
    by.css('.protractor-test-add-new-response'));
  var addResponseButton = element(
    by.css('.protractor-test-open-add-response-modal'));
  var addSolutionButton = element(
    by.css('.protractor-test-oppia-add-solution-button'));
  var addInteractionButton = element(
    by.css('.protractor-test-open-add-interaction-modal'));
  var cancelOutcomeDestButton = element(
    by.css('.protractor-test-cancel-outcome-dest'));
  var closeAddResponseButton = element(
    by.css('.protractor-test-close-add-response-modal'));
  var confirmDeleteInteractionButton = element(
    by.css('.protractor-test-confirm-delete-interaction'));
  var confirmDeleteResponseButton = element(
    by.css('.protractor-test-confirm-delete-response'));
  var confirmDeleteStateButton = element(
    by.css('.protractor-test-confirm-delete-state'));
  var deleteAnswerButton = element(
    by.css('.protractor-test-delete-answer'));
  var deleteInteractionButton = element(
    by.css('.protractor-test-delete-interaction'));
  var deleteResponseButton = element(
    by.css('.protractor-test-delete-response'));
  var dismissWelcomeModalButton = element(
    by.css('.protractor-test-dismiss-welcome-modal'));
  var saveAnswerButton = element(
    by.css('.protractor-test-save-answer'));
  var saveHintButton = element(by.css('.protractor-test-save-hint'));
  var saveInteractionButton = element(
    by.css('.protractor-test-save-interaction'));
  var saveOutcomeDestButton = element(
    by.css('.protractor-test-save-outcome-dest'));
  var saveOutcomeFeedbackButton = element(
    by.css('.protractor-test-save-outcome-feedback'));
  var saveStateContentButton = element(
    by.css('.protractor-test-save-state-content'));
  var stateNameSubmitButton = stateNameContainer.element(
    by.css('.protractor-test-state-name-submit'));
  var answerCorrectnessToggle = element(
    by.css('.protractor-test-editor-correctness-toggle'));

  /*
   * Symbols
   */
  var correctAnswerTickMark = element(
    by.css('.protractor-test-correct-tick-mark'));

  /*
   * Actions
   */

  // ---- TUTORIAL ----

  this.exitTutorial = async function() {
    // If the editor welcome modal shows up, exit it.
    var isVisible = await editorWelcomeModal.isPresent();

    if (isVisible) {
      await action.click(
        'Dismiss Welcome Modal Button', dismissWelcomeModalButton);
    }

    await waitFor.invisibilityOf(
      editorWelcomeModal, 'Editor Welcome modal takes too long to disappear');

    // Otherwise, if the editor tutorial shows up, exit it.
    var buttons = element.all(by.css('.skipBtn'));
    if (await buttons.count() === 1) {
      await action.click('Skip button', buttons.get(0));
    } else if (await buttons.count() !== 0) {
      throw new Error(
        'Expected to find at most one \'exit tutorial\' button');
    }
  };

  this.finishTutorial = async function() {
    // Finish the tutorial.
    var finishTutorialButtons = element.all(by.buttonText('Finish'));
    await waitFor.elementToBeClickable(
      finishTutorialButtons.first(),
      'Finish Tutorial Stage button is not clickable');
    if (await finishTutorialButtons.count() === 1) {
      await action.click(
        'Finish Tutorial Stage button', finishTutorialButtons.get(0));
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
    for (const heading of tutorialTabHeadings) {
    // Use: await tutorialTabHeadings.forEach(async function(heading) {
      var tutorialTabHeadingElement = element(by.cssContainingText(
        '.popover-title', heading));
      await waitFor.visibilityOf(
        tutorialTabHeadingElement, 'Tutorial: ' + heading + 'is not visible');
      // Progress to the next instruction in the tutorial.
      var nextTutorialStageButtons = element.all(by.css('.nextBtn'));
      await waitFor.elementToBeClickable(
        nextTutorialStageButtons.first(),
        'Next Tutorial Stage button is not clickable');
      if (await nextTutorialStageButtons.count() === 1) {
        await action.click(
          'Next Tutorial Stage button', nextTutorialStageButtons.get(0));
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
    var startTutorialButton = element(
      by.css('.protractor-test-start-tutorial'));
    await action.click('Start Tutorial button', startTutorialButton);
    await waitFor.visibilityOf(
      element(by.css('.ng-joyride-title')),
      'Tutorial modal takes too long to appear');
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
    await waitFor.elementToBeClickable(
      addResponseButton, 'Response Editor button is not clickable');
    await addResponseButton.click();
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
    expect(await addResponseDetails.isDisplayed()).toBe(true);
    await _selectRule(addResponseDetails, interactionId, ruleName);
    await _setRuleParameters.apply(null, args);
    // Open the feedback entry form if it is not already open.
    var isVisible = await feedbackEditor.isPresent();
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
    expect(await addNewResponseButton.isDisplayed()).toBe(true);
    await addNewResponseButton.click();
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
        await waitFor.visibilityOf(await responseTab.first());
        headerElem = await responseTab.get(
          responseNum);
      }

      var isVisible = await responseBody(responseNum).isPresent();
      if (!isVisible) {
        expect(await headerElem.isDisplayed()).toBe(true);
        await waitFor.elementToBeClickable(
          headerElem, 'Response Editor header is not clickable');
        await headerElem.click();
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
        var answerTab = element(by.css('.protractor-test-answer-tab'));
        expect(await answerTab.getText()).toEqual(ruleDescription);
      },
      /**
       * Check for correct learner's feedback.
       * @param {string} [feedbackInstructionText] - Exact feedback to match.
       */
      expectFeedbackInstructionToBe: async function(feedbackInstructionsText) {
        // The first rule block's RTE.
        var feedbackRTE = responseBody(responseNum).element(
          by.className('oppia-rte-editor'));
        await waitFor.visibilityOf(
          feedbackRTE, 'Feedback Rich Text Editor not showing up.');
        expect(await feedbackRTE.getText()).toEqual(
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
        await openOutcomeDestEditor.click();

        var expectedOptionTexts = [_CURRENT_STATE_OPTION].concat(
          stateNames.slice(1));

        // Create new option always at the end of the list.
        expectedOptionTexts.push(_NEW_STATE_OPTION);

        var actualOptionTexts = await editOutcomeDestBubble.all(
          by.tagName('option')
        ).map(async function(optionElem) {
          return await optionElem.getText();
        });
        expect(actualOptionTexts).toEqual(expectedOptionTexts);

        // Cancel editing the destination.
        await cancelOutcomeDestButton.click();
      },
      addRule: async function(interactionId, ruleName) {
        // Additional parameters may be provided after ruleName.

        // Add the rule.
        await addAnswerButton.click();

        // Set the rule description.
        var ruleDetails = element(by.css('.protractor-test-rule-details'));
        var args = [ruleDetails, interactionId, ruleName];
        for (var i = 2; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        await _selectRule(ruleDetails, interactionId, ruleName);
        await _setRuleParameters.apply(null, args);

        // Save the new rule.
        await saveAnswerButton.click();
      },
      deleteResponse: async function() {
        await deleteResponseButton.click();
        await confirmDeleteResponseButton.click();
      },
      expectCannotSetFeedback: async function() {
        expect(await openOutcomeFeedBackEditor.isPresent()).toBeFalsy();
      },
      expectCannotSetDestination: async function() {
        var destEditorElem = openOutcomeDestEditor;
        expect(await destEditorElem.isPresent()).toBeFalsy();
      },
      expectCannotAddRule: async function() {
        expect(await addAnswerButton.isPresent()).toBeFalsy();
      },
      expectCannotDeleteRule: async function(ruleNum) {
        expect(await deleteAnswerButton.isPresent()).toBeFalsy();
      },
      expectCannotDeleteResponse: async function() {
        expect(await deleteResponseButton.isPresent()).toBeFalsy();
      }
    };
  };

  this.expectCannotAddResponse = async function() {
    expect(await addResponseButton.isPresent()).toBeFalsy();
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

    var outcomeDestOption = await editOutcomeDestDropdownOptions(targetOption);
    await action.click('Outcome Destination Option', outcomeDestOption);

    if (createNewDest) {
      await editOutcomeDestStateInput.sendKeys(destName);
    } else if (refresherExplorationId) {
      await editOutcomeDestAddExplorationId.sendKeys(refresherExplorationId);
    }
  };

  // ---- CONTENT ----

  // 'richTextInstructions' is a function that is sent a RichTextEditor which it
  // can then use to alter the state content, for example by calling
  // .appendBoldText(...).
  this.setContent = async function(richTextInstructions) {
    this.exitTutorial();
    // Wait for browser to time out the popover, which is 4000 ms.
    await waitFor.invisibilityOf(
      postTutorialPopover, 'Post-tutorial popover does not disappear.');
    await action.waitForAutosave();
    await waitFor.elementToBeClickable(stateEditButton);
    await action.click('stateEditButton', stateEditButton);
    var stateEditorTag = element(by.tagName('state-content-editor'));
    await waitFor.visibilityOf(
      stateEditorTag, 'State editor tag not showing up');
    var stateContentEditor = stateEditorTag.element(
      by.css('.protractor-test-state-content-editor'));
    await waitFor.visibilityOf(
      stateContentEditor,
      'stateContentEditor taking too long to appear to set content');
    var richTextEditor = await forms.RichTextEditor(stateContentEditor);
    await richTextEditor.clear();
    await richTextInstructions(richTextEditor);
    expect(await saveStateContentButton.isDisplayed()).toBe(true);
    await waitFor.elementToBeClickable(saveStateContentButton);
    await saveStateContentButton.click();
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
    var addHintModal = element(
      by.cssContainingText('.protractor-test-hint-modal', 'Add Hint'));
    await waitFor.visibilityOf(
      addHintModal, 'Add hint modal takes too long to appear');
    await element(by.css('.protractor-test-hint-text')).all(by.tagName('p'))
      .last().click();
    await browser.switchTo().activeElement().sendKeys(hint);

    await waitFor.elementToBeClickable(
      saveHintButton,
      'Save Hint button takes too long to be clickable');
    await saveHintButton.click();
    await waitFor.invisibilityOf(
      addHintModal, 'Add Hint modal takes too long to close');
  };

  this.addSolution = async function(interactionId, solution) {
    await action.waitForAutosave();
    await action.click('Add Solution', addSolutionButton);
    var addOrUpdateSolutionModal = element(
      by.css('.protractor-test-add-or-update-solution-modal'));
    await waitFor.visibilityOf(
      addOrUpdateSolutionModal,
      'Add/Update Solution modal takes to long to appear');
    var interaction = await interactions.getInteraction(interactionId);
    await interaction.submitAnswer(
      element(by.css('.protractor-test-interaction-html')),
      solution.correctAnswer);
    await element(by.css('.protractor-test-explanation-textarea'))
      .all(by.tagName('p')).first().click();
    await browser.switchTo().activeElement().sendKeys(solution.explanation);
    var submitSolutionButton = element(
      by.css('.protractor-test-submit-solution-button'));
    await waitFor.elementToBeClickable(
      submitSolutionButton,
      'Submit Solution button takes too long to be clickable');
    await submitSolutionButton.click();
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
  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  var createNewInteraction = async function(interactionId) {
    await waitFor.invisibilityOf(
      deleteInteractionButton,
      'Please delete interaction before creating a new one');

    await action.click('Add Interaction button', addInteractionButton);

    var INTERACTION_ID_TO_TAB_NAME = {
      Continue: 'General',
      EndExploration: 'General',
      ImageClickInput: 'General',
      ItemSelectionInput: 'General',
      MultipleChoiceInput: 'General',
      TextInput: 'General',
      FractionInput: 'Math',
      GraphInput: 'Math',
      LogicProof: 'Math',
      NumericInput: 'Math',
      SetInput: 'Math',
      AlgebraicExpressionInput: 'Math',
      MathEquationInput: 'Math',
      NumericExpressionInput: 'Math',
      NumberWithUnits: 'Math',
      RatioExpressionInput: 'Math',
      CodeRepl: 'Programming',
      PencilCodeEditor: 'Programming',
      MusicNotesInput: 'Music',
      InteractiveMap: 'Geography'
    };

    expect(
      await interactionTab(INTERACTION_ID_TO_TAB_NAME[interactionId])
        .isDisplayed()).toBe(true);
    await interactionTab(INTERACTION_ID_TO_TAB_NAME[interactionId]).click();

    var targetTile = interactionTile(interactionId);
    await waitFor.visibilityOf(
      targetTile,
      'Interaction tile ' + interactionId + ' takes too long to be visible'
    );
    await waitFor.elementToBeClickable(
      targetTile,
      'Interaction tile ' + interactionId + ' takes too long to be clickable'
    );
    expect(await targetTile.isDisplayed()).toBe(true);
    await targetTile.click();
  };

  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  var customizeInteraction = async function(interactionId) {
    if (arguments.length > 1) {
      var elem = interactionEditor;
      var customizationArgs = [elem];
      for (var i = 1; i < arguments.length; i++) {
        customizationArgs.push(arguments[i]);
      }
      await interactions
        .getInteraction(interactionId).customizeInteraction
        .apply(null, customizationArgs);
    }

    // The save interaction button doesn't appear for interactions having no
    // options to customize.
    var result = await saveInteractionButton.isPresent();
    if (result) {
      await saveInteractionButton.click();
    }
    await waitFor.invisibilityOf(
      saveInteractionButton,
      'Customize Interaction modal taking too long to close');
  };

  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  var closeAddResponseModal = async function() {
    // If the "Add Response" modal opens, close it.
    var isVisible = await addResponseHeader.isPresent();
    if (isVisible) {
      expect(await closeAddResponseButton.isDisplayed()).toBe(true);
      await closeAddResponseButton.click();
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
    expect(await deleteInteractionButton.isPresent()).toBeFalsy();
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
      angularSelectors.forEach(function(elem) {
        parameterTypes.push(elem.toString().slice(1, -1));
      });
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
    var answerDescriptionFragment = element.all(
      by.css('.protractor-test-answer-description-fragment'));
    for (var i = 0; i < parameterValues.length; i++) {
      var parameterElement = await answerDescriptionFragment.get(i * 2 + 1);
      var parameterEditor = await forms.getEditor(
        parameterTypes[i])(parameterElement);

      if (interactionId === 'MultipleChoiceInput') {
      // This is a special case as it uses a dropdown to set a NonnegativeInt.
        await parameterElement.element(by.tagName('button')).click();
        await multipleChoiceAnswerOptions(parameterValues[i])
          .click();
      } else if (interactionId === 'ItemSelectionInput') {
        var answerArray = Array.from(parameterValues[i]);
        for (var j = 0; j < answerArray.length; j++) {
          await itemSelectionAnswerOptions(answerArray[j]).click();
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
      placeholders.forEach(function(placeholderElement, index) {
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
      });
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
    var answerDescription = element(
      by.css('.protractor-test-answer-description'));
    await action.click('Answer Description', answerDescription);
    var ruleDropdownElement = await element.all(by.cssContainingText(
      '.select2-results__option', ruleDescriptionInDropdown)).first();
    await action.click('Rule Dropdown Element', ruleDropdownElement);
  };

  // ---- STATE GRAPH ----

  this.deleteState = async function(stateName) {
    await action.waitForAutosave();
    await general.scrollToTop();
    var nodeElement = await explorationGraph.all(
      by.cssContainingText('.protractor-test-node', stateName)).first();
    await waitFor.visibilityOf(
      nodeElement,
      'State ' + stateName + ' takes too long to appear or does not exist');
    await nodeElement.element(by.css('.protractor-test-delete-node')).click();
    expect(await confirmDeleteStateButton.isDisplayed());
    await confirmDeleteStateButton.click();
    await waitFor.invisibilityOf(
      confirmDeleteStateButton, 'Deleting state takes too long');
  };

  // For this to work, there must be more than one name, otherwise the
  // exploration overview will be disabled.
  this.expectStateNamesToBe = async function(names) {
    var stateNames = await stateNodes.map(async function(stateElement) {
      return await stateNodeLabel(stateElement).getText();
    });
    expect(stateNames.sort()).toEqual(names.sort());
  };

  // NOTE: if the state is not visible in the state graph this function will
  // fail.
  this.moveToState = async function(targetName) {
    await action.waitForAutosave();
    await general.scrollToTop();
    var listOfNames = await stateNodes.map(async function(stateElement) {
      return await stateNodeLabel(stateElement).getText();
    });
    var matched = false;
    for (var i = 0; i < listOfNames.length; i++) {
      if (listOfNames[i] === targetName) {
        await stateNodes.get(i).click();
        matched = true;
        // Wait to re-load the entire state editor.
      }
    }
    if (!matched) {
      throw new Error(
        'State ' + targetName + ' not found by editorMainTab.moveToState.');
    }

    var errorMessage = (
      'Current state name is:' +
      await stateNameContainer.getAttribute('textContent') +
      'instead of expected ' + targetName);
    await waitFor.textToBePresentInElement(
      stateNameContainer, targetName, errorMessage);
  };

  this.setStateName = async function(name) {
    this.exitTutorial();
    await waitFor.invisibilityOf(
      postTutorialPopover, 'Post-tutorial popover takes too long to disappear');
    await action.waitForAutosave();
    await action.click('State Name Container', stateNameContainer);
    await action.clear('State Name input', stateNameInput);
    await action.sendKeys('State Name input', stateNameInput, name);

    await action.click('State Name Submit button', stateNameSubmitButton);

    // Wait for state name container to completely disappear
    // and re-appear again.
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
      'Expecting current state ' + await stateNameContainer.getAttribute(
        'textContent') + ' to be ' + name);
    expect(await stateNameContainer.getAttribute('textContent')).toMatch(name);
  };
};

exports.ExplorationEditorMainTab = ExplorationEditorMainTab;
