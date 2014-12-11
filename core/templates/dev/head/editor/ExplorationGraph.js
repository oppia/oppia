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
 * @fileoverview Controllers for the exploration graph.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.controller('ExplorationGraph', [
    '$scope', '$modal', 'editorContextService', 'warningsData',
    'explorationStatesService', 'editabilityService', 'validatorsService',
    'routerService', 'graphDataService', 'focusService',
    function($scope, $modal, editorContextService, warningsData,
             explorationStatesService, editabilityService, validatorsService,
             routerService, graphDataService, focusService) {

  $scope.getGraphData = graphDataService.getGraphData;
  $scope.isEditable = editabilityService.isEditable;

  $scope.newStateName = '';
  $scope.addState = function(newStateName) {
    if (!explorationStatesService.isNewStateNameValid(newStateName, true)) {
      $scope.newStateName = '';
      return;
    }
    explorationStatesService.addState(newStateName, function() {
      $scope.newStateName = '';
      routerService.navigateToMainTab(newStateName);
      focusService.setFocus('newStateNameSubmittedFromStateEditor');
    });
  };

  $scope.deleteState = function(deleteStateName) {
    explorationStatesService.deleteState(deleteStateName);
  };

  $scope.onClickStateInMinimap = function(stateName) {
    if (stateName !== END_DEST) {
      routerService.navigateToMainTab(stateName);
    }
  };

  $scope.getActiveStateName = function() {
    return editorContextService.getActiveStateName();
  };

  $scope.openStateGraphModal = function() {
    warningsData.clear();

    $modal.open({
      templateUrl: 'modals/stateGraph',
      backdrop: 'static',
      resolve: {
        isEditable: function() {
          return $scope.isEditable;
        }
      },
      windowClass: 'oppia-large-modal-window',
      controller: [
        '$scope', '$modalInstance', 'editorContextService', 'graphDataService',
        'explorationStatesService', 'isEditable',
        function($scope, $modalInstance, editorContextService, graphDataService,
                 explorationStatesService, isEditable) {
          $scope.currentStateName = editorContextService.getActiveStateName();
          $scope.graphData = graphDataService.getGraphData();
          $scope.isEditable = isEditable;

          $scope.isNewStateNameValid = function(newStateName) {
            return explorationStatesService.isNewStateNameValid(newStateName, false);
          }

          $scope.newStateName = '';
          $scope.addStateFromModal = function(newStateName) {
            if (!explorationStatesService.isNewStateNameValid(newStateName, true)) {
              $scope.newStateName = '';
              return;
            }
            explorationStatesService.addState(newStateName, function() {
              $scope.newStateName = '';
              $scope.graphData = graphDataService.getGraphData();
              focusService.setFocus('newStateNameSubmittedFromModal');
            });
          };

          $scope.deleteState = function(stateName) {
            $modalInstance.close({
              action: 'delete',
              stateName: stateName
            });
          };

          $scope.selectState = function(unusedStateId, stateName,
              unusedSecondaryLabel) {
            // In the exploration graph, stateId should equal stateName.
            // unusedSecondaryLabel should be undefined.
            if (stateName !== END_DEST) {
              $modalInstance.close({
                action: 'navigate',
                stateName: stateName
              });
            }
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
            warningsData.clear();
          };
        }
      ]
    }).result.then(function(closeDict) {
      if (closeDict.action === 'delete') {
        explorationStatesService.deleteState(closeDict.stateName);
      } else if (closeDict.action === 'navigate') {
        $scope.onClickStateInMinimap(closeDict.stateName);
      } else {
        console.error('Invalid closeDict action: ' + closeDict.action);
      }
    });
  };
}]);
