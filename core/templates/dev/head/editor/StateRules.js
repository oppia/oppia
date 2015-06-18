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
oppia.factory('interactionAnswerGroupsCache', [function() {
  var _cache = {};
  return {
    reset: function() {
      _cache = {};
    },
    contains: function(interactionId) {
      return _cache.hasOwnProperty(interactionId);
    },
    set: function(interactionId, interactionAnswerGroups) {
      _cache[interactionId] = angular.copy(interactionAnswerGroups);
    },
    get: function(interactionId) {
      if (!_cache.hasOwnProperty(interactionId)) {
        return null;
      }
      return angular.copy(_cache[interactionId]);
    }
  };
}]);


oppia.factory('rulesService', [
    'stateInteractionIdService', 'INTERACTION_SPECS', 'interactionAnswerGroupsCache',
    'editorContextService', 'changeListService', 'explorationStatesService', 'graphDataService',
    'warningsData',
    function(
      stateInteractionIdService, INTERACTION_SPECS, interactionAnswerGroupsCache,
      editorContextService, changeListService, explorationStatesService, graphDataService,
      warningsData) {

  var _interactionAnswerGroupsMemento = null;
  var _interactionDefaultOutcomeMemento = null;
  var _activeGroupIndex = null;
  var _activeRuleIndex = null;
  var _interactionAnswerGroups = null;
  var _interactionDefaultOutcome = null;
  var _answerChoices = null;
  var _interactionAnswerGroupSpecs = null;

  var _refreshAnswerGroupSpecs = function() {
    if (!stateInteractionIdService.savedMemento) {
      // This can happen for a newly-created state, where the user has not set
      // an interaction id.
      _interactionAnswerGroupSpecs = null;
      return;
    }

    _interactionAnswerGroupSpecs = INTERACTION_SPECS[
      stateInteractionIdService.savedMemento].handler_specs;
  };

  var _saveInteractionAnswerGroups = function(newGroups) {
    var oldGroups = _interactionAnswerGroupsMemento;
    var oldDefaultOutcome = _interactionDefaultOutcomeMemento;
    if (newGroups && oldGroups && !angular.equals(newGroups, oldGroups)) {
      _interactionAnswerGroups = newGroups;

      changeListService.editStateProperty(
        editorContextService.getActiveStateName(), 'answer_groups',
        angular.copy(newGroups), angular.copy(oldGroups));

      var activeStateName = editorContextService.getActiveStateName();
      var _stateDict = explorationStatesService.getState(activeStateName);
      _stateDict.interaction.answer_groups = angular.copy(
        _interactionAnswerGroups);
      explorationStatesService.setState(activeStateName, _stateDict);

      graphDataService.recompute();
      _interactionAnswerGroupsMemento = angular.copy(newGroups);
    }
  };

  var _saveInteractionDefaultOutcome = function(newDefaultOutcome) {
    var oldDefaultOutcome = _interactionDefaultOutcomeMemento;
    if (newDefaultOutcome && oldDefaultOutcome &&
        !angular.equals(newDefaultOutcome, oldDefaultOutcome)) {
      _interactionDefaultOutcome = newDefaultOutcome;

      changeListService.editStateProperty(
        editorContextService.getActiveStateName(),
        'default_outcome', angular.copy(newDefaultOutcome),
        angular.copy(oldDefaultOutcome));

      var activeStateName = editorContextService.getActiveStateName();
      var _stateDict = explorationStatesService.getState(activeStateName);
      _stateDict.interaction.default_outcome = angular.copy(
        _interactionDefaultOutcome);
      explorationStatesService.setState(activeStateName, _stateDict);

      _interactionDefaultOutcomeMemento = angular.copy(newDefaultOutcome);
    }
  };

  return {
    // The 'data' arg is a list of interaction handlers for the currently-active state.
    init: function(data) {
      interactionAnswerGroupsCache.reset();
      _refreshAnswerGroupSpecs();

      _interactionAnswerGroups = angular.copy(data.answerGroups);
      _interactionDefaultOutcome = angular.copy(data.defaultOutcome);
      interactionAnswerGroupsCache.set(
        stateInteractionIdService.savedMemento, _interactionAnswerGroups);

      _interactionAnswerGroupsMemento = angular.copy(_interactionAnswerGroups);
      _interactionDefaultOutcomeMemento = angular.copy(
        _interactionDefaultOutcome);
      _activeGroupIndex = 0;
      _activeRuleIndex = 0;
    },
    onInteractionIdChanged: function(newInteractionId, callback) {
      _refreshAnswerGroupSpecs();

      if (interactionAnswerGroupsCache.contains(newInteractionId)) {
        _interactionAnswerGroups = interactionAnswerGroupsCache.get(newInteractionId);
      } else {
        // Preserve just the default rule by retaining the default outcome,
        // unless the new interaction id is a terminal one (in which case,
        // change its destination to be a self-loop instead).
        _interactionAnswerGroups = [];
        if (newInteractionId && INTERACTION_SPECS[newInteractionId].is_terminal) {
          _interactionDefaultOutcome.dest = editorContextService.getActiveStateName();
        }
      }

      _saveInteractionAnswerGroups(_interactionAnswerGroups);
      _saveInteractionDefaultOutcome(_interactionDefaultOutcome);
      interactionAnswerGroupsCache.set(newInteractionId, _interactionAnswerGroups);

      _interactionAnswerGroupsMemento = angular.copy(_interactionAnswerGroups);
      _interactionDefaultOutcomeMemento = angular.copy(
        _interactionDefaultOutcome);
      _activeGroupIndex = 0;
      _activeRuleIndex = 0;

      if (callback) {
        callback();
      }
    },
    getActiveGroupIndex: function() {
      return _activeGroupIndex;
    },
    getAnswerChoices: function() {
      return angular.copy(_answerChoices);
    },
    changeActiveGroupIndex: function(newIndex) {
      _activeGroupIndex = newIndex;
    },
    getActiveRule: function() {
      if (_interactionAnswerGroups) {
        return _interactionAnswerGroups[_activeGroupIndex];
      } else {
        return null;
      }
    },
    deleteActiveRule: function() {
      if (!window.confirm('Are you sure you want to delete this rule?')) {
        return false;
      }
      _interactionAnswerGroupsMemento = angular.copy(_interactionAnswerGroups);
      _interactionAnswerGroups.splice(_activeGroupIndex, 1);
      _saveInteractionAnswerGroups(_interactionAnswerGroups);
      _activeGroupIndex = 0;
      return true;
    },
    saveActiveRule: function(activeRule, activeOutcome) {
      // TODO(bhenning): Change this to appropriately distinguish between saving
      // rules and saving groups.
      var group = _interactionAnswerGroups[_activeGroupIndex];
      group.rule_specs[_activeRuleIndex] = activeRule;
      group.outcome = activeOutcome;
      _saveInteractionAnswerGroups(_interactionAnswerGroups);
    },
    saveDefaultRule: function(outcome) {
      _saveInteractionDefaultOutcome(outcome);
    },
    getInteractionAnswerGroupSpecs: function() {
      return angular.copy(_interactionAnswerGroupSpecs);
    },
    // Updates answer choices when the interaction requires it -- for example,
    // the rules for multiple choice need to refer to the multiple choice
    // interaction's customization arguments.
    updateAnswerChoices: function(newAnswerChoices) {
      _answerChoices = newAnswerChoices;
    },
    getInteractionAnswerGroups: function() {
      return angular.copy(_interactionAnswerGroups);
    },
    getInteractionDefaultOutcome: function() {
      return angular.copy(_interactionDefaultOutcome);
    },
    // This registers the change to the handlers in the list of changes, and also
    // updates the states object in explorationStatesService.
    save: function(newGroups, defaultOutcome) {
      _saveInteractionAnswerGroups(newGroups);
      _saveInteractionDefaultOutcome(defaultOutcome);
    }
  };
}]);


oppia.controller('StateRules', [
    '$scope', '$rootScope', '$modal', 'stateInteractionIdService', 'editorContextService',
    'warningsData', 'rulesService',
    function(
      $scope, $rootScope, $modal, stateInteractionIdService, editorContextService,
      warningsData, rulesService) {
  $scope.answerChoices = null;

  $scope.getAnswerChoices = function() {
    return rulesService.getAnswerChoices();
  };
  $scope.editorContextService = editorContextService;

  $scope.changeActiveGroupIndex = function(newIndex) {
    $rootScope.$broadcast('externalSave');
    rulesService.changeActiveGroupIndex(newIndex);
    $scope.activeGroupIndex = rulesService.getActiveGroupIndex();
  };

  $scope.getCurrentInteractionId = function() {
    return stateInteractionIdService.savedMemento;
  };

  $scope.$on('initializeAnswerGroups', function(evt, data) {
    rulesService.init(data);
    $scope.interactionAnswerGroups = rulesService.getInteractionAnswerGroups();
    $scope.interactionDefaultOutcome = rulesService.getInteractionDefaultOutcome();
    $scope.activeGroupIndex = rulesService.getActiveGroupIndex();
    $scope.answerChoices = $scope.getAnswerChoices();
    $rootScope.$broadcast('externalSave');
  });

  $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
    $rootScope.$broadcast('externalSave');
    rulesService.onInteractionIdChanged(newInteractionId, function() {
      $scope.interactionAnswerGroups = rulesService.getInteractionAnswerGroups();
      $scope.interactionDefaultOutcome = rulesService.getInteractionDefaultOutcome();
      $scope.activeGroupIndex = rulesService.getActiveGroupIndex();
      $scope.answerChoices = $scope.getAnswerChoices();
    });
  });

  $scope.$on('ruleDeleted', function(evt) {
    $scope.interactionAnswerGroups = rulesService.getInteractionAnswerGroups();
    $scope.interactionDefaultOutcome = rulesService.getInteractionDefaultOutcome();
    $scope.activeGroupIndex = rulesService.getActiveGroupIndex();
  });

  $scope.$on('ruleSaved', function(evt) {
    $scope.interactionAnswerGroups = rulesService.getInteractionAnswerGroups();
    $scope.interactionDefaultOutcome = rulesService.getInteractionDefaultOutcome();
    $scope.activeGroupIndex = rulesService.getActiveGroupIndex();
  });

  // Updates answer choices when the interaction requires it -- for example,
  // the rules for multiple choice need to refer to the multiple choice
  // interaction's customization arguments.
  // TODO(sll): Remove the need for this watcher, or make it less ad hoc.
  $scope.$on('updateAnswerChoices', function(evt, newAnswerChoices) {
    rulesService.updateAnswerChoices(newAnswerChoices);
    $scope.answerChoices = $scope.getAnswerChoices();
  });

  $scope.openAddRuleModal = function() {
    warningsData.clear();
    $rootScope.$broadcast('externalSave');

    $modal.open({
      templateUrl: 'modals/addRule',
      backdrop: true,
      controller: [
          '$scope', '$modalInstance', 'rulesService', 'editorContextService',
          function($scope, $modalInstance, rulesService, editorContextService) {
        $scope.tmpRule = {
          name: null,
          inputs: {},
        };
        $scope.tmpOutcome = {
          dest: editorContextService.getActiveStateName(),
          feedback: [''],
          param_changes: []
        };
        $scope.isDefaultRule = false;

        $scope.isRuleEmpty = function(tmpOutcome) {
          var hasFeedback = false;
          for (var i = 0; i < tmpOutcome.feedback.length; i++) {
            if (tmpOutcome.feedback[i].length > 0) {
              hasFeedback = true;
            }
          }

          return (
            tmpOutcome.dest === editorContextService.getActiveStateName() &&
            !hasFeedback);
        };

        $scope.addRuleForm = {};

        $scope.interactionAnswerGroupSpecs = rulesService.getInteractionAnswerGroupSpecs();
        $scope.answerChoices = rulesService.getAnswerChoices();

        $scope.addNewRule = function() {
          $scope.$broadcast('saveRuleDetails');
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
      _interactionAnswerGroupsMemento = angular.copy($scope.interactionAnswerGroups);
      $scope.interactionAnswerGroups.push({
        'rule_specs': [tmpRule],
        'outcome': tmpOutcome
      });
      rulesService.save($scope.interactionAnswerGroups,
        $scope.interactionDefaultOutcome);
      $scope.changeActiveGroupIndex($scope.interactionAnswerGroups.length - 1);
    });
  };

  $scope.isDraggingOccurring = false;

  $scope.RULE_LIST_SORTABLE_OPTIONS = {
    axis: 'y',
    cursor: 'move',
    handle: '.oppia-rule-sort-handle',
    items: '.oppia-sortable-rule-block',
    tolerance: 'pointer',
    start: function(e, ui) {
      $rootScope.$broadcast('externalSave');
      $scope.isDraggingOccurring = true;
      $scope.$apply();
      ui.placeholder.height(ui.item.height());
    },
    stop: function(e, ui) {
      $scope.isDraggingOccurring = false;
      $scope.$apply();
      rulesService.save($scope.interactionAnswerGroups,
        $scope.interactionDefaultOutcome);
      $scope.changeActiveGroupIndex(ui.item.index());
      $rootScope.$broadcast('externalSave');
    }
  };

  $scope.isActiveRuleEditorShown = function() {
    var activeRule = rulesService.getActiveRule();
    return activeRule && stateInteractionIdService.savedMemento && (
      activeRule.definition.rule_type !== 'default' ||
      activeRule.dest !== editorContextService.getActiveStateName() ||
      activeRule.feedback.length > 0);
  };

  $scope.deleteActiveRule = function() {
    var successfullyDeleted = rulesService.deleteActiveRule();
    if (successfullyDeleted) {
      $rootScope.$broadcast('ruleDeleted');
    }
  };

  $scope.saveActiveRule = function(updatedRule, updatedOutcome) {
    rulesService.saveActiveRule(updatedRule, updatedOutcome);
    $rootScope.$broadcast('ruleSaved');
  };

  $scope.saveDefaultRule = function(updatedOutcome) {
    rulesService.saveDefaultRule(updatedOutcome);
    $rootScope.$broadcast('ruleSaved');
  };
}]);
