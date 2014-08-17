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
    function($scope, $http, $filter, $modal, $window, warningsData, editorContextService, changeListService,
      oppiaHtmlEscaper, widgetDefinitionsService, stateWidgetIdService, stateCustomizationArgsService, stateWidgetStickyService) {
  // Variables storing specifications for the widget parameters and possible
  // rules.
  $scope.widgetHandlerSpecs = [];
  $scope.widgetHandlers = {};

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
    return stateWidgetIdService.displayed;
  };

  $scope.getCurrentWidgetSticky = function() {
    return stateWidgetStickyService.displayed;
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

  $scope.resetInteractiveWidgetEditor = function() {
    var widgetId = stateWidgetIdService.displayed;
    var stateCustomizationArgs = stateCustomizationArgsService.displayed;

    var widgetTemplate = angular.copy($scope.allInteractiveWidgets[widgetId]);
    for (var i = 0; i < widgetTemplate.customization_args.length; i++) {
      var caName = widgetTemplate.customization_args[i].name;
      widgetTemplate.customization_args[i].value = (
        stateCustomizationArgs.hasOwnProperty(caName) ?
        stateCustomizationArgs[caName].value :
        widgetTemplate.customization_args[i].default_value
      );
    }

    $scope.widgetHandlerSpecs = widgetTemplate.handler_specs;
    $scope.widgetPreviewHtml = $scope._getWidgetPreviewTag(
      widgetId, widgetTemplate.customization_args);
    $scope.interactiveWidgetEditorIsShown = false;
    $scope.tmpWidget = null;
    $scope.widgetHandlersMemento = angular.copy($scope.widgetHandlers);
  };

  $scope.generateTmpWidgetPreview = function() {
    $scope.tmpWidget.tag = $scope._getWidgetPreviewTag(
      $scope.tmpWidget.widget_id, $scope.tmpWidget.customization_args);
  };

  // Group widgets into categories.
  $scope._generateRepository = function(allWidgets) {
    var repository = {};
    for (var widget_id in allWidgets) {
      var category = allWidgets[widget_id].category;
      if (!repository.hasOwnProperty(category)) {
        repository[category] = [];
      }
      repository[category].push(allWidgets[widget_id]);
    }

    return repository;
  };

  $scope.$on('stateEditorInitialized', function(evt, stateData) {
    $scope.hasLoaded = false;

    // TODO(sll): Build a file containing this data and serve it statically,
    // since it rarely changes. (But don't cache it, since it does change.)
    widgetDefinitionsService.getInteractiveDefinitions().then(function(widgetDefinitions) {
      $scope.tmpRule = null;
      $scope.stateName = editorContextService.getActiveStateName();
      $scope.allInteractiveWidgets = widgetDefinitions;
      $scope.interactiveWidgetRepository = $scope._generateRepository(widgetDefinitions);

      stateWidgetIdService.init(
        $scope.stateName, stateData.widget.widget_id, $scope.states[$scope.stateName].widget,
        'widget_id');
      stateCustomizationArgsService.init(
        $scope.stateName, stateData.widget.customization_args, $scope.states[$scope.stateName].widget,
        'widget_customization_args');
      stateWidgetStickyService.init(
        $scope.stateName, stateData.widget.sticky, $scope.states[$scope.stateName].widget,
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

      $scope.resetInteractiveWidgetEditor(stateData.widget);
      $scope.hasLoaded = true;
    });
  });

  $scope.saveWidgetSticky = function() {
    stateWidgetStickyService.saveDisplayedValue();    
  };

  $scope.showInteractiveWidgetEditor = function() {
    warningsData.clear();

    $scope.interactiveWidgetEditorIsShown = true;
    $scope.widgetHandlersMemento = angular.copy($scope.widgetHandlers);

    for (var category in $scope.interactiveWidgetRepository) {
      for (var i = 0; i < $scope.interactiveWidgetRepository[category].length; i++) {
        if ($scope.interactiveWidgetRepository[category][i].widget_id == stateWidgetIdService.displayed) {
          $scope.tmpWidget = angular.copy($scope.interactiveWidgetRepository[category][i]);
       
          var widgetTemplate = angular.copy($scope.allInteractiveWidgets[stateWidgetIdService.displayed]);
          for (var i = 0; i < widgetTemplate.customization_args.length; i++) {
            var caName = widgetTemplate.customization_args[i].name;
            widgetTemplate.customization_args[i].value = (
              stateCustomizationArgsService.displayed.hasOwnProperty(caName) ?
              angular.copy(stateCustomizationArgsService.displayed[caName].value) :
              widgetTemplate.customization_args[i].default_value
            );
          }
          $scope.tmpWidget.customization_args = angular.copy(widgetTemplate.customization_args);

          $scope.tmpWidget.tag = $scope.widgetPreviewHtml;
          return;
        }
      }
    }

    throw 'Could not find current widget in the repository.'
  };

  $scope.selectInteractiveWidget = function(tmpWidget) {
    $scope.$broadcast('externalSave');

    var newWidget = angular.copy(tmpWidget);
    if (!angular.equals(newWidget.widget_id, stateWidgetIdService.displayed)) {
      if (!$window.confirm('This will reset all existing rules. Continue?')) {
        return;
      };

      stateWidgetIdService.displayed = angular.copy(newWidget.widget_id);
      stateWidgetIdService.saveDisplayedValue();

      // Change the widget handlers, but preserve the old default rule.
      $scope.widgetHandlers = {
        'submit': [$scope.widgetHandlers['submit'][$scope.widgetHandlers['submit'].length - 1]]
      };
      changeListService.editStateProperty(
        editorContextService.getActiveStateName(), 'widget_handlers', $scope.widgetHandlers,
        $scope.widgetHandlersMemento);
    }

    stateCustomizationArgsService.displayed = $scope._getStateCustArgsFromWidgetCustArgs(
      newWidget.customization_args);
    stateCustomizationArgsService.saveDisplayedValue();

    $scope.tmpRule = null;
    $scope.updateStateWidgetHandlerData();
    $scope.refreshGraph();
    $scope.resetInteractiveWidgetEditor();
  };

  $scope.accordionStatus = {
    isPreviewOpen: true
  };

  $scope.setNewTmpWidget = function(widget) {
    $scope.tmpWidget = angular.copy(widget);
    for (var i = 0; i < $scope.tmpWidget.customization_args.length; i++) {
      $scope.tmpWidget.customization_args[i].value = $scope.tmpWidget.customization_args[i].default_value;
    }
    $scope.accordionStatus.isPreviewOpen = true;
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
    handle: '.oppia-non-default-rule-header-bubble',
    items: '.oppia-rule-block',
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
      $scope.refreshGraph();
      $scope.widgetHandlersMemento = angular.copy(newHandlers);
    }
  };

  $scope.updateStateWidgetHandlerData = function() {
    // Updates $scope.states from $scope.widgetHandlers.
    var activeStateName = editorContextService.getActiveStateName();
    var stateDict = $scope.states[activeStateName];
    for (var i = 0; i < stateDict.widget.handlers.length; i++) {
      var handlerName = stateDict.widget.handlers[i].name;
      stateDict.widget.handlers[i].rule_specs = $scope.widgetHandlers[handlerName];
    }
  };
}]);
