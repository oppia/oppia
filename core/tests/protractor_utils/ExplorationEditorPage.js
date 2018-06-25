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
 * @fileoverview Page object for the exploration editor, for use in Protractor
 * tests.
 */

var forms = require('./forms.js');
var general = require('./general.js');
var interactions = require('../../../extensions/interactions/protractor.js');
var ruleTemplates = require(
  '../../../extensions/interactions/rule_templates.json');

var ExplorationEditorSettingsTab = require(
  '../protractor_utils/ExplorationEditorSettingsTab.js');

var _NEW_STATE_OPTION = 'A New Card Called...';
var _CURRENT_STATE_OPTION = '(try again)';

var ExplorationEditorPage = function() {
  /*
   * Components
   */
  this.getSettingsTab = function() {
    return new ExplorationEditorSettingsTab.ExplorationEditorSettingsTab();
  };

  /*
   * Interactive elements
   */
  var addResponseDetails = element(
    by.css('.protractor-test-add-response-details'));
  var addResponseHeader = element(
    by.css('.protractor-test-add-response-modal-header'));
  var answerDescription = element(
    by.css('.protractor-test-answer-description'));
  var answerDescriptionFragment = element.all(
    by.css('.protractor-test-answer-description-fragment'));
  var commitMessageInput = element(
    by.css('.protractor-test-commit-message-input'));
  var multipleChoiceAnswerOptions = function (optionNum) {
    return element(
      by.cssContainingText('.protractor-test-html-select-option', optionNum));
  };
  var neutralElement = element(by.css('.protractor-test-neutral-element'));
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
    return element(by.cssContainingText('option', targetOption));
  };
  var feedbackBubble = element(by.css('.protractor-test-feedback-bubble'));
  var feedbackEditor = element(by.css('.protractor-test-open-feedback-editor'));
  var responseBody = function(responseNum) {
    return element(by.css('.protractor-test-response-body-' + responseNum));
  };
  var openOutcomeDestEditor = element(
    by.css('.protractor-test-open-outcome-dest-editor'));
  var openOutcomeFeedBackEditor = element(
    by.css('.protractor-test-open-outcome-feedback-editor'));
  var responseTab = element.all(by.css('.protractor-test-response-tab'));
  var ruleBlock = element.all(by.css('.protractor-test-rule-block'));
  var ruleDetails = element(by.css('.protractor-test-rule-details'));
  var stateContentEditor = element(
    by.css('.protractor-test-state-content-editor'));
  var stateContentDisplay = element(
    by.css('.protractor-test-state-content-display'));
  var stateNameContainer = element(
    by.css('.protractor-test-state-name-container'));
  var stateNameInput = element(
    by.css('.protractor-test-state-name-input'));
  var interactionTab = function(tabId) {
    return element(by.css('.protractor-test-interaction-tab-' + tabId));
  };
  var interaction = element(by.css('.protractor-test-interaction'));
  var interactionEditor = element(
    by.css('.protractor-test-interaction-editor'));
  var interactionNode = element.all(by.css('.protractor-test-node'));
  var interactionNodeLabel = function(nodeElement) {
    return nodeElement.element(by.css('.protractor-test-node-label'));
  };
  var interactionTile = function(interactionId) {
    return element(by.css(
      '.protractor-test-interaction-tile-' + interactionId));
  };

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
  var confirmDiscardChangesButton = element(
    by.css('.protractor-test-confirm-discard-changes'));
  var deleteAnswerButton = element(
    by.css('.protractor-test-delete-answer'));
  var deleteInteractionButton = element(
    by.css('.protractor-test-delete-interaction'));
  var deleteNodeButton = function(nodeIndex) {
    return interactionNode.get(nodeIndex).element(
      by.css('.protractor-test-delete-node'));
  };
  var deleteResponseButton = element(
    by.css('.protractor-test-delete-response'));
  var discardChangesButton = element(
    by.css('.protractor-test-discard-changes'));
  var dismissWelcomeModalButton = element(
    by.css('.protractor-test-dismiss-welcome-modal'));
  var navigateToMainTabButton = element(by.css('.protractor-test-main-tab'));
  var navigateToPreviewTabButton = element(
    by.css('.protractor-test-preview-tab'));
  var navigateToSettingsTabButton = element(
    by.css('.protractor-test-settings-tab'));
  var saveAnswerButton = element(
    by.css('.protractor-test-save-answer'));
  var saveChangesButton = element(by.css('.protractor-test-save-changes'));
  var saveDiscardToggleButton = element(
    by.css('.protractor-test-save-discard-toggle'));
  var saveDraftButton = element(by.css('.protractor-test-close-save-modal'));
  var saveInteractionButton = element(
    by.css('.protractor-test-save-interaction'));
  var saveOutcomeDestButton = element(
    by.css('.protractor-test-save-outcome-dest'));
  var saveOutcomeFeedbackButton = element(
    by.css('.protractor-test-save-outcome-feedback'));
  var saveStateContentButton = element(
    by.css('.protractor-test-save-state-content'));
  var stateEditContentButton = element(
    by.css('.protractor-test-state-edit-content'));
  var stateNameSubmitButton = stateNameContainer.element(
    by.css('.protractor-test-state-name-submit'));

  /*
   * Actions
   */
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
    // Open the "Add Response" modal if it is not already open.
    addResponseHeader.isPresent().then(function(isVisible) {
      if (!isVisible) {
        addResponseButton.click();
        general.waitForSystem();
      }
    });

    // Set the rule description.
    var args = [addResponseDetails, interactionId, ruleName];
    for (var i = 5; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

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
    addNewResponseButton.click();

    // Wait for modal to close.
    general.waitForSystem();
  };

  this.setDefaultOutcome = function(feedbackInstructions,
      destStateName, createState) {
    // Select the default response.
    var editor = this.ResponseEditor('default');

    if (feedbackInstructions) {
      editor.setFeedback(feedbackInstructions);
    }

    // If the destination is being changed, open the corresponding editor.
    if (destStateName) {
      editor.setDestination(destStateName, createState, null);
    }

    // Wait for feedback and/or destination editors to finish saving.
    general.waitForSystem();
  };

  this.exitTutorialIfNecessary = function() {
    // If the editor welcome modal shows up, exit it.
    editorWelcomeModal.then(function(modals) {
      if (modals.length === 1) {
        dismissWelcomeModalButton.click();
      } else if (modals.length !== 0) {
        throw 'Expected to find at most one \'welcome modal\'';
      }
    });

    // Otherwise, if the editor tutorial shows up, exit it.
    element.all(by.css('.skipBtn')).then(function(buttons) {
      if (buttons.length === 1) {
        buttons[0].click();
      } else if (buttons.length !== 0) {
        throw 'Expected to find at most one \'exit tutorial\' button';
      }
    });
  };

  // Rules are zero-indexed; 'default' denotes the default outcome.
  this.ResponseEditor = function(responseNum) {
    var headerElem;
    if (responseNum === 'default') {
      headerElem = defaultResponseTab;
    } else {
      headerElem = responseTab.get(
        responseNum);
    }

    responseBody(responseNum).isPresent().then(function(isVisible) {
      if (!isVisible) {
        headerElem.click();
      }
    });

    return {
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
        openOutcomeDestEditor.click();

        // Set destination contents.
        _setOutcomeDest(destinationName, createState, refresherExplorationId);

        // Save destination.
        general.waitForSystem();
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

  // CONTENT

  // 'richTextInstructions' is a function that is sent a RichTextEditor which it
  // can then use to alter the state content, for example by calling
  // .appendBoldText(...).
  this.setContent = function(richTextInstructions) {
    general.waitForSystem();
    stateEditContentButton.click();
    var richTextEditor = forms.RichTextEditor(stateContentEditor);
    richTextEditor.clear();
    richTextInstructions(richTextEditor);
    saveStateContentButton.click();
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

  // CONTROLS

  this.saveChanges = function(commitMessage) {
    saveChangesButton.click().then(function() {
      if (commitMessage) {
        commitMessageInput.
          sendKeys(commitMessage);
      }
      browser.waitForAngular();
      general.waitForSystem();
      saveDraftButton.click();
      // This is necessary to give the page time to record the changes,
      // so that it does not attempt to stop the user leaving.
      browser.waitForAngular();
      general.waitForSystem();
    });
  };

  this.discardChanges = function() {
    saveDiscardToggleButton.click();
    discardChangesButton.click();
    confirmDiscardChangesButton.click();
    general.waitForSystem();
    browser.waitForAngular();
  };

  this.expectCannotSaveChanges = function() {
    expect(saveChangesButton.isPresent()).toBeFalsy();
  };

  // INTERACTIONS

  // This function should be used as the standard way to specify interactions
  // for most purposes. Additional arguments may be sent to this function,
  // and they will be passed on to the relevant interaction editor.
  this.setInteraction = function(interactionId) {
    general.waitForSystem();
    openInteraction(interactionId);
    customizeInteraction.apply(null, arguments);
    // If the "Add Response" modal opens, close it.
    addResponseHeader.isPresent().then(function(isVisible) {
      if (isVisible) {
        closeAddResponseModal();
      }
    });
  };

  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  var openInteraction = function(interactionId) {
    deleteInteractionButton.isPresent().then(
      function(isVisible) {
        // If there is already an interaction present, delete it.
        if (isVisible) {
          deleteInteractionButton.click();
          // Click through the "are you sure?" warning.
          confirmDeleteInteractionButton.click();
        }
      });

    general.waitForSystem();

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

    general.waitForSystem();
    interactionTab(INTERACTION_ID_TO_TAB_NAME[interactionId]).click();
    interactionTile(interactionId).click();
  };

  // This function should not usually be invoked directly; please consider
  // using setInteraction instead.
  var closeAddResponseModal = function() {
    closeAddResponseButton.click();
    general.waitForSystem();
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
        // Wait for the customization modal to close.
        general.waitForSystem();
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
    stateNameContainer.click();
    stateNameInput.clear();
    stateNameInput.sendKeys(name);
    stateNameSubmitButton.click();
    // Wait for the state to refresh.
    general.waitForSystem();
  };

  var _getStateName = function() {
    return stateNameContainer.getText();
  };

  this.expectCurrentStateToBe = function(name) {
    expect(_getStateName()).toMatch(name);
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
    editOutcomeDestDropdownOptions(targetOption).click();
    if (createDest) {
      editOutcomeDestStateInput.sendKeys(destName);
    } else if (refresherExplorationId) {
      editOutcomeDestAddExplorationId.sendKeys(refresherExplorationId);
    }
  };

  var _setOutcomeFeedback = function(richTextInstructions) {
    var feedbackEditor = forms.RichTextEditor(
      feedbackBubble);
    feedbackEditor.clear();
    richTextInstructions(feedbackEditor);
  };

  // NAVIGATION

  this.navigateToMainTab = function() {
    navigateToMainTabButton.click();
    general.waitForSystem();
    // Click a neutral element in order to dismiss any warnings.
    neutralElement.click();
  };

  this.navigateToPreviewTab = function() {
    navigateToPreviewTabButton.click();
    general.waitForSystem();
  };

  this.navigateToSettingsTab = function() {
    navigateToSettingsTabButton.click();
  };

  // RULES
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

    var parameterStart = (ruleDescription.indexOf('{{') === -1) ?
      undefined : ruleDescription.indexOf('{{');
    var parameterTypes = [];
    while (parameterStart !== undefined) {
      var parameterEnd = ruleDescription.indexOf('}}', parameterStart) + 2;
      parameterTypes.push(
        ruleDescription.substring(
          ruleDescription.indexOf('|', parameterStart) + 1, parameterEnd - 2));

      var nextParameterStart =
        (ruleDescription.indexOf('{{', parameterEnd) === -1) ?
          undefined : ruleDescription.indexOf('{{', parameterEnd);
      parameterStart = nextParameterStart;
    }
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

    for (var i = 0; i < parameterValues.length; i++) {
      var parameterElement = answerDescriptionFragment.get(i * 2 + 1);
      var parameterEditor = forms.getEditor(
        parameterTypes[i])(parameterElement);

      if (interactionId === 'MultipleChoiceInput') {
        // This is a special case as it uses a dropdown to set a NonnegativeInt
        parameterElement.element(by.tagName('button')).click();
        multipleChoiceAnswerOptions(parameterValues[i])
          .click();
      } else {
        parameterEditor.setValue(parameterValues[i]);
      }
    }
  };

  // This function selects a rule from the dropdown,
  // but does not set any of its input parameters.
  var _selectRule = function(ruleElement, interactionId, ruleName) {
    var ruleDescription = _getRuleDescription(interactionId, ruleName);

    var parameterStart = (
      ruleDescription.indexOf('{{') === -1) ?
      undefined :
      ruleDescription.indexOf('{{');
    // From the ruleDescription string we can deduce both the description used
    // in the page (which will have the form "is equal to ...") and the types
    // of the parameter objects, which will later tell us which object editors
    // to use to enter the parameterValues.
    var ruleDescriptionInDropdown = ruleDescription.substring(
      0, parameterStart);
    while (parameterStart !== undefined) {
      var parameterEnd = ruleDescription.indexOf('}}', parameterStart) + 2;
      var nextParameterStart =
        (ruleDescription.indexOf('{{', parameterEnd) === -1) ?
          undefined : ruleDescription.indexOf('{{', parameterEnd);
      ruleDescriptionInDropdown = ruleDescriptionInDropdown + '...' +
        ruleDescription.substring(parameterEnd, nextParameterStart);
      parameterStart = nextParameterStart;
    }

    answerDescription.click();

    element.all(by.css('.select2-dropdown')).map(function(selectorElement) {
      selectorElement.all(by.cssContainingText(
        'li.select2-results__option', ruleDescriptionInDropdown
      )).filter(function(elem) {
        // We need to do this check because some options may only have
        // 'ruleDescriptionInDropdown' as a substring.
        return elem.getText().then(function(text) {
          return text === ruleDescriptionInDropdown;
        });
      }).then(function(optionElements) {
        if (optionElements.length !== 1) {
          throw (
            'Expected exactly one rule option to match: ' +
            ruleDescriptionInDropdown + '; found ' + optionElements.length +
            ' instead');
        }
        optionElements[0].click();
      });
    });
  };

  // STATE GRAPH

  this.deleteState = function(stateName) {
    general.waitForSystem();
    interactionNode.map(function(stateElement) {
      return stateElement.element(by.css('.protractor-test-node-label')).
        getText();
    }).then(function(listOfNames) {
      var matched = false;
      for (var i = 0; i < listOfNames.length; i++) {
        if (listOfNames[i] === stateName) {
          deleteNodeButton(i).click();
          browser.waitForAngular();
          general.waitForSystem();
          confirmDeleteStateButton.click();
          matched = true;
        }
      }
      if (!matched) {
        throw Error('State ' + stateName + ' not found by ' +
        'explorationEditorPage.deleteState');
      }
    });
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
  // fail
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
          general.waitForSystem();
        }
      }
      if (!matched) {
        throw Error('State ' + targetName +
        ' not found by explorationEditorPage.moveToState');
      }
    });
  };

  // UTILITIES
  this.expectCurrentStateToBe = function(name) {
    expect(stateNameContainer.getText()).toMatch(name);
  };
};
exports.ExplorationEditorPage = ExplorationEditorPage;
