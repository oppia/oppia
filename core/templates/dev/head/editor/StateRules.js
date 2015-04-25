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


oppia.factory('rulesService', [
    'stateInteractionIdService', 'INTERACTION_SPECS', 'interactionHandlersCache',
    'editorContextService', 'changeListService', 'explorationStatesService', 'graphDataService',
    'warningsData',
    function(
      stateInteractionIdService, INTERACTION_SPECS, interactionHandlersCache,
      editorContextService, changeListService, explorationStatesService, graphDataService,
      warningsData) {

  var _interactionHandlersMemento = null;
  var _activeRuleIndex = null;
  var _interactionHandlers = null;
  var _answerChoices = null;
  var _interactionHandlerSpecs = null;

  var _refreshHandlerSpecs = function() {
    if (!stateInteractionIdService.savedMemento) {
      // This can happen for a newly-created state, where the user has not set
      // an interaction id.
      _interactionHandlerSpecs = null;
      return;
    }

    _interactionHandlerSpecs = INTERACTION_SPECS[
      stateInteractionIdService.savedMemento].handler_specs;
  };

  var _saveInteractionHandlers = function(newHandlers) {
    var oldHandlers = _interactionHandlersMemento;
    if (newHandlers && oldHandlers && !angular.equals(newHandlers, oldHandlers)) {
      _interactionHandlers = newHandlers;

      changeListService.editStateProperty(
        editorContextService.getActiveStateName(), 'widget_handlers',
        angular.copy(newHandlers), angular.copy(oldHandlers));

      var activeStateName = editorContextService.getActiveStateName();

      var _stateDict = explorationStatesService.getState(activeStateName);
      for (var i = 0; i < _stateDict.interaction.handlers.length; i++) {
        var handlerName = _stateDict.interaction.handlers[i].name;
        _stateDict.interaction.handlers[i].rule_specs = _interactionHandlers[handlerName];
      }
      explorationStatesService.setState(activeStateName, _stateDict);

      graphDataService.recompute();
      _interactionHandlersMemento = angular.copy(newHandlers);
    }
  };

  return {
    // The 'data' arg is a list of interaction handlers for the currently-active state.
    init: function(data) {
      interactionHandlersCache.reset();
      _refreshHandlerSpecs();

      // Stores rules as key-value pairs. For each pair, the key is the
      // corresponding handler name and the value has several keys:
      // - 'definition' (the rule definition)
      // - 'dest' (the destination for this rule)
      // - 'feedback' (list of feedback given for this rule)
      // - 'param_changes' (parameter changes associated with this rule)
      _interactionHandlers = {};
      for (var i = 0; i < data.handlers.length; i++) {
        _interactionHandlers[data.handlers[i].name] = data.handlers[i].rule_specs;
      }
      interactionHandlersCache.set(
        stateInteractionIdService.savedMemento, _interactionHandlers);

      _interactionHandlersMemento = angular.copy(_interactionHandlers);
      _activeRuleIndex = 0;
    },
    onInteractionIdChanged: function(newInteractionId, callback) {
      _refreshHandlerSpecs();

      if (interactionHandlersCache.contains(newInteractionId)) {
        _interactionHandlers = interactionHandlersCache.get(newInteractionId);
      } else {
        // Preserve just the default rule, unless the new interaction id is a
        // terminal one (in which case, change its destination to be a
        // self-loop instead).
        _interactionHandlers = {
          'submit': [
            _interactionHandlers['submit'][_interactionHandlers['submit'].length - 1]
          ]
        };
        if (newInteractionId && INTERACTION_SPECS[newInteractionId].is_terminal) {
          _interactionHandlers['submit'][0].dest = editorContextService.getActiveStateName();
        }
      }

      _saveInteractionHandlers(_interactionHandlers);
      interactionHandlersCache.set(newInteractionId, _interactionHandlers);

      _interactionHandlersMemento = angular.copy(_interactionHandlers);
      _activeRuleIndex = 0;

      if (callback) {
        callback();
      }
    },
    getActiveRuleIndex: function() {
      return _activeRuleIndex;
    },
    getAnswerChoices: function() {
      return angular.copy(_answerChoices);
    },
    changeActiveRuleIndex: function(newIndex) {
      _activeRuleIndex = newIndex;
    },
    getActiveRule: function() {
      if (_interactionHandlers) {
        return _interactionHandlers['submit'][_activeRuleIndex];
      } else {
        return null;
      }
    },
    deleteActiveRule: function() {
      if (_activeRuleIndex === _interactionHandlers.length - 1) {
        warningsData.addWarning('Cannot delete default rule.');
        return false;
      }
      if (!window.confirm('Are you sure you want to delete this rule?')) {
        return false;
      }
      _interactionHandlersMemento = angular.copy(_interactionHandlers);
      _interactionHandlers['submit'].splice(_activeRuleIndex, 1);
      _saveInteractionHandlers(_interactionHandlers);
      _activeRuleIndex = 0;
      return true;
    },
    saveActiveRule: function(activeRule) {
      _interactionHandlers['submit'][_activeRuleIndex] = activeRule;
      _saveInteractionHandlers(_interactionHandlers);
    },
    getInteractionHandlerSpecs: function() {
      return angular.copy(_interactionHandlerSpecs);
    },
    // Updates answer choices when the interaction requires it -- for example,
    // the rules for multiple choice need to refer to the multiple choice
    // interaction's customization arguments.
    updateAnswerChoices: function(newAnswerChoices) {
      _answerChoices = newAnswerChoices;
    },
    getInteractionHandlers: function() {
      return angular.copy(_interactionHandlers);
    },
    // This registers the change to the handlers in the list of changes, and also
    // updates the states object in explorationStatesService.
    save: function(newHandlers) {
      _saveInteractionHandlers(newHandlers);
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

  $scope.changeActiveRuleIndex = function(newIndex) {
    $rootScope.$broadcast('externalSave');
    rulesService.changeActiveRuleIndex(newIndex);
    $scope.activeRuleIndex = rulesService.getActiveRuleIndex();
  };

  $scope.getCurrentInteractionId = function() {
    return stateInteractionIdService.savedMemento;
  };

  $scope.$on('initializeHandlers', function(evt, data) {
    rulesService.init(data);
    $scope.interactionHandlers = rulesService.getInteractionHandlers();
    $scope.activeRuleIndex = rulesService.getActiveRuleIndex();
    $scope.answerChoices = $scope.getAnswerChoices();
    $rootScope.$broadcast('externalSave');
  });

  $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
    $rootScope.$broadcast('externalSave');
    rulesService.onInteractionIdChanged(newInteractionId, function() {
      $scope.interactionHandlers = rulesService.getInteractionHandlers();
      $scope.activeRuleIndex = rulesService.getActiveRuleIndex();
      $scope.answerChoices = $scope.getAnswerChoices();
    });
  });

  $scope.$on('ruleDeleted', function(evt) {
    $scope.interactionHandlers = rulesService.getInteractionHandlers();
    $scope.activeRuleIndex = rulesService.getActiveRuleIndex();
  });

  $scope.$on('ruleSaved', function(evt) {
    $scope.interactionHandlers = rulesService.getInteractionHandlers();
    $scope.activeRuleIndex = rulesService.getActiveRuleIndex();
  });

  // Updates answer choices when the interaction requires it -- for example,
  // the rules for multiple choice need to refer to the multiple choice
  // interaction's customization arguments.
  // TODO(sll): Remove the need for this watcher, or make it less ad hoc.
  $scope.$on('updateAnswerChoices', function(evt, newAnswerChoices) {
    rulesService.updateAnswerChoices(newAnswerChoices);
    $scope.answerChoices = $scope.getAnswerChoices();
  });

  $scope.isDefaultRuleTabShown = function() {
    var defaultRule = $scope.interactionHandlers.submit[$scope.interactionHandlers.submit.length - 1];
    return (
      defaultRule.dest !== editorContextService.getActiveStateName() ||
      defaultRule.feedback.length > 0);
  };

  $scope.openAddRuleModal = function() {
    warningsData.clear();
    $rootScope.$broadcast('externalSave');

    $modal.open({
      templateUrl: 'modals/addRule',
      backdrop: true,
      resolve: {
        canAddDefaultRule: function() {
          return !$scope.isDefaultRuleTabShown();
        }
      },
      controller: [
          '$scope', '$modalInstance', 'rulesService', 'editorContextService', 'canAddDefaultRule',
          function($scope, $modalInstance, rulesService, editorContextService, canAddDefaultRule) {
        $scope.canAddDefaultRule = canAddDefaultRule;

        $scope.tmpRule = {
          definition: ($scope.canAddDefaultRule ? {
            rule_type: 'default',
            subject: 'answer'
          } : {
            rule_type: 'atomic',
            name: null,
            inputs: {},
            subject: 'answer'
          }),
          dest: editorContextService.getActiveStateName(),
          feedback: [''],
          param_changes: []
        };

        $scope.isRuleEmpty = function(tmpRule) {
          var hasFeedback = false;
          for (var i = 0; i < tmpRule.feedback.length; i++) {
            if (tmpRule.feedback[i].length > 0) {
              hasFeedback = true;
            }
          }

          return (
            tmpRule.dest === editorContextService.getActiveStateName() &&
            !hasFeedback);
        };

        $scope.addRuleForm = {};

        $scope.interactionHandlerSpecs = rulesService.getInteractionHandlerSpecs();
        $scope.answerChoices = rulesService.getAnswerChoices();

        $scope.addNewRule = function() {
          $scope.$broadcast('saveRuleDetails');
          $modalInstance.close($scope.tmpRule);
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }]
    }).result.then(function(tmpRule) {
      _interactionHandlersMemento = angular.copy($scope.interactionHandlers);

      var numRules = $scope.interactionHandlers['submit'].length;

      if (tmpRule.definition.rule_type === 'default') {
        if ($scope.isDefaultRuleTabShown()) {
          warningsData.addWarning('Tried to add a duplicate default rule');
          return;
        } else {
          tmpRule.definition = {rule_type: 'default'};
          $scope.interactionHandlers['submit'][numRules - 1] = tmpRule;
        }
        rulesService.save($scope.interactionHandlers);
        $scope.changeActiveRuleIndex($scope.interactionHandlers['submit'].length - 1);
      } else {
        $scope.interactionHandlers['submit'].splice(numRules - 1, 0, tmpRule);
        rulesService.save($scope.interactionHandlers);
        $scope.changeActiveRuleIndex($scope.interactionHandlers['submit'].length - 2);
      }
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
      rulesService.save($scope.interactionHandlers);
      $scope.changeActiveRuleIndex(ui.item.index());
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

  $scope.saveActiveRule = function(updatedRule) {
    rulesService.saveActiveRule(updatedRule);
    $rootScope.$broadcast('ruleSaved');
  };
}]);
