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
 * @fileoverview Controllers for rules corresponding to a state's interaction.
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
  var _activeGroupIndex = null;
  var _activeRuleIndex = null;
  var _answerGroups = null;
  var _defaultOutcome = null;
  var _answerChoices = null;

  var _saveAnswerGroups = function(newGroups) {
    var oldGroups = _answerGroupsMemento;
    var oldDefaultOutcome = _defaultOutcomeMemento;
    if (newGroups && oldGroups && !angular.equals(newGroups, oldGroups)) {
      _answerGroups = newGroups;

      changeListService.editStateProperty(
        editorContextService.getActiveStateName(), 'answer_groups',
        angular.copy(newGroups), angular.copy(oldGroups));

      var activeStateName = editorContextService.getActiveStateName();
      var _stateDict = explorationStatesService.getState(activeStateName);
      _stateDict.interaction.answer_groups = angular.copy(
        _answerGroups);
      explorationStatesService.setState(activeStateName, _stateDict);

      graphDataService.recompute();
      _answerGroupsMemento = angular.copy(newGroups);
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
    // The 'data' arg is a list of interaction handlers for the currently-active state.
    init: function(data) {
      answerGroupsCache.reset();

      _answerGroups = angular.copy(data.answerGroups);
      _defaultOutcome = angular.copy(data.defaultOutcome);
      answerGroupsCache.set(
        stateInteractionIdService.savedMemento, _answerGroups);

      _answerGroupsMemento = angular.copy(_answerGroups);
      _defaultOutcomeMemento = angular.copy(
        _defaultOutcome);
      _activeGroupIndex = 0;
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
              'dest': editorContextService.getActiveStateName()
            };
          }
        }
      }

      _saveAnswerGroups(_answerGroups);
      _saveDefaultOutcome(_defaultOutcome);
      answerGroupsCache.set(newInteractionId, _answerGroups);

      _answerGroupsMemento = angular.copy(_answerGroups);
      _defaultOutcomeMemento = angular.copy(_defaultOutcome);
      _activeGroupIndex = 0;
      _activeRuleIndex = 0;

      if (callback) {
        callback();
      }
    },
    getActiveGroupIndex: function() {
      return _activeGroupIndex;
    },
    changeActiveGroupIndex: function(newIndex) {
      _activeGroupIndex = newIndex;
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
    deleteGroup: function(index) {
      if (!window.confirm('Are you sure you want to delete this response?')) {
        return false;
      }
      _answerGroupsMemento = angular.copy(_answerGroups);
      _answerGroups.splice(index, 1);
      _saveAnswerGroups(_answerGroups);
      _activeGroupIndex = 0;
      return true;
    },
    saveActiveGroup: function(activeRules, activeOutcome) {
      var group = _answerGroups[_activeGroupIndex];
      group.rule_specs = activeRules;
      group.outcome = activeOutcome;
      _saveAnswerGroups(_answerGroups);
    },
    saveDefaultOutcome: function(outcome) {
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
    // This registers the change to the handlers in the list of changes, and also
    // updates the states object in explorationStatesService.
    save: function(newGroups, defaultOutcome) {
      _saveAnswerGroups(newGroups);
      _saveDefaultOutcome(defaultOutcome);
    }
  };
}]);


oppia.controller('StateRules', [
    '$scope', '$rootScope', '$modal', '$filter', 'stateInteractionIdService',
    'editorContextService', 'warningsData', 'responsesService', 'routerService',
    'PLACEHOLDER_OUTCOME_DEST',
    function(
      $scope, $rootScope, $modal, $filter, stateInteractionIdService,
      editorContextService, warningsData, responsesService, routerService,
      PLACEHOLDER_OUTCOME_DEST) {
  $scope.editorContextService = editorContextService;

  $scope.changeActiveGroupIndex = function(newIndex) {
    $rootScope.$broadcast('externalSave');
    responsesService.changeActiveGroupIndex(newIndex);
    $scope.activeGroupIndex = responsesService.getActiveGroupIndex();
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
    $scope.activeGroupIndex = responsesService.getActiveGroupIndex();
    $rootScope.$broadcast('externalSave');
  });

  $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
    $rootScope.$broadcast('externalSave');
    responsesService.onInteractionIdChanged(newInteractionId, function() {
      $scope.answerGroups = responsesService.getAnswerGroups();
      $scope.defaultOutcome = responsesService.getDefaultOutcome();
      $scope.activeGroupIndex = responsesService.getActiveGroupIndex();
    });
  });

  $scope.$on('groupDeleted', function(evt) {
    $scope.answerGroups = responsesService.getAnswerGroups();
    $scope.defaultOutcome = responsesService.getDefaultOutcome();
    $scope.activeGroupIndex = responsesService.getActiveGroupIndex();
  });

  $scope.$on('groupSaved', function(evt) {
    $scope.answerGroups = responsesService.getAnswerGroups();
    $scope.defaultOutcome = responsesService.getDefaultOutcome();
    $scope.activeGroupIndex = responsesService.getActiveGroupIndex();
  });

  $scope.openAddRuleModal = function() {
    warningsData.clear();
    $rootScope.$broadcast('externalSave');

    $modal.open({
      templateUrl: 'modals/addRule',
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

        $scope.addGroupForm = {};

        $scope.addNewResponse = function() {
          $scope.$broadcast('saveOutcomeDetails');
          $modalInstance.close({
            'tmpRule': $scope.tmpRule,
            'tmpOutcome': $scope.tmpOutcome
          });
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }]
    }).result.then(function(result) {
      var tmpRule = result['tmpRule'];
      var tmpOutcome = result['tmpOutcome'];
      _answerGroupsMemento = angular.copy($scope.answerGroups);
      $scope.answerGroups.push({
        'rule_specs': [tmpRule],
        'outcome': tmpOutcome
      });
      responsesService.save(
        $scope.answerGroups, $scope.defaultOutcome);
      $scope.changeActiveGroupIndex($scope.answerGroups.length - 1);
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
    },
    stop: function(e, ui) {
      $scope.$apply();
      responsesService.save(
        $scope.answerGroups, $scope.defaultOutcome);
      $scope.changeActiveGroupIndex(ui.item.index());
      $rootScope.$broadcast('externalSave');
    }
  };

  $scope.deleteGroup = function(index) {
    var successfullyDeleted = responsesService.deleteGroup(index);
    if (successfullyDeleted) {
      $rootScope.$broadcast('groupDeleted');
    }
  };

  $scope.saveActiveGroup = function(updatedRules, updatedOutcome) {
    responsesService.saveActiveGroup(updatedRules, updatedOutcome);
    $rootScope.$broadcast('groupSaved');
  };

  $scope.saveDefaultOutcome = function(updatedOutcome) {
    responsesService.saveDefaultOutcome(updatedOutcome);
    $rootScope.$broadcast('groupSaved');
  };

  $scope.getAnswerChoices = function(group) {
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
