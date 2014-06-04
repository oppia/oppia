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
 * @fileoverview Controllers for the stats viewer in the exploration editor.
 *
 * @author sll@google.com (Sean Lip)
 */

function StatsViewer($scope, $http, $location, $modal, warningsData, activeInputData) {

  $scope.onClickStateInStatsGraph = function(stateName) {
    if (stateName !== END_DEST) {
      $scope.showStateStatsModal(stateName, $scope.highlightStates[stateName]);
    }
  };

  $scope.showStateStatsModal = function(stateName, improvementType) {
    warningsData.clear();

    $http.get(
        '/createhandler/state_rules_stats/' + $scope.explorationId + '/' + encodeURIComponent(stateName)
    ).then(function(response) {
      var rulesStats = response.data.rules_stats;

      var modalInstance = $modal.open({
        templateUrl: 'modals/stateStats',
        backdrop: 'static',
        resolve: {
          stateName: function() {
            return stateName;
          },
          stateStats: function() {
            return $scope.stats.stateStats[stateName];
          },
          improvementType: function() {
            return improvementType;
          },
          rulesStats: function() {
            return rulesStats;
          }
        },
        controller: [
            '$scope', '$modalInstance', 'editabilityService', 'stateName',
            'stateStats', 'improvementType', 'rulesStats', function(
               $scope, $modalInstance, editabilityService, stateName,
               stateStats, improvementType, rulesStats) {
            $scope.editabilityService = editabilityService;
            $scope.stateName = stateName;
            $scope.stateStats = stateStats;
            $scope.improvementType = improvementType;
            $scope.rulesStats = rulesStats;

            $scope.getNumTimesString = function(numberOfTimes) {
              var suffix = (numberOfTimes == 1 ? ' time' : ' times');
              return numberOfTimes + suffix;
            };

            $scope.getHumanReadableRuleName = function(ruleName) {
              return ruleName.substring('submit.'.length);
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
              $modalInstance.close({});
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              warningsData.clear();
            };
          }
        ]
      });

      modalInstance.result.then(function(result) {
        $scope.$parent.showStateEditor(stateName);
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
