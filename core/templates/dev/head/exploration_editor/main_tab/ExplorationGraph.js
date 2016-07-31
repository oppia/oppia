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
 */

oppia.controller('ExplorationGraph', [
  '$scope', '$modal', 'editorContextService', 'alertsService',
  'explorationStatesService', 'editabilityService', 'routerService',
  'graphDataService',
  function(
      $scope, $modal, editorContextService, alertsService,
      explorationStatesService, editabilityService, routerService,
      graphDataService) {
    $scope.getGraphData = graphDataService.getGraphData;
    $scope.isEditable = editabilityService.isEditable;

    // We hide the graph at the outset in order not to confuse new exploration
    // creators.
    $scope.isGraphShown = function() {
      var states = explorationStatesService.getStates();
      return Boolean(states && Object.keys(states).length > 1);
    };

    $scope.deleteState = function(deleteStateName) {
      explorationStatesService.deleteState(deleteStateName);
    };

    $scope.onClickStateInMinimap = function(stateName) {
      routerService.navigateToMainTab(stateName);
    };

    $scope.getActiveStateName = function() {
      return editorContextService.getActiveStateName();
    };

    $scope.openStateGraphModal = function() {
      alertsService.clearWarnings();

      $modal.open({
        templateUrl: 'modals/stateGraph',
        backdrop: true,
        resolve: {
          isEditable: function() {
            return $scope.isEditable;
          }
        },
        windowClass: 'oppia-large-modal-window',
        controller: [
          '$scope', '$modalInstance', 'editorContextService',
          'graphDataService', 'isEditable',
          function($scope, $modalInstance, editorContextService,
                   graphDataService, isEditable) {
            $scope.currentStateName = editorContextService.getActiveStateName();
            $scope.graphData = graphDataService.getGraphData();
            $scope.isEditable = isEditable;

            $scope.deleteState = function(stateName) {
              $modalInstance.close({
                action: 'delete',
                stateName: stateName
              });
            };

            $scope.selectState = function(stateName) {
              $modalInstance.close({
                action: 'navigate',
                stateName: stateName
              });
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              alertsService.clearWarnings();
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
  }
]);
