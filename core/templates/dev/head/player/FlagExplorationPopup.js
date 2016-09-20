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
 * @fileoverview Directive for the flag exploration popup.
 */
oppia.controller('flagExplorationPopup', [
  '$scope', '$element', '$http', 'explorationContextService', '$modal',
  function(
    $scope, $element, $http, explorationContextService, $modal) {
    $scope.flag = null;
    $scope.radioChanged = function() {
      console.log($scope.flag);
    }
    $scope.showFlagExplorationModal = function() {
      $modal.open({
        templateUrl: 'modals/flagExploration',
        backdrop: true,
        controller: [
        '$scope', '$modalInstance', 'explorationContextService',
        '$http',
          function($scope, $modalInstance, explorationContextService,
            $http) {
            var explorationId = (
              explorationContextService.getExplorationId());
            $scope.other = false;

            $scope.triggerOther = function(value) {
              if(value == 'other'){
                $scope.other = true;
                $scope.flagMessage = null;
              } else {
                $scope.other = false;
                $scope.flagMessage = $scope.flag;
              }
            }
                
            $scope.submitFlag = function() {
              if ($scope.flagMessage) {
                $modalInstance.close({
                  report: $scope.flagMessage,
                  exp_id: explorationId
                })
              }
            }

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
            };
                
          }
        ]
      }).result.then(function(result) {
        var flagExplorationUrl = (
            '/flagexplorationhandler/' + result.exp_id);
        $http.post(flagExplorationUrl, {
                  report: result.report
        }).error(function(res){
          alertsService.addWarning(res);
        });
        $modal.open({
          templateUrl: 'modals/explorationFlagSubmitted',
          backdrop: true,
          controller: [
            '$scope', '$modalInstance',
            function($scope, $modalInstance) {
              $scope.close = function() {
                $modalInstance.dismiss('cancel');
              }
            }
          ]
        })
      })
    };
          
  }
]);
