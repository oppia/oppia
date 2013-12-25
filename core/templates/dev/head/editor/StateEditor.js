// Copyright 2012 Google Inc. All Rights Reserved.
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
 * @fileoverview Controllers for the graphical state editor.
 *
 * @author sll@google.com (Sean Lip)
 */

function StateEditor($scope, $http, $filter, $sce, $modal, explorationData,
                   warningsData, activeInputData, oppiaRequestCreator) {

  $scope.$on('guiTabSelected', function(event, stateData) {
    $scope.displayedStateName = $scope.$parent.getLatestStateNames()[$scope.stateName];
    $scope.content = stateData.content || [];
    $scope.stateParamChanges = stateData.param_changes || [];

    $scope.$broadcast('stateEditorInitialized', $scope.stateName);
    console.log('Content updated.');
  });

  $scope.getIncomingStates = function(stateName) {
    var incomingStates = {},
        statesToRuleNames = {},
        otherStateName;

    for (otherStateName in $scope.states) {
      var handlers = $scope.states[otherStateName].widget.handlers;
      var widgetParams = $scope.states[otherStateName].widget.customization_args;
      for (var i = 0; i < handlers.length; i++) {
        for (var j = 0; j < handlers[i].rule_specs.length; j++) {
          if (handlers[i].rule_specs[j].dest == stateName) {
            incomingStates[otherStateName] = $scope.states[otherStateName];

            var previousChoices = null;
            if (widgetParams.hasOwnProperty('choices')) {
              previousChoices = widgetParams.choices;
            }

            var ruleName = $filter('parameterizeRuleDescription')(
                handlers[i].rule_specs[j], previousChoices);

            if (otherStateName in statesToRuleNames) {
              statesToRuleNames[otherStateName].push(ruleName);
            } else {
              statesToRuleNames[otherStateName] = [ruleName];
            }
          }
        }
      }
    }

    for (otherStateName in incomingStates) {
      incomingStates[otherStateName].rules = statesToRuleNames[otherStateName];
    }
    return incomingStates;
  };

  // This should only be non-null when the state name editor is open.
  $scope.stateNameMemento = null;

  $scope.openStateNameEditor = function() {
    $scope.stateNameMemento = $scope.displayedStateName;
  };

  $scope.saveStateName = function(newStateName) {
    newStateName = $scope.normalizeWhitespace(newStateName);
    if (!$scope.isValidEntityName(newStateName, true)) {
      return;
    }
    var latestStateNames = $scope.$parent.getLatestStateNames();
    if (newStateName != $scope.displayedStateName &&
        latestStateNames.hasOwnProperty(newStateName)) {
      warningsData.addWarning(
          'The name \'' + newStateName + '\' is already in use.');
      return;
    }

    if ($scope.stateNameMemento !== newStateName) {
      $scope.addStateChange(
          'state_name',
          ['stateName', 'states.' + $scope.newStateName + '.name'],
          newStateName,
          $scope.stateNameMemento
      );
      $scope.displayedStateName = newStateName;
    }

    $scope.stateNameMemento = null;
  };

  // This should only be non-null when the content editor is open.
  $scope.contentMemento = null;

  $scope.editContent = function() {
    $scope.contentMemento = angular.copy($scope.content);
  };

  $scope.saveTextContent = function() {
    $scope.$apply();
    if ($scope.contentMemento !== $scope.content) {
      // The $apply() call seems to be needed in order to ensure that the latest
      // values from the RTE are captured.
      // TODO(sll): Do we need to update math?
      $scope.addStateChange(
          'content',
          ['content'],
          angular.copy($scope.content),
          angular.copy($scope.contentMemento)
      );
    }
    $scope.contentMemento = null;
  };

  $scope.getCustomizationModalInstance = function(widgetId, widgetParams) {
    // NB: This method is used for interactive widgets.
    return $modal.open({
      templateUrl: 'modals/customizeWidget',
      backdrop: 'static',
      resolve: {
        widgetId: function() {
          return widgetId;
        },
        widgetParams: function() {
          return widgetParams;
        }
      },
      controller: [
        '$scope', '$http', '$modalInstance', 'widgetId', 'widgetParams',
        'warningsData', 'oppiaRequestCreator',
        function($scope, $http, $modalInstance, widgetId, widgetParams, warningsData, oppiaRequestCreator) {
          $scope.widgetId = widgetId;
          $scope.widgetParams = widgetParams;

          $http.post(
              '/widgets/interactive/' + widgetId,
              oppiaRequestCreator.createRequest({
                'customization_args': {}
              }),
              {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
                  success(function(data) {
                    $scope.paramDescriptions = {};
                    for (var paramName in data.widget.params) {
                      $scope.paramDescriptions[paramName] = data.widget.params[paramName].description;
                    }
                  }).error(function(data) {
                    warningsData.addWarning(
                        'Error: Failed to obtain widget parameter descriptions.');
                  });

          $scope.save = function(widgetParams) {
            $scope.$broadcast('externalSave');
            $modalInstance.close({
              widgetParams: widgetParams
            });
          };
        }
      ]
    });
  };

  $scope.saveStateParamChanges = function(newValue, oldValue) {
    if (!angular.equals(newValue, oldValue)) {
      $scope.addStateChange(
          'param_changes', ['stateParamChanges'], newValue, oldValue);
    }
  };

}

StateEditor.$inject = ['$scope', '$http', '$filter', '$sce', '$modal',
    'explorationData', 'warningsData', 'activeInputData', 'oppiaRequestCreator'];
