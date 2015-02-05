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
oppia.factory('interactionHandlersCache', [function() {
  var _cache = {};
  return {
    reset: function() {
      _cache = {};
    },
    contains: function(interactionId) {
      return _cache.hasOwnProperty(interactionId);
    },
    set: function(interactionId, interactionHandlers) {
      _cache[interactionId] = angular.copy(interactionHandlers);
    },
    get: function(interactionId) {
      if (!_cache.hasOwnProperty(interactionId)) {
        return null;
      }
      return angular.copy(_cache[interactionId]);
    }
  };
}]);


oppia.controller('StateRules', [
    '$scope', '$log', '$modal', 'changeListService', 'interactionRepositoryService',
    'interactionHandlersCache', 'stateInteractionIdService', 'editorContextService',
    'explorationStatesService', 'graphDataService', 'warningsData',
    function(
      $scope, $log, $modal, changeListService, interactionRepositoryService,
      interactionHandlersCache, stateInteractionIdService, editorContextService,
      explorationStatesService, graphDataService, warningsData) {

  var _interactionHandlersMemento = null;
  $scope.answerChoices = null;

  $scope.changeActiveRuleIndex = function(newIndex) {
    $scope.activeRuleIndex = newIndex;
  };

  $scope.getCurrentInteractionId = function() {
    return stateInteractionIdService.savedMemento;
  };

  var _refreshHandlerSpecs = function() {
    if (!stateInteractionIdService.savedMemento) {
      $log.error('ERROR: Interaction id not specified.');
    }

    interactionRepositoryService.getInteractionRepository().then(function(interactionRepository) {
      $scope.interactionHandlerSpecs = angular.copy(
        interactionRepository[stateInteractionIdService.savedMemento].handler_specs);
    });
  };

  $scope.$on('initializeHandlers', function(evt, data) {
    interactionHandlersCache.reset();
    _refreshHandlerSpecs();

    // Stores rules as key-value pairs. For each pair, the key is the
    // corresponding handler name and the value has several keys:
    // - 'definition' (the rule definition)
    // - 'description' (the rule description string)
    // - 'dest' (the destination for this rule)
    // - 'feedback' (list of feedback given for this rule)
    // - 'param_changes' (parameter changes associated with this rule)
    $scope.interactionHandlers = {};
    for (var i = 0; i < data.handlers.length; i++) {
      $scope.interactionHandlers[data.handlers[i].name] = data.handlers[i].rule_specs;
    }
    interactionHandlersCache.set(
      stateInteractionIdService.savedMemento, $scope.interactionHandlers);

    _interactionHandlersMemento = angular.copy($scope.interactionHandlers);
    $scope.activeRuleIndex = 0;
  });

  // Updates answer choices when the interaction requires it -- for example,
  // the rules for multiple choice need to refer to the multiple choice
  // interaction's customization arguments.
  // TODO(sll): Remove the need for this watcher, or make it less ad hoc.
  $scope.$on('updateAnswerChoices', function(evt, newAnswerChoices) {
    $scope.answerChoices = newAnswerChoices;
  });

  $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
    _refreshHandlerSpecs();
    if (interactionHandlersCache.contains(newInteractionId)) {
      $scope.interactionHandlers = interactionHandlersCache.get(newInteractionId);
    } else {
      // Preserve just the default rule.
      $scope.interactionHandlers = {
        'submit': [
          $scope.interactionHandlers['submit'][$scope.interactionHandlers['submit'].length - 1]
        ]
      };
    }

    $scope.saveInteractionHandlers(
      $scope.interactionHandlers, _interactionHandlersMemento);
    interactionHandlersCache.set(
      stateInteractionIdService.savedMemento, $scope.interactionHandlers);

    _interactionHandlersMemento = angular.copy($scope.interactionHandlers);
    $scope.activeRuleIndex = 0;
  });

  $scope.openAddRuleModal = function() {
    warningsData.clear();

    $modal.open({
      templateUrl: 'modals/addRule',
      backdrop: 'static',
      resolve: {
        interactionHandlerSpecs: function() {
          return $scope.interactionHandlerSpecs;
        },
        answerChoices: function() {
          return $scope.answerChoices;
        }
      },
      controller: [
          '$scope', '$modalInstance', 'interactionHandlerSpecs', 'answerChoices',
          function($scope, $modalInstance, interactionHandlerSpecs, answerChoices) {
        $scope.currentRuleDescription = null;
        $scope.currentRuleDefinition = {
          rule_type: 'atomic',
          name: null,
          inputs: {},
          subject: 'answer'
        };

        $scope.interactionHandlerSpecs = interactionHandlerSpecs;
        $scope.answerChoices = answerChoices;

        $scope.addNewRule = function() {
          $modalInstance.close({
            description: $scope.currentRuleDescription,
            definition: $scope.currentRuleDefinition
          });
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }]
    }).result.then(function(tmpRule) {
      _interactionHandlersMemento = angular.copy($scope.interactionHandlers);

      // Move the tmp rule into the list of 'real' rules.
      var numRules = $scope.interactionHandlers['submit'].length;
      $scope.interactionHandlers['submit'].splice(numRules - 1, 0, {
        description: tmpRule.description,
        definition: tmpRule.definition,
        dest: editorContextService.getActiveStateName(),
        feedback: [],
        param_changes: []
      });

      $scope.saveInteractionHandlers(
        $scope.interactionHandlers, _interactionHandlersMemento);

      $scope.activeRuleIndex = $scope.interactionHandlers['submit'].length - 2;
    });
  };

  $scope.RULE_LIST_SORTABLE_OPTIONS = {
    axis: 'y',
    cursor: 'move',
    handle: '.oppia-rule-sort-handle',
    items: '.oppia-sortable-rule-block',
    tolerance: 'pointer',
    start: function(e, ui) {
      $scope.$broadcast('externalSave');
      $scope.$apply();
      _interactionHandlersMemento = angular.copy($scope.interactionHandlers);
      ui.placeholder.height(ui.item.height());
    },
    stop: function(e, ui) {
      $scope.$apply();
      $scope.saveInteractionHandlers(
        $scope.interactionHandlers, _interactionHandlersMemento);
    }
  };

  $scope.deleteRule = function(handlerName, index) {
    if (index === $scope.interactionHandlers.length - 1) {
      warningsData.addWarning('Cannot delete default rule.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }
    _interactionHandlersMemento = angular.copy($scope.interactionHandlers);
    $scope.interactionHandlers[handlerName].splice(index, 1);
    $scope.saveInteractionHandlers(
      $scope.interactionHandlers, _interactionHandlersMemento);
  };

  $scope.saveRule = function() {
    $scope.saveInteractionHandlers(
      $scope.interactionHandlers, _interactionHandlersMemento);
  };

  $scope.saveInteractionHandlers = function(newHandlers, oldHandlers) {
    if (newHandlers && oldHandlers && !angular.equals(newHandlers, oldHandlers)) {
      changeListService.editStateProperty(
        editorContextService.getActiveStateName(), 'widget_handlers',
        angular.copy(newHandlers), angular.copy(oldHandlers));
      $scope.updateStateHandlersData();
      graphDataService.recompute();
      _interactionHandlersMemento = angular.copy(newHandlers);
    }
  };

  $scope.updateStateHandlersData = function() {
    var activeStateName = editorContextService.getActiveStateName();

    var _stateDict = explorationStatesService.getState(activeStateName);
    for (var i = 0; i < _stateDict.interaction.handlers.length; i++) {
      var handlerName = _stateDict.interaction.handlers[i].name;
      _stateDict.interaction.handlers[i].rule_specs = $scope.interactionHandlers[
        handlerName];
    }
    explorationStatesService.setState(activeStateName, _stateDict);
  };
}]);
