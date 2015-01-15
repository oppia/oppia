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
 * @fileoverview Controllers for a state's interaction editor.
 *
 * @author sll@google.com (Sean Lip)
 */

// A state-specific cache for interaction details. It stores customization and
// handlers corresponding to an interaction id so that they can be restored if
// the interaction is changed back while the user is still in this state. This
// cache should be reset each time the state editor is initialized.
oppia.factory('interactionDetailsCache', [function() {
  var _cache = {};
  return {
    reset: function() {
      _cache = {};
    },
    contains: function(interactionId) {
      return _cache.hasOwnProperty(interactionId);
    },
    set: function(interactionId, interactionCustomizationArgs, interactionHandlers) {
      _cache[interactionId] = {
        customization: angular.copy(interactionCustomizationArgs),
        handlers: angular.copy(interactionHandlers)
      };
    },
    get: function(interactionId) {
      if (!_cache.hasOwnProperty(interactionId)) {
        return null;
      }
      return angular.copy(_cache[interactionId]);
    }
  };
}]);


oppia.controller('StateInteraction', [
    '$scope', '$http', '$filter', '$modal', '$window', 'warningsData',
    'editorContextService', 'changeListService', 'oppiaHtmlEscaper',
    'interactionRepositoryService', 'stateInteractionIdService',
    'stateCustomizationArgsService', 'stateInteractionStickyService',
    'editabilityService', 'explorationStatesService', 'graphDataService',
    'interactionDetailsCache',
    function($scope, $http, $filter, $modal, $window, warningsData,
      editorContextService, changeListService, oppiaHtmlEscaper,
      interactionRepositoryService, stateInteractionIdService,
      stateCustomizationArgsService, stateInteractionStickyService,
      editabilityService, explorationStatesService, graphDataService,
      interactionDetailsCache) {
  // Variables storing specifications for the interaction parameters and
  // possible rules.
  $scope.interactionHandlerSpecs = [];
  $scope.interactionHandlers = {};

  $scope.form = {};

  // Declare dummy submitAnswer() and adjustPageHeight() methods for the
  // interaction preview.
  $scope.submitAnswer = function(answer, handler) {};
  $scope.adjustPageHeight = function(scroll) {};

  $scope.hasLoaded = false;

  $scope._getStateCustArgsFromInteractionCustArgs = function(interactionCustomizationArgs) {
    var result = {};
    for (var i = 0; i < interactionCustomizationArgs.length; i++) {
      result[interactionCustomizationArgs[i].name] = {
        value: angular.copy(interactionCustomizationArgs[i].value)
      };
    }
    return result;
  };

  $scope.getCurrentInteractionId = function() {
    return stateInteractionIdService.savedMemento;
  };

  $scope._getInteractionPreviewTag = function(interactionId, interactionCustomizationArgsList) {
    var el = $('<oppia-interactive-' + $filter('camelCaseToHyphens')(interactionId) + '/>');
    for (var i = 0; i < interactionCustomizationArgsList.length; i++) {
      el.attr(
        $filter('camelCaseToHyphens')(interactionCustomizationArgsList[i].name) + '-with-value',
        oppiaHtmlEscaper.objToEscapedJson(interactionCustomizationArgsList[i].value));
    }
    return el.get(0).outerHTML;
  };

  $scope.resetInteractionCustomizer = function() {
    $scope.interactionId = $scope.getCurrentInteractionId();
    var stateCustomizationArgs = stateCustomizationArgsService.savedMemento;

    var interactionTemplate = angular.copy($scope.interactionRepository[$scope.interactionId]);
    for (var i = 0; i < interactionTemplate.customization_args.length; i++) {
      var caName = interactionTemplate.customization_args[i].name;
      interactionTemplate.customization_args[i].value = (
        stateCustomizationArgs.hasOwnProperty(caName) ?
        stateCustomizationArgs[caName].value :
        interactionTemplate.customization_args[i].default_value
      );
    }

    // Special-case for multiple choice input.
    $scope.answerChoices = null;
    if ($scope.interactionId == 'MultipleChoiceInput') {
      for (var i = 0; i < interactionTemplate.customization_args.length; i++) {
        if (interactionTemplate.customization_args[i].name == 'choices') {
          $scope.answerChoices = interactionTemplate.customization_args[i].value;
        }
      }
    }

    stateInteractionStickyService.restoreFromMemento();

    $scope.interactionHandlerSpecs = interactionTemplate.handler_specs;
    $scope.interactionPreviewHtml = $scope._getInteractionPreviewTag(
      $scope.interactionId, interactionTemplate.customization_args);
    $scope.interactionCustomizerIsShown = false;
    $scope.tmpInteraction = null;
    $scope.interactionHandlersMemento = angular.copy($scope.interactionHandlers);
  };

  $scope.$on('stateEditorInitialized', function(evt, stateData) {
    $scope.hasLoaded = false;

    interactionDetailsCache.reset();

    // TODO(sll): Build a file containing this data and serve it statically,
    // since it rarely changes. (But don't cache it, since it does change.)
    interactionRepositoryService.getInteractionRepository().then(function(interactionRepository) {
      $scope.tmpRule = null;
      $scope.stateName = editorContextService.getActiveStateName();
      $scope.interactionRepository = interactionRepository;

      stateInteractionIdService.init(
        $scope.stateName, stateData.interaction.id,
        stateData.interaction, 'widget_id');
      stateCustomizationArgsService.init(
        $scope.stateName, stateData.interaction.customization_args,
        stateData.interaction, 'widget_customization_args');
      stateInteractionStickyService.init(
        $scope.stateName, stateData.interaction.sticky, stateData.interaction,
        'widget_sticky');

      $scope.stateInteractionStickyService = stateInteractionStickyService;

      // Stores rules as key-value pairs. For each pair, the key is the
      // corresponding handler name and the value has several keys:
      // - 'definition' (the rule definition)
      // - 'description' (the rule description string)
      // - 'dest' (the destination for this rule)
      // - 'feedback' (list of feedback given for this rule)
      // - 'param_changes' (parameter changes associated with this rule)
      $scope.interactionHandlers = {};
      for (var i = 0; i < stateData.interaction.handlers.length; i++) {
        $scope.interactionHandlers[stateData.interaction.handlers[i].name] = (
          stateData.interaction.handlers[i].rule_specs);
      }

      $scope.resetInteractionCustomizer(stateData.interaction);
      $scope.hasLoaded = true;
    });
  });

  $scope.showInteractionCustomizer = function() {
    if (editabilityService.isEditable()) {
      warningsData.clear();

      $scope.interactionCustomizerIsShown = true;
      $scope.interactionHandlersMemento = angular.copy($scope.interactionHandlers);
      $scope.$broadcast('schemaBasedFormsShown');

      $scope.tmpInteraction = angular.copy(
        $scope.interactionRepository[$scope.getCurrentInteractionId()]);
      for (var i = 0; i < $scope.tmpInteraction.customization_args.length; i++) {
        var caName = $scope.tmpInteraction.customization_args[i].name;
        $scope.tmpInteraction.customization_args[i].value = (
          stateCustomizationArgsService.displayed.hasOwnProperty(caName) ?
          angular.copy(stateCustomizationArgsService.displayed[caName].value) :
          $scope.tmpInteraction.customization_args[i].default_value
        );
      }
    }
  };

  $scope.saveInteractionCustomizations = function(tmpInteraction) {
    var newInteraction = angular.copy(tmpInteraction);

    stateCustomizationArgsService.displayed = $scope._getStateCustArgsFromInteractionCustArgs(
      newInteraction.customization_args);
    stateCustomizationArgsService.saveDisplayedValue();

    stateInteractionStickyService.saveDisplayedValue();

    $scope.tmpRule = null;
    $scope.updateStateInteractionHandlerData();
    graphDataService.recompute();
    $scope.resetInteractionCustomizer();
  };

  $scope.$on('externalSave', function() {
    if ($scope.interactionCustomizerIsShown) {
      $scope.saveInteractionCustomizations($scope.tmpInteraction);
    }
  });

  $scope.onChangeInteractionType = function(newInteractionId) {
    interactionDetailsCache.set(
      stateInteractionIdService.savedMemento,
      stateCustomizationArgsService.savedMemento,
      $scope.interactionHandlers);

    stateInteractionIdService.displayed = newInteractionId;
    stateInteractionIdService.saveDisplayedValue();

    if (interactionDetailsCache.contains(newInteractionId)) {
      var _cachedCustomizationAndHandlers = interactionDetailsCache.get(newInteractionId);
      stateCustomizationArgsService.displayed = _cachedCustomizationAndHandlers.customization;
      $scope.interactionHandlers = _cachedCustomizationAndHandlers.handlers;
    } else {
      var newInteraction = angular.copy($scope.interactionRepository[newInteractionId]);
      for (var i = 0; i < newInteraction.customization_args.length; i++) {
        newInteraction.customization_args[i].value = (
          newInteraction.customization_args[i].default_value);
      }
      stateCustomizationArgsService.displayed = $scope._getStateCustArgsFromInteractionCustArgs(
        newInteraction.customization_args);

      // Change the interaction handlers, but preserve the old default rule.
      $scope.interactionHandlers = {
        'submit': [$scope.interactionHandlers['submit'][$scope.interactionHandlers['submit'].length - 1]]
      };
    }

    stateCustomizationArgsService.saveDisplayedValue();
    changeListService.editStateProperty(
      editorContextService.getActiveStateName(), 'widget_handlers', $scope.interactionHandlers,
      $scope.interactionHandlersMemento);

    $scope.tmpRule = null;
    $scope.updateStateInteractionHandlerData();
    graphDataService.recompute();
    $scope.resetInteractionCustomizer();
  };

  $scope.createTmpRule = function() {
    // A rule name of 'null' triggers the opening of the rule description
    // editor.
    $scope.tmpRule = {
      description: null,
      definition: {
        rule_type: 'atomic',
        name: null,
        inputs: {},
        subject: 'answer'
      },
      dest: editorContextService.getActiveStateName(),
      feedback: [],
      param_changes: []
    };
  };

  $scope.saveTmpRule = function() {
    $scope.interactionHandlersMemento = angular.copy($scope.interactionHandlers);

    // Move the tmp rule into the list of 'real' rules.
    var rules = $scope.interactionHandlers['submit'];
    rules.splice(rules.length - 1, 0, angular.copy($scope.tmpRule));

    $scope.saveInteractionHandlers(
      $scope.interactionHandlers, $scope.interactionHandlersMemento);
    $scope.tmpRule = null;
  }

  $scope.cancelTmpRule = function() {
    $scope.tmpRule = null;
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
      $scope.interactionHandlersMemento = angular.copy($scope.interactionHandlers);
      ui.placeholder.height(ui.item.height());
    },
    stop: function(e, ui) {
      $scope.$apply();
      $scope.saveInteractionHandlers(
        $scope.interactionHandlers, $scope.interactionHandlersMemento);
    }
  };

  $scope.deleteRule = function(handlerName, index) {
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }
    $scope.interactionHandlersMemento = angular.copy($scope.interactionHandlers);
    $scope.interactionHandlers[handlerName].splice(index, 1);
    $scope.saveInteractionHandlers(
      $scope.interactionHandlers, $scope.interactionHandlersMemento);
  };

  $scope.saveRule = function() {
    $scope.saveInteractionHandlers(
      $scope.interactionHandlers, $scope.interactionHandlersMemento);
  };

  $scope.saveInteractionHandlers = function(newHandlers, oldHandlers) {
    if (newHandlers && oldHandlers && !angular.equals(newHandlers, oldHandlers)) {
      changeListService.editStateProperty(
        editorContextService.getActiveStateName(), 'widget_handlers',
        angular.copy(newHandlers), angular.copy(oldHandlers));
      $scope.updateStateInteractionHandlerData();
      graphDataService.recompute();
      $scope.interactionHandlersMemento = angular.copy(newHandlers);
    }
  };

  $scope.updateStateInteractionHandlerData = function() {
    // Updates the exploration states from the interaction handlers.
    var activeStateName = editorContextService.getActiveStateName();
    var _stateDict = explorationStatesService.getState(activeStateName);

    _stateDict.interaction.id = angular.copy(
      stateInteractionIdService.savedMemento);
    _stateDict.interaction.customization_args = angular.copy(
      stateCustomizationArgsService.savedMemento);
    _stateDict.interaction.sticky = angular.copy(
      stateInteractionStickyService.savedMemento);
    for (var i = 0; i < _stateDict.interaction.handlers.length; i++) {
      var handlerName = _stateDict.interaction.handlers[i].name;
      _stateDict.interaction.handlers[i].rule_specs = $scope.interactionHandlers[
        handlerName];
    }

    explorationStatesService.setState(activeStateName, _stateDict);
  };
}]);
