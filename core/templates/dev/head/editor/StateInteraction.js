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
    '$scope', '$http', '$modal', 'warningsData', 'editorContextService', 'changeListService',
    function($scope, $http, $modal, warningsData, editorContextService, changeListService) {
  // Variables storing specifications for the widget parameters and possible
  // rules.
  $scope.widgetHandlerSpecs = [];
  $scope.widgetHandlers = {};

  // Declare dummy submitAnswer() and adjustPageHeight() methods for the widget
  // preview.
  $scope.submitAnswer = function(answer, handler) {};
  $scope.adjustPageHeight = function(scroll) {};

  $scope.generateWidgetPreview = function(widgetId, customizationArgValues, successCallback) {
    $http.post('/widgets/interactive/' + widgetId, {
      customization_args: customizationArgValues
    }).success(function(data) {
      $scope.widgetId = data.widget_id;
      $scope.widgetCustomizationArgs = data.customization_args;
      $scope.widgetHandlerSpecs = data.handler_specs;
      $scope.widgetPreviewHtml = data.tag;
      if (successCallback) {
        successCallback();
      }
    });
  };

  $scope.initInteractiveWidget = function(data) {
    $scope.resetInteractiveWidgetEditor();

    $scope.stateName = editorContextService.getActiveStateName();

    // Stores rules in the form of key-value pairs. For each pair, the key is
    // the corresponding handler name and the value has several keys:
    // - 'definition' (the rule definition)
    // - 'description' (the rule description string)
    // - 'dest' (the destination for this rule)
    // - 'feedback' (list of feedback given for this rule)
    // - 'param_changes' (parameter changes associated with this rule)
    $scope.widgetHandlers = {};
    for (var i = 0; i < data.handlers.length; i++) {
      $scope.widgetHandlers[data.handlers[i].name] = (
          data.handlers[i].rule_specs);
    }
    $scope.widgetSticky = data.sticky;

    var customizationArgValues = {};
    for (var key in data.customization_args) {
      customizationArgValues[key] = data.customization_args[key].value;
    }

    $scope.generateWidgetPreview(data.widget_id, customizationArgValues);

    $scope.tmpRule = null;
    $scope.widgetHandlersMemento = angular.copy($scope.widgetHandlers);
  };

  $scope.$on('stateEditorInitialized', function(evt, stateData) {
    $scope.initInteractiveWidget(stateData.widget);
  });

  $scope.toggleWidgetSticky = function() {
    var activeStateName = editorContextService.getActiveStateName();
    changeListService.editStateProperty(
      activeStateName, 'widget_sticky', $scope.widgetSticky,
      !$scope.widgetSticky);
    $scope.states[activeStateName].widget.sticky = $scope.widgetSticky;
  };

  $scope.interactiveWidgetRepository = null;

  $scope._getStateCustArgsFromWidgetCustArgs = function(widgetCustomizationArgs) {
    var result = {};
    for (var i = 0; i < widgetCustomizationArgs.length; i++) {
      result[widgetCustomizationArgs[i].name] = {
        value: angular.copy(widgetCustomizationArgs[i].value)
      };
    }
    return result;
  };

  $scope.showInteractiveWidgetEditor = function() {
    warningsData.clear();

    if (!$scope.interactiveWidgetRepository) {
      // Initializes the widget list using data from the server.
      $http.get('/widgetrepository/data/interactive').success(function(data) {
        $scope.interactiveWidgetRepository = data.widgetRepository;
        for (var category in $scope.interactiveWidgetRepository) {
          for (var i = 0; i < $scope.interactiveWidgetRepository[category].length; i++) {
            if ($scope.interactiveWidgetRepository[category][i].widget_id == $scope.widgetId) {
              $scope.tmpWidget = angular.copy($scope.interactiveWidgetRepository[category][i]);
              $scope.tmpWidget.customization_args = angular.copy($scope.widgetCustomizationArgs);
              $scope.tmpWidget.tag = $scope.widgetPreviewHtml;
              break;
            }
          }
        }
      });
    }

    $scope.interactiveWidgetEditorIsShown = true;
    $scope.widgetIdMemento = $scope.widgetId;
    $scope.stateCustomizationArgsMemento = $scope._getStateCustArgsFromWidgetCustArgs(
      $scope.widgetCustomizationArgs);
    $scope.widgetHandlersMemento = angular.copy($scope.widgetHandlers);

    for (var category in $scope.interactiveWidgetRepository) {
      for (var i = 0; i < $scope.interactiveWidgetRepository[category].length; i++) {
        if ($scope.interactiveWidgetRepository[category][i].widget_id == $scope.widgetId) {
          $scope.tmpWidget = angular.copy($scope.interactiveWidgetRepository[category][i]);
          $scope.tmpWidget.customization_args = angular.copy($scope.widgetCustomizationArgs);
          $scope.tmpWidget.tag = $scope.widgetPreviewHtml;
          break;
        }
      }
    }
  };

  $scope.selectInteractiveWidget = function(tmpWidget) {
    $scope.$broadcast('externalSave');

    var newWidget = angular.copy(tmpWidget);
    var activeStateName = editorContextService.getActiveStateName();

    $scope.tmpRule = null;

    if (!angular.equals(newWidget.widget_id, $scope.widgetIdMemento)) {
      $scope.widgetId = angular.copy(newWidget.widget_id);

      changeListService.editStateProperty(
        activeStateName, 'widget_id', $scope.widgetId, $scope.widgetIdMemento);

      // Change the widget handlers, but preserve the old default rule.
      $scope.widgetHandlers = {
        'submit': [$scope.widgetHandlers['submit'][$scope.widgetHandlers['submit'].length - 1]]
      };
      changeListService.editStateProperty(
        activeStateName, 'widget_handlers', $scope.widgetHandlers,
        $scope.widgetHandlersMemento);
    }

    if (!angular.equals(
        $scope._getStateCustArgsFromWidgetCustArgs(newWidget.customization_args),
        $scope.stateCustomizationArgsMemento)) {
      $scope.widgetCustomizationArgs = newWidget.customization_args;

      changeListService.editStateProperty(
        activeStateName,
        'widget_customization_args',
        $scope._getStateCustArgsFromWidgetCustArgs(newWidget.customization_args),
        $scope.stateCustomizationArgsMemento);
    }

    var customizationArgValues = {};
    for (var i = 0; i < $scope.widgetCustomizationArgs.length; i++) {
      var cArg = $scope.widgetCustomizationArgs[i];
      customizationArgValues[cArg.name] = cArg.value;
    }

    console.log(customizationArgValues);

    $scope.generateWidgetPreview($scope.widgetId, customizationArgValues);
    $scope.updateStatesData();
    $scope.refreshGraph();

    var activeStateName = editorContextService.getActiveStateName();
    $scope.states[activeStateName].widget.widget_id = $scope.widgetId;
    $scope.states[activeStateName].widget.customization_args = angular.copy(
      $scope.widgetCustomizationArgs);

    $scope.resetInteractiveWidgetEditor();
  };

  $scope.generateTmpWidgetPreview = function() {
    $scope.tmpWidget.tag = 'Loading...';
    $http.post('/widgets/interactive/' + $scope.tmpWidget.widget_id, {
      customization_args: $scope.tmpWidget.customization_args
    }).success(function(data) {
      $scope.tmpWidget.tag = data.tag;
    });
  };

  $scope.setNewTmpWidget = function(widget) {
    $scope.tmpWidget = angular.copy(widget);
  };

  $scope.resetInteractiveWidgetEditor = function() {
    $scope.interactiveWidgetEditorIsShown = false;
    $scope.tmpWidget = null;
    $scope.widgetIdMemento = null;
    $scope.stateCustomizationArgsMemento = null;
    $scope.widgetHandlersMemento = angular.copy($scope.widgetHandlers);
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
      $scope.updateStatesData();
      $scope.refreshGraph();
      $scope.widgetHandlersMemento = angular.copy(newHandlers);
    }
  };

  $scope.updateStatesData = function() {
    // Updates $scope.states from $scope.widgetHandlers.
    var activeStateName = editorContextService.getActiveStateName();
    var stateDict = $scope.states[activeStateName];
    for (var i = 0; i < stateDict.widget.handlers.length; i++) {
      var handlerName = stateDict.widget.handlers[i].name;
      stateDict.widget.handlers[i].rule_specs = $scope.widgetHandlers[handlerName];
    }
  };
}]);
