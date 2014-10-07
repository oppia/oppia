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
 * @fileoverview Controllers for a state's interactive widget editor.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.controller('StateInteraction', [
    '$scope', '$http', '$filter', '$modal', '$window', 'warningsData', 'editorContextService', 'changeListService',
    'oppiaHtmlEscaper', 'widgetDefinitionsService', 'stateWidgetIdService', 'stateCustomizationArgsService', 'stateWidgetStickyService',
    'editabilityService', 'explorationStatesService', 'graphDataService',
    function($scope, $http, $filter, $modal, $window, warningsData, editorContextService, changeListService,
      oppiaHtmlEscaper, widgetDefinitionsService, stateWidgetIdService, stateCustomizationArgsService, stateWidgetStickyService,
      editabilityService, explorationStatesService, graphDataService) {
  // Variables storing specifications for the widget parameters and possible
  // rules.
  $scope.widgetHandlerSpecs = [];
  $scope.widgetHandlers = {};

  $scope.form = {};

  // Declare dummy submitAnswer() and adjustPageHeight() methods for the widget
  // preview.
  $scope.submitAnswer = function(answer, handler) {};
  $scope.adjustPageHeight = function(scroll) {};

  $scope.hasLoaded = false;

  $scope._getStateCustArgsFromWidgetCustArgs = function(widgetCustomizationArgs) {
    var result = {};
    for (var i = 0; i < widgetCustomizationArgs.length; i++) {
      result[widgetCustomizationArgs[i].name] = {
        value: angular.copy(widgetCustomizationArgs[i].value)
      };
    }
    return result;
  };

  $scope.getCurrentWidgetId = function() {
    return stateWidgetIdService.savedMemento;
  };

  $scope._getWidgetPreviewTag = function(widgetId, widgetCustomizationArgsList) {
    var el = $('<oppia-interactive-' + $filter('camelCaseToHyphens')(widgetId) + '/>');
    for (var i = 0; i < widgetCustomizationArgsList.length; i++) {
      el.attr(
        $filter('camelCaseToHyphens')(widgetCustomizationArgsList[i].name) + '-with-value',
        oppiaHtmlEscaper.objToEscapedJson(widgetCustomizationArgsList[i].value));
    }
    return el.get(0).outerHTML;
  };

  $scope.resetInteractionCustomizer = function() {
    $scope.widgetId = $scope.getCurrentWidgetId();
    var stateCustomizationArgs = stateCustomizationArgsService.savedMemento;

    var widgetTemplate = angular.copy($scope.allInteractiveWidgets[$scope.widgetId]);
    for (var i = 0; i < widgetTemplate.customization_args.length; i++) {
      var caName = widgetTemplate.customization_args[i].name;
      widgetTemplate.customization_args[i].value = (
        stateCustomizationArgs.hasOwnProperty(caName) ?
        stateCustomizationArgs[caName].value :
        widgetTemplate.customization_args[i].default_value
      );
    }

    // Special-case for multiple choice input.
    $scope.answerChoices = null;
    if ($scope.widgetId == 'MultipleChoiceInput') {
      for (var i = 0; i < widgetTemplate.customization_args.length; i++) {
        if (widgetTemplate.customization_args[i].name == 'choices') {
          $scope.answerChoices = widgetTemplate.customization_args[i].value;
        }
      }
    }

    stateWidgetStickyService.restoreFromMemento();

    $scope.widgetHandlerSpecs = widgetTemplate.handler_specs;
    $scope.widgetPreviewHtml = $scope._getWidgetPreviewTag(
      $scope.widgetId, widgetTemplate.customization_args);
    $scope.interactionCustomizerIsShown = false;
    $scope.tmpWidget = null;
    $scope.widgetHandlersMemento = angular.copy($scope.widgetHandlers);
  };

  $scope.$on('stateEditorInitialized', function(evt, stateData) {
    $scope.hasLoaded = false;

    // TODO(sll): Build a file containing this data and serve it statically,
    // since it rarely changes. (But don't cache it, since it does change.)
    widgetDefinitionsService.getInteractiveDefinitions().then(function(widgetDefinitions) {
      $scope.tmpRule = null;
      $scope.stateName = editorContextService.getActiveStateName();
      $scope.allInteractiveWidgets = widgetDefinitions;

      stateWidgetIdService.init(
        $scope.stateName, stateData.widget.widget_id,
        stateData.widget, 'widget_id');
      stateCustomizationArgsService.init(
        $scope.stateName, stateData.widget.customization_args,
        stateData.widget, 'widget_customization_args');
      stateWidgetStickyService.init(
        $scope.stateName, stateData.widget.sticky, stateData.widget,
        'widget_sticky');

      $scope.stateWidgetStickyService = stateWidgetStickyService;

      // Stores rules as key-value pairs. For each pair, the key is the
      // corresponding handler name and the value has several keys:
      // - 'definition' (the rule definition)
      // - 'description' (the rule description string)
      // - 'dest' (the destination for this rule)
      // - 'feedback' (list of feedback given for this rule)
      // - 'param_changes' (parameter changes associated with this rule)
      $scope.widgetHandlers = {};
      for (var i = 0; i < stateData.widget.handlers.length; i++) {
        $scope.widgetHandlers[stateData.widget.handlers[i].name] = (
          stateData.widget.handlers[i].rule_specs);
      }

      $scope.resetInteractionCustomizer(stateData.widget);
      $scope.hasLoaded = true;
    });
  });

  $scope.showInteractionCustomizer = function() {
    if (editabilityService.isEditable()) {
      warningsData.clear();

      $scope.interactionCustomizerIsShown = true;
      $scope.widgetHandlersMemento = angular.copy($scope.widgetHandlers);
      $scope.$broadcast('schemaBasedFormsShown');

      $scope.tmpWidget = angular.copy(
        $scope.allInteractiveWidgets[$scope.getCurrentWidgetId()]);
      for (var i = 0; i < $scope.tmpWidget.customization_args.length; i++) {
        var caName = $scope.tmpWidget.customization_args[i].name;
        $scope.tmpWidget.customization_args[i].value = (
          stateCustomizationArgsService.displayed.hasOwnProperty(caName) ?
          angular.copy(stateCustomizationArgsService.displayed[caName].value) :
          $scope.tmpWidget.customization_args[i].default_value
        );
      }
    }
  };

  $scope.saveInteractionCustomizations = function(tmpWidget) {
    var newWidget = angular.copy(tmpWidget);

    stateCustomizationArgsService.displayed = $scope._getStateCustArgsFromWidgetCustArgs(
      newWidget.customization_args);
    stateCustomizationArgsService.saveDisplayedValue();

    stateWidgetStickyService.saveDisplayedValue();

    $scope.tmpRule = null;
    $scope.updateStateWidgetHandlerData();
    graphDataService.recompute();
    $scope.resetInteractionCustomizer();
  };

  $scope.$on('externalSave', function() {
    if ($scope.interactionCustomizerIsShown) {
      $scope.saveInteractionCustomizations($scope.tmpWidget);
    }
  });

  $scope.onChangeInteractionType = function(newWidgetId) {
    stateWidgetIdService.displayed = newWidgetId;
    stateWidgetIdService.saveDisplayedValue();

    var newWidget = angular.copy($scope.allInteractiveWidgets[newWidgetId]);
    for (var i = 0; i < newWidget.customization_args.length; i++) {
      newWidget.customization_args[i].value = (
        newWidget.customization_args[i].default_value);
    }
    stateCustomizationArgsService.displayed = $scope._getStateCustArgsFromWidgetCustArgs(
      newWidget.customization_args);
    stateCustomizationArgsService.saveDisplayedValue();

    // Change the widget handlers, but preserve the old default rule.
    $scope.widgetHandlers = {
      'submit': [$scope.widgetHandlers['submit'][$scope.widgetHandlers['submit'].length - 1]]
    };
    changeListService.editStateProperty(
      editorContextService.getActiveStateName(), 'widget_handlers', $scope.widgetHandlers,
      $scope.widgetHandlersMemento);

    $scope.tmpRule = null;
    $scope.updateStateWidgetHandlerData();
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
    $scope.widgetHandlersMemento = angular.copy($scope.widgetHandlers);

    // Move the tmp rule into the list of 'real' rules.
    var rules = $scope.widgetHandlers['submit'];
    rules.splice(rules.length - 1, 0, angular.copy($scope.tmpRule));

    $scope.saveWidgetHandlers(
      $scope.widgetHandlers, $scope.widgetHandlersMemento);
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
      $scope.widgetHandlersMemento = angular.copy($scope.widgetHandlers);
      ui.placeholder.height(ui.item.height());
    },
    stop: function(e, ui) {
      $scope.$apply();
      $scope.saveWidgetHandlers(
        $scope.widgetHandlers, $scope.widgetHandlersMemento);
    }
  };

  $scope.deleteRule = function(handlerName, index) {
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }
    $scope.widgetHandlersMemento = angular.copy($scope.widgetHandlers);
    $scope.widgetHandlers[handlerName].splice(index, 1);
    $scope.saveWidgetHandlers($scope.widgetHandlers, $scope.widgetHandlersMemento);
  };

  $scope.saveRule = function() {
    $scope.saveWidgetHandlers($scope.widgetHandlers, $scope.widgetHandlersMemento);
  };

  $scope.saveWidgetHandlers = function(newHandlers, oldHandlers) {
    if (newHandlers && oldHandlers && !angular.equals(newHandlers, oldHandlers)) {
      changeListService.editStateProperty(
        editorContextService.getActiveStateName(), 'widget_handlers',
        angular.copy(newHandlers), angular.copy(oldHandlers));
      $scope.updateStateWidgetHandlerData();
      graphDataService.recompute();
      $scope.widgetHandlersMemento = angular.copy(newHandlers);
    }
  };

  $scope.updateStateWidgetHandlerData = function() {
    // Updates the exploration states from the widget handlers.
    var activeStateName = editorContextService.getActiveStateName();
    var _stateDict = explorationStatesService.getState(activeStateName);

    _stateDict.widget.widget_id = angular.copy(stateWidgetIdService.savedMemento);
    _stateDict.widget.customization_args = angular.copy(
      stateCustomizationArgsService.savedMemento);
    _stateDict.widget.sticky = angular.copy(stateWidgetStickyService.savedMemento);
    for (var i = 0; i < _stateDict.widget.handlers.length; i++) {
      var handlerName = _stateDict.widget.handlers[i].name;
      _stateDict.widget.handlers[i].rule_specs = $scope.widgetHandlers[handlerName];
    }

    explorationStatesService.setState(activeStateName, _stateDict);
  };
}]);
