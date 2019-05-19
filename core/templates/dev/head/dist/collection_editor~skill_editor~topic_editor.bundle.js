(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["collection_editor~skill_editor~topic_editor"],{

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/angular-name/angular-name.service.ts":
/*!*************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/angular-name/angular-name.service.ts ***!
  \*************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview A service that maps IDs to Angular names.
 */
angular.module('explorationEditorPageModule').factory('AngularNameService', [function () {
        var angularName = null;
        return {
            getNameOfInteractionRulesService: function (interactionId) {
                angularName = interactionId.charAt(0) +
                    interactionId.slice(1) + 'RulesService';
                return angularName;
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts":
/*!*******************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts ***!
  \*******************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Service responses corresponding to a state's interaction and
 * answer groups.
 */
__webpack_require__(/*! domain/exploration/OutcomeObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/OutcomeObjectFactory.ts");
__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'pages/exploration-editor-page/exploration-editor-tab/AnswerGroupsCacheService.ts'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'pages/exploration-editor-page/exploration-editor-tab/SolutionValidityService.ts'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'pages/exploration-editor-page/exploration-editor-tab/SolutionVerificationService.ts'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts");
__webpack_require__(/*! pages/state-editor/state-editor-properties-services/state-property/state-property.service.ts */ "./core/templates/dev/head/pages/state-editor/state-editor-properties-services/state-property/state-property.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
angular.module('explorationEditorTabModule').factory('ResponsesService', [
    '$rootScope', 'AlertsService', 'AnswerGroupsCacheService',
    'ContextService', 'OutcomeObjectFactory',
    'SolutionValidityService', 'SolutionVerificationService',
    'StateEditorService', 'StateInteractionIdService',
    'StateSolutionService', 'COMPONENT_NAME_DEFAULT_OUTCOME',
    'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE',
    'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION',
    'INFO_MESSAGE_SOLUTION_IS_VALID', 'INTERACTION_SPECS',
    function ($rootScope, AlertsService, AnswerGroupsCacheService, ContextService, OutcomeObjectFactory, SolutionValidityService, SolutionVerificationService, StateEditorService, StateInteractionIdService, StateSolutionService, COMPONENT_NAME_DEFAULT_OUTCOME, INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE, INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION, INFO_MESSAGE_SOLUTION_IS_VALID, INTERACTION_SPECS) {
        var _answerGroupsMemento = null;
        var _defaultOutcomeMemento = null;
        var _confirmedUnclassifiedAnswersMemento = null;
        // Represents the current selected answer group, starting at index 0. If the
        // index equal to the number of answer groups (answerGroups.length), then it
        // is referring to the default outcome.
        var _activeAnswerGroupIndex = null;
        var _activeRuleIndex = -1;
        var _answerGroups = null;
        var _defaultOutcome = null;
        var _confirmedUnclassifiedAnswers = null;
        var _answerChoices = null;
        var _verifySolution = function () {
            // This checks if the solution is valid once a rule has been changed or
            // added.
            var currentInteractionId = StateInteractionIdService.savedMemento;
            var interactionCanHaveSolution = (currentInteractionId &&
                INTERACTION_SPECS[currentInteractionId].can_have_solution);
            var solutionExists = (StateSolutionService.savedMemento &&
                StateSolutionService.savedMemento.correctAnswer !== null);
            if (interactionCanHaveSolution && solutionExists) {
                var interaction = StateEditorService.getInteraction();
                interaction.answerGroups = angular.copy(_answerGroups);
                interaction.defaultOutcome = angular.copy(_defaultOutcome);
                var solutionIsValid = SolutionVerificationService.verifySolution(StateEditorService.getActiveStateName(), interaction, StateSolutionService.savedMemento.correctAnswer);
                SolutionValidityService.updateValidity(StateEditorService.getActiveStateName(), solutionIsValid);
                var solutionWasPreviouslyValid = (SolutionValidityService.isSolutionValid(StateEditorService.getActiveStateName()));
                if (solutionIsValid && !solutionWasPreviouslyValid) {
                    AlertsService.addInfoMessage(INFO_MESSAGE_SOLUTION_IS_VALID);
                }
                else if (!solutionIsValid && solutionWasPreviouslyValid) {
                    AlertsService.addInfoMessage(INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE);
                }
                else if (!solutionIsValid && !solutionWasPreviouslyValid) {
                    AlertsService.addInfoMessage(INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION);
                }
            }
        };
        var _saveAnswerGroups = function (newAnswerGroups) {
            var oldAnswerGroups = _answerGroupsMemento;
            if (newAnswerGroups && oldAnswerGroups &&
                !angular.equals(newAnswerGroups, oldAnswerGroups)) {
                _answerGroups = newAnswerGroups;
                $rootScope.$broadcast('answerGroupChanged', newAnswerGroups);
                _verifySolution();
                _answerGroupsMemento = angular.copy(newAnswerGroups);
            }
        };
        var _updateAnswerGroup = function (index, updates, callback) {
            var answerGroup = _answerGroups[index];
            if (updates.hasOwnProperty('rules')) {
                answerGroup.rules = updates.rules;
            }
            if (updates.hasOwnProperty('taggedMisconceptionId')) {
                answerGroup.taggedMisconceptionId = updates.taggedMisconceptionId;
            }
            if (updates.hasOwnProperty('feedback')) {
                answerGroup.outcome.feedback = updates.feedback;
            }
            if (updates.hasOwnProperty('dest')) {
                answerGroup.outcome.dest = updates.dest;
            }
            if (updates.hasOwnProperty('refresherExplorationId')) {
                answerGroup.outcome.refresherExplorationId = (updates.refresherExplorationId);
            }
            if (updates.hasOwnProperty('missingPrerequisiteSkillId')) {
                answerGroup.outcome.missingPrerequisiteSkillId = (updates.missingPrerequisiteSkillId);
            }
            if (updates.hasOwnProperty('labelledAsCorrect')) {
                answerGroup.outcome.labelledAsCorrect = updates.labelledAsCorrect;
            }
            if (updates.hasOwnProperty('trainingData')) {
                answerGroup.trainingData = updates.trainingData;
            }
            _saveAnswerGroups(_answerGroups);
            callback(_answerGroupsMemento);
        };
        var _saveDefaultOutcome = function (newDefaultOutcome) {
            var oldDefaultOutcome = _defaultOutcomeMemento;
            if (!angular.equals(newDefaultOutcome, oldDefaultOutcome)) {
                _defaultOutcome = newDefaultOutcome;
                _verifySolution();
                _defaultOutcomeMemento = angular.copy(newDefaultOutcome);
            }
        };
        var _saveConfirmedUnclassifiedAnswers = function (newConfirmedUnclassifiedAnswers) {
            var oldConfirmedUnclassifiedAnswers = (_confirmedUnclassifiedAnswersMemento);
            if (!angular.equals(newConfirmedUnclassifiedAnswers, oldConfirmedUnclassifiedAnswers)) {
                _confirmedUnclassifiedAnswers = newConfirmedUnclassifiedAnswers;
                _confirmedUnclassifiedAnswersMemento = angular.copy(newConfirmedUnclassifiedAnswers);
            }
        };
        return {
            // The 'data' arg is a list of interaction handlers for the
            // currently-active state.
            init: function (data) {
                AnswerGroupsCacheService.reset();
                _answerGroups = angular.copy(data.answerGroups);
                _defaultOutcome = angular.copy(data.defaultOutcome);
                _confirmedUnclassifiedAnswers = angular.copy(data.confirmedUnclassifiedAnswers);
                if (StateInteractionIdService.savedMemento !== null) {
                    AnswerGroupsCacheService.set(StateInteractionIdService.savedMemento, _answerGroups);
                }
                _answerGroupsMemento = angular.copy(_answerGroups);
                _defaultOutcomeMemento = angular.copy(_defaultOutcome);
                _confirmedUnclassifiedAnswersMemento = angular.copy(_confirmedUnclassifiedAnswers);
                _activeAnswerGroupIndex = -1;
                _activeRuleIndex = 0;
            },
            onInteractionIdChanged: function (newInteractionId, callback) {
                if (AnswerGroupsCacheService.contains(newInteractionId)) {
                    _answerGroups = AnswerGroupsCacheService.get(newInteractionId);
                }
                else {
                    _answerGroups = [];
                }
                // Preserve the default outcome unless the interaction is terminal.
                // Recreate the default outcome if switching away from a terminal
                // interaction.
                if (newInteractionId) {
                    if (INTERACTION_SPECS[newInteractionId].is_terminal) {
                        _defaultOutcome = null;
                    }
                    else if (!_defaultOutcome) {
                        _defaultOutcome = OutcomeObjectFactory.createNew(StateEditorService.getActiveStateName(), COMPONENT_NAME_DEFAULT_OUTCOME, '', []);
                    }
                }
                _confirmedUnclassifiedAnswers = [];
                _saveAnswerGroups(_answerGroups);
                _saveDefaultOutcome(_defaultOutcome);
                _saveConfirmedUnclassifiedAnswers(_confirmedUnclassifiedAnswers);
                if (newInteractionId) {
                    AnswerGroupsCacheService.set(newInteractionId, _answerGroups);
                }
                _answerGroupsMemento = angular.copy(_answerGroups);
                _defaultOutcomeMemento = angular.copy(_defaultOutcome);
                _confirmedUnclassifiedAnswersMemento = angular.copy(_confirmedUnclassifiedAnswers);
                _activeAnswerGroupIndex = -1;
                _activeRuleIndex = 0;
                if (callback) {
                    callback(_answerGroupsMemento, _defaultOutcomeMemento);
                }
            },
            getActiveAnswerGroupIndex: function () {
                return _activeAnswerGroupIndex;
            },
            changeActiveAnswerGroupIndex: function (newIndex) {
                // If the current group is being clicked on again, close it.
                if (newIndex === _activeAnswerGroupIndex) {
                    _activeAnswerGroupIndex = -1;
                }
                else {
                    _activeAnswerGroupIndex = newIndex;
                }
                _activeRuleIndex = -1;
            },
            getActiveRuleIndex: function () {
                return _activeRuleIndex;
            },
            changeActiveRuleIndex: function (newIndex) {
                _activeRuleIndex = newIndex;
            },
            getAnswerChoices: function () {
                return angular.copy(_answerChoices);
            },
            updateAnswerGroup: function (index, updates, callback) {
                _updateAnswerGroup(index, updates, callback);
            },
            deleteAnswerGroup: function (index, callback) {
                _answerGroupsMemento = angular.copy(_answerGroups);
                _answerGroups.splice(index, 1);
                _activeAnswerGroupIndex = -1;
                _saveAnswerGroups(_answerGroups);
                callback(_answerGroupsMemento);
            },
            updateActiveAnswerGroup: function (updates, callback) {
                _updateAnswerGroup(_activeAnswerGroupIndex, updates, callback);
            },
            updateDefaultOutcome: function (updates, callback) {
                var outcome = _defaultOutcome;
                if (updates.hasOwnProperty('feedback')) {
                    outcome.feedback = updates.feedback;
                }
                if (updates.hasOwnProperty('dest')) {
                    outcome.dest = updates.dest;
                }
                if (updates.hasOwnProperty('refresherExplorationId')) {
                    outcome.refresherExplorationId = updates.refresherExplorationId;
                }
                if (updates.hasOwnProperty('missingPrerequisiteSkillId')) {
                    outcome.missingPrerequisiteSkillId =
                        updates.missingPrerequisiteSkillId;
                }
                if (updates.hasOwnProperty('labelledAsCorrect')) {
                    outcome.labelledAsCorrect = updates.labelledAsCorrect;
                }
                _saveDefaultOutcome(outcome);
                callback(_defaultOutcomeMemento);
            },
            updateConfirmedUnclassifiedAnswers: function (confirmedUnclassifiedAnswers) {
                _saveConfirmedUnclassifiedAnswers(confirmedUnclassifiedAnswers);
            },
            // Updates answer choices when the interaction requires it -- for
            // example, the rules for multiple choice need to refer to the multiple
            // choice interaction's customization arguments.
            updateAnswerChoices: function (newAnswerChoices, callback) {
                var oldAnswerChoices = angular.copy(_answerChoices);
                _answerChoices = newAnswerChoices;
                // If the interaction is ItemSelectionInput, update the answer groups
                // to refer to the new answer options.
                if (StateInteractionIdService.savedMemento === 'ItemSelectionInput' &&
                    oldAnswerChoices) {
                    // We use an approximate algorithm here. If the length of the answer
                    // choices array remains the same, and no choice is replicated at
                    // different indices in both arrays (which indicates that some
                    // moving-around happened), then replace any old choice with its
                    // corresponding new choice. Otherwise, we simply remove any answer
                    // that has not been changed. This is not foolproof, but it should
                    // cover most cases.
                    //
                    // TODO(sll): Find a way to make this fully deterministic. This can
                    // probably only occur after we support custom editors for
                    // interactions.
                    var onlyEditsHappened = false;
                    if (oldAnswerChoices.length === newAnswerChoices.length) {
                        onlyEditsHappened = true;
                        // Check that no answer choice appears to have been moved.
                        var numAnswerChoices = oldAnswerChoices.length;
                        for (var i = 0; i < numAnswerChoices; i++) {
                            for (var j = 0; j < numAnswerChoices; j++) {
                                if (i !== j &&
                                    oldAnswerChoices[i].val === newAnswerChoices[j].val) {
                                    onlyEditsHappened = false;
                                    break;
                                }
                            }
                        }
                    }
                    var oldChoiceStrings = oldAnswerChoices.map(function (choice) {
                        return choice.val;
                    });
                    var newChoiceStrings = newAnswerChoices.map(function (choice) {
                        return choice.val;
                    });
                    var key, newInputValue;
                    _answerGroups.forEach(function (answerGroup, answerGroupIndex) {
                        var newRules = angular.copy(answerGroup.rules);
                        newRules.forEach(function (rule) {
                            for (key in rule.inputs) {
                                newInputValue = [];
                                rule.inputs[key].forEach(function (item) {
                                    var newIndex = newChoiceStrings.indexOf(item);
                                    if (newIndex !== -1) {
                                        newInputValue.push(item);
                                    }
                                    else if (onlyEditsHappened) {
                                        var oldIndex = oldChoiceStrings.indexOf(item);
                                        if (oldIndex !== -1) {
                                            newInputValue.push(newAnswerChoices[oldIndex].val);
                                        }
                                    }
                                });
                                rule.inputs[key] = newInputValue;
                            }
                        });
                        _updateAnswerGroup(answerGroupIndex, {
                            rules: newRules
                        }, callback);
                    });
                }
                // If the interaction is DragAndDropSortInput, update the answer groups
                // to refer to the new answer options.
                if (StateInteractionIdService.savedMemento === 'DragAndDropSortInput' &&
                    oldAnswerChoices) {
                    // If the length of the answer choices array changes, then there is
                    // surely any deletion or modification or addition in the array. We
                    // simply set answer groups to refer to default value. If the length
                    // of the answer choices array remains the same and all the choices in
                    // the previous array are present, then no change is required.
                    // However, if any of the choices is not present, we set answer groups
                    // to refer to the default value containing new answer choices.
                    var anyChangesHappened = false;
                    if (oldAnswerChoices.length !== newAnswerChoices.length) {
                        anyChangesHappened = true;
                    }
                    else {
                        // Check if any modification happened in answer choices.
                        var numAnswerChoices = oldAnswerChoices.length;
                        for (var i = 0; i < numAnswerChoices; i++) {
                            var choiceIsPresent = false;
                            for (var j = 0; j < numAnswerChoices; j++) {
                                if (oldAnswerChoices[i].val === newAnswerChoices[j].val) {
                                    choiceIsPresent = true;
                                    break;
                                }
                            }
                            if (choiceIsPresent === false) {
                                anyChangesHappened = true;
                                break;
                            }
                        }
                    }
                    if (anyChangesHappened) {
                        _answerGroups.forEach(function (answerGroup, answerGroupIndex) {
                            var newRules = angular.copy(answerGroup.rules);
                            newRules.forEach(function (rule) {
                                if (rule.type === 'HasElementXAtPositionY') {
                                    for (key in rule.inputs) {
                                        newInputValue = '';
                                        if (key === 'y') {
                                            newInputValue = 1;
                                        }
                                        rule.inputs[key] = newInputValue;
                                    }
                                }
                                else if (rule.type === 'HasElementXBeforeElementY') {
                                    for (key in rule.inputs) {
                                        newInputValue = '';
                                        rule.inputs[key] = newInputValue;
                                    }
                                }
                                else {
                                    for (key in rule.inputs) {
                                        newInputValue = [];
                                        rule.inputs[key] = newInputValue;
                                    }
                                }
                            });
                            _updateAnswerGroup(answerGroupIndex, {
                                rules: newRules
                            }, callback);
                        });
                    }
                }
            },
            getAnswerGroups: function () {
                return angular.copy(_answerGroups);
            },
            getAnswerGroup: function (index) {
                return angular.copy(_answerGroups[index]);
            },
            getAnswerGroupCount: function () {
                return _answerGroups.length;
            },
            getDefaultOutcome: function () {
                return angular.copy(_defaultOutcome);
            },
            getConfirmedUnclassifiedAnswers: function () {
                return angular.copy(_confirmedUnclassifiedAnswers);
            },
            // This registers the change to the handlers in the list of changes.
            save: function (newAnswerGroups, defaultOutcome, callback) {
                _saveAnswerGroups(newAnswerGroups);
                _saveDefaultOutcome(defaultOutcome);
                callback(_answerGroupsMemento, _defaultOutcomeMemento);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/solution-validity/solution-validity.service.ts":
/*!*********************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/solution-validity/solution-validity.service.ts ***!
  \*********************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
// Service for keeping track of solution validity.
angular.module('explorationEditorTabModule').factory('SolutionValidityService', [
    function () {
        return {
            init: function (stateNames) {
                this.solutionValidities = {};
                var self = this;
                stateNames.forEach(function (stateName) {
                    self.solutionValidities[stateName] = true;
                });
            },
            onRenameState: function (newStateName, oldStateName) {
                this.solutionValidities[newStateName] =
                    this.solutionValidities[oldStateName];
                this.deleteSolutionValidity(oldStateName);
            },
            updateValidity: function (stateName, solutionIsValid) {
                this.solutionValidities[stateName] = solutionIsValid;
            },
            isSolutionValid: function (stateName) {
                if (this.solutionValidities.hasOwnProperty(stateName)) {
                    return this.solutionValidities[stateName];
                }
            },
            deleteSolutionValidity: function (stateName) {
                delete this.solutionValidities[stateName];
            },
            getAllValidities: function () {
                return this.solutionValidities;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/state-editor/state-editor-properties-services/state-property/state-property.service.ts":
/*!******************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/state-editor/state-editor-properties-services/state-property/state-property.service.ts ***!
  \******************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Standalone services for the general state editor page.
 */
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('stateEditorModule').factory('StatePropertyService', [
    '$log', 'AlertsService',
    function ($log, AlertsService) {
        // Public base API for data services corresponding to state properties
        // (interaction id, content, etc.)
        // WARNING: This should be initialized only in the context of the state
        // editor, and every time the state is loaded, so that proper behavior is
        // maintained if e.g. the state is renamed.
        return {
            init: function (stateName, value) {
                if (this.setterMethodKey === null) {
                    throw 'State property setter method key cannot be null.';
                }
                // The name of the state.
                this.stateName = stateName;
                // The current value of the property (which may not have been saved to
                // the frontend yet). In general, this will be bound directly to the UI.
                this.displayed = angular.copy(value);
                // The previous (saved-in-the-frontend) value of the property. Here,
                // 'saved' means that this is the latest value of the property as
                // determined by the frontend change list.
                this.savedMemento = angular.copy(value);
            },
            // Returns whether the current value has changed from the memento.
            hasChanged: function () {
                return !angular.equals(this.savedMemento, this.displayed);
            },
            // The name of the setter method in ExplorationStatesService for this
            // property. THIS MUST BE SPECIFIED BY SUBCLASSES.
            setterMethodKey: null,
            // Transforms the given value into a normalized form. THIS CAN BE
            // OVERRIDDEN BY SUBCLASSES. The default behavior is to do nothing.
            _normalize: function (value) {
                return value;
            },
            // Validates the given value and returns a boolean stating whether it
            // is valid or not. THIS CAN BE OVERRIDDEN BY SUBCLASSES. The default
            // behavior is to always return true.
            _isValid: function (value) {
                return true;
            },
            // Updates the memento to the displayed value.
            saveDisplayedValue: function () {
                if (this.setterMethodKey === null) {
                    throw 'State property setter method key cannot be null.';
                }
                this.displayed = this._normalize(this.displayed);
                if (!this._isValid(this.displayed) || !this.hasChanged()) {
                    this.restoreFromMemento();
                    return;
                }
                if (angular.equals(this.displayed, this.savedMemento)) {
                    return;
                }
                AlertsService.clearWarnings();
                this.savedMemento = angular.copy(this.displayed);
            },
            // Reverts the displayed value to the saved memento.
            restoreFromMemento: function () {
                this.displayed = angular.copy(this.savedMemento);
            }
        };
    }
]);
oppia.constant('WARNING_TYPES', {
    // These must be fixed before the exploration can be saved.
    CRITICAL: 'critical',
    // These must be fixed before publishing an exploration to the public
    // library.
    ERROR: 'error'
});
oppia.constant('STATE_ERROR_MESSAGES', {
    ADD_INTERACTION: 'Please add an interaction to this card.',
    STATE_UNREACHABLE: 'This card is unreachable.',
    UNABLE_TO_END_EXPLORATION: ('There\'s no way to complete the exploration starting from this card. ' +
        'To fix this, make sure that the last card in the chain starting from ' +
        'this one has an \'End Exploration\' question type.'),
    INCORRECT_SOLUTION: ('The current solution does not lead to another card.'),
    UNRESOLVED_ANSWER: ('There is an answer among the top 10 which has no explicit feedback.')
});


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS1zZXJ2aWNlcy9hbmd1bGFyLW5hbWUvYW5ndWxhci1uYW1lLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi9leHBsb3JhdGlvbi1lZGl0b3ItdGFiLXNlcnZpY2VzL3Jlc3BvbnNlcy5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci10YWIvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi1zZXJ2aWNlcy9zb2x1dGlvbi12YWxpZGl0eS9zb2x1dGlvbi12YWxpZGl0eS5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3N0YXRlLWVkaXRvci9zdGF0ZS1lZGl0b3ItcHJvcGVydGllcy1zZXJ2aWNlcy9zdGF0ZS1wcm9wZXJ0eS9zdGF0ZS1wcm9wZXJ0eS5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDekJMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHdIQUE0QztBQUNwRCxtQkFBTyxDQUFDLDBNQUN5QjtBQUNqQyxtQkFBTyxDQUFDLHlNQUN3QjtBQUNoQyxtQkFBTyxDQUFDLDZNQUM0QjtBQUNwQyxtQkFBTyxDQUFDLHNQQUNrRDtBQUMxRCxtQkFBTyxDQUFDLDROQUN1QjtBQUMvQixtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQyxtQkFBTyxDQUFDLHdGQUE0QjtBQUNwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxzQkFBc0I7QUFDN0QsMkNBQTJDLHNCQUFzQjtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxzQkFBc0I7QUFDN0Q7QUFDQSwyQ0FBMkMsc0JBQXNCO0FBQ2pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzlZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDIiwiZmlsZSI6ImNvbGxlY3Rpb25fZWRpdG9yfnNraWxsX2VkaXRvcn50b3BpY19lZGl0b3IuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBBIHNlcnZpY2UgdGhhdCBtYXBzIElEcyB0byBBbmd1bGFyIG5hbWVzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZXhwbG9yYXRpb25FZGl0b3JQYWdlTW9kdWxlJykuZmFjdG9yeSgnQW5ndWxhck5hbWVTZXJ2aWNlJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFuZ3VsYXJOYW1lID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldE5hbWVPZkludGVyYWN0aW9uUnVsZXNTZXJ2aWNlOiBmdW5jdGlvbiAoaW50ZXJhY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgIGFuZ3VsYXJOYW1lID0gaW50ZXJhY3Rpb25JZC5jaGFyQXQoMCkgK1xuICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbklkLnNsaWNlKDEpICsgJ1J1bGVzU2VydmljZSc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXJOYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSByZXNwb25zZXMgY29ycmVzcG9uZGluZyB0byBhIHN0YXRlJ3MgaW50ZXJhY3Rpb24gYW5kXG4gKiBhbnN3ZXIgZ3JvdXBzLlxuICovXG5yZXF1aXJlKCdkb21haW4vZXhwbG9yYXRpb24vT3V0Y29tZU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci10YWIvJyArXG4gICAgJ0Fuc3dlckdyb3Vwc0NhY2hlU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi8nICtcbiAgICAnU29sdXRpb25WYWxpZGl0eVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci10YWIvJyArXG4gICAgJ1NvbHV0aW9uVmVyaWZpY2F0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi8nICtcbiAgICAnZXhwbG9yYXRpb24tZWRpdG9yLXRhYi1zZXJ2aWNlcy9yZXNwb25zZXMuc2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3RhdGUtZWRpdG9yL3N0YXRlLWVkaXRvci1wcm9wZXJ0aWVzLXNlcnZpY2VzL3N0YXRlLXByb3BlcnR5LycgK1xuICAgICdzdGF0ZS1wcm9wZXJ0eS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Db250ZXh0U2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uRWRpdG9yVGFiTW9kdWxlJykuZmFjdG9yeSgnUmVzcG9uc2VzU2VydmljZScsIFtcbiAgICAnJHJvb3RTY29wZScsICdBbGVydHNTZXJ2aWNlJywgJ0Fuc3dlckdyb3Vwc0NhY2hlU2VydmljZScsXG4gICAgJ0NvbnRleHRTZXJ2aWNlJywgJ091dGNvbWVPYmplY3RGYWN0b3J5JyxcbiAgICAnU29sdXRpb25WYWxpZGl0eVNlcnZpY2UnLCAnU29sdXRpb25WZXJpZmljYXRpb25TZXJ2aWNlJyxcbiAgICAnU3RhdGVFZGl0b3JTZXJ2aWNlJywgJ1N0YXRlSW50ZXJhY3Rpb25JZFNlcnZpY2UnLFxuICAgICdTdGF0ZVNvbHV0aW9uU2VydmljZScsICdDT01QT05FTlRfTkFNRV9ERUZBVUxUX09VVENPTUUnLFxuICAgICdJTkZPX01FU1NBR0VfU09MVVRJT05fSVNfSU5WQUxJRF9GT1JfQ1VSUkVOVF9SVUxFJyxcbiAgICAnSU5GT19NRVNTQUdFX1NPTFVUSU9OX0lTX0lOVkFMSURfRk9SX0VYUExPUkFUSU9OJyxcbiAgICAnSU5GT19NRVNTQUdFX1NPTFVUSU9OX0lTX1ZBTElEJywgJ0lOVEVSQUNUSU9OX1NQRUNTJyxcbiAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQWxlcnRzU2VydmljZSwgQW5zd2VyR3JvdXBzQ2FjaGVTZXJ2aWNlLCBDb250ZXh0U2VydmljZSwgT3V0Y29tZU9iamVjdEZhY3RvcnksIFNvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlLCBTb2x1dGlvblZlcmlmaWNhdGlvblNlcnZpY2UsIFN0YXRlRWRpdG9yU2VydmljZSwgU3RhdGVJbnRlcmFjdGlvbklkU2VydmljZSwgU3RhdGVTb2x1dGlvblNlcnZpY2UsIENPTVBPTkVOVF9OQU1FX0RFRkFVTFRfT1VUQ09NRSwgSU5GT19NRVNTQUdFX1NPTFVUSU9OX0lTX0lOVkFMSURfRk9SX0NVUlJFTlRfUlVMRSwgSU5GT19NRVNTQUdFX1NPTFVUSU9OX0lTX0lOVkFMSURfRk9SX0VYUExPUkFUSU9OLCBJTkZPX01FU1NBR0VfU09MVVRJT05fSVNfVkFMSUQsIElOVEVSQUNUSU9OX1NQRUNTKSB7XG4gICAgICAgIHZhciBfYW5zd2VyR3JvdXBzTWVtZW50byA9IG51bGw7XG4gICAgICAgIHZhciBfZGVmYXVsdE91dGNvbWVNZW1lbnRvID0gbnVsbDtcbiAgICAgICAgdmFyIF9jb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzTWVtZW50byA9IG51bGw7XG4gICAgICAgIC8vIFJlcHJlc2VudHMgdGhlIGN1cnJlbnQgc2VsZWN0ZWQgYW5zd2VyIGdyb3VwLCBzdGFydGluZyBhdCBpbmRleCAwLiBJZiB0aGVcbiAgICAgICAgLy8gaW5kZXggZXF1YWwgdG8gdGhlIG51bWJlciBvZiBhbnN3ZXIgZ3JvdXBzIChhbnN3ZXJHcm91cHMubGVuZ3RoKSwgdGhlbiBpdFxuICAgICAgICAvLyBpcyByZWZlcnJpbmcgdG8gdGhlIGRlZmF1bHQgb3V0Y29tZS5cbiAgICAgICAgdmFyIF9hY3RpdmVBbnN3ZXJHcm91cEluZGV4ID0gbnVsbDtcbiAgICAgICAgdmFyIF9hY3RpdmVSdWxlSW5kZXggPSAtMTtcbiAgICAgICAgdmFyIF9hbnN3ZXJHcm91cHMgPSBudWxsO1xuICAgICAgICB2YXIgX2RlZmF1bHRPdXRjb21lID0gbnVsbDtcbiAgICAgICAgdmFyIF9jb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzID0gbnVsbDtcbiAgICAgICAgdmFyIF9hbnN3ZXJDaG9pY2VzID0gbnVsbDtcbiAgICAgICAgdmFyIF92ZXJpZnlTb2x1dGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgY2hlY2tzIGlmIHRoZSBzb2x1dGlvbiBpcyB2YWxpZCBvbmNlIGEgcnVsZSBoYXMgYmVlbiBjaGFuZ2VkIG9yXG4gICAgICAgICAgICAvLyBhZGRlZC5cbiAgICAgICAgICAgIHZhciBjdXJyZW50SW50ZXJhY3Rpb25JZCA9IFN0YXRlSW50ZXJhY3Rpb25JZFNlcnZpY2Uuc2F2ZWRNZW1lbnRvO1xuICAgICAgICAgICAgdmFyIGludGVyYWN0aW9uQ2FuSGF2ZVNvbHV0aW9uID0gKGN1cnJlbnRJbnRlcmFjdGlvbklkICYmXG4gICAgICAgICAgICAgICAgSU5URVJBQ1RJT05fU1BFQ1NbY3VycmVudEludGVyYWN0aW9uSWRdLmNhbl9oYXZlX3NvbHV0aW9uKTtcbiAgICAgICAgICAgIHZhciBzb2x1dGlvbkV4aXN0cyA9IChTdGF0ZVNvbHV0aW9uU2VydmljZS5zYXZlZE1lbWVudG8gJiZcbiAgICAgICAgICAgICAgICBTdGF0ZVNvbHV0aW9uU2VydmljZS5zYXZlZE1lbWVudG8uY29ycmVjdEFuc3dlciAhPT0gbnVsbCk7XG4gICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb25DYW5IYXZlU29sdXRpb24gJiYgc29sdXRpb25FeGlzdHMpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW50ZXJhY3Rpb24gPSBTdGF0ZUVkaXRvclNlcnZpY2UuZ2V0SW50ZXJhY3Rpb24oKTtcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbi5hbnN3ZXJHcm91cHMgPSBhbmd1bGFyLmNvcHkoX2Fuc3dlckdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uZGVmYXVsdE91dGNvbWUgPSBhbmd1bGFyLmNvcHkoX2RlZmF1bHRPdXRjb21lKTtcbiAgICAgICAgICAgICAgICB2YXIgc29sdXRpb25Jc1ZhbGlkID0gU29sdXRpb25WZXJpZmljYXRpb25TZXJ2aWNlLnZlcmlmeVNvbHV0aW9uKFN0YXRlRWRpdG9yU2VydmljZS5nZXRBY3RpdmVTdGF0ZU5hbWUoKSwgaW50ZXJhY3Rpb24sIFN0YXRlU29sdXRpb25TZXJ2aWNlLnNhdmVkTWVtZW50by5jb3JyZWN0QW5zd2VyKTtcbiAgICAgICAgICAgICAgICBTb2x1dGlvblZhbGlkaXR5U2VydmljZS51cGRhdGVWYWxpZGl0eShTdGF0ZUVkaXRvclNlcnZpY2UuZ2V0QWN0aXZlU3RhdGVOYW1lKCksIHNvbHV0aW9uSXNWYWxpZCk7XG4gICAgICAgICAgICAgICAgdmFyIHNvbHV0aW9uV2FzUHJldmlvdXNseVZhbGlkID0gKFNvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlLmlzU29sdXRpb25WYWxpZChTdGF0ZUVkaXRvclNlcnZpY2UuZ2V0QWN0aXZlU3RhdGVOYW1lKCkpKTtcbiAgICAgICAgICAgICAgICBpZiAoc29sdXRpb25Jc1ZhbGlkICYmICFzb2x1dGlvbldhc1ByZXZpb3VzbHlWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZEluZm9NZXNzYWdlKElORk9fTUVTU0FHRV9TT0xVVElPTl9JU19WQUxJRCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFzb2x1dGlvbklzVmFsaWQgJiYgc29sdXRpb25XYXNQcmV2aW91c2x5VmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRJbmZvTWVzc2FnZShJTkZPX01FU1NBR0VfU09MVVRJT05fSVNfSU5WQUxJRF9GT1JfQ1VSUkVOVF9SVUxFKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIXNvbHV0aW9uSXNWYWxpZCAmJiAhc29sdXRpb25XYXNQcmV2aW91c2x5VmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRJbmZvTWVzc2FnZShJTkZPX01FU1NBR0VfU09MVVRJT05fSVNfSU5WQUxJRF9GT1JfRVhQTE9SQVRJT04pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9zYXZlQW5zd2VyR3JvdXBzID0gZnVuY3Rpb24gKG5ld0Fuc3dlckdyb3Vwcykge1xuICAgICAgICAgICAgdmFyIG9sZEFuc3dlckdyb3VwcyA9IF9hbnN3ZXJHcm91cHNNZW1lbnRvO1xuICAgICAgICAgICAgaWYgKG5ld0Fuc3dlckdyb3VwcyAmJiBvbGRBbnN3ZXJHcm91cHMgJiZcbiAgICAgICAgICAgICAgICAhYW5ndWxhci5lcXVhbHMobmV3QW5zd2VyR3JvdXBzLCBvbGRBbnN3ZXJHcm91cHMpKSB7XG4gICAgICAgICAgICAgICAgX2Fuc3dlckdyb3VwcyA9IG5ld0Fuc3dlckdyb3VwcztcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2Fuc3dlckdyb3VwQ2hhbmdlZCcsIG5ld0Fuc3dlckdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgX3ZlcmlmeVNvbHV0aW9uKCk7XG4gICAgICAgICAgICAgICAgX2Fuc3dlckdyb3Vwc01lbWVudG8gPSBhbmd1bGFyLmNvcHkobmV3QW5zd2VyR3JvdXBzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF91cGRhdGVBbnN3ZXJHcm91cCA9IGZ1bmN0aW9uIChpbmRleCwgdXBkYXRlcywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBhbnN3ZXJHcm91cCA9IF9hbnN3ZXJHcm91cHNbaW5kZXhdO1xuICAgICAgICAgICAgaWYgKHVwZGF0ZXMuaGFzT3duUHJvcGVydHkoJ3J1bGVzJykpIHtcbiAgICAgICAgICAgICAgICBhbnN3ZXJHcm91cC5ydWxlcyA9IHVwZGF0ZXMucnVsZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodXBkYXRlcy5oYXNPd25Qcm9wZXJ0eSgndGFnZ2VkTWlzY29uY2VwdGlvbklkJykpIHtcbiAgICAgICAgICAgICAgICBhbnN3ZXJHcm91cC50YWdnZWRNaXNjb25jZXB0aW9uSWQgPSB1cGRhdGVzLnRhZ2dlZE1pc2NvbmNlcHRpb25JZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1cGRhdGVzLmhhc093blByb3BlcnR5KCdmZWVkYmFjaycpKSB7XG4gICAgICAgICAgICAgICAgYW5zd2VyR3JvdXAub3V0Y29tZS5mZWVkYmFjayA9IHVwZGF0ZXMuZmVlZGJhY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodXBkYXRlcy5oYXNPd25Qcm9wZXJ0eSgnZGVzdCcpKSB7XG4gICAgICAgICAgICAgICAgYW5zd2VyR3JvdXAub3V0Y29tZS5kZXN0ID0gdXBkYXRlcy5kZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVwZGF0ZXMuaGFzT3duUHJvcGVydHkoJ3JlZnJlc2hlckV4cGxvcmF0aW9uSWQnKSkge1xuICAgICAgICAgICAgICAgIGFuc3dlckdyb3VwLm91dGNvbWUucmVmcmVzaGVyRXhwbG9yYXRpb25JZCA9ICh1cGRhdGVzLnJlZnJlc2hlckV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVwZGF0ZXMuaGFzT3duUHJvcGVydHkoJ21pc3NpbmdQcmVyZXF1aXNpdGVTa2lsbElkJykpIHtcbiAgICAgICAgICAgICAgICBhbnN3ZXJHcm91cC5vdXRjb21lLm1pc3NpbmdQcmVyZXF1aXNpdGVTa2lsbElkID0gKHVwZGF0ZXMubWlzc2luZ1ByZXJlcXVpc2l0ZVNraWxsSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVwZGF0ZXMuaGFzT3duUHJvcGVydHkoJ2xhYmVsbGVkQXNDb3JyZWN0JykpIHtcbiAgICAgICAgICAgICAgICBhbnN3ZXJHcm91cC5vdXRjb21lLmxhYmVsbGVkQXNDb3JyZWN0ID0gdXBkYXRlcy5sYWJlbGxlZEFzQ29ycmVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1cGRhdGVzLmhhc093blByb3BlcnR5KCd0cmFpbmluZ0RhdGEnKSkge1xuICAgICAgICAgICAgICAgIGFuc3dlckdyb3VwLnRyYWluaW5nRGF0YSA9IHVwZGF0ZXMudHJhaW5pbmdEYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3NhdmVBbnN3ZXJHcm91cHMoX2Fuc3dlckdyb3Vwcyk7XG4gICAgICAgICAgICBjYWxsYmFjayhfYW5zd2VyR3JvdXBzTWVtZW50byk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfc2F2ZURlZmF1bHRPdXRjb21lID0gZnVuY3Rpb24gKG5ld0RlZmF1bHRPdXRjb21lKSB7XG4gICAgICAgICAgICB2YXIgb2xkRGVmYXVsdE91dGNvbWUgPSBfZGVmYXVsdE91dGNvbWVNZW1lbnRvO1xuICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmVxdWFscyhuZXdEZWZhdWx0T3V0Y29tZSwgb2xkRGVmYXVsdE91dGNvbWUpKSB7XG4gICAgICAgICAgICAgICAgX2RlZmF1bHRPdXRjb21lID0gbmV3RGVmYXVsdE91dGNvbWU7XG4gICAgICAgICAgICAgICAgX3ZlcmlmeVNvbHV0aW9uKCk7XG4gICAgICAgICAgICAgICAgX2RlZmF1bHRPdXRjb21lTWVtZW50byA9IGFuZ3VsYXIuY29weShuZXdEZWZhdWx0T3V0Y29tZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfc2F2ZUNvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMgPSBmdW5jdGlvbiAobmV3Q29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2Vycykge1xuICAgICAgICAgICAgdmFyIG9sZENvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMgPSAoX2NvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnNNZW1lbnRvKTtcbiAgICAgICAgICAgIGlmICghYW5ndWxhci5lcXVhbHMobmV3Q29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2Vycywgb2xkQ29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2VycykpIHtcbiAgICAgICAgICAgICAgICBfY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2VycyA9IG5ld0NvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnM7XG4gICAgICAgICAgICAgICAgX2NvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnNNZW1lbnRvID0gYW5ndWxhci5jb3B5KG5ld0NvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gVGhlICdkYXRhJyBhcmcgaXMgYSBsaXN0IG9mIGludGVyYWN0aW9uIGhhbmRsZXJzIGZvciB0aGVcbiAgICAgICAgICAgIC8vIGN1cnJlbnRseS1hY3RpdmUgc3RhdGUuXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIEFuc3dlckdyb3Vwc0NhY2hlU2VydmljZS5yZXNldCgpO1xuICAgICAgICAgICAgICAgIF9hbnN3ZXJHcm91cHMgPSBhbmd1bGFyLmNvcHkoZGF0YS5hbnN3ZXJHcm91cHMpO1xuICAgICAgICAgICAgICAgIF9kZWZhdWx0T3V0Y29tZSA9IGFuZ3VsYXIuY29weShkYXRhLmRlZmF1bHRPdXRjb21lKTtcbiAgICAgICAgICAgICAgICBfY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2VycyA9IGFuZ3VsYXIuY29weShkYXRhLmNvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMpO1xuICAgICAgICAgICAgICAgIGlmIChTdGF0ZUludGVyYWN0aW9uSWRTZXJ2aWNlLnNhdmVkTWVtZW50byAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBBbnN3ZXJHcm91cHNDYWNoZVNlcnZpY2Uuc2V0KFN0YXRlSW50ZXJhY3Rpb25JZFNlcnZpY2Uuc2F2ZWRNZW1lbnRvLCBfYW5zd2VyR3JvdXBzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX2Fuc3dlckdyb3Vwc01lbWVudG8gPSBhbmd1bGFyLmNvcHkoX2Fuc3dlckdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgX2RlZmF1bHRPdXRjb21lTWVtZW50byA9IGFuZ3VsYXIuY29weShfZGVmYXVsdE91dGNvbWUpO1xuICAgICAgICAgICAgICAgIF9jb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzTWVtZW50byA9IGFuZ3VsYXIuY29weShfY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2Vycyk7XG4gICAgICAgICAgICAgICAgX2FjdGl2ZUFuc3dlckdyb3VwSW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICBfYWN0aXZlUnVsZUluZGV4ID0gMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkludGVyYWN0aW9uSWRDaGFuZ2VkOiBmdW5jdGlvbiAobmV3SW50ZXJhY3Rpb25JZCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoQW5zd2VyR3JvdXBzQ2FjaGVTZXJ2aWNlLmNvbnRhaW5zKG5ld0ludGVyYWN0aW9uSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIF9hbnN3ZXJHcm91cHMgPSBBbnN3ZXJHcm91cHNDYWNoZVNlcnZpY2UuZ2V0KG5ld0ludGVyYWN0aW9uSWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgX2Fuc3dlckdyb3VwcyA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBQcmVzZXJ2ZSB0aGUgZGVmYXVsdCBvdXRjb21lIHVubGVzcyB0aGUgaW50ZXJhY3Rpb24gaXMgdGVybWluYWwuXG4gICAgICAgICAgICAgICAgLy8gUmVjcmVhdGUgdGhlIGRlZmF1bHQgb3V0Y29tZSBpZiBzd2l0Y2hpbmcgYXdheSBmcm9tIGEgdGVybWluYWxcbiAgICAgICAgICAgICAgICAvLyBpbnRlcmFjdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAobmV3SW50ZXJhY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoSU5URVJBQ1RJT05fU1BFQ1NbbmV3SW50ZXJhY3Rpb25JZF0uaXNfdGVybWluYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9kZWZhdWx0T3V0Y29tZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIV9kZWZhdWx0T3V0Y29tZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2RlZmF1bHRPdXRjb21lID0gT3V0Y29tZU9iamVjdEZhY3RvcnkuY3JlYXRlTmV3KFN0YXRlRWRpdG9yU2VydmljZS5nZXRBY3RpdmVTdGF0ZU5hbWUoKSwgQ09NUE9ORU5UX05BTUVfREVGQVVMVF9PVVRDT01FLCAnJywgW10pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9jb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzID0gW107XG4gICAgICAgICAgICAgICAgX3NhdmVBbnN3ZXJHcm91cHMoX2Fuc3dlckdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgX3NhdmVEZWZhdWx0T3V0Y29tZShfZGVmYXVsdE91dGNvbWUpO1xuICAgICAgICAgICAgICAgIF9zYXZlQ29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2VycyhfY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2Vycyk7XG4gICAgICAgICAgICAgICAgaWYgKG5ld0ludGVyYWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgQW5zd2VyR3JvdXBzQ2FjaGVTZXJ2aWNlLnNldChuZXdJbnRlcmFjdGlvbklkLCBfYW5zd2VyR3JvdXBzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX2Fuc3dlckdyb3Vwc01lbWVudG8gPSBhbmd1bGFyLmNvcHkoX2Fuc3dlckdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgX2RlZmF1bHRPdXRjb21lTWVtZW50byA9IGFuZ3VsYXIuY29weShfZGVmYXVsdE91dGNvbWUpO1xuICAgICAgICAgICAgICAgIF9jb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzTWVtZW50byA9IGFuZ3VsYXIuY29weShfY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2Vycyk7XG4gICAgICAgICAgICAgICAgX2FjdGl2ZUFuc3dlckdyb3VwSW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICBfYWN0aXZlUnVsZUluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soX2Fuc3dlckdyb3Vwc01lbWVudG8sIF9kZWZhdWx0T3V0Y29tZU1lbWVudG8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBY3RpdmVBbnN3ZXJHcm91cEluZGV4OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9hY3RpdmVBbnN3ZXJHcm91cEluZGV4O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoYW5nZUFjdGl2ZUFuc3dlckdyb3VwSW5kZXg6IGZ1bmN0aW9uIChuZXdJbmRleCkge1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBjdXJyZW50IGdyb3VwIGlzIGJlaW5nIGNsaWNrZWQgb24gYWdhaW4sIGNsb3NlIGl0LlxuICAgICAgICAgICAgICAgIGlmIChuZXdJbmRleCA9PT0gX2FjdGl2ZUFuc3dlckdyb3VwSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgX2FjdGl2ZUFuc3dlckdyb3VwSW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIF9hY3RpdmVBbnN3ZXJHcm91cEluZGV4ID0gbmV3SW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9hY3RpdmVSdWxlSW5kZXggPSAtMTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBY3RpdmVSdWxlSW5kZXg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2FjdGl2ZVJ1bGVJbmRleDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjaGFuZ2VBY3RpdmVSdWxlSW5kZXg6IGZ1bmN0aW9uIChuZXdJbmRleCkge1xuICAgICAgICAgICAgICAgIF9hY3RpdmVSdWxlSW5kZXggPSBuZXdJbmRleDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBbnN3ZXJDaG9pY2VzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weShfYW5zd2VyQ2hvaWNlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBkYXRlQW5zd2VyR3JvdXA6IGZ1bmN0aW9uIChpbmRleCwgdXBkYXRlcywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBfdXBkYXRlQW5zd2VyR3JvdXAoaW5kZXgsIHVwZGF0ZXMsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWxldGVBbnN3ZXJHcm91cDogZnVuY3Rpb24gKGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIF9hbnN3ZXJHcm91cHNNZW1lbnRvID0gYW5ndWxhci5jb3B5KF9hbnN3ZXJHcm91cHMpO1xuICAgICAgICAgICAgICAgIF9hbnN3ZXJHcm91cHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICBfYWN0aXZlQW5zd2VyR3JvdXBJbmRleCA9IC0xO1xuICAgICAgICAgICAgICAgIF9zYXZlQW5zd2VyR3JvdXBzKF9hbnN3ZXJHcm91cHMpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKF9hbnN3ZXJHcm91cHNNZW1lbnRvKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGRhdGVBY3RpdmVBbnN3ZXJHcm91cDogZnVuY3Rpb24gKHVwZGF0ZXMsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgX3VwZGF0ZUFuc3dlckdyb3VwKF9hY3RpdmVBbnN3ZXJHcm91cEluZGV4LCB1cGRhdGVzLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBkYXRlRGVmYXVsdE91dGNvbWU6IGZ1bmN0aW9uICh1cGRhdGVzLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHZhciBvdXRjb21lID0gX2RlZmF1bHRPdXRjb21lO1xuICAgICAgICAgICAgICAgIGlmICh1cGRhdGVzLmhhc093blByb3BlcnR5KCdmZWVkYmFjaycpKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dGNvbWUuZmVlZGJhY2sgPSB1cGRhdGVzLmZlZWRiYWNrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodXBkYXRlcy5oYXNPd25Qcm9wZXJ0eSgnZGVzdCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dGNvbWUuZGVzdCA9IHVwZGF0ZXMuZGVzdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHVwZGF0ZXMuaGFzT3duUHJvcGVydHkoJ3JlZnJlc2hlckV4cGxvcmF0aW9uSWQnKSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRjb21lLnJlZnJlc2hlckV4cGxvcmF0aW9uSWQgPSB1cGRhdGVzLnJlZnJlc2hlckV4cGxvcmF0aW9uSWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh1cGRhdGVzLmhhc093blByb3BlcnR5KCdtaXNzaW5nUHJlcmVxdWlzaXRlU2tpbGxJZCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dGNvbWUubWlzc2luZ1ByZXJlcXVpc2l0ZVNraWxsSWQgPVxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlcy5taXNzaW5nUHJlcmVxdWlzaXRlU2tpbGxJZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHVwZGF0ZXMuaGFzT3duUHJvcGVydHkoJ2xhYmVsbGVkQXNDb3JyZWN0JykpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0Y29tZS5sYWJlbGxlZEFzQ29ycmVjdCA9IHVwZGF0ZXMubGFiZWxsZWRBc0NvcnJlY3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9zYXZlRGVmYXVsdE91dGNvbWUob3V0Y29tZSk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soX2RlZmF1bHRPdXRjb21lTWVtZW50byk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBkYXRlQ29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2VyczogZnVuY3Rpb24gKGNvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMpIHtcbiAgICAgICAgICAgICAgICBfc2F2ZUNvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMoY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2Vycyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gVXBkYXRlcyBhbnN3ZXIgY2hvaWNlcyB3aGVuIHRoZSBpbnRlcmFjdGlvbiByZXF1aXJlcyBpdCAtLSBmb3JcbiAgICAgICAgICAgIC8vIGV4YW1wbGUsIHRoZSBydWxlcyBmb3IgbXVsdGlwbGUgY2hvaWNlIG5lZWQgdG8gcmVmZXIgdG8gdGhlIG11bHRpcGxlXG4gICAgICAgICAgICAvLyBjaG9pY2UgaW50ZXJhY3Rpb24ncyBjdXN0b21pemF0aW9uIGFyZ3VtZW50cy5cbiAgICAgICAgICAgIHVwZGF0ZUFuc3dlckNob2ljZXM6IGZ1bmN0aW9uIChuZXdBbnN3ZXJDaG9pY2VzLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHZhciBvbGRBbnN3ZXJDaG9pY2VzID0gYW5ndWxhci5jb3B5KF9hbnN3ZXJDaG9pY2VzKTtcbiAgICAgICAgICAgICAgICBfYW5zd2VyQ2hvaWNlcyA9IG5ld0Fuc3dlckNob2ljZXM7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGludGVyYWN0aW9uIGlzIEl0ZW1TZWxlY3Rpb25JbnB1dCwgdXBkYXRlIHRoZSBhbnN3ZXIgZ3JvdXBzXG4gICAgICAgICAgICAgICAgLy8gdG8gcmVmZXIgdG8gdGhlIG5ldyBhbnN3ZXIgb3B0aW9ucy5cbiAgICAgICAgICAgICAgICBpZiAoU3RhdGVJbnRlcmFjdGlvbklkU2VydmljZS5zYXZlZE1lbWVudG8gPT09ICdJdGVtU2VsZWN0aW9uSW5wdXQnICYmXG4gICAgICAgICAgICAgICAgICAgIG9sZEFuc3dlckNob2ljZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgdXNlIGFuIGFwcHJveGltYXRlIGFsZ29yaXRobSBoZXJlLiBJZiB0aGUgbGVuZ3RoIG9mIHRoZSBhbnN3ZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gY2hvaWNlcyBhcnJheSByZW1haW5zIHRoZSBzYW1lLCBhbmQgbm8gY2hvaWNlIGlzIHJlcGxpY2F0ZWQgYXRcbiAgICAgICAgICAgICAgICAgICAgLy8gZGlmZmVyZW50IGluZGljZXMgaW4gYm90aCBhcnJheXMgKHdoaWNoIGluZGljYXRlcyB0aGF0IHNvbWVcbiAgICAgICAgICAgICAgICAgICAgLy8gbW92aW5nLWFyb3VuZCBoYXBwZW5lZCksIHRoZW4gcmVwbGFjZSBhbnkgb2xkIGNob2ljZSB3aXRoIGl0c1xuICAgICAgICAgICAgICAgICAgICAvLyBjb3JyZXNwb25kaW5nIG5ldyBjaG9pY2UuIE90aGVyd2lzZSwgd2Ugc2ltcGx5IHJlbW92ZSBhbnkgYW5zd2VyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoYXQgaGFzIG5vdCBiZWVuIGNoYW5nZWQuIFRoaXMgaXMgbm90IGZvb2xwcm9vZiwgYnV0IGl0IHNob3VsZFxuICAgICAgICAgICAgICAgICAgICAvLyBjb3ZlciBtb3N0IGNhc2VzLlxuICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPKHNsbCk6IEZpbmQgYSB3YXkgdG8gbWFrZSB0aGlzIGZ1bGx5IGRldGVybWluaXN0aWMuIFRoaXMgY2FuXG4gICAgICAgICAgICAgICAgICAgIC8vIHByb2JhYmx5IG9ubHkgb2NjdXIgYWZ0ZXIgd2Ugc3VwcG9ydCBjdXN0b20gZWRpdG9ycyBmb3JcbiAgICAgICAgICAgICAgICAgICAgLy8gaW50ZXJhY3Rpb25zLlxuICAgICAgICAgICAgICAgICAgICB2YXIgb25seUVkaXRzSGFwcGVuZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZEFuc3dlckNob2ljZXMubGVuZ3RoID09PSBuZXdBbnN3ZXJDaG9pY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb25seUVkaXRzSGFwcGVuZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhhdCBubyBhbnN3ZXIgY2hvaWNlIGFwcGVhcnMgdG8gaGF2ZSBiZWVuIG1vdmVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG51bUFuc3dlckNob2ljZXMgPSBvbGRBbnN3ZXJDaG9pY2VzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtQW5zd2VyQ2hvaWNlczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBudW1BbnN3ZXJDaG9pY2VzOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT09IGogJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZEFuc3dlckNob2ljZXNbaV0udmFsID09PSBuZXdBbnN3ZXJDaG9pY2VzW2pdLnZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25seUVkaXRzSGFwcGVuZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRDaG9pY2VTdHJpbmdzID0gb2xkQW5zd2VyQ2hvaWNlcy5tYXAoZnVuY3Rpb24gKGNob2ljZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNob2ljZS52YWw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Q2hvaWNlU3RyaW5ncyA9IG5ld0Fuc3dlckNob2ljZXMubWFwKGZ1bmN0aW9uIChjaG9pY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjaG9pY2UudmFsO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSwgbmV3SW5wdXRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgX2Fuc3dlckdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChhbnN3ZXJHcm91cCwgYW5zd2VyR3JvdXBJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld1J1bGVzID0gYW5ndWxhci5jb3B5KGFuc3dlckdyb3VwLnJ1bGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1J1bGVzLmZvckVhY2goZnVuY3Rpb24gKHJ1bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBydWxlLmlucHV0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnB1dFZhbHVlID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGUuaW5wdXRzW2tleV0uZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0luZGV4ID0gbmV3Q2hvaWNlU3RyaW5ncy5pbmRleE9mKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld0luZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0lucHV0VmFsdWUucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ubHlFZGl0c0hhcHBlbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9sZEluZGV4ID0gb2xkQ2hvaWNlU3RyaW5ncy5pbmRleE9mKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbGRJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5wdXRWYWx1ZS5wdXNoKG5ld0Fuc3dlckNob2ljZXNbb2xkSW5kZXhdLnZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVsZS5pbnB1dHNba2V5XSA9IG5ld0lucHV0VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdXBkYXRlQW5zd2VyR3JvdXAoYW5zd2VyR3JvdXBJbmRleCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGVzOiBuZXdSdWxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGludGVyYWN0aW9uIGlzIERyYWdBbmREcm9wU29ydElucHV0LCB1cGRhdGUgdGhlIGFuc3dlciBncm91cHNcbiAgICAgICAgICAgICAgICAvLyB0byByZWZlciB0byB0aGUgbmV3IGFuc3dlciBvcHRpb25zLlxuICAgICAgICAgICAgICAgIGlmIChTdGF0ZUludGVyYWN0aW9uSWRTZXJ2aWNlLnNhdmVkTWVtZW50byA9PT0gJ0RyYWdBbmREcm9wU29ydElucHV0JyAmJlxuICAgICAgICAgICAgICAgICAgICBvbGRBbnN3ZXJDaG9pY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBsZW5ndGggb2YgdGhlIGFuc3dlciBjaG9pY2VzIGFycmF5IGNoYW5nZXMsIHRoZW4gdGhlcmUgaXNcbiAgICAgICAgICAgICAgICAgICAgLy8gc3VyZWx5IGFueSBkZWxldGlvbiBvciBtb2RpZmljYXRpb24gb3IgYWRkaXRpb24gaW4gdGhlIGFycmF5LiBXZVxuICAgICAgICAgICAgICAgICAgICAvLyBzaW1wbHkgc2V0IGFuc3dlciBncm91cHMgdG8gcmVmZXIgdG8gZGVmYXVsdCB2YWx1ZS4gSWYgdGhlIGxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAvLyBvZiB0aGUgYW5zd2VyIGNob2ljZXMgYXJyYXkgcmVtYWlucyB0aGUgc2FtZSBhbmQgYWxsIHRoZSBjaG9pY2VzIGluXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBwcmV2aW91cyBhcnJheSBhcmUgcHJlc2VudCwgdGhlbiBubyBjaGFuZ2UgaXMgcmVxdWlyZWQuXG4gICAgICAgICAgICAgICAgICAgIC8vIEhvd2V2ZXIsIGlmIGFueSBvZiB0aGUgY2hvaWNlcyBpcyBub3QgcHJlc2VudCwgd2Ugc2V0IGFuc3dlciBncm91cHNcbiAgICAgICAgICAgICAgICAgICAgLy8gdG8gcmVmZXIgdG8gdGhlIGRlZmF1bHQgdmFsdWUgY29udGFpbmluZyBuZXcgYW5zd2VyIGNob2ljZXMuXG4gICAgICAgICAgICAgICAgICAgIHZhciBhbnlDaGFuZ2VzSGFwcGVuZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZEFuc3dlckNob2ljZXMubGVuZ3RoICE9PSBuZXdBbnN3ZXJDaG9pY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYW55Q2hhbmdlc0hhcHBlbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIGFueSBtb2RpZmljYXRpb24gaGFwcGVuZWQgaW4gYW5zd2VyIGNob2ljZXMuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbnVtQW5zd2VyQ2hvaWNlcyA9IG9sZEFuc3dlckNob2ljZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1BbnN3ZXJDaG9pY2VzOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hvaWNlSXNQcmVzZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBudW1BbnN3ZXJDaG9pY2VzOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9sZEFuc3dlckNob2ljZXNbaV0udmFsID09PSBuZXdBbnN3ZXJDaG9pY2VzW2pdLnZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hvaWNlSXNQcmVzZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaG9pY2VJc1ByZXNlbnQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFueUNoYW5nZXNIYXBwZW5lZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoYW55Q2hhbmdlc0hhcHBlbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfYW5zd2VyR3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGFuc3dlckdyb3VwLCBhbnN3ZXJHcm91cEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld1J1bGVzID0gYW5ndWxhci5jb3B5KGFuc3dlckdyb3VwLnJ1bGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdSdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChydWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChydWxlLnR5cGUgPT09ICdIYXNFbGVtZW50WEF0UG9zaXRpb25ZJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gcnVsZS5pbnB1dHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnB1dFZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ3knKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0lucHV0VmFsdWUgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydWxlLmlucHV0c1trZXldID0gbmV3SW5wdXRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChydWxlLnR5cGUgPT09ICdIYXNFbGVtZW50WEJlZm9yZUVsZW1lbnRZJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gcnVsZS5pbnB1dHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnB1dFZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVsZS5pbnB1dHNba2V5XSA9IG5ld0lucHV0VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBydWxlLmlucHV0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0lucHV0VmFsdWUgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydWxlLmlucHV0c1trZXldID0gbmV3SW5wdXRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF91cGRhdGVBbnN3ZXJHcm91cChhbnN3ZXJHcm91cEluZGV4LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGVzOiBuZXdSdWxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEFuc3dlckdyb3VwczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkoX2Fuc3dlckdyb3Vwcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0QW5zd2VyR3JvdXA6IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkoX2Fuc3dlckdyb3Vwc1tpbmRleF0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEFuc3dlckdyb3VwQ291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2Fuc3dlckdyb3Vwcy5sZW5ndGg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0RGVmYXVsdE91dGNvbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KF9kZWZhdWx0T3V0Y29tZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0Q29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2VyczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkoX2NvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFRoaXMgcmVnaXN0ZXJzIHRoZSBjaGFuZ2UgdG8gdGhlIGhhbmRsZXJzIGluIHRoZSBsaXN0IG9mIGNoYW5nZXMuXG4gICAgICAgICAgICBzYXZlOiBmdW5jdGlvbiAobmV3QW5zd2VyR3JvdXBzLCBkZWZhdWx0T3V0Y29tZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBfc2F2ZUFuc3dlckdyb3VwcyhuZXdBbnN3ZXJHcm91cHMpO1xuICAgICAgICAgICAgICAgIF9zYXZlRGVmYXVsdE91dGNvbWUoZGVmYXVsdE91dGNvbWUpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKF9hbnN3ZXJHcm91cHNNZW1lbnRvLCBfZGVmYXVsdE91dGNvbWVNZW1lbnRvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vLyBTZXJ2aWNlIGZvciBrZWVwaW5nIHRyYWNrIG9mIHNvbHV0aW9uIHZhbGlkaXR5LlxuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uRWRpdG9yVGFiTW9kdWxlJykuZmFjdG9yeSgnU29sdXRpb25WYWxpZGl0eVNlcnZpY2UnLCBbXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24gKHN0YXRlTmFtZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNvbHV0aW9uVmFsaWRpdGllcyA9IHt9O1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICBzdGF0ZU5hbWVzLmZvckVhY2goZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNvbHV0aW9uVmFsaWRpdGllc1tzdGF0ZU5hbWVdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblJlbmFtZVN0YXRlOiBmdW5jdGlvbiAobmV3U3RhdGVOYW1lLCBvbGRTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNvbHV0aW9uVmFsaWRpdGllc1tuZXdTdGF0ZU5hbWVdID1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zb2x1dGlvblZhbGlkaXRpZXNbb2xkU3RhdGVOYW1lXTtcbiAgICAgICAgICAgICAgICB0aGlzLmRlbGV0ZVNvbHV0aW9uVmFsaWRpdHkob2xkU3RhdGVOYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGRhdGVWYWxpZGl0eTogZnVuY3Rpb24gKHN0YXRlTmFtZSwgc29sdXRpb25Jc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zb2x1dGlvblZhbGlkaXRpZXNbc3RhdGVOYW1lXSA9IHNvbHV0aW9uSXNWYWxpZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc1NvbHV0aW9uVmFsaWQ6IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zb2x1dGlvblZhbGlkaXRpZXMuaGFzT3duUHJvcGVydHkoc3RhdGVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zb2x1dGlvblZhbGlkaXRpZXNbc3RhdGVOYW1lXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsZXRlU29sdXRpb25WYWxpZGl0eTogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnNvbHV0aW9uVmFsaWRpdGllc1tzdGF0ZU5hbWVdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEFsbFZhbGlkaXRpZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zb2x1dGlvblZhbGlkaXRpZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFN0YW5kYWxvbmUgc2VydmljZXMgZm9yIHRoZSBnZW5lcmFsIHN0YXRlIGVkaXRvciBwYWdlLlxuICovXG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnc3RhdGVFZGl0b3JNb2R1bGUnKS5mYWN0b3J5KCdTdGF0ZVByb3BlcnR5U2VydmljZScsIFtcbiAgICAnJGxvZycsICdBbGVydHNTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJGxvZywgQWxlcnRzU2VydmljZSkge1xuICAgICAgICAvLyBQdWJsaWMgYmFzZSBBUEkgZm9yIGRhdGEgc2VydmljZXMgY29ycmVzcG9uZGluZyB0byBzdGF0ZSBwcm9wZXJ0aWVzXG4gICAgICAgIC8vIChpbnRlcmFjdGlvbiBpZCwgY29udGVudCwgZXRjLilcbiAgICAgICAgLy8gV0FSTklORzogVGhpcyBzaG91bGQgYmUgaW5pdGlhbGl6ZWQgb25seSBpbiB0aGUgY29udGV4dCBvZiB0aGUgc3RhdGVcbiAgICAgICAgLy8gZWRpdG9yLCBhbmQgZXZlcnkgdGltZSB0aGUgc3RhdGUgaXMgbG9hZGVkLCBzbyB0aGF0IHByb3BlciBiZWhhdmlvciBpc1xuICAgICAgICAvLyBtYWludGFpbmVkIGlmIGUuZy4gdGhlIHN0YXRlIGlzIHJlbmFtZWQuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiAoc3RhdGVOYW1lLCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNldHRlck1ldGhvZEtleSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnU3RhdGUgcHJvcGVydHkgc2V0dGVyIG1ldGhvZCBrZXkgY2Fubm90IGJlIG51bGwuJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gVGhlIG5hbWUgb2YgdGhlIHN0YXRlLlxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGVOYW1lID0gc3RhdGVOYW1lO1xuICAgICAgICAgICAgICAgIC8vIFRoZSBjdXJyZW50IHZhbHVlIG9mIHRoZSBwcm9wZXJ0eSAod2hpY2ggbWF5IG5vdCBoYXZlIGJlZW4gc2F2ZWQgdG9cbiAgICAgICAgICAgICAgICAvLyB0aGUgZnJvbnRlbmQgeWV0KS4gSW4gZ2VuZXJhbCwgdGhpcyB3aWxsIGJlIGJvdW5kIGRpcmVjdGx5IHRvIHRoZSBVSS5cbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXllZCA9IGFuZ3VsYXIuY29weSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgLy8gVGhlIHByZXZpb3VzIChzYXZlZC1pbi10aGUtZnJvbnRlbmQpIHZhbHVlIG9mIHRoZSBwcm9wZXJ0eS4gSGVyZSxcbiAgICAgICAgICAgICAgICAvLyAnc2F2ZWQnIG1lYW5zIHRoYXQgdGhpcyBpcyB0aGUgbGF0ZXN0IHZhbHVlIG9mIHRoZSBwcm9wZXJ0eSBhc1xuICAgICAgICAgICAgICAgIC8vIGRldGVybWluZWQgYnkgdGhlIGZyb250ZW5kIGNoYW5nZSBsaXN0LlxuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZWRNZW1lbnRvID0gYW5ndWxhci5jb3B5KHZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBSZXR1cm5zIHdoZXRoZXIgdGhlIGN1cnJlbnQgdmFsdWUgaGFzIGNoYW5nZWQgZnJvbSB0aGUgbWVtZW50by5cbiAgICAgICAgICAgIGhhc0NoYW5nZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIWFuZ3VsYXIuZXF1YWxzKHRoaXMuc2F2ZWRNZW1lbnRvLCB0aGlzLmRpc3BsYXllZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gVGhlIG5hbWUgb2YgdGhlIHNldHRlciBtZXRob2QgaW4gRXhwbG9yYXRpb25TdGF0ZXNTZXJ2aWNlIGZvciB0aGlzXG4gICAgICAgICAgICAvLyBwcm9wZXJ0eS4gVEhJUyBNVVNUIEJFIFNQRUNJRklFRCBCWSBTVUJDTEFTU0VTLlxuICAgICAgICAgICAgc2V0dGVyTWV0aG9kS2V5OiBudWxsLFxuICAgICAgICAgICAgLy8gVHJhbnNmb3JtcyB0aGUgZ2l2ZW4gdmFsdWUgaW50byBhIG5vcm1hbGl6ZWQgZm9ybS4gVEhJUyBDQU4gQkVcbiAgICAgICAgICAgIC8vIE9WRVJSSURERU4gQlkgU1VCQ0xBU1NFUy4gVGhlIGRlZmF1bHQgYmVoYXZpb3IgaXMgdG8gZG8gbm90aGluZy5cbiAgICAgICAgICAgIF9ub3JtYWxpemU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBWYWxpZGF0ZXMgdGhlIGdpdmVuIHZhbHVlIGFuZCByZXR1cm5zIGEgYm9vbGVhbiBzdGF0aW5nIHdoZXRoZXIgaXRcbiAgICAgICAgICAgIC8vIGlzIHZhbGlkIG9yIG5vdC4gVEhJUyBDQU4gQkUgT1ZFUlJJRERFTiBCWSBTVUJDTEFTU0VTLiBUaGUgZGVmYXVsdFxuICAgICAgICAgICAgLy8gYmVoYXZpb3IgaXMgdG8gYWx3YXlzIHJldHVybiB0cnVlLlxuICAgICAgICAgICAgX2lzVmFsaWQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFVwZGF0ZXMgdGhlIG1lbWVudG8gdG8gdGhlIGRpc3BsYXllZCB2YWx1ZS5cbiAgICAgICAgICAgIHNhdmVEaXNwbGF5ZWRWYWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNldHRlck1ldGhvZEtleSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnU3RhdGUgcHJvcGVydHkgc2V0dGVyIG1ldGhvZCBrZXkgY2Fubm90IGJlIG51bGwuJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5ZWQgPSB0aGlzLl9ub3JtYWxpemUodGhpcy5kaXNwbGF5ZWQpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5faXNWYWxpZCh0aGlzLmRpc3BsYXllZCkgfHwgIXRoaXMuaGFzQ2hhbmdlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzdG9yZUZyb21NZW1lbnRvKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuZXF1YWxzKHRoaXMuZGlzcGxheWVkLCB0aGlzLnNhdmVkTWVtZW50bykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNhdmVkTWVtZW50byA9IGFuZ3VsYXIuY29weSh0aGlzLmRpc3BsYXllZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV2ZXJ0cyB0aGUgZGlzcGxheWVkIHZhbHVlIHRvIHRoZSBzYXZlZCBtZW1lbnRvLlxuICAgICAgICAgICAgcmVzdG9yZUZyb21NZW1lbnRvOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5ZWQgPSBhbmd1bGFyLmNvcHkodGhpcy5zYXZlZE1lbWVudG8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xub3BwaWEuY29uc3RhbnQoJ1dBUk5JTkdfVFlQRVMnLCB7XG4gICAgLy8gVGhlc2UgbXVzdCBiZSBmaXhlZCBiZWZvcmUgdGhlIGV4cGxvcmF0aW9uIGNhbiBiZSBzYXZlZC5cbiAgICBDUklUSUNBTDogJ2NyaXRpY2FsJyxcbiAgICAvLyBUaGVzZSBtdXN0IGJlIGZpeGVkIGJlZm9yZSBwdWJsaXNoaW5nIGFuIGV4cGxvcmF0aW9uIHRvIHRoZSBwdWJsaWNcbiAgICAvLyBsaWJyYXJ5LlxuICAgIEVSUk9SOiAnZXJyb3InXG59KTtcbm9wcGlhLmNvbnN0YW50KCdTVEFURV9FUlJPUl9NRVNTQUdFUycsIHtcbiAgICBBRERfSU5URVJBQ1RJT046ICdQbGVhc2UgYWRkIGFuIGludGVyYWN0aW9uIHRvIHRoaXMgY2FyZC4nLFxuICAgIFNUQVRFX1VOUkVBQ0hBQkxFOiAnVGhpcyBjYXJkIGlzIHVucmVhY2hhYmxlLicsXG4gICAgVU5BQkxFX1RPX0VORF9FWFBMT1JBVElPTjogKCdUaGVyZVxcJ3Mgbm8gd2F5IHRvIGNvbXBsZXRlIHRoZSBleHBsb3JhdGlvbiBzdGFydGluZyBmcm9tIHRoaXMgY2FyZC4gJyArXG4gICAgICAgICdUbyBmaXggdGhpcywgbWFrZSBzdXJlIHRoYXQgdGhlIGxhc3QgY2FyZCBpbiB0aGUgY2hhaW4gc3RhcnRpbmcgZnJvbSAnICtcbiAgICAgICAgJ3RoaXMgb25lIGhhcyBhbiBcXCdFbmQgRXhwbG9yYXRpb25cXCcgcXVlc3Rpb24gdHlwZS4nKSxcbiAgICBJTkNPUlJFQ1RfU09MVVRJT046ICgnVGhlIGN1cnJlbnQgc29sdXRpb24gZG9lcyBub3QgbGVhZCB0byBhbm90aGVyIGNhcmQuJyksXG4gICAgVU5SRVNPTFZFRF9BTlNXRVI6ICgnVGhlcmUgaXMgYW4gYW5zd2VyIGFtb25nIHRoZSB0b3AgMTAgd2hpY2ggaGFzIG5vIGV4cGxpY2l0IGZlZWRiYWNrLicpXG59KTtcbiJdLCJzb3VyY2VSb290IjoiIn0=