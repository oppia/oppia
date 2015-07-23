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
 * @fileoverview Controllers for responses corresponding to a state's
 * interaction and answer groups.
 *
 * @author sll@google.com (Sean Lip)
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
    'stateInteractionIdService', 'INTERACTION_SPECS', 'answerGroupsCache',
    'editorContextService', 'changeListService', 'explorationStatesService',
    'graphDataService', 'warningsData',
    function(
      stateInteractionIdService, INTERACTION_SPECS, answerGroupsCache,
      editorContextService, changeListService, explorationStatesService,
      graphDataService, warningsData) {

  var _answerGroupsMemento = null;
  var _defaultOutcomeMemento = null;
  var _confirmedUnclassifiedAnswersMemento = null;
  // Represents the current selected answer group, starting at index 0. If the
  // index equal to the number of answer groups (answerGroups.length), then it
  // is referring to the default outcome.
  var _activeAnswerGroupIndex = null;
  var _activeRuleIndex = null;
  var _answerGroups = null;
  var _defaultOutcome = null;
  var _confirmedUnclassifiedAnswers = null;
  var _answerChoices = null;

  var _saveAnswerGroups = function(newAnswerGroups) {
    var oldAnswerGroups = _answerGroupsMemento;
    if (newAnswerGroups && oldAnswerGroups &&
        !angular.equals(newAnswerGroups, oldAnswerGroups)) {
      _answerGroups = newAnswerGroups;

      changeListService.editStateProperty(
        editorContextService.getActiveStateName(), 'answer_groups',
        angular.copy(newAnswerGroups), angular.copy(oldAnswerGroups));

      var activeStateName = editorContextService.getActiveStateName();
      var _stateDict = explorationStatesService.getState(activeStateName);
      _stateDict.interaction.answer_groups = angular.copy(_answerGroups);
      explorationStatesService.setState(activeStateName, _stateDict);

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

      changeListService.editStateProperty(
        editorContextService.getActiveStateName(),
        'default_outcome', angular.copy(newDefaultOutcome),
        angular.copy(oldDefaultOutcome));

      var activeStateName = editorContextService.getActiveStateName();
      var _stateDict = explorationStatesService.getState(activeStateName);
      _stateDict.interaction.default_outcome = angular.copy(
        _defaultOutcome);
      explorationStatesService.setState(activeStateName, _stateDict);

      graphDataService.recompute();
      _defaultOutcomeMemento = angular.copy(newDefaultOutcome);
    }
  };

  var _saveConfirmedUnclassifiedAnswers = function(
      newConfirmedUnclassifiedAnswers) {
    var oldConfirmedUnclassifiedAnswers = _confirmedUnclassifiedAnswersMemento;
    if (!angular.equals(
        newConfirmedUnclassifiedAnswers, oldConfirmedUnclassifiedAnswers)) {
      _confirmedUnclassifiedAnswers = newConfirmedUnclassifiedAnswers;

      changeListService.editStateProperty(
        editorContextService.getActiveStateName(),
        'confirmed_unclassified_answers',
        angular.copy(newConfirmedUnclassifiedAnswers),
        angular.copy(oldConfirmedUnclassifiedAnswers));

      var activeStateName = editorContextService.getActiveStateName();
      var _stateDict = explorationStatesService.getState(activeStateName);
      _stateDict.interaction.confirmed_unclassified_answers = angular.copy(
        _confirmedUnclassifiedAnswers);
      explorationStatesService.setState(activeStateName, _stateDict);

      _confirmedUnclassifiedAnswersMemento = angular.copy(
        newConfirmedUnclassifiedAnswers);
    }
  };

  return {
    // The 'data' arg is a list of interaction handlers for the currently-active
    // state.
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
              'feedback': [],
              'dest': editorContextService.getActiveStateName(),
              'param_changes': []
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
      if (newIndex == _activeAnswerGroupIndex) {
        _activeAnswerGroupIndex = -1;
      } else {
        _activeAnswerGroupIndex = newIndex;
      }

      _activeRuleIndex = 0;
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
      _saveAnswerGroups(_answerGroups);
      _activeAnswerGroupIndex = -1;
      return true;
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
    updateConfirmedUnclassifiedAnswers: function(confirmedUnclassifiedAnswers) {
      _saveConfirmedUnclassifiedAnswers(confirmedUnclassifiedAnswers);
    },
    // Updates answer choices when the interaction requires it -- for example,
    // the rules for multiple choice need to refer to the multiple choice
    // interaction's customization arguments.
    updateAnswerChoices: function(newAnswerChoices) {
      _answerChoices = newAnswerChoices;
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
}]);


oppia.controller('StateResponses', [
    '$scope', '$rootScope', '$modal', '$filter', 'stateInteractionIdService',
    'editorContextService', 'warningsData', 'responsesService', 'routerService',
    'PLACEHOLDER_OUTCOME_DEST', 'INTERACTION_SPECS',
    function(
      $scope, $rootScope, $modal, $filter, stateInteractionIdService,
      editorContextService, warningsData, responsesService, routerService,
      PLACEHOLDER_OUTCOME_DEST, INTERACTION_SPECS) {
  $scope.editorContextService = editorContextService;

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
    return INTERACTION_SPECS[$scope.getCurrentInteractionId()].is_trainable;
  };

  $scope.isCreatingNewState = function(outcome) {
    return outcome && outcome.dest == PLACEHOLDER_OUTCOME_DEST;
  };

  $scope.$on('initializeAnswerGroups', function(evt, data) {
    responsesService.init(data);
    $scope.answerGroups = responsesService.getAnswerGroups();
    $scope.defaultOutcome = responsesService.getDefaultOutcome();

    // If the creator selects the 'Continue' interaction, automatically expand
    // the default response (which is the 'handle button click' response).
    // Otherwise, default to having no responses initially selected.
    if ($scope.getCurrentInteractionId() === 'Continue') {
      responsesService.changeActiveAnswerGroupIndex(0);
    }

    $scope.activeAnswerGroupIndex = (
      responsesService.getActiveAnswerGroupIndex());
    $rootScope.$broadcast('externalSave');
  });

  $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
    $rootScope.$broadcast('externalSave');
    responsesService.onInteractionIdChanged(newInteractionId, function() {
      $scope.answerGroups = responsesService.getAnswerGroups();
      $scope.defaultOutcome = responsesService.getDefaultOutcome();

      $scope.activeAnswerGroupIndex = (
        responsesService.getActiveAnswerGroupIndex());
    });

    // Now, open the answer group editor if it is not a 'Continue' or
    // non-terminal interaction and if an actual interaction is specified
    // (versus one being deleted).
    if (newInteractionId && newInteractionId !== 'Continue' &&
        !INTERACTION_SPECS[newInteractionId].is_terminal) {
      $scope.openAddAnswerGroupModal();
    }
  });

  $scope.$on('answerGroupDeleted', function(evt) {
    $scope.answerGroups = responsesService.getAnswerGroups();
    $scope.defaultOutcome = responsesService.getDefaultOutcome();
    $scope.activeAnswerGroupIndex = (
      responsesService.getActiveAnswerGroupIndex());
  });

  $scope.$on('updateAnswerChoices', function(evt, newAnswerChoices) {
    responsesService.updateAnswerChoices(newAnswerChoices);
  });

  var _createAnswerGroup = function(rules, outcome) {
    _answerGroupsMemento = angular.copy($scope.answerGroups);
    $scope.answerGroups.push({
      'rule_specs': angular.copy(rules),
      'outcome': angular.copy(outcome)
    });
    responsesService.save($scope.answerGroups, $scope.defaultOutcome);
    $scope.changeActiveAnswerGroupIndex($scope.answerGroups.length - 1);
  };

  $scope.openAddAnswerGroupModal = function() {
    warningsData.clear();
    $rootScope.$broadcast('externalSave');

    $modal.open({
      templateUrl: 'modals/addAnswerGroup',
      backdrop: true,
      controller: [
          '$scope', '$modalInstance', 'responsesService',
          'editorContextService', function(
            $scope, $modalInstance, responsesService, editorContextService) {

        $scope.tmpRule = {
          rule_type: null,
          inputs: {}
        };
        $scope.tmpOutcome = {
          'dest': editorContextService.getActiveStateName(),
          'feedback': [''],
          'param_changes': []
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
          // Close the modal and save it afterwards.
          $modalInstance.close({
            'tmpRule': angular.copy($scope.tmpRule),
            'tmpOutcome': angular.copy($scope.tmpOutcome),
            'reopen': reopen
          });
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }]
    }).result.then(function(result) {
      _createAnswerGroup([result.tmpRule], result.tmpOutcome);

      // After saving it, check if the modal should be reopened right away.
      if (result.reopen) {
        $scope.openAddAnswerGroupModal();
      }
    });
  };

  $scope.isDraggingActiveAnswerGroup = null;

  $scope.openTeachOppiaModal = function() {
    warningsData.clear();
    $rootScope.$broadcast('externalSave');

    $modal.open({
      templateUrl: 'modals/teachOppia',
      backdrop: true,
      controller: ['$scope', '$modalInstance', 'trainingDataService',
        'explorationStatesService', 'editorContextService',
        'answerClassificationService', 'explorationContextService',
        function($scope, $modalInstance, trainingDataService,
            explorationStatesService, editorContextService,
            answerClassificationService, explorationContextService) {
          $scope.trainingData = [];
          $scope.classification = {feedbackIndex: 0, newOutcome: null};
          $scope.inputTemplate = '';

          $scope.createAnswerGroup = function() {
            if ($scope.classification.newOutcome) {
              // Create a new answer group with the given feedback.
              _createAnswerGroup([], $scope.classification.newOutcome);
            }
          };

          $scope.finishTraining = function(reopen) {
            $modalInstance.close({
              'reopen': reopen
            });
          };

          var setFeedbackIndexForTrainingData = function(trainingDataIndex) {
            if ($scope.trainingData.length == 0) {
              return;
            }
            $scope.classification.feedbackIndex = (
              $scope.trainingData[trainingDataIndex].index);
          };

          var explorationId = explorationContextService.getExplorationId();
          var currentStateName = editorContextService.getActiveStateName();
          var state = explorationStatesService.getState(currentStateName);

          var trainingDataResult = trainingDataService.getTrainingDataResult(
            explorationId, currentStateName, state);

          trainingDataResult.success(function(result) {
            var unhandledAnswers = result['unhandled_answers'];

            answerClassificationService.getMatchingBatchClassificationResult(
              explorationId, state, unhandledAnswers).success(
                  function(classificationResults) {
                for (var i = 0; i < classificationResults.length; i++) {
                  var classificationResult = classificationResults[i];
                  var feedback = 'Nothing';
                  if (classificationResult.outcome.feedback.length > 0) {
                    feedback = classificationResult.outcome.feedback[0];
                  }
                  $scope.trainingData.push({
                    answer: unhandledAnswers[i],
                    feedback: feedback,
                    index: classificationResult.answer_group_index
                  });
                }

                setFeedbackIndexForTrainingData(0);
              });
          });
        }]
    }).result.then(function(result) {
      // Check if the modal should be reopened right away.
      if (result.reopen) {
        $scope.openTeachOppiaModal();
      }
    });
  };

  $scope.openTestOppiaModal = function() {
    warningsData.clear();
    $rootScope.$broadcast('externalSave');

    $modal.open({
      templateUrl: 'modals/testOppia',
      backdrop: true,
      controller: ['$scope', '$modalInstance', 'oppiaExplorationService',
        'stateInteractionIdService', 'stateCustomizationArgsService',
        'explorationContextService', 'editorContextService',
        'explorationStatesService', 'trainingDataService',
        'answerClassificationService', 'focusService', 'DEFAULT_RULE_NAME',
        'FUZZY_RULE_NAME',
        function($scope, $modalInstance, oppiaExplorationService,
            stateInteractionIdService, stateCustomizationArgsService,
            explorationContextService, editorContextService,
            explorationStatesService, trainingDataService,
            answerClassificationService, focusService, DEFAULT_RULE_NAME,
            FUZZY_RULE_NAME) {

          var _explorationId = explorationContextService.getExplorationId();
          var _state = explorationStatesService.getState(
            editorContextService.getActiveStateName());

          $scope.stateContent = _state.content[0].value;
          $scope.inputTemplate = oppiaExplorationService.getInteractionHtml(
            stateInteractionIdService.savedMemento,
            stateCustomizationArgsService.savedMemento, 'testInteractionInput');
          $scope.answerTemplate = '';

          $scope.trainingData = [];
          $scope.classification = {feedbackIndex: 0, newOutcome: null};

          focusService.setFocus('testInteractionInput');

          $scope.createAnswerGroup = function() {
            if ($scope.classification.newOutcome) {
              _createAnswerGroup([], $scope.classification.newOutcome);
            }
          };

          $scope.finishTesting = function(reopen) {
            $modalInstance.close({
              'reopen': reopen
            });
          };

          $scope.submitAnswer = function(answer) {
            // TODO(bhenning): This should use the single classification
            // handler, not the batch.
            // TODO(bhenning): Some of the functionality here is duplicated with
            // the training modal.
            var unhandledAnswers = [answer];

            $scope.answerTemplate = oppiaExplorationService.getAnswerHtml(
              answer, stateInteractionIdService.savedMemento,
              stateCustomizationArgsService.savedMemento);

            answerClassificationService.getMatchingBatchClassificationResult(
              _explorationId, _state, unhandledAnswers).success(
                  function(classificationResults) {
                // TODO(ben): This should be exactly 1.
                var classificationResult = classificationResults[0];
                var feedback = 'Nothing';
                if (classificationResult.outcome.feedback.length > 0) {
                  feedback = classificationResult.outcome.feedback[0];
                }
                $scope.trainingData = [{
                  answer: unhandledAnswers[0],
                  feedback: feedback
                }];

                if (classificationResult.rule_spec_string !== DEFAULT_RULE_NAME &&
                    classificationResult.rule_spec_string !== FUZZY_RULE_NAME) {
                  $scope.classification.feedbackIndex = -1;
                } else {
                  $scope.classification.feedbackIndex = (
                    classificationResult.answer_group_index);
                }
              });
          };
        }]
    }).result.then(function(result) {
      // Check if the modal should be reopened right away.
      if (result.reopen) {
        $scope.openTestOppiaModal();
      }
    });
  };

  $scope.ANSWER_GROUP_LIST_SORTABLE_OPTIONS = {
    axis: 'y',
    cursor: 'move',
    handle: '.oppia-rule-sort-handle',
    items: '.oppia-sortable-rule-block',
    tolerance: 'pointer',
    start: function(e, ui) {
      $rootScope.$broadcast('externalSave');
      $scope.$apply();
      ui.placeholder.height(ui.item.height());

      // This maintains the current open/close state of the answer group. If an
      // closed answer group is dragged, keep it closed. If the dragged group is
      // open, keep it open.
      $scope.isDraggingActiveAnswerGroup = (
        ui.item.index() == responsesService.getActiveAnswerGroupIndex());
    },
    stop: function(e, ui) {
      responsesService.save($scope.answerGroups, $scope.defaultOutcome);

      // If the active group is being dragged, make sure its index is changed to
      // the answer group's new location.
      if ($scope.isDraggingActiveAnswerGroup) {
        $scope.changeActiveAnswerGroupIndex(ui.item.index());
        $scope.isDraggingActiveAnswerGroup = null;
      }
      $scope.$apply();
      $rootScope.$broadcast('externalSave');
    }
  };

  $scope.deleteAnswerGroup = function(index, evt) {
    // Prevent clicking on the delete button from also toggling the display
    // state of the answer group.
    evt.stopPropagation();

    warningsData.clear();
    $modal.open({
      templateUrl: 'modals/deleteAnswerGroup',
      backdrop: true,
      controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
        $scope.reallyDelete = function() {
          $modalInstance.close();
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }]
    }).result.then(function() {
      var successfullyDeleted = responsesService.deleteAnswerGroup(index);
      if (successfullyDeleted) {
        $rootScope.$broadcast('answerGroupDeleted');
      }
    });
  };

  $scope.saveActiveAnswerGroupFeedback = function(updatedOutcome) {
    responsesService.updateActiveAnswerGroup({
      'feedback': updatedOutcome.feedback
    });
  };

  $scope.saveActiveAnswerGroupDest = function(updatedOutcome) {
    responsesService.updateActiveAnswerGroup({'dest': updatedOutcome.dest});
  };

  $scope.saveActiveAnswerGroupRules = function(updatedRules) {
    responsesService.updateActiveAnswerGroup({'rules': updatedRules});
  };

  $scope.saveDefaultOutcomeFeedback = function(updatedOutcome) {
    responsesService.updateDefaultOutcome({
      'feedback': updatedOutcome.feedback
    });
  };

  $scope.saveDefaultOutcomeDest = function(updatedOutcome) {
    responsesService.updateDefaultOutcome({'dest': updatedOutcome.dest});
  };

  $scope.getAnswerChoices = function() {
    return responsesService.getAnswerChoices();
  };

  $scope.isOutcomeLooping = function(outcome) {
    var activeStateName = editorContextService.getActiveStateName();
    return outcome && (outcome.dest == activeStateName);
  };

  $scope.navigateToState = function(stateName) {
    routerService.navigateToMainTab(stateName);
  };
}]);

// A service that, given an exploration ID and state name, determines all of the
// answers which do not have certain classification and are not currently used
// as part of an fuzzy rule training models.
oppia.factory('trainingDataService', ['$http', 'responsesService',
    'FUZZY_RULE_NAME', function($http, responsesService, FUZZY_RULE_NAME) {

  // This goes through all answer group training data and the confirmed
  // unclassified answers to verify that the answer is unique; it will remove
  // any other occurrences from any training data inputs or the confirmed
  // unclassified answer list.
  var _ensureUniqueness = function(answer) {
    var answerGroups = responsesService.getAnswerGroups();
    var confirmedUnclassifiedAnswers = (
      responsesService.getConfirmedUnclassifiedAnswers());
    var updatedAnswerGroups = false;
    var updatedConfirmedUnclassifiedAnswers = false;

    var ensureUniquenessInData = function(answer, trainingData) {
      var index = trainingData.indexOf(answer);
      if (index != -1) {
        trainingData.splice(index, 1);
        return true;
      }
      return false;
    };

    // Guarantee uniqueness in all answer groups.
    for (var i = 0; i < answerGroups.length; i++) {
      var answerGroup = answerGroups[i];
      var ruleSpecs = answerGroup.rule_specs;
      var trainingData = null;
      for (var j = 0; j < ruleSpecs.length; j++) {
        var ruleSpec = ruleSpecs[j];
        if (ruleSpec.rule_type == FUZZY_RULE_NAME) {
          trainingData = ruleSpec.inputs.training_data;
          break;
        }
      }
      if (trainingData && ensureUniquenessInData(answer, trainingData)) {
        updatedAnswerGroups = true;
      }
    }

    // Guarantee uniqueness in the confirmed unclassified answers.
    updatedConfirmedUnclassifiedAnswers = ensureUniquenessInData(
      answer, confirmedUnclassifiedAnswers);

    if (updatedAnswerGroups) {
      responsesService.save(answerGroups, responsesService.getDefaultOutcome());
    }

    if (updatedConfirmedUnclassifiedAnswers) {
      responsesService.updateConfirmedUnclassifiedAnswers(
        confirmedUnclassifiedAnswers);
    }
  };

  return {
    // Returns a promise with the corresponding training data.
    getTrainingDataResult: function(explorationId, stateName, state) {
      var trainingDataUrl = '/createhandler/training_data/' + explorationId +
        '/' + encodeURIComponent(stateName);
      return $http.post(trainingDataUrl, {state: state});
    },

    getAllPotentialFeedback: function(state) {
      var feedback = [];
      var interaction = state.interaction;

      for (var i = 0; i < interaction.answer_groups.length; i++) {
        var outcome = interaction.answer_groups[i].outcome;
        feedback.push((outcome.feedback.length > 0) ? outcome.feedback[0] : '');
      }

      if (interaction.default_outcome) {
        var outcome = interaction.default_outcome;
        feedback.push((outcome.feedback.length > 0) ? outcome.feedback[0] : '');
      } else {
        feedback.push('');
      }

      return feedback;
    },

    trainAnswerGroup: function(answerGroupIndex, answer) {
      _ensureUniqueness(answer);

      var answerGroup = responsesService.getAnswerGroup(answerGroupIndex);
      var rules = answerGroup.rule_specs;

      // Ensure the answer group has a fuzzy rule.
      var fuzzyRule = null;
      for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        if (rule.rule_type == FUZZY_RULE_NAME) {
          fuzzyRule = rule;
          break;
        }
      }
      if (!fuzzyRule) {
        // Create new fuzzy rule for classification. All fuzzy rules should
        // match this schema.
        fuzzyRule = {
          'rule_type': FUZZY_RULE_NAME,
          'inputs': {
            'training_data': []
          }
        };
        rules.push(fuzzyRule);
      }

      // Train the rule to include this answer, but only if it's not already in
      // the training data.
      if (fuzzyRule.inputs.training_data.indexOf(answer) == -1) {
        fuzzyRule.inputs.training_data.push(answer);
      }

      responsesService.updateAnswerGroup(answerGroupIndex, {'rules': rules});
    },

    trainDefaultResponse: function(answer) {
      _ensureUniqueness(answer);

      var confirmedUnclassifiedAnswers = (
        responsesService.getConfirmedUnclassifiedAnswers());

      if (confirmedUnclassifiedAnswers.indexOf(answer) == -1) {
        confirmedUnclassifiedAnswers.push(answer);
      }

      responsesService.updateConfirmedUnclassifiedAnswers(
        confirmedUnclassifiedAnswers);
    }
  };
}]);

oppia.directive('trainingPanel', [function() {
  return {
    restrict: 'E',
    scope: {
      answer: '=',
      answerFeedback: '=',
      classification: '=',
      onCreateAnswerGroup: '&',
      onFinishTraining: '&'
    },
    templateUrl: 'teaching/trainingPanel',
    controller: [
      '$scope', 'oppiaExplorationService', 'editorContextService',
      'explorationStatesService', 'trainingDataService', 'responsesService',
      'stateInteractionIdService', 'stateCustomizationArgsService',
      function($scope, oppiaExplorationService, editorContextService,
          explorationStatesService, trainingDataService, responsesService,
          stateInteractionIdService, stateCustomizationArgsService) {
        $scope.changingFeedbackIndex = false;
        $scope.addingNewResponse = false;

        var _state = explorationStatesService.getState(
          editorContextService.getActiveStateName());
        $scope.allFeedback = trainingDataService.getAllPotentialFeedback(
          _state);

        // Use the multiple choice interaction to select the feedback that
        // should be used for a particular answer.
        var _customizationArgs = {
          'choices': {
            'value': $scope.allFeedback
          }
        };
        $scope.inputTemplate = oppiaExplorationService.getInteractionHtml(
          'MultipleChoiceInput', _customizationArgs, 'trainOppiaInput');

        var _updateAnswerTemplate = function() {
          $scope.answerTemplate = oppiaExplorationService.getAnswerHtml(
            $scope.answer, stateInteractionIdService.savedMemento,
            stateCustomizationArgsService.savedMemento);
        }
        _updateAnswerTemplate();
        $scope.$watch(
          function() {
            return $scope.answer;
          }, _updateAnswerTemplate);

        $scope.beginChangingFeedbackIndex = function() {
          $scope.changingFeedbackIndex = true;
        };

        $scope.beginAddingNewResponse = function() {
          $scope.classification.newOutcome = {
            'dest': editorContextService.getActiveStateName(),
            'feedback': [''],
            'param_changes': []
          };
          $scope.addingNewResponse = true;
        };

        $scope.confirmFeedbackIndex = function(index) {
          $scope.classification.feedbackIndex = index;

          if (index == responsesService.getAnswerGroupCount()) {
            trainingDataService.trainDefaultResponse($scope.answer);
          } else {
            trainingDataService.trainAnswerGroup(index, $scope.answer);
          }

          $scope.onFinishTraining();
        };
        $scope.confirmNewFeedback = function() {
          $scope.onCreateAnswerGroup();

          if ($scope.classification.newOutcome) {
            // Train the group with the answer.
            var index = responsesService.getAnswerGroupCount() - 1;
            trainingDataService.trainAnswerGroup(index, $scope.answer);
          }

          $scope.onFinishTraining();
        };

        // Use confirmFeedbackIndex to submit the MultipleChoice interaction.
        // Note that this is based on MultipleChoice submitting the selected
        // index, rather than the text of an answer.
        // TODO(bhenning): This needs to be changed when MultipleChoice no
        // longer refers to choices by their index.
        $scope.submitAnswer = $scope.confirmFeedbackIndex;
      }
    ]
  };
}]);

oppia.directive('demoInteractionPanel', [function() {
  return {
    restrict: 'E',
    scope: {
      stateContent: '=',
      inputTemplate: '=',
      onSubmitAnswer: '&'
    },
    templateUrl: 'teaching/demoInteractionPanel',
    controller: [
      '$scope', 'editorContextService', 'explorationStatesService',
      'INTERACTION_SPECS', 'INTERACTION_DISPLAY_MODE_INLINE',
      function($scope, editorContextService, explorationStatesService,
          INTERACTION_SPECS, INTERACTION_DISPLAY_MODE_INLINE) {
        var _stateName = editorContextService.getActiveStateName();
        var _state = explorationStatesService.getState(_stateName);
        $scope.interactionIsInline = (
          INTERACTION_SPECS[_state.interaction.id].display_mode ===
          INTERACTION_DISPLAY_MODE_INLINE);
        $scope.submitAnswer = function(answer) {
          $scope.onSubmitAnswer({answer: answer});
        };
      }
    ]
  };
}]);
