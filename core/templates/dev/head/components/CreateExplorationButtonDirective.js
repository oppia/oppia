// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the Create Exploration Button.
 */

oppia.directive('createExplorationButton', [function() {
  return {
    restrict: 'E',
    templateUrl: 'components/createExplorationButton',
    controller: [
      '$scope', '$timeout', '$window', '$modal', 'ExplorationCreationService',
      'siteAnalyticsService', 'CollectionCreationService',
      function(
          $scope, $timeout, $window, $modal, ExplorationCreationService,
          siteAnalyticsService, CollectionCreationService) {
        $scope.explorationCreationInProgress = false;

        $scope.createNewExploration = function() {
          $scope.explorationCreationInProgress = true;
          ExplorationCreationService.createNewExploration();
        };

        $scope.createNewCollection = function() {
          $scope.collectionCreationInProgress = true;
          CollectionCreationService.createNewCollection();
        };

        $scope.showUploadExplorationModal = (
          ExplorationCreationService.showUploadExplorationModal);

        $scope.onRedirectToLogin = function(destinationUrl) {
          siteAnalyticsService.registerStartLoginEvent(
            'createExplorationButton');
          $timeout(function() {
            $window.location = destinationUrl;
          }, 150);
          return false;
        };

        $scope.showCreationChoiceModal = function() {
          var modalInstance = $modal.open({
            templateUrl: 'modals/createExplorationOrCollection',
            backdrop: true,
            controller: [
              '$scope', '$modalInstance', function($scope, $modalInstance) {
                $scope.choseExploration = false;
                $scope.choseCollection = true;
                $scope.chooseExploration = function () {
                  $scope.choseExploration = true;
                  $modalInstance.close({exploration: $scope.choseExploration, collection: $scope.choseCollection});
                };

                $scope.chooseCollection = function() {
                  $scope.choseCollection = true;
                  $modalInstance.close({exploration: $scope.choseExploration, collection: $scope.choseCollection});
                  console.log($scope.choseCollection);
                };

                $scope.cancel = function() {
                  $modalInstance.dismiss('cancel');
                };
              }
            ],
            windowClass: 'oppia-creation-modal'
          });

          modalInstance.result.then(function(creationChoice) {
            if (creationChoice.exploration) {
              $scope.createNewExploration();
            }
            if (creationChoice.collection) {
              $scope.createNewCollection();
            }
          });
        };
      }
    ]
  };
}]);
