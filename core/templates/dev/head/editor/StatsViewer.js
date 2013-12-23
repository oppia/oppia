// Copyright 2013 Google Inc. All Rights Reserved.
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
 * @fileoverview Controllers for the stats viewer in the exploration editor.
 *
 * @author sll@google.com (Sean Lip)
 */

function StatsViewer($scope, $http, $location, $modal, warningsData, activeInputData) {

  $scope.showStateStatsModal = function(stateId, improvementType) {
    warningsData.clear();

    $http.get(
        '/createhandler/state_rules_stats/' + $scope.explorationId + '/' + stateId
    ).then(function(response) {
      var rulesStats = response.data.rules_stats;

      var modalInstance = $modal.open({
        templateUrl: 'modals/stateStats',
        backdrop: 'static',
        resolve: {
          stateId: function() {
            return stateId;
          },
          stateName: function() {
            return $scope.getStateName(stateId);
          },
          stateStats: function() {
            return $scope.stats.stateStats[stateId];
          },
          improvementType: function() {
            return improvementType;
          },
          rulesStats: function() {
            return rulesStats;
          }
        },
        controller: ['$scope', '$modalInstance', 'stateId', 'stateName', 'stateStats', 'improvementType', 'rulesStats',
          function($scope, $modalInstance, stateId, stateName, stateStats, improvementType, rulesStats) {
            $scope.stateId = stateId;
            $scope.stateName = stateName;
            $scope.stateStats = stateStats;
            $scope.improvementType = improvementType;
            $scope.rulesStats = rulesStats;

            $scope.getNumTimesString = function(numberOfTimes) {
              var suffix = (numberOfTimes == 1 ? ' time' : ' times');
              return numberOfTimes + suffix;
            };

            $scope.isEmpty = function(obj) {
              for (var property in obj) {
                if (obj.hasOwnProperty(property)) {
                  return false;
                }
              }
              return true;
            };

            $scope.doesAnswerExist = function() {
              for (var rule in $scope.rulesStats) {
                if ($scope.rulesStats[rule].answers.length > 0) {
                  return true;
                }
              }
              return false;
            };

            $scope.gotoStateEditor = function(locationHash) {
              $modalInstance.close({locationHash: locationHash});
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              warningsData.clear();
            };
          }
        ]
      });

      modalInstance.result.then(function(result) {
        $location.hash(result.locationHash);
        $scope.$parent.stateId = stateId;
        $scope.selectGuiTab();
      }, function () {
        console.log('State stats modal dismissed.');
      });
    });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
StatsViewer.$inject = [
  '$scope', '$http', '$location', '$modal', 'warningsData', 'activeInputData'
];
