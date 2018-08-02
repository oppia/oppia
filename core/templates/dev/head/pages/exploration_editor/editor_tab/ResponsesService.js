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

oppia.factory('ResponsesService', [
  '$rootScope', 'stateInteractionIdService', 'INTERACTION_SPECS',
  'AnswerGroupsCacheService', 'EditorStateService', 'ChangeListService',
  'ExplorationStatesService', 'GraphDataService', 'OutcomeObjectFactory',
  'stateSolutionService', 'SolutionVerificationService', 'AlertsService',
  'ContextService', 'ExplorationWarningsService',
  'stateContentIdsToAudioTranslationsService',
  'COMPONENT_NAME_DEFAULT_OUTCOME', 'INFO_MESSAGE_SOLUTION_IS_VALID',
  'INFO_MESSAGE_SOLUTION_IS_INVALID',
  'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE',
  function(
      $rootScope, stateInteractionIdService, INTERACTION_SPECS,
      AnswerGroupsCacheService, EditorStateService, ChangeListService,
      ExplorationStatesService, GraphDataService, OutcomeObjectFactory,
      stateSolutionService, SolutionVerificationService, AlertsService,
      ContextService, ExplorationWarningsService,
      stateContentIdsToAudioTranslationsService,
      COMPONENT_NAME_DEFAULT_OUTCOME, INFO_MESSAGE_SOLUTION_IS_VALID,
      INFO_MESSAGE_SOLUTION_IS_INVALID,
      INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE) {
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

    var _saveAnswerGroups = function(newAnswerGroups) {
      var oldAnswerGroups = _answerGroupsMemento;
      if (newAnswerGroups && oldAnswerGroups &&
          !angular.equals(newAnswerGroups, oldAnswerGroups)) {
        _answerGroups = newAnswerGroups;
        $rootScope.$broadcast('answerGroupChanged');
        ExplorationStatesService.saveInteractionAnswerGroups(
          EditorStateService.getActiveStateName(),
          angular.copy(newAnswerGroups));

        // To check if the solution is valid once a rule has been changed or
        // added.
        var currentInteractionId = stateInteractionIdService.savedMemento;
        var interactionCanHaveSolution = (
          currentInteractionId &&
          INTERACTION_SPECS[currentInteractionId].can_have_solution);
        var solutionExists = (
          stateSolutionService.savedMemento &&
          stateSolutionService.savedMemento.correctAnswer !== null);

        if (interactionCanHaveSolution && solutionExists) {
          var currentStateName = EditorStateService.getActiveStateName();
          var solutionWasPreviouslyValid = (
            ExplorationStatesService.isSolutionValid(
              EditorStateService.getActiveStateName()));
          var solutionIsCurrentlyValid = (
            SolutionVerificationService.verifySolution(
              ContextService.getExplorationId(),
              ExplorationStatesService.getState(currentStateName),
              stateSolutionService.savedMemento.correctAnswer));

          ExplorationStatesService.updateSolutionValidity(
            currentStateName, solutionIsCurrentlyValid);
          ExplorationWarningsService.updateWarnings();

          if (solutionIsCurrentlyValid && !solutionWasPreviouslyValid) {
            AlertsService.addInfoMessage(INFO_MESSAGE_SOLUTION_IS_VALID);
          } else if (!solutionIsCurrentlyValid && solutionWasPreviouslyValid) {
            AlertsService.addInfoMessage(
              INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE);
          } else if (!solutionIsCurrentlyValid && !solutionWasPreviouslyValid) {
            AlertsService.addInfoMessage(INFO_MESSAGE_SOLUTION_IS_INVALID);
          }
        }

        GraphDataService.recompute();
        _answerGroupsMemento = angular.copy(newAnswerGroups);
      }
    };

    var _updateAnswerGroup = function(index, updates) {
      var answerGroup = _answerGroups[index];
      if (updates.hasOwnProperty('rules')) {
        answerGroup.rules = updates.rules;
      }
      if (updates.hasOwnProperty('feedback')) {
        answerGroup.outcome.feedback = updates.feedback;
      }
      if (updates.hasOwnProperty('dest')) {
        answerGroup.outcome.dest = updates.dest;
      }
      if (updates.hasOwnProperty('refresherExplorationId')) {
        answerGroup.outcome.refresherExplorationId = (
          updates.refresherExplorationId);
      }
      if (updates.hasOwnProperty('missingPrerequisiteSkillId')) {
        answerGroup.outcome.missingPrerequisiteSkillId = (
          updates.missingPrerequisiteSkillId);
      }
      if (updates.hasOwnProperty('labelledAsCorrect')) {
        answerGroup.outcome.labelledAsCorrect = updates.labelledAsCorrect;
      }
      if (updates.hasOwnProperty('trainingData')) {
        answerGroup.trainingData = updates.trainingData;
      }
      _saveAnswerGroups(_answerGroups);
    };

    var _updateAnswerGroupsAudioTranslation = function() {
      stateContentIdsToAudioTranslationsService.displayed.
        deleteAllFeedbackContentId();
      for (var i = 0; i < _answerGroups.length; i++) {
        stateContentIdsToAudioTranslationsService.displayed.addContentId(
          _answerGroups[i].outcome.feedback.getContentId());
      }
      stateContentIdsToAudioTranslationsService.saveDisplayedValue();
    };

    var _saveDefaultOutcome = function(newDefaultOutcome) {
      var oldDefaultOutcome = _defaultOutcomeMemento;
      if (!angular.equals(newDefaultOutcome, oldDefaultOutcome)) {
        _defaultOutcome = newDefaultOutcome;

        ExplorationStatesService.saveInteractionDefaultOutcome(
          EditorStateService.getActiveStateName(),
          angular.copy(newDefaultOutcome));

        GraphDataService.recompute();
        _defaultOutcomeMemento = angular.copy(newDefaultOutcome);
      }
    };

    var _saveConfirmedUnclassifiedAnswers = function(
        newConfirmedUnclassifiedAnswers) {
      var oldConfirmedUnclassifiedAnswers = (
        _confirmedUnclassifiedAnswersMemento);
      if (!angular.equals(
        newConfirmedUnclassifiedAnswers, oldConfirmedUnclassifiedAnswers)) {
        _confirmedUnclassifiedAnswers = newConfirmedUnclassifiedAnswers;

        ExplorationStatesService.saveConfirmedUnclassifiedAnswers(
          EditorStateService.getActiveStateName(),
          angular.copy(newConfirmedUnclassifiedAnswers));

        _confirmedUnclassifiedAnswersMemento = angular.copy(
          newConfirmedUnclassifiedAnswers);
      }
    };

    return {
      // The 'data' arg is a list of interaction handlers for the
      // currently-active state.
      init: function(data) {
        AnswerGroupsCacheService.reset();

        _answerGroups = angular.copy(data.answerGroups);
        _defaultOutcome = angular.copy(data.defaultOutcome);
        _confirmedUnclassifiedAnswers = angular.copy(
          data.confirmedUnclassifiedAnswers);
        AnswerGroupsCacheService.set(
          stateInteractionIdService.savedMemento, _answerGroups);

        _answerGroupsMemento = angular.copy(_answerGroups);
        _defaultOutcomeMemento = angular.copy(_defaultOutcome);
        _confirmedUnclassifiedAnswersMemento = angular.copy(
          _confirmedUnclassifiedAnswers);
        _activeAnswerGroupIndex = -1;
        _activeRuleIndex = 0;
      },
      onInteractionIdChanged: function(newInteractionId, callback) {
        if (AnswerGroupsCacheService.contains(newInteractionId)) {
          _answerGroups = AnswerGroupsCacheService.get(newInteractionId);
        } else {
          _answerGroups = [];
        }

        // This is necessary in order to keep the audio translations of the
        // answer groups in sync with the answer groups that are fetched from
        // the cache.
        _updateAnswerGroupsAudioTranslation();

        // Preserve the default outcome unless the interaction is terminal.
        // Recreate the default outcome if switching away from a terminal
        // interaction.
        if (newInteractionId) {
          if (INTERACTION_SPECS[newInteractionId].is_terminal) {
            _defaultOutcome = null;
            stateContentIdsToAudioTranslationsService.displayed.deleteContentId(
              COMPONENT_NAME_DEFAULT_OUTCOME);
          } else if (!_defaultOutcome) {
            _defaultOutcome = OutcomeObjectFactory.createNew(
              EditorStateService.getActiveStateName(),
              COMPONENT_NAME_DEFAULT_OUTCOME, '', []);
            stateContentIdsToAudioTranslationsService.displayed.addContentId(
              COMPONENT_NAME_DEFAULT_OUTCOME);
          }
          stateContentIdsToAudioTranslationsService.saveDisplayedValue();
        }

        _confirmedUnclassifiedAnswers = [];

        _saveAnswerGroups(_answerGroups);
        _saveDefaultOutcome(_defaultOutcome);
        _saveConfirmedUnclassifiedAnswers(_confirmedUnclassifiedAnswers);
        AnswerGroupsCacheService.set(newInteractionId, _answerGroups);

        _answerGroupsMemento = angular.copy(_answerGroups);
        _defaultOutcomeMemento = angular.copy(_defaultOutcome);
        _confirmedUnclassifiedAnswersMemento = angular.copy(
          _confirmedUnclassifiedAnswers);
        _activeAnswerGroupIndex = -1;
        _activeRuleIndex = 0;

        if (callback) {
          callback();
        }
      },
      getActiveAnswerGroupIndex: function() {
        return _activeAnswerGroupIndex;
      },
      changeActiveAnswerGroupIndex: function(newIndex) {
        // If the current group is being clicked on again, close it.
        if (newIndex === _activeAnswerGroupIndex) {
          _activeAnswerGroupIndex = -1;
        } else {
          _activeAnswerGroupIndex = newIndex;
        }

        _activeRuleIndex = -1;
      },
      getActiveRuleIndex: function() {
        return _activeRuleIndex;
      },
      changeActiveRuleIndex: function(newIndex) {
        _activeRuleIndex = newIndex;
      },
      getAnswerChoices: function() {
        return angular.copy(_answerChoices);
      },
      updateAnswerGroup: function(index, updates) {
        _updateAnswerGroup(index, updates);
      },
      deleteAnswerGroup: function(index) {
        _answerGroupsMemento = angular.copy(_answerGroups);
        _answerGroups.splice(index, 1);
        _activeAnswerGroupIndex = -1;
        _saveAnswerGroups(_answerGroups);
      },
      updateActiveAnswerGroup: function(updates) {
        _updateAnswerGroup(_activeAnswerGroupIndex, updates);
      },
      updateDefaultOutcome: function(updates) {
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
      },
      updateConfirmedUnclassifiedAnswers: function(
          confirmedUnclassifiedAnswers) {
        _saveConfirmedUnclassifiedAnswers(confirmedUnclassifiedAnswers);
      },
      // Updates answer choices when the interaction requires it -- for
      // example, the rules for multiple choice need to refer to the multiple
      // choice interaction's customization arguments.
      updateAnswerChoices: function(newAnswerChoices) {
        var oldAnswerChoices = angular.copy(_answerChoices);
        _answerChoices = newAnswerChoices;

        // If the interaction is ItemSelectionInput, update the answer groups
        // to refer to the new answer options.
        if (stateInteractionIdService.savedMemento === 'ItemSelectionInput' &&
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

          var oldChoiceStrings = oldAnswerChoices.map(function(choice) {
            return choice.val;
          });
          var newChoiceStrings = newAnswerChoices.map(function(choice) {
            return choice.val;
          });

          _answerGroups.forEach(function(answerGroup, answerGroupIndex) {
            var newRules = angular.copy(answerGroup.rules);
            newRules.forEach(function(rule) {
              for (var key in rule.inputs) {
                var newInputValue = [];
                rule.inputs[key].forEach(function(item) {
                  var newIndex = newChoiceStrings.indexOf(item);
                  if (newIndex !== -1) {
                    newInputValue.push(item);
                  } else if (onlyEditsHappened) {
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
            });
          });
        }

        // If the interaction is DragAndDropSortInput, update the answer groups
        // to refer to the new answer options.
        if (stateInteractionIdService.savedMemento === 'DragAndDropSortInput' &&
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
          } else {
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
            _answerGroups.forEach(function(answerGroup, answerGroupIndex) {
              var newRules = angular.copy(answerGroup.rules);
              newRules.forEach(function(rule) {
                if (rule.type === 'HasElementXAtPositionY') {
                  for (var key in rule.inputs) {
                    var newInputValue = '';
                    if (key === 'y') {
                      newInputValue = 1;
                    }
                    rule.inputs[key] = newInputValue;
                  }
                } else if (rule.type === 'HasElementXBeforeElementY') {
                  for (var key in rule.inputs) {
                    var newInputValue = '';
                    rule.inputs[key] = newInputValue;
                  }
                } else {
                  for (var key in rule.inputs) {
                    var newInputValue = [];
                    rule.inputs[key] = newInputValue;
                  }
                }
              });

              _updateAnswerGroup(answerGroupIndex, {
                rules: newRules
              });
            });
          }
        }
      },
      getAnswerGroups: function() {
        return angular.copy(_answerGroups);
      },
      getAnswerGroup: function(index) {
        return angular.copy(_answerGroups[index]);
      },
      getAnswerGroupCount: function() {
        return _answerGroups.length;
      },
      getDefaultOutcome: function() {
        return angular.copy(_defaultOutcome);
      },
      getConfirmedUnclassifiedAnswers: function() {
        return angular.copy(_confirmedUnclassifiedAnswers);
      },
      // This registers the change to the handlers in the list of changes, and
      // also updates the states object in ExplorationStatesService.
      save: function(newAnswerGroups, defaultOutcome) {
        _saveAnswerGroups(newAnswerGroups);
        _saveDefaultOutcome(defaultOutcome);
      }
    };
  }
]);
