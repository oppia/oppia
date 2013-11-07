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

function GuiEditor($scope, $http, $filter, $sce, $modal, explorationData,
                   warningsData, activeInputData, requestCreator) {

  $scope.$on('guiTabSelected', function(event, stateData) {
    $scope.stateName = stateData.name;
    $scope.content = stateData.content || [];
    $scope.stateParamChanges = stateData.param_changes || [];

    $scope.$broadcast('stateEditorInitialized', $scope.stateId);
    // TODO(sll): Why isn't this working?
    $scope.updateMath();

    console.log('Content updated.');
  });

  $scope.getIncomingStates = function(stateId) {
    var incomingStates = {},
        statesToRuleNames = {},
        otherStateId;

    for (otherStateId in $scope.states) {
      var handlers = $scope.states[otherStateId].widget.handlers;
      var widgetParams = $scope.states[otherStateId].widget.customization_args;
      for (var i = 0; i < handlers.length; i++) {
        for (var j = 0; j < handlers[i].rule_specs.length; j++) {
          if (handlers[i].rule_specs[j].dest == stateId) {
            incomingStates[otherStateId] = $scope.states[otherStateId];

            var previousChoices = null;
            if (widgetParams.hasOwnProperty('choices')) {
              previousChoices = widgetParams.choices;
            }

            var ruleName = $filter('parameterizeRuleDescription')(
                handlers[i].rule_specs[j], previousChoices);

            if (otherStateId in statesToRuleNames) {
              statesToRuleNames[otherStateId].push(ruleName);
            } else {
              statesToRuleNames[otherStateId] = [ruleName];
            }
          }
        }
      }
    }

    for (otherStateId in incomingStates) {
      incomingStates[otherStateId].rules = statesToRuleNames[otherStateId];
    }
    return incomingStates;
  };

  $scope.saveStateName = function() {
    $scope.stateName = $scope.normalizeWhitespace($scope.stateName);
    if (!$scope.isValidEntityName($scope.stateName, true))
      return;
    if ($scope.isDuplicateInput(
            $scope.states, 'name', $scope.stateId, $scope.stateName)) {
      warningsData.addWarning(
          'The name \'' + $scope.stateName + '\' is already in use.');
      return;
    }

    $scope.states[$scope.stateId].name = $scope.stateName;
    $scope.drawGraph();

    explorationData.saveStateData(
        $scope.stateId, {'state_name': $scope.stateName});
    activeInputData.clear();
  };

  // TODO(sll): Replace this with a link to code.google.com documentation.
  $scope.defaultTextContent = (
      'Click \'Edit\' to enter text here. Text enclosed in dollar signs ' +
      'will be displayed as $LaTeX$. To write a non-LaTeXed dollar sign, ' +
      'type a single backslash (\'\\\') followed by \'$\'. For more ' +
      'information about LaTeX, see ' +
      'http://web.ift.uib.no/Teori/KURS/WRK/TeX/symALL.html');

  $scope.saveTextContent = function() {
    // This seems to be needed in order to ensure that the latest values from
    // the RTE are captured.
    // TODO(sll): Do we need to update math?
    $scope.$apply();
    $scope.saveStateContent();
    activeInputData.name = '';
  };

  $scope.saveStateContent = function() {
    explorationData.saveStateData($scope.stateId, {'content': $scope.content});
  };

  $scope.editContent = function(index) {
    activeInputData.name = 'content.' + index;
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
      controller: function($scope, $http, $modalInstance, widgetId, widgetParams, warningsData, requestCreator) {
        $scope.widgetId = widgetId;
        $scope.widgetParams = widgetParams;

        $http.post(
            '/widgets/interactive/' + widgetId,
            requestCreator.createRequest({
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

        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }
    });
  };

  $scope.saveStateParamChanges = function() {
    explorationData.saveStateData(
      $scope.stateId,
      {'param_changes': $scope.stateParamChanges}
    );
  };
}

GuiEditor.$inject = ['$scope', '$http', '$filter', '$sce', '$modal',
    'explorationData', 'warningsData', 'activeInputData', 'requestCreator'];
