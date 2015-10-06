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
    '$rootScope', 'stateInteractionIdService', 'INTERACTION_SPECS',
    'answerGroupsCache', 'editorContextService', 'changeListService',
    'explorationStatesService', 'graphDataService', 'warningsData',
    function(
      $rootScope, stateInteractionIdService, INTERACTION_SPECS,
      answerGroupsCache, editorContextService, changeListService,
      explorationStatesService, graphDataService, warningsData) {

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
      $rootScope.$broadcast('answerGroupChanged');

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
    'explorationContextService', 'trainingDataService',
    'PLACEHOLDER_OUTCOME_DEST', 'INTERACTION_SPECS',
    function(
      $scope, $rootScope, $modal, $filter, stateInteractionIdService,
      editorContextService, warningsData, responsesService, routerService,
      explorationContextService, trainingDataService,
      PLACEHOLDER_OUTCOME_DEST, INTERACTION_SPECS) {
  $scope.editorContextService = editorContextService;

  var _initializeTrainingData = function() {
    var explorationId = explorationContextService.getExplorationId();
    var currentStateName = editorContextService.getActiveStateName();
    trainingDataService.initializeTrainingData(explorationId, currentStateName);
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

    // Prompt the user to create a new response if it is not a 'Continue' or
    // non-terminal interaction and if an actual interaction is specified
    // (versus one being deleted).
    if (newInteractionId && newInteractionId !== 'Continue' &&
        !INTERACTION_SPECS[newInteractionId].is_terminal) {
      // Open the training interface if the interaction is trainable, otherwise
      // open the answer group modal.
      if (GLOBALS.SHOW_TRAINABLE_UNRESOLVED_ANSWERS &&
          $scope.isCurrentInteractionTrainable()) {
        $scope.openTeachOppiaModal();
      } else {
        $scope.openAddAnswerGroupModal();
      }
    }
  });

  $scope.$on('answerGroupChanged', function(evt) {
    $scope.answerGroups = responsesService.getAnswerGroups();
    $scope.defaultOutcome = responsesService.getDefaultOutcome();
    $scope.activeAnswerGroupIndex = (
      responsesService.getActiveAnswerGroupIndex());
  });

  $scope.$on('updateAnswerChoices', function(evt, newAnswerChoices) {
    responsesService.updateAnswerChoices(newAnswerChoices);
  });

  $scope.openTeachOppiaModal = function() {
    warningsData.clear();
    $rootScope.$broadcast('externalSave');

    $modal.open({
      templateUrl: 'modals/teachOppia',
      backdrop: true,
      controller: ['$scope', '$modalInstance',
        'oppiaExplorationHtmlFormatterService', 'stateInteractionIdService',
        'stateCustomizationArgsService', 'explorationContextService',
        'editorContextService', 'explorationStatesService',
        'trainingDataService', 'answerClassificationService', 'focusService',
        'DEFAULT_RULE_NAME', 'FUZZY_RULE_TYPE',
        function($scope, $modalInstance, oppiaExplorationHtmlFormatterService,
            stateInteractionIdService, stateCustomizationArgsService,
            explorationContextService, editorContextService,
            explorationStatesService, trainingDataService,
            answerClassificationService, focusService, DEFAULT_RULE_NAME,
            FUZZY_RULE_TYPE) {

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

          // See the training panel directive in StateEditor for an explanation
          // on the structure of this object.
          $scope.classification = {answerGroupIndex: 0, newOutcome: null};

          focusService.setFocus('testInteractionInput');

          $scope.finishTeaching = function(reopen) {
            $modalInstance.close({
              'reopen': reopen
            });
          };

          $scope.submitAnswer = function(answer) {
            $scope.answerTemplate = (
              oppiaExplorationHtmlFormatterService.getAnswerHtml(
                answer, stateInteractionIdService.savedMemento,
                stateCustomizationArgsService.savedMemento));

            answerClassificationService.getMatchingEditorClassificationResult(
              _explorationId, _state, answer).success(
                  function(classificationResult) {
                var feedback = 'Nothing';
                var dest = classificationResult.outcome.dest;
                if (classificationResult.outcome.feedback.length > 0) {
                  feedback = classificationResult.outcome.feedback[0];
                }
                if (dest == _stateName) {
                  dest = '<em>(try again)</em>';
                }
                $scope.trainingDataAnswer = answer;
                $scope.trainingDataFeedback = feedback;
                $scope.trainingDataOutcomeDest = dest;

                if (classificationResult.rule_spec_string !== DEFAULT_RULE_NAME &&
                    classificationResult.rule_spec_string !== FUZZY_RULE_TYPE) {
                  $scope.classification.answerGroupIndex = -1;
                } else {
                  $scope.classification.answerGroupIndex = (
                    classificationResult.answer_group_index);
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
      // Create a new answer group.
      $scope.answerGroups.push({
        'rule_specs': [result.tmpRule],
        'outcome': angular.copy(result.tmpOutcome)
      });
      responsesService.save($scope.answerGroups, $scope.defaultOutcome);
      $scope.changeActiveAnswerGroupIndex($scope.answerGroups.length - 1);

      // After saving it, check if the modal should be reopened right away.
      if (result.reopen) {
        $scope.openAddAnswerGroupModal();
      }
    });
  };

  $scope.isDraggingActiveAnswerGroup = null;

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
      responsesService.deleteAnswerGroup(index);
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
