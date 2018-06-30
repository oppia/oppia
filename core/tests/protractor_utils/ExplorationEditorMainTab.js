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
  var feedbackBubble = element(by.css('.protractor-test-feedback-bubble'));
  var feedbackEditor = element(by.css('.protractor-test-open-feedback-editor'));
  var interaction = element(by.css('.protractor-test-interaction'));
  var interactionEditor = element(
    by.css('.protractor-test-interaction-editor'));
  var interactionNode = element.all(by.css('.protractor-test-node'));
  var interactionNodeLabel = function(nodeElement) {
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
  var addNewResponseButton = element(
    by.css('.protractor-test-add-new-response'));
  var addResponseButton = element(
    by.css('.protractor-test-open-add-response-modal'));
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
  var nextTutorialStageButton = element.all(by.css('.nextBtn'));
  var saveAnswerButton = element(
    by.css('.protractor-test-save-answer'));
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

  /*
   * Actions
   */

  // TUTORIAL

  this.exitTutorial = function() {
    // If the editor welcome modal shows up, exit it.
    editorWelcomeModal.then(function(modals) {
      if (modals.length === 1) {
        dismissWelcomeModalButton.click();
      } else if (modals.length !== 0) {
        throw 'Expected to find at most one \'welcome modal\'';
      }
    });

    expect(element(by.css('.protractor-test-welcome-modal')).isPresent())
      .toBe(false);

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
    element.all(by.buttonText('Finish')).then(function(buttons) {
      if (buttons.length === 1) {
        buttons[0].click().then(function(){
          // Making sure tutorial modal is closed
          browser.wait(until.elementToBeClickable(neutralElement), 5000,
            'Tutorial modal taking too long to close');
          neutralElement.click();
        });
      } else {
        throw 'Expected to find exactly one \'Finish\' button';
      }
    });
  };

  this.progressInTutorial = function() {
    // Progress to the next instruction in the tutorial.
    nextTutorialStageButton.then(function(buttons) {
      if (buttons.length === 1) {
        buttons[0].click();
      } else {
        throw 'Expected to find exactly one \'next\' button';
      }
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

  // This clicks the "add new response" button and then selects the rule type
  // and enters its parameters, and closes the rule editor. Any number of rule
  // parameters may be specified after the ruleName.
  // - interactionId: the name of the interaction type, e.g. NumericInput.
  // - feedbackInstructions: a rich-text object containing feedback, or null.
  // - destStateName: the name of the destination state of the rule, or null if
  //     the rule loops to the current state.
  // - createState: true if the rule creates a new state, else false.
  // - refresherExplorationId: the id of refresher exploration for the current
  //     state (if applicable), by default, should be null.
  // - ruleName: the name of the rule, e.g. IsGreaterThan.
  //
  // Note that feedbackInstructions may be null (which means 'specify no
  // feedback'), and only represents a single feedback element.
  this.addResponse = function(
      interactionId, feedbackInstructions, destStateName,
      createState, ruleName) {
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
    if (destStateName) {
    // Set destination contents.
      _setOutcomeDest(
        destStateName, createState, null);
    }

    // Close new response modal.
    expect(addNewResponseButton.isDisplayed()).toBe(true);
    addNewResponseButton.click();
    browser.wait(until.presenceOf(neutralElement), 5000,
      'neutralElement taking too long to appear in addResponse');
    neutralElement.click();
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
        headerElem.click();
      }
    });

    return {
      /**
       * Check for correct rule parameters
       * @param {string} [interactionId] - Interaction type.
       * @param {string} [ruleName] - Appropriate rule of provided interaction.
       * @param {string[]} [feedbackTextArray] - Exact feedback text to match.
       */
      expectRuleToBe: function(interactionId, ruleName, feedbackTextArray) {
        var ruleDescription = _getRuleDescription(interactionId, ruleName);
        // Expected input = is equal to {{a|NonnegativeInt}} and
        // {{b|NonnegativeInt}}.
        ruleDescription = _replaceAngularSelectors(
          ruleDescription, feedbackTextArray);
        // Expected output = is equal to feedbackTextElement and
        // feedbackTextElement.
        ruleDescription += '...';
        // Adding ... to end of string
        var answerTab = element(by.css('.protractor-test-answer-tab'));
        expect(answerTab.getText()).toEqual(ruleDescription);
      },
      /**
       * Check for correct learner's feedback
       * @param {string} [feedbackInstructionText] - Exact feedback to match.
       */
      expectFeedbackInstructionToBe: function(feedbackInstructionsText) {
        // The first rule block's RTE editor
        var feedbackRTE = element.all(by.css('.oppia-rule-block')).first()
          .element(by.className('oppia-rte-editor'));
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
      //  - createState: whether the destination state is new and must be
      //    created at this point.
      setDestination: function(
          destinationName, createState, refresherExplorationId) {
      // Begin editing destination.
        expect(openOutcomeDestEditor.isDisplayed()).toBe(true);
        openOutcomeDestEditor.click();

        // Set destination contents.
        _setOutcomeDest(destinationName, createState, refresherExplorationId);

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

      // Add the rule
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

  var _setOutcomeDest = function(destName, createDest, refresherExplorationId) {
    expect(destName === null && createDest).toBe(false);

    if (createDest) {
      targetOption = _NEW_STATE_OPTION;
    } else if (destName === null) {
      targetOption = _CURRENT_STATE_OPTION;
    } else {
      targetOption = destName;
    }
    browser.wait(until.presenceOf(editOutcomeDestDropdownOptions(targetOption))
      , 5000, 'editOutcomeDestDropdownOptions taking too long to appear');
    expect(editOutcomeDestDropdownOptions(targetOption).isDisplayed())
      .toBe(true);
    editOutcomeDestDropdownOptions(targetOption).click();

    if (createDest) {
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
    browser.waitForAngular();
    browser.wait(until.presenceOf(stateEditContent), 5000,
      'stateEditContent taking too long to appear to set content');
    stateEditContent.click();
    var stateContentEditor = element(
      by.css('.protractor-test-state-content-editor'));
    browser.wait(until.presenceOf(stateContentEditor), 5000,
      'stateContentEditor taking too long to appear to set content');
    var richTextEditor = forms.RichTextEditor(stateContentEditor);
    richTextEditor.clear();
    richTextInstructions(richTextEditor);
    expect(saveStateContentButton.isDisplayed()).toBe(true);
    saveStateContentButton.click();
    browser.wait(until.invisibilityOf(saveStateContentButton), 5000);
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

  // INTERACTIONS

  // This function should be used as the standard way to specify interactions
  // for most purposes. Additional arguments may be sent to this function,
  // and they will be passed on to the relevant interaction editor.
  this.setInteraction = function(interactionId) {
    this.openInteraction(interactionId);
    this.customizeInteraction.apply(null, arguments);
    this.closeAddResponseModal();
    // Click on neutral element to make sure modal is closed.
    browser.wait(until.invisibilityOf(addResponseHeader), 5000);
    neutralElement.click();
  };

  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  this.openInteraction = function(interactionId) {
    deleteInteractionButton.isPresent().then(
      function(isVisible) {
      // If there is already an interaction present, delete it.
        if (isVisible) {
          deleteInteractionButton.click();
          // Click through the "are you sure?" warning.
          confirmDeleteInteractionButton.click();
        }
      });

    expect(addInteractionButton.isDisplayed()).toBe(true);
    addInteractionButton.click();

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
  this.customizeInteraction = function(interactionId) {
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
  this.closeAddResponseModal = function() {
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

  this.setStateName = function(name) {
    expect(stateNameContainer.isDisplayed()).toBe(true);
    stateNameContainer.click();
    stateNameInput.clear();
    stateNameInput.sendKeys(name);
    expect(stateNameSubmitButton.isDisplayed()).toBe(true);
    stateNameSubmitButton.click().then(function() {
      // Wait for the state to refresh.
      general.waitForSystem();
    });
  };

  var _setOutcomeFeedback = function(richTextInstructions) {
    var feedbackEditor = forms.RichTextEditor(
      feedbackBubble);
    feedbackEditor.clear();
    richTextInstructions(feedbackEditor);
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
    // Expected input = is equal to {{a|NonnegativeInt}} and
    // {{b|NonnegativeInt}}
    var parameterTypes = [];
    var re = /\|(.*?)\}/ig;
    // Matched result = Array[|NonnegativeInt}, |NonnegativeInt}]
    var matchedString = ruleDescription.match(re);
    // Slicing first and last letter.
    if (matchedString) {
      matchedString.forEach(function(elem) {
        parameterTypes.push(elem.toString().slice(1, -1));
      });
    }
    // Expected output = Array[NonnegativeInt, NonnegativeInt]
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
   * Parse for Angular selectors and remove them.
   * @param {string} [ruleDescription] - Interaction type.
   * @param {string|string[]} [providedText] - Feedback text to replace with.
   */
  var _replaceAngularSelectors = function(ruleDescription, providedText) {
    // Expected input = is equal to {{a|NonnegativeInt}} and
    // {{b|NonnegativeInt}}.
    var re = /{{[a-z][\|](.*?)}}/ig;
    // Matched result = Array[{{a|NonnegativeInt}}}, {{b|NonnegativeInt}}]
    var matchedString = ruleDescription.match(re);
    // Replacing matched strings in ruleDescription with ...
    var textArray = [];
    if (providedText === '...') {
      matchedString.forEach(function() {
        textArray.push(providedText);
      });
    } else {
      // Replacing matched strings in ruleDescription with provided text
      matchedString.forEach(function(elem, index) {
        textArray.push(providedText[index]);
      });
    }
    if (textArray.length !== matchedString.length) {
      throw Error('# of text(' + textArray.length +
      ') is expected to match # of angular selectors(' +
      (matchedString.length) + ')');
    }
    if (matchedString) {
      matchedString.forEach(function(elem, index) {
        ruleDescription = ruleDescription.replace(elem, textArray[index]);
      });
    }
    return ruleDescription;
  };

  // This function selects a rule from the dropdown,
  // but does not set any of its input parameters.
  var _selectRule = function(ruleElem, interactionId, ruleName) {
    // Expected input = is equal to {{a|NonnegativeInt}} and
    // {{b|NonnegativeInt}}.
    var ruleDescription = _getRuleDescription(interactionId, ruleName);
    ruleDescription = _replaceAngularSelectors(ruleDescription, '...');
    // Expected output = is equal to ... and ...
    var ruleDescriptionInDropdown = ruleDescription;
    var answerDescription = element(
      by.css('.protractor-test-answer-description'));
    expect(answerDescription.isDisplayed()).toBe(true);
    answerDescription.click();
    var ruleDropdownElement = element(by.cssContainingText(
      '.select2-results__option', ruleDescriptionInDropdown));
    browser.wait(until.visibilityOf(ruleDropdownElement), 5000,
      'Rule dropdown element taking too long to appear');
    ruleDropdownElement.click();
  };

  // STATE GRAPH

  this.deleteState = function(stateName) {
    general.scrollToTop();
    var nodeElement = element(
      by.cssContainingText('.protractor-test-node', stateName));
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
    interactionNode.map(function(stateElement) {
      return interactionNodeLabel(stateElement).getText();
    }).then(function(stateNames) {
      expect(stateNames.sort()).toEqual(names.sort());
    });
  };

  // NOTE: if the state is not visible in the state graph this function will
  // fail.
  this.moveToState = function(targetName) {
    general.scrollToTop();
    interactionNode.map(function(stateElement) {
      return interactionNodeLabel(stateElement).getText();
    }).then(function(listOfNames) {
      var matched = false;
      for (var i = 0; i < listOfNames.length; i++) {
        if (listOfNames[i] === targetName) {
          interactionNode.get(i).click();
          matched = true;
          // Wait to re-load the entire state editor
          general.waitForSystem();
        }
      }
      if (!matched) {
        throw Error('State ' + targetName +
      ' not found by explorationEditorMainTab.moveToState.');
      }
    });
  };

  // UTILITIES
  this.expectCurrentStateToBe = function(name) {
    expect(stateNameContainer.getText()).toMatch(name);
  };
};

exports.ExplorationEditorMainTab = ExplorationEditorMainTab;
