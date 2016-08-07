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
 * @fileoverview Controllers, services and filters for responses corresponding
 * to a state's interaction and answer groups.
 */

// A state-specific cache for interaction handlers. It stores handlers
// corresponding to an interaction id so that they can be restored if the
// interaction is changed back while the user is still in this state. This
// cache should be reset each time the state editor is initialized.
oppia.factory('answerGroupsCache', [function() {
  var _cache = {};
  return {
    reset: function() {
      _cache = {};
    },
    contains: function(interactionId) {
      return _cache.hasOwnProperty(interactionId);
    },
    set: function(interactionId, answerGroups) {
      _cache[interactionId] = angular.copy(answerGroups);
    },
    get: function(interactionId) {
      if (!_cache.hasOwnProperty(interactionId)) {
        return null;
      }
      return angular.copy(_cache[interactionId]);
    }
  };
}]);

oppia.factory('responsesService', [
  '$rootScope', 'stateInteractionIdService', 'INTERACTION_SPECS',
  'answerGroupsCache', 'editorContextService', 'changeListService',
  'explorationStatesService', 'graphDataService',
  function(
      $rootScope, stateInteractionIdService, INTERACTION_SPECS,
      answerGroupsCache, editorContextService, changeListService,
      explorationStatesService, graphDataService) {
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

        explorationStatesService.saveInteractionAnswerGroups(
          editorContextService.getActiveStateName(),
          angular.copy(newAnswerGroups));

        graphDataService.recompute();
        _answerGroupsMemento = angular.copy(newAnswerGroups);
      }
    };

    var _updateAnswerGroup = function(index, updates) {
      var answerGroup = _answerGroups[index];
      if (updates.rules) {
        answerGroup.rule_specs = updates.rules;
      }
      if (updates.feedback) {
        answerGroup.outcome.feedback = updates.feedback;
      }
      if (updates.dest) {
        answerGroup.outcome.dest = updates.dest;
      }
      _saveAnswerGroups(_answerGroups);
    };

    var _saveDefaultOutcome = function(newDefaultOutcome) {
      var oldDefaultOutcome = _defaultOutcomeMemento;
      if (!angular.equals(newDefaultOutcome, oldDefaultOutcome)) {
        _defaultOutcome = newDefaultOutcome;

        explorationStatesService.saveInteractionDefaultOutcome(
          editorContextService.getActiveStateName(),
          angular.copy(newDefaultOutcome));

        graphDataService.recompute();
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

        explorationStatesService.saveConfirmedUnclassifiedAnswers(
          editorContextService.getActiveStateName(),
          angular.copy(newConfirmedUnclassifiedAnswers));

        _confirmedUnclassifiedAnswersMemento = angular.copy(
          newConfirmedUnclassifiedAnswers);
      }
    };

    return {
      // The 'data' arg is a list of interaction handlers for the
      // currently-active state.
      init: function(data) {
        answerGroupsCache.reset();

        _answerGroups = angular.copy(data.answerGroups);
        _defaultOutcome = angular.copy(data.defaultOutcome);
        _confirmedUnclassifiedAnswers = angular.copy(
          data.confirmedUnclassifiedAnswers);
        answerGroupsCache.set(
          stateInteractionIdService.savedMemento, _answerGroups);

        _answerGroupsMemento = angular.copy(_answerGroups);
        _defaultOutcomeMemento = angular.copy(_defaultOutcome);
        _confirmedUnclassifiedAnswersMemento = angular.copy(
          _confirmedUnclassifiedAnswers);
        _activeAnswerGroupIndex = -1;
        _activeRuleIndex = 0;
      },
      onInteractionIdChanged: function(newInteractionId, callback) {
        if (answerGroupsCache.contains(newInteractionId)) {
          _answerGroups = answerGroupsCache.get(newInteractionId);
        } else {
          // Preserve the default outcome unless the interaction is terminal.
          // Recreate the default outcome if switching away from a terminal
          // interaction.
          _answerGroups = [];
          _confirmedUnclassifiedAnswers = [];
          if (newInteractionId) {
            if (INTERACTION_SPECS[newInteractionId].is_terminal) {
              _defaultOutcome = null;
            } else if (!_defaultOutcome) {
              // TODO(bhenning): There should be a service for creating new
              // instances of all aspects of the states schema, such as a new
              // state, new answer group, or new outcome. This avoids tightly
              // coupling code scattered throughout the frontend with the states
              // schema.
              _defaultOutcome = {
                feedback: [],
                dest: editorContextService.getActiveStateName(),
                param_changes: []
              };
            }
          }
        }

        _saveAnswerGroups(_answerGroups);
        _saveDefaultOutcome(_defaultOutcome);
        _saveConfirmedUnclassifiedAnswers(_confirmedUnclassifiedAnswers);
        answerGroupsCache.set(newInteractionId, _answerGroups);

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
        if (updates.feedback) {
          outcome.feedback = updates.feedback;
        }
        if (updates.dest) {
          outcome.dest = updates.dest;
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
            var newRules = angular.copy(answerGroup.rule_specs);
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
              };
            });

            _updateAnswerGroup(answerGroupIndex, {
              rules: newRules
            });
          });
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
      // also updates the states object in explorationStatesService.
      save: function(newAnswerGroups, defaultOutcome) {
        _saveAnswerGroups(newAnswerGroups);
        _saveDefaultOutcome(defaultOutcome);
      }
    };
  }
]);

oppia.controller('StateResponses', [
  '$scope', '$rootScope', '$modal', '$filter', 'stateInteractionIdService',
  'editorContextService', 'alertsService', 'responsesService', 'routerService',
  'explorationContextService', 'trainingDataService',
  'stateCustomizationArgsService', 'PLACEHOLDER_OUTCOME_DEST',
  'INTERACTION_SPECS', 'UrlInterpolationService',
  function(
      $scope, $rootScope, $modal, $filter, stateInteractionIdService,
      editorContextService, alertsService, responsesService, routerService,
      explorationContextService, trainingDataService,
      stateCustomizationArgsService, PLACEHOLDER_OUTCOME_DEST,
      INTERACTION_SPECS, UrlInterpolationService) {
    $scope.editorContextService = editorContextService;

    $scope.dragDotsImgUrl = UrlInterpolationService.getStaticImageUrl(
      '/general/drag_dots.png');

    var _initializeTrainingData = function() {
      var explorationId = explorationContextService.getExplorationId();
      var currentStateName = editorContextService.getActiveStateName();
      trainingDataService.initializeTrainingData(
        explorationId, currentStateName);
    };

    $scope.suppressDefaultAnswerGroupWarnings = function() {
      var interactionId = $scope.getCurrentInteractionId();
      var answerGroups = responsesService.getAnswerGroups();
      // This array contains the text of each of the possible answers
      // for the interaction.
      var answerChoices = [];
      var customizationArgs = stateCustomizationArgsService.savedMemento;
      var handledAnswersArray = [];

      if (interactionId === 'MultipleChoiceInput') {
        var numChoices = $scope.getAnswerChoices().length;
        var choiceIndices = [];
        // Collect all answers which have been handled by at least one
        // answer group.
        for (var i = 0; i < answerGroups.length; i++) {
          for (var j = 0; j < answerGroups[i].rule_specs.length; j++) {
            handledAnswersArray.push(answerGroups[i].rule_specs[j].inputs.x);
          }
        }
        for (var i = 0; i < numChoices; i++) {
          choiceIndices.push(i);
        }
        // We only suppress the default warning if each choice index has
        // been handled by at least one answer group.
        return choiceIndices.every(function(choiceIndex) {
          return handledAnswersArray.indexOf(choiceIndex) !== -1;
        });
      } else if (interactionId === 'ItemSelectionInput') {
        var maxSelectionCount = (
            customizationArgs.maxAllowableSelectionCount.value);
        if (maxSelectionCount === 1) {
          var numChoices = $scope.getAnswerChoices().length;
          // This array contains a list of booleans, one for each answer choice.
          // Each boolean is true if the corresponding answer has been
          // covered by at least one rule, and false otherwise.
          handledAnswersArray = [];
          for (var i = 0; i < numChoices; i++) {
            handledAnswersArray.push(false);
            answerChoices.push($scope.getAnswerChoices()[i].val);
          }

          var answerChoiceToIndex = {};
          answerChoices.forEach(function(answerChoice, choiceIndex) {
            answerChoiceToIndex[answerChoice] = choiceIndex;
          });

          answerGroups.forEach(function(answerGroup) {
            var ruleSpecs = answerGroup.rule_specs;
            ruleSpecs.forEach(function(ruleSpec) {
              var ruleInputs = ruleSpec.inputs.x;
              ruleInputs.forEach(function(ruleInput) {
                var choiceIndex = answerChoiceToIndex[ruleInput];
                if (ruleSpec.rule_type === 'Equals' ||
                    ruleSpec.rule_type === 'ContainsAtLeastOneOf') {
                  handledAnswersArray[choiceIndex] = true;
                } else if (ruleSpec.rule_type ===
                  'DoesNotContainAtLeastOneOf') {
                  for (var i = 0; i < handledAnswersArray.length; i++) {
                    if (i !== choiceIndex) {
                      handledAnswersArray[i] = true;
                    }
                  }
                }
              });
            });
          });

          var areAllChoicesCovered = handledAnswersArray.every(
            function(handledAnswer) {
              return handledAnswer;
            });
          // We only suppress the default warning if each choice text has
          // been handled by at least one answer group, based on rule type.
          return areAllChoicesCovered;
        }
      }
    };

    $scope.isSelfLoopWithNoFeedback = function(outcome) {
      var isSelfLoop = function(outcome) {
        return (
          outcome &&
          outcome.dest === editorContextService.getActiveStateName());
      };
      if (!outcome) {
        return false;
      }
      var hasFeedback = outcome.feedback.some(function(feedbackItem) {
        return Boolean(feedbackItem);
      });
      return isSelfLoop(outcome) && !hasFeedback;
    };

    $scope.changeActiveAnswerGroupIndex = function(newIndex) {
      $rootScope.$broadcast('externalSave');
      responsesService.changeActiveAnswerGroupIndex(newIndex);
      $scope.activeAnswerGroupIndex = (
        responsesService.getActiveAnswerGroupIndex());
    };

    $scope.getCurrentInteractionId = function() {
      return stateInteractionIdService.savedMemento;
    };

    $scope.isCurrentInteractionTrainable = function() {
      var interactionId = $scope.getCurrentInteractionId();
      return interactionId && INTERACTION_SPECS[interactionId].is_trainable;
    };

    $scope.isCreatingNewState = function(outcome) {
      return outcome && outcome.dest === PLACEHOLDER_OUTCOME_DEST;
    };

    // This returns false if the current interaction ID is null.
    $scope.isCurrentInteractionLinear = function() {
      var interactionId = $scope.getCurrentInteractionId();
      return interactionId && INTERACTION_SPECS[interactionId].is_linear;
    };

    $scope.isLinearWithNoFeedback = function(outcome) {
      // Returns false if current interaction is linear and has no feedback
      if (!outcome) {
        return false;
      }
      var hasFeedback = outcome.feedback.some(function(feedbackItem) {
        return Boolean(feedbackItem);
      });
      return $scope.isCurrentInteractionLinear() && !hasFeedback;
    };

    $scope.getOutcomeTooltip = function(outcome) {
      // Outcome tooltip depends on whether feedback is displayed
      if ($scope.isLinearWithNoFeedback(outcome)) {
        return 'Please direct the learner to a different card.';
      } else {
        return 'Please give Oppia something useful to say,' +
               ' or direct the learner to a different card.';
      }
    };

    $scope.$on('initializeAnswerGroups', function(evt, data) {
      responsesService.init(data);
      $scope.answerGroups = responsesService.getAnswerGroups();
      $scope.defaultOutcome = responsesService.getDefaultOutcome();

      // If the creator selects an interaction which has only one possible
      // answer, automatically expand the default response. Otherwise, default
      // to having no responses initially selected.
      if ($scope.isCurrentInteractionLinear()) {
        responsesService.changeActiveAnswerGroupIndex(0);
      }

      // Initialize training data for these answer groups.
      _initializeTrainingData();

      $scope.activeAnswerGroupIndex = (
        responsesService.getActiveAnswerGroupIndex());
      $rootScope.$broadcast('externalSave');
    });

    $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
      $rootScope.$broadcast('externalSave');
      responsesService.onInteractionIdChanged(newInteractionId, function() {
        $scope.answerGroups = responsesService.getAnswerGroups();
        $scope.defaultOutcome = responsesService.getDefaultOutcome();

        // Reinitialize training data if the interaction ID is changed.
        _initializeTrainingData();

        $scope.activeAnswerGroupIndex = (
          responsesService.getActiveAnswerGroupIndex());
      });

      // Prompt the user to create a new response if it is not a linear or
      // non-terminal interaction and if an actual interaction is specified
      // (versus one being deleted).
      if (newInteractionId &&
          !INTERACTION_SPECS[newInteractionId].is_linear &&
          !INTERACTION_SPECS[newInteractionId].is_terminal) {
        // Open the training interface if the interaction is trainable,
        // otherwise open the answer group modal.
        if (GLOBALS.SHOW_TRAINABLE_UNRESOLVED_ANSWERS &&
            $scope.isCurrentInteractionTrainable()) {
          $scope.openTeachOppiaModal();
        } else {
          $scope.openAddAnswerGroupModal();
        }
      }
    });

    $scope.$on('answerGroupChanged', function() {
      $scope.answerGroups = responsesService.getAnswerGroups();
      $scope.defaultOutcome = responsesService.getDefaultOutcome();
      $scope.activeAnswerGroupIndex = (
        responsesService.getActiveAnswerGroupIndex());
    });

    $scope.$on('updateAnswerChoices', function(evt, newAnswerChoices) {
      responsesService.updateAnswerChoices(newAnswerChoices);
    });

    $scope.openTeachOppiaModal = function() {
      alertsService.clearWarnings();
      $rootScope.$broadcast('externalSave');

      $modal.open({
        templateUrl: 'modals/teachOppia',
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', 'oppiaExplorationHtmlFormatterService',
          'stateInteractionIdService', 'stateCustomizationArgsService',
          'explorationContextService', 'editorContextService',
          'explorationStatesService', 'trainingDataService',
          'AnswerClassificationService', 'focusService', 'DEFAULT_RULE_NAME',
          'CLASSIFIER_RULESPEC_STR',
          function(
              $scope, $modalInstance, oppiaExplorationHtmlFormatterService,
              stateInteractionIdService, stateCustomizationArgsService,
              explorationContextService, editorContextService,
              explorationStatesService, trainingDataService,
              AnswerClassificationService, focusService, DEFAULT_RULE_NAME,
              CLASSIFIER_RULESPEC_STR) {
            var _explorationId = explorationContextService.getExplorationId();
            var _stateName = editorContextService.getActiveStateName();
            var _state = explorationStatesService.getState(_stateName);

            $scope.stateContent = _state.content[0].value;
            $scope.inputTemplate = (
              oppiaExplorationHtmlFormatterService.getInteractionHtml(
                stateInteractionIdService.savedMemento,
                stateCustomizationArgsService.savedMemento,
                'testInteractionInput'));
            $scope.answerTemplate = '';

            $scope.trainingData = [];
            $scope.trainingDataAnswer = '';
            $scope.trainingDataFeedback = '';
            $scope.trainingDataOutcomeDest = '';

            // See the training panel directive in StateEditor for an
            // explanation on the structure of this object.
            $scope.classification = {
              answerGroupIndex: 0,
              newOutcome: null
            };

            focusService.setFocus('testInteractionInput');

            $scope.finishTeaching = function(reopen) {
              $modalInstance.close({
                reopen: reopen
              });
            };

            $scope.submitAnswer = function(answer) {
              $scope.answerTemplate = (
                oppiaExplorationHtmlFormatterService.getAnswerHtml(
                  answer, stateInteractionIdService.savedMemento,
                  stateCustomizationArgsService.savedMemento));

              AnswerClassificationService.getMatchingClassificationResult(
                _explorationId, _state, answer, true).then(
                    function(classificationResult) {
                  var feedback = 'Nothing';
                  var dest = classificationResult.outcome.dest;
                  if (classificationResult.outcome.feedback.length > 0) {
                    feedback = classificationResult.outcome.feedback[0];
                  }
                  if (dest === _stateName) {
                    dest = '<em>(try again)</em>';
                  }
                  $scope.trainingDataAnswer = answer;
                  $scope.trainingDataFeedback = feedback;
                  $scope.trainingDataOutcomeDest = dest;

                  var answerGroupIndex = classificationResult.answerGroupIndex;
                  var ruleSpecIndex = classificationResult.ruleSpecIndex;
                  if (answerGroupIndex !==
                        _state.interaction.answer_groups.length &&
                      _state.interaction.answer_groups[
                        answerGroupIndex].rule_specs[
                          ruleSpecIndex].rule_type !==
                            CLASSIFIER_RULESPEC_STR) {
                    $scope.classification.answerGroupIndex = -1;
                  } else {
                    $scope.classification.answerGroupIndex = (
                      classificationResult.answerGroupIndex);
                  }
                });
            };
          }]
      }).result.then(function(result) {
        // Check if the modal should be reopened right away.
        if (result.reopen) {
          $scope.openTeachOppiaModal();
        }
      });
    };

    $scope.openAddAnswerGroupModal = function() {
      alertsService.clearWarnings();
      $rootScope.$broadcast('externalSave');

      $modal.open({
        templateUrl: 'modals/addAnswerGroup',
        // Clicking outside this modal should not dismiss it.
        backdrop: 'static',
        controller: [
          '$scope', '$modalInstance', 'responsesService',
          'editorContextService', 'editorFirstTimeEventsService',
          function(
              $scope, $modalInstance, responsesService,
              editorContextService, editorFirstTimeEventsService) {
            $scope.feedbackEditorIsOpen = false;
            $scope.openFeedbackEditor = function() {
              $scope.feedbackEditorIsOpen = true;
            };
            $scope.tmpRule = {
              rule_type: null,
              inputs: {}
            };
            $scope.tmpOutcome = {
              dest: editorContextService.getActiveStateName(),
              feedback: [''],
              param_changes: []
            };

            $scope.isSelfLoopWithNoFeedback = function(tmpOutcome) {
              var hasFeedback = false;
              for (var i = 0; i < tmpOutcome.feedback.length; i++) {
                if (tmpOutcome.feedback[i]) {
                  hasFeedback = true;
                  break;
                }
              }

              return (
                tmpOutcome.dest === editorContextService.getActiveStateName() &&
                !hasFeedback);
            };

            $scope.addAnswerGroupForm = {};

            $scope.saveResponse = function(reopen) {
              $scope.$broadcast('saveOutcomeFeedbackDetails');
              $scope.$broadcast('saveOutcomeDestDetails');

              // If the feedback editor is never opened, replace the feedback
              // with an empty array.
              if ($scope.tmpOutcome.feedback.length === 1 &&
                  $scope.tmpOutcome.feedback[0] === '') {
                $scope.tmpOutcome.feedback = [];
              }

              editorFirstTimeEventsService.registerFirstSaveRuleEvent();

              // Close the modal and save it afterwards.
              $modalInstance.close({
                tmpRule: angular.copy($scope.tmpRule),
                tmpOutcome: angular.copy($scope.tmpOutcome),
                reopen: reopen
              });
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              alertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function(result) {
        // Create a new answer group.
        $scope.answerGroups.push({
          rule_specs: [result.tmpRule],
          outcome: angular.copy(result.tmpOutcome)
        });
        responsesService.save($scope.answerGroups, $scope.defaultOutcome);
        $scope.changeActiveAnswerGroupIndex($scope.answerGroups.length - 1);

        // After saving it, check if the modal should be reopened right away.
        if (result.reopen) {
          $scope.openAddAnswerGroupModal();
        }
      });
    };

    // When the page is scrolled so that the top of the page is above the
    // browser viewport, there are some bugs in the positioning of the helper.
    // This is a bug in jQueryUI that has not been fixed yet. For more details,
    // see http://stackoverflow.com/q/5791886
    $scope.ANSWER_GROUP_LIST_SORTABLE_OPTIONS = {
      axis: 'y',
      cursor: 'move',
      handle: '.oppia-rule-sort-handle',
      items: '.oppia-sortable-rule-block',
      revert: 100,
      tolerance: 'pointer',
      start: function(e, ui) {
        $rootScope.$broadcast('externalSave');
        $scope.changeActiveAnswerGroupIndex(-1);
        ui.placeholder.height(ui.item.height());
      },
      stop: function() {
        responsesService.save($scope.answerGroups, $scope.defaultOutcome);
      }
    };

    $scope.deleteAnswerGroup = function(index, evt) {
      // Prevent clicking on the delete button from also toggling the display
      // state of the answer group.
      evt.stopPropagation();

      alertsService.clearWarnings();
      $modal.open({
        templateUrl: 'modals/deleteAnswerGroup',
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.reallyDelete = function() {
              $modalInstance.close();
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              alertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        responsesService.deleteAnswerGroup(index);
      });
    };

    $scope.saveActiveAnswerGroupFeedback = function(updatedOutcome) {
      responsesService.updateActiveAnswerGroup({
        feedback: updatedOutcome.feedback
      });
    };

    $scope.saveActiveAnswerGroupDest = function(updatedOutcome) {
      responsesService.updateActiveAnswerGroup({
        dest: updatedOutcome.dest
      });
    };

    $scope.saveActiveAnswerGroupRules = function(updatedRules) {
      responsesService.updateActiveAnswerGroup({
        rules: updatedRules
      });
    };

    $scope.saveDefaultOutcomeFeedback = function(updatedOutcome) {
      responsesService.updateDefaultOutcome({
        feedback: updatedOutcome.feedback
      });
    };

    $scope.saveDefaultOutcomeDest = function(updatedOutcome) {
      responsesService.updateDefaultOutcome({
        dest: updatedOutcome.dest
      });
    };

    $scope.getAnswerChoices = function() {
      return responsesService.getAnswerChoices();
    };

    $scope.isOutcomeLooping = function(outcome) {
      var activeStateName = editorContextService.getActiveStateName();
      return outcome && (outcome.dest === activeStateName);
    };

    $scope.navigateToState = function(stateName) {
      routerService.navigateToMainTab(stateName);
    };
  }
]);

oppia.filter('summarizeAnswerGroup', [
    '$filter', 'RULE_SUMMARY_WRAP_CHARACTER_COUNT',
    function($filter, RULE_SUMMARY_WRAP_CHARACTER_COUNT) {
  return function(answerGroup, interactionId, answerChoices, shortenRule) {
    var summary = '';
    var outcome = answerGroup.outcome;
    var hasFeedback = outcome.feedback.length > 0 && outcome.feedback[0];

    if (answerGroup.rule_specs) {
      var firstRule = $filter('convertToPlainText')(
        $filter('parameterizeRuleDescription')(
          answerGroup.rule_specs[0], interactionId, answerChoices));
      summary = 'Answer ' + firstRule;

      if (hasFeedback && shortenRule) {
        summary = $filter('wrapTextWithEllipsis')(
          summary, RULE_SUMMARY_WRAP_CHARACTER_COUNT);
      }
      summary = '[' + summary + '] ';
    }

    if (hasFeedback) {
      summary += $filter('convertToPlainText')(outcome.feedback[0]);
    }
    return summary;
  };
}]);

oppia.filter('summarizeDefaultOutcome', [
  '$filter', 'INTERACTION_SPECS', 'RULE_SUMMARY_WRAP_CHARACTER_COUNT',
  function($filter, INTERACTION_SPECS, RULE_SUMMARY_WRAP_CHARACTER_COUNT) {
    return function(
        defaultOutcome, interactionId, answerGroupCount, shortenRule) {
      if (!defaultOutcome) {
        return '';
      }

      var summary = '';
      var feedback = defaultOutcome.feedback;
      var hasFeedback = feedback.length > 0 && feedback[0];

      if (interactionId && INTERACTION_SPECS[interactionId].is_linear) {
        summary = INTERACTION_SPECS[interactionId].default_outcome_heading;
      } else if (answerGroupCount > 0) {
        summary = 'All other answers';
      } else {
        summary = 'All answers';
      }

      if (hasFeedback && shortenRule) {
        summary = $filter('wrapTextWithEllipsis')(
          summary, RULE_SUMMARY_WRAP_CHARACTER_COUNT);
      }
      summary = '[' + summary + '] ';

      if (hasFeedback) {
        summary += $filter('convertToPlainText')(defaultOutcome.feedback[0]);
      }
      return summary;
    };
  }
]);
