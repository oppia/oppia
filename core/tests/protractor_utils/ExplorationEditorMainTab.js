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
var until = protractor.ExpectedConditions;

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
  var multipleChoiceAnswerOptions = function (optionNum) {
    return element(
      by.cssContainingText('.protractor-test-html-select-option', optionNum));
  };
  var neutralElement = element.all(by.css('.protractor-test-neutral-element'))
    .first();
  var defaultResponseTab = element(
    by.css('.protractor-test-default-response-tab'));
  var editorWelcomeModal = element.all(
    by.css('.protractor-test-welcome-modal'));
  var editOutcomeDestBubble = element(
    by.css('.protractor-test-dest-bubble'));
  var editOutcomeDestStateInput = editOutcomeDestBubble.element(
    by.css('.protractor-test-add-state-input'));
  var editOutcomeDestAddExplorationId = element(
    by.css('.protractor-test-add-refresher-exploration-id'));
  var editOutcomeDestDropdownOptions = function(targetOption) {
    return element.all(by.cssContainingText('option', targetOption)).first();
  };
  var editParamChanges = element(
    by.css('.protractor-test-state-edit-param-changes'));
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
  var responseBody = function(responseNum) {
    return element(by.css('.protractor-test-response-body-' + responseNum));
  };
  var responseTab = element.all(by.css('.protractor-test-response-tab'));
  var ruleBlock = element.all(by.css('.protractor-test-rule-block'));
  var stateEditContent = element(
    by.css('.protractor-test-edit-content'));
  var stateContentDisplay = element(
    by.css('.protractor-test-state-content-display'));
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
  var addParamButon = element(by.css('.protractor-test-add-param-button'));
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
  var saveHintEditButton = element(
    by.css('.protractor-test-save-hint-edit'));
  var saveInteractionButton = element(
    by.css('.protractor-test-save-interaction'));
  var saveOutcomeDestButton = element(
    by.css('.protractor-test-save-outcome-dest'));
  var saveOutcomeFeedbackButton = element(
    by.css('.protractor-test-save-outcome-feedback'));
  var saveParamChangesButton = element(
    by.css('.protractor-test-save-param-changes-button'));
  var saveStateContentButton = element(
    by.css('.protractor-test-save-state-content'));
  var stateNameSubmitButton = stateNameContainer.element(
    by.css('.protractor-test-state-name-submit'));

  /*
   * Actions
   */

  // TUTORIAL

  this.exitTutorial = function() {
    // If the editor welcome modal shows up, exit it.
    editorWelcomeModal.then(function(modals) {
      if (modals.length === 1) {
        browser.wait(until.elementToBeClickable(dismissWelcomeModalButton),
          5000, 'Tutorial modal taking too long to appear');
        dismissWelcomeModalButton.click();
      } else if (modals.length !== 0) {
        throw 'Expected to find at most one \'welcome modal\'';
      }
    });

    browser.wait(until.invisibilityOf(editorWelcomeModal), 5000);

    // Otherwise, if the editor tutorial shows up, exit it.
    element.all(by.css('.skipBtn')).then(function(buttons) {
      if (buttons.length === 1) {
        buttons[0].click();
      } else if (buttons.length !== 0) {
        throw 'Expected to find at most one \'exit tutorial\' button';
      }
    });
  };

  this.finishTutorial = function() {
    // Finish the tutorial.
    var finishTutorialButton = element.all(by.buttonText('Finish'));
    browser.wait(until.elementToBeClickable(finishTutorialButton.first()), 5000,
      'Finish Tutorial Stage button is not clickable');
    finishTutorialButton.then(function(buttons) {
      if (buttons.length === 1) {
        buttons[0].click();
      }
    });
  };

  this.playTutorial = function() {
    var tutorialTabHeadings = [
      'Creating in Oppia',
      'Content',
      'Interaction',
      'Responses',
      'Preview',
      'Save',
    ];
    tutorialTabHeadings.forEach(function(heading) {
      var tutorialTabHeadingElement = element(by.cssContainingText(
        '.popover-title', heading));
      browser.wait(until.visibilityOf(tutorialTabHeadingElement), 5000,
        'Tutorial: ' + heading + 'is not visible');
      // Progress to the next instruction in the tutorial.
      var nextTutorialStageButton = element.all(by.css('.nextBtn'));
      browser.wait(
        until.elementToBeClickable(nextTutorialStageButton.first()), 5000,
        'Next Tutorial Stage button is not clickable');
      nextTutorialStageButton.then(function(buttons) {
        if (buttons.length === 1) {
          buttons[0].click();
        }
      });
    });
  };

  this.startTutorial = function() {
    editorWelcomeModal.isPresent().then(function() {
      element(by.css('.protractor-test-start-tutorial')).click().then(
        function() {
          browser.wait(until.visibilityOf(element(by.css('.ng-joyride-title'))),
            5000, 'Tutorial modal taking too long to appear');
        });
    });
  };

  // RESPONSE EDITOR

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
  this.addResponse = function(
      interactionId, feedbackInstructions, destStateName,
      createNewState, ruleName) {
    expect(addResponseButton.isDisplayed()).toEqual(true);
    // Open the "Add Response" modal if it is not already open.
    addResponseButton.click();

    // Set the rule description.
    var args = [addResponseDetails, interactionId, ruleName];
    for (var i = 5; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    expect(addResponseDetails.isDisplayed()).toBe(true);
    _selectRule(addResponseDetails, interactionId, ruleName);
    _setRuleParameters.apply(null, args);

    // Open the feedback entry form if it is not already open.
    feedbackEditor.isPresent().then(function(isVisible) {
      if (isVisible) {
        feedbackEditor.click();
      }
    });

    if (feedbackInstructions) {
      // Set feedback contents.
      _setOutcomeFeedback(feedbackInstructions);
    }
    // If the destination is being changed, open the corresponding editor.
    if (destStateName || destStateName !== '(try again)') {
    // Set destination contents.
      _setOutcomeDest(
        destStateName, createNewState, null);
    }

    // Close new response modal.
    expect(addNewResponseButton.isDisplayed()).toBe(true);
    addNewResponseButton.click();
    browser.wait(until.invisibilityOf(addNewResponseButton), 5000,
      'Add New Response Modal is not closed');
  };

  // Rules are zero-indexed; 'default' denotes the default outcome.
  this.getResponseEditor = function(responseNum) {
    var headerElem;
    if (responseNum === 'default') {
      headerElem = defaultResponseTab;
    } else {
      headerElem = responseTab.get(
        responseNum);
    }

    responseBody(responseNum).isPresent().then(function(isVisible) {
      if (!isVisible) {
        expect(headerElem.isDisplayed()).toBe(true);
        browser.wait(until.elementToBeClickable(headerElem), 5000,
          'Response Editor header is not clickable')
          .then(function(isClickable) {
            if (isClickable) {
              headerElem.click();
            }
          });
      }
    });

    return {
      /**
       * Check for correct rule parameters.
       * @param {string} [interactionId] - Interaction type.
       * @param {string} [ruleName] - Appropriate rule of provided interaction.
       * @param {string[]} [feedbackTextArray] - Exact feedback text to match.
       */
      expectRuleToBe: function(interactionId, ruleName, feedbackTextArray) {
        var ruleDescription = _getRuleDescription(interactionId, ruleName);
        // Replace selectors with feedbackTextArray's elements.
        ruleDescription = _replaceRuleInputPlaceholders(
          ruleDescription, feedbackTextArray);
        ruleDescription += '...';
        // Adding "..." to end of string.
        var answerTab = element(by.css('.protractor-test-answer-tab'));
        expect(answerTab.getText()).toEqual(ruleDescription);
      },
      /**
       * Check for correct learner's feedback.
       * @param {string} [feedbackInstructionText] - Exact feedback to match.
       */
      expectFeedbackInstructionToBe: function(feedbackInstructionsText) {
        // The first rule block's RTE.
        var feedbackRTE = responseBody(responseNum).
          element(by.className('oppia-rte-editor'));
        expect(feedbackRTE.getText()).toEqual(
          feedbackInstructionsText);
      },
      setFeedback: function(richTextInstructions) {
      // Begin editing feedback.
        openOutcomeFeedBackEditor.click();

        // Set feedback contents.
        _setOutcomeFeedback(richTextInstructions);

        // Save feedback.
        saveOutcomeFeedbackButton.click();
      },
      // This saves the rule after the destination is selected.
      //  - destinationName: The name of the state to move to, or null to stay
      //    on the same state.
      //  - createNewState: whether the destination state is new and must be
      //    created at this point.
      setDestination: function(
          destinationName, createNewState, refresherExplorationId) {
      // Begin editing destination.
        expect(openOutcomeDestEditor.isDisplayed()).toBe(true);
        openOutcomeDestEditor.click();

        // Set destination contents.
        _setOutcomeDest(
          destinationName, createNewState, refresherExplorationId);

        // Save destination.
        expect(saveOutcomeDestButton.isDisplayed()).toBe(true);
        saveOutcomeDestButton.click();
      },
      // The current state name must be at the front of the list.
      expectAvailableDestinationsToBe: function(stateNames) {
      // Begin editing destination.
        openOutcomeDestEditor.click();

        var expectedOptionTexts = [_CURRENT_STATE_OPTION].concat(
          stateNames.slice(1));

        // Create new option always at the end of the list.
        expectedOptionTexts.push(_NEW_STATE_OPTION);

        editOutcomeDestBubble.all(by.tagName('option')).map(
          function(optionElem) {
            return optionElem.getText();
          }).then(function(actualOptionTexts) {
          expect(actualOptionTexts).toEqual(expectedOptionTexts);
        });

        // Cancel editing the destination.
        cancelOutcomeDestButton.click();
      },
      addRule: function(interactionId, ruleName) {
      // Additional parameters may be provided after ruleName.

      // Add the rule.
        addAnswerButton.click();

        // Set the rule description.
        var ruleDetails = element(by.css('.protractor-test-rule-details'));
        var args = [ruleDetails, interactionId, ruleName];
        for (var i = 2; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        _selectRule(ruleDetails, interactionId, ruleName);
        _setRuleParameters.apply(null, args);

        // Save the new rule.
        saveAnswerButton.click();
      },
      deleteResponse: function() {
        deleteResponseButton.click();
        confirmDeleteResponseButton.click();
      },
      expectCannotSetFeedback: function() {
        expect(openOutcomeFeedBackEditor.isPresent()).toBeFalsy();
      },
      expectCannotSetDestination: function() {
        var destEditorElem = openOutcomeDestEditor;
        expect(destEditorElem.isPresent()).toBeFalsy();
      },
      expectCannotAddRule: function() {
        expect(addAnswerButton.isPresent()).toBeFalsy();
      },
      expectCannotDeleteRule: function(ruleNum) {
        ruleElem = ruleBlock.get(ruleNum);
        expect(deleteAnswerButton.isPresent()).toBeFalsy();
      },
      expectCannotDeleteResponse: function() {
        expect(deleteResponseButton.isPresent()).toBeFalsy();
      }
    };
  };

  this.expectCannotAddResponse = function() {
    expect(addResponseButton.isPresent()).toBeFalsy();
  };

  var _setOutcomeDest = function(
      destName, createNewDest, refresherExplorationId) {
    expect(destName === null && createNewDest).toBe(false);

    if (createNewDest) {
      targetOption = _NEW_STATE_OPTION;
    } else if (destName === null | destName === '(try again)') {
      targetOption = _CURRENT_STATE_OPTION;
    } else {
      targetOption = destName;
    }
    browser.wait(until.presenceOf(editOutcomeDestDropdownOptions(targetOption))
      , 5000, 'editOutcomeDestDropdownOptions taking too long to appear');
    expect(editOutcomeDestDropdownOptions(targetOption).isDisplayed())
      .toBe(true);
    editOutcomeDestDropdownOptions(targetOption).click();

    if (createNewDest) {
      editOutcomeDestStateInput.sendKeys(destName);
    } else if (refresherExplorationId) {
      editOutcomeDestAddExplorationId.sendKeys(refresherExplorationId);
    }
  };

  // CONTENT

  // 'richTextInstructions' is a function that is sent a RichTextEditor which it
  // can then use to alter the state content, for example by calling
  // .appendBoldText(...).
  this.setContent = function(richTextInstructions) {
  // Wait for browser to completely load the rich text editor.
    browser.wait(until.elementToBeClickable(stateEditContent), 10000,
      'stateEditContent taking too long to appear to set content')
      .then(function(isClickable) {
        if (isClickable) {
          stateEditContent.click();
          var stateContentEditor = element(
            by.css('.protractor-test-state-content-editor'));
          browser.wait(until.visibilityOf(stateContentEditor), 10000,
            'stateContentEditor taking too long to appear to set content');
          var richTextEditor = forms.RichTextEditor(stateContentEditor);
          richTextEditor.clear();
          richTextInstructions(richTextEditor);
          expect(saveStateContentButton.isDisplayed()).toBe(true);
          saveStateContentButton.click();
          browser.wait(until.invisibilityOf(saveStateContentButton), 5000);
        }
      });
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
  this.expectContentToMatch = function(richTextInstructions) {
    forms.expectRichText(stateContentDisplay).toMatch(richTextInstructions);
  };

  // HINT

  this.addHint = function(hint) {
    addHintButton.click();
    var addHintModal = element(
      by.cssContainingText('.protractor-test-hint-modal', 'Add Hint'));
    browser.wait(until.visibilityOf(addHintModal), 5000,
      'Add hint modal takes too long to appear');
    element(by.css('.protractor-test-hint-text')).all(by.tagName('p'))
      .last().click();
    browser.switchTo().activeElement().sendKeys(hint);
    browser.wait(until.elementToBeClickable(saveHintButton), 5000,
      'Save Hint button takes too long to appear');
    saveHintButton.click();
    browser.wait(until.invisibilityOf(addHintModal), 5000,
      'Add Hint modal takes too long to close');
  };

  // Hints are zero-indexed.
  this.getHintEditor = function(hintNum) {
    var confirmDeteletHintButton = element(
      by.css('.protractor-test-confirm-delete-hint'));
    var headerElem = element.all(by.css('.protractor-test-hint-tab')).get(
      hintNum);
    var deleteHintIcon = headerElem.element(
      by.css('.protractor-test-delete-response'));
    var hintBodyElem = element(
      by.css('.protractor-test-hint-body-' + hintNum));
    hintBodyElem.isPresent().then(function(isVisible) {
      if (!isVisible) {
        headerElem.click();
      }
    });
    return {
      setHint: function(hint) {
        var editHintIcon = element(
          by.css('.protractor-test-open-hint-editor'));
        editHintIcon.click();
        browser.switchTo().activeElement().clear();
        browser.switchTo().activeElement().sendKeys(hint);
        browser.wait(until.elementToBeClickable(saveHintEditButton), 5000,
          'Save Hint button takes too long to appear');
        saveHintEditButton.click();
        browser.wait(until.visibilityOf(editHintIcon), 5000,
          'Add Hint modal takes too long to close');
      },
      deleteHint: function() {
        deleteHintIcon.click();
        confirmDeteletHintButton.click();
      },
      expectCannotDeleteHint: function() {
        expect(deleteHintIcon.isPresent()).toBeFalsy();
      }
    };
  };

  this.addSolution = function(interactionId, solution) {
    addSolutionButton.click();
    var addOrUpdateSolutionModal = element(
      by.css('.protractor-test-add-or-update-solution-modal'));
    browser.wait(until.visibilityOf(addOrUpdateSolutionModal), 5000,
      'Add/Update Solution modal takes to long to appear');
    interactions.getInteraction(interactionId).submitAnswer(
      element(by.css('.protractor-test-interaction-html')),
      solution.correctAnswer);
    element(by.css('.protractor-test-explanation-textarea'))
      .all(by.tagName('p')).first().click();
    browser.switchTo().activeElement().sendKeys(solution.explanation);
    var submitSolutionButton = element(
      by.css('.protractor-test-submit-solution-button'));
    browser.wait(until.elementToBeClickable(submitSolutionButton), 5000,
      'Submit Solution button takes too long to appear');
    submitSolutionButton.click();
    browser.wait(until.invisibilityOf(addOrUpdateSolutionModal), 5000,
      'Add/Update Solution modal takes too long to close');
  };

  // INTERACTIONS

  this.deleteInteraction = function() {
    browser.wait(until.elementToBeClickable(deleteInteractionButton), 5000,
      'Delete Interaction button is not clickable').then(
      function(isClickable) {
        if (isClickable) {
          deleteInteractionButton.click();
          // Click through the "are you sure?" warning.
          browser.wait(until.elementToBeClickable(
            confirmDeleteInteractionButton), 5000,
          'Confirm Delete Interaction button takes too long to appear')
            .then(function(){
              confirmDeleteInteractionButton.click();
            });
        }
      });
    browser.wait(until.invisibilityOf(confirmDeleteInteractionButton), 5000,
      'Delete Interaction modal takes too long to close');
  };

  // This function should be used as the standard way to specify interactions
  // for most purposes. Additional arguments may be sent to this function,
  // and they will be passed on to the relevant interaction editor.
  this.setInteraction = function(interactionId) {
    createNewInteraction(interactionId);
    customizeInteraction.apply(null, arguments);
    closeAddResponseModal();
    browser.wait(until.invisibilityOf(addResponseHeader), 5000);
  };

  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  var createNewInteraction = function(interactionId) {
    browser.wait(until.invisibilityOf(deleteInteractionButton), 5000,
      'Please delete interaction before creating a new one').then(
      function(deleteButtonNotVisible) {
        if (deleteButtonNotVisible) {
          browser.wait(until.elementToBeClickable(addInteractionButton), 5000,
            'Add Interaction button takes too long to appear');
          expect(addInteractionButton.isDisplayed()).toBe(true);
          addInteractionButton.click();
        }
      });

    var INTERACTION_ID_TO_TAB_NAME = {
      Continue: 'General',
      EndExploration: 'General',
      ImageClickInput: 'General',
      MultipleChoiceInput: 'General',
      TextInput: 'General',
      FractionInput: 'Math',
      GraphInput: 'Math',
      LogicProof: 'Math',
      NumericInput: 'Math',
      NumberWithUnits: 'Math',
      SetInput: 'Math',
      CodeRepl: 'Programming',
      MusicNotesInput: 'Music',
      InteractiveMap: 'Geography'
    };

    expect(interactionTab(INTERACTION_ID_TO_TAB_NAME[interactionId])
      .isDisplayed()).toBe(true);
    interactionTab(INTERACTION_ID_TO_TAB_NAME[interactionId]).click();
    expect(interactionTile(interactionId).isDisplayed()).toBe(true);
    interactionTile(interactionId).click();
  };

  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  var customizeInteraction = function(interactionId) {
    if (arguments.length > 1) {
      var elem = interactionEditor;
      var customizationArgs = [elem];
      for (var i = 1; i < arguments.length; i++) {
        customizationArgs.push(arguments[i]);
      }
      interactions.getInteraction(interactionId).customizeInteraction.apply(
        null, customizationArgs);
    }

    // The save interaction button doesn't appear for interactions having no
    // options to customize.
    saveInteractionButton.isPresent().then(function(result) {
      if (result) {
        saveInteractionButton.click();
      }
    });
    browser.wait(until.invisibilityOf(saveInteractionButton), 5000,
      'Customize Interaction modal taking too long to close');
  };

  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  var closeAddResponseModal = function() {
    // If the "Add Response" modal opens, close it.
    addResponseHeader.isPresent().then(function(isVisible) {
      if (isVisible) {
        expect(closeAddResponseButton.isDisplayed()).toBe(true);
        closeAddResponseButton.click();
      }
    });
  };

  // Likewise this can receive additional arguments.
  // Note that this refers to the interaction displayed in the editor tab (as
  // opposed to the preview tab, which uses the corresponding function in
  // ExplorationPlayerPage.js).
  this.expectInteractionToMatch = function(interactionId) {
  // Convert additional arguments to an array to send on.
    var args = [interaction];
    for (var i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    interactions.getInteraction(interactionId).
      expectInteractionDetailsToMatch.apply(null, args);
  };

  this.expectCannotDeleteInteraction = function() {
    expect((deleteInteractionButton).isPresent()).toBeFalsy();
  };

  var _setOutcomeFeedback = function(richTextInstructions) {
    var feedbackEditor = forms.RichTextEditor(
      feedbackBubble);
    feedbackEditor.clear();
    richTextInstructions(feedbackEditor);
  };

  // PARAMETERS

  // This function adds a multiple-choice parameter change, creating the
  // parameter if necessary.
  this.addMultipleChoiceParameterChange = function(paramName, paramValues) {
    browser.wait(until.elementToBeClickable(editParamChanges), 5000,
      'Edit Param Changes is not clickable').then(function(isClickable) {
      if (isClickable) {
        editParamChanges.click().then(function() {
          browser.wait(until.elementToBeClickable(addParamButon), 5000,
            'Add Param button is not clickable').then(function(isClickable) {
            if (isClickable) {
              addParamButon.click();
            }
          });
        });
      }
    });

    var editorRowElem = element.all(by.css(
      '.protractor-test-param-changes-list')).last();

    forms.AutocompleteDropdownEditor(editorRowElem).setValue(paramName);

    var editorRowOption = editorRowElem.element(
      by.cssContainingText('option', 'to one of'));
    browser.wait(until.elementToBeClickable(editorRowOption), 5000,
      'Param Options are not clickable').then(function(isClickable) {
      if (isClickable) {
        editorRowOption.click();
        paramValues.forEach(function(paramValue) {
          var item = editorRowElem.all(by.tagName('input')).last();
          item.clear();
          item.sendKeys(paramValue);
        });
      }
    });

    browser.wait(until.elementToBeClickable(saveParamChangesButton), 5000,
      'Save Param Changesbutton is not clickable')
      .then(function(isClickable) {
        if (isClickable) {
          saveParamChangesButton.click();
        }
      });

    browser.wait(until.invisibilityOf(saveParamChangesButton), 5000);
  };

  // This function adds a parameter change, creating the parameter if necessary.
  this.addParameterChange = function(paramName, paramValue) {
    browser.wait(until.elementToBeClickable(editParamChanges), 5000,
      'Edit Param Changes is not clickable').then(function(isClickable) {
      if (isClickable) {
        editParamChanges.click();
        browser.wait(until.elementToBeClickable(addParamButon), 5000,
          'Add Param button is not clickable').then(function(isClickable) {
          if (isClickable) {
            addParamButon.click();
          }
        });
      }
    });

    var editorRowElem = element.all(by.css(
      '.protractor-test-param-changes-list')).last();

    forms.AutocompleteDropdownEditor(editorRowElem).setValue(paramName);

    var item = editorRowElem.all(by.tagName('input')).last();
    browser.wait(until.elementToBeClickable(item), 5000,
      'Param Options are not clickable').then(function(isClickable) {
      if (isClickable) {
        /* Setting parameter value is difficult via css since input fields
    are dynamically generated. We isolate it as the last input in the
    current parameter changes UI. */
        item.click();
        item.clear();
        item.sendKeys(paramValue);
      }
    });

    browser.wait(until.elementToBeClickable(saveParamChangesButton), 5000,
      'Save Param Changesbutton is not clickable')
      .then(function(isClickable) {
        if (isClickable) {
          saveParamChangesButton.click();
        }
      });

    browser.wait(until.invisibilityOf(saveParamChangesButton), 5000);
  };

  // RULES
  this.selectRuleInAddResponseModal = function(interactionId, ruleName) {
    _selectRule(addResponseDetails, interactionId, ruleName);
  };

  var _getRuleDescription = function(interactionId, ruleName) {
    if (ruleTemplates.hasOwnProperty(interactionId)) {
      if (ruleTemplates[interactionId].hasOwnProperty(ruleName)) {
        return ruleTemplates[interactionId][ruleName].description;
      } else {
        throw Error('Unknown rule: ' + ruleName);
      }
    } else {
      throw Error('Could not find rules for interaction: ' + interactionId);
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
    // Matched result = Array[|NonnegativeInt}, |NonnegativeInt}]
    var angularSelectors = ruleDescription.match(re);
    // Slicing first and last letter.
    if (angularSelectors) {
      angularSelectors.forEach(function(elem) {
        parameterTypes.push(elem.toString().slice(1, -1));
      });
    }
    // Expected sample output = Array[NonnegativeInt, NonnegativeInt]
    return parameterTypes;
  };

  // This function sets the parameter values for the given rule.
  // Note: The parameter values should be specified as additional arguments
  // after the ruleName. For example, the call
  //   _selectRuleParameters(ruleElement, 'NumericInput', 'Equals', 24)
  // will result in a rule that checks whether the learner's answer equals 24.
  var _setRuleParameters = function(ruleElement, interactionId, ruleName) {
    var parameterValues = [];
    for (var i = 3; i < arguments.length; i++) {
      parameterValues.push(arguments[i]);
    }
    var parameterTypes = _getRuleParameterTypes(interactionId, ruleName);
    expect(parameterValues.length).toEqual(parameterTypes.length);
    var answerDescriptionFragment = element.all(
      by.css('.protractor-test-answer-description-fragment'));
    for (var i = 0; i < parameterValues.length; i++) {
      var parameterElement = answerDescriptionFragment.get(i * 2 + 1);
      var parameterEditor = forms.getEditor(
        parameterTypes[i])(parameterElement);

      if (interactionId === 'MultipleChoiceInput') {
      // This is a special case as it uses a dropdown to set a NonnegativeInt.
        parameterElement.element(by.tagName('button')).click();
        multipleChoiceAnswerOptions(parameterValues[i])
          .click();
      } else {
        parameterEditor.setValue(parameterValues[i]);
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
    // Matched result = Array[{{a|NonnegativeInt}}}, {{b|NonnegativeInt}}]
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
            throw Error('# of feedback text(' + textArray.length +
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
  var _selectRule = function(ruleElem, interactionId, ruleName) {
    var ruleDescription = _getRuleDescription(interactionId, ruleName);
    // Replace selectors with "...".
    ruleDescription = _replaceRuleInputPlaceholders(ruleDescription, ['...']);
    var ruleDescriptionInDropdown = ruleDescription;
    var answerDescription = element(
      by.css('.protractor-test-answer-description'));
    expect(answerDescription.isDisplayed()).toBe(true);
    answerDescription.click();
    var ruleDropdownElement = element.all(by.cssContainingText(
      '.select2-results__option', ruleDescriptionInDropdown)).first();
    browser.wait(until.visibilityOf(ruleDropdownElement), 5000,
      'Rule dropdown element taking too long to appear');
    ruleDropdownElement.click();
  };

  // STATE GRAPH

  this.deleteState = function(stateName) {
    general.scrollToTop();
    var nodeElement = explorationGraph.all(
      by.cssContainingText('.protractor-test-node', stateName)).first();
    browser.wait(until.visibilityOf(nodeElement), 5000, 'State ' + stateName +
      ' takes too long to appear or does not exist');
    nodeElement.element(by.css('.protractor-test-delete-node')).click();
    expect(confirmDeleteStateButton.isDisplayed());
    confirmDeleteStateButton.click();
    browser.wait(until.invisibilityOf(confirmDeleteStateButton), 5000,
      'Deleting state takes too long');
  };

  // For this to work, there must be more than one name, otherwise the
  // exploration overview will be disabled.
  this.expectStateNamesToBe = function(names) {
    stateNodes.map(function(stateElement) {
      return stateNodeLabel(stateElement).getText();
    }).then(function(stateNames) {
      expect(stateNames.sort()).toEqual(names.sort());
    });
  };

  // NOTE: if the state is not visible in the state graph this function will
  // fail.
  this.moveToState = function(targetName) {
    general.scrollToTop();
    stateNodes.map(function(stateElement) {
      return stateNodeLabel(stateElement).getText();
    }).then(function(listOfNames) {
      var matched = false;
      for (var i = 0; i < listOfNames.length; i++) {
        if (listOfNames[i] === targetName) {
          stateNodes.get(i).click();
          matched = true;
          // Wait to re-load the entire state editor.
        }
      }
      if (!matched) {
        throw Error(
          'State ' + targetName + ' not found by editorMainTab.moveToState.');
      }
    });
    browser.wait(until.textToBePresentInElement(stateNameContainer, targetName),
      5000, 'Current state name is:' + stateNameContainer.getText() +
      'instead of expected ' + targetName);
  };

  this.setStateName = function(name) {
    browser.wait(until.elementToBeClickable(stateNameContainer), 10000,
      'State Name Container takes too long to appear')
      .then(function (isClickable) {
        if (isClickable) {
          stateNameContainer.click();
          stateNameInput.clear();
          stateNameInput.sendKeys(name);
        }
      });
    browser.wait(until.elementToBeClickable(stateNameSubmitButton), 5000,
      'State Name Submit button takes too long to appear')
      .then(function(isClickable) {
        if (isClickable) {
          stateNameSubmitButton.click();
          // Wait for state name container to completely disappear
          // and re-appear again.
        }
      });
    browser.wait(until.textToBePresentInElement(stateNameContainer, name),
      5000, 'Current state name is:' + stateNameContainer.getText() +
      'instead of expected ' + name);
  };

  this.expectCurrentStateToBe = function(name) {
    expect(stateNameContainer.getText()).toMatch(name);
  };
};

exports.ExplorationEditorMainTab = ExplorationEditorMainTab;
