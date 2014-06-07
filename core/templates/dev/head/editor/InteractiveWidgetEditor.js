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

function InteractiveWidgetEditor(
    $scope, $http, $modal, $log, warningsData, oppiaRequestCreator,
    editorContextService, changeListService) {
  // Variables storing specifications for the widget parameters and possible
  // rules.
  $scope.widgetHandlerSpecs = [];
  $scope.widgetHandlers = {};

  // Declare dummy submitAnswer() and adjustPageHeight() methods for the widget
  // preview.
  $scope.submitAnswer = function(answer, handler) {};
  $scope.adjustPageHeight = function(scroll) {};

  $scope.generateWidgetPreview = function(widgetId, customizationArgs, successCallback) {
    $http.post(
      '/widgets/interactive/' + widgetId,
      oppiaRequestCreator.createRequest({customization_args: customizationArgs})
    ).success(function(data) {
      $scope.widgetHandlerSpecs = data.widget.handlers;

      $scope.widgetId = data.widget.widget_id;
      $scope.widgetCustomizationArgs = data.widget.customization_args;

      $scope.widgetPreviewHtml = data.widget.tag;
      if (successCallback) {
        successCallback();
      }
    }).error(function(errorData) {
      warningsData.addWarning(errorData.error);
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
    for (var i = 0; i < data.widget.handlers.length; i++) {
      $scope.widgetHandlers[data.widget.handlers[i].name] = (
          data.widget.handlers[i].rule_specs);
    }
    $scope.widgetSticky = data.widget.sticky;

    $scope.generateWidgetPreview(data.widget.widget_id, data.widget.customization_args);

    $scope.tmpRule = null;
    $scope.widgetHandlersMemento = angular.copy($scope.widgetHandlers);
  };

  $scope.$on('stateEditorInitialized', function(evt, stateData) {
    $scope.initInteractiveWidget(stateData);
  });

  $scope.toggleWidgetSticky = function() {
    var activeStateName = editorContextService.getActiveStateName();
    changeListService.editStateProperty(
      activeStateName, 'widget_sticky', $scope.widgetSticky,
      !$scope.widgetSticky);
    $scope.states[activeStateName].widget.sticky = $scope.widgetSticky;
  };

  $scope.interactiveWidgetRepository = null;

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
    $scope.widgetCustomizationArgsMemento = angular.copy($scope.widgetCustomizationArgs);
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

    if (!angular.equals(newWidget.customization_args, $scope.widgetCustomizationArgsMemento)) {
      $scope.widgetCustomizationArgs = angular.copy(newWidget.customization_args);
      changeListService.editStateProperty(
        activeStateName, 'widget_customization_args',
        $scope.widgetCustomizationArgs, $scope.widgetCustomizationArgsMemento);
    }

    $scope.generateWidgetPreview($scope.widgetId, $scope.widgetCustomizationArgs);
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
    $http.post(
      '/widgets/interactive/' + $scope.tmpWidget.widget_id,
      oppiaRequestCreator.createRequest({
        customization_args: $scope.tmpWidget.customization_args
      })
    ).success(function(data) {
      $scope.tmpWidget.tag = data.widget.tag;
    });
  };

  $scope.setNewTmpWidget = function(widget) {
    $scope.tmpWidget = angular.copy(widget);
  };

  $scope.resetInteractiveWidgetEditor = function() {
    $scope.interactiveWidgetEditorIsShown = false;
    $scope.tmpWidget = null;
    $scope.widgetIdMemento = null;
    $scope.widgetCustomizationArgsMemento = null;
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

  $scope.swapRules = function(handlerName, index1, index2) {
    $scope.widgetHandlersMemento = angular.copy($scope.widgetHandlers);

    var tmpSwapRule = $scope.widgetHandlers[handlerName][index1];
    $scope.widgetHandlers[handlerName][index1] =
        $scope.widgetHandlers[handlerName][index2];
    $scope.widgetHandlers[handlerName][index2] = tmpSwapRule;

    $scope.saveWidgetHandlers($scope.widgetHandlers, $scope.widgetHandlersMemento);
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
}

InteractiveWidgetEditor.$inject = [
  '$scope', '$http', '$modal', '$log', 'warningsData', 'oppiaRequestCreator',
  'editorContextService', 'changeListService'
];
