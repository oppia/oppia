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
  // Represents the current selected answer group, starting at index 0. If the
  // index equal to the number of answer groups (answerGroups.length), then it
  // is referring to the default outcome.
  var _activeAnswerGroupIndex = null;
  var _activeRuleIndex = null;
  var _answerGroups = null;
  var _defaultOutcome = null;
  var _answerChoices = null;

  var _saveAnswerGroups = function(newAnswerGroups) {
    var oldAnswerGroups = _answerGroupsMemento;
    var oldDefaultOutcome = _defaultOutcomeMemento;
    if (newAnswerGroups && oldAnswerGroups &&
        !angular.equals(newAnswerGroups, oldAnswerGroups)) {
      _answerGroups = newAnswerGroups;

      changeListService.editStateProperty(
        editorContextService.getActiveStateName(), 'answer_groups',
        angular.copy(newAnswerGroups), angular.copy(oldAnswerGroups));

      var activeStateName = editorContextService.getActiveStateName();
      var _stateDict = explorationStatesService.getState(activeStateName);
      _stateDict.interaction.answer_groups = angular.copy(
        _answerGroups);
      explorationStatesService.setState(activeStateName, _stateDict);

      graphDataService.recompute();
      _answerGroupsMemento = angular.copy(newAnswerGroups);
    }
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

  return {
    // The 'data' arg is a list of interaction handlers for the currently-active
    // state.
    init: function(data) {
      answerGroupsCache.reset();

      _answerGroups = angular.copy(data.answerGroups);
      _defaultOutcome = angular.copy(data.defaultOutcome);
      answerGroupsCache.set(
        stateInteractionIdService.savedMemento, _answerGroups);

      _answerGroupsMemento = angular.copy(_answerGroups);
      _defaultOutcomeMemento = angular.copy(_defaultOutcome);
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
      answerGroupsCache.set(newInteractionId, _answerGroups);

      _answerGroupsMemento = angular.copy(_answerGroups);
      _defaultOutcomeMemento = angular.copy(_defaultOutcome);
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
    deleteAnswerGroup: function(index) {
      _answerGroupsMemento = angular.copy(_answerGroups);
      _answerGroups.splice(index, 1);
      _saveAnswerGroups(_answerGroups);
      _activeAnswerGroupIndex = -1;
      return true;
    },
    updateActiveAnswerGroup: function(updates) {
      var answerGroup = _answerGroups[_activeAnswerGroupIndex];
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
    // Updates answer choices when the interaction requires it -- for example,
    // the rules for multiple choice need to refer to the multiple choice
    // interaction's customization arguments.
    updateAnswerChoices: function(newAnswerChoices) {
      _answerChoices = newAnswerChoices;
    },
    getAnswerGroups: function() {
      return angular.copy(_answerGroups);
    },
    getDefaultOutcome: function() {
      return angular.copy(_defaultOutcome);
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
      _answerGroupsMemento = angular.copy($scope.answerGroups);
      $scope.answerGroups.push({
        'rule_specs': [result.tmpRule],
        'outcome': result.tmpOutcome
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
